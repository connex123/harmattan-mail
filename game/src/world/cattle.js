// Zebu cattle, goats, herders and pens: humped, long-horned, patched coats, merged into one mesh.
import { local } from '../core/geomUtil.js';
import { addPerson } from './crowd.js';

const COATS = [0xeadfc8, 0xc08a58, 0x7a4a2a, 0x2a1c14, 0xb88a5a, 0xf1e6d0];

export function addZebu(b, x, y, z, ry, color = 0xeadfc8, s = 1.25) {
  const L = local(b, x, y, z, ry, s), dark = 0x3b2414;
  L.box(2.5, 1.05, 1.0, { y: 1.35, color });
  L.sphere(0.5, { x: 0.55, y: 2.0, color, sy: 0.9, sz: 0.9 }, 6);
  L.box(0.9, 0.7, 0.55, { x: 1.45, y: 1.55, rz: -0.35, color });
  L.box(0.85, 0.5, 0.5, { x: 1.95, y: 1.4, color: dark });
  L.box(0.3, 0.7, 0.8, { x: 1.05, y: 1.05, color });
  L.cone(0.09, 0.95, 4, { x: 1.75, y: 1.95, z: 0.4, rz: -0.9, color: 0xf3e8cf });
  L.cone(0.09, 0.95, 4, { x: 1.75, y: 1.95, z: -0.4, rz: -0.9, color: 0xf3e8cf });
  L.box(0.06, 1.0, 0.06, { x: -1.3, y: 1.1, color: dark });
  if (color === 0xeadfc8 || color === 0xf1e6d0) L.box(1.0, 0.5, 1.02, { x: -0.3, y: 1.5, color: 0x6a3f22 });
  for (const [px, pz] of [[-0.95, -0.33], [-0.95, 0.33], [0.95, -0.33], [0.95, 0.33]]) L.box(0.22, 0.95, 0.22, { x: px, z: pz, y: 0.48, color: dark });
}
export function addGoat(b, x, y, z, ry, color = 0xf3e8cf) {
  const L = local(b, x, y, z, ry, 1.3);
  L.box(1.0, 0.5, 0.4, { y: 0.8, color }); L.box(0.35, 0.4, 0.3, { x: 0.6, y: 1.05, color });
  L.cone(0.05, 0.3, 4, { x: 0.65, y: 1.4, z: 0.1, color: 0x3b2414 }); L.cone(0.05, 0.3, 4, { x: 0.65, y: 1.4, z: -0.1, color: 0x3b2414 });
  for (const [px, pz] of [[-0.4, -0.12], [-0.4, 0.12], [0.4, -0.12], [0.4, 0.12]]) L.box(0.08, 0.55, 0.08, { x: px, z: pz, y: 0.28, color: 0x3b2414 });
}
// A herd drifting in direction `dir`: cows spaced loosely in an ellipse, herders with staffs at the edges.
export function addHerd(b, r, heightAt, cx, cz, rx, rz, n, o = {}) {
  const { dir = 0, herders = 2, goats = 0 } = o, pts = [];
  for (let tries = 0; pts.length < n && tries < n * 30; tries++) {
    const a = r() * 6.283, d = Math.sqrt(r()), x = cx + Math.cos(a) * d * rx, z = cz + Math.sin(a) * d * rz;
    if (pts.some((p) => (p[0] - x) ** 2 + (p[1] - z) ** 2 < 9)) continue;
    pts.push([x, z]); addZebu(b, x, heightAt(x, z), z, dir + (r() - 0.5) * 0.7, COATS[Math.floor(r() * COATS.length)]);
  }
  for (let i = 0; i < goats; i++) { const x = cx + (r() - 0.5) * rx * 2.2, z = cz + (r() - 0.5) * rz * 2.2; addGoat(b, x, heightAt(x, z), z, r() * 6.28, i % 3 ? 0xf3e8cf : 0x7a4a2a); }
  for (let i = 0; i < herders; i++) {
    const x = cx + (i % 2 ? 1 : -1) * (rx + 2.5), z = cz + (i - 0.5) * rz * 0.8;
    addPerson(b, r, x, heightAt(x, z), z, { staff: true, woman: false, s: 1.5, ry: dir + 1.57 });
  }
  return pts;
}
// A thorn-and-post pen: posts every 2.6 m with two rails, gap on the +z side.
export function addPen(b, heightAt, cx, cz, rx, rz) {
  const n = Math.round(Math.PI * (rx + rz) / 2.6), pts = [];
  for (let i = 0; i < n; i++) pts.push([cx + Math.cos(i / n * 6.283) * rx, cz + Math.sin(i / n * 6.283) * rz]);
  pts.forEach(([x, z], i) => {
    const y = heightAt(x, z), [nx, nz] = pts[(i + 1) % n];
    if (Math.atan2(z - cz, x - cx) > 1.25 && Math.atan2(z - cz, x - cx) < 1.9) return;
    b.cyl(0.14, 0.17, 2.2, 5, { x, y: y + 1.1, z, color: 0x5a3a1c });
    const mx = (x + nx) / 2, mz = (z + nz) / 2, len = Math.hypot(nx - x, nz - z), ang = -Math.atan2(nz - z, nx - x);
    for (const h of [0.8, 1.55]) b.box(len, 0.14, 0.14, { x: mx, y: y + h, z: mz, ry: ang, color: 0x7a5232 });
  });
}
