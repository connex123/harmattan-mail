// Kasaire K-3 Mailbird: high-wing bush plane. Forward is -z, up +y, right +x. Origin = fuselage centre.
import * as THREE from 'three';
import { fuselageLivery, wingLivery, tailLivery } from './livery.js';
import { FLIGHT } from '../core/config.js';

const lam = (o) => new THREE.MeshLambertMaterial(o);

export function buildMailbird() {
  const root = new THREE.Group(), exterior = new THREE.Group(), nose = new THREE.Group(), propGroup = new THREE.Group();
  root.add(exterior, nose); nose.position.y = -0.24;
  const add = (parent, geo, mat, x = 0, y = 0, z = 0, o = {}) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
    if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz;
    if (o.s) m.scale.set(...o.s);
    m.castShadow = true; parent.add(m); return m;
  };
  const fusMat = lam({ map: fuselageLivery() }), wingMat = lam({ map: wingLivery() }), tailMat = lam({ map: tailLivery() });
  const cream = lam({ color: 0xf3e8cf }), steel = lam({ color: 0x9aa0a4 }), dark = lam({ color: 0x1b1b1f }), glass = lam({ color: 0x2c4050 });
  const red = lam({ color: 0xc8202f }), white = lam({ color: 0xf8f2e2 }), indigo = lam({ color: 0x1d2c8f }), gold = lam({ color: 0xf2b21c });

  // fuselage (nose at -z), cowling + spinner + prop on the nose group (stay visible in the cockpit view)
  add(exterior, new THREE.CylinderGeometry(0.82, 0.26, 6.6, 20), fusMat, 0, 0, 0.8, { rx: -Math.PI / 2, s: [1, 1, 1.15] });
  add(exterior, new THREE.BoxGeometry(1.55, 0.95, 2.4), fusMat, 0, 0.72, -0.1);
  add(exterior, new THREE.BoxGeometry(1.5, 0.32, 0.5), glass, 0, 0.98, -1.35, { rx: 0.5 });       // windscreen
  for (const sd of [-1, 1]) {
    add(exterior, new THREE.BoxGeometry(0.05, 0.5, 1.9), glass, sd * 0.79, 0.88, -0.1);             // side windows
  }
  add(nose, new THREE.CylinderGeometry(0.86, 0.8, 1.3, 20), dark, 0, 0, -2.45, { rx: Math.PI / 2, s: [1, 1, 1.15] });
  add(nose, new THREE.TorusGeometry(0.84, 0.07, 6, 20), red, 0, 0, -3.08, { s: [1, 1.15, 1] });
  add(nose, new THREE.ConeGeometry(0.32, 0.78, 14), white, 0, 0, -3.5, { rx: -Math.PI / 2 });
  add(nose, new THREE.ConeGeometry(0.32, 0.4, 14), red, 0, 0, -3.3, { rx: -Math.PI / 2 }).scale.set(1.01, 0.6, 1.01);
  nose.add(propGroup); propGroup.position.set(0, 0, -3.62);
  for (const a of [0, Math.PI / 2]) { const bl = add(propGroup, new THREE.BoxGeometry(0.2, 2.15, 0.05), dark, 0, 0, 0); bl.rotation.z = a; add(bl, new THREE.BoxGeometry(0.21, 0.4, 0.06), gold, 0, 0.85, 0).castShadow = false; add(bl, new THREE.BoxGeometry(0.21, 0.4, 0.06), gold, 0, -0.85, 0).castShadow = false; }
  const disc = add(propGroup, new THREE.CircleGeometry(1.08, 24), new THREE.MeshBasicMaterial({ color: 0xcfc3a8, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }), 0, 0, 0.02);
  disc.castShadow = false;
  // exhaust stubs
  for (const sd of [-1, 1]) add(exterior, new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6), steel, sd * 0.55, -0.45, -1.7, { rx: Math.PI / 2 });

  // wing + struts + wingtips
  add(exterior, new THREE.BoxGeometry(11.2, 0.2, 1.9), wingMat, 0, 1.52, -0.15);
  for (const sd of [-1, 1]) {
    add(exterior, new THREE.BoxGeometry(0.5, 0.22, 2.0), red, sd * 5.75, 1.52, -0.15);
    add(exterior, new THREE.BoxGeometry(0.5, 0.24, 0.6), white, sd * 5.75, 1.52, -0.9);
    for (const zz of [-0.6, 0.5]) {
      const a = new THREE.Vector3(sd * 0.55, 0.0, zz * 0.6), bb = new THREE.Vector3(sd * 3.2, 1.45, zz - 0.15);
      const dir = bb.clone().sub(a), len = dir.length();
      const s = add(exterior, new THREE.CylinderGeometry(0.06, 0.06, len, 6), cream);
      s.position.copy(a).addScaledVector(dir, 0.5); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    }
    add(exterior, new THREE.BoxGeometry(2.6, 0.06, 0.55), indigo, sd * 3.0, 1.4, 0.85);           // aileron stripe
  }
  // tail
  add(exterior, new THREE.BoxGeometry(0.14, 1.7, 1.5), tailMat, 0, 1.05, 3.55, { rx: -0.22 });
  add(exterior, new THREE.BoxGeometry(0.16, 0.45, 1.1), gold, 0, 1.98, 3.78, { rx: -0.22 });
  add(exterior, new THREE.BoxGeometry(3.8, 0.12, 1.1), tailMat, 0, 0.42, 3.55);
  for (const sd of [-1, 1]) add(exterior, new THREE.BoxGeometry(0.4, 0.14, 1.12), red, sd * 1.9, 0.42, 3.55);
  // landing gear (wheel bottoms sit at -gearH) + tail wheel
  for (const sd of [-1, 1]) {
    const a = new THREE.Vector3(sd * 0.45, -0.5, -0.2), bb = new THREE.Vector3(sd * 1.15, -1.1, -0.45), dir = bb.clone().sub(a);
    const leg = add(exterior, new THREE.CylinderGeometry(0.07, 0.07, dir.length(), 6), steel);
    leg.position.copy(a).addScaledVector(dir, 0.5); leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    add(exterior, new THREE.CylinderGeometry(0.44, 0.44, 0.26, 14), dark, sd * 1.18, -FLIGHT.gearH + 0.44, -0.45, { rz: Math.PI / 2 });
    add(exterior, new THREE.CylinderGeometry(0.2, 0.2, 0.28, 10), cream, sd * 1.18, -FLIGHT.gearH + 0.44, -0.45, { rz: Math.PI / 2 });
    add(exterior, new THREE.BoxGeometry(0.4, 0.05, 0.9), red, sd * 1.18, -FLIGHT.gearH + 0.95, -0.45); // wheel spat
  }
  add(exterior, new THREE.CylinderGeometry(0.14, 0.14, 0.12, 8), dark, 0, -0.85, 3.55, { rz: Math.PI / 2 });
  add(exterior, new THREE.CylinderGeometry(0.04, 0.04, 0.8, 5), steel, 0, -0.5, 3.4, { rx: 0.2 });
  root.traverse((m) => { if (m.isMesh && m.material.map) m.material.map.anisotropy = 8; });
  return { root, exterior, nose, propGroup, disc };
}
