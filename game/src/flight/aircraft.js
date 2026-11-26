// The player's aircraft state (position, attitude, fuel, damage) and its 3D model.
import * as THREE from 'three';
import { buildMailbird } from '../aircraft/mailbirdModel.js';
import { FLIGHT, STRIPS } from '../core/config.js';
import { DEG } from '../core/geo.js';

export class Aircraft {
  constructor() {
    this.model = buildMailbird();
    this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.quat = new THREE.Quaternion();
    this.ctl = { pitch: 0, roll: 0, yaw: 0 };
    this.reset({ x: 0, z: 0, heading: 0 });
  }
  // o: x,z, heading(deg), agl (0 = on ground), speed (m/s), throttle, fuel (%), flaps, groundY
  reset(o, world) {
    const gy = world ? world.groundHeight(o.x, o.z) : 0;
    this.heading = o.heading * DEG; this.gPitch = 0; this.pitchTrim = 0;
    const agl = o.agl || 0, speed = o.speed || 0;
    this.pos.set(o.x, gy + FLIGHT.gearH + agl, o.z);
    this.quat.setFromEuler(new THREE.Euler(0, -this.heading, 0, 'YXZ'));
    this.vel.set(Math.sin(this.heading) * speed, 0, -Math.cos(this.heading) * speed);
    this.throttle = o.throttle ?? (agl ? 0.55 : 0); this.fuel = o.fuel ?? 80; this.flaps = o.flaps || 0;
    this.damage = 0; this.leak = 0; this.onGround = agl === 0; this.crashed = false; this.stalled = false; this.stopped = !agl;
    this.rpm = 700; this.propAngle = 0; this.alpha = 0; this.sink = 0; this.touchedDown = !agl; this.crashReason = '';
    this.ctl.pitch = this.ctl.roll = this.ctl.yaw = 0; this.lastTouch = null; this.bounces = 0;
  }
  speed() { return this.vel.length(); }
  forward(out = new THREE.Vector3()) { return out.set(0, 0, -1).applyQuaternion(this.quat); }
  headingDeg() { const f = this.forward(); return ((Math.atan2(f.x, -f.z) / DEG) % 360 + 360) % 360; }
  syncModel(dt) {
    const m = this.model.root;
    m.position.copy(this.pos); m.quaternion.copy(this.quat);
    const spin = this.rpm / 60 * 6.283 * (this.rpm > 1200 ? 0.35 : 1);
    this.propAngle += spin * dt;
    this.model.propGroup.rotation.z = this.propAngle;
    this.model.disc.material.opacity = Math.min(0.3, Math.max(0.03, (this.rpm - 800) / 4500));
  }
}
export function placeAtThreshold(strip, fromEnd = 25) {
  const a = strip.heading * DEG;
  return { x: strip.x - Math.sin(a) * (strip.length / 2 - fromEnd), z: strip.z + Math.cos(a) * (strip.length / 2 - fromEnd), heading: strip.heading };
}
export { STRIPS };
