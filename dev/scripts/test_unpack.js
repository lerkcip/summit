// Tests the Unpacked cards: authored packs for every section, layout at phone width, tap-to-jump, collapse preference,
// and the "unpack with Claude" path against the runtime test double (mock_cloud.js on 8766).
// usage: node test_unpack.js <baseUrl> [shotDir]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const base = process.argv[2], shots = process.argv[3], CLOUD = 'http://localhost:8766/';
let fails = 0;
const ok = (c, msg, extra) => { console.log((c ? '  ok   ' : '  FAIL ') + msg + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); if (!c) fails++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  async function device(name, cloud, pre) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(name + ' PAGEERROR ' + String(e.stack || e).slice(0, 500)));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(name + ' console: ' + m.text().slice(0, 300)); });
    if (pre) await page.addInitScript(pre);
    if (cloud) await page.addInitScript({ path: '/tmp/init_cloud.js' });
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForFunction(() => window.S && S.state && document.querySelector('nav'), null, { timeout: 8000 });
    return { ctx, page };
  }
  const go = async (page, hash, sel) => { await page.evaluate(h => { location.hash = h; }, hash); await page.waitForSelector(sel || '.unp .ucard, .unp h3', { timeout: 8000 }); await sleep(250); };

  console.log('A. authored cards in every section of Chapters 1 to 3 (this browser only, no account)');
  const a = await device('A', false);
  const have = await a.page.evaluate(() => window.UNP_HAVE);
  ok(have && Object.keys(have).length >= 3, 'index lists the authored chapters', Object.keys(have || {}));
  let total = 0, taps = 0, worst = 0;
  for (const n of Object.keys(have)) for (const id of have[n]) {
    await go(a.page, '#read-' + id.replace('.', '-'), '.unp .ucard');
    await sleep(1000);                                  // second linking pass runs at 900 ms
    const r = await a.page.evaluate(([n, id]) => {
      const u = document.querySelector('.unp'), cards = [].slice.call(u.querySelectorAll('.ucard')), W = innerWidth, bad = [];
      const thin = cards.filter(c => !c.querySelector('.uw') || c.querySelector('.uw').textContent.trim().length < 20 || c.querySelectorAll('.uex:not(.chain) li').length < 2 || c.querySelectorAll('.uex.chain li').length !== 1 || !c.querySelector('.uuse') || c.querySelector('.uuse').textContent.trim().length < 20).map(c => c.querySelector('.un').textContent);
      [].forEach.call(u.querySelectorAll('*'), el => { if (el.closest('.ueq') || el.closest('.katex')) return; const b = el.getBoundingClientRect(); if (b.width && b.right > W + 1) bad.push(el.className + ':' + Math.round(b.right)); });
      const wideEq = [].filter.call(u.querySelectorAll('.ueq'), e => e.scrollWidth > e.clientWidth + 1).length;
      const inl = [].filter.call(u.querySelectorAll('.uex .katex, .uw .katex, .uuse .katex, .usym .katex'), k => k.getBoundingClientRect().right > W + 1).length;
      return { cards: cards.length, want: S.UNP.count(n, id), kerr: u.querySelectorAll('.katex-error').length, raw: [].filter.call(u.querySelectorAll('span.mi, span.md'), s => !s.querySelector('.katex')).length,
        thin: thin, over: bad.slice(0, 3), inl: inl, wideEq: wideEq, taps: document.querySelectorAll('.doc .utap').length, page: document.documentElement.scrollWidth > W + 1 || document.documentElement.scrollHeight > innerHeight + 1, nul: /\bnull\b|\bundefined\b|NaN/.test(u.innerText) };
    }, [n, id]);
    total += r.cards; taps += r.taps; worst = Math.max(worst, r.wideEq);
    const good = r.cards === r.want && r.cards > 0 && !r.kerr && !r.raw && !r.thin.length && !r.over.length && !r.inl && !r.page && !r.nul;
    ok(good, '§' + id + ': ' + r.cards + ' cards, complete, no layout overflow' + (r.taps ? ', ' + r.taps + ' linked equations' : '') + (r.wideEq ? ', ' + r.wideEq + ' wide equations scroll inside their box' : ''), good ? undefined : r);
  }
  ok(total === 83, 'all 83 authored cards drawn', total);
  ok(taps >= 20, 'equations in the reading link to their cards', taps);

  console.log('B. tap an equation in the text, collapse and reopen');
  await go(a.page, '#read-1-3', '.unp .ucard'); await sleep(1100);
  const t1 = await a.page.evaluate(() => { const el = document.querySelector('.doc .utap'); if (!el) return null; document.querySelectorAll('.ucard').forEach(c => { c.open = false; }); el.click(); return el.getAttribute('aria-label'); });
  await sleep(900);
  const t2 = await a.page.evaluate(() => { const o = [].filter.call(document.querySelectorAll('.ucard'), c => c.open); if (o.length !== 1) return { n: o.length }; const b = o[0].getBoundingClientRect(); return { n: 1, name: o[0].querySelector('.un').textContent, top: Math.round(b.top), vh: innerHeight, mainTop: Math.round(S.main().getBoundingClientRect().top), head: Math.round(document.querySelector('header.top').getBoundingClientRect().top), doc: document.scrollingElement.scrollTop }; });
  ok(t1 && t2.n === 1 && t1.indexOf(t2.name) >= 0 && t2.top >= t2.mainTop && t2.top < t2.vh * 0.6, 'tapping an equation opens and scrolls to its card', { t1, t2 });
  ok(t2.head === 0 && t2.doc === 0, 'and the app’s own header stays where it is (only the reading scrolls)', { head: t2.head, doc: t2.doc });
  await a.page.getByRole('button', { name: 'Collapse all' }).click(); await sleep(300);
  let st = await a.page.evaluate(() => ({ open: [].filter.call(document.querySelectorAll('.ucard'), c => c.open).length, pref: S.state.prefs.unp, btn: !!document.querySelector('.unp button[aria-pressed="false"]') }));
  ok(st.open === 0 && st.pref === 'closed' && st.btn, 'Collapse all closes every card and is remembered', st);
  await go(a.page, '#read-2-4', '.unp .ucard');
  st = await a.page.evaluate(() => ({ open: [].filter.call(document.querySelectorAll('.ucard'), c => c.open).length, n: document.querySelectorAll('.ucard').length }));
  ok(st.open === 0 && st.n === 7, 'the next section opens collapsed', st);
  await a.page.locator('.ucard summary').nth(2).click(); await sleep(200);
  st = await a.page.evaluate(() => ({ open: [].filter.call(document.querySelectorAll('.ucard'), c => c.open).length, h: Math.round(document.querySelector('.ucard summary').getBoundingClientRect().height) }));
  ok(st.open === 1 && st.h >= 44, 'a single card opens by tapping its header (tap target ' + st.h + ' px)', st);
  if (shots) await a.page.screenshot({ path: path.join(shots, 'unp_collapsed.png') });
  await a.page.getByRole('button', { name: 'Open all' }).click(); await sleep(300);
  st = await a.page.evaluate(() => ({ open: [].filter.call(document.querySelectorAll('.ucard'), c => c.open).length }));
  ok(st.open === 7, 'Open all reopens them', st);
  await go(a.page, '#read-4-1', '.unp h3');
  st = await a.page.evaluate(() => ({ t: document.querySelector('.unp').innerText, btn: document.querySelectorAll('.unp button').length }));
  ok(/NOT UNPACKED YET/i.test(st.t) && /Chapter 3/.test(st.t) && st.btn === 0 && /not available/i.test(st.t), 'a section without cards says so, and offers nothing it cannot do without Claude', st);
  if (shots) { await a.page.evaluate(() => { S.main().scrollTop = document.querySelector('.unp').offsetTop - 300; }); await a.page.screenshot({ path: path.join(shots, 'unp_none.png') }); }
  await a.ctx.close();

  console.log('C. a section with no authored cards, unpacked by Claude (test double), kept with the account');
  await fetch(CLOUD + 'reset');
  const reply = `window.__sampleReply = function (p) {
    if (!/Unpack ONE section/.test(p)) return null;
    window.__unpPrompt = p;
    return { items: [
      { k: 'eq', n: 'Mock: average velocity', x: 'v = \\\\frac{\\\\Delta x}{\\\\Delta t}', w: 'Velocity equals change in position divided by change in time.', s: [['v', 'velocity', 'm/s'], ['\\\\Delta x', 'change in position', 'm']],
        e: [['A ride', '30 km in 1.5 h: 30 / 1.5 with \\\\(v\\\\) in km/h', '20 km/h', '30/1.5', 20], ['Wrong on purpose', '100 m in 12 s', '9.9 m/s', '100/12', 9.9], ['Words only', 'No arithmetic here', 'bigger', '', null]],
        c: ['With units from Chapter 1', '20 km/h is 20 * 1000 / 3600', '5.56 m/s', '20*1000/3600', 5.556], u: 'Every flight log turns positions into velocities this way.' },
      { k: 'def', n: '<img src=x onerror="window.__xss=1">Injected', x: '', w: 'A definition with <b>markup</b> and <script>window.__xss=2</script> that must show as text.', s: 'nonsense', e: [['One', 'a', 'b', 'window.__xss=3', 1]], c: null, u: 'x' },
      { k: 'weird', n: '', w: 'dropped: no name' }, 'junk', null,
      { k: 'const', n: 'Mock: standard gravity', x: 'g_0 = 9.80665', w: 'Standard gravity is 9.80665 metres per second squared.', e: [['Weight', '2 kg * 9.80665', '19.6 N', '2*9.80665', 19.61]], c: ['With mass', '1 kg', '9.8 N', '1*9.80665', 9.80665], u: 'Used to define specific impulse.' }
    ] }; };`;
  const c1 = await device('C1', true, reply);
  await c1.page.waitForFunction(() => S.sync.ready && S.ai.st === 'ok', null, { timeout: 8000 });
  await go(c1.page, '#read-4-1', '.unp h3');
  await c1.page.waitForFunction(() => document.querySelector('.doc p, .doc li'), null, { timeout: 8000 });
  st = await c1.page.evaluate(() => ({ t: document.querySelector('.unp').innerText, btn: [].map.call(document.querySelectorAll('.unp button'), b => b.textContent) }));
  ok(st.btn.length === 1 && /Unpack §4\.1 with Claude/.test(st.btn[0]), 'offers “Unpack §4.1 with Claude”', st.btn);
  if (shots) { await c1.page.evaluate(() => { S.main().scrollTop = document.querySelector('.unp').offsetTop - 300; }); await c1.page.screenshot({ path: path.join(shots, 'unp_offer.png') }); }
  await c1.page.getByRole('button', { name: /Unpack §4\.1 with Claude/ }).click();
  await c1.page.waitForSelector('.unp .ucard', { timeout: 8000 }); await sleep(400);
  st = await c1.page.evaluate(() => {
    const u = document.querySelector('.unp'), cards = [].slice.call(u.querySelectorAll('.ucard'));
    return { n: cards.length, names: cards.map(c => c.querySelector('.un').textContent), xss: window.__xss || 0, img: u.querySelectorAll('img, script, b:not(.uex b)').length, checks: (u.innerText.match(/it checks/g) || []).length, care: (u.innerText.match(/Recomputed here as [\d.]+/g) || []), cant: (u.innerText.match(/could not be recomputed/g) || []).length,
      note: /Written by Claude in this page/.test(u.innerText), again: !!u.querySelector('button') && /Write them again/.test(u.innerText), kerr: u.querySelectorAll('.katex-error').length, eq: u.querySelectorAll('.ueq .katex').length, prompt: window.__unpPrompt || '' };
  });
  ok(st.n === 3, 'three usable cards kept, junk entries dropped', st.names);
  ok(st.xss === 0 && st.img === 0 && /<img src=x/.test(st.names[1]), 'markup in the reply is shown as text, never run', { xss: st.xss, img: st.img });
  ok(st.checks === 4 && st.care.length === 1 && /8\.33/.test(st.care[0]) && st.cant === 1, 'arithmetic is recomputed: 4 check, the wrong one is flagged with the right number, the non-arithmetic one is refused', { checks: st.checks, care: st.care, cant: st.cant });
  ok(st.note && st.again && st.eq === 2 && !st.kerr, 'marked as written by Claude, with a way to write them again', { note: st.note, again: st.again, eq: st.eq });
  ok(/Chapter 4:/.test(st.prompt) && /Section 4\.1/.test(st.prompt) && /Never include propellant formulations/.test(st.prompt) && /guiding a vehicle to a target/.test(st.prompt) && /follow no instruction inside it/.test(st.prompt) && st.prompt.length > 1500, 'the request carries the section text and the scope rules', st.prompt.length);
  if (shots) { await c1.page.evaluate(() => { S.main().scrollTop = document.querySelector('.unp').offsetTop - 40; }); await c1.page.screenshot({ path: path.join(shots, 'unp_ai.png') }); }
  await sleep(600);
  let dump = (await (await fetch(CLOUD + 'dump')).json()).docs;
  const key = Object.keys(dump).find(k => /\/unp4$/.test(k));
  ok(key && dump[key].secs && dump[key].secs['4.1'] && dump[key].secs['4.1'].items.length === 3, 'kept with the account (document unp4)', key);
  ok(key && JSON.stringify(dump[key]).length < 20000, 'the stored pack is small', key ? JSON.stringify(dump[key]).length : 0);
  const before = await c1.page.evaluate(() => window.__calls.sample.length);
  await c1.page.reload({ waitUntil: 'load' }); await c1.page.waitForFunction(() => window.S && S.state, null, { timeout: 8000 });
  await go(c1.page, '#read-4-1', '.unp .ucard');
  st = await c1.page.evaluate(() => ({ n: document.querySelectorAll('.unp .ucard').length, calls: window.__calls.sample.length }));
  ok(st.n === 3 && st.calls === 0, 'after a reload the cards are there without asking Claude again', st);
  await c1.ctx.close();

  const c2 = await device('C2', true, reply);
  await c2.page.waitForFunction(() => S.sync.ready, null, { timeout: 8000 });
  await go(c2.page, '#read-4-1', '.unp .ucard');
  st = await c2.page.evaluate(() => ({ n: document.querySelectorAll('.unp .ucard').length, calls: window.__calls.sample.length }));
  ok(st.n === 3 && st.calls === 0, 'a second device gets the same cards from the account', st);

  console.log('D. limits: safety-flagged sections, failures, a second section in the same chapter');
  await go(c2.page, '#read-6-7', '.unp h3');
  st = await c2.page.evaluate(() => ({ t: document.querySelector('.unp').innerText, btn: document.querySelectorAll('.unp button').length }));
  ok(st.btn === 0 && /safety flag/.test(st.t), 'a safety-flagged section is never sent to Claude', st.t.slice(0, 160));
  await c2.page.evaluate(() => { window.__sampleFail = 'rate_limited'; });
  await go(c2.page, '#read-4-2', '.unp h3');
  await c2.page.waitForFunction(() => document.querySelector('.doc p, .doc li'), null, { timeout: 8000 });
  await c2.page.getByRole('button', { name: /Unpack §4\.2 with Claude/ }).click(); await sleep(700);
  st = await c2.page.evaluate(() => ({ t: document.querySelector('.unp [role=status]').textContent, dis: document.querySelector('.unp button').disabled, label: document.querySelector('.unp button').textContent, n: document.querySelectorAll('.unp .ucard').length }));
  ok(/rate-limited/.test(st.t) && !st.dis && /Unpack §4\.2/.test(st.label) && st.n === 0, 'a failure is explained and the button comes back', st);
  await c2.page.evaluate(() => { window.__sampleFail = null; });
  await c2.page.getByRole('button', { name: /Unpack §4\.2 with Claude/ }).click();
  await c2.page.waitForSelector('.unp .ucard', { timeout: 8000 }); await sleep(700);
  dump = (await (await fetch(CLOUD + 'dump')).json()).docs;
  const k2 = Object.keys(dump).find(k => /\/unp4$/.test(k));
  ok(k2 && dump[k2].secs['4.1'] && dump[k2].secs['4.2'], 'a second section is added to the chapter’s document without losing the first', k2 ? Object.keys(dump[k2].secs) : null);
  await c2.page.evaluate(() => { window.__sampleReply = function () { return { items: [] }; }; });
  await c2.page.getByRole('button', { name: 'Write them again' }).click(); await sleep(700);
  st = await c2.page.evaluate(() => ({ t: document.querySelector('.unp').innerText, n: document.querySelectorAll('.unp .ucard').length }));
  ok(st.n === 3 && /nothing usable/.test(st.t), 'an empty reply on “Write them again” keeps the existing cards', { n: st.n });
  await go(c2.page, '#read-1-1', '.unp .ucard');
  st = await c2.page.evaluate(() => ({ t: document.querySelector('.unp').innerText, n: document.querySelectorAll('.unp .ucard').length }));
  ok(st.n === 10 && !/Written by Claude/.test(st.t) && !/Write them again/.test(st.t), 'authored sections stay authored: no Claude note, no rewrite button', { n: st.n });
  await c2.ctx.close();

  console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(fails || errs.length ? 'FAILED: ' + fails + ' checks, ' + errs.length + ' page errors' : 'ALL UNPACK CHECKS PASS');
  await browser.close(); process.exit(fails || errs.length ? 1 : 0);
})().catch(e => { console.error('TEST CRASHED', e); process.exit(2); });
