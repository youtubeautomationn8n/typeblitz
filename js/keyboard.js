/* TypeBlitz on-screen keyboard: QWERTY / AZERTY / DVORAK / COLEMAK with touch-typing finger zones. */
(function () {
  'use strict';

  // Physical rows shared by all layouts (event.code values + width units).
  var ROWS = [
    [['Backquote', 1], ['Digit1', 1], ['Digit2', 1], ['Digit3', 1], ['Digit4', 1], ['Digit5', 1],
     ['Digit6', 1], ['Digit7', 1], ['Digit8', 1], ['Digit9', 1], ['Digit0', 1], ['Minus', 1],
     ['Equal', 1], ['Backspace', 2]],
    [['Tab', 1.5], ['KeyQ', 1], ['KeyW', 1], ['KeyE', 1], ['KeyR', 1], ['KeyT', 1], ['KeyY', 1],
     ['KeyU', 1], ['KeyI', 1], ['KeyO', 1], ['KeyP', 1], ['BracketLeft', 1], ['BracketRight', 1],
     ['Backslash', 1.5]],
    [['CapsLock', 1.75], ['KeyA', 1], ['KeyS', 1], ['KeyD', 1], ['KeyF', 1], ['KeyG', 1],
     ['KeyH', 1], ['KeyJ', 1], ['KeyK', 1], ['KeyL', 1], ['Semicolon', 1], ['Quote', 1],
     ['Enter', 2.25]],
    [['ShiftLeft', 2.25], ['KeyZ', 1], ['KeyX', 1], ['KeyC', 1], ['KeyV', 1], ['KeyB', 1],
     ['KeyN', 1], ['KeyM', 1], ['Comma', 1], ['Period', 1], ['Slash', 1], ['ShiftRight', 2.75]],
    [['ControlLeft', 1.25], ['AltLeft', 1.25], ['Space', 6.25], ['AltRight', 1.25], ['ControlRight', 1.25]]
  ];

  // Finger zone per physical key.
  var FINGERS = {
    Backquote: 'lpinky', Digit1: 'lpinky', Tab: 'lpinky', KeyQ: 'lpinky', CapsLock: 'lpinky',
    KeyA: 'lpinky', ShiftLeft: 'lpinky', KeyZ: 'lpinky', ControlLeft: 'lpinky',
    Digit2: 'lring', KeyW: 'lring', KeyS: 'lring', KeyX: 'lring',
    Digit3: 'lmiddle', KeyE: 'lmiddle', KeyD: 'lmiddle', KeyC: 'lmiddle',
    Digit4: 'lindex', Digit5: 'lindex', KeyR: 'lindex', KeyT: 'lindex',
    KeyF: 'lindex', KeyG: 'lindex', KeyV: 'lindex', KeyB: 'lindex',
    Digit6: 'rindex', Digit7: 'rindex', KeyY: 'rindex', KeyU: 'rindex',
    KeyH: 'rindex', KeyJ: 'rindex', KeyN: 'rindex', KeyM: 'rindex',
    Digit8: 'rmiddle', KeyI: 'rmiddle', KeyK: 'rmiddle', Comma: 'rmiddle',
    Digit9: 'rring', KeyO: 'rring', KeyL: 'rring', Period: 'rring',
    Digit0: 'rpinky', Minus: 'rpinky', Equal: 'rpinky', KeyP: 'rpinky',
    BracketLeft: 'rpinky', BracketRight: 'rpinky', Backslash: 'rpinky',
    Semicolon: 'rpinky', Quote: 'rpinky', Slash: 'rpinky',
    Backspace: 'rpinky', Enter: 'rpinky', ShiftRight: 'rpinky', ControlRight: 'rpinky',
    Space: 'thumb', AltLeft: 'thumb', AltRight: 'thumb'
  };

  var FINGER_LABELS = {
    lpinky: 'Left pinky', lring: 'Left ring finger', lmiddle: 'Left middle finger',
    lindex: 'Left index finger', rindex: 'Right index finger', rmiddle: 'Right middle finger',
    rring: 'Right ring finger', rpinky: 'Right pinky', thumb: 'Thumb'
  };

  // Full "X finger" names for instruction lines ("Press a with your left pinky finger").
  var FINGER_NAMES = {
    lpinky: 'left pinky finger', lring: 'left ring finger', lmiddle: 'left middle finger',
    lindex: 'left index finger', rindex: 'right index finger', rmiddle: 'right middle finger',
    rring: 'right ring finger', rpinky: 'right pinky finger', thumb: 'thumb'
  };

  var QW = {
    Backquote: '`', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
    Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0', Minus: '-', Equal: '=',
    KeyQ: 'q', KeyW: 'w', KeyE: 'e', KeyR: 'r', KeyT: 't', KeyY: 'y', KeyU: 'u',
    KeyI: 'i', KeyO: 'o', KeyP: 'p', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
    KeyA: 'a', KeyS: 's', KeyD: 'd', KeyF: 'f', KeyG: 'g', KeyH: 'h', KeyJ: 'j',
    KeyK: 'k', KeyL: 'l', Semicolon: ';', Quote: "'",
    KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v', KeyB: 'b', KeyN: 'n',
    Comma: ',', Period: '.', Slash: '/'
  };

  var LABELS = {
    qwerty: Object.assign({}, QW),
    azerty: Object.assign({}, QW, {
      Backquote: '²', Digit1: '&', Digit2: 'é', Digit3: '"', Digit4: "'", Digit5: '(',
      Digit6: '-', Digit7: 'è', Digit8: '_', Digit9: 'ç', Digit0: 'à', Minus: ')', Equal: '=',
      KeyQ: 'a', KeyW: 'z', KeyE: 'e', KeyR: 'r', KeyT: 't', KeyY: 'y', KeyU: 'u',
      KeyI: 'i', KeyO: 'o', KeyP: 'p', BracketLeft: '^', BracketRight: '$', Backslash: '!',
      KeyA: 'q', KeyS: 's', KeyD: 'd', KeyF: 'f', KeyG: 'g', KeyH: 'h', KeyJ: 'j',
      KeyK: 'k', KeyL: 'l', Semicolon: 'm', Quote: 'ù',
      KeyZ: 'w', KeyX: 'x', KeyC: 'c', KeyV: 'v', KeyB: 'b', KeyN: 'n',
      Comma: ',', Period: ';', Slash: ':'
    }),
    dvorak: {
      Backquote: '`', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
      Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0', Minus: '[', Equal: ']',
      KeyQ: "'", KeyW: ',', KeyE: '.', KeyR: 'p', KeyT: 'y', KeyY: 'f', KeyU: 'g',
      KeyI: 'c', KeyO: 'r', KeyP: 'l', BracketLeft: '/', BracketRight: '=',
      KeyA: 'a', KeyS: 'o', KeyD: 'e', KeyF: 'u', KeyG: 'i', KeyH: 'd', KeyJ: 'h',
      KeyK: 't', KeyL: 'n', Semicolon: 's', Quote: '-',
      KeyZ: ';', KeyX: 'q', KeyC: 'j', KeyV: 'k', KeyB: 'x', KeyN: 'b',
      Comma: 'w', Period: 'v', Slash: 'z', Backslash: '\\'
    },
    colemak: {
      Backquote: '`', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5',
      Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0', Minus: '-', Equal: '=',
      KeyQ: 'q', KeyW: 'w', KeyF: 'f', KeyP: 'p', KeyG: 'g', KeyJ: 'j', KeyL: 'l',
      KeyU: 'u', KeyY: 'y', BracketLeft: '[', BracketRight: ']', Backslash: '\\',
      KeyA: 'a', KeyR: 'r', KeyS: 's', KeyT: 't', KeyD: 'd', KeyH: 'h', KeyN: 'n',
      KeyE: 'e', KeyI: 'i', KeyO: 'o', Semicolon: ';', Quote: "'",
      KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v', KeyB: 'b', KeyK: 'k', KeyM: 'm',
      Comma: ',', Period: '.', Slash: '/'
    }
  };


  var PRETTY = {
    Backspace: '⌫', Tab: '⇥', CapsLock: '⇪', Enter: '⏎', ShiftLeft: '⇧', ShiftRight: '⇧',
    ControlLeft: 'ctrl', ControlRight: 'ctrl', AltLeft: 'alt', AltRight: 'alt', Space: 'space'
  };

  // QWERTY shift symbols for char->code resolution.
  var SHIFT_MAP = {
    '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', '$': 'Digit4', '%': 'Digit5',
    '^': 'Digit6', '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0',
    '_': 'Minus', '+': 'Equal', '{': 'BracketLeft', '}': 'BracketRight',
    '|': 'Backslash', ':': 'Semicolon', '"': 'Quote', '<': 'Comma', '>': 'Period',
    '?': 'Slash', '~': 'Backquote'
  };

  var keyEls = {};
  var listenersBound = false;
  var currentLayout = 'qwerty';

  function fingerOf(code) { return FINGERS[code] || 'thumb'; }

  function fingerLabel(code) { return FINGER_LABELS[fingerOf(code)] || ''; }

  /** Full finger name for instruction lines, e.g. "left pinky finger". */
  function fingerName(code) { return FINGER_NAMES[fingerOf(code)] || 'thumb'; }

  /** Displayed label for a physical key code under a layout (null for non-printable keys). */
  function codeLabel(code, layout) {
    if (PRETTY[code]) return null;
    var labels = LABELS[layout] || LABELS.qwerty;
    return labels[code] || null;
  }

  /** Resolve a character to { code, shift } for the given layout. */
  function charToCode(ch, layout) {
    var labels = LABELS[layout] || LABELS.qwerty;
    if (ch === ' ') return { code: 'Space', shift: false };
    var lower = ch.toLowerCase();
    for (var code in labels) {
      if (labels[code] === lower) {
        return { code: code, shift: ch !== lower };
      }
    }
    if (SHIFT_MAP[ch]) return { code: SHIFT_MAP[ch], shift: true };
    return null;
  }

  function bindGlobalKeys() {
    if (listenersBound) return;
    listenersBound = true;
    document.addEventListener('keydown', function (e) {
      var el = keyEls[e.code];
      if (el) el.classList.add('pressed');
    });
    document.addEventListener('keyup', function (e) {
      var el = keyEls[e.code];
      if (el) el.classList.remove('pressed');
    });
    window.addEventListener('blur', function () {
      for (var code in keyEls) keyEls[code].classList.remove('pressed');
    });
  }

  function build(el, layout) {
    currentLayout = layout;
    keyEls = {};
    el.innerHTML = '';
    var labels = LABELS[layout] || LABELS.qwerty;
    ROWS.forEach(function (row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      row.forEach(function (def) {
        var code = def[0], w = def[1];
        var k = document.createElement('div');
        k.className = 'kb-key f-' + fingerOf(code);
        k.style.flex = w + ' ' + w + ' 0';
        k.dataset.code = code;
        var label = PRETTY[code] || labels[code] || code;
        k.innerHTML = '<span>' + escapeHtml(label) + '</span>';
        rowEl.appendChild(k);
        keyEls[code] = k;
      });
      el.appendChild(rowEl);
    });
    bindGlobalKeys();
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function clearTarget() {
    var t = document.querySelectorAll('.kb-key.target');
    for (var i = 0; i < t.length; i++) t[i].classList.remove('target');
  }

  function setTarget(code, shift) {
    clearTarget();
    var el = keyEls[code];
    if (el) el.classList.add('target');
    if (shift) {
      if (keyEls.ShiftLeft) keyEls.ShiftLeft.classList.add('target');
      if (keyEls.ShiftRight) keyEls.ShiftRight.classList.add('target');
    }
  }

  var root = typeof globalThis !== 'undefined' ? globalThis : this;
  root.TBKeyboard = {
    build: build,
    clearTarget: clearTarget,
    setTarget: setTarget,
    charToCode: charToCode,
    fingerOf: fingerOf,
    fingerLabel: fingerLabel,
    fingerName: fingerName,
    codeLabel: codeLabel,
    layouts: ['qwerty', 'azerty', 'dvorak', 'colemak']
  };
})();
