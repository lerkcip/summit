/* SUMMIT · G-code simulator for Shop Contracts: a 2.5-D router cutting a flat stock with a flat end mill.
   Stock top is Z0, lower-left corner is X0 Y0, units mm. Returns the cut heightmap, cycle time, air-cutting and rule violations. */
(function (G) {
  'use strict';
  var RES = 0.25, STEP = 0.125, AIR = 1.0;   // grid, sampling step, and the run of no-removal travel that counts as air-cutting
  function parse(src) {
    var out = [], lines = String(src || '').split(/\r?\n/);
    lines.forEach(function (raw, i) {
      var s = raw.replace(/\([^)]*\)/g, ' ').replace(/;.*$/, '').toUpperCase().trim();
      if (!s) return;
      if (/^%$/.test(s)) return;
      var words = [], re = /([A-Z])\s*([-+]?(?:\d+\.?\d*|\.\d+))/g, m, rest = s;
      while ((m = re.exec(s))) { words.push([m[1], parseFloat(m[2])]); }
      rest = s.replace(re, '').replace(/\s+/g, '');
      out.push({ n: i + 1, words: words, junk: rest, raw: raw });
    });
    return out;
  }
  /* cfg: {w, h, t, tool, doc, feedMax, plungeMax, rapid, safe} */
  function simulate(src, cfg) {
    var nx = Math.round(cfg.w / RES), ny = Math.round(cfg.h / RES), hm = new Float32Array(nx * ny);
    var r = cfg.tool / 2, r2 = r * r + 1e-9, pend = 0;
    var st = { x: 0, y: 0, z: cfg.safe || 5, f: 0, abs: true, mm: true, mode: null };
    var res = { errors: [], warns: [], time: 0, feedLen: 0, airLen: 0, rapidLen: 0, path: [], docMax: 0, docLine: 0, plunge: 0, plungeLine: 0, feedOver: 0, feedLine: 0, removed: 0, hm: hm, nx: nx, ny: ny, res: RES, lines: 0 };
    var rapidXY = cfg.rapid || 3000, rapidZ = 900, stop = false;
    function err(n, msg) { res.errors.push({ line: n, msg: msg }); stop = true; }
    function stamp(x, y, z, measure) {       // returns [cells lowered, deepest bite below the existing surface]
      var i0 = Math.max(0, Math.floor((x - r) / RES)), i1 = Math.min(nx - 1, Math.ceil((x + r) / RES)), j0 = Math.max(0, Math.floor((y - r) / RES)), j1 = Math.min(ny - 1, Math.ceil((y + r) / RES)), low = 0, bite = 0;
      for (var j = j0; j <= j1; j++) {
        var dy = (j + 0.5) * RES - y, dy2 = dy * dy; if (dy2 > r2) continue;
        for (var i = i0; i <= i1; i++) {
          var dx = (i + 0.5) * RES - x; if (dx * dx + dy2 > r2) continue;
          var idx = j * nx + i, cur = hm[idx];
          if (z < cur - 1e-6) { if (cur - z > bite) bite = cur - z; if (!measure) hm[idx] = z; low++; }
        }
      }
      return [low, bite];
    }
    function air(seg, cut) {                 // short gaps between removals are sampling, not air-cutting
      if (cut) { if (pend > AIR) res.airLen += pend; pend = 0; } else pend += seg;
    }
    function move(n, pts, rapid, f) {         // pts: polyline of [x,y,z] starting at the current position
      for (var s = 1; s < pts.length && !stop; s++) {
        var a = pts[s - 1], b = pts[s], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
        if (len < 1e-9) continue;
        var hor = Math.hypot(dx, dy), k = Math.max(1, Math.ceil(len / STEP)), seg = len / k;
        res.path.push({ a: a, b: b, rapid: rapid });
        if (rapid) { res.rapidLen += len; res.time += Math.max(hor / rapidXY, Math.abs(dz) / rapidZ); }
        else { res.feedLen += len; res.time += len / f; }
        for (var q = 1; q <= k && !stop; q++) {
          var t = q / k, x = a[0] + dx * t, y = a[1] + dy * t, z = a[2] + dz * t;
          if (x < -15 || y < -15 || x > cfg.w + 15 || y > cfg.h + 15 || z > 60) { err(n, 'The tool leaves the machine’s working area at X' + x.toFixed(1) + ' Y' + y.toFixed(1) + '.'); break; }
          if (z < -cfg.t - 1.0) { err(n, 'Z' + z.toFixed(2) + ' is more than 1 mm into the spoilboard (stock is ' + cfg.t + ' mm thick).'); break; }
          if (z >= 0) { if (!rapid) { air(0, true); res.airLen += seg; } continue; }
          if (rapid) { var m = stamp(x, y, z, true); if (m[0] > 0) { err(n, 'Rapid move (G0) into the stock at X' + x.toFixed(1) + ' Y' + y.toFixed(1) + ' Z' + z.toFixed(1) + '. Rapids must stay clear of material; cut with G1.'); break; } continue; }
          var c = stamp(x, y, z, false);
          if (c[0] > 0) {
            res.removed += c[0];
            if (c[1] > res.docMax) { res.docMax = c[1]; res.docLine = n; }
            if (hor < 1e-6 && dz < 0 && f > cfg.plungeMax + 1e-9 && f > res.plunge) { res.plunge = f; res.plungeLine = n; }
            air(seg, true);
          } else air(seg, false);
        }
      }
    }
    var prog = parse(src); res.lines = prog.length;
    for (var p = 0; p < prog.length && !stop; p++) {
      var L = prog[p], w = L.words, has = {}, val = {}, motion = null, n = L.n;
      if (L.junk) { err(n, 'Could not read “' + L.raw.trim() + '”. Use words like G1 X10 Y5 F600.'); break; }
      for (var i = 0; i < w.length; i++) {
        var c = w[i][0], v = w[i][1];
        if (c === 'G') {
          if (v === 0 || v === 1 || v === 2 || v === 3) motion = v;
          else if (v === 20) st.mm = false; else if (v === 21) st.mm = true;
          else if (v === 90) st.abs = true; else if (v === 91) st.abs = false;
          else if (v === 17 || v === 94 || v === 54 || v === 40 || v === 49 || v === 80) { /* accepted defaults */ }
          else if (v === 4) { /* dwell: ignored */ }
          else res.warns.push({ line: n, msg: 'G' + v + ' is not simulated and was ignored.' });
        } else if (c === 'M') { if ([0, 1, 2, 3, 4, 5, 6, 8, 9, 30].indexOf(v) < 0) res.warns.push({ line: n, msg: 'M' + v + ' was ignored.' }); }
        else if (c === 'N' || c === 'S' || c === 'T' || c === 'P') { /* line numbers, spindle speed, tool, dwell time */ }
        else { has[c] = true; val[c] = v; }
      }
      var u = st.mm ? 1 : 25.4;
      if (has.F) { if (val.F <= 0) { err(n, 'Feed rate must be positive.'); break; } st.f = val.F * u; }
      if (motion !== null) st.mode = motion;
      if (!(has.X || has.Y || has.Z)) { if ((has.I || has.J || has.R) && st.mode >= 2) { /* full circle with no end point */ } else continue; }
      if (st.mode === null) { err(n, 'Coordinates given before any G0 or G1.'); break; }
      var tx = has.X ? (st.abs ? val.X * u : st.x + val.X * u) : st.x, ty = has.Y ? (st.abs ? val.Y * u : st.y + val.Y * u) : st.y, tz = has.Z ? (st.abs ? val.Z * u : st.z + val.Z * u) : st.z;
      if (st.mode === 0) move(n, [[st.x, st.y, st.z], [tx, ty, tz]], true, 0);
      else {
        if (!st.f) { err(n, 'No feed rate yet. Add F (mm/min) to the first cutting move, for example G1 Z-2 F300.'); break; }
        var f = st.f; if (f > cfg.feedMax + 1e-9) { if (f > res.feedOver) { res.feedOver = f; res.feedLine = n; } }
        if (st.mode === 1) move(n, [[st.x, st.y, st.z], [tx, ty, tz]], false, f);
        else {
          var cx, cy, rad;
          if (has.I || has.J) { cx = st.x + (has.I ? val.I * u : 0); cy = st.y + (has.J ? val.J * u : 0); rad = Math.hypot(st.x - cx, st.y - cy); }
          else if (has.R) {
            rad = Math.abs(val.R * u); var ddx = tx - st.x, ddy = ty - st.y, d = Math.hypot(ddx, ddy);
            if (d < 1e-9) { err(n, 'An R-format arc cannot make a full circle. Use I and J.'); break; }
            if (d > 2 * rad + 1e-6) { err(n, 'Arc radius R' + val.R + ' is too small to reach the end point.'); break; }
            var hh = Math.sqrt(Math.max(0, rad * rad - d * d / 4)), mx = (st.x + tx) / 2, my = (st.y + ty) / 2, sgn = ((st.mode === 2) === (val.R > 0)) ? -1 : 1;
            cx = mx + sgn * hh * (-ddy / d); cy = my + sgn * hh * (ddx / d);
          } else { err(n, 'G' + st.mode + ' needs a centre: I and J (offsets from the start point) or R.'); break; }
          if (rad < 1e-6) { err(n, 'Arc radius is zero.'); break; }
          var re2 = Math.hypot(tx - cx, ty - cy);
          if (Math.abs(re2 - rad) > 0.06) { err(n, 'Arc end point is not on the circle: the start is ' + rad.toFixed(3) + ' mm from the centre, the end ' + re2.toFixed(3) + ' mm. Check I and J (they are measured from the start point).'); break; }
          var a0 = Math.atan2(st.y - cy, st.x - cx), a1 = Math.atan2(ty - cy, tx - cx), sweep;
          if (st.mode === 2) { sweep = a0 - a1; if (sweep <= 1e-9) sweep += 2 * Math.PI; sweep = -sweep; } else { sweep = a1 - a0; if (sweep <= 1e-9) sweep += 2 * Math.PI; }
          var nseg = Math.max(8, Math.ceil(Math.abs(sweep) * rad / 0.5)), pts = [[st.x, st.y, st.z]];
          for (var k2 = 1; k2 <= nseg; k2++) { var tt = k2 / nseg, ang = a0 + sweep * tt; pts.push(k2 === nseg ? [tx, ty, tz] : [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang), st.z + (tz - st.z) * tt]); }
          move(n, pts, false, f);
        }
      }
      st.x = tx; st.y = ty; st.z = tz;
    }
    if (pend > AIR) res.airLen += pend;
    res.end = { x: st.x, y: st.y, z: st.z };
    if (!res.errors.length && st.z < 0.5) res.warns.push({ line: 0, msg: 'The program ends with the tool at Z' + st.z.toFixed(1) + '. Retract above the stock (for example G0 Z5) before finishing.' });
    return res;
  }
  /* compare a cut heightmap with the target. A cell is right when its depth matches the target there or in a
     neighbouring cell (one cell = 0.25 mm of edge tolerance). acc = share of the target area cut correctly, overcut counted twice. */
  function compare(hm, target, tol, nx) {
    var n = hm.length, ny = n / nx, A = 0, under = 0, over = 0, bad = new Uint8Array(n);
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var k = j * nx + i, t = target[k], a = hm[k];
      if (t < -1e-6) A++;
      if (Math.abs(a - t) <= tol) continue;
      var ok = false;
      for (var dj = -1; dj <= 1 && !ok; dj++) for (var di = -1; di <= 1; di++) {
        var ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
        if (Math.abs(a - target[jj * nx + ii]) <= tol) { ok = true; break; }
      }
      if (ok) continue;
      if (a > t) { under++; bad[k] = 1; } else { over++; bad[k] = 2; }
    }
    return { A: A, under: under, over: over, bad: bad, acc: A ? Math.max(0, (A - under - 2 * over) / A) : 0 };
  }
  G.GC = { simulate: simulate, compare: compare, parse: parse, RES: RES };
  if (typeof module !== 'undefined') module.exports = G.GC;
})(typeof window !== 'undefined' ? window : globalThis);
