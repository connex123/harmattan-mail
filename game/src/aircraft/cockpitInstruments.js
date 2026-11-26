// 3D cockpit: windscreen frame, coaming glare and a lit instrument panel (ASI, attitude, altimeter, heading, fuel, RPM).
import * as THREE from 'three';
import { makeCanvas, toTexture } from '../world/textureFactory.js';
import { KT, FT, DEG } from '../core/geo.js';

const W = 1536, H = 300, R = 118, CY = 150;
export const EYE = new THREE.Vector3(0, 1.02, -0.3);

function dial(g, cx, label, ticks) {
  g.save(); g.translate(cx, CY);
  g.fillStyle = '#e9d9b0'; g.beginPath(); g.arc(0, 0, R + 8, 0, 7); g.fill();
  g.fillStyle = '#0e0c0b'; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
  if (ticks) ticks(g);
  g.fillStyle = '#ffd25a'; g.font = '700 22px Arial'; g.textAlign = 'center'; g.fillText(label, 0, -R + 44);
  g.restore();
}
function needle(g, ang, len, col, wd = 7) {
  g.save(); g.rotate(ang); g.strokeStyle = col; g.lineWidth = wd; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 14); g.lineTo(0, -len); g.stroke(); g.restore();
}
function readout(g, text, y = 58) {
  g.fillStyle = '#000'; g.fillRect(-46, y - 26, 92, 38); g.fillStyle = '#fff4d6'; g.font = '900 34px Arial'; g.textAlign = 'center'; g.fillText(text, 0, y + 4);
}
function arcTicks(g, a0, a1, n, maxV, step, labelEvery, bigStep = 1) {
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n, big = i % bigStep === 0;
    g.save(); g.rotate(a); g.strokeStyle = '#f6ead0'; g.lineWidth = big ? 5 : 2.5;
    g.beginPath(); g.moveTo(0, -R + 6); g.lineTo(0, -R + (big ? 24 : 15)); g.stroke();
    if (big && (i / bigStep) % labelEvery === 0) { g.fillStyle = '#f6ead0'; g.font = '700 24px Arial'; g.textAlign = 'center'; g.fillText(String(Math.round(maxV * i / n)), 0, -R + 52); }
    g.restore();
  }
}

export function createCockpit() {
  const group = new THREE.Group(); group.position.copy(EYE);
  const canvas = makeCanvas(W, H), g = canvas.getContext('2d'), tex = toTexture(canvas);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 0.305), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  panel.position.set(0, -0.335, -0.8); panel.rotation.x = -0.5;
  group.add(panel);
  const frame = new THREE.MeshBasicMaterial({ color: 0x241810 });
  const add = (geo, mat, x, y, z, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); group.add(m); return m; };
  add(new THREE.BoxGeometry(2.2, 0.08, 0.3), frame, 0, -0.19, -0.84, -0.3);                      // coaming
  add(new THREE.BoxGeometry(2.4, 0.14, 0.2), frame, 0, 0.62, -0.85);                             // header
  add(new THREE.BoxGeometry(0.07, 1.4, 0.08), frame, -0.86, 0.38, -0.88, 0, -0.18);              // pillars
  add(new THREE.BoxGeometry(0.07, 1.4, 0.08), frame, 0.86, 0.38, -0.88, 0, 0.18);
  // colourful glare streaks across the coaming
  const gc = makeCanvas(512, 64), gg = gc.getContext('2d');
  const grd = gg.createLinearGradient(0, 0, 512, 0);
  [[0, 'rgba(255,200,80,0)'], [0.2, 'rgba(255,190,70,0.6)'], [0.45, 'rgba(230,60,60,0.45)'], [0.7, 'rgba(60,200,140,0.4)'], [0.9, 'rgba(255,230,150,0.6)'], [1, 'rgba(255,200,80,0)']].forEach(([s, c]) => grd.addColorStop(s, c));
  gg.fillStyle = grd; gg.fillRect(0, 22, 512, 20);
  const glare = add(new THREE.PlaneGeometry(2.0, 0.14), new THREE.MeshBasicMaterial({ map: toTexture(gc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 0, -0.165, -0.72, -0.3);

  let frameN = 0;
  function update(ac, hdgDeg, aglFt) {
    if (frameN++ % 2) return;
    g.fillStyle = '#241a12'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(i * 40, 0, 2, H); }
    const V = ac.vel.length(), kt = V * KT, alt = ac.pos.y * FT;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(ac.quat), right = new THREE.Vector3(1, 0, 0).applyQuaternion(ac.quat);
    const pitch = Math.asin(Math.max(-1, Math.min(1, fwd.y))), bank = Math.asin(Math.max(-1, Math.min(1, -right.y)));
    // 1 ASI
    dial(g, 128, 'KNOTS', (g2) => arcTicks(g2, -2.3, 2.3, 16, 160, 10, 2, 2));
    g.save(); g.translate(128, CY); needle(g, -2.3 + 4.6 * Math.min(kt, 160) / 160, R - 22, '#ffd25a'); readout(g, String(Math.round(kt))); g.restore();
    // 2 attitude
    g.save(); g.translate(384, CY); g.fillStyle = '#e9d9b0'; g.beginPath(); g.arc(0, 0, R + 8, 0, 7); g.fill();
    g.save(); g.beginPath(); g.arc(0, 0, R, 0, 7); g.clip();
    g.rotate(-bank); g.translate(0, pitch * 260);
    g.fillStyle = '#2f46c4'; g.fillRect(-300, -600, 600, 600); g.fillStyle = '#c0592f'; g.fillRect(-300, 0, 600, 600);
    g.fillStyle = '#fff'; g.fillRect(-300, -3, 600, 6);
    for (let k = -3; k <= 3; k++) if (k) { g.fillRect(-(k % 2 ? 22 : 40), -k * 45 - 2, k % 2 ? 44 : 80, 4); }
    g.restore();
    g.strokeStyle = '#ffd25a'; g.lineWidth = 8; g.beginPath(); g.moveTo(-70, 0); g.lineTo(-24, 0); g.lineTo(-24, 14); g.moveTo(70, 0); g.lineTo(24, 0); g.lineTo(24, 14); g.stroke();
    g.fillStyle = '#ffd25a'; g.beginPath(); g.arc(0, 0, 7, 0, 7); g.fill();
    g.fillStyle = '#ffd25a'; g.font = '700 22px Arial'; g.textAlign = 'center'; g.fillText('ATT', 0, -R + 34); g.restore();
    // 3 altimeter
    dial(g, 640, 'ALT FT', (g2) => arcTicks(g2, 0, 6.283 * 0.9, 10, 1000, 100, 1, 1));
    g.save(); g.translate(640, CY); needle(g, (alt % 1000) / 1000 * 6.283, R - 24, '#fff4d6'); needle(g, (alt % 10000) / 10000 * 6.283, R - 62, '#f2b21c', 9); readout(g, String(Math.round(alt / 10) * 10)); g.restore();
    // 4 heading
    dial(g, 896, 'HDG', null);
    g.save(); g.translate(896, CY); g.save(); g.rotate(-hdgDeg * DEG);
    for (let a = 0; a < 360; a += 10) { g.save(); g.rotate(a * DEG); g.strokeStyle = '#f6ead0'; g.lineWidth = a % 30 ? 2.5 : 5; g.beginPath(); g.moveTo(0, -R + 6); g.lineTo(0, -R + (a % 30 ? 16 : 26)); g.stroke(); if (a % 90 === 0) { g.fillStyle = a === 0 ? '#ff5a4a' : '#fff4d6'; g.font = '900 34px Arial'; g.textAlign = 'center'; g.fillText('NESW'[a / 90], 0, -R + 62); } g.restore(); }
    g.restore();
    g.fillStyle = '#ffd25a'; g.beginPath(); g.moveTo(0, -R + 2); g.lineTo(-10, -R - 12); g.lineTo(10, -R - 12); g.fill();
    g.strokeStyle = '#ffd25a'; g.lineWidth = 6; g.beginPath(); g.moveTo(-34, 6); g.lineTo(34, 6); g.moveTo(0, -24); g.lineTo(0, 30); g.stroke();
    readout(g, String(Math.round(hdgDeg)).padStart(3, '0')); g.restore();
    // 5 fuel
    dial(g, 1152, 'FUEL', (g2) => { arcTicks(g2, -1.1, 1.1, 4, 100, 25, 1, 1); g2.strokeStyle = '#ff3b2a'; g2.lineWidth = 9; g2.beginPath(); g2.arc(0, 0, R - 10, -Math.PI / 2 - 1.1, -Math.PI / 2 - 1.1 + 2.2 * 0.15); g2.stroke(); });
    g.save(); g.translate(1152, CY); needle(g, -1.1 + 2.2 * ac.fuel / 100, R - 22, ac.fuel < 15 ? '#ff5a4a' : '#7dffb0'); readout(g, Math.round(ac.fuel) + '%'); g.restore();
    // 6 rpm
    dial(g, 1408, 'RPM x100', (g2) => arcTicks(g2, -2.3, 2.3, 12, 3000, 250, 2, 2));
    g.save(); g.translate(1408, CY); needle(g, -2.3 + 4.6 * Math.min(ac.rpm, 3000) / 3000, R - 22, '#ff9a4a'); readout(g, String(Math.round(ac.rpm / 10) * 10)); g.restore();
    tex.needsUpdate = true;
  }
  return { group, update, glare };
}
