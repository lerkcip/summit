// Renders app/icons/icon.svg to the PNG sizes the manifest and iOS ask for. usage: node make_icons.js <iconsDir>
const { chromium } = require('/opt/npm-tools/node_modules/playwright'), fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2]), svg = fs.readFileSync(path.join(dir, 'icon.svg'), 'utf8');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const n of [512, 192, 180, 32]) {
    const p = await b.newPage({ viewport: { width: n, height: n }, deviceScaleFactor: 1 });
    await p.setContent('<html><body style="margin:0">' + svg.replace('<svg ', '<svg width="' + n + '" height="' + n + '" ') + '</body></html>');
    await p.screenshot({ path: path.join(dir, 'icon-' + n + '.png'), clip: { x: 0, y: 0, width: n, height: n } }); await p.close();
  }
  await b.close(); console.log('icons ok');
})();
