// Small geometry helpers shared by world, flight and missions.
export const DEG = Math.PI / 180;
export const KT = 1.94384; // m/s -> knots
export const FT = 3.28084; // m -> feet
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// Strip-local coordinates: u runs along the strip direction, v to the pilot's right.
export function stripLocal(s, x, z) {
  const a = s.heading * DEG, sa = Math.sin(a), ca = Math.cos(a);
  const dx = x - s.x, dz = z - s.z;
  return { u: dx * sa - dz * ca, v: dx * ca + dz * sa };
}
export function stripDir(s) { const a = s.heading * DEG; return { x: Math.sin(a), z: -Math.cos(a) }; }
export function headingOf(dx, dz) { return ((Math.atan2(dx, -dz) / DEG) % 360 + 360) % 360; }
