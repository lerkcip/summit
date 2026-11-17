/* SUMMIT · views: Mountain, chapter page, reader, quizzes and exams */
(function () {
  'use strict';
  var S = window.S, h = S.h, E = S.E, CH = S.CH, CUR = S.CUR;
  S.LBL = [0, 'Units', 'Algebra & Logs', 'Trig & Vectors', 'Conics & Series', 'Mechanics', 'Chemistry', 'Rockets 101', 'Calculus', 'Vector Calc', 'Linear Algebra', 'ODEs & Laplace', 'PDEs & Fourier', 'Probability', 'Numerical', 'Dynamics', 'Thermo', 'Combustion', 'Fluids', 'Heat Transfer', 'Solids', 'EM & Signals', 'Control', 'Compressible I', 'Shocks', 'Aerodynamics', 'Propulsion', 'Liquid Engines', 'Solid & Hybrid', 'Orbits I', 'Astrodynamics', 'Ascent', 'Attitude', 'Structures', 'Avionics', 'Systems Eng', 'Gas Dynamics', 'Viscous Flow', 'Hypersonic Aero', 'High-Temp Gas', 'Rarefied Flow', 'Aerothermo', 'TPS', 'Entry', 'Air-breathing', 'CFD', 'Advanced GNC', 'Adv Combustion', 'Plasma & EP', 'Experiments', 'MDO & UQ', 'Beyond Chem', 'Research', 'Frontier', 'Practice'];
  var TAGNAME = { N: 'Numerical', C: 'Concept', I: 'Integrative' };
  function pillFor(st) { return st === 'done' ? h('span', { class: 'pill ok' }, 'Mastered') : st === 'eroded' ? h('span', { class: 'pill warn' }, 'Cairn crumbling') : st === 'open' ? h('span', { class: 'pill glow' }, 'Open') : h('span', { class: 'pill' }, 'Locked'); }
  S.pillFor = pillFor;
  S.lockBox = function (text) { return h('p', { class: 'lockmsg' }, h('b', null, 'LOCKED'), ' — ' + text); };
  function backBtn(label, hash) { return h('button', { class: 'btn ghost sm', onclick: function () { S.go(hash); } }, '‹ ' + label); }
  S.backBtn = backBtn;

  /* ---------- reading chunks, loaded on demand ---------- */
  var READ = {}, waiting = {};
  window.SUMMIT_READ = function (key, data) { READ[key] = data; (waiting[key] || []).forEach(function (f) { f(data); }); delete waiting[key]; };
  S.loadRead = function (key) {
    return new Promise(function (res, rej) {
      if (READ[key]) return res(READ[key]);
      var first = !waiting[key]; (waiting[key] = waiting[key] || []).push(res);
      if (first) { var s = document.createElement('script'); s.src = 'data/read' + (key === 'ax' ? 'A' : key.slice(1)) + '.js'; s.onerror = function () { delete waiting[key]; rej(new Error('The reading could not be loaded. Check your connection and try again.')); }; document.head.append(s); }
    });
  };
  S.chapterText = function (n) { return S.loadRead('p' + CH[n].part).then(function (d) { var c = d.ch[n]; return CH[n].secs.map(function (s) { return '§' + s.id + ' ' + s.t + '\n' + E.plain(c.secs[s.id]); }).join('\n\n'); }); };

  /* ---------- Mountain ---------- */
  var LAY = null;
  function layout() {
    if (LAY) return LAY;
    var W = 360, RH = 88, rows = [{ t: 'start' }], lvl = {}, anc = {};
    CUR.chapters.forEach(function (c) {
      var inp = c.builds.filter(function (m) { return CH[m].part === c.part; });
      lvl[c.n] = inp.length ? 1 + Math.max.apply(null, inp.map(function (m) { return lvl[m]; })) : 0;
      anc[c.n] = {}; inp.forEach(function (m) { anc[c.n][m] = 1; Object.keys(anc[m]).forEach(function (k) { anc[c.n][k] = 1; }); });
    });
    CUR.parts.forEach(function (p) {
      var mx = Math.max.apply(null, p.ch.map(function (n) { return lvl[n]; }));
      for (var L = 0; L <= mx; L++) rows.push({ t: 'ch', ns: p.ch.filter(function (n) { return lvl[n] === L; }), p: p.n });
      rows.push({ t: 'camp', p: p.n });
    });
    var H = rows.length * RH + 30, nodes = {}, camps = {}, POS = { 2: [0.27, 0.73], 3: [0.17, 0.5, 0.83], 4: [0.13, 0.375, 0.625, 0.87] }, zig = 0;
    rows.forEach(function (r, i) {
      r.y = H - 56 - i * RH;
      if (r.t === 'ch') { if (r.ns.length === 1) { nodes[r.ns[0]] = { x: W * (zig++ % 2 ? 0.68 : 0.32), y: r.y }; } else r.ns.forEach(function (n, k) { nodes[n] = { x: W * POS[r.ns.length][k], y: r.y }; }); }
      else if (r.t === 'camp') camps[r.p] = { x: W / 2, y: r.y };
      else camps[0] = { x: W / 2, y: r.y };
    });
    var edges = [];
    CUR.chapters.forEach(function (c) {
      var inp = c.builds.filter(function (m) { return CH[m].part === c.part; });
      var red = inp.filter(function (m) { return !inp.some(function (m2) { return m2 !== m && anc[m2][m]; }); });
      if (!red.length) edges.push({ a: camps[c.part - 1], b: nodes[c.n], to: c.n });
      red.forEach(function (m) { edges.push({ a: nodes[m], b: nodes[c.n], from: m, to: c.n }); });
      var hasDep = CUR.chapters.some(function (d) { return d.part === c.part && d.builds.indexOf(c.n) >= 0; });
      if (!hasDep) edges.push({ a: nodes[c.n], b: camps[c.part], from: c.n, camp: c.part });
    });
    return (LAY = { W: W, H: H, nodes: nodes, camps: camps, edges: edges });
  }
  function cairn(x, y, eroded) {
    return eroded
      ? '<g class="stone-g"><rect class="stone" x="' + (x - 7) + '" y="' + (y + 2) + '" width="13" height="5" rx="2.5" transform="rotate(-9 ' + x + ' ' + y + ')"/><rect class="stone" x="' + (x - 3) + '" y="' + (y - 4) + '" width="9" height="4.5" rx="2.2" transform="rotate(14 ' + x + ' ' + y + ')"/><circle class="stone" cx="' + (x + 9) + '" cy="' + (y + 6) + '" r="2"/><circle class="stone" cx="' + (x - 9) + '" cy="' + (y + 7) + '" r="1.5"/></g>'
      : '<g class="stone-g"><rect class="stone" x="' + (x - 7) + '" y="' + (y + 2) + '" width="14" height="5" rx="2.5"/><rect class="stone" x="' + (x - 5) + '" y="' + (y - 3.5) + '" width="10" height="4.5" rx="2.2"/><rect class="stone" x="' + (x - 3) + '" y="' + (y - 8.5) + '" width="6" height="4" rx="2"/></g>';
  }
  function lockGlyph(x, y) { return '<g fill="none" stroke="#6d7f88" stroke-width="1.6"><rect x="' + (x - 5) + '" y="' + (y - 1) + '" width="10" height="8" rx="2" fill="#151e24"/><path d="M' + (x - 3) + ' ' + (y - 1) + 'v-3a3 3 0 016 0v3"/></g>'; }
  function campState(p) { return p === 0 ? 'passed' : E.bossPassed(p) ? 'passed' : E.bossReady(p) ? 'ready' : ''; }
  S.view('mountain', function () {
    var L = layout(), s = '', next = E.next(), due = E.due();
    L.edges.forEach(function (e) {
      var tgtDone = e.camp ? E.bossPassed(e.camp) : E.mastered(e.to), srcDone = e.from ? E.mastered(e.from) : true;
      var tgtOpen = e.camp ? E.bossReady(e.camp) : E.unlocked(e.to);
      var cls = tgtDone && srcDone ? 'done' : (tgtOpen && srcDone ? 'open' : '');
      var my = (e.a.y + e.b.y) / 2;
      s += '<path class="trail ' + cls + '" d="M' + e.a.x + ' ' + e.a.y + 'C' + e.a.x + ' ' + my + ',' + e.b.x + ' ' + my + ',' + e.b.x + ' ' + e.b.y + '"/>';
    });
    var c0 = L.camps[0];
    s += '<g class="camp passed"><rect x="' + (c0.x - 76) + '" y="' + (c0.y - 17) + '" width="152" height="34" rx="17"/><text class="c" x="' + c0.x + '" y="' + (c0.y + 5.5) + '" text-anchor="middle">Trailhead</text></g>';
    CUR.parts.forEach(function (p) {
      var c = L.camps[p.n], st = campState(p.n), done = p.ch.filter(E.mastered).length;
      s += '<g class="camp ' + st + '" data-camp="' + p.n + '" style="cursor:pointer" role="button" tabindex="0" aria-label="' + p.camp + ' Boss Exam"><rect x="' + (c.x - 128) + '" y="' + (c.y - 25) + '" width="256" height="50" rx="12"/>' +
        '<path d="M' + (c.x - 108) + ' ' + (c.y + 10) + 'l12-20 12 20zM' + (c.x - 96) + ' ' + (c.y + 10) + 'v-7" fill="none" stroke="' + (st === 'passed' ? '#8fcf7a' : st === 'ready' ? '#ff8a5c' : '#6d7f88') + '" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<text class="c" x="' + (c.x - 74) + '" y="' + (c.y - 2) + '">' + S.esc(p.camp) + '</text><text class="s" x="' + (c.x - 74) + '" y="' + (c.y + 14) + '">' + (st === 'passed' ? 'Boss Exam passed' : st === 'ready' ? 'Boss Exam ready' : 'Part ' + p.roman + ' · ' + done + '/' + p.ch.length + ' mastered') + '</text></g>';
    });
    CUR.chapters.forEach(function (c) {
      var n = L.nodes[c.n], st = E.status(c.n);
      s += '<g class="node ' + st + '" data-n="' + c.n + '" role="button" tabindex="0" aria-label="Chapter ' + c.n + ', ' + S.esc(E.short(c.n)) + ', ' + st + '">' +
        (c.n === next ? '<circle class="halo" cx="' + n.x + '" cy="' + n.y + '" r="29"/>' : '') +
        '<circle class="b" cx="' + n.x + '" cy="' + n.y + '" r="22"/><text class="n" x="' + n.x + '" y="' + n.y + '">' + c.n + '</text>' +
        (st === 'done' || st === 'eroded' ? cairn(n.x + 21, n.y - 19, st === 'eroded') : st === 'locked' ? lockGlyph(n.x + 19, n.y - 20) : '') +
        '<text class="l" x="' + n.x + '" y="' + (n.y + 36) + '">' + S.esc(S.LBL[c.n]) + '</text></g>';
    });
    var svg = h('div', { class: 'mtn', html: '<svg viewBox="0 0 ' + L.W + ' ' + L.H + '" style="max-width:560px;margin:0 auto" role="img" aria-label="Trail map of all 54 chapters, summit at the top">' + s + '</svg>' });
    var act = function (t) { var g = t.closest ? t.closest('[data-n],[data-camp]') : null; if (!g) return; if (g.dataset.n) S.go('ch-' + g.dataset.n); else campSheet(+g.dataset.camp); };
    svg.addEventListener('click', function (e) { act(e.target); });
    svg.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(e.target); } });
    var target = next || (due.length ? due[0] : 0);
    S.afterRender = function (main) { if (S.keepMapScroll) { S.keepMapScroll = false; return; } var el = target ? main.querySelector('[data-n="' + target + '"]') : null; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); else main.scrollTop = main.scrollHeight; };
    var m = E.masteredCount();
    return h('div', { class: 'col gap14' },
      h('div', { class: 'row wrap' }, h('div', { class: 'grow' }, h('h2', null, 'The Mountain'), h('p', { class: 'small muted' }, m + ' of 54 waypoints mastered · summit at the top, you climb from the bottom')),
        due.length ? h('button', { class: 'btn sm', onclick: function () { E.start('review', due[0]); } }, S.plural(due.length, 'cairn') + ' crumbling') : null),
      h('div', { class: 'row wrap' }, h('span', { class: 'pill glow' }, 'Open'), h('span', { class: 'pill ok' }, 'Mastered'), h('span', { class: 'pill warn' }, 'Crumbling'), h('span', { class: 'pill' }, 'Locked')),
      svg);
  }, { tab: 'mountain' });
  function campSheet(p) {
    var P = S.PART[p], ready = E.bossReady(p), passed = E.bossPassed(p), b = S.state.boss[p] || {}, left = P.ch.filter(function (n) { return !E.mastered(n); });
    var nq = P.ch.length * 2;
    S.sheet(h('div', { class: 'col gap14' },
      h('div', null, h('div', { class: 'eyebrow' }, 'Part ' + P.roman + ' · ' + P.short), h('h2', null, P.camp + ' Boss Exam')),
      h('p', { class: 'small' }, 'A mixed exam across Chapters ' + P.ch[0] + '–' + P.ch[P.ch.length - 1] + ': ' + nq + ' questions with fresh numbers, pass at 80%. ' + (p < 6 ? 'Passing plants your flag here and opens the trail two Parts up (Part ' + (S.PART[p + 2] ? S.PART[p + 2].roman : '—') + ').' : 'Passing this one is the summit.')),
      passed ? h('span', { class: 'pill ok' }, 'Passed ' + S.ago(b.at) + ' · best ' + S.pct(b.best)) : null,
      !ready ? S.lockBox('Master ' + E.list(left.slice(0, 8).map(function (n) { return 'Ch ' + n; })) + (left.length > 8 ? ' and ' + (left.length - 8) + ' more' : '') + ' first. Every chapter in the Part must be mastered before its Boss Exam.') : null,
      ready ? h('button', { class: 'btn go block', onclick: function () { S.closeSheet(true); E.start('boss', p); } }, passed ? 'Retake for practice' : 'Start the Boss Exam') : null,
      b.tries && !passed ? h('p', { class: 'tiny muted' }, S.plural(b.tries, 'attempt') + ' · best ' + S.pct(b.best)) : null));
  }
  S.campSheet = campSheet;

  /* ---------- Chapter page ---------- */
  function readTarget(n) { var r = E.peek(n).read, s = CH[n].secs, i = 0; while (i < s.length && r[s[i].id]) i++; return s[Math.min(i, s.length - 1)].id; }
  S.readHash = function (id) { return 'read-' + id.replace('.', '-'); };
  S.view('ch-', function (arg) {
    var n = +arg, c = CH[n]; if (!c) return h('p', null, 'No such chapter.');
    var st = E.status(n), r = E.peek(n), P = S.PART[c.part], out = [];
    out.push(h('div', { class: 'row' }, backBtn('Mountain', 'mountain'), h('span', { class: 'grow' }), pillFor(st)));
    out.push(h('div', null, h('div', { class: 'eyebrow' }, 'Chapter ' + n + ' · Part ' + P.roman + ' · ' + P.camp), h('h1', { class: c.t.length > 34 ? 'long' : '', style: 'margin-top:6px' }, c.t)));
    var nRead = E.readCount(n), secLine = E.secRange(n) + ' · ' + E.pages(n) + ' in your doc';
    if (st === 'locked') {
      var route = E.route(n);
      out.push(h('div', { class: 'card lock' }, S.lockBox(E.lockText(n)),
        route.length ? h('div', { class: 'col' }, h('div', { class: 'eyebrow' }, 'Open now on this route'), h('div', { class: 'row wrap' }, route.slice(0, 6).map(function (m) { return h('button', { class: 'btn sm ice', onclick: function () { S.go('ch-' + m); } }, 'Ch ' + m + ' ' + S.LBL[m]); }))) : null,
        E.gate(n) && !E.missing(n).length ? h('button', { class: 'btn sm', onclick: function () { campSheet(E.gate(n)); } }, S.PART[E.gate(n)].camp + ' Boss Exam') : null));
      out.push(h('div', { class: 'card' }, h('h3', null, 'Preview the reading'), h('p', { class: 'small muted' }, secLine + '. Reading ahead is allowed, but it earns no XP and the quiz stays locked.'), h('button', { class: 'btn', onclick: function () { S.go(S.readHash(c.secs[0].id)); } }, 'Preview Chapter ' + n)));
    } else {
      var er = E.erodedPrereqs({ ch: c.builds });
      if (er.length && st === 'open') out.push(h('div', { class: 'card warn' }, h('h3', null, 'Prerequisite eroding'), h('p', { class: 'small' }, E.list(er.map(function (m) { return 'Ch ' + m + ' (' + S.LBL[m] + ') is at ' + S.pct(E.integrity(m)); })) + '. This chapter stays open, but refresh before you lean on it.'), h('button', { class: 'btn sm', onclick: function () { E.start('review', er[0]); } }, 'Refresh Ch ' + er[0] + ' · 4 questions')));
      if (st === 'done' || st === 'eroded') {
        var ig = E.integrity(n), dueT = E.dueAt(n);
        out.push(h('div', { class: 'card ' + (st === 'eroded' ? 'warn' : '') }, h('div', { class: 'row' }, h('h3', { class: 'grow' }, st === 'eroded' ? 'Cairn crumbling' : 'Cairn standing'), h('span', { class: 'big', style: 'font-size:30px' }, S.pct(ig))),
          h('div', { class: 'bar ' + (st === 'eroded' ? 'amber' : 'moss') }, h('i', { style: 'width:' + Math.round(ig * 100) + '%' })),
          h('p', { class: 'small muted' }, 'Predicted recall. Below 80% the cairn crumbles and dependent content warns you. ' + (st === 'eroded' ? 'A review was due ' + S.ago(dueT) + '.' : 'Next review in about ' + Math.max(1, Math.round((dueT - Date.now()) / 864e5)) + ' days.') + (S.state.miss[n] ? ' Later quizzes sent you back here ' + S.plural(S.state.miss[n], 'time') + '.' : '')),
          h('button', { class: 'btn ' + (st === 'eroded' ? 'go' : ''), onclick: function () { E.start('review', n); } }, 'Review now · 4 fresh questions')));
      }
      out.push(h('div', { class: 'card ' + (st === 'open' ? 'hero' : '') }, h('div', { class: 'eyebrow' }, st === 'open' ? 'Start here: read first' : 'The reading'), h('h3', null, secLine),
        h('p', { class: 'small muted' }, nRead + ' of ' + c.secs.length + ' sections read · about ' + E.readMins(n, true) + ' min ' + (nRead ? 'left' : 'of reading')),
        h('div', { class: 'bar ice' }, h('i', { style: 'width:' + Math.round(nRead / c.secs.length * 100) + '%' })),
        h('button', { class: 'btn ' + (st === 'open' && nRead < c.secs.length ? 'go' : ''), onclick: function () { S.go(S.readHash(readTarget(n))); } }, nRead === 0 ? 'Start: read §' + c.secs[0].id + ' (p. ' + c.secs[0].page + ')' : nRead < c.secs.length ? 'Continue at §' + readTarget(n) : 'Re-read the chapter'),
        h('details', null, h('summary', { class: 'small muted', style: 'cursor:pointer' }, 'Sections and pages'), h('div', { class: 'list', style: 'margin-top:6px' }, c.secs.map(function (s) {
          return h('button', { class: 'item' + (r.read[s.id] ? ' done' : ''), style: 'padding:9px 2px', onclick: function () { S.go(S.readHash(s.id)); } }, h('span', { class: 'ic', style: 'width:auto;padding:0 8px;font-size:12.5px' }, '§' + s.id), h('span', { class: 'grow' }, h('span', { class: 'ttl small' }, s.t), s.flag ? h('span', { class: 'tiny', style: 'color:#f0a04b' }, ' · safety flag') : null), h('span', { class: 'tiny muted num' }, 'p. ' + s.page));
        })))));
      var t = E.rec, a = E.autoQ(n);
      out.push(h('div', { class: 'card' }, h('div', { class: 'row' }, h('h3', { class: 'grow' }, 'Quiz ' + n), r.tries ? h('span', { class: 'pill' }, 'Best ' + S.pct(r.best) + ' · ' + S.plural(r.tries, 'try')) : null),
        h('p', { class: 'small muted' }, c.quiz.length + ' questions (p. ' + c.quizPage + '), closed book. Mastery needs ≥80% and a correct explanation of every miss. ' + a + ' of them are number-checked on the spot; written answers are graded ' + (S.ai.on() ? 'by Claude' : 'by you against Appendix J') + '.' + (r.tries ? ' Retakes use fresh numbers and fresh written questions.' : '')),
        h('button', { class: 'btn ' + (st === 'open' && nRead >= c.secs.length ? 'go' : ''), onclick: function () { E.start('quiz', n); } }, st === 'open' ? (r.tries ? 'Retake Quiz ' + n : 'Take Quiz ' + n) : 'Take it again for practice'),
        st === 'open' && r.tries && S.ai.on() ? freshBtn(n) : null));
      if (st === 'open') {
        var wait = E.chalWait(n);
        out.push(h('div', { class: 'card' }, h('h3', null, 'Challenge exam'), h('p', { class: 'small muted' }, 'Already know this? Ten mixed questions with fresh numbers. Score ≥90% and the chapter is mastered without the reading.'),
          wait ? h('p', { class: 'small', style: 'color:var(--amber)' }, 'Last attempt fell short. Next challenge in ' + Math.ceil(wait / 36e5) + ' h; the regular quiz is open now.') : h('button', { class: 'btn ice', onclick: function () { E.start('challenge', n); } }, 'Test out of Chapter ' + n)));
      }
    }
    out.push(h('div', { class: 'card' }, h('h3', null, 'Goals'), S.rich('p', 'small', c.goals)));
    var deps = E.dependents(n), mods = S.MODREQ.filter(function (m) { return (m.req.ch || []).indexOf(n) >= 0; });
    out.push(h('div', { class: 'card' }, h('h3', null, 'Builds on'),
      c.builds.length ? h('div', { class: 'row wrap' }, (c.builds.length > 14 ? c.builds.slice(-14) : c.builds).map(function (m) { var ms = E.status(m); return h('button', { class: 'pill ' + (ms === 'done' ? 'ok' : ms === 'eroded' ? 'warn' : ms === 'open' ? 'glow' : ''), style: 'cursor:pointer;background:none', onclick: function () { S.go('ch-' + m); } }, 'Ch ' + m + ' ' + S.LBL[m]); }), c.builds.length > 14 ? h('span', { class: 'tiny muted' }, 'and every earlier chapter') : null) : h('p', { class: 'small muted' }, 'Nothing. This is a trailhead chapter.'),
      deps.length || mods.length ? h('h3', { style: 'margin-top:8px' }, 'Opens the way to') : null,
      deps.length ? h('div', { class: 'row wrap' }, deps.map(function (m) { return h('button', { class: 'pill', style: 'cursor:pointer;background:none', onclick: function () { S.go('ch-' + m); } }, 'Ch ' + m + ' ' + S.LBL[m]); })) : null,
      mods.length ? h('div', { class: 'row wrap' }, mods.map(function (m) { return h('button', { class: 'pill ice', style: 'cursor:pointer;background:none', onclick: function () { S.go(m.go); } }, m.name); })) : null));
    if (st === 'open') out.push(h('button', { class: 'btn ghost sm', onclick: function () { S.state.prefs.focus = S.state.prefs.focus === n ? 0 : n; S.state.plan = null; S.dirty('main'); S.render(true); } }, S.state.prefs.focus === n ? 'Focus chapter for Today’s Expedition ✓' : 'Make this my focus chapter'));
    return h('div', { class: 'col gap14' }, out);
  }, { tab: 'mountain' });
  E.autoQ = function (n) { var b = window.BANK[n] || { t: {}, s: {} }; return CH[n].quiz.filter(function (q) { return b.s[q.n] || (b.t[q.n] && !b.t[q.n].vo); }).length; };
  function freshBtn(n) {
    var have = (S.state.aiq[n] || []).filter(function (a) { return !a.used; }).length, note = h('span', { class: 'tiny muted' }, have ? have + ' fresh written questions ready' : '');
    var btn = h('button', { class: 'btn sm ghost', onclick: async function () {
      btn.disabled = true; btn.replaceChildren(h('span', { class: 'spin' }), 'Claude is writing questions…');
      try { var txt = await S.chapterText(n); var k = await E.aiFresh(n, txt); S.toast(k + ' fresh written questions added for Quiz ' + n + '.'); S.render(true); }
      catch (e) { S.toast(e && e.code ? S.ai.why(e) : String(e.message || e)); btn.disabled = false; btn.textContent = 'Have Claude write fresh written questions'; }
    } }, 'Have Claude write fresh written questions');
    return h('div', { class: 'col gap4' }, btn, note);
  }

  /* ---------- Reader ---------- */
  S.view('read-', function (arg) {
    var id = arg.replace('-', '.'), n = +id.split('.')[0], c = CH[n]; if (!c) return h('p', null, 'No such section.');
    var idx = Math.max(0, c.secs.map(function (s) { return s.id; }).indexOf(id)), sec = c.secs[idx], body = h('div', { class: 'doc', 'data-ask': '1' }, h('div', { class: 'row' }, h('span', { class: 'spin' }), 'Loading §' + sec.id + '…'));
    var canMark = E.unlocked(n) || E.mastered(n) || S.MODREQ.some(function (m) { return (m.req.read || []).indexOf(sec.id) >= 0 && !E.reqMissing(m.req).length; });
    var isRead = !!E.peek(n).read[sec.id], prev = c.secs[idx - 1], next = c.secs[idx + 1];
    S.loadRead('p' + c.part).then(function (d) {
      var html = (idx === 0 && d.ch[n].intro ? d.ch[n].intro : '') + d.ch[n].secs[sec.id];
      body.innerHTML = html; S.math(body);
    }).catch(function (e) { body.replaceChildren(h('div', { class: 'card warn' }, h('p', null, e.message), h('button', { class: 'btn', onclick: function () { S.render(); } }, 'Try again'))); });
    var goSec = function (s) { S.go(S.readHash(s.id)); };
    var foot = h('div', { class: 'col' });
    var fill = function () {
      isRead = !!E.peek(n).read[sec.id];
      S.put(foot,
        canMark && !isRead ? h('button', { class: 'btn go block', onclick: function () { E.markRead(n, sec.id); S.doneToday('read' + n); S.dirty('log'); if (next) goSec(next); else S.go('ch-' + n); } }, next ? 'Mark §' + sec.id + ' read · on to §' + next.id : 'Mark §' + sec.id + ' read · chapter finished') : null,
        !canMark ? h('p', { class: 'tiny muted' }, 'Preview only: Chapter ' + n + ' is locked, so this reading does not count yet.') : null,
        h('div', { class: 'grid2' }, prev ? h('button', { class: 'btn', onclick: function () { goSec(prev); } }, '‹ §' + prev.id) : h('span'), next ? h('button', { class: 'btn', onclick: function () { goSec(next); } }, '§' + next.id + ' ›') : h('button', { class: 'btn ' + (isRead && E.status(n) === 'open' ? 'go' : ''), onclick: function () { S.go('ch-' + n); } }, E.status(n) === 'open' ? 'To Quiz ' + n + ' ›' : 'Chapter ' + n + ' ›')));
    };
    fill();
    return h('div', { class: 'col gap14' },
      h('div', { class: 'secnav' }, backBtn('Ch ' + n, 'ch-' + n), h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Section ' + (idx + 1) + ' of ' + c.secs.length + ' · p. ' + sec.page + (sec.flag ? ' · safety flag' : '')), h('div', { style: 'font-weight:600;line-height:1.2' }, '§' + sec.id + ' ' + sec.t)), isRead ? h('span', { class: 'pill ok' }, 'Read') : null),
      body, S.askHint ? S.askHint() : null, S.unpackBlock ? S.unpackBlock(n, sec, body) : null, foot);
  }, { tab: 'mountain', track: 'read' });
  S.view('ap-', function (arg) {
    var body = h('div', { class: 'doc', 'data-ask': '1' }, h('div', { class: 'row' }, h('span', { class: 'spin' }), 'Loading…')), title = arg === 'pre' ? 'Preface: How to Use This Document' : 'Appendix ' + arg, A = CUR.appendices.filter(function (a) { return a.id === arg; })[0];
    S.loadRead('ax').then(function (d) {
      var secs = arg === 'pre' ? d.pre.map(function (s) { return { t: s.t === title ? '' : s.t, html: s.html }; }) : d.ap[arg];
      body.innerHTML = (secs || []).map(function (s) { return (s.t ? '<h3>' + (s.id ? s.id + ' ' : '') + S.esc(s.t) + '</h3>' : '') + s.html; }).join('');
      S.math(body);
    }).catch(function (e) { body.textContent = e.message; });
    return h('div', { class: 'col gap14' }, h('div', { class: 'row' }, backBtn('Pack', 'pack')), h('div', null, h('div', { class: 'eyebrow' }, A ? 'Appendix ' + A.id + ' · p. ' + A.page : 'From your doc'), h('h2', null, A ? A.t : title)), body);
  }, { tab: 'pack', track: 'read' });

  /* ---------- Quiz / exam session ---------- */
  function tagPill(it, q) { return h('span', { class: 'pill ' + (it.tag === 'I' ? 'ice' : '') }, TAGNAME[it.tag] + (it.tag === 'I' && it.refs.length ? ' · Ch ' + it.refs.join(', ') : '') + (q.kind === 'boss' ? ' · from Ch ' + it.ch : '')); }
  function answered(it) { return it.f ? it.ans.f.some(function (x) { return String(x).trim(); }) : !!(it.ans.t || '').trim(); }
  function numField(it, i, uid) {
    var f = it.f[i], id = 'nf' + uid + '_' + i;
    var inp = h('input', { type: 'text', inputmode: 'decimal', id: id, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'next', value: it.ans.f[i], placeholder: 'number', oninput: function () { it.ans.f[i] = inp.value; }, onchange: function () { S.dirty('main'); } });
    var set = function (v) { inp.value = v; it.ans.f[i] = v; inp.focus(); S.dirty('main'); };
    var lab = S.rich('label', '', S.tex(f.l)); lab.setAttribute('for', id);
    return h('div', { class: 'fld' }, lab, h('div', { class: 'inrow' }, inp,
      h('button', { class: 'k', type: 'button', title: 'Change sign', 'aria-label': 'Change sign', onclick: function () { var v = inp.value.trim(); set(v[0] === '-' || v[0] === '−' ? v.slice(1) : '-' + v); } }, '±'),
      h('button', { class: 'k', type: 'button', title: 'Power of ten: 1.2e5 means 1.2 × 10⁵', 'aria-label': 'Insert power of ten', onclick: function () { if (!/e/i.test(inp.value)) set(inp.value + 'e'); } }, 'E'),
      f.u ? h('span', { class: 'unit' }, f.u) : null));
  }
  S.numField = numField;
  function answerView(q) {
    var it = q.items[q.i], meta = E.META[q.kind], last = q.i === q.items.length - 1, nAns = q.items.filter(answered).length;
    var go = function (i) { S.dirty('main'); q.i = i; S.render(); };
    var body = it.f ? h('div', { class: 'col' }, it.f.map(function (f, i) { return numField(it, i, q.i); }), h('p', { class: 'tiny muted' }, 'Type each value in the unit shown. E enters a power of ten (2.5e-4). A small rounding difference still counts.'))
      : (function () { var ta = h('textarea', { id: 'wr' + q.i, placeholder: 'Write your answer as you would explain it to another engineer.', 'aria-label': 'Your answer', oninput: function () { it.ans.t = ta.value; }, onchange: function () { S.dirty('main'); } }); ta.value = it.ans.t || ''; return h('div', { class: 'col' }, ta, h('p', { class: 'tiny muted' }, S.ai.on() ? 'Claude grades this against the answer key when you submit.' : 'You will check this yourself against the answer key.')); })();
    return h('div', { class: 'col gap14' },
      h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Closed book · pass at ' + S.pct(meta.pass)), h('h2', null, E.title(q))), h('button', { class: 'btn sm ghost', onclick: function () { S.ask('Leave this session?', 'Your answers so far are saved. You can resume from Today.', [{ label: 'Keep going', cls: 'go' }, { label: 'Save and leave', fn: function () { S.dirty('main'); S.go(q.ch ? 'ch-' + q.ch : 'mountain'); } }, { label: 'Discard this session', cls: 'danger', fn: function () { S.state.quiz = null; S.dirty('main'); S.go(q.ch ? 'ch-' + q.ch : 'mountain'); } }]); } }, 'Leave')),
      h('div', { class: 'qnav' }, q.items.map(function (x, i) { return h('button', { class: (i === q.i ? 'cur ' : '') + (answered(x) ? 'ans' : ''), 'aria-label': 'Question ' + (i + 1), onclick: function () { go(i); } }, String(i + 1)); })),
      h('div', { class: 'qcard' }, h('div', { class: 'row' }, h('span', { class: 'eyebrow grow' }, 'Question ' + (q.i + 1) + ' of ' + q.items.length), tagPill(it, q)), S.rich('div', 'qtext', it.q), body),
      h('div', { class: 'grid2' }, h('button', { class: 'btn', disabled: q.i === 0, onclick: function () { go(q.i - 1); } }, '‹ Back'),
        last ? h('button', { class: 'btn go', onclick: function () { submit(q); } }, 'Submit ' + nAns + '/' + q.items.length) : h('button', { class: 'btn go', onclick: function () { go(q.i + 1); } }, 'Next ›')),
      !last && nAns >= q.items.length - 1 ? h('button', { class: 'btn ghost sm', onclick: function () { submit(q); } }, 'Submit now') : null);
  }
  function submit(q) {
    var blank = q.items.filter(function (it) { return !answered(it); }).length;
    var run = function () {
      q.items.forEach(function (it) { if (it.f) E.gradeAuto(it); else if (!(it.ans.t || '').trim()) it.res = { credit: 0, by: 'auto', fb: 'No answer given.' }; });
      var todo = q.items.filter(function (it) { return !it.res; });
      if (!todo.length) { E.finish(q); S.render(); return; }
      q.phase = 'self'; S.dirty('main');
      if (S.ai.on()) aiGradeFlow(q, todo); else S.render();
    };
    if (blank) S.ask(S.plural(blank, 'question') + ' unanswered', 'Blank answers score zero.', [{ label: 'Go back and answer', cls: 'go' }, { label: 'Submit anyway', fn: run }]); else run();
  }
  var ctl = null;
  function aiGradeFlow(q, todo) {
    ctl = new AbortController();
    S.render();
    S.sheet(h('div', { class: 'col gap14' }, h('div', { class: 'row' }, h('span', { class: 'spin' }), h('h3', null, 'Claude is grading ' + S.plural(todo.length, 'written answer'))), h('p', { class: 'small muted' }, 'Usually 10–40 seconds. The first time, Claude asks your permission to run inside this page; it uses your own Claude usage.'), h('button', { class: 'btn', onclick: function () { if (ctl) ctl.abort(); } }, 'Stop and grade them myself')), function () { if (ctl) ctl.abort(); });
    E.aiGrade(todo, ctl.signal).then(function (all) {
      ctl = null; S.closeSheet(true);
      if (all) { E.finish(q); } else S.toast('Claude skipped an item. Check the rest yourself.');
      S.render();
    }).catch(function (e) { ctl = null; S.closeSheet(true); if (!e || e.code !== 'cancelled') S.toast(S.ai.why(e)); S.render(); });
  }
  function yourAnswer(it) {
    if (!it.f) return h('div', { class: 'fb' }, h('span', { class: 'eyebrow' }, 'Your answer'), h('div', { style: 'white-space:pre-wrap;margin-top:4px' }, (it.ans.t || '').trim() || '(blank)'));
    return h('div', { class: 'col gap4' }, it.f.map(function (f, i) {
      var ok = it.res && it.res.ok ? it.res.ok[i] : false;
      return S.rich('div', 'fb ' + (ok ? 'ok' : 'bad'), '<span class="num">' + S.tex(f.l) + ': <strong>' + S.esc(String(it.ans.f[i]).trim() || '—') + '</strong> ' + S.esc(f.u) + (ok ? ' ✓' : ' ✗ &nbsp;correct: <strong>' + E.showNum(f.v) + '</strong> ' + S.esc(f.u)) + '</span>');
    }));
  }
  function selfView(q) {
    var todo = q.items.filter(function (it) { return !it.res; });
    if (!todo.length) { E.finish(q); return resultsView(q); }
    return h('div', { class: 'col gap14' }, h('div', null, h('div', { class: 'eyebrow' }, E.title(q)), h('h2', null, 'Check your written answers'), h('p', { class: 'small muted' }, 'Compare each answer with the key from Appendix J and mark it honestly. The numerical questions are already scored.')),
      S.ai.on() ? h('button', { class: 'btn ice', onclick: function () { aiGradeFlow(q, todo); } }, 'Have Claude grade these instead') : null,
      todo.map(function (it) {
        var mark = function (c) { it.res = { credit: c, by: 'self' }; S.dirty('main'); S.render(true); };
        return h('div', { class: 'qcard' }, h('div', { class: 'row' }, h('span', { class: 'eyebrow grow' }, 'Question ' + (q.items.indexOf(it) + 1)), tagPill(it, q)), S.rich('div', 'qtext', it.q), yourAnswer(it), S.rich('div', 'keyans', '<span class="eyebrow">Answer key</span>' + it.key),
          h('div', { class: 'seg' }, h('button', { onclick: function () { mark(1); } }, 'Right'), h('button', { onclick: function () { mark(0.5); } }, 'Partly'), h('button', { onclick: function () { mark(0); } }, 'Wrong')));
      }));
  }
  function verdict(q) {
    var sc = S.pct(q.score), miss = E.missed(q).length, allEx = E.missed(q).every(function (it) { return it.ex && it.ex.ok; });
    if (q.kind === 'quiz') {
      if (E.mastered(q.ch) && q.pass) return ['Chapter ' + q.ch + ' mastered', miss ? 'Every miss explained. A cairn now stands at this waypoint.' : 'A clean pass. A cairn now stands at this waypoint.', 'ok'];
      if (q.pass) return ['Passed at ' + sc + ': now explain your misses', 'The doc’s rule: you move on only when you can explain each missed item. ' + S.plural(miss, 'explanation') + ' to go.', 'glow'];
      return ['Not yet: ' + sc, 'Mastery needs 80%. Go back to the sections behind your misses, then retake with fresh numbers and fresh written questions.', 'bad'];
    }
    if (q.kind === 'challenge') return q.pass ? ['Tested out of Chapter ' + q.ch, 'Scored ' + sc + '. The chapter is mastered without the reading.', 'ok'] : ['Challenge missed: ' + sc, 'Testing out needs 90%. Study the chapter and take the regular quiz, or challenge again in 12 hours.', 'bad'];
    if (q.kind === 'review') return q.pass ? ['Cairn rebuilt', 'Chapter ' + q.ch + ' is back to full integrity. Next review in about ' + E.peek(q.ch).ivl + ' days.', 'ok'] : ['Still crumbling: ' + sc, 'A review passes at 75%. Re-read the sections you missed and try again; the chapter stays unlocked.', 'bad'];
    return q.pass ? [S.PART[q.part].camp + ' Boss Exam passed', 'Scored ' + sc + (q.part < 6 ? '. Your flag is planted and the trail above opens.' : '. You are standing on the summit.'), 'ok'] : ['Boss Exam missed: ' + sc, 'It passes at 80%. The chapters listed below cost you the most.', 'bad'];
  }
  function resultsView(q) {
    var v = verdict(q), missed = E.missed(q), right = q.items.filter(function (it) { return it.res && it.res.credit >= 1; }), meta = E.META[q.kind];
    var needEx = missed.filter(function (it) { return !(it.ex && it.ex.ok); });
    var close = function (hash) { S.state.quiz = null; S.dirty('main'); S.go(hash); };
    var out = [];
    out.push(h('div', { class: 'card ' + (v[2] === 'ok' ? 'hero' : v[2] === 'bad' ? 'warn' : '') }, h('div', { class: 'eyebrow' }, E.title(q) + ' · ' + q.items.length + ' questions'), h('div', { class: 'row' }, h('span', { class: 'big' }, S.pct(q.score)), h('div', { class: 'grow' }, h('h3', null, v[0]), h('p', { class: 'small', style: 'margin-top:4px' }, v[1]))),
      h('div', { class: 'meter' }, h('i', { style: 'width:' + Math.round(q.score * 100) + '%' }), h('u', { style: 'left:' + Math.round(meta.pass * 100) + '%', title: 'Pass mark' })),
      h('div', { class: 'qnav' }, q.items.map(function (it, i) { var c = it.res ? it.res.credit : 0; return h('button', { class: c >= 1 ? 'ok' : c > 0 ? 'part' : 'bad', 'aria-label': 'Question ' + (i + 1), onclick: function () { var el = document.getElementById('qi' + i); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }, String(i + 1)); }))));
    if (q.back && q.back.length) out.push(h('div', { class: 'card warn' }, h('h3', null, q.kind === 'boss' ? 'Chapters to revisit' : 'Go back to ' + E.list(q.back.map(function (n) { return 'Chapter ' + n; }))), h('p', { class: 'small' }, q.kind === 'boss' ? 'These chapters cost you points.' : 'You missed an integrative question that leans on ' + (q.back.length > 1 ? 'these chapters' : 'this chapter') + '. The doc’s rule: a wrong integrative answer sends you back.' + (q.back.some(E.eroded) ? ' Its cairn is now marked as crumbling.' : '')),
      h('div', { class: 'row wrap' }, q.back.slice(0, 8).map(function (n) { return h('button', { class: 'btn sm', onclick: function () { S.go('ch-' + n); } }, 'Ch ' + n + ' ' + S.LBL[n]); }))));
    if (missed.length) {
      out.push(h('h3', null, needEx.length ? 'Explain each miss' : 'Your misses, explained'));
      missed.forEach(function (it) {
        var i = q.items.indexOf(it), c = it.res ? it.res.credit : 0, ex = it.ex || (it.ex = { t: '', ok: false });
        var ta = h('textarea', { id: 'ex' + i, placeholder: 'In your own words: what went wrong, and what is the correct idea or method?', 'aria-label': 'Explain this miss', oninput: function () { ex.t = ta.value; selfBtn.disabled = ta.value.trim().length < 30; }, onchange: function () { S.dirty('main'); } }); ta.value = ex.t || '';
        var selfBtn = h('button', { class: 'btn sm', disabled: (ex.t || '').trim().length < 30, onclick: function () { ex.ok = true; ex.by = 'self'; E.explained(q); S.render(true); } }, 'I can explain this now');
        out.push(h('div', { class: 'qcard', id: 'qi' + i }, h('div', { class: 'row' }, h('span', { class: 'eyebrow grow' }, 'Question ' + (i + 1) + ' · ' + (c > 0 ? 'partly right' : 'missed')), tagPill(it, q)), S.rich('div', 'qtext', it.q), yourAnswer(it),
          it.res && it.res.fb ? h('div', { class: 'fb ' + (c > 0 ? 'part' : 'bad') }, (it.res.by === 'ai' ? 'Claude: ' : '') + it.res.fb) : null,
          S.rich('div', 'keyans', '<span class="eyebrow">Answer key</span>' + it.key),
          ex.ok ? h('div', { class: 'fb ok' }, h('span', { class: 'eyebrow' }, 'Your explanation · accepted'), h('div', { style: 'white-space:pre-wrap;margin-top:4px' }, ex.t), ex.fb ? h('div', { class: 'small muted', style: 'margin-top:4px' }, 'Claude: ' + ex.fb) : null)
            : h('div', { class: 'col' }, ta, ex.fb ? h('div', { class: 'fb bad' }, 'Claude: ' + ex.fb) : null, S.ai.on() ? null : selfBtn)));
      });
      if (needEx.length && S.ai.on()) {
        var cb = h('button', { class: 'btn go block', onclick: async function () {
          var ready = needEx.filter(function (it) { return (it.ex.t || '').trim().length >= 20; });
          if (!ready.length) { S.toast('Write an explanation first (a couple of sentences each).'); return; }
          cb.disabled = true; cb.replaceChildren(h('span', { class: 'spin' }), 'Claude is checking…');
          try { await E.aiExplain(ready); E.explained(q); } catch (e) { S.toast(S.ai.why(e)); }
          S.render(true);
        } }, 'Check my explanations');
        out.push(cb);
        out.push(h('button', { class: 'btn ghost sm', onclick: function () { S.state.prefs.ai = false; S.dirty('main'); S.render(true); S.toast('Claude grading is off. Turn it back on in Pack.'); } }, 'Check them myself instead'));
      }
    }
    if (right.length) out.push(h('details', { class: 'card' }, h('summary', { style: 'cursor:pointer;font-weight:600' }, S.plural(right.length, 'correct answer') + ' and their keys'), right.map(function (it) { var i = q.items.indexOf(it); return h('div', { class: 'col', id: 'qi' + i, style: 'padding-top:12px;border-top:1px solid var(--ridge);margin-top:12px' }, h('span', { class: 'eyebrow' }, 'Question ' + (i + 1)), S.rich('div', 'small', it.q), yourAnswer(it), it.res.fb ? h('div', { class: 'fb ok' }, (it.res.by === 'ai' ? 'Claude: ' : '') + it.res.fb) : null, S.rich('div', 'keyans small', '<span class="eyebrow">Answer key</span>' + it.key)); })));
    var acts = [];
    if (q.kind === 'boss') { acts.push(h('button', { class: 'btn go', onclick: function () { close('mountain'); } }, 'Back to the mountain')); if (!q.pass) acts.push(h('button', { class: 'btn', onclick: function () { S.state.quiz = null; E.begin('boss', q.part); } }, 'Retake with fresh questions')); }
    else {
      var open = E.status(q.ch) === 'open';
      if (q.kind === 'quiz' && q.pass && needEx.length) acts.push(h('p', { class: 'small muted' }, 'Finish the explanations above to master the chapter. You can leave and come back; this session waits on Today.'));
      if ((q.kind === 'quiz' && !q.pass) || (q.kind === 'review' && !q.pass)) acts.push(h('button', { class: 'btn go', onclick: function () { S.state.quiz = null; E.begin(q.kind, q.ch); } }, 'Retake with fresh questions'));
      if (!q.pass) acts.push(h('button', { class: 'btn', onclick: function () { S.go(S.readHash(CH[q.ch].secs[0].id)); } }, 'Re-read Chapter ' + q.ch));
      if (q.kind === 'challenge' && !q.pass && open) acts.push(h('button', { class: 'btn', onclick: function () { close('ch-' + q.ch); } }, 'Study Chapter ' + q.ch));
      var nx = E.next();
      if (E.mastered(q.ch) && nx && nx !== q.ch) acts.push(h('button', { class: 'btn go', onclick: function () { close('ch-' + nx); } }, 'Next waypoint: Ch ' + nx + ' ' + S.LBL[nx]));
      acts.push(h('button', { class: 'btn ' + (acts.length ? '' : 'go'), onclick: function () { if (q.kind === 'quiz' && q.pass && needEx.length) S.go('mountain'); else close('mountain'); } }, q.kind === 'quiz' && q.pass && needEx.length ? 'Leave for now' : 'Back to the mountain'));
    }
    out.push(h('div', { class: 'col' }, acts));
    return h('div', { class: 'col gap14' }, out);
  }
  S.view('quiz', function () {
    var q = S.state.quiz;
    if (!q) return h('div', { class: 'card' }, h('h3', null, 'No session in progress'), h('p', { class: 'small muted' }, 'Start a quiz from any open chapter on the mountain.'), h('button', { class: 'btn go', onclick: function () { S.go('mountain'); } }, 'To the mountain'));
    return q.phase === 'answer' ? answerView(q) : q.phase === 'self' ? selfView(q) : resultsView(q);
  }, { tab: 'mountain', track: 'quiz' });
})();
