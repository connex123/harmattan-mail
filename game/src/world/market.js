// Market furniture: cloth-awning stalls with goods, mud-brick houses, neem shade trees, and laterite ground ribbons.
import * as THREE from 'three';
import { local } from '../core/geomUtil.js';

export const CLOTH = [0xc8202f, 0xf2b21c, 0x1d2c8f, 0x0d9a5b, 0xf08a24, 0xe0408c, 0x19a7c8, 0x7b2a9c];
const GOODS = [0xe8601a, 0xc8202f, 0xf2b21c, 0x0d9a5b, 0xf3e8cf, 0xe0408c];

// Striped ankara awning on four poles over a counter heaped with goods; front toward +z.
export function addStall(b, r, x, y, z, ry, c1, c2) {
  const L = local(b, x, y, z, ry, 1.15);
  for (const [px, pz] of [[-2, -1.5], [2, -1.5], [-2, 1.6], [2, 1.6]]) L.cyl(0.1, 0.1, 2.8, 5, { x: px, z: pz, y: 1.4, color: 0x5a3a1c });
  for (let i = 0; i < 6; i++) L.box(0.72, 0.1, 3.9, { x: -1.8 + i * 0.72, y: 3.0 - i * 0.04, z: 0.1, color: i % 2 ? c2 : c1, rz: -0.02 });
  L.box(4.4, 0.7, 0.08, { y: 2.55, z: 2.1, color: c1 });
  L.box(4.0, 0.9, 1.2, { y: 0.45, z: 0.7, color: 0xb98255 });
  for (let i = 0; i < 5; i++) {
    const col = GOODS[Math.floor(r() * GOODS.length)];
    if (r() < 0.5) L.cone(0.35, 0.5, 6, { x: -1.6 + i * 0.8, y: 1.15, z: 0.7, color: col }); else L.box(0.6, 0.4, 0.5, { x: -1.6 + i * 0.8, y: 1.1, z: 0.7, color: col });
  }
  L.box(0.8, 0.7, 0.6, { x: 2.4, y: 0.35, z: -0.5, color: 0xd9b45a });
}
// Flat-roofed banco house with parapet, toron stubs and a painted door.
export function addHouse(b, r, x, y, z, ry, w, d, h) {
  const L = local(b, x, y, z, ry, 1), mud = [0xc18652, 0xcf9a62, 0xb67a4b, 0xd7a468][Math.floor(r() * 4)];
  L.box(w, h, d, { y: h / 2, color: mud });
  L.box(w + 0.7, 0.55, d + 0.7, { y: h + 0.2, color: 0xe0b078 });
  for (const [px, pz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) L.box(0.7, 1.0, 0.7, { x: px * w / 2, z: pz * d / 2, y: h + 0.8, color: 0xe0b078 });
  L.box(1.5, 2.3, 0.3, { x: (r() - 0.5) * w * 0.4, y: 1.15, z: d / 2 + 0.05, color: CLOTH[Math.floor(r() * CLOTH.length)] });
  for (let i = 0; i < 4; i++) L.box(0.25, 0.25, 1.2, { x: -w / 2 + (i + 0.5) * w / 4, y: h - 0.4, z: d / 2 + 0.4, color: 0x4a2c18 });
  if (r() < 0.6) L.box(1.2, 1.0, 0.25, { x: w * 0.28, y: h * 0.62, z: d / 2 + 0.05, color: CLOTH[Math.floor(r() * CLOTH.length)] });
  if (r() < 0.4) L.cyl(0.5, 0.4, 1.0, 6, { x: -w * 0.3, y: h + 1.4, z: 0, color: 0x9a5a30 });
}
// A string of ankara pennants sagging between two poles.
export function addBunting(b, r, heightAt, x0, z0, x1, z1, h = 6.5) {
  for (const [x, z] of [[x0, z0], [x1, z1]]) b.cyl(0.12, 0.16, h + 0.6, 5, { x, y: heightAt(x, z) + (h + 0.6) / 2, z, color: 0x5a3a1c });
  const n = 16, len = Math.hypot(x1 - x0, z1 - z0), ang = -Math.atan2(z1 - z0, x1 - x0);
  for (let i = 1; i < n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t, sag = Math.sin(t * Math.PI) * 1.3;
    b.box(len / n * 0.9, 0.9, 0.06, { x, y: heightAt(x, z) + h - sag - 0.5, z, ry: ang, rz: 0.785 * (i % 2 ? 1 : -1) * 0.0, color: CLOTH[(i * 5 + (r() * 3 | 0)) % CLOTH.length] });
  }
}
export function addNeem(b, r, x, y, z, s = 1) {
  const L = local(b, x, y, z, r() * 6, s);
  L.cyl(0.35, 0.55, 3.4, 6, { y: 1.7, color: 0x5a3a1c });
  for (let i = 0; i < 4; i++) L.sphere(2.2 + r() * 0.8, { x: (r() - 0.5) * 3, y: 4.6 + r() * 1.2, z: (r() - 0.5) * 3, sy: 0.7, color: [0x6b8a2c, 0x7d8f2e, 0x58762a][i % 3], jitter: 0.12 }, 6);
}
// Flat ribbon along a polyline (laterite street) with an optional disc plaza; sits just above terrain.
export function addGround(scene, heightAt, poly, width, plaza, color = 0xe2b47e) {
  const pos = [], idx = [], pts = [];
  for (let i = 0; i < poly.length - 1; i++) for (let t = 0; t < 1; t += 0.1) pts.push([poly[i][0] + (poly[i + 1][0] - poly[i][0]) * t, poly[i][1] + (poly[i + 1][1] - poly[i][1]) * t]);
  pts.push(poly[poly.length - 1]);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], c = pts[Math.min(pts.length - 1, i + 1)];
    let dx = c[0] - a[0], dz = c[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    for (const sd of [-1, 1]) { const x = pts[i][0] - dz * width / 2 * sd, z = pts[i][1] + dx * width / 2 * sd; pos.push(x, heightAt(x, z) + 0.32, z); }
    if (i > 0) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ color, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, side: THREE.DoubleSide });
  scene.add(new THREE.Mesh(g, mat));
  if (plaza) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(plaza.r, 28), mat);
    d.rotation.x = -Math.PI / 2; d.position.set(plaza.x, heightAt(plaza.x, plaza.z) + 0.31, plaza.z); scene.add(d);
  }
}
