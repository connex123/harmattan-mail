// Keyboard and mouse. Stick axes come from held keys (and optionally the mouse); one-shot keys fire callbacks.
export function createInput(canvas) {
  const held = new Set(), once = new Map();
  const mouse = { x: 0, y: 0, down: false, dx: 0, dy: 0, stick: false };
  const GAME = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'Tab', 'ShiftLeft', 'ShiftRight']);
  addEventListener('keydown', (e) => {
    if (GAME.has(e.code)) e.preventDefault();
    if (!held.has(e.code)) { held.add(e.code); const f = once.get(e.code); if (f) f(e); }
  });
  addEventListener('keyup', (e) => held.delete(e.code));
  addEventListener('blur', () => held.clear());
  addEventListener('mousemove', (e) => {
    const nx = e.clientX / innerWidth * 2 - 1, ny = e.clientY / innerHeight * 2 - 1;
    mouse.dx += e.movementX || 0; mouse.dy += e.movementY || 0; mouse.x = nx; mouse.y = ny;
  });
  addEventListener('mousedown', () => { mouse.down = true; });
  addEventListener('mouseup', () => { mouse.down = false; });
  let invert = false;
  const dz = (v) => (Math.abs(v) < 0.12 ? 0 : v - Math.sign(v) * 0.12);
  return {
    mouse, held,
    on(code, fn) { once.set(code, fn); },
    toggleInvert() { invert = !invert; return invert; },
    read() {
      const h = (...c) => c.some((k) => held.has(k));
      // W / Up pushes the nose down, S / Down pulls up (classic stick)
      let pitch = (h('KeyS', 'ArrowDown') ? 1 : 0) - (h('KeyW', 'ArrowUp') ? 1 : 0);
      let roll = (h('KeyD', 'ArrowRight') ? 1 : 0) - (h('KeyA', 'ArrowLeft') ? 1 : 0);
      if (mouse.stick) { roll += dz(mouse.x) * 1.4; pitch += dz(mouse.y) * 1.4; }
      if (invert) pitch = -pitch;
      return {
        pitch: Math.max(-1, Math.min(1, pitch)), roll: Math.max(-1, Math.min(1, roll)),
        yaw: (h('KeyX') ? 1 : 0) - (h('KeyZ') ? 1 : 0),
        throttleRate: (h('ShiftLeft', 'ShiftRight', 'KeyE') ? 1 : 0) - (h('ControlLeft', 'ControlRight', 'KeyQ') ? 1 : 0),
        brake: h('Space'),
      };
    },
  };
}
