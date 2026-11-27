/* Bloxd.io note sounds — same names as api.playSound
   https://bloxd.io/docs/sounds  (category: note)
   Pitch in Bloxd is `rate`: 1 = C4 (midi 60). Range 0.5–4. */

const BLOXD_SOUNDS = [
  { id: 'harp_pling',   label: 'Harp',      color: '#f5d76e', osc: 'sine',     noise: false },
  { id: 'bass',         label: 'Bass',      color: '#6c8cff', osc: 'triangle', noise: false },
  { id: 'bassattack',   label: 'Bass pluck',color: '#8b5cf6', osc: 'square',   noise: false },
  { id: 'sonarBeep',    label: 'Beep',      color: '#2dd4bf', osc: 'sine',     noise: false },
  { id: 'trumpetNote1', label: 'Trumpet',   color: '#fb923c', osc: 'sawtooth', noise: false },
  { id: 'snare',        label: 'Snare',     color: '#f472b6', osc: 'square',   noise: true  },
  { id: 'hat',          label: 'Hat',       color: '#cbd5e1', osc: 'square',   noise: true  },
  { id: 'bd',           label: 'Kick',      color: '#94a3b8', osc: 'sine',     noise: false, kick: true }
];

const bloxdColor = (id) => {
  for (let i = 0; i < BLOXD_SOUNDS.length; i++) {
    if (BLOXD_SOUNDS[i].id === id) return BLOXD_SOUNDS[i].color;
  }
  return '#f5d76e';
};

const bloxdMidiRate = (midi) => {
  let r = Math.pow(2, (midi - 60) / 12);
  if (r < 0.5) r = 0.5;
  if (r > 4) r = 4;
  return r;
};
