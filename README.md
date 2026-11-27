# Bloxd Music Studio

A cozy in-browser music editor for [bloxd.io](https://bloxd.io). Compose on a piano roll, preview with chiptune voices, and export self-contained JavaScript that plays with `async`/`await` co-routines.

**Live:** after GitHub Pages is on, the site is at  
https://epicoo00000.github.io/Bloxd-music-studio/

## Features

- Piano-roll editor — click to add a note, drag to paint, right-click to erase
- Four voices: **Blox**, **Bell**, **Reed**, **Hollow**
- Tempo (BPM), swing, master volume, loop
- Multiple patterns
- **Export Code** — compressed co-routine JS you can copy or download
- **`/run`** — paste exported code in the command bar to play it
- Space bar to play / pause

## Project structure

```
index.html          # app shell
css/style.css       # UI
js/audio.js         # Web Audio synth
js/player.js        # async/await sequencer
js/editor.js        # piano-roll canvas
js/app.js           # state, transport, export
favicon.svg
```

Static HTML/CSS/JS only. No build step.

## Use it locally

Open `index.html` in a browser, or from this folder:

```bash
npx --yes serve .
```

Then compose, hit **Play**, and **Export Code** for a `.js` snippet.

### `/run` exported music

Export copies a command like:

```
/run (async function(){ ... })();
```

Paste that into the command bar at the bottom (or press `/` then `run` and paste the snippet) and hit Enter. The studio evals the co-routine and plays it.

- `/run` — play the current song as exported code
- `/run (async function(){ ... })();` — play a pasted export
- `/stop` — stop playback


## Deploy (GitHub Pages)

This repo is already laid out for Pages (site at the repo root).

1. GitHub → **Settings** → **Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / `/ (root)`
4. Save — the site goes live at  
   `https://<user>.github.io/Bloxd-music-studio/`

Any other static host (Netlify, Vercel, Cloudflare Pages) also works: point it at this folder, no build command.

## Export

**Export Code** generates a minified IIFE that:

- uses `async` / `await` only (no `setInterval`)
- creates an `AudioContext` and plays the notes in order
- can loop

Copy it into a page or Bloxd world-code block that can run JavaScript with Web Audio.
