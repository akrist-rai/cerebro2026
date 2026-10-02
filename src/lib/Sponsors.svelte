<script>
  import Head from './Head.svelte';
  import Stage from './Stage.svelte';
  import { TIERS, GROWTH, CONTACT, tel } from './content.js';

  const reach = GROWTH[GROWTH.length - 1];
  const leads = CONTACT.groups.find((g) => g.label === 'Sponsorships')?.people ?? [];
  const pad = (n) => String(n).padStart(2, '0');
</script>

<section class="block" id="sponsor">
  <Head num="04" label="Sponsorship" end="{TIERS.length} tiers" title="Partner " hot="with us" />

  <div class="banner frame">
    <span class="bar"><i></i><i></i><i></i><span>main_stage.scene — your brand here</span></span>
    <Stage />
  </div>

  <div class="intro">
    <p class="prose">
      Put your brand in front of {reach.n.toLocaleString('en-US')} participants from across India: on stage, online, and in every
      hacker’s hands.
    </p>
  </div>

  <ol class="tiers">
    {#each TIERS as t, i}
      <li class="tier" class:lead={i === 0}>
        <div class="top">
          <span class="n led">{pad(i + 1)}</span>
          {#if i === 0}<span class="tagx">Headline</span>{/if}
        </div>
        <h3 class="display">{t.name}</h3>
        <p class="pitch">{t.pitch}</p>

        <div class="price">
          <span class="terms">{t.terms}</span>
          <b class="led">${t.price}</b>
        </div>

        <div class="ret">
          <span class="terms">What will you get in return?</span>
          <ul>
            {#each t.perks as p}<li>{p}</li>{/each}
          </ul>
        </div>

        <a class="btn small" class:hot={i === 0} href="#contact">Enquire <span aria-hidden="true">→</span></a>
      </li>
    {/each}
  </ol>

  {#if leads.length}
    <div class="direct">
      <span class="label">Sponsorship desk</span>
      {#each leads as p}
        <a href={tel(p.phone)}><b>{p.name}</b> {p.phone}</a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .banner {
    margin-bottom: 26px;
  }

  .intro .prose {
    margin: 0;
    max-width: 60ch;
    font-size: 16px;
  }

  .tiers {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    margin: 34px 0 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--line);
    border-left: 1px solid var(--line);
  }

  /* Each tier borrows the list's row tracks, so names, prices and perks line
     up across a row however each one wraps. */
  .tier {
    display: grid;
    grid-row: span 6;
    grid-template-rows: subgrid;
    row-gap: 16px;
    padding: 22px 22px 24px;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .tier.lead {
    background: var(--ink-2);
    box-shadow: inset 0 3px 0 var(--hot);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .n {
    font-size: 28px;
    color: var(--hot);
  }

  .tagx {
    padding: 4px 8px;
    background: var(--hot);
    color: var(--ink);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  h3 {
    margin: 0;
    font-size: clamp(38px, 3.4vw, 52px);
  }

  .pitch {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--dim);
  }

  .price {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 6px;
    padding: 18px 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  .terms {
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--faint);
  }

  .price b {
    font-size: clamp(56px, 5.4vw, 84px);
    line-height: 0.9;
    color: var(--hot);
  }

  ul {
    margin: 10px 0 0;
    padding: 0;
    list-style: none;
  }

  li li {
    position: relative;
    padding: 7px 0 7px 18px;
    border-bottom: 1px solid var(--line);
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--bone);
  }

  li li:last-child {
    border-bottom: none;
  }

  li li::before {
    content: '▪';
    position: absolute;
    left: 0;
    color: var(--hot);
  }

  .tier .btn {
    justify-self: start;
  }

  .direct {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 26px;
    margin-top: 22px;
    font-size: 13px;
  }

  .direct a {
    text-decoration: none;
    color: var(--dim);
  }

  .direct a b {
    margin-right: 6px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--bone);
  }

  .direct a:hover,
  .direct a:hover b {
    color: var(--hot);
  }

  @media (max-width: 1280px) {
    .tiers {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .tiers {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
