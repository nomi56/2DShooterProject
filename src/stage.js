import { SmallEnemy, MediumEnemy, Boss } from './enemy.js';

const CANVAS_W = 480;
const CANVAS_H = 640;

// ─── Stars background ─────────────────────────────────────────────────────────
class Star {
  constructor() { this.reset(true); }
  reset(init = false) {
    this.x = Math.random() * CANVAS_W;
    this.y = init ? Math.random() * CANVAS_H : -2;
    this.size = Math.random() * 2 + 0.3;
    this.speed = this.size * 0.8 + 0.4;
    this.alpha = Math.random() * 0.6 + 0.4;
  }
  update() {
    this.y += this.speed;
    if (this.y > CANVAS_H + 2) this.reset();
  }
  draw(ctx) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x, this.y, this.size, this.size * 2);
    ctx.globalAlpha = 1;
  }
}

// ─── Powerup item ─────────────────────────────────────────────────────────────
export class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vy = 1.5;
    this.dead = false;
    this.t = 0;
  }
  update() {
    this.y += this.vy;
    this.t++;
    if (this.y > CANVAS_H + 20) this.dead = true;
  }
  getBounds() { return { x: this.x - 10, y: this.y - 10, w: 20, h: 20 }; }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.t * 0.05);
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#ff0';
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -8, 16, 16);
    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', 0, 0);
    ctx.restore();
  }
}

// ─── Wave definitions ─────────────────────────────────────────────────────────
// Each entry: { frame, type, x, y }
function buildWaves() {
  const waves = [];
  const add = (frame, type, x, y) => waves.push({ frame, type, x, y });

  // Wave 1 – small enemies from top
  for (let i = 0; i < 6; i++) add(60 + i * 30, 'small', 60 + i * 70, -30);
  // Wave 2
  for (let i = 0; i < 6; i++) add(300 + i * 25, 'small', 80 + i * 60, -30);
  // Wave 3 – medium
  add(500, 'medium', 160, -50);
  add(560, 'medium', 320, -50);
  // Wave 4 – mixed
  for (let i = 0; i < 8; i++) add(700 + i * 20, 'small', 40 + i * 55, -30);
  add(850, 'medium', 240, -50);
  // Wave 5 – 2 mediums
  add(1000, 'medium', 120, -50);
  add(1060, 'medium', 360, -50);
  // Boss
  add(1300, 'boss', 240, -90);

  return waves.sort((a, b) => a.frame - b.frame);
}

// ─── Stage manager ────────────────────────────────────────────────────────────
export class Stage {
  constructor() {
    this.stars = Array.from({ length: 120 }, () => new Star());
    this.enemies = [];
    this.powerUps = [];
    this.frame = 0;
    this.waves = buildWaves();
    this.waveIdx = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.cleared = false;
  }

  update(bullets, spawnExplosion, particles) {
    this.frame++;

    // Stars
    for (const s of this.stars) s.update();

    // Spawn enemies from wave list
    while (this.waveIdx < this.waves.length && this.waves[this.waveIdx].frame <= this.frame) {
      const w = this.waves[this.waveIdx++];
      if (w.type === 'small')  this.enemies.push(new SmallEnemy(w.x, w.y));
      if (w.type === 'medium') this.enemies.push(new MediumEnemy(w.x, w.y));
      if (w.type === 'boss')   { this.enemies.push(new Boss()); this.bossSpawned = true; }
    }

    // Update enemies
    for (const e of this.enemies) {
      e.update(bullets);
      if (e.dead && e.score !== undefined) {
        spawnExplosion(particles, e.x, e.y, e instanceof Boss ? 60 : 20,
          e instanceof Boss ? '#f60' : '#fa0');
        // Chance to drop power-up
        if (Math.random() < 0.2) this.powerUps.push(new PowerUp(e.x, e.y));
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    // Update power-ups
    for (const p of this.powerUps) p.update();
    this.powerUps = this.powerUps.filter(p => !p.dead);

    // Stage clear: boss defeated
    if (this.bossSpawned && this.enemies.length === 0 && !this.cleared) {
      this.cleared = true;
    }
  }

  drawBackground(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    for (const s of this.stars) s.draw(ctx);
  }

  drawForeground(ctx) {
    for (const e of this.enemies) e.draw(ctx);
    for (const p of this.powerUps) p.draw(ctx);
  }
}
