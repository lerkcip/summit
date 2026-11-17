// Checks the migrated progress: (1) the files for the private repo load on a fresh device through Pack → Sync with GitHub,
// (2) the backup file restores through Pack → Import JSON. Needs mock_web.js on 8767.
// usage: node test_migrate.js <baseUrl> <seedProgressDir> <backupFile>
const { chromium } = require('/opt/npm-tools/node_modules/playwright'), fs = require('fs'), path = require('path');
const [base, seedDir, backup] = process.argv.slice(2), M = 'http://localhost:8767';
const INIT = `window.SUMMIT_TEST_API = { github: '${M}/gh', anthropic: '${M}/an', wait: 700 };`;
let fails = 0; const ok = (c, m, x) => { console.log((c ? '  ok   ' : '  FAIL ') + m + (x !== undefined ? '  ' + JSON.stringify(x) : '')); if (!c) fails++; };
const admin = (p, b) => fetch(M + '/admin/' + p, b ? { method: 'POST', body: JSON.stringify(b) } : undefined).then(r => r.json());
const want = s => ({ xp: s.xp, read: Object.keys((s.ch[1] || {}).read || {}).sort().join(','), best: s.streak.best, days: Object.keys(s.days).length, ai: s.prefs.ai, created: s.created });
(async () => {
  const files = {}; fs.readdirSync(seedDir).forEach(f => { files[f] = JSON.parse(fs.readFileSync(path.join(seedDir, f), 'utf8')); });
  await admin('reset'); await admin('seed', { repo: 'me/summit-progress', files });
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }), errs = [];
  const fresh = async () => { const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await c.newPage(); p.on('pageerror', e => errs.push(String(e))); await p.addInitScript(INIT); await p.goto(base + '#pack'); await p.waitForFunction(() => window.S && S.state && S.sync.ready && document.querySelector('main h2'), null, { timeout: 10000 }); return { c, p }; };
  console.log('1. through the private repo');
  const a = await fresh();
  await a.p.fill('input[placeholder="yourname/summit-progress"]', 'me/summit-progress'); await a.p.fill('input[placeholder="github_pat_…"]', 'github_pat_good_0123456789abcdef');
  const nav = a.p.waitForEvent('load', { timeout: 15000 }); await a.p.getByRole('button', { name: 'Connect' }).click(); await nav;
  await a.p.waitForFunction(() => window.S && S.state && S.sync.ready && S.sync.mode === 'cloud', null, { timeout: 15000 });
  let st = await a.p.evaluate(() => ({ xp: S.state.xp, read: Object.keys((S.state.ch[1] || {}).read || {}).sort().join(','), best: S.state.streak.best, days: Object.keys(S.state.days).length, ai: S.state.prefs.ai, created: S.state.created }));
  const exp = { xp: files['main.json'].xp, read: Object.keys(files['main.json'].ch[1].read).sort().join(','), best: files['main.json'].streak.best, days: Object.keys(files['log.json'].days).length, ai: true, created: files['main.json'].created };
  ok(JSON.stringify(st) === JSON.stringify(exp), 'a fresh device opens with the migrated progress', st);
  await a.p.evaluate(() => { location.hash = '#read-1-3'; }); await a.p.waitForSelector('.doc p', { timeout: 8000 });
  ok(await a.p.evaluate(() => { const p = document.querySelector('.secnav .pill.ok'); return !!p && p.textContent === 'Read'; }), 'a section read in the Claude version shows as read');
  await a.c.close();
  console.log('2. through the backup file');
  const d = await fresh();
  await d.p.setInputFiles('#bkfile', backup); await d.p.waitForTimeout(300);
  await d.p.getByRole('button', { name: 'Restore the backup' }).click(); await d.p.waitForTimeout(400);
  st = await d.p.evaluate(() => ({ xp: S.state.xp, read: Object.keys((S.state.ch[1] || {}).read || {}).sort().join(','), best: S.state.streak.best, days: Object.keys(S.state.days).length, ai: S.state.prefs.ai, created: S.state.created }));
  ok(JSON.stringify(st) === JSON.stringify(exp), 'the backup file restores the same progress', st);
  await d.c.close(); await b.close();
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors');
  console.log(fails || errs.length ? 'FAILED' : 'MIGRATION CHECKS PASS'); process.exit(fails || errs.length ? 1 : 0);
})().catch(e => { console.error('CRASHED', e); process.exit(2); });
