# ⚡ TypeBlitz

A free, original typing tutor that runs entirely in your browser. Timed and word-count typing tests, guided touch-typing lessons, live stats — and a sneaky **Prank Mode** 🎭 for surprising your friends.

Built with **vanilla HTML, CSS and JavaScript only**. Zero dependencies, no build step, no trackers, no sign-up.

## Run it

Option 1 — just open it:

```
open index.html        # or double-click the file
```

Option 2 — serve it (recommended, avoids `file://` quirks on some browsers):

```bash
cd typeblitz
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Features

- **Practice tests** — Time mode (15/30/60/120s) or Words mode (10/25/50/100 words) in English, Français, Español and Deutsch
- **Live feedback** — animated caret, per-character coloring, live WPM / accuracy / timer, `Tab` then `Enter` quick-restart
- **Lessons** — Home Row, Top Row, Bottom Row, Shift & Symbols, Numbers Row, Speed Builder; the next key glows on the on-screen keyboard with finger hints, progress saved per lesson
- **Results** — big WPM readout, NEW BEST badge, accuracy / consistency / raw WPM / character breakdown, recent-tests bar chart
- **Stats page** — totals, personal bests per mode, history chart, one-click data reset
- **On-screen keyboard** — QWERTY, AZERTY, DVORAK and Colemak with touch-typing finger color zones; highlights keys as you press them
- **Synthesized SFX** — keypress clicks, error thuds, completion arpeggio and UI sounds generated live with the Web Audio API (no audio files); volume slider + mute in the header
- **5 themes** — Midnight (default), Paper, Forest, Sunset, Ocean
- **Prank Mode** 🎭 — flip the toggle in the header; after a test you'll get a dramatic fake "Analyzing keystrokes… / Uploading to cloud… / Verifying identity…" sequence ending in a GOTCHA naming your prankster. Real results are always one click away.
- **Privacy** — everything (settings, bests, history, lessons) lives in `localStorage`. Nothing is uploaded anywhere.

## Project structure

```
typeblitz/
├── index.html          # app shell (views: practice, lessons, results, stats)
├── css/
│   ├── style.css       # main stylesheet
│   └── themes.css      # theme variables via [data-theme]
├── js/
│   ├── app.js          # all app logic: tests, lessons, results, prank, charts
│   ├── words.js        # original word lists (en/fr/es/de)
│   ├── keyboard.js     # on-screen keyboard: layouts + finger zones
│   ├── audio.js        # Web Audio synthesized sound effects
│   └── stats.js        # WPM/accuracy math + localStorage persistence
├── assets/
│   └── favicon.svg     # lightning-bolt logo
├── README.md
├── LICENSE             # MIT
└── .gitignore
```

## Deploy to GitHub Pages

1. Create a repo named `typeblitz` on GitHub and push this folder.
2. Go to **Settings → Pages → Deploy from a branch → `main` / root**.
3. Your app is live at `https://<your-username>.github.io/typeblitz/`.

## License

MIT — see [LICENSE](LICENSE).
