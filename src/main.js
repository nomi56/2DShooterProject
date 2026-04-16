import { Player } from './player.js';
import { Stage, PowerUp } from './stage.js';
import { Particle, spawnExplosion } from './particle.js';
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
  // Only trigger state transition on TITLE / GAMEOVER / CLEAR
  if (state !== STATE.PLAYING) {
    e.preventDefault();
    onAction();
  }
}, { passive: false });

// ─── Main loop ────────────────────────────────────────────────────────────────
const FIXED_DT = 1000 / 60; // always update at 60fps regardless of display rate
let lastTime = 0;
let accumulator = 0;

function loop(timestamp) {
  requestAnimationFrame(loop);

  const elapsed = timestamp - lastTime;
  lastTime = timestamp;
  // Cap to 200ms to avoid spiral-of-death after tab is backgrounded
  accumulator += Math.min(elapsed, 200);

  // Run as many fixed-step updates as needed to catch up
  while (accumulator >= FIXED_DT) {
    if (state === STATE.PLAYING) {
      _update();
    }
    accumulator -= FIXED_DT;
  }

  // Draw once per animation frame
  stage.drawBackground(ctx);

  if (state === STATE.TITLE) {
    drawTitle(ctx);
    return;
  }

  // ── Draw ──
  if (state === STATE.PLAYING) {
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

function _update() {
  player.update(bullets);
  stage.update(bullets, spawnExplosion, particles);

  for (const b of bullets) b.update();
  bullets = bullets.filter(b => !b.dead && b.x > -20 && b.x < W + 20 && b.y > -40 && b.y < H + 40);

  for (const p of particles) p.update();
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
      if (player.powerLevel < 3) player.powerLevel++;
    }
  }

  // ── State transitions ──
  if (player.dead) {
    state = STATE.GAMEOVER;
  } else if (stage.cleared) {
    state = STATE.CLEAR;
  }
}

loop();
