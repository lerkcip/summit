/* SUMMIT · Shop Contracts data: G-code contract generators (each with a reference program that defines the target),
   feeds-and-speeds, controller-setup and rigidity challenges, and the tech tree. No motor casings, nozzles or propellant tooling. */
(function (G) {
  'use strict';
  var P = G.PHYS, R = String.raw, PI = Math.PI, cos = Math.cos, sin = Math.sin, sqrt = Math.sqrt;
  function f(x) { return String(+(+x).toFixed(3)); }
  function depths(d, doc) { var k = Math.max(1, Math.ceil(d / doc - 1e-9)), o = []; for (var i = 1; i <= k; i++) o.push(-d * i / k); return o; }
  var HEAD = 'G21 G90\nG0 Z5\n';
  var START = 'G21 G90 ; millimetres, absolute coordinates\nG0 Z5    ; safe height\n; your toolpath here\n';
  var MAT = {
    mdf: { name: 'MDF', doc: 3, feedMax: 1200, plungeMax: 300 }, ply: { name: 'birch plywood', doc: 3.5, feedMax: 1000, plungeMax: 300 },
    ply6: { name: '6 mm birch plywood', doc: 2.2, feedMax: 1000, plungeMax: 300 }, alu: { name: '6061 aluminium', doc: 0.4, feedMax: 500, plungeMax: 100 }
  };
  function pick(rng, std, lo, hi, step) { if (!rng) return std; var n = Math.round((hi - lo) / step); return +(lo + step * rng.int(0, n)).toFixed(3); }
  function spec(id, name, mat, stock, tool, text, ref, extra) {
    var m = MAT[mat], o = { id: id, name: name, mk: mat, mat: m.name, stock: stock, tool: tool, doc: m.doc, feedMax: m.feedMax, plungeMax: m.plungeMax, text: text, ref: HEAD + ref + 'G0 Z5\n', start: START, tol: 0.15 };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  var C = {};
  C.slot = function (rng) {
    var y = pick(rng, 20, 12, 28, 2), x1 = pick(rng, 12, 10, 20, 2), x2 = pick(rng, 68, 56, 70, 2), d = pick(rng, 4, 2, 4, 1), g = '', dir = 0;
    g += 'G0 X' + f(x1) + ' Y' + f(y) + '\n';
    depths(d, MAT.mdf.doc > 2 ? 2 : MAT.mdf.doc).forEach(function (z) { g += 'G1 Z' + f(z) + ' F300\nG1 X' + f(dir ? x1 : x2) + ' F1100\n'; dir = 1 - dir; });
    return spec('slot', 'Straight slot', 'mdf', { w: 80, h: 40, t: 12 }, 6,
      R`Cut a straight slot with a 6 mm end mill. Its centreline runs from (${x1}, ${y}) to (${x2}, ${y}) and it is ${d} mm deep. The slot is as wide as the tool. Take no more than 2 mm of depth per pass.`, g, { doc: 2 });
  };
  C.rect = function (rng) {
    var x0 = pick(rng, 20, 14, 24, 2), y0 = pick(rng, 18, 12, 20, 2), a = pick(rng, 40, 30, 44, 2), b = pick(rng, 24, 18, 28, 2), d = pick(rng, 2, 2, 3, 1), r = 1.5;
    var g = 'G0 X' + f(x0 - r) + ' Y' + f(y0 - r) + '\nG1 Z' + f(-d) + ' F300\nG1 X' + f(x0 + a + r) + ' F1000\nG1 Y' + f(y0 + b + r) + '\nG1 X' + f(x0 - r) + '\nG1 Y' + f(y0 - r) + '\n';
    return spec('rect', 'Raised rectangle', 'mdf', { w: 80, h: 60, t: 12 }, 3,
      R`Leave a raised rectangle ${a} × ${b} mm with its lower-left corner at (${x0}, ${y0}). Cut a groove ${d} mm deep around its <strong>outside</strong> with a 3 mm end mill. Offset the path by the tool radius (1.5 mm) so the rectangle comes out to size.`, g);
  };
  C.pocket = function (rng) {
    var x0 = pick(rng, 20, 14, 24, 2), y0 = pick(rng, 18, 12, 20, 2), a = pick(rng, 40, 30, 44, 2), b = pick(rng, 24, 20, 28, 4), d = 2, r = 3;
    var rows = Math.ceil((b - 2 * r) / 4.8 - 1e-9), st = (b - 2 * r) / rows, g = 'G0 X' + f(x0 + r) + ' Y' + f(y0 + r) + '\nG1 Z' + f(-d) + ' F300\n', dir = 0;
    for (var i = 0; i <= rows; i++) { if (i) g += 'G1 Y' + f(y0 + r + i * st) + ' F1000\n'; g += 'G1 X' + f(dir ? x0 + r : x0 + a - r) + ' F1000\n'; dir = 1 - dir; }
    return spec('pocket', 'Rectangular pocket', 'mdf', { w: 80, h: 60, t: 12 }, 6,
      R`Clear a rectangular pocket ${a} × ${b} mm, lower-left corner at (${x0}, ${y0}), ${d} mm deep, with a 6 mm end mill. Inside corners keep the tool’s 3 mm radius. Keep the stepover at or under 80% of the tool diameter (4.8 mm) so no ridge is left.`, g, { doc: 2 });
  };
  C.circle = function (rng) {
    var cx = 40, cy = 30, rc = pick(rng, 18, 12, 22, 2), d = 1.5;
    var g = 'G0 X' + f(cx + rc) + ' Y' + f(cy) + '\nG1 Z' + f(-d) + ' F300\nG2 X' + f(cx + rc) + ' Y' + f(cy) + ' I' + f(-rc) + ' J0 F900\n';
    return spec('circle', 'Circular groove', 'mdf', { w: 80, h: 60, t: 12 }, 3,
      R`Cut a circular groove with a 3 mm end mill: centreline radius ${rc} mm about (${cx}, ${cy}), ${d} mm deep. One G2 or G3 with I and J makes a full circle when the end point equals the start point. I and J are measured from the start point to the centre.`, g);
  };
  C.cpocket = function (rng) {
    var cx = 40, cy = 30, D = pick(rng, 30, 26, 36, 2), d = 2, rmax = D / 2 - 3, n = Math.ceil(rmax / 4.8 - 1e-9), st = rmax / n;
    var g = 'G0 X' + f(cx) + ' Y' + f(cy) + '\nG1 Z' + f(-d) + ' F300\n';
    for (var i = 1; i <= n; i++) g += 'G1 X' + f(cx + i * st) + ' F900\nG2 X' + f(cx + i * st) + ' Y' + f(cy) + ' I' + f(-i * st) + ' J0\n';
    return spec('cpocket', 'Circular pocket', 'mdf', { w: 80, h: 60, t: 12 }, 6,
      R`Clear a circular pocket ${D} mm in diameter centred on (${cx}, ${cy}), ${d} mm deep, with a 6 mm end mill. Work outward in rings no more than 4.8 mm apart; the last ring’s radius is the pocket radius minus the tool radius.`, g, { doc: 2 });
  };
  C.bolt = function (rng) {
    var cx = 40, cy = 30, n = pick(rng, 6, 4, 8, 1), rb = pick(rng, 20, 14, 24, 2), th0 = pick(rng, 0, 0, 45, 15), d = 3, g = '';
    for (var k = 0; k < n; k++) { var a = (th0 + k * 360 / n) * PI / 180; g += 'G0 X' + f(cx + rb * cos(a)) + ' Y' + f(cy + rb * sin(a)) + '\nG1 Z' + f(-d) + ' F250\nG0 Z5\n'; }
    return spec('bolt', 'Bolt circle', 'mdf', { w: 80, h: 60, t: 12 }, 3,
      R`Drill ${n} holes equally spaced on a ${rb} mm radius about (${cx}, ${cy}), the first at ${th0}° from the +X axis, each ${d} mm deep, by plunging a 3 mm end mill. Hole \(k\) sits at \((x_c + R\cos\theta_k,\ y_c + R\sin\theta_k)\) with \(\theta_k = ${th0}° + k\cdot 360°/${n}\). Retract before each rapid.`, g);
  };
  C.rrect = function (rng) {
    var x0 = pick(rng, 18, 14, 20, 2), y0 = pick(rng, 16, 12, 18, 2), a = pick(rng, 44, 36, 46, 2), b = pick(rng, 28, 24, 30, 2), rc = pick(rng, 6, 4, 8, 2), d = 2, r = 1.5, q = rc + r;
    var g = 'G0 X' + f(x0 + rc) + ' Y' + f(y0 - r) + '\nG1 Z' + f(-d) + ' F300\nG1 X' + f(x0 + a - rc) + ' F900\nG3 X' + f(x0 + a + r) + ' Y' + f(y0 + rc) + ' I0 J' + f(q) + '\nG1 Y' + f(y0 + b - rc) + '\nG3 X' + f(x0 + a - rc) + ' Y' + f(y0 + b + r) + ' I' + f(-q) + ' J0\nG1 X' + f(x0 + rc) + '\nG3 X' + f(x0 - r) + ' Y' + f(y0 + b - rc) + ' I0 J' + f(-q) + '\nG1 Y' + f(y0 + rc) + '\nG3 X' + f(x0 + rc) + ' Y' + f(y0 - r) + ' I' + f(q) + ' J0\n';
    return spec('rrect', 'Rounded plate', 'mdf', { w: 80, h: 60, t: 12 }, 3,
      R`Leave a raised plate ${a} × ${b} mm with ${rc} mm corner radii, lower-left corner of its bounding box at (${x0}, ${y0}). Cut around the outside ${d} mm deep with a 3 mm end mill: straight edges offset by 1.5 mm, corner arcs of radius ${rc} + 1.5 mm about the same centres.`, g);
  };
  C.aslot = function (rng) {
    var y = pick(rng, 20, 14, 26, 2), x1 = pick(rng, 12, 10, 16, 2), x2 = pick(rng, 48, 40, 50, 2), d = 1.2, g = 'G0 X' + f(x1) + ' Y' + f(y) + '\n', dir = 0;
    depths(d, 0.4).forEach(function (z) { g += 'G1 Z' + f(z) + ' F80\nG1 X' + f(dir ? x1 : x2) + ' F400\n'; dir = 1 - dir; });
    return spec('aslot', 'First aluminium slot', 'alu', { w: 60, h: 40, t: 6 }, 3.175,
      R`Cut a slot in 6061 plate with a 1/8 in (3.175 mm) single-flute end mill: centreline from (${x1}, ${y}) to (${x2}, ${y}), ${d} mm deep. A light router gantry wants shallow passes in aluminium: at most 0.4 mm of depth per pass, feed at most 500 mm/min, plunge at most 100 mm/min.`, g);
  };
  function offsetPoly(v, r) {
    var n = v.length, out = [];
    for (var i = 0; i < n; i++) {
      var p0 = v[(i + n - 1) % n], p1 = v[i], p2 = v[(i + 1) % n];
      var d0 = [p1[0] - p0[0], p1[1] - p0[1]], d1 = [p2[0] - p1[0], p2[1] - p1[1]], l0 = Math.hypot(d0[0], d0[1]), l1 = Math.hypot(d1[0], d1[1]);
      var n0 = [d0[1] / l0, -d0[0] / l0], n1 = [d1[1] / l1, -d1[0] / l1], k = r / (1 + n0[0] * n1[0] + n0[1] * n1[1]);
      out.push([p1[0] + k * (n0[0] + n1[0]), p1[1] + k * (n0[1] + n1[1])]);
    }
    return out;
  }
  C.fin = function (rng) {
    var x0 = 16, y0 = 14, cr = pick(rng, 70, 60, 72, 4), ct = pick(rng, 35, 28, 40, 4), s = pick(rng, 45, 36, 48, 4), xs = pick(rng, 25, 16, 28, 4), r = 1.5875;
    var v = [[x0, y0], [x0 + cr, y0], [x0 + xs + ct, y0 + s], [x0 + xs, y0 + s]], o = offsetPoly(v, r);
    var g = 'G0 X' + f(o[0][0]) + ' Y' + f(o[0][1]) + '\nG1 Z-3.3 F250\n'; [1, 2, 3, 0].forEach(function (i) { g += 'G1 X' + f(o[i][0]) + ' Y' + f(o[i][1]) + ' F900\n'; });
    return spec('fin', 'Trapezoidal fin', 'ply', { w: 112, h: 80, t: 3 }, 3.175,
      R`Cut out a trapezoidal fin from 3 mm plywood with a 1/8 in (3.175 mm) end mill. Fin corners, counter-clockwise: root leading edge (${x0}, ${y0}), root trailing edge (${x0 + cr}, ${y0}), tip trailing edge (${x0 + xs + ct}, ${y0 + s}), tip leading edge (${x0 + xs}, ${y0 + s}). Cut around the outside, through to Z−3.3. Offset every edge outward by the tool radius (1.5875 mm) along its unit normal; the path corners are where neighbouring offset edges meet.`, g,
      { note: 'Root chord ' + cr + ' mm, tip chord ' + ct + ' mm, span ' + s + ' mm. In the shop, hold the part with tabs or tape so it cannot shift when it comes free.' });
  };
  C.jig = function (rng) {
    var cx = 50, cy = 50, Db = pick(rng, 54.2, 41.8, 66.2, 12.2), n = pick(rng, 3, 3, 4, 1), r = 1.5875, ri = Db / 2 - r, L = 16;
    var g = 'G0 X' + f(cx + ri) + ' Y' + f(cy) + '\nG1 Z-3.3 F250\nG2 X' + f(cx + ri) + ' Y' + f(cy) + ' I' + f(-ri) + ' J0 F900\nG0 Z5\n';
    for (var k = 0; k < n; k++) { var a = (90 + k * 360 / n) * PI / 180, a1 = Db / 2 - 1, a2 = Db / 2 + L; g += 'G0 X' + f(cx + a1 * cos(a)) + ' Y' + f(cy + a1 * sin(a)) + '\nG1 Z-3.3 F250\nG1 X' + f(cx + a2 * cos(a)) + ' Y' + f(cy + a2 * sin(a)) + ' F900\nG0 Z5\n'; }
    return spec('jig', 'Fin-alignment jig', 'ply', { w: 100, h: 100, t: 3 }, 3.175,
      R`Make a fin-alignment jig from 3 mm plywood with a 1/8 in end mill. Bore a ${f(Db)} mm hole centred on (${cx}, ${cy}) for the body tube (path radius = bore radius − tool radius), cut through to Z−3.3. Then cut ${n} radial fin slots, one tool-width wide, the first pointing along +Y and the rest every ${360 / n}°. Each slot’s centreline runs from radius ${f(Db / 2 - 1)} mm to ${f(Db / 2 + L)} mm.`, g,
      { note: 'Measure your own tube and fin stock before cutting a real one; these numbers are an example.' });
  };
  C.ogive = function (rng) {
    var xb = 10, ya = 8, Rb = pick(rng, 30, 24, 34, 2), L = pick(rng, 90, 78, 92, 2), rho = (Rb * Rb + L * L) / (2 * Rb), d = 1;
    var g = 'G0 X' + f(xb) + ' Y' + f(ya + Rb) + '\nG1 Z' + f(-d) + ' F300\nG2 X' + f(xb + L) + ' Y' + f(ya) + ' I0 J' + f(-rho) + ' F800\n';
    return spec('ogive', 'Tangent-ogive template', 'mdf', { w: 112, h: 52, t: 6 }, 3,
      R`Scribe the profile of a tangent-ogive nose cone as a groove ${d} mm deep with a 3 mm end mill, for a mould or sanding template. Base radius ${Rb} mm, length ${L} mm. The base sits at x = ${xb} and the axis lies along y = ${ya}, so the curve runs from (${xb}, ${ya + Rb}) to the tip at (${xb + L}, ${ya}). A tangent ogive is a single circular arc of radius \(\rho = (R^{2} + L^{2})/(2R)\) whose centre lies on the base plane, \(\rho - R\) below the axis.`, g,
      { note: 'ρ = ' + f(rho) + ' mm here. One G2 does the whole curve.' });
  };
  C.karman = function (rng) {
    var xb = 10, ya = 8, Rb = pick(rng, 30, 24, 34, 2), L = pick(rng, 90, 80, 92, 4), d = 1, N = 8, pts = [];
    for (var k = N; k >= 0; k--) { var th = PI * k / N, xt = L * (1 - cos(th)) / 2; pts.push([+(xb + L - xt).toFixed(2), +(ya + Rb / sqrt(PI) * sqrt(Math.max(0, th - sin(2 * th) / 2))).toFixed(2)]); }   // base first, tip last
    var g = 'G0 X' + f(pts[0][0]) + ' Y' + f(pts[0][1]) + '\nG1 Z' + f(-d) + ' F300\n';
    pts.slice(1).forEach(function (p) { g += 'G1 X' + f(p[0]) + ' Y' + f(p[1]) + ' F800\n'; });
    return spec('karman', 'Von Kármán template', 'mdf', { w: 112, h: 52, t: 6 }, 3,
      R`Scribe a von Kármán (LD-Haack) nose-cone profile ${d} mm deep with a 3 mm end mill: base radius ${Rb} mm, length ${L} mm, base at x = ${xb}, axis along y = ${ya}. The curve is not an arc: \(y = \frac{R}{\sqrt\pi}\sqrt{\theta - \tfrac12\sin 2\theta}\) with \(\theta = \arccos(1 - 2x_{tip}/L)\), where \(x_{tip}\) is measured back from the tip. The table steps \(\theta\) evenly, which packs points where the curve bends hardest. Join the points in order with G1 moves, from the base to the tip.` +
      '<div class="tw"><table><thead><tr><th>Point</th><th>X (mm)</th><th>Y (mm)</th></tr></thead><tbody>' + pts.map(function (p, i) { return '<tr><td>' + (i + 1) + '</td><td>' + f(p[0]) + '</td><td>' + f(p[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>', g);
  };
  C.ring = function (rng) {
    var cx = 45, cy = 45, id = pick(rng, 41.6, 30.7, 41.6, 10.9), od = pick(rng, 65.0, 65.0, 76.0, 11), r = 1.5875, ri = id / 2 - r, ro = od / 2 + r, g = '';
    [[ri, 'bore'], [ro, 'outside']].forEach(function (c) { g += 'G0 X' + f(cx + c[0]) + ' Y' + f(cy) + '\n'; depths(6.3, 2.2).forEach(function (z) { g += 'G1 Z' + f(z) + ' F250\nG2 X' + f(cx + c[0]) + ' Y' + f(cy) + ' I' + f(-c[0]) + ' J0 F900\n'; }); g += 'G0 Z5\n'; });
    return spec('ring', 'Centering ring', 'ply6', { w: 90, h: 90, t: 6 }, 3.175,
      R`Cut a centering ring from 6 mm plywood with a 1/8 in end mill, centred on (${cx}, ${cy}): a ${f(id)} mm bore for the motor mount tube and a ${f(od)} mm outside diameter to fit the airframe. The bore path is inside the line (radius − 1.5875 mm), the outer path outside it (radius + 1.5875 mm). Cut through to Z−6.3 in passes of at most 2.2 mm. Bore first, so the part is still held when the hole is cut.`, g,
      { note: 'Example sizes for a mount tube that holds a certified commercial motor. Measure your own tubes; fit matters more than the nominal number.' });
  };
  C.sled = function (rng) {
    var x0 = 10, y0 = 10, a = pick(rng, 90, 80, 90, 5), b = pick(rng, 40, 36, 40, 2), r = 1.5875, g = '';
    [[x0 + 8, y0 + 8], [x0 + a - 8, y0 + 8], [x0 + a - 8, y0 + b - 8], [x0 + 8, y0 + b - 8]].forEach(function (p) { g += 'G0 X' + f(p[0]) + ' Y' + f(p[1]) + '\nG1 Z-3.3 F250\nG0 Z5\n'; });
    [[x0 + 22, y0 + b / 2 - 6, x0 + 22, y0 + b / 2 + 6], [x0 + a - 22, y0 + b / 2 - 6, x0 + a - 22, y0 + b / 2 + 6]].forEach(function (s) { g += 'G0 X' + f(s[0]) + ' Y' + f(s[1]) + '\nG1 Z-3.3 F250\nG1 X' + f(s[2]) + ' Y' + f(s[3]) + ' F900\nG0 Z5\n'; });
    g += 'G0 X' + f(x0 - r) + ' Y' + f(y0 - r) + '\nG1 Z-3.3 F250\nG1 X' + f(x0 + a + r) + ' F900\nG1 Y' + f(y0 + b + r) + '\nG1 X' + f(x0 - r) + '\nG1 Y' + f(y0 - r) + '\n';
    return spec('sled', 'Avionics sled', 'ply', { w: 112, h: 62, t: 3 }, 3.175,
      R`Cut an avionics sled from 3 mm plywood with a 1/8 in end mill, through to Z−3.3. Outline: ${a} × ${b} mm, lower-left corner at (${x0}, ${y0}), cut on the outside. Four mounting holes (plunges) 8 mm in from each corner. Two strap slots, one tool-width wide and 12 mm long, parallel to Y, centred ${22} mm in from each short edge at mid-height. Cut the inside features first and the outline last.`, g);
  };
  var ORDER = ['slot', 'rect', 'pocket', 'circle', 'cpocket', 'bolt', 'rrect', 'aslot', 'fin', 'jig', 'ogive', 'karman', 'ring', 'sled'];

  /* ---------- numeric challenges: {q, f:[[label, value, unit, tol]], s} ---------- */
  var DIAL = { 1: 10000, 2: 12000, 3: 17000, 4: 22000, 5: 27000, 6: 30000 };
  var FS = [
    function (g) { var d = g.int(1, 6), fl = g.pick([1, 2]), F = g.int(4, 18) * 100; return { q: R`Your Makita RT0701C is on dial ${d} (${P.fmt(DIAL[d])} RPM) with a ${fl}-flute bit, feeding at ${F} mm/min. Find the chip load per tooth.`, f: [['Chip load', F / (DIAL[d] * fl), 'mm', 0.03]], s: R`Chip load = feed / (RPM × flutes) = ${F} / (${DIAL[d]} × ${fl}).` }; },
    function (g) { var d = g.int(1, 4), fl = g.pick([1, 2]), cl = g.pick([0.03, 0.05, 0.08, 0.1]); return { q: R`You want a chip load of ${cl} mm per tooth in plywood with a ${fl}-flute bit on dial ${d} (${P.fmt(DIAL[d])} RPM). What feed rate is that?`, f: [['Feed', cl * DIAL[d] * fl, 'mm/min']], s: R`Feed = chip load × RPM × flutes.` }; },
    function (g) { var w = g.pick([1.5, 3, 3.175, 6]), dc = g.pick([1, 2, 3]), F = g.int(5, 12) * 100; return { q: R`A pass has ${w} mm width of cut, ${dc} mm depth of cut and ${F} mm/min feed. Find the material removal rate.`, f: [['MRR', w * dc * F / 1000, 'cm³/min']], s: R`MRR = width × depth × feed = ${w} × ${dc} × ${F} mm³/min.` }; },
    function (g) { var D = g.pick([3.175, 6, 6.35]), d = g.int(1, 6); return { q: R`Find the cutting (surface) speed of a ${D} mm bit on dial ${d} (${P.fmt(DIAL[d])} RPM).`, f: [['Surface speed', PI * D * DIAL[d] / 1000, 'm/min']], s: R`\(v_c = \pi D N\) = π × ${D} mm × ${DIAL[d]} / 1000.` }; },
    function (g) { var d = g.pick([4, 6, 9, 12]), doc = g.pick([0.4, 1.5, 2, 3]), L = g.int(4, 20) * 50, F = g.int(4, 10) * 100, n = Math.ceil(d / doc - 1e-9); return { q: R`A ${L} mm profile must be cut ${d} mm deep at no more than ${doc} mm per pass, feeding at ${F} mm/min. How many passes are needed, and how long does the cutting take (ignore plunges)?`, f: [['Passes', n, '', { abs: 0.1 }], ['Cutting time', n * L / F, 'min']], s: R`Passes = ⌈${d}/${doc}⌉ = ${n}; time = passes × length / feed.` }; },
    function (g) { var ipm = g.pick([20, 30, 40, 60, 80]); return { q: R`A forum recipe says ${ipm} inches per minute. Convert it to mm/min and to mm/s.`, f: [['Per minute', ipm * 25.4, 'mm/min', 0.005], ['Per second', ipm * 25.4 / 60, 'mm/s', 0.01]], s: R`1 in = 25.4 mm; divide by 60 for per-second.` }; },
    function (g) { var cl = g.pick([0.01, 0.015, 0.02, 0.025]); return { q: R`For aluminium on a light gantry you choose a single-flute 1/8 in bit, dial 1 (10,000 RPM) and a chip load of ${cl} mm. What feed rate is that, and what is it in mm/s?`, f: [['Feed', cl * 10000, 'mm/min'], ['The same, per second', cl * 10000 / 60, 'mm/s']], s: R`Feed = ${cl} × 10,000 × 1. Slow feed with a real chip beats fast feed with dust: rubbing work-hardens aluminium and welds it to the bit.` }; },
    function (g) { var F = g.int(5, 12) * 100, fl = g.pick([1, 2]), cl = g.pick([0.04, 0.06, 0.08]), want = F / (cl * fl), best = 1, bd = 1e9; for (var k = 1; k <= 6; k++) { var e = Math.abs(DIAL[k] - want); if (e < bd) { bd = e; best = k; } } return { q: R`You feed at ${F} mm/min with a ${fl}-flute bit and want about ${cl} mm chip load. What RPM does that call for, and which Makita dial setting (1–6) is closest? (10,000 / 12,000 / 17,000 / 22,000 / 27,000 / 30,000)`, f: [['RPM', want, 'RPM', 0.03], ['Dial', best, '', { abs: 0.1 }]], s: R`RPM = feed / (chip load × flutes) = ${Math.round(want)}; nearest dial ${best}.` }; },
    function (g) { var D = g.pick([3.175, 6]), pct = g.pick([40, 50, 80]), W = g.int(3, 9) * 10; return { q: R`A ${W} mm wide pocket is cleared with a ${D} mm bit at ${pct}% stepover. What is the stepover in mm, and how many parallel passes cover the width?`, f: [['Stepover', D * pct / 100, 'mm'], ['Passes', Math.ceil((W - D) / (D * pct / 100) - 1e-9) + 1, '', { abs: 0.1 }]], s: R`Stepover = ${pct}% of ${D} mm. The first pass covers one tool width; each further pass adds one stepover: 1 + ⌈(W − D)/stepover⌉.` }; }
  ];
  var SETUP = [
    function (g) { var t = g.pick([16, 20]), ms = g.pick([8, 16, 32]); return { q: R`An axis uses a GT2 belt (2 mm pitch) on a ${t}-tooth pulley, a 1.8° stepper (200 steps/rev) and ${ms}× microstepping. Find the steps per mm.`, f: [['Steps per mm', 200 * ms / (t * 2), '']], s: R`One revolution moves ${t} × 2 mm = ${t * 2} mm and takes 200 × ${ms} microsteps.` }; },
    function (g) { var lead = g.pick([2, 4, 8]), ms = g.pick([8, 16]); return { q: R`A Z axis uses a leadscrew with ${lead} mm of travel per turn, a 200 step/rev motor and ${ms}× microstepping. Find the steps per mm and the travel per microstep.`, f: [['Steps per mm', 200 * ms / lead, ''], ['Travel per microstep', lead / (200 * ms) * 1000, 'μm']], s: R`Steps/mm = 200 × ${ms} / ${lead}.` }; },
    function (g) { var spm = g.pick([80, 100, 200]), v = g.pick([30, 50, 80, 120]); return { q: R`At ${spm} steps/mm, what step rate does a ${v} mm/s rapid need?`, f: [['Step rate', spm * v / 1000, 'kHz']], s: R`Steps per second = steps/mm × mm/s.` }; },
    function (g) { var I = g.pick([0.6, 0.9, 1.2, 1.5]), n = g.pick([5, 6]), V = g.pick([12, 24]); return { q: R`${n} steppers each run at ${I} A from a ${V} V supply. Treating that as supply current (an upper bound), what current and power must the supply deliver?`, f: [['Current', n * I, 'A'], ['Power', n * I * V, 'W']], s: R`Sum the currents; power = V × I. Real draw is lower, since chopper drivers step the supply voltage down, so this sizes the supply with margin.` }; },
    function (g) { var L = g.pick([1, 2, 3]), I = g.pick([1, 1.5, 2]), rpm = g.pick([52.9, 33.3, 21]), awg = { 52.9: 20, 33.3: 18, 21: 16 }[rpm]; return { q: R`A motor lead is ${L} m long (so ${2 * L} m of wire, out and back) in ${awg} AWG copper at ${rpm} mΩ/m, carrying ${I} A. Find the voltage drop.`, f: [['Voltage drop', 2 * L * rpm / 1000 * I, 'V', 0.03]], s: R`V = I × R with R = ${2 * L} m × ${rpm} mΩ/m.` }; },
    function (g) { var V = g.pick([5, 12, 24]), vf = g.pick([1.8, 2.0, 2.2, 3.0]), mA = g.pick([5, 10, 15, 20]); if (vf >= V) vf = 2.0; var Rr = (V - vf) / (mA / 1000); return { q: R`You solder an indicator LED (forward voltage ${vf} V) to a ${V} V rail and want ${mA} mA through it. What series resistor does that need, and how much power does the resistor dissipate?`, f: [['Resistor', Rr, 'Ω'], ['Dissipation', (V - vf) * mA, 'mW']], s: R`\(R = (V - V_f)/I\) = (${V} − ${vf}) / ${mA / 1000}. Power = (V − V_f) × I. Pick the next standard value up and a rating with margin.` }; },
    function (g) { var I = g.pick([2.5, 4, 6, 8]); return { q: R`The controller’s supply lead carries ${I} A continuously. Sizing the fuse at 125% of the continuous current, what is the minimum fuse rating?`, f: [['Fuse rating', I * 1.25, 'A']], s: R`${I} × 1.25. Choose the next standard fuse at or above it; the fuse protects the wire, so the wire must carry that much too.` }; },
    function (g) { var rated = g.pick([1.5, 1.68, 2.0]), pct = g.pick([60, 70, 80]); return { q: R`A stepper is rated ${rated} A per phase. You set the driver’s run current to ${pct}% of that to keep it cool. What run current is that?`, f: [['Run current', rated * pct / 100, 'A']], s: R`${rated} × ${pct / 100}. Start low and raise it only if the axis skips steps.` }; }
  ];
  var RIGID = [
    function (g) { var D = g.pick([25, 25.4, 30]), t = g.pick([1.5, 2, 3]), d = D - 2 * t; return { q: R`Find the second moment of area of a round tube, ${D} mm outside diameter with a ${t} mm wall.`, f: [['I', PI * (Math.pow(D, 4) - Math.pow(d, 4)) / 64 / 1e4, 'cm⁴', 0.02]], s: R`\(I = \pi(D^{4} - d^{4})/64\) with \(d\) = ${f(d)} mm.` }; },
    function (g) { var F = g.pick([20, 40, 60]), L = g.pick([400, 600, 800]), E = g.pick([[69, '6061 aluminium'], [200, 'steel']]), I = g.pick([0.8, 1.2, 2.0]); return { q: R`A gantry rail of ${E[1]} (\(E\) = ${E[0]} GPa, \(I\) = ${I} cm⁴) spans ${L} mm between supports. A ${F} N cutting force acts at mid-span. Find the deflection (simply supported).`, f: [['Deflection', F * Math.pow(L, 3) / (48 * E[0] * 1e3 * I * 1e4), 'mm', 0.03]], s: R`\(\delta = FL^{3}/(48EI)\). Keep units consistent: N, mm, MPa, mm⁴.` }; },
    function (g) { var k = g.pick([2, 1.5, 3]); return { q: R`You shorten a rail’s unsupported span by a factor of ${k}, same section and load. By what factor does the mid-span deflection fall?`, f: [['Deflection falls by', Math.pow(k, 3), '×']], s: R`Deflection scales with \(L^{3}\): ${k}³.` }; },
    function (g) { var a = g.pick([20, 30, 40]), t = g.pick([2, 3]), b = a - 2 * t; return { q: R`Find the second moment of area of a square tube ${a} × ${a} mm with a ${t} mm wall.`, f: [['I', (Math.pow(a, 4) - Math.pow(b, 4)) / 12 / 1e4, 'cm⁴', 0.02]], s: R`\(I = (a^{4} - b^{4})/12\) with inner width \(b\) = ${b} mm.` }; },
    function (g) { var s = g.pick([150, 200, 250]), al = g.pick([[276, '6061-T6'], [503, '7075-T6']]); return { q: R`A bracket of ${al[1]} (yield ${al[0]} MPa) sees a peak stress of ${s} MPa. Find its factor of safety on yield.`, f: [['Factor of safety', al[0] / s, '']], s: R`Yield / applied = ${al[0]} / ${s}.` }; },
    function (g) { var k1 = g.pick([2, 4, 8]); return { q: R`A stiffer frame raises a machine’s stiffness by a factor of ${k1} with the same moving mass. By what factor does its lowest natural frequency rise?`, f: [['Frequency rises by', sqrt(k1), '×']], s: R`\(f_n \propto \sqrt{k/m}\).` }; }
  ];
  /* tech tree. chk = real-world check-in id; needs = an earlier check-in required to open this node */
  var NODES = [
    { id: 'tune', name: 'Tune the Primo', sub: 'Units, tolerances, G0 and G1', req: { ch: [1, 3] }, con: ['slot', 'rect', 'pocket'], quiz: 'fs', chk: { id: 'c_tune', ask: 'Your Primo, squared and trammed, with a first test cut (a square or a crown).' } },
    { id: 'arcs', name: 'Arcs and pockets', sub: 'G2/G3, polar layouts, circular pocketing', req: { ch: [3, 4] }, con: ['circle', 'cpocket', 'bolt', 'rrect'] },
    { id: 'wire', name: 'Wire the Jackpot3', sub: 'Steppers, power, soldering checks', req: { ch: [21] }, con: [], quiz: 'setup', chk: { id: 'c_wire', ask: 'Your Jackpot3 wiring: every axis jogging the right way, endstops reading, strain relief on the leads, and a close-up of one soldered joint. V1’s docs warn against running wires across the top of the board, where they block the antenna and the cooling.' } },
    { id: 'alu', name: 'Aluminium upgrade', sub: 'Frame rigidity, alloy choice, deflection', req: { ch: [20] }, needs: 'c_tune', con: ['aslot'], quiz: 'rigid', chk: { id: 'c_alu', ask: 'Your first clean aluminium cut, or the first all-aluminium part of the new machine.' } },
    { id: 'fins', name: 'Fins and alignment jig', sub: 'Fin profiles, offsets, a jig that holds them true', req: { ch: [7, 25] }, needs: 'c_tune', con: ['fin', 'jig'], chk: { id: 'c_fins', ask: 'A fin or fin jig you cut, on the airframe or the bench.' } },
    { id: 'nose', name: 'Nose cone mould profile', sub: 'Tangent ogive and von Kármán templates', req: { ch: [25] }, needs: 'c_tune', con: ['ogive', 'karman'] },
    { id: 'air', name: 'Centering rings and airframe parts', sub: 'Motor mount for certified commercial motors, avionics sled', req: { ch: [20, 33] }, needs: 'c_fins', con: ['ring', 'sled'], chk: { id: 'c_air', ask: 'A centering ring or sled you cut, test-fitted in the airframe.' } }
  ];
  G.SHOPD = { C: C, ORDER: ORDER, FS: FS, SETUP: SETUP, RIGID: RIGID, NODES: NODES, DIAL: DIAL, MAT: MAT };
  if (typeof module !== 'undefined') module.exports = G.SHOPD;
})(typeof window !== 'undefined' ? window : globalThis);
