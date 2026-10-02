# CEREBRO '26 — promo site

A static, frontend-only promotion site for Cerebro '26, IIIT Vadodara's
national-level hybrid technical fest. It reuses the TECH HUNT 2026 frontend
(same tokens, type, window frames, section heads and glyph engine) and takes
its copy from the sponsorship deck in `../content`.

Every picture is ASCII. Nothing here is an image file: the scenes are drawn in
3D at run time, at the size of the box they sit in.

No gate, no rCTF, no server: `npm run build` produces a folder of static files.

## Run

```sh
cd promo
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview    # serve dist/ locally
```

`vite.config.js` sets `base: './'`, so `dist/` works from any path: a bucket, a
subfolder, GitHub Pages, or nginx.

## Layout

| Path | What it is |
| --- | --- |
| `src/lib/content.js` | **Every word on the page.** Events, tiers, contacts, growth numbers. `*phrase*` marks the words the deck sets in red. |
| `src/lib/ascii/engine.js` | The glyph painter, grown from `../src/lib/ascii`: levels + contours + an ink per cell, drawn from a glyph atlas. |
| `src/lib/ascii/raster.js` | Draws triangles and lines at 3×5 subpixels per cell, then resolves each cell to a glyph. |
| `src/lib/ascii/scene.js` | The 3D layer: camera, near-plane clipping, solids, floor grids, wire spheres. |
| `src/lib/ascii/scenes.js` | **The pictures.** One function per scene. |
| `src/lib/Horizon.svelte` | The live hero: a scene redrawn ~30fps with the event name set into its sky. |
| `src/lib/Scene.svelte`, `Art.svelte`, `Stage.svelte` | Scene hosts: size a grid to the box, draw it once, keep it. |
| `src/lib/*.svelte` | One component per section: `TopBar`, `Hero`, `About`, `Fest` + `Growth` (chart), `Events`, `Sponsors`, `Contact`, `Footer`. |
| `scripts/sync-ascii.mjs` | Copies the TECH HUNT hero grid from the CTF site (`npm run ascii`). |

Keyboard: `1`–`5` jump to the sections, `0` goes back to the top.

## The pictures

`scenes.js` holds one function per picture, each drawing into a `Raster` in
cell space: bone line work, the hot accent for the one thing that matters, dark
Lambert fills so solids occlude what is behind them, and a floor grid that
fades out — so every scene reads as the same 3D viewport.

- **hero** (`horizon`) — a ringed planet rising over a valley of wire hills
  that flows toward the viewer. Runs live; holds one frame for anyone with
  reduced motion set, or when scrolled out of view.
- **events** — `icosa` (Enigma), `candles` (Retro Market), `ribbon`
  (Prudentia), `track` (Robo Race), `pitch` (Robo Soccer), `terminals`
  (Trio-Codejam), `clock` (CodeClash), `surface` (D2D).
- **sections** — `computer` (About) and `stage` (Sponsorship, with the banner
  type set on the banner the scene hands back).
- **Tech-Hunt** is the exception: it shows the CTF site's own hero grid, the
  one loaded picture on the site (`public/ascii/scenes.json`).

Scenes are drawn at the pixel size of their frame, so they gain detail on big
screens instead of being scaled up. To see them all at once while tuning, run
the dev server and open **`/lab.html`** (dev only — it is not built):

```
/lab.html                     every scene
/lab.html?s=horizon&w=1300    one scene, at a width
/lab.html?cell=5&t=12         finer glyphs; the hero at t = 12s
```

## Copy notes from the deck

The copy is transcribed as written, apart from two small fixes. A few things in
the deck look like mistakes; they are kept as-is here so they can be checked:

- **Enigma** is described as "Equinox" in its own blurb.
- **Tech-Hunt** says "TechHunt 2025" on a Cerebro '26 deck.
- The participation chart jumps from **2023-24 to 2025-26** (no 2024-25).
- **Event Sponsor** reads "contribution *upto* $349" while the cheaper tiers
  read "*exceeding*" $269 / $200.

The two fixes: the deck's Retro Market text is cut off mid-sentence ("…in this
hands-on, offline"), so it is finished as "…offline event."; and "UR BRAND" in
the Event Sponsor perks is written out as "your brand".
