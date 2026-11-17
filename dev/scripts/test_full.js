// Whole-app smoke test: every screen with everything unlocked, plus the shop check-in and video outline sheets.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const base = process.argv[2], out = process.argv[3];
let fails = 0; const ok = (c, m, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + String(e.stack || e).slice(0, 700)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript({ path: '/tmp/init_py.js' });
  await page.addInitScript({ path: '/tmp/init_cloud.js' });
  await fetch('http://localhost:8766/reset');
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => window.S && S.sync.ready, null, { timeout: 8000 });
  const shot = n => page.screenshot({ path: path.join(out, n + '.png') });
  const junk = async (where) => { const t = await page.evaluate(() => document.getElementById('app').innerText); const m = t.match(/(^|[^A-Za-z])(null|undefined|NaN)([^A-Za-z]|$)|\[object /); if (m) { const i = t.indexOf(m[0]); ok(false, where + ' leaks a raw value', t.slice(Math.max(0, i - 70), i + 50).replace(/\s+/g, ' ')); } };
  const go = async (h, w) => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(w || 350); await junk(h); };
  // locked state first: every module names what to study
  for (const h of ['#train', '#launch', '#hoverslam', '#shop', '#career', '#hover-3', '#con-ring', '#job-fsw-pipe', '#shopq-rigid', '#mountain', '#ch-9', '#graph', '#recap', '#pack']) {
    await go(h);
    const t = await page.evaluate(() => document.querySelector('main').innerText);
    if (['#hover-3', '#con-ring', '#job-fsw-pipe', '#shopq-rigid', '#ch-9'].includes(h)) ok(/LOCKED\s*—\s*Study Ch \d+/i.test(t) && /Quiz \d+/.test(t), h + ' shows a LOCKED line naming chapters and quizzes', (t.match(/LOCKED[^\n]*\n?[^\n]*/i) || [''])[0].replace(/\s+/g, ' ').slice(0, 150));
  }
  await go('#ch-9'); await shot('lock_ch9');
  await go('#con-ring'); await shot('lock_con_ring');
  // unlock everything
  await page.evaluate(() => { for (var n = 1; n <= 54; n++) S.E.master(n, 'quiz'); for (var p = 1; p <= 6; p++) S.state.boss[p] = { tries: 1, best: 0.9, at: Date.now() }; S.dirty('main', 'log'); S.render(); });
  await page.waitForTimeout(600);
  await page.evaluate(() => { document.querySelectorAll('.toasts > *').forEach(function (e) { e.remove(); }); });
  const secs = await page.evaluate(() => window.CUR.chapters.filter(c => [1, 8, 20, 31, 46, 54].includes(c.n)).map(c => S.readHash(c.secs[Math.min(1, c.secs.length - 1)].id)));
  for (const h of secs) { await go('#' + h.replace(/^#/, ''), 700); }
  for (const h of ['#today', '#mountain', '#train', '#launch', '#hoverslam', '#hover-0', '#hover-6', '#hover-6d', '#shop', '#con-slot', '#con-karman', '#con-ring', '#con-daily', '#shopq-fs', '#shopq-setup', '#shopq-rigid', '#career', '#job-nasa-met', '#job-orbit-iss', '#job-fsw-pipe', '#drill-knap', '#recap', '#pack', '#graph', '#ch-31', '#ch-54', '#ap-J', '#ap-I', '#ap-pre', '#quiz']) {
    await go(h);
    const len = await page.evaluate(() => document.querySelector('main').innerText.length);
    ok(len > 80, h + ' renders', len);
  }
  await page.waitForTimeout(3500);
  await page.evaluate(() => { document.querySelectorAll('.toasts > *').forEach(function (e) { e.remove(); }); });
  await go('#mountain', 700); await shot('all_mountain');
  await go('#shop'); await shot('all_shop'); await page.evaluate(() => { S.main().scrollTop = 900; }); await shot('all_shop_b');
  // hardware tier needs a real-world check-in
  let t = await page.evaluate(() => document.querySelector('main').innerText);
  ok(/Log the real-world check-in for “Tune the Primo”/.test(t), 'hardware tiers wait for the Tune the Primo check-in even with every chapter mastered');
  ok(await page.evaluate(() => !S.SHOP.nodeOpen(S.SHOP.NODES[3]) && !S.SHOP.nodeOpen(S.SHOP.NODES[6])), 'aluminium and airframe tiers are closed');
  await page.evaluate(() => { S.main().scrollTop = 0; });
  await page.getByRole('button', { name: /Real-world check-in/ }).first().click();
  await page.waitForTimeout(300);
  await page.setInputFiles('input[type=file][aria-label="Check-in photo"]', '/tmp/checkin.jpg');
  await page.waitForFunction(() => /Photo ready/.test(document.querySelector('.sheet').innerText), null, { timeout: 6000 });
  await page.fill('textarea[aria-label="Check-in note"]', 'Squared the gantry, trammed the router and cut the crown test.');
  await shot('checkin_sheet');
  await page.getByRole('button', { name: 'Log the check-in' }).click();
  await page.waitForTimeout(900);
  const chk = await page.evaluate(async () => ({ rec: S.state.shop.chk.c_tune, photo: ((await S.photoLoad('c_tune')) || '').slice(0, 30), len: ((await S.photoLoad('c_tune')) || '').length, alu: S.SHOP.nodeOpen(S.SHOP.NODES[3]), air: S.SHOP.nodeOpen(S.SHOP.NODES[6]) }));
  ok(chk.rec && chk.rec.note.length > 10 && /^data:image\/jpeg;base64/.test(chk.photo) && chk.len < 170000, 'check-in stored: note plus a shrunken JPEG', { len: chk.len, note: chk.rec && chk.rec.note.slice(0, 30) });
  ok(chk.alu && !chk.air, 'aluminium tier opens; airframe tier still waits for the fins check-in');
  await page.waitForFunction(() => !Object.keys(S.sync.dirty).length && !S.sync.busy, null, { timeout: 9000 });
  const d = await (await fetch('http://localhost:8766/dump')).json();
  ok(!!d.docs['data/users/u_test1/photo_c_tune'] && !d.log.some(l => /^REJECT/.test(l)), 'photo document saved to the account copy within the size limit', Object.keys(d.docs).map(k => k.split('/').pop() + ':' + JSON.stringify(d.docs[k]).length));
  // close a contract, open its video outline
  await go('#con-slot');
  await page.evaluate(() => { var ta = document.querySelector('textarea.code'); ta.value = window.SHOPD.C.slot(null).ref; ta.dispatchEvent(new Event('input')); });
  await page.getByRole('button', { name: 'Run the cut' }).click(); await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Video outline' }).click(); await page.waitForTimeout(300);
  await shot('yt_sheet');
  t = await page.evaluate(() => document.querySelector('.sheet textarea').value);
  ok(/VIDEO OUTLINE · Straight slot/.test(t) && /Glasses, ear protection/.test(t), 'video outline offered for the finished contract', t.slice(0, 60));
  await page.getByRole('button', { name: 'Tailor it with Claude' }).click(); await page.waitForTimeout(500);
  ok(/^TAILORED OUTLINE/.test(await page.evaluate(() => document.querySelector('.sheet textarea').value)), 'Claude tailoring replaces the template');
  await page.getByRole('button', { name: 'Close' }).click();
  // README review through Claude
  await go('#job-nasa-met');
  if (await page.getByRole('button', { name: 'Accept: start the week' }).count()) await page.getByRole('button', { name: 'Accept: start the week' }).click();
  await page.waitForTimeout(300);
  await page.fill('textarea[aria-label="README text"]', '# Meteorite Landings audit\n' + 'This project cleans the NASA meteorite landings table and charts recoveries per decade. '.repeat(5));
  await page.getByRole('button', { name: 'Review my README' }).click(); await page.waitForTimeout(600);
  ok(await page.evaluate(() => S.state.career.con['nasa-met'].rev && S.state.career.con['nasa-met'].rev.s === 72), 'README review stored with its score');
  // ship flow
  await page.evaluate(() => { var r = S.state.career.con['nasa-met']; r.del = [1, 1, 1, 1, 1, 1]; S.render(true); });
  await page.fill('input[aria-label="Repository link"]', 'https://github.com/example/nasa-met');
  await page.getByRole('button', { name: 'Ship it' }).click(); await page.waitForTimeout(400);
  const rd = await page.evaluate(() => ({ done: !!S.state.career.con['nasa-met'].done, r: S.CAREER.readiness() }));
  ok(rd.done && rd.r.n === 1 && rd.r.stage === 'warm', 'contract shipped; readiness counts it', { total: +rd.r.total.toFixed(3), stage: rd.r.stage });
  await go('#career'); await shot('all_career'); await page.evaluate(() => { S.main().scrollTop = 99999; }); await page.waitForTimeout(200); await shot('all_career_end');
  await go('#today'); await shot('all_today');
  await go('#recap'); await shot('all_recap');
  await go('#train'); await shot('all_train');
  // run a Hoverslam level and a drill through Python
  await go('#hover-0');
  await page.evaluate(() => { var ta = document.querySelector('textarea.code'); ta.value = window.HOVER_PY.sol[0]; ta.dispatchEvent(new Event('input')); });
  await page.getByRole('button', { name: /^Run/ }).first().click();
  await page.waitForFunction(() => S.state.hs.best[0] && S.state.hs.best[0].s > 0, null, { timeout: 40000 });
  ok(await page.evaluate(() => !!S.state.hs.done[0]), 'Hoverslam L0 reference solution clears in the browser', await page.evaluate(() => S.state.hs.best[0]));
  console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(fails ? 'FAILED ' + fails : 'FULL SMOKE TEST PASSED');
  await browser.close(); process.exit(fails || errs.length ? 1 : 0);
})().catch(e => { console.error('TEST CRASH', e); process.exit(2); });
