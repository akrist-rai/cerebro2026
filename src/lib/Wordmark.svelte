<script>
  import { onMount } from 'svelte';
  import Ascii, { fonts } from './Ascii.svelte';
  import { textGrid } from './ascii/engine.js';
  import { INK } from './fx.js';

  // The event name, set in type and then re-drawn in glyphs by the same
  // engine that draws every picture.
  let {
    lines = ['CEREBRO ’26'],
    stack = ['CEREBRO', '’26'],
    cell = 9,
    lens = true,
    label = 'CEREBRO ’26',
    fg = INK.bone,
    accent = INK.hot,
    revealMs = 900,
  } = $props();

  let box;
  let grid = $state(null);
  let key = '';

  async function build() {
    const w = box?.clientWidth;
    if (!w) return;
    await fonts();
    const narrow = w < 640;
    const cols = Math.max(44, Math.min(190, Math.round(w / (narrow ? cell * 0.8 : cell))));
    const use = narrow ? stack : lines;
    const k = `${cols}|${use.join('/')}`;
    if (k === key) return;
    key = k;
    grid = textGrid(use, { cols });
  }

  onMount(() => {
    let t;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(build, grid ? 120 : 0);
    });
    ro.observe(box);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  });
</script>

<div class="mark" bind:this={box}>
  {#if label}<h1 class="sr">{label}</h1>{/if}
  {#if grid}
    <Ascii {grid} {fg} {accent} floor={0.35} weight={700} {lens} lensR={11} {revealMs} lazy={false} />
  {/if}
</div>

<style>
  .mark {
    width: 100%;
    min-height: 40px;
  }
</style>
