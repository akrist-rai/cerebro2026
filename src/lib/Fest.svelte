<script>
  import Growth from './Growth.svelte';
  import Marked from './Marked.svelte';
  import Head from './Head.svelte';
  import { CEREBRO, GROWTH } from './content.js';

  const first = GROWTH[0];
  const last = GROWTH[GROWTH.length - 1];
  const fmt = (n) => n.toLocaleString('en-US');
</script>

<section class="block" id="cerebro">
  <Head num="02" label="The fest" end="National · Hybrid" title="Cere" hot="bro" />

  <div class="split">
    <div>
      <div class="prose"><p><Marked text={CEREBRO} /></p></div>
      <p class="pull">
        <span class="led">{fmt(first.n)}</span>
        <span class="to" aria-hidden="true">→</span>
        <span class="led hot">{fmt(last.n)}</span>
        <small>participants, {first.year} to {last.year}</small>
      </p>
    </div>

    <Growth />
  </div>
</section>

<style>
  .split {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: clamp(28px, 5vw, 80px);
    align-items: end;
  }

  .pull {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 14px;
    margin: 30px 0 0;
    padding-top: 20px;
    border-top: 1px solid var(--line);
  }

  .pull .led {
    font-size: clamp(34px, 4vw, 52px);
    line-height: 1;
  }

  .pull .hot {
    color: var(--hot);
  }

  .to {
    font-size: 22px;
    color: var(--faint);
  }

  .pull small {
    flex-basis: 100%;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--dim);
  }

  @media (max-width: 960px) {
    .split {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
