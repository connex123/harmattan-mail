// Instanced baobabs (fat bottle trunks, sparse branches), shea-like broad trees and gold grass tufts.
import * as THREE from 'three';
import { BAOBABS, WORLD } from '../core/config.js';
import { MeshBuilder, litMaterial } from '../core/geomUtil.js';
import { fbm, mulberry32 } from '../core/rng.js';
import { isBlocked } from './runways.js';

function baobabGeometry() {
  const b = new MeshBuilder(31);
  const prof = [[0, 0], [2.2, 0], [2.9, 1.6], [3.6, 4.2], [3.3, 8], [2.4, 11], [1.8, 12.6], [0, 13]].map((p) => new THREE.Vector2(p[0], p[1]));
  b.add(new THREE.LatheGeometry(prof, 10), { color: 0x8a6a4c, jitter: 0.04 });
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.283 + 0.4, t = 0.75 + (i % 3) * 0.22, len = 5.5 + (i % 2) * 2;
    const dir = new THREE.Vector3(Math.sin(t) * Math.sin(a), Math.cos(t), Math.sin(t) * Math.cos(a));
    const sx = Math.sin(a) * 1.0, sz = Math.cos(a) * 1.0, sy = 12.2;
    b.cyl(0.28, 0.7, len, 5, { x: sx + dir.x * len / 2, y: sy + dir.y * len / 2, z: sz + dir.z * len / 2, ry: a, rx: t, color: 0x7d6046 });
    const tx = sx + dir.x * len, ty = sy + dir.y * len, tz = sz + dir.z * len;
    b.ico(1.5, { x: tx, y: ty + 0.3, z: tz, sy: 0.6, color: 0x7f8a45, jitter: 0.1 }, 0);
    if (i % 2) b.ico(1.0, { x: tx + dir.x * 1.6, y: ty + 1, z: tz + dir.z * 1.6, sy: 0.6, color: 0x8b9150 }, 0);
  }
  return b.geometry();
}
function sheaGeometry() {
  const b = new MeshBuilder(32);
  b.cyl(0.5, 0.8, 4.2, 6, { y: 2.1, color: 0x5b4030 });
  b.ico(4.6, { y: 6.6, sx: 1.4, sy: 0.62, sz: 1.2, color: 0x6a7c37, jitter: 0.1 }, 1);
  b.ico(3, { x: 2.5, y: 5.4, z: 1.2, sx: 1.2, sy: 0.6, color: 0x77873f }, 0);
  return b.geometry();
}
function tuftGeometry() {
  const b = new MeshBuilder(33);
  for (let i = 0; i < 4; i++) b.cone(0.28, 1.5, 4, { x: Math.cos(i * 1.6) * 0.35, z: Math.sin(i * 1.6) * 0.35, y: 0.75, rz: Math.cos(i * 2) * 0.35, rx: Math.sin(i * 2) * 0.35, color: i % 2 ? 0xd3b266 : 0xb99449 });
  return b.geometry();
}

function instanced(geo, items, shadow, scene, tint = 0.12, rng = Math.random) {
  const m = new THREE.InstancedMesh(geo, litMaterial, items.length);
  const o = new THREE.Object3D(), c = new THREE.Color();
  items.forEach((it, i) => {
    o.position.set(it.x, it.y, it.z); o.rotation.set(0, it.rot, 0); o.scale.set(it.s * (it.sx ?? 1), it.s * (it.sy ?? 1), it.s * (it.sx ?? 1)); o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
    const f = 1 - tint + rng() * tint * 2; c.setRGB(f, f * 0.98, f * 0.96); m.setColorAt(i, c);
  });
  m.castShadow = shadow; m.frustumCulled = false; m.instanceMatrix.needsUpdate = true;
  scene.add(m);
}

export function createTrees(scene, heightAt, seed = 1) {
  const rng = mulberry32(seed * 977 + 13);
  const baobabs = [], shea = [], tufts = [];
  const addB = (x, z, s) => baobabs.push({ x, z, y: heightAt(x, z) - 0.3, s, rot: rng() * 6.28, sy: 0.9 + rng() * 0.25 });
  for (const [x, z, s] of BAOBABS) addB(x, z, s);
  // groves: clusters, not a grid
  for (let g = 0; g < 26; g++) {
    const cx = (rng() - 0.5) * 8600, cz = (rng() - 0.5) * 8600;
    const n = 3 + (rng() * 5 | 0);
    for (let i = 0; i < n; i++) {
      const x = cx + (rng() - 0.5) * 220, z = cz + (rng() - 0.5) * 220;
      if (!isBlocked(x, z, 30)) addB(x, z, 0.9 + rng() * 0.6);
    }
  }
  for (let i = 0; i < 520; i++) {
    const x = (rng() - 0.5) * 9600, z = (rng() - 0.5) * 9600;
    if (fbm(x / 600, z / 600, 51, 3) > 0.42 && !isBlocked(x, z, 20) && Math.hypot(x - 3600, z - 1800) > 560) shea.push({ x, y: heightAt(x, z), z, s: 0.9 + rng() * 0.7, rot: rng() * 6.28 });
  }
  for (let i = 0; i < 4200; i++) {
    const x = (rng() - 0.5) * 7000, z = (rng() - 0.5) * 7000;
    if (!isBlocked(x, z, 6) && fbm(x / 300 + 4, z / 300, 61, 2) > 0.45 && Math.hypot(x - 3600, z - 1800) > 450) tufts.push({ x, y: heightAt(x, z) - 0.1, z, s: 1.2 + rng() * 1.6, sy: 0.8 + rng() * 0.7, rot: rng() * 6.28 });
  }
  instanced(baobabGeometry(), baobabs, true, scene, 0.1, rng);
  instanced(sheaGeometry(), shea, true, scene, 0.1, rng);
  instanced(tuftGeometry(), tufts, false, scene, 0.15, rng);
  return { obstacles: baobabs.map((b) => ({ x: b.x, z: b.z, r: 3.4 * b.s * 1.1, top: 12 * b.s * b.sy })) };
}
