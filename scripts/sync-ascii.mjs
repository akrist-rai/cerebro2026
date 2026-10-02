// The only loaded picture on the promo is the TECH HUNT hero, borrowed from
// the CTF site so its own event shows its own art. Everything else is drawn
// at runtime by src/lib/ascii/scenes.js.
//
//   node scripts/sync-ascii.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', 'public', 'ascii', 'scenes.json');
const out = join(here, '..', 'public', 'ascii', 'scenes.json');

const hero = JSON.parse(readFileSync(src, 'utf8')).hero;
if (!hero) throw new Error(`no "hero" scene in ${src}`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ techhunt: hero }));
console.log(`techhunt grid ${hero.w}x${hero.h} -> ${out}`);
