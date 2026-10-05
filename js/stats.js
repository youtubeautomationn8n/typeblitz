/* TypeBlitz stats: pure calculations + localStorage persistence. */
(function () {
  'use strict';

  var LS_KEY = 'typeblitz_v1';
  var MAX_HISTORY = 50;

  var DEFAULTS = {
    settings: {
      theme: 'midnight',
      sound: true,
      volume: 0.7,
      keyboardVisible: true,
      language: 'en',
      mode: 'time',
      timeOption: 60,
      wordsOption: 50,
      layout: 'qwerty',
      prankMode: false,
      pranksterName: 'your best friend'
    },
    bests: {},      // e.g. { "time-60": 82, "words-50": 91 }
    history: [],    // [{ wpm, raw, acc, con, mode, duration, date }]
    lessons: {}     // { "home": { done: true, best: 97.5 } }
  };

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function mergeDefaults(saved) {
    var out = deepClone(DEFAULTS);
    if (!saved || typeof saved !== 'object') return out;
    if (saved.settings && typeof saved.settings === 'object') {
      for (var k in out.settings) {
        if (Object.prototype.hasOwnProperty.call(saved.settings, k) &&
            saved.settings[k] !== undefined && saved.settings[k] !== null) {
          out.settings[k] = saved.settings[k];
        }
      }
    }
    if (saved.bests && typeof saved.bests === 'object') out.bests = saved.bests;
    if (Array.isArray(saved.history)) out.history = saved.history.slice(0, MAX_HISTORY);
    if (saved.lessons && typeof saved.lessons === 'object') out.lessons = saved.lessons;
    return out;
  }

  // --- Pure calculations -------------------------------------------------

  /** Standard WPM: (correct characters / 5) / minutes. */
  function calcWPM(correctChars, seconds) {
    if (!seconds || seconds <= 0 || !correctChars || correctChars <= 0) return 0;
    return Math.round((correctChars / 5) / (seconds / 60));
  }

  /** Raw WPM counts every typed character, mistakes included. */
  function calcRawWPM(totalChars, seconds) {
    if (!seconds || seconds <= 0 || !totalChars || totalChars <= 0) return 0;
    return Math.round((totalChars / 5) / (seconds / 60));
  }

  /** Accuracy as a percentage with one decimal. */
  function calcAccuracy(correct, total) {
    if (!total || total <= 0) return 100;
    if (correct < 0) correct = 0;
    if (correct > total) correct = total;
    return Math.round((correct / total) * 1000) / 10;
  }

  /** Consistency: 100 minus the coefficient of variation of per-second WPM samples. */
  function calcConsistency(samples) {
    if (!samples || samples.length < 2) return 100;
    var n = samples.length, sum = 0, i;
    for (i = 0; i < n; i++) sum += samples[i];
    var mean = sum / n;
    if (mean <= 0) return 0;
    var varSum = 0;
    for (i = 0; i < n; i++) varSum += Math.pow(samples[i] - mean, 2);
    var sd = Math.sqrt(varSum / n);
    var score = 100 * (1 - sd / mean);
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    return Math.round(score);
  }

  /** Split typed char counts into correct/incorrect/missed/extra buckets. */
  function charBreakdown(targetWords, typedWords) {
    var correct = 0, incorrect = 0, missed = 0, extra = 0;
    for (var w = 0; w < targetWords.length; w++) {
      var t = targetWords[w] || '';
      var y = typedWords[w] || '';
      var len = Math.max(t.length, y.length);
      for (var c = 0; c < len; c++) {
        var tc = t[c], yc = y[c];
        if (tc === undefined) { extra++; }
        else if (yc === undefined) { missed++; }
        else if (tc === yc) { correct++; }
        else { incorrect++; }
      }
    }
    return { correct: correct, incorrect: incorrect, missed: missed, extra: extra };
  }

  // --- Store --------------------------------------------------------------

  function Store(storage) {
    this.storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    this.data = mergeDefaults(this._read());
  }

  Store.prototype._read = function () {
    try {
      if (!this.storage) return null;
      var raw = this.storage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  };

  Store.prototype._write = function () {
    try {
      if (this.storage) this.storage.setItem(LS_KEY, JSON.stringify(this.data));
    } catch (e) { /* storage full or unavailable */ }
  };

  Store.prototype.getSettings = function () { return this.data.settings; };

  Store.prototype.updateSettings = function (patch) {
    for (var k in patch) {
      if (Object.prototype.hasOwnProperty.call(this.data.settings, k)) {
        this.data.settings[k] = patch[k];
      }
    }
    this._write();
  };

  Store.prototype.getHistory = function () { return this.data.history; };

  Store.prototype.getBests = function () { return this.data.bests; };

  /**
   * Record a finished test. Returns { isBest, best }.
   * result: { wpm, raw, acc, con, mode, duration }
   */
  Store.prototype.addResult = function (result) {
    var entry = {
      wpm: result.wpm || 0,
      raw: result.raw || 0,
      acc: result.acc != null ? result.acc : 100,
      con: result.con != null ? result.con : 100,
      mode: result.mode || 'time-60',
      duration: Math.round(result.duration || 0),
      date: Date.now()
    };
    this.data.history.unshift(entry);
    if (this.data.history.length > MAX_HISTORY) {
      this.data.history.length = MAX_HISTORY;
    }
    var isBest = false;
    var prev = this.data.bests[entry.mode] || 0;
    if (entry.wpm > prev) {
      this.data.bests[entry.mode] = entry.wpm;
      isBest = true;
    }
    this._write();
    return { isBest: isBest, best: this.data.bests[entry.mode] };
  };

  Store.prototype.getLessons = function () { return this.data.lessons; };

  Store.prototype.setLesson = function (id, info) {
    this.data.lessons[id] = info;
    this._write();
  };

  Store.prototype.resetAll = function () {
    this.data = deepClone(DEFAULTS);
    this._write();
  };

  var root = typeof globalThis !== 'undefined' ? globalThis : this;
  root.TBStats = {
    calcWPM: calcWPM,
    calcRawWPM: calcRawWPM,
    calcAccuracy: calcAccuracy,
    calcConsistency: calcConsistency,
    charBreakdown: charBreakdown,
    Store: Store,
    DEFAULTS: deepClone(DEFAULTS)
  };
})();
