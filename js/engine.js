/* SUMMIT · engine: prerequisite graph, locks, mastery and erosion, quiz assembly and grading */
(function () {
  'use strict';
  var S = window.S, CH = S.CH, CUR = S.CUR, P = window.PHYS, BANK = window.BANK, INST = window.BANK_INST;
  var E = S.E = {}, DAY = 864e5;
  E.PASS = 0.8; E.CHAL = 0.9; E.THRESH = 0.8;
  var BLANK = { st: 0, read: {}, tries: 0, best: 0 };
  E.rec = function (n) { return S.state.ch[n] || (S.state.ch[n] = { st: 0, read: {}, tries: 0, best: 0 }); };
  E.peek = function (n) { return S.state.ch[n] || BLANK; };
  E.mastered = function (n) { return E.peek(n).st === 2; };
  E.bossPassed = function (p) { return !!(S.state.boss[p] && S.state.boss[p].at); };
  /* scout one camp ahead: a chapter in Part p needs the Boss Exam of Part p-2 */
  E.gate = function (n) { var p = CH[n].part; return p >= 3 && !E.bossPassed(p - 2) ? p - 2 : 0; };
  E.missing = function (n) { return CH[n].builds.filter(function (m) { return !E.mastered(m); }); };
  E.unlocked = function (n) { return !E.missing(n).length && !E.gate(n); };
  E.integrity = function (n) { var r = E.peek(n); if (r.st !== 2) return 0; return Math.exp(-(Date.now() - (r.last || r.at)) / ((r.ivl || 3) * DAY * 4.48)); };
  E.eroded = function (n) { return E.mastered(n) && E.integrity(n) < E.THRESH; };
  E.status = function (n) { return E.mastered(n) ? (E.eroded(n) ? 'eroded' : 'done') : (E.unlocked(n) ? 'open' : 'locked'); };
  E.dueAt = function (n) { var r = E.peek(n); return (r.last || r.at || 0) + (r.ivl || 3) * DAY; };
  E.due = function () { return CUR.chapters.filter(function (c) { return E.eroded(c.n); }).map(function (c) { return c.n; }).sort(function (a, b) { return E.integrity(a) - E.integrity(b); }); };
  E.dueCount = function () { return E.due().length; };
  E.open = function () { return CUR.chapters.filter(function (c) { return E.status(c.n) === 'open'; }).map(function (c) { return c.n; }); };
  E.masteredCount = function () { return CUR.chapters.filter(function (c) { return E.mastered(c.n); }).length; };
  E.short = function (n) { return (S.LBL && S.LBL[n]) || CH[n].t.split(':')[0]; };
  E.secRange = function (n) { var s = CH[n].secs; return '§' + s[0].id + '–' + s[s.length - 1].id; };
  E.pages = function (n) { var c = CH[n]; return c.page === c.pageEnd ? 'p. ' + c.page : 'pp. ' + c.page + '–' + c.pageEnd; };
  function list(a) { return a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  E.list = list;
  /* req = {ch:[...], sec:{chapter:'§x.y'}, read:['46.1']} -> exact study instructions */
  E.reqMissing = function (req) { return (req.ch || []).filter(function (m) { return !E.mastered(m); }); };
  E.reqRead = function (req) { return (req.read || []).filter(function (id) { var n = +id.split('.')[0]; return !E.peek(n).read[id]; }); };
  E.reqMet = function (req) { return !E.reqMissing(req).length && !E.reqRead(req).length; };
  E.reqText = function (req, gate) {
    var miss = E.reqMissing(req), out = [];
    if (miss.length) {
      var show = miss.slice(0, 6), more = miss.length - show.length;
      out.push('Study ' + list(show.map(function (m) { return 'Ch ' + m + ' (' + E.short(m) + ', ' + ((req.sec && req.sec[m]) || E.secRange(m)) + ')'; })) + (more > 0 ? ' and ' + more + ' more' : '') +
        ', then pass ' + list(show.map(function (m) { return 'Quiz ' + m; })) + (more > 0 ? ' and the rest' : '') + ' at ≥80%.');
    }
    var rd = E.reqRead(req);
    if (rd.length) out.push((miss.length ? 'Then read ' : 'Read ') + list(rd.map(function (id) { var n = +id.split('.')[0], s = CH[n].secs.filter(function (x) { return x.id === id; })[0]; return '§' + id + ' ' + s.t + ' (p. ' + s.page + ')'; })) + ' as a briefing.');
    if (gate) { var p = S.PART[gate]; out.push('Pass the ' + p.camp + ' Boss Exam (Part ' + p.roman + '): you can scout one camp ahead, not two.'); }
    return out.join(' ');
  };
  E.lockText = function (n) { return E.reqText({ ch: CH[n].builds }, E.gate(n)); };
  /* the chapters you can act on right now to open n */
  E.route = function (n) {
    var seen = {}, out = [];
    (function walk(m) { CH[m].builds.forEach(function (b) { if (seen[b]) return; seen[b] = 1; if (!E.mastered(b)) { if (E.unlocked(b)) out.push(b); else walk(b); } }); })(n);
    return out.sort(function (a, b) { return a - b; });
  };
  E.dependents = function (n) { return CUR.chapters.filter(function (c) { return c.builds.indexOf(n) >= 0 && c.builds.length < 20; }).map(function (c) { return c.n; }); };
  E.erodedPrereqs = function (req) { return (req.ch || []).filter(function (m) { return E.eroded(m); }); };
  E.bossReady = function (p) { return S.PART[p].ch.every(E.mastered); };
  E.readCount = function (n) { var r = E.peek(n).read; return CH[n].secs.filter(function (s) { return r[s.id]; }).length; };
  E.readMins = function (n, onlyUnread) { var r = E.peek(n).read, w = 0; CH[n].secs.forEach(function (s) { if (!onlyUnread || !r[s.id]) w += s.w; }); return Math.max(3, Math.round(w / 95)); };
  /* which chapter to study next: your chosen focus if it is open, otherwise the lowest open waypoint */
  E.next = function () { var o = E.open(), f = S.state.prefs.focus; if (f && o.indexOf(f) >= 0) return f; return o.length ? o[0] : 0; };

  /* ---------- unlock announcements ---------- */
  S.MODREQ = [];                       // modules register {id, name, req, go}
  function snapshot() { var o = {}; CUR.chapters.forEach(function (c) { if (E.unlocked(c.n)) o['c' + c.n] = 1; }); S.MODREQ.forEach(function (m) { if (E.reqMet(m.req)) o[m.id] = 1; }); CUR.parts.forEach(function (p) { if (E.bossReady(p.n)) o['b' + p.n] = 1; }); return o; }
  function announce(before) {
    var after = snapshot(), ch = [], mods = [];
    Object.keys(after).forEach(function (k) { if (before[k]) return; if (k[0] === 'c') ch.push(+k.slice(1)); else if (k[0] === 'b') mods.push(S.PART[+k.slice(1)].camp + ' Boss Exam'); else { var m = S.MODREQ.filter(function (x) { return x.id === k; })[0]; if (m) mods.push(m.name); } });
    if (ch.length) S.toast('Trail opened: ' + list(ch.map(function (n) { return 'Ch ' + n; })));
    mods.slice(0, 3).forEach(function (m) { S.toast('Unlocked: ' + m); });
  }
  E.master = function (n, how) {
    var before = snapshot(), r = E.rec(n), first = r.st !== 2;
    if (first) { r.st = 2; r.at = Date.now(); r.rv = 0; r.ivl = 3; }
    r.last = Date.now();
    S.log({ k: 'master', ch: n, how: how });
    if (first) { S.addXP(how === 'challenge' ? 200 : 150, 'Ch ' + n + ' mastered'); announce(before); }
    S.dirty('main', 'log');
  };
  E.flag = function (n) {           // a missed integrative question points back to chapter n
    S.state.miss[n] = (S.state.miss[n] || 0) + 1;
    var r = E.peek(n); if (r.st === 2 && !E.eroded(n)) { r.last = Date.now() - (r.ivl || 3) * DAY * 1.25; }
  };
  E.markRead = function (n, id) { var r = E.rec(n); if (r.read[id]) return false; r.read[id] = Date.now(); var before = snapshot(); S.addXP(10, '§' + id + ' read'); announce(before); S.dirty('main'); return true; };

  /* ---------- question items ---------- */
  function nf(f) { return { l: f[0], v: f[1], u: f[2] || '', tol: f[3] == null ? 0.02 : f[3] }; }
  function bank(n) { return BANK[n] || { t: {}, s: {}, x: [] }; }
  function show(v) { var a = Math.abs(v); return a !== 0 && (a >= 1e6 || a < 1e-3) ? P.fmt(v, 4) : P.fmt(+v.toPrecision(4)); }
  E.showNum = show;
  function docItem(c, q) {
    var b = bank(c.n), f = b.s[q.n] ? b.s[q.n] : (b.t[q.n] && !b.t[q.n].vo ? INST(b.t[q.n], null).f : null);
    return { id: c.n + '.' + q.n, ch: c.n, src: 'doc', qn: q.n, tag: q.tag, refs: q.refs, q: q.q, key: q.a, f: f ? f.map(nf) : null };
  }
  function varItem(c, q, rng) {
    var o = INST(bank(c.n).t[q.n], rng), f = o.f.map(nf);
    var key = '<p><strong>With these numbers:</strong> ' + f.map(function (x) { return S.tex(x.l) + ' = ' + show(x.v) + (x.u ? ' ' + x.u : ''); }).join('; ') + '.</p><p class="small muted">Method, from Appendix J for Quiz ' + c.n + '.' + q.n + ' (the doc’s numbers): ' + q.a + '</p>';
    return { id: c.n + '.' + q.n + 'v' + Math.floor(rng() * 1e6), ch: c.n, src: 'var', qn: q.n, tag: q.tag, refs: q.refs, q: S.tex(o.q), key: key, f: f };
  }
  function xItem(c, x, i) { return { id: c.n + '.x' + i, ch: c.n, src: 'x', xi: i, tag: x.tag, refs: x.refs || [], q: S.tex(x.q), key: S.tex(x.a), f: null }; }
  function aiItem(c, a, i) { return { id: c.n + '.a' + i, ch: c.n, src: 'ai', ai: i, tag: a.tag === 'I' ? 'I' : 'C', refs: a.ref ? [a.ref] : [], q: S.tex(a.q, true), key: S.tex(a.a, true), f: null }; }
  /* fresh written questions not used in the previous attempt: Claude-generated first, then the built-in extras */
  function writtenPool(c, rng) {
    var r = E.peek(c.n), lastX = r.lx || [], out = [];
    (S.state.aiq[c.n] || []).forEach(function (a, i) { if (!a.used) out.push(aiItem(c, a, i)); });
    var xs = bank(c.n).x.map(function (x, i) { return xItem(c, x, i); });
    var fresh = xs.filter(function (it) { return lastX.indexOf(it.xi) < 0; }), stale = xs.filter(function (it) { return lastX.indexOf(it.xi) >= 0; });
    return out.concat(rng.shuffle(fresh), rng.shuffle(stale));
  }
  function templates(c) { var b = bank(c.n); return c.quiz.filter(function (q) { return b.t[q.n]; }); }
  function assemble(kind, arg, seed) {
    var rng = P.rng(seed), items = [], c, pool;
    if (kind === 'quiz') {
      c = CH[arg];
      if (!E.peek(c.n).tries) return c.quiz.map(function (q) { return docItem(c, q); });
      pool = writtenPool(c, rng);
      c.quiz.forEach(function (q) {
        if (bank(c.n).t[q.n]) { items.push(varItem(c, q, rng)); return; }
        var k = -1; pool.forEach(function (it, i) { if (k < 0 && it.tag === (q.tag === 'I' ? 'I' : 'C')) k = i; }); if (k < 0 && pool.length) k = 0;
        items.push(k >= 0 ? pool.splice(k, 1)[0] : docItem(c, q));
      });
      return items;
    }
    if (kind === 'challenge') {
      c = CH[arg]; pool = writtenPool(c, rng);
      c.quiz.forEach(function (q) { items.push(bank(c.n).t[q.n] ? varItem(c, q, rng) : docItem(c, q)); });
      while (items.length < 10 && pool.length) items.push(pool.shift());
      return rng.shuffle(items);
    }
    if (kind === 'review') {
      c = CH[arg]; pool = writtenPool(c, rng);
      rng.shuffle(templates(c)).slice(0, 3).forEach(function (q) { items.push(varItem(c, q, rng)); });
      while (items.length < 4 && pool.length) items.push(pool.shift());
      var rest = rng.shuffle(c.quiz.filter(function (q) { return !bank(c.n).t[q.n]; }));
      while (items.length < 4 && rest.length) items.push(docItem(c, rest.shift()));
      return items;
    }
    if (kind === 'boss') {
      var chs = S.PART[arg].ch, per = chs.length > 13 ? 2 : 2;
      chs.forEach(function (n, idx) {
        c = CH[n]; var ts = rng.shuffle(templates(c)), wp = writtenPool(c, rng), got = 0;
        if (ts.length) { items.push(varItem(c, ts.shift(), rng)); got++; }
        if (idx % 2 === 0 && wp.length) { items.push(wp.shift()); got++; }
        while (got < per && ts.length) { items.push(varItem(c, ts.shift(), rng)); got++; }
        while (got < per && wp.length) { items.push(wp.shift()); got++; }
        var rest2 = rng.shuffle(c.quiz.slice());
        while (got < per && rest2.length) { items.push(docItem(c, rest2.shift())); got++; }
      });
      return items;
    }
    return items;
  }
  E.META = {
    quiz: { name: 'Quiz', pass: 0.8, track: 'quiz' }, challenge: { name: 'Challenge exam', pass: 0.9, track: 'quiz' },
    review: { name: 'Review quiz', pass: 0.75, track: 'quiz' }, boss: { name: 'Boss Exam', pass: 0.8, track: 'quiz' }
  };
  E.title = function (q) { return q.kind === 'boss' ? S.PART[q.part].camp + ' Boss Exam' : q.kind === 'quiz' ? 'Quiz ' + q.ch : q.kind === 'review' ? 'Review · Ch ' + q.ch : 'Challenge · Ch ' + q.ch; };
  E.begin = function (kind, arg) {
    var seed = P.hash(kind + arg + ':' + Date.now()), items = assemble(kind, arg, seed);
    items.forEach(function (it) { it.ans = it.f ? { f: it.f.map(function () { return ''; }) } : { t: '' }; });
    S.state.quiz = { kind: kind, ch: kind === 'boss' ? 0 : arg, part: kind === 'boss' ? arg : CH[arg].part, seed: seed, items: items, i: 0, phase: 'answer', t0: Date.now() };
    S.markActive(); S.dirty('main'); S.go('quiz');
  };
  E.start = function (kind, arg) {
    var go = function () { E.begin(kind, arg); };
    var q = S.state.quiz, req = kind === 'boss' ? { ch: [] } : { ch: CH[arg].builds }, er = kind === 'review' ? [] : E.erodedPrereqs(req);
    var step2 = function () {
      if (er.length) S.ask('Prerequisites are eroding', 'Before you start: ' + list(er.map(function (m) { return 'Ch ' + m + ' (' + E.short(m) + ') is at ' + S.pct(E.integrity(m)) + ' integrity'; })) + '. A 4-question review restores it.',
        [{ label: 'Refresh Ch ' + er[0] + ' first', cls: 'go', fn: function () { E.begin('review', er[0]); } }, { label: 'Continue anyway', fn: go }]);
      else go();
    };
    if (q && q.phase !== 'done') S.ask('Leave the session in progress?', 'You have an unfinished ' + E.title(q) + '. Starting a new session discards it.', [{ label: 'Resume ' + E.title(q), cls: 'go', fn: function () { S.go('quiz'); } }, { label: 'Discard it and start', cls: 'danger', fn: step2 }]);
    else step2();
  };

  /* ---------- grading ---------- */
  E.parseNum = function (s) {
    s = String(s || '').trim().replace(/[−–]/g, '-').replace(/,(?=\d{3}(\D|$))/g, '').replace(/[\s  ]/g, '').replace(/%$/, '');
    if (!s) return NaN;
    var m = s.match(/^(-?\d*\.?\d+)(?:[x×*]10\^?\(?(-?\d+)\)?)$/i); if (m) return parseFloat(m[1]) * Math.pow(10, parseInt(m[2], 10));
    m = s.match(/^(-?\d*\.?\d+)\/(\d*\.?\d+)$/); if (m) return parseFloat(m[1]) / parseFloat(m[2]);
    return /^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s) ? parseFloat(s) : NaN;
  };
  E.fieldOK = function (f, s) {
    var x = E.parseNum(s); if (!isFinite(x)) return false;
    if (f.tol && typeof f.tol === 'object') return Math.abs(x - f.v) <= f.tol.abs + 1e-12;
    if (Math.abs(f.v) < 1e-12) return Math.abs(x) <= 0.01;
    return Math.abs(x - f.v) <= f.tol * Math.abs(f.v) + 1e-12;
  };
  E.gradeAuto = function (it) { var ok = it.f.map(function (f, i) { return E.fieldOK(f, it.ans.f[i]); }), n = ok.filter(Boolean).length; it.res = { credit: n / ok.length, by: 'auto', ok: ok }; };
  E.plain = function (html) { return String(html).replace(/<span class="m[id]"[^>]*>([\s\S]*?)<\/span>/g, function (m, t) { return '\\(' + t + '\\)'; }).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim(); };
  E.aiGrade = async function (items, signal) {
    var payload = items.map(function (it) { return { id: it.id, question: E.plain(it.q), key: E.plain(it.key).slice(0, 1500), student_answer: (it.ans.t || '').slice(0, 2500) }; });
    var prompt = 'You are grading closed-book quiz answers from a self-taught student working through a rocketry and spaceflight curriculum. For each item you get the question, the answer key from the textbook, and the student\'s typed answer.\n' +
      'Grade physical and mathematical correctness against the key, not wording. credit 1: the essential points of the key are present and nothing important is wrong. credit 0.5: a key idea is right but an important part is missing or one significant error. credit 0: wrong, blank, or too vague to show understanding. For numbers accept values within 2% of the key. Be strict but fair.\n' +
      'feedback: one or two sentences to the student as "you", naming exactly what was missing or wrong (or confirming what was right). Do not paste the whole key.\n' +
      'Reply with only a JSON array, one object per item, same order: [{"id":"...","credit":0,"feedback":"..."}]\n\nItems:\n' + JSON.stringify(payload);
    var out = await S.ai.json(prompt, { signal: signal, cache: false });
    if (!Array.isArray(out)) throw { code: 'invalid_json' };
    var by = {}; out.forEach(function (o) { if (o && o.id != null) by[String(o.id)] = o; });
    items.forEach(function (it) { var o = by[it.id]; if (o) { var c = +o.credit; it.res = { credit: c >= 0.75 ? 1 : c >= 0.25 ? 0.5 : 0, by: 'ai', fb: String(o.feedback || '').slice(0, 600) }; } });
    return items.every(function (it) { return it.res; });
  };
  E.aiExplain = async function (items, signal) {
    var payload = items.map(function (it) { return { id: it.id, question: E.plain(it.q), key: E.plain(it.key).slice(0, 1500), original_answer: it.f ? it.f.map(function (f, i) { return E.plain(S.tex(f.l)) + ' = ' + (it.ans.f[i] || '(blank)') + ' ' + f.u; }).join('; ') : (it.ans.t || '(blank)').slice(0, 1200), explanation: (it.ex.t || '').slice(0, 2000) }; });
    var prompt = 'A self-taught student missed these quiz items in a rocketry curriculum. The textbook\'s rule is that they may move on only if they can explain each missed item. For each item you get the question, the answer key, their original answer and their explanation of what went wrong and how to do it correctly.\n' +
      'ok = true only if the explanation is specific to this question and shows they now understand the correct idea or method (naming the right relation or the actual mistake). Generic statements such as "I made an arithmetic error" without saying what the right approach is are not enough.\n' +
      'feedback: one sentence to the student as "you". If not ok, say what is still missing.\n' +
      'Reply with only a JSON array, same order: [{"id":"...","ok":true,"feedback":"..."}]\n\nItems:\n' + JSON.stringify(payload);
    var out = await S.ai.json(prompt, { signal: signal, cache: false });
    if (!Array.isArray(out)) throw { code: 'invalid_json' };
    var by = {}; out.forEach(function (o) { if (o && o.id != null) by[String(o.id)] = o; });
    items.forEach(function (it) { var o = by[it.id]; if (o) { it.ex.ok = !!o.ok; it.ex.fb = String(o.feedback || '').slice(0, 500); it.ex.by = 'ai'; } });
  };
  E.aiFresh = async function (n, text, signal) {
    var c = CH[n], ex = c.quiz.filter(function (q) { return q.tag !== 'N'; }).slice(0, 3).map(function (q) { return { tag: q.tag, q: E.plain(q.q), a: E.plain(q.a) }; });
    var have = c.quiz.map(function (q) { return E.plain(q.q); }).concat(bank(n).x.map(function (x) { return x.q; }), (S.state.aiq[n] || []).map(function (a) { return a.q; }));
    var prompt = 'Write 4 fresh end-of-chapter quiz questions for a self-study curriculum, in the style of the examples.\n' +
      'Rules: test only material in the chapter text below; concise, university level, each answerable closed-book in 2-5 sentences or a short derivation; no multi-part numerical work. Tag each "C" (concept) or "I" (integrative: also draws on one of the listed prerequisite chapters; put that chapter number in "ref"). Make at least one "I". Do not repeat or lightly reword any existing question listed. Stay within the open, university-level science in the text: no energetic-material formulations, no manufacturing or test procedures, nothing weapon-specific.\n' +
      'Write maths in LaTeX inside \\( and \\). Give each a model answer of 1-4 sentences.\n' +
      'Reply with only a JSON array: [{"tag":"C","ref":null,"q":"...","a":"..."}]\n\n' +
      'Chapter ' + n + ': ' + c.t + '\nPrerequisite chapters: ' + c.builds.slice(-12).map(function (m) { return m + ' ' + CH[m].t; }).join('; ') +
      '\nExamples of the style:\n' + JSON.stringify(ex) + '\nExisting questions (do not repeat):\n' + JSON.stringify(have).slice(0, 6000) + '\n\nChapter text:\n' + text.slice(0, 14000);
    var out = await S.ai.json(prompt, { signal: signal, cache: false });
    if (!Array.isArray(out)) throw { code: 'invalid_json' };
    var list2 = S.state.aiq[n] || (S.state.aiq[n] = []), added = 0;
    out.forEach(function (o) { if (o && typeof o.q === 'string' && typeof o.a === 'string' && o.q.length > 15 && o.a.length > 10) { list2.push({ tag: o.tag === 'I' ? 'I' : 'C', ref: o.tag === 'I' && c.builds.indexOf(+o.ref) >= 0 ? +o.ref : null, q: o.q.slice(0, 900), a: o.a.slice(0, 1200), used: 0 }); added++; } });
    while (list2.length > 16) list2.shift();
    var total = 0; Object.keys(S.state.aiq).forEach(function (k) { total += S.state.aiq[k].length; });
    if (total > 160) { var ks = Object.keys(S.state.aiq).filter(function (k) { return +k !== n; }); if (ks.length) delete S.state.aiq[ks[0]]; }
    S.dirty('aiq'); return added;
  };

  /* ---------- finishing a session ---------- */
  E.score = function (q) { var s = 0; q.items.forEach(function (it) { s += it.res ? it.res.credit : 0; }); return s / q.items.length; };
  E.missed = function (q) { return q.items.filter(function (it) { return !it.res || it.res.credit < 1; }); };
  E.finish = function (q) {
    var sc = E.score(q), meta = E.META[q.kind], pass = sc >= meta.pass - 1e-9, missed = E.missed(q), back = {};
    q.score = sc; q.pass = pass; q.phase = 'results'; q.t1 = Date.now();
    missed.forEach(function (it) { it.ex = { t: '', ok: false }; (it.refs || []).forEach(function (r) { if (it.tag === 'I' && r !== q.ch) back[r] = 1; }); if (q.kind === 'boss' && it.res && it.res.credit < 0.5) back[it.ch] = 1; });
    q.back = Object.keys(back).map(Number);
    q.items.forEach(function (it) { if (it.tag === 'I' && it.res && it.res.credit < 1) (it.refs || []).forEach(E.flag); });
    q.items.forEach(function (it) { if (it.src === 'ai') { var a = (S.state.aiq[it.ch] || [])[it.ai]; if (a) a.used = 1; } });
    S.log({ k: q.kind, ch: q.ch, part: q.part, sc: +sc.toFixed(3), n: q.items.length, pass: pass ? 1 : 0, s: Math.round((q.t1 - q.t0) / 1000) });
    var xp = Math.round(15 + 45 * sc * Math.min(1, q.items.length / 8));
    if (q.kind === 'boss') {
      var b = S.state.boss[q.part] || (S.state.boss[q.part] = { tries: 0, best: 0 }); b.tries++; b.best = Math.max(b.best, sc);
      if (pass && !b.at) { var before = snapshot(); b.at = Date.now(); S.addXP(500, S.PART[q.part].camp + ' Boss Exam passed'); announce(before); } else S.addXP(xp, 'Boss attempt');
    } else {
      var r = E.rec(q.ch);
      if (q.kind === 'quiz' || q.kind === 'challenge') { r.tries++; r.best = Math.max(r.best, sc); r.lx = q.items.filter(function (it) { return it.src === 'x'; }).map(function (it) { return it.xi; }); }
      if (q.kind === 'quiz') { S.addXP(xp, 'Quiz ' + q.ch); if (pass && !missed.length) E.master(q.ch, 'quiz'); }
      if (q.kind === 'challenge') { if (pass) { S.addXP(xp, 'Challenge'); E.master(q.ch, 'challenge'); } else { r.chal = Date.now(); S.addXP(Math.round(xp / 2), 'Challenge attempt'); } }
      if (q.kind === 'review') {
        if (pass) { r.rv = (r.rv || 0) + 1; r.ivl = Math.min(365, Math.round((r.ivl || 3) * 2.4)); r.last = Date.now(); S.addXP(40, 'Ch ' + q.ch + ' cairn rebuilt'); }
        else { r.ivl = Math.max(2, Math.round((r.ivl || 3) * 0.4)); S.addXP(10, 'Review attempt'); }
      }
    }
    S.doneToday(q.kind + (q.ch || q.part));
    S.dirty('main', 'log', 'aiq');
  };
  /* after explanations are judged: a passed chapter quiz becomes mastery once every miss is explained */
  E.explained = function (q) {
    var missed = E.missed(q), all = missed.every(function (it) { return it.ex && it.ex.ok; }), n = 0;
    missed.forEach(function (it) { if (it.ex && it.ex.ok && !it.ex.paid) { it.ex.paid = 1; n++; } });
    if (n) S.addXP(10 * n, S.plural(n, 'miss') + ' explained');
    if (all && q.kind === 'quiz' && q.pass && !E.mastered(q.ch)) E.master(q.ch, 'quiz');
    S.dirty('main'); return all;
  };
  E.chalWait = function (n) { var t = E.peek(n).chal; return t ? Math.max(0, t + 12 * 36e5 - Date.now()) : 0; };
  E.autoCount = function () { var a = 0, t = 0; CUR.chapters.forEach(function (c) { c.quiz.forEach(function (q) { t++; if (docItem(c, q).f) a++; }); }); return [a, t]; };
})();
