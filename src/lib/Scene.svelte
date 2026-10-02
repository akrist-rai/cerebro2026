<script>
  import { onMount } from 'svelte';
  import Ascii from './Ascii.svelte';
  import { Raster } from './ascii/raster.js';
  import { SCENES, RATIO } from './ascii/scenes.js';
  import { ADVANCE, LINE } from './ascii/engine.js';
  import { INK } from './fx.js';

  // A procedural 3D scene, drawn at the size of its own box: the glyphs stay
  // the same size on every screen, so the picture gains detail instead of
  // being scaled up.
  let {
    name,
    cell = 6.4, // target glyph width, px
    ratio = null, // width / height; defaults to the scene's own
    lens = true,
    label = '',
    revealMs = 650,
    floor = 0.16,
  } = $props();

  let box;
  let grid = $state(null);
  let near = $state(false);
  let key = '';

  function build() {
    const w = box?.clientWidth;
    if (!near || !w || !SCENES[name]) return;
    const r = ratio ?? RATIO[name] ?? 4 / 3;
    const cols = Math.max(40, Math.min(240, Math.round(w / cell)));
    const rows = Math.max(14, Math.round(w / r / ((cell / ADVANCE) * LINE)));
    const k = `${name}|${cols}x${rows}`;
    if (k === key) return;
    key = k;
    const R = new Raster(cols, rows).clear();
    SCENES[name](R, { cols, rows });
    grid = R.resolve();
  }

  $effect(() => {
    void name;
    void near;
    key = '';
    build();
  });

  onMount(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        near = true;
        io.disconnect();
      },
      { rootMargin: '400px' }
    );
    io.observe(box);
    let t;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(build, grid ? 150 : 0);
    });
    ro.observe(box);
    return () => {
      io.disconnect();
      ro.disconnect();
      clearTimeout(t);
    };
  });
</script>

<div class="scene" bind:this={box}>
  {#if grid}
    <Ascii {grid} fg={INK.bone} accent={INK.hot} {floor} {lens} lensR={11} {label} {revealMs} lazy={false} />
  {/if}
</div>

<style>
  .scene {
    width: 100%;
    line-height: 0;
  }
</style>
