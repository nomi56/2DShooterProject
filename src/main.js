import { Player } from './player.js';
import { Stage } from './stage.js';
import { spawnExplosion } from './particle.js';
import { drawHUD, drawTitle, drawGameOver, drawStageClear } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// ─── Collision helper ─────────────────────────────────────────────────────────
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ─── Game state ───────────────────────────────────────────────────────────────
const STATE = { TITLE: 0, PLAYING: 1, GAMEOVER: 2, CLEAR: 3 };
let state = STATE.TITLE;

let player, stage, bullets, particles;

function initGame() {
  player    = new Player();
  stage     = new Stage();
  bullets   = [];
  particles = [];
}
initGame();

// ─── Input for state transitions ──────────────────────────────────────────────
function onAction() {
  if (state === STATE.TITLE) {
    state = STATE.PLAYING;
  } else if (state === STATE.GAMEOVER || state === STATE.CLEAR) {
    initGame();
    state = STATE.PLAYING;
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') onAction();
});
canvas.addEventListener('mousedown', () => onAction());
canvas.addEventListener('touchstart', (e) => {
  if (state !== STATE.PLAYING) {
    e.preventDefault();
    onAction();
  }
}, { passive: false });

// ─── Main loop ────────────────────────────────────────────────────────────────
// dt is normalized to 60fps: dt=1.0 at 60fps, dt=0.5 at 120fps, dt=2.0 at 30fps.
// All velocities and timers are tuned for dt=1.0.
let lastTime = 0;

function loop(timestamp) {
  requestAnimationFrame(loop);

  const elapsed = timestamp - lastTime;
  lastTime = timestamp;
  // Clamp dt: ignore first frame (elapsed≈0) and cap after tab switch
  const dt = Math.min(elapsed, 100) / (1000 / 60);

  stage.drawBackground(ctx);

  if (state === STATE.TITLE) {
    drawTitle(ctx);
    return;
  }

  if (state === STATE.PLAYING) {
    _update(dt);
    stage.drawForeground(ctx);
    for (const b of bullets) b.draw(ctx);
    for (const p of particles) p.draw(ctx);
    player.draw(ctx);
    drawHUD(ctx, player);
  }

  if (state === STATE.GAMEOVER) {
    stage.drawForeground(ctx);
    drawGameOver(ctx, player.score);
  }

  if (state === STATE.CLEAR) {
    stage.drawForeground(ctx);
    drawStageClear(ctx, player.score);
  }
}

function _update(dt) {
  player.update(bullets, dt);
  stage.update(bullets, spawnExplosion, particles, dt, player.x, player.y);

  for (const b of bullets) b.update(dt);
  bullets = bullets.filter(b => !b.dead && b.x > -20 && b.x < W + 20 && b.y > -40 && b.y < H + 40);

  for (const p of particles) p.update(dt);
  particles = particles.filter(p => !p.dead);

  // ── Collision: player bullets vs enemies ──
  for (const b of bullets) {
    if (!b.isPlayer) continue;
    for (const e of stage.enemies) {
      if (e.dead) continue;
      if (rectsOverlap(b.getBounds(), e.getBounds())) {
        b.dead = true;
        e.hit(b.power);
        if (e.dead) player.score += e.score;
        spawnExplosion(particles, b.x, b.y, 6, '#ff8');
      }
    }
  }

  // ── Collision: enemy bullets + enemies vs player ──
  if (player.invincible === 0) {
    const pb = player.getBounds();
    for (const b of bullets) {
      if (b.isPlayer || b.dead) continue;
      if (rectsOverlap(b.getBounds(), pb)) {
        b.dead = true;
        player.hit();
        spawnExplosion(particles, player.x, player.y, 10, '#4af');
      }
    }
    for (const e of stage.enemies) {
      if (e.dead) continue;
      if (rectsOverlap(e.getBounds(), pb)) {
        player.hit();
        spawnExplosion(particles, player.x, player.y, 10, '#4af');
      }
    }
  }

  // ── Collision: power-ups vs player ──
  const pb = player.getBounds();
  for (const pu of stage.powerUps) {
    if (pu.dead) continue;
    if (rectsOverlap(pu.getBounds(), pb)) {
      pu.dead = true;
      if (pu.type === 'power' && player.powerLevel < 3)       player.powerLevel++;
      if (pu.type === 'rate'  && player.fireRateLevel < 4)    player.fireRateLevel++;
      if (pu.type === 'speed' && player.bulletSpeedLevel < 4) player.bulletSpeedLevel++;
    }
  }

  // ── State transitions ──
  if (player.dead)     state = STATE.GAMEOVER;
  else if (stage.cleared) state = STATE.CLEAR;
}

loop();
