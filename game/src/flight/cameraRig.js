// Chase camera (above and behind, never fights the pilot), cockpit camera with mouse look, and the briefing orbit.
import * as THREE from 'three';
import { EYE } from '../aircraft/cockpitInstruments.js';
import { clamp, DEG } from '../core/geo.js';

const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _t = new THREE.Vector3(), _o = new THREE.Vector3();

export class CameraRig {
  constructor(camera) {
    this.cam = camera; this.mode = 'chase'; this.sm = new THREE.Quaternion();
    this.offset = new THREE.Vector3(0, 4.3, 16); this.aimDown = 0.0; this.lookAhead = 40;
    this.orbit = { yaw: 0, pitch: 0 }; this.head = { yaw: 0, pitch: 0 }; this.t = 0; this.fovBase = 56;
  }
  chaseFrame(ac) {
    const f = ac.forward(_v); const yaw = Math.atan2(f.x, -f.z), pitch = Math.asin(clamp(f.y, -1, 1));
    return _q.setFromEuler(_e.set(pitch * 0.45, -yaw, 0, 'YXZ'));
  }
  snap(ac) { this.sm.copy(this.chaseFrame(ac)); }
  update(dt, ac, input, world, phase) {
    const cam = this.cam; this.t += dt;
    const m = input.mouse;
    if (phase === 'briefing') {
      const a = 0.9 + Math.sin(this.t * 0.25) * 0.35;
      const p = ac.pos;
      cam.position.set(p.x + Math.sin(a) * 15, p.y + 3.0, p.z - Math.cos(a) * 15 - 4);
      cam.lookAt(p.x - 3, p.y + 1.6, p.z + 5); cam.fov = 52; cam.updateProjectionMatrix(); return;
    }
    if (this.mode === 'cockpit') {
      const ty = clamp(-m.x * 1.2, -1.25, 1.25), tp = clamp(-m.y * 0.55, -0.6, 0.6);
      const k = 1 - Math.exp(-dt * 7); this.head.yaw += (ty - this.head.yaw) * k; this.head.pitch += (tp - this.head.pitch) * k;
      _o.copy(EYE).applyQuaternion(ac.quat);
      cam.position.copy(ac.pos).add(_o);
      cam.quaternion.copy(ac.quat).multiply(_q.setFromEuler(_e.set(this.head.pitch, this.head.yaw, 0, 'YXZ')));
      if (ac.stalled) cam.position.x += Math.sin(this.t * 50) * 0.01;
      cam.fov = 66; cam.updateProjectionMatrix(); return;
    }
    // chase: heading/pitch-follow frame (roll removed), drag with the mouse to look around, springs back
    this.sm.slerp(this.chaseFrame(ac), 1 - Math.exp(-dt * 4.5));
    if (m.down) { this.orbit.yaw = clamp(this.orbit.yaw - m.dx * 0.006, -2.4, 2.4); this.orbit.pitch = clamp(this.orbit.pitch + m.dy * 0.004, -0.2, 0.9); }
    else { const s = Math.exp(-dt * 2.2); this.orbit.yaw *= s; this.orbit.pitch *= s; }
    m.dx = m.dy = 0;
    const frame = _q.copy(this.sm).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-this.orbit.pitch, this.orbit.yaw, 0, 'YXZ')));
    _o.copy(this.offset).applyQuaternion(frame);
    cam.position.copy(ac.pos).add(_o);
    const gh = world.groundHeight(cam.position.x, cam.position.z) + 2.5;
    if (cam.position.y < gh) cam.position.y = gh;
    _t.set(0, -this.aimDown, -this.lookAhead).applyQuaternion(this.sm).add(ac.pos);
    cam.up.set(0, 1, 0); cam.lookAt(_t);
    const target = this.fovBase + clamp(ac.vel.length() - 30, 0, 40) * 0.12;
    cam.fov += (target - cam.fov) * Math.min(1, dt * 3); cam.updateProjectionMatrix();
  }
}
