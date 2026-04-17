import * as THREE from 'three';
import { Character } from '../character.js';
import { Bullet } from '../bullet.js';

const CANVAS_H = 640;

export class MediumEnemy extends Character {
  constructor(scene, x, y, hpMult = 1) {
    super(x, y, 44, 38, 5, hpMult);
    this.score  = 400;
    this.t      = 0;
    this.baseX  = x;
    this.vy     = 0.8;
    this.shootTimer = 60;
    this.phase  = 0;
    this._scene    = scene;
    this._disposed = false;
    this._initMesh();
    scene.add(this.mesh);
  }

  _initMesh() {
    this.mesh = new THREE.Group();
    this.mesh.position.z = 0;

    // Hexagon body
    const hexShape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const r = this.width / 2;
      if (i === 0) hexShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else hexShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    hexShape.closePath();
    this._bodyMesh = new THREE.Mesh(
      new THREE.ShapeGeometry(hexShape),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0x8844cc }),
    );
    this.mesh.add(this._bodyMesh);

    // Core circle
    this.mesh.add(new THREE.Mesh(
      new THREE.CircleGeometry(10, 16),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xdd88ff }),
    ));

    // HP bar
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
          bullets.push(new Bullet(this._scene, this.x, this.y + this.height / 2,
            Math.sin(a) * 4, Math.cos(a) * 4, false));
        }
        this.shootTimer = 70;
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
