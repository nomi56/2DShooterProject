import * as THREE from 'three';

export class Bullet {
  constructor(scene, x, y, vx, vy, isPlayer, power = 1) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.isPlayer = isPlayer; this.power = power; this.dead = false;
    this.width  = isPlayer ? 4  : 6;
    this.height = isPlayer ? 14 : 8;
    this._scene    = scene;
    this._inScene  = false;
    this._disposed = false;
    this._initMesh();
  }

  _initMesh() {
    const color = this.isPlayer ? 0x00ffff : 0xff4444;
    const mat = new THREE.MeshBasicMaterial({
      color,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const geo = this.isPlayer
      ? new THREE.PlaneGeometry(this.width, this.height)
      : new THREE.CircleGeometry(this.width / 2 + 1, 10);
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.z = 2;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  updateMesh() {
    this.mesh.position.set(this.x, this.y, 2);
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    if (this._inScene) this._scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }

  getBounds() {
    return { x: this.x - this.width / 2, y: this.y - this.height / 2, w: this.width, h: this.height };
  }
}
