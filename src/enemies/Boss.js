import * as THREE from 'three';
import { Character } from '../character.js';
import { Bullet } from '../bullet.js';

const CANVAS_W = 480;

export class Boss extends Character {
  constructor(scene) {
    super(CANVAS_W / 2, -80, 100, 80, 7500);
    this._isBoss   = true;
    this.score     = 5000;
    this.t         = 0;
    this.shootTimer = 40;
    this.targetY   = 110;
    this.vy        = 1.5;
    this.fanSide   = 1;
    this._scene    = scene;
    this._disposed = false;
    this._initMesh();
    scene.add(this.mesh);
  }

  _initMesh() {
    this.mesh = new THREE.Group();
    this.mesh.position.z = 0;

    // Ellipse body
    const bodyShape = new THREE.Shape();
    bodyShape.absellipse(0, 0, this.width / 2, this.height / 2, 0, Math.PI * 2, false, 0);
    this._bodyMat  = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xcc6622 });
    this._bodyMesh = new THREE.Mesh(new THREE.ShapeGeometry(bodyShape), this._bodyMat);
    this.mesh.add(this._bodyMesh);

    // Left wing
    const lwShape = new THREE.Shape();
    lwShape.moveTo(-this.width / 2, 0);
    lwShape.lineTo(-this.width * 0.9, -20);
    lwShape.lineTo(-this.width * 0.9, 30);
    lwShape.closePath();
    this.mesh.add(new THREE.Mesh(
      new THREE.ShapeGeometry(lwShape),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xaa4444 }),
    ));

    // Right wing
    const rwShape = new THREE.Shape();
    rwShape.moveTo(this.width / 2, 0);
    rwShape.lineTo(this.width * 0.9, -20);
    rwShape.lineTo(this.width * 0.9, 30);
    rwShape.closePath();
    this.mesh.add(new THREE.Mesh(
      new THREE.ShapeGeometry(rwShape),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xaa4444 }),
    ));

    // Animated core
    this._coreMat  = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide,
      color: 0xff0000,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    this._coreMesh = new THREE.Mesh(new THREE.CircleGeometry(18, 16), this._coreMat);
    this._coreMesh.position.z = 0.2;
    this.mesh.add(this._coreMesh);
  }

  update(bullets, dt, playerX = 240, playerY = 500) {
    this.t += dt;

    if (this.y < this.targetY) {
      this.y += this.vy * dt;
      return;
    }

    this.x = CANVAS_W / 2 + Math.sin(this.t * 0.02) * 130;

    const hpRatio  = this.hp / this.maxHp;
    const interval = Math.max(15, 80 * hpRatio);
    const fanCount = hpRatio > 0.5 ? 7 : hpRatio > 0.25 ? 12 : 18;
    const spd      = hpRatio > 0.5 ? 3.5 : 4.5;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      const fireX    = CANVAS_W / 2 + this.fanSide * 150;
      const fireY    = this.y;
      const aimAngle = Math.atan2(playerY - fireY, playerX - fireX);
      const spread   = Math.PI / 2.4;
      for (let i = 0; i < fanCount; i++) {
        const a = aimAngle - spread / 2 + (i / (fanCount - 1)) * spread;
        bullets.push(new Bullet(this._scene, fireX, fireY, Math.cos(a) * spd, Math.sin(a) * spd, false));
      }
      this.fanSide    *= -1;
      this.shootTimer  = interval;
    }
  }

  updateMesh() {
    this.mesh.position.set(this.x, this.y, 0);
    const hpRatio = this.hp / this.maxHp;
    this._bodyMat.color.setHex(hpRatio < 0.5 ? 0xcc2222 : 0xcc6622);
    this._coreMat.color.setHSL((this.t * 4 % 360) / 360, 1, 0.7);
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
