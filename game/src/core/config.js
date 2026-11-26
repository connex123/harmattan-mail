// World layout and tuning. Everything the other modules need to agree on lives here.
export const WORLD = {
  size: 11000, grid: 230, limit: 5200,
  fogColor: 0xdcb98b, horizonColor: 0xe6c496, zenithColor: 0xf3e0bc, hazeColor: 0xe9c999,
  fogDensity: 0.00030, sunDir: [0.85, 0.45, -0.25],
};

// heading is the strip axis in degrees (0 = north, 90 = east). x east, z south, metres.
export const STRIPS = {
  fada:   { id: 'fada',   name: 'Fada strip',         x: 0,    z: 0,     heading: 0,  length: 700, width: 34 },
  bakari: { id: 'bakari', name: 'Bakari short strip', x: 2300, z: -1500, heading: 90, length: 260, width: 24 },
  yelwa:  { id: 'yelwa',  name: 'Yelwa strip',        x: -1420, z: -2450, heading: 0, length: 420, width: 28 },
  gossi:  { id: 'gossi',  name: 'Gossi pan strip',    x: 3600, z: 1800,  heading: 90, length: 520, width: 30 },
};

export const SITES = {
  kasaire: { x: -235, z: 40, name: 'Kasaire' },
  dango:   { x: 125, z: 310, name: 'Dango' },
  clinic:  { x: -1650, z: -2450, name: 'Yelwa clinic' },
  kraal:   { x: 2340, z: -1450, name: 'Bakari kraal' },
  market:  { x: 2230, z: -1458, name: 'Bakari market' },
  pan:     { x: 3600, z: 1800, r: 700, name: 'Lake Gossi dry pan' },
};

export const HILLS = [
  { x: -2600, z: 1500, r: 650, h: 150 }, { x: 1900, z: 3300, r: 600, h: 120 },
  { x: 4300, z: -3000, r: 800, h: 210 }, { x: -3900, z: -1300, r: 700, h: 170 },
  { x: -700, z: -4200, r: 650, h: 140 }, { x: 800, z: 4300, r: 500, h: 110 },
  { x: 3900, z: 3900, r: 600, h: 130 }, { x: -4200, z: 3600, r: 700, h: 160 },
];

// Hand-placed baobabs so the cover scene always finds them (x, z, scale).
export const BAOBABS = [
  [42, 450, 1.35], [190, 230, 1.15], [-135, 400, 1.0], [95, 20, 1.2], [-210, 300, 1.25],
  [175, -250, 1.3], [-60, -430, 1.1], [300, 40, 1.0], [-480, 60, 1.2],
  [2420, -1560, 1.0], [2150, -1380, 0.9], [-1550, -2320, 1.1], [3300, 1500, 1.2], [3900, 2100, 1.0],
];

export const FLIGHT = {
  g: 9.81, k: 0.0097, clSlope: 4.8, aStall: 0.30, drag: 0.00065, thrust: 3.4,
  gearH: 1.55, maxSpeed: 70, stallKt: 51,
};

export const PALETTE = {
  indigo: 0x1d2c8f, gold: 0xf2b21c, crimson: 0xc8202f, emerald: 0x0d9a5b,
  cream: 0xf3e8cf, laterite: 0xb4542f, ochre: 0xc98c54,
};
