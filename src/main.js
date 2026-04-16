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
function loop() {
  requestAnimationFrame(loop);

  // Always draw background
  stage.drawBackground(ctx);

  if (state === STATE.TITLE) {
    drawTitle(ctx);
    return;
  }

  if (state === STATE.PLAYING) {
    // Update
    player.update(bullets);

    stage.update(bullets, spawnExplosion, particles);

    // Update bullets
    for (const b of bullets) b.update();

    // Remove off-screen bullets
    bullets = bullets.filter(b => !b.dead && b.x > -20 && b.x < W + 20 && b.y > -40 && b.y < H + 40);

    // Update particles
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
      // Contact with enemies
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

    // ── Draw ──
    stage.drawForeground(ctx);
    for (const b of bullets) b.draw(ctx);
    for (const p of particles) p.draw(ctx);
    player.draw(ctx);
    drawHUD(ctx, player);

    // ── State transitions ──
    if (player.dead) {
      state = STATE.GAMEOVER;
    } else if (stage.cleared) {
      state = STATE.CLEAR;
    }
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

loop();
