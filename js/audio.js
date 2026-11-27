/* =====================================================================
   Bloxd Music Maker — Web Audio API synth
   Cozy chiptune-ish voices: square (blox), sine (bell), saw (reed), triangle (hollow)
   ===================================================================== */
const AudioKit = (() => {
  let ctx = null;
  let master = null;
  const voices = [];
  const maxVoices = 16;

  const ensure = () => {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      ctx = new Ctor();
    }
    if (!master) {
      master = ctx.createGain();
      master.connect(ctx.destination);
      master.gain.value = 0.7;
    }
    return ctx;
  };

  const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  const releaseVoice = (v) => {
    try { v.osc.stop(); v.osc.disconnect(); } catch (e) {}
    try { v.gain.disconnect(); } catch (e) {}
    const i = voices.indexOf(v);
    if (i >= 0) voices.splice(i, 1);
  };

  const synth = {
    instruments: {
      blox:  { type: 'square',  attack: 0.008, decay: 0.06, sustain: 0.35, release: 0.12 },
      bell:  { type: 'sine',    attack: 0.01,  decay: 0.14, sustain: 0.05, release: 0.30 },
      reed:  { type: 'sawtooth',attack: 0.02,  decay: 0.10, sustain: 0.25, release: 0.18 },
      hollow:{ type: 'triangle',attack: 0.04,  decay: 0.16, sustain: 0.20, release: 0.22 },
    },
    init(masterVol) { ensure(); master.gain.value = Math.max(0, Math.min(1, masterVol / 100)); },
    play(midi, durationSec, instrument = 'blox', velocity = 1, when = null) {
      const c = ensure();
      const inst = synth.instruments[instrument] || synth.instruments.blox;
      const freq = midiToFreq(midi);
      const t = when === null ? c.currentTime : when;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = inst.type;
      osc.frequency.setValueAtTime(freq, t);
      // gentle detune warmth for coziness
      osc.detune.setValueAtTime(2, t);
      const v = Math.max(0, Math.min(1, velocity));
      const peak = 0.18 * v;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak, t + inst.attack);
      gain.gain.linearRampToValueAtTime(peak * inst.sustain, t + inst.attack + inst.decay);
      const end = t + durationSec;
      gain.gain.linearRampToValueAtTime(0, end + inst.release);
      osc.connect(gain); gain.connect(master);
      osc.start(t);
      osc.stop(end + inst.release + 0.02);
      const voice = { osc, gain };
      voices.push(voice);
      osc.onended = () => releaseVoice(voice);
      return voice;
    },
    stopAll() {
      voices.slice().forEach(releaseVoice);
    },
    setMaster(vol) { ensure(); master.gain.value = Math.max(0, Math.min(1, vol / 100)); }
  };

  // resume context on first interaction
  const boot = () => {
    ensure();
    if (ctx.state === 'suspended') ctx.resume();
  };
  ['pointerdown','keydown','mousedown','touchstart'].forEach(ev => {
    document.addEventListener(ev, boot, { once: true, passive: true });
  });

  return synth;
})();
