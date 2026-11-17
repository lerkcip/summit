const path = require('path'); const app = process.argv[2];
globalThis.window = globalThis;
require(path.join(app, 'js/phys.js'));
const GC = require(path.join(app, 'js/gcode.js')); const SD = require(path.join(app, 'js/shopdata.js'));
function cfgOf(s) { return { w: s.stock.w, h: s.stock.h, t: s.stock.t, tool: s.tool, doc: s.doc, feedMax: s.feedMax, plungeMax: s.plungeMax, rapid: 3000, safe: 5 }; }
function run(id, alt, label) {
  const s = SD.C[id](null), ref = GC.simulate(s.ref, cfgOf(s)), u = GC.simulate(alt, cfgOf(s)), c = GC.compare(u.hm, ref.hm, s.tol, ref.nx);
  console.log(id.padEnd(8), label.padEnd(34), 'err', u.errors.length ? JSON.stringify(u.errors[0]) : 0, 'acc', c.acc.toFixed(4), 'under', c.under, 'over', c.over, 'A', c.A, 'time', u.time.toFixed(2), '/', ref.time.toFixed(2), 'air', u.airLen.toFixed(1), '/', ref.airLen.toFixed(1), 'doc', u.docMax.toFixed(2));
}
const H = 'G21 G90\nG0 Z5\n';
// circle rc=18 about (40,30) d 1.5
run('circle', H + 'G0 X22 Y30\nG0 Z1\nG1 Z-1.5 F300\nG3 X22 Y30 I18 J0 F900\nG0 Z5\n', 'G3 from the left, rapid to Z1');
run('circle', H + 'G0 X40 Y48\nG1 Z-1.5 F300\nG2 X40 Y12 I0 J-18 F900\nG2 X40 Y48 I0 J18\nG0 Z5\n', 'two half arcs from the top');
run('circle', H + 'G0 X58 Y30\nG1 Z-1.5 F300\nG2 X22 Y30 R18 F900\nG2 X58 Y30 R18\nG0 Z5\n', 'R-format halves');
run('circle', H + 'G0 X58.5 Y30\nG1 Z-1.5 F300\nG2 X58.5 Y30 I-18.5 J0 F900\nG0 Z5\n', 'radius 0.5 mm too big');
run('circle', H + 'G0 X59.5 Y30\nG1 Z-1.5 F300\nG2 X59.5 Y30 I-19.5 J0 F900\nG0 Z5\n', 'radius 1.5 mm too big (no offset)');
run('circle', H + 'G0 X58 Y30\nG1 Z-1.2 F300\nG2 X58 Y30 I-18 J0 F900\nG0 Z5\n', 'depth 0.3 short');
// rect: x0=20,y0=18,a=40,b=24,d=2,r=1.5
run('rect', H + 'G0 X18.5 Y16.5\nG1 Z-2 F300\nG1 Y43.5 F1000\nG1 X61.5\nG1 Y16.5\nG1 X18.5\nG0 Z5\n', 'other direction');
run('rect', H + 'G0 X20 Y18\nG1 Z-2 F300\nG1 X60 F1000\nG1 Y42\nG1 X20\nG1 Y18\nG0 Z5\n', 'no tool offset');
// pocket x0=20,y0=18,a=40,b=24, tool 6: rows in X; alt: perimeter then columns
let alt = H + 'G0 X23 Y21\nG1 Z-2 F300\nG1 X57 F1000\nG1 Y39\nG1 X23\nG1 Y21\n';
for (let x = 27.5, d = 0; x < 57; x += 4.5, d ^= 1) alt += 'G1 X' + x + '\nG1 Y' + (d ? 21 : 39) + '\n';
run('pocket', alt + 'G0 Z5\n', 'perimeter + columns');
run('pocket', H + 'G0 X23 Y21\nG1 Z-2 F300\nG1 X57 F1000\nG1 Y27\nG1 X23\nG1 Y33\nG1 X57\nG1 Y39\nG1 X23\nG0 Z5\n', '6 mm stepover (ridge?)');
// fin
const sf = SD.C.fin(null); const lines = sf.ref.split('\n').filter(l => /^G1 X/.test(l));
const pts = lines.map(l => l.match(/X([-\d.]+) Y([-\d.]+)/).slice(1, 3).map(Number));
let fin = H + 'G0 X' + pts[3][0] + ' Y' + pts[3][1] + '\nG0 Z0.5\nG1 Z-3.3 F250\n';
[2, 1, 0, 3].forEach(i => fin += 'G1 X' + pts[i][0].toFixed(2) + ' Y' + pts[i][1].toFixed(2) + ' F900\n');
run('fin', fin + 'G0 Z5\n', 'clockwise, 2-decimal rounding');
// fin without offset
const v = [[16, 14], [86, 14], [76, 59], [41, 59]];
run('fin', H + 'G0 X16 Y14\nG1 Z-3.3 F250\n' + [1, 2, 3, 0].map(i => 'G1 X' + v[i][0] + ' Y' + v[i][1] + ' F900\n').join('') + 'G0 Z5\n', 'no offset');
// ogive Rb 30 L 90: rho=150; G2 from (10,38) to (100,8) centre (10, 38-150)
run('ogive', H + 'G0 X100 Y8\nG1 Z-1 F300\nG3 X10 Y38 I-90 J-120 F800\nG0 Z5\n', 'tip to base with G3');
run('ogive', H + 'G0 X10 Y38\nG1 Z-1 F300\nG2 X100 Y8 R150 F800\nG0 Z5\n', 'R150');
run('ogive', H + 'G0 X10 Y38\nG1 Z-1 F300\nG1 X100 Y8 F800\nG0 Z5\n', 'straight line (cone)');
// slot deeper in one pass (doc violation)
run('slot', H + 'G0 X12 Y20\nG1 Z-4 F300\nG1 X68 F1100\nG0 Z5\n', 'single 4 mm pass');
run('slot', H + 'G0 X12 Y20\nG1 Z-2 F300\nG1 X68 F1100\nG0 Z5\nG0 X12\nG1 Z-4 F300\nG1 X68 F1100\nG0 Z5\n', 'retract between passes');
run('slot', H + 'G0 X12 Y20\nG0 Z0.5\nG1 Z-2 F300\nG1 X68 F1200\nG1 Z-4 F300\nG1 X12 F1200\nG0 Z5\n', 'optimised');
// bolt with rapid to z1
const sb = SD.C.bolt(null); run('bolt', sb.ref.replace(/G1 Z-3 F250/g, 'G0 Z0.5\nG1 Z-3 F300'), 'rapid to Z0.5 first');
// karman: polyline through the tabulated points only
const sk = SD.C.karman(null); const rows = [...sk.text.matchAll(/<tr><td>([-\d.]+)<\/td><td>([-\d.]+)<\/td><\/tr>/g)].map(m => [+m[1], +m[2]]);
let kk = H + 'G0 X' + rows[0][0] + ' Y' + rows[0][1] + '\nG1 Z-1 F300\n'; rows.slice(1).forEach(p => kk += 'G1 X' + p[0] + ' Y' + p[1] + ' F800\n');
run('karman', kk + 'G0 Z5\n', 'tabulated points only');
