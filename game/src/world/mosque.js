// A Sudano-Sahelian banco mosque: mud-brick prayer hall, buttress pilasters, toron beams, tapering towers with ostrich eggs.
import { local } from '../core/geomUtil.js';

const MUD = 0xc88f58, MUD2 = 0xd9a46a, WASH = 0xf0e4c8, WOOD = 0x4a2c18;

function tower(L, x, z, h, base) {
  const rb = base * 0.72, rt = base * 0.42, rows = Math.round(h / 4.2);
  L.cyl(rt, rb, h, 4, { x, y: h / 2, z, ry: 0.785, color: MUD });
  for (let k = 1; k <= rows; k++) {
    const y = k * h / (rows + 1), rr = rt + (rb - rt) * (1 - y / h), half = rr * 0.707 + 1.0;
    L.box(half * 2, 0.32, 0.32, { x, y, z, color: WOOD }); L.box(0.32, 0.32, half * 2, { x, y: y + 0.01, z, color: WOOD });
    L.box(rr * 1.45, 0.28, rr * 1.45, { x, y: y - 0.45, z, color: MUD2 });
  }
  L.cone(rt * 0.95, 4, 4, { x, y: h + 2, z, ry: 0.785, color: WASH });
  L.cyl(0.07, 0.07, 1.8, 4, { x, y: h + 4.5, z, color: WOOD });
  L.sphere(0.75, { x, y: h + 5.5, z, color: WASH, sy: 1.45 }, 7);
}
// Local frame: facade faces +z, qibla wall at -z. Footprint ~36 x 22 m at s=1.
export function addMosque(b, x, y, z, ry = 0, s = 1) {
  const L = local(b, x, y, z, ry, s);
  L.box(36, 10, 20, { y: 5, color: MUD });
  L.box(37, 0.9, 21, { y: 10.4, color: MUD2 });
  L.box(24, 3, 12, { y: 12, z: -2, color: MUD });
  for (let i = 0; i < 13; i++) {
    const x2 = -18 + i * 3;
    L.box(1.5, 12.6, 1.5, { x: x2, y: 6.3, z: 10.6, color: MUD2 }); L.cone(1.15, 3, 4, { x: x2, y: 14, z: 10.6, ry: 0.785, color: WASH });
    for (const yy of [3.5, 7, 10.5]) L.box(0.3, 0.3, 2.4, { x: x2, y: yy, z: 11.3, color: WOOD });
    if (i % 2 === 0) { L.box(1.5, 12, 1.5, { x: x2 === -18 ? -18.6 : x2, y: 6, z: -10.6, color: MUD2 }); }
  }
  for (let j = 0; j < 6; j++) for (const sx of [-1, 1]) {
    const z2 = -8 + j * 3.4;
    L.box(1.4, 11.5, 1.4, { x: 18.6 * sx, y: 5.75, z: z2, color: MUD2 }); L.cone(1.05, 2.6, 4, { x: 18.6 * sx, y: 12.8, z: z2, ry: 0.785, color: WASH });
    L.box(2.2, 0.3, 0.3, { x: 19.2 * sx, y: 5, z: z2, color: WOOD }); L.box(2.2, 0.3, 0.3, { x: 19.2 * sx, y: 9, z: z2, color: WOOD });
  }
  for (const dx of [-9, 0, 9]) {
    L.box(2.6, 4.2, 0.4, { x: dx, y: 2.1, z: 10.2, color: 0x2a170c });
    L.cyl(1.3, 1.3, 0.4, 10, { x: dx, y: 4.2, z: 10.2, rx: Math.PI / 2, color: 0x2a170c });
    L.box(3.4, 0.5, 0.5, { x: dx, y: 0.25, z: 11.2, color: WASH });
  }
  L.box(8, 11, 3, { y: 5.5, z: 12.8, color: MUD2 });
  tower(L, 0, 3, 36, 5.6);
  tower(L, -16, 9, 25, 4.6); tower(L, 16, 9, 25, 4.6);
  L.box(0.12, 1.6, 2.2, { x: 0, y: 40.5, z: 3, color: 0x0d9a5b });
  L.box(40, 0.4, 4, { y: 0.2, z: 14.5, color: 0xdeb27d });
}
export const MOSQUE_FOOTPRINT = { hw: 20, hd: 14 };
