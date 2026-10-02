<script>
  import { onMount } from 'svelte';
  import { fonts } from './Ascii.svelte';
  import { Painter, textGrid, ADVANCE, LINE } from './ascii/engine.js';
  import { Raster, stamp } from './ascii/raster.js';
  import { horizon } from './ascii/scenes.js';
  import { INK, reducedMotion } from './fx.js';

  // The hero: one live ASCII world, with the event name set into its sky.
  // It runs at ~30fps while on screen, holds one frame otherwise, and never
  // moves at all for anyone who asked for less motion.
  // `showTitle` sets the event name into the sky. Narrow screens don't have
  // the cells to render it legibly, so the hero puts the wordmark above
  // the picture instead.
  let { cell = 7.4, fps = 30, showTitle = true, label = 'A ringed planet rising over a valley of wire hills, drawn in ASCII' } = $props();

  let wrap;
  let canvas;
  let painter = null;
  let raster = null;
  let title = null; // { a, b, x, y, gap }
  let raf = 0;
  let t0 = 0;
  let last = -1e9;
  let onScreen = true;
  let cols = 0;
  let rows = 0;
  let pending = null;

  // Width of a string in the wordmark face, for sizing the two title pieces.
  function measure(s) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = '900 200px "Archivo", Impact, sans-serif';
    if ('fontStretch' in ctx) ctx.fontStretch = 'extra-condensed';
    return ctx.measureText(s).width;
  }

  function layout() {
    if (!wrap || !canvas) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    const ch = (cell / ADVANCE) * LINE;
    cols = Math.max(50, Math.round(w / cell));
    rows = Math.max(20, Math.round(h / ch));
    raster = new Raster(cols, rows);
    painter ??= new Painter(canvas);
    painter.style = { ...painter.style, fg: INK.bone, accent: INK.hot, floor: 0.15, weight: 500 };
    painter.lensR = 13;

    // Title: CEREBRO in bone, ’26 in the accent, sized to match cap heights.
    // It is placed in draw(), once the scene says where its horizon fell.
    const wide = (cols * ADVANCE) / (rows * LINE) > 1.15;
    const share = wide ? 0.42 : 0.74;
    const aCols = Math.round(cols * share);
    const bCols = Math.max(6, Math.round((aCols * measure('’26')) / measure('CEREBRO')));
    const a = textGrid(['CEREBRO'], { cols: aCols, shade: 0.8 });
    const b = textGrid(['’26'], { cols: bCols, shade: 0.8 });
    title = { a, b, wide, gap: Math.max(1, Math.round(aCols * 0.045)) };
    draw(reducedMotion() ? 7 : 0);
  }

  function draw(t) {
    if (!raster || !painter) return;
    raster.clear();
    const { horizonRow } = horizon(raster, { cols, rows, t });
    const g = raster.resolve();
    if (title && showTitle) {
      // The name sits high in the sky, left of the planet, with a halo wide
      // enough to hold it clear of the stars and the ridgeline.
      const { a, b, wide, gap } = title;
      const x = Math.max(1, Math.round(cols * 0.035));
      const y = Math.max(1, Math.round((horizonRow - a.h - (wide ? 0 : b.h)) * 0.34));
      if (wide) {
        stamp(g, a, x, y, 0, 2);
        stamp(g, b, x + a.w + gap, y + a.h - b.h, 1, 2);
      } else {
        stamp(g, a, x, y, 0, 2);
        stamp(g, b, x, y + a.h + 1, 1, 2);
      }
    }
    const first = painter.grid !== g;
    painter.setGrid(g);
    if (first) painter.layout(wrap.clientWidth, 0, 'width');
    painter.draw();
  }

  function frame(now) {
    raf = 0;
    if (!onScreen) return;
    if (now - last >= 1000 / fps - 1) {
      last = now;
      t0 ||= now;
      draw((now - t0) / 1000);
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || reducedMotion()) return;
    raf = requestAnimationFrame(frame);
  }

  function move(e) {
    if (!painter?.grid) return;
    pending = painter.toCell(e.clientX, e.clientY);
    painter.lens = pending;
    if (reducedMotion()) painter.draw();
  }

  function leave() {
    if (!painter?.grid) return;
    painter.lens = null;
    if (reducedMotion()) painter.draw();
  }

  onMount(() => {
    let dead = false;
    fonts().then(() => {
      if (dead) return;
      layout();
      start();
    });
    let t;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(layout, 160);
    });
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      if (onScreen) start();
    });
    io.observe(wrap);
    return () => {
      dead = true;
      ro.disconnect();
      io.disconnect();
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  });
</script>

<div class="sky" bind:this={wrap} role="img" aria-label={label} onpointermove={move} onpointerleave={leave}>
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .sky {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 260px;
    overflow: hidden;
    line-height: 0;
  }

  canvas {
    display: block;
    width: 100%;
  }
</style>
