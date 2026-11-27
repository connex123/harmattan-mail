// Sahel plateau: laterite earth, gold dry-grass patches, pale Gossi pan, inselberg hills; flattened pads under strips and sites.
import * as THREE from 'three';
import { WORLD, STRIPS, SITES, HILLS } from '../core/config.js';
import { fbm } from '../core/rng.js';
import { smoothstep, stripLocal } from '../core/geo.js';
import { groundDetailTexture } from './textureFactory.js';

function base(x, z) {
  let h = 18 + 24 * fbm(x / 1500 + 3, z / 1500 + 7, 11, 4) + 5 * fbm(x / 260, z / 260, 5, 3);
  for (const k of HILLS) { const d = Math.hypot(x - k.x, z - k.z) / k.r; h += k.h * Math.exp(-d * d * 1.7) * (0.8 + 0.4 * fbm(x / 200, z / 200, 3, 2)); }
  return h;
}

const PADS = [];
for (const s of Object.values(STRIPS)) PADS.push({ strip: s, x: s.x, z: s.z, h: base(s.x, s.z) - (s.id === 'gossi' ? 3 : 0) });
PADS.push({ x: SITES.kasaire.x, z: SITES.kasaire.z, r: 170, h: base(SITES.kasaire.x, SITES.kasaire.z) });
PADS.push({ x: SITES.town.x, z: SITES.town.z, r: 120, h: base(SITES.town.x, SITES.town.z) });
PADS.push({ x: SITES.dango.x, z: SITES.dango.z, r: 90, h: base(SITES.dango.x, SITES.dango.z) });
PADS.push({ x: SITES.clinic.x, z: SITES.clinic.z, r: 90, h: base(SITES.clinic.x, SITES.clinic.z) });
PADS.push({ x: SITES.pan.x, z: SITES.pan.z, r: 560, h: base(SITES.pan.x, SITES.pan.z) - 3 });
// Bakari's pad is extended to cover the kraal and market beside the strip.
PADS.push({ x: 2290, z: -1470, r: 150, h: base(2300, -1500) });

function padWeight(p, x, z) {
  let d;
  if (p.strip) {
    const { u, v } = stripLocal(p.strip, x, z);
    d = Math.hypot(Math.max(Math.abs(u) - p.strip.length / 2 - 70, 0), Math.max(Math.abs(v) - p.strip.width / 2 - 55, 0));
  } else d = Math.max(Math.hypot(x - p.x, z - p.z) - p.r, 0);
  return 1 - smoothstep(0, 230, d);
}

export function heightAt(x, z) {
  let h = base(x, z);
  for (const p of PADS) { const w = padWeight(p, x, z); if (w > 0) h += (p.h - h) * w; }
  return h;
}

export function createTerrain(scene) {
  const n = WORLD.grid, size = WORLD.size;
  const geo = new THREE.PlaneGeometry(size, size, n, n); geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, count = p.count;
  const colors = new Float32Array(count * 3), uv = new Float32Array(count * 2);
  const lat = new THREE.Color(0xb4542f), sand = new THREE.Color(0xd9a064), grass = new THREE.Color(0xc4a55a), pan = new THREE.Color(0xecd9b6), rock = new THREE.Color(0x8e4a30), dark = new THREE.Color(0x7a3322), c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = heightAt(x, z);
    p.setY(i, h);
    c.copy(lat).lerp(sand, fbm(x / 500, z / 500, 21, 3) * 0.7);
    c.lerp(grass, smoothstep(0.44, 0.56, fbm(x / 260 + 9, z / 260, 31, 3)) * 0.9);
    c.lerp(dark, smoothstep(0.58, 0.68, fbm(x / 140 + 2, z / 140, 37, 3)) * 0.55);
    c.lerp(rock, smoothstep(55, 150, h) * 0.7);
    c.lerp(pan, 1 - smoothstep(380, 640, Math.hypot(x - SITES.pan.x, z - SITES.pan.z)));
    c.multiplyScalar(0.8 + 0.4 * fbm(x / 70, z / 70, 41, 2));
    colors.set([c.r, c.g, c.b], i * 3); uv.set([x / 46, z / 46], i * 2);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, map: groundDetailTexture() }));
  mesh.receiveShadow = true;
  scene.add(mesh);
  return { mesh, heightAt };
}
