import { Character } from '../character.js';
import { Bullet } from '../bullet.js';

const CANVAS_W = 480;
const CANVAS_H = 640;

export class SmallEnemy extends Character {
  constructor(x, y, hpMult = 1) {
    super(x, y, 28, 24, 1, hpMult);
    this.score = 100;
    this.speed = 1.5 + Math.random();
    this.vy = this.speed;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.shootTimer = Math.floor(Math.random() * 80) + 60;
  }

  update(bullets, dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 20 || this.x > CANVAS_W - 20) this.vx *= -1;
    if (this.y > CANVAS_H + 40) this.dead = true;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      bullets.push(new Bullet(this.x, this.y + this.height / 2, 0, 5, false));
      this.shootTimer = 90;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI);

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
