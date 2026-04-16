import { Bullet } from './bullet.js';

const CANVAS_W = 480;
const CANVAS_H = 640;

// ─── Small Enemy ─────────────────────────────────────────────────────────────
export class SmallEnemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 24;
    this.hp = 2;
    this.maxHp = 2;
    this.speed = 1.5 + Math.random();
    this.vy = this.speed;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.dead = false;
    this.score = 100;
    this.shootTimer = Math.floor(Math.random() * 80) + 60;
    this.angle = 0;
  }

  update(bullets) {
    this.x += this.vx;
    this.y += this.vy;
    this.angle += 0.05;

    if (this.x < 20 || this.x > CANVAS_W - 20) this.vx *= -1;
    if (this.y > CANVAS_H + 40) this.dead = true;

    this.shootTimer--;
    if (this.shootTimer <= 0) {
      bullets.push(new Bullet(this.x, this.y + this.height / 2, 0, 5, false));
      this.shootTimer = 90;
    }
  }

  hit(power) {
    this.hp -= power;
    if (this.hp <= 0) this.dead = true;
  }

  getBounds() {
    return { x: this.x - this.width / 2, y: this.y - this.height / 2, w: this.width, h: this.height };
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI); // facing down

    ctx.shadowColor = '#f80';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f84';
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.lineTo(this.width / 2, this.height / 2);
    ctx.lineTo(0, this.height * 0.2);
    ctx.lineTo(-this.width / 2, this.height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fca';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ─── Medium Enemy ─────────────────────────────────────────────────────────────
export class MediumEnemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 44;
    this.height = 38;
    this.hp = 10;
    this.maxHp = 10;
    this.dead = false;
    this.score = 400;
    this.t = 0;
    this.baseX = x;
    this.vy = 0.8;
    this.shootTimer = 60;
    this.phase = 0; // 0 = entering, 1 = active
  }

  update(bullets) {
    this.t++;
    if (this.y < 120) {
      this.y += this.vy;
    } else {
      this.phase = 1;
      this.x = this.baseX + Math.sin(this.t * 0.03) * 80;
      this.y += Math.sin(this.t * 0.05) * 0.5;
    }

    if (this.y > CANVAS_H + 60) this.dead = true;

    if (this.phase === 1) {
      this.shootTimer--;
      if (this.shootTimer <= 0) {
        // Aimed 3-way shot
        for (let a = -0.3; a <= 0.31; a += 0.3) {
          bullets.push(new Bullet(this.x, this.y + this.height / 2,
            Math.sin(a) * 4, Math.cos(a) * 4, false));
        }
        this.shootTimer = 70;
      }
    }
  }

  hit(power) {
    this.hp -= power;
    if (this.hp <= 0) this.dead = true;
  }

  getBounds() {
    return { x: this.x - this.width / 2, y: this.y - this.height / 2, w: this.width, h: this.height };
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.shadowColor = '#a0f';
    ctx.shadowBlur = 14;

    // Body hexagon
    ctx.fillStyle = '#84c';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const r = this.width / 2;
      i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
              : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#d8f';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    // HP bar
    const bw = this.width;
    const ratio = this.hp / this.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(-bw / 2, -this.height / 2 - 8, bw, 4);
    ctx.fillStyle = `hsl(${ratio * 120}, 100%, 50%)`;
    ctx.fillRect(-bw / 2, -this.height / 2 - 8, bw * ratio, 4);

    ctx.restore();
  }
}

// ─── Boss ─────────────────────────────────────────────────────────────────────
export class Boss {
  constructor() {
    this.x = CANVAS_W / 2;
    this.y = -80;
    this.width = 100;
    this.height = 80;
    this.hp = 150;
    this.maxHp = 150;
    this.dead = false;
    this.score = 5000;
    this.t = 0;
    this.phase = 0;
    this.shootTimer = 40;
    this.targetY = 110;
    this.vy = 1.5;
    this.angle = 0;
  }

  update(bullets) {
    this.t++;
    this.angle += 0.02;

    // Enter
    if (this.y < this.targetY) {
      this.y += this.vy;
      return;
    }

    this.phase = this.hp < this.maxHp / 2 ? 2 : 1;
    this.x = CANVAS_W / 2 + Math.sin(this.t * 0.02) * 130;

    this.shootTimer--;
    if (this.shootTimer <= 0) {
      if (this.phase === 1) {
        // Circular burst
        const count = 10;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          bullets.push(new Bullet(this.x, this.y, Math.cos(a) * 3, Math.sin(a) * 3, false));
        }
        this.shootTimer = 80;
      } else {
        // Phase 2: double burst
        const count = 16;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + this.angle;
          bullets.push(new Bullet(this.x, this.y, Math.cos(a) * 4, Math.sin(a) * 4, false));
        }
        this.shootTimer = 50;
      }
    }
  }

  hit(power) {
    this.hp -= power;
    if (this.hp <= 0) { this.hp = 0; this.dead = true; }
  }

  getBounds() {
    return { x: this.x - this.width / 2, y: this.y - this.height / 2, w: this.width, h: this.height };
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(this.t * 0.1) * 0.15 + 0.85;
    ctx.shadowColor = this.phase === 2 ? '#f00' : '#f60';
    ctx.shadowBlur = 24 * pulse;

    // Main body
    ctx.fillStyle = this.phase === 2 ? '#c22' : '#c62';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = '#a44';
    ctx.beginPath();
    ctx.moveTo(-this.width / 2, 0);
    ctx.lineTo(-this.width * 0.9, -20);
    ctx.lineTo(-this.width * 0.9, 30);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width * 0.9, -20);
    ctx.lineTo(this.width * 0.9, 30);
    ctx.closePath();
    ctx.fill();

    // Core
    ctx.fillStyle = `hsl(${this.t * 4 % 360}, 100%, 70%)`;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Boss HP bar (top of screen)
    ctx.save();
    const barW = CANVAS_W - 40;
    const ratio = this.hp / this.maxHp;
    ctx.fillStyle = '#111';
    ctx.fillRect(20, 12, barW, 10);
    const grad = ctx.createLinearGradient(20, 0, 20 + barW * ratio, 0);
    grad.addColorStop(0, '#f00');
    grad.addColorStop(1, '#ff0');
    ctx.fillStyle = grad;
    ctx.fillRect(20, 12, barW * ratio, 10);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 12, barW, 10);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('BOSS', 22, 21);
    ctx.restore();
  }
}
