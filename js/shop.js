/* SUMMIT · Shop Contracts: write G-code, cut it in the simulator, get scored on accuracy, cycle time and air-cutting.
   Tech tree: tune the Primo → aluminium upgrade → rocket hardware. No motor casings, nozzles or propellant tooling. */
(function () {
  'use strict';
  var S = window.S, h = S.h, E = S.E, P = window.PHYS, GC = window.GC, D = window.SHOPD;
  var NODE = {}, CON_NODE = {}, CHK = {}, QUIZ = {
    fs: { name: 'Feeds and speeds', gens: D.FS, node: 'tune', sub: 'Chip load, feed, RPM dial, removal rate, pass counts' },
    setup: { name: 'Controller and motion setup', gens: D.SETUP, node: 'wire', sub: 'Steps per mm, supply sizing, wire drop, driver current' },
    rigid: { name: 'Rigidity and aluminium', gens: D.RIGID, node: 'alu', sub: 'Section stiffness, deflection, span, safety factor' }
  };
  D.NODES.forEach(function (n) { NODE[n.id] = n; n.con.forEach(function (c) { CON_NODE[c] = n; }); if (n.chk) CHK[n.chk.id] = n; S.MODREQ.push({ id: 'shop_' + n.id, name: 'Shop: ' + n.name, req: n.req, go: 'shop' }); });
  function st() { var s = S.state.shop; s.best = s.best || {}; s.runs = s.runs || {}; s.yt = s.yt || {}; s.nd = s.nd || {}; return s; }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function tm(min) { var s = min * 60; return s < 60 ? s.toFixed(1) + ' s' : Math.floor(s / 60) + ' min ' + Math.round(s % 60) + ' s'; }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#fff'; }

  /* ---------- tech tree state ---------- */
  function needOK(n) { return !n.needs || !!st().chk[n.needs]; }
  function nodeOpen(n) { return E.reqMet(n.req) && needOK(n); }
  function parts(n) {
    var s = st(), a = n.con.map(function (c) { return { k: 'con', id: c, done: !!s.done[c] }; });
    if (n.quiz) a.push({ k: 'quiz', id: n.quiz, done: !!s.done['q_' + n.quiz] });
    if (n.chk) a.push({ k: 'chk', id: n.chk.id, done: !!s.chk[n.chk.id] });
    return a;
  }
  function nodeDone(n) { return parts(n).every(function (p) { return p.done; }); }
  function nodeBonus(n) { var s = st(); if (n && !s.nd[n.id] && nodeDone(n)) { s.nd[n.id] = Date.now(); S.addXP(150, 'Shop tier complete: ' + n.name); } }
  function lockText(n) { return E.reqMet(n.req) ? 'Log the real-world check-in for “' + CHK[n.needs].name + '” (a photo and a short note). Hardware tiers open on real cuts, not only on quizzes.' : E.reqText(n.req) + (n.needs && !needOK(n) ? ' This hardware tier also needs the “' + CHK[n.needs].name + '” check-in.' : ''); }
  function dailyPick() {
    var open = D.NODES.filter(function (n) { return n.con.length && nodeOpen(n); }); if (!open.length) return null;
    var dn = S.dayNum(S.day()), n = dn % 3 === 2 ? open[Math.floor(dn / 3) % open.length] : open[open.length - 1];
    return { id: n.con[dn % n.con.length], node: n };
  }
  function specOf(arg) { if (arg === 'daily') { var d = dailyPick(); return d ? D.C[d.id](P.rng('shop' + S.day())) : null; } return D.C[arg] ? D.C[arg](null) : null; }
  function nextCon(id) { var s = st(), i = D.ORDER.indexOf(id); for (var k = 1; k <= D.ORDER.length; k++) { var c = D.ORDER[(i + k) % D.ORDER.length]; if (!s.done[c] && nodeOpen(CON_NODE[c])) return c; } return null; }
  function nextTask() {
    var s = st();
    for (var i = 0; i < D.NODES.length; i++) {
      var n = D.NODES[i]; if (!nodeOpen(n)) continue;
      var p = parts(n).filter(function (x) { return !x.done; })[0]; if (!p) continue;
      if (p.k === 'con') return { t: 'Shop contract: ' + D.C[p.id](null).name, s: n.name + ' · write the toolpath, cut it in the simulator', m: 12, go: 'con-' + p.id };
      if (p.k === 'quiz') return { t: QUIZ[p.id].name + ' check', s: n.name + ' · 5 questions, pass with 4', m: 8, go: 'shopq-' + p.id };
      return { t: 'Shop check-in: ' + n.name, s: 'Photo and a short note from the real machine', m: 5, go: 'shop' };
    }
    return s.done.slot ? { t: 'Beat a personal best', s: 'Re-cut a closed contract for a faster cycle time', m: 10, go: 'shop' } : null;
  }

  /* ---------- simulate and judge ---------- */
  var refCache = {};
  function cfgOf(sp) { var m = S.state.prefs.mach || {}; return { w: sp.stock.w, h: sp.stock.h, t: sp.stock.t, tool: sp.tool, doc: sp.doc, feedMax: sp.feedMax, plungeMax: sp.plungeMax, rapid: m.rapid || 3000, safe: 5 }; }
  function refSim(sp) { var k = sp.id + P.hash(sp.ref); return refCache[k] || (refCache[k] = GC.simulate(sp.ref, cfgOf(sp))); }
  function judge(sp, src) {
    var ref = refSim(sp), u = GC.simulate(src, cfgOf(sp)), o = { u: u, ref: ref, pen: [], score: 0, passed: false, pts: { acc: 0, time: 0, air: 0 } };
    if (u.errors.length) return o;
    var c = o.cmp = GC.compare(u.hm, ref.hm, sp.tol, u.nx), eff = clamp((c.acc - 0.5) / 0.47);
    o.pts.acc = 60 * clamp((c.acc - 0.85) / 0.14);
    o.pts.time = 25 * clamp((2.2 - u.time / ref.time) / 1.2) * eff;
    o.pts.air = 15 * clamp(1 - (u.airLen - ref.airLen - 1) / (0.25 * ref.feedLen + ref.airLen)) * eff;
    if (u.docMax > sp.doc + 0.02) o.pen.push({ pts: 15, line: u.docLine, msg: 'takes a ' + S.fmt(+u.docMax.toFixed(2)) + ' mm bite. The limit for this job is ' + sp.doc + ' mm per pass.' });
    if (u.plunge) o.pen.push({ pts: 10, line: u.plungeLine, msg: 'plunges straight down at F' + S.fmt(Math.round(u.plunge)) + '. The plunge limit is ' + sp.plungeMax + ' mm/min.' });
    if (u.feedOver) o.pen.push({ pts: 10, line: u.feedLine, msg: 'feeds at F' + S.fmt(Math.round(u.feedOver)) + '. The feed limit is ' + sp.feedMax + ' mm/min.' });
    o.score = Math.round(Math.max(0, o.pts.acc + o.pts.time + o.pts.air - o.pen.reduce(function (a, p) { return a + p.pts; }, 0)));
    o.passed = c.acc >= 0.97 && !o.pen.length && o.score >= 70;
    return o;
  }
  var MATC = { mdf: [96, 78, 60], ply: [128, 104, 72], ply6: [128, 104, 72], alu: [118, 130, 138] };
  function drawCut(cv, sp, res, showPath) {
    var ref = refSim(sp), W = cv.clientWidth || 340, L = 26, B = 18, k = (W - L - 6) / sp.stock.w, H = Math.round(sp.stock.h * k + B + 8), d = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * d); cv.height = Math.round(H * d); cv.style.height = H + 'px';
    var c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, W, H);
    var nx = ref.nx, ny = ref.ny, off = document.createElement('canvas'); off.width = nx; off.height = ny;
    var oc = off.getContext('2d'), img = oc.createImageData(nx, ny), px = img.data, base = MATC[sp.mk] || MATC.mdf, hm = res && res.u && !res.u.errors.length ? res.u.hm : null, bad = res && res.cmp ? res.cmp.bad : null, tg = ref.hm, t = sp.stock.t;
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) {
      var src = j * nx + i, o = ((ny - 1 - j) * nx + i) * 4, r = base[0], g = base[1], b = base[2], gr = ((i * 7 + j * 13) % 11) - 5;
      r += gr * 0.6; g += gr * 0.5; b += gr * 0.4;
      if (hm) {
        var z = hm[src];
        if (bad && bad[src] === 2) { r = 239; g = 96; b = 96; }
        else if (bad && bad[src] === 1) { r = 242; g = 193; b = 78; }
        else if (z < -1e-6) { var fr = z <= -t ? 1 : 0.42 + 0.4 * Math.min(1, -z / t); r = r + (9 - r) * fr; g = g + (14 - g) * fr; b = b + (17 - b) * fr; }
      } else if (tg[src] < -1e-6) { r = r * 0.45 + 127 * 0.55; g = g * 0.45 + 212 * 0.55; b = b * 0.45 + 230 * 0.55; }
      px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
    }
    oc.putImageData(img, 0, 0);
    c.imageSmoothingEnabled = true; c.drawImage(off, L, 6, sp.stock.w * k, sp.stock.h * k);
    var X = function (x) { return L + x * k; }, Y = function (y) { return 6 + (sp.stock.h - y) * k; };
    c.strokeStyle = css('--ridge'); c.lineWidth = 1; c.strokeRect(L + 0.5, 6.5, sp.stock.w * k - 1, sp.stock.h * k - 1);
    c.font = '9.5px ' + css('--mono'); c.fillStyle = css('--scree');
    var step = sp.stock.w > 90 ? 20 : 10;
    c.textAlign = 'center'; for (var x = 0; x <= sp.stock.w + 1e-6; x += step) { c.fillRect(X(x) - 0.5, Y(0), 1, 3); c.fillText(String(x), X(x), Y(0) + 13); }
    c.textAlign = 'right'; for (var y = 0; y <= sp.stock.h + 1e-6; y += step) { c.fillRect(L - 3, Y(y) - 0.5, 3, 1); c.fillText(String(y), L - 5, Y(y) + 3); }
    if (res && res.u && showPath) {
      c.save(); c.beginPath(); c.rect(L - 16, 0, W, H - B + 14); c.clip();
      res.u.path.forEach(function (s) {
        c.beginPath(); c.moveTo(X(s.a[0]), Y(s.a[1])); c.lineTo(X(s.b[0]), Y(s.b[1]));
        if (s.rapid) { c.setLineDash([3, 3]); c.strokeStyle = 'rgba(233,239,233,0.5)'; c.lineWidth = 1; } else { c.setLineDash([]); c.strokeStyle = s.a[2] < 0 || s.b[2] < 0 ? 'rgba(127,212,230,0.95)' : 'rgba(127,212,230,0.4)'; c.lineWidth = 1.2; }
        c.stroke();
      });
      c.setLineDash([]); var e = res.u.end; c.fillStyle = css('--glow'); c.beginPath(); c.arc(X(e.x), Y(e.y), 3, 0, 6.3); c.fill(); c.restore();
    }
  }

  /* ---------- records ---------- */
  function record(sp, daily, res) {
    var s = st(), id = sp.id, clean = !res.u.errors.length;
    if (!daily) {
      s.runs[id] = (s.runs[id] || 0) + 1;
      var b = s.best[id];
      if (clean && (!b || res.score > b.s || (res.score === b.s && res.u.time < b.time))) s.best[id] = { s: res.score, time: +res.u.time.toFixed(4), air: Math.round(res.u.airLen), t: Date.now() };
      if (res.passed) { if (!s.done[id]) { s.done[id] = Date.now(); S.addXP(100, 'Contract closed: ' + sp.name); nodeBonus(CON_NODE[id]); } S.doneToday('shoptask'); }
    } else {
      var k = S.day(), dd = s.daily[k], first = !(dd && dd.p); s.runs.daily = (s.runs.daily || 0) + 1;
      if (clean && (!dd || res.score >= dd.s)) s.daily[k] = { id: id, s: res.score, time: +res.u.time.toFixed(4), p: (dd && dd.p) || 0 };
      if (res.passed && first) { s.daily[k].p = 1; S.addXP(60, 'Daily contract closed'); S.doneToday('shop'); } else if (res.passed) S.doneToday('shop');
      var ks = Object.keys(s.daily).sort(); while (ks.length > 45) delete s.daily[ks.shift()];
    }
    S.markActive(); S.dirty('mods', 'main', 'log');
  }

  /* ---------- YouTube outline ---------- */
  var YT = {
    slot: ['My first hand-typed G-code: one straight slot', 'Depth per pass: why two shallow passes beat one deep one on a router.', 'slot width against the bit, depth with the caliper tail'],
    rect: ['Why my 40 mm rectangle came out 37 mm', 'The path is not the part. Offset by the tool radius: outside for a boss, inside for a hole.', 'width and height of the raised rectangle'],
    pocket: ['Clearing a pocket without leaving ridges', 'Stepover as a fraction of tool diameter, and why inside corners keep the tool’s radius.', 'pocket length, width and floor depth'],
    circle: ['G2 and G3 explained with one circle', 'I and J are offsets from the start point to the centre. G2 is clockwise, G3 counter-clockwise.', 'groove centreline diameter'],
    cpocket: ['A circular pocket by hand: rings and stepover', 'The last ring’s radius is the pocket radius minus the tool radius.', 'pocket diameter, floor finish'],
    bolt: ['A bolt circle with nothing but trig', 'Polar to Cartesian: x = xc + R cos θ, y = yc + R sin θ. Retract before every rapid.', 'hole-to-hole chord and pitch-circle diameter'],
    rrect: ['Rounded corners: blending G1 into G3', 'Arc centres stay where the drawing puts them; the path radius grows by the tool radius.', 'overall size, corner radius with a gauge'],
    aslot: ['First aluminium cut on my MPCNC: the numbers that worked', 'Chip load before speed: shallow passes, slow plunge, single flute, chips cleared.', 'slot width and wall finish'],
    fin: ['Cutting rocket fins on a home-built CNC', 'Offsetting a polygon: slide each edge along its normal, then intersect the neighbours.', 'root chord, tip chord, span'],
    jig: ['The jig that makes straight fins boring', 'Fit beats nominal: measure the tube and the fin stock, then cut to them.', 'bore fit on the body tube, slot fit on a fin'],
    ogive: ['A whole nose-cone curve in one line of G-code', 'A tangent ogive is one circular arc: ρ = (R² + L²) / (2R).', 'template against a printed profile'],
    karman: ['The nose cone with no arc: von Kármán by points', 'When a curve has no arc form the toolpath is short straight moves, packed where it bends.', 'template against the printed curve'],
    ring: ['Centering rings that actually fit', 'Inside cuts run inside the line, outside cuts outside it. Bore first, while the part is still held.', 'bore on the mount tube, outside in the airframe'],
    sled: ['An avionics sled from plywood', 'Order of operations: inside features first, the outline last.', 'hole spacing against the altimeter board']
  };
  function outline(sp, b) {
    var y = YT[sp.id], nx = nextCon(sp.id), nxt = nx ? D.C[nx](null).name.toLowerCase() : 'the next tier of the tree';
    return ['VIDEO OUTLINE · ' + sp.name + ' on the MPCNC Primo', '',
      'WORKING TITLES', '1. ' + y[0], '2. ' + sp.name + ': hand-written G-code, simulated then cut', '3. Self-taught CNC, contract by contract: ' + sp.name.toLowerCase(), '',
      'HOOK (0:00–0:15)', 'Finished part in hand, then the first chip. One line: “I wrote every line of this toolpath on my phone. Here is what the simulator caught before the router did.”', '',
      'BEATS', '1. The contract (0:15). Show the drawing: ' + sp.stock.w + ' × ' + sp.stock.h + ' × ' + sp.stock.t + ' mm ' + sp.mat + ', ' + sp.tool + ' mm end mill. Name the one limit that matters: ' + sp.doc + ' mm per pass.',
      '2. The plan (0:45). Screen-record SUMMIT: the G-code, the simulated cut' + (b ? ', score ' + b.s + ', cycle time ' + tm(b.time) : '') + '.',
      '3. The lesson (1:30). ' + y[1],
      '4. Setup (2:30). Workholding, zero X and Y at the lower-left corner and Z on the stock top, bit, speed dial. Glasses, ear protection and dust collection on camera.',
      '5. The cut (3:30). An air pass above the stock first, then the real one. First pass in real time, the rest as a timelapse.',
      '6. Measure (5:00). Calipers on ' + y[2] + '. Compare with the simulator: accuracy and cycle time.',
      '7. What I would change (6:00). One thing only. Tease the next build: ' + nxt + '.', '',
      'B-ROLL', 'Chips leaving the cut, the gantry from the side, the Jackpot3 screen, the part against the drawing.', '',
      'ON-SCREEN NUMBERS', 'Feed up to ' + sp.feedMax + ' mm/min · plunge up to ' + sp.plungeMax + ' mm/min · ' + sp.doc + ' mm per pass' + (b ? ' · simulated cycle ' + tm(b.time) : ''), '',
      'DESCRIPTION', 'Part of my self-taught path from data work into rocketry: learning the math, building the machine, cutting the parts. G-code and notes in the repo linked below.'].join('\n');
  }
  function ytSheet(sp) {
    var s = st(), ta = h('textarea', { class: 'code', style: 'height:300px;white-space:pre-wrap', 'aria-label': 'Video outline', wrap: 'soft' }); ta.value = s.yt[sp.id] || outline(sp, s.best[sp.id]);
    var note = h('p', { class: 'tiny muted', role: 'status' }, 'Edit it here; it is saved with this contract.');
    ta.addEventListener('change', function () { s.yt[sp.id] = ta.value; S.dirty('mods'); });
    var copy = function () { ta.focus(); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } if (!ok && navigator.clipboard) navigator.clipboard.writeText(ta.value).then(function () { note.textContent = 'Copied.'; }, function () { note.textContent = 'Select the text and copy it by hand.'; }); else note.textContent = ok ? 'Copied.' : 'Select the text and copy it by hand.'; };
    var ai = S.ai.on() ? h('button', { class: 'btn', onclick: async function () {
      ai.disabled = true; ai.replaceChildren(h('span', { class: 'spin' }), 'Claude is drafting…');
      try {
        var r = await S.ai.json('You are helping a self-taught maker plan a short YouTube video. Channel: building an MPCNC Primo router (Makita RT0701C, Jackpot3 controller), upgrading it toward aluminium, then cutting non-propulsive model-rocket parts. The maker is a data lead learning rocketry from first principles. Tone: plain, specific, no hype. Rewrite the outline below so it is specific to this cut. Keep the same sections. Keep every safety line. Never add anything about propellant, motors being made, igniters or nozzles. Return JSON {"outline": string} with the outline as plain text.\n\nOUTLINE:\n' + ta.value, { cache: false });
        if (r && typeof r.outline === 'string' && r.outline.length > 80) { ta.value = r.outline; s.yt[sp.id] = ta.value; S.dirty('mods'); note.textContent = 'Tailored by Claude. Edit freely.'; } else note.textContent = 'Claude sent nothing usable. The template is unchanged.';
      } catch (e) { note.textContent = S.ai.why(e); }
      ai.disabled = false; ai.textContent = 'Tailor it with Claude';
    } }, 'Tailor it with Claude') : null;
    S.sheet(h('div', { class: 'col gap14' }, h('div', null, h('div', { class: 'eyebrow' }, 'For your channel'), h('h3', null, 'Video outline: ' + sp.name)), ta, note,
      h('div', { class: 'grid2' }, h('button', { class: 'btn go', onclick: copy }, 'Copy'), h('button', { class: 'btn', onclick: function () { ta.value = outline(sp, s.best[sp.id]); delete s.yt[sp.id]; S.dirty('mods'); note.textContent = 'Back to the template.'; } }, 'Reset')), ai,
      h('button', { class: 'btn ghost', onclick: function () { S.closeSheet(); } }, 'Close')));
  }

  /* ---------- results ---------- */
  function goLine(ta, n) { var ls = ta.value.split('\n'), a = 0; for (var i = 0; i < n - 1 && i < ls.length; i++) a += ls[i].length + 1; ta.focus(); ta.setSelectionRange(a, a + (ls[n - 1] || '').length); }
  function showResult(box, res, sp, daily, ta, cv, redraw) {
    var out = [], u = res.u;
    if (u.errors.length) {
      var e = u.errors[0], raw = (ta.value.split('\n')[e.line - 1] || '').trim();
      out.push(h('div', { class: 'card warn' }, h('h3', null, 'The program stopped at line ' + e.line), raw ? h('div', { class: 'con' }, raw) : null, h('p', { class: 'small' }, e.msg),
        h('button', { class: 'btn sm', onclick: function () { goLine(ta, e.line); } }, 'Show line ' + e.line), h('p', { class: 'tiny muted' }, 'A crash scores zero. Everything up to that line is drawn on the stock.')));
      S.put(box, out); return;
    }
    var c = res.cmp, cell = GC.RES * GC.RES, ref = res.ref, y = [];
    y.push(h('div', { class: 'row' }, h('span', { class: 'big' }, String(res.score)), h('div', { class: 'grow' }, h('h3', null, res.passed ? (daily ? 'Daily contract closed' : 'Contract closed') : 'Not yet'), h('p', { class: 'small muted' }, 'To pass: 97% accuracy, inside the machine limits, score 70 or more'))));
    y.push(h('dl', { class: 'kv' },
      h('dt', null, 'Accuracy'), h('dd', { class: 'num' }, (c.acc * 100).toFixed(1) + '% of the target · ' + Math.round(res.pts.acc) + '/60'),
      h('dt', null, 'Cycle time'), h('dd', { class: 'num' }, tm(u.time) + ' against par ' + tm(ref.time) + ' · ' + Math.round(res.pts.time) + '/25'),
      h('dt', null, 'Air-cutting'), h('dd', { class: 'num' }, S.fmt(Math.round(u.airLen)) + ' mm at feed rate, par ' + S.fmt(Math.round(ref.airLen)) + ' mm · ' + Math.round(res.pts.air) + '/15')));
    var fb = [];
    if (c.under) fb.push(h('div', { class: 'fb part' }, 'Left uncut: ' + S.fmt(+(c.under * cell).toFixed(1)) + ' mm² that should be gone, or cut too shallow (amber).'));
    if (c.over) fb.push(h('div', { class: 'fb bad' }, 'Overcut: ' + S.fmt(+(c.over * cell).toFixed(1)) + ' mm² outside the drawing or too deep (red). Overcut counts double: you cannot put material back.'));
    if (!c.under && !c.over) fb.push(h('div', { class: 'fb ok' }, 'Every cell of the target is cut to depth and nothing else is touched.'));
    res.pen.forEach(function (p) { fb.push(h('div', { class: 'fb bad' }, h('strong', null, 'Line ' + p.line + ' '), p.msg + ' (−' + p.pts + ')', h('div', null, h('button', { class: 'btn sm ghost', style: 'margin-top:6px', onclick: function () { goLine(ta, p.line); } }, 'Show line ' + p.line)))); });
    if (c.acc >= 0.97 && !res.pen.length && u.time > ref.time * 1.15) fb.push(h('div', { class: 'fb part' }, 'Accurate, but slow against par. Feed closer to the limit, rapid (G0) between cuts, and plunge from just above the surface.'));
    if (u.time < ref.time * 0.97 && res.passed) fb.push(h('div', { class: 'fb ok' }, 'Under par by ' + Math.round((1 - u.time / ref.time) * 100) + '%.'));
    u.warns.forEach(function (w) { fb.push(h('div', { class: 'fb part' }, (w.line ? 'Line ' + w.line + ': ' : '') + w.msg)); });
    y.push(h('div', { class: 'col gap4' }, fb));
    y.push(h('p', { class: 'tiny muted num' }, 'Cutting ' + S.fmt(Math.round(u.feedLen)) + ' mm · rapids ' + S.fmt(Math.round(u.rapidLen)) + ' mm · deepest bite ' + S.fmt(+u.docMax.toFixed(2)) + ' mm · ' + u.lines + ' lines'));
    if (res.passed) y.push(h('div', { class: 'grid2' }, h('button', { class: 'btn', onclick: function () { ytSheet(sp); } }, 'Video outline'), (function () { var n = nextCon(sp.id); return n && !daily ? h('button', { class: 'btn go', onclick: function () { S.go('con-' + n); } }, 'Next contract') : h('button', { class: 'btn go', onclick: function () { S.go('shop'); } }, 'Back to the shop'); })()));
    out.push(h('div', { class: 'card ' + (res.passed ? 'hero' : '') }, y));
    S.put(box, out);
  }

  /* ---------- contract screen ---------- */
  var lastRun = {}, pathOn = true;
  S.view('con-', function (arg) {
    var daily = arg === 'daily', sp = specOf(arg), s = st(), out = [];
    if (!sp) return h('div', { class: 'col gap14' }, S.backBtn('Shop Contracts', 'shop'), h('div', { class: 'card lock' }, daily ? S.lockBox(E.reqText(D.NODES[0].req)) : h('p', null, 'No such contract.')));
    var node = CON_NODE[sp.id], open = nodeOpen(node), ck = daily ? 'daily' : sp.id;
    out.push(h('div', { class: 'row' }, S.backBtn('Shop Contracts', 'shop'), h('span', { class: 'grow' }), !daily && s.done[sp.id] ? h('span', { class: 'pill ok' }, 'Closed') : null, daily ? h('span', { class: 'pill glow' }, 'Daily') : null));
    out.push(h('div', null, h('div', { class: 'eyebrow' }, daily ? 'Today’s seeded contract · ' + S.day() : node.name), h('h2', null, sp.name)));
    if (!open) out.push(h('div', { class: 'card lock' }, S.lockBox(lockText(node)), E.reqMissing(node.req).length ? h('div', { class: 'row wrap' }, E.reqMissing(node.req).slice(0, 5).map(function (m) { return h('button', { class: 'btn sm ice', onclick: function () { S.go('ch-' + m); } }, 'Ch ' + m + ' ' + S.LBL[m]); })) : h('button', { class: 'btn sm', onclick: function () { S.go('shop'); } }, 'Go to the check-in')));
    else { var er = E.erodedPrereqs(node.req); if (er.length) out.push(h('div', { class: 'card warn' }, h('p', { class: 'small' }, 'Prerequisite eroding: ' + E.list(er.map(function (m) { return 'Ch ' + m + ' at ' + S.pct(E.integrity(m)); })) + '. The contract stays open; a 4-question review restores it.'), h('button', { class: 'btn sm', onclick: function () { E.start('review', er[0]); } }, 'Refresh Ch ' + er[0]))); }
    var cl = sp.feedMax / 10000;
    out.push(h('div', { class: 'card' }, h('div', { class: 'eyebrow' }, 'Work order'), S.rich('div', 'doc', '<p>' + S.tex(sp.text) + '</p>'),
      h('dl', { class: 'kv' }, h('dt', null, 'Stock'), h('dd', { class: 'num' }, sp.stock.w + ' × ' + sp.stock.h + ' × ' + sp.stock.t + ' mm ' + sp.mat), h('dt', null, 'Tool'), h('dd', { class: 'num' }, sp.tool + ' mm flat end mill'),
        h('dt', null, 'Limits'), h('dd', { class: 'num' }, sp.doc + ' mm per pass · feed ≤ ' + sp.feedMax + ' · plunge ≤ ' + sp.plungeMax + ' mm/min'), h('dt', null, 'Zero'), h('dd', null, 'X0 Y0 at the lower-left corner, Z0 on the stock top')),
      sp.note ? h('p', { class: 'small muted' }, sp.note) : null,
      h('p', { class: 'tiny muted' }, 'At dial 1 (10,000 RPM) with a single-flute bit, F' + sp.feedMax + ' is a chip load of ' + S.fmt(+cl.toFixed(3)) + ' mm per tooth.')));
    var cv = h('canvas', { class: 'viz', role: 'img', 'aria-label': 'Top view of the stock: target, cut and toolpath' });
    var legend = h('p', { class: 'tiny muted' }, 'Blue: the target. After a run, dark is cut, amber is left uncut, red is overcut, lines are your toolpath (dashed = rapid). Axes in mm.');
    if (!open) { out.push(h('div', { class: 'col gap4' }, cv, legend)); S.afterRender = function () { drawCut(cv, sp, null, false); }; return h('div', { class: 'col gap14' }, out); }
    var ta = h('textarea', { class: 'code', spellcheck: 'false', autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off', wrap: 'off', 'aria-label': 'G-code for ' + sp.name });
    var saved = daily ? (s.code.daily && s.code.daily.day === S.day() ? s.code.daily.src : null) : s.code[sp.id];
    ta.value = saved != null ? saved : sp.start;
    var fit = function () { ta.style.height = Math.min(520, Math.max(170, ta.value.split('\n').length * S.lh(ta) + 26)) + 'px'; }, saveT;
    var keep = function () { if (daily) s.code.daily = { day: S.day(), src: ta.value }; else s.code[sp.id] = ta.value; S.dirty('mods'); };
    var ins = function (t) { var a = ta.selectionStart, b = ta.selectionEnd; ta.value = ta.value.slice(0, a) + t + ta.value.slice(b); ta.selectionStart = ta.selectionEnd = a + t.length; ta.dispatchEvent(new Event('input')); ta.focus(); };
    ta.addEventListener('input', function () { fit(); clearTimeout(saveT); saveT = setTimeout(keep, 900); });
    var keys = h('div', { class: 'keys', role: 'toolbar', 'aria-label': 'G-code keys' }, [['G0 ', 'G0'], ['G1 ', 'G1'], ['G2 ', 'G2'], ['G3 ', 'G3'], [' X', 'X'], [' Y', 'Y'], [' Z', 'Z'], [' I', 'I'], [' J', 'J'], [' F', 'F'], [' R', 'R'], ['-', '−'], ['.', '.'], ['\n', '⏎']].map(function (k) { return h('button', { type: 'button', 'aria-label': k[1] === '⏎' ? 'New line' : k[1], onclick: function () { ins(k[0]); } }, k[1]); }));
    var resBox = h('div', { class: 'col gap14' });
    var redraw = function () { drawCut(cv, sp, lastRun[arg] || null, pathOn); };
    var runBtn = h('button', { class: 'btn go', onclick: function () {
      keep(); var res = judge(sp, ta.value); lastRun[arg] = res; record(sp, daily, res);
      var n2 = s.runs[ck] || 0;
      if (!canRef && (res.passed || n2 >= 5)) { S.keepScroll = true; S.render(true); return; }
      if (refNote) refNote.textContent = 'The reference program opens after you close the contract or after five runs (' + n2 + ' so far).';
      redraw(); showResult(resBox, res, sp, daily, ta, cv, redraw);
      if (cv.scrollIntoView) cv.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } }, 'Run the cut');
    var nRuns = s.runs[ck] || 0, canRef = (!daily && !!s.done[sp.id]) || (daily && s.daily[S.day()] && s.daily[S.day()].p) || nRuns >= 5, hintBox = h('div', { class: 'col gap4' }), nh = 0, refNote = canRef ? null : h('p', { class: 'tiny muted' }, 'The reference program opens after you close the contract or after five runs (' + nRuns + ' so far).');
    var hints = ['Every program has the same shape: G0 to a safe height, G0 over the start point, G1 Z down at the plunge rate, G1/G2/G3 along the cut at the feed rate, G0 Z5 to finish.', 'This one starts: ' + sp.ref.split('\n').slice(2, 5).join(' / ') + ' …'];
    out.push(h('div', { class: 'col gap4' }, cv, h('div', { class: 'row' }, h('span', { class: 'grow' }, legend), h('button', { class: 'btn sm ghost', 'aria-pressed': String(pathOn), onclick: function (ev) { pathOn = !pathOn; ev.currentTarget.setAttribute('aria-pressed', String(pathOn)); ev.currentTarget.textContent = pathOn ? 'Hide path' : 'Show path'; redraw(); } }, pathOn ? 'Hide path' : 'Show path'))));
    out.push(h('div', { class: 'col' }, keys, ta,
      h('div', { class: 'row wrap' }, runBtn, h('button', { class: 'btn', onclick: function () { if (nh < hints.length) { hintBox.append(h('div', { class: 'fb part' }, 'Hint ' + (nh + 1) + ': ' + hints[nh])); nh++; } else S.toast('No more hints for this contract.'); } }, 'Hint'),
        h('button', { class: 'btn ghost', onclick: function () { S.ask('Clear your program?', 'The editor goes back to the two starting lines.', [{ label: 'Clear it', cls: 'danger', fn: function () { ta.value = sp.start; ta.dispatchEvent(new Event('input')); } }, { label: 'Cancel' }]); } }, 'Reset')),
      hintBox,
      h('details', null, h('summary', { class: 'small muted', style: 'cursor:pointer' }, 'G-code card'), h('dl', { class: 'kv small', style: 'margin-top:8px' },
        h('dt', { class: 'mono' }, 'G0 X Y Z'), h('dd', null, 'Rapid move. Never into material.'), h('dt', { class: 'mono' }, 'G1 X Y Z F'), h('dd', null, 'Straight cut at feed F (mm/min). F stays until changed.'),
        h('dt', { class: 'mono' }, 'G2 / G3'), h('dd', null, 'Clockwise / counter-clockwise arc to X Y. I and J give the centre, measured from the start point. Or R for arcs under 180°.'),
        h('dt', { class: 'mono' }, 'G90 / G91'), h('dd', null, 'Absolute / incremental coordinates.'), h('dt', { class: 'mono' }, 'G21 / G20'), h('dd', null, 'Millimetres / inches.'), h('dt', { class: 'mono' }, '; note'), h('dd', null, 'Comment. Also ( note ).'))),
      canRef ? h('details', null, h('summary', { class: 'small muted', style: 'cursor:pointer' }, 'Reference program (par)'), h('pre', { class: 'code con', style: 'max-height:300px;margin-top:8px' }, sp.ref), h('p', { class: 'tiny muted' }, 'One sound way to cut it, and the program that sets par. It can be beaten.')) : refNote));
    out.push(resBox);
    S.afterRender = function () { fit(); redraw(); if (lastRun[arg]) showResult(resBox, lastRun[arg], sp, daily, ta, cv, redraw); };
    return h('div', { class: 'col gap14' }, out);
  }, { tab: 'train', track: 'shop' });

  /* ---------- numeric checks: feeds and speeds, controller setup, rigidity ---------- */
  var qs = null;
  function qDraw() { var Q = QUIZ[qs.kind], gi = qs.order[qs.n % qs.order.length], o = Q.gens[gi](qs.rng), f = o.f.map(function (z) { return { l: z[0], v: z[1], u: z[2] || '', tol: z[3] == null ? 0.02 : z[3] }; }); return { q: S.tex(o.q), sol: S.tex(o.s), f: f, ans: { f: f.map(function () { return ''; }) } }; }
  function qStart(kind) { var rng = P.rng('shopq' + kind + Date.now()), n = QUIZ[kind].gens.length, order = rng.shuffle(Array.apply(null, { length: n }).map(function (_, i) { return i; })); qs = { kind: kind, rng: rng, order: order, n: 0, ok: 0, len: 5 }; qs.cur = qDraw(); S.markActive(); S.render(); }
  function qAnswer() {
    var c = qs.cur, s = st(); c.okv = c.f.map(function (f, i) { return E.fieldOK(f, c.ans.f[i]); }); c.ok = c.okv.every(Boolean); c.done = true; qs.n++; if (c.ok) qs.ok++;
    s.fs.n++; if (c.ok) { s.fs.ok++; S.state.xp += 6; S.today().xp += 6; S.renderTop(); }
    if (qs.n >= qs.len) {
      qs.ended = true; qs.pass = qs.ok >= 4;
      if (qs.pass) { var k = 'q_' + qs.kind; if (!s.done[k]) { s.done[k] = Date.now(); S.addXP(60, QUIZ[qs.kind].name + ' check passed'); nodeBonus(NODE[QUIZ[qs.kind].node]); } S.doneToday('shoptask'); }
    }
    S.dirty('mods', 'main', 'log'); S.render();
  }
  S.view('shopq-', function (kind) {
    var Q = QUIZ[kind]; if (!Q) return h('p', null, 'No such check.');
    var node = NODE[Q.node], out = [h('div', { class: 'row' }, S.backBtn('Shop Contracts', 'shop'))];
    if (!nodeOpen(node)) { qs = null; out.push(h('div', null, h('div', { class: 'eyebrow' }, node.name), h('h2', null, Q.name)), h('div', { class: 'card lock' }, S.lockBox(lockText(node)))); return h('div', { class: 'col gap14' }, out); }
    if (!qs || qs.kind !== kind) {
      var s = st();
      out.push(h('div', null, h('div', { class: 'eyebrow' }, node.name), h('h2', null, Q.name), h('p', { class: 'small muted', style: 'margin-top:4px' }, Q.sub + '. Five questions with fresh numbers every time; four right passes the check.')));
      out.push(h('div', { class: 'card hero' }, s.done['q_' + kind] ? h('p', { class: 'small' }, 'Passed ' + S.ago(s.done['q_' + kind]) + '. Run it again any time as a drill.') : h('p', { class: 'small' }, 'Have a calculator handle the arithmetic; the set-up is the skill.'), h('button', { class: 'btn go', onclick: function () { qStart(kind); } }, s.done['q_' + kind] ? 'Drill again' : 'Start the check')));
      if (kind === 'fs') out.push(h('div', { class: 'card' }, h('h3', null, 'Makita RT0701C speed dial'), h('div', { class: 'tw' }, h('table', null, h('thead', null, h('tr', null, h('th', null, 'Dial'), [1, 2, 3, 4, 5, 6].map(function (d) { return h('th', { class: 'num' }, String(d)); }))), h('tbody', null, h('tr', null, h('td', null, 'RPM'), [1, 2, 3, 4, 5, 6].map(function (d) { return h('td', { class: 'num' }, S.fmt(D.DIAL[d])); }))))), S.rich('p', 'small muted', S.tex('Chip load \\(= \\dfrac{\\text{feed}}{\\text{RPM} \\times \\text{flutes}}\\). Speeds are the approximate values from Makita’s manual; check your own.')),
        h('p', { class: 'small muted' }, 'A place to start on the real machine, from V1 Engineering’s milling basics: a 1/8 in single-flute upcut bit, 8 mm/s feed, 3 mm/s plunge, 1 mm depth of cut, for anything softer than metal. The limits on the contracts here are simulator ceilings, not a recipe for your Primo.')));
      return h('div', { class: 'col gap14' }, out);
    }
    if (qs.ended) {
      out.push(h('div', { class: 'card ' + (qs.pass ? 'hero' : '') }, h('div', { class: 'row' }, h('span', { class: 'big' }, qs.ok + '/' + qs.len), h('div', { class: 'grow' }, h('h3', null, qs.pass ? 'Check passed' : 'Not yet'), h('p', { class: 'small muted' }, 'Four of five passes. Numbers change every run.'))),
        h('div', { class: 'grid2' }, h('button', { class: 'btn', onclick: function () { qs = null; S.go('shop'); } }, 'Back to the shop'), h('button', { class: 'btn go', onclick: function () { qStart(kind); } }, 'Again'))));
      return h('div', { class: 'col gap14' }, out);
    }
    var c = qs.cur, body = h('div', { class: 'qcard' }, h('div', { class: 'row' }, h('span', { class: 'eyebrow grow' }, Q.name), h('span', { class: 'pill' }, (c.done ? qs.n : qs.n + 1) + ' of ' + qs.len)), S.rich('div', 'qtext', c.q));
    if (!c.done) { c.f.forEach(function (f, i) { body.append(S.numField(c, i, 'sq' + qs.n)); }); body.append(h('button', { class: 'btn go block', onclick: qAnswer }, 'Check')); }
    else {
      c.f.forEach(function (f, i) { var ok = c.okv[i]; body.append(S.rich('div', 'fb ' + (ok ? 'ok' : 'bad'), '<span class="num">' + S.tex(f.l) + ': <strong>' + S.esc(String(c.ans.f[i]).trim() || '—') + '</strong> ' + S.esc(f.u) + (ok ? ' ✓' : ' ✗ &nbsp;correct: <strong>' + E.showNum(f.v) + '</strong> ' + S.esc(f.u)) + '</span>')); });
      body.append(S.rich('div', 'keyans small', '<span class="eyebrow">Method</span>' + c.sol));
      body.append(h('button', { class: 'btn go block', onclick: function () { qs.cur = qDraw(); S.render(); } }, 'Next'));
    }
    out.push(body);
    return h('div', { class: 'col gap14' }, out);
  }, { tab: 'train', track: 'shop' });

  /* ---------- real-world check-ins ---------- */
  function shrink(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        try {
          var out = null, dims = [960, 800, 640, 480], q = [0.72, 0.6, 0.5];
          for (var a = 0; a < dims.length && !out; a++) for (var b = 0; b < q.length && !out; b++) {
            var k = Math.min(1, dims[a] / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k));
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); var u = cv.toDataURL('image/jpeg', q[b]); if (u.length < 170000) out = u;
          }
          URL.revokeObjectURL(url); if (out) res(out); else rej(new Error('That photo is too large to store. Try a smaller one.'));
        } catch (e) { URL.revokeObjectURL(url); rej(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('That file could not be read as a photo.')); };
      img.src = url;
    });
  }
  function chkSheet(n) {
    var s = st(), id = n.chk.id, cur = s.chk[id], photo = null, prev = h('div', { class: 'row' }), msg = h('p', { class: 'tiny muted', role: 'status' }, cur ? 'Logged ' + S.ago(cur.t) + '. You can replace the photo or the note.' : 'Both the photo and the note are needed.');
    var note = h('textarea', { class: 'ta', rows: '3', maxlength: '600', placeholder: 'What you did, what went wrong, what you would change.', 'aria-label': 'Check-in note' }); note.value = cur ? cur.note : '';
    var show = function (u) { prev.replaceChildren(h('img', { class: 'thumb', src: u, alt: 'Check-in photo' })); };
    if (cur) S.photoLoad(id).then(function (u) { if (u && !photo) show(u); });
    var file = h('input', { type: 'file', accept: 'image/*', 'aria-label': 'Check-in photo', onchange: async function () { var f = file.files && file.files[0]; if (!f) return; msg.textContent = 'Preparing the photo…'; try { photo = await shrink(f); show(photo); msg.textContent = 'Photo ready.'; } catch (e) { msg.textContent = String(e.message || e); } } });
    var save = h('button', { class: 'btn go', onclick: async function () {
      var t = note.value.trim(); if (t.length < 10) { msg.textContent = 'Add a short note: a sentence about what you did.'; return; } if (!photo && !cur) { msg.textContent = 'Add a photo of the real thing.'; return; }
      save.disabled = true; var first = !cur; if (photo) await S.photoSave(id, photo);
      s.chk[id] = { t: cur ? cur.t : Date.now(), note: t, ph: 1, e: Date.now() };
      if (first) { S.addXP(80, 'Check-in logged: ' + n.name); D.NODES.forEach(function (m) { if (m.needs === id && E.reqMet(m.req)) S.toast('Hardware tier open: ' + m.name); }); nodeBonus(n); S.doneToday('shoptask'); }
      S.markActive(); S.dirty('mods', 'main', 'log'); S.closeSheet(true); S.render(true);
    } }, cur ? 'Save changes' : 'Log the check-in');
    S.sheet(h('div', { class: 'col gap14' }, h('div', null, h('div', { class: 'eyebrow' }, 'Real-world check-in'), h('h3', null, n.name)), h('p', { class: 'small' }, n.chk.ask), h('label', { class: 'col gap4' }, h('span', { class: 'small muted' }, 'Photo'), file), prev, h('label', { class: 'col gap4' }, h('span', { class: 'small muted' }, 'Note'), note), msg, save,
      h('p', { class: 'tiny muted' }, 'Photos are shrunk and stored with your SUMMIT data. They are not part of the JSON backup.'), h('button', { class: 'btn ghost', onclick: function () { S.closeSheet(); } }, 'Close')));
  }

  /* ---------- shop home ---------- */
  S.view('shop', function () {
    var s = st(), out = [], dp = dailyPick(), today = s.daily[S.day()], nd = D.ORDER.filter(function (c) { return s.done[c]; }).length;
    out.push(h('div', { class: 'row' }, S.backBtn('Train', 'train')));
    out.push(h('div', null, h('div', { class: 'eyebrow' }, 'Toolpaths and the build'), h('h2', null, 'Shop Contracts'), h('p', { class: 'small muted', style: 'margin-top:4px' }, 'Write the G-code, cut it in the simulator, and get scored on accuracy, cycle time and air-cutting. The tree runs from tuning the Primo, to an aluminium machine, to rocket hardware.')));
    if (dp) { var dsp = specOf('daily'); out.push(h('div', { class: 'card hero' }, h('div', { class: 'eyebrow' }, 'Daily seeded contract · ' + S.day()), h('h3', null, dsp.name), h('p', { class: 'small' }, 'Today’s seed changes the dimensions. ' + dsp.stock.w + ' × ' + dsp.stock.h + ' mm ' + dsp.mat + ', ' + dsp.tool + ' mm tool. ' + (today ? 'Best today: ' + today.s + ' in ' + tm(today.time) + '.' : 'Not cut yet.')), h('button', { class: 'btn go', onclick: function () { S.go('con-daily'); } }, today && today.p ? 'Cut it again' : 'Take the contract'))); }
    else out.push(h('div', { class: 'card lock' }, S.lockBox(E.reqText(D.NODES[0].req)), h('p', { class: 'small muted' }, 'The first tier opens with Chapters 1 and 3: units and tolerances, then coordinates and vectors. The daily contract comes from the highest tier you have open.')));
    out.push(h('div', { class: 'row' }, h('h3', { class: 'grow' }, 'Tech tree'), h('span', { class: 'pill ' + (nd ? 'ok' : '') }, nd + '/' + D.ORDER.length + ' contracts')));
    D.NODES.forEach(function (n, ni) {
      var open = nodeOpen(n), done = nodeDone(n), chap = E.reqMet(n.req), ps = parts(n);
      var card = h('div', { class: 'card ' + (open ? '' : 'lock') }, h('div', { class: 'row' }, h('span', { style: 'width:36px;height:36px;border-radius:9px;background:var(--scarp);display:grid;place-items:center;font:800 15px var(--display);flex:none;color:' + (done ? 'var(--moss)' : open ? 'var(--glow)' : 'var(--scree)') }, 'T' + (ni + 1)), h('div', { class: 'grow' }, h('div', { style: 'font-weight:600' }, n.name), h('div', { class: 'small muted' }, n.sub + ' · Ch ' + n.req.ch.join(', '))), done ? h('span', { class: 'pill ok' }, 'Complete') : open ? h('span', { class: 'pill glow' }, ps.filter(function (p) { return p.done; }).length + '/' + ps.length) : chap ? h('span', { class: 'pill' }, 'Check-in') : h('span', { class: 'pill' }, 'Locked')));
      if (!open) { card.append(S.lockBox(lockText(n))); if (chap && n.needs) card.append(h('button', { class: 'btn sm', onclick: function () { if (nodeOpen(CHK[n.needs])) chkSheet(CHK[n.needs]); else S.toast('Open “' + CHK[n.needs].name + '” first.'); } }, 'Log the “' + CHK[n.needs].name + '” check-in')); }
      var list = h('div', { class: 'list' });
      ps.forEach(function (p) {
        if (p.k === 'con') { var sp0 = D.C[p.id](null), b = s.best[p.id]; list.append(h('button', { class: 'item' + (p.done ? ' done' : ''), onclick: function () { S.go('con-' + p.id); } }, h('span', { class: 'ic' }, p.done ? '✓' : '⌗'), h('span', { class: 'grow' }, h('div', { class: 'ttl' }, sp0.name), h('div', { class: 'sub' }, sp0.mat + ' · ' + sp0.tool + ' mm tool' + (b ? ' · best ' + b.s + ' in ' + tm(b.time) : ''))), h('span', { class: 'chev' }, '›'))); }
        else if (p.k === 'quiz') list.append(h('button', { class: 'item' + (p.done ? ' done' : ''), onclick: function () { qs = null; S.go('shopq-' + p.id); } }, h('span', { class: 'ic' }, p.done ? '✓' : '∑'), h('span', { class: 'grow' }, h('div', { class: 'ttl' }, QUIZ[p.id].name + ' check'), h('div', { class: 'sub' }, QUIZ[p.id].sub)), h('span', { class: 'chev' }, '›')));
        else list.append(h('button', { class: 'item' + (p.done ? ' done' : ''), onclick: function () { if (open) chkSheet(n); else S.toast('This check-in opens with the tier.'); } }, h('span', { class: 'ic' }, p.done ? '✓' : '◉'), h('span', { class: 'grow' }, h('div', { class: 'ttl' }, 'Real-world check-in'), h('div', { class: 'sub' }, p.done ? 'Logged ' + S.ago(s.chk[p.id].t) + ' · ' + s.chk[p.id].note.slice(0, 60) : 'Photo and a short note from the machine')), h('span', { class: 'chev' }, '›')));
      });
      card.append(list); out.push(card);
    });
    var bk = D.ORDER.filter(function (c) { return s.best[c]; }), dk = Object.keys(s.daily).sort().reverse().slice(0, 14);
    out.push(h('div', { class: 'card' }, h('h3', null, 'Personal bests'), bk.length || dk.length ? h('div', { class: 'tw' }, h('table', null, h('thead', null, h('tr', null, h('th', null, 'Contract'), h('th', null, 'Score'), h('th', null, 'Cycle'))),
      h('tbody', null, bk.map(function (c) { var b = s.best[c]; return h('tr', null, h('td', null, D.C[c](null).name), h('td', { class: 'num' }, String(b.s)), h('td', { class: 'num' }, tm(b.time))); }), dk.map(function (k) { var d = s.daily[k]; return h('tr', null, h('td', null, 'Daily ' + k.slice(5) + ' · ' + D.C[d.id](null).name), h('td', { class: 'num' }, String(d.s)), h('td', { class: 'num' }, tm(d.time))); })))) : h('p', { class: 'small muted' }, 'Your best score and cycle time for each contract and each daily cut are kept here.'),
      s.fs.n ? h('p', { class: 'tiny muted num' }, 'Shop arithmetic: ' + s.fs.ok + ' of ' + s.fs.n + ' answers right.') : null));
    out.push(h('p', { class: 'tiny muted' }, 'Scope: fixtures, templates, fins, rings and sleds. Motor hardware here means mounts for certified commercial motors. No motor casings, nozzles or propellant tooling. The simulator is a flat-end-mill model on a 0.25 mm grid; real cuts need workholding, eye and ear protection, and dust control.'));
    return h('div', { class: 'col gap14' }, out);
  }, { tab: 'train', track: 'shop' });

  S.MODS.shop = { name: 'Shop Contracts', tag: 'G-code and the build', go: 'shop',
    summary: function () { var op = D.NODES.filter(nodeOpen), nd = D.ORDER.filter(function (c) { return st().done[c]; }).length; return op.length ? { open: true, pill: nd + '/' + D.ORDER.length + ' contracts', pillCls: nd ? 'ok' : '', line: 'Hand-written toolpaths cut in a simulator and scored on accuracy, cycle time and air-cutting. ' + S.plural(op.length, 'tier') + ' of 7 open; a seeded contract every day.' } : { open: false, pill: 'Locked', line: 'G-code puzzles and feeds-and-speeds checks, on a tree from tuning the Primo to an aluminium machine to rocket hardware.', lock: E.reqText(D.NODES[0].req) }; },
    plan: function (mins) { var dp = dailyPick(); if (!dp) return null; var sp = D.C[dp.id](null); return { id: 'shop', ic: '⌗', t: 'Daily shop contract', s: sp.name + ' in ' + sp.mat + ', today’s dimensions', m: mins <= 30 ? 8 : 12, go: 'con-daily' }; },
    task: function () { var t = nextTask(); return t ? { id: 'shoptask', ic: '⚒', t: t.t, s: t.s, m: t.m, go: t.go } : null; } };
  S.SHOP = { judge: judge, specOf: specOf, nodeOpen: nodeOpen, NODES: D.NODES, outline: outline, qs: function () { return qs; } };
})();
