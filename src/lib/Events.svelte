<script>
  import { onMount } from 'svelte';
  import Art from './Art.svelte';
  import Marked from './Marked.svelte';
  import Head from './Head.svelte';
  import { EVENTS, TRACKS } from './content.js';

  // On a wide screen the events read as a list beside one standing viewer:
  // scroll the list, and the viewer draws whichever event you are reading.
  // Narrow screens get the picture inline with each event instead.
  let track = $state('All');
  let activeId = $state(EVENTS[0].id);
  let wide = $state(false);

  const pad = (n) => String(n).padStart(2, '0');
  const count = (t) => (t === 'All' ? EVENTS.length : EVENTS.filter((e) => e.track === t).length);
  const artLabel = (ev) => `${ev.name}: a 3D scene drawn in ASCII`;

  let shown = $derived(EVENTS.filter((e) => track === 'All' || e.track === track));
  let active = $derived(shown.find((e) => e.id === activeId) ?? shown[0]);

  let obs = null;
  const observer = () =>
    (obs ??= new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) activeId = e.target.dataset.id;
      },
      { rootMargin: '-38% 0px -52% 0px' }
    ));

  // Each event tells the observer where it is.
  function spy(node) {
    observer().observe(node);
    return { destroy: () => observer().unobserve(node) };
  }

  function pick(t) {
    track = t;
    const first = EVENTS.find((e) => t === 'All' || e.track === t);
    if (first) activeId = first.id;
  }

  onMount(() => {
    const mq = matchMedia('(min-width: 1080px)');
    const sync = () => (wide = mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => {
      mq.removeEventListener('change', sync);
      obs?.disconnect();
    };
  });
</script>

<section class="block" id="events">
  <Head num="03" label="Events" end="{EVENTS.length} events · {TRACKS.length} tracks" title="The " hot="events" />

  <div class="chips" role="group" aria-label="Filter events by track">
    {#each ['All', ...TRACKS] as t}
      <button type="button" class="chip" class:on={track === t} aria-pressed={track === t} onclick={() => pick(t)}>
        {t} <i>{count(t)}</i>
      </button>
    {/each}
  </div>

  <div class="deck">
    <div class="list">
      {#each shown as ev (ev.id)}
        <article class="ev" class:on={wide && ev.id === active?.id} id={ev.id} data-id={ev.id} use:spy>
          <div class="evhead">
            <span class="n led" aria-hidden="true">{pad(ev.num)}</span>
            <h3 class="display">{ev.name}</h3>
            {#if ev.flagship}<span class="tagx">Flagship</span>{/if}
          </div>
          <div class="meta"><span class="trk">{ev.track}</span>{ev.meta.join(' · ')}</div>
          {#if !wide}
            <div class="inline frame">
              <span class="bar"><i></i><i></i><i></i><span>{ev.id}.scene</span></span>
              <Art name={ev.art} cell={5.6} label={artLabel(ev)} />
            </div>
          {/if}
          <p class="lede"><Marked text={ev.lede} /></p>
          {#each ev.more as p}<p><Marked text={p} /></p>{/each}
        </article>
      {/each}
    </div>

    {#if wide && active}
      <aside class="viewer" aria-hidden="true">
        <div class="frame">
          <span class="bar"><i></i><i></i><i></i><span>{active.id}.scene — {pad(active.num)}/{pad(EVENTS.length)}</span></span>
          {#key active.id}
            <Art name={active.art} cell={6.2} label="" />
          {/key}
        </div>
        <div class="hud">
          <span class="trk">{active.track}</span>
          <span>{active.meta.join(' · ')}</span>
          <span class="idx led">{pad(active.num)}</span>
        </div>
      </aside>
    {/if}
  </div>
</section>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  .deck {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 6fr);
    gap: clamp(24px, 4vw, 64px);
    align-items: start;
  }

  .ev {
    padding: clamp(30px, 4vw, 52px) 0;
    border-top: 1px solid var(--line);
  }

  .ev:first-child {
    border-top: none;
  }

  .evhead {
    display: flex;
    align-items: baseline;
    gap: 16px;
  }

  .evhead .n {
    font-size: 30px;
    line-height: 1;
    color: var(--line-2);
    transition: color 0.2s;
  }

  .ev.on .evhead .n {
    color: var(--hot);
  }

  .evhead h3 {
    margin: 0;
    font-size: clamp(46px, 5.6vw, 92px);
  }

  .tagx {
    align-self: center;
    padding: 4px 8px;
    background: var(--hot);
    color: var(--ink);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .meta {
    margin-top: 14px;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
  }

  .trk {
    margin-right: 10px;
    padding: 2px 6px;
    border: 1px solid var(--line-2);
    color: var(--bone);
  }

  .inline {
    margin-top: 20px;
  }

  .ev p {
    margin: 16px 0 0;
    max-width: 62ch;
    color: var(--dim);
  }

  .ev .lede {
    margin-top: 20px;
    font-size: 16px;
    color: var(--bone);
  }

  .ev :global(b) {
    font-weight: 500;
    color: var(--hot);
  }

  /* ---- the standing viewer ---- */
  .viewer {
    position: sticky;
    top: calc(var(--bar) + 20px);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .viewer .frame {
    width: min(100%, calc((100vh - 300px) * 4 / 3));
  }

  .hud {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--dim);
  }

  .hud .idx {
    margin-left: auto;
    font-size: 22px;
    color: var(--hot);
  }

  @media (max-width: 1080px) {
    .deck {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
