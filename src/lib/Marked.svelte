<script>
  import { marks } from './content.js';

  // Copy with the deck's red phrases (`*like this*`) set in the hot colour.
  let { text } = $props();
</script>

{#each marks(text) as [t, hot]}{#if hot}<b>{t}</b>{:else}{t}{/if}{/each}
