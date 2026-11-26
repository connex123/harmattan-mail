// Procedural canvas textures: laterite, strip markings, plaster, painted boards. No image files.
import * as THREE from 'three';
import { mulberry32 } from '../core/rng.js';

export function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function toTexture(c, repeat = false) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function groundDetailTexture() {
  const c = makeCanvas(256, 256), g = c.getContext('2d'), r = mulberry32(3);
  g.fillStyle = '#ece1d0'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    const v = 120 + r() * 120 | 0;
    g.fillStyle = `rgba(${v},${v * 0.8 | 0},${v * 0.6 | 0},${0.12 + r() * 0.25})`;
    g.fillRect(r() * 256, r() * 256, 1 + r() * 3, 1 + r() * 2);
  }
  g.strokeStyle = 'rgba(90,48,28,0.22)'; g.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    let x = r() * 256, y = r() * 256; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 40; y += (r() - 0.5) * 40; g.lineTo(x, y); }
    g.stroke();
  }
  return toTexture(c, true);
}

// Laterite strip: packed red earth, wheel tracks, white threshold bars, centre dashes, edge stones.
export function stripTexture() {
  const W = 128, L = 1024, c = makeCanvas(W, L), g = c.getContext('2d'), r = mulberry32(5);
  g.fillStyle = '#c9683a'; g.fillRect(0, 0, W, L);
  g.fillStyle = '#d98b57'; g.fillRect(0, 0, 14, L); g.fillRect(W - 14, 0, 14, L);
  g.fillStyle = 'rgba(110,45,25,0.28)'; g.fillRect(40, 0, 9, L); g.fillRect(79, 0, 9, L);
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? '255,200,150' : '90,35,20'},${0.08 + r() * 0.12})`;
    g.fillRect(r() * W, r() * L, 1 + r() * 3, 1 + r() * 3);
  }
  g.fillStyle = '#fbf1da';
  for (let y = 120; y < L - 120; y += 80) g.fillRect(61, y, 6, 36);
  for (const top of [true, false]) {
    for (let i = 0; i < 8; i++) { const x = 22 + i * 12; g.fillRect(x, top ? 18 : L - 18 - 64, 6, 64); }
    g.fillRect(20, top ? 100 : L - 108, 88, 7);
    g.fillRect(30, top ? 330 : L - 360, 22, 30); g.fillRect(76, top ? 330 : L - 360, 22, 30);
  }
  for (let y = 10; y < L; y += 64) { g.fillRect(3, y, 8, 8); g.fillRect(W - 11, y, 8, 8); }
  return toTexture(c);
}

export function minaretTexture() {
  const c = makeCanvas(128, 256), g = c.getContext('2d'), r = mulberry32(9);
  g.fillStyle = '#c98c54'; g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '240,200,150' : '110,60,30'},${0.08 + r() * 0.14})`; g.fillRect(r() * 128, r() * 256, 2 + r() * 6, 1 + r() * 3); }
  g.fillStyle = '#7d4526'; for (const y of [0, 118, 244]) g.fillRect(0, y, 128, 12);
  g.fillStyle = '#f6e6bf';
  for (const y0 of [28, 130, 190]) for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(i * 32, y0 + 26); g.lineTo(i * 32 + 16, y0); g.lineTo(i * 32 + 32, y0 + 26); g.closePath(); g.fill(); }
  g.fillStyle = '#f0d9a8'; g.fillRect(56, 70, 16, 40); g.fillStyle = '#5a2e1a'; g.fillRect(60, 76, 8, 28);
  g.fillStyle = '#e4b26e'; g.beginPath(); g.moveTo(40, 230); g.lineTo(64, 206); g.lineTo(88, 230); g.fill();
  return toTexture(c, true);
}

export function clinicRoofTexture() {
  const c = makeCanvas(256, 128), g = c.getContext('2d');
  g.fillStyle = '#b6222c'; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#f7efdc'; g.fillRect(0, 0, 256, 10); g.fillRect(0, 118, 256, 10);
  g.fillStyle = '#f7efdc'; g.beginPath(); g.moveTo(128, 100); g.bezierCurveTo(40, 52, 80, 14, 128, 42); g.bezierCurveTo(176, 14, 216, 52, 128, 100); g.fill();
  return toTexture(c);
}

export function courtyardTargetTexture() {
  const c = makeCanvas(256, 256), g = c.getContext('2d');
  g.fillStyle = '#e8c597'; g.fillRect(0, 0, 256, 256);
  const rings = [['#c8202f', 120], ['#f7efdc', 94], ['#c8202f', 66], ['#f7efdc', 38], ['#1d2c8f', 16]];
  for (const [col, rad] of rings) { g.fillStyle = col; g.beginPath(); g.arc(128, 128, rad, 0, 7); g.fill(); }
  return toTexture(c);
}

export function boardTexture() {
  const c = makeCanvas(1024, 640), g = c.getContext('2d');
  g.fillStyle = '#f3e4bf'; g.fillRect(0, 0, 1024, 640);
  g.fillStyle = '#1d2c8f'; g.fillRect(0, 0, 1024, 110);
  g.fillStyle = '#f2b21c'; g.font = '900 70px Arial'; g.textBaseline = 'middle'; g.fillText('TODAY\'S MAIL RUNS', 40, 56);
  const rows = [['1', 'CLINIC DROP', '#c8202f'], ['2', 'CATTLE-MARKET MAIL', '#0d9a5b'], ['3', 'DUST WHITEOUT', '#1d2c8f'], ['4', 'FUEL DIVERT', '#e07a10']];
  rows.forEach(([n, t, col], i) => {
    const y = 130 + i * 122;
    g.fillStyle = col; g.beginPath(); g.arc(80, y + 52, 46, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.font = '900 64px Arial'; g.textAlign = 'center'; g.fillText(n, 80, y + 54); g.textAlign = 'left';
    g.fillStyle = '#2a1608'; g.font = '900 68px Arial'; g.fillText(t, 150, y + 54);
    g.fillStyle = col; g.fillRect(150, y + 100, 800, 6);
  });
  return toTexture(c);
}

export function windsockTexture() {
  const c = makeCanvas(8, 64), g = c.getContext('2d');
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f7efdc' : '#e8601a'; g.fillRect(0, i * 8, 8, 8); }
  return toTexture(c);
}
