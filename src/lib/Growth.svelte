<script>
  import { onMount } from 'svelte';
  import { GROWTH } from './content.js';

  // One series, one hue. Direct labels on the first and latest editions only;
  // the axis, the tooltip and the table carry the rest.
  const MAX = Math.ceil(Math.max(...GROWTH.map((d) => d.n)) / 1000) * 1000;
  const TICKS = Array.from({ length: MAX / 1000 + 1 }, (_, i) => i * 1000);
  const last = GROWTH.length - 1;
  const fmt = (n) => n.toLocaleString('en-US');
  const pct = (n) => (n / MAX) * 100;

  let fig;
  let hover = $state(null);
  let shown = $state(false);

  onMount(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        shown = true;
        io.disconnect();
      },
      { threshold: 0.35 }
    );
    io.observe(fig);
    return () => io.disconnect();
  });
</script>

<figure class="growth" bind:this={fig} style="--n: {GROWTH.length}">
  <figcaption>
    <span class="t">Participants per edition</span>
    <span class="s">{GROWTH[0].year} to {GROWTH[last].year}</span>
  </figcaption>

  <div class="plot" class:shown class:focus={hover !== null}>
    {#each TICKS as t}
      <div class="tick" class:base={t === 0} style="bottom: {pct(t)}%" aria-hidden="true"><span>{fmt(t)}</span></div>
    {/each}

    <div class="cols">
      {#each GROWTH as d, i}
        <button
          type="button"
          class="col"
          class:on={hover === i}
          style="--h: {pct(d.n)}%; --i: {i}"
          aria-label="{d.year}: {fmt(d.n)} participants"
          onpointerenter={() => (hover = i)}
          onpointerleave={() => (hover = null)}
          onfocus={() => (hover = i)}
          onblur={() => (hover = null)}
        >
          <span class="b"></span>
          {#if i === 0 || i === last}<span class="v">{fmt(d.n)}</span>{/if}
        </button>
      {/each}
    </div>

    {#if hover !== null}
      {@const d = GROWTH[hover]}
      <div
        class="tip"
        class:l={hover === 0}
        class:r={hover === last}
        style="left: {((hover + 0.5) / GROWTH.length) * 100}%; bottom: {pct(d.n)}%"
        aria-hidden="true"
      >
        <b>{fmt(d.n)}</b> participants
        <span>{d.year}</span>
      </div>
    {/if}
  </div>

  <div class="xs" aria-hidden="true">
    {#each GROWTH as d}<span>{d.year}</span>{/each}
  </div>

  <details class="twin">
    <summary>View as table</summary>
    <table>
      <thead><tr><th scope="col">Edition</th><th scope="col">Participants</th></tr></thead>
      <tbody>
        {#each GROWTH as d}
          <tr><td>{d.year}</td><td>{fmt(d.n)}</td></tr>
        {/each}
      </tbody>
    </table>
  </details>
</figure>

<style>
  .growth {
    --axis: 48px;
    margin: 0;
    padding: 20px 20px 18px;
    border: 1px solid var(--line);
  }

  figcaption {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px 16px;
    margin-bottom: 34px;
  }

  .t {
    font-size: 13px;
    font-weight: 700;
    color: var(--bone);
  }

  .s {
    font-size: 11px;
    letter-spacing: 0.1em;
    color: var(--faint);
  }

  /* ---- plot ---- */
  .plot {
    position: relative;
    height: clamp(200px, 26vw, 280px);
    margin-left: var(--axis);
  }

  .tick {
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--line);
  }

  .tick.base {
    background: var(--line-2);
  }

  .tick span {
    position: absolute;
    right: 100%;
    padding-right: 10px;
    transform: translateY(-50%);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    color: var(--faint);
  }

  .cols {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-columns: repeat(var(--n), 1fr);
  }

  /* The whole column is the hit area, not just the bar. */
  .col {
    position: relative;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    cursor: default;
  }

  .col:focus-visible {
    outline-offset: -2px;
  }

  .b {
    position: absolute;
    bottom: 0;
    left: 50%;
    width: min(24px, 46%);
    height: var(--h);
    margin-left: calc(min(24px, 46%) / -2);
    background: var(--hot);
    border-radius: 2px 2px 0 0;
    transform: scaleY(0);
    transform-origin: bottom;
    transition:
      transform 0.9s var(--ease) calc(var(--i) * 80ms),
      opacity 0.15s;
  }

  .shown .b {
    transform: scaleY(1);
  }

  .focus .col:not(.on) .b {
    opacity: 0.4;
  }

  .v {
    position: absolute;
    left: 50%;
    bottom: calc(var(--h) + 8px);
    transform: translateX(-50%);
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: var(--bone);
    opacity: 0;
    transition: opacity 0.4s 0.7s;
  }

  .shown .v {
    opacity: 1;
  }

  .col.on .v {
    visibility: hidden;
  }

  .tip {
    position: absolute;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    border: 1px solid var(--line-2);
    background: var(--ink-2);
    font-size: 11px;
    white-space: nowrap;
    color: var(--dim);
    pointer-events: none;
    transform: translate(-50%, -10px);
  }

  .tip.l {
    transform: translate(-22%, -10px);
  }

  .tip.r {
    transform: translate(-78%, -10px);
  }

  .tip b {
    font-size: 15px;
    color: var(--bone);
  }

  .tip span {
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--faint);
  }

  .xs {
    display: grid;
    grid-template-columns: repeat(var(--n), 1fr);
    margin: 10px 0 0 var(--axis);
    font-size: 10px;
    letter-spacing: 0.04em;
    text-align: center;
    color: var(--faint);
  }

  /* ---- table twin ---- */
  .twin {
    margin-top: 18px;
    padding-top: 12px;
    border-top: 1px solid var(--line);
  }

  summary {
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--dim);
    cursor: pointer;
  }

  summary:hover {
    color: var(--bone);
  }

  table {
    width: 100%;
    margin-top: 12px;
    border-collapse: collapse;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  th,
  td {
    padding: 7px 0;
    border-bottom: 1px solid var(--line);
    text-align: left;
  }

  th {
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--faint);
  }

  td:last-child,
  th:last-child {
    text-align: right;
  }

  @media (max-width: 480px) {
    .growth {
      --axis: 40px;
      padding: 16px 12px 14px;
    }
    .xs {
      font-size: 9px;
      letter-spacing: 0;
    }
  }
</style>
