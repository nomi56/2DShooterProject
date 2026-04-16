import { Character } from '../character.js';
import { Bullet } from '../bullet.js';

const CANVAS_H = 640;

/** High-HP slow enemy that fires a wide 5-way spread. */
export class TankEnemy extends Character {
  constructor(x, y, hpMult = 1) {
    super(x, y, 52, 46, 25, hpMult);
    this.score = 600;
    this.vy = 0.5;
    this.baseX = x;
    this.t = 0;
    this.shootTimer = 80;
    this.phase = 0;
  }

  update(bullets, dt) {
    this.t += dt;

    if (this.y < 140) {
      this.y += this.vy * dt;
    } else {
      this.phase = 1;
      this.x = this.baseX + Math.sin(this.t * 0.015) * 60;
    }

    if (this.y > CANVAS_H + 60) this.dead = true;

    if (this.phase === 1) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        // 5-way spread
        for (let i = -2; i <= 2; i++) {
          const a = (i / 4) * 0.7;
          bullets.push(new Bullet(
            this.x, this.y + this.height / 2,
            Math.sin(a) * 3.5, Math.cos(a) * 3.5, false));
        }
        this.shootTimer = 95;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.shadowColor = '#4d4';
    ctx.shadowBlur = 14;

    // Outer hull
    ctx.fillStyle = '#264';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Armor plate
    ctx.fillStyle = '#396';
    ctx.fillRect(-this.width / 2 + 5, -this.height / 2 + 5, this.width - 10, this.height - 10);

    // Cannon barrel
    ctx.fillStyle = '#1a3';
    ctx.fillRect(-5, this.height / 2 - 10, 10, 18);

    // HP bar
    const ratio = this.hp / this.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(-this.width / 2, -this.height / 2 - 8, this.width, 4);
    ctx.fillStyle = `hsl(${ratio * 120}, 100%, 50%)`;
    ctx.fillRect(-this.width / 2, -this.height / 2 - 8, this.width * ratio, 4);

    ctx.restore();
  }
}
