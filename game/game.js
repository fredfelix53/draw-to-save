/* ===== Draw to Save — Game Engine =====
   Draw lines/shapes to protect a stickman from enemies
   Physics-based with ragdoll simulation
*/
const W = 600, H = 700;
let canvas, ctx;
let particles = null;
let floatingTexts = [];

// ─── Game State ──────────────────────────────────────
let currentLevel = 1;
let stickman = null;
let enemies = [];
let drawnLines = [];
let projectiles = [];
let gameState = 'menu'; // menu | playing | win | lose
let isDrawing = false;
let ink = 100;
let maxInk = 100;
let stickmanHP = 3;
let maxHP = 3;
let touchX = 0, touchY = 0;
let levelEnemiesSpawned = 0;
let gameTimer = 0;
let spawnTimer = 0;
let perfectRun = true;
let noDrawRun = true;

// ─── Stickman ────────────────────────────────────────
function createStickman() {
  return {
    x: 80, y: 300,
    headRadius: 12,
    bodyLength: 40,
    armLength: 20,
    legLength: 25,
    alive: true,
    ragdoll: false,
    ragdollParts: {
      head: { x: 80, y: 288, vx: 0, vy: 0 },
      body: { x: 80, y: 312, vx: 0, vy: 0 },
      lArm: { x: 60, y: 300, vx: 0, vy: 0 },
      rArm: { x: 100, y: 300, vx: 0, vy: 0 },
      lLeg: { x: 70, y: 345, vx: 0, vy: 0 },
      rLeg: { x: 90, y: 345, vx: 0, vy: 0 },
    },
    targetX: 80,
  };
}

function drawStickman(ctx, sm, color = '#ffffff') {
  if (!sm || !sm.alive) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  if (sm.ragdoll) {
    const p = sm.ragdollParts;
    // Head
    ctx.beginPath(); ctx.arc(p.head.x, p.head.y, sm.headRadius, 0, Math.PI*2); ctx.stroke();
    // Body
    ctx.beginPath(); ctx.moveTo(p.head.x, p.head.y + sm.headRadius); ctx.lineTo(p.body.x, p.body.y); ctx.stroke();
    // Arms
    ctx.beginPath(); ctx.moveTo(p.body.x, p.body.y - 5); ctx.lineTo(p.lArm.x, p.lArm.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.body.x, p.body.y - 5); ctx.lineTo(p.rArm.x, p.rArm.y); ctx.stroke();
    // Legs
    ctx.beginPath(); ctx.moveTo(p.body.x, p.body.y); ctx.lineTo(p.lLeg.x, p.lLeg.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.body.x, p.body.y); ctx.lineTo(p.rLeg.x, p.rLeg.y); ctx.stroke();
    // Eyes (X marks the spot when ragdoll)
    ctx.fillStyle = '#ff0000'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('✕', p.head.x, p.head.y + 5);
  } else {
    // Normal stickman
    const x = sm.x, y = sm.y;
    // Head
    ctx.beginPath(); ctx.arc(x, y - sm.bodyLength/2 - sm.headRadius, sm.headRadius, 0, Math.PI*2); ctx.stroke();
    // Eyes
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x - 4, y - sm.bodyLength/2 - sm.headRadius - 2, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 4, y - sm.bodyLength/2 - sm.headRadius - 2, 2, 0, Math.PI*2); ctx.fill();
    // Body
    ctx.beginPath(); ctx.moveTo(x, y - sm.bodyLength/2); ctx.lineTo(x, y + sm.bodyLength/2); ctx.stroke();
    // Arms
    ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x - sm.armLength, y + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + sm.armLength, y + 5); ctx.stroke();
    // Legs
    ctx.beginPath(); ctx.moveTo(x, y + sm.bodyLength/2); ctx.lineTo(x - sm.legLength, y + sm.bodyLength/2 + sm.legLength); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + sm.bodyLength/2); ctx.lineTo(x + sm.legLength, y + sm.bodyLength/2 + sm.legLength); ctx.stroke();
  }
  ctx.restore();
}

// ─── Enemies ─────────────────────────────────────────
function spawnEnemy() {
  const types = ['spike', 'ball', 'bomb', 'bee'];
  // Later levels have harder enemies
  let typeIdx;
  if (currentLevel <= 5) typeIdx = Math.floor(Math.random() * 2); // spikes, balls
  else if (currentLevel <= 10) typeIdx = Math.floor(Math.random() * 3); // + bombs
  else typeIdx = Math.floor(Math.random() * 4); // + bees

  const type = types[typeIdx];
  const enemy = {
    type,
    x: W + 20,
    y: 100 + Math.random() * 400,
    vx: -(1 + Math.random() * 2 + currentLevel * 0.1),
    vy: (Math.random() - 0.5) * 1.5,
    radius: type === 'spike' ? 15 : type === 'ball' ? 18 : type === 'bomb' ? 22 : 12,
    alive: true,
    health: type === 'bomb' ? 2 : 1,
    wobblePhase: Math.random() * Math.PI * 2,
  };
  enemies.push(enemy);
}

// ─── Drawing ─────────────────────────────────────────
function startDrawing(x, y) {
  if (gameState !== 'playing' || ink <= 0) return;
  isDrawing = true;
  const bonuses = window.ProgressionSystem ? ProgressionSystem.getActiveBonuses() : {};
  const line = {
    points: [{x, y}],
    width: bonuses.lineWidth || 4,
    strength: bonuses.lineStrength || 1,
    color: getDrawingColor(),
  };
  drawnLines.push(line);
}

function continueDrawing(x, y) {
  if (!isDrawing || gameState !== 'playing' || ink <= 0) return;
  const line = drawnLines[drawnLines.length - 1];
  if (!line) return;
  const last = line.points[line.points.length - 1];
  const dist = Math.sqrt((x - last.x) ** 2 + (y - last.y) ** 2);
  if (dist < 5) return;
  line.points.push({x, y});
  const inkCost = 0.3;
  ink = Math.max(0, ink - inkCost);
  if (noDrawRun) noDrawRun = false;
  updateInk();
}

function stopDrawing() { isDrawing = false; }

function getDrawingColor() {
  const state = window.ProgressionSystem?.getState();
  const style = state?.activeDrawing || 'solid';
  switch(style) {
    case 'glow': return '#00ffff';
    case 'dashed': return '#ffd700';
    case 'glitter': return '#ff69b4';
    default: return '#4facfe';
  }
}

// ─── Physics ─────────────────────────────────────────
function checkCollision(line, circle) {
  for (let i = 0; i < line.points.length - 1; i++) {
    const a = line.points[i], b = line.points[i + 1];
    // Point to line segment distance
    const ax = circle.x - a.x, ay = circle.y - a.y;
    const bx = b.x - a.x, by = b.y - a.y;
    const len2 = bx*bx + by*by;
    if (len2 === 0) { // same point
      if (Math.sqrt(ax*ax + ay*ay) < circle.radius) return true;
      continue;
    }
    let t = (ax*bx + ay*by) / len2;
    t = Math.max(0, Math.min(1, t));
    const closestX = a.x + t * bx, closestY = a.y + t * by;
    const dx = circle.x - closestX, dy = circle.y - closestY;
    if (Math.sqrt(dx*dx + dy*dy) < circle.radius + line.width) return true;
  }
  return false;
}

function checkCollisionLineRect(line, cx, cy, halfW, halfH) {
  // Simplified: check if any circle along enemy's path hits the stickman
  for (let i = 0; i < line.points.length - 1; i++) {
    const a = line.points[i], b = line.points[i + 1];
    const dx = stickman.x - a.x, dy = stickman.y - a.y;
    const ex = b.x - a.x, ey = b.y - a.y;
    const len2 = ex*ex + ey*ey;
    if (len2 === 0) continue;
    let t = (dx*ex + dy*ey) / len2;
    if (t < 0 || t > 1) continue;
    const closestX = a.x + t * ex, closestY = a.y + t * ey;
    const dist = Math.sqrt((stickman.x - closestX)**2 + (stickman.y - closestY)**2);
    if (dist < 30 + line.width) return true;
  }
  return false;
}

function updateRagdoll(sm, dt) {
  if (!sm.ragdoll) return;
  const parts = sm.ragdollParts;
  for (const key in parts) {
    const p = parts[key];
    p.vy += 0.3; // gravity
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.97;
    p.vy *= 0.97;
    if (p.y > H - 50) { p.y = H - 50; p.vy *= -0.3; }
  }
}

function triggerRagdoll(sm) {
  sm.ragdoll = true;
  const p = sm.ragdollParts;
  p.head = { x: sm.x, y: sm.y - sm.bodyLength/2 - sm.headRadius, vx: (Math.random()-0.5)*8, vy: -5 };
  p.body = { x: sm.x, y: sm.y, vx: (Math.random()-0.5)*4, vy: -3 };
  p.lArm = { x: sm.x - sm.armLength, y: sm.y + 5, vx: (Math.random()-0.5)*6, vy: -4 };
  p.rArm = { x: sm.x + sm.armLength, y: sm.y + 5, vx: (Math.random()-0.5)*6, vy: -4 };
  p.lLeg = { x: sm.x - sm.legLength, y: sm.y + sm.bodyLength/2 + sm.legLength, vx: (Math.random()-0.5)*5, vy: -2 };
  p.rLeg = { x: sm.x + sm.legLength, y: sm.y + sm.bodyLength/2 + sm.legLength, vx: (Math.random()-0.5)*5, vy: -2 };
}

// ─── Levels ─────────────────────────────────────────
function getLevelConfig(level) {
  const configs = [
    // Level 1-5: Easy
    { enemiesToSpawn: 3, types: ['spike'], speed: 1 },
    { enemiesToSpawn: 4, types: ['spike'], speed: 1.1 },
    { enemiesToSpawn: 4, types: ['spike', 'ball'], speed: 1.2 },
    { enemiesToSpawn: 5, types: ['spike', 'ball'], speed: 1.3 },
    { enemiesToSpawn: 5, types: ['spike', 'ball', 'bomb'], speed: 1.4 },
  ];
  if (level <= 5) return configs[level-1];
  return {
    enemiesToSpawn: Math.min(3 + Math.floor(level * 0.5), 12),
    types: level <= 10 ? ['spike', 'ball', 'bomb'] : ['spike', 'ball', 'bomb', 'bee'],
    speed: 1 + (level - 5) * 0.15,
  };
}

// ─── Game Logic ──────────────────────────────────────
function startLevel(level) {
  currentLevel = level;
  if (window.RetentionSystem) RetentionSystem.onGameStart();
  const bonuses = window.ProgressionSystem ? ProgressionSystem.getActiveBonuses() : {};
  stickman = createStickman();
  enemies = [];
  drawnLines = [];
  projectiles = [];
  gameState = 'playing';
  isDrawing = false;
  perfectRun = true;
  noDrawRun = true;
  maxHP = 3 + (bonuses.hpBonus || 0);
  stickmanHP = maxHP;
  maxInk = 100 + (bonuses.inkBonus || 0) * 10;
  ink = maxInk;
  levelEnemiesSpawned = 0;
  gameTimer = 0;
  spawnTimer = 0;

  updateUI();
  document.getElementById('game-over-box').classList.remove('show');
  document.getElementById('level-complete-box').classList.remove('show');
  document.getElementById('level-value').textContent = level;

  if (particles) particles.emitLevelUp();
}

function updateGame(dt) {
  if (gameState !== 'playing') return;
  gameTimer += dt;
  spawnTimer += dt;

  const config = getLevelConfig(currentLevel);

  // Spawn enemies
  if (levelEnemiesSpawned < config.enemiesToSpawn && spawnTimer > 2.0 / config.speed) {
    spawnEnemy();
    levelEnemiesSpawned++;
    spawnTimer = 0;
    document.getElementById('enemy-count').textContent = levelEnemiesSpawned;
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.x += e.vx * (config.speed || 1) * dt * 60;

    // Bee moves up/down
    if (e.type === 'bee') {
      e.wobblePhase += 0.05;
      e.y += Math.sin(e.wobblePhase) * 1.5;
    }

    // Check collision with drawn lines
    let blocked = false;
    for (const line of drawnLines) {
      if (line.points.length < 2) continue;
      if (checkCollision(line, e)) {
        e.health--;
        if (e.health <= 0) {
          e.alive = false;
          if (particles) particles.emit(e.x, e.y, '#ff6b6b', 8);
        }
        if (e.type === 'bomb') {
          // Bomb explodes on contact
          if (particles) particles.emit(e.x, e.y, '#ff4500', 20);
          // Check stickman proximity
          const dist = Math.sqrt((stickman.x - e.x)**2 + (stickman.y - e.y)**2);
          if (dist < 100 && stickman.alive) {
            stickmanHP--;
            if (particles) particles.emit(stickman.x, stickman.y, '#ff0000', 15);
            perfectRun = false;
          }
        }
        blocked = true;
        break;
      }
    }

    if (!blocked && e.alive) {
      // Check if enemy hits stickman
      const dist = Math.sqrt((stickman.x - e.x)**2 + (stickman.y - e.y)**2);
      if (dist < 30 + e.radius && stickman.alive) {
        stickmanHP--;
        perfectRun = false;
        if (particles) particles.emit(stickman.x, stickman.y, '#ff0000', 15);
        if (stickmanHP <= 0) {
          stickman.alive = false;
          triggerRagdoll(stickman);
          gameState = 'lose';
          showGameOver();
          return;
        }
        e.alive = false; // enemy consumed on hit
      }
    }

    // Remove off-screen or dead enemies
    if (!e.alive || e.x < -50) {
      enemies.splice(i, 1);
    }
  }

  // Update ragdoll
  if (stickman.ragdoll) {
    updateRagdoll(stickman, dt);
  }

  // Check win condition: all enemies gone or passed
  if (levelEnemiesSpawned >= config.enemiesToSpawn && enemies.length === 0 && stickman.alive) {
    gameState = 'win';
    showLevelComplete();
  }

  updateUI();
}

// ─── Render ──────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, W, H);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0a2a');
  grad.addColorStop(1, '#1a1a3a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Ground
  ctx.fillStyle = '#2a2a4a';
  ctx.fillRect(0, H - 40, W, 40);
  ctx.strokeStyle = '#4a4a6a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, H - 40); ctx.lineTo(W, H - 40); ctx.stroke();

  // Exit zone (right side)
  ctx.fillStyle = 'rgba(76, 209, 55, 0.15)';
  ctx.fillRect(W - 60, H - 200, 60, 160);
  ctx.strokeStyle = 'rgba(76, 209, 55, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(W - 60, H - 200, 60, 160);
  ctx.fillStyle = 'rgba(76, 209, 55, 0.4)';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚪 EXIT', W - 30, H - 180);

  // Draw drawn lines
  for (const line of drawnLines) {
    if (line.points.length < 2) continue;
    ctx.save();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = line.color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(line.points[0].x, line.points[0].y);
    for (let i = 1; i < line.points.length; i++) {
      ctx.lineTo(line.points[i].x, line.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Draw enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    ctx.save();
    const enemyColors = { spike: '#ff6b6b', ball: '#a18cd1', bomb: '#ff4500', bee: '#ffd700' };
    ctx.fillStyle = enemyColors[e.type] || '#ff6b6b';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    if (e.type === 'spike') {
      // Triangle spike
      ctx.beginPath();
      ctx.moveTo(e.x - e.radius, e.y + e.radius);
      ctx.lineTo(e.x, e.y - e.radius);
      ctx.lineTo(e.x + e.radius, e.y + e.radius);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (e.type === 'bee') {
      // Winged bee with stripes
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x - e.radius*0.5, e.y - e.radius*0.3, e.radius, e.radius*0.2);
      ctx.fillRect(e.x - e.radius*0.5, e.y + e.radius*0.1, e.radius, e.radius*0.2);
      // Wings
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.ellipse(e.x - 5, e.y - e.radius - 5, 8, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(e.x + 5, e.y - e.radius - 5, 8, 5, 0, 0, Math.PI*2); ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      if (e.type === 'bomb') {
        // Fuse
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(e.x, e.y - e.radius); ctx.lineTo(e.x + 5, e.y - e.radius - 8); ctx.stroke();
        // Spark
        ctx.fillStyle = '#ff4500';
        ctx.beginPath(); ctx.arc(e.x + 5, e.y - e.radius - 8, 3, 0, Math.PI*2); ctx.fill();
      }
      if (e.health > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(e.health, e.x, e.y + 3);
      }
    }
    ctx.restore();
  }

  // Draw stickman
  if (stickman) {
    const state = window.ProgressionSystem?.getState();
    const skinColors = { classic: '#ffffff', warrior: '#ff6b6b', ninja: '#2d3436', knight: '#dfe6e9', cyber: '#00ffff' };
    const skin = skinColors[state?.activeSkin] || '#ffffff';
    drawStickman(ctx, stickman, skin);
  }

  // Particles
  if (particles) { particles.update(); particles.draw(ctx); }

  // Floating texts
  floatingTexts = floatingTexts.filter(ft => ft.update());
  for (const ft of floatingTexts) { ft.draw(ctx); }

  // Ink bar (drawing on canvas)
  if (gameState === 'playing') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 10, W - 20, 8);
    ctx.fillStyle = ink > 30 ? '#4facfe' : '#ff6b6b';
    ctx.fillRect(10, 10, (W - 20) * (ink / maxInk), 8);
  }
}

// ─── UI ──────────────────────────────────────────────
function updateUI() {
  document.getElementById('hp-value').textContent = '♥'.repeat(Math.max(0, stickmanHP));
  document.getElementById('ink-value').textContent = Math.floor(ink) + '%';
  document.getElementById('enemy-count').textContent = enemies.length;
  updateHUD();
}

function updateHUD() {
  if (!window.ProgressionSystem) return;
  const state = ProgressionSystem.getState();
  const coins = document.getElementById('hud-coins');
  const gems = document.getElementById('hud-gems');
  if (coins) coins.textContent = state.coins;
  if (gems) gems.textContent = state.gems;
}

function updateInk() {
  document.getElementById('ink-value').textContent = Math.floor(ink) + '%';
}

function showGameOver() {
  const box = document.getElementById('game-over-box');
  box.querySelector('#final-level').textContent = 'Level ' + currentLevel;
  box.classList.add('show');
  if (window.ProgressionSystem) {
    ProgressionSystem.endOfGame({ won: false, level: currentLevel, perfect: false, noDraw: false });
    const unlocked = ProgressionSystem.checkAchievements();
  }
  // New system hooks
  if (window.RetentionSystem) RetentionSystem.onGameEnd(0);
  if (window.ChallengesSystem) ChallengesSystem.reportProgress('games', 1);
  if (window.AdsManager) AdsManager.tryShowInterstitial();
}

function showLevelComplete() {
  const box = document.getElementById('level-complete-box');
  box.querySelector('#complete-level').textContent = 'Level ' + currentLevel + ' Complete!';
  const bonus = 50 + currentLevel * 10;
  const perfectBonus = perfectRun ? 50 : 0;
  const noDrawBonus = noDrawRun ? 100 : 0;
  const total = bonus + perfectBonus + noDrawBonus;
  let rewards = '+' + total + ' 🪙';
  if (perfectBonus > 0) rewards += ' (Perfect +' + perfectBonus + ')';
  if (noDrawBonus > 0) rewards += ' (No Draw +' + noDrawBonus + '!)';
  box.querySelector('#reward-display').innerHTML = rewards;
  box.classList.add('show');

  if (window.ProgressionSystem) {
    ProgressionSystem.endOfGame({ won: true, level: currentLevel, perfect: perfectRun, noDraw: noDrawRun });
    ProgressionSystem.addCoins(total);
    const unlocked = ProgressionSystem.checkAchievements();
    updateHUD();
  }
  // New system hooks
  if (window.RetentionSystem) RetentionSystem.onGameEnd(total);
  if (window.ChallengesSystem) {
    ChallengesSystem.reportProgress('score', total);
    ChallengesSystem.reportProgress('games', 1);
    if (perfectRun) ChallengesSystem.reportProgress('perfect', 1);
  }
  if (window.AdsManager) AdsManager.tryShowInterstitial();

  if (particles) particles.emitReward(W/2, H/2);
}

// ─── Canvas Init ─────────────────────────────────────
function initCanvas() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  // Responsive sizing
  const maxW = window.innerWidth - 16;
  const maxH = window.innerHeight - 160;
  const scale = Math.min(maxW / W, maxH / H, 1);
  canvas.style.width = (W * scale) + 'px';
  canvas.style.height = (H * scale) + 'px';
}

// ─── Drawing Controls ────────────────────────────────
function initDrawingControls() {
  // Mouse
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    startDrawing(x, y);
  });
  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    continueDrawing(x, y);
  });
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  // Touch
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const t = e.touches[0];
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;
    startDrawing(x, y);
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const t = e.touches[0];
    const x = (t.clientX - rect.left) * scaleX;
    const y = (t.clientY - rect.top) * scaleY;
    continueDrawing(x, y);
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDrawing();
  }, { passive: false });
}

// ─── Game Loop ───────────────────────────────────────
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  updateGame(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// ─── Init ────────────────────────────────────────────
function init() {
  initCanvas();
  initDrawingControls();

  particles = new ParticleSystem();

  // Load progression
  if (window.ProgressionSystem) {
    ProgressionSystem.load();
    // Check if any completed levels
    const state = ProgressionSystem.getState();
    currentLevel = Math.min(state.highestLevel, getTotalLevels());
    updateHUD();
    setInterval(updateHUD, 3000);
  }

  // Initialize new systems
  if (window.AdsManager) {
    AdsManager.init();
  }
  if (window.ChallengesSystem) {
    ChallengesSystem.init();
  }
  if (window.StoreRotator) {
    StoreRotator.init();
  }
  if (window.RetentionSystem) {
    RetentionSystem.init();
  }
  if (window.CollectiblesSystem) {
    CollectiblesSystem.init();
  }
  if (window.TutorialSystem) {
    TutorialSystem.init({ gameTitle: 'Draw to Save' });
    if (TutorialSystem.shouldShow()) {
      setTimeout(() => TutorialSystem.start(), 500);
    }
  }

  // UI Buttons
  document.getElementById('play-btn')?.addEventListener('click', () => startLevel(currentLevel));
  document.getElementById('restart-btn')?.addEventListener('click', () => startLevel(currentLevel));
  document.getElementById('next-level-btn')?.addEventListener('click', () => {
    currentLevel = Math.min(currentLevel + 1, getTotalLevels());
    startLevel(currentLevel);
  });
  document.getElementById('erase-btn')?.addEventListener('click', () => {
    drawnLines = [];
    if (particles) particles.emit(W/2, H/2, '#4facfe', 10);
  });
  document.getElementById('button-shop')?.addEventListener('click', () => {
    if (window.ShopUI) ShopUI.open();
  });
  document.getElementById('shop-btn-go')?.addEventListener('click', () => {
    document.getElementById('game-over-box').classList.remove('show');
    if (window.ShopUI) { ShopUI.open(); ShopUI.showTab('upgrades'); }
  });

  startLevel(currentLevel);
  gameLoop(performance.now());
}

function getTotalLevels() { return 30; }

// ─── Boot ────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
