import { Character } from '../character.js';
import { Bullet } from '../bullet.js';

const CANVAS_H = 640;

export class MediumEnemy extends Character {
  constructor(x, y, hpMult = 1) {
    super(x, y, 44, 38, 10, hpMult);
    this.score = 400;
    this.t = 0;
    this.baseX = x;
    this.vy = 0.8;
    this.shootTimer = 60;
    this.phase = 0;
  }

  update(bullets, dt) {
    this.t += dt;

    if (this.y < 120) {
      this.y += this.vy * dt;
    } else {
      this.phase = 1;
      this.x = this.baseX + Math.sin(this.t * 0.03) * 80;
      this.y += Math.sin(this.t * 0.05) * 0.5 * dt;
    }

    if (this.y > CANVAS_H + 60) this.dead = true;

    if (this.phase === 1) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        for (let a = -0.3; a <= 0.31; a += 0.3) {
          bullets.push(new Bullet(this.x, this.y + this.height / 2,
            Math.sin(a) * 4, Math.cos(a) * 4, false));
        }
        this.shootTimer = 70;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.shadowColor = '#a0f';
    ctx.shadowBlur = 14;
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
    const ratio = this.hp / this.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(-this.width / 2, -this.height / 2 - 8, this.width, 4);
    ctx.fillStyle = `hsl(${ratio * 120}, 100%, 50%)`;
    ctx.fillRect(-this.width / 2, -this.height / 2 - 8, this.width * ratio, 4);

    ctx.restore();
  }
}
