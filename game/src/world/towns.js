// Populates the three busy places a pilot flies over: Kasaire town (mosque, plaza, danfos), Bakari cattle market, Gossi hamlet.
// All placement is seeded from the run seed, so seed=1 always builds the same crowd.
import { MeshBuilder } from '../core/geomUtil.js';
import { mulberry32 } from '../core/rng.js';
import { SITES } from '../core/config.js';
import { addMosque } from './mosque.js';
import { scatterCrowd, lineCrowd } from './crowd.js';
import { addHerd, addPen, addGoat } from './cattle.js';
import { addDanfo, addOkada, addBushTaxi } from './traffic.js';
import { addStall, addHouse, addNeem, addGround, addBunting, CLOTH } from './market.js';

function pointAt(poly, t) {
  let len = 0; const seg = [];
  for (let i = 0; i < poly.length - 1; i++) { const l = Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1]); seg.push(l); len += l; }
  let d = t * len;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const k = Math.min(1, d / seg[i]), dx = (poly[i + 1][0] - poly[i][0]) / seg[i], dz = (poly[i + 1][1] - poly[i][1]) / seg[i];
      return { x: poly[i][0] + (poly[i + 1][0] - poly[i][0]) * k, z: poly[i][1] + (poly[i + 1][1] - poly[i][1]) * k, dx, dz };
    }
    d -= seg[i];
  }
}
const distToPoly = (poly, x, z) => {
  let m = 1e9;
  for (let i = 0; i < poly.length - 1; i++) {
    const [ax, az] = poly[i], [bx, bz] = poly[i + 1], vx = bx - ax, vz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
    m = Math.min(m, Math.hypot(x - ax - vx * t, z - az - vz * t));
  }
  return m;
};
const towardsYaw = (tx, tz) => (x, z) => Math.atan2(tx - x, tz - z);

// Stalls in a list [x, z, ry]; returns a rejection test for crowd placement.
function stallsAt(b, r, heightAt, list) {
  list.forEach(([x, z, ry], i) => addStall(b, r, x, heightAt(x, z), z, ry, CLOTH[(i * 3) % 8], CLOTH[(i * 3 + 1) % 8]));
  return (x, z) => list.some(([sx, sz]) => Math.abs(x - sx) < 3.6 && Math.abs(z - sz) < 3.6);
}
function houseRing(b, r, heightAt, cx, cz, rmin, rmax, n, reject, obstacles) {
  const placed = [];
  for (let tries = 0; placed.length < n && tries < n * 40; tries++) {
    const a = r() * 6.283, d = rmin + r() * (rmax - rmin), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
    if (reject(x, z) || placed.some((p) => Math.hypot(p[0] - x, p[1] - z) < 15)) continue;
    const w = 7 + r() * 5, dd = 6 + r() * 4, h = 3.6 + r() * 3.2;
    placed.push([x, z]); addHouse(b, r, x, heightAt(x, z), z, Math.atan2(cx - x, cz - z) + (r() - 0.5) * 0.4, w, dd, h);
    obstacles.push({ x, z, r: w * 0.6, top: h + 1 });
  }
}

export function createTowns(scene, heightAt, seed = 1) {
  const obstacles = [];
  kasaire(scene, heightAt, new MeshBuilder(51), mulberry32(seed * 7919 + 1), obstacles);
  bakari(scene, heightAt, new MeshBuilder(52), mulberry32(seed * 7919 + 2), obstacles);
  gossi(scene, heightAt, new MeshBuilder(53), mulberry32(seed * 7919 + 3), obstacles);
  return { obstacles };
}

function kasaire(scene, heightAt, b, r, obstacles) {
  const T = SITES.town, cx = T.x + 2, cz = T.z + 2;
  const road = [[18, 405], [-55, 345], [-98, 305], [-108, 250], [-124, 215]];
  addGround(scene, heightAt, road, 10, { x: cx, z: cz, r: 38 });
  addGround(scene, heightAt, [[-140, 232], [-140, 215]], 22, null, 0xdeb27d);
  addMosque(b, -140, heightAt(-140, 205), 205, 0, 1.2);
  obstacles.push({ x: -140, z: 200, r: 25, top: 50 });
  const stalls = [];
  for (let i = 0; i < 5; i++) { stalls.push([-173 + i * 9.5, 248, 0]); stalls.push([-173 + i * 9.5, 298, Math.PI]); }
  for (let i = 0; i < 3; i++) stalls.push([-178, 262 + i * 12, Math.PI / 2]);
  const skipStall = stallsAt(b, r, heightAt, stalls);
  for (const z of [262, 281, 300]) addBunting(b, r, heightAt, -178, z, -100, z + 3);
  const toPlane = towardsYaw(-45, 430);
  scatterCrowd(b, r, heightAt, cx, cz, 36, 32, 190, { skip: skipStall, gap: 1.6, waveShare: 0.18, face: towardsYaw(-60, 400) });
  scatterCrowd(b, r, heightAt, -140, 229, 26, 5, 34, { gap: 1.6 });
  lineCrowd(b, r, heightAt, -92, 318, -104, 252, 16, { jitter: 3, face: toPlane });
  lineCrowd(b, r, heightAt, -64, 330, -30, 372, 10, { jitter: 5, waveShare: 0.6, face: toPlane });
  // roadside welcome party nearest the approach: waving crowd, a danfo and okadas
  scatterCrowd(b, r, heightAt, -50, 345, 9, 7, 16, { gap: 2.0, waveShare: 0.55, face: towardsYaw(-76, 372), skip: (x, z) => distToPoly(road, x, z) < 4.5 });
  addDanfo(b, r, -62, heightAt(-62, 338), 338, 2.5);
  for (const [x, z, a] of [[-72, 329, 2.5], [-70, 337, 5.6], [-44, 356, 2.3]]) addOkada(b, r, x, heightAt(x, z), z, a);
  // street traffic
  const lane = (t, off) => { const p = pointAt(road, t); return { x: p.x - p.dz * off, z: p.z + p.dx * off, ry: Math.atan2(-p.dz, p.dx) + (off > 0 ? 0 : Math.PI) }; };
  let p = lane(0.18, 2.4); addDanfo(b, r, p.x, heightAt(p.x, p.z), p.z, p.ry);
  p = lane(0.42, -2.6); addDanfo(b, r, p.x, heightAt(p.x, p.z), p.z, p.ry);
  p = lane(0.31, -2.2); addBushTaxi(b, r, p.x, heightAt(p.x, p.z), p.z, p.ry);
  for (const [t, o] of [[0.1, 2.4], [0.25, -2.5], [0.36, 2.3], [0.5, 2.6], [0.58, -2.6]]) { p = lane(t, o); addOkada(b, r, p.x, heightAt(p.x, p.z), p.z, p.ry); }
  for (let i = 0; i < 4; i++) { const x = -88, z = 238 + i * 6.4; if (i % 2) addBushTaxi(b, r, x, heightAt(x, z), z, 1.57 + 0.1); else addDanfo(b, r, x, heightAt(x, z), z, -1.57); }
  // cattle crossing the street and a pen with goats
  p = pointAt(road, 0.7);
  addHerd(b, r, heightAt, p.x + 2, p.z, 9, 6, 11, { dir: Math.atan2(0, 1) + 0.3, herders: 2, goats: 5 });
  addPen(b, heightAt, -208, 300, 14, 10);
  addHerd(b, r, heightAt, -208, 298, 8, 5, 7, { herders: 0 });
  for (let i = 0; i < 6; i++) { const x = -165 + r() * 60, z = 270 + r() * 18; addGoat(b, x, heightAt(x, z), z, r() * 6.28, i % 2 ? 0xf3e8cf : 0x6a3f22); }
  // houses, shade trees
  const rej = (x, z) => Math.hypot(x - cx, z - cz) < 48 || distToPoly(road, x, z) < 10 || (Math.abs(x + 140) < 30 && Math.abs(z - 203) < 26) || x > -92 || z > 330;
  houseRing(b, r, heightAt, cx, cz, 52, 125, 24, rej, obstacles);
  for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = 36 + r() * 30, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d; if (!skipStall(x, z) && x < -105 && distToPoly(road, x, z) > 8) addNeem(b, r, x, heightAt(x, z), z, 1.1); }
  scene.add(b.mesh());
}

function bakari(scene, heightAt, b, r, obstacles) {
  const toPlane = towardsYaw(2150, -1500);
  const stalls = [];
  for (let i = 0; i < 6; i++) stalls.push([2206 + i * 11, -1456, 0]);
  const skipStall = stallsAt(b, r, heightAt, stalls);
  scatterCrowd(b, r, heightAt, 2250, -1470, 46, 12, 70, { skip: (x, z) => skipStall(x, z) || z < -1484 || (x < 2278 && z < -1473), gap: 1.6, waveShare: 0.25, face: toPlane });
  lineCrowd(b, r, heightAt, 2280, -1481, 2322, -1481, 16, { jitter: 2, waveShare: 0.5, face: toPlane });
  addDanfo(b, r, 2232, heightAt(2232, -1480), -1480, 0.05); addOkada(b, r, 2252, heightAt(2252, -1481), -1481, 0.1); addOkada(b, r, 2268, heightAt(2268, -1480), -1480, -0.05);
  addHerd(b, r, heightAt, 2322, -1466, 10, 5, 8, { dir: 1.5, herders: 1, goats: 0 });
  addGround(scene, heightAt, [[2120, -1440], [2200, -1438], [2290, -1436]], 8, null);
  for (let i = 0; i < 3; i++) addDanfo(b, r, 2196 + i * 9, heightAt(2196, -1440), -1440 + (i % 2) * 6, i * 0.2);
  for (let i = 0; i < 5; i++) addOkada(b, r, 2236 + i * 5.5, heightAt(2236, -1440), -1440 + (i % 2) * 3, 1.4 + i * 0.3);
  addBushTaxi(b, r, 2290, heightAt(2290, -1440), -1438, 3.3);
  addHerd(b, r, heightAt, 2402, -1446, 14, 10, 10, { dir: 1.2, herders: 2, goats: 4 });
  addHerd(b, r, heightAt, 2150, -1425, 10, 6, 6, { dir: 0.3, herders: 1, goats: 0 });
  for (let i = 0; i < 6; i++) { const x = 2290 + r() * 25, z = -1470 + r() * 14; addGoat(b, x, heightAt(x, z), z, r() * 6.28); }
  addMosque(b, 2305, heightAt(2305, -1380), -1380, Math.PI, 0.8);
  obstacles.push({ x: 2305, z: -1384, r: 18, top: 35 });
  const rej = (x, z) => z < -1420 || z > -1330 || Math.hypot(x - 2340, z + 1450) < 30 || Math.abs(x - 2305) < 24;
  houseRing(b, r, heightAt, 2270, -1370, 20, 90, 9, rej, obstacles);
  for (const [x, z] of [[2185, -1462], [2320, -1478], [2268, -1478], [2200, -1400]]) addNeem(b, r, x, heightAt(x, z), z, 1.0);
  scene.add(b.mesh());
}

function gossi(scene, heightAt, b, r, obstacles) {
  const toPlane = towardsYaw(3200, 1800);
  addGround(scene, heightAt, [[3320, 1900], [3420, 1862], [3560, 1866]], 8, { x: 3445, z: 1858, r: 26 });
  const stalls = [];
  for (let i = 0; i < 4; i++) stalls.push([3412 + i * 11, 1838, 0]);
  const skipStall = stallsAt(b, r, heightAt, stalls);
  scatterCrowd(b, r, heightAt, 3440, 1855, 40, 14, 80, { skip: (x, z) => skipStall(x, z) || z < 1825, gap: 1.6, waveShare: 0.3, face: toPlane });
  lineCrowd(b, r, heightAt, 3350, 1822, 3440, 1822, 22, { jitter: 2, waveShare: 0.6, face: toPlane });
  addHerd(b, r, heightAt, 3292, 1850, 12, 7, 8, { dir: 0.5, herders: 2, goats: 3 });
  addMosque(b, 3480, heightAt(3480, 1925), 1925, Math.PI, 0.85);
  obstacles.push({ x: 3480, z: 1921, r: 18, top: 38 });
  addHerd(b, r, heightAt, 3372, 1868, 12, 8, 9, { dir: 0.4, herders: 2, goats: 5 });
  addDanfo(b, r, 3338, heightAt(3338, 1890), 1890, 0.35); addBushTaxi(b, r, 3500, heightAt(3500, 1866), 1866, 3.1);
  for (let i = 0; i < 4; i++) addOkada(b, r, 3395 + i * 6, heightAt(3395, 1872), 1872 + (i % 2) * 3, 0.6 + i);
  const rej = (x, z) => z < 1880 || Math.abs(x - 3480) < 26 || Math.hypot(x - 3445, z - 1858) < 30;
  houseRing(b, r, heightAt, 3440, 1900, 30, 100, 10, rej, obstacles);
  for (const [x, z] of [[3335, 1850], [3510, 1850], [3455, 1880]]) addNeem(b, r, x, heightAt(x, z), z, 1.0);
  scene.add(b.mesh());
}
