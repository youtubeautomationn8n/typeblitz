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
    if (!P || P.finished) return;
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

  /* ================= lessons ================= */

  function drillFromGroups(groups, targetLen) {
    var out = [];
    var len = 0;
    while (len < targetLen) {
      var g = groups[Math.floor(Math.random() * groups.length)];
      out.push(g); len += g.length + 1;
    }
    return out.join(' ').slice(0, targetLen);
  }

  var LESSONS = [
    { id: 'home', emoji: '🏠', title: 'Home Row', desc: 'The foundation of touch typing: a s d f j k l ;. Keep your fingers anchored here.',
      drill: function () { return drillFromGroups(['asdf', 'jkl;', 'fdsa', ';lkj', 'as', 'df', 'jk', 'l;', 'a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'sad', 'fad', 'jak', 'ask'], 150); } },
    { id: 'top', emoji: '⬆️', title: 'Top Row', desc: 'Reach up without looking: q w e r t y u i o p.',
      drill: function () { return drillFromGroups(['qwer', 'tyui', 'op', 'rewq', 'yuit', 'po', 'qwerty', 'uiop', 'trew', 'yuo', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], 150); } },
    { id: 'bottom', emoji: '⬇️', title: 'Bottom Row', desc: 'Reach down with control: z x c v b n m.',
      drill: function () { return drillFromGroups(['zxcv', 'bnm', 'vcxz', 'mnb', 'zc', 'xv', 'bn', 'zxcvbnm', 'cz', 'vx', 'cb', 'nm', 'z', 'x', 'c', 'v', 'b', 'n', 'm'], 140); } },
    { id: 'shift', emoji: '⇧', title: 'Shift & Symbols', desc: 'Capitals and symbols. Hold Shift with the opposite hand.',
      drill: function () {
        var letters = 'abcdefghijklmnopqrstuvwxyz'.split('').map(function (c) { return c.toUpperCase() + ' ' + c; });
        var syms = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '?'];
        var parts = letters.concat(syms.map(function (s) { return s + ' ' + s; }));
        return drillFromGroups(parts.concat(['Hello', 'World', 'Type', 'Fast']), 160);
      } },
    { id: 'numbers', emoji: '🔢', title: 'Numbers Row', desc: 'Digits 1 to 0 without peeking down.',
      drill: function () { return drillFromGroups(['1234', '5678', '90', '123', '456', '789', '0', '1357', '2468', '909', '1234567890', '42', '777'], 140); } },
    { id: 'speed', emoji: '⚡', title: 'Speed Builder', desc: 'Real common words at pace. Put every row together.',
      drill: function () { return sampleWords(TBWords.en, 30).join(' '); } }
  ];

  var L = null; // lesson runner state

  function renderLessonGrid() {
    var grid = $('lesson-grid');
    grid.innerHTML = '';
    var prog = store.getLessons();
    LESSONS.forEach(function (ls) {
      var p = prog[ls.id] || {};
      var pct = p.done ? 100 : Math.round(p.best || 0);
      var card = document.createElement('div');
      card.className = 'lesson-card';
      card.innerHTML =
        '<div class="emoji">' + ls.emoji + '</div>' +
        '<h3>' + ls.title + '</h3><p>' + ls.desc + '</p>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="lesson-meta"><span>' + pct + '% best accuracy</span>' +
        (p.done ? '<span class="done-badge">✓ DONE</span>' : '<span>start →</span>') + '</div>';
      card.addEventListener('click', function () { TBAudio.ui(); startLesson(ls); });
      grid.appendChild(card);
    });
  }

  function startLesson(ls) {
    TBKeyboard.build($('lesson-keyboard'), settings.layout);
    L = {
      lesson: ls,
      drill: ls.drill(),
      pos: 0,
      correct: 0, total: 0,
      done: false
    };
    $('lesson-title').textContent = ls.emoji + ' ' + ls.title;
    $('lesson-desc').textContent = ls.desc;
    $('lesson-acc').textContent = '100';
    $('lesson-prog').textContent = '0%';
    renderDrill();
    updateLessonTarget();
    show('lesson');
    focusInput();
  }

  function renderDrill() {
    var d = $('drill');
    d.innerHTML = '';
    for (var i = 0; i < L.drill.length; i++) {
      var s = document.createElement('span');
      s.className = 'ch' + (i === L.pos ? ' next' : '') + (i < L.pos ? (L._marks[i] ? ' ok' : ' bad') : '');
      s.textContent = L.drill[i] === ' ' ? ' ' : L.drill[i];
      d.appendChild(s);
    }
  }

  function updateLessonTarget() {
    if (!L || L.done) return;
    var ch = L.drill[L.pos];
    var res = TBKeyboard.charToCode(ch, settings.layout);
    if (res) {
      TBKeyboard.setTarget(res.code, res.shift);
      $('finger-hint').textContent = '👆 ' + TBKeyboard.fingerLabel(res.code) + (res.shift ? ' + Shift' : '');
    } else {
      TBKeyboard.clearTarget();
      $('finger-hint').textContent = '👆 type "' + ch + '"';
    }
    $('lesson-prog').textContent = Math.round((L.pos / L.drill.length) * 100) + '%';
  }

  document.addEventListener('keydown', function (e) {
    if (currentView !== 'lesson' || !L || L.done) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (L.pos > 0) {
        L.pos--;
        L._marks[L.pos] = null;
        renderDrill(); updateLessonTarget();
      }
      return;
    }
    if (e.key.length !== 1) return;
    if (e.key === 'Tab') e.preventDefault();
    L._marks = L._marks || {};
    var expected = L.drill[L.pos];
    L.total++;
    if (e.key === expected) { L.correct++; L._marks[L.pos] = true; TBAudio.key(); }
    else { L._marks[L.pos] = false; TBAudio.error(); }
    L.pos++;
    $('lesson-acc').textContent = TBStats.calcAccuracy(L.correct, L.total);
    if (L.pos >= L.drill.length) {
      completeLesson();
    } else {
      renderDrill(); updateLessonTarget();
    }
  });

  function completeLesson() {
    L.done = true;
    var acc = TBStats.calcAccuracy(L.correct, L.total);
    var prev = store.getLessons()[L.lesson.id] || {};
    var best = Math.max(prev.best || 0, acc);
    store.setLesson(L.lesson.id, { done: true, best: Math.round(best * 10) / 10 });
    TBKeyboard.clearTarget();
    $('finger-hint').textContent = '🎉 Lesson complete — ' + acc + '% accuracy!';
    $('lesson-prog').textContent = '100%';
    TBAudio.complete();
  }

  $('lesson-back').addEventListener('click', function () { TBAudio.ui(); show('lessons'); });
  $('lesson-restart').addEventListener('click', function () { TBAudio.ui(); startLesson(L.lesson); });

  /* ================= on-screen keyboard (practice) ================= */

  function buildPracticeKeyboard() {
    TBKeyboard.build($('keyboard'), settings.layout);
  }

  $('layout-select').addEventListener('change', function (e) {
    settings.layout = e.target.value;
    store.updateSettings({ layout: settings.layout });
    TBAudio.ui();
    buildPracticeKeyboard();
    if (L && currentView === 'lesson') { TBKeyboard.build($('lesson-keyboard'), settings.layout); updateLessonTarget(); }
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
