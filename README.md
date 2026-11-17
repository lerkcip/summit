# SUMMIT

A mobile-first training hub for a self-taught path into rocketry, CNC machining and a space-industry career. The 54-chapter curriculum *Rocketry and Hypersonic Flight from First Principles* is its spine: a chapter unlocks only when the chapters it builds on are mastered, and four modules (Launch Window, Hoverslam Lab, Shop Contracts and Hire Me Mission) train around it.

**Open SUMMIT:** https://lerkcip.github.io/summit/

## On your phone

- **iPhone:** open the link in Safari, tap Share, then **Add to Home Screen**. It opens full screen like an app.
- **Android:** open it in Chrome, open the menu, then **Add to Home screen**.

## Your progress

SUMMIT saves progress in the browser you use. To share it between devices, connect a **private** GitHub repository (for example `summit-progress`) in **Pack → Sync with GitHub**. SUMMIT then saves to `progress/` in that repository about ten seconds after each change, and loads the newest progress whenever you open it.

The token it needs takes about two minutes:

1. On GitHub: Settings → Developer settings → Fine-grained tokens → [Generate new token](https://github.com/settings/personal-access-tokens/new).
2. Repository access: **Only select repositories**, then your private progress repository.
3. Repository permissions: **Contents: Read and write**. Nothing else.
4. Paste the token into Pack → Sync with GitHub on each device. On iPhone, the home-screen copy counts as its own device.

A JSON backup is always one tap away: Pack → Export JSON.

## Claude features (optional)

Grading written answers, Ask about a highlight, Unpack with Claude, the README review and video outlines all call Claude. Outside Claude's own apps they use your Anthropic API key, billed per use. Create a key in the [Claude Console](https://console.anthropic.com), set a monthly spend limit, and paste the key into Pack → Claude API key. Ask about a highlight uses Claude Opus 5.5; the rest use Claude Sonnet 5.5. Without a key those features stay off and you check written answers yourself against the answer key.

## What is public

This repository and the site are public: anyone with the link can read the curriculum and use the app. The page asks search engines not to list it. Your progress, token and API key are never in this repository. Progress lives in your browser and in your private repository; the token and the key stay in your browser and are sent only to `api.github.com` and `api.anthropic.com`.

## Layout

- `index.html`, `css/`, `js/`, `data/`, `vendor/`, `icons/`: the site, served as it is. There is no build step.
- `js/web.js`: lets the same app run outside Claude (sync through GitHub, your API key, downloads).
- `dev/`: the tools, card sources and tests behind the site. See [dev/README.md](dev/README.md).

## Credits

KaTeX (MIT, `vendor/katex/LICENSE`). Barlow Condensed, Instrument Sans and JetBrains Mono (SIL Open Font License 1.1, `vendor/fonts/LICENSE.txt`). Pyodide (MPL 2.0), loaded from jsDelivr for the Python exercises.
