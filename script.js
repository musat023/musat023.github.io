document.addEventListener("DOMContentLoaded", function () {
    
    const menuToggle = document.querySelector(".menu-toggle");
    const navMenu = document.querySelector(".nav-menu");
  
    menuToggle.addEventListener("click", function () {
      navMenu.classList.toggle("active");
    });
  
   
    document.getElementById("loginForm").addEventListener("submit", function (event) {
      event.preventDefault();

      document.addEventListener("DOMContentLoaded", function () {
        const audio = document.getElementById('backgroundMusic');
        audio.play();
    });
      var username = document.getElementById("username").value;
      var password = document.getElementById("password").value;
      var message = document.getElementById("message");
  
    
      if (password.length >= 8) {
        message.textContent = "Login completed!";
        message.style.color = "green";
      } else {
        message.textContent = "Password must be at least 8 characters!";
        message.style.color = "red";
      }
    });
  
   
    document.getElementById("openLogin").addEventListener("click", function() {
      document.getElementById("loginContainer").style.display = "block";
      //startAnimation();

      backgroundMusic.play();
    });
  });


  const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Binaları ve ışıkları sabit oluştur
const buildings = [];
const numBuildings = 30;

for (let i = 0; i < numBuildings; i++) {
  const width = Math.random() * 50 + 50;
  const height = Math.random() * (canvas.height / 2);
  const x = i * (canvas.width / numBuildings);
  const y = canvas.height - height;
  const color = `rgb(${30 + Math.random() * 30}, ${30 + Math.random() * 30}, ${30 + Math.random() * 30})`;

  // Sabit ışıklar
  const lights = [];
  for (let i = 0; i < height / 20; i++) {
    for (let j = 0; j < width / 15; j++) {
      if (Math.random() > 0.8) {
        lights.push({
          x: j * 15 + 3,
          y: i * 20 + 3
        });
      }
    }
  }

  buildings.push({ x, y, width, height, color, lights });
}

// Şimşek efekti
let lightning = [];

function createLightning() {
  const startX = Math.random() * canvas.width;
  const startY = 0;
  const segments = [];

  let x = startX;
  let y = startY;

  for (let i = 0; i < 10; i++) {
    x += (Math.random() - 0.5) * 40;
    y += Math.random() * 40;
    segments.push({ x, y });
  }

  lightning.push({ segments, opacity: 1 });

  setTimeout(() => lightning.shift(), 150);
}
setInterval(createLightning, 1000);

// Nesneler (hilal ve yıldızlar)
const objects = [
  {
    type: "crescent", // hilal
    x: 200,
    y: 200,
    r1: 30,
    r2: 20,
    dx: 1.5,
    dy: 1.2,
    color: "white"
  },
  {
    type: "star",
    x: 400,
    y: 300,
    dx: -1.2,
    dy: 1,
    outer: 15,
    inner: 7,
    color: "white"
  },
  {
    type: "star",
    x: 600,
    y: 150,
    dx: 1,
    dy: -1.4,
    outer: 15,
    inner: 7,
    color: "white"
  }
];

// Ana çizim fonksiyonu
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Gökyüzü
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0f2027");
  gradient.addColorStop(1, "#2c5364");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Yıldızlar
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    const x = Math.random() * canvas.width;
    const y = Math.random() * (canvas.height / 2);
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // Binalar ve ışıkları
  for (const building of buildings) {
    ctx.fillStyle = building.color;
    ctx.fillRect(building.x, building.y, building.width, building.height);

    ctx.fillStyle = "yellow";
    for (const light of building.lights) {
      ctx.fillRect(building.x + light.x, building.y + light.y, 5, 5);
    }
  }

  // Şimşek
  lightning.forEach(l => {
    ctx.beginPath();
    ctx.moveTo(l.segments[0].x, l.segments[0].y);
    for (let i = 1; i < l.segments.length; i++) {
      ctx.lineTo(l.segments[i].x, l.segments[i].y);
    }
    ctx.strokeStyle = `rgba(255,255,255,${l.opacity})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 30;
    ctx.shadowColor = "white";
    ctx.stroke();
    ctx.shadowBlur = 0;
  });

  // Hilal ve yıldızlar (dönen objeler)
  const login = document.getElementById("loginContainer");
  const rect = login.getBoundingClientRect();

  for (let obj of objects) {
    // Nesne login kutusunun içinde mi kontrol et (gizle)
    const isOverLogin =
      obj.x > rect.left &&
      obj.x < rect.right &&
      obj.y > rect.top &&
      obj.y < rect.bottom;

    if (!isOverLogin) {
      if (obj.type === "crescent") {
        drawCrescent(obj.x, obj.y, obj.r1, obj.r2);
      } else if (obj.type === "star") {
        drawStar(obj.x, obj.y, 5, obj.outer, obj.inner);
      }
    }

    // Hareket
    obj.x += obj.dx;
    obj.y += obj.dy;

    // Çarpma ve yön değiştirme
    if (obj.x > canvas.width || obj.x < 0) {
      obj.dx *= -1;
    }
    if (obj.y > canvas.height || obj.y < 0) {
      obj.dy *= -1;
    }
  }

  requestAnimationFrame(draw);
}

draw();

// Ekran boyutu değişince tekrar ayarla
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Hilal çizen fonksiyon
function drawCrescent(x, y, r1, r2) {
  ctx.beginPath();
  ctx.arc(x, y, r1, 0, Math.PI * 2, false);
  ctx.fillStyle = "white";
  ctx.fill();

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(x + r1 * 0.4, y, r2, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

// Yıldız çizen fonksiyon
function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = "white";
  ctx.fill();
}