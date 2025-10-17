const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameState = "start";
let score = 0;
let frame = 0;
let showInstructions = 0;

const normalSpeed = 3;
const fastSpeed = 8;
let scrollSpeed = normalSpeed;

let message = "";
let messageTimer = 0;

const bird = {
  x: 150,
  y: canvas.height / 2,
  radius: 20,
  velocity: 0,
  gravity: 0.25,
  lift: -7,
  wingAngle: 0
};

// White clouds for the sky theme
let clouds = [];
for (let i = 0; i < 10; i++) {
  clouds.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height / 2,
    size: 50 + Math.random() * 50,
    speed: 0.2 + Math.random() * 0.3
  });
}

// Obstacles & traps
let obstacles = [];
let traps = [];

// --- Background (NEW: Sky Theme) ---
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#87CEEB"); // Light Sky Blue
  gradient.addColorStop(1, "#B0E0E6"); // Powder Blue
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw white clouds
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.shadowBlur = 0;
  clouds.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.size, c.size / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    c.x -= c.speed;
    if (c.x + c.size < 0) c.x = canvas.width + c.size;
  });
}

// --- Bird ---
function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);

  const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 25);
  grad.addColorStop(0, "#ffdd33");
  grad.addColorStop(1, "#ff8800");
  ctx.fillStyle = grad;
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#ffd700";
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff200";
  ctx.beginPath();
  const flap = Math.sin(bird.wingAngle) * 10;
  ctx.moveTo(-10, 0);
  ctx.quadraticCurveTo(-25, flap, -10, -flap);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(7, -5, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff6600";
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(30, -5);
  ctx.lineTo(30, 5);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// --- Obstacles (NEW: Blue & White Theme) ---
function drawObstacles() {
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Semi-transparent white
  ctx.shadowColor = "#0077ff"; // Blue glow
  obstacles.forEach(obs => {
    ctx.shadowBlur = 20;
    ctx.fillRect(obs.x, 0, obs.w, obs.top);
    ctx.fillRect(obs.x, canvas.height - obs.bottom, obs.w, obs.bottom);
  });
  ctx.shadowBlur = 0;
}

// --- Traps (NEW: Blue & White Theme) ---
function drawTraps() {
  traps.forEach(t => {
    if (t.type === "fireball") { // Fireball color remains for clarity
      const grad = ctx.createRadialGradient(t.x, t.y, 5, t.x, t.y, 15);
      grad.addColorStop(0, "#ffbb33");
      grad.addColorStop(1, "#ff5500");
      ctx.fillStyle = grad;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ff8800";
      ctx.beginPath();
      ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (t.type === "spike") {
      ctx.strokeStyle = "#ffffff"; // White spikes
      ctx.lineWidth = 4;
      ctx.shadowColor = "#0077ff"; // Blue glow
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(t.x - 10, t.y + 10);
      ctx.lineTo(t.x, t.y - 10);
      ctx.lineTo(t.x + 10, t.y + 10);
      ctx.closePath();
      ctx.stroke();
    }
  });
  ctx.shadowBlur = 0;
}

// --- UI (NEW: Blue & White Theme) ---
function drawUI() {
  ctx.textAlign = "center";
  
  // Score - Dark blue text for readability
  ctx.fillStyle = "#003366";
  ctx.shadowColor = '#ffffff'; // White glow for contrast
  ctx.shadowBlur = 10;
  ctx.font = 'bold 70px "Orbitron"';
  ctx.fillText(score, canvas.width / 2, 100);

  // Game state messages
  if (gameState === "start") {
    ctx.font = 'bold 50px "Orbitron"';
    ctx.fillText("Press SPACE to Start", canvas.width / 2, canvas.height / 2);
  } else if (gameState === "over") {
    ctx.font = 'bold 80px "Orbitron"';
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = 'bold 50px "Orbitron"';
    ctx.fillText(`SCORE: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  }

  // Boost/Brake messages
  if (message) {
    ctx.font = 'bold 40px "Orbitron"';
    ctx.fillStyle = message === "BOOST SPEED!" ? "#0077ff" : "#003366"; // Shades of blue
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 15;
    ctx.fillText(message, canvas.width / 2, 160);
  }

  // Controls instructions
  if (gameState === "playing" && showInstructions > 0) {
    ctx.font = '22px "Orbitron"';
    ctx.fillStyle = "#003366"; // Dark blue text
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 5;
    const texts = [
      "↑ UP / SPACE = Jump",
      "↓ DOWN = Fall Faster",
      "← LEFT = Brake",
      "→ RIGHT = Boost",
    ];
    texts.forEach((t, i) => ctx.fillText(t, canvas.width / 2, canvas.height - 150 + i * 30));
    showInstructions--;
  }
  ctx.shadowBlur = 0;
}


// --- Update Functions (No logical changes) ---
function updateBird() {
  bird.velocity += bird.gravity;
  bird.y += bird.velocity;
  bird.wingAngle += 0.2;
  if (bird.y - bird.radius < 0) bird.y = bird.radius;
  if (bird.y + bird.radius > canvas.height) gameState = "over";
}

function updateObstacles() {
  for (const obs of obstacles) {
    obs.x -= scrollSpeed;
    obs.offset += obs.speed;
    obs.top = obs.baseTop + Math.sin(obs.offset) * 40;
    obs.bottom = obs.baseBottom + Math.cos(obs.offset) * 40;

    if (bird.x + bird.radius > obs.x && bird.x - bird.radius < obs.x + obs.w) {
      if (bird.y - bird.radius < obs.top || bird.y + bird.radius > canvas.height - obs.bottom)
        gameState = "over";
    }

    if (!obs.passed && bird.x > obs.x + obs.w) {
      obs.passed = true;
      score += 1;
    }
  }
  obstacles = obstacles.filter(o => o.x + o.w > 0);

  if (frame % 100 === 0) {
    const gap = 250;
    const top = Math.random() * (canvas.height - gap - 100) + 50;
    const bottom = canvas.height - top - gap;
    obstacles.push({
      x: canvas.width,
      w: 100,
      top,
      bottom,
      baseTop: top,
      baseBottom: bottom,
      offset: Math.random() * 6,
      speed: 0.03 + Math.random() * 0.03,
      passed: false
    });
  }
}

function updateTraps() {
  traps.forEach(t => {
    t.x -= scrollSpeed;
    if (t.type === "fireball") t.y += Math.sin(frame * 0.1 + t.offset) * 2;
    const dist = Math.hypot(bird.x - t.x, bird.y - t.y);
    if (dist < bird.radius + 12) gameState = "over";
  });
  traps = traps.filter(t => t.x > -20);

  if (frame % 130 === 0) {
    const type = Math.random() > 0.5 ? "fireball" : "spike";
    traps.push({
      type,
      x: canvas.width + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      offset: Math.random() * Math.PI * 2
    });
  }
}

function updateMessage() {
  if (messageTimer > 0) messageTimer--;
  else message = "";
}

// --- Main Game Loop ---
function gameLoop() {
  frame++;
  drawBackground();

  if (gameState === "playing") {
    updateBird();
    updateObstacles();
    updateTraps();
    updateMessage();
  }

  drawObstacles();
  drawTraps();
  drawBird();
  drawUI();
  requestAnimationFrame(gameLoop);
}

// --- Controls ---
function handleKeyDown(e) {
  if (gameState === "start" && [" ", "ArrowUp", "Enter"].includes(e.key)) {
    resetGame();
  } else if (gameState === "playing") {
    if ([" ", "ArrowUp", "Enter"].includes(e.key)) bird.velocity = bird.lift;
    if (e.key === "ArrowDown") bird.velocity += 3;
    if (e.key === "ArrowRight") {
      scrollSpeed = fastSpeed;
      message = "BOOST SPEED!";
      messageTimer = 60;
    }
    if (e.key === "ArrowLeft") {
      scrollSpeed = 1;
      message = "BRAKE!";
      messageTimer = 60;
    }
  } else if (gameState === "over") {
    // Any key press on game over screen will reset it
    gameState = "start"; // Go back to start screen
  }
}

function handleKeyUp(e) {
  if (["ArrowRight", "ArrowLeft"].includes(e.key) && gameState === "playing") {
    scrollSpeed = normalSpeed;
  }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

function resetGame() {
  score = 0;
  frame = 0;
  obstacles = [];
  traps = [];
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  scrollSpeed = normalSpeed;
  showInstructions = 200; // Show instructions for a few seconds
  gameState = "playing";
}

gameLoop();