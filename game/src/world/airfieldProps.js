// Airfield furniture: hangar, fuel drums, lamp rows, windsocks, and the painted mission board.
import * as THREE from 'three';
import { STRIPS } from '../core/config.js';
import { MeshBuilder, flatMaterial } from '../core/geomUtil.js';
import { stripDir, DEG } from '../core/geo.js';
import { boardTexture, windsockTexture } from './textureFactory.js';
import { STRIP_RAISE } from './runways.js';

export function createAirfieldProps(scene, heightAt) {
  const b = new MeshBuilder(21), lamps = new MeshBuilder(22);
  for (const s of Object.values(STRIPS)) {
    const d = stripDir(s), rx = -d.z, rz = d.x; // right-hand unit vector
    const step = s.id === 'fada' ? 58 : 80, edge = s.width / 2 + 3;
    for (let u = -s.length / 2 + 10; u <= s.length / 2 - 10; u += step) {
      for (const side of [-1, 1]) {
        const x = s.x + d.x * u + rx * edge * side, z = s.z + d.z * u + rz * edge * side, y = heightAt(x, z) + STRIP_RAISE;
        const n = Math.round((u + s.length) / step);
        b.cyl(0.42, 0.42, 1.0, 8, { x, y: y + 0.5, z, color: n % 2 ? 0xe86a1c : 0xf3e8cf });
        b.cyl(0.43, 0.43, 0.18, 8, { x, y: y + 0.55, z, color: 0x1d2c8f });
        lamps.sphere(0.5, { x, y: y + 1.25, z, color: 0xfff1a8, jitter: 0 }, 6);
      }
    }
    // windsock on the strip's left side, mid-way
    const wx = s.x - rx * (s.width / 2 + 12), wz = s.z - rz * (s.width / 2 + 12), wy = heightAt(wx, wz);
    b.cyl(0.12, 0.16, 8, 6, { x: wx, y: wy + 4, z: wz, color: 0xf3e8cf });
    b.cyl(0.9, 0.9, 0.12, 10, { x: wx - 0.9, y: wy + 8, z: wz, rz: Math.PI / 2, color: 0x333333 });
  }
  scene.add(b.mesh()); scene.add(lamps.mesh({ shadow: false, material: flatMaterial }));

  // socks (textured cones pointing downwind = west)
  const sockMat = new THREE.MeshLambertMaterial({ map: windsockTexture(), side: THREE.DoubleSide });
  for (const s of Object.values(STRIPS)) {
    const d = stripDir(s), rx = -d.z, rz = d.x;
    const wx = s.x - rx * (s.width / 2 + 12), wz = s.z - rz * (s.width / 2 + 12);
    const g = new THREE.CylinderGeometry(0.9, 0.35, 4.2, 12, 8, true); g.rotateZ(Math.PI / 2); g.translate(-3.1, 0, 0);
    const m = new THREE.Mesh(g, sockMat); m.position.set(wx, heightAt(wx, wz) + 8, wz); m.rotation.z = -0.12; m.castShadow = true;
    scene.add(m);
  }

  // hangar + fuel drums by Fada, west of the start line
  const h = new MeshBuilder(23), hx = -62, hz = 300, hy = heightAt(hx, hz);
  h.box(22, 6.5, 13, { x: hx, y: hy + 3.25, z: hz, color: 0xe6d6b4 });
  h.box(12, 5.2, 0.4, { x: hx + 4, y: hy + 2.8, z: hz + 6.6, color: 0x1d4fa8 });
  h.box(23.5, 0.35, 8.2, { x: hx, y: hy + 7.3, z: hz - 3.3, rz: 0.0, rx: 0.4, color: 0xb9553a });
  h.box(23.5, 0.35, 8.2, { x: hx, y: hy + 7.3, z: hz + 3.3, rx: -0.4, color: 0xb9553a });
  h.box(23.8, 0.45, 0.6, { x: hx, y: hy + 8.4, z: hz, color: 0xf2b21c });
  for (let i = 0; i < 6; i++) h.cyl(0.5, 0.5, 1.1, 8, { x: hx - 14 + (i % 3) * 1.15, y: hy + 0.55, z: hz - 4 + Math.floor(i / 3) * 1.15, color: [0x1d2c8f, 0xc8202f, 0xe86a1c][i % 3] });
  scene.add(h.mesh());

  // painted mission board on two posts, facing the briefing camera (front-right of the parked plane)
  const bx = -13, bz = 313, by = heightAt(bx, bz);
  const board = new THREE.Group(); board.position.set(bx, by, bz); board.rotation.y = 3 * Math.PI / 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 4.5), new THREE.MeshBasicMaterial({ map: boardTexture() }));
  face.position.set(0, 3.9, 0.12);
  const post = new MeshBuilder(24);
  post.box(7.6, 4.9, 0.2, { x: 0, y: 3.9, z: 0, color: 0x6b3f22 });
  post.box(0.3, 3.2, 0.3, { x: -2.8, y: 1.6, z: 0, color: 0x5a3219 }); post.box(0.3, 3.2, 0.3, { x: 2.8, y: 1.6, z: 0, color: 0x5a3219 });
  board.add(post.mesh(), face); scene.add(board);
  return { board };
}
