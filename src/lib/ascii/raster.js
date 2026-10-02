// Cell-space rasteriser for the procedural scenes.
//
// Everything is drawn at SX x SY subpixels per glyph cell (0.2em x 0.22em,
// near square), in painter's order: later primitives cover earlier ones.
// resolve() then folds each cell's subpixels into one grid cell:
//   enough line subpixels -> a contour glyph, picked by the lines' direction
//                            (and, for level lines, by how high they sit)
//   otherwise             -> the mean surface tone, drawn from the ramp
//
// Coordinates everywhere are in cells: x in [0, cols), y in [0, rows).

import { ADVANCE, LINE } from './engine.js';

export const SX = 3;
export const SY = 5;

// Edge codes, as in engine.js EDGES.
const VERT = 1;
const FLAT = 2;
const RISE = 3; // '/'
const FALL = 4; // '\'
const LOW = 5; // '_'
const HIGH = 6; // '¯'

// Direction class of a segment, from its true angle in em space. The
// diagonals are the glyphs' own corner-to-corner slope (atan(1.1 / 0.6) ≈ 61°);
// boundaries sit halfway between neighbouring glyphs.
export function direction(dx, dy) {
  let a = (Math.atan2(-dy * LINE, dx * ADVANCE) * 180) / Math.PI;
  if (a < 0) a += 180;
  if (a >= 180) a -= 180;
  return a < 30.7 || a >= 149.3 ? FLAT : a < 75.7 ? RISE : a < 104.3 ? VERT : FALL;
}

export class Raster {
  constructor(cols, rows) {
    this.resize(cols, rows);
  }

  resize(cols, rows) {
    this.w = cols;
    this.h = rows;
    this.W = cols * SX;
    this.H = rows * SY;
    const n = this.W * this.H;
    this.shade = new Float32Array(n); // surface tone 0..1
    this.lvl = new Float32Array(n); // line brightness 0..1
    this.kind = new Uint8Array(n); // line direction class, 0 = no line
    this.ink = new Uint8Array(n); // 0 foreground, 1 accent
    this.votes = new Int32Array(5);
    this.out = {
      w: cols,
      h: rows,
      lv: new Float32Array(cols * rows),
      e: new Uint8Array(cols * rows),
      c: new Uint8Array(cols * rows),
    };
    return this;
  }

  clear() {
    this.shade.fill(0);
    this.lvl.fill(0);
    this.kind.fill(0);
    this.ink.fill(0);
    return this;
  }

  // Filled triangle, flat tone. `edges` flags which sides are drawn outlines
  // (bit 0: a-b, bit 1: b-c, bit 2: c-a): the fill stops `inset` subpixels
  // short of those, so an outline shared with a neighbour survives it. Other
  // sides overlap slightly so a split quad has no seam.
  tri(a, b, c, tone, ink = 0, edges = 7, inset = 0.7) {
    let ax = a[0] * SX, ay = a[1] * SY;
    let bx = b[0] * SX, by = b[1] * SY;
    let cx = c[0] * SX, cy = c[1] * SY;
    const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    if (Math.abs(area) < 1e-6) return;
    if (area < 0) {
      // Swap b and c; remap the edge flags to the new winding.
      [bx, cx] = [cx, bx];
      [by, cy] = [cy, by];
      edges = ((edges & 4) >> 2) | (edges & 2) | ((edges & 1) << 2);
    }
    const E = [
      [ax, ay, bx, by, edges & 1 ? inset : -0.5],
      [bx, by, cx, cy, edges & 2 ? inset : -0.5],
      [cx, cy, ax, ay, edges & 4 ? inset : -0.5],
    ].map(([x0, y0, x1, y1, m]) => {
      const len = Math.hypot(x1 - x0, y1 - y0) || 1;
      // Signed distance, positive inside: A*X + B*Y + C - m
      const A = -(y1 - y0) / len;
      const B = (x1 - x0) / len;
      return [A, B, -(A * x0 + B * y0) - m];
    });
    const X0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const X1 = Math.min(this.W - 1, Math.ceil(Math.max(ax, bx, cx)));
    const Y0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const Y1 = Math.min(this.H - 1, Math.ceil(Math.max(ay, by, cy)));
    if (X0 > X1 || Y0 > Y1) return;
    const [e0, e1, e2] = E;
    const { shade, lvl, kind } = this;
    const inkBuf = this.ink;
    for (let Y = Y0; Y <= Y1; Y++) {
      const py = Y + 0.5;
      let d0 = e0[0] * (X0 + 0.5) + e0[1] * py + e0[2];
      let d1 = e1[0] * (X0 + 0.5) + e1[1] * py + e1[2];
      let d2 = e2[0] * (X0 + 0.5) + e2[1] * py + e2[2];
      let i = Y * this.W + X0;
      for (let X = X0; X <= X1; X++, i++, d0 += e0[0], d1 += e1[0], d2 += e2[0]) {
        if (d0 < 0 || d1 < 0 || d2 < 0) continue;
        shade[i] = tone;
        lvl[i] = 0;
        kind[i] = 0;
        inkBuf[i] = ink;
      }
    }
  }

  // Convex or fan-able polygon (screen points in cells). Outer sides are
  // outlines; the fan's inner diagonals are not.
  poly(pts, tone, ink = 0, outlined = true) {
    const n = pts.length;
    if (n < 3) return;
    for (let k = 1; k < n - 1; k++) {
      let flags = 2; // side k -> k+1 is always an outer side
      if (k === 1) flags |= 1; // 0 -> 1
      if (k === n - 2) flags |= 4; // n-1 -> 0
      this.tri(pts[0], pts[k], pts[k + 1], tone, ink, outlined ? flags : 0);
    }
  }

  // One-subpixel line. Later lines win where they cross.
  line(x0, y0, x1, y1, lv, ink = 0) {
    const X0 = x0 * SX, Y0 = y0 * SY;
    const dx = x1 * SX - X0, dy = y1 * SY - Y0;
    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))) || 1;
    const k = direction(x1 - x0, y1 - y0);
    const { W, H, kind, lvl } = this;
    const inkBuf = this.ink;
    for (let s = 0; s <= steps; s++) {
      const X = Math.floor(X0 + (dx * s) / steps);
      const Y = Math.floor(Y0 + (dy * s) / steps);
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      const i = Y * W + X;
      kind[i] = k;
      lvl[i] = lv;
      inkBuf[i] = ink;
    }
  }

  polyline(pts, lv, ink = 0, closed = false) {
    for (let i = 0; i < pts.length - 1; i++) this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], lv, ink);
    if (closed && pts.length > 2) {
      const a = pts[pts.length - 1];
      this.line(a[0], a[1], pts[0][0], pts[0][1], lv, ink);
    }
  }

  // A whole cell at one tone (stars, specks).
  cell(x, y, tone, ink = 0) {
    const cx = Math.floor(x), cy = Math.floor(y);
    if (cx < 0 || cy < 0 || cx >= this.w || cy >= this.h) return;
    for (let sy = 0; sy < SY; sy++) {
      let i = (cy * SY + sy) * this.W + cx * SX;
      for (let sx = 0; sx < SX; sx++, i++) {
        this.shade[i] = tone;
        this.kind[i] = 0;
        this.lvl[i] = 0;
        this.ink[i] = ink;
      }
    }
  }

  // Per-subpixel tone inside a box: fn(x, y) in cells returns a tone, or a
  // negative number to leave the subpixel alone. For shaded discs and fields.
  field(x0, y0, x1, y1, fn, ink = 0) {
    const X0 = Math.max(0, Math.floor(x0 * SX)), X1 = Math.min(this.W - 1, Math.ceil(x1 * SX));
    const Y0 = Math.max(0, Math.floor(y0 * SY)), Y1 = Math.min(this.H - 1, Math.ceil(y1 * SY));
    for (let Y = Y0; Y <= Y1; Y++) {
      const y = (Y + 0.5) / SY;
      let i = Y * this.W + X0;
      for (let X = X0; X <= X1; X++, i++) {
        const v = fn((X + 0.5) / SX, y);
        if (v < 0) continue;
        this.shade[i] = v;
        this.kind[i] = 0;
        this.lvl[i] = 0;
        this.ink[i] = ink;
      }
    }
  }

  resolve() {
    const { w, h, W, kind, lvl, shade, votes, out } = this;
    const inkBuf = this.ink;
    const all = SX * SY;
    for (let cy = 0; cy < h; cy++) {
      for (let cx = 0; cx < w; cx++) {
        votes.fill(0);
        let n = 0, sumL = 0, rows = 0, hotL = 0;
        let sumS = 0, hotS = 0;
        for (let sy = 0; sy < SY; sy++) {
          let i = (cy * SY + sy) * W + cx * SX;
          for (let sx = 0; sx < SX; sx++, i++) {
            const k = kind[i];
            if (k) {
              n++;
              votes[k]++;
              sumL += lvl[i];
              rows += sy;
              if (inkBuf[i]) hotL++;
            } else {
              sumS += shade[i];
              if (inkBuf[i]) hotS += shade[i];
            }
          }
        }
        const o = cy * w + cx;
        if (n >= 2) {
          let k = 1;
          for (let j = 2; j < 5; j++) if (votes[j] > votes[k]) k = j;
          if (k === FLAT) {
            const m = rows / n; // 0 = top subrow, SY - 1 = bottom
            k = m < 1.2 ? HIGH : m > SY - 2.2 ? LOW : FLAT;
          }
          out.e[o] = k;
          out.lv[o] = sumL / n;
          out.c[o] = hotL * 2 >= n ? 1 : 0;
        } else {
          out.e[o] = 0;
          out.lv[o] = (sumS + sumL) / all;
          out.c[o] = (sumS > 0 && hotS * 2 > sumS) || (n && hotL) ? 1 : 0;
        }
      }
    }
    return out;
  }
}

// Stamp a text grid (from textGrid) onto a resolved grid at (ox, oy), in one
// ink, clearing a one-cell halo so the letters read against a busy scene.
export function stamp(g, text, ox, oy, ink = 0, halo = 1) {
  const { w, h } = g;
  const on = (x, y) => x >= 0 && y >= 0 && x < text.w && y < text.h && text.lv[y * text.w + x] > 0.06;
  for (let y = -halo; y < text.h + halo; y++) {
    for (let x = -halo; x < text.w + halo; x++) {
      const gx = ox + x, gy = oy + y;
      if (gx < 0 || gy < 0 || gx >= w || gy >= h) continue;
      const o = gy * w + gx;
      if (on(x, y)) {
        const k = y * text.w + x;
        g.lv[o] = text.lv[k];
        g.e[o] = text.e[k];
        g.c[o] = ink;
        continue;
      }
      let near = false;
      for (let dy = -halo; dy <= halo && !near; dy++) for (let dx = -halo; dx <= halo && !near; dx++) near = on(x + dx, y + dy);
      if (near) {
        g.lv[o] = 0;
        g.e[o] = 0;
      }
    }
  }
}
