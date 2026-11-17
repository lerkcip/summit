// usage: node test_shop.js <appDir>
const path = require('path');
const app = process.argv[2];
globalThis.window = globalThis;
require(path.join(app, 'js/phys.js'));
const GC = require(path.join(app, 'js/gcode.js')) || globalThis.GC;
const SD = require(path.join(app, 'js/shopdata.js')) || globalThis.SHOPD;
const P = globalThis.PHYS;
let bad = 0;
function cfgOf(s) { return { w: s.stock.w, h: s.stock.h, t: s.stock.t, tool: s.tool, doc: s.doc, feedMax: s.feedMax, plungeMax: s.plungeMax, rapid: 3000, safe: 5 }; }
for (const id of SD.ORDER) {
  const s = SD.C[id](null);
  const r = GC.simulate(s.ref, cfgOf(s));
  const cmp = GC.compare(r.hm, r.hm, s.tol, r.nx);
  const air = r.airLen / Math.max(1e-9, r.feedLen);
  const viol = (r.docMax > s.doc + 1e-6 ? ' DOC ' + r.docMax.toFixed(2) + '@' + r.docLine : '') + (r.plunge > s.plungeMax + 1e-6 ? ' PLUNGE ' + r.plunge : '') + (r.feedOver > s.feedMax + 1e-6 ? ' FEED ' + r.feedOver : '');
  console.log(id.padEnd(8), 'err', r.errors.length, 'warn', (r.warns || []).length, 'time', r.time.toFixed(2), 'min feed', r.feedLen.toFixed(0), 'air', (air * 100).toFixed(0) + '%', 'rapid', r.rapidLen.toFixed(0), 'removed', r.removed.toFixed(0), 'acc', cmp.acc.toFixed(3), 'A', cmp.A, viol);
  if (r.errors.length) { bad++; console.log('   ', JSON.stringify(r.errors.slice(0, 3))); }
  if ((r.warns || []).length) console.log('   warns', JSON.stringify(r.warns.slice(0, 3)));
  if (viol) bad++;
  // random variants
  for (let k = 0; k < 60; k++) {
    const rng = P.rng(P.hash(id + ':' + k));
    const v = SD.C[id](rng), rv = GC.simulate(v.ref, cfgOf(v));
    const vv = (rv.docMax > v.doc + 1e-6 ? 'DOC' : '') + (rv.plunge > v.plungeMax + 1e-6 ? 'PL' : '') + (rv.feedOver > v.feedMax + 1e-6 ? 'FD' : '');
    if (rv.errors.length || vv) { bad++; console.log('   variant', k, vv, JSON.stringify(rv.errors.slice(0, 2)), v.text.slice(0, 120)); break; }
  }
}
// challenge generators
for (const key of ['FS', 'SETUP', 'RIGID']) {
  SD[key].forEach((gen, i) => {
    for (let k = 0; k < 200; k++) {
      const o = gen(P.rng(P.hash(key + i + ':' + k)));
      if (!o.q || !o.f || !o.f.length) { bad++; console.log('bad gen', key, i); break; }
      for (const f of o.f) if (!isFinite(f[1])) { bad++; console.log('non-finite', key, i, o.q); break; }
    }
  });
}
console.log(bad ? 'FAILURES ' + bad : 'ALL OK');
