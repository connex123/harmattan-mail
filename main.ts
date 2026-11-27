// Harmattan Mail: an original 3D bush-pilot flight game over the West African Sahel in the dry-season harmattan.
// The game is this directory's game/ folder: plain static files a desktop browser loads offline (index.html, ES
// modules under game/src/, one vendored three.js r169 module, procedural textures and WebAudio, no network request
// at run time). This program (Node 22, standard library only) hands it in: it copies game/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Four sorties (clinic drop, cattle-market mail, dust whiteout, fuel divert) fly a Kasaire K-3
// Mailbird with Ankara livery from laterite strips past baobabs and a banco mosque over a crowded market with zebu herds, danfos and okadas.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
