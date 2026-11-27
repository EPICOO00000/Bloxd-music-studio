/* Bloxd-style preview synth.
   Same pitch rule as api.playSound: rate = 2^((midi-60)/12), 1.0 = C4. */

const AudioKit = (() => {
  let ctx = null;
  let master = null;
  let noiseBuf = null;
  const voices = [];

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
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return ctx;
  };

  const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  const releaseVoice = (v) => {
    try { if (v.osc) { v.osc.stop(); v.osc.disconnect(); } } catch (e) {}
    try { if (v.src) { v.src.stop(); v.src.disconnect(); } } catch (e) {}
    try { v.gain.disconnect(); } catch (e) {}
    const i = voices.indexOf(v);
    if (i >= 0) voices.splice(i, 1);
  };

  const envGain = (gain, t, peak, dur, a, d, s, r) => {
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + a);
    gain.gain.linearRampToValueAtTime(peak * s, t + a + d);
    gain.gain.linearRampToValueAtTime(0, t + dur + r);
  };

  const specOf = (id) => {
    for (let i = 0; i < BLOXD_SOUNDS.length; i++) {
      if (BLOXD_SOUNDS[i].id === id) return BLOXD_SOUNDS[i];
    }
    return BLOXD_SOUNDS[0];
  };

  const synth = {
    init(masterVol) {
      ensure();
      master.gain.value = Math.max(0, Math.min(1, masterVol / 100));
    },
    play(midi, durationSec, instrument, velocity, when) {
      const c = ensure();
      const spec = specOf(instrument || 'harp_pling');
      const t = when == null ? c.currentTime : when;
      const v = Math.max(0, Math.min(1, velocity == null ? 1 : velocity));
      const peak = 0.2 * v;
      const gain = c.createGain();
      gain.connect(master);
      const voice = { gain };
      voices.push(voice);

      if (spec.noise) {
        const src = c.createBufferSource();
        src.buffer = noiseBuf;
        src.playbackRate.setValueAtTime(bloxdMidiRate(midi), t);
        const dur = spec.id === 'hat' ? 0.06 : 0.12;
        envGain(gain, t, peak * 0.9, dur, 0.002, 0.04, 0.05, 0.05);
        src.connect(gain);
        src.start(t);
        src.stop(t + dur + 0.08);
        voice.src = src;
        src.onended = () => releaseVoice(voice);
        return voice;
      }

      const osc = c.createOscillator();
      osc.type = spec.osc || 'sine';
      if (spec.kick) {
        osc.frequency.setValueAtTime(midiToFreq(Math.min(midi, 48)), t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
        envGain(gain, t, peak, 0.18, 0.004, 0.1, 0.15, 0.08);
        osc.stop(t + 0.28);
      } else {
        osc.frequency.setValueAtTime(midiToFreq(midi), t);
        envGain(gain, t, peak, durationSec, 0.008, 0.07, 0.22, 0.14);
        osc.stop(t + durationSec + 0.18);
      }
      osc.connect(gain);
      osc.start(t);
      voice.osc = osc;
      osc.onended = () => releaseVoice(voice);
      return voice;
    },
    stopAll() {
      voices.slice().forEach(releaseVoice);
    },
    setMaster(vol) {
      ensure();
      master.gain.value = Math.max(0, Math.min(1, vol / 100));
    }
  };

  const boot = () => {
    ensure();
    if (ctx.state === 'suspended') ctx.resume();
  };
  ['pointerdown', 'keydown', 'mousedown', 'touchstart'].forEach((ev) => {
    document.addEventListener(ev, boot, { once: true, passive: true });
  });

  return synth;
})();
