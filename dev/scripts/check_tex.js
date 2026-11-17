// Validate every TeX string in curriculum.json with KaTeX; report failures and verify the I.3 map
const fs = require('fs'); const path = require('path');
const katex = require(path.join(process.argv[3], 'katex'));
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let n = 0, bad = {}; 
function scan(html, where) {
  if (!html) return;
  const re = /<span class="(mi|md)">([\s\S]*?)<\/span>/g; let m;
  while ((m = re.exec(html))) {
    n++;
    const tex = m[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    try { katex.renderToString(tex, { displayMode: m[1] === 'md', throwOnError: true, strict: false }); }
    catch (e) { const k = e.message.replace(/at position.*$/s, '').slice(0, 90); (bad[k] = bad[k] || []).push(where + ' :: ' + tex.slice(0, 120)); }
  }
}
for (const c of d.chapters) {
  scan(c.intro, 'ch' + c.n); scan(c.goalsHtml, 'ch' + c.n + ' goals');
  for (const s of c.secs) scan(s.html, s.id);
  for (const q of c.quiz) { scan(q.q, 'q' + c.n + '.' + q.n); scan(q.a, 'a' + c.n + '.' + q.n); }
}
for (const a of d.appendices) for (const s of a.secs) scan(s.html, 'App ' + a.id + ' ' + (s.id || ''));
for (const s of d.preface.secs) scan(s.html, 'preface');
for (const p of d.parts) scan(p.html, 'part');
console.log('math expressions:', n);
for (const k in bad) { console.log('\nERR', k, 'x' + bad[k].length); bad[k].slice(0, 4).forEach(x => console.log('   ', x)); }
// I.3 prerequisite map check
const I = d.appendices.find(a => a.id === 'I'); const s3 = I.secs.find(s => s.id === 'I.3');
const rows = [...s3.html.matchAll(/<tr>\s*<td>(\d+)<\/td>\s*<td>[\s\S]*?<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)];
let mism = 0;
for (const r of rows) { const c = d.chapters[+r[1] - 1]; const t = r[2].replace(/<[^>]+>/g, '').trim(); if (t !== c.buildsText) { mism++; console.log('MISMATCH ch' + r[1], JSON.stringify(t), 'vs', JSON.stringify(c.buildsText)); } }
console.log('\nI.3 rows:', rows.length, 'mismatches vs "Builds on" boxes:', mism);
