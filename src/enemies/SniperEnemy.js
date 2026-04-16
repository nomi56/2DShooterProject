import { Character } from '../character.js';
import { Bullet } from '../bullet.js';

const CANVAS_H = 640;

/** Aims shots directly at the player position when firing. */
export class SniperEnemy extends Character {
  constructor(x, y) {
    super(x, y, 30, 28, 6);
    this.score = 200;
    this.targetY = 60 + Math.random() * 90;
    this.vy = 1.2;
    this.baseX = x;
    this.t = 0;
    this.shootTimer = 60 + Math.random() * 40;
    this.phase = 0; // 0 = entering, 1 = active
  }

  update(bullets, dt, playerX = 240, playerY = 400) {
    this.t += dt;

    if (this.phase === 0) {
      this.y += this.vy * dt;
      if (this.y >= this.targetY) {
        this.phase = 1;
        this.baseX = this.x;
      }
    } else {
      this.x  = this.baseX + Math.sin(this.t * 0.02) * 30;
      this.y += 0.12 * dt; // slowly drifts down
    }

    if (this.y > CANVAS_H + 40) this.dead = true;

    if (this.phase === 1) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const spd = 5;
        bullets.push(new Bullet(this.x, this.y,
          (dx / dist) * spd, (dy / dist) * spd, false));
        this.shootTimer = 90;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.shadowColor = '#f0a';
    ctx.shadowBlur = 12;

    // Diamond body
    ctx.fillStyle = '#b06';
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.lineTo(this.width / 2, 0);
    ctx.lineTo(0, this.height / 2);
    ctx.lineTo(-this.width / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    ctx.fillStyle = '#f4c';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
