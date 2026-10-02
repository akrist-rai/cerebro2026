<script>
  import { onMount } from 'svelte';
  import TopBar from './lib/TopBar.svelte';
  import Hero from './lib/Hero.svelte';
  import About from './lib/About.svelte';
  import Fest from './lib/Fest.svelte';
  import Events from './lib/Events.svelte';
  import Sponsors from './lib/Sponsors.svelte';
  import Contact from './lib/Contact.svelte';
  import Footer from './lib/Footer.svelte';
  import { SECTIONS } from './lib/content.js';

  let active = $state('top');

  onMount(() => {
    // The section crossing a thin reading line just above mid-screen is the
    // current one; the hero counts as 'top'.
    const ids = ['top', ...SECTIONS.map((s) => s.id)];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) active = e.target.id;
      },
      { rootMargin: '-40% 0px -59% 0px' }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  });
</script>

<a class="skip" href="#about">Skip to content</a>
<TopBar {active} />
<main>
  <Hero />
  <About />
  <Fest />
  <Events />
  <Sponsors />
  <Contact />
</main>
<Footer />

<style>
  .skip {
    position: absolute;
    left: var(--gutter);
    top: -60px;
    z-index: 50;
    padding: 10px 14px;
    background: var(--hot);
    color: var(--ink);
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
  }

  .skip:focus {
    top: 8px;
  }
</style>
