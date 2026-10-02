import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// Static, frontend-only: no gate, no rCTF proxy. `base: './'` keeps the build
// portable, so dist/ can be served from any path or opened from a file host.
export default defineConfig({
  base: './',
  plugins: [svelte()],
})
