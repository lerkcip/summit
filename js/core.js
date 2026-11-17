/* SUMMIT · core: DOM helpers, math rendering, state, saving, XP / streak / ranks, router, sheets */
(function () {
  'use strict';
  var S = window.S = {}, CUR = window.CUR;
  S.CUR = CUR; S.CH = {}; CUR.chapters.forEach(function (c) { S.CH[c.n] = c; });
  S.PART = {}; CUR.parts.forEach(function (p) { S.PART[p.n] = p; });

  /* ---------- DOM ---------- */
  function h(tag, attrs) {
    var e = document.createElement(tag), i, k, v;
    if (attrs) for (k in attrs) {
      v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (k === 'value') e.value = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (i = 2; i < arguments.length; i++) add(e, arguments[i]);
    return e;
  }
  function add(e, c) { if (c == null || c === false) return; if (Array.isArray(c)) { c.forEach(function (x) { add(e, x); }); return; } e.append(c.nodeType ? c : document.createTextNode(String(c))); }
  S.lh = function (el) { var v = parseFloat(getComputedStyle(el).lineHeight); return v > 8 ? v : 20.3; };   // line height of an editor, for sizing it to its text
  S.put = function (el) { el.replaceChildren(); for (var i = 1; i < arguments.length; i++) add(el, arguments[i]); return el; };   // replaceChildren that skips null and flattens arrays
  S.h = h;
  S.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  /* text with \( ... \) or \[ ... \] maths -> HTML. untrusted text (AI, user) is escaped first. */
  S.tex = function (s, untrusted) {
    var out = '', re = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g, last = 0, m;
    s = String(s == null ? '' : s);
    while ((m = re.exec(s))) {
      var pre = s.slice(last, m.index);
      out += untrusted ? S.esc(pre) : pre;
      out += '<span class="' + (m[1] != null ? 'mi' : 'md') + '">' + S.esc(m[1] != null ? m[1] : m[2]) + '</span>';
      last = re.lastIndex;
    }
    var tail = s.slice(last); out += untrusted ? S.esc(tail) : tail;
    return untrusted ? out.replace(/\n/g, '<br>') : out;
  };
  S.math = function (root) {
    if (!window.katex || !root) return;
    root.querySelectorAll('span.mi:not([data-k]), span.md:not([data-k])').forEach(function (el) {
      var t = el.textContent; el.setAttribute('data-k', '1'); el.setAttribute('data-tex', t);
      try { window.katex.render(t, el, { displayMode: el.classList.contains('md'), throwOnError: false, strict: false }); } catch (e) { el.textContent = t; }
    });
  };
  S.rich = function (tag, cls, html) { var e = h(tag, { class: cls, html: html }); S.math(e); return e; };
  S.fmt = window.PHYS.fmt;
  S.pct = function (x) { return Math.round(x * 100) + '%'; };
  S.plural = function (n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); };
  S.mins = function (sec) { var m = Math.round(sec / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };

  /* ---------- dates ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  S.day = function (t) { var d = t ? new Date(t) : new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  S.dayNum = function (k) { var p = k.split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5); };
  S.dayAdd = function (k, n) { var p = k.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + n); return S.day(d.getTime()); };
  S.ago = function (t) { var d = (Date.now() - t) / 864e5; return d < 1 ? 'today' : d < 2 ? 'yesterday' : Math.floor(d) + ' days ago'; };
  S.weekStart = function (k) { var p = (k || S.day()).split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]); var wd = (d.getDay() + 6) % 7; return S.dayAdd(k || S.day(), -wd); };

  /* ---------- state ---------- */
  var LS = 'summit.v1', DOCS = ['main', 'mods', 'log', 'aiq'];
  var PARTS = { main: ['v', 'created', 'prefs', 'xp', 'streak', 'ch', 'boss', 'quiz', 'miss', 'plan'], mods: ['lw', 'hs', 'shop', 'career'], log: ['days', 'hist'], aiq: ['aiq'] };
  function defaults() {
    return { v: 1, created: Date.now(), u: { main: 0, mods: 0, log: 0, aiq: 0 }, b: { main: 0, mods: 0, log: 0, aiq: 0 },
      prefs: { ai: true, mins: 30, focus: 0, mach: { x: 600, y: 600, z: 80, rapid: 3000 }, warned: {} },
      xp: 0, streak: { n: 0, best: 0, last: '', fuel: 2, run: 0 }, ch: {}, boss: {}, quiz: null, miss: {}, plan: null,
      lw: { tr: {}, ses: [], badges: {} }, hs: { code: {}, best: {}, done: {}, daily: {} }, shop: { done: {}, daily: {}, chk: {}, fs: { n: 0, ok: 0 }, code: {} }, career: { con: {}, drills: {}, dcode: {} },
      days: {}, hist: [], aiq: {} };
  }
  function fill(a, b) { for (var k in b) { if (a[k] == null) a[k] = b[k]; else if (typeof b[k] === 'object' && !Array.isArray(b[k]) && typeof a[k] === 'object' && !Array.isArray(a[k]) && b[k] !== null) fill(a[k], b[k]); } return a; }
  S.defaults = defaults;
  S.state = defaults();
  S.sync = { mode: 'local', dirty: {}, busy: false, ready: false, dead: '', err: '', photos: {}, fresh: 20000, minPull: 45000, wait: (window.SUMMIT_HOST && window.SUMMIT_HOST.wait) || 1500 };
  function part(k) { var o = { u: S.state.u[k] || 0 }; PARTS[k].forEach(function (f) { o[f] = S.state[f]; }); return o; }
  function writeLocal() { try { localStorage.setItem(LS, JSON.stringify(S.state)); } catch (e) { try { var c = JSON.parse(JSON.stringify(S.state)); c.aiq = {}; localStorage.setItem(LS, JSON.stringify(c)); } catch (e2) { /* storage unavailable */ } } }
  function readLocal() { try { var r = localStorage.getItem(LS); if (r) { var o = JSON.parse(r); if (o && o.v) return fill(o, defaults()); } } catch (e) { /* ignore */ } return null; }
  /* ---------- account copy ----------
     Four documents under the viewer's private subtree. Each carries u, the time of its last change; b[k] is the u
     this device last agreed on with the account. A document is written only while the account copy is still the
     one this device last saw. If both sides have moved (two devices, a stale tab) the copies are merged, so
     progress made anywhere is kept. */
  var flushT = null, seen = {}, lastPull = 0, prefSig = '';
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function sigPrefs() { var c = clone(S.state.prefs || {}); delete c.t; return JSON.stringify(c); }
  function bytes(o) { var t = JSON.stringify(o); try { return new TextEncoder().encode(t).length; } catch (e) { return t.length * 3; } }
  function slim(k) {                                   // a document must stay under 256 KiB
    for (var n = 0; n < 80 && bytes(part(k)) > 235000; n++) {
      if (k === 'aiq') { var ks = Object.keys(S.state.aiq); if (!ks.length) break; delete S.state.aiq[ks[0]]; }
      else if (k === 'log') { if (S.state.hist.length > 40) S.state.hist.splice(0, 40); else { var ds = Object.keys(S.state.days).sort(); if (ds.length < 40) break; ds.slice(0, 30).forEach(function (d) { delete S.state.days[d]; }); } }
      else break;
    }
    return bytes(part(k)) <= 250000;
  }
  function uni(a, b, pick) { var o = {}, k; a = a || {}; b = b || {}; for (k in a) o[k] = k in b ? pick(a[k], b[k], k) : a[k]; for (k in b) if (!(k in o)) o[k] = b[k]; return o; }
  function mx(a, b) { return Math.max(+a || 0, +b || 0); }
  function mergeCh(a, b) {
    var ta = a.last || a.at || 0, tb = b.last || b.at || 0, lead = (a.st || 0) !== (b.st || 0) ? ((a.st || 0) > (b.st || 0) ? a : b) : (ta >= tb ? a : b), o = clone(lead);
    o.read = uni(a.read, b.read, mx); o.tries = mx(a.tries, b.tries); o.best = mx(a.best, b.best); if (a.chal || b.chal) o.chal = mx(a.chal, b.chal);
    return o;
  }
  function deep(a, b, key) {                           // module state: a = this device, b = the account
    if (a == null) return b; if (b == null) return a;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (key === 'ses') { var sn = {}; return a.concat(b).filter(function (x) { var id = x && x.t; if (sn[id]) return false; sn[id] = 1; return true; }).sort(function (x, y) { return x.t - y.t; }).slice(-60); }
      if (key === 'steps' || key === 'del') { var r = []; for (var i = 0; i < Math.max(a.length, b.length); i++) r.push(a[i] || b[i] ? 1 : 0); return r; }
      return a.length >= b.length ? a : b;
    }
    if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      if (key === 'rev') return (a.t || 0) >= (b.t || 0) ? a : b;
      if (typeof a.r === 'number' && Array.isArray(a.h)) return (a.n || 0) >= (b.n || 0) ? a : b;
      if (typeof a.s === 'number' && typeof b.s === 'number') { var w = clone(a.s !== b.s ? (a.s > b.s ? a : b) : ((a.time || 0) <= (b.time || 0) ? a : b)); if (a.p || b.p) w.p = mx(a.p, b.p); return w; }
      return uni(a, b, deep);
    }
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (typeof a === 'string' && typeof b === 'string') return key === 'how' ? (a === 'run' || b === 'run' ? 'run' : a) : (a || b);
    return a;
  }
  var MERGE = {
    main: function (L, C) {
      var o = { v: L.v || C.v, created: Math.min(L.created || Date.now(), C.created || Date.now()) }, ls = L.streak || {}, cs = C.streak || {};
      o.prefs = ((L.prefs && L.prefs.t) || 0) >= ((C.prefs && C.prefs.t) || 0) ? L.prefs : C.prefs;
      o.xp = mx(L.xp, C.xp);
      o.streak = clone((ls.last || '') >= (cs.last || '') ? ls : cs); o.streak.best = mx(ls.best, cs.best);
      o.ch = uni(L.ch, C.ch, mergeCh);
      o.boss = uni(L.boss, C.boss, function (a, b) { var x = clone((a.at || 0) >= (b.at || 0) ? a : b); x.tries = mx(a.tries, b.tries); x.best = mx(a.best, b.best); return x; });
      o.quiz = L.quiz || C.quiz || null; o.miss = uni(L.miss, C.miss, mx); o.plan = L.plan && L.plan.day === S.day() ? L.plan : (C.plan || L.plan || null);
      return o;
    },
    mods: function (L, C) { var o = {}; PARTS.mods.forEach(function (f) { o[f] = deep(L[f], C[f], f); }); return o; },
    log: function (L, C) {
      var days = uni(L.days, C.days, function (a, b) { var am = a.m || []; return { xp: mx(a.xp, b.xp), a: mx(a.a, b.a), t: uni(a.t, b.t, mx), m: am.concat((b.m || []).filter(function (x) { return am.indexOf(x) < 0; })) }; }), sn = {};
      var hist = (L.hist || []).concat(C.hist || []).filter(function (e) { var id = e.t + '|' + (e.k || ''); if (sn[id]) return false; sn[id] = 1; return true; }).sort(function (x, y) { return x.t - y.t; }).slice(-400);
      return { days: days, hist: hist };
    },
    aiq: function (L, C) { return { aiq: uni(L.aiq, C.aiq, function (a, b) { return a.length >= b.length ? a : b; }) }; }
  };
  S.MERGE = MERGE;
  /* mark documents changed and schedule a save: local copy at once, account copy after a pause */
  S.dirty = function () {
    var now = Date.now();
    for (var i = 0; i < arguments.length; i++) { S.state.u[arguments[i]] = now; S.sync.dirty[arguments[i]] = 1; if (arguments[i] === 'main') { var sg = sigPrefs(); if (sg !== prefSig) { prefSig = sg; S.state.prefs.t = now; } } }
    writeLocal();
    if (S.cloud) { clearTimeout(flushT); flushT = setTimeout(flush, S.sync.wait); renderTop(); }
  };
  function adopt(k, data) { PARTS[k].forEach(function (f) { if (data[f] != null) S.state[f] = data[f]; }); S.state.u[k] = S.state.b[k] = data.u || 0; if (k === 'main') prefSig = sigPrefs(); }
  /* compare one document with the account's copy; returns same | push | adopted | merged */
  function reconcile(k, snap) {
    var d = snap && snap.exists ? snap.data() : null, lu = S.state.u[k] || 0, lb = S.state.b[k] || 0, moved = lu > lb || !!S.sync.dirty[k];
    seen[k] = Date.now();
    if (!d) { if (lu > 0 || S.sync.dirty[k]) { S.sync.dirty[k] = 1; return 'push'; } return 'same'; }
    d = clone(d);
    var cu = d.u || 0;
    if (cu === lb) { if (moved) { S.sync.dirty[k] = 1; return 'push'; } return 'same'; }
    if (!moved) { adopt(k, d); delete S.sync.dirty[k]; return 'adopted'; }
    var m = MERGE[k](part(k), d);
    PARTS[k].forEach(function (f) { if (m[f] !== undefined) S.state[f] = m[f]; });
    S.state.b[k] = cu; S.state.u[k] = Math.max(Date.now(), cu + 1); S.sync.dirty[k] = 1; if (k === 'main') prefSig = sigPrefs();
    return 'merged';
  }
  async function pull() {
    lastPull = Date.now();
    var snaps = await Promise.all(DOCS.map(function (k) { return S.cloud.ref(k).get().then(function (x) { return x; }, function () { return null; }); }));
    var changed = false;
    snaps.forEach(function (x, i) { if (!x) return; var r = reconcile(DOCS[i], x); if (r === 'adopted' || r === 'merged') changed = true; });
    if (changed) fill(S.state, defaults());
    writeLocal();
    return changed;
  }
  async function flush() {
    if (!S.cloud || !S.sync.ready || S.sync.busy || S.sync.dead) return;
    var keys = Object.keys(S.sync.dirty); if (!keys.length) return;
    S.sync.busy = true; renderTop(); var changed = false;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i], ref = S.cloud.ref(k);
      try {
        if (!seen[k] || Date.now() - seen[k] >= S.sync.fresh) { var r = reconcile(k, await ref.get()); if (r === 'adopted' || r === 'merged') changed = true; if (!S.sync.dirty[k]) continue; }
        if (!slim(k)) { delete S.sync.dirty[k]; S.sync.err = 'too_big'; continue; }
        var p = clone(part(k));
        delete S.sync.dirty[k]; await ref.set(p); S.state.b[k] = p.u; seen[k] = Date.now(); S.sync.err = '';
      } catch (e) {
        var c = (e && e.code) || 'unavailable'; S.sync.dirty[k] = 1; S.sync.err = c;
        if (c !== 'unavailable' && c !== 'resource_exhausted') S.sync.dead = c;
        break;
      }
    }
    S.sync.busy = false;
    if (changed) { fill(S.state, defaults()); S.render(true); S.toast('Merged with newer progress from your account.'); }
    writeLocal(); renderTop();
    if (Object.keys(S.sync.dirty).length && !S.sync.dead) { clearTimeout(flushT); flushT = setTimeout(flush, S.sync.err ? 30000 : S.sync.wait); }
  }
  S.flush = flush;
  function refresh() {
    if (!S.cloud || !S.sync.ready || S.sync.busy || S.sync.dead || document.hidden || Date.now() - lastPull < S.sync.minPull) return;
    pull().then(function (c) { if (c) { S.render(true); S.toast('Loaded newer progress from your account.'); } if (Object.keys(S.sync.dirty).length) flush(); }, function () { });
  }
  async function initCloud() {
    if (!window.claude || typeof window.claude.use !== 'function') { S.sync.ready = true; return; }
    var caps;
    try { caps = await Promise.all([window.claude.use('db'), window.claude.use('user'), window.claude.use('sample'), window.claude.use('downloads')]); } catch (e) { S.sync.ready = true; return; }
    var db = caps[0], user = caps[1];
    if (caps[2]) { S.ai.fn = caps[2]; S.ai.st = 'ok'; } else S.ai.st = 'none';
    S.dl = caps[3] || null;
    if (db && user) {
      var uid = null; try { uid = await user.id(); } catch (e) { uid = null; }
      if (uid) {
        S.cloud = { db: db, uid: uid, ref: function (k) { return db.doc('data/users/' + uid + '/' + k); } };
        S.sync.mode = 'cloud';
        try { var ch = await pull(); S.sync.ready = true; if (ch) S.render(true); } catch (e) { S.sync.ready = true; S.sync.err = 'unavailable'; }
        if (Object.keys(S.sync.dirty).length) flush();
      }
    }
    if (!S.cloud) S.sync.ready = true;   // nothing to wait for: progress lives on this device
    renderTop(); if (S.onCaps) S.onCaps();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { S.trackPause(); if (S.cloud) flush(); }
    else { S.trackResume(); refresh(); }
  });
  window.addEventListener('focus', refresh);
  setInterval(refresh, 240000);
  /* photos live in their own documents so the main ones stay small */
  S.photoSave = async function (id, dataUrl) { S.sync.photos[id] = dataUrl; try { localStorage.setItem(LS + '.ph.' + id, dataUrl); } catch (e) { /* ignore */ } if (S.cloud) { try { await S.cloud.ref('photo_' + id).set({ d: dataUrl, u: Date.now() }); } catch (e) { /* kept locally */ } } };
  S.photoLoad = async function (id) {
    if (S.sync.photos[id]) return S.sync.photos[id];
    var d = null; try { d = localStorage.getItem(LS + '.ph.' + id); } catch (e) { d = null; }
    if (!d && S.cloud) { try { var s = await S.cloud.ref('photo_' + id).get(); if (s.exists) d = s.data().d; } catch (e) { d = null; } }
    if (d) S.sync.photos[id] = d; return d;
  };
  S.exportJSON = function () { return JSON.stringify({ app: 'SUMMIT', exported: new Date().toISOString(), state: S.state }, null, 1); };
  S.importJSON = function (txt) {
    var o = JSON.parse(txt); var st = o && o.state ? o.state : o;
    if (!st || typeof st !== 'object' || !st.v || !st.ch || !st.streak) throw new Error('This file is not a SUMMIT backup.');
    var base = S.state.b; S.state = fill(st, defaults()); S.state.b = base; S.dirty('main', 'mods', 'log', 'aiq'); S.render();
  };
  S.resetAll = function () { var base = S.state.b; S.state = defaults(); S.state.b = base; S.dirty('main', 'mods', 'log', 'aiq'); S.render(); };

  /* ---------- AI (Claude inside the page) ---------- */
  S.ai = { fn: null, st: 'none' };
  S.ai.on = function () { return S.ai.st === 'ok' && S.state.prefs.ai; };
  S.ai.json = async function (prompt, opts) {
    try { return await S.ai.fn.json(prompt, opts || {}); }
    catch (e) { var c = e && e.code; if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].indexOf(c) >= 0) S.ai.st = 'off'; throw e; }
  };
  S.ai.why = function (e) {
    var c = e && e.code;
    if (e && e.human && c !== 'cancelled') return e.human;   // outside Claude the API layer explains its own errors
    return c === 'not_granted' ? 'Claude was not allowed for this page, so grading falls back to self-check.' : c === 'rate_limited' ? 'Claude is rate-limited right now. Try again in a minute, or self-check.' : c === 'cancelled' ? 'Stopped.' : c === 'session_expired' ? 'Your Claude session expired. Sign in again, or self-check.' : c === 'refused' ? 'Claude declined that input. Self-check instead.' : 'Claude could not be reached. Try again, or self-check.';
  };

  /* ---------- activity, time on task, XP, streak, ranks ---------- */
  S.today = function () { var k = S.day(), d = S.state.days[k]; if (!d) { d = S.state.days[k] = { xp: 0, t: {}, a: 0, m: [] }; var ks = Object.keys(S.state.days).sort(); while (ks.length > 420) delete S.state.days[ks.shift()]; } return d; };
  var tk = { kind: null, since: 0, paused: null, last: Date.now() };
  S.trackStart = function (kind) { S.trackStop(); if (!kind) return; tk.kind = kind; tk.since = Date.now(); };
  S.trackStop = function () {
    if (!tk.kind) return;
    var end = Math.min(Date.now(), tk.last + 180000), dt = (end - tk.since) / 1000;
    if (dt > 3) { var d = S.today(); d.t[tk.kind] = (d.t[tk.kind] || 0) + Math.round(dt); S.state.u.log = Date.now(); S.sync.dirty.log = 1; writeLocal(); }
    tk.kind = null;
  };
  S.trackPause = function () { tk.paused = tk.kind; S.trackStop(); };
  S.trackResume = function () { if (tk.paused) { tk.last = Date.now(); S.trackStart(tk.paused); tk.paused = null; } };
  ['pointerdown', 'keydown', 'scroll'].forEach(function (ev) { document.addEventListener(ev, function () { var idle = Date.now() - tk.last > 180000; tk.last = Date.now(); if (idle && tk.kind) tk.since = Date.now(); }, true); });
  setInterval(function () { if (tk.kind && !document.hidden) { var k = tk.kind; S.trackStop(); S.trackStart(k); if (S.cloud && Object.keys(S.sync.dirty).length) flush(); } }, 60000);

  S.RANKS = [{ n: 'Trail Rookie', xp: 0, boss: 0 }, { n: 'Cadet', xp: 1000, boss: 1 }, { n: 'Flight Engineer', xp: 5000, boss: 3 }, { n: 'Flight Director', xp: 15000, boss: 4 }, { n: 'Summiteer', xp: 15000, boss: 6 }];
  S.rank = function () { var r = 0; for (var i = 1; i < S.RANKS.length; i++) { var R = S.RANKS[i]; if (S.state.xp >= R.xp && S.state.boss[R.boss] && S.state.boss[R.boss].at) r = i; else break; } return r; };
  S.markActive = function () {
    var st = S.state.streak, k = S.day(); S.today().a++;
    if (st.last === k) return;
    var gap = st.last ? S.dayNum(k) - S.dayNum(st.last) : 1;
    if (!st.last || gap === 1) { st.n++; st.run = (st.run || 0) + 1; }
    else {
      var missed = gap - 1;
      if (st.n > 0 && st.fuel >= missed) { st.fuel -= missed; st.n++; st.run = 1; S.toast('Missed ' + S.plural(missed, 'launch window') + '. ' + S.plural(missed, 'fuel cell') + ' burned to keep your streak.'); }
      else { if (st.n > 1) S.toast('Streak reset. A new one starts today.'); st.n = 1; st.run = 1; }
    }
    if (st.run >= 7) { st.run = 0; if (st.fuel < 3) { st.fuel++; S.toast('Seven days straight: +1 fuel cell.'); } }
    st.best = Math.max(st.best, st.n); st.last = k;
  };
  S.streakNow = function () { var st = S.state.streak; if (!st.last) return { n: 0, risk: 0 }; var gap = S.dayNum(S.day()) - S.dayNum(st.last); if (gap <= 1) return { n: st.n, risk: 0, done: gap === 0 }; var missed = gap - 1; return st.fuel >= missed ? { n: st.n, risk: missed } : { n: 0, risk: 0, lost: st.n }; };
  S.addXP = function (n, why) {
    if (!n) return; var r0 = S.rank();
    S.state.xp += n; S.today().xp += n; S.markActive();
    S.toast('+' + n + ' XP' + (why ? ' · ' + why : ''), 'xp');
    S.dirty('main', 'log');
    var r1 = S.rank(); if (r1 > r0) S.toast('Rank up: ' + S.RANKS[r1].n, 'xp');
    renderTop();
  };
  S.log = function (e) { e.t = Date.now(); S.state.hist.push(e); if (S.state.hist.length > 400) S.state.hist.splice(0, S.state.hist.length - 400); S.state.u.log = Date.now(); S.sync.dirty.log = 1; };
  S.doneToday = function (id) { var d = S.today(); d.m = d.m || []; if (d.m.indexOf(id) < 0) d.m.push(id); };

  /* ---------- shell ---------- */
  var ICON = {
    today: '<circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    mountain: '<path d="M2.5 19.5l6.5-11 3.5 5.5 2.5-3.5 6.5 9z"/><path d="M7.2 11.7l1.8 1.3 1.7-1.5"/>',
    train: '<path d="M12 2.5c3 2.5 4.5 6 4.5 9.5l-1.8 4h-5.4l-1.8-4c0-3.500 1.500-7 4.500-9.500z"/><circle cx="12" cy="9.500" r="1.700"/><path d="M9.300 16l-2.300 4.500M14.700 16l2.300 4.500M12 16.500v5"/>',
    recap: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
    pack: '<rect x="5.500" y="7.500" width="13" height="13" rx="3"/><path d="M9 7.500V6a3 3 0 016 0v1.500M8.500 13h7M10 13v2.500"/>'
  };
  var TABS = [['today', 'Today'], ['mountain', 'Mountain'], ['train', 'Train'], ['recap', 'Recap'], ['pack', 'Pack']];
  var elTop, elMain, elTabs, elToasts, scrolls = {}, curRoute = null;
  function renderTop() {
    if (!elTop) return;
    var r = S.rank(), R = S.RANKS[r], nx = S.RANKS[r + 1], sn = S.streakNow(), st = S.state.streak;
    var prog = nx ? Math.min(1, (S.state.xp - R.xp) / Math.max(1, nx.xp - R.xp)) : 1;
    var fuel = h('span', { class: 'fuel', title: 'Fuel cells: each covers one missed day' }, [0, 1, 2].map(function (i) { return h('i', { class: i < st.fuel ? 'on' : '' }); }));
    var sc = S.sync.mode === 'cloud' ? (S.sync.err ? 'err' : (S.sync.busy || Object.keys(S.sync.dirty).length ? 'busy' : 'ok')) : '';
    S.put(elTop,
      h('button', { class: 'brand', onclick: function () { S.go('today'); }, 'aria-label': 'SUMMIT home', html: 'SUM<b>M</b>IT' }),
      h('div', { class: 'rank', title: nx ? 'Next rank: ' + nx.n + ' at ' + S.fmt(nx.xp) + ' XP plus the ' + S.PART[nx.boss].camp + ' Boss Exam' : 'Top rank' }, h('div', { class: 'nm' }, R.n), h('div', { class: 'row', style: 'gap:7px;margin-top:4px' }, h('div', { class: 'bar grow' }, h('i', { style: 'width:' + Math.round(prog * 100) + '%' })), h('span', { class: 'xpn' }, S.fmt(S.state.xp) + ' XP'))),
      h('div', { class: 'stat', title: 'Day streak' }, String(sn.n), h('small', null, 'day', h('br'), 'streak')),
      fuel,
      h('span', { class: 'sync ' + sc, title: S.sync.mode === 'cloud' ? (S.sync.err ? 'Not saved to ' + ((window.SUMMIT_HOST && window.SUMMIT_HOST.acc) || 'your account') + ' yet; kept on this device' : 'Saved to ' + ((window.SUMMIT_HOST && window.SUMMIT_HOST.acc) || 'your Claude account')) : 'Saved on this device only' })
    );
  }
  S.renderTop = renderTop;
  function renderTabs(active) {
    elTabs.replaceChildren.apply(elTabs, TABS.map(function (t) {
      var b = h('button', { 'aria-current': t[0] === active ? 'page' : null, onclick: function () { S.go(t[0]); } }, h('span', { html: '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[t[0]] + '</svg>' }), t[1]);
      if (t[0] === 'mountain' && S.E && S.E.dueCount() > 0) b.append(h('span', { class: 'dot', title: 'Reviews due' }));
      return b;
    }));
  }
  S.views = {};
  S.view = function (name, fn, o) { S.views[name] = { fn: fn, tab: (o && o.tab) || name, track: o && o.track }; };
  function parse() {
    var hs = (location.hash || '').replace(/^#/, '') || 'today';
    if (S.views[hs]) return { name: hs, arg: null, key: hs };
    var m = hs.match(/^([a-z]+)-(.+)$/);
    if (m && S.views[m[1] + '-']) return { name: m[1] + '-', arg: m[2], key: hs };
    return { name: 'today', arg: null, key: 'today' };
  }
  S.render = function (keep) {
    if (!elMain) return;
    var r = parse(), v = S.views[r.name];
    if (curRoute) scrolls[curRoute] = elMain.scrollTop;
    var same = curRoute === r.key; curRoute = r.key;
    S.closeSheet(true);
    var node;
    try { node = v.fn(r.arg); } catch (e) { console.error(e); node = h('div', { class: 'card warn' }, h('h3', null, 'This screen hit an error'), h('p', { class: 'small muted' }, String(e && e.message || e)), h('button', { class: 'btn', onclick: function () { S.go('today'); } }, 'Back to Today')); }
    elMain.replaceChildren(node);
    S.math(elMain);
    elMain.scrollTop = (same || keep) ? (scrolls[r.key] || 0) : (S.keepScroll && scrolls[r.key]) || 0;
    S.keepScroll = false;
    renderTop(); renderTabs(v.tab);
    S.trackStart(typeof v.track === 'function' ? v.track(r.arg) : v.track);
    if (S.afterRender) { var f = S.afterRender; S.afterRender = null; f(elMain); }
  };
  S.go = function (hash) { if ((location.hash || '#today') === '#' + hash) S.render(); else location.hash = hash; };
  S.back = function (fallback) { if (history.length > 1) history.back(); else S.go(fallback || 'today'); };
  S.main = function () { return elMain; };
  window.addEventListener('hashchange', function () { S.render(); });

  var sheetEl = null, sheetClose = null;
  S.sheet = function (content, onclose) {
    S.closeSheet(true);
    var sh = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'grip' }), content);
    sheetEl = h('div', { class: 'scrim', onclick: function (e) { if (e.target === sheetEl) S.closeSheet(); } }, sh);
    sheetClose = onclose || null;
    document.getElementById('app').append(sheetEl); S.math(sh);
    return sh;
  };
  S.closeSheet = function (silent) { if (sheetEl) { sheetEl.remove(); sheetEl = null; var f = sheetClose; sheetClose = null; if (f && !silent) f(); } };
  S.ask = function (title, body, actions) {
    var c = h('div', { class: 'col gap14' }, h('h3', null, title), typeof body === 'string' ? h('p', { class: 'small', html: body }) : body,
      h('div', { class: 'col' }, actions.map(function (a) { return h('button', { class: 'btn ' + (a.cls || ''), onclick: function () { S.closeSheet(true); if (a.fn) a.fn(); } }, a.label); })));
    return S.sheet(c);
  };
  S.toast = function (msg, kind) {
    if (!elToasts) return;
    var t = h('div', { class: 'toast ' + (kind || ''), role: 'status' }); t.innerHTML = kind === 'xp' ? msg.replace(/^(\+\d+ XP)/, '<b>$1</b>') : S.esc(msg);
    elToasts.append(t); while (elToasts.children.length > 3) elToasts.firstChild.remove();
    setTimeout(function () { t.remove(); }, kind === 'xp' ? 2600 : 4200);
  };

  /* ---------- topographic background (periodic height field, marching squares) ---------- */
  function topo() {
    try {
      var n = 72, sz = 432, c = document.createElement('canvas'); c.width = c.height = sz; var x = c.getContext('2d'), s = sz / n, TAU = Math.PI * 2;
      var f = function (i, j) { var u = i / n * TAU, v = j / n * TAU; return Math.sin(u + 1.3 * Math.sin(v)) + 0.8 * Math.cos(2 * v + 0.7 * Math.sin(u)) + 0.5 * Math.sin(u + v) * Math.cos(2 * u - v) + 0.3 * Math.cos(3 * u + 2 * v); };
      var g = []; for (var i = 0; i <= n; i++) { g.push([]); for (var j = 0; j <= n; j++) g[i].push(f(i % n, j % n)); }
      var li = 0;
      for (var L = -2.1; L <= 2.2; L += 0.3, li++) {
        x.beginPath();
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
          var a = g[i][j], b = g[i + 1][j], cc = g[i + 1][j + 1], d = g[i][j + 1], pts = [];
          if ((a < L) !== (b < L)) pts.push([i + (L - a) / (b - a), j]);
          if ((b < L) !== (cc < L)) pts.push([i + 1, j + (L - b) / (cc - b)]);
          if ((d < L) !== (cc < L)) pts.push([i + (L - d) / (cc - d), j + 1]);
          if ((a < L) !== (d < L)) pts.push([i, j + (L - a) / (d - a)]);
          for (var k = 0; k + 1 < pts.length; k += 2) { x.moveTo(pts[k][0] * s, pts[k][1] * s); x.lineTo(pts[k + 1][0] * s, pts[k + 1][1] * s); }
        }
        x.strokeStyle = li % 4 === 0 ? 'rgba(140,176,186,0.13)' : 'rgba(140,176,186,0.065)'; x.lineWidth = li % 4 === 0 ? 1.3 : 1; x.stroke();
      }
      document.body.style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    } catch (e) { /* decoration only */ }
  }

  /* ---------- boot ---------- */
  S.boot = function () {
    var app = document.getElementById('app');
    elTop = h('header', { class: 'top' }); elMain = h('main', { id: 'main', tabindex: '-1' }); elTabs = h('nav', { class: 'tabs', 'aria-label': 'Sections' }); elToasts = h('div', { class: 'toasts', 'aria-live': 'polite' });
    app.replaceChildren(elTop, elMain, elTabs, elToasts);
    var loc = readLocal(); if (loc) S.state = loc;
    prefSig = sigPrefs();
    topo();
    S.render();
    initCloud();
    window.addEventListener('pagehide', function () { S.trackStop(); if (S.cloud) flush(); });
  };
})();
