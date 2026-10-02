<script module>
  // Glyphs are drawn from the webfont; wait for it once for every instance so
  // the first paint isn't in a fallback face.
  let fontsReady = null;
  export function fonts() {
    fontsReady ??= Promise.all([
      document.fonts.load('500 16px "JetBrains Mono"'),
      document.fonts.load('900 100px "Archivo"'),
    ]).catch(() => {});
    return fontsReady;
  }
</script>

<script>
  import { onMount } from 'svelte';
  import { Painter, loadGrid } from './ascii/engine.js';
  import { reducedMotion } from './fx.js';

  let {
    // 'scene:<key>' — or pass a decoded `grid`.
    src = null,
    grid = null,
    fg = '#ece8dd',
    accent = '#ff4a1c',
    // Minimum opacity of the faintest glyph.
    floor = 0.22,
    weight = 500,
    // 'width' = height follows the grid; 'cover' = fill the parent box.
    fit = 'width',
    lens = false,
    lensR = 9,
    // Scan the image in on first paint.
    reveal = true,
    revealMs = 700,
    // External brightness controls.
    gain = 1,
    pulse = 0,
    lazy = true,
    label = '',
  } = $props();

  let wrap;
  let canvas;
  let painter;
  // Lazy-ness is fixed at mount; eager instances start near.
  // svelte-ignore state_referenced_locally
  let near = $state(!lazy);
  let data = $state(null);
  let raf = 0;
  let revealed = false;

  $effect(() => {
    if (grid) {
      data = grid;
      return;
    }
    if (!near || !src) return;
    let dead = false;
    loadGrid(src).then(
      (g) => !dead && (data = g),
      () => {}
    );
    return () => (dead = true);
  });

  function size() {
    if (!painter?.grid || !wrap) return;
    painter.layout(wrap.clientWidth, fit === 'cover' ? wrap.clientHeight : 0, fit);
    painter.draw();
  }

  function scan() {
    if (revealed || !reveal || reducedMotion()) {
      painter.reveal = 1;
      painter.draw();
      return;
    }
    revealed = true;
    const t0 = performance.now();
    const step = (now) => {
      painter.reveal = Math.min(1, (now - t0) / revealMs);
      painter.draw();
      raf = painter.reveal < 1 ? requestAnimationFrame(step) : 0;
    };
    painter.reveal = 0;
    raf = requestAnimationFrame(step);
  }

  // New grid or new colours: rebuild and repaint.
  $effect(() => {
    const g = data;
    const style = { fg, accent, floor, weight };
    if (!g || !canvas) return;
    let dead = false;
    fonts().then(() => {
      if (dead) return;
      painter ??= new Painter(canvas);
      painter.style = { ...painter.style, ...style };
      painter.lensR = lensR;
      painter.setGrid(g);
      size();
      scan();
    });
    return () => (dead = true);
  });

  // Audio-driven brightness: cheap full repaint each change.
  $effect(() => {
    const gn = gain;
    const p = pulse;
    if (!painter?.grid || painter.reveal < 1) return;
    painter.gain = gn;
    painter.pulse = p;
    painter.draw();
  });

  let pending = null;
  function move(e) {
    if (!lens || !painter?.grid || painter.reveal < 1) return;
    pending = painter.toCell(e.clientX, e.clientY);
    if (!raf) raf = requestAnimationFrame(flush);
  }
  function leave() {
    if (!lens || !painter?.grid) return;
    pending = null;
    if (!raf) raf = requestAnimationFrame(flush);
  }
  function flush() {
    raf = 0;
    const prev = painter.lens;
    painter.lens = pending;
    const box = painter.lensBounds(prev, pending);
    if (box) painter.draw(box);
  }

  onMount(() => {
    const ro = new ResizeObserver(size);
    ro.observe(wrap);
    let io;
    if (lazy) {
      io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          near = true;
          io.disconnect();
        },
        { rootMargin: '300px' }
      );
      io.observe(wrap);
    }
    return () => {
      ro.disconnect();
      io?.disconnect();
      cancelAnimationFrame(raf);
    };
  });
</script>

<div
  class="ascii"
  class:cover={fit === 'cover'}
  bind:this={wrap}
  role={label ? 'img' : undefined}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : 'true'}
  onpointermove={move}
  onpointerleave={leave}
>
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .ascii {
    width: 100%;
    line-height: 0;
    overflow: hidden;
  }

  .ascii.cover {
    height: 100%;
  }

  canvas {
    display: block;
    width: 100%;
  }
</style>
