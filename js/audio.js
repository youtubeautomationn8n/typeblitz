/* TypeBlitz audio: 100% original sounds synthesized with the Web Audio API. No audio files. */
(function () {
  'use strict';

  var ctx = null;
  var master = null;
  var enabled = true;
  var volume = 0.7;

  function ensureCtx() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    var AC = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = enabled ? volume : 0;
    master.connect(ctx.destination);
    return ctx;
  }

  function setEnabled(on) {
    enabled = !!on;
    if (master && ctx) master.gain.setTargetAtTime(enabled ? volume : 0, ctx.currentTime, 0.01);
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, Number(v) || 0));
    if (master && ctx && enabled) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.01);
  }

  function isEnabled() { return enabled; }

  // A short enveloped oscillator blip.
  function blip(freq, dur, type, gain, slideTo) {
    var c = ensureCtx();
    if (!c || !enabled) return;
    var t = c.currentTime;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  // Filtered noise burst (for clicks/thuds).
  function noise(dur, filterFreq, gain, type) {
    var c = ensureCtx();
    if (!c || !enabled) return;
    var t = c.currentTime;
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = c.createBufferSource();
    src.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.value = filterFreq;
    f.Q.value = 1.2;
    var g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.02);
  }

  var api = {
    /** Call once on first user gesture so the AudioContext is allowed to start. */
    unlock: function () { ensureCtx(); },
    setEnabled: setEnabled,
    setVolume: setVolume,
    isEnabled: isEnabled,

    /** Very subtle keypress click. */
    key: function () {
      noise(0.03, 3200, 0.05);
      blip(1900, 0.025, 'triangle', 0.015, 1400);
    },
    /** Dull thud for typing errors. */
    error: function () {
      blip(140, 0.12, 'sine', 0.12, 70);
      noise(0.06, 300, 0.06, 'lowpass');
    },
    /** Little rising arpeggio when a test completes. */
    complete: function () {
      var notes = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < notes.length; i++) {
        (function (n, i) {
          setTimeout(function () { blip(n, 0.22, 'triangle', 0.09); }, i * 90);
        })(notes[i], i);
      }
    },
    /** Soft UI click for buttons and toggles. */
    ui: function () { blip(660, 0.06, 'sine', 0.06, 520); },
    /** Countdown beep; pass true for the final higher beep. */
    beep: function (final) {
      blip(final ? 1174.7 : 880, final ? 0.28 : 0.12, 'sine', 0.1);
    }
  };

  var root = typeof globalThis !== 'undefined' ? globalThis : this;
  root.TBAudio = api;
})();
