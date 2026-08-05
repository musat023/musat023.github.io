/* ---------- Data: products & their defrost duration in hours ---------- */
const PRODUCTS = [
  { name: "VOLSKÉ OKO",         hours: 24 },
  { name: "KUŘECÍ MASO",        hours: 48 },
  { name: "LOSOS",              hours: 48 },
  { name: "SMAŽENÁ CIBULE",     hours: 48 },
  { name: "CIBULOVÁ MARMELÁDA", hours: 48 },
  { name: "ENGLISH MUFFIN",     hours: 48 },
  { name: "CHLÉB",              hours: 48 },
  { name: "TORTILLA",           hours: 48 },
  { name: "ČOKOLÁDOVÝ MUFIN",   hours: 48 },
  { name: "BORŮVKOVÝ MUFFIN",   hours: 48 },
  { name: "ČOKOLÁDOVÝ MOUSSE",  hours: 72 },
  { name: "MAN. CHEESECAKE",    hours: 72 },
  { name: "CHEDDAR FINGERS",    hours: 48 },
  { name: "BEZLEPEK",           hours: 48 },
  { name: "DENNÍ POLÉVKA",      hours: 48 },
  { name: "GYROS",              hours: 48 },
  { name: "KUŘE LEMONATO",      hours: 48 },
  { name: "JAHODOVÝ SORBET",    hours: 48 },
  { name: "BASKICKÝ DEZERT",    hours: 72 },
];

const STORAGE_KEY = "rozmrazovaci_pruvodka_entries_v1";
const SOON_THRESHOLD_HOURS = 6; // "brzy expiruje" when less than this remains

let entries = loadEntries();
let currentTab = "active";

/* ---------- Storage ---------- */
function loadEntries(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function saveEntries(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/* ---------- Helpers ---------- */
function fmtDate(d){
  return d.toLocaleDateString("cs-CZ", { day:"2-digit", month:"2-digit", year:"numeric" });
}
function fmtTime(d){
  return d.toLocaleTimeString("cs-CZ", { hour:"2-digit", minute:"2-digit" });
}
function statusOf(entry){
  if(entry.done) return { key:"done" };
  const remainingMs = new Date(entry.dueAt) - new Date();
  const remainingH = remainingMs / 3600000;
  if(remainingMs <= 0) return { key:"expired", remainingMs };
  if(remainingH <= SOON_THRESHOLD_HOURS) return { key:"soon", remainingMs };
  return { key:"ok", remainingMs };
}
function fmtRemaining(ms){
  if(ms <= 0){
    const over = Math.abs(ms);
    const h = Math.floor(over/3600000);
    const m = Math.floor((over%3600000)/60000);
    return `Expirováno před ${h} h ${m} min`;
  }
  const h = Math.floor(ms/3600000);
  const m = Math.floor((ms%3600000)/60000);
  return `${h} h ${m} min`;
}

/* ---------- Render product grid ---------- */
function renderGrid(filter=""){
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "";
  const f = filter.trim().toLowerCase();
  PRODUCTS
    .filter(p => p.name.toLowerCase().includes(f))
    .forEach(p => {
      const div = document.createElement("div");
      div.className = "item";
      const durLabel = p.hours % 24 === 0 ? `${p.hours/24} ${p.hours===24?'den':'dny'}` : `${p.hours} h`;
      div.innerHTML = `
        <div>
          <div class="name">${p.name}</div>
          <div class="dur">⏱ ${durLabel}</div>
        </div>
        <button class="plus" data-name="${p.name}" data-hours="${p.hours}">+</button>
      `;
      grid.appendChild(div);
    });
}

/* ---------- Add entry ---------- */
function addEntry(name, hours, qty, removedAt){
  removedAt = removedAt || new Date();
  const dueAt = new Date(removedAt.getTime() + hours*3600000);
  entries.unshift({
    id: Date.now() + Math.random().toString(16).slice(2),
    name,
    hours,
    removedAt: removedAt.toISOString(),
    dueAt: dueAt.toISOString(),
    qty,
    done: false
  });
  saveEntries();
  currentDayKey = dayKey(removedAt);
  renderLog();
  renderStats();
  renderSummary();
}

/* ---------- Modal ---------- */
const overlay = document.getElementById("overlay");
const modalName = document.getElementById("modal-name");
const modalDurLabel = document.getElementById("modal-dur-label");
const modalDurStatic = document.getElementById("modal-dur-static");
const modalDurEdit = document.getElementById("modal-dur-edit");
const modalNameEdit = document.getElementById("modal-name-edit");
const customNameInput = document.getElementById("custom-name-input");
const customHoursInput = document.getElementById("custom-hours-input");
const qtyInput = document.getElementById("qty-input");
const modalDateInput = document.getElementById("modal-date-input");
const modalTimeInput = document.getElementById("modal-time-input");
const previewRemoved = document.getElementById("preview-removed");
const previewDue = document.getElementById("preview-due");

let modalState = { name: "", hours: 0, qty: 1, custom: false };

function fmtShort(d){
  const dd = d.toLocaleDateString("cs-CZ", { day:"numeric", month:"numeric" });
  const tt = d.toLocaleTimeString("cs-CZ", { hour:"2-digit", minute:"2-digit" });
  return `${dd}. ${tt}`;
}
function pad2(n){ return String(n).padStart(2,"0"); }
function toDateInputValue(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function toTimeInputValue(d){ return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }

function setModalDateTime(d){
  modalDateInput.value = toDateInputValue(d);
  modalTimeInput.value = toTimeInputValue(d);
}

function getModalRemovedAt(){
  const [y,m,day] = modalDateInput.value.split("-").map(Number);
  const [hh,mm] = modalTimeInput.value.split(":").map(Number);
  if(!y || !m || !day || isNaN(hh) || isNaN(mm)) return new Date();
  return new Date(y, m-1, day, hh, mm, 0, 0);
}

function currentHours(){
  if(modalState.custom){
    const h = Number(customHoursInput.value);
    return h > 0 ? h : 1;
  }
  return modalState.hours;
}

function updatePreview(){
  const hours = currentHours();
  const removedAt = getModalRemovedAt();
  const dueAt = new Date(removedAt.getTime() + hours*3600000);
  previewRemoved.textContent = fmtShort(removedAt);
  previewDue.textContent = fmtShort(dueAt);
  qtyInput.value = modalState.qty;
}

function openModal(name, hours){
  modalState = { name, hours, qty: 1, custom: false };
  modalName.textContent = name;
  modalNameEdit.style.display = "none";
  modalDurStatic.style.display = "flex";
  modalDurEdit.style.display = "none";
  const durLabel = hours % 24 === 0 ? `${hours/24} ${hours===24?'den':'dny'}` : `${hours} h`;
  modalDurLabel.textContent = durLabel;
  setModalDateTime(new Date());
  updatePreview();
  overlay.classList.add("open");
}

function openCustomModal(){
  modalState = { name: "", hours: 48, qty: 1, custom: true };
  modalName.textContent = "Nová surovina";
  modalNameEdit.style.display = "block";
  customNameInput.value = "";
  modalDurStatic.style.display = "none";
  modalDurEdit.style.display = "block";
  customHoursInput.value = 48;
  setModalDateTime(new Date());
  updatePreview();
  overlay.classList.add("open");
  setTimeout(() => customNameInput.focus(), 50);
}

function closeModal(){
  overlay.classList.remove("open");
}

document.getElementById("qty-minus").addEventListener("click", () => {
  if(modalState.qty > 1) modalState.qty--;
  updatePreview();
});
document.getElementById("qty-plus").addEventListener("click", () => {
  modalState.qty++;
  updatePreview();
});
customHoursInput.addEventListener("input", updatePreview);
modalDateInput.addEventListener("input", updatePreview);
modalTimeInput.addEventListener("input", updatePreview);
document.getElementById("modal-close").addEventListener("click", closeModal);
document.getElementById("modal-cancel").addEventListener("click", closeModal);
document.getElementById("add-custom-btn").addEventListener("click", openCustomModal);
overlay.addEventListener("click", (ev) => { if(ev.target === overlay) closeModal(); });
document.getElementById("modal-confirm").addEventListener("click", () => {
  let name = modalState.name;
  let hours = modalState.hours;
  if(modalState.custom){
    name = customNameInput.value.trim();
    hours = currentHours();
    if(!name){ customNameInput.focus(); return; }
  }
  addEntry(name, hours, modalState.qty, getModalRemovedAt());
  closeModal();
});

/* ---------- Log table (one day "page" at a time) ---------- */
function dayKey(d){
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function fmtDayLabel(d){
  const weekday = d.toLocaleDateString("cs-CZ", { weekday: "long" });
  const label = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${label} ${fmtDate(d)}`;
}
function dayTabLabel(d){
  const dd = d.toLocaleDateString("cs-CZ", { day:"2-digit", month:"2-digit" });
  return `📅 ${dd}`;
}

let currentDayKey = dayKey(new Date());

function renderLog(){
  const tabsEl = document.getElementById("day-tabs");
  const toolbarEl = document.getElementById("day-toolbar");
  const container = document.getElementById("log-container");
  const empty = document.getElementById("log-empty");

  let list = entries.slice();
  if(currentTab === "active") list = list.filter(e => !e.done);
  if(currentTab === "done") list = list.filter(e => e.done);

  // group everything (within current status filter) by day
  const groups = {};
  list.forEach(e => {
    const d = new Date(e.removedAt);
    const key = dayKey(d);
    if(!groups[key]) groups[key] = { date: d, items: [] };
    groups[key].items.push(e);
  });

  // always offer "Dnes" and "Včera" tabs even if empty, so the two-page view is stable
  const todayKey = dayKey(new Date());
  if(!groups[todayKey]) groups[todayKey] = { date: new Date(), items: [] };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKey(yesterday);
  if(!groups[yesterdayKey]) groups[yesterdayKey] = { date: yesterday, items: [] };

  const keys = Object.keys(groups).sort((a,b) => groups[b].date - groups[a].date);
  if(!keys.includes(currentDayKey)) currentDayKey = keys[0];

  // ---- render day tabs ----
  tabsEl.innerHTML = keys.map(key => {
    const g = groups[key];
    const hasExpired = g.items.some(e => !e.done && statusOf(e).key === "expired");
    const totalKs = g.items.reduce((s,e) => s + (Number(e.qty)||1), 0);
    const cls = "day-tab" + (key === currentDayKey ? " active" : "") + (hasExpired ? " has-expired" : "");
    return `<button class="${cls}" data-day="${key}">${dayTabLabel(g.date)}<span class="count">${totalKs}</span></button>`;
  }).join("");

  // ---- render toolbar (title + clear button) for the selected day ----
  const activeGroup = groups[currentDayKey];
  const totalKs = activeGroup.items.reduce((s,e) => s + (Number(e.qty)||1), 0);
  toolbarEl.innerHTML = `
    <div class="day-title">${fmtDayLabel(activeGroup.date)}<span class="sub">${activeGroup.items.length} položek · ${totalKs} ks</span></div>
    ${activeGroup.items.length > 0 ? `<button class="day-clear-btn" data-day="${currentDayKey}">🗑 Smazat tento den</button>` : ""}
  `;

  // ---- render the table for the selected day only ----
  container.innerHTML = "";
  if(activeGroup.items.length === 0){
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  const table = document.createElement("div");
  table.className = "day-table-wrap";
  table.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Surovina</th>
          <th>Datum vyjmuto</th>
          <th>Čas</th>
          <th>Datum spotřebovat do</th>
          <th>Čas</th>
          <th>Ks</th>
          <th>Stav</th>
          <th></th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
  const tbody = table.querySelector("tbody");

  activeGroup.items.forEach(e => {
    const removedAt = new Date(e.removedAt);
    const dueAt = new Date(e.dueAt);
    const st = statusOf(e);
    const tr = document.createElement("tr");

    let badge;
    if(e.done){
      badge = `<span class="badge g"><span class="dot g"></span>Spotřebováno</span>`;
    }else if(st.key === "expired"){
      badge = `<span class="badge r"><span class="dot r"></span>⚠ ${fmtRemaining(st.remainingMs)}</span>`;
      tr.classList.add("row-expired");
    }else if(st.key === "soon"){
      badge = `<span class="badge o"><span class="dot o"></span>${fmtRemaining(st.remainingMs)}</span>`;
    }else{
      badge = `<span class="badge g"><span class="dot g"></span>${fmtRemaining(st.remainingMs)}</span>`;
    }

    tr.innerHTML = `
      <td><strong>${e.name}</strong></td>
      <td>${fmtDate(removedAt)}</td>
      <td>${fmtTime(removedAt)}</td>
      <td>${fmtDate(dueAt)}</td>
      <td>${fmtTime(dueAt)}</td>
      <td>
        <div class="ks-edit">
          <button class="ks-btn" data-action="qty-minus" data-id="${e.id}" title="Ubrat kus">−</button>
          <span class="ks">${e.qty}</span>
          <button class="ks-btn" data-action="qty-plus" data-id="${e.id}" title="Přidat kus">+</button>
        </div>
      </td>
      <td>${badge}</td>
      <td>
        <div class="row-actions">
          ${!e.done ? `<button class="done" title="Oznacit jako spotrebovano" data-action="done" data-id="${e.id}">✓</button>` : ""}
          <button class="del" title="Smazat" data-action="delete" data-id="${e.id}">🗑</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  container.appendChild(table);
}

function clearDay(key){
  const toRemove = entries.filter(e => dayKey(new Date(e.removedAt)) === key);
  if(toRemove.length === 0) return;
  const dateLabel = fmtDayLabel(new Date(toRemove[0].removedAt));
  const ok = confirm(`Opravdu smazat celý den (${dateLabel})? Odstraní se ${toRemove.length} položek.`);
  if(!ok) return;
  entries = entries.filter(e => dayKey(new Date(e.removedAt)) !== key);
  saveEntries();
  renderLog();
  renderStats();
  renderSummary();
}

/* ---------- Summary by product (groups active entries, keeps individual rows in table) ---------- */
function renderSummary(){
  const panel = document.getElementById("summary-panel");
  const grid = document.getElementById("summary-grid");
  const active = entries.filter(e => !e.done);

  const groups = {};
  active.forEach(e => {
    if(!groups[e.name]) groups[e.name] = { total: 0, hasExpired: false, hasSoon: false };
    groups[e.name].total += Number(e.qty) || 1;
    const st = statusOf(e);
    if(st.key === "expired") groups[e.name].hasExpired = true;
    if(st.key === "soon") groups[e.name].hasSoon = true;
  });

  const names = Object.keys(groups);
  if(names.length === 0){
    panel.style.display = "none";
    grid.innerHTML = "";
    return;
  }
  panel.style.display = "block";
  names.sort((a,b) => a.localeCompare(b, "cs"));

  grid.innerHTML = names.map(name => {
    const g = groups[name];
    let cls = "summary-card";
    if(g.hasExpired) cls += " has-expired";
    else if(g.hasSoon) cls += " has-soon";
    return `
      <div class="${cls}">
        <div class="sname">${name}</div>
        <div class="stotal">${g.total}<span>ks celkem</span></div>
      </div>
    `;
  }).join("");
}

/* ---------- Stats ---------- */
function renderStats(){
  const active = entries.filter(e => !e.done);
  let total=0, ok=0, soon=0, expired=0;
  active.forEach(e => {
    const st = statusOf(e);
    const qty = Number(e.qty) || 1;
    total += qty;
    if(st.key === "ok") ok += qty;
    else if(st.key === "soon") soon += qty;
    else if(st.key === "expired") expired += qty;
  });
  document.getElementById("stat-active").textContent = total;
  document.getElementById("stat-ok").textContent = ok;
  document.getElementById("stat-soon").textContent = soon;
  document.getElementById("stat-expired").textContent = expired;

  const expiredCard = document.querySelector(".stat.expired");
  expiredCard.classList.toggle("has-alert", expired > 0);
}

/* ---------- Events ---------- */
document.getElementById("product-grid").addEventListener("click", (ev) => {
  const btn = ev.target.closest(".plus");
  if(!btn) return;
  openModal(btn.dataset.name, Number(btn.dataset.hours));
});

document.getElementById("search").addEventListener("input", (ev) => {
  renderGrid(ev.target.value);
});

document.querySelectorAll(".tabs button").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    currentTab = b.dataset.tab;
    renderLog();
  });
});

document.getElementById("day-tabs").addEventListener("click", (ev) => {
  const btn = ev.target.closest(".day-tab");
  if(!btn) return;
  currentDayKey = btn.dataset.day;
  renderLog();
});

document.getElementById("day-toolbar").addEventListener("click", (ev) => {
  const btn = ev.target.closest(".day-clear-btn");
  if(!btn) return;
  clearDay(btn.dataset.day);
});

document.getElementById("log-container").addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-action]");
  if(!btn) return;
  const id = btn.dataset.id;
  const entry = entries.find(e => e.id === id);
  if(!entry) return;
  if(btn.dataset.action === "done"){
    entry.done = true;
  }else if(btn.dataset.action === "delete"){
    entries = entries.filter(e => e.id !== id);
  }else if(btn.dataset.action === "qty-plus"){
    entry.qty = (Number(entry.qty)||1) + 1;
  }else if(btn.dataset.action === "qty-minus"){
    entry.qty = Math.max(1, (Number(entry.qty)||1) - 1);
  }
  saveEntries();
  renderLog();
  renderStats();
  renderSummary();
});

/* ---------- Init ---------- */
renderGrid();
renderLog();
renderStats();
renderSummary();
setInterval(() => { renderLog(); renderStats(); renderSummary(); }, 60000); // refresh every minute
