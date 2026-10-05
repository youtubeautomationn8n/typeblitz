/* TypeBlitz hand diagram: original minimal SVG of two hands with per-finger highlight.
   Drawn from scratch (rounded-rectangle palms + capsule fingers); not copied from any artwork. */
(function () {
  'use strict';

  // Finger geometry: left-to-right order per hand. x/y/height in SVG units, width fixed.
  // Thumbs are drawn rotated via `rot` (degrees around their base center).
  var FW = 24;
  var FINGERS = [
    // left hand (viewer's left)
    { id: 'lpinky',  x: 32,  h: 54 },
    { id: 'lring',   x: 60,  h: 74 },
    { id: 'lmiddle', x: 88,  h: 82 },
    { id: 'lindex',  x: 116, h: 70 },
    { id: 'lthumb',  x: 140, h: 54, rot: -24 },
    // right hand (viewer's right)
    { id: 'rthumb',  x: 236, h: 54, rot: 24 },
    { id: 'rindex',  x: 260, h: 70 },
    { id: 'rmiddle', x: 288, h: 82 },
    { id: 'rring',   x: 316, h: 74 },
    { id: 'rpinky',  x: 344, h: 54 }
  ];

  var PALM_Y = 88;

  function fingerSvg(f, activeId) {
    var y = PALM_Y - f.h + 6;
    var cls = 'hand-finger' + (f.id === activeId ? ' active' : '');
    var tr = '';
    if (f.rot) {
      var cx = f.x + FW / 2, cy = y + f.h - 8;
      tr = ' transform="rotate(' + f.rot + ' ' + cx + ' ' + cy + ')"';
    }
    return '<rect class="' + cls + '" data-finger="' + f.id + '" x="' + f.x + '" y="' + y +
      '" width="' + FW + '" height="' + f.h + '" rx="12"' + tr + '/>';
  }

  /**
   * Render the two-hands diagram into `container`, highlighting `activeFinger`
   * (a finger id like 'lpinky', or null for none).
   */
  function render(container, activeFinger) {
    if (!container) return;
    var s = '<svg viewBox="0 0 400 168" role="img" aria-label="Hand diagram showing which finger to use">';
    s += '<rect class="hand-palm" x="28" y="' + PALM_Y + '" width="140" height="62" rx="22"/>';
    s += '<rect class="hand-palm" x="232" y="' + PALM_Y + '" width="140" height="62" rx="22"/>';
    for (var i = 0; i < FINGERS.length; i++) s += fingerSvg(FINGERS[i], activeFinger);
    s += '</svg>';
    container.innerHTML = s;
  }

  var root = typeof globalThis !== 'undefined' ? globalThis : this;
  root.TBHands = { render: render };
})();
