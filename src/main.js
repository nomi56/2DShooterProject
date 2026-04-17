import * as THREE from 'three';
import { Player } from './player.js';
import { Stage } from './stage.js';
import { spawnExplosion } from './particle.js';
import { drawHUD, drawTitle, drawGameOver, drawStageClear } from './ui.js';

const canvas    = document.getElementById('gameCanvas');
const hudCanvas = document.getElementById('hudCanvas');
const hudCtx    = hudCanvas.getContext('2d');

const W = 480, H = 640;

// ─── Three.js setup ──────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(W, H);

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

// ─── Game state ───────────────────────────────────────────────────────────────
const STATE = { TITLE: 0, PLAYING: 1, GAMEOVER: 2, CLEAR: 3 };
let state = STATE.TITLE;

let player, stage, bullets, particles;

function initGame() {
  // Clean up previous session
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

window.addEventListener('keydown', (e) => { if (e.code === 'Space') onAction(); });
canvas.addEventListener('mousedown', () => onAction());
canvas.addEventListener('touchstart', (e) => {
  if (state !== STATE.PLAYING) { e.preventDefault(); onAction(); }
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
    const boss = stage.boss;
    drawHUD(hudCtx, player, boss);
  } else if (state === STATE.GAMEOVER) {
    drawGameOver(hudCtx, player.score);
  } else if (state === STATE.CLEAR) {
    drawStageClear(hudCtx, player.score);
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

  // Add newly spawned bullets/particles to scene
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
        spawnExplosion(scene, particles, b.x, b.y, 6, '#ff8');
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

loop();
