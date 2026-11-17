// Tests SUMMIT outside Claude (js/web.js): this-browser mode, connecting a private GitHub repo, two devices sharing progress,
// write conflicts, a revoked token, the optional Anthropic API key (Ask, Unpack, model fallback, errors, stop), and downloads.
// Needs mock_web.js on 8767. usage: node test_web.js <baseUrl> [shotDir]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const base = process.argv[2], shots = process.argv[3], M = 'http://localhost:8767';
const INIT = `window.SUMMIT_TEST_API = { github: '${M}/gh', anthropic: '${M}/an', wait: 700 };`;
const GOOD = 'github_pat_good_0123456789abcdef', RO = 'github_pat_readonly_0123456789ab', KEY = 'sk-ant-good-0123456789abcdef';
let fails = 0;
const ok = (c, msg, extra) => { console.log((c ? '  ok   ' : '  FAIL ') + msg + (extra !== undefined ? '  ' + JSON.stringify(extra) : '')); if (!c) fails++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const admin = (p, b) => fetch(M + '/admin/' + p, b ? { method: 'POST', body: JSON.stringify(b) } : undefined).then(r => r.json());
(async () => {
  await admin('reset');
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const errs = [];
  async function device(name) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(name + ' PAGEERROR ' + String(e.stack || e).slice(0, 400)));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|status of 40[0-9]/.test(m.text())) errs.push(name + ' console: ' + m.text().slice(0, 300)); });
    await page.addInitScript(INIT);
    await page.goto(base, { waitUntil: 'load' });
    await page.waitForFunction(() => window.S && S.state && document.querySelector('nav') && S.sync.ready, null, { timeout: 10000 });
    return { ctx, page };
  }
  const go = async (page, hash, sel) => { await page.evaluate(h => { location.hash = h; }, hash); await page.waitForSelector(sel, { timeout: 8000 }); await sleep(250); };
  const card = (page, title) => page.evaluate(t => { const c = [].find.call(document.querySelectorAll('.card'), x => { const h = x.querySelector('h3'); return h && h.textContent === t; }); return c ? { text: c.innerText, msg: (c.querySelector('[role=status]') || {}).textContent || '' } : null; }, title);
  const settle = (page, label) => page.waitForFunction(l => [].some.call(document.querySelectorAll('button'), b => b.textContent === l && !b.disabled), label, { timeout: 10000 }).catch(() => null);
  async function tryConnect(page, repo, token) {
    await page.fill('input[placeholder="yourname/summit-progress"]', repo); await page.fill('input[placeholder="github_pat_…"]', token);
    await page.getByRole('button', { name: 'Connect' }).click(); await sleep(150); await settle(page, 'Connect'); return (await card(page, 'Sync with GitHub')).msg;
  }
  async function connect(page, repo, token) {
    await page.fill('input[placeholder="yourname/summit-progress"]', repo); await page.fill('input[placeholder="github_pat_…"]', token);
    const nav = page.waitForEvent('load', { timeout: 15000 }); await page.getByRole('button', { name: 'Connect' }).click(); await nav;
    await page.waitForFunction(() => window.S && S.state && S.sync.ready && S.sync.mode === 'cloud', null, { timeout: 15000 });
  }
  async function tryKey(page, key) { await page.fill('input[placeholder="sk-ant-…"]', key); await page.getByRole('button', { name: 'Save and test' }).click(); await sleep(150); await settle(page, 'Save and test'); return (await card(page, 'Claude API key')).msg; }
  const select = (page, sel, re) => page.evaluate(([sel, re]) => { const rx = new RegExp(re), el = [].filter.call(document.querySelectorAll(sel), e => rx.test(e.textContent))[0]; if (!el) return 0; const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); el.scrollIntoView({ block: 'center' }); return s.toString().length; }, [sel, re]);
  const remote = async () => (await admin('dump')).repos['me/summit-progress'];

  console.log('A. a fresh browser: SUMMIT runs on its own');
  const a = await device('A');
  let st = await a.page.evaluate(() => ({ kind: window.SUMMIT_HOST && SUMMIT_HOST.kind, mode: S.sync.mode, ready: S.sync.ready, ai: S.ai.st, dl: !!S.dl, wait: S.sync.wait }));
  ok(st.kind === 'web' && st.mode === 'local' && st.ready && st.ai === 'none' && st.dl && st.wait === 700, 'outside Claude it starts in this-browser mode, downloads on, Claude off', st);
  let t0 = Date.now(); await go(a.page, '#read-1-1', '.unp .ucard');
  ok(Date.now() - t0 < 1500, 'Unpacked cards appear at once (nothing waits for a cloud that is not there)', Date.now() - t0);
  await go(a.page, '#pack', 'main h2');
  st = await a.page.evaluate(() => ({ h3: [].map.call(document.querySelectorAll('main h3'), e => e.textContent), top: document.querySelector('.sync').getAttribute('title'), grading: document.querySelector('main').innerText.indexOf('Add a Claude API key below') >= 0 }));
  ok(st.h3.indexOf('Sync with GitHub') >= 0 && st.h3.indexOf('Claude API key') > st.h3.indexOf('Sync with GitHub') && st.h3.indexOf('Backup') > st.h3.indexOf('Claude API key'), 'Pack shows Sync with GitHub and Claude API key above Backup', st.h3);
  ok(st.top === 'Saved on this device only' && st.grading, 'the status says this device only; grading points to the API key', st);
  st = await a.page.evaluate(() => [].map.call(document.querySelectorAll('.webin'), i => ({ t: i.type, fs: parseFloat(getComputedStyle(i).fontSize), h: Math.round(i.getBoundingClientRect().height), w: Math.round(i.getBoundingClientRect().right) })));
  ok(st.length === 3 && st.every(x => x.fs >= 16 && x.h >= 44 && x.w <= 390) && st[1].t === 'password' && st[2].t === 'password', 'three fields at 16 px (no zoom on iPhone), token and key masked, inside the screen', st);
  const [dl] = await Promise.all([a.page.waitForEvent('download', { timeout: 5000 }), a.page.getByRole('button', { name: 'Export JSON' }).click()]);
  const txt = fs.readFileSync(await dl.path(), 'utf8');
  ok(/^summit-backup-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()) && JSON.parse(txt).app === 'SUMMIT', 'Export JSON downloads the backup', dl.suggestedFilename());
  if (shots) { await a.page.evaluate(() => { [].forEach.call(document.querySelectorAll('.webhow'), d => { d.open = true; }); S.main().scrollTop = 0; }); await a.page.screenshot({ path: path.join(shots, 'web_pack.png') }); await a.page.evaluate(() => { S.main().scrollTop = 700; }); await a.page.screenshot({ path: path.join(shots, 'web_pack2.png') }); }

  console.log('B. connecting: mistakes are explained and nothing is stored');
  let m = await tryConnect(a.page, 'summit-progress', GOOD); ok(/owner\/name/.test(m), 'a repo without its owner', m);
  m = await tryConnect(a.page, 'me/summit-progress', 'github_pat_wrong_0123456789abcdef'); ok(/did not accept that token/.test(m), 'a wrong token', m);
  m = await tryConnect(a.page, 'me/nothing-here', GOOD); ok(/cannot see me\/nothing-here/.test(m), 'a repo the token cannot see', m);
  m = await tryConnect(a.page, 'me/open-repo', GOOD); ok(/is public/.test(m), 'a public repo is refused (progress would be readable by anyone)', m);
  m = await tryConnect(a.page, 'me/summit-progress', RO); ok(/cannot write to me\/summit-progress/.test(m) && /Read and write/.test(m), 'a read-only token', m);
  st = await a.page.evaluate(() => ({ gh: localStorage.getItem('summit.web.gh'), mode: S.sync.mode }));
  ok(!st.gh && st.mode === 'local', 'none of those were saved', st);

  console.log('C. connect to a repo that already holds progress');
  const seed = await a.page.evaluate(() => { const s = JSON.parse(S.exportJSON()).state, now = Date.now() - 60000, pick = f => { const o = { u: now }; f.forEach(k => { o[k] = s[k]; }); return o; }; const main = pick(['v', 'created', 'prefs', 'xp', 'streak', 'ch', 'boss', 'quiz', 'miss', 'plan']); main.xp = 1234; return { 'main.json': main, 'log.json': pick(['days', 'hist']) }; });
  await admin('seed', { repo: 'me/summit-progress', files: seed });
  const c0 = (await admin('dump')).commits;
  await connect(a.page, ' https://github.com/me/summit-progress.git ', '  ' + GOOD + ' ');
  st = await a.page.evaluate(() => ({ xp: S.state.xp, mode: S.sync.mode, top: document.querySelector('.sync').getAttribute('title'), gh: JSON.parse(localStorage.getItem('summit.web.gh')) }));
  ok(st.xp >= 1234 && st.mode === 'cloud' && st.top === 'Saved to your private GitHub repo', 'after the reload the progress from GitHub is in (XP ' + st.xp + ')', { xp: st.xp, top: st.top });
  ok(st.gh && st.gh.repo === 'me/summit-progress' && st.gh.token === GOOD, 'a pasted URL and stray spaces are cleaned up', st.gh && st.gh.repo);
  let r = await remote(); ok(r['connected.json'] && /^\d{4}-/.test(r['connected.json'].connected), 'connecting proved the token can write (progress/connected.json)');
  await sleep(1400);
  let cd = await card(a.page, 'Sync with GitHub');
  ok(/Saving to GitHub as you go/.test(cd.text) && /me\/summit-progress/.test(cd.text) && /Disconnect this device/.test(cd.text), 'Pack shows the connection', cd.text.slice(0, 120));
  const c1 = (await admin('dump')).commits;
  await a.page.evaluate(() => { for (let i = 0; i < 5; i++) { S.state.xp += 20; S.dirty('main'); } });
  await sleep(2600);
  r = await remote(); const c2 = (await admin('dump')).commits;
  st = await a.page.evaluate(() => ({ xp: S.state.xp, dirty: Object.keys(S.sync.dirty).length, err: S.sync.err }));
  ok(r['main.json'].xp === st.xp && !st.dirty && !st.err, 'a change reaches GitHub on its own (XP ' + r['main.json'].xp + ')', st);
  ok(c2 - c1 === 1, 'five quick changes make one commit, not five', c2 - c1);

  console.log('D. a second device shares the climb');
  const b = await device('B');
  await go(b.page, '#pack', 'main h2'); await connect(b.page, 'me/summit-progress', GOOD);
  st = await b.page.evaluate(() => S.state.xp); const xpA = await a.page.evaluate(() => S.state.xp);
  ok(st === xpA, 'device B opens with device A’s progress', { a: xpA, b: st });
  await b.page.evaluate(() => { S.state.xp += 7; S.dirty('main'); }); await sleep(2200);
  const nav = a.page.waitForEvent('load'); await a.page.reload(); await nav;
  await a.page.waitForFunction(() => window.S && S.state && S.sync.ready, null, { timeout: 10000 });
  st = await a.page.evaluate(() => S.state.xp);
  ok(st === xpA + 7, 'device A picks up device B’s change when it opens again', { before: xpA, after: st });

  console.log('E. two devices writing at once');
  st = await a.page.evaluate(async (M) => {
    const db = await window.claude.use('db'), d = db.doc('data/users/me/probe'), out = {};
    await d.set({ n: 1 }); out.first = (await d.get()).data().n;
    await fetch(M + '/admin/touch', { method: 'POST', body: JSON.stringify({ repo: 'me/summit-progress', name: 'probe.json', obj: { n: 99 } }) });
    try { await d.set({ n: 2 }); out.stale = 'saved'; } catch (e) { out.stale = e.code; out.why = e.human; }
    out.seen = (await d.get()).data().n;
    try { await d.set({ n: 3 }); out.after = 'saved'; } catch (e) { out.after = e.code; }
    out.final = (await d.get()).data().n;
    const res = await Promise.allSettled([d.set({ n: 4 }), db.doc('data/users/me/probe2').set({ n: 5 }), d.set({ n: 6 })]);
    out.burst = res.map(x => x.status); out.last = (await d.get()).data().n;
    return out;
  }, M);
  ok(st.first === 1 && st.stale === 'unavailable' && /Another device saved/.test(st.why) && st.seen === 99 && st.after === 'saved' && st.final === 3, 'a write over another device’s newer save is refused, then goes through after reading it', st);
  ok(st.burst.every(x => x === 'fulfilled') && st.last === 6, 'writes in a burst are queued one at a time and all land', st.burst);

  console.log('F. a token that stops working');
  await admin('set', { revoked: true });
  await a.page.evaluate(() => { S.state.xp += 1; S.dirty('main'); }); await sleep(2000);
  st = await a.page.evaluate(() => ({ dead: S.sync.dead, cls: document.querySelector('.sync').className, local: JSON.parse(localStorage.getItem('summit.v1') || '{}').xp }));
  ok(st.dead === 'permission_denied' && /err/.test(st.cls), 'sync stops and the status shows it', st);
  await sleep(1400); cd = await card(a.page, 'Sync with GitHub');
  ok(/rejected the access token/.test(cd.text) && /safe on this device/.test(cd.text), 'Pack says why and that progress is safe here', cd.text.slice(0, 160));
  if (shots) await a.page.screenshot({ path: path.join(shots, 'web_revoked.png') });
  await admin('set', { revoked: false });
  const xpBefore = await a.page.evaluate(() => S.state.xp);
  const nav2 = a.page.waitForEvent('load'); await a.page.getByRole('button', { name: 'Disconnect this device' }).click(); await nav2;
  await a.page.waitForFunction(() => window.S && S.state && S.sync.ready, null, { timeout: 10000 });
  st = await a.page.evaluate(() => ({ mode: S.sync.mode, xp: S.state.xp, gh: localStorage.getItem('summit.web.gh') }));
  ok(st.mode === 'local' && st.xp === xpBefore && !st.gh, 'Disconnect removes the token and keeps the progress on this device', st);

  console.log('G. the optional API key');
  await go(a.page, '#pack', 'main h2');
  m = await tryKey(a.page, 'sk-ant-wrong-0123456789abcdef'); ok(/rejected your key/.test(m), 'a wrong key is explained', m);
  m = await tryKey(a.page, 'sk-ant-nocredit-0123456789abcdef'); ok(/out of credit/.test(m), 'an account without credit is explained', m);
  ok(!(await a.page.evaluate(() => localStorage.getItem('summit.web.ak'))), 'neither was saved');
  await a.page.fill('input[placeholder="sk-ant-…"]', KEY);
  const nav3 = a.page.waitForEvent('load', { timeout: 15000 }); await a.page.getByRole('button', { name: 'Save and test' }).click(); await nav3;
  await a.page.waitForFunction(() => window.S && S.state && S.sync.ready, null, { timeout: 10000 });
  let an = (await admin('dump')).an, k = an[an.length - 1];
  ok(k.model === 'claude-haiku-5-5' && k.max_tokens === 16 && k.stream === true && k.version === '2023-06-01', 'the key check is one tiny request to the fastest model', k);
  st = await a.page.evaluate(() => ({ ai: S.ai.st, on: S.ai.on() }));
  ok(st.ai === 'ok' && st.on, 'after the reload Claude’s parts are on', st);
  await go(a.page, '#pack', 'main h2'); cd = await card(a.page, 'Claude API key');
  ok(/billed to your key/.test(cd.text) && /Opus 5\.5/.test(cd.text), 'Pack says which models it uses', cd.text.slice(0, 140));
  // Ask about a highlight, through the API
  await go(a.page, '#read-1-2', '.doc p');
  await a.page.waitForFunction(() => document.querySelectorAll('.doc span[data-tex]').length > 2, null, { timeout: 8000 });
  ok(await select(a.page, '.doc p', 'dimension') > 20, 'a paragraph is highlighted');
  await a.page.waitForSelector('.askpill', { timeout: 3000 }); await a.page.locator('.askpill').click(); await sleep(300);
  st = await a.page.evaluate(() => document.querySelector('.asksheet .askbar [role=status]').textContent);
  ok(/billed to your API key/.test(st), 'the popup says answers are billed to the key', st);
  await a.page.locator('.askta').fill('Why is force M L T^-2?'); await a.page.locator('.askrow .btn.go').click();
  await a.page.waitForSelector('.askm.claude .askmeta', { timeout: 8000 });
  st = await a.page.evaluate(() => { const b = document.querySelector('.askm.claude .askb'); return { meta: document.querySelector('.askm.claude .askmeta').textContent, k: b.querySelectorAll('.katex').length, li: b.querySelectorAll('li').length, bold: b.querySelectorAll('b').length }; });
  an = (await admin('dump')).an; k = an[an.length - 1];
  ok(st.meta === 'Claude Opus 5.5' && st.k >= 3 && st.li === 2 && st.bold === 1, 'the answer streams in, formatted, labelled Claude Opus 5.5', st);
  ok(k.model === 'claude-opus-5-5' && k.messages.length === 1 && /Where they are/.test(k.messages[0].content) && /Why is force/.test(k.messages[0].content), 'one request to claude-opus-5-5; the rules and the question go as one user turn', { model: k.model, turns: k.messages.length });
  await a.page.locator('.askta').fill('And a follow-up?'); await a.page.locator('.askta').press('Enter');
  await a.page.waitForFunction(() => document.querySelectorAll('.askm.claude .askmeta').length === 2, null, { timeout: 8000 });
  an = (await admin('dump')).an; k = an[an.length - 1];
  ok(k.messages.map(x => x.role).join(',') === 'user,assistant,user' && /follow-up/.test(k.messages[2].content), 'a follow-up sends the conversation with alternating turns', k.messages.map(x => x.role));
  await admin('set', { beh: { noOpus: true } });
  await a.page.locator('.askta').fill('Third?'); await a.page.locator('.askrow .btn.go').click();
  await a.page.waitForFunction(() => document.querySelectorAll('.askm.claude .askmeta').length === 3, null, { timeout: 8000 });
  st = await a.page.evaluate(() => [].map.call(document.querySelectorAll('.askm.claude .askmeta'), e => e.textContent)[2]);
  an = (await admin('dump')).an;
  ok(/was not available for this answer/.test(st) && /everyday/.test(st) && an[an.length - 2].model === 'claude-opus-5-5' && an[an.length - 1].model === 'claude-sonnet-5-5', 'if the key cannot use Opus 5.5, Sonnet 5.5 answers and the popup says so', st);
  await admin('set', { beh: { noOpus: false, midError: 'overloaded_error' } });
  await a.page.locator('.askta').fill('Fourth?'); await a.page.locator('.askrow .btn.go').click(); await sleep(900);
  st = await a.page.evaluate(() => { const ms = document.querySelectorAll('.askm.claude'), l = ms[ms.length - 1]; return { n: ms.length, meta: (l.querySelector('.askmeta') || {}).textContent, status: document.querySelector('.asksheet .askbar [role=status]').textContent }; });
  ok(st.n === 4 && /Interrupted/.test(st.meta) && /overloaded/.test(st.status), 'an overloaded API mid-answer keeps what arrived and says why', st);
  await admin('set', { beh: { midError: '', delay: 400, chunks: 8 } });
  await a.page.locator('.askta').fill('Fifth, long'); await a.page.locator('.askrow .btn.go').click(); await sleep(1300);
  await a.page.locator('.askrow .btn', { hasText: 'Stop' }).click(); await sleep(600);
  st = await a.page.evaluate(() => { const ms = document.querySelectorAll('.askm.claude'), l = ms[ms.length - 1]; return { meta: (l.querySelector('.askmeta') || {}).textContent, len: l.querySelector('.askb').textContent.length, ta: document.querySelector('.askta').disabled }; });
  ok(/Stopped before the end/.test(st.meta) && st.len > 5 && !st.ta, 'Stop ends the request and keeps the partial answer', st);
  if (shots) await a.page.screenshot({ path: path.join(shots, 'web_ask.png') });
  await admin('set', { beh: { delay: 30, chunks: 4 } });
  await a.page.locator('.asksheet .btn', { hasText: 'Close' }).click(); await sleep(250);
  // Unpack with Claude: the JSON path
  await go(a.page, '#read-4-1', '.unp h3');
  await a.page.waitForFunction(() => document.querySelector('.doc p, .doc li'), null, { timeout: 8000 });
  await a.page.getByRole('button', { name: /Unpack §4\.1 with Claude/ }).click();
  await a.page.waitForSelector('.unp .ucard', { timeout: 8000 }); await sleep(300);
  st = await a.page.evaluate(() => ({ n: document.querySelectorAll('.unp .ucard').length, name: document.querySelector('.unp .ucard .un').textContent, checks: (document.querySelector('.unp').innerText.match(/it checks/g) || []).length }));
  an = (await admin('dump')).an; k = an[an.length - 1];
  ok(st.n === 1 && /Web: average speed/.test(st.name) && st.checks === 3, 'Unpack with Claude works through the key, arithmetic recomputed', st);
  ok(k.model === 'claude-sonnet-5-5' && /reply with only the JSON value/.test(k.messages[0].content), 'data requests go to Sonnet 5.5 and ask for bare JSON', k.model);
  // removing the key
  await go(a.page, '#pack', 'main h2');
  const nav4 = a.page.waitForEvent('load'); await a.page.getByRole('button', { name: 'Remove the key' }).click(); await nav4;
  await a.page.waitForFunction(() => window.S && S.state && S.sync.ready, null, { timeout: 10000 });
  st = await a.page.evaluate(() => ({ ai: S.ai.st, ak: localStorage.getItem('summit.web.ak') }));
  ok(st.ai === 'none' && !st.ak, 'Remove the key turns Claude’s parts off again', st);
  await a.ctx.close(); await b.ctx.close();

  console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(fails || errs.length ? 'FAILED: ' + fails + ' checks, ' + errs.length + ' page errors' : 'ALL WEB CHECKS PASS');
  await browser.close(); process.exit(fails || errs.length ? 1 : 0);
})().catch(e => { console.error('TEST CRASHED', e); process.exit(2); });
