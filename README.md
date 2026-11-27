# Bloxd Music Studio

A cozy in-browser music editor for [bloxd.io](https://bloxd.io). Compose on a piano roll, preview in the browser, and export **World Code** you can paste into a Bloxd lobby.

**Live:** after GitHub Pages is on, the site is at  
https://epicoo00000.github.io/Bloxd-music-studio/

## Features

- Piano-roll editor — click to add a note, drag to paint, right-click to erase
- Four voices: **Blox**, **Bell**, **Reed**, **Hollow**
- Tempo (BPM), swing, master volume, loop
- Multiple patterns
- **Export Code** — Bloxd World Code (`tick` + `api.playSound`, no `async`)
- In Bloxd chat: **`/run`** to play, **`/stop`** to stop
- Space bar to preview in the browser

## Play it in Bloxd

Bloxd’s code engine **does not support `async` functions**, `await`, `setTimeout`, or `window.AudioContext`. Export is written for that sandbox.

1. Compose in this studio and click **Export Code**
2. Copy the snippet
3. In your Bloxd world, press **F8** (World Code) and paste
4. In chat type **`/run`** to play, **`/stop`** to stop

Sound map (Bloxd `playSound` names):

| Studio | Bloxd sound   | Pitch |
|--------|---------------|--------|
| Blox   | `harp_pling`  | rate = 2^((midi−60)/12), clamped 0.5–4 |
| Bell   | `sonarBeep`   | same |
| Reed   | `trumpetNote1`| same |
| Hollow | `bass`        | same |

World Code is limited to 16,000 characters. The export modal shows the length.

## Project structure

```
index.html          # app shell
css/style.css       # UI
js/audio.js         # Web Audio synth (browser preview)
js/player.js        # browser sequencer
js/editor.js        # piano-roll canvas
js/app.js           # state, transport, Bloxd export
favicon.svg
```

Static HTML/CSS/JS only. No build step.

## Use it locally

Open `index.html` in a browser, or from this folder:

```bash
npx --yes serve .
```

## Deploy (GitHub Pages)

This repo is already laid out for Pages (site at the repo root).

1. GitHub → **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / `/ (root)`
4. Save — the site goes live at  
   `https://<user>.github.io/Bloxd-music-studio/`

Any other static host (Netlify, Vercel, Cloudflare Pages) also works: point it at this folder, no build command.
