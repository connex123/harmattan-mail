// Boot + main loop for Harmattan Mail. Wires world, aircraft, camera, missions, HUD, audio and input together.
import * as THREE from 'three';
import { WORLD, STRIPS, SITES } from './core/config.js';
import { state, banner } from './core/gameState.js';
import { createInput } from './core/input.js';
import { createSky } from './world/skyAndHaze.js';
import { createWorld } from './world/worldBuilder.js';
import { createDust } from './effects/dustPuffs.js';
import { Aircraft } from './flight/aircraft.js';
import { stepFlight } from './flight/flightModel.js';
import { CameraRig } from './flight/cameraRig.js';
import { createCockpit } from './aircraft/cockpitInstruments.js';
import { MissionRunner } from './missions/missionRunner.js';
import { createHud } from './ui/hud.js';
import { createBriefing } from './ui/briefing.js';
import { createSound } from './audio/soundEngine.js';

const params = new URLSearchParams(location.search);
const shotName = params.get('shot'), seed = +(params.get('seed') || 1);
state.shot = !!shotName;

const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(shotName ? 2 : Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.4, 14000);
const sky = createSky(scene);
const world = createWorld(scene, seed);
const effects = createDust(scene);
const ac = new Aircraft(); scene.add(ac.model.root);
const cockpit = createCockpit(); ac.model.root.add(cockpit.group); cockpit.group.visible = false;
const rig = new CameraRig(camera);
const input = createInput(canvas);
const hud = createHud();
const audio = createSound();
const runner = new MissionRunner(scene, world, ac);
const briefing = createBriefing({ onStart: (id) => startMission(id) });

function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

function setCameraMode(mode) {
  state.cameraMode = rig.mode = mode;
  const cp = mode === 'cockpit';
  cockpit.group.visible = cp; ac.model.exterior.visible = !cp; ac.model.nose.position.y = cp ? -0.7 : -0.24;
}
function startMission(id) {
  audio.start(); state.missionId = id; runner.start(id); setCameraMode(state.cameraMode === 'cockpit' ? 'cockpit' : 'chase');
  state.phase = 'flying'; briefing.showBriefing(false); briefing.showResult(null); briefing.showPause(false); hud.show(true);
  rig.snap(ac); audio.beep();
  banner(runner.mission.title + ' — ' + runner.mission.short, 4);
}
function toBriefing() {
  state.phase = 'briefing'; runner.start(1, { place: false }); runner.marker.visible = false;
  ac.reset({ ...briefStart(), agl: 0, fuel: 100 }, world); setCameraMode('chase'); runner.result = null;
  briefing.showBriefing(true); briefing.showResult(null); briefing.showPause(false); hud.show(false); rig.snap(ac);
}
function briefStart() { return { x: 0, z: 325, heading: 0 }; }

// ---- keys
input.on('KeyC', () => setCameraMode(rig.mode === 'chase' ? 'cockpit' : 'chase'));
input.on('F1', () => setCameraMode(rig.mode === 'chase' ? 'cockpit' : 'chase'));
input.on('KeyF', () => { if (state.phase === 'flying') ac.flaps = (ac.flaps + 1) % 3; });
input.on('KeyM', () => { input.mouse.stick = !input.mouse.stick; banner('MOUSE STICK ' + (input.mouse.stick ? 'ON' : 'OFF'), 1.5); });
input.on('KeyI', () => banner('PITCH ' + (input.toggleInvert() ? 'INVERTED' : 'NORMAL'), 1.5));
input.on('KeyH', () => { if (state.phase === 'briefing') briefing.showPause(document.getElementById('pause').style.display !== 'flex'); });
input.on('Space', () => { if (state.phase === 'flying') runner.tryDrop(); });
const togglePause = () => {
  if (state.phase === 'flying') { state.phase = 'paused'; briefing.showPause(true); }
  else if (state.phase === 'paused') { state.phase = 'flying'; briefing.showPause(false); }
  else if (state.phase === 'briefing') briefing.showPause(false);
};
input.on('KeyP', togglePause); input.on('Escape', togglePause);
input.on('KeyR', () => { if (state.phase !== 'briefing') startMission(state.missionId); });
input.on('KeyB', () => toBriefing());
input.on('KeyN', () => { if (state.phase === 'ended') startMission(state.missionId % 4 + 1); });
input.on('Enter', () => { if (state.phase === 'briefing') startMission(state.missionId); else if (state.phase === 'ended') startMission(state.missionId); });
for (let i = 1; i <= 4; i++) input.on('Digit' + i, () => { if (state.phase === 'briefing') briefing.select(i); });
addEventListener('beforeunload', (e) => { if (state.phase === 'flying' && !state.shot) { e.preventDefault(); e.returnValue = ''; } });
addEventListener('pointerdown', () => audio.start());

// ---- simulation
function handleEvents(evs) {
  for (const e of evs) {
    if (e.type === 'touchdown') {
      audio.touch(e.sink);
      effects.burst(ac.pos.x, ac.pos.y - 1.2, ac.pos.z, 16 + e.sink * 4, { size: 6 + e.sink, spread: 4 + e.sink, up: 2, life: 2.4 });
      banner(e.quality + ' TOUCHDOWN' + (e.onStrip ? '' : ' — OFF THE STRIP'), 2);
    } else if (e.type === 'crash') {
      audio.crash();
      effects.burst(ac.pos.x, ac.pos.y, ac.pos.z, 40, { size: 12, spread: 9, up: 6, life: 3.5, color: 0xcf9a62, alpha: 0.7 });
      effects.burst(ac.pos.x, ac.pos.y + 1, ac.pos.z, 26, { size: 10, spread: 3, up: 8, life: 4.5, color: 0x3a342e, alpha: 0.7 });
    }
  }
}
function groundDust(dt) {
  if (!ac.onGround || ac.crashed || ac.vel.length() < 9) return;
  if (Math.random() < dt * 20) { const f = ac.forward(); effects.emit(ac.pos.x - f.x * 1.5, ac.pos.y - 1.3, ac.pos.z - f.z * 1.5, (Math.random() - 0.5) * 3 - f.x * 3, 1.5, (Math.random() - 0.5) * 3 - f.z * 3, 4, 1.6, 0xd9a46c, 0.45, 3); }
}
function simulate(dt) {
  const cin = input.read();
  const evs = stepFlight(ac, cin, dt, world, runner.env);
  handleEvents(evs); groundDust(dt);
  runner.update(dt, evs, effects);
  if (runner.result && state.phase === 'flying') {
    state.phase = 'ended'; briefing.showResult(runner.result); (runner.result.kind === 'success' ? audio.win() : null);
    banner(runner.result.title, 6);
  }
  sky.setDust(runner.env.dust, runner.env.fog);
}

const clock = new THREE.Clock();
function frame(dtRaw, o = {}) {
  const dt = Math.min(dtRaw, 0.05); state.time += dt;
  if (state.phase === 'flying' && !o.freeze) simulate(dt);
  else if (state.phase === 'ended' && !o.freeze) { stepFlight(ac, { pitch: 0, roll: 0, yaw: 0, throttleRate: -1, brake: true }, dt, world, runner.env); }
  if (o.freeze) { ac.rpm += ((700 + ac.throttle * 2000) - ac.rpm) * 0.5; }
  ac.syncModel(dt);
  rig.update(dt, ac, input, world, state.phase === 'briefing' ? 'briefing' : 'play');
  const t = state.time;
  if (runner.marker.visible) { const s = 1 + Math.sin(t * 4) * 0.03; runner.ring.scale.setScalar(s); runner.ring2.rotation.z = t; }
  const st = runner.status(); st.title = runner.mission.title; st.out = runner.env.outOfBounds;
  if (state.phase !== 'briefing') {
    hud.update(ac, st, world, dt);
    if (rig.mode === 'cockpit') cockpit.update(ac, ac.headingDeg());
  }
  sky.update(camera, ac.pos);
  effects.update(dt, camera, renderer.domElement.height);
  audio.update(ac, dt, Math.hypot(ac.pos.x - SITES.kasaire.x, ac.pos.z - SITES.kasaire.z) < 1800 || Math.hypot(ac.pos.x - SITES.market.x, ac.pos.z - SITES.market.z) < 1500);
  renderer.render(scene, camera);
}

export const game = { THREE, renderer, scene, camera, world, ac, rig, runner, effects, hud, state, input, frame, startMission, setCameraMode, sky, cockpit, STRIPS, SITES };

if (shotName) {
  new Promise((res) => setTimeout(res, 30)).then(() => import('./shots/screenshotScenes.js')).then((m) => (shotName === 'selftest' ? m.selfTest(game) : m.runShot(game, shotName, seed))).catch((e) => { console.error('BOOT_FAIL ' + e.stack); document.title = 'SHOT_FAIL'; });
} else {
  toBriefing();
  renderer.setAnimationLoop(() => frame(clock.getDelta()));
}
