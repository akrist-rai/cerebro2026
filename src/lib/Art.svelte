<script>
  import Ascii from './Ascii.svelte';
  import Scene from './Scene.svelte';
  import { INK } from './fx.js';

  // Event art: a procedural scene, or the TECH HUNT hero grid for the CTF.
  let { name, cell = 6.4, label = '', lens = true } = $props();
</script>

{#if name === 'techhunt'}
  <Ascii src="scene:techhunt" fg={INK.bone} accent={INK.hot} floor={0.16} {lens} lensR={12} {label} />
{:else}
  <Scene {name} {cell} {label} {lens} />
{/if}
