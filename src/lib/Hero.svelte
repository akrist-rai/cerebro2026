<script>
  import { onMount } from 'svelte';
  import Horizon from './Horizon.svelte';
  import Wordmark from './Wordmark.svelte';
  import { EVENT, EVENTS, TIERS, GROWTH } from './content.js';
  import { INK } from './fx.js';

  // Wide screens carry the name inside the sky; narrow ones set it above.
  let wide = $state(true);

  const first = GROWTH[0];
  const last = GROWTH[GROWTH.length - 1];
  const fmt = (n) => n.toLocaleString('en-US');

  const STATS = [
    { v: fmt(last.n), l: `Participants in ${last.year}` },
    { v: `${(last.n / first.n).toFixed(1)}×`, l: `Growth since ${first.year}` },
    { v: EVENTS.length, l: 'Inter-college events' },
    { v: TIERS.length, l: 'Sponsorship tiers' },
  ];

  onMount(() => {
    const mq = matchMedia('(min-width: 861px)');
    const sync = () => (wide = mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });
</script>

<section class="hero" id="top">
  <h1 class="sr">{EVENT.name} {EVENT.year} — {EVENT.tagline}</h1>
  <div class="kicker">
    <span class="status"><i></i>{EVENT.host}</span>
    <span>{EVENT.institute}</span>
    <span class="hide-s">presents</span>
    <span class="edition">Edition {EVENT.year} · National · Hybrid</span>
  </div>

  {#if !wide}
    <div class="mark">
      <Wordmark cell={7} lens={false} fg={INK.bone} accent={INK.hot} revealMs={700} label="" />
    </div>
  {/if}

  <Horizon showTitle={wide} />

  <div class="panel">
    <p class="tagline led">{EVENT.tagline}</p>
    <p class="tag">
      <b>A national-level hybrid technical fest.</b>
      Robots, code, markets, design, a quiz and a capture-the-flag: {EVENTS.length} inter-college events hosted by
      {EVENT.institute}.
    </p>
    <div class="cta">
      <a class="btn hot" href="#events">Explore the events <span aria-hidden="true">→</span></a>
      <a class="btn" href="#sponsor">Sponsor Cerebro</a>
    </div>
  </div>
</section>

<section class="stats" aria-label="Cerebro in numbers">
  {#each STATS as s}
    <div>
      <b class="led">{s.v}</b>
      <span>{s.l}</span>
    </div>
  {/each}
</section>

<style>
  .hero {
    display: grid;
    grid-template-rows: auto minmax(240px, 1fr) auto;
    height: calc(100svh - var(--bar));
    min-height: 620px;
    border-bottom: 1px solid var(--line);
  }

  .mark {
    padding: 0 var(--gutter) 10px;
  }

  .kicker {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 22px;
    padding: 14px var(--gutter);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--dim);
  }

  .status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--bone);
  }

  .status i {
    width: 8px;
    height: 8px;
    background: var(--hot);
  }

  .edition {
    margin-left: auto;
    color: var(--faint);
  }

  /* The panel docks under the sky: type never sits on the moving picture. */
  .panel {
    display: grid;
    grid-template-columns: minmax(0, 6fr) minmax(0, 5fr) auto;
    align-items: end;
    gap: 18px clamp(20px, 4vw, 56px);
    padding: 22px var(--gutter) 26px;
    border-top: 1px solid var(--line);
    background: var(--ink);
  }

  .tagline {
    margin: 0;
    font-size: clamp(30px, 4.6vw, 74px);
    line-height: 0.9;
    text-transform: uppercase;
    color: var(--hot);
  }

  .tag {
    margin: 0;
    max-width: 52ch;
    font-size: 14px;
    color: var(--dim);
  }

  .tag b {
    display: block;
    margin-bottom: 6px;
    color: var(--bone);
    font-size: 16px;
  }

  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  /* ---- stats ---- */
  .stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-bottom: 1px solid var(--line);
  }

  .stats div {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 26px var(--gutter);
    border-right: 1px solid var(--line);
  }

  .stats div:last-child {
    border-right: none;
  }

  .stats b {
    font-size: clamp(36px, 4.4vw, 60px);
    line-height: 1;
  }

  .stats div:first-child b {
    color: var(--hot);
  }

  .stats span {
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--dim);
  }

  @media (max-width: 1100px) {
    .panel {
      grid-template-columns: minmax(0, 1fr);
    }
    .cta {
      justify-content: flex-start;
    }
  }

  @media (max-width: 860px) {
    /* Wordmark, then a band of sky, then the panel: nothing gets squeezed. */
    .hero {
      grid-template-rows: auto auto minmax(220px, 38svh) auto;
      height: auto;
      min-height: 0;
    }
    .stats {
      grid-template-columns: 1fr 1fr;
    }
    .stats div:nth-child(2) {
      border-right: none;
    }
    .stats div:nth-child(-n + 2) {
      border-bottom: 1px solid var(--line);
    }
    .hide-s,
    .edition {
      display: none;
    }
  }
</style>
