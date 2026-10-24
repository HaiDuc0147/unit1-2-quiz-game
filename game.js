(() => {
  'use strict';

  const QUIZ = window.QUIZ;
  const QMAP = Object.fromEntries(QUIZ.questions.map(q => [q.id, q]));
  const $ = (s, el = document) => el.querySelector(s);

  const AVATARS = ['🦊', '🐼', '🐯', '🐸', '🦄', '🐙', '🐧', '🦁'];
  const SIZES = [4, 8, 12, 16, 24, 36, 48];
  const SP_LEVELS = [
    { k: 'off', label: 'None', ratio: 0 },
    { k: 'some', label: 'Some ✨', ratio: 0.2 },
    { k: 'lots', label: 'Lots 🎉', ratio: 0.35 },
  ];
  const PT_MODES = [
    { k: 'mystery', label: '🎲 Mystery (5–25)' },
    { k: 'level', label: '📈 By difficulty' },
  ];
  const TIMERS = [0, 20, 30, 60];
  const LEVEL_PTS = { 1: 10, 2: 15, 3: 20 };
  const MYSTERY_PTS = [5, 10, 15, 20, 25];
  const CARD_COLORS = [
    ['#7b5cff', '#a46bff'], ['#2f7bff', '#4cc4ff'], ['#ff4f9a', '#ff8ac0'],
    ['#5a46e8', '#3fb4ff'], ['#c04dff', '#ff6fb5'], ['#2a9df4', '#6a5cff'],
  ];
  const STORE = 'quizquest:' + (QUIZ.id || 'default');

  // Surprise cards. apply() changes the game and returns score changes [[team, delta], ...] for the floating numbers.
  const SPECIALS = {
    star: {
      emoji: '⭐', title: 'Lucky Star!', s: ['#ffb000', '#ff7a2f'], weight: 3, amount: true, good: true,
      text: (t, o, n) => `<b>${t}</b> gets <b>+${n}</b> points!`,
      apply: (g, a, b, n) => { g.scores[a] += n; return [[a, n]]; },
    },
    bomb: {
      emoji: '💣', title: 'Boom!', s: ['#4b4e6d', '#22223b'], weight: 2, amount: true, shake: true,
      text: (t, o, n) => `Oh no! <b>${t}</b> loses <b>${n}</b> points.`,
      apply: (g, a, b, n) => { const d = Math.min(n, g.scores[a]); g.scores[a] -= d; return [[a, -d]]; },
    },
    gift: {
      emoji: '🎁', title: 'Be Kind!', s: ['#ff5fa2', '#c04dff'], weight: 2, amount: true,
      text: (t, o, n) => `<b>${t}</b> gives <b>+${n}</b> points to <b>${o}</b>.`,
      apply: (g, a, b, n) => { g.scores[b] += n; return [[b, n]]; },
    },
    magnet: {
      emoji: '🧲', title: 'Magnet!', s: ['#ff4d6d', '#7b2cbf'], weight: 2, amount: true, good: true,
      text: (t, o, n) => `<b>${t}</b> pulls <b>${n}</b> points away from <b>${o}</b>!`,
      apply: (g, a, b, n) => { const d = Math.min(n, g.scores[b]); g.scores[b] -= d; g.scores[a] += d; return [[a, d], [b, -d]]; },
    },
    swap: {
      emoji: '🔄', title: 'Switcheroo!', s: ['#00b4d8', '#3a0ca3'], weight: 1,
      text: () => `Both teams <b>swap</b> their scores!`,
      apply: (g) => { const [x, y] = g.scores; g.scores = [y, x]; return [[0, y - x], [1, x - y]]; },
    },
    rocket: {
      emoji: '🚀', title: 'Rocket Boost!', s: ['#3a6dff', '#00c2a8'], weight: 2, good: true,
      text: (t) => `<b>${t}</b>'s next correct answer is worth <b>DOUBLE</b> points!`,
      apply: (g, a) => { g.double[a] = true; return []; },
    },
    again: {
      emoji: '🎈', title: 'Free Turn!', s: ['#20c997', '#2f7bff'], weight: 2, keepTurn: true, good: true,
      text: (t) => `<b>${t}</b> picks another card right now!`,
      apply: () => [],
    },
  };

  // ---------- Helpers ----------
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const load = key => { try { return JSON.parse(localStorage.getItem(STORE + ':' + key)); } catch (e) { return null; } };
  const store = (key, val) => { try { val == null ? localStorage.removeItem(STORE + ':' + key) : localStorage.setItem(STORE + ':' + key, JSON.stringify(val)); } catch (e) { /* storage blocked */ } };

  // ---------- Settings ----------
  const settings = Object.assign({
    teams: [{ name: 'Team 1', avatar: '🦊' }, { name: 'Team 2', avatar: '🐼' }],
    size: 16, specials: 'some', points: 'mystery', timer: 0, sound: true,
  }, load('settings') || {});

  let G = null;          // current game
  let current = null;    // { index, revealed }
  let timerId = null;

  const sfx = window.createSounds(() => settings.sound);

  // ---------- Confetti ----------
  const confetti = (() => {
    const cv = $('#confetti'), cx = cv.getContext('2d');
    const colors = ['#ff4d8d', '#ffc23d', '#2fd598', '#4f9bff', '#a46bff', '#ff8a3d'];
    let parts = [], raf = null;
    function size() {
      const d = window.devicePixelRatio || 1;
      cv.width = innerWidth * d; cv.height = innerHeight * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
    }
    function loop() {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      parts.forEach(p => {
        p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c;
        if (p.round) { cx.beginPath(); cx.arc(0, 0, p.s / 2, 0, 7); cx.fill(); } else cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        cx.restore();
      });
      parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
      raf = parts.length ? requestAnimationFrame(loop) : (cx.clearRect(0, 0, innerWidth, innerHeight), null);
    }
    function burst(n = 120, x = innerWidth / 2, y = innerHeight / 3, spread = 16) {
      for (let i = 0; i < n; i++) {
        parts.push({
          x, y, vx: (Math.random() - 0.5) * spread, vy: -Math.random() * 13 - 4,
          s: 7 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
          c: pick(colors), round: Math.random() < 0.4, life: 140 + Math.random() * 80,
        });
      }
      if (!raf) raf = requestAnimationFrame(loop);
    }
    size();
    addEventListener('resize', size);
    return { burst, rain: () => { for (let i = 0; i < 6; i++) setTimeout(() => burst(70, Math.random() * innerWidth, -20, 8), i * 280); } };
  })();

  // ---------- Board building ----------
  function plan(size, specials) {
    const ratio = SP_LEVELS.find(x => x.k === specials).ratio;
    let nSp = ratio ? Math.max(1, Math.round(size * ratio)) : 0;
    const nQ = Math.min(size - nSp, QUIZ.questions.length);
    nSp = size - nQ;
    return { nQ, nSp };
  }

  function specialBag(n) {
    const pool = [];
    Object.entries(SPECIALS).forEach(([k, s]) => { for (let i = 0; i < s.weight; i++) pool.push(k); });
    const bag = [];
    while (bag.length < n) bag.push(...shuffle(pool.slice()));
    return bag.slice(0, n);
  }

  function newGame() {
    const { nQ, nSp } = plan(settings.size, settings.specials);
    const qs = shuffle(QUIZ.questions.slice()).slice(0, nQ);
    const cards = qs.map(q => ({
      kind: 'q', qid: q.id,
      points: settings.points === 'level' ? LEVEL_PTS[q.level || 1] : pick(MYSTERY_PTS),
    }));
    specialBag(nSp).forEach(k => cards.push({ kind: 'sp', sp: k, amount: SPECIALS[k].amount ? pick(MYSTERY_PTS) : 0 }));
    shuffle(cards).forEach(c => { c.opened = false; c.result = null; });
    G = {
      teams: settings.teams.map(t => ({ ...t })), timer: settings.timer,
      cards, scores: [0, 0], double: [false, false], turn: Math.random() < 0.5 ? 0 : 1, over: false,
    };
    save();
  }

  const save = () => store('game', G);

  // ---------- Setup screen ----------
  function chips(el, items, getSel, onPick) {
    el.innerHTML = '';
    items.forEach(it => {
      const b = document.createElement('button');
      b.className = 'chip' + (getSel() === it.value ? ' sel' : '');
      b.textContent = it.label;
      b.addEventListener('click', () => { onPick(it.value); sfx.click(); renderSetup(); });
      el.appendChild(b);
    });
  }

  function renderSetup() {
    $('#quizSubtitle').textContent = `${QUIZ.title} · ${QUIZ.subtitle} · ${QUIZ.questions.length} questions`;
    [0, 1].forEach(t => {
      const inp = $('#name' + t);
      if (document.activeElement !== inp) inp.value = settings.teams[t].name;
      const box = $(`.avatars[data-team="${t}"]`);
      box.innerHTML = '';
      AVATARS.forEach(a => {
        const b = document.createElement('button');
        b.textContent = a;
        if (settings.teams[t].avatar === a) b.className = 'sel';
        b.addEventListener('click', () => { settings.teams[t].avatar = a; sfx.click(); renderSetup(); });
        box.appendChild(b);
      });
    });
    chips($('#sizeChips'), SIZES.map(n => ({ value: n, label: n })), () => settings.size, v => settings.size = v);
    chips($('#spChips'), SP_LEVELS.map(s => ({ value: s.k, label: s.label })), () => settings.specials, v => settings.specials = v);
    chips($('#ptChips'), PT_MODES.map(p => ({ value: p.k, label: p.label })), () => settings.points, v => settings.points = v);
    chips($('#timerChips'), TIMERS.map(s => ({ value: s, label: s ? s + 's' : 'Off' })), () => settings.timer, v => settings.timer = v);

    const { nQ, nSp } = plan(settings.size, settings.specials);
    let msg = `${settings.size} cards → ${nQ} question${nQ === 1 ? '' : 's'}` + (nSp ? ` + ${nSp} surprise card${nSp === 1 ? '' : 's'}` : '');
    if (settings.size - Math.round(settings.size * SP_LEVELS.find(x => x.k === settings.specials).ratio) > QUIZ.questions.length) {
      msg += ` (only ${QUIZ.questions.length} questions, so the rest are surprises)`;
    }
    $('#summary').textContent = msg;

    const saved = load('game');
    const left = saved && !saved.over ? saved.cards.filter(c => !c.opened).length : 0;
    $('#resumeBtn').classList.toggle('hidden', !left);
    if (left) $('#resumeBtn').textContent = `↩ Resume last game (${left} cards left)`;
    store('settings', settings);
  }

  [0, 1].forEach(t => $('#name' + t).addEventListener('input', e => {
    settings.teams[t].name = e.target.value.trim() || `Team ${t + 1}`;
    store('settings', settings);
  }));

  $('#startBtn').addEventListener('click', () => { newGame(); startGame(); });
  $('#resumeBtn').addEventListener('click', () => { G = load('game'); startGame(); });

  // ---------- Game screen ----------
  function show(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  }

  function startGame() {
    show('game');
    sfx.flip();
    renderTeams();
    renderBoard();
    QUIZ.questions.forEach(q => { if (q.img) new Image().src = q.img; });
  }

  function renderTeams(deltas = []) {
    [0, 1].forEach(t => {
      const p = $(`.team-panel[data-team="${t}"]`);
      const team = G.teams[t];
      p.classList.toggle('active', G.turn === t);
      p.innerHTML = `
        <div class="avatar">${team.avatar}</div>
        <div class="tinfo"><div class="tname">${esc(team.name)}</div><div class="tscore">${G.scores[t]}</div></div>
        <div class="adj"><button data-d="5" title="Add 5 points">+5</button><button data-d="-5" title="Take away 5 points">−5</button></div>
        ${G.double[t] ? '<div class="rocket">🚀 ×2 next</div>' : ''}`;
      deltas.filter(d => d[0] === t && d[1]).forEach(([, d]) => {
        const f = document.createElement('div');
        f.className = 'float ' + (d > 0 ? 'plus' : 'minus');
        f.textContent = (d > 0 ? '+' : '−') + Math.abs(d);
        p.appendChild(f);
        setTimeout(() => f.remove(), 1500);
      });
    });
    const t = G.teams[G.turn];
    $('#turnLabel').innerHTML = `Your turn: ${t.avatar} <b>${esc(t.name)}</b>`;
  }

  // Clicking a team panel gives them the turn; the +5 / −5 buttons fix scores by hand.
  document.querySelectorAll('.team-panel').forEach(p => p.addEventListener('click', e => {
    const t = +p.dataset.team;
    const adj = e.target.closest('[data-d]');
    if (adj) {
      const d = +adj.dataset.d;
      const real = d < 0 ? -Math.min(-d, G.scores[t]) : d;
      G.scores[t] += real;
      sfx.click();
      renderTeams([[t, real]]);
    } else if (G.turn !== t) {
      G.turn = t;
      sfx.click();
      renderTeams();
    }
    save();
  }));

  function backHTML(c) {
    const r = c.result;
    if (!r) return '';
    if (c.kind === 'sp') return `<span class="big">${SPECIALS[c.sp].emoji}</span>`;
    return r.correct
      ? `<span class="big">${G.teams[r.team].avatar}</span><span class="small">+${r.pts}</span>`
      : `<span class="big">✗</span>`;
  }

  function renderBoard() {
    const board = $('#board');
    board.innerHTML = '';
    G.cards.forEach((c, i) => {
      const el = document.createElement('button');
      const [c1, c2] = CARD_COLORS[i % CARD_COLORS.length];
      el.className = 'card' + (c.opened ? ' opened' : '');
      el.style.cssText = `--c1:${c1};--c2:${c2};--i:${i}`;
      el.setAttribute('aria-label', 'Card ' + (i + 1));
      el.innerHTML = `<div class="inner"><div class="face front"><span class="num">${i + 1}</span></div>
        <div class="face back ${c.result ? 't' + c.result.team : ''}">${backHTML(c)}</div></div>`;
      el.addEventListener('click', () => openCard(i));
      board.appendChild(el);
    });
    layoutBoard();
  }

  // Pick the column count that gives the biggest tiles (about 3:2) for the space available.
  function layoutBoard() {
    const board = $('#board');
    if (!G || !board.children.length) return;
    const n = G.cards.length;
    const cs = getComputedStyle(board);
    const W = board.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const H = board.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const gap = n > 24 ? 10 : 16;
    const ratio = 1.5;
    let best = null;
    for (let c = 1; c <= n; c++) {
      const r = Math.ceil(n / c);
      const h = Math.min((H - gap * (r - 1)) / r, (W - gap * (c - 1)) / c / ratio);
      if (!best || h > best.h) best = { c, r, h };
    }
    const h = Math.max(36, Math.floor(best.h));
    board.style.gap = gap + 'px';
    board.style.gridTemplateColumns = `repeat(${best.c}, ${Math.floor(h * ratio)}px)`;
    board.style.gridAutoRows = h + 'px';
    board.style.setProperty('--tile-h', h + 'px');
  }
  addEventListener('resize', layoutBoard);

  function flipCard(i) {
    const el = $('#board').children[i];
    const c = G.cards[i];
    const back = el.querySelector('.back');
    back.className = 'face back ' + (c.result ? 't' + c.result.team : '');
    back.innerHTML = backHTML(c);
    el.classList.add('opened');
  }

  // ---------- Opening cards ----------
  function openCard(i) {
    if (G.over || G.cards[i].opened || current) return;
    current = { index: i, revealed: false, played: null };
    if (G.cards[i].kind === 'sp') { sfx.mystery(); showSpecial(i); }
    else { sfx.flip(); showQuestion(i); }
  }

  function openModal(html, cls) {
    const card = $('#modalCard');
    card.className = 'modal-card ' + cls;
    card.innerHTML = html;
    card.style.cssText = '';
    $('#modal').classList.remove('hidden');
    card.scrollTop = 0;
    return card;
  }

  function closeModal() {
    stopTimer();
    $('#modal').classList.add('hidden');
    current = null;
  }

  function showQuestion(i) {
    const c = G.cards[i], q = QMAP[c.qid], t = G.turn, team = G.teams[t];
    const dbl = G.double[t];
    const pts = c.points * (dbl ? 2 : 1);
    const opts = q.options
      ? `<div class="opts">${q.options.map((o, k) => `<button class="opt o${k}${k === q.answer ? ' correct' : ''}" data-k="${k}"><span class="letter">${'ABCD'[k]}</span>${esc(o)}</button>`).join('')}</div>`
      : `<div class="m-write"><span class="ph">✍️ Write the full answer!</span><span class="ans">${esc(q.answer)}</span>${q.alt ? `<small>also correct: ${esc(q.alt)}</small>` : ''}</div>`;
    const card = openModal(`
      <div class="m-head">
        <span class="pill m-num">Card ${i + 1}</span>
        <span class="pill m-topic">${esc(q.topic)}</span>
        <span class="pill m-pts">⭐ ${c.points} points${dbl ? ' <b>×2 🚀</b>' : ''}</span>
        <button class="m-close" title="Close (card stays hidden)">✕</button>
      </div>
      <div class="m-turn">${team.avatar} <b>${esc(team.name)}</b> is answering</div>
      ${G.timer ? '<div class="timer"><div class="timer-fill"></div></div><div class="timer-text"></div>' : ''}
      <div class="m-body${q.img ? ' has-img' : ''}">
        ${q.img ? `<div class="m-img"><img src="${esc(q.img)}" alt=""></div>` : ''}
        <div class="m-main">
          <div class="m-q">${esc(q.q)}</div>
          ${q.cue ? `<div class="m-cue">💡 ${esc(q.cue)}</div>` : ''}
          ${opts}
        </div>
      </div>
      <div class="m-actions pre">
        <button class="btn reveal">👀 Show answer</button>
        <button class="btn wrong">✗ Not this time</button>
        <button class="btn right">✓ Correct! +${pts}</button>
      </div>
      <div class="m-actions post">
        <div class="result"></div>
        <button class="btn next">Next ▶</button>
      </div>
      <div class="keys"><kbd>1</kbd>–<kbd>4</kbd> team's answer · <kbd>C</kbd> correct · <kbd>X</kbd> not this time · <kbd>Space</kbd> show answer / next · <kbd>Esc</kbd> close</div>`, 'q t' + t);

    const img = card.querySelector('.m-img img');
    if (img) img.addEventListener('error', () => { img.closest('.m-img').remove(); card.querySelector('.m-body').classList.remove('has-img'); });
    card.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => pickOption(+b.dataset.k)));
    card.querySelector('.m-close').addEventListener('click', closeQuestion);
    card.querySelector('.reveal').addEventListener('click', () => finish(null));
    card.querySelector('.right').addEventListener('click', () => finish(true));
    card.querySelector('.wrong').addEventListener('click', () => finish(false));
    card.querySelector('.next').addEventListener('click', nextCard);
    if (G.timer) startTimer(G.timer);
  }

  // Tapping the option the team chose scores it straight away.
  function pickOption(k) {
    if (!current || current.revealed) return;
    const opt = $('#modalCard').querySelector(`.opt[data-k="${k}"]`);
    if (!opt) return;
    opt.classList.add('picked');
    finish(opt.classList.contains('correct'));
  }

  // Ends a question and shows the answer. result: true = correct, false = not this time, null = answer shown, no points.
  function finish(result) {
    if (!current || current.revealed || G.cards[current.index].kind !== 'q') return;
    current.revealed = true;
    stopTimer();
    const i = current.index, c = G.cards[i], t = G.turn, team = G.teams[t];
    const card = $('#modalCard');
    card.classList.add('revealed');
    let gained = 0, msg;
    if (result) {
      gained = c.points * (G.double[t] ? 2 : 1);
      G.double[t] = false;
      G.scores[t] += gained;
      sfx.correct();
      setTimeout(sfx.coins, 550);
      const r = (card.querySelector('.opt.picked') || card.querySelector('.result')).getBoundingClientRect();
      confetti.burst(80, r.left + r.width / 2, r.top + r.height / 2, 12);
      msg = `🎉 +${gained} points for ${team.avatar} ${esc(team.name)}!`;
    } else if (result === false) {
      sfx.wrong();
      msg = '😅 No points this time';
    } else {
      sfx.reveal();
      msg = "👀 Here's the answer!";
    }
    const box = card.querySelector('.result');
    box.innerHTML = msg;
    box.className = 'result' + (result ? ' ok' : result === false ? ' no' : '');
    c.opened = true;
    c.result = { team: t, correct: !!result, pts: gained };
    G.turn = 1 - t;
    renderTeams(gained ? [[t, gained]] : []);
    save();
  }

  function nextCard() {
    if (!current || !current.revealed) return;
    const i = current.index;
    closeModal();
    sfx.click();
    flipCard(i);
    checkEnd();
  }

  // Closing before the answer is shown leaves the card hidden; after that it works like Next.
  function closeQuestion() {
    if (current && current.revealed) return nextCard();
    sfx.click();
    closeModal();
  }

  function showSpecial(i) {
    const c = G.cards[i], sp = SPECIALS[c.sp], a = G.turn, b = 1 - a;
    const ta = `${G.teams[a].avatar} ${esc(G.teams[a].name)}`, tb = `${G.teams[b].avatar} ${esc(G.teams[b].name)}`;
    const card = openModal(`
      <div class="sp-label">Surprise card ${i + 1}</div>
      <div class="sp-emoji">${sp.emoji}</div>
      <div class="sp-title">${sp.title}</div>
      <div class="sp-text">${sp.text(ta, tb, c.amount)}</div>
      <button class="btn big light sp-ok">Okay! ✨</button>`, 'special' + (sp.shake ? ' shake' : ''));
    card.style.setProperty('--s1', sp.s[0]);
    card.style.setProperty('--s2', sp.s[1]);
    setTimeout(() => {
      if (current && current.index === i) sfx[c.sp]();
      if (!sp.shake) confetti.burst(90);
    }, 450);
    card.querySelector('.sp-ok').addEventListener('click', applySpecial);
  }

  function applySpecial() {
    if (!current) return;
    const i = current.index, c = G.cards[i], sp = SPECIALS[c.sp], a = G.turn;
    const deltas = sp.apply(G, a, 1 - a, c.amount);
    c.opened = true;
    c.result = { team: a, sp: c.sp };
    closeModal();
    flipCard(i);
    if (!sp.keepTurn) G.turn = 1 - a;
    deltas.some(d => d[1] > 0) ? sfx.coins() : sfx.click();
    renderTeams(deltas);
    save();
    checkEnd();
  }

  // ---------- Timer ----------
  function startTimer(total) {
    let left = total;
    const card = $('#modalCard');
    const fill = card.querySelector('.timer-fill'), text = card.querySelector('.timer-text');
    const draw = () => {
      fill.style.transform = `scaleX(${left / total})`;
      card.querySelector('.timer').classList.toggle('low', left <= 5);
      text.textContent = left > 0 ? `⏱ ${left}s` : "⏰ Time's up!";
      text.classList.toggle('up', left <= 0);
    };
    draw();
    timerId = setInterval(() => {
      left--;
      draw();
      if (left > 0 && left <= 5) sfx.tick();
      if (left <= 0) { stopTimer(); sfx.timeUp(); }
    }, 1000);
  }
  function stopTimer() { clearInterval(timerId); timerId = null; }

  // ---------- End of game ----------
  function checkEnd() {
    if (G.cards.every(c => c.opened)) setTimeout(showWinner, 900);
  }

  function showWinner() {
    closeModal();
    G.over = true;
    save();
    const [s0, s1] = G.scores;
    const w = s0 === s1 ? -1 : s0 > s1 ? 0 : 1;
    const title = w < 0 ? "It's a tie! 🤝" : `<small>🎉 The winner is…</small>${G.teams[w].avatar} ${esc(G.teams[w].name)}!`;
    const card = openModal(`
      <div class="trophy">${w < 0 ? '🤝' : '🏆'}</div>
      <div class="win-title ${w < 0 ? '' : 't' + w}">${title}</div>
      <div class="final">
        ${[0, 1].map(t => `<div class="t${t}">${G.teams[t].avatar} ${esc(G.teams[t].name)}<b>${G.scores[t]}</b></div>`).join('')}
      </div>
      <div class="m-actions">
        <button class="btn ghost w-menu">🏠 Menu</button>
        <button class="btn big primary w-again">Play again 🔁</button>
      </div>`, 'winner');
    current = { index: -1, revealed: true };
    sfx.win();
    confetti.burst(160);
    confetti.rain();
    card.querySelector('.w-again').addEventListener('click', () => { closeModal(); newGame(); startGame(); });
    card.querySelector('.w-menu').addEventListener('click', () => { closeModal(); show('setup'); renderSetup(); });
  }

  // ---------- Toolbar ----------
  function soundIcon() { $('#soundBtn').textContent = settings.sound ? '🔊' : '🔇'; }
  $('#soundBtn').addEventListener('click', () => { settings.sound = !settings.sound; store('settings', settings); soundIcon(); sfx.click(); });
  $('#fsBtn').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  });
  $('#finishBtn').addEventListener('click', () => { if (!current && confirm('Finish the game now and show the winner?')) showWinner(); });
  $('#menuBtn').addEventListener('click', () => {
    if (current) return;
    show('setup');
    renderSetup();
  });

  // ---------- Keyboard (teacher shortcuts) ----------
  addEventListener('keydown', e => {
    if (!current || e.target.tagName === 'INPUT') return;
    const c = current.index >= 0 ? G.cards[current.index] : null;
    if (!c) return;
    const k = e.key.toLowerCase();
    if (c.kind === 'sp') {
      if (k === 'enter' || k === ' ') { e.preventDefault(); applySpecial(); }
      return;
    }
    if (k === ' ' || k === 'enter') {
      e.preventDefault();
      current.revealed ? nextCard() : finish(null);
    }
    else if (k === 'c') finish(true);
    else if (k === 'x' || k === 'w') finish(false);
    else if (k === 'escape') closeQuestion();
    else if ('1234'.includes(k) && k.length === 1) pickOption(+k - 1);
  });

  soundIcon();
  renderSetup();
})();
