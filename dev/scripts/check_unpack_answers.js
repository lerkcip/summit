// Cross-check: does the answer text of each numeric example contain the recomputed value (allowing rounding)?
const fs = require('fs'), path = require('path');
const [dir, calcPath] = process.argv.slice(2).map(p => path.resolve(p));
const calc = require(calcPath);
let n = 0, flagged = 0;
for (const f of fs.readdirSync(dir).filter(x => /^ch\d+\.txt$/.test(x)).sort()) {
  let sec = '', card = '';
  for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
    if (line.startsWith('# ')) sec = line.slice(2).trim();
    else if (line.startsWith('@')) card = line.replace(/^@\w+\s*/, '');
    const m = /^([ec]):\s*(.*)\{=\s*(.+?)\s*~\s*(.+?)\}\s*$/.exec(line);
    if (!m) continue;
    n++;
    const parts = m[2].split(/\s\|\s/), ans = parts[2] || '', v = calc(m[3]);
    const nums = (ans.replace(/(\d)[  ](?=\d{3}\b)/g, '$1').replace(/−/g, '-').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    const ok = nums.some(x => Math.abs(x - v) <= Math.max(Math.abs(v) * 0.03, 0.006) || Math.abs(Math.abs(x) - Math.abs(v)) <= Math.max(Math.abs(v) * 0.03, 0.006));
    if (!ok) { flagged++; console.log(`§${sec} ${card} [${m[1]}] calc=${+v.toPrecision(6)}  answer: ${ans.trim()}`); }
  }
}
console.log(n + ' numeric examples, ' + flagged + ' where the answer text does not show the recomputed number');
