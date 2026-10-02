// Every procedural picture on the promo. A scene draws into a cleared Raster
// sized cols x rows; `t` (seconds) only moves the hero.
//
// House style: bone line work, hot accent for the one thing that matters,
// dark Lambert fills so solids occlude, and a floor grid that fades out, so
// every picture reads as the same 3D viewport.

import { ADVANCE, LINE } from './engine.js';
import {
  add, sub, mul, norm, cross, dot, lerp, rotX, rotY, rotZ, clamp, smooth, rng,
  camera, floor, fogSeg, solid, box, prism, icosahedron, circle, pathWhere, sphere, lambert,
} from './scene.js';

const aspectOf = (cols, rows) => (cols * ADVANCE) / (rows * LINE);
const mean3 = (ps) => mul(ps.reduce(add, [0, 0, 0]), 1 / ps.length);

// A four-point sparkle, the deck's star: tapered arms in cells.
function sparkle(R, x, y, size, ink = 0) {
  const arms = [
    [0, -1, 1], [0, 1, 1], [-1, 0, 1.9], [1, 0, 1.9],
  ];
  for (const [dx, dy, s] of arms) {
    const L = size * s;
    const ex = dx * L, ey = (dy * L * ADVANCE) / LINE;
    R.line(x, y, x + ex * 0.35, y + ey * 0.35, 1, ink);
    R.line(x + ex * 0.35, y + ey * 0.35, x + ex * 0.7, y + ey * 0.7, 0.55, ink);
    R.line(x + ex * 0.7, y + ey * 0.7, x + ex, y + ey, 0.25, ink);
  }
  R.cell(x, y, 0.6, ink);
}

// ---------------------------------------------------------------------------
// HERO — beyond the horizon. A ringed planet rises behind a valley of wire
// hills that flows toward the viewer. Returns where the sky is, for the title.

export function horizon(R, { cols, rows, t = 0 }) {
  const aspect = aspectOf(cols, rows);
  const wide = aspect > 1.15;
  const camY = 2.4;
  const fov = wide ? 36 : 54;
  // Tilt up so the horizon sits ~62% down and the sky gets the room.
  const tilt = Math.atan(0.24 * Math.tan((fov * Math.PI) / 360));
  const cam = camera({ pos: [0, camY, 0], look: [0, camY + 10 * Math.tan(tilt), 10], fov, cols, rows });
  const horizonRow = cam.screen(cam.view([0, camY, 1e5]))[1];

  // Sky: stars (kept on . , : and + *), then a low haze over the horizon.
  const rand = rng(26);
  const stars = Math.round(cols * rows * 0.02);
  for (let i = 0; i < stars; i++) {
    const x = rand() * cols, y = rand() * horizonRow * 0.97;
    const b = rand();
    R.cell(x, y, b > 0.95 ? 0.56 : 0.05 + b * 0.16, b > 0.985 ? 1 : 0);
  }
  const haze = rows * 0.14;
  R.field(0, horizonRow - haze, cols, horizonRow + 1, (x, y) => {
    const h = clamp((y - (horizonRow - haze)) / haze);
    return h * h * h * 0.2;
  }, 1);

  // Planet rising in the gap of the valley, its orbit a thin tilted ellipse.
  const hfov = 2 * Math.atan((cols * ADVANCE) / 2 / cam.focal);
  const dist = 200;
  const bearing = wide ? Math.min(0.17, hfov * 0.15) : hfov * 0.08;
  const radius = dist * Math.tan(wide ? 0.15 : 0.13);
  const center = [Math.tan(bearing) * dist, camY + dist * Math.tan(wide ? 0.125 : 0.105), dist];
  const ringN = norm(rotZ(rotX([0, 1, 0], -0.3), 0.24));
  const ru = norm(cross(ringN, [0, 0, 1]));
  const rv = cross(ringN, ru);
  const vc = cam.view(center)[2];
  const behind = (p) => cam.view(p)[2] > vc;
  const rings = [
    [1.42, 0.35], [1.55, 1], [1.64, 0.6], [1.9, 0.28],
  ];
  const orbit = (k) => circle(center, ru, rv, radius * k, 220);
  // Bands of dithered accent between the ring lines, so the ring reads solid.
  const bands = [
    [1.42, 1.55, 0.2], [1.55, 1.64, 0.09], [1.64, 1.9, 0.13],
  ];
  const band = (half) => {
    for (const [k0, k1, tone] of bands) {
      const a = orbit(k0), b = orbit(k1);
      for (let i = 0; i < a.length - 1; i++) {
        if (half(lerp(a[i], b[i + 1], 0.5))) cam.face(R, [a[i], b[i], b[i + 1], a[i + 1]], tone, 1, false);
      }
    }
    for (const [k, lv] of rings) pathWhere(R, cam, orbit(k), half, lv, 1);
  };
  band(behind);
  sphere(R, cam, center, radius, { lat: 10, lon: 16, spin: t * 0.04, tilt: 0.3, lv: 0.5, base: 0.015, k: 0.46 });
  band((p) => !behind(p));
  const ma = 3.6 + t * 0.025;
  const moon = add(center, add(mul(ru, Math.cos(ma) * radius * 2.35), mul(rv, Math.sin(ma) * radius * 2.35)));
  sphere(R, cam, moon, radius * 0.09, { lat: 3, lon: 4, lv: 0.7, base: 0.06, k: 0.5 });

  // Sparkles, the deck's four-point stars.
  const s = Math.max(2, cols / 34);
  if (wide) {
    sparkle(R, cols * 0.46, horizonRow * 0.2, s);
    sparkle(R, cols * 0.95, horizonRow * 0.42, s * 0.6);
    sparkle(R, cols * 0.57, horizonRow * 0.8, s * 0.45);
  } else {
    sparkle(R, cols * 0.84, horizonRow * 0.46, s * 1.2);
    sparkle(R, cols * 0.14, horizonRow * 0.84, s * 0.7);
  }

  // Terrain: a valley between ridges, far strips first, each filled then
  // lined. Far lines fade out; the far edge stays as the skyline.
  const speed = 1.1;
  const dx = 1.3, dz = 1.3;
  const X = 46, zNear = 4, zFar = 64;
  const off = (t * speed) % dz;
  const H = (x, zw) => {
    const ax = Math.abs(x);
    // The valley opens wider on the planet's side, so it rises in clear sky.
    const open = x > 0 ? 9 : 0;
    const hills = smooth(3.5 + open, 13 + open * 1.1, ax);
    const ridge = 1 - Math.abs(Math.sin(x * 0.16 + zw * 0.085 + 0.7));
    const n = 0.6 * Math.sin(x * 0.33 + zw * 0.21) + 0.35 * Math.sin(x * 0.77 - zw * 0.39 + 1.3) + 0.18 * Math.sin(x * 1.6 + zw * 0.83);
    const lift = 1 + 0.035 * Math.max(0, ax - 10);
    const floorN = 0.16 * Math.sin(x * 0.7 + zw * 0.5) * Math.sin(zw * 0.27);
    return hills * lift * (1.6 + 5.2 * ridge * ridge + 1.8 * n) + floorN;
  };
  const nx = Math.round((2 * X) / dx);
  const nz = Math.ceil((zFar - zNear) / dz) + 1;
  const row = (i) => {
    const z = zNear + i * dz - off;
    const zw = z + t * speed;
    const pts = [];
    for (let j = 0; j <= nx; j++) {
      const x = -X + j * dx;
      pts.push([x, H(x, zw), z]);
    }
    return pts;
  };
  // The valley floor fades with distance; high ground keeps a faint wire
  // almost to the skyline.
  const fog = (z, y) =>
    Math.max(0.8 * Math.pow(1 - smooth(zNear, zFar * 0.72, z), 1.4), 0.26 * smooth(1.2, 6, y) * (1 - smooth(zFar * 0.8, zFar, z)));
  // Ground beyond the last strip, out to the horizon, hides what sets below it.
  cam.face(R, [[-4000, 0, zFar - 1], [4000, 0, zFar - 1], [4000, 0, 6000], [-4000, 0, 6000]], 0, 0, false);
  let far = row(nz);
  cam.path(R, far, 0.32);
  for (let i = nz - 1; i >= 0; i--) {
    const near = row(i);
    const zf = far[0][2], zn = near[0][2];
    const front = [];
    for (let j = 0; j < nx; j++) {
      const A = far[j], B = far[j + 1], C = near[j + 1], D = near[j];
      const n = norm(cross(sub(B, A), sub(D, A)));
      if (dot(n, sub(cam.pos, A)) <= 0) continue;
      cam.face(R, [A, B, C, D], lambert(n, 0.006, 0.06), 0);
      front.push(j);
    }
    const lv = (a, b) => fog((a[2] + b[2]) / 2, (a[1] + b[1]) / 2);
    const draw = (a, b) => {
      const v = lv(a, b);
      if (v > 0.04) cam.seg(R, a, b, v);
    };
    for (const j of front) {
      draw(far[j], far[j + 1]);
      draw(near[j], near[j + 1]);
      draw(far[j], near[j]);
      draw(far[j + 1], near[j + 1]);
    }
    far = near;
  }

  return { horizonRow };
}

// ---------------------------------------------------------------------------
// ABOUT — a workstation: CRT and keyboard on a desk pad, code on the screen.

export function computer(R, { cols, rows }) {
  const cam = camera({ pos: [4.4, 4.3, -8.4], look: [0.1, 1.75, 0], fov: 38, cols, rows, fit: 'min' });
  floor(R, cam);
  // Monitor body and stand first (behind), then the keyboard in front.
  const stand = box([0, 0.3, 0.7], [1.5, 0.6, 1.3]);
  solid(R, cam, stand.verts, stand.faces, { lv: 0.6 });
  const body = box([0, 2.25, 0.9], [4.4, 3.3, 3.2]);
  solid(R, cam, body.verts, body.faces, { lv: 0.95, base: 0.025, k: 0.2 });
  const zf = 0.9 - 1.6 - 0.01;
  const scr = [[-1.85, 0.9, zf], [1.85, 0.9, zf], [1.85, 3.5, zf], [-1.85, 3.5, zf]];
  cam.face(R, scr, 0.015, 0);
  cam.path(R, scr, 0.8, 0, true);
  const glass = [[-1.62, 1.08, zf - 0.01], [1.62, 1.08, zf - 0.01], [1.62, 3.32, zf - 0.01], [-1.62, 3.32, zf - 0.01]];
  cam.path(R, glass, 0.45, 1, true);
  const rand = rng(9);
  let indent = 0;
  for (let l = 0; l < 8; l++) {
    const y = 3.1 - l * 0.26;
    if (l === 3) continue;
    indent = clamp(indent + (rand() < 0.35 ? 1 : rand() < 0.3 ? -1 : 0), 0, 3);
    let x = -1.42 + indent * 0.26;
    const end = Math.min(1.42, x + 0.7 + rand() * 2.1);
    while (x < end) {
      const w = 0.16 + rand() * 0.5;
      cam.seg(R, [x, y, zf - 0.02], [Math.min(end, x + w), y, zf - 0.02], 0.95, l === 0 || rand() < 0.18 ? 1 : 0);
      x += w + 0.13;
    }
  }
  cam.face(R, [[-1.42, 1.25, zf - 0.02], [-1.22, 1.25, zf - 0.02], [-1.22, 1.5, zf - 0.02], [-1.42, 1.5, zf - 0.02]], 1, 1, false);
  const kb = box([-0.1, 0.16, -2.35], [4.1, 0.32, 1.45], -0.06);
  solid(R, cam, kb.verts, kb.faces, { lv: 0.75 });
  const key = (x, z) => add([-0.1, 0.33, -2.35], rotY([x, 0, z], -0.06));
  for (let r = 0; r <= 4; r++) cam.seg(R, key(-1.9, -0.6 + r * 0.3), key(1.9, -0.6 + r * 0.3), 0.4);
  for (let k = 0; k <= 12; k++) cam.seg(R, key(-1.9 + k * 0.317, -0.6), key(-1.9 + k * 0.317, 0.6), 0.4);
  cam.face(R, [key(-0.95, -0.58), key(0.95, -0.58), key(0.95, -0.32), key(-0.95, -0.32)], 0.3, 1, false);
  const mouse = box([2.8, 0.14, -2.2], [0.5, 0.28, 0.8], 0.15);
  solid(R, cam, mouse.verts, mouse.faces, { lv: 0.6 });
}

// ---------------------------------------------------------------------------
// ENIGMA — a d20 over its shadow, one face lit, five markers in orbit: five
// rounds, one answer.

export function icosa(R, { cols, rows }) {
  const cam = camera({ pos: [0, 3.5, -8.6], look: [0, 2.15, 0], fov: 36, cols, rows, fit: 'min' });
  floor(R, cam);
  cam.face(R, circle([0.3, 0.01, 0.3], [1, 0, 0], [0, 0, 1], 1.35, 40), 0.07, 0, false);
  const C = [0, 2.35, 0];
  const tiltAxis = norm([0, 0.28, 1]);
  const ring = circle(C, [1, 0, 0], tiltAxis, 2.75, 140);
  const behind = (p) => p[2] > C[2] + 0.05;
  pathWhere(R, cam, ring, behind, 0.25);
  const d = icosahedron(C, 1.6, [0.4, 0.55, 0.15]);
  let lit = -1, best = -Infinity;
  d.faces.forEach((f, i) => {
    const c = mean3(f.map((j) => d.verts[j]));
    const n = norm(sub(c, C));
    const score = dot(n, norm(sub(cam.pos, c))) - n[0] * 0.4 + n[1] * 0.2;
    if (score > best) (best = score), (lit = i);
  });
  solid(R, cam, d.verts, d.faces, { base: 0.03, k: 0.28, lv: 1, style: (i) => (i === lit ? { tone: 0.34, ink: 1 } : null) });
  pathWhere(R, cam, ring, (p) => !behind(p), 0.4);
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * 1.08 + i * 0.36;
    const p = add(C, add(mul([1, 0, 0], Math.cos(a) * 2.75), mul(tiltAxis, Math.sin(a) * 2.75)));
    const q = cam.project(p);
    if (q) R.cell(q[0], q[1], i === 4 ? 0.62 : 0.5, i === 4 ? 1 : 0);
  }
}

// ---------------------------------------------------------------------------
// RETRO MARKET — candlesticks as solids, the risers lit.

export function candles(R, { cols, rows }) {
  const rand = rng(12);
  let price = 1.2;
  const bars = [];
  for (let i = 0; i < 9; i++) {
    const open = price;
    const close = Math.max(0.5, open + (rand() - 0.3) * 1.15);
    bars.push({ x: -4.2 + i * 1.05, open, close, lo: Math.min(open, close) - 0.15 - rand() * 0.45, hi: Math.max(open, close) + 0.15 + rand() * 0.55 });
    price = close;
  }
  // Frame on what the run actually covers.
  const top = Math.max(...bars.map((b2) => b2.hi));
  const midY = top / 2;
  const cam = camera({ pos: [-1.5, midY + 1.1, -8.6], look: [0, midY - 0.15, 0.2], fov: 42, cols, rows, fit: 'min' });
  floor(R, cam);
  // Camera sits at -x: far bars (high x) first.
  for (const b of [...bars].reverse()) {
    const up = b.close >= b.open;
    const y0 = Math.min(b.open, b.close), y1 = Math.max(b.open, b.close, y0 + 0.1);
    cam.seg(R, [b.x, b.lo, 0], [b.x, y0, 0], 0.75, up ? 1 : 0);
    cam.seg(R, [b.x, y1, 0], [b.x, b.hi, 0], 0.75, up ? 1 : 0);
    const body = box([b.x, (y0 + y1) / 2, 0], [0.62, y1 - y0, 0.62]);
    solid(R, cam, body.verts, body.faces, up ? { base: 0.3, k: 0.3, ink: 1, lv: 1 } : { base: 0.02, k: 0.1, lv: 0.85 });
  }
}

// ---------------------------------------------------------------------------
// PRUDENTIA — a portfolio as a ribbon: the curve, and the wall under it.

export function ribbon(R, { cols, rows }) {
  const rand = rng(4);
  const n = 56;
  const xs = [], raw = [];
  let y = 0.7;
  for (let i = 0; i <= n; i++) {
    xs.push(-5 + (i / n) * 10);
    y = Math.max(0.4, y + (rand() - 0.36) * 0.26);
    raw.push(y);
  }
  const smoothed = raw.map((_, i) => {
    let s = 0, k = 0;
    for (let d = -2; d <= 2; d++) if (raw[i + d] !== undefined) (s += raw[i + d]), k++;
    return s / k;
  });
  // Normalise so the curve always fills the same box, whatever the walk did.
  const lo = Math.min(...smoothed), hi = Math.max(...smoothed);
  const ys = smoothed.map((v) => 0.45 + ((v - lo) / (hi - lo || 1)) * 2.1);
  const depth = 0.8;
  const cam = camera({ pos: [-1.1, 2.9, -11.4], look: [0, 1.5, 0.4], fov: 40, cols, rows, fit: 'min' });
  floor(R, cam);
  // Far panels (high x... the camera is left of centre, so right is farther) first.
  for (let i = n - 1; i >= 0; i--) {
    const a = [xs[i], 0, 0], b = [xs[i + 1], 0, 0], ta = [xs[i], ys[i], 0], tb = [xs[i + 1], ys[i + 1], 0];
    cam.face(R, [add(ta, [0, 0, depth]), add(tb, [0, 0, depth]), tb, ta], 0.28, 1, false);
    cam.face(R, [a, b, tb, ta], 0.08, 1, false);
    if (i % 7 === 0) cam.seg(R, a, ta, 0.28, 1);
  }
  cam.path(R, xs.map((x, i) => [x, ys[i], depth]), 0.4, 1);
  cam.path(R, xs.map((x, i) => [x, ys[i], 0]), 1, 1);
  cam.seg(R, [xs[0], 0, 0], [xs[n], 0, 0], 0.6);
  const top = ys.indexOf(Math.max(...ys));
  cam.seg(R, [xs[top], ys[top], 0], [xs[top], ys[top] + 1.2, 0], 0.7);
  const m = cam.project([xs[top], ys[top] + 1.3, 0]);
  if (m) R.cell(m[0], m[1], 0.62, 1);
}

// ---------------------------------------------------------------------------
// ROBO RACE — a stadium track with hurdles, cones and a bot on the straight.

function stadium(halfLen, radius, n = 28) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI;
    pts.push([halfLen + Math.cos(a) * radius, 0, Math.sin(a) * radius]);
  }
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 + (i / n) * Math.PI;
    pts.push([-halfLen + Math.cos(a) * radius, 0, Math.sin(a) * radius]);
  }
  return pts;
}

function bot(R, cam, [x, z], turn = 0, ink = 0) {
  for (const [wx, wz] of [[-0.4, -0.46], [0.4, -0.46], [-0.4, 0.46], [0.4, 0.46]]) {
    const w = prism(add([x, 0.22, z], rotY([wx, 0, wz], turn)), 0.22, 0.14, 10);
    w.verts = w.verts.map((v) => add([x, 0.22, z], rotY(rotX(sub(v, [x, 0.22, z]), Math.PI / 2), turn)));
    solid(R, cam, w.verts, w.faces, { lv: 0.7, base: 0.04, edges: true });
  }
  const chassis = box([x, 0.42, z], [1.15, 0.34, 0.8], turn);
  solid(R, cam, chassis.verts, chassis.faces, { lv: 1, ink, base: ink ? 0.28 : 0.04, k: 0.3 });
  const head = box(add([x, 0.72, z], rotY([-0.12, 0, 0], turn)), [0.52, 0.26, 0.5], turn);
  solid(R, cam, head.verts, head.faces, { lv: 0.9, base: 0.04 });
}

export function track(R, { cols, rows }) {
  const cam = camera({ pos: [0.6, 9.4, -8.6], look: [0, 0, 0.5], fov: 40, cols, rows, fit: 'min' });
  const outer = stadium(3.4, 3.7), inner = stadium(3.4, 2.1), mid = stadium(3.4, 2.9, 40);
  for (let i = 0; i < outer.length - 1; i++) cam.face(R, [outer[i], outer[i + 1], inner[i + 1], inner[i]], 0.05, 0, false);
  cam.face(R, [outer[outer.length - 1], outer[0], inner[0], inner[inner.length - 1]], 0.05, 0, false);
  cam.path(R, outer, 0.95, 0, true);
  cam.path(R, inner, 0.95, 0, true);
  for (let i = 0; i < mid.length - 1; i += 2) cam.seg(R, mid[i], mid[i + 1], 0.4);
  for (let k = 0; k < 6; k++) {
    const z = -3.7 + k * 0.27;
    cam.seg(R, [-0.3, 0, z], [0.3, 0, z], 0.9, k % 2);
  }
  // Far straight: hurdles and a ramp. Bends: cones. Near straight: the bot.
  const ramp = { verts: [[-0.8, 0, 2.2], [0.8, 0, 2.2], [0.8, 0, 3.6], [-0.8, 0, 3.6], [-0.8, 0.6, 3.6], [0.8, 0.6, 3.6]], faces: [[0, 1, 2, 3], [0, 4, 5, 1], [3, 2, 5, 4], [0, 3, 4], [1, 5, 2]] };
  solid(R, cam, ramp.verts, ramp.faces, { lv: 0.85 });
  for (const x of [-2.4, 2.4]) {
    const h = box([x, 0.34, 2.9], [0.14, 0.68, 1.6]);
    solid(R, cam, h.verts, h.faces, { lv: 1, ink: 1, base: 0.3 });
  }
  for (const [x, z] of [[-6.2, -1], [-6.3, 1.1], [6.2, 1], [6.3, -1.1]]) {
    const c = prism([x, 0.3, z], 0.24, 0.6, 6);
    c.verts = c.verts.map((v, i) => (i >= 6 ? [x, 0.72, z] : v));
    c.faces = c.faces.slice(0, 6).map(([a, b]) => [a, b, 6]).concat([[0, 1, 2, 3, 4, 5]]);
    solid(R, cam, c.verts, c.faces, { lv: 0.9, ink: 1, base: 0.25 });
  }
  bot(R, cam, [1.2, -2.9], 0, 1);
}

// ---------------------------------------------------------------------------
// ROBO SOCCER — the pitch from the stand: goals, two bots, the ball.

export function pitch(R, { cols, rows }) {
  const cam = camera({ pos: [-1.1, 7.8, -12.6], look: [0, 0, 0.1], fov: 42, cols, rows, fit: 'min' });
  const L = 5.3, W = 3.4;
  for (let i = 0; i < 12; i++) {
    const x0 = -L + (i * 2 * L) / 12, x1 = x0 + (2 * L) / 12;
    cam.face(R, [[x0, 0, -W], [x1, 0, -W], [x1, 0, W], [x0, 0, W]], i % 2 ? 0.06 : 0.025, 0, false);
  }
  const lv = 0.9;
  cam.path(R, [[-L, 0, -W], [L, 0, -W], [L, 0, W], [-L, 0, W]], lv, 0, true);
  cam.seg(R, [0, 0, -W], [0, 0, W], lv);
  cam.path(R, circle([0, 0, 0], [1, 0, 0], [0, 0, 1], 1.25, 48), lv);
  for (const s of [-1, 1]) {
    const x0 = s * L, x1 = s * (L - 1.45);
    cam.path(R, [[x0, 0, -1.8], [x1, 0, -1.8], [x1, 0, 1.8], [x0, 0, 1.8]], lv);
    const g = s * (L + 0.75);
    cam.seg(R, [x0, 0, -1.1], [x0, 1.15, -1.1], 1);
    cam.seg(R, [x0, 0, 1.1], [x0, 1.15, 1.1], 1);
    cam.seg(R, [x0, 1.15, -1.1], [x0, 1.15, 1.1], 1);
    for (const z of [-1.1, 1.1]) cam.seg(R, [x0, 1.15, z], [g, 0, z], 0.5);
    cam.seg(R, [g, 0, -1.1], [g, 0, 1.1], 0.5);
    for (let z = -0.73; z <= 0.8; z += 0.365) cam.seg(R, [x0, 1.15, z], [g, 0, z], 0.22);
  }
  bot(R, cam, [2.1, 1.0], 2.5, 0);
  sphere(R, cam, [0.7, 0.28, -0.5], 0.28, { lat: 3, lon: 4, lv: 1, ink: 1, base: 0.35, k: 0.5 });
  bot(R, cam, [-0.4, -1.2], 0.35, 1);
}

// ---------------------------------------------------------------------------
// TRIO-CODEJAM — three screens turned toward one lit problem.

export function terminals(R, { cols, rows }) {
  const cam = camera({ pos: [0, 3.5, -7.9], look: [0, 2.25, 0.6], fov: 40, cols, rows, fit: 'min' });
  floor(R, cam);
  const rand = rng(21);
  const core = [0, 3.15, 1.1];
  // A shallow arc, all three turned a little toward the middle.
  const panels = [
    { at: [-2.85, 1.95, 1.5], turn: -0.42 },
    { at: [2.85, 1.95, 1.5], turn: 0.42 },
    { at: [0, 1.75, 0.2], turn: 0 },
  ];
  const screen = (p) => {
    const w = 2.5, h = 1.6;
    const at = (x, y) => add(p.at, rotY([x, y, 0], p.turn));
    const quad = [at(-w / 2, -h / 2), at(w / 2, -h / 2), at(w / 2, h / 2), at(-w / 2, h / 2)];
    cam.face(R, quad, 0.025, 0);
    cam.path(R, quad, 0.95, 0, true);
    cam.seg(R, at(0, -h / 2), add(at(0, -h / 2), [0, -0.55, 0]), 0.6);
    cam.seg(R, add(at(-0.45, -h / 2), [0, -0.58, 0]), add(at(0.45, -h / 2), [0, -0.58, 0]), 0.6);
    cam.seg(R, at(-w / 2 + 0.06, h / 2 - 0.24), at(w / 2 - 0.06, h / 2 - 0.24), 0.4);
    let indent = 0;
    for (let l = 0; l < 4; l++) {
      const y = h / 2 - 0.46 - l * 0.24;
      indent = clamp(indent + (rand() < 0.4 ? 1 : rand() < 0.4 ? -1 : 0), 0, 2);
      let x = -w / 2 + 0.18 + indent * 0.2;
      const end = Math.min(w / 2 - 0.18, x + 0.5 + rand() * 1.5);
      while (x < end) {
        const sw = 0.12 + rand() * 0.38;
        cam.seg(R, at(x, y), at(Math.min(end, x + sw), y), 0.85);
        x += sw + 0.1;
      }
      if (l === 3) {
        const q = cam.project(at(Math.min(w / 2 - 0.14, x + 0.06), y));
        if (q) R.cell(q[0], q[1], 0.9, 1);
      }
    }
  };
  // Beams first, then the core, then the screens in front of it.
  for (const p of panels) fogSeg(R, cam, add(p.at, [0, 0.8, 0]), core, () => 0.35, 1, 6);
  const c = icosahedron(core, 0.6, [0.3, 0.5, 0]);
  solid(R, cam, c.verts, c.faces, { base: 0.36, k: 0.4, ink: 1, lv: 1 });
  panels.forEach(screen);
}

// ---------------------------------------------------------------------------
// CODECLASH — three hours on the clock: a dial with the first quarter lit.

export function clock(R, { cols, rows }) {
  const cam = camera({ pos: [2.2, 3.3, -9.6], look: [0, 2.5, 0], fov: 38, cols, rows, fit: 'min' });
  floor(R, cam);
  const c = [0, 2.65, 0];
  const place = (p) => add(c, rotY(rotX(p, 0.16), 0.3));
  const Rr = 2.35, depth = 0.5, n = 60;
  const ring = (z, r) => Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return place([Math.cos(a) * r, Math.sin(a) * r, z]);
  });
  const back = ring(depth, Rr), front = ring(0, Rr);
  cam.path(R, back, 0.35);
  const mid = place([0, 0, depth / 2]);
  for (let i = 0; i < n; i++) {
    const out = norm(sub(lerp(front[i], front[i + 1], 0.5), place([0, 0, 0])));
    if (dot(out, sub(cam.pos, front[i])) <= 0) continue;
    cam.face(R, [front[i], front[i + 1], back[i + 1], back[i]], lambert(out, 0.03, 0.22), 0, false);
    if (i % 5 === 0) cam.seg(R, front[i], back[i], 0.3);
  }
  void mid;
  cam.face(R, front, 0.02, 0);
  cam.path(R, front, 1);
  const sector = [place([0, 0, -0.01])];
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI / 2 - (i / 24) * (Math.PI / 2);
    sector.push(place([Math.cos(a) * Rr * 0.84, Math.sin(a) * Rr * 0.84, -0.01]));
  }
  cam.face(R, sector, 0.3, 1, false);
  cam.path(R, sector.slice(1), 1, 1);
  for (let h = 0; h < 12; h++) {
    const a = Math.PI / 2 - (h / 12) * Math.PI * 2;
    const r0 = h % 3 === 0 ? 1.7 : 1.98;
    cam.seg(R, place([Math.cos(a) * r0, Math.sin(a) * r0, -0.02]), place([Math.cos(a) * 2.18, Math.sin(a) * 2.18, -0.02]), 0.95, h > 0 && h <= 3 ? 1 : 0);
  }
  cam.seg(R, place([0, 0, -0.03]), place([0, 1.45, -0.03]), 1);
  cam.seg(R, place([0, 0, -0.03]), place([1.15, 0, -0.03]), 1, 1);
  const crown = box(place([0, Rr + 0.26, depth / 2]), [0.46, 0.42, 0.4], 0.3);
  solid(R, cam, crown.verts, crown.faces, { lv: 0.9 });
  const k = cam.project(place([0, 0, -0.04]));
  if (k) R.cell(k[0], k[1], 0.62, 1);
}

// ---------------------------------------------------------------------------
// D2D — the deck's "crack surface": a wave mesh in its bounding box.

export function surface(R, { cols, rows }) {
  const cam = camera({ pos: [-6.4, 6.3, -8.2], look: [0, 1.25, 0], fov: 36, cols, rows, fit: 'min' });
  const S = 3, N = 11;
  const Hf = (x, z) => 1.35 + 0.85 * Math.sin(x * 0.95 + 0.4) * Math.cos(z * 0.85) + 0.32 * Math.sin((x + z) * 1.25);
  const b = box([0, 1.6, 0], [2 * S, 3.2, 2 * S]);
  const edges = [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const depthOf = (p) => dot(sub(p, cam.pos), cam.forward);
  const cd = depthOf([0, 1.6, 0]);
  const far = ([i, j]) => depthOf(lerp(b.verts[i], b.verts[j], 0.5)) > cd;
  for (const e of edges) if (far(e)) cam.seg(R, b.verts[e[0]], b.verts[e[1]], 0.35, 1);
  const P = (i, j) => {
    const x = -S + (i / N) * 2 * S, z = -S + (j / N) * 2 * S;
    return [x, Hf(x, z), z];
  };
  const quads = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) quads.push([i, j, depthOf(P(i + 0.5, j + 0.5))]);
  quads.sort((a, c) => c[2] - a[2]);
  for (const [i, j] of quads) {
    const A = P(i, j), B = P(i + 1, j), C = P(i + 1, j + 1), D = P(i, j + 1);
    let n = norm(cross(sub(D, A), sub(B, A)));
    if (n[1] < 0) n = mul(n, -1);
    cam.face(R, [A, B, C, D], lambert(n, 0.02, 0.24), 0);
    cam.path(R, [A, B, C, D], 0.8, 0, true);
  }
  let peak = [0, 0], hi = -Infinity;
  for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) if (P(i, j)[1] > hi) (hi = P(i, j)[1]), (peak = [i, j]);
  const top = P(...peak);
  const bar = box(add(top, [0, 0.8, 0]), [0.22, 1.6, 0.22]);
  solid(R, cam, bar.verts, bar.faces, { base: 0.38, k: 0.35, ink: 1, lv: 1 });
  for (const e of edges) if (!far(e)) cam.seg(R, b.verts[e[0]], b.verts[e[1]], 0.6, 1);
}

// ---------------------------------------------------------------------------
// SPONSORSHIP — a stage under a truss, two spots, and a blank banner.
// Returns the banner's screen box so the caller can set type on it.

export function stage(R, { cols, rows }) {
  const cam = camera({ pos: [0, 3.4, -13.2], look: [0, 2.75, 0], fov: 34, cols, rows });
  floor(R, cam, { half: 14, lv: 0.14, center: [0, 0, 2] });
  const W = 7.4, Ht = 5.8, zt = 1.4;
  const lattice = (a, b2, n) => {
    for (let i = 0; i < n; i++) {
      const p = lerp(a, b2, i / n), q = lerp(a, b2, (i + 1) / n);
      cam.seg(R, add(p, [0, 0, -0.25]), add(q, [0, 0, 0.25]), 0.45);
      cam.seg(R, add(p, [0, 0, 0.25]), add(q, [0, 0, -0.25]), 0.45);
    }
    for (const dz of [-0.25, 0.25]) cam.seg(R, add(a, [0, 0, dz]), add(b2, [0, 0, dz]), 0.8);
  };
  lattice([-W, 0, zt], [-W, Ht, zt], 12);
  lattice([W, 0, zt], [W, Ht, zt], 12);
  lattice([-W, Ht, zt], [W, Ht, zt], 30);
  const bw = 5.5, by0 = 2.25, by1 = 5.0, bz = 2.0;
  const banner = [[-bw, by0, bz], [bw, by0, bz], [bw, by1, bz], [-bw, by1, bz]];
  cam.face(R, banner, 0.05, 0);
  cam.path(R, banner, 0.95, 0, true);
  cam.path(R, [[-bw + 0.22, by0 + 0.22, bz - 0.01], [bw - 0.22, by0 + 0.22, bz - 0.01], [bw - 0.22, by1 - 0.22, bz - 0.01], [-bw + 0.22, by1 - 0.22, bz - 0.01]], 0.3, 1, true);
  for (const s2 of [-1, 1]) {
    const lamp = [s2 * 4.7, Ht - 0.35, zt - 0.25];
    const hit = [s2 * 1.7, 1.12, -1.4];
    const u = norm(cross(sub(hit, lamp), [0, 0, 1]));
    const pool = circle(hit, [1, 0, 0], [0, 0, 1], 1.35, 24);
    for (let i = 0; i < pool.length - 1; i++) cam.face(R, [lamp, pool[i], pool[i + 1]], 0.1, 1, false);
    cam.seg(R, lamp, pool[6], 0.45, 1);
    cam.seg(R, lamp, pool[18], 0.45, 1);
    void u;
    const head = box(lamp, [0.6, 0.45, 0.6], s2 * 0.4);
    solid(R, cam, head.verts, head.faces, { lv: 1, ink: 1, base: 0.3 });
  }
  const deck = box([0, 0.55, -1.1], [15.5, 1.1, 5]);
  solid(R, cam, deck.verts, deck.faces, { lv: 0.95, base: 0.025, k: 0.16 });
  for (let x = -7; x <= 7; x += 1) cam.seg(R, [x, 1.11, -3.6], [x, 1.11, 1.4], 0.14);
  for (const s2 of [-1, 1]) {
    cam.face(R, circle([s2 * 1.7, 1.12, -1.4], [1, 0, 0], [0, 0, 1], 1.35, 28), 0.22, 1, false);
    cam.path(R, circle([s2 * 1.7, 1.12, -1.4], [1, 0, 0], [0, 0, 1], 1.35, 28), 0.5, 1);
  }
  const tl = cam.project([-bw + 0.5, by1 - 0.45, bz]), br = cam.project([bw - 0.5, by0 + 0.45, bz]);
  return { banner: { x0: tl[0], y0: tl[1], x1: br[0], y1: br[1] } };
}

export const SCENES = { horizon, computer, icosa, candles, ribbon, track, pitch, terminals, clock, surface, stage };

// Natural width / height of each scene's frame.
export const RATIO = { horizon: 16 / 9, stage: 2.4 };
