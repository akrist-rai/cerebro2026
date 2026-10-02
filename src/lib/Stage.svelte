<script>
  import { onMount } from 'svelte';
  import Ascii, { fonts } from './Ascii.svelte';
  import { Raster, stamp } from './ascii/raster.js';
  import { stage } from './ascii/scenes.js';
  import { textGrid, ADVANCE, LINE } from './ascii/engine.js';
  import { INK } from './fx.js';

  // The sponsorship banner: a lit stage with the offer set on its own banner.
  let { cell = 6.2, words = 'YOUR BRAND', ratio = 2.4, label = 'A lit stage under a truss, its banner reading YOUR BRAND, drawn in ASCII' } = $props();

  let box;
  let grid = $state(null);
  let key = '';

  function build() {
    const w = box?.clientWidth;
    if (!w) return;
    const cols = Math.max(60, Math.min(260, Math.round(w / cell)));
    const rows = Math.max(18, Math.round(w / ratio / ((cell / ADVANCE) * LINE)));
    const k = `${cols}x${rows}|${words}`;
    if (k === key) return;
    key = k;
    const R = new Raster(cols, rows).clear();
    const { banner } = stage(R, { cols, rows });
    const g = R.resolve();
    // Set the type inside the banner the scene handed back.
    const bw = Math.max(8, Math.round((banner.x1 - banner.x0) * 0.94));
    const text = textGrid([words], { cols: bw, shade: 0.85 });
    const ox = Math.round((banner.x0 + banner.x1) / 2 - text.w / 2);
    const oy = Math.round((banner.y0 + banner.y1) / 2 - text.h / 2);
    stamp(g, text, ox, oy, 1);
    grid = g;
  }

  onMount(() => {
    let t;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(build, grid ? 150 : 0);
    });
    fonts().then(build);
    ro.observe(box);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  });
</script>

<div class="stage" bind:this={box}>
  {#if grid}
    <Ascii {grid} fg={INK.bone} accent={INK.hot} floor={0.16} lens lensR={14} {label} lazy={false} revealMs={900} />
  {/if}
</div>

<style>
  .stage {
    width: 100%;
    line-height: 0;
  }
</style>
