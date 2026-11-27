// Road traffic on the laterite: yellow danfo minibuses, okada motorbikes with riders, and roof-loaded bush taxis.
import { local, rotXZ } from '../core/geomUtil.js';
import { addPerson } from './crowd.js';

const LOAD = [0xc8202f, 0x1d2c8f, 0xf5ecd8, 0x0d9a5b, 0xf08a24, 0xe0408c];

function wheels(L, xs, zw, r = 0.42) {
  for (const x of xs) for (const z of [-zw, zw]) L.cyl(r, r, 0.32, 8, { x, y: r, z, rx: Math.PI / 2, color: 0x1c1a18 });
}
function roofLoad(L, r, x0, x1, y, n) {
  for (let i = 0; i < n; i++) L.box(0.8 + r() * 0.5, 0.6 + r() * 0.5, 0.9 + r() * 0.5, { x: x0 + (x1 - x0) * (i / Math.max(1, n - 1)), y: y + 0.4, z: (r() - 0.5) * 0.5, color: LOAD[Math.floor(r() * LOAD.length)], ry: r() });
}
// Forward is local +x.
export function addDanfo(b, r, x, y, z, ry, s = 1.25) {
  const L = local(b, x, y, z, ry, s);
  L.box(4.8, 1.0, 1.9, { y: 0.95, color: 0xf4c20d });
  L.box(4.1, 0.95, 1.84, { x: -0.3, y: 1.9, color: 0xf4c20d });
  L.box(4.82, 0.2, 1.92, { y: 0.95, color: 0x141414 });
  L.box(3.5, 0.5, 1.87, { x: -0.3, y: 2.0, color: 0x28323d });
  L.box(0.12, 0.7, 1.7, { x: 1.75, y: 1.95, rz: 0.3, color: 0x28323d });
  L.box(4.1, 0.1, 1.9, { x: -0.3, y: 2.42, color: 0x141414 });
  for (const z2 of [-0.6, 0.6]) L.box(0.1, 0.22, 0.3, { x: 2.42, y: 0.9, z: z2, color: 0xfff1a8 });
  roofLoad(L, r, -2, 1, 2.5, 4);
  wheels(L, [-1.5, 1.5], 0.95);
}
// Okada: bike with rider and (often) a passenger in loud cloth.
export function addOkada(b, r, x, y, z, ry, s = 1.3) {
  const L = local(b, x, y, z, ry, s);
  L.box(1.7, 0.28, 0.22, { y: 0.7, color: 0x1d2c8f });
  L.box(0.55, 0.3, 0.3, { x: 0.2, y: 0.95, color: 0xc8202f });
  L.box(0.1, 0.1, 0.8, { x: 0.8, y: 1.15, color: 0x222222 });
  wheels(L, [-0.75, 0.75], 0, 0.36);
  for (let i = 0; i < (r() < 0.6 ? 2 : 1); i++) {
    const p = rotXZ((0.25 - i * 0.6) * s, 0, x, z, ry);
    addPerson(b, r, p.x, y + 0.55 * s, p.z, { s: 1.0, ry, woman: i === 1 });
  }
}
export function addBushTaxi(b, r, x, y, z, ry, s = 1.3) {
  const L = local(b, x, y, z, ry, s), body = [0xefe3c4, 0x2a5fb0, 0xc8202f][Math.floor(r() * 3)];
  L.box(4.6, 0.9, 1.75, { y: 0.85, color: body });
  L.box(2.7, 0.8, 1.6, { x: -0.5, y: 1.65, color: body });
  L.box(2.72, 0.42, 1.62, { x: -0.5, y: 1.75, color: 0x28323d });
  L.box(4.62, 0.15, 1.77, { y: 0.85, color: 0xf2b21c });
  L.box(3.0, 0.08, 1.7, { x: -0.5, y: 2.1, color: 0x3a2a1c });
  roofLoad(L, r, -1.7, 0.5, 2.2, 5);
  L.box(1.2, 0.9, 1.2, { x: -0.8, y: 2.85, color: 0xe8d8a0 });
  wheels(L, [-1.5, 1.4], 0.9, 0.38);
}
