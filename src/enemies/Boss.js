import { Character } from '../character.js';
import { Bullet } from '../bullet.js';

const CANVAS_W = 480;

export class Boss extends Character {
  constructor() {
    super(CANVAS_W / 2, -80, 100, 80, 750);
    this.score = 5000;
    this.t = 0;
    this.phase = 0;
    this.shootTimer = 40;
    this.targetY = 110;
    this.vy = 1.5;
    this.angle = 0;
  }

  update(bullets, dt) {
    this.t += dt;
    this.angle += 0.02 * dt;

    if (this.y < this.targetY) {
      this.y += this.vy * dt;
      return;
    }

    this.phase = this.hp < this.maxHp / 2 ? 2 : 1;
    this.x = CANVAS_W / 2 + Math.sin(this.t * 0.02) * 130;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      if (this.phase === 1) {
        const count = 100;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          bullets.push(new Bullet(this.x, this.y, Math.cos(a) * 3, Math.sin(a) * 3, false));
        }
        this.shootTimer = 80;
      } else {
        const count = 160;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + this.angle;
          bullets.push(new Bullet(this.x, this.y, Math.cos(a) * 4, Math.sin(a) * 4, false));
        }
        this.shootTimer = 50;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse = Math.sin(this.t * 0.1) * 0.15 + 0.85;
    ctx.shadowColor = this.phase === 2 ? '#f00' : '#f60';
    ctx.shadowBlur = 24 * pulse;

    ctx.fillStyle = this.phase === 2 ? '#c22' : '#c62';
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

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
