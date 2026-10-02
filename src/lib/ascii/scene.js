// A small 3D layer over raster.js: a camera that projects world points into
// glyph cells, near-plane clipping, and the pieces every scene is built from
// (convex solids, floor grids, wire spheres, rings).
//
// World: x right, y up, z into the screen for a camera looking down +z (the
// screen-friendly handedness, so type and clocks read the right way round).
// Cameras look from `pos` toward `look`.

import { ADVANCE, LINE } from './engine.js';

// ---- vectors ----
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => mul(a, 1 / (len(a) || 1));
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mean = (ps) => mul(ps.reduce(add, [0, 0, 0]), 1 / ps.length);

export function rotY([x, y, z], a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [c * x + s * z, y, -s * x + c * z];
}
export function rotX([x, y, z], a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, c * y - s * z, s * y + c * z];
}
export function rotZ([x, y, z], a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [c * x - s * y, s * x + c * y, z];
}

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Deterministic randoms, so a scene draws the same every time.
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// ---- camera ----

// `fov` is vertical, in degrees. `fit: 'min'` makes it the fov of the
// shorter side instead, so a scene frames the same in landscape and portrait.
export function camera({ pos, look, fov = 45, cols, rows, up = [0, 1, 0], fit = 'height', near = 0.1 }) {
  const f = norm(sub(look, pos));
  const r = norm(cross(up, f));
  const u = cross(f, r);
  const Wem = cols * ADVANCE;
  const Hem = rows * LINE;
  const side = fit === 'min' ? Math.min(Wem, Hem) : Hem;
  const focal = side / 2 / Math.tan((fov * Math.PI) / 360);

  const view = (p) => {
    const d = [p[0] - pos[0], p[1] - pos[1], p[2] - pos[2]];
    return [d[0] * r[0] + d[1] * r[1] + d[2] * r[2], d[0] * u[0] + d[1] * u[1] + d[2] * u[2], d[0] * f[0] + d[1] * f[1] + d[2] * f[2]];
  };
  const screen = (v) => [(Wem / 2 + (focal * v[0]) / v[2]) / ADVANCE, (Hem / 2 - (focal * v[1]) / v[2]) / LINE, v[2]];

  // Clip a view-space segment to z > near.
  const clip = (a, b) => {
    if (a[2] <= near && b[2] <= near) return null;
    if (a[2] > near && b[2] > near) return [a, b];
    const t = (near - a[2]) / (b[2] - a[2]);
    const m = lerp(a, b, t);
    m[2] = near + 1e-6;
    return a[2] > near ? [a, m] : [m, b];
  };

  // Sutherland-Hodgman against z > near.
  const clipPoly = (vs) => {
    const out = [];
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i], b = vs[(i + 1) % vs.length];
      const ain = a[2] > near, bin = b[2] > near;
      if (ain) out.push(a);
      if (ain !== bin) {
        const m = lerp(a, b, (near - a[2]) / (b[2] - a[2]));
        m[2] = near + 1e-6;
        out.push(m);
      }
    }
    return out;
  };

  return {
    pos,
    forward: f,
    right: r,
    up: u,
    cols,
    rows,
    focal,
    near,
    view,
    screen,
    project: (p) => {
      const v = view(p);
      return v[2] > near ? screen(v) : null;
    },
    // Cells per world unit at view depth z (for sizing discs).
    scale: (z) => focal / z / ADVANCE,
    seg(R, a, b, lv, ink = 0) {
      const c = clip(view(a), view(b));
      if (!c) return;
      const p = screen(c[0]), q = screen(c[1]);
      R.line(p[0], p[1], q[0], q[1], lv, ink);
    },
    path(R, pts, lv, ink = 0, closed = false) {
      for (let i = 0; i < pts.length - 1; i++) this.seg(R, pts[i], pts[i + 1], lv, ink);
      if (closed) this.seg(R, pts[pts.length - 1], pts[0], lv, ink);
    },
    face(R, pts, tone, ink = 0, outlined = true) {
      const vs = clipPoly(pts.map(view));
      if (vs.length < 3) return;
      R.poly(vs.map(screen), tone, ink, outlined);
    },
  };
}

// Lambert tone: `base` in shadow, up to base + k in full light.
export const LIGHT = norm([-0.45, 0.8, -0.4]);
export const lambert = (n, base = 0.04, k = 0.3, light = LIGHT) => base + k * Math.max(0, dot(n, light));

// Split a segment so fog can vary along it.
export function fogSeg(R, cam, a, b, lvAt, ink = 0, pieces = 8) {
  for (let i = 0; i < pieces; i++) {
    const p = lerp(a, b, i / pieces), q = lerp(a, b, (i + 1) / pieces);
    const lv = lvAt(lerp(p, q, 0.5));
    if (lv > 0.02) cam.seg(R, p, q, lv, ink);
  }
}

// Level grid on y = `y`, fading out with distance from `center`.
export function floor(R, cam, { center = [0, 0, 0], half = 5, step = 1, y = 0, lv = 0.14, ink = 0, fade = half } = {}) {
  const lvAt = (p) => lv * (1 - smooth(fade * 0.35, fade, Math.hypot(p[0] - center[0], p[2] - center[2])));
  for (let i = -half; i <= half; i += step) {
    fogSeg(R, cam, [center[0] + i, y, center[2] - half], [center[0] + i, y, center[2] + half], lvAt, ink, 16);
    fogSeg(R, cam, [center[0] - half, y, center[2] + i], [center[0] + half, y, center[2] + i], lvAt, ink, 16);
  }
}

// ---- solids ----

// A convex solid: front faces filled with Lambert tone, then their edges.
// `style(i, n)` may return { tone, ink } per face to pick one out.
export function solid(R, cam, verts, faces, { base = 0.03, k = 0.3, ink = 0, lv = 0.9, lineInk = ink, style = null, edges = true } = {}) {
  const center = mean(verts);
  const shown = [];
  faces.forEach((f, i) => {
    const pts = f.map((j) => verts[j]);
    const c = mean(pts);
    let n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    if (dot(n, sub(c, center)) < 0) n = mul(n, -1);
    if (dot(n, sub(cam.pos, c)) <= 0) return;
    const s = style?.(i, n);
    cam.face(R, pts, s?.tone ?? lambert(n, base, k), s?.ink ?? ink);
    shown.push(f);
  });
  if (!edges) return;
  const seen = new Set();
  for (const f of shown) {
    for (let i = 0; i < f.length; i++) {
      const a = f[i], b = f[(i + 1) % f.length];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cam.seg(R, verts[a], verts[b], lv, lineInk);
    }
  }
}

// Axis-aligned box (optionally turned about y), as verts + quad faces.
export function box([cx, cy, cz], [sx, sy, sz], turn = 0) {
  const verts = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const p = rotY([(x * sx) / 2, (y * sy) / 2, (z * sz) / 2], turn);
    verts.push([cx + p[0], cy + p[1], cz + p[2]]);
  }
  // index = (x>0)*4 + (y>0)*2 + (z>0)
  const faces = [
    [0, 1, 3, 2], // x-
    [4, 6, 7, 5], // x+
    [0, 4, 5, 1], // y-
    [2, 3, 7, 6], // y+
    [0, 2, 6, 4], // z-
    [1, 5, 7, 3], // z+
  ];
  return { verts, faces };
}

// Regular n-gon prism (a disc when thin, a column when tall), axis along y.
export function prism([cx, cy, cz], radius, height, n = 24, turn = 0) {
  const verts = [];
  for (const y of [-height / 2, height / 2]) {
    for (let i = 0; i < n; i++) {
      const a = turn + (i / n) * Math.PI * 2;
      verts.push([cx + Math.cos(a) * radius, cy + y, cz + Math.sin(a) * radius]);
    }
  }
  const faces = [];
  for (let i = 0; i < n; i++) faces.push([i, (i + 1) % n, n + ((i + 1) % n), n + i]);
  faces.push([...Array(n).keys()].reverse());
  faces.push([...Array(n).keys()].map((i) => n + i));
  return { verts, faces };
}

export function icosahedron(center, radius, spin = [0, 0, 0]) {
  const t = (1 + Math.sqrt(5)) / 2;
  const raw = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  const verts = raw.map((p) => {
    let q = mul(norm(p), radius);
    q = rotX(q, spin[0]);
    q = rotY(q, spin[1]);
    q = rotZ(q, spin[2]);
    return add(q, center);
  });
  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  return { verts, faces };
}

// ---- curves ----

// Points on a circle through `center`, spanned by unit axes u and v.
export function circle(center, u, v, radius, n = 64, a0 = 0, a1 = Math.PI * 2) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push(add(center, add(mul(u, Math.cos(a) * radius), mul(v, Math.sin(a) * radius))));
  }
  return pts;
}

// Draw only the parts of a path whose test(point) passes (front of a sphere,
// the near half of a ring).
export function pathWhere(R, cam, pts, test, lv, ink = 0) {
  for (let i = 0; i < pts.length - 1; i++) {
    const m = lerp(pts[i], pts[i + 1], 0.5);
    if (test(m)) cam.seg(R, pts[i], pts[i + 1], typeof lv === 'function' ? lv(m) : lv, ink);
  }
}

// A sphere: a lit disc, then latitude and longitude lines on the near side.
// `axis` tilts the pole; `spin` turns the meridians.
export function sphere(R, cam, center, radius, { lat = 7, lon = 12, spin = 0, tilt = 0.35, lv = 0.7, ink = 0, lineInk = ink, base = 0.02, k = 0.32, fill = true } = {}) {
  const vc = cam.view(center);
  if (vc[2] <= radius) return;
  const [sx, sy] = cam.screen(vc);
  const rc = cam.scale(vc[2]) * radius; // radius in columns
  const ry = (rc * ADVANCE) / LINE; // ... in rows
  const Lv = [dot(LIGHT, cam.right), dot(LIGHT, cam.up), -dot(LIGHT, cam.forward)];
  if (fill) {
    R.field(sx - rc - 1, sy - ry - 1, sx + rc + 1, sy + ry + 1, (x, y) => {
      const dx = (x - sx) / rc, dy = (y - sy) / ry;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1) return -1;
      const nz = Math.sqrt(1 - d2);
      return base + k * Math.max(0, dx * Lv[0] - dy * Lv[1] + nz * Lv[2]);
    }, ink);
  }
  const pole = norm(rotZ([0, 1, 0], tilt));
  const e1 = norm(cross(pole, [0, 0, 1]));
  const e2 = cross(pole, e1);
  const front = (p) => dot(sub(p, center), sub(cam.pos, p)) > 0;
  for (let i = 1; i < lat; i++) {
    const phi = -Math.PI / 2 + (i / lat) * Math.PI;
    const c = add(center, mul(pole, Math.sin(phi) * radius));
    pathWhere(R, cam, circle(c, e1, e2, Math.cos(phi) * radius, 72), front, lv, lineInk);
  }
  for (let j = 0; j < lon; j++) {
    const a = spin + (j / lon) * Math.PI;
    const m = add(mul(e1, Math.cos(a)), mul(e2, Math.sin(a)));
    pathWhere(R, cam, circle(center, m, pole, radius, 72), front, lv, lineInk);
  }
  return { sx, sy, rc, ry };
}
