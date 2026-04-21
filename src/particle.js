import * as THREE from 'three';

export class Particle {
  constructor(scene, x, y, color, speedMult = 1) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 4 * speedMult;
    this.vy = ((Math.random() - 0.5) * 4 - 1) * speedMult;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.02;
    this.dead  = false;
    this._scene    = scene;
    this._inScene  = false;
    this._disposed = false;

    const c   = new THREE.Color(color || `hsl(${Math.random() * 60 + 10},100%,60%)`);
    const r   = Math.random() * 4 + 1;
    const geo = new THREE.CircleGeometry(r, 8);
    this._mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide,
      color: c,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });
    this.mesh = new THREE.Mesh(geo, this._mat);
    this.mesh.position.z = 3;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 0.05 * dt;
    this.alpha -= this.decay * dt;
    if (this.alpha <= 0) this.dead = true;
  }

  updateMesh() {
    this.mesh.position.set(this.x, this.y, 3);
    this._mat.opacity = Math.max(0, this.alpha);
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    if (this._inScene) this._scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this._mat.dispose();
  }
}

export function spawnExplosion(scene, particles, x, y, count = 18, color, speedMult = 1) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(scene, x, y, color, speedMult));
  }
}
