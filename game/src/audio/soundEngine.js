// WebAudio synth: radial-engine drone, wind, radio beep, touchdown thump, crash, and a far market drum.
export function createSound() {
  let ctx = null, eng, eng2, engG, engF, windG, windF, master, drumT = 0;
  function start() {
    if (ctx) { ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    eng = ctx.createOscillator(); eng.type = 'sawtooth'; eng2 = ctx.createOscillator(); eng2.type = 'square';
    engF = ctx.createBiquadFilter(); engF.type = 'lowpass'; engF.frequency.value = 500; engG = ctx.createGain(); engG.gain.value = 0.0;
    eng.connect(engF); eng2.connect(engF); engF.connect(engG); engG.connect(master); eng.start(); eng2.start();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true;
    windF = ctx.createBiquadFilter(); windF.type = 'bandpass'; windF.frequency.value = 700; windF.Q.value = 0.6; windG = ctx.createGain(); windG.gain.value = 0;
    n.connect(windF); windF.connect(windG); windG.connect(master); n.start();
  }
  function tone(f, dur, type = 'sine', vol = 0.2, f2 = f) {
    if (!ctx) return; const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur);
  }
  function noise(dur, vol, freq) {
    if (!ctx) return; const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start();
  }
  return {
    start,
    update(ac, dt, nearTown) {
      if (!ctx) return; const t = ctx.currentTime, V = ac.vel.length();
      const f = ac.rpm / 60 * 2;
      eng.frequency.setTargetAtTime(f, t, 0.08); eng2.frequency.setTargetAtTime(f * 0.5, t, 0.08);
      engF.frequency.setTargetAtTime(350 + ac.throttle * 600, t, 0.1);
      engG.gain.setTargetAtTime(ac.crashed || ac.fuel <= 0 ? 0 : 0.13 + ac.throttle * 0.1, t, 0.1);
      windG.gain.setTargetAtTime(Math.min(0.35, V / 150), t, 0.2); windF.frequency.setTargetAtTime(400 + V * 14, t, 0.2);
      drumT -= dt;
      if (nearTown && drumT < 0) { drumT = 2.6; tone(110, 0.25, 'sine', 0.05, 70); setTimeout(() => tone(95, 0.25, 'sine', 0.04, 60), 380); }
    },
    beep() { tone(1400, 0.09, 'sine', 0.12); setTimeout(() => tone(1050, 0.12, 'sine', 0.12), 120); },
    warn() { tone(880, 0.18, 'square', 0.08); },
    touch(s) { noise(0.35, Math.min(0.6, 0.15 + s * 0.08), 600); tone(70, 0.3, 'sine', 0.3, 40); },
    crash() { noise(1.6, 0.8, 900); tone(60, 0.9, 'sawtooth', 0.3, 25); },
    win() { tone(660, 0.2, 'triangle', 0.15); setTimeout(() => tone(880, 0.2, 'triangle', 0.15), 180); setTimeout(() => tone(1320, 0.4, 'triangle', 0.15), 360); },
  };
}
