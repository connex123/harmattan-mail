// HTML/CSS HUD: altitude, speed, heading tape, fuel, throttle, mission box and the huge warnings.
import { KT, FT } from '../core/geo.js';
import { state } from '../core/gameState.js';

const $ = (id) => document.getElementById(id);
export function createHud() {
  const el = { title: $('mTitle'), obj: $('mObj'), wpt: $('mWpt'), spd: $('spd'), alt: $('alt'), agl: $('agl'), vs: $('vs'), hdg: $('hdg'), fuelBar: $('fuelBar'), fuelPct: $('fuelPct'),
    thrBar: $('thrBar'), thrPct: $('thrPct'), flaps: $('flaps'), warn: $('warn'), banner: $('banner'), tape: $('tape'), cam: $('camTag'), dmg: $('dmg'), hud: $('hud'), fuelBox: $('fuelBox') };
  const tg = el.tape.getContext('2d');
  function drawTape(h) {
    const W = el.tape.width, H = el.tape.height; tg.clearRect(0, 0, W, H);
    tg.fillStyle = 'rgba(28,16,8,0.7)'; tg.fillRect(0, 0, W, H);
    const ppd = 7;
    tg.font = '900 26px Arial'; tg.textAlign = 'center'; tg.textBaseline = 'middle';
    for (let d = -50; d <= 50; d++) {
      const deg = Math.round(h) + d, x = W / 2 + (deg - h) * ppd; if (x < 0 || x > W) continue;
      const a = ((deg % 360) + 360) % 360;
      if (a % 10 === 0) {
        tg.fillStyle = '#fff4d6'; tg.fillRect(x - 1.5, 0, 3, a % 30 === 0 ? 20 : 13);
        const lab = a % 90 === 0 ? 'NESW'[a / 90] : a % 30 === 0 ? String(a / 10).padStart(2, '0') : '';
        if (lab) { tg.fillStyle = a % 90 === 0 ? (a === 0 ? '#ff6a55' : '#ffd25a') : '#fff4d6'; tg.fillText(lab, x, 40); }
      }
    }
    tg.fillStyle = '#ffd25a'; tg.beginPath(); tg.moveTo(W / 2, H); tg.lineTo(W / 2 - 11, H - 14); tg.lineTo(W / 2 + 11, H - 14); tg.fill();
  }
  return {
    show(v) { el.hud.style.display = v ? 'block' : 'none'; },
    update(ac, st, world, dt) {
      const V = ac.vel.length() * KT, gh = world.groundHeight(ac.pos.x, ac.pos.z);
      const altFt = (ac.pos.y - 1.55) * FT, agl = (ac.pos.y - 1.55 - gh);
      const hdg = ac.headingDeg();
      el.title.textContent = st.title; el.obj.textContent = st.objective;
      el.wpt.textContent = st.dist ? `WPT ${(st.dist / 1000).toFixed(1)} KM   BRG ${String(Math.round(st.bearing)).padStart(3, '0')}°` + (st.steps > 1 ? `   STEP ${st.step}/${st.steps}` : '') : '';
      el.spd.textContent = Math.round(V); el.alt.textContent = Math.round(altFt / 5) * 5; el.agl.textContent = 'AGL ' + Math.max(0, Math.round(agl)) + ' m';
      el.vs.textContent = (ac.vel.y >= 0 ? '▲ ' : '▼ ') + Math.abs(Math.round(ac.vel.y * FT * 60 / 10) * 10) + ' fpm';
      el.hdg.textContent = String(Math.round(hdg) % 360).padStart(3, '0') + '°';
      el.fuelBar.style.width = ac.fuel + '%'; el.fuelPct.textContent = Math.round(ac.fuel) + '%';
      el.fuelBar.className = ac.fuel < 15 ? 'low' : '';
      el.thrBar.style.width = ac.throttle * 100 + '%'; el.thrPct.textContent = Math.round(ac.throttle * 100) + '%';
      el.flaps.textContent = 'FLAPS ' + ['UP', '1', '2'][ac.flaps]; el.dmg.textContent = 'DMG ' + Math.round(ac.damage) + '%';
      el.dmg.className = ac.damage > 40 ? 'low' : '';
      el.hud.classList.toggle('cockpit', state.cameraMode === 'cockpit'); el.cam.textContent = state.cameraMode === 'cockpit' ? 'COCKPIT [C]' : 'CHASE [C]';
      let w = '';
      const agl2 = agl;
      if (ac.crashed) w = '';
      else if (ac.fuel <= 0) w = 'ENGINE OUT — GLIDE!';
      else if (ac.fuel < 15) w = 'LOW FUEL';
      else if (ac.stalled || (!ac.onGround && V < 56 && agl2 > 3 && ac.alpha > 0.22)) w = 'STALL';
      else if (!ac.onGround && agl2 < 60 && ac.vel.y * 1 < -6) w = 'PULL UP';
      else if (st.out) w = 'TURN BACK';
      el.warn.textContent = w; el.warn.style.display = w ? 'block' : 'none';
      el.warn.className = (w === 'STALL' || w === 'PULL UP' ? 'amber' : '') + (Math.floor(state.time * 3) % 2 ? ' blink' : '');
      el.fuelBox.className = ac.fuel < 15 ? 'lowbox' : '';
      if (state.bannerT > 0) { state.bannerT -= dt; el.banner.textContent = state.banner; el.banner.style.display = 'block'; } else el.banner.style.display = 'none';
      drawTape(hdg);
    },
  };
}
