import { SmallEnemy, MediumEnemy, Boss, SniperEnemy, TankEnemy } from './enemies/index.js';

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
  update(dt) {
    this.y += this.speed * dt;
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
// type: 'power' (spread) | 'rate' (fire rate) | 'speed' (bullet speed)
const POWERUP_STYLES = {
  power: { color: '#ff0', label: 'P' },
  rate:  { color: '#0ff', label: 'R' },
  speed: { color: '#f80', label: 'S' },
};

export class PowerUp {
  constructor(x, y, type = 'power') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.vy = 1.5;
    this.dead = false;
    this.t = 0;
  }
  update(dt) {
    this.y += this.vy * dt;
    this.t += dt;
    if (this.y > CANVAS_H + 20) this.dead = true;
  }
  getBounds() { return { x: this.x - 10, y: this.y - 10, w: 20, h: 20 }; }
  draw(ctx) {
    const { color, label } = POWERUP_STYLES[this.type];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.t * 0.05);
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (this.type === 'rate') {
      // Circle
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === 'speed') {
      // Diamond
      ctx.beginPath();
      ctx.moveTo(0, -9); ctx.lineTo(9, 0);
      ctx.lineTo(0, 9);  ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.stroke();
    } else {
      // Square (power)
      ctx.strokeRect(-8, -8, 16, 16);
    }
    ctx.fillStyle = color;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
}

// ─── Wave definitions ─────────────────────────────────────────────────────────
// Frame counts are in 60fps-equivalent units (dt-accumulated)
function buildWaves() {
  const waves = [];
  const add = (frame, type, x, y) => waves.push({ frame, type, x, y });

  // ── Phase 1: Small enemies (0–600) ──────────────────────────────────────────
  for (let i = 0; i < 6; i++) add( 60 + i * 30, 'small',  60 + i * 70, -30);
  for (let i = 0; i < 6; i++) add(300 + i * 25, 'small',  80 + i * 60, -30);
  for (let i = 0; i < 5; i++) add(520 + i * 20, 'small', 100 + i * 70, -30);

  // ── Phase 2: Medium enemies join (600–1000) ──────────────────────────────────
  add(650, 'medium', 160, -50);
  add(710, 'medium', 320, -50);
  for (let i = 0; i < 8; i++) add(800 + i * 20, 'small', 40 + i * 55, -30);
  add(960, 'medium', 240, -50);

  // ── Phase 3: Snipers introduced (1000–1500) ──────────────────────────────────
  add(1050, 'sniper', 120, -40);
  add(1110, 'sniper', 360, -40);
  for (let i = 0; i < 6; i++) add(1200 + i * 25, 'small', 60 + i * 72, -30);
  add(1350, 'sniper', 200, -40);
  add(1350, 'medium', 350, -50);
  add(1420, 'sniper', 300, -40);
  add(1480, 'medium', 130, -50);

  // ── Phase 4: Tank enemies introduced (1500–2000) ─────────────────────────────
  add(1550, 'tank',   240, -60);
  for (let i = 0; i < 6; i++) add(1620 + i * 28, 'small',  50 + i * 76, -30);
  add(1750, 'sniper', 130, -40);
  add(1750, 'sniper', 350, -40);
  add(1870, 'tank',   150, -60);
  add(1870, 'tank',   330, -60);
  add(1950, 'medium', 240, -50);

  // ── Phase 5: Intense pre-boss rush (2000–2400) ───────────────────────────────
  for (let i = 0; i < 8; i++) add(2000 + i * 22, 'small',  40 + i * 55, -30);
  add(2120, 'medium', 120, -50);
  add(2120, 'medium', 360, -50);
  add(2160, 'sniper', 240, -40);
  add(2220, 'tank',   200, -60);
  add(2280, 'sniper',  80, -40);
  add(2280, 'sniper', 400, -40);
  for (let i = 0; i < 6; i++) add(2340 + i * 25, 'small',  70 + i * 68, -30);
  add(2420, 'medium', 170, -50);
  add(2420, 'medium', 310, -50);

  // ── Boss ─────────────────────────────────────────────────────────────────────
  add(2600, 'boss', 240, -90);

  return waves.sort((a, b) => a.frame - b.frame);
}

const BOSS_FRAME = 2600;
// Density caps per enemy type (avoids flooding with heavy enemies)
const DENSITY_CAP = { small: 8, medium: 3, sniper: 2, tank: 2 };

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
    this.cleared = false;
    this._killCount = 0; // tracks kills for drop timing
  }

  /** Returns 1/2/4/8 based on which quarter of the stage we're in. */
  _difficultyMult() {
    const q = Math.min(3, Math.floor((this.frame / BOSS_FRAME) * 4));
    return Math.pow(2, q);
  }

  _spawnWave(w) {
    const hpMult  = this._difficultyMult();
    const density = Math.min(DENSITY_CAP[w.type] ?? 1, hpMult);
    for (let d = 0; d < density; d++) {
      const x = density === 1 ? w.x : Math.round((d + 0.5) * (CANVAS_W / density));
      switch (w.type) {
        case 'small':  this.enemies.push(new SmallEnemy(x,  w.y, hpMult)); break;
        case 'medium': this.enemies.push(new MediumEnemy(x, w.y, hpMult)); break;
        case 'sniper': this.enemies.push(new SniperEnemy(x, w.y, hpMult)); break;
        case 'tank':   this.enemies.push(new TankEnemy(x,   w.y, hpMult)); break;
        case 'boss':   this.enemies.push(new Boss()); this.bossSpawned = true; break;
      }
    }
  }

  update(bullets, spawnExplosion, particles, dt, playerX = 240, playerY = 400) {
    this.frame += dt;

    for (const s of this.stars) s.update(dt);

    while (this.waveIdx < this.waves.length && this.waves[this.waveIdx].frame <= this.frame) {
      this._spawnWave(this.waves[this.waveIdx++]);
    }

    for (const e of this.enemies) {
      e.update(bullets, dt, playerX, playerY);
      if (e.dead) {
        spawnExplosion(particles, e.x, e.y, e instanceof Boss ? 60 : 20,
          e instanceof Boss ? '#f60' : '#fa0');
        // Drop a power-up every 5 kills (Boss always drops one)
        this._killCount++;
        if (e instanceof Boss || this._killCount % 2 === 0) {
          const types = ['power', 'rate', 'speed'];
          const type = types[Math.floor(Math.random() * types.length)];
          this.powerUps.push(new PowerUp(e.x, e.y, type));
        }
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    for (const p of this.powerUps) p.update(dt);
    this.powerUps = this.powerUps.filter(p => !p.dead);

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
