// Low-poly market people: wrappers, boubous, caps, head-wraps, head-loads and waving arms, merged into one mesh.
import { local } from '../core/geomUtil.js';

const SKIN = [0x3b2417, 0x5a3820, 0x7a4a2c, 0x2e1c12, 0x694029];
const BRIGHT = [0xc8202f, 0xf2b21c, 0x1d2c8f, 0x0d9a5b, 0xf08a24, 0xe0408c, 0x7b2a9c, 0x19a7c8, 0xf5ecd8, 0xff5a1f];
const ROBE = [0xf5ecd8, 0x2a5fb0, 0xf5ecd8, 0x19a7c8, 0xe8d8a0, 0x0d9a5b, 0xf2b21c];
const pick = (r, a) => a[Math.floor(r() * a.length)];

export function addPerson(b, r, x, y, z, o = {}) {
  const { ry = r() * 6.283, wave = false, s = 1.5, staff = false } = o;
  const L = local(b, x, y, z, ry, s), skin = pick(r, SKIN), woman = o.woman ?? r() < 0.5;
  if (woman) {
    const wrap = pick(r, BRIGHT), top = pick(r, BRIGHT), head = pick(r, BRIGHT);
    L.cyl(0.3, 0.42, 1.05, 6, { y: 0.52, color: wrap });
    L.cyl(0.2, 0.3, 0.58, 6, { y: 1.3, color: top });
    L.box(0.9, 0.12, 0.3, { y: 1.05, color: pick(r, BRIGHT), ry: 0.4 });
    L.cyl(0.17, 0.22, 0.3, 6, { y: 1.9, color: head });
    if (r() < 0.35) { L.cyl(0.32, 0.26, 0.2, 6, { y: 2.18, color: 0xd9b45a }); L.sphere(0.2, { y: 2.38, color: pick(r, BRIGHT) }, 5); }
  } else {
    const robe = pick(r, ROBE);
    L.cyl(0.26, 0.42, 1.55, 6, { y: 0.78, color: robe });
    L.box(0.78, 0.5, 0.26, { y: 1.35, color: pick(r, BRIGHT) });
    L.cyl(0.17, 0.2, 0.15, 6, { y: 1.97, color: r() < 0.5 ? 0xf5ecd8 : pick(r, BRIGHT) });
  }
  L.sphere(0.18, { y: 1.74, color: skin }, 5);
  if (wave) {
    L.box(0.1, 0.62, 0.1, { x: 0.3, y: 1.9, color: skin, rz: -0.3 }); L.box(0.1, 0.62, 0.1, { x: -0.3, y: 1.9, color: skin, rz: 0.3 });
  } else {
    L.box(0.1, 0.62, 0.1, { x: 0.33, y: 1.2, color: skin }); L.box(0.1, 0.62, 0.1, { x: -0.33, y: 1.2, color: skin });
  }
  if (staff) L.box(0.06, 2.3, 0.06, { x: 0.45, z: 0.15, y: 1.15, color: 0x5a3a1c });
}

// Scatter n people in an ellipse (cx,cz,rx,rz), at least `gap` metres apart; `skip(x,z)` rejects spots (stalls, vehicles).
export function scatterCrowd(b, r, heightAt, cx, cz, rx, rz, n, o = {}) {
  const { gap = 1.7, skip = null, waveShare = 0.12, s = 1.5, face = null } = o, pts = [];
  for (let tries = 0; pts.length < n && tries < n * 30; tries++) {
    const a = r() * 6.283, d = Math.sqrt(r()), x = cx + Math.cos(a) * d * rx, z = cz + Math.sin(a) * d * rz;
    if (skip && skip(x, z)) continue;
    if (pts.some((p) => (p[0] - x) ** 2 + (p[1] - z) ** 2 < gap * gap)) continue;
    pts.push([x, z]);
    addPerson(b, r, x, heightAt(x, z), z, { wave: r() < waveShare, s: s * (0.85 + r() * 0.3), ry: face ? face(x, z) : undefined });
  }
  return pts;
}
// People standing along a line a->b (a queue or a roadside row), jittered.
export function lineCrowd(b, r, heightAt, ax, az, bx, bz, n, o = {}) {
  const { jitter = 2.5, waveShare = 0.3, s = 1.5, face = null } = o;
  for (let i = 0; i < n; i++) {
    const t = (i + r() * 0.6) / n, x = ax + (bx - ax) * t + (r() - 0.5) * jitter, z = az + (bz - az) * t + (r() - 0.5) * jitter;
    addPerson(b, r, x, heightAt(x, z), z, { wave: r() < waveShare, s: s * (0.85 + r() * 0.3), ry: face ? face(x, z) : undefined });
  }
}
