export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4 - 1;
    this.radius = Math.random() * 4 + 1;
    this.color = color || `hsl(${Math.random() * 60 + 10}, 100%, 60%)`;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.02;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 0.05 * dt;
    this.alpha -= this.decay * dt;
    if (this.alpha <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function spawnExplosion(particles, x, y, count = 18, color) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}
