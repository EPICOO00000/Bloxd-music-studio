/* =====================================================================
   Bloxd Music Maker — application
   ===================================================================== */
(function () {
  const $ = (id) => document.getElementById(id);

  /* ---------- state ---------- */
  const state = {
    bpm: 110,
    swing: 0,
    volume: 70,
    loop: true,
    currentInstrument: 'blox',
    patterns: [
      { id: 'p1', name: 'Pattern 1', steps: 16, notes: [] }
    ],
    currentPattern: 'p1',
  };

  const INSTRUMENTS = [
    { id: 'blox', label: 'Blox', color: '#f59e0b' },
    { id: 'bell', label: 'Bell', color: '#c084fc' },
    { id: 'reed', label: 'Reed', color: '#34d399' },
    { id: 'hollow', label: 'Hollow', color: '#60a5fa' }
  ];

  /* ---------- modules ---------- */
  AudioKit.init(state.volume);
  Player.setLoop(state.loop);
  Player.setOnNote((ev) => {
    meta.textContent = `Playing ${nameOf(ev.pitch)} · ${ev.instrument}`;
  });
  Player.setOnEnd(() => {
    if (!Player.isPlaying()) { meta.textContent = 'Stopped'; playBtn.textContent = '▶'; editor.setActiveStep(-1); }
  });

  const editor = Editor($('grid'), $('piano-axis'), {
    steps: state.patterns[0].steps,
    notes: state.patterns[0].notes,
    currentInstrument: state.currentInstrument,
    onChange: (notes) => {
      const pat = currentPatternObj();
      if (pat) pat.notes = notes;
    }
  });

  /* ---------- helpers ---------- */
  const nameOf = (midi) => {
    const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const o = Math.floor(midi / 12) - 1;
    return names[midi % 12] + o;
  };
  const currentPatternObj = () => state.patterns.find(p => p.id === state.currentPattern);
  const patternSec = () => {
    const pat = currentPatternObj();
    return pat.steps * (60 / state.bpm) / 4;
  };

  /* ---------- UI: instruments ---------- */
  const instList = $('instrument-list');
  const renderInstruments = () => {
    instList.innerHTML = '';
    INSTRUMENTS.forEach((inst) => {
      const chip = document.createElement('div');
      chip.className = 'chip' + (state.currentInstrument === inst.id ? ' active' : '');
      chip.innerHTML = `<span style="opacity:.75">${inst.label}</span><span class="dot"></span>`;
      chip.onclick = () => {
        state.currentInstrument = inst.id;
        editor.setInstrument(inst.id);
        renderInstruments();
      };
      instList.appendChild(chip);
    });
  };

  /* ---------- UI: patterns ---------- */
  const patList = $('pattern-list');
  const renderPatterns = () => {
    patList.innerHTML = '';
    state.patterns.forEach((pat) => {
      const chip = document.createElement('div');
      chip.className = 'chip' + (state.currentPattern === pat.id ? ' active' : '');
      chip.textContent = pat.name;
      chip.onclick = () => {
        state.currentPattern = pat.id;
        editor.setSteps(pat.steps);
        editor.setNotes(pat.notes);
        editor.setInstrument(state.currentInstrument);
        renderPatterns();
        renderPatternsUI();
      };
      patList.appendChild(chip);
    });
  };
  const renderPatternsUI = () => {}; // placeholder hook

  /* ---------- UI: transport ---------- */
  const playBtn = $('btn-play');
  const stopBtn = $('btn-stop');
  const loopBtn = $('btn-loop');
  const meta = $('meta');

  const updatePlayBtn = (playing) => {
    playBtn.textContent = playing ? '⏸' : '▶';
    playBtn.className = 'btn ' + (playing ? 'accent' : '');
  };

  let animId = null;
  let songStart = 0;
  let exportPlaying = false;

  const startPlayhead = () => {
    songStart = performance.now();
    tick();
  };
  const tick = () => {
    if (!Player.isPlaying()) { editor.setActiveStep(-1); cancelAnimationFrame(animId); return; }
    const elapsed = (performance.now() - songStart) / 1000;
    const sec = patternSec();
    const patIdx = Math.floor(elapsed / sec) % state.patterns.length;
    const pat = state.patterns[patIdx];
    const stepIn = Math.floor(((elapsed % sec) / sec) * pat.steps);
    editor.setActiveStep(stepIn);
    // sync currentPattern visual to the playing pattern
    if (state.currentPattern !== pat.id) {
      state.currentPattern = pat.id;
      renderPatterns();
    }
    animId = requestAnimationFrame(tick);
  };

  $('btn-play').onclick = async () => {
    if (Player.isPlaying() || exportPlaying) {
      stopEverything();
      meta.textContent = 'Stopped';
      return;
    }
    stopRun();
    // resume audio context on gesture
    AudioKit.init(state.volume);
    const song = {
      bpm: state.bpm,
      swing: state.swing,
      patterns: state.patterns.map(p => ({ steps: p.steps, notes: p.notes }))
    };
    Player.setLoop(state.loop);
    Player.play(song);
    updatePlayBtn(true);
    meta.textContent = 'Playing…';
    startPlayhead();
  };
  $('btn-stop').onclick = () => {
    stopEverything();
    meta.textContent = 'Stopped';
  };
  $('btn-loop').onclick = () => {
    state.loop = !state.loop;
    Player.setLoop(state.loop);
    loopBtn.className = 'btn ghost small ' + (state.loop ? 'accent' : '');
    meta.textContent = state.loop ? 'Loop on' : 'Loop off';
  };

  /* controls */
  $('bpm').oninput = (e) => { state.bpm = +e.target.value; $('bpm-val').textContent = state.bpm + ' BPM'; };
  $('swing').oninput = (e) => { state.swing = +e.target.value; $('swing-val').textContent = state.swing + '%'; };
  $('volume').oninput = (e) => { state.volume = +e.target.value; $('volume-val').textContent = state.volume + '%'; AudioKit.setMaster(state.volume); };

  /* ---------- actions ---------- */
  $('btn-new').onclick = () => {
    if (!confirm('Start a new empty song?')) return;
    stopEverything();
    state.patterns = [{ id: 'p1', name: 'Pattern 1', steps: 16, notes: [] }];
    state.currentPattern = 'p1';
    editor.setSteps(16);
    editor.setNotes([]);
    renderPatterns();
    updatePlayBtn(false);
    meta.textContent = 'New song';
    editor.setActiveStep(-1);
  };

  $('btn-example').onclick = () => {
    Player.stop();
    const pat = { id: 'p1', name: 'Cozy Example', steps: 16, notes: [] };
    const melody = [
      { step: 0, pitch: 60 }, { step: 2, pitch: 62 }, { step: 4, pitch: 64 }, { step: 5, pitch: 67 },
      { step: 7, pitch: 69 }, { step: 8, pitch: 72 }, { step: 10, pitch: 69 }, { step: 12, pitch: 67 },
      { step: 13, pitch: 64 }, { step: 14, pitch: 62 }, { step: 15, pitch: 60 }
    ];
    melody.forEach((n, i) => {
      pat.notes.push({ ...n, instrument: i % 3 === 0 ? 'bell' : 'blox', velocity: 1 });
    });
    state.patterns = [pat];
    state.currentPattern = 'p1';
    editor.setSteps(16);
    editor.setNotes(pat.notes);
    renderPatterns();
    meta.textContent = 'Example loaded';
    editor.setActiveStep(-1);
  };

  $('btn-add-pattern').onclick = () => {
    const id = 'p' + (state.patterns.length + 1);
    const pat = { id, name: 'Pattern ' + (state.patterns.length + 1), steps: 16, notes: [] };
    state.patterns.push(pat);
    state.currentPattern = id;
    editor.setSteps(16);
    editor.setNotes([]);
    renderPatterns();
    meta.textContent = 'Pattern added';
  };

  /* ---------- export: co-routines only, compressed ---------- */
  const midiFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  const envOf = (inst) => ({
    blox:  { a: 0.008, d: 0.06,  s: 0.35, r: 0.12 },
    bell:  { a: 0.01,  d: 0.14,  s: 0.05, r: 0.30 },
    reed:  { a: 0.02,  d: 0.10,  s: 0.25, r: 0.18 },
    hollow:{ a: 0.04,  d: 0.16,  s: 0.20, r: 0.22 }
  })[inst] || { a: 0.008, d: 0.06, s: 0.35, r: 0.12 };

  const flattenEvents = () => {
    const events = [];
    let offset = 0;
    const quarter = 60 / state.bpm;
    const stepSec = quarter / 4;
    const swingSec = (state.swing / 100) * stepSec;
    state.patterns.forEach((pat) => {
      const patternSec = pat.steps * stepSec;
      (pat.notes || []).forEach((n) => {
        const sway = (n.step % 2 === 1) ? swingSec : 0;
        events.push({
          time: offset + n.step * stepSec + sway,
          pitch: n.pitch,
          instrument: n.instrument || 'blox',
          velocity: n.velocity == null ? 1 : n.velocity,
          dur: stepSec * 0.82
        });
      });
      offset += patternSec;
    });
    events.sort((a, b) => a.time - b.time || a.pitch - b.pitch);
    return { events, total: offset };
  };

  const typeOf = (inst) => ({ blox: 'square', bell: 'sine', reed: 'sawtooth', hollow: 'triangle' })[inst] || 'square';

  /* Bloxd World Code: no async, await, Promise, setTimeout, or window.
     Timing is the tick callback (~20 Hz). Notes are api.playSound. */
  const BLOXD_SOUNDS = ['harp_pling', 'sonarBeep', 'trumpetNote1', 'bass'];
  const BLOXD_INST = { blox: 0, bell: 1, reed: 2, hollow: 3 };

  const midiRate = (midi) => {
    let r = Math.pow(2, (midi - 60) / 12);
    if (r < 0.5) r = 0.5;
    if (r > 4) r = 4;
    return r;
  };

  const generateBloxdCode = () => {
    const { events, total } = flattenEvents();
    const rows = events.map((ev) => {
      const t = Math.round(ev.time * 1000);
      const s = BLOXD_INST[ev.instrument] != null ? BLOXD_INST[ev.instrument] : 0;
      const vol = Math.max(0.15, Math.min(1, ev.velocity == null ? 1 : ev.velocity));
      const rate = midiRate(ev.pitch);
      return '[' + t + ',' + s + ',' + vol.toFixed(2) + ',' + +rate.toFixed(4) + ']';
    });
    const dur = Math.max(0, Math.round(total * 1000));
    const loop = state.loop ? 1 : 0;
    return [
      'bmS=["harp_pling","sonarBeep","trumpetNote1","bass"];',
      'bmSong=[' + rows.join(',') + '];',
      'bmDur=' + dur + ';',
      'bmLoop=' + loop + ';',
      'bmOn={};',
      'bmT={};',
      'bmN={};',
      'function playerCommand(playerId,command){',
      'if(command==="run"||command.indexOf("run ")===0){',
      'bmOn[playerId]=1;',
      'bmT[playerId]=0;',
      'bmN[playerId]=0;',
      'api.sendMessage(playerId,"Playing",{color:"orange"});',
      'return true;',
      '}',
      'if(command==="stop"){',
      'bmOn[playerId]=0;',
      'api.sendMessage(playerId,"Stopped",{color:"orange"});',
      'return true;',
      '}',
      '}',
      'function tick(dt){',
      'var ids=api.getPlayerIds();',
      'var p,id,t,i,n,len;',
      'len=bmSong.length;',
      'if(!len)return;',
      'for(p=0;p<ids.length;p++){',
      'id=ids[p];',
      'if(!bmOn[id])continue;',
      't=bmT[id]+dt;',
      'i=bmN[id];',
      'while(i<len&&bmSong[i][0]<=t){',
      'n=bmSong[i];',
      'api.playSound(id,bmS[n[1]],n[2],n[3],{playerIdOrPos:id});',
      'i++;',
      '}',
      'if(bmLoop&&bmDur){',
      'while(t>=bmDur){',
      't=t-bmDur;',
      'i=0;',
      'while(i<len&&bmSong[i][0]<=t){',
      'n=bmSong[i];',
      'api.playSound(id,bmS[n[1]],n[2],n[3],{playerIdOrPos:id});',
      'i++;',
      '}',
      '}',
      '}else if(t>=bmDur){',
      'bmOn[id]=0;',
      't=0;',
      'i=0;',
      '}',
      'bmT[id]=t;',
      'bmN[id]=i;',
      '}',
      '}'
    ].join('\n');
  };

  const generateBrowserCode = () => {
    const { events, total } = flattenEvents();
    const lines = [];
    lines.push('(async function(){');
    lines.push('  if(window.__bloxdMusicStop)window.__bloxdMusicStop();');
    lines.push('  const C=window.AudioContext||window.webkitAudioContext;');
    lines.push('  const ctx=new C();');
    lines.push('  let loop=true;');
    lines.push('  window.__bloxdMusicStop=function(){loop=false;try{ctx.close()}catch(e){}};');
    lines.push('  const m=ctx.createGain();m.connect(ctx.destination);m.gain.value=0.7;');
    lines.push('  const sleep=ms=>new Promise(r=>setTimeout(r,ms));');
    lines.push('  const play=(midi,dur,inst,vel)=>{');
    lines.push('    const t=ctx.currentTime;');
    lines.push('    const f=440*Math.pow(2,(midi-69)/12);');
    lines.push('    const osc=ctx.createOscillator();const g=ctx.createGain();');
    lines.push('    const T={blox:"square",bell:"sine",reed:"sawtooth",hollow:"triangle"}[inst]||"square";');
    lines.push('    osc.type=T;osc.frequency.setValueAtTime(f,t);osc.detune.setValueAtTime(2,t);');
    lines.push('    const E={blox:{a:0.008,d:0.06,s:0.35,r:0.12},bell:{a:0.01,d:0.14,s:0.05,r:0.3},reed:{a:0.02,d:0.10,s:0.25,r:0.18},hollow:{a:0.04,d:0.16,s:0.2,r:0.22}}[inst]||{a:0.008,d:0.06,s:0.35,r:0.12};');
    lines.push('    const p=0.18*vel;');
    lines.push('    g.gain.setValueAtTime(0,t);');
    lines.push('    g.gain.linearRampToValueAtTime(p,t+E.a);');
    lines.push('    g.gain.linearRampToValueAtTime(p*E.s,t+E.a+E.d);');
    lines.push('    g.gain.linearRampToValueAtTime(0,t+dur+E.r);');
    lines.push('    osc.connect(g);g.connect(m);osc.start(t);osc.stop(t+dur+E.r+0.02);');
    lines.push('  };');
    lines.push('  const song=async ()=>{');
    let prev = 0;
    events.forEach((ev) => {
      const dMs = Math.round((ev.time - prev) * 1000);
      if (dMs > 0) lines.push(`    await sleep(${dMs});`);
      lines.push(`    play(${ev.pitch},${ev.dur.toFixed(4)},'${ev.instrument}',${ev.velocity.toFixed(2)});`);
      prev = ev.time;
    });
    const tail = Math.round((total - prev) * 1000);
    if (tail > 0) lines.push(`    await sleep(${tail});`);
    lines.push('    if(loop)song();');
    lines.push('  };');
    lines.push('  song();');
    lines.push('})();');
    return lines.join('\n');
  };

  const minify = (code) => {
    return code
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}(),;:<>+\-*/=%&|!])\s*/g, '$1')
      .replace(/;\s*/g, ';')
      .trim();
  };

  const isBloxdWorldCode = (s) => /api\.playSound|playerCommand|bmSong/.test(s);

  const renderExport = () => {
    const code = generateBloxdCode();
    $('export-code').textContent = code;
    $('export-code').dataset.raw = code;
    const note = $('export-note');
    if (note) {
      const n = code.length;
      const limit = 16000;
      let msg = 'Sounds: Blox → harp_pling · Bell → sonarBeep · Reed → trumpetNote1 · Hollow → bass';
      msg += ' · ' + n + ' / ' + limit + ' chars';
      if (n > limit) msg = 'Too long for World Code (' + n + ' chars, max ' + limit + '). Remove notes.';
      note.textContent = msg;
    }
  };

  /* ---------- /run : execute exported song snippets ---------- */
  const runCtxs = [];
  const decodeEntities = (s) => String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  const stopRun = () => {
    if (typeof window.__bloxdMusicStop === 'function') {
      try { window.__bloxdMusicStop(); } catch (e) {}
      window.__bloxdMusicStop = null;
    }
    while (runCtxs.length) {
      const ctx = runCtxs.pop();
      try { ctx.close(); } catch (e) {}
    }
  };

  const stopEverything = () => {
    stopRun();
    exportPlaying = false;
    Player.stop();
    updatePlayBtn(false);
    editor.setActiveStep(-1);
    cancelAnimationFrame(animId);
  };

  const execSong = (src) => {
    const OrigAC = window.AudioContext;
    const OrigWAC = window.webkitAudioContext;
    const wrap = function () {
      const Base = OrigAC || OrigWAC;
      const ctx = new Base();
      runCtxs.push(ctx);
      return ctx;
    };
    window.AudioContext = wrap;
    window.webkitAudioContext = wrap;
    try {
      (0, eval)(src);
    } finally {
      window.AudioContext = OrigAC;
      window.webkitAudioContext = OrigWAC;
    }
  };

  const extractCode = (raw) => {
    let s = decodeEntities(raw).trim();
    s = s.replace(/^\/+run\s+/i, '').replace(/^run\s+/i, '');
    return s.trim();
  };

  const runExported = (raw) => {
    const code = extractCode(raw);
    if (!code) {
      if (!Player.isPlaying() && !exportPlaying) $('btn-play').click();
      return;
    }
    if (isBloxdWorldCode(code)) {
      meta.textContent = 'Paste into World Code (F8), then type /run in Bloxd chat';
      return;
    }
    stopEverything();
    execSong(code);
    exportPlaying = true;
    updatePlayBtn(true);
    meta.textContent = 'Running preview';
  };

  const handleCommand = (raw) => {
    let line = decodeEntities(raw).trim();
    if (!line) return;
    if (line.startsWith('(async') || line.startsWith('(function')) {
      runExported(line);
      return;
    }
    if (!line.startsWith('/')) line = '/' + line;
    const space = line.search(/\s/);
    const cmd = (space === -1 ? line : line.slice(0, space)).toLowerCase();
    const arg = space === -1 ? '' : line.slice(space + 1).trim();
    if (cmd === '/run') {
      runExported(arg);
      return;
    }
    if (cmd === '/stop') {
      stopEverything();
      meta.textContent = 'Stopped';
      return;
    }
    if (cmd === '/help') {
      meta.textContent = 'Here: /run previews. In Bloxd: paste Export into F8, then /run';
      return;
    }
    meta.textContent = 'Unknown command — try /run or /stop';
  };

  $('cmd-form').onsubmit = (e) => {
    e.preventDefault();
    const input = $('cmd');
    try {
      handleCommand(input.value);
    } catch (err) {
      console.error(err);
      meta.textContent = 'Run failed — check the snippet';
      updatePlayBtn(false);
    }
  };

  const openModal = () => { renderExport(); $('export-modal').showModal(); };
  $('btn-export').onclick = openModal;
  $('btn-close-modal').onclick = () => $('export-modal').close();

  $('btn-copy').onclick = () => {
    const code = $('export-code').textContent;
    navigator.clipboard.writeText(code).then(() => {
      const old = $('btn-copy').textContent;
      $('btn-copy').textContent = 'Copied!';
      setTimeout(() => { $('btn-copy').textContent = old; }, 1200);
    });
  };
  $('btn-run-export').onclick = () => {
    $('export-modal').close();
    if (!Player.isPlaying() && !exportPlaying) $('btn-play').click();
  };
  $('btn-download').onclick = () => {
    const code = $('export-code').dataset.raw || $('export-code').textContent;
    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bloxd-world-code.js';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* close modal on backdrop click */
  $('export-modal').onclick = (e) => { if (e.target === $('export-modal')) $('export-modal').close(); };

  /* ---------- init ---------- */
  renderInstruments();
  renderPatterns();
  editor.setSteps(state.patterns[0].steps);
  editor.setNotes(state.patterns[0].notes);
  window.addEventListener('resize', () => editor.resize());
  editor.resize();
  meta.textContent = 'Ready — Export → F8 World Code → /run in chat';

  const typingInField = (el) => {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  };

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !typingInField(e.target) && e.target === document.body) {
      e.preventDefault();
      $('btn-play').click();
      return;
    }
    if (e.key === '/' && !typingInField(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      const input = $('cmd');
      input.focus();
      if (!input.value) input.value = '';
      return;
    }
    if (e.key === 'Escape') {
      if (document.activeElement === $('cmd')) $('cmd').blur();
    }
  });
})();
