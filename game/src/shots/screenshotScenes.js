// Deterministic staged scenes for ?shot=<name>&seed=1. They use the real renderer, world, aircraft, HUD and instruments,
// placing the plane at a decisive moment of play and freezing the sim (only camera, HUD, props and effects run).
import { DEG } from '../core/geo.js';
import { banner } from '../core/gameState.js';

function pose(g, o) {
  const { THREE, ac, world } = g;
  ac.reset({ x: o.x, z: o.z, heading: o.heading, agl: o.agl, speed: o.speed, throttle: o.throttle, fuel: o.fuel, flaps: o.flaps || 0 }, world);
  ac.onGround = false; ac.stopped = false;
  ac.quat.setFromEuler(new THREE.Euler((o.pitch || 0) * DEG, -o.heading * DEG, -(o.bank || 0) * DEG, 'YXZ'));
  const f = ac.forward(); ac.vel.copy(f).multiplyScalar(o.speed);
  ac.rpm = 700 + o.throttle * 2000;
}

function css(text) {
  const el = document.createElement('style'); el.textContent = text; document.head.appendChild(el);
}
// Shot HUD layout: speed/alt move to the lower corners so the aircraft, ring and landmarks stay clear.
const LOW_HUD = '#hud .gauge{top:auto!important;bottom:110px;width:200px;padding:6px 12px}#hud .gauge .big{font-size:60px}#hud #missionBox{width:340px;padding:6px 14px}#hud #mTitle{font-size:34px}'
  + '#hud #fuelBox,#hud #thrBox{width:300px}#hud #hint{display:none}#hud #fuelBox .lab,#hud #thrBox .lab{font-size:24px}';

const SCENES = {
  // THE COVER: chase view, clinic-drop mission on its last step, ring over the Fada threshold, minaret + baobabs + huts.
  chase(g) {
    g.startMission(1); g.runner.setStep(4);
    pose(g, { x: -48, z: 520, heading: 0, agl: 58, speed: 46, throttle: 0.6, fuel: 78, pitch: -3, bank: 5, flaps: 1 });
    g.rig.offset.set(2.4, 3.6, 10.5); g.rig.aimDown = 3.0; g.rig.lookAhead = 18; g.rig.fovBase = 64;
    g.sky.setDust(0.55, 0.0011);
    css(LOW_HUD + '#hud #thrBox{display:none}#hud #altBox{bottom:20px}#hud #mObj,#hud #mWpt{font-size:15px}');
    g.state.bannerT = 0;
  },
  // DUST WHITEOUT: thick haze, strip and lamp row dimly ahead, external nose hidden so the glass shows only world.
  cockpit(g) {
    g.startMission(1); g.runner.setStep(4);
    pose(g, { x: 3, z: 485, heading: 0, agl: 36, speed: 42, throttle: 0.55, fuel: 64, pitch: -1.5, bank: 0, flaps: 1 });
    g.setCameraMode('cockpit'); g.ac.model.nose.visible = false; g.state.bannerT = 0;
    g.sky.setDust(0.95, 0.0034);
    css('#hud #mTitle{font-size:0}#hud #mTitle:after{content:"DUST WHITEOUT";font-size:34px}');
  },
  // FUEL DIVERT: LOW FUEL warning kept big but up top; plane, strip and ring stay clear below it.
  mission(g) {
    g.startMission(4); g.runner.leakOn = true; g.runner.t = 40;
    pose(g, { x: 3180, z: 1800, heading: 90, agl: 55, speed: 40, throttle: 0.25, fuel: 8, pitch: -3, bank: -3 });
    g.ac.leak = 0.03; g.runner.env.wind = [-6, 0];
    g.rig.offset.set(3.0, 3.6, 11.5); g.rig.aimDown = 2.4; g.rig.lookAhead = 18; g.rig.fovBase = 62;
    css(LOW_HUD + '#hud #warn{top:140px;font-size:64px;padding:0 30px;letter-spacing:4px}#hud #banner{font-size:24px;width:380px;max-width:380px;bottom:20px}#hud #fuelBox{width:330px}#hud #thrBox{display:none}#hud #altBox{bottom:20px}');
    banner('FUEL LEAK! DIVERT TO GOSSI PAN', 99);
  },
  // CATTLE-MARKET MAIL: short-field flare with heavy laterite dust at the gear, kraal and stalls to the side.
  landing(g) {
    g.startMission(2); g.runner.setStep(1);
    pose(g, { x: 2200, z: -1500, heading: 90, agl: 2.0, speed: 32, throttle: 0.08, fuel: 41, pitch: 7, bank: 0, flaps: 2 });
    g.rig.offset.set(5.2, 3.4, 12.5); g.rig.aimDown = 0.8; g.rig.lookAhead = 16; g.rig.fovBase = 62;
    css(LOW_HUD + '#hud #banner{font-size:22px;width:340px;max-width:340px;left:auto;right:20px;transform:none;bottom:20px}#hud #thrBox{display:none}');
    banner('SHORT FIELD — HOLD THE FLARE', 99);
  },
};

export async function runShot(g, name, seed) {
  const scene = SCENES[name] || SCENES.chase;
  g.state.phase = 'flying'; g.hud.show(true);
  document.getElementById('briefing').style.display = 'none';
  scene(g);
  g.rig.snap(g.ac);
  const gh = g.world.groundHeight(g.ac.pos.x, g.ac.pos.z);
  for (let i = 0; i < 6; i++) g.frame(1 / 30, { freeze: true });
  if (name === 'landing' && !location.search.includes('nodust')) {
    const f = g.ac.forward();
    for (let i = 0; i < 70; i++) {
      const d = -7 + i * 0.17, sd = (i % 2 ? 1 : -1) * (1.0 + (i % 6) * 0.6);
      g.effects.burst(g.ac.pos.x - f.x * d, gh + 0.3, g.ac.pos.z - f.z * d + sd, 1, { size: 1.0 + (i % 4) * 0.45, spread: 1.2, up: 1.2, life: 3, aged: true, alpha: 0.8, color: i % 3 ? 0xcf7a34 : 0xe3a25c });
    }
  }
  for (let i = 0; i < 4; i++) g.frame(1 / 30, { freeze: true });
  document.title = 'SHOT_READY';
  g.renderer.setAnimationLoop(() => g.frame(0.0001, { freeze: true }));
}

// Headless flight smoke test (?shot=selftest): takeoff, climb, stall recovery and an approach, reported in document.title.
export async function selfTest(g) {
  const { stepFlight } = await import('../flight/flightModel.js');
  const { ac, world, runner } = g;
  g.startMission(1);
  const log = [];
  let lifted = false, t = 0;
  const env = runner.env;
  ac.throttle = 1;
  for (; t < 60; t += 1 / 30) {
    const sp = ac.vel.length();
    const agl = ac.pos.y - world.groundHeight(ac.pos.x, ac.pos.z);
    const pitch = ac.onGround ? (sp > 30 ? 0.3 : 0) : sp < 36 ? -0.3 : sp > 42 && agl < 250 && ac.vel.y < 6 ? 0.3 : 0;
    const inp = { pitch, roll: 0, yaw: 0, throttleRate: 0, brake: false };
    const evs = stepFlight(ac, inp, 1 / 30, world, env);
    runner.update(1 / 30, evs, g.effects);
    if (evs.some((e) => e.type === 'liftoff')) lifted = true;
    if (evs.some((e) => e.type === 'crash')) { log.push('crash:' + evs.find((e) => e.type === 'crash').reason); break; }
    if (Math.round(t * 30) % 60 === 0 && t < 60 && Math.round(t) % 4 === 0) log.push(`${t.toFixed(0)}s g=${ac.onGround ? 1 : 0} gp=${ac.gPitch.toFixed(2)} th=${ac.throttle.toFixed(1)} v=${sp.toFixed(1)} agl=${agl.toFixed(0)}`);
  }
  document.title = 'SELFTEST lifted=' + lifted + ' ' + log.join(' | ');
}
