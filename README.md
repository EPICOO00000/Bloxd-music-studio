# Bloxd Music Studio

Compose on a piano roll, preview in the browser, then export **Bloxd World Code** that plays for each player with [`api.playSound`](https://bloxd.io/docs/api-reference#playSound).

Bloxd has no custom-song API. Background tracks (`api.setClientOption(id, "music", name)`) are fixed playlists. Original tunes use **note sounds** + **rate** for pitch.

## Play it in Bloxd

1. Compose here → **Export for Bloxd** → Copy World Code
2. In your world press **F8**
3. Add a **`.js` file** (not `.ts`) and paste, then save
4. Join / respawn — the song plays for that player
5. Chat **`/run`** to play again, **`/stop`** to stop
6. Optional: put `playTune(myId)` in a Code Block so a click plays it for you

The export matches official snippets: `tick = (ms) => {}`, `onPlayerJoin`, `playerCommand`, and

```js
api.playSound(playerId, soundName, volume, rate)
```

No `async`, `await`, `setTimeout`, or `AudioContext` (Bloxd’s engine rejects those).

Pitch: `rate = 2^((midi − 60) / 12)`, clamped 0.5–4. `1` is C4.

## Bloxd note sounds

From [Sounds & Music](https://bloxd.io/docs/sounds) (`note`):

| In the studio | `playSound` name |
|---------------|------------------|
| Harp          | `harp_pling`     |
| Bass          | `bass`           |
| Bass pluck    | `bassattack`     |
| Beep          | `sonarBeep`      |
| Trumpet       | `trumpetNote1`   |
| Snare         | `snare`          |
| Hat           | `hat`            |
| Kick          | `bd`             |

The website uses the same names. Preview is a local synth; in Bloxd you hear the real game sounds.

World Code max length is 16,000 characters.

## Local

Open `index.html`, or:

```bash
npx --yes serve .
```

## Deploy (GitHub Pages)

Settings → Pages → Deploy from a branch → `main` / root.  
https://epicoo00000.github.io/Bloxd-music-studio/
