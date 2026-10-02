// Dev-only gallery: every procedural scene through the real painter.
// /lab.html?s=<scene>&w=<px>&cell=<px>&t=<seconds>
import './app.css';
import { Raster } from './lib/ascii/raster.js';
import { SCENES, RATIO } from './lib/ascii/scenes.js';
import { Painter, ADVANCE, LINE } from './lib/ascii/engine.js';
import { INK } from './lib/fx.js';

const q = new URLSearchParams(location.search);
const only = q.get('s');
const W = +(q.get('w') || 620);
const cell = +(q.get('cell') || 6.5);
const t = +(q.get('t') || 0);
const lab = document.getElementById('lab');
lab.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,${W}px);gap:28px;padding:24px`;

await document.fonts.load('500 16px "JetBrains Mono"');
for (const name of Object.keys(SCENES)) {
  if (only && name !== only) continue;
  const ratio = RATIO[name] ?? 4 / 3;
  const cols = Math.round(W / cell);
  const rows = Math.round(W / ratio / ((cell / ADVANCE) * LINE));
  const R = new Raster(cols, rows).clear();
  const a = performance.now();
  SCENES[name](R, { cols, rows, t });
  const g = R.resolve();
  const ms = performance.now() - a;
  const fig = document.createElement('figure');
  fig.style.cssText = 'margin:0;border:1px solid var(--line-2)';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `display:block;width:${W}px`;
  const cap = document.createElement('figcaption');
  cap.className = 'label';
  cap.style.padding = '8px 10px';
  cap.textContent = `${name} · ${cols}×${rows} · ${ms.toFixed(1)}ms`;
  fig.append(canvas, cap);
  lab.append(fig);
  const p = new Painter(canvas);
  p.style = { ...p.style, fg: INK.bone, accent: INK.hot, floor: 0.16, weight: 500 };
  p.setGrid(g);
  p.layout(W, 0, 'width');
  p.draw();
}
