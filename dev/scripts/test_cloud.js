// Integration test of account sync, Claude grading and backup against the runtime test double.
// usage: node test_cloud.js <baseUrl>   (mock_cloud.js must be running on 8766)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const base = process.argv[2], CLOUD = 'http://localhost:8766/';
let fails = 0;
const ok = (c, msg, extra) => { console.log((c ? '  ok   ' : '  FAIL ') + msg + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); if (!c) fails++; };
const dump = async () => (await fetch(CLOUD + 'dump')).json();
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await fetch(CLOUD + 'reset');
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  async function device(name, pre) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(name + ' PAGEERROR ' + String(e.stack || e).slice(0, 500)));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(name + ' console: ' + m.text().slice(0, 300)); });
    if (pre) await page.addInitScript(pre);
    await page.addInitScript({ path: '/tmp/init_cloud.js' });
    await page.goto(base, { waitUntil: 'load' });
    return { ctx, page };
  }
  const reply = `window.__sampleReply = function (p) {
    var m = p.match(/Items:\\n([\\s\\S]*)$/);
    if (/grading closed-book quiz answers/.test(p)) return JSON.parse(m[1]).map(function (it) { return { id: it.id, credit: it.student_answer.length > 20 ? 1 : 0, feedback: 'Mock: fine.' }; });
    if (/missed these quiz items/.test(p)) return JSON.parse(m[1]).map(function (it) { return { id: it.id, ok: it.explanation.length > 25, feedback: 'Mock: that is the right idea.' }; });
    if (/Write 4 fresh/.test(p)) return [1,2,3,4].map(function (i) { return { tag: i === 1 ? 'I' : 'C', ref: null, q: 'Mock fresh question number ' + i + ' about the chapter?', a: 'A model answer of adequate length.' }; });
    return null; };`;

  console.log('A. one device: cloud mode, Claude grading, explain-the-miss, save');
  const A = await device('A', reply);
  await A.page.waitForFunction(() => window.S && S.sync.ready, null, { timeout: 8000 });
  ok(await A.page.evaluate(() => S.sync.mode === 'cloud' && S.ai.st === 'ok' && !!S.dl), 'capabilities resolved: cloud, Claude, downloads');
  await A.page.evaluate(() => { S.E.start('quiz', 1); });
  await A.page.waitForTimeout(400);
  const info = await A.page.evaluate(() => {
    var q = S.state.quiz, firstNum = true, nNum = 0, nTxt = 0;
    q.items.forEach(function (it) { if (it.f) { nNum++; it.ans.f = it.f.map(function (f) { return String(firstNum ? f.v * 3 + 1 : f.v); }); firstNum = false; } else { nTxt++; it.ans.t = 'A written answer that is long enough for the mock grader to accept it.'; } });
    q.i = q.items.length - 1; S.dirty('main'); S.render(); return { n: q.items.length, nNum, nTxt };
  });
  console.log('     quiz 1 items', info);
  await A.page.getByRole('button', { name: /^Submit/ }).first().click();
  await A.page.waitForFunction(() => S.state.quiz && S.state.quiz.phase !== 'answer' && S.state.quiz.phase !== 'self', null, { timeout: 8000 });
  let st = await A.page.evaluate(() => ({ score: S.state.quiz.score, pass: S.state.quiz.pass, phase: S.state.quiz.phase, by: S.state.quiz.items.map(i => i.res && i.res.by), mastered: S.E.mastered(1), prompts: window.__calls.sample.length }));
  ok(st.pass && !st.mastered && st.by.indexOf('ai') >= 0, 'written answers graded by Claude; passed but not yet mastered (one miss to explain)', st);
  await A.page.locator('textarea[id^="ex"]').first().fill('I tripled the value by mistake. The right method is to carry the units through and convert once.');
  await A.page.getByRole('button', { name: 'Check my explanations' }).click();
  await A.page.waitForFunction(() => S.E.mastered(1), null, { timeout: 8000 });
  ok(true, 'explanation accepted by Claude, Chapter 1 mastered');
  await A.page.waitForFunction(() => !Object.keys(S.sync.dirty).length && !S.sync.busy, null, { timeout: 9000 });
  let d = await dump();
  const main = d.docs['data/users/u_test1/main'];
  ok(main && main.ch && main.ch['1'] && main.ch['1'].st === 2 && main.xp > 0, 'account copy holds the mastery and XP', main && { xp: main.xp, ch1: main.ch['1'] && main.ch['1'].st });
  ok(Object.keys(d.docs).every(k => k.startsWith('data/users/u_test1/')), 'every document is inside the private per-user subtree', Object.keys(d.docs));
  await A.page.evaluate(() => { location.hash = '#pack'; });
  await A.page.waitForTimeout(400);
  await A.page.getByRole('button', { name: 'Export JSON' }).click();
  await A.page.waitForTimeout(300);
  const saves = await A.page.evaluate(() => window.__calls.save);
  ok(saves.length === 1 && /^summit-backup-\d{4}-\d\d-\d\d\.json$/.test(saves[0].filename) && saves[0].size > 500, 'backup offered through the downloads capability', saves);
  const backup = await A.page.evaluate(() => S.exportJSON());

  console.log('B. second device, same account');
  const B = await device('B', reply);
  await B.page.waitForFunction(() => window.S && S.sync.ready, null, { timeout: 8000 });
  ok(await B.page.evaluate(() => S.E.mastered(1) && S.state.xp > 0), 'a fresh browser loads the progress from the account');
  await B.page.evaluate(() => { S.E.master(2, 'quiz'); S.dirty('main', 'log'); });
  await B.page.waitForFunction(() => !Object.keys(S.sync.dirty).length && !S.sync.busy, null, { timeout: 9000 });
  console.log('   stale tab on device A now makes progress without having seen B\'s');
  await A.page.evaluate(() => { S.sync.fresh = 0; S.E.master(3, 'quiz'); S.state.shop.done.slot = 123; S.dirty('main', 'mods', 'log'); });
  await A.page.waitForFunction(() => !Object.keys(S.sync.dirty).length && !S.sync.busy, null, { timeout: 9000 });
  d = await dump();
  let m2 = d.docs['data/users/u_test1/main'];
  ok([1, 2, 3].every(n => m2.ch[n] && m2.ch[n].st === 2), 'the stale tab merged instead of overwriting: chapters 1, 2 and 3 all mastered in the account', Object.keys(m2.ch));
  ok(await A.page.evaluate(() => S.E.mastered(2)), 'device A picked up chapter 2 in the merge');
  await B.page.evaluate(() => { S.sync.minPull = 0; window.dispatchEvent(new Event('focus')); });
  await B.page.waitForFunction(() => S.E.mastered(3), null, { timeout: 8000 });
  ok(await B.page.evaluate(() => S.state.shop.done.slot === 123), 'device B refreshed on focus and adopted the newer copy');

  console.log('C. brand-new device makes a change before the account answers');
  const C = await device('C', 'window.__capDelay = 1500;');
  await C.page.waitForFunction(() => window.S && S.state, null, { timeout: 5000 });
  await C.page.evaluate(() => { S.state.prefs.mins = 60; S.dirty('main'); S.trackStart('read'); });
  await C.page.waitForFunction(() => S.sync.ready, null, { timeout: 9000 });
  await C.page.waitForFunction(() => !Object.keys(S.sync.dirty).length && !S.sync.busy, null, { timeout: 9000 });
  d = await dump(); m2 = d.docs['data/users/u_test1/main'];
  ok([1, 2, 3].every(n => m2.ch[n] && m2.ch[n].st === 2) && m2.xp >= main.xp, 'an early change on an empty device did not wipe the account', { xp: m2.xp, mins: m2.prefs.mins });
  ok(await C.page.evaluate(() => S.E.mastered(3) && S.state.prefs.mins === 60), 'and the device ended up with both the account progress and its own change');

  console.log('D. oversized question cache is trimmed, not rejected');
  await A.page.evaluate(() => { for (var n = 1; n <= 54; n++) { S.state.aiq[n] = []; for (var i = 0; i < 16; i++) S.state.aiq[n].push({ tag: 'C', ref: null, q: 'q'.repeat(900), a: 'a'.repeat(1200), used: 0 }); } S.dirty('aiq'); });
  await A.page.waitForFunction(() => !Object.keys(S.sync.dirty).length && !S.sync.busy, null, { timeout: 9000 });
  d = await dump();
  ok(!d.log.some(l => /^REJECT/.test(l)) && JSON.stringify(d.docs['data/users/u_test1/aiq']).length < 256 * 1024, 'aiq document stays under 256 KiB', { bytes: JSON.stringify(d.docs['data/users/u_test1/aiq']).length, err: await A.page.evaluate(() => S.sync.err) });

  console.log('E. Claude refused: grading falls back to self-check');
  const E = await device('E', 'window.__sampleFail = "not_granted"; window.__uid = "u_other";');
  await E.page.waitForFunction(() => window.S && S.sync.ready, null, { timeout: 8000 });
  ok(await E.page.evaluate(() => !S.E.mastered(1)), 'a different account sees none of the first account\'s progress');
  await E.page.evaluate(() => { S.E.start('quiz', 1); });
  await E.page.waitForTimeout(300);
  await E.page.evaluate(() => { var q = S.state.quiz; q.items.forEach(function (it) { if (it.f) it.ans.f = it.f.map(function (f) { return String(f.v); }); else it.ans.t = 'Some written answer of reasonable length here.'; }); q.i = q.items.length - 1; S.render(); });
  await E.page.getByRole('button', { name: /^Submit/ }).first().click();
  await E.page.waitForTimeout(900);
  st = await E.page.evaluate(() => ({ phase: S.state.quiz.phase, ai: S.ai.st, on: S.ai.on(), heading: (document.querySelector('main h2') || {}).textContent }));
  ok(st.phase === 'self' && st.ai === 'off' && /Check your written answers/.test(st.heading), 'self-check screen shown, Claude switched off for the visit', st);

  console.log('F. no capabilities at all: local-only mode, text backup, restore');
  const F = await device('F', 'window.__noCaps = true;');
  await F.page.waitForTimeout(700);
  ok(await F.page.evaluate(() => S.sync.mode === 'local' && S.ai.st === 'none' && !S.dl), 'runs local-only without the runtime');
  await F.page.evaluate(() => { location.hash = '#pack'; });
  await F.page.waitForTimeout(300);
  await F.page.getByRole('button', { name: 'Export JSON' }).click();
  await F.page.waitForTimeout(200);
  ok(await F.page.evaluate(() => { var a = document.getElementById('bk'); return !a.classList.contains('hide') && a.value.indexOf('"app": "SUMMIT"') >= 0; }), 'export falls back to copyable text');
  await F.page.evaluate(t => { S.importJSON(t); }, backup);
  ok(await F.page.evaluate(() => S.E.mastered(1) && S.state.xp > 0), 'a backup from device A restores on device F');
  await F.page.reload({ waitUntil: 'load' }); await F.page.waitForTimeout(500);
  ok(await F.page.evaluate(() => S.E.mastered(1)), 'and survives a reload from this browser\'s own storage');

  console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(fails ? 'FAILED ' + fails : 'ALL CLOUD TESTS PASSED');
  const dd = await dump(); console.log('store ops:', dd.log.length, 'docs:', Object.keys(dd.docs).map(k => k.split('/').slice(2).join('/') + ':' + JSON.stringify(dd.docs[k]).length).join('  '));
  await browser.close(); process.exit(fails || errs.length ? 1 : 0);
})().catch(e => { console.error('TEST CRASH', e); process.exit(2); });
