/* =====================================================================
   Bloxd Music Maker — co-routine player (async / await only)
   Sequencing is done with awaits; no setInterval / callback scheduling.
   ===================================================================== */
const Player = (() => {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  let running = false;
  let stopRequested = false;
  let loop = true;
  let onNote = () => {};
  let onEnd = () => {};

  // Flatten patterns + steps into absolute-time events (seconds from song start).
  const buildEvents = (song) => {
    const { bpm = 110, swing = 0, patterns = [] } = song;
    if (!patterns.length) return [];
    const stepsPerPattern = patterns[0].steps || 16;
    const quarterSec = 60 / bpm; // one quarter note
    const stepSec = quarterSec / 4; // one step = sixteenth note
    const patternSec = stepsPerPattern * stepSec;
    const swingSec = (swing / 100) * stepSec; // max ~40% of a step

    const events = [];
    patterns.forEach((pat, pi) => {
      const offset = pi * patternSec;
      (pat.notes || []).forEach((n) => {
        const stepSecAbs = n.step * stepSec;
        const sway = (n.step % 2 === 1) ? swingSec : 0;
        const time = offset + stepSecAbs + sway;
        events.push({
          time,
          pitch: n.pitch,
          instrument: n.instrument || 'blox',
          velocity: n.velocity == null ? 1 : n.velocity,
          dur: stepSec * 0.82, // note length slightly shorter than step (cozy groove)
        });
      });
    });
    events.sort((a, b) => a.time - b.time || a.pitch - b.pitch);
    const total = patterns.length * patternSec;
    return { events, total };
  };

  const playSong = async (song) => {
    const { events, total } = buildEvents(song);
    if (!events.length) {
      onEnd(); return;
    }
    running = true;
    stopRequested = false;
    let last = 0;
    try {
      for (const ev of events) {
        if (stopRequested) break;
        await sleep(Math.max(0, (ev.time - last) * 1000));
        if (stopRequested) break;
        last = ev.time;
        AudioKit.play(ev.pitch, ev.dur, ev.instrument, ev.velocity);
        onNote(ev);
      }
      if (!stopRequested) {
        await sleep(Math.max(0, (total - last) * 1000));
        if (!stopRequested) onEnd();
      }
    } finally {
      running = false;
    }
  };

  return {
    setLoop(v) { loop = !!v; },
    setOnNote(cb) { onNote = cb || (() => {}); },
    setOnEnd(cb) { onEnd = cb || (() => {}); },
    isPlaying() { return running; },
    async play(song) {
      if (running) this.stop();
      // loop via recursion so the whole thing stays a co-routine
      const run = async () => {
        await playSong(song);
        if (loop && !stopRequested) run();
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
