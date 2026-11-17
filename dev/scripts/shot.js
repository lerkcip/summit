// Headless smoke test: node shot.js <baseUrl> <outDir> <script.json>
// script: [{go:'#hash'}|{click:'selector'}|{text:'button text'}|{fill:[sel,val]}|{shot:'name'}|{eval:'js'}|{wait:ms}]
const path = require('path');
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const [, , base, outDir, stepsFile, init] = process.argv;
  const steps = JSON.parse(require('fs').readFileSync(stepsFile, 'utf8'));
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
  page.on('pageerror', e => errs.push('PAGEERROR: ' + String(e.stack || e).slice(0, 600)));
  page.on('requestfailed', r => { if (!/fonts\.g/.test(r.url())) errs.push('REQFAIL: ' + r.url()); });
  if (init) await page.addInitScript({ path: init });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  for (const s of steps) {
    try {
      if (s.go) { await page.evaluate(h => { location.hash = h; }, s.go); await page.waitForTimeout(s.wait || 350); }
      else if (s.click) { await page.locator(s.click).first().click({ timeout: 4000 }); await page.waitForTimeout(s.wait || 300); }
      else if (s.text) { await page.getByRole('button', { name: s.text, exact: !!s.exact }).first().click({ timeout: 4000 }); await page.waitForTimeout(s.wait || 300); }
      else if (s.fill) { await page.locator(s.fill[0]).first().fill(String(s.fill[1])); }
      else if (s.shot) { await page.screenshot({ path: path.join(outDir, s.shot + '.png'), fullPage: false }); }
      else if (s.eval) { const r = await page.evaluate(s.eval); if (r !== undefined) console.log('EVAL', s.label || '', JSON.stringify(r)); await page.waitForTimeout(s.wait || 200); }
      else if (s.wait) await page.waitForTimeout(s.wait);
    } catch (e) { console.log('STEP FAILED', JSON.stringify(s), String(e.message).split('\n')[0]); }
  }
  console.log(errs.length ? 'CONSOLE:\n' + errs.join('\n') : 'no console errors');
  await browser.close();
})();
