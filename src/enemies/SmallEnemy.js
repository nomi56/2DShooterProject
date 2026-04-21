import * as THREE from 'three';
import { Character } from '../character.js';
import { Bullet } from '../bullet.js';

const CANVAS_W = 480;
const CANVAS_H = 640;

export class SmallEnemy extends Character {
  constructor(scene, x, y, hpMult = 1) {
    super(x, y, 28, 24, 8, hpMult);
    this.score = 100;
    this.speed = (1.5 + Math.random()) * 0.25;
    this.vy    = this.speed;
    this.vx    = (Math.random() - 0.5) * 0.375;
    this.shootTimer = Math.floor(Math.random() * 80) + 60;
    this._scene    = scene;
    this._disposed = false;
    this._initMesh();
    scene.add(this.mesh);
  }

  _initMesh() {
    this.mesh = new THREE.Group();
    // Rotated 180° so it faces downward
    this.mesh.rotation.z = Math.PI;
    this.mesh.position.z = 0;

    const bodyShape = new THREE.Shape();
    bodyShape.moveTo(0, -this.height / 2);
    bodyShape.lineTo(this.width / 2, this.height / 2);
    bodyShape.lineTo(0, this.height * 0.2);
    bodyShape.lineTo(-this.width / 2, this.height / 2);
    bodyShape.closePath();
    this.mesh.add(new THREE.Mesh(
      new THREE.ShapeGeometry(bodyShape),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xff8844 }),
    ));

    const coreShape = new THREE.Shape();
    coreShape.absellipse(0, 0, 5, 8, 0, Math.PI * 2, false, 0);
    this.mesh.add(new THREE.Mesh(
      new THREE.ShapeGeometry(coreShape),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, color: 0xffccaa }),
    ));
  }

  update(bullets, dt, playerX = 240, playerY = 400, bulletSpeedMult = 1) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 20 || this.x > CANVAS_W - 20) this.vx *= -1;
    if (this.y > CANVAS_H + 40) this.dead = true;

    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      bullets.push(new Bullet(this._scene, this.x, this.y + this.height / 2, 0, 5 * bulletSpeedMult, false));
      this.shootTimer = 90;
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
