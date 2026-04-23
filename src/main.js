import * as THREE from 'three';
import { Player } from './player.js';
import { Stage } from './stage.js';
import { spawnExplosion } from './particle.js';
import { drawHUD, drawTitle, drawGameOver, drawStageClear,
         drawBackButton, drawDebugScreen,
         BACK_BTN, DEBUG_ENEMY_BTNS, DEBUG_TITLE_BTN } from './ui.js';

const canvas    = document.getElementById('gameCanvas');
const hudCanvas = document.getElementById('hudCanvas');
const hudCtx    = hudCanvas.getContext('2d');

const W = 480, H = 640;

// ─── Responsive sizing ────────────────────────────────────────────────────────
const container = document.getElementById('game-container');
function resizeGame() {
  const vw = window.visualViewport ? window.visualViewport.width  : window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const scale = Math.min(vw / W, vh / H, 1);
  container.style.width  = `${W * scale}px`;
  container.style.height = `${H * scale}px`;
}
resizeGame();
window.addEventListener('resize', resizeGame);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resizeGame);

// ─── Three.js setup ──────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(W, H, false); // false = don't overwrite canvas CSS size

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// OrthographicCamera with canvas-like coords: (0,0) = top-left, y increases down
// Setting top=0, bottom=H flips y so world y=0 is screen top, y=H is screen bottom
const camera = new THREE.OrthographicCamera(0, W, 0, H, -100, 100);

// ─── Collision helper ─────────────────────────────────────────────────────────
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ─── Canvas coordinate helper ─────────────────────────────────────────────────
function getCanvasPos(clientX, clientY) {
  const rect = hudCanvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (W / rect.width),
    y: (clientY - rect.top)  * (H / rect.height),
  };
}
function inRect(pos, r) {
  return pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h;
}

// ─── Game state ───────────────────────────────────────────────────────────────
const STATE = { TITLE: 0, PLAYING: 1, GAMEOVER: 2, CLEAR: 3, DEBUG: 4 };
let state = STATE.TITLE;

let player, stage, bullets, particles;
let debugEnemyType = null;

function initGame() {
  if (player) { player.dispose(); }
  if (stage)  { stage.dispose(); }
  for (const b of bullets   || []) b.dispose();
  for (const p of particles || []) p.dispose();

  player    = new Player(scene);
  stage     = new Stage(scene);
  bullets   = [];
  particles = [];
}
initGame();

// ─── Input ────────────────────────────────────────────────────────────────────
function onAction() {
  if (state === STATE.TITLE) {
    state = STATE.PLAYING;
  } else if (state === STATE.GAMEOVER || state === STATE.CLEAR) {
    initGame();
    state = STATE.PLAYING;
  }
}

function handlePointer(clientX, clientY, isTouch) {
  const pos = getCanvasPos(clientX, clientY);

  // 戻るボタン（タイトル以外で常時有効）
  if (state !== STATE.TITLE && inRect(pos, BACK_BTN)) {
    initGame();
    debugEnemyType = null;
    state = STATE.TITLE;
    return;
  }

  // デバッグ画面：敵選択ボタン
  if (state === STATE.DEBUG) {
    for (const btn of DEBUG_ENEMY_BTNS) {
      if (inRect(pos, btn)) {
        debugEnemyType = btn.type;
        stage.spawnEnemy(debugEnemyType);
        bullets.forEach(b => b.dispose());
        bullets = [];
        return;
      }
    }
    return;
  }

  // タイトル画面：DEBUGボタン
  if (state === STATE.TITLE && inRect(pos, DEBUG_TITLE_BTN)) {
    initGame();
    debugEnemyType = null;
    state = STATE.DEBUG;
    return;
  }

  if (!isTouch || state !== STATE.PLAYING) onAction();
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (state !== STATE.PLAYING && state !== STATE.DEBUG) onAction();
  }
});
canvas.addEventListener('mousedown', (e) => handlePointer(e.clientX, e.clientY, false));
window.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  handlePointer(t.clientX, t.clientY, true);
}, { passive: false });

// ─── Main loop ────────────────────────────────────────────────────────────────
let lastTime = 0;

function loop(timestamp) {
  requestAnimationFrame(loop);

  const elapsed = timestamp - lastTime;
  lastTime = timestamp;
  const dt = Math.min(elapsed, 100) / (1000 / 60);

  hudCtx.clearRect(0, 0, W, H);

  stage.updateStars(dt);

  if (state === STATE.TITLE) {
    drawTitle(hudCtx);
  } else if (state === STATE.PLAYING) {
    _update(dt);
    drawHUD(hudCtx, player, stage.boss);
    drawBackButton(hudCtx);
  } else if (state === STATE.GAMEOVER) {
    drawGameOver(hudCtx, player.score);
    drawBackButton(hudCtx);
  } else if (state === STATE.CLEAR) {
    drawStageClear(hudCtx, player.score);
    drawBackButton(hudCtx);
  } else if (state === STATE.DEBUG) {
    _debugUpdate(dt);
    drawDebugScreen(hudCtx, stage.enemies, debugEnemyType);
    drawBackButton(hudCtx);
  }

  // Sync all mesh positions/visuals
  player.updateMesh();
  stage.updateMeshes();
  for (const b of bullets)   b.updateMesh();
  for (const p of particles) p.updateMesh();

  renderer.render(scene, camera);
}

function _update(dt) {
  player.update(bullets, dt);
  stage.update(bullets, spawnExplosion, particles, dt, player.x, player.y);

  for (const b of bullets)   b.update(dt);
  for (const p of particles) p.update(dt);

  for (const b of bullets)   { if (!b._inScene) { scene.add(b.mesh); b._inScene = true; } }
  for (const p of particles) { if (!p._inScene) { scene.add(p.mesh); p._inScene = true; } }

  // ── Collision: player bullets vs enemies ──
  for (const b of bullets) {
    if (!b.isPlayer) continue;
    for (const e of stage.enemies) {
      if (e.dead) continue;
      if (rectsOverlap(b.getBounds(), e.getBounds())) {
        b.dead = true;
        e.hit(b.power);
        if (e.dead) player.score += e.score;
        spawnExplosion(scene, particles, b.x, b.y, 6, '#ff8', b.power);
      }
    }
  }

  // ── Collision: enemy bullets + enemies vs player ──
  if (player.invincible <= 0) {
    const pb = player.getBounds();
    for (const b of bullets) {
      if (b.isPlayer || b.dead) continue;
      if (rectsOverlap(b.getBounds(), pb)) {
        b.dead = true;
        player.hit();
        spawnExplosion(scene, particles, player.x, player.y, 10, '#4af');
      }
    }
    for (const e of stage.enemies) {
      if (e.dead) continue;
      if (rectsOverlap(e.getBounds(), pb)) {
        player.hit();
        spawnExplosion(scene, particles, player.x, player.y, 10, '#4af');
      }
    }
  }

  // ── Collision: power-ups vs player ──
  const pb = player.getBounds();
  for (const pu of stage.powerUps) {
    if (pu.dead) continue;
    if (rectsOverlap(pu.getBounds(), pb)) {
      pu.dead = true;
      if (pu.type === 'power' && player.powerLevel       < 10) player.powerLevel++;
      if (pu.type === 'rate'  && player.fireRateLevel    < 10) player.fireRateLevel++;
      if (pu.type === 'speed' && player.bulletSpeedLevel < 10) player.bulletSpeedLevel++;
    }
  }

  // ── Remove dead/out-of-bounds entities ──
  const outOfBounds = b => b.x < -20 || b.x > W + 20 || b.y < -40 || b.y > H + 40;
  for (const b of bullets)   { if (b.dead || outOfBounds(b)) b.dispose(); }
  for (const p of particles) { if (p.dead) p.dispose(); }
  bullets   = bullets.filter(b => !b._disposed);
  particles = particles.filter(p => !p._disposed);

  // ── State transitions ──
  if (player.dead)        state = STATE.GAMEOVER;
  else if (stage.cleared) state = STATE.CLEAR;
}

function _debugUpdate(dt) {
  player.update(bullets, dt);

  for (const e of stage.enemies) {
    e.update(bullets, dt, player.x, player.y, 1, 1);
  }

  for (const b of bullets)   b.update(dt);
  for (const p of particles) p.update(dt);

  for (const b of bullets)   { if (!b._inScene) { scene.add(b.mesh); b._inScene = true; } }
  for (const p of particles) { if (!p._inScene) { scene.add(p.mesh); p._inScene = true; } }

  // ── Collision: player bullets vs debug enemies ──
  for (const b of bullets) {
    if (!b.isPlayer) continue;
    for (const e of stage.enemies) {
      if (e.dead) continue;
      if (rectsOverlap(b.getBounds(), e.getBounds())) {
        b.dead = true;
        e.hit(b.power);
        spawnExplosion(scene, particles, b.x, b.y, 6, '#ff8', b.power);
      }
    }
  }

  // ── Collision: enemy bullets vs player ──
  if (player.invincible <= 0) {
    const pb = player.getBounds();
    for (const b of bullets) {
      if (b.isPlayer || b.dead) continue;
      if (rectsOverlap(b.getBounds(), pb)) {
        b.dead = true;
        player.hit();
        spawnExplosion(scene, particles, player.x, player.y, 10, '#4af');
      }
    }
  }

  // ── Remove dead/out-of-bounds ──
  const outOfBounds = b => b.x < -20 || b.x > W + 20 || b.y < -40 || b.y > H + 40;
  for (const b of bullets)   { if (b.dead || outOfBounds(b)) b.dispose(); }
  for (const p of particles) { if (p.dead) p.dispose(); }
  bullets   = bullets.filter(b => !b._disposed);
  particles = particles.filter(p => !p._disposed);

  // ── 死亡した敵を処理してオートリスポーン ──
  for (const e of stage.enemies.filter(e => e.dead)) {
    spawnExplosion(scene, particles, e.x, e.y, e._isBoss ? 60 : 20, '#fa0');
    e.dispose();
  }
  stage.enemies = stage.enemies.filter(e => !e.dead);
  if (stage.enemies.length === 0 && debugEnemyType) {
    stage.spawnEnemy(debugEnemyType);
  }

  // プレイヤー死亡時はデバッグモードではリスポーン
  if (player.dead) {
    player.hp       = player.maxHp;
    player.dead     = false;
    player.invincible = 120;
  }
}

requestAnimationFrame(loop);
