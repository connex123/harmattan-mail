// Merge many primitives into ONE vertex-coloured mesh (few draw calls under SwiftShader).
import * as THREE from 'three';
import { mulberry32 } from './rng.js';

const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _c = new THREE.Color();
export const litMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
export const flatMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });

export class MeshBuilder {
  constructor(seed = 7) { this.pos = []; this.nor = []; this.col = []; this.rng = mulberry32(seed); }
  add(geo, o = {}) {
    const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, color = 0xffffff, jitter = 0.06 } = o;
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e);
    _m.compose(new THREE.Vector3(x, y, z), _q, new THREE.Vector3(sx, sy, sz));
    g.applyMatrix4(_m);
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    _c.set(color);
    const f = 1 + (this.rng() - 0.5) * 2 * jitter;
    for (let i = 0; i < p.length; i += 3) {
      this.pos.push(p[i], p[i + 1], p[i + 2]); this.nor.push(n[i], n[i + 1], n[i + 2]);
      this.col.push(_c.r * f, _c.g * f, _c.b * f);
    }
    g.dispose();
    return this;
  }
  box(w, h, d, o) { return this.add(new THREE.BoxGeometry(w, h, d), o); }
  cyl(rt, rb, h, seg, o) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), o); }
  cone(r, h, seg, o) { return this.add(new THREE.ConeGeometry(r, h, seg), o); }
  sphere(r, o, seg = 8) { return this.add(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), o); }
  ico(r, o, detail = 1) { return this.add(new THREE.IcosahedronGeometry(r, detail), o); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return g;
  }
  mesh({ shadow = true, receive = false, material = litMaterial } = {}) {
    const m = new THREE.Mesh(this.geometry(), material);
    m.castShadow = shadow; m.receiveShadow = receive;
    return m;
  }
}
