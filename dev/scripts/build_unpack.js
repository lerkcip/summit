// usage: node build_unpack.js <unpackDir> <appDir> <node_modules> <curriculum.json>
// Turns the authored card files (unpack/chNN.txt) into app/data/unpN.js and app/data/unp_index.js.
// Every TeX fragment is rendered by KaTeX and every numeric example is recomputed; any failure stops the build.
//
// Card file format:
//   # 1.2                       section id
//   @eq Name of the card        kind: eq | def | const
//   x: TeX of the equation      (optional)
//   w: the equation in words
//   s: sym ~ meaning ~ unit ; sym ~ meaning ~ unit
//   e: title | working | answer {= expression ~ expected}      two or three of these
//   c: what it is combined with | working | answer {= expression ~ expected}
//   u: where it is used
// Inline maths in w, e, c, u goes between $ signs.
const fs = require('fs'), path = require('path');
const [dir, app, nm, curFile] = process.argv.slice(2).map(p => path.resolve(p));
const katex = require(path.join(nm, 'katex')), calc = require(path.join(app, 'js/calc.js'));
const cur = JSON.parse(fs.readFileSync(curFile, 'utf8'));
const secIds = {}; cur.chapters.forEach(c => c.secs.forEach(s => { secIds[s.id] = c.n; }));
let errors = [], nCards = 0, nChecks = 0, nTex = 0; const have = {};
const tex = (t, where) => { nTex++; try { katex.renderToString(t, { throwOnError: true, strict: false }); } catch (e) { errors.push(where + ': TeX "' + t.slice(0, 60) + '" ' + String(e.message).slice(0, 90)); } };
const inline = (s, where) => s.replace(/\$([^$]+)\$/g, (m, t) => { tex(t, where); return '\\(' + t + '\\)'; });
function check(s, where) {          // strips {= expr ~ value} and verifies it
  const m = /\s*\{=\s*(.+?)\s*~\s*(-?[\d.eE+-]+)\s*\}\s*$/.exec(s);
  if (!m) return s.trim();
  nChecks++; const got = calc(m[1]), want = parseFloat(m[2]);
  if (!(Math.abs(got - want) <= Math.max(0.006 * Math.abs(want), 0.006))) errors.push(where + ': check ' + m[1] + ' = ' + got + ', expected ' + want);
  return s.slice(0, m.index).trim();
}
for (const f of fs.readdirSync(dir).filter(f => /^ch\d+\.txt$/.test(f)).sort()) {
  const n = +f.match(/\d+/)[0], out = {}; let sec = null, card = null;
  const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
  const close = () => { if (!card) return; const w = f + ' §' + sec + ' "' + card.n + '"';
    if (!card.w) errors.push(w + ': no words'); if (card.e.length < 2) errors.push(w + ': needs at least two examples'); if (!card.c) errors.push(w + ': no chained example'); if (!card.u) errors.push(w + ': no use-case');
    if (!card.s.length) delete card.s; if (!card.x) delete card.x; out[sec].push(card); nCards++; card = null; };
  lines.forEach((raw, li) => {
    const line = raw.trim(), where = f + ':' + (li + 1); if (!line || line.startsWith('//')) return;
    let m;
    if ((m = /^#\s*(\d+\.\d+)$/.exec(line))) { close(); sec = m[1]; if (secIds[sec] !== n) errors.push(where + ': §' + sec + ' is not a section of chapter ' + n); out[sec] = out[sec] || []; return; }
    if ((m = /^@(eq|def|const)\s+(.+)$/.exec(line))) { close(); if (!sec) errors.push(where + ': card before any section'); card = { k: m[1], n: m[2], x: '', w: '', s: [], e: [], c: null, u: '' }; return; }
    if (!card || !(m = /^([xwsecu]):\s*(.*)$/.exec(line))) { errors.push(where + ': cannot read "' + line.slice(0, 50) + '"'); return; }
    const key = m[1], val = m[2];
    if (key === 'x') { tex(val, where); card.x = val; }
    else if (key === 'w') card.w = inline(val, where);
    else if (key === 'u') card.u = inline(val, where);
    else if (key === 's') card.s = val.split(/\s;\s/).map(p => { const a = p.split(/\s~\s/).map(x => x.trim()); if (a.length < 2) errors.push(where + ': symbol needs "sym ~ meaning ~ unit"'); tex(a[0], where); return [a[0], a[1] || '', a[2] || '']; });
    else { const body = check(val, where), a = body.split(/\s\|\s/).map(x => inline(x.trim(), where)); if (a.length !== 3) errors.push(where + ': needs "title | working | answer", got ' + a.length + ' parts'); if (key === 'e') card.e.push(a); else card.c = a; }
  });
  close();
  have[n] = Object.keys(out).filter(k => out[k].length);
  const missing = cur.chapters[n - 1].secs.map(s => s.id).filter(id => !(out[id] && out[id].length));
  if (missing.length) console.log('  note: chapter ' + n + ' has no cards yet for §' + missing.join(', §'));
  fs.writeFileSync(path.join(app, 'data', 'unp' + n + '.js'), '/* SUMMIT · Unpacked cards for Chapter ' + n + ' (generated from unpack/' + f + ') */\nwindow.SUMMIT_UNPACK(' + n + ',' + JSON.stringify(out) + ');\n');
  console.log('chapter ' + n + ': ' + Object.values(out).reduce((a, x) => a + x.length, 0) + ' cards in ' + have[n].length + ' sections');
}
fs.writeFileSync(path.join(app, 'data', 'unp_index.js'), '/* SUMMIT · which sections have authored Unpacked cards */\nwindow.UNP_HAVE = ' + JSON.stringify(have) + ';\n');
console.log(nCards + ' cards, ' + nTex + ' TeX fragments rendered, ' + nChecks + ' numeric examples recomputed');
if (errors.length) { console.log('ERRORS (' + errors.length + '):\n' + errors.join('\n')); process.exit(1); }
console.log('OK');
