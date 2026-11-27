/* =====================================================================
   Bloxd Music Maker — piano-roll grid editor
   ===================================================================== */
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const MIDI_LOW = 48;   // C3
const MIDI_HIGH = 79;  // G5
const ROWS = MIDI_HIGH - MIDI_LOW + 1; // 32 notes

const nameOf = (midi) => {
  const o = Math.floor(midi / 12) - 1;
  return NOTE_NAMES[midi % 12] + o;
};
const noteOfSharp = (midi) => NOTE_NAMES[midi % 12];
const isSharp = (midi) => noteOfSharp(midi).indexOf('#') !== -1;

const Editor = (canvas, axisEl, opts = {}) => {
  let notes = opts.notes || []; // {step, pitch, instrument, velocity}
  let steps = opts.steps || 16;
  let cellW = opts.cellW || 44;
  let cellH = opts.cellH || 20;
  let activeStep = -1;
  let onChange = opts.onChange || (() => {});

  const ctx = canvas.getContext('2d');
  const axis = axisEl;
  let painting = false;
  let painted = new Set(); // "${step}:${pitch}"

  const resize = () => {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.ceil(steps * cellW * dpr);
    canvas.height = Math.ceil(ROWS * cellH * dpr);
    canvas.style.width = (steps * cellW) + 'px';
    canvas.style.height = (ROWS * cellH) + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    axis.style.height = (ROWS * cellH) + 'px';
    render();
  };

  const keyIndexOf = (midi) => MIDI_HIGH - midi; // top row = highest pitch

  const renderAxis = () => {
    axis.innerHTML = '';
    for (let m = MIDI_HIGH; m >= MIDI_LOW; m--) {
      const div = document.createElement('div');
      div.className = 'piano-key' + (isSharp(m) ? ' sharp' : '');
      div.title = nameOf(m);
      div.textContent = nameOf(m);
      div.style.height = cellH + 'px';
      axis.appendChild(div);
    }
  };

  const drawNote = (n) => {
    const x = n.step * cellW + 2;
    const y = keyIndexOf(n.pitch) * cellH + 2;
    const w = cellW - 4;
    const h = cellH - 4;
    const rad = 6;
    const instColor = {
      blox: '#f59e0b',
      bell: '#c084fc',
      reed: '#34d399',
      hollow: '#60a5fa'
    }[n.instrument] || '#f59e0b';
    const alpha = 0.5 + 0.5 * (n.velocity || 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = instColor;
    ctx.shadowColor = instColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, rad);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(noteOfSharp(n.pitch).charAt(0), x + w/2, y + h/2 + 1);
    ctx.restore();
  };

  const render = () => {
    ctx.clearRect(0, 0, steps * cellW, ROWS * cellH);
    // grid
    ctx.strokeStyle = 'rgba(210,160,90,0.16)';
    ctx.lineWidth = 1;
    for (let s = 0; s <= steps; s++) {
      ctx.beginPath(); ctx.moveTo(s * cellW, 0); ctx.lineTo(s * cellW, ROWS * cellH); ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * cellH); ctx.lineTo(steps * cellW, r * cellH); ctx.stroke();
    }
    // thicker bar lines every 4 steps
    ctx.strokeStyle = 'rgba(210,160,90,0.35)';
    ctx.lineWidth = 1.5;
    for (let s = 0; s <= steps; s += 4) {
      ctx.beginPath(); ctx.moveTo(s * cellW, 0); ctx.lineTo(s * cellW, ROWS * cellH); ctx.stroke();
    }
    // active step highlight
    if (activeStep >= 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(245,158,11,0.10)';
      ctx.fillRect(activeStep * cellW, 0, cellW, ROWS * cellH);
      ctx.strokeStyle = 'rgba(245,158,11,0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(activeStep * cellW + 0.5, 0.5, cellW - 1, ROWS * cellH - 1);
      ctx.restore();
    }
    // notes
    notes.forEach(drawNote);
  };

  const cellFrom = (px, py) => {
    const step = Math.floor(px / cellW);
    const row = Math.floor(py / cellH);
    const pitch = MIDI_HIGH - row;
    return { step, pitch, valid: step >= 0 && step < steps && pitch >= MIDI_LOW && pitch <= MIDI_HIGH };
  };

  const setNoteAt = (step, pitch, add) => {
    const idx = notes.findIndex(n => n.step === step && n.pitch === pitch);
    if (add) {
      if (idx < 0) notes.push({ step, pitch, instrument: opts.currentInstrument || 'blox', velocity: 1 });
    } else {
      if (idx >= 0) notes.splice(idx, 1);
    }
    onChange([...notes]);
    render();
  };

  const onPointer = (e, add) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const c = cellFrom(px, py);
    if (!c.valid) return;
    const key = `${c.step}:${c.pitch}`;
    if (painted.has(key)) return;
    painted.add(key);
    setNoteAt(c.step, c.pitch, add);
  };

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) return; // context menu handles erase
    painting = true;
    painted.clear();
    onPointer(e, true);
  });
  window.addEventListener('mousemove', (e) => {
    if (!painting) return;
    onPointer(e, true);
  });
  window.addEventListener('mouseup', () => { painting = false; painted.clear(); });
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const c = cellFrom(e.clientX - rect.left, e.clientY - rect.top);
    if (c.valid) setNoteAt(c.step, c.pitch, false);
  });

  const setActiveStep = (s) => { activeStep = s; render(); };

  return {
    resize,
    setSteps: (n) => { steps = n; resize(); },
    setNotes: (ns) => { notes = ns; render(); },
    setInstrument: (inst) => { opts.currentInstrument = inst; render(); },
    setCellW: (w) => { cellW = w; resize(); },
    setCellH: (h) => { cellH = h; resize(); },
    setOnChange: (cb) => { onChange = cb; },
    setActiveStep,
    getNotes: () => notes,
    getSteps: () => steps,
  };
};
