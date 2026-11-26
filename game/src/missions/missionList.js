// The four sorties. Steps: gate (fly through the ring), drop (press Space over the ring), land (touch down and stop on a strip).
import { STRIPS, SITES } from '../core/config.js';
import { placeAtThreshold } from '../flight/aircraft.js';

const T = (id) => STRIPS[id];
export const MISSIONS = [
  {
    id: 1, title: 'CLINIC DROP', short: 'Take off from Fada, fly the corridor, drop the medicine on the Yelwa courtyard, land.',
    start: { ...placeAtThreshold(T('fada')), agl: 0, fuel: 72, flaps: 1 }, success: 'MAIL DELIVERED',
    steps: [
      { kind: 'gate', x: -250, z: -900, agl: 110, r: 55, text: 'CORRIDOR GATE 1 OF 3 — CLIMB AND FOLLOW THE RING' },
      { kind: 'gate', x: -900, z: -1700, agl: 120, r: 55, text: 'CORRIDOR GATE 2 OF 3' },
      { kind: 'gate', x: -1400, z: -2200, agl: 100, r: 55, text: 'CORRIDOR GATE 3 OF 3' },
      { kind: 'drop', x: SITES.clinic.x, z: SITES.clinic.z + 8, agl: 60, r: 55, text: 'DROP THE PACKAGE ON THE YELWA COURTYARD — SPACE' },
      { kind: 'land', strips: ['fada', 'yelwa'], text: 'PACKAGE AWAY — LAND AT FADA OR YELWA STRIP' },
    ],
  },
  {
    id: 2, title: 'CATTLE-MARKET MAIL', short: 'Land on the short Bakari laterite beside the kraal. Short-field landing is the point.',
    start: { x: 250, z: 500, heading: 45, agl: 320, speed: 46, fuel: 55, flaps: 0 }, success: 'MAIL DELIVERED',
    steps: [
      { kind: 'gate', x: 2060, z: -1500, agl: 40, r: 40, text: 'LINE UP ON BAKARI — FLAPS (F), SLOW DOWN' },
      { kind: 'land', strips: ['bakari'], text: 'LAND SHORT ON BAKARI STRIP AND STOP BEFORE THE KRAAL' },
    ],
  },
  {
    id: 3, title: 'DUST WHITEOUT', short: 'The harmattan thickens. Find the strip by its row of lamps and land.',
    start: { x: -120, z: 3000, heading: 0, agl: 240, speed: 46, fuel: 60, flaps: 0 }, success: 'DOWN SAFE', whiteout: true,
    steps: [
      { kind: 'gate', x: 0, z: 1200, agl: 70, r: 50, text: 'DUST WHITEOUT — FOLLOW THE LAMPS TO FADA' },
      { kind: 'land', strips: ['fada'], text: 'LAND ON FADA — LAMPS ON BOTH SIDES' },
    ],
  },
  {
    id: 4, title: 'FUEL DIVERT', short: 'A leak and a headwind leave you short. Conserve, glide, and land at Gossi pan.',
    start: { x: -700, z: 1900, heading: 90, agl: 480, speed: 44, fuel: 9, flaps: 0 }, success: 'DOWN SAFE', leak: 0.03, wind: [-6, 0],
    steps: [
      { kind: 'land', strips: ['gossi', 'fada', 'bakari', 'yelwa'], target: STRIPS.gossi, text: 'LOW FUEL — DIVERT TO GOSSI PAN STRIP. THROTTLE BACK, GLIDE.' },
    ],
  },
];
