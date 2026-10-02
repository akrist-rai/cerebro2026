<script>
  import Scene from './Scene.svelte';
  import Marked from './Marked.svelte';
  import Head from './Head.svelte';
  import { ABOUT, EVENT } from './content.js';

  const FACTS = [
    ['Founded', '2013, by MHRD'],
    ['Status', 'Institute of National Importance'],
    ['Campus', 'GEC Gandhinagar'],
    ['Organizes', 'Cerebro, every year'],
  ];
</script>

<section class="block" id="about">
  <Head num="01" label="About us" end={EVENT.institute} title="About " hot="us" />

  <div class="split">
    <div>
      <div class="prose"><p><Marked text={ABOUT} /></p></div>
      <dl class="facts">
        {#each FACTS as [k, v]}
          <div><dt>{k}</dt><dd>{v}</dd></div>
        {/each}
      </dl>
    </div>

    <div class="art">
      <div class="frame">
        <span class="bar"><i></i><i></i><i></i><span>iiit-v.sys — workshops, talks, exhibitions</span></span>
        <Scene name="computer" cell={6} label="A desktop computer on a wireframe desk, drawn in ASCII" />
      </div>
    </div>
  </div>
</section>

<style>
  .split {
    display: grid;
    grid-template-columns: minmax(0, 6fr) minmax(0, 6fr);
    gap: clamp(28px, 5vw, 80px);
    align-items: start;
  }

  .facts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin: 30px 0 0;
    border-top: 1px solid var(--line);
    border-left: 1px solid var(--line);
    max-width: 60ch;
  }

  .facts div {
    padding: 14px 16px 16px;
    border-right: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
  }

  dt {
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--faint);
  }

  dd {
    margin: 6px 0 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--bone);
  }

  @media (max-width: 960px) {
    .split {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 420px) {
    .facts {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
