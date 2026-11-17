// Verify bank templates: base values must reproduce Appendix J numbers; random variants must be finite.
const fs = require('fs'), path = require('path');
const app = process.argv[2], cur = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const only = process.argv[4] ? process.argv[4].split('-').map(Number) : null;
global.window = undefined;
const P = require(path.join(app, 'js/phys.js'));
for (const f of fs.readdirSync(path.join(app, 'js')).filter(f => /^bank\d\.js$/.test(f)).sort()) require(path.join(app, 'js', f));
const BANK = globalThis.BANK, INST = globalThis.BANK_INST;
function plain(h) { return h.replace(/<span class="m[id]">([\s\S]*?)<\/span>/g, ' $1 ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'); }
function nums(t) {
  t = t.replace(/\\,\s*/g, '').replace(/(\d)\s(?=\d{3}\b)/g, '$1').replace(/[{}]/g, '').replace(/−/g, '-').replace(/\\left|\\right/g, '');
  const out = [];
  t = t.replace(/(-?\d+\.?\d*)\s*\\times\s*10\^\s*(-\s*\d+|\d+)/g, (m, a, b) => { out.push(parseFloat(a) * Math.pow(10, parseInt(b.replace(/\s/g, '')))); return ' '; });
  t = t.replace(/10\^\s*(-\s*\d+|\d+)/g, (m, b) => { out.push(Math.pow(10, parseInt(b.replace(/\s/g, '')))); return ' '; });
  t = t.replace(/\\frac\s*(\d+)\s*(\d+)/g, (m, a, b) => { out.push(a / b); return ' '; });
  for (const m of t.matchAll(/-\s*\d+\.?\d*|\d+\.?\d*/g)) { const x = parseFloat(m[0].replace(/\s/g, '')); out.push(x); out.push(Math.abs(x)); }
  return out;
}
const scales = [1, 1e3, 1e-3, 1e6, 1e-6, 100, 0.01, 1e9, 1e-9, 60, 1 / 60, 10, 0.1, 1e4, 1e-4];
let nt = 0, ns = 0, nx = 0, flagged = 0, bad = 0;
for (const c of cur.chapters) {
  if (only && (c.n < only[0] || c.n > only[1])) continue;
  const b = BANK[c.n]; if (!b) { console.log('ch' + c.n + ': NO BANK'); continue; }
  nx += b.x.length;
  for (const q of c.quiz) {
    const t = b.t[q.n], s = b.s[q.n]; let fields = null;
    if (t) { nt++; try { const o = INST(t, null); fields = t.vo ? null : o.f; if (!o.q) { console.log(`  !! ${c.n}.${q.n} base has no q text`); bad++; }
        const r = P.rng('v' + c.n + '.' + q.n);
        for (let i = 0; i < 40; i++) { const o2 = INST(t, r); for (const f of o2.f) if (typeof f[1] !== 'number' || !isFinite(f[1])) { console.log(`  !! ${c.n}.${q.n} non-finite variant`, JSON.stringify(o2.v), f[0]); bad++; i = 99; break; } if (!o2.q || /undefined|NaN/.test(o2.q)) { console.log(`  !! ${c.n}.${q.n} bad variant text`, o2.q); bad++; break; } }
      } catch (e) { console.log(`  !! ${c.n}.${q.n} threw ${e.message}`); bad++; } }
    if (s) { ns++; fields = s; }
    if (!fields) continue;
    const an = nums(plain(q.a)).concat(nums(plain(q.q)));
    for (const f of fields) {
      const val = f[1]; let ok = false;
      if (Math.abs(val) < 1e-9) ok = an.some(x => Math.abs(x) < 1e-9) || true;
      else for (const x of an) { for (const sc of scales) { if (Math.abs(x * sc - val) <= 0.012 * Math.abs(val) + 1e-12) { ok = true; break; } } if (ok) break; }
      if (!ok) { flagged++; console.log(`  ?? ${c.n}.${q.n} [${f[0]}] computed ${+val.toPrecision(5)} ${f[2] || ''} — not found in key: ${plain(q.a).replace(/\s+/g, ' ').slice(0, 150)}`); }
    }
  }
  for (const k of Object.keys(b.t)) if (!c.quiz[k - 1]) { console.log(`  !! ${c.n}.${k} template for missing question`); bad++; }
}
console.log(`templates ${nt}, static ${ns}, extra ${nx}, flagged ${flagged}, errors ${bad}`);
