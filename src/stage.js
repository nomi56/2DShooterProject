import * as THREE from 'three';
import { SmallEnemy, MediumEnemy, Boss, SniperEnemy, TankEnemy } from './enemies/index.js';

const CANVAS_W  = 480;
const CANVAS_H  = 640;
const STAR_COUNT = 120;

// ─── Powerup item ─────────────────────────────────────────────────────────────
const POWERUP_COLORS = { power: 0xffff00, rate: 0x00ffff, speed: 0xff8800 };
const POWERUP_LABELS = { power: 'P', rate: 'R', speed: 'S' };

export class PowerUp {
  constructor(scene, x, y, type = 'power') {
    this.x = x; this.y = y;
    this.type  = type;
    this.vy    = 1.5;
    this.dead  = false;
    this.t     = 0;
    this._scene    = scene;
    this._disposed = false;
    this._initMesh();
    scene.add(this.mesh);
  }

  _initMesh() {
    this.mesh = new THREE.Group();
    this.mesh.position.z = 4;
    const color = POWERUP_COLORS[this.type];
    const mat   = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide,
      color,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
    });

    let shape;
    if (this.type === 'rate') {
      shape = new THREE.Shape();
      shape.absarc(0, 0, 9, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, 7, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    } else if (this.type === 'speed') {
      shape = new THREE.Shape();
      shape.moveTo(0, -9); shape.lineTo(9, 0);
      shape.lineTo(0, 9);  shape.lineTo(-9, 0);
      shape.closePath();
      const hole = new THREE.Path();
      hole.moveTo(0, -6); hole.lineTo(6, 0);
      hole.lineTo(0, 6);  hole.lineTo(-6, 0);
      hole.closePath();
      shape.holes.push(hole);
    } else {
      shape = new THREE.Shape();
      shape.moveTo(-8, -8); shape.lineTo(8, -8);
      shape.lineTo(8, 8);   shape.lineTo(-8, 8);
      shape.closePath();
      const hole = new THREE.Path();
      hole.moveTo(-6, -6); hole.lineTo(6, -6);
      hole.lineTo(6, 6);   hole.lineTo(-6, 6);
      hole.closePath();
      shape.holes.push(hole);
    }
    this._outlineMesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat);
    this.mesh.add(this._outlineMesh);

    // Label via canvas texture
    const lc = document.createElement('canvas');
    lc.width = 32; lc.height = 32;
    const lctx = lc.getContext('2d');
    lctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    lctx.font = 'bold 18px monospace';
    lctx.textAlign = 'center';
    lctx.textBaseline = 'middle';
    lctx.fillText(POWERUP_LABELS[this.type], 16, 16);
    this._labelTex  = new THREE.CanvasTexture(lc);
    this._labelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: this._labelTex, transparent: true }),
    );
    this._labelMesh.position.z = 0.1;
    this.mesh.add(this._labelMesh);
  }

  update(dt) {
    this.y += this.vy * dt;
    this.t += dt;
    if (this.y > CANVAS_H + 20) this.dead = true;
  }

  updateMesh() {
    this.mesh.position.set(this.x, this.y, 4);
    this._outlineMesh.rotation.z = this.t * 0.05;
  }

  getBounds() { return { x: this.x - 10, y: this.y - 10, w: 20, h: 20 }; }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._scene.remove(this.mesh);
    this.mesh.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (obj.material.map) obj.material.map.dispose();
        obj.material.dispose();
      }
    });
  }
}

// ─── Wave definitions ─────────────────────────────────────────────────────────
function buildWaves() {
  const waves = [];
  const remap = f => Math.round((f < 700
    ? f * 5
    : (f - 700) * (1700 / 1900) + 3500) * 1.5);
  const add = (frame, type, x, y, waitClear = false) => waves.push({ frame: remap(frame), type, x, y, waitClear });

  // ── Phase 1: Small only (orig 60–633) ────────────────────────────────────
  for (let i = 0; i < 6; i++) add( 60 + i * 30, 'small',  60 + i * 70, -30);
  for (let i = 0; i < 4; i++) add(232 + i * 18, 'small',  80 + i * 90, -30);
  for (let i = 0; i < 6; i++) add(300 + i * 25, 'small',  80 + i * 60, -30);
  for (let i = 0; i < 4; i++) add(436 + i * 18, 'small',  90 + i * 85, -30);
  for (let i = 0; i < 5; i++) add(520 + i * 20, 'small', 100 + i * 70, -30);
  for (let i = 0; i < 2; i++) add(615 + i * 18, 'small', 120 + i * 240, -30);

  // ── Phase 2: Medium area (orig 650–1270, ×2 intervals) ───────────────────
  add(650,  'medium', 160, -50);
  add(770,  'medium', 320, -50);
  for (let i = 0; i < 8; i++) add( 950 + i * 40, 'small', 40 + i * 55, -30);
  add(1270, 'medium', 240, -50);

  // ── Phase 3: Sniper area (orig 1280–2140, ×2 intervals, waitClear) ───────
  add(1280, 'sniper', 120, -40, true);  // wait for medium to clear
  add(1400, 'sniper', 360, -40);                                    // +120 (was +60)
  for (let i = 0; i < 6; i++) add(1580 + i * 50, 'small', 60 + i * 72, -30); // +300 step 50 (was +150 step 25)
  add(1880, 'sniper', 200, -40);                                    // +600 (was +300)
  add(1880, 'medium', 350, -50);
  add(2020, 'sniper', 300, -40);                                    // +740 (was +370)
  add(2140, 'medium', 130, -50);                                    // +860 (was +430)

  // ── Phase 4: Tank area (orig 2150–2950, ×2 intervals, waitClear) ─────────
  add(2150, 'tank',   240, -60, true);  // wait for sniper area to clear
  for (let i = 0; i < 6; i++) add(2290 + i * 56, 'small',  50 + i * 76, -30); // +140 step 56 (was +70 step 28)
  add(2550, 'sniper', 130, -40);                                    // +400 (was +200)
  add(2550, 'sniper', 350, -40);
  add(2790, 'tank',   150, -60);                                    // +640 (was +320)
  add(2790, 'tank',   330, -60);
  add(2950, 'medium', 240, -50);                                    // +800 (was +400)

  // ── Boss ──────────────────────────────────────────────────────────────────
  add(3000, 'boss', 240, -90, true);

  return waves.sort((a, b) => a.frame - b.frame);
}

const BOSS_FRAME  = 9000;
const DENSITY_CAP = { small: 8, medium: 3, sniper: 2, tank: 2 };

// ─── Stage manager ────────────────────────────────────────────────────────────
export class Stage {
  constructor(scene) {
    this._scene      = scene;
    this.enemies     = [];
    this.powerUps    = [];
    this.frame       = 0;
    this.waves       = buildWaves();
    this.waveIdx     = 0;
    this.bossSpawned = false;
    this.cleared     = false;
    this._killCount  = 0;
    this._initStars();
  }

  _initStars() {
    const positions = new Float32Array(STAR_COUNT * 3);
    this._starSpeeds = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      const size = Math.random() * 2 + 0.3;
      positions[i * 3]     = Math.random() * CANVAS_W;
      positions[i * 3 + 1] = Math.random() * CANVAS_H;
      positions[i * 3 + 2] = -10;
      this._starSpeeds[i]  = size * 0.8 + 0.4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._starGeo    = geo;
    this._starPoints = new THREE.Points(geo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 2.5, sizeAttenuation: false, transparent: true, opacity: 0.8 }),
    );
    this._scene.add(this._starPoints);
  }

  updateStars(dt) {
    const pos = this._starGeo.attributes.position.array;
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3 + 1] += this._starSpeeds[i] * dt;
      if (pos[i * 3 + 1] > CANVAS_H + 2) {
        pos[i * 3]     = Math.random() * CANVAS_W;
        pos[i * 3 + 1] = -2;
      }
    }
    this._starGeo.attributes.position.needsUpdate = true;
  }

  get boss() {
    return this.enemies.find(e => e._isBoss) || null;
  }

  _bulletSpeedMult() {
    const progress = Math.min(1, this.frame / BOSS_FRAME);
    if (progress < 0.5) return 0.25;
    return 0.25 + (progress - 0.5) * 2 * 0.75;
  }

  _fireRateMult() {
    const progress = Math.min(1, this.frame / BOSS_FRAME);
    return 4.0 - progress * 3.0; // 序盤4倍(1/4頻度)→終盤1倍(通常)
  }

  _difficultyMult() {
    const q = Math.min(3, Math.floor((this.frame / BOSS_FRAME) * 4));
    return Math.pow(2, q);
  }

  _densityMult() {
    const q = Math.min(3, Math.floor((this.frame / BOSS_FRAME) * 4));
    return [1, 2, 3, 5][q];
  }

  _spawnWave(w) {
    const hpMult  = this._difficultyMult();
    const density = Math.min(DENSITY_CAP[w.type] ?? 1, this._densityMult());
    for (let d = 0; d < density; d++) {
      const x = density === 1 ? w.x : Math.round((d + 0.5) * (CANVAS_W / density));
      let e;
      switch (w.type) {
        case 'small':  e = new SmallEnemy (this._scene, x, w.y, hpMult); break;
        case 'medium': e = new MediumEnemy(this._scene, x, w.y, hpMult); break;
        case 'sniper': e = new SniperEnemy(this._scene, x, w.y, hpMult); break;
        case 'tank':   e = new TankEnemy  (this._scene, x, w.y, hpMult); break;
        case 'boss':   e = new Boss(this._scene); this.bossSpawned = true; break;
      }
      if (e) this.enemies.push(e);
    }
  }

  update(bullets, spawnExplosion, particles, dt, playerX = 240, playerY = 400) {
    this.frame += dt;

    while (this.waveIdx < this.waves.length && this.waves[this.waveIdx].frame <= this.frame) {
      const w = this.waves[this.waveIdx];
      if (w.waitClear && this.enemies.length > 0) break;
      this._spawnWave(this.waves[this.waveIdx++]);
    }

    const bsMult = this._bulletSpeedMult();
    const frMult = this._fireRateMult();
    const dead = [];
    for (const e of this.enemies) {
      e.update(bullets, dt, playerX, playerY, bsMult, frMult);
      if (e.dead) dead.push(e);
    }
    for (const e of dead) {
      spawnExplosion(this._scene, particles, e.x, e.y, e._isBoss ? 60 : 20, e._isBoss ? '#f60' : '#fa0');
      this._killCount++;
      if (e._isBoss || this._killCount % 4 === 0) {
        const types = ['power', 'rate', 'speed'];
        this.powerUps.push(new PowerUp(this._scene, e.x, e.y, types[Math.floor(Math.random() * 3)]));
      }
      e.dispose();
    }
    this.enemies = this.enemies.filter(e => !e.dead);

    for (const pu of this.powerUps) pu.update(dt);
    for (const pu of this.powerUps.filter(p => p.dead)) pu.dispose();
    this.powerUps = this.powerUps.filter(p => !p.dead);

    if (this.bossSpawned && this.enemies.length === 0 && !this.cleared) {
      this.cleared = true;
    }
  }

  clearEnemies() {
    for (const e of this.enemies) e.dispose();
    this.enemies = [];
  }

  spawnEnemy(type) {
    this.clearEnemies();
    const cx = CANVAS_W / 2;
    let e;
    switch (type) {
      case 'small':  e = new SmallEnemy (this._scene, cx,  80, 1); break;
      case 'medium': e = new MediumEnemy(this._scene, cx,  80, 1); break;
      case 'sniper': e = new SniperEnemy(this._scene, cx,  80, 1); break;
      case 'tank':   e = new TankEnemy  (this._scene, cx, -60, 1); break;
      case 'boss':   e = new Boss(this._scene);                    break;
    }
    if (e) this.enemies.push(e);
  }

  updateMeshes() {
    for (const e  of this.enemies)  e.updateMesh();
    for (const pu of this.powerUps) pu.updateMesh();
  }

  dispose() {
    this._scene.remove(this._starPoints);
    this._starGeo.dispose();
    this._starPoints.material.dispose();
    for (const e  of this.enemies)  e.dispose();
    for (const pu of this.powerUps) pu.dispose();
    this.enemies  = [];
    this.powerUps = [];
  }
}
