/* Bloxd Music Maker — sequencer for the in-browser preview */

const Player = (() => {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  let running = false;
  let stopRequested = false;
  let loop = true;
  let onNote = () => {};
  let onEnd = () => {};

  const buildEvents = (song) => {
    const { bpm = 110, swing = 0, patterns = [] } = song;
    if (!patterns.length) return { events: [], total: 0 };
    const stepsPerPattern = patterns[0].steps || 16;
    const quarterSec = 60 / bpm;
    const stepSec = quarterSec / 4;
    const patternSec = stepsPerPattern * stepSec;
    const swingSec = (swing / 100) * stepSec;

    const events = [];
    patterns.forEach((pat, pi) => {
      const offset = pi * patternSec;
      (pat.notes || []).forEach((n) => {
        const sway = (n.step % 2 === 1) ? swingSec : 0;
        events.push({
          time: offset + n.step * stepSec + sway,
          pitch: n.pitch,
          instrument: n.instrument || 'harp_pling',
          velocity: n.velocity == null ? 1 : n.velocity,
          dur: stepSec * 0.82
        });
      });
    });
    events.sort((a, b) => a.time - b.time || a.pitch - b.pitch);
    return { events, total: patterns.length * patternSec };
  };

  const playOnce = async (song) => {
    const { events, total } = buildEvents(song);
    if (!events.length) return;
    let last = 0;
    for (const ev of events) {
      if (stopRequested) break;
      const wait = Math.max(0, (ev.time - last) * 1000);
      if (wait) await sleep(wait);
      if (stopRequested) break;
      last = ev.time;
      try {
        AudioKit.play(ev.pitch, ev.dur, ev.instrument, ev.velocity);
      } catch (err) {
        console.error('note play failed', err);
      }
      try { onNote(ev); } catch (e) {}
    }
    if (!stopRequested) {
      await sleep(Math.max(0, (total - last) * 1000));
    }
  };

  return {
    setLoop(v) { loop = !!v; },
    setOnNote(cb) { onNote = cb || (() => {}); },
    setOnEnd(cb) { onEnd = cb || (() => {}); },
    isPlaying() { return running && !stopRequested; },
    play(song) {
      if (running) this.stop();
      running = true;
      stopRequested = false;
      const run = async () => {
        try {
          do {
            await playOnce(song);
          } while (loop && !stopRequested);
        } finally {
          running = false;
          try { onEnd(); } catch (e) {}
        }
      };
      run();
    },
    stop() {
      stopRequested = true;
      running = false;
      AudioKit.stopAll();
    }
  };
})();
