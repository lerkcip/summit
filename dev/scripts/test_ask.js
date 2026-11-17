// Tests "Ask about a highlight": the button that appears on a text selection, the popup, streaming, follow-ups,
// the named model, stop, failures, reopen, and where it must not appear. Runs against the runtime test double.
// usage: node test_ask.js <baseUrl> [shotDir]
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
  const go = async (page, hash, sel) => { await page.evaluate(h => { location.hash = h; }, hash); await page.waitForSelector(sel, { timeout: 8000 }); await sleep(300); };
  // select the contents of the first element matching sel whose text matches re (or a text slice inside it)
  const select = (page, sel, re, inner) => page.evaluate(([sel, re, inner]) => {
    const rx = new RegExp(re), el = [].filter.call(document.querySelectorAll(sel), e => rx.test(e.textContent))[0]; if (!el) return null;
    const r = document.createRange(); if (inner) { const k = el.querySelector(inner); if (!k) return null; r.selectNodeContents(k); } else r.selectNodeContents(el);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); el.scrollIntoView({ block: 'center' }); return s.toString().length;
  }, [sel, re, inner || null]);
  const pillUp = page => page.waitForSelector('.askpill', { timeout: 3000 }).then(() => true, () => false);
  const lastChat = page => page.evaluate(() => { const c = window.__calls.chat || []; return c[c.length - 1] || null; });

  console.log('A. without Claude (this browser only) nothing is offered');
  const a = await device('A', false);
  await go(a.page, '#read-1-2', '.doc p');
  await select(a.page, '.doc p', 'dimension');
  await sleep(700);
  let st = await a.page.evaluate(() => ({ pill: !!document.querySelector('.askpill'), hint: [].map.call(document.querySelectorAll('.askhint'), e => e.hidden + ':' + getComputedStyle(e).display) }));
  ok(!st.pill && st.hint.length === 1 && st.hint[0] === 'true:none', 'no button and no hint when Claude is not available', st);
  await a.ctx.close();

  console.log('B. highlight, ask, streamed answer from the named model');
  await fetch(CLOUD + 'reset');
  const reply = `window.__chatReply = function (turns) {
    var q = turns[turns.length - 1].content;
    if (/second/.test(q)) return 'A follow-up answer that mentions \\\\(g_0\\\\).';
    return 'The **dimension** of force is mass times length over time squared: \\\\([F] = M L T^{-2}\\\\).\\n\\n- First point with $v = 3$ m/s\\n- Second point costs $5 and $10\\n\\n1. Step one\\n2. Step two\\n\\n\\\\[ F = m a \\\\]\\n\\n<img src=x onerror="window.__xss=1"> and <script>window.__xss=2</script> stay as text. Use \`pint\` in code.';
  }; window.__chatChunks = 4; window.__chatDelay = 180;`;
  const b = await device('B', true, reply);
  await b.page.waitForFunction(() => S.sync.ready && S.ai.st === 'ok', null, { timeout: 8000 });
  await go(b.page, '#read-1-2', '.doc p');
  await b.page.waitForFunction(() => document.querySelectorAll('.doc span[data-tex]').length > 2, null, { timeout: 8000 });
  st = await b.page.evaluate(() => { const e = document.querySelector('.askhint'); return { hidden: e.hidden, t: e.textContent }; });
  ok(!st.hidden && /Highlight any passage/.test(st.t) && /Claude Opus 5\.5/.test(st.t), 'the reader says the feature exists', st.t.slice(0, 90));
  const picked = await select(b.page, '.doc p', '\\[F\\]|dimension');
  ok(picked > 20, 'a paragraph with a formula is highlighted', picked);
  ok(await pillUp(b.page), 'the “Ask Claude about this” button appears');
  st = await b.page.evaluate(() => { const p = document.querySelector('.askpill').getBoundingClientRect(), t = document.querySelector('nav.tabs').getBoundingClientRect(); return { h: Math.round(p.height), w: Math.round(p.width), left: Math.round(p.left), right: Math.round(p.right), gap: Math.round(t.top - p.bottom), text: document.querySelector('.askpill').textContent }; });
  ok(st.h >= 44 && st.left >= 8 && st.right <= 382 && st.gap >= 8 && st.gap <= 30 && st.text === 'Ask Claude about this', 'it sits just above the tab bar, 44 px or taller, inside the screen', st);
  if (shots) await b.page.screenshot({ path: path.join(shots, 'ask_pill.png') });
  await b.page.locator('.askpill').click(); await sleep(350);
  st = await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'); if (!s) return null; const ta = s.querySelector('textarea'); return { title: s.querySelector('h3').textContent, quote: s.querySelector('.askq').textContent.length, qk: s.querySelectorAll('.askq .katex').length, chips: s.querySelectorAll('.askchip').length, fs: parseFloat(getComputedStyle(ta).fontSize), pill: !!document.querySelector('.askpill'), sel: getSelection().toString().length, send: s.querySelector('.askrow .btn.go').textContent, stopHidden: getComputedStyle(s.querySelectorAll('.askrow .btn')[1]).display, status: s.querySelector('[role=status]').textContent, kerr: s.querySelectorAll('.katex-error').length }; });
  ok(st && /§1\.2/.test(st.title) && st.quote > 20 && st.qk >= 1 && !st.kerr, 'the popup opens, titled with the section, quoting the highlight with its maths drawn', st && { title: st.title, quoteChars: st.quote, formulas: st.qk });
  ok(st && st.chips === 4 && st.fs >= 16 && !st.pill && st.sel === 0 && st.send === 'Ask' && st.stopHidden === 'none' && /Claude Opus 5\.5/.test(st.status), 'four quick questions, a 16 px question box (no zoom on iPhone), Stop hidden until needed', st && { chips: st.chips, fs: st.fs, stop: st.stopHidden });
  if (shots) await b.page.screenshot({ path: path.join(shots, 'ask_open.png') });
  await b.page.locator('.askta').fill('Why is force mass times length over time squared?');
  await b.page.locator('.askrow .btn.go').click(); await sleep(90);
  st = await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'); return { think: /Thinking/.test(s.querySelector('.askm.claude').textContent), you: s.querySelector('.askm.you .askb').textContent, stop: getComputedStyle(s.querySelectorAll('.askrow .btn')[1]).display !== 'none', send: getComputedStyle(s.querySelector('.askrow .btn.go')).display, chips: s.querySelectorAll('.askchip').length, ta: s.querySelector('textarea').disabled }; });
  ok(st.think && /Why is force/.test(st.you) && st.stop && st.send === 'none' && st.chips === 0 && st.ta, 'while waiting: “Thinking…”, the question shown, Stop offered, input locked', st);
  await sleep(350);
  const mid = await b.page.evaluate(() => document.querySelector('.askm.claude .askb').textContent.length);
  await b.page.waitForSelector('.askm.claude .askmeta', { timeout: 6000 }); await sleep(150);
  st = await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'), a = s.querySelector('.askm.claude'), b = a.querySelector('.askb'); return { len: b.textContent.length, bold: b.querySelectorAll('b:not(.askn)').length, ul: b.querySelectorAll('ul:not(.num) li').length, num: b.querySelectorAll('ul.num li').length, mi: b.querySelectorAll('.mi .katex').length, md: b.querySelectorAll('.md .katex-display').length, code: b.querySelectorAll('code').length, img: b.querySelectorAll('img, script').length, xss: window.__xss || 0, shown: /<img src=x/.test(b.textContent), money: /costs \$5 and \$10/.test(b.textContent), kerr: b.querySelectorAll('.katex-error').length, meta: a.querySelector('.askmeta').textContent, status: s.querySelector('.askbar [role=status]').textContent, sendBack: getComputedStyle(s.querySelector('.askrow .btn.go')).display !== 'none', head: Math.round(document.querySelector('header.top').getBoundingClientRect().top), doc: document.scrollingElement.scrollTop, over: s.scrollWidth > s.clientWidth + 1, wide: [].filter.call(b.querySelectorAll('*'), e => !e.closest('.katex') && e.getBoundingClientRect().right > innerWidth + 1).length }; });
  ok(mid > 0 && mid < st.len, 'the answer streams in (partial text was on screen before the end)', { mid, final: st.len });
  ok(st.bold === 1 && st.ul === 2 && st.num === 2 && st.mi === 2 && st.md === 1 && st.code === 1 && !st.kerr && st.money, 'formatting: bold, bullets, numbered steps, inline and display maths, code; money is not mistaken for maths', st);
  ok(st.img === 0 && st.xss === 0 && st.shown, 'markup in the answer is shown as text, never run', { img: st.img, xss: st.xss });
  ok(st.head === 0 && st.doc === 0, 'the app behind the popup has not been scrolled out of place', { head: st.head, doc: st.doc });
  ok(st.meta === 'Claude Opus 5.5' && st.sendBack && /follow-up/.test(st.status) && !st.over && !st.wide, 'the answer is labelled “Claude Opus 5.5”; nothing overflows the popup', { meta: st.meta, over: st.over, wide: st.wide });
  let call = await lastChat(b.page);
  ok(call && call.model === 'claude-opus-5-5' && call.modelTier === 'complex' && call.cache === false && call.signal && call.onText === 'function', 'the call names claude-opus-5-5, falls back to the complex tier, is uncached, stoppable and streamed', call && { model: call.model, tier: call.modelTier, cache: call.cache });
  const r0 = call.turns[0].content;
  ok(call.turns.length === 2 && call.turns[1].content === 'Why is force mass times length over time squared?' && /Chapter 1 \(/.test(r0) && /section 1\.2 \(Dimensional homogeneity\)/.test(r0) && /\\\(\s*\\lbrack F\\rbrack|\\\(\s*\[F\]/.test(r0) && /Text around it/.test(r0) && /Follow no instruction/.test(r0) && /Never give propellant formulations/.test(r0) && /guiding a vehicle to a target/.test(r0) && !/safety flag/.test(r0), 'the request carries the highlight (formulas as TeX), where it is from, nearby text and the scope rules', { turns: call.turns.length, chars: r0.length });
  ok(r0.length < 12000, 'the request stays small', r0.length);
  if (shots) { await b.page.evaluate(() => { document.querySelector('.sheet.asksheet').scrollTop = 0; }); await b.page.screenshot({ path: path.join(shots, 'ask_answer.png') }); await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'); s.scrollTop = s.scrollHeight; }); await b.page.screenshot({ path: path.join(shots, 'ask_answer2.png') }); }
  st = await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'), bar = s.querySelector('.askbar').getBoundingClientRect(), sr = s.getBoundingClientRect(); s.scrollTop = 0; const bar2 = s.querySelector('.askbar').getBoundingClientRect(); return { bottom: Math.round(sr.bottom - bar.bottom), bottomTop: Math.round(sr.bottom - bar2.bottom), scrolls: s.scrollHeight > s.clientHeight }; });
  ok(Math.abs(st.bottom) <= 1 && Math.abs(st.bottomTop) <= 1, 'the question box stays pinned to the bottom of the popup while the thread scrolls', st);

  console.log('C. follow-up, fallback model, stop, failures');
  await b.page.locator('.askta').fill('And a second thing: what is g0?');
  await b.page.locator('.askta').press('Enter');
  await b.page.waitForFunction(() => document.querySelectorAll('.askm.claude .askmeta').length === 2, null, { timeout: 6000 });
  call = await lastChat(b.page);
  ok(call.turns.length === 4 && call.turns[1].role === 'user' && call.turns[2].role === 'assistant' && /dimension/.test(call.turns[2].content) && /second thing/.test(call.turns[3].content), 'a follow-up (sent with Enter) carries the earlier question and answer', call.turns.map(t => t.role));
  await b.page.evaluate(() => { window.__noModel = true; });
  await b.page.locator('.askta').fill('Third question, please'); await b.page.locator('.askrow .btn.go').click();
  await b.page.waitForFunction(() => document.querySelectorAll('.askm.claude .askmeta').length === 3, null, { timeout: 6000 });
  st = await b.page.evaluate(() => [].map.call(document.querySelectorAll('.askm.claude .askmeta'), e => e.textContent)[2]);
  ok(/Claude Opus 5\.5 was not available for this answer/.test(st) && /most capable available model wrote it/.test(st), 'when Opus 5.5 does not answer, the popup says which kind of model did', st);
  await b.page.evaluate(() => { window.__noModel = false; window.__chatDelay = 500; window.__chatChunks = 6; });
  await b.page.locator('.askta').fill('A long one to stop'); await b.page.locator('.askrow .btn.go').click();
  await sleep(1250);
  await b.page.locator('.askrow .btn', { hasText: 'Stop' }).click(); await sleep(700);
  st = await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'), ms = s.querySelectorAll('.askm.claude'), m = ms[ms.length - 1]; return { n: ms.length, len: m.querySelector('.askb').textContent.length, meta: m.querySelector('.askmeta') && m.querySelector('.askmeta').textContent, status: s.querySelector('.askbar [role=status]').textContent, send: getComputedStyle(s.querySelector('.askrow .btn.go')).display !== 'none', ta: s.querySelector('textarea').disabled }; });
  ok(st.n === 4 && st.len > 10 && st.len < 300 && /Stopped before the end/.test(st.meta || '') && /Stopped/.test(st.status) && st.send && !st.ta, 'Stop keeps what was written and hands the box back', st);
  await b.page.evaluate(() => { window.__chatDelay = 60; window.__chatChunks = 2; window.__sampleFail = 'rate_limited'; });
  await b.page.locator('.askta').fill('This one fails'); await b.page.locator('.askrow .btn.go').click(); await sleep(500);
  st = await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'); return { you: s.querySelectorAll('.askm.you').length, claude: s.querySelectorAll('.askm.claude').length, ta: s.querySelector('textarea').value, status: s.querySelector('.askbar [role=status]').textContent }; });
  ok(st.you === 4 && st.claude === 4 && st.ta === 'This one fails' && /rate-limited/.test(st.status), 'a failed question leaves no empty bubble, explains why, and puts the question back in the box', st);
  await b.page.evaluate(() => { window.__sampleFail = null; window.__chatFailMid = 'refused'; });
  await b.page.locator('.askrow .btn.go').click(); await sleep(600);
  st = await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'); return { claude: s.querySelectorAll('.askm.claude').length, status: s.querySelector('.askbar [role=status]').textContent }; });
  ok(st.claude === 4 && /declined/.test(st.status), 'a refusal part-way withdraws the partial text', st);
  await b.page.evaluate(() => { window.__chatFailMid = 'upstream_error'; });
  await b.page.locator('.askrow .btn.go').click(); await sleep(600);
  st = await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'), ms = s.querySelectorAll('.askm.claude'); return { claude: ms.length, meta: ms[ms.length - 1].querySelector('.askmeta').textContent, status: s.querySelector('.askbar [role=status]').textContent }; });
  ok(st.claude === 5 && /Interrupted/.test(st.meta) && /dropped part-way/.test(st.status), 'a dropped connection keeps the part that arrived and says so', st);
  await b.page.evaluate(() => { window.__chatFailMid = null; });

  console.log('D. close, reopen, other places to highlight');
  await b.page.locator('.asksheet .btn', { hasText: 'Close' }).click(); await sleep(300);
  st = await b.page.evaluate(() => ({ sheet: !!document.querySelector('.sheet'), re: [].map.call(document.querySelectorAll('.askhint button'), x => x.textContent) }));
  ok(!st.sheet && st.re.length === 1 && /Reopen your last answer/.test(st.re[0]), 'after closing, the reader offers “Reopen your last answer”', st);
  await b.page.locator('.askhint button').click(); await sleep(300);
  st = await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'); return s ? { you: s.querySelectorAll('.askm.you').length, claude: s.querySelectorAll('.askm.claude').length, k: s.querySelectorAll('.askm.claude .katex').length, chips: s.querySelectorAll('.askchip').length } : null; });
  ok(st && st.you === 5 && st.claude === 5 && st.k >= 3 && st.chips === 0, 'the whole thread comes back, maths drawn', st);
  await b.page.evaluate(() => { const sc = document.querySelector('.scrim'), r = sc.getBoundingClientRect(); sc.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + 20, clientY: r.top + 10 })); }); await sleep(250);
  ok(!(await b.page.$('.sheet')), 'tapping outside closes it');
  // a highlight inside a single formula means that formula
  await select(b.page, '.doc', '.', 'span[data-tex] .katex-html');
  ok(await pillUp(b.page), 'highlighting inside one formula offers the button');
  await b.page.locator('.askpill').click(); await sleep(300);
  st = await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'); return { q: s.querySelector('.askq').textContent.length, k: s.querySelectorAll('.askq .katex').length }; });
  ok(st.k === 1, 'the quote is that whole formula', st);
  await b.page.locator('.askchip').first().click();
  await b.page.waitForSelector('.askm.claude .askmeta', { timeout: 6000 });
  call = await lastChat(b.page);
  ok(call.turns.length === 2 && call.turns[1].content === 'Explain this in plain words' && /<<<\n\\\(.+\\\)\n>>>/.test(call.turns[0].content), 'a quick question sends at once, with the formula as TeX', call.turns[1].content);
  await b.page.locator('.asksheet .btn', { hasText: 'Close' }).click(); await sleep(250);
  // inside an Unpacked card
  await b.page.waitForSelector('.unp .ucard', { timeout: 6000 });
  await select(b.page, '.unp .uw', 'dimension of force');
  ok(await pillUp(b.page), 'highlighting inside an Unpacked card offers the button');
  await b.page.locator('.askpill').tap(); await sleep(450);
  ok((await b.page.$$('.sheet.asksheet')).length === 1 && !(await b.page.$('.askpill')), 'a finger tap (touch events, no mouse) opens exactly one popup and it stays open');
  await b.page.locator('.askta').fill('What does M L T mean?'); await b.page.locator('.askrow .btn.go').click();
  await b.page.waitForSelector('.askm.claude .askmeta', { timeout: 6000 });
  call = await lastChat(b.page);
  ok(/The dimension of force is mass times length/.test(call.turns[0].content) && /Collapse all|Open all/.test(call.turns[0].content) === false, 'the card text is the passage; buttons are left out of the context', call.turns[0].content.length);
  await b.page.locator('.asksheet .btn', { hasText: 'Close' }).click(); await sleep(250);
  // the highlight goes away, so does the button
  await select(b.page, '.doc p', 'dimension'); await pillUp(b.page);
  await b.page.evaluate(() => getSelection().removeAllRanges()); await sleep(1300);
  ok(!(await b.page.$('.askpill')), 'the button leaves when the highlight is cleared');
  // long highlight is capped
  await b.page.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.querySelector('.unp')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  ok(await pillUp(b.page), 'a very long highlight still offers the button');
  await b.page.locator('.askpill').click(); await sleep(300);
  st = await b.page.evaluate(() => ({ note: /only its first 2,500 characters/.test(document.querySelector('.sheet.asksheet').textContent), qh: Math.round(document.querySelector('.askq').getBoundingClientRect().height) }));
  ok(st.note && st.qh <= 120, 'a long highlight is cut to 2,500 characters, says so, and the quote stays compact', st);
  await b.page.locator('.asksheet .btn', { hasText: 'Close' }).click(); await sleep(250);

  console.log('E. where it must not appear, flagged sections, and losing permission');
  await go(b.page, '#ch-1', 'main h1, main h2');
  await b.page.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.querySelector('main')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await sleep(700);
  ok(!(await b.page.$('.askpill')), 'no button on the chapter page (only the reading and the cards can be asked about)');
  await b.page.evaluate(() => getSelection().removeAllRanges());
  await go(b.page, '#quiz-1', 'main');
  await sleep(300);
  await b.page.evaluate(() => { const b0 = [].filter.call(document.querySelectorAll('main button'), x => /Start|Begin|quiz/i.test(x.textContent))[0]; if (b0) b0.click(); });
  await sleep(500);
  await b.page.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.querySelector('main')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
  await sleep(700);
  ok(!(await b.page.$('.askpill')), 'no button inside a quiz');
  await b.page.evaluate(() => getSelection().removeAllRanges());
  await go(b.page, '#read-6-7', '.doc p');
  await select(b.page, '.doc p', '.'); ok(await pillUp(b.page), 'a safety-flagged section can still be asked about');
  await b.page.locator('.askpill').click(); await sleep(300);
  await b.page.locator('.askchip').nth(2).click(); await b.page.waitForSelector('.askm.claude .askmeta', { timeout: 6000 });
  call = await lastChat(b.page);
  ok(/This section carries a safety flag in the notes: add no detail beyond the text/.test(call.turns[0].content) && /Never give propellant formulations/.test(call.turns[0].content), 'but the request tells Claude to add nothing beyond the text on the flagged topic', call.turns[0].content.length);
  await b.page.locator('.asksheet .btn', { hasText: 'Close' }).click(); await sleep(250);
  await go(b.page, '#ap-B', '.doc');
  await b.page.waitForFunction(() => document.querySelector('.doc').textContent.length > 200, null, { timeout: 8000 });
  await select(b.page, '.doc td, .doc p, .doc li', '.'); ok(await pillUp(b.page), 'appendix pages can be asked about too');
  await b.page.locator('.askpill').click(); await sleep(300);
  st = await b.page.evaluate(() => document.querySelector('.sheet.asksheet h3').textContent);
  ok(/Appendix B/.test(st), 'titled with the appendix', st);
  await b.page.evaluate(() => { window.__sampleFail = 'not_granted'; });
  await b.page.locator('.askta').fill('Will this be allowed?'); await b.page.locator('.askrow .btn.go').click(); await sleep(500);
  st = await b.page.evaluate(() => { const s = document.querySelector('.sheet.asksheet'); return { status: s.querySelector('.askbar [role=status]').textContent, ta: s.querySelector('textarea').disabled, send: s.querySelector('.askrow .btn.go').disabled, ai: S.ai.st }; });
  ok(/not allowed/.test(st.status) && st.ta && st.send && st.ai === 'off', 'if Claude is not allowed, the popup says so and the box is switched off', st);
  await b.page.locator('.asksheet .btn', { hasText: 'Close' }).click(); await sleep(250);
  await select(b.page, '.doc td, .doc p, .doc li', '.'); await sleep(700);
  ok(!(await b.page.$('.askpill')), 'and the button is no longer offered');
  await b.ctx.close();

  console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(fails || errs.length ? 'FAILED: ' + fails + ' checks, ' + errs.length + ' page errors' : 'ALL ASK CHECKS PASS');
  await browser.close(); process.exit(fails || errs.length ? 1 : 0);
})().catch(e => { console.error('TEST CRASHED', e); process.exit(2); });
