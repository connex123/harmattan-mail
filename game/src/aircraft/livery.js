// Ankara / kente-inspired livery painted on canvas: big geometric blocks of indigo, gold, crimson and emerald.
import * as THREE from 'three';
import { makeCanvas, toTexture } from '../world/textureFactory.js';
import { mulberry32 } from '../core/rng.js';

const IND = '#1d2c8f', GLD = '#f2b21c', CRI = '#c8202f', EME = '#0d9a5b', CRM = '#f6ecd4';

function tri(g, x, y, w, h, col, up = true) {
  g.fillStyle = col; g.beginPath();
  if (up) { g.moveTo(x, y + h); g.lineTo(x + w / 2, y); g.lineTo(x + w, y + h); } else { g.moveTo(x, y); g.lineTo(x + w / 2, y + h); g.lineTo(x + w, y); }
  g.fill();
}
function dust(g, w, h, seed) {
  const r = mulberry32(seed);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(190,130,80,${0.03 + r() * 0.05})`; g.fillRect(r() * w, r() * h, 2 + r() * 14, 1 + r() * 3); }
  const grd = g.createLinearGradient(0, h * 0.6, 0, h); grd.addColorStop(0, 'rgba(200,140,90,0)'); grd.addColorStop(1, 'rgba(200,140,90,0.14)');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
}

// Fuselage: v runs nose (top) to tail (bottom); u 0 = top, .25 = right side, .5 = belly, .75 = left side.
export function fuselageLivery() {
  const W = 512, H = 1024, c = makeCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = IND; g.fillRect(0, 0, W, H);
  const band = (y0, y1, col) => { g.fillStyle = col; g.fillRect(0, y0, W, y1 - y0); };
  band(0, 150, CRI); band(150, 175, CRM);
  // cabin sides: gold field with indigo and emerald diamonds
  for (const cx of [W * 0.25, W * 0.75]) {
    g.fillStyle = GLD; g.fillRect(cx - 110, 200, 220, 330);
    for (let i = 0; i < 3; i++) { const y = 225 + i * 100; g.fillStyle = i % 2 ? EME : IND; g.beginPath(); g.moveTo(cx, y); g.lineTo(cx + 80, y + 45); g.lineTo(cx, y + 90); g.lineTo(cx - 80, y + 45); g.fill(); g.fillStyle = CRI; g.beginPath(); g.arc(cx, y + 45, 14, 0, 7); g.fill(); }
  }
  g.fillStyle = EME; g.fillRect(0, 200, 56, 330); g.fillRect(W - 56, 200, 56, 330);
  band(540, 575, CRM); band(575, 690, GLD);
  for (let i = 0; i < 8; i++) tri(g, i * 64, 575, 64, 56, i % 2 ? CRI : IND, i % 2 === 0);
  band(690, 1024, EME);
  for (let i = 0; i < 8; i++) tri(g, i * 64, 700, 64, 70, GLD, false);
  band(800, 830, CRI);
  dust(g, W, H, 2);
  const t = toTexture(c); t.wrapS = THREE.RepeatWrapping; return t;
}

// Wing: u across the span (centre .5), v along the chord (top = leading edge).
export function wingLivery() {
  const W = 1024, H = 256, c = makeCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = IND; g.fillRect(0, 0, W, H);
  const cols = [CRI, GLD, EME, IND, GLD, EME];
  for (let i = 0; i < 6; i++) { g.fillStyle = cols[i]; g.fillRect(i * 64, 0, 64, H); g.fillRect(W - (i + 1) * 64, 0, 64, H); }
  g.fillStyle = IND; g.fillRect(384, 0, 256, H);
  g.fillStyle = GLD; g.fillRect(384, 90, 256, 76);
  for (let i = 0; i < 4; i++) { tri(g, 384 + i * 64, 20, 64, 60, i % 2 ? EME : CRI, true); tri(g, 384 + i * 64, 176, 64, 60, i % 2 ? CRI : EME, false); }
  g.fillStyle = CRM; g.fillRect(0, 0, W, 12); g.fillRect(0, 196, W, 8);
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.strokeRect(2, 2, W - 4, H - 4);
  dust(g, W, H, 3);
  return toTexture(c);
}

export function tailLivery() {
  const W = 256, H = 256, c = makeCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = CRI; g.fillRect(0, 0, W, H);
  g.fillStyle = GLD; g.fillRect(0, 100, W, 56); tri(g, 0, 20, W, 80, IND, true); tri(g, 0, 156, W, 80, EME, false);
  g.fillStyle = CRM; g.beginPath(); g.arc(128, 128, 30, 0, 7); g.fill(); g.fillStyle = IND; g.beginPath(); g.arc(128, 128, 16, 0, 7); g.fill();
  dust(g, W, H, 4);
  return toTexture(c);
}
