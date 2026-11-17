# SUMMIT · maintainer notes

Read this first when picking the work up again. The source files rarely need re-reading; targeted `grep` is enough.

## One codebase, two homes

- **GitHub Pages (main home):** this repository, served from the root of `main`. `js/web.js` supplies what Claude's artifact runtime would: progress storage in a private repo through the GitHub API (`progress/<doc>.json`), Claude through the Anthropic Messages API with the user's own key, and browser downloads.
- **Claude artifact (older home, left as it was):** the same files published with the artifact tools. There `window.claude` exists before any script runs and `js/web.js` returns at once. Republishing it is optional; it keeps its own progress store.

## Working copy

```sh
git clone <this repository> summit && cd summit
mkdir -p /home/claude/scripts && cp -r dev/scripts/. /home/claude/scripts/      # the tests keep their old home
(cd dev && npm ci)                                       # katex, pyodide and fonts: only to rebuild vendor files or run tests
ln -s dev/node_modules/pyodide _py                       # local Pyodide for tests (ignored by git)
cp dev/scripts/init_cloud.js dev/scripts/init_py.js /tmp/
python3 -I -m http.server 8765 &                         # the site, from the repository root
node dev/scripts/mock_cloud.js 8766 &                    # stand-in for Claude's runtime
node dev/scripts/mock_web.js 8767 &                      # stand-in for the GitHub and Anthropic APIs
```

## Tests (all must pass before pushing)

| Suite | Command | Checks |
|---|---|---|
| Acceptance | `node dev/scripts/uat.js http://localhost:8765/ ABCDEFGIJKLMOP` and, in a second process, `… HN` | 166 |
| Outside Claude | `node dev/scripts/test_web.js http://localhost:8765/ [shotDir]` (needs mock_web) | 42 |
| Claude runtime | `node dev/scripts/test_cloud.js http://localhost:8765/` (needs mock_cloud) | 19 |
| Unpacked cards | `node dev/scripts/test_unpack.js http://localhost:8765/` | 43 |
| Ask about a highlight | `node dev/scripts/test_ask.js http://localhost:8765/` | 43 |
| Smoke | `node dev/scripts/test_full.js http://localhost:8765/ <shotDir>` | all |
| Shop simulator | `node dev/scripts/test_shop.js "$PWD"` | 14 contracts |
| Question bank | `node dev/scripts/verify_bank.js "$PWD" "$PWD/dev/build/curriculum.json"` | 0 errors |
| Hoverslam | `python3 -I dev/scripts/test_hover.py dev/hover sol` | 42 runs |

Run test_unpack, test_ask and test_cloud one after another: they share mock_cloud. Paths given to test_shop and verify_bank must be absolute.

## Map

`js/core.js` state, sync and merge, shell, router · `js/web.js` outside-Claude layer · `js/engine.js` gating, mastery, erosion, quizzes, Claude grading · `js/ui1.js` mountain, chapter, reader, quiz · `js/ui2.js` today, train, recap, Pack, graph · `js/launch.js` Launch Window · `js/hover.js` + `js/hoverpy.js` Hoverslam (Pyodide) · `js/gcode.js` + `js/shopdata.js` + `js/shop.js` Shop · `js/drills.js` + `js/career.js` Hire Me · `js/unpack.js` + `js/calc.js` Unpacked cards · `js/ask.js` Ask about a highlight · `js/bank1-3.js` question templates · `data/cur.js` the parsed curriculum, `data/read*.js` its text, `data/unp*.js` the cards.

## Progress format

One JSON document per key: `main`, `mods`, `log`, `aiq`, `photo_<id>`, `unp<chapter>`. Each carries `u`, the time of its last change. On load and before writing, `reconcile()` in core.js compares `u` with the device's base stamp and adopts, pushes or merges (`MERGE`, XP by maximum, sets by union). On GitHub every save is a commit to `progress/<key>.json`; saves wait ten seconds after the last change, and a write over a newer save (HTTP 409) is retried after a fresh read and merge.

## Content work

- Unpacked cards: sources in `dev/unpack/chNN.txt` (format at the top of `dev/scripts/build_unpack.js`). Chapters 1–3 are written (83 cards). Next: Chapter 4 onward.
  Build and check: `node dev/scripts/build_unpack.js dev/unpack . dev/node_modules dev/build/curriculum.json`, then `node dev/scripts/check_unpack_answers.js dev/unpack js/calc.js` (13 known flags are presentation only).
  Read a chapter: `python3 -I dev/scripts/dump_ch.py dev/build/curriculum.json <n>`. Check every "Chapter N" reference against the section titles.
- Hoverslam levels: `dev/hover/` → `node dev/scripts/build_hover.js dev/hover js/hoverpy.js`.
- Interview drills: `python3 -I dev/scripts/build_drills.py dev/hover js/drills.js` (edit `dev/scripts/drills_src.py`).

## Scope rules (from the curriculum owner, binding)

A learning simulator only: the vehicle lands back on its own pad. No content on guiding anything to an external target, intercept, homing or terminal guidance; no propellant formulations; no motor or igniter manufacture; no motor casings, nozzles or propellant tooling in the shop. Respect the doc's safety flags (flagged sections are never sent to Claude for unpacking). Claude prompts in `js/ask.js` and `js/unpack.js` carry these rules.

## Not verifiable from a build machine

Real iPhone behaviour (text selection, the keyboard over the Ask popup, home-screen storage), Pyodide loading from jsDelivr in the live page, and real GitHub and Anthropic responses. The stand-ins in `dev/scripts/mock_web.js` and `mock_cloud.js` follow the documented behaviour.
