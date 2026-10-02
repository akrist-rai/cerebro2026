<script>
  import Head from './Head.svelte';
  import { CONTACT, EVENT, tel } from './content.js';

  // "Beyond the horizon." with the last word lit.
  const words = EVENT.tagline.split(' ');
  const tail = words.pop();
</script>

<section class="block" id="contact">
  <Head num="05" label="Contact" end="Call our leads" title="Love to hear " hot="from you" />

  <div class="split">
    <p class="prose">{CONTACT.intro}</p>

    <div class="leads">
      {#each CONTACT.groups as g}
        <div class="grp">
          <span class="label">{g.label}</span>
          <ul>
            {#each g.people as p}
              <li>
                <a href={tel(p.phone)}>
                  <span class="nm">{p.name}</span>
                  <b class="led">{p.phone}</b>
                  <span class="go">Call <span aria-hidden="true">→</span></span>
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </div>

  <div class="closer">
    <p class="display">{words.join(' ')} <span>{tail}.</span></p>
    <a class="btn hot" href="#events">See the events <span aria-hidden="true">→</span></a>
  </div>
</section>

<style>
  .split {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
    gap: clamp(28px, 5vw, 80px);
    align-items: start;
  }

  .prose {
    margin: 0;
    max-width: 38ch;
  }

  .grp + .grp {
    margin-top: 30px;
  }

  ul {
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--line);
  }

  a {
    display: grid;
    grid-template-columns: minmax(100px, auto) 1fr auto;
    align-items: baseline;
    gap: 6px 24px;
    padding: 18px 4px;
    border-bottom: 1px solid var(--line);
    text-decoration: none;
    transition:
      background 0.12s,
      padding 0.2s var(--ease);
  }

  a:hover {
    padding-left: 14px;
    background: var(--ink-2);
  }

  .nm {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--dim);
  }

  .led {
    font-size: clamp(26px, 3.4vw, 46px);
    line-height: 1;
    color: var(--bone);
  }

  a:hover .led {
    color: var(--hot);
  }

  .go {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--faint);
  }

  a:hover .go {
    color: var(--hot);
  }

  .closer {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-top: clamp(56px, 7vw, 96px);
    padding: clamp(40px, 5vw, 56px) 0;
    border-top: 1px solid var(--line);
  }

  .closer p {
    margin: 0;
    max-width: 12ch;
    font-size: clamp(56px, 8vw, 120px);
  }

  .closer p span {
    color: var(--hot);
  }

  @media (max-width: 960px) {
    .split {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 560px) {
    a {
      grid-template-columns: 1fr auto;
      gap: 2px 12px;
    }
    .led {
      grid-row: 2;
    }
    .go {
      grid-row: 1 / span 2;
      grid-column: 2;
      align-self: center;
    }
  }
</style>
