import * as THREE from 'three';
import { Character } from './character.js';
import { Bullet } from './bullet.js';

const CANVAS_W = 480;
const CANVAS_H = 640;
const SPEED = 4;

const FIRE_RATE_INTERVALS = [12, 10, 8, 6, 5, 4, 3, 2.5, 2, 1.5];
const BULLET_SPEED_MULTS  = [1.0, 1.3, 1.6, 1.9, 2.2, 2.5, 2.8, 3.1, 3.4, 3.7];

export class Player extends Character {
  constructor(scene) {
    super(CANVAS_W / 2, CANVAS_H - 80, 32, 36, 3);
    this._scene        = scene;
    this._disposed     = false;
    this.invincible    = 0;
    this.shootTimer    = 0;
    this.powerLevel       = 1;
    this.fireRateLevel    = 1;
    this.bulletSpeedLevel = 1;
    this.keys     = {};
    this.mouse    = null;
    this.shooting = false;
    this._touchActive = false;
    this._lastTouchX  = 0;
    this._lastTouchY  = 0;
    this._initMesh();
    scene.add(this.mesh);
    this._bindInput();
  }

  get lives()          { return this.hp; }
  get shootInterval()  { return FIRE_RATE_INTERVALS[this.fireRateLevel - 1]; }
  get bulletSpeedMult(){ return BULLET_SPEED_MULTS[this.bulletSpeedLevel - 1]; }

  _initMesh() {
    this.mesh = new THREE.Group();
    this.mesh.position.z = 5;

    // Main body triangle
    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(0, -this.height / 2);
    bodyShape.lineTo(this.width / 2, this.height / 2);
    bodyShape.lineTo(0, this.height * 0.3);
    bodyShape.lineTo(-this.width / 2, this.height / 2);
    bodyShape.closePath();
    this._bodyMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(bodyShape),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0x44aaff }),
    );
    this.mesh.add(this._bodyMesh);

    // Cockpit ellipse
    const cockpitShape = new THREE.Shape();
    cockpitShape.absellipse(0, -4, 6, 10, 0, Math.PI * 2, false, 0);
    this._cockpitMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(cockpitShape),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xaaeeff }),
    );
    this._cockpitMesh.position.z = 0.1;
    this.mesh.add(this._cockpitMesh);

    // Thruster flame
    const flameShape = new THREE.Shape();
    flameShape.moveTo(-8, this.height / 2);
    flameShape.lineTo(8,  this.height / 2);
    flameShape.lineTo(0,  this.height / 2 + 14);
    flameShape.closePath();
    this._flameMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide,
      color: 0xffaa00,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    this._flameMesh = new THREE.Mesh(new THREE.ShapeGeometry(flameShape), this._flameMat);
    this._flameMesh.position.z = -0.1;
    this.mesh.add(this._flameMesh);
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

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse = {
        x: (e.clientX - rect.left) * (CANVAS_W / rect.width),
        y: (e.clientY - rect.top)  * (CANVAS_H / rect.height),
      };
    });
    canvas.addEventListener('mousedown',  () => { this.shooting = true; });
    canvas.addEventListener('mouseup',    () => { this.shooting = false; });
    canvas.addEventListener('mouseleave', () => { this.mouse = null; });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      this._lastTouchX = (t.clientX - rect.left) * (CANVAS_W / rect.width);
      this._lastTouchY = (t.clientY - rect.top)  * (CANVAS_H / rect.height);
      this._touchActive = true;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      const cx = (t.clientX - rect.left) * (CANVAS_W / rect.width);
      const cy = (t.clientY - rect.top)  * (CANVAS_H / rect.height);
      this.x += (cx - this._lastTouchX) * 2;
      this.y += (cy - this._lastTouchY) * 2;
      this._lastTouchX = cx;
      this._lastTouchY = cy;
    }, { passive: false });

    const endTouch = (e) => { e.preventDefault(); this._touchActive = false; };
    canvas.addEventListener('touchend',    endTouch, { passive: false });
    canvas.addEventListener('touchcancel', endTouch, { passive: false });
  }

  update(bullets, dt) {
    if (this._touchActive) {
      this.shooting = true;
    } else if (this.mouse) {
      const dx = this.mouse.x - this.x;
      const dy = this.mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        const spd = Math.min(SPEED * 2, dist) * dt;
        this.x += (dx / dist) * spd;
        this.y += (dy / dist) * spd;
      }
    } else {
      if (this.keys['ArrowLeft']  || this.keys['KeyA']) this.x -= SPEED * dt;
      if (this.keys['ArrowRight'] || this.keys['KeyD']) this.x += SPEED * dt;
      if (this.keys['ArrowUp']    || this.keys['KeyW']) this.y -= SPEED * dt;
      if (this.keys['ArrowDown']  || this.keys['KeyS']) this.y += SPEED * dt;
      this.shooting = true;
    }

    this.x = Math.max(this.width / 2, Math.min(CANVAS_W - this.width / 2, this.x));
    this.y = Math.max(this.height / 2, Math.min(CANVAS_H - this.height / 2, this.y));

    if (this.invincible > 0) this.invincible -= dt;

    if (this.shooting) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this._fire(bullets);
        this.shootTimer = this.shootInterval;
      }
    }
  }

  _fire(bullets) {
    const bx         = this.x;
    const by         = this.y - this.height / 2;
    const spd        = this.bulletSpeedMult;
    const count      = this.powerLevel;
    const halfSpread = (count - 1) * 0.035; // Lv1=0rad, Lv10=0.315rad(18°)

    for (let i = 0; i < count; i++) {
      const t     = count === 1 ? 0 : (i / (count - 1)) * 2 - 1; // -1..1
      const angle = t * halfSpread;
      const vx    =  12 * spd * Math.sin(angle);
      const vy    = -12 * spd * Math.cos(angle);
      bullets.push(new Bullet(this._scene, bx, by, vx, vy, true, spd));
    }
  }

  hit() {
    if (this.invincible > 0) return;
    this.hp--;
    this.invincible = 120;
    if (this.hp <= 0) this.dead = true;
  }

  getBounds() {
    const hw = this.width * 0.35 * (2 / 3) * (2 / 3);
    const hh = this.height * 0.4 * (2 / 3) * (2 / 3);
    return { x: this.x - hw, y: this.y - hh, w: hw * 2, h: hh * 2 };
  }

  updateMesh() {
    this.mesh.visible = !(this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0);
    this.mesh.position.set(this.x, this.y, 5);
    // Animate flame color
    this._flameMat.color.setHSL((40 + Math.random() * 20) / 360, 1, 0.6);
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._scene.remove(this.mesh);
    this.mesh.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
}
