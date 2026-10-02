<script>
  import Wordmark from './Wordmark.svelte';
  import { EVENT, SECTIONS } from './content.js';
</script>

<footer class="foot">
  <div class="big" aria-hidden="true">
    <Wordmark lines={[`${EVENT.name} ${EVENT.year}`]} stack={[EVENT.name, EVENT.year]} cell={12} lens={false} label="" fg="#26251f" accent="#3a2018" revealMs={600} />
  </div>
  <div class="row">
    <span>{EVENT.host} · {EVENT.institute}</span>
    <nav aria-label="Footer">
      {#each SECTIONS as s}<a href="#{s.id}">{s.label}</a>{/each}
    </nav>
    <span>{EVENT.tagline}</span>
  </div>
</footer>

<style>
  .foot {
    padding: 30px var(--gutter) 28px;
    border-top: 1px solid var(--line);
    overflow: hidden;
  }

  .big {
    margin: 0 -4px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px 30px;
    margin-top: 22px;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--faint);
  }

  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
  }

  nav a {
    text-decoration: none;
    color: var(--dim);
  }

  nav a:hover {
    color: var(--bone);
  }

  @media (max-width: 860px) {
    .foot {
      padding-bottom: 80px;
    }
  }
</style>
