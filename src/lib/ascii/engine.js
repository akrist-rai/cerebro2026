// ASCII render path, grown from the TECH HUNT site's (../../src/lib/ascii).
// Every picture on the promo is a grid of brightness levels + contour
// directions + an optional ink per cell: drawn by the 3D scenes (scene.js via
// raster.js), sampled from text (textGrid), or loaded (the TECH HUNT hero).
// This file turns a grid into glyphs.
//
// Pipeline, per cell:
//   level (0..63) -> gain / lens -> ramp position
//   ordered 8x8 field picks between the two nearest ramp glyphs
//   contours draw as | - / \ _ ¯ instead (_ and ¯ are a low and a high rule)
//   ink 0 is the foreground, ink 1 the accent
//   brighter cells draw more opaque

export const ALPHA = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
export const RAMP = ' .,:;-=+*oxX#%@';
export const EDGES = ['', '|', '-', '/', '\\', '_', '¯'];
// Glyph advance and line height, in em.
export const ADVANCE = 0.6;
export const LINE = 1.1;
// Rec. 709 luma — the sampler's channel weights.
export const LUMA = [0.2126, 0.7152, 0.0722];

// Ordered dither field: 64 distinct thresholds.
export const BAYER = [
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21],
];
const T = BAYER.map((r) => r.map((v) => (v + 0.5) / 64));

const LEVEL = new Map([...ALPHA].map((c, i) => [c, i / 63]));

// Stored grids: `l` levels as ALPHA chars, `e` edge digits, optional `c` ink
// digits. Decoded grids carry typed arrays; `c` may be null (all foreground).
export function decode(g) {
  const n = g.w * g.h;
  const lv = new Float32Array(n);
  const e = new Uint8Array(n);
  const c = g.c ? new Uint8Array(n) : null;
  for (let i = 0; i < n; i++) {
    lv[i] = LEVEL.get(g.l[i]) ?? 0;
    e[i] = g.e.charCodeAt(i) - 48;
    if (c) c[i] = g.c.charCodeAt(i) - 48;
  }
  return { w: g.w, h: g.h, lv, e, c };
}

// ---- loading ----

const cache = new Map();
function json(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`${url} ${r.status}`);
        return r.json();
      })
    );
  }
  return cache.get(url);
}

const decoded = new Map();
function memo(key, make) {
  if (!decoded.has(key)) decoded.set(key, make());
  return decoded.get(key);
}

// src: 'scene:<key>' — every promo picture lives in one file. The URL is
// relative to the build's base, so dist/ works from any path.
export function loadGrid(src) {
  return memo(src, async () => {
    const [kind, key] = src.split(':');
    if (kind !== 'scene') throw new Error(`unknown ascii source ${src}`);
    const all = await json(`${import.meta.env.BASE_URL}ascii/scenes.json`);
    if (!all[key]) throw new Error(`no ascii scene ${key}`);
    return decode(all[key]);
  });
}

// ---- text -> grid ----

// Rasterise text in a display face and sample it into a grid the same way the
// build samples images: 4x supersampling for levels, Sobel for contours.
// `shade` grades the fill top to bottom (1 = flat) so letters read as tone,
// not a wall of '@'.
export function textGrid(lines, { cols, family = 'Archivo', weight = 900, stretch = 'extra-condensed', leading = 0.86, shade = 0.55 }) {
  const ss = 4;
  const probe = document.createElement('canvas').getContext('2d');
  const size = 200;
  const setFont = (ctx) => {
    ctx.font = `${weight} ${size}px "${family}", Impact, sans-serif`;
    if ('fontStretch' in ctx) ctx.fontStretch = stretch;
  };
  setFont(probe);
  const widest = Math.max(...lines.map((l) => probe.measureText(l).width));
  const m = probe.measureText('H');
  const cap = m.actualBoundingBoxAscent || size * 0.72;
  const lineH = size * leading;
  const pw = widest;
  const ph = cap + lineH * (lines.length - 1);

  const rows = Math.max(1, Math.round(((cols * ph) / pw) * (ADVANCE / LINE)));
  const W = cols * ss;
  const H = rows * ss;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  ctx.scale(W / pw, H / ph);
  setFont(ctx);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((l, i) => ctx.fillText(l, 0, cap + i * lineH));

  const px = ctx.getImageData(0, 0, W, H).data;
  const s = new Float32Array(W * H);
  for (let i = 0; i < s.length; i++) {
    const j = i * 4;
    s[i] = (LUMA[0] * px[j] + LUMA[1] * px[j + 1] + LUMA[2] * px[j + 2]) / 255;
  }
  const n = cols * rows;
  const lv = new Float32Array(n);
  const e = new Uint8Array(n);
  const at = (x, y) => s[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      let sum = 0;
      let gx = 0;
      let gy = 0;
      let mag = 0;
      for (let y = cy * ss; y < cy * ss + ss; y++) {
        for (let x = cx * ss; x < cx * ss + ss; x++) {
          sum += s[y * W + x];
          const dx =
            at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
          const dy =
            at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
          gx += dx;
          gy += dy;
          mag += Math.hypot(dx, dy);
        }
      }
      const k = cy * cols + cx;
      const v = sum / (ss * ss);
      const lineRow = ((cy / rows) * lines.length) % 1; // position within its own text line
      lv[k] = v * (1 - (1 - shade) * lineRow);
      const coh = Math.hypot(gx, gy) / (mag + 1e-6);
      if (mag / (ss * ss) > 0.9 && coh > 0.6 && v > 0.12 && v < 0.88) {
        const a = ((Math.atan2(gy, gx) * 180) / Math.PI + 180) % 180;
        e[k] = a < 22.5 || a >= 157.5 ? 1 : a < 67.5 ? 3 : a < 112.5 ? 2 : 4;
      }
    }
  }
  return { w: cols, h: rows, lv, e, c: null };
}

// ---- painter ----

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export class Painter {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.grid = null;
    this.style = { fg: '#ece8dd', accent: '#ff4a1c', floor: 0.2, font: 'JetBrains Mono', weight: 500 };
    this.lens = null; // { x, y } in cells, or null
    this.lensR = 9; // radius in columns
    this.gain = 1;
    this.pulse = 0; // 0..1 extra lift (audio)
    this.reveal = 1; // 0..1 rows shown
    this.cw = 0;
    this.ch = 0;
    this.ox = 0;
    this.oy = 0;
    this.atlas = null;
  }

  setGrid(g) {
    this.grid = g;
  }

  // Size cells for a box. mode 'width': grid spans the width, height follows.
  // 'cover': grid covers the box, overflow cropped from the centre.
  layout(width, height, mode = 'width') {
    const g = this.grid;
    if (!g || !width) return 0;
    const byW = width / g.w;
    let cw = byW;
    if (mode === 'cover' && height) {
      const byH = height / g.h / (LINE / ADVANCE);
      cw = Math.max(byW, byH);
    }
    const ch = (cw / ADVANCE) * LINE;
    const outH = mode === 'cover' && height ? height : g.h * ch;
    this.cw = cw;
    this.ch = ch;
    this.ox = (width - g.w * cw) / 2;
    this.oy = (outH - g.h * ch) / 2;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(outH * dpr);
    this.canvas.style.height = `${outH}px`;
    this.buildAtlas();
    return outH;
  }

  // Every glyph pre-drawn once per colour; cells are then blits.
  buildAtlas() {
    const { fg, accent, font, weight } = this.style;
    const glyphs = RAMP + EDGES.join('');
    const gw = Math.ceil(this.cw * this.dpr) + 1;
    const gh = Math.ceil(this.ch * this.dpr) + 1;
    const cv = this.atlas?.canvas ?? document.createElement('canvas');
    cv.width = gw * glyphs.length;
    cv.height = gh * 2;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.font = `${weight} ${(this.cw / ADVANCE) * this.dpr}px "${font}", ui-monospace, monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    [fg, accent].forEach((color, row) => {
      ctx.fillStyle = color;
      for (let i = 0; i < glyphs.length; i++) ctx.fillText(glyphs[i], i * gw + gw / 2, row * gh + gh / 2);
    });
    this.atlas = { canvas: cv, gw, gh, index: new Map([...glyphs].map((c, i) => [c, i])) };
  }

  // Cells to repaint for the lens moving from `a` to `b` (either may be null).
  lensBounds(a, b) {
    const g = this.grid;
    const rx = this.lensR + 1;
    const ry = Math.ceil((this.lensR * ADVANCE) / LINE) + 1;
    const pts = [a, b].filter(Boolean);
    if (!pts.length) return null;
    const x0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.x)) - rx));
    const x1 = Math.min(g.w, Math.ceil(Math.max(...pts.map((p) => p.x)) + rx));
    const y0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.y)) - ry));
    const y1 = Math.min(g.h, Math.ceil(Math.max(...pts.map((p) => p.y)) + ry));
    return { x0, x1, y0, y1 };
  }

  draw(region = null) {
    const g = this.grid;
    const A = this.atlas;
    if (!g || !A) return;
    const { ctx, dpr } = this;
    const { floor } = this.style;
    const x0 = region?.x0 ?? 0;
    const x1 = region?.x1 ?? g.w;
    const y0 = region?.y0 ?? 0;
    const y1 = region?.y1 ?? g.h;
    const cw = this.cw * dpr;
    const ch = this.ch * dpr;
    const ox = this.ox * dpr;
    const oy = this.oy * dpr;

    if (region) ctx.clearRect(Math.floor(ox + x0 * cw), Math.floor(oy + y0 * ch), Math.ceil((x1 - x0) * cw) + 1, Math.ceil((y1 - y0) * ch) + 1);
    else ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const lens = this.lens;
    const R = this.lensR;
    const aspect = LINE / ADVANCE; // one row is this many columns tall
    const shown = this.reveal >= 1 ? g.h : Math.floor(g.h * this.reveal);
    const lift = this.pulse;
    const gain = this.gain;
    const ink = g.c;
    const n = RAMP.length - 1;

    for (let y = y0; y < Math.min(y1, shown); y++) {
      const ty = T[y & 7];
      const py = Math.round(oy + y * ch);
      for (let x = x0; x < x1; x++) {
        const k = y * g.w + x;
        let v = g.lv[k] * gain + lift * g.lv[k];
        let f = 0;
        if (lens) {
          const dx = x - lens.x;
          const dy = (y - lens.y) * aspect;
          const d = Math.sqrt(dx * dx + dy * dy) / R;
          if (d < 1) {
            f = 1 - d * d;
            v += f * 0.28;
          }
        }
        v = clamp01(v);
        const t = ty[x & 7];
        let glyph;
        const edge = g.e[k];
        if (edge && v > 0.1) glyph = EDGES[edge];
        else {
          const p = v * n;
          const b = p | 0;
          glyph = RAMP[b + (p - b > t && b < n ? 1 : 0)];
        }
        if (glyph === ' ') continue;
        // Accent ink, or the lens tinting by the same ordered field.
        const row = (ink && ink[k]) || f > t * 0.9 + 0.05 ? 1 : 0;
        ctx.globalAlpha = floor + (1 - floor) * Math.min(1, v * 1.15 + f * 0.4);
        ctx.drawImage(A.canvas, A.index.get(glyph) * A.gw, row * A.gh, A.gw, A.gh, Math.round(ox + x * cw), py, A.gw, A.gh);
      }
    }
    // Reveal: the row being written glows in the accent colour.
    if (shown < g.h && shown >= y0 && shown < y1) {
      const y = shown;
      ctx.globalAlpha = 0.9;
      for (let x = x0; x < x1; x++) {
        const k = y * g.w + x;
        const v = g.lv[k];
        if (v < 0.08) continue;
        const glyph = RAMP[Math.min(n, Math.round(v * n))];
        if (glyph === ' ') continue;
        ctx.drawImage(A.canvas, A.index.get(glyph) * A.gw, A.gh, A.gw, A.gh, Math.round(ox + x * cw), Math.round(oy + y * ch), A.gw, A.gh);
      }
    }
    ctx.globalAlpha = 1;
  }

  // Pointer (client coords) -> cell coords.
  toCell(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (clientX - r.left - this.ox) / this.cw, y: (clientY - r.top - this.oy) / this.ch };
  }
}
