// Arcade flight model with discipline: lift ~ V^2 and angle of attack, a recoverable stall, drag that
// punishes hard turns, throttle thrust, fuel burn, flaps, and landings that bounce, damage or crash.
import * as THREE from 'three';
import { FLIGHT as F } from '../core/config.js';
import { clamp, DEG, FT } from '../core/geo.js';

const fwd = new THREE.Vector3(), up = new THREE.Vector3(), right = new THREE.Vector3(), tmp = new THREE.Vector3(), dq = new THREE.Quaternion(), eul = new THREE.Euler();

export function stepFlight(ac, inp, dt, world, env = {}) {
  const ev = [];
  if (ac.crashed) { ac.vel.multiplyScalar(0.9); return ev; }
  const k = 1 - Math.exp(-dt * 6);
  ac.ctl.pitch += (inp.pitch - ac.ctl.pitch) * k; ac.ctl.roll += (inp.roll - ac.ctl.roll) * k; ac.ctl.yaw += (inp.yaw - ac.ctl.yaw) * k;
  ac.throttle = clamp(ac.throttle + inp.throttleRate * 0.4 * dt, 0, 1);

  // fuel
  const engineOn = ac.fuel > 0;
  if (engineOn) ac.fuel = Math.max(0, ac.fuel - (0.012 + 0.09 * ac.throttle + ac.leak) * dt);
  const thr = engineOn ? ac.throttle : 0;
  const targetRpm = engineOn ? 700 + thr * 2000 : Math.min(900, ac.vel.length() * 18);
  ac.rpm += (targetRpm - ac.rpm) * Math.min(1, dt * 2.5);

  ac.forward(fwd); up.set(0, 1, 0).applyQuaternion(ac.quat); right.set(1, 0, 0).applyQuaternion(ac.quat);
  const V = ac.vel.length();
  const vf = ac.vel.dot(fwd), vu = ac.vel.dot(up), vr = ac.vel.dot(right);
  const alpha = V > 2 ? Math.atan2(-vu, Math.max(vf, 0.5)) : 0;
  ac.alpha = alpha;
  const aStall = F.aStall + (ac.flaps ? -0.01 : 0);
  const stalled = V > 6 && alpha > aStall && !ac.onGround;
  ac.stalled = stalled;
  const flapCL = 0.28 * ac.flaps;
  let CL = alpha < aStall ? F.clSlope * alpha + flapCL : Math.max(0.35, (F.clSlope * aStall + flapCL) * (1 - (alpha - aStall) * 3.2));
  CL = Math.max(CL, -0.7);
  const liftA = F.k * V * V * CL;

  // forces (m/s^2)
  const drag = (F.drag * (1 + 6 * alpha * alpha + (stalled ? 1.5 : 0)) + 0.00032 * ac.flaps + (thr < 0.12 ? 0.00022 : 0)) * V * V + 0.0001 * liftA * liftA / Math.max(V, 12);
  const thrust = F.thrust * thr * (1 - V / 190);
  ac.vel.addScaledVector(up, liftA * dt);
  ac.vel.addScaledVector(fwd, thrust * dt);
  if (V > 0.01) ac.vel.addScaledVector(tmp.copy(ac.vel).normalize(), -drag * dt);
  ac.vel.y -= F.g * dt;
  ac.vel.addScaledVector(right, -vr * Math.min(1, dt * 1.2));
  // soft world limit
  const lim = 5200;
  for (const ax of ['x', 'z']) { const p = ac.pos[ax]; if (Math.abs(p) > lim) ac.vel[ax] -= Math.sign(p) * 8 * dt; }
  env.outOfBounds = Math.abs(ac.pos.x) > lim - 400 || Math.abs(ac.pos.z) > lim - 400;

  // ---- attitude
  const auth = clamp(V / 28, 0.3, 1);
  if (!ac.onGround) {
    const aTrim = clamp(F.g / (F.k * F.clSlope * Math.max(V * V, 400)) - 0.02, 0.03, 0.27);
    let q = ac.ctl.pitch * 0.72 * auth - 3.0 * (alpha - aTrim);
    if (stalled) q -= 0.9;
    const beta = Math.atan2(vr, Math.max(vf, 5));
    let yawRate = ac.ctl.yaw * 0.5 * auth + beta * 1.6 + (-right.y) * F.g / Math.max(V, 22) * 0.55;
    const bank = Math.asin(clamp(-right.y, -1, 1));
    let roll = ac.ctl.roll * 1.9 * (0.5 + 0.5 * auth);
    if (Math.abs(ac.ctl.roll) < 0.05 && Math.abs(bank) < 1.2) roll -= bank * 0.35;
    if (stalled) roll += Math.sin(env.time * 9) * 0.5 * (1 - Math.abs(ac.ctl.roll));
    eul.set(q * dt, -yawRate * dt, -roll * dt, 'YXZ'); dq.setFromEuler(eul); ac.quat.multiply(dq).normalize();
  } else {
    // wheels down: rudder/aileron steer, elevator rotates once there is speed, wings level
    const sp = ac.vel.length();
    ac.heading += (ac.ctl.yaw * 0.7 + ac.ctl.roll * 0.45) * clamp(0.25 + sp / 8, 0, 1) * dt;
    ac.gPitch = clamp(ac.gPitch + (ac.ctl.pitch * 0.5 * clamp(sp / 18, 0, 1) - (ac.ctl.pitch <= 0.05 ? 0.35 : 0)) * dt, 0, 0.2);
    eul.set(ac.gPitch, -ac.heading, 0, 'YXZ'); dq.setFromEuler(eul);
    ac.quat.slerp(dq, 1 - Math.exp(-dt * 10));
  }

  // ---- integrate with wind (air mass moves)
  const wind = env.wind || [0, 0];
  ac.pos.addScaledVector(ac.vel, dt);
  if (!ac.onGround || ac.pos.y > 0) { ac.pos.x += wind[0] * dt; ac.pos.z += wind[1] * dt; }

  // ---- obstacles (trees, minaret, huts)
  for (const o of world.obstacles) {
    const dx = ac.pos.x - o.x, dz = ac.pos.z - o.z;
    if (dx * dx + dz * dz < (o.r + 1.4) * (o.r + 1.4) && ac.pos.y - world.heightAt(o.x, o.z) < o.top) return crash(ac, ev, 'Hit a landmark', world);
  }

  // ---- ground contact
  const gh = world.groundHeight(ac.pos.x, ac.pos.z), feet = ac.pos.y - F.gearH * Math.max(up.y, 0.6);
  if (feet <= gh) {
    const surf = world.surfaceAt(ac.pos.x, ac.pos.z), onStrip = surf.type === 'strip';
    ac.pos.y = gh + F.gearH * Math.max(up.y, 0.6);
    if (!ac.onGround) {
      const sink = Math.max(0, -ac.vel.y), speed = ac.vel.length();
      const pitchD = Math.asin(clamp(fwd.y, -1, 1)) / DEG, bankD = Math.abs(Math.asin(clamp(-right.y, -1, 1)) / DEG);
      const hard = sink > 8.5 || bankD > 35 || pitchD < -14 || (!onStrip && (sink > 4.6 || speed > 34)) || ac.vel.y < -12;
      if (hard) return crash(ac, ev, sink > 8.5 ? 'Hit the ground too hard' : bankD > 35 ? 'Landed on a wing' : !onStrip ? 'Rough ground off the strip' : 'Nose-first impact', world);
      let dmg = Math.max(0, sink - 3.2) * 7 + Math.max(0, bankD - 8) * 0.5 + Math.max(0, speed - 42) * 0.5 + (onStrip ? 0 : 6);
      ac.damage = Math.min(99, ac.damage + dmg);
      const quality = sink < 2.2 && bankD < 5 ? 'SMOOTH' : sink < 4 ? 'FIRM' : 'HARD';
      ac.lastTouch = { sink, speed, onStrip, strip: surf.strip, quality, dmg, u: surf.u, v: surf.v };
      ev.push({ type: 'touchdown', ...ac.lastTouch });
      ac.touchedDown = true;
      if (sink > 4.2 && ac.bounces < 2) { ac.vel.y = sink * 0.36; ac.bounces++; ac.pos.y += 0.1; }
      else { ac.vel.y = 0; ac.onGround = true; ac.heading = Math.atan2(fwd.x, -fwd.z); ac.gPitch = clamp(Math.asin(clamp(fwd.y, -1, 1)), 0, 0.2); }
    } else if (ac.vel.y < 0) ac.vel.y = 0;
    if (ac.onGround) {
      // rolling resistance, brakes, flatten velocity along heading
      let sp = Math.max(0, ac.vel.x * Math.sin(ac.heading) - ac.vel.z * Math.cos(ac.heading));
      const fr = onStrip ? 0.45 : 2.2, br = inp.brake ? 7 : 0;
      sp = Math.max(0, sp - (fr + br) * dt);
      if (!onStrip && sp > 3) ac.damage = Math.min(99, ac.damage + dt * 1.2);
      ac.vel.set(Math.sin(ac.heading) * sp, ac.vel.y, -Math.cos(ac.heading) * sp);
      if (ac.vel.y > 0.2 && sp > 5) { ac.onGround = false; ac.bounces = 0; ev.push({ type: 'liftoff' }); }
      if (sp < 0.6 && thr < 0.15 && !ac.stopped) { ac.stopped = true; ev.push({ type: 'stopped', onStrip, strip: surf.strip, u: surf.u, v: surf.v }); }
      if (sp > 1.5) ac.stopped = false;
    }
  } else if (ac.onGround && feet > gh + 0.4) { ac.onGround = false; ac.bounces = 0; ac.stopped = false; ev.push({ type: 'liftoff' }); }
  if (ac.damage >= 99) return crash(ac, ev, 'Airframe broke up', world);
  return ev;
}

function crash(ac, ev, reason, world) {
  ac.crashed = true; ac.crashReason = reason; ac.onGround = true; ac.stopped = true; ac.vel.set(0, 0, 0);
  const gh = world.groundHeight(ac.pos.x, ac.pos.z);
  ac.pos.y = Math.max(gh + 0.9, Math.min(ac.pos.y, gh + 3));
  eul.set(-0.45, -ac.headingDeg() * DEG + 0.2, 0.55, 'YXZ'); ac.quat.setFromEuler(eul);
  ev.push({ type: 'crash', reason, speed: 0 });
  return ev;
}
export const altitudeFt = (ac, world) => (ac.pos.y - F.gearH - world.groundHeight(ac.pos.x, ac.pos.z)) * FT;
