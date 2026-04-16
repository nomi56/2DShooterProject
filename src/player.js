import { Bullet } from './bullet.js';

const CANVAS_W = 480;
const CANVAS_H = 640;
const SPEED = 4;
const SHOOT_INTERVAL = 12; // frames

export class Player {
  constructor() {
    this.x = CANVAS_W / 2;
    this.y = CANVAS_H - 80;
    this.width = 32;
    this.height = 36;
    this.lives = 3;
    this.invincible = 0; // invincibility frames after hit
    this.shootTimer = 0;
    this.powerLevel = 1; // 1–3
    this.dead = false;
    this.score = 0;

    // Input state
    this.keys = {};
    this.mouse = null;
    this.shooting = false;

    // Touch state
    this._touchActive = false;
    this._lastTouchX = 0;
    this._lastTouchY = 0;

    this._bindInput();
  }

  _bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') this.shooting = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space') this.shooting = false;
    });

    const canvas = document.getElementById('gameCanvas');

    // Mouse
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      this.mouse = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    });
    canvas.addEventListener('mousedown', () => { this.shooting = true; });
    canvas.addEventListener('mouseup', () => { this.shooting = false; });
    canvas.addEventListener('mouseleave', () => { this.mouse = null; });

    // Touch — swipe delta movement, auto-fire while touching
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      this._lastTouchX = (t.clientX - rect.left) * scaleX;
      this._lastTouchY = (t.clientY - rect.top)  * scaleY;
      this._touchActive = true;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const cx = (t.clientX - rect.left) * scaleX;
      const cy = (t.clientY - rect.top)  * scaleY;
      this.x += cx - this._lastTouchX;
      this.y += cy - this._lastTouchY;
      this._lastTouchX = cx;
      this._lastTouchY = cy;
    }, { passive: false });

    const endTouch = (e) => {
      e.preventDefault();
      this._touchActive = false;
    };
    canvas.addEventListener('touchend',    endTouch, { passive: false });
    canvas.addEventListener('touchcancel', endTouch, { passive: false });
  }

  update(bullets) {
    // Touch: delta-move already applied in event; just clamp and auto-fire
    if (this._touchActive) {
      this.shooting = true;
    } else if (this.mouse) {
      // Mouse follow
      const dx = this.mouse.x - this.x;
      const dy = this.mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        const spd = Math.min(SPEED * 2, dist);
        this.x += (dx / dist) * spd;
        this.y += (dy / dist) * spd;
      }
    } else {
      // Keyboard
      if (this.keys['ArrowLeft']  || this.keys['KeyA']) this.x -= SPEED;
      if (this.keys['ArrowRight'] || this.keys['KeyD']) this.x += SPEED;
      if (this.keys['ArrowUp']    || this.keys['KeyW']) this.y -= SPEED;
      if (this.keys['ArrowDown']  || this.keys['KeyS']) this.y += SPEED;
      // Auto-shoot when using keyboard
      this.shooting = true;
    }

    // Clamp
    this.x = Math.max(this.width / 2, Math.min(CANVAS_W - this.width / 2, this.x));
    this.y = Math.max(this.height / 2, Math.min(CANVAS_H - this.height / 2, this.y));

    if (this.invincible > 0) this.invincible--;

    // Shoot
    if (this.shooting) {
      this.shootTimer--;
      if (this.shootTimer <= 0) {
        this._fire(bullets);
        this.shootTimer = SHOOT_INTERVAL;
      }
    }
  }

  _fire(bullets) {
    const bx = this.x;
    const by = this.y - this.height / 2;
    bullets.push(new Bullet(bx, by, 0, -12, true, 1));
    if (this.powerLevel >= 2) {
      bullets.push(new Bullet(bx - 14, by, -0.5, -11.5, true, 1));
      bullets.push(new Bullet(bx + 14, by,  0.5, -11.5, true, 1));
    }
    if (this.powerLevel >= 3) {
      bullets.push(new Bullet(bx - 26, by, -1, -11, true, 1));
      bullets.push(new Bullet(bx + 26, by,  1, -11, true, 1));
    }
  }

  hit() {
    if (this.invincible > 0) return;
    this.lives--;
    this.invincible = 120;
    if (this.lives <= 0) this.dead = true;
  }

  getBounds() {
    // Tighter hitbox
    const hw = this.width * 0.35;
    const hh = this.height * 0.4;
    return { x: this.x - hw, y: this.y - hh, w: hw * 2, h: hh * 2 };
  }

  draw(ctx) {
    if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Engine glow
    ctx.shadowColor = '#08f';
    ctx.shadowBlur = 18;

    // Body
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.lineTo(this.width / 2, this.height / 2);
    ctx.lineTo(0, this.height * 0.3);
    ctx.lineTo(-this.width / 2, this.height / 2);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#aef';
    ctx.beginPath();
    ctx.ellipse(0, -4, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Engine flame
    ctx.shadowColor = '#fa0';
    ctx.shadowBlur = 14;
    ctx.fillStyle = `hsl(${40 + Math.random() * 20}, 100%, 60%)`;
    ctx.beginPath();
    ctx.moveTo(-8, this.height / 2);
    ctx.lineTo(8, this.height / 2);
    ctx.lineTo(0, this.height / 2 + 10 + Math.random() * 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
