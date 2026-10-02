<script>
  import { onMount } from 'svelte';
  import { EVENT, SECTIONS, GROWTH } from './content.js';

  // `active` is the section id under the reading line ('top' in the hero).
  let { active = 'top' } = $props();

  const latest = GROWTH[GROWTH.length - 1];
  const at = $derived(SECTIONS.findIndex((s) => s.id === active));
  const seg = (i) => (i === at ? 'here' : i < at ? 'past' : 'ahead');

  function go(id) {
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }

  onMount(() => {
    // `key` is a real shortcut: press it anywhere you aren't typing.
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) || e.target?.isContentEditable) return;
      if (e.key === '0') return (e.preventDefault(), go('top'));
      const s = SECTIONS.find((x) => x.key === e.key);
      if (!s) return;
      e.preventDefault();
      go(s.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<header class="bar">
  <div class="cells">
    <a class="brand" href="#top" aria-label="{EVENT.name} {EVENT.year} — top" aria-keyshortcuts="0">
      <span class="prompt">&gt;_</span>
      <span class="word display">{EVENT.name}</span>
      <span class="yr led">{EVENT.year}</span>
    </a>

    <nav class="tabs" aria-label="Sections">
      {#each SECTIONS as s}
        <a class="tab" class:on={active === s.id} href="#{s.id}" aria-current={active === s.id ? 'location' : undefined} aria-keyshortcuts={s.key}>
          <i class="k" aria-hidden="true">{s.key}</i>
          <span>{s.label}</span>
        </a>
      {/each}
    </nav>

    <div class="rack">
      <div class="cell read host">
        <i>HOSTED BY</i>
        <b>{EVENT.institute}</b>
      </div>
      <div class="cell read reach" title="{latest.n.toLocaleString('en-US')} participants in {latest.year}">
        <i>REACH {latest.year}</i>
        <b class="led">{latest.n.toLocaleString('en-US')}</b>
      </div>
      <a class="cell cta" href="#sponsor">Sponsor <span aria-hidden="true">→</span></a>
    </div>
  </div>

  <div class="rail" aria-hidden="true">
    {#each SECTIONS as s, i}
      <i class={seg(i)} title={s.label}></i>
    {/each}
  </div>
</header>

<nav class="dock" aria-label="Sections (mobile)">
  {#each SECTIONS as s}
    <a class:on={active === s.id} href="#{s.id}" aria-current={active === s.id ? 'location' : undefined}>
      <i aria-hidden="true">{s.key}</i>
      <span>{s.label}</span>
    </a>
  {/each}
</nav>

<style>
  .bar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: grid;
    grid-template-rows: minmax(0, 1fr) 3px;
    height: var(--bar);
    background: rgba(11, 11, 10, 0.94);
    backdrop-filter: blur(10px);
  }

  .cells {
    display: flex;
    min-width: 0;
    padding-left: var(--gutter);
    border-bottom: 1px solid var(--line);
  }

  /* ---- brand ---- */
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-right: 22px;
    border-right: 1px solid var(--line);
    text-decoration: none;
    flex-shrink: 0;
  }

  .prompt {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    background: var(--hot);
    color: var(--ink);
    font-weight: 800;
    font-size: 13px;
    letter-spacing: -0.04em;
  }

  .word {
    font-size: 26px;
    line-height: 1;
    padding-top: 2px;
  }

  .yr {
    font-size: 15px;
    color: var(--hot);
  }

  /* ---- tabs: full-height cells, the current section is a solid block ---- */
  .tabs {
    display: flex;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 18px;
    border-right: 1px solid var(--line);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    text-decoration: none;
    color: var(--dim);
    transition:
      background 0.12s,
      color 0.12s;
  }

  .k {
    display: grid;
    place-items: center;
    width: 17px;
    height: 17px;
    border: 1px solid var(--line-2);
    font-style: normal;
    font-size: 10px;
    letter-spacing: 0;
    color: var(--faint);
  }

  .tab:hover {
    background: var(--ink-2);
    color: var(--bone);
  }

  .tab:hover .k {
    border-color: var(--dim);
    color: var(--bone);
  }

  .tab.on {
    background: var(--bone);
    color: var(--ink);
  }

  .tab.on .k {
    border-color: var(--hot);
    background: var(--hot);
    color: var(--ink);
  }

  /* ---- right rack: readouts, then the one call to action ---- */
  .rack {
    display: flex;
    min-width: 0;
    margin-left: auto;
  }

  .cell {
    display: flex;
    align-items: center;
    min-width: 0;
    border-left: 1px solid var(--line);
  }

  .read {
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 3px;
    padding: 0 16px;
    white-space: nowrap;
  }

  .read i {
    font-style: normal;
    font-size: 9px;
    letter-spacing: 0.18em;
    color: var(--faint);
  }

  .read b {
    font-size: 12px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--bone);
  }

  .reach b {
    font-size: 17px;
    letter-spacing: 0.02em;
    color: var(--hot);
  }

  .cta {
    gap: 10px;
    padding: 0 var(--gutter) 0 22px;
    background: var(--hot);
    border-left-color: var(--hot);
    color: var(--ink);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.15s;
  }

  .cta:hover {
    background: var(--bone);
  }

  /* ---- rail: the bar's bottom edge is where you are on the page ---- */
  .rail {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: 2px;
    background: var(--ink);
  }

  .rail i {
    background: var(--ink-3);
    transition: background 0.2s;
  }

  .rail i.past {
    background: var(--line-2);
  }

  .rail i.here {
    background: var(--hot);
  }

  .dock {
    display: none;
  }

  @media (max-width: 1180px) {
    .host {
      display: none;
    }
  }

  @media (max-width: 1050px) {
    .k {
      display: none;
    }
    .tab {
      padding: 0 12px;
    }
  }

  @media (max-width: 960px) {
    .reach {
      display: none;
    }
  }

  @media (max-width: 860px) {
    .tabs {
      display: none;
    }

    .brand {
      border-right: none;
    }

    .dock {
      position: fixed;
      z-index: 40;
      left: 0;
      right: 0;
      bottom: 0;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      height: calc(52px + env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom);
      background: var(--ink);
      border-top: 1px solid var(--line-2);
    }

    .dock a {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      min-width: 0;
      border-right: 1px solid var(--line);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      color: var(--dim);
    }

    .dock a:last-child {
      border-right: none;
    }

    .dock i {
      font-style: normal;
      font-size: 9px;
      color: var(--faint);
    }

    .dock a.on {
      color: var(--ink);
      background: var(--bone);
    }

    .dock a.on i {
      color: var(--hot);
    }
  }

  @media (max-width: 420px) {
    .word {
      font-size: 22px;
    }
    .cta {
      padding-left: 16px;
    }
  }
</style>
