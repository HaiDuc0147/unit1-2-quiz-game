/*
  Kid-friendly sound effects, made live with the Web Audio API (no sound files needed).
  Usage: const sfx = createSounds(() => soundIsOn); sfx.correct();
*/
window.createSounds = function (isOn) {
  let ctx = null, master = null, noiseBuf = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(comp).connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  // One note with a soft attack and a smooth fade. Options: type, vol, attack, slide, slideTime, vib [rate, depth], lp.
  function tone(freq, at, dur, o = {}) {
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + (o.slideTime || dur));
    if (o.vib) {
      const lfo = ctx.createOscillator(), depth = ctx.createGain();
      lfo.frequency.value = o.vib[0];
      depth.gain.value = o.vib[1];
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(t); lfo.stop(t + dur + 0.1);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    let out = g;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      g.connect(f);
      out = f;
    }
    out.connect(master);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  // Glockenspiel-like bell: a sine plus two bright overtones that fade quickly.
  function bell(freq, at, vol = 0.16, dur = 0.9) {
    tone(freq, at, dur, { vol });
    tone(freq * 2.76, at, dur * 0.35, { vol: vol * 0.35 });
    tone(freq * 5.4, at, dur * 0.15, { vol: vol * 0.15 });
  }

  // Filtered noise for whooshes, pops, booms and claps.
  function noise(at, dur, o = {}) {
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.from || 1000, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + (o.attack || 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t); src.stop(t + dur + 0.05);
  }

  const N = n => 440 * Math.pow(2, (n - 69) / 12); // MIDI note number -> Hz (72 = C5)
  const play = fn => () => {
    if (!isOn() || !init()) return;
    try { fn(); } catch (e) { /* audio unavailable */ }
  };

  return {
    // Small UI sounds
    click: play(() => tone(880, 0, 0.07, { type: 'triangle', vol: 0.12 })),
    flip: play(() => {
      noise(0, 0.25, { from: 600, to: 3000, vol: 0.1, q: 0.8 });
      tone(520, 0.02, 0.15, { type: 'triangle', vol: 0.12, slide: 1040 });
    }),
    reveal: play(() => [67, 72, 76].forEach((n, i) => bell(N(n), i * 0.06, 0.12, 0.8))),
    coins: play(() => { bell(N(88), 0, 0.12, 0.4); bell(N(93), 0.08, 0.12, 0.6); }),
    tick: play(() => tone(1250, 0, 0.06, { type: 'triangle', vol: 0.08 })),
    timeUp: play(() => { bell(N(76), 0, 0.16, 1); bell(N(72), 0.35, 0.16, 1.2); }),

    // Answers
    correct: play(() => {
      [72, 76, 79, 84].forEach((n, i) => bell(N(n), i * 0.09, 0.18));
      [84, 88, 91].forEach(n => bell(N(n), 0.42, 0.1, 1.2));
    }),
    wrong: play(() => { // friendly cartoon "wah-wah-waaah"
      tone(N(67), 0, 0.28, { type: 'triangle', vol: 0.2, slide: N(66), lp: 1800 });
      tone(N(65), 0.3, 0.28, { type: 'triangle', vol: 0.2, slide: N(64), lp: 1800 });
      tone(N(64), 0.6, 0.75, { type: 'triangle', vol: 0.2, slide: N(60), slideTime: 0.7, vib: [7, 8], lp: 1800 });
    }),

    // Surprise cards
    mystery: play(() => [84, 88, 91, 96, 91, 88, 93, 98].forEach((n, i) => bell(N(n), i * 0.05, 0.06, 0.5))),
    star: play(() => [72, 74, 76, 79, 81, 84, 86, 88, 91, 96].forEach((n, i) => bell(N(n), i * 0.045, 0.1, 0.7))),
    gift: play(() => [79, 76, 72, 84].forEach((n, i) => bell(N(n), i * 0.14, 0.15, 1))),
    magnet: play(() => {
      tone(220, 0, 0.9, { vol: 0.18, slide: 880, vib: [14, 40] });
      tone(440, 0.05, 0.85, { type: 'triangle', vol: 0.06, slide: 1320, vib: [14, 60] });
    }),
    swap: play(() => {
      tone(400, 0, 0.5, { type: 'triangle', vol: 0.14, slide: 1000 });
      tone(1000, 0, 0.5, { type: 'triangle', vol: 0.14, slide: 400 });
      noise(0, 0.5, { from: 500, to: 4000, vol: 0.08 });
      bell(N(84), 0.5, 0.12);
    }),
    rocket: play(() => { // slide whistle up + whoosh + ping
      tone(300, 0, 0.9, { vol: 0.16, slide: 1600, slideTime: 0.85 });
      noise(0, 1, { from: 300, to: 5000, vol: 0.12, attack: 0.3 });
      bell(N(91), 0.9, 0.14);
      bell(N(96), 1, 0.12);
    }),
    again: play(() => { // balloon pop + boing + two happy notes
      noise(0, 0.06, { filter: 'highpass', from: 1500, vol: 0.35 });
      tone(300, 0.08, 0.45, { vol: 0.18, slide: 700, vib: [18, 60] });
      [76, 79].forEach((n, i) => bell(N(n), 0.5 + i * 0.12, 0.14));
    }),
    bomb: play(() => { // falling whistle + soft cartoon boom
      tone(1500, 0, 0.75, { vol: 0.12, slide: 350 });
      noise(0.75, 0.9, { filter: 'lowpass', from: 900, to: 60, vol: 0.5, q: 0.5 });
      tone(110, 0.75, 0.7, { vol: 0.35, slide: 40 });
    }),

    // End of game: fanfare + bells + applause
    win: play(() => {
      [[72, 0], [72, 0.15], [72, 0.3], [76, 0.45], [79, 0.7], [76, 0.95], [79, 1.1]]
        .forEach(([n, t]) => tone(N(n), t, 0.35, { type: 'square', vol: 0.07, lp: 2500 }));
      [84, 88, 91, 96].forEach(n => bell(N(n), 1.3, 0.1, 1.6));
      for (let i = 0; i < 70; i++) noise(1.3 + Math.random() * 2, 0.05, { from: 1500 + Math.random() * 2000, vol: 0.08 + Math.random() * 0.08, q: 1.5 });
    }),
  };
};
