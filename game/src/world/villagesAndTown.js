// Authored landmarks: Kasaire (painted minaret + market street), Dango huts, Yelwa clinic, Bakari kraal and cattle.
import * as THREE from 'three';
import { SITES } from '../core/config.js';
import { MeshBuilder } from '../core/geomUtil.js';
import { mulberry32 } from '../core/rng.js';
import { minaretTexture, clinicRoofTexture, courtyardTargetTexture } from './textureFactory.js';

const CLOTH = [0x1d2c8f, 0xf2b21c, 0xc8202f, 0x0d9a5b, 0xf5ecd8, 0xf08a24];

function hut(b, x, y, z, s, r) {
  b.cyl(2.3 * s, 2.4 * s, 2.5 * s, 10, { x, y: y + 1.25 * s, z, color: 0xb67a4b });
  b.box(0.9 * s, 1.5 * s, 0.3, { x, y: y + 0.75 * s, z: z + 2.3 * s, ry: 0, color: 0x3a2214 });
  b.cone(3.3 * s, 2.9 * s, 12, { x, y: y + 3.9 * s, z, color: r() < 0.5 ? 0xd9b45a : 0xc79f45 });
  b.cone(0.3 * s, 0.8 * s, 5, { x, y: y + 5.6 * s, z, color: 0x5a3a1c });
}
function stall(b, x, y, z, color, ry) {
  for (const [px, pz] of [[-2, -1.6], [2, -1.6], [-2, 1.6], [2, 1.6]]) b.cyl(0.1, 0.1, 2.6, 5, { x, y: y + 1.3, z, color: 0x5a3a1c, ry, ...rot(px, pz, x, z, ry) });
  b.box(5.2, 0.18, 4.2, { x, y: y + 2.8, z, ry, rx: 0, color });
  b.box(4.4, 0.9, 1.2, { x, y: y + 0.5, z, ry, color: 0xb98255 });
  const g = [0xe8601a, 0xc8202f, 0xf2b21c, 0x0d9a5b][Math.abs(Math.round(x * 3 + z)) % 4];
  b.box(1.1, 0.5, 0.8, { ...rot(-1.2, 0, x, z, ry), y: y + 1.2, color: g });
  b.box(1.1, 0.5, 0.8, { ...rot(0.9, 0, x, z, ry), y: y + 1.2, color: 0xf3e8cf });
}
function rot(px, pz, x, z, ry) { const c = Math.cos(ry), s = Math.sin(ry); return { x: x + px * c + pz * s, z: z - px * s + pz * c }; }
function cow(b, x, y, z, ry, color) {
  const o = (px, pz) => rot(px, pz, x, z, ry);
  b.box(2.8, 1.2, 1.1, { x, y: y + 1.45, z, ry, color });
  b.box(0.9, 0.55, 0.6, { ...o(1.6, 0), y: y + 1.45, ry, color: 0x6a3f22 });
  b.box(0.8, 0.9, 0.9, { ...o(1.65, 0), y: y + 1.7, ry, color });
  b.cone(0.12, 0.5, 4, { ...o(1.7, 0.45), y: y + 2.25, ry, rz: -0.5, color: 0xf3e8cf });
  b.cone(0.12, 0.5, 4, { ...o(1.7, -0.45), y: y + 2.25, ry, rz: 0.5, color: 0xf3e8cf });
  for (const [px, pz] of [[-1, -0.4], [-1, 0.4], [1, -0.4], [1, 0.4]]) b.box(0.22, 1.0, 0.22, { ...o(px, pz), y: y + 0.5, color: 0x3b2414 });
}

export function createLandmarks(scene, heightAt) {
  const r = mulberry32(44), obstacles = [];
  const b = new MeshBuilder(41);

  // ---- Kasaire: mosque + minaret + stepped tiers
  const K = SITES.kasaire, ky = heightAt(K.x, K.z);
  b.box(30, 9, 16, { x: K.x, y: ky + 4.5, z: K.z + 10, color: 0xc98c54 });
  b.box(31, 1, 17, { x: K.x, y: ky + 9.5, z: K.z + 10, color: 0xd6a066 });
  for (let i = 0; i < 9; i++) { b.box(1.6, 11, 1.6, { x: K.x - 14 + i * 3.5, y: ky + 5.5, z: K.z + 18.4, color: 0xd7a468 }); b.cone(1.3, 2.6, 4, { x: K.x - 14 + i * 3.5, y: ky + 12.3, z: K.z + 18.4, ry: 0.78, color: 0xe2b87c }); }
  const tex = minaretTexture();
  const mat = new THREE.MeshLambertMaterial({ map: tex });
  const HS = 1.45, tiers = [[0, 17, 7.6, 6.0], [17, 30, 5.7, 4.6], [30, 40, 4.4, 3.5], [40, 45, 3.0, 1.9]].map(([a, b, c, d]) => [a * HS, b * HS, c * 1.2, d * 1.2]);
  const mz = K.z - 6;
  for (const [y0, y1, rb, rt] of tiers) {
    const g = new THREE.CylinderGeometry(rt, rb, y1 - y0, 4, 1); g.rotateY(Math.PI / 4);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * (y1 - y0) / 24);
    const m = new THREE.Mesh(g, mat); m.position.set(K.x, ky + (y0 + y1) / 2, mz); m.castShadow = true; scene.add(m);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.39; b.box(0.5, 0.5, 2.6, { x: K.x + Math.cos(a) * rb * 0.75, y: ky + y1 - 1, z: mz + Math.sin(a) * rb * 0.75, ry: -a, color: 0x5e3b22 }); }
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; b.cone(0.6, 1.8, 4, { x: K.x + Math.cos(a) * rt * 0.95, y: ky + y1 + 0.8, z: mz + Math.sin(a) * rt * 0.95, ry: 0.78, color: 0xe2b87c }); }
  }
  b.cyl(0.35, 0.45, 2.4, 6, { x: K.x, y: ky + 46.2 * HS, z: mz, color: 0xd9b27a });
  b.sphere(1.0, { x: K.x, y: ky + 48.4 * HS, z: mz, color: 0xf6ecd2, sy: 1.3, sx: 1.4, sz: 1.4 }, 8);
  obstacles.push({ x: K.x, z: mz, r: 9, top: 48 * HS }, { x: K.x, z: K.z + 10, r: 17, top: 10 });
  // flat-roofed houses and compound walls
  for (let i = 0; i < 11; i++) {
    const a = r() * 6.28, d = 45 + r() * 90, x = K.x + Math.cos(a) * d, z = K.z + Math.sin(a) * d * 0.8 - 20;
    if (Math.abs(x - K.x) < 20 && Math.abs(z - K.z) < 30) continue;
    const w = 7 + r() * 6, dd = 6 + r() * 5, h = 3.4 + r() * 3;
    b.box(w, h, dd, { x, y: ky + h / 2, z, ry: r() * 0.4, color: [0xc18652, 0xcf9a62, 0xb67a4b][i % 3] });
    b.box(w + 0.6, 0.5, dd + 0.6, { x, y: ky + h + 0.2, z, color: 0xe0b078 });
    obstacles.push({ x, z, r: w * 0.6, top: h });
  }
  // market street with bright cloth awnings, east of the mosque
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) {
    stall(b, K.x + 30 + i * 8, ky, K.z + 14 + side * 7, CLOTH[(i * 2 + (side > 0 ? 1 : 0)) % 6], 0);
  }
  b.box(70, 0.2, 9, { x: K.x + 58, y: ky + 0.2, z: K.z + 14, color: 0xdeb27d, jitter: 0.03 });

  // ---- Dango huts (round, conical thatch) + grain stores + goats
  const D = SITES.dango, dy = heightAt(D.x, D.z);
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28, d = 20 + (i % 2) * 14; hut(b, D.x + Math.cos(a) * d, dy, D.z + Math.sin(a) * d, 1.25 + (i % 3) * 0.12, r); obstacles.push({ x: D.x + Math.cos(a) * d, z: D.z + Math.sin(a) * d, r: 4, top: 6 }); }
  hut(b, D.x, dy, D.z, 1.5, r);
  for (let i = 0; i < 3; i++) { const x = D.x + 34 + i * 6, z = D.z - 20; b.cyl(1.6, 1.4, 2.6, 8, { x, y: dy + 2.2, z, color: 0xc08a58 }); b.cone(2.1, 1.6, 8, { x, y: dy + 4.3, z, color: 0xd9b45a }); b.box(0.3, 1, 0.3, { x: x - 1, y: dy + 0.5, z, color: 0x4a2c16 }); }
  for (let i = 0; i < 12; i++) { const x = D.x - 28 + r() * 18, z = D.z + 20 + r() * 16; const c = [0xf3e8cf, 0x6a3f22, 0x2a1a10][i % 3]; b.box(1.5, 0.9, 0.6, { x, y: dy + 0.9, z, ry: r() * 6, color: c }); }
  for (let i = 0; i < 10; i++) { const a = r() * 6.28; b.box(2.6, 1.4, 0.3, { x: D.x + Math.cos(a) * 54, y: dy + 0.7, z: D.z + Math.sin(a) * 54, ry: a, color: 0x9a6a42 }); }

  // ---- Yelwa clinic: whitewashed compound, red heart roof, painted drop courtyard
  const C = SITES.clinic, cy = heightAt(C.x, C.z);
  const W = 0xf4ecd8;
  b.box(80, 2.4, 0.7, { x: C.x, y: cy + 1.2, z: C.z - 32, color: W }); b.box(80, 2.4, 0.7, { x: C.x, y: cy + 1.2, z: C.z + 32, color: W });
  b.box(0.7, 2.4, 64, { x: C.x - 40, y: cy + 1.2, z: C.z, color: W }); b.box(0.7, 2.4, 64, { x: C.x + 40, y: cy + 1.2, z: C.z, color: W });
  b.box(30, 4.6, 10, { x: C.x, y: cy + 2.3, z: C.z - 22, color: W }); b.box(16, 4, 8, { x: C.x - 28, y: cy + 2, z: C.z + 6, color: W }); b.box(16, 4, 8, { x: C.x + 28, y: cy + 2, z: C.z + 6, color: W });
  b.box(5, 2.2, 0.3, { x: C.x, y: cy + 1.1, z: C.z - 16.8, color: 0x2a4f8f });
  b.cyl(0.15, 0.15, 12, 5, { x: C.x + 34, y: cy + 6, z: C.z + 26, color: 0xeeeeee }); b.box(3, 1.8, 0.1, { x: C.x + 35.5, y: cy + 11, z: C.z + 26, color: 0x0d9a5b });
  scene.add(b.mesh());
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(30.6, 10.6), new THREE.MeshLambertMaterial({ map: clinicRoofTexture() }));
  roof.rotation.x = -Math.PI / 2; roof.position.set(C.x, cy + 4.75, C.z - 22); scene.add(roof);
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(38, 38), new THREE.MeshLambertMaterial({ map: courtyardTargetTexture(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  yard.rotation.x = -Math.PI / 2; yard.position.set(C.x, cy + 0.3, C.z + 8); scene.add(yard);
  obstacles.push({ x: C.x, z: C.z - 22, r: 16, top: 5 });

  // ---- Bakari kraal, cattle and market stalls beside the short strip
  const B = new MeshBuilder(43), R = SITES.kraal, ry0 = heightAt(R.x, R.z);
  for (let i = 0; i < 44; i++) {
    const a = i / 44 * 6.28; if (a > 1.2 && a < 1.7) continue;
    const x = R.x + Math.cos(a) * 24, z = R.z + Math.sin(a) * 24;
    B.box(3.5, 1.5, 0.7, { x, y: ry0 + 0.8, z, ry: -a + 1.57, color: 0x4d3a2a });
    B.cone(0.3, 1.3, 4, { x, y: ry0 + 2, z, color: 0x2f2a20 });
  }
  const cc = [0x7a4a2a, 0xe8d8b8, 0x2f2118, 0x9a5a30, 0xb88a5a];
  for (let i = 0; i < 17; i++) { const a = r() * 6.28, d = r() * 17; cow(B, R.x + Math.cos(a) * d, ry0, R.z + Math.sin(a) * d, r() * 6.28, cc[i % 5]); }
  for (let i = 0; i < 4; i++) cow(B, R.x + 38 + i * 6, ry0, R.z + 6 + r() * 10, r() * 6.28, cc[i % 5]);
  const M = SITES.market, my = heightAt(M.x, M.z);
  for (let i = 0; i < 5; i++) stall(B, M.x + i * 10, my, M.z, CLOTH[i % 6], 0);
  B.box(60, 0.2, 8, { x: M.x + 20, y: my + 0.3, z: M.z + 14, color: 0xdeb27d, jitter: 0.03 });
  B.box(24, 4, 9, { x: R.x + 20, y: ry0 + 2, z: R.z + 40, color: 0xc18652 }); B.cone(8.5, 3, 4, { x: R.x + 20, y: ry0 + 5.5, z: R.z + 40, ry: 0.78, color: 0xd9b45a });
  scene.add(B.mesh());
  obstacles.push({ x: R.x + 20, z: R.z + 40, r: 10, top: 6 });
  return { obstacles };
}
