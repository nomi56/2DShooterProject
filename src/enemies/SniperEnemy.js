import * as THREE from 'three';
import { Character } from '../character.js';
import { Bullet } from '../bullet.js';

const CANVAS_H = 640;

export class SniperEnemy extends Character {
  constructor(scene, x, y, hpMult = 1) {
    super(x, y, 30, 28, 24, hpMult);
    this.score   = 200;
    this.targetY = 60 + Math.random() * 90;
    this.vy      = 0.3;
    this.baseX   = x;
    this.t       = 0;
    this.shootTimer = 60 + Math.random() * 40;
    this.phase   = 0;
    this._scene    = scene;
    this._disposed = false;
    this._initMesh();
    scene.add(this.mesh);
  }

  _initMesh() {
    this.mesh = new THREE.Group();
    this.mesh.position.z = 0;

    // Diamond body
    const diamondShape = new THREE.Shape();
    diamondShape.moveTo(0, -this.height / 2);
    diamondShape.lineTo(this.width / 2, 0);
    diamondShape.lineTo(0, this.height / 2);
    diamondShape.lineTo(-this.width / 2, 0);
    diamondShape.closePath();
    this.mesh.add(new THREE.Mesh(
      new THREE.ShapeGeometry(diamondShape),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xbb0066 }),
    ));

    // Inner highlight
    this.mesh.add(new THREE.Mesh(
      new THREE.CircleGeometry(5, 12),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xff44cc }),
    ));
  }

  update(bullets, dt, playerX = 240, playerY = 400, bulletSpeedMult = 1, fireRateMult = 1) {
    this.t += dt;

    if (this.phase === 0) {
      this.y += this.vy * dt;
      if (this.y >= this.targetY) {
        this.phase = 1;
        this.baseX = this.x;
      }
    } else {
      this.x  = this.baseX + Math.sin(this.t * 0.02) * 30;
      this.y += 0.12 * dt;
    }

    if (this.y > CANVAS_H + 40) this.dead = true;

    if (this.phase === 1) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        const dx   = playerX - this.x;
        const dy   = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const spd  = 5 * bulletSpeedMult;
        bullets.push(new Bullet(this._scene, this.x, this.y,
          (dx / dist) * spd, (dy / dist) * spd, false));
        this.shootTimer = 90 * fireRateMult;
      }
    }
  }

  updateMesh() {
    this.mesh.position.set(this.x, this.y, 0);
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
