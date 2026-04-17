import { Character } from '../character.js';
import { Bullet } from '../bullet.js';

const CANVAS_W = 480;

export class Boss extends Character {
  constructor() {
    super(CANVAS_W / 2, -80, 100, 80, 1500);
    this.score = 5000;
    this.t = 0;
    this.shootTimer = 40;
    this.targetY = 110;
    this.vy = 1.5;
    this.angle = 0;      // for draw animation
    this.fanSide = 1;    // 1 = bottom-right fan, -1 = bottom-left fan
  }

  update(bullets, dt) {
    this.t += dt;
    this.angle += 0.02 * dt;

    if (this.y < this.targetY) {
      this.y += this.vy * dt;
      return;
    }

    this.x = CANVAS_W / 2 + Math.sin(this.t * 0.02) * 130;

    const hpRatio = this.hp / this.maxHp;
    // Frequency: interval 80→15 as HP drops
    const interval = Math.max(15, 80 * hpRatio);
    // Density: bullet count increases in 3 tiers
    const fanCount = hpRatio > 0.5 ? 7 : hpRatio > 0.25 ? 12 : 18;
    // Speed increases slightly as HP drops
    const spd = hpRatio > 0.5 ? 3.5 : 4.5;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      // Fan centered on bottom-right (π/4) or bottom-left (3π/4), spread ±37.5°
      const center = Math.PI / 2 + this.fanSide * (Math.PI / 4);
      const spread = Math.PI / 2.4; // 75° total
      for (let i = 0; i < fanCount; i++) {
        const a = center - spread / 2 + (i / (fanCount - 1)) * spread;
        bullets.push(new Bullet(this.x, this.y, Math.cos(a) * spd, Math.sin(a) * spd, false));
      }
      this.fanSide *= -1; // alternate side each burst
      this.shootTimer = interval;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const pulse    = Math.sin(this.t * 0.1) * 0.15 + 0.85;
    const hpRatio  = this.hp / this.maxHp;
    ctx.shadowColor = hpRatio < 0.5 ? '#f00' : '#f60';
    ctx.shadowBlur = 24 * pulse;

    ctx.fillStyle = hpRatio < 0.5 ? '#c22' : '#c62';
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
