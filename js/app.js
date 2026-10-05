/* TypeBlitz app: practice tests, lessons, results, stats, prank mode. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var store = new TBStats.Store(typeof localStorage !== 'undefined' ? localStorage : null);
  var settings = store.getSettings();

  var currentView = 'practice';

  /* ================= helpers ================= */

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function sampleWords(list, n) {
    var out = [];
    var pool = shuffle(list);
    var p = 0;
    while (out.length < n) {
      if (p >= pool.length) { pool = shuffle(list); p = 0; }
      out.push(pool[p++]);
    }
    return out;
  }

  function modeLabel(key) {
    var m = /^(\w+)-(\d+)$/.exec(key || '');
    if (!m) return key || '–';
    return m[1] === 'time' ? m[2] + 's' : m[2] + ' words';
  }

  function fmtTime(sec) {
    sec = Math.round(sec);
    if (sec < 60) return sec + 's';
    var m = Math.floor(sec / 60);
    if (m < 60) return m + 'm';
    return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* ================= navigation ================= */

  var viewIds = { practice: 'view-practice', lessons: 'view-lessons', lesson: 'view-lesson', results: 'view-results', stats: 'view-stats' };

  function show(name) {
    currentView = name;
    for (var k in viewIds) $(viewIds[k]).classList.toggle('active', k === name);
    var pills = document.querySelectorAll('.nav-pills button');
    for (var i = 0; i < pills.length; i++) {
      pills[i].classList.toggle('active', pills[i].dataset.view === name);
    }
    if (name === 'stats') renderStatsView();
    if (name === 'lessons') renderLessonGrid();
    if (name === 'practice') setTimeout(focusInput, 30);
    window.scrollTo(0, 0);
  }

  document.querySelectorAll('.nav-pills button').forEach(function (b) {
    b.addEventListener('click', function () { TBAudio.ui(); show(b.dataset.view); });
  });
  $('brand-home').addEventListener('click', function () { show('practice'); });

  /* ================= header controls ================= */

  function applyTheme() {
    document.documentElement.dataset.theme = settings.theme;
    $('theme-select').value = settings.theme;
  }
  $('theme-select').addEventListener('change', function (e) {
    settings.theme = e.target.value;
    store.updateSettings({ theme: settings.theme });
    applyTheme(); TBAudio.ui();
  });

  function applySound() {
    $('sound-toggle').textContent = settings.sound ? '🔊' : '🔇';
    $('sound-toggle').classList.toggle('off', !settings.sound);
    TBAudio.setEnabled(settings.sound);
  }
  $('sound-toggle').addEventListener('click', function () {
    settings.sound = !settings.sound;
    store.updateSettings({ sound: settings.sound });
    applySound(); TBAudio.ui();
  });

  function applyPrank() {
    $('prank-toggle').classList.toggle('on', settings.prankMode);
  }
  $('prank-toggle').addEventListener('click', function () {
    settings.prankMode = !settings.prankMode;
    store.updateSettings({ prankMode: settings.prankMode });
    applyPrank(); TBAudio.ui();
  });

  /* ================= practice ================= */

  var wordsEl = $('words'), caretEl = $('caret'), inputEl = $('hidden-input');
  var P = null;

  var TIME_OPTS = [15, 30, 60, 120];
  var WORD_OPTS = [10, 25, 50, 100];

  function renderOptSeg() {
    var seg = $('opt-seg');
    seg.innerHTML = '';
    var opts = settings.mode === 'time' ? TIME_OPTS : WORD_OPTS;
    opts.forEach(function (o) {
      var b = document.createElement('button');
      b.textContent = o;
      var cur = settings.mode === 'time' ? settings.timeOption : settings.wordsOption;
      if (o === cur) b.classList.add('active');
      b.addEventListener('click', function () {
        if (settings.mode === 'time') { settings.timeOption = o; store.updateSettings({ timeOption: o }); }
        else { settings.wordsOption = o; store.updateSettings({ wordsOption: o }); }
        TBAudio.ui(); renderOptSeg(); newTest();
      });
      seg.appendChild(b);
    });
  }

  document.querySelectorAll('#mode-seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      settings.mode = b.dataset.mode;
      store.updateSettings({ mode: settings.mode });
      document.querySelectorAll('#mode-seg button').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
      TBAudio.ui(); renderOptSeg(); newTest();
    });
  });

  $('lang-select').addEventListener('change', function (e) {
    settings.language = e.target.value;
    store.updateSettings({ language: settings.language });
    TBAudio.ui(); newTest();
  });

  function focusInput() {
    if (currentView === 'practice' || currentView === 'lesson') {
      try { inputEl.focus({ preventScroll: true }); } catch (e) { inputEl.focus(); }
    }
  }
  $('typing-card').addEventListener('click', focusInput);
  wordsEl.addEventListener('click', focusInput);

  function newTest() {
    if (P && P.timerId) clearInterval(P.timerId);
    var list = TBWords[settings.language] || TBWords.en;
    var count = settings.mode === 'words' ? settings.wordsOption : 80;
    P = {
      mode: settings.mode,
      opt: settings.mode === 'time' ? settings.timeOption : settings.wordsOption,
      words: sampleWords(list, count),
      typed: [], wi: 0,
      active: false, finished: false, paused: false,
      startTime: 0, elapsedMs: 0, pauseStart: 0,
      totalKeys: 0, correctKeys: 0, correctChars: 0,
      samples: [], lastSampleMs: 0,
      timerId: null, wordEls: []
    };
    inputEl.value = '';
    $('live-wpm').textContent = '0';
    $('live-acc').textContent = '100';
    $('live-time').textContent = settings.mode === 'time' ? settings.timeOption : '0';
    renderAllWords();
    hideFocusOverlay();
    focusInput();
  }

  function renderAllWords() {
    wordsEl.innerHTML = '';
    P.wordEls = [];
    P.words.forEach(function (w) {
      var d = document.createElement('div');
      d.className = 'word';
      for (var i = 0; i < w.length; i++) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.textContent = w[i];
        d.appendChild(s);
      }
      wordsEl.appendChild(d);
      P.wordEls.push(d);
    });
    for (var i = 0; i <= P.wi && i < P.words.length; i++) renderWord(i);
    positionCaret();
  }

  function renderWord(i) {
    var wordEl = P.wordEls[i];
    if (!wordEl) return;
    var target = P.words[i], typed = P.typed[i] || '';
    // remove extra spans first
    while (wordEl.children.length > target.length) wordEl.removeChild(wordEl.lastChild);
    for (var c = 0; c < target.length; c++) {
      var span = wordEl.children[c];
      span.className = 'ch';
      if (c < typed.length) {
        span.classList.add(typed[c] === target[c] ? 'ok' : 'bad');
      }
    }
    // extra typed chars beyond target length
    for (var e = target.length; e < typed.length; e++) {
      var ex = document.createElement('span');
      ex.className = 'ch extra';
      ex.textContent = typed[e];
      wordEl.appendChild(ex);
    }
    wordEl.classList.toggle('current', i === P.wi);
  }

  function positionCaret() {
    var wordEl = P.wordEls[P.wi];
    if (!wordEl) return;
    var typedLen = (P.typed[P.wi] || '').length;
    var left = wordEl.offsetLeft, top = wordEl.offsetTop;
    var kids = wordEl.children;
    if (kids.length > 0) {
      if (typedLen < kids.length) {
        left = kids[typedLen].offsetLeft; top = kids[typedLen].offsetTop;
      } else {
        var last = kids[kids.length - 1];
        left = last.offsetLeft + last.offsetWidth; top = last.offsetTop;
      }
    }
    caretEl.style.left = left + 'px';
    caretEl.style.top = top + 'px';
    // keep caret visible inside scroll area
    var lineH = caretEl.offsetHeight || 40;
    if (top < wordsEl.scrollTop) wordsEl.scrollTop = top;
    else if (top + lineH > wordsEl.scrollTop + wordsEl.clientHeight) {
      wordsEl.scrollTop = top + lineH - wordsEl.clientHeight + 8;
    }
  }

  function recomputeCorrectChars() {
    var n = 0;
    for (var i = 0; i <= P.wi && i < P.words.length; i++) {
      var t = P.words[i], y = P.typed[i] || '';
      var lim = Math.min(t.length, y.length);
      for (var c = 0; c < lim; c++) if (y[c] === t[c]) n++;
      if (i < P.wi) n++; // the space that advanced past this word
    }
    P.correctChars = n;
  }

  function startTimerIfNeeded() {
    if (P.active || P.finished) return;
    P.active = true;
    P.startTime = Date.now();
    P.lastSampleMs = P.startTime;
    P.timerId = setInterval(tick, 100);
  }

  function tick() {
    if (!P || !P.active || P.paused || P.finished) return;
    var now = Date.now();
    P.elapsedMs = now - P.startTime;
    var sec = P.elapsedMs / 1000;
    if (P.mode === 'time') {
      var remain = P.opt - sec;
      $('live-time').textContent = Math.max(0, Math.ceil(remain));
      if (remain <= 0) { finishTest(); return; }
    } else {
      $('live-time').textContent = Math.floor(sec);
    }
    $('live-wpm').textContent = TBStats.calcWPM(P.correctChars, sec);
    $('live-acc').textContent = TBStats.calcAccuracy(P.correctKeys, P.totalKeys);
    if (now - P.lastSampleMs >= 1000) {
      P.lastSampleMs = now;
      P.samples.push(TBStats.calcRawWPM(P.totalKeys, sec));
    }
  }

  function finishTest() {
    if (P.finished) return;
    P.finished = true;
    P.active = false;
    if (P.timerId) clearInterval(P.timerId);
    var sec = Math.max(0.5, P.elapsedMs / 1000);
    var bd = TBStats.charBreakdown(P.words.slice(0, P.wi + 1), P.typed.slice(0, P.wi + 1));
    var result = {
      wpm: TBStats.calcWPM(P.correctChars, sec),
      raw: TBStats.calcRawWPM(P.totalKeys, sec),
      acc: TBStats.calcAccuracy(P.correctKeys, P.totalKeys),
      con: TBStats.calcConsistency(P.samples),
      mode: P.mode + '-' + P.opt,
      duration: sec,
      chars: bd.correct + '/' + (bd.incorrect + bd.extra)
    };
    TBAudio.complete();
    var saved = store.addResult(result);
    result.isBest = saved.isBest;
    if (settings.prankMode) runPrank(result);
    else showResults(result);
  }

  /* ----- input handling ----- */

  inputEl.addEventListener('input', function () {
    if (currentView !== 'practice') { inputEl.value = ''; return; }
    if (!P || P.finished || P.paused) { inputEl.value = ''; return; }
    startTimerIfNeeded();
    var val = inputEl.value;
    if (val.slice(-1) === ' ') {
      // word committed
      P.typed[P.wi] = val.slice(0, -1);
      renderWord(P.wi);
      P.wi++;
      inputEl.value = '';
      if (P.wi >= P.words.length) { finishTest(); return; }
      // extend endlessly in time mode
      if (P.mode === 'time' && P.words.length - P.wi < 25) {
        var list = TBWords[settings.language] || TBWords.en;
        var more = sampleWords(list, 40);
        var startIdx = P.words.length;
        P.words = P.words.concat(more);
        more.forEach(function (w) {
          var d = document.createElement('div');
          d.className = 'word';
          for (var i = 0; i < w.length; i++) {
            var s = document.createElement('span');
            s.className = 'ch'; s.textContent = w[i];
            d.appendChild(s);
          }
          wordsEl.appendChild(d);
          P.wordEls.push(d);
        });
        void startIdx;
      }
      // words mode: finished if last word done
      if (P.mode === 'words' && P.wi >= P.words.length) { finishTest(); return; }
      renderWord(P.wi);
    } else {
      P.typed[P.wi] = val;
      renderWord(P.wi);
      // words mode can end by completing the final word without trailing space
      if (P.mode === 'words' && P.wi === P.words.length - 1 && val === P.words[P.wi]) {
        finishTest(); return;
      }
    }
    positionCaret();
  });

  inputEl.addEventListener('keydown', function (e) {
    if (currentView !== 'practice' || !P || P.finished) return;
    if (e.key === 'Backspace') {
      if (inputEl.value === '' && P.wi > 0) {
        e.preventDefault();
        P.wi--;
        P.wordEls[P.wi + 1].classList.remove('current');
        inputEl.value = P.typed[P.wi] || '';
        recomputeCorrectChars();
        renderWord(P.wi);
        positionCaret();
      }
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      var typed = P.typed[P.wi] || '';
      var target = P.words[P.wi] || '';
      var ok;
      if (e.key === ' ') {
        ok = typed.length === target.length;
      } else {
        ok = typed.length < target.length && e.key === target[typed.length];
      }
      P.totalKeys++;
      if (ok) { P.correctKeys++; P.correctChars++; TBAudio.key(); }
      else { TBAudio.error(); }
    }
  });

  // Tab then Enter = quick restart
  var tabArmed = false, tabTimer = null;
  document.addEventListener('keydown', function (e) {
    if (currentView === 'practice' && e.key === 'Tab') {
      e.preventDefault();
      tabArmed = true;
      if (tabTimer) clearTimeout(tabTimer);
      tabTimer = setTimeout(function () { tabArmed = false; }, 1500);
    } else if (currentView === 'practice' && tabArmed && e.key === 'Enter') {
      e.preventDefault();
      tabArmed = false;
      TBAudio.ui(); newTest();
    }
  });

  $('restart-btn').addEventListener('click', function () { TBAudio.ui(); newTest(); });

  /* ----- focus / pause ----- */

  function showFocusOverlay() { $('focus-overlay').classList.add('show'); }
  function hideFocusOverlay() { $('focus-overlay').classList.remove('show'); }

  function pauseTest() {
    if (!P || !P.active || P.finished || P.paused) return;
    P.paused = true;
    P.pauseStart = Date.now();
    showFocusOverlay();
  }
  function resumeTest() {
    if (!P || !P.paused) return;
    P.startTime += Date.now() - P.pauseStart;
    P.lastSampleMs += Date.now() - P.pauseStart;
    P.paused = false;
    hideFocusOverlay();
    focusInput();
  }
  window.addEventListener('blur', function () { if (currentView === 'practice') pauseTest(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && currentView === 'practice') pauseTest();
  });
  $('focus-card').addEventListener('click', resumeTest);

  /* ================= results ================= */

  function showResults(r) {
    $('res-wpm').textContent = r.wpm;
    $('res-acc').textContent = r.acc + '%';
    $('res-con').textContent = r.con + '%';
    $('res-raw').textContent = r.raw;
    $('res-chars').textContent = r.chars;
    $('res-time').textContent = fmtTime(r.duration);
    $('res-mode').textContent = modeLabel(r.mode);
    $('res-best-badge').innerHTML = r.isBest ? '<span class="best-badge">⚡ NEW BEST ⚡</span>' : '';
    drawChart($('results-chart'), store.getHistory().slice(0, 20).reverse());
    show('results');
  }

  $('next-test-btn').addEventListener('click', function () { TBAudio.ui(); show('practice'); newTest(); });
  $('retry-btn').addEventListener('click', function () { TBAudio.ui(); show('practice'); newTest(); });

  function drawChart(canvas, entries) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return; // non-canvas environments
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (!entries || !entries.length) {
      ctx.fillStyle = cssVar('--dim') || '#888';
      ctx.font = '600 15px Inter, sans-serif';
      ctx.fillText('No tests yet — your bars will appear here.', 24, H / 2);
      return;
    }
    var max = Math.max.apply(null, entries.map(function (e) { return e.wpm; }).concat([10]));
    var n = entries.length, gap = 8;
    var bw = (W - gap * (n + 1)) / n;
    entries.forEach(function (e, i) {
      var h = Math.max(4, (e.wpm / max) * (H - 44));
      var x = gap + i * (bw + gap), y = H - 22 - h;
      var isBest = e.wpm === max && max > 0;
      ctx.fillStyle = isBest ? (cssVar('--accent') || '#ffb020') : (cssVar('--accent2') || '#22d3ee');
      ctx.globalAlpha = isBest ? 1 : 0.55;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw, h, 4); else ctx.rect(x, y, bw, h);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (bw > 26) {
        ctx.fillStyle = cssVar('--dim') || '#888';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(e.wpm, x + bw / 2, H - 6);
      }
    });
  }

  /* ================= stats view ================= */

  function renderStatsView() {
    var h = store.getHistory();
    $('st-tests').textContent = h.length;
    var totalSec = h.reduce(function (a, e) { return a + (e.duration || 0); }, 0);
    $('st-time').textContent = fmtTime(totalSec);
    $('st-avg').textContent = h.length ? Math.round(h.reduce(function (a, e) { return a + e.wpm; }, 0) / h.length) : 0;
    $('st-best').textContent = h.length ? Math.max.apply(null, h.map(function (e) { return e.wpm; })) : 0;
    drawChart($('stats-chart'), h.slice(0, 20).reverse());
    var bests = store.getBests();
    var keys = Object.keys(bests).sort();
    var body = $('bests-body');
    if (!keys.length) {
      body.innerHTML = '<tr><td colspan="2" style="color:var(--faint)">No tests yet — go type something!</td></tr>';
    } else {
      body.innerHTML = '';
      keys.forEach(function (k) {
        var tr = document.createElement('tr');
        var td1 = document.createElement('td'); td1.textContent = modeLabel(k);
        var td2 = document.createElement('td'); td2.textContent = bests[k] + ' wpm';
        tr.appendChild(td1); tr.appendChild(td2);
        body.appendChild(tr);
      });
    }
  }

  $('reset-data-btn').addEventListener('click', function () {
    if (confirm('Delete ALL TypeBlitz data (settings, history, bests, lessons)?')) {
      store.resetAll();
      settings = store.getSettings();
      applyTheme(); applySound(); applyPrank(); syncSettingsUI();
      renderOptSeg(); renderLessonGrid(); newTest();
      show('practice');
      TBAudio.ui();
    }
  });

  /* ================= lessons (3-phase: Learn → Shuffle → Words) ================= */

  // Lessons are defined by PHYSICAL key codes (QWERTY positions). The displayed
  // character comes from the active layout, but the finger never changes.
  var LESSONS = [
    { id: 'home', emoji: '🏠', title: 'Home Row',
      desc: 'The foundation of touch typing. Learn each home-row key, then drill it.',
      codes: ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon'] },
    { id: 'top', emoji: '⬆️', title: 'Top Row',
      desc: 'Reach up without looking. One letter at a time, then shuffled.',
      codes: ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'] },
    { id: 'bottom', emoji: '⬇️', title: 'Bottom Row',
      desc: 'Reach down with control. Slow and accurate beats fast and sloppy.',
      codes: ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash'] },
    { id: 'all', emoji: '🌟', title: 'All Letters',
      desc: 'The capstone: every letter a–z across all three rows.',
      codes: ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP',
              'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL',
              'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'] }
  ];

  // Real English words formable from each lesson's QWERTY letter set (phase 3).
  // Written by hand; every word uses only the lesson's letters.
  var LESSON_WORDS = {
    home: ('as ask sad dad all fall falls lass salad salsa alas adds asks dads fad ' +
           'flask flasks fas').split(' '),
    top: ('you toy out try type pour rope write route quiet quite quote trout eye pop pup ' +
          'tot toot tutor rotor tote yet wet pew pit pot put owe top tip tie toe two row ' +
          'rue rye woe quit quip queue').split(' '),
    bottom: [],  // no real words use bottom-row letters only — pseudos only
    all: null    // sampled from the general English list
  };

  var PHASE_ORDER = ['learn', 'shuffle', 'words'];
  var PHASE_LABELS = { learn: 'Learn', shuffle: 'Shuffle', words: 'Words' };
  var LEARN_HITS = 3;      // correct presses required per letter in phase 1
  var SHUFFLE_ROUND = 12;  // letters per shuffle round
  var SHUFFLE_ROUNDS = 2;
  var WORDS_COUNT = 24;    // words to complete phase 3

  var L = null; // lesson runner state

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Displayed character for a lesson key code under the active layout. */
  function lessonChar(code) {
    return TBKeyboard.codeLabel(code, settings.layout) || '?';
  }

  function renderLessonGrid() {
    var grid = $('lesson-grid');
    grid.innerHTML = '';
    var prog = store.getLessons() || {};
    LESSONS.forEach(function (ls) {
      // Tolerate old/corrupt progress shapes: anything non-object is treated as fresh.
      var p = (prog[ls.id] && typeof prog[ls.id] === 'object') ? prog[ls.id] : {};
      var done = !!p.done;
      var phasesDone = done ? 3 : Math.max(0, Math.min(3, Number(p.phase) || 0));
      var pct = Math.round(phasesDone / 3 * 100);
      var metaRight = done ? '<span class="done-badge">✓ DONE</span>'
        : phasesDone > 0 ? '<span>Phase ' + (phasesDone + 1) + ' of 3 →</span>'
        : '<span>start →</span>';
      var card = document.createElement('div');
      card.className = 'lesson-card';
      card.innerHTML =
        '<div class="emoji">' + ls.emoji + '</div>' +
        '<h3>' + ls.title + '</h3><p>' + ls.desc + '</p>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="lesson-meta"><span>Learn → Shuffle → Words</span>' + metaRight + '</div>';
      card.addEventListener('click', function () { TBAudio.ui(); startLesson(ls); });
      grid.appendChild(card);
    });
  }

  /* ----- phase state machine ----- */

  function startLesson(ls) {
    TBKeyboard.build($('lesson-keyboard'), settings.layout);
    L = {
      lesson: ls,
      phase: 'learn',
      learnIdx: 0,
      learnHits: 0,
      shuffle: null,
      words: null,
      correct: 0,
      total: 0,
      done: false
    };
    $('lesson-title').textContent = ls.emoji + ' ' + ls.title;
    $('lesson-desc').textContent = ls.desc;
    enterPhase('learn');
    show('lesson');
    focusInput();
  }

  function enterPhase(name) {
    L.phase = name;
    var idx = PHASE_ORDER.indexOf(name);
    var steps = document.querySelectorAll('#phase-steps .phase-step');
    for (var i = 0; i < steps.length; i++) {
      var si = PHASE_ORDER.indexOf(steps[i].getAttribute('data-phase'));
      steps[i].classList.toggle('active', si === idx);
      steps[i].classList.toggle('done', si < idx);
    }
    PHASE_ORDER.concat(['summary']).forEach(function (p) {
      $('phase-' + p).classList.toggle('active', p === name);
    });
    $('lesson-phase-label').textContent = PHASE_LABELS[name] || name;
    // Persist progress, but never downgrade an already-completed lesson.
    var prev = (store.getLessons() || {})[L.lesson.id] || {};
    if (!prev.done) store.setLesson(L.lesson.id, { done: false, best: prev.best || 0, phase: idx + 1 });
    if (name === 'learn') renderLearn();
    else if (name === 'shuffle') startShuffle();
    else if (name === 'words') startWords();
  }

  /** Re-render the current lesson phase after a layout switch (restarts the phase,
      since the character set changed). */
  function refreshLessonForLayout() {
    if (!L || L.done) return;
    if (L.phase === 'learn') { L.learnIdx = 0; L.learnHits = 0; renderLearn(); }
    else if (L.phase === 'shuffle') startShuffle();
    else if (L.phase === 'words') startWords();
  }

  /* ----- phase 1: learn ----- */

  function renderLearn() {
    var codes = L.lesson.codes;
    var code = codes[L.learnIdx];
    var ch = lessonChar(code);
    $('learn-letter').textContent = ch;
    $('learn-instr').innerHTML = 'Press <b>' + escapeHtml(ch) + '</b> with your <b>' +
      TBKeyboard.fingerName(code) + '</b>.';
    var dots = $('learn-dots');
    dots.innerHTML = '';
    codes.forEach(function (c, i) {
      var s = document.createElement('span');
      if (i < L.learnIdx) s.className = 'done';
      else if (i === L.learnIdx) s.className = 'current';
      dots.appendChild(s);
    });
    var pd = $('learn-press-dots');
    pd.innerHTML = '';
    for (var i = 0; i < LEARN_HITS; i++) {
      var d = document.createElement('span');
      if (i < L.learnHits) d.className = 'hit';
      pd.appendChild(d);
    }
    TBKeyboard.setTarget(code, false);
    TBHands.render($('learn-hands'), TBKeyboard.fingerOf(code));
    $('finger-hint').textContent = '👆 ' + TBKeyboard.fingerLabel(code);
  }

  function learnPress(key) {
    var code = L.lesson.codes[L.learnIdx];
    var ch = lessonChar(code);
    if (key === ch) {
      L.learnHits++; L.correct++; L.total++;
      TBAudio.key();
      if (L.learnHits >= LEARN_HITS) {
        L.learnIdx++; L.learnHits = 0;
        if (L.learnIdx >= L.lesson.codes.length) { enterPhase('shuffle'); return; }
      }
    } else {
      L.total++;
      TBAudio.error();
      var card = $('learn-card');
      card.classList.remove('shake');
      void card.offsetWidth; // restart the shake animation
      card.classList.add('shake');
    }
    renderLearn();
  }

  /* ----- phase 2: shuffle ----- */

  function startShuffle() {
    L.shuffle = { round: 0, queue: [], idx: 0 };
    nextShuffleRound();
  }

  function nextShuffleRound() {
    var codes = L.lesson.codes;
    var q = [];
    for (var i = 0; i < SHUFFLE_ROUND; i++) {
      q.push(codes[Math.floor(Math.random() * codes.length)]);
    }
    L.shuffle.queue = q;
    L.shuffle.idx = 0;
    renderShuffle();
  }

  function renderShuffle() {
    var S = L.shuffle;
    var q = S.queue, idx = S.idx;
    var row = $('tile-row');
    row.innerHTML = '';
    var start = Math.max(0, idx - 1); // keep the last completed tile visible (teal + ✓)
    var end = Math.min(q.length, start + 7);
    for (var i = start; i < end; i++) {
      var t = document.createElement('div');
      t.className = 'tile' + (i < idx ? ' done' : '') + (i === idx ? ' current' : '');
      t.textContent = lessonChar(q[i]);
      row.appendChild(t);
    }
    var totalDone = S.round * SHUFFLE_ROUND + idx;
    $('shuffle-bar').style.width = Math.round(totalDone / (SHUFFLE_ROUND * SHUFFLE_ROUNDS) * 100) + '%';
    var code = q[idx];
    if (code) {
      TBKeyboard.setTarget(code, false);
      $('finger-hint').textContent = '👆 ' + TBKeyboard.fingerLabel(code);
    } else {
      TBKeyboard.clearTarget();
    }
  }

  function shufflePress(key) {
    var S = L.shuffle;
    var code = S.queue[S.idx];
    var ch = lessonChar(code);
    L.total++;
    if (key === ch) {
      L.correct++;
      TBAudio.key();
      S.idx++;
      if (S.idx >= S.queue.length) {
        S.round++;
        if (S.round >= SHUFFLE_ROUNDS) { enterPhase('words'); return; }
        nextShuffleRound();
        return;
      }
      renderShuffle();
    } else {
      TBAudio.error();
      var cur = row_queryCurrent();
      if (cur) {
        cur.classList.remove('bad');
        void cur.offsetWidth;
        cur.classList.add('bad');
      }
    }
  }

  function row_queryCurrent() {
    return document.querySelector('#tile-row .tile.current');
  }

  /* ----- phase 3: words ----- */

  function pseudoWord(set, minLen, maxLen) {
    var len = minLen + Math.floor(Math.random() * (maxLen - minLen + 1));
    var w = '';
    for (var i = 0; i < len; i++) w += set[Math.floor(Math.random() * set.length)];
    return w;
  }

  function buildLessonWords() {
    var set = L.lesson.codes.map(lessonChar);
    var real = [];
    if (settings.layout === 'qwerty') {
      if (L.lesson.id === 'all') {
        real = (TBWords.en || []).filter(function (w) { return /^[a-z]{2,8}$/.test(w); });
      } else {
        real = LESSON_WORDS[L.lesson.id] || [];
      }
    }
    var words = [];
    var guard = 0;
    while (words.length < WORDS_COUNT && guard++ < WORDS_COUNT * 20) {
      if (real.length && Math.random() < 0.4) {
        words.push(real[Math.floor(Math.random() * real.length)]);
      } else {
        words.push(pseudoWord(set, 2, 5));
      }
    }
    return words;
  }

  function startWords() {
    L.words = { words: buildLessonWords(), typed: [], wi: 0 };
    $('lesson-acc').textContent = '100';
    renderLessonWords();
    updateWordsTarget();
  }

  function renderLessonWords() {
    var W = L.words;
    var box = $('lesson-words');
    box.innerHTML = '';
    W.words.forEach(function (w, i) {
      var d = document.createElement('div');
      d.className = 'word' + (i === W.wi ? ' current' : '');
      var typed = W.typed[i] || '';
      for (var c = 0; c < w.length; c++) {
        var s = document.createElement('span');
        s.className = 'ch';
        if (c < typed.length) s.classList.add(typed[c] === w[c] ? 'ok' : 'bad');
        s.textContent = w[c];
        d.appendChild(s);
      }
      box.appendChild(d);
    });
    $('lesson-word-count').textContent = W.wi + '/' + W.words.length;
  }

  function updateWordsTarget() {
    var W = L.words;
    if (!W || W.wi >= W.words.length) { TBKeyboard.clearTarget(); return; }
    var target = W.words[W.wi];
    var typed = W.typed[W.wi] || '';
    var ch = target[typed.length];
    if (!ch) { TBKeyboard.clearTarget(); return; }
    var res = TBKeyboard.charToCode(ch, settings.layout);
    if (res) {
      TBKeyboard.setTarget(res.code, res.shift);
      $('finger-hint').textContent = '👆 ' + TBKeyboard.fingerLabel(res.code) + (res.shift ? ' + Shift' : '');
    } else {
      TBKeyboard.clearTarget();
    }
  }

  function wordsPress(key) {
    var W = L.words;
    if (!W || W.wi >= W.words.length) return;
    var target = W.words[W.wi];
    var typed = W.typed[W.wi] || '';
    if (key === ' ') {
      if (typed === target) {
        W.wi++;
        if (W.wi >= W.words.length) { completeLesson(); return; }
        renderLessonWords();
      } else {
        TBAudio.error();
      }
      updateWordsTarget();
      return;
    }
    L.total++;
    if (typed.length < target.length && key === target[typed.length]) {
      L.correct++;
      W.typed[W.wi] = typed + key;
      TBAudio.key();
    } else {
      // Record the wrong char so it shows red; backspace to fix it.
      W.typed[W.wi] = typed + key;
      TBAudio.error();
    }
    $('lesson-acc').textContent = TBStats.calcAccuracy(L.correct, L.total);
    renderLessonWords();
    updateWordsTarget();
  }

  function wordsBackspace() {
    var W = L.words;
    if (!W || W.wi >= W.words.length) return;
    var typed = W.typed[W.wi] || '';
    if (typed.length > 0) {
      W.typed[W.wi] = typed.slice(0, -1);
      renderLessonWords();
      updateWordsTarget();
    }
  }

  /* ----- completion ----- */

  function completeLesson() {
    L.done = true;
    var acc = TBStats.calcAccuracy(L.correct, L.total);
    var prev = (store.getLessons() || {})[L.lesson.id] || {};
    var best = Math.max(Number(prev.best) || 0, acc);
    store.setLesson(L.lesson.id, { done: true, best: Math.round(best * 10) / 10, phase: 3 });
    TBKeyboard.clearTarget();
    TBAudio.complete();
    PHASE_ORDER.forEach(function (p) { $('phase-' + p).classList.remove('active'); });
    $('phase-summary').classList.add('active');
    var steps = document.querySelectorAll('#phase-steps .phase-step');
    for (var i = 0; i < steps.length; i++) {
      steps[i].classList.remove('active');
      steps[i].classList.add('done');
    }
    $('lesson-phase-label').textContent = 'Complete';
    $('summary-acc').textContent = acc + '%';
    $('summary-sub').textContent = 'You finished Learn, Shuffle and Words for ' + L.lesson.title + '.';
    $('finger-hint').textContent = '🎉 Nice typing!';
  }

  document.addEventListener('keydown', function (e) {
    if (currentView !== 'lesson' || !L || L.done) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Tab') { e.preventDefault(); return; }
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (L.phase === 'words') wordsBackspace();
      return;
    }
    if (e.key.length !== 1) return;
    if (L.phase === 'learn') learnPress(e.key);
    else if (L.phase === 'shuffle') shufflePress(e.key);
    else if (L.phase === 'words') wordsPress(e.key);
  });

  $('lesson-back').addEventListener('click', function () { TBAudio.ui(); show('lessons'); });
  $('lesson-restart').addEventListener('click', function () { TBAudio.ui(); startLesson(L.lesson); });
  $('summary-lessons-btn').addEventListener('click', function () { TBAudio.ui(); show('lessons'); });
  $('summary-retry-btn').addEventListener('click', function () { TBAudio.ui(); startLesson(L.lesson); });

  /* ================= on-screen keyboard (practice) ================= */

  function buildPracticeKeyboard() {
    TBKeyboard.build($('keyboard'), settings.layout);
  }

  $('layout-select').addEventListener('change', function (e) {
    settings.layout = e.target.value;
    store.updateSettings({ layout: settings.layout });
    TBAudio.ui();
    buildPracticeKeyboard();
    if (L && currentView === 'lesson') { TBKeyboard.build($('lesson-keyboard'), settings.layout); refreshLessonForLayout(); }
  });

  $('kb-visible').addEventListener('change', function (e) {
    settings.keyboardVisible = e.target.checked;
    store.updateSettings({ keyboardVisible: settings.keyboardVisible });
    $('keyboard').style.display = settings.keyboardVisible ? '' : 'none';
  });

  /* ================= settings panel ================= */

  $('volume-slider').addEventListener('input', function (e) {
    var v = Number(e.target.value) / 100;
    settings.volume = v;
    store.updateSettings({ volume: v });
    TBAudio.setVolume(v);
  });
  $('prankster-name').addEventListener('change', function (e) {
    settings.pranksterName = e.target.value.trim() || 'your best friend';
    store.updateSettings({ pranksterName: settings.pranksterName });
    e.target.value = settings.pranksterName;
    TBAudio.ui();
  });

  function syncSettingsUI() {
    $('theme-select').value = settings.theme;
    $('lang-select').value = settings.language;
    $('layout-select').value = settings.layout;
    $('kb-visible').checked = settings.keyboardVisible;
    $('keyboard').style.display = settings.keyboardVisible ? '' : 'none';
    $('volume-slider').value = Math.round(settings.volume * 100);
    $('prankster-name').value = settings.pranksterName === 'your best friend' ? '' : settings.pranksterName;
    $('prankster-name').placeholder = 'your best friend';
    document.querySelectorAll('#mode-seg button').forEach(function (x) {
      x.classList.toggle('active', x.dataset.mode === settings.mode);
    });
  }

  /* ================= prank mode ================= */

  var prankTimers = [];

  function clearPrankTimers() {
    prankTimers.forEach(clearTimeout);
    prankTimers = [];
  }

  function prankLog(msg, cls) {
    var t = $('prank-terminal');
    var line = document.createElement('div');
    line.className = 'line' + (cls ? ' ' + cls : '');
    line.textContent = '> ' + msg;
    t.appendChild(line);
    t.scrollTop = t.scrollHeight;
  }

  function prankBarTo(pct, ms, done) {
    var bar = $('prank-bar');
    var from = parseFloat(bar.style.width) || 0;
    var start = Date.now();
    function step() {
      var k = Math.min(1, (Date.now() - start) / ms);
      bar.style.width = (from + (pct - from) * k) + '%';
      if (k < 1) { prankTimers.push(setTimeout(step, 30)); }
      else if (done) done();
    }
    step();
  }

  function runPrank(result) {
    clearPrankTimers();
    $('prank-fake').style.display = '';
    $('prank-reveal').style.display = 'none';
    $('prank-terminal').innerHTML = '';
    $('prank-bar').style.width = '0%';
    $('prank-overlay').classList.add('show');

    var keys = P ? P.totalKeys : 0;

    prankTimers.push(setTimeout(function () {
      prankLog('captured ' + keys + ' keystrokes…');
      prankBarTo(100, 2400);
    }, 500));

    prankTimers.push(setTimeout(function () {
      $('prank-step-text').textContent = 'Uploading results to cloud…';
      prankLog('encrypting payload…', 'warn');
      $('prank-bar').style.width = '0%';
      prankBarTo(100, 1800);
    }, 3200));

    prankTimers.push(setTimeout(function () {
      $('prank-step-text').textContent = 'Verifying identity…';
      prankLog('contacting typeblitz-cloud… OK');
      prankLog('match found: 1 user', 'warn');
    }, 5300));

    prankTimers.push(setTimeout(revealPrank, 6800));

    function revealPrank() {
      clearPrankTimers();
      $('prank-fake').style.display = 'none';
      $('prank-reveal').style.display = '';
      $('prank-name-out').textContent = settings.pranksterName || 'your best friend';
      TBAudio.complete();
      // stash result for the "real results" button
      $('prank-real-btn').onclick = function () {
        TBAudio.ui();
        $('prank-overlay').classList.remove('show');
        showResults(result);
      };
    }

    $('prank-skip').onclick = function () { revealPrank(); };
  }

  /* ================= init ================= */

  function init() {
    TBAudio.setVolume(settings.volume);
    TBAudio.setEnabled(settings.sound);
    applyTheme(); applySound(); applyPrank(); syncSettingsUI();
    renderOptSeg();
    buildPracticeKeyboard();
    renderLessonGrid();
    newTest();

    // unlock audio on first gesture (browser autoplay policy)
    var unlock = function () { TBAudio.unlock(); };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
