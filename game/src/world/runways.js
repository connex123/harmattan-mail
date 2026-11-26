// Laterite strips (red packed earth, white threshold marks), dirt tracks, and the surface query used by landings.
import * as THREE from 'three';
import { STRIPS, SITES } from '../core/config.js';
import { stripLocal, DEG } from '../core/geo.js';
import { stripTexture } from './textureFactory.js';

export const STRIP_RAISE = 0.25;

export function surfaceAt(x, z) {
  for (const s of Object.values(STRIPS)) {
    const { u, v } = stripLocal(s, x, z);
    if (Math.abs(u) <= s.length / 2 && Math.abs(v) <= s.width / 2) return { type: 'strip', strip: s, u, v };
  }
  return { type: 'rough', strip: null };
}

// True where trees/huts must not stand: strips, approach corridors, built-up sites.
export function isBlocked(x, z, margin = 0) {
  for (const s of Object.values(STRIPS)) {
    const { u, v } = stripLocal(s, x, z);
    if (Math.abs(u) < s.length / 2 + 520 && Math.abs(v) < s.width / 2 + 60 + margin) return true;
  }
  for (const [k, r] of [['kasaire', 190], ['dango', 80], ['clinic', 100], ['kraal', 140], ['market', 100]]) {
    if (Math.hypot(x - SITES[k].x, z - SITES[k].z) < r + margin) return true;
  }
  return false;
}

export function createStrips(scene, heightAt) {
  const tex = stripTexture();
  const mat = new THREE.MeshLambertMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  for (const s of Object.values(STRIPS)) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s.width, s.length), mat);
    m.rotation.x = -Math.PI / 2; m.rotation.z = 0;
    const holder = new THREE.Group();
    holder.position.set(s.x, heightAt(s.x, s.z) + STRIP_RAISE, s.z);
    holder.rotation.y = -s.heading * DEG;
    holder.add(m); m.receiveShadow = true;
    scene.add(holder);
  }
}

// Pale dirt tracks between the places people go.
export function createTracks(scene, heightAt) {
  const lines = [
    [[0, 390], [-100, 300], [-180, 150], [-235, 60]],
    [[0, 390], [80, 360], [150, 335]],
    [[-235, 20], [-600, -600], [-1000, -1300], [-1400, -2000], [-1650, -2380]],
    [[60, -360], [600, -700], [1300, -1100], [1900, -1400], [2230, -1470]],
  ];
  const pos = [], idx = [];
  const w = 3.2;
  for (const line of lines) {
    const pts = [];
    for (let i = 0; i < line.length - 1; i++) for (let t = 0; t < 1; t += 0.04) {
      pts.push([line[i][0] + (line[i + 1][0] - line[i][0]) * t, line[i][1] + (line[i + 1][1] - line[i][1]) * t]);
    }
    pts.push(line[line.length - 1]);
    const b = pos.length / 3;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], c = pts[Math.min(pts.length - 1, i + 1)];
      let dx = c[0] - a[0], dz = c[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const wob = Math.sin(i * 0.7) * 0.6;
      for (const sd of [-1, 1]) {
        const x = pts[i][0] - dz * (w + wob) * sd, z = pts[i][1] + dx * (w + wob) * sd;
        pos.push(x, heightAt(x, z) + 0.35, z);
      }
      if (i > 0) { const k = b + i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xe0b078, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide }));
  m.receiveShadow = true; scene.add(m);
}
