// Runs the selected mission: places the plane, tracks steps, markers, wind/fog, drop packages and the result.
import * as THREE from 'three';
import { MISSIONS } from './missionList.js';
import { STRIPS, WORLD } from '../core/config.js';
import { headingOf, stripDir, DEG, KT } from '../core/geo.js';
import { banner } from '../core/gameState.js';

const GOLD = 0xffd23a;
export class MissionRunner {
  constructor(scene, world, ac) {
    this.scene = scene; this.world = world; this.ac = ac; this.mission = MISSIONS[0]; this.step = 0; this.result = null; this.t = 0; this.misses = 0;
    this.env = { wind: [0, 0], fog: WORLD.fogDensity, dust: 0, time: 0 };
    this.marker = new THREE.Group(); this.marker.visible = false;
    const ringMat = new THREE.MeshBasicMaterial({ color: GOLD, fog: false });
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.055, 8, 40), ringMat);
    this.ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.03, 6, 36), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
    this.col = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffc83a, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    this.marker.add(this.ring, this.ring2, this.col); scene.add(this.marker);
    this.pkgs = [];
  }
  start(id, { place = true } = {}) {
    const m = this.mission = MISSIONS.find((x) => x.id === id); this.step = 0; this.result = null; this.t = 0; this.misses = 0;
    this.stats = { landing: '-', drops: 0 };
    if (place) this.ac.reset(m.start, this.world);
    this.ac.leak = 0; this.leakOn = false;
    this.env.wind = [0, 0]; this.env.fog = WORLD.fogDensity; this.env.dust = 0;
    this.setStep(0);
  }
  setStep(i) { this.step = i; this.placeMarker(); }
  cur() { return this.mission.steps[this.step]; }
  target() {
    const s = this.cur(); if (!s) return null;
    if (s.kind === 'land') {
      const st = s.target || STRIPS[s.strips[0]], d = stripDir(st);
      return { x: st.x - d.x * (st.length / 2 - 20), z: st.z - d.z * (st.length / 2 - 20), y: this.world.heightAt(st.x, st.z) + 30, r: 40, strip: st };
    }
    return { x: s.x, z: s.z, y: this.world.heightAt(s.x, s.z) + s.agl, r: s.r };
  }
  placeMarker() {
    const s = this.cur(), t = this.target(); this.marker.visible = !!t; if (!t) return;
    const sc = t.r * (s.kind === 'land' ? 0.7 : 0.8), a = this.ac.pos;
    this.marker.position.set(t.x, t.y, t.z); this.marker.scale.setScalar(sc);
    const flat = s.kind === 'drop';
    this.marker.rotation.set(0, s.kind === 'land' ? -t.strip.heading * DEG : -headingOf(t.x - a.x, t.z - a.z) * DEG, 0);
    this.ring.rotation.x = this.ring2.rotation.x = flat ? Math.PI / 2 : 0;
    this.col.visible = flat || s.kind === 'land';
    this.col.scale.set(0.35, (flat ? 200 : 110) / sc, 0.35); this.col.position.y = (flat ? 100 : 55) / sc;
  }
  status() {
    const s = this.cur(), t = this.target(), a = this.ac.pos;
    if (!s || !t) return { objective: 'MISSION COMPLETE', dist: 0, bearing: 0 };
    return { objective: s.text, dist: Math.hypot(t.x - a.x, t.z - a.z), bearing: headingOf(t.x - a.x, t.z - a.z), step: this.step + 1, steps: this.mission.steps.length };
  }
  tryDrop() {
    const s = this.cur(), a = this.ac;
    if (a.onGround || a.crashed) return;
    const agl = a.pos.y - this.world.groundHeight(a.pos.x, a.pos.z);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: 0xc8202f }));
    m.position.copy(a.pos); m.position.y -= 1.5; m.castShadow = true; this.scene.add(m);
    this.pkgs.push({ m, v: a.vel.clone().multiplyScalar(0.9), hit: s && s.kind === 'drop' });
    if (!s || s.kind !== 'drop') banner('PACKAGE DROPPED — NOT ON THE TARGET', 2.5);
    else this.pending = { s, x: a.pos.x, z: a.pos.z, agl };
  }
  update(dt, evs, effects) {
    const a = this.ac, m = this.mission; this.t += dt; this.env.time += dt;
    // packages fall
    for (const p of this.pkgs) {
      if (p.done) continue; p.v.y -= 9.81 * dt; p.m.position.addScaledVector(p.v, dt);
      const gh = this.world.groundHeight(p.m.position.x, p.m.position.z);
      if (p.m.position.y < gh + 0.3) {
        p.done = true; p.m.position.y = gh + 0.3; effects.burst(p.m.position.x, gh + 0.5, p.m.position.z, 8, { size: 5, spread: 3, life: 1.4 });
        const s = this.cur();
        if (s && s.kind === 'drop' && Math.hypot(p.m.position.x - s.x, p.m.position.z - s.z) < 26) { this.stats.drops++; banner('DIRECT HIT — PACKAGE DELIVERED', 3); this.setStep(this.step + 1); }
        else if (s && s.kind === 'drop') { this.misses++; banner(this.misses >= 3 ? 'THREE MISSES — MISSION FAILED' : 'MISSED THE COURTYARD — CIRCLE AND TRY AGAIN', 3); if (this.misses >= 3) this.finish('fail', 'MISSION FAILED', 'The package never reached the clinic.'); }
      }
    }
    if (this.result) return;
    if (m.leak && !this.leakOn && this.t > 1) { this.leakOn = true; a.leak = m.leak; this.env.wind = m.wind || [0, 0]; banner('FUEL LEAK! HEADWIND! DIVERT TO GOSSI PAN', 5); }
    if (m.whiteout) { const k = Math.min(1, this.t / 70); this.env.fog = WORLD.fogDensity + (0.0021 - WORLD.fogDensity) * k; this.env.dust = k * 0.85; }
    const s = this.cur();
    if (s && s.kind === 'gate') {
      const t = this.target();
      if (Math.hypot(t.x - a.pos.x, t.y - a.pos.y, t.z - a.pos.z) < t.r) { banner('GATE', 1.2); this.setStep(this.step + 1); }
    }
    for (const e of evs) {
      if (e.type === 'crash') return this.finish('crash', 'CRASHED', e.reason);
      if (e.type === 'touchdown') this.stats.landing = e.quality + (e.onStrip ? '' : ' (OFF STRIP)');
      if (e.type === 'stopped' && this.cur() && this.cur().kind === 'land') {
        if (e.onStrip && this.cur().strips.includes(e.strip.id)) {
          return this.finish('success', m.success, 'Landed on ' + e.strip.name + (a.damage > 25 ? ' — the airframe is hurting.' : ' — ' + this.stats.landing + ' landing.'));
        }
        return this.finish('fail', 'DOWN SAFE', 'But not on a strip of the route. Mission incomplete.');
      }
    }
    if (a.fuel <= 0 && a.onGround && a.stopped && !this.result) this.finish('fail', 'OUT OF FUEL', 'The tank ran dry on the ground.');
  }
  finish(kind, title, sub) {
    const a = this.ac;
    this.result = { kind, title, sub, stats: { time: Math.round(this.t), fuel: Math.round(a.fuel), damage: Math.round(a.damage), landing: this.stats.landing } };
    this.marker.visible = false;
  }
}
