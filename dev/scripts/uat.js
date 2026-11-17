// SUMMIT user-acceptance test: user journeys driven through the UI on a phone-sized screen.
// usage: node uat.js <baseUrl> [sectionLetters]   e.g. node uat.js http://localhost:8765/ ABC
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const base = process.argv[2], only = process.argv[3] || '';
const tally = {}; let sec = '?', fails = [];
const ok = (c, m, x) => { tally[sec] = tally[sec] || [0, 0]; tally[sec][c ? 0 : 1]++; if (!c) { const line = sec + ' FAIL ' + m + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 420) : ''); fails.push(line); console.log(line); } };
const note = (m, x) => console.log(sec + ' note ' + m + (x !== undefined ? '  ' + JSON.stringify(x).slice(0, 600) : ''));
const PY = '/home/claude/scripts/init_py.js', CLOCK = '/home/claude/scripts/clock.js';
const errs = [];
let browser;
async function open(o = {}) {
  const ctx = await browser.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: 1, isMobile: (o.w || 390) < 700, hasTouch: (o.w || 390) < 700 });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(sec + ' PAGEERROR ' + String(e.stack || e).slice(0, 500)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(sec + ' console: ' + m.text().slice(0, 300)); });
  for (const i of (o.init || [])) await page.addInitScript(i.includes('\n') || !i.startsWith('/') ? i : { path: i });
  if (o.route) await o.route(page);
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => window.S && S.state && document.querySelector('main'), null, { timeout: 8000 });
  return page;
}
const go = async (p, h, w) => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(w || 300); };
const tap = async (p, name, o = {}) => { const b = p.getByRole('button', { name, exact: typeof name === 'string' ? (o.exact !== false) : undefined }).first(); await b.click({ timeout: o.timeout || 4000 }); await p.waitForTimeout(o.wait || 120); };
const has = async (p, name) => (await p.getByRole('button', { name, exact: typeof name === 'string' }).count()) > 0;
const txt = p => p.evaluate(() => document.getElementById('app').innerText);
const clearToasts = p => p.evaluate(() => { document.querySelectorAll('.toasts > *').forEach(e => e.remove()); });
const masterAll = (p, upto, bosses) => p.evaluate(([upto, bosses]) => { for (var n = 1; n <= upto; n++) if (!S.E.mastered(n)) S.E.master(n, 'quiz'); (bosses || []).forEach(function (b) { S.state.boss[b] = { tries: 1, best: 0.9, at: Date.now() }; }); S.dirty('main', 'log'); S.render(); document.querySelectorAll('.toasts > *').forEach(e => e.remove()); }, [upto, bosses]);
// answer the session on screen the way a user would: tap the question, type, move on
async function answer(p, o = {}) {
  const wrong = o.wrong || [], blank = o.blank || [];
  const n = await p.evaluate(() => S.state.quiz.items.length);
  for (let k = 0; k < n; k++) {
    await p.locator('.qnav button').nth(k).click(); await p.waitForTimeout(40);
    if (blank.includes(k)) continue;
    const it = await p.evaluate(k => { var it = S.state.quiz.items[k]; return it.f ? it.f.map(f => f.v) : null; }, k);
    if (it) for (let j = 0; j < it.length; j++) await p.fill('#nf' + k + '_' + j, String(Number((wrong.includes(k) ? it[j] * 3 + 7 : it[j]).toPrecision(5))));
    else await p.fill('#wr' + k, wrong.includes(k) ? 'no idea' : 'A written answer of reasonable length that states the idea clearly.');
  }
  await p.locator('.qnav button').nth(n - 1).click(); await p.waitForTimeout(40);
  await tap(p, /^Submit \d/);
  if (await has(p, 'Submit anyway')) await tap(p, 'Submit anyway');
  for (let g = 0; g < 60; g++) {
    const idx = await p.evaluate(() => { var q = S.state.quiz; if (!q || q.phase !== 'self') return -1; var c = document.querySelector('main .qcard .eyebrow'); return c ? parseInt(c.textContent.replace(/\D+/g, ''), 10) - 1 : -1; });
    if (idx < 0) break;
    await p.locator('main .qcard').first().getByRole('button', { name: wrong.includes(idx) ? 'Wrong' : 'Right', exact: true }).click(); await p.waitForTimeout(50);
  }
  return p.evaluate(() => { var q = S.state.quiz; return { phase: q.phase, score: q.score, pass: q.pass, n: q.items.length, back: q.back || [], kinds: q.items.map(i => i.f ? 'N' : 'W') }; });
}
async function explain(p) {
  for (let g = 0; g < 30; g++) {
    const ta = p.locator('textarea[id^="ex"]').first(); if (!(await ta.count())) break;
    await ta.fill('I used the wrong relation. The right method is to write the governing equation and check its units first.');
    await tap(p, 'I can explain this now');
  }
}
const want = L => !only || only.includes(L);
(async () => {
  browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });

  if (want('A')) { sec = 'A';   // day one, entirely through the screen
    const p = await open();
    let t = await txt(p);
    ok(/Today’s Expedition/i.test(t) && /Read Ch 1 §1\.1/.test(t), 'home shows Today’s Expedition with a Chapter 1 reading leg');
    ok(/How the climb works/i.test(t), 'first-run explainer present');
    await p.getByRole('button', { name: /Read Ch 1/ }).first().click(); await p.waitForTimeout(900);
    ok(/§1\.1/.test(await txt(p)), 'plan leg opens the reader at §1.1');
    let marks = 0; for (let g = 0; g < 12 && await has(p, /^Mark §/); g++) { await tap(p, /^Mark §/, { wait: 700 }); marks++; }
    let s = await p.evaluate(() => ({ read: S.E.readCount(1), secs: window.CUR.chapters[0].secs.length, xp: S.state.xp, streak: S.state.streak.n, hash: location.hash, done: S.today().m }));
    ok(s.read === s.secs && marks === s.secs, 'every section of Chapter 1 marked read through the reader', s);
    ok(s.xp === 10 * s.secs && s.streak === 1, 'reading earns XP and starts the streak', s);
    ok(s.hash === '#ch-1' && s.done.includes('read1'), 'finishing the last section returns to the chapter and ticks the plan leg', s);
    await tap(p, 'Take Quiz 1', { wait: 400 });
    const firstNum = await p.evaluate(() => S.state.quiz.items.findIndex(i => i.f));
    let r = await answer(p, { wrong: [firstNum] });
    ok(r.phase === 'results' && r.pass && Math.abs(r.score - (r.n - 1) / r.n) < 1e-9, 'quiz scored: one typed miss, written answers self-checked', r);
    ok(!(await p.evaluate(() => S.E.mastered(1))), 'a pass with an unexplained miss is not yet mastery');
    ok(await p.evaluate(() => { var b = [...document.querySelectorAll('button')].find(x => x.textContent === 'I can explain this now'); return b && b.disabled; }), 'explanation button stays disabled until something is written');
    await explain(p);
    s = await p.evaluate(() => ({ m: S.E.mastered(1), open2: S.E.status(2), xp: S.state.xp, locked3: S.E.status(3) }));
    ok(s.m && s.open2 === 'open' && s.locked3 === 'locked', 'explaining the miss masters Chapter 1 and opens Chapter 2 only', s);
    ok(await has(p, /Next waypoint: Ch 2/), 'results offer the next waypoint');
    await tap(p, /Next waypoint: Ch 2/, { wait: 400 });
    ok(/Start: read §2\.1 \(p\. \d+\)/.test(await txt(p)), 'Chapter 2 Start button names the first section and its page');
    const xp = s.xp; await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => window.S && S.state); await p.waitForTimeout(300);
    ok(await p.evaluate(x => S.E.mastered(1) && S.state.xp === x, xp), 'progress survives a reload');
    await go(p, '#mountain', 700);
    const nums = await p.evaluate(() => [...document.querySelectorAll('main svg text')].map(t => t.textContent.trim()).filter(t => /^\d+$/.test(t)).map(Number));
    ok(new Set(nums).size === 54, 'mountain map draws all 54 waypoints', new Set(nums).size);
    await p.context().close();
  }

  if (want('B')) { sec = 'B';   // fail, then a retake with fresh questions
    const p = await open(); await masterAll(p, 1);
    await go(p, '#ch-2'); await tap(p, 'Take Quiz 2', { wait: 400 });
    const A = await p.evaluate(() => S.state.quiz.items.map(i => ({ q: S.E.plain(i.q), n: !!i.f })));
    const n = A.length, r1 = await answer(p, { blank: [...Array(n).keys()].slice(1), wrong: [0] });
    ok(r1.phase === 'results' && !r1.pass && !(await p.evaluate(() => S.E.mastered(2))), 'a failed quiz does not master the chapter', r1);
    ok(await p.evaluate(() => S.E.status(3) === 'locked'), 'and the next chapter stays locked');
    await tap(p, 'Retake with fresh questions', { wait: 400 });
    const B = await p.evaluate(() => S.state.quiz.items.map(i => ({ q: S.E.plain(i.q), n: !!i.f })));
    const same = B.filter(b => A.some(a => a.q === b.q)).length;
    ok(same === 0, 'retake repeats none of the first attempt’s questions word for word', { first: A.length, retake: B.length, same });
    note('retake mix', { numeric: B.filter(b => b.n).length, written: B.filter(b => !b.n).length });
    const r2 = await answer(p);
    ok(r2.pass && r2.score === 1 && await p.evaluate(() => S.E.mastered(2)), 'a clean retake masters the chapter with nothing to explain', r2);
    await p.context().close();
  }

  if (want('C')) { sec = 'C';   // challenge exam
    const p = await open(); await masterAll(p, 2);
    await go(p, '#ch-9'); ok(!(await has(p, /^Test out of Chapter/)) && /LOCKED/.test(await txt(p)), 'a locked chapter offers no challenge exam');
    await go(p, '#ch-3'); await tap(p, 'Test out of Chapter 3', { wait: 400 });
    let k = await p.evaluate(() => S.state.quiz && S.state.quiz.kind);
    ok(k === 'challenge', 'challenge exam starts from the chapter page', k);
    let r = await answer(p, { wrong: [0, 1] });
    ok(r.n === 10 && !r.pass && !(await p.evaluate(() => S.E.mastered(3))), '8 of 10 is below the 90% bar', r);
    ok(await p.evaluate(() => S.E.chalWait(3) > 11 * 36e5), 'a missed challenge starts a 12-hour cooldown');
    await p.evaluate(() => { S.state.quiz = null; S.render(); }); await go(p, '#ch-3');
    ok(/12 h|hours|again in/i.test(await txt(p)) && !(await p.evaluate(() => { var b = [...document.querySelectorAll('button')].find(x => /^Test out of Chapter 3/.test(x.textContent)); return b && !b.disabled; })), 'chapter page shows the cooldown and blocks a second try');
    await p.evaluate(() => { S.state.ch[3].chal = Date.now() - 13 * 36e5; S.render(); });
    await tap(p, 'Test out of Chapter 3', { wait: 400 });
    r = await answer(p);
    ok(r.pass && await p.evaluate(() => S.E.mastered(3) && S.E.status(4) === 'open'), 'a clean challenge masters the chapter without the reading', r);
    await p.context().close();
  }

  if (want('D')) { sec = 'D';   // erosion and review
    const p = await open(); await masterAll(p, 3);
    await p.evaluate(() => { S.state.ch[2].last = Date.now() - 40 * 864e5; S.dirty('main'); S.render(); });
    let s = await p.evaluate(() => ({ er: S.E.eroded(2), st2: S.E.status(2), st3: S.E.status(3), st4: S.E.status(4), due: S.E.due(), ig: S.E.integrity(2) }));
    ok(s.er && s.st2 === 'eroded' && s.due.includes(2), 'a neglected chapter erodes and comes due', s);
    ok(s.st3 === 'done' && s.st4 === 'open', 'erosion does not re-lock anything downstream', s);
    await go(p, '#today'); ok(/cairn crumbling/i.test(await txt(p)), 'Today flags the crumbling cairn');
    await go(p, '#ch-2'); ok(/Crumbling/i.test(await txt(p)), 'chapter page shows the crumbling state');
    await go(p, '#mountain', 600); ok(await p.evaluate(() => /crumbl|erod/i.test(document.querySelector('main').innerHTML)), 'mountain marks the eroded waypoint');
    await go(p, '#ch-4'); await tap(p, 'Take Quiz 4', { wait: 400 });
    ok(/Prerequisites are eroding/i.test(await txt(p)) && await has(p, 'Continue anyway'), 'starting dependent work warns about the eroded prerequisite and still lets you continue');
    await p.locator('.sheet').getByRole('button', { name: /^Refresh Ch 2/ }).click(); await p.waitForTimeout(400);
    let q = await p.evaluate(() => S.state.quiz && { kind: S.state.quiz.kind, ch: S.state.quiz.ch, n: S.state.quiz.items.length });
    ok(q && q.kind === 'review' && q.ch === 2 && q.n === 4, 'the warning leads straight to a 4-question review', q);
    const r = await answer(p);
    s = await p.evaluate(() => ({ er: S.E.eroded(2), ivl: S.state.ch[2].ivl, ig: S.E.integrity(2) }));
    ok(r.pass && !s.er && s.ivl > 3 && s.ig > 0.99, 'passing the review rebuilds the cairn and stretches the next interval', s);
    await p.context().close();
  }

  if (want('E')) { sec = 'E';   // a missed integrative question sends you back
    const p = await open();
    const pick = await p.evaluate(() => { var c = window.CUR.chapters.find(c => c.n > 2 && c.quiz.some(q => q.tag === 'I' && q.refs && q.refs.length)); return { n: c.n, idx: c.quiz.findIndex(q => q.tag === 'I' && q.refs && q.refs.length), refs: c.quiz.find(q => q.tag === 'I' && q.refs && q.refs.length).refs, builds: c.builds }; });
    await masterAll(p, pick.n - 1, [1, 2, 3, 4, 5, 6]);
    await go(p, '#ch-' + pick.n); await tap(p, 'Take Quiz ' + pick.n, { wait: 400 });
    if (await has(p, 'Continue anyway')) await tap(p, 'Continue anyway');
    const r = await answer(p, { wrong: [pick.idx] });
    const t = await txt(p), s = await p.evaluate(x => ({ miss: S.state.miss[x], back: S.state.quiz.back }), pick.refs[0]);
    ok(r.back.includes(pick.refs[0]) && s.miss >= 1, 'the missed [I: Ch ' + pick.refs[0] + '] question is recorded against that chapter', { pick, back: r.back });
    ok(new RegExp('Go back to Chapter ' + pick.refs[0], 'i').test(t) && await has(p, new RegExp('^Ch ' + pick.refs[0] + ' ')), 'results send you straight back to that chapter');
    await tap(p, new RegExp('^Ch ' + pick.refs[0] + ' '), { wait: 400 });
    ok((await p.evaluate(() => location.hash)) === '#ch-' + pick.refs[0], 'the button opens the chapter');
    await p.context().close();
  }

  if (want('F')) { sec = 'F';   // boss exam and gates
    const p = await open(); await masterAll(p, 14);
    let s = await p.evaluate(() => ({ u8: S.E.status(8), u15: S.E.unlocked(15), ready: S.E.bossReady(1), lock: S.E.lockText(15) }));
    ok(s.u8 === 'done' && !s.u15 && s.ready && /Boss/i.test(s.lock), 'Part II opens without a boss; Part III waits for the Basecamp Boss Exam', s);
    await go(p, '#mountain', 700);
    const camp = p.locator('main svg [aria-label*="Basecamp"]').first();
    if (await camp.count()) await camp.click({ force: true }); else await p.evaluate(() => S.campSheet(1));
    await p.waitForTimeout(300);
    await tap(p, 'Start the Boss Exam', { wait: 500 });
    if (await has(p, 'Continue anyway')) await tap(p, 'Continue anyway');
    let q = await p.evaluate(() => S.state.quiz && { kind: S.state.quiz.kind, n: S.state.quiz.items.length, chs: [...new Set(S.state.quiz.items.map(i => i.ch))].length });
    ok(q && q.kind === 'boss' && q.n === 14 && q.chs === 7, 'Basecamp Boss Exam mixes two questions from each of its seven chapters', q);
    const r = await answer(p);
    s = await p.evaluate(() => ({ passed: S.E.bossPassed(1), u15: S.E.unlocked(15), rank: S.RANKS[S.rank()].n, xp: S.state.xp }));
    ok(r.pass && s.passed && s.u15, 'passing the boss plants the flag and opens Part III', s);
    await masterAll(p, 22);
    s = await p.evaluate(() => ({ u23: S.E.unlocked(23), lock: S.E.lockText(23), ready2: S.E.bossReady(2) }));
    ok(!s.u23 && /Boss/i.test(s.lock) && s.ready2, 'Part IV waits for the Camp 1 Boss Exam', s);
    await p.context().close();
  }

  if (want('G')) { sec = 'G';   // Launch Window
    const p = await open();
    await go(p, '#launch'); ok(/LOCKED\s*—\s*Study Ch 2/i.test(await txt(p)), 'Launch Window is locked with the chapter to study named');
    await masterAll(p, 3); await go(p, '#launch');
    await p.getByRole('button', { name: '10-minute sprint on this track', exact: true }).first().click(); await p.waitForTimeout(400);
    let right = 0, lvls = [];
    for (let i = 0; i < 14; i++) {
      const c = await p.evaluate(() => { var s = S.LW.ses(); return s && s.cur ? { n: s.n, f: s.cur.f.map(f => f.v), lv: s.cur.lvl, tr: s.cur.t } : null; });
      if (!c) break; lvls.push(c.lv);
      for (let j = 0; j < c.f.length; j++) await p.fill('#nflw' + c.n + '_' + j, String(Number(c.f[j].toPrecision(6))));
      await tap(p, 'Check'); if (await p.evaluate(() => { var s = S.LW.ses(); return s && s.cur && s.cur.ok; })) right++;
      await p.locator('#lwnext').click(); await p.waitForTimeout(80);
    }
    let s = await p.evaluate(() => ({ tr: S.state.lw.tr, badges: Object.keys(S.state.lw.badges), xp: S.state.xp }));
    ok(right >= 13, 'typed correct answers are accepted (rounded to 6 figures)', { right, lvls });
    ok(Math.max(...lvls.filter(Boolean)) > Math.min(...lvls.filter(Boolean)), 'difficulty rises as answers come in right', lvls);
    ok(s.badges.length >= 1, 'a capability badge is earned', s.badges);
    for (let i = 0; i < 2; i++) { const c = await p.evaluate(() => { var s = S.LW.ses(); return { n: s.n, k: s.cur.f.length }; }); for (let j = 0; j < c.k; j++) await p.fill('#nflw' + c.n + '_' + j, '123456'); await tap(p, 'Check'); await p.locator('#lwnext').click(); await p.waitForTimeout(80); }
    await p.evaluate(() => { S.LW.ses().end = Date.now() - 1; });
    const c2 = await p.evaluate(() => { var s = S.LW.ses(); return { n: s.n, k: s.cur.f.length }; }); for (let j = 0; j < c2.k; j++) await p.fill('#nflw' + c2.n + '_' + j, '1'); await tap(p, 'Check'); await p.locator('#lwnext').click(); await p.waitForTimeout(300);
    ok(/Window closed/i.test(await txt(p)), 'the window closes when its time is up');
    ok(await p.evaluate(() => (S.today().m || []).includes('launch')), 'a completed window ticks the daily plan');
    await p.context().close();
  }

  if (want('H')) { sec = 'H';   // Hoverslam Lab in real Python
    const p = await open({ init: [PY] }); await masterAll(p, 54, [1, 2, 3, 4, 5, 6]);
    const run = async (lv, code, daily, waitFor) => {
      await go(p, '#hover-' + lv + (daily ? 'd' : ''), 300);
      await p.evaluate(c => { var ta = document.querySelector('textarea.code'); ta.value = c; ta.dispatchEvent(new Event('input')); }, code);
      const label = daily ? 'Fly today’s conditions' : 'Run';
      await tap(p, label); await p.waitForTimeout(150);
      await p.waitForFunction(l => { var x = [...document.querySelectorAll('main button.btn.go')].find(y => y.textContent.trim() === l); return x && !x.disabled; }, label, { timeout: waitFor || 70000 }).catch(() => { });
      await p.waitForTimeout(250);
    };
    const code = await p.evaluate(() => ({ sol: window.HOVER_PY.sol, start: window.HOVER_PY.start }));
    await go(p, '#hover-5'); ok(/LOCKED/.test(await txt(p)) && /§46\.1/.test(await txt(p)), 'L5 also asks for the §46.1 reading, and says so');
    await go(p, '#read-46-1', 900); await tap(p, /^Mark §46\.1/, { wait: 500 });
    for (let lv = 0; lv <= 6; lv++) { await run(lv, code.sol[lv]); const b = await p.evaluate(l => ({ best: S.state.hs.best[l], done: !!S.state.hs.done[l] }), lv); ok(b.done && b.best && b.best.s >= 60, 'L' + lv + ' reference controller lands and clears the level', b); }
    await run(2, code.start[2]); ok(await p.evaluate(() => /Not yet|fail|✗/i.test(document.querySelector('main').innerText)), 'starter code fails its checks without breaking the page');
    await run(0, 'def burn_time(:\n  pass\n'); ok(/SyntaxError|invalid syntax/i.test(await txt(p)), 'a syntax error is reported in plain sight');
    await run(0, 'while True:\n    pass\n', false, 40000); ok(/more than 25 seconds/i.test(await txt(p)), 'an endless loop is stopped instead of freezing the app');
    await run(0, code.sol[0]); ok(/Cleared|100/.test(await txt(p)), 'Python recovers after the stopped run');
    await run(3, code.sol[3], true); const d1 = await p.evaluate(() => S.state.hs.daily[S.day()]);
    await run(3, code.sol[3], true); const d2 = await p.evaluate(() => S.state.hs.daily[S.day()]);
    ok(d1 && d1.p === 1 && d2.s === d1.s && d2.fuel === d1.fuel, 'daily seeded flight is repeatable within the day and logs a personal best', { d1, d2 });
    await go(p, '#hoverslam'); ok(/best|Personal/i.test(await txt(p)), 'lab home lists personal bests');
    await p.context().close();
    const p2 = await open({ init: ["window.SUMMIT_PY_URLS = ['http://localhost:8765/nope/'];"] }); await masterAll(p2, 54, [1, 2, 3, 4, 5, 6]);
    await go(p2, '#hover-0'); await tap(p2, 'Run'); await p2.waitForFunction(() => /could not load/i.test(document.querySelector('main').innerText), null, { timeout: 30000 }).catch(() => { });
    ok(/Python could not load here/i.test(await txt(p2)), 'if Python cannot download, Hoverslam says so plainly');
    await go(p2, '#drill-gaps'); await tap(p2, 'Run the cases'); await p2.waitForFunction(() => /Check it yourself/i.test(document.querySelector('main').innerText), null, { timeout: 30000 }).catch(() => { });
    ok(/Check it yourself/i.test(await txt(p2)), 'and the interview drill falls back to self-check');
    await tap(p2, 'Mine is equivalent: mark it solved'); ok(await p2.evaluate(() => S.state.career.drills.gaps && S.state.career.drills.gaps.how === 'self'), 'self-checked drill is recorded as such');
    await p2.context().close();
  }

  if (want('I')) { sec = 'I';   // Shop Contracts
    const p = await open(); await masterAll(p, 54, [1, 2, 3, 4, 5, 6]);
    await p.evaluate(() => { S.state.shop.chk.c_tune = { t: Date.now(), note: 'uat check-in', ph: 1 }; S.state.shop.chk.c_fins = { t: Date.now(), note: 'uat check-in', ph: 1 }; S.dirty('mods'); S.render(); });
    const ids = await p.evaluate(() => window.SHOPD.ORDER);
    const cut = async (hash, code) => { await go(p, hash, 250); await p.fill('textarea.code', code); await tap(p, 'Run the cut', { wait: 500 }); };
    await go(p, '#con-slot'); await p.fill('textarea.code', 'G21 G90\n'); await p.locator('textarea.code').click(); await p.keyboard.press('Control+End');
    await p.getByRole('toolbar', { name: 'G-code keys' }).getByRole('button', { name: 'G1', exact: true }).click();
    ok((await p.inputValue('textarea.code')).endsWith('G1 '), 'the key row types into the editor');
    await cut('#con-slot', 'G21 G90\nG0 Z5\nG0 X12 Y20\nG0 Z-2\nG1 X60 F1100\n');
    ok(/program stopped at line 4/i.test(await txt(p)) && await has(p, 'Show line 4'), 'a rapid into the stock is a crash, reported with its line');
    await cut('#con-slot', 'G21 G90\nG0 Z5\nG0 X12 Y20\nG1 Z-4 F300\nG1 X68 F1100\nG0 Z5\n');
    let s = await p.evaluate(() => S.state.shop.done.slot); ok(!s && /bite/i.test(await txt(p)), 'a full-depth pass is flagged for depth of cut and does not close the contract');
    await cut('#con-rect', 'G21 G90\nG0 Z5\nG0 X20 Y18\nG1 Z-2 F300\nG1 X60 F1000\nG1 Y42\nG1 X20\nG1 Y18\nG0 Z5\n');
    ok(!(await p.evaluate(() => S.state.shop.done.rect)) && /Overcut|Left uncut/i.test(await txt(p)), 'forgetting the tool-radius offset fails on accuracy');
    for (const id of ids) { const ref = await p.evaluate(i => window.SHOPD.C[i](null).ref, id); await cut('#con-' + id, ref); const b = await p.evaluate(i => ({ done: !!S.state.shop.done[i], best: S.state.shop.best[i] }), id); ok(b.done && b.best && b.best.s === 100, id + ': the reference toolpath closes the contract at par', b); }
    ok(await has(p, 'Video outline'), 'a closed contract offers its video outline');
    const dref = await p.evaluate(() => S.SHOP.specOf('daily').ref); await cut('#con-daily', dref);
    ok(await p.evaluate(() => { var d = S.state.shop.daily[S.day()]; return d && d.p === 1 && (S.today().m || []).includes('shop'); }), 'daily seeded contract closes and ticks the plan');
    for (const kind of ['fs', 'setup', 'rigid']) {
      await p.evaluate(() => { location.hash = '#shop'; }); await go(p, '#shopq-' + kind); await tap(p, /^Start the check$|^Drill again$/, { wait: 200 });
      for (let i = 0; i < 5; i++) { const c = await p.evaluate(() => { var q = S.SHOP.qs(); return { n: q.n, f: q.cur.f.map(f => f.v) }; }); for (let j = 0; j < c.f.length; j++) await p.fill('#nfsq' + c.n + '_' + j, String(Number(c.f[j].toPrecision(5)))); await tap(p, 'Check'); if (i < 4) await tap(p, 'Next'); }
      ok(/Check passed/i.test(await txt(p)) && await p.evaluate(k => !!S.state.shop.done['q_' + k], kind), kind + ' check: five typed answers pass it');
    }
    await go(p, '#shopq-fs'); await p.evaluate(() => { }); await tap(p, /^Drill again$/, { wait: 200 });
    for (let i = 0; i < 5; i++) { await tap(p, 'Check'); if (i < 4) await tap(p, 'Next'); }
    ok(/Not yet/i.test(await txt(p)), 'blank answers fail the check');
    s = await p.evaluate(() => ({ tiers: S.SHOP.NODES.map(n => S.SHOP.nodeOpen(n)), nd: Object.keys(S.state.shop.nd || {}).length }));
    ok(s.tiers.every(Boolean), 'all seven tiers open once chapters and check-ins are in', s);
    await p.context().close();
  }

  if (want('J')) { sec = 'J';   // Hire Me Mission
    const p = await open({ init: [PY] });
    await go(p, '#career'); let t = await txt(p);
    ok(/open from the start/i.test(t) && /LOCKED\s*—\s*Study Ch 13/i.test(t), 'first contract type is open on day one; the rest name their chapters');
    await go(p, '#job-nasa-met'); await tap(p, 'Accept: start the week', { wait: 300 });
    const xp0 = await p.evaluate(() => S.state.xp);
    for (let i = 0; i < 3; i++) { await p.locator('main button.item', { hasText: 'Read the brief twice' }).click(); await p.waitForTimeout(150); }
    ok(await p.evaluate(x => S.state.xp === x + 15 && S.state.career.con['nasa-met'].steps[0] === 1, xp0), 'ticking a session pays its XP once, however often it is toggled');
    await tap(p, 'Ship it'); ok(/does not look like/i.test(await txt(p)), 'shipping without a link is refused');
    await p.fill('input[aria-label="Repository link"]', 'https://github.com/example/nasa-met'); await tap(p, 'Ship it');
    ok(/Tick every line/i.test(await txt(p)) && !(await p.evaluate(() => S.state.career.con['nasa-met'].done)), 'shipping with the definition of done unticked is refused');
    await go(p, '#job-nasa-fire'); ok(/already have/i.test(await txt(p)) && await has(p, 'Switch to this one'), 'one contract at a time: a second one offers a switch');
    await go(p, '#job-nasa-met');
    for (let i = 0; i < 6; i++) await p.locator('main .card', { hasText: 'Definition of done' }).locator('button.item').nth(i).click();
    await p.fill('input[aria-label="Repository link"]', 'https://github.com/example/nasa-met'); await tap(p, 'Ship it', { wait: 300 });
    let s = await p.evaluate(() => ({ done: !!S.state.career.con['nasa-met'].done, rd: S.CAREER.readiness() }));
    ok(s.done && s.rd.n === 1 && s.rd.stage === 'warm', 'a shipped piece lands in the portfolio and moves the readiness meter', { total: s.rd.total, stage: s.rd.stage });
    await go(p, '#career'); ok(/github\.com\/example\/nasa-met/.test(await txt(p)) && /Space data portfolio/.test(await p.inputValue('textarea[aria-label="Portfolio index in Markdown"]')), 'portfolio lists the repository and builds a Markdown index');
    const drills = await p.evaluate(() => window.DRILLS.map(d => ({ id: d.id, sol: d.sol, start: d.start })));
    await go(p, '#drill-' + drills[1].id); await tap(p, 'Run the cases'); await p.waitForFunction(() => /Not yet|All cases pass|stopped/i.test(document.querySelector('main').innerText), null, { timeout: 60000 }).catch(() => { });
    ok(/Not yet/i.test(await txt(p)) && !(await p.evaluate(i => S.state.career.drills[i] && S.state.career.drills[i].p, drills[1].id)), 'starter code runs in Python and fails its cases');
    for (const d of drills) { await go(p, '#drill-' + d.id, 200); await p.evaluate(c => { var ta = document.querySelector('textarea.code'); ta.value = c; ta.dispatchEvent(new Event('input')); }, d.sol); await tap(p, 'Run the cases'); await p.waitForFunction(i => S.state.career.drills[i] && S.state.career.drills[i].p, d.id, { timeout: 30000 }).catch(() => { }); ok(await p.evaluate(i => !!(S.state.career.drills[i] && S.state.career.drills[i].p && S.state.career.drills[i].how === 'run'), d.id), 'drill ' + d.id + ': reference solution passes every case in the browser'); }
    s = await p.evaluate(() => S.CAREER.readiness()); ok(s.np === 16 && Math.abs(s.drill - 1) < 1e-9, 'readiness counts all sixteen drills', { np: s.np, total: s.total });
    await p.context().close();
  }

  if (want('K')) { sec = 'K';   // daily plan mix and weekly recap
    const p = await open(); await masterAll(p, 7, [1]);
    await p.evaluate(() => { S.state.ch[2].last = Date.now() - 40 * 864e5; S.state.plan = null; S.dirty('main'); S.render(); });
    const plans = {};
    for (const [label, mins] of [['30 min', 30], ['1 hour', 60], ['2+ hours', 120]]) {
      await go(p, '#today'); await tap(p, label, { wait: 250 });
      const items = await p.evaluate(() => S.state.plan.items.map(i => ({ id: i.id, m: i.m })));
      plans[mins] = items.map(i => i.id + ':' + i.m).join(' ');
      const ids = items.map(i => i.id);
      ok(ids.some(i => /^review2$/.test(i)), mins + ' min plan includes the due review', ids);
      ok(ids.some(i => /^(read|quiz)8$/.test(i)), mins + ' min plan includes the next chapter', ids);
      const nm = ids.filter(i => ['launch', 'hover', 'shop'].includes(i)).length, nt = ids.filter(i => ['career', 'shoptask'].includes(i)).length, tot = items.reduce((a, i) => a + i.m, 0);
      ok(mins < 120 ? nm === 1 : nm === 2, mins + ' min plan has ' + (mins < 120 ? 'one module challenge' : 'two module challenges'), ids);
      ok(mins < 120 ? nt === 1 : nt >= 1, mins + ' min plan has a shop or career task', ids);
      ok(tot <= mins * 1.1 && (mins < 120 || tot >= 60), mins + ' min plan fits the time chosen', tot);
    }
    note('plans', plans);
    ok(/Read Ch 8 §8\.1/.test(await txt(p)) && /pp?\. \d+/.test(await txt(p)), 'the reading leg names sections and pages');
    await p.evaluate(() => { S.trackStart('read'); }); await p.waitForTimeout(3600); await p.evaluate(() => { S.trackStop(); });
    await go(p, '#recap'); const t = await txt(p);
    ok(/Chapters mastered/i.test(t) && /Time on task/i.test(t) && /Weakest prerequisites/i.test(t) && /What to study next, and why/i.test(t), 'weekly recap has its four parts');
    ok(/integrity \d+%/.test(t) && /Mastering it/.test(t), 'recap names the weakest prerequisite and gives a reason for what is next');
    const wk = await p.evaluate(() => { var ws = S.weekStart(), n = 0; for (var k in S.state.ch) { var r = S.state.ch[k]; if (r.st === 2 && S.day(r.at) >= ws) n++; } return n; }).catch(() => null);
    note('recap sample', t.replace(/\s+/g, ' ').slice(0, 420));
    await p.context().close();
  }

  if (want('L')) { sec = 'L';   // backup round trip through the screen
    const p = await open(); await masterAll(p, 5);
    const before = await p.evaluate(() => ({ xp: S.state.xp, m: S.E.masteredCount() }));
    await go(p, '#pack');
    let text;
    if (await p.evaluate(() => !!S.dl)) {   // outside Claude (web.js): Export is an ordinary browser download
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }), tap(p, 'Export JSON', { wait: 200 })]);
      text = require('fs').readFileSync(await dl.path(), 'utf8'); ok(/^summit-backup-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()), 'export downloads a dated file', dl.suggestedFilename());
    } else { await tap(p, 'Export JSON', { wait: 200 }); text = await p.inputValue('#bk'); }
    ok(text.length > 500 && JSON.parse(text).app === 'SUMMIT', 'export produces a JSON backup');
    await tap(p, 'Erase all progress', { wait: 250 });
    const danger = p.locator('.sheet .btn.danger').first(); ok(await danger.count() === 1, 'erasing asks for confirmation'); await danger.click(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => S.state.xp === 0 && S.E.masteredCount() === 0), 'erase clears the progress');
    await go(p, '#pack'); await p.locator('summary', { hasText: 'Restore from pasted text' }).click(); await p.fill('#bkpaste', text); await tap(p, 'Restore from this text', { wait: 250 }); await tap(p, 'Restore the backup', { wait: 300 });
    ok(await p.evaluate(b => S.state.xp === b.xp && S.E.masteredCount() === b.m, before), 'import restores the progress exactly', before);
    await p.fill('#bkpaste', '{"not":"a backup"}').catch(async () => { await go(p, '#pack'); await p.locator('summary', { hasText: 'Restore from pasted text' }).click(); await p.fill('#bkpaste', '{"not":"a backup"}'); });
    await tap(p, 'Restore from this text', { wait: 250 }); await tap(p, 'Restore the backup', { wait: 300 });
    ok(await p.evaluate(b => S.state.xp === b.xp, before), 'a file that is not a backup is refused and changes nothing');
    await p.context().close();
  }

  if (want('M')) { sec = 'M';   // streak and fuel cells across days
    const p = await open({ init: [CLOCK] }); await masterAll(p, 1);
    const act = () => p.evaluate(() => { S.addXP(1, ''); document.querySelectorAll('.toasts > *').forEach(e => e.remove()); return { n: S.state.streak.n, fuel: S.state.streak.fuel, last: S.state.streak.last, day: S.day() }; });
    const next = async d => { await p.evaluate(x => { window.__addDays(x); S.render(); }, d); await go(p, '#today', 150); };
    let s = await act(); ok(s.n === 1 && s.fuel === 2, 'day 1 starts a streak with two fuel cells', s);
    await next(1); s = await act(); ok(s.n === 2 && s.fuel === 2, 'next day extends it', s);
    await next(3); ok(/2 launch windows missed/i.test(await txt(p)), 'Today warns that two windows were missed and fuel will cover them');
    s = await act(); ok(s.n === 3 && s.fuel === 0, 'two missed days burn two fuel cells and keep the streak', s);
    await next(2); ok(/new streak starts today/i.test(await txt(p)), 'with no fuel left a missed day ends the streak');
    s = await act(); ok(s.n === 1 && s.fuel === 0, 'streak restarts at one', s);
    for (let i = 0; i < 6; i++) { await next(1); s = await act(); }
    ok(s.n === 7 && s.fuel === 1, 'seven days straight earns a fuel cell back', s);
    await p.context().close();
  }

  if (want('N')) { sec = 'N';   // layout and accessibility sweep
    const routes = ['#today', '#mountain', '#ch-1', '#read-1-2', '#quiz', '#train', '#launch', '#hoverslam', '#hover-0', '#hover-6', '#shop', '#con-karman', '#shopq-fs', '#career', '#job-nasa-met', '#drill-knap', '#recap', '#pack', '#graph', '#ap-I', '#ap-J'];
    for (const w of [360, 390, 768, 1280]) {
      const p = await open({ w, h: w < 700 ? 780 : 900 }); await masterAll(p, 54, [1, 2, 3, 4, 5, 6]);
      await p.evaluate(() => { S.state.ch[9].last = Date.now() - 60 * 864e5; S.E.start('quiz', 9); }); await p.waitForTimeout(200); if (await has(p, 'Discard it and start')) await tap(p, 'Discard it and start');
      const bad = [], unl = [], small = [];
      for (const r of routes) {
        await go(p, r, r === '#read-1-2' || /^#ap/.test(r) ? 800 : 260);
        const o = await p.evaluate(() => {
          var vw = window.innerWidth, main = document.querySelector('main'), over = [];
          var skip = function (e) { if (e.closest('.katex-mathml')) return true; for (var x = e; x && x !== main; x = x.parentElement) { var s = getComputedStyle(x); if (/(auto|scroll)/.test(s.overflowX) || x.tagName === 'svg' || x.tagName === 'TEXTAREA' || x.tagName === 'PRE') return true; } return false; };
          [].forEach.call(main.querySelectorAll('*'), function (e) { var r = e.getBoundingClientRect(); if (r.width > 0 && r.right > vw + 1.5 && !skip(e)) over.push(e.tagName + '.' + String(e.className && e.className.baseVal != null ? e.className.baseVal : e.className).slice(0, 30) + ':' + Math.round(r.right - vw)); });
          var un = []; [].forEach.call(document.querySelectorAll('button, a[href]'), function (b) { if (!b.textContent.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title')) un.push(b.outerHTML.slice(0, 80)); });
          [].forEach.call(document.querySelectorAll('input:not([type=hidden]), textarea, select'), function (i) { var lab = i.getAttribute('aria-label') || (i.id && document.querySelector('label[for="' + i.id + '"]')) || i.closest('label'); if (!lab) un.push(i.outerHTML.slice(0, 90)); });
          [].forEach.call(document.querySelectorAll('img'), function (i) { if (!i.hasAttribute('alt')) un.push(i.outerHTML.slice(0, 60)); });
          var small = [].filter.call(document.querySelectorAll('main button'), function (b) { var r = b.getBoundingClientRect(); return r.width > 0 && r.height < 38 && !b.classList.contains('k'); }).map(function (b) { return b.textContent.trim().slice(0, 18) + ':' + Math.round(b.getBoundingClientRect().height); });
          return { sw: document.documentElement.scrollWidth, vw: vw, over: over.slice(0, 4), un: un.slice(0, 4), small: small.slice(0, 5) };
        });
        if (o.sw > o.vw + 1 || o.over.length) bad.push(r + ' ' + JSON.stringify(o.over) + ' sw' + o.sw);
        if (o.un.length) unl.push(r + ' ' + JSON.stringify(o.un));
        if (w === 390 && o.small.length) small.push(r + ' ' + o.small.join(','));
      }
      ok(!bad.length, 'no sideways overflow at ' + w + ' px on ' + routes.length + ' screens', bad.slice(0, 5));
      ok(!unl.length, 'every control has a name at ' + w + ' px', unl.slice(0, 5));
      if (w === 390) ok(!small.length, 'tap targets are at least 38 px tall', small.slice(0, 8));
      if (w === 1280 || w === 768) await p.screenshot({ path: '/home/claude/work/shots/uat_' + w + '.png' });
      await p.context().close();
    }
    const p = await open();
    const cr = await p.evaluate(() => { function lum(h) { var c = [1, 3, 5].map(function (i) { var v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; } function cr(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); } var g = function (v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); };
      return { 'snow/night': cr(g('--snow'), g('--night')), 'snow/slate': cr(g('--snow'), g('--slate')), 'scree/slate': cr(g('--scree'), g('--slate')), 'scree/night': cr(g('--scree'), g('--night')), 'night/glow': cr(g('--night'), g('--glow')), 'ice/slate': cr(g('--ice'), g('--slate')), 'amber/slate': cr(g('--amber'), g('--slate')), 'moss/slate': cr(g('--moss'), g('--slate')), 'red/slate': cr(g('--red'), g('--slate')) }; });
    ok(Object.values(cr).every(v => v >= 4.5), 'text colour pairs meet 4.5:1 contrast', Object.fromEntries(Object.entries(cr).map(([k, v]) => [k, +v.toFixed(1)])));
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
    ok(await p.evaluate(() => { var a = document.activeElement; if (!a || a === document.body) return false; var s = getComputedStyle(a); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 1; }), 'keyboard focus is visible');
    await p.context().close();
  }

  if (want('O')) { sec = 'O';   // every equation in the doc renders
    const p = await open();
    const r = await p.evaluate(async () => { var out = { secs: 0, math: 0, err: 0, raw: 0, quiz: 0, qerr: 0 }, keys = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'ax'];
      for (var i = 0; i < keys.length; i++) { var d = await S.loadRead(keys[i]), htmls = []; if (d.ch) Object.keys(d.ch).forEach(function (n) { htmls.push(d.ch[n].intro || ''); Object.keys(d.ch[n].secs).forEach(function (k) { htmls.push(d.ch[n].secs[k]); }); }); if (d.ap) Object.keys(d.ap).forEach(function (k) { d.ap[k].forEach(function (s) { htmls.push(s.html); }); }); if (d.pre) d.pre.forEach(function (s) { htmls.push(s.html); });
        htmls.forEach(function (h) { var el = document.createElement('div'); el.innerHTML = h; var m = el.querySelectorAll('span.mi, span.md').length; S.math(el); out.secs++; out.math += m; out.err += el.querySelectorAll('.katex-error').length; out.raw += [].filter.call(el.querySelectorAll('span.mi, span.md'), function (s) { return !s.querySelector('.katex'); }).length; }); }
      window.CUR.chapters.forEach(function (c) { c.quiz.forEach(function (q) { var el = document.createElement('div'); el.innerHTML = q.q + q.a; S.math(el); out.quiz++; out.qerr += el.querySelectorAll('.katex-error').length + [].filter.call(el.querySelectorAll('span.mi, span.md'), function (s) { return !s.querySelector('.katex'); }).length; }); });
      return out; });
    ok(r.err === 0 && r.raw === 0 && r.math > 2500, 'all reading maths renders', r);
    ok(r.quiz === 429 && r.qerr === 0, 'all 429 quiz questions and answer keys render', r);
    const s = await p.evaluate(() => { var C = window.CUR, bad = []; C.chapters.forEach(function (c) { if (!c.secs.length || !c.quiz.length || !c.goals || !c.page) bad.push(c.n); c.quiz.forEach(function (q) { if (!q.a || q.a.length < 5) bad.push(c.n + 'q' + q.n); }); if (c.n > 1) { var t = S.E.lockText(c.n); if (!S.E.mastered(c.n) && !S.E.unlocked(c.n) && !/LOCKED|Study Ch \d+ \([^)]*§/.test(t)) bad.push('lock' + c.n); } }); return { bad: bad, n: C.chapters.length, secs: C.chapters.reduce(function (a, c) { return a + c.secs.length; }, 0), sample: S.E.lockText(11) }; });
    ok(s.n === 54 && !s.bad.length, 'every chapter has sections, goals, a page, a quiz and an answer for every question', s);
    ok(/Study Ch 8 \(Calculus, §8\.1–8\.\d+\) and Ch 10 \(Linear Algebra, §10\.1–10\.\d+\), then pass Quiz 8 and Quiz 10 at ≥80%/.test(s.sample), 'lock text follows the wording you specified', s.sample);
    await p.context().close();
  }

  if (want('P')) { sec = 'P';   // things going wrong
    let blocked = true;
    const p = await open({ route: async page => { await page.route('**/data/read1.js', r => blocked ? r.abort() : r.continue()); } });
    await go(p, '#read-1-1', 900); ok(await has(p, 'Try again') && /could not be loaded/i.test(await txt(p)), 'a reading that fails to download says so and offers a retry');
    blocked = false; await tap(p, 'Try again', { wait: 900 }); ok(/§1\.1/.test(await txt(p)) && !(await has(p, 'Try again')), 'retry loads the section once the network is back');
    await go(p, '#nonsense-route'); ok(/Today’s Expedition/i.test(await txt(p)), 'an unknown address falls back to Today');
    await go(p, '#read-99-9'); ok((await txt(p)).length > 40, 'a bad section address does not crash');
    await go(p, '#ch-999'); await go(p, '#hover-42'); await go(p, '#con-zzz'); await go(p, '#drill-zzz'); await go(p, '#job-zzz'); await go(p, '#ap-ZZ', 500);
    ok(true, 'bad deep links handled');
    await p.context().close();
    const p2 = await open({ init: ["try { localStorage.setItem('summit.v1', '{broken json'); } catch (e) {}"] });
    ok(await p2.evaluate(() => S.state.xp === 0 && !!document.querySelector('main').innerText), 'corrupted saved data starts clean instead of crashing'); await p2.context().close();
    const p3 = await open({ init: ["Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); };"] });
    await p3.evaluate(() => { S.E.master(1, 'quiz'); S.dirty('main'); }); await go(p3, '#mountain', 500);
    ok(await p3.evaluate(() => S.E.mastered(1)), 'the app keeps working when browser storage refuses writes'); await p3.context().close();
    const p4 = await open({ init: ["Object.defineProperty(window, 'localStorage', { get: function () { throw new Error('SecurityError'); } });"] });
    ok(await p4.evaluate(() => !!S.state && document.querySelector('main').innerText.length > 50), 'and when browser storage is blocked outright'); await p4.context().close();
  }

  console.log('--- ' + Object.keys(tally).sort().map(k => k + ' ' + tally[k][0] + '/' + (tally[k][0] + tally[k][1])).join('  '));
  console.log(errs.length ? 'PAGE ERRORS (' + errs.length + '):\n' + [...new Set(errs)].slice(0, 12).join('\n') : 'no page errors');
  const total = Object.values(tally).reduce((a, t) => [a[0] + t[0], a[1] + t[1]], [0, 0]);
  console.log((fails.length || errs.length ? 'UAT FAILED ' : 'UAT PASSED ') + total[0] + ' of ' + (total[0] + total[1]) + ' checks');
  await browser.close(); process.exit(fails.length || errs.length ? 1 : 0);
})().catch(async e => { console.log(sec + ' CRASH ' + String(e.stack || e).slice(0, 900)); console.log('--- ' + Object.keys(tally).sort().map(k => k + ' ' + tally[k][0] + '/' + (tally[k][0] + tally[k][1])).join('  ')); try { await browser.close(); } catch (x) { } process.exit(2); });
