import * as THREE from 'three';
import { Character } from '../character.js';
import { Bullet } from '../bullet.js';

const CANVAS_H = 640;

export class TankEnemy extends Character {
  constructor(scene, x, y, hpMult = 1) {
    super(x, y, 52, 46, 104, hpMult);
    this.score  = 600;
    this.vy     = 0.125;
    this.baseX  = x;
    this.t      = 0;
    this.shootTimer = 80;
    this.phase  = 0;
    this._scene    = scene;
    this._disposed = false;
    this._initMesh();
    scene.add(this.mesh);
  }

  _initMesh() {
    this.mesh = new THREE.Group();
    this.mesh.position.z = 0;

    // Outer hull
    this.mesh.add(new THREE.Mesh(
      new THREE.PlaneGeometry(this.width, this.height),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0x226644 }),
    ));

    // Armor plate
    const plateMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.width - 10, this.height - 10),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0x339966 }),
    );
    plateMesh.position.z = 0.1;
    this.mesh.add(plateMesh);

    // Cannon barrel
    const barrelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 18),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0x11aa33 }),
    );
    barrelMesh.position.set(0, this.height / 2 - 1, 0.2);
    this.mesh.add(barrelMesh);

    // HP bar background
    this._hpBgMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.width, 4),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0x333333 }),
    );
    this._hpBgMesh.position.set(0, -this.height / 2 - 8, 0.1);
    this.mesh.add(this._hpBgMesh);

    this._hpFgMat  = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0x00ff00 });
    this._hpFgMesh = new THREE.Mesh(new THREE.PlaneGeometry(this.width, 4), this._hpFgMat);
    this._hpFgMesh.position.set(0, -this.height / 2 - 8, 0.2);
    this.mesh.add(this._hpFgMesh);
  }

  update(bullets, dt, playerX = 240, playerY = 400, bulletSpeedMult = 1) {
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
        for (let i = -2; i <= 2; i++) {
          const a = (i / 4) * 0.7;
          const spd = 3.5 * bulletSpeedMult;
          bullets.push(new Bullet(this._scene,
            this.x, this.y + this.height / 2,
            Math.sin(a) * spd, Math.cos(a) * spd, false));
        }
        this.shootTimer = 95;
      }
    }
  }

  updateMesh() {
    this.mesh.position.set(this.x, this.y, 0);
    const ratio = this.hp / this.maxHp;
    this._hpFgMesh.scale.x = ratio;
    this._hpFgMesh.position.x = this.width * (ratio - 1) / 2;
    this._hpFgMat.color.setHSL(ratio * 120 / 360, 1, 0.5);
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
