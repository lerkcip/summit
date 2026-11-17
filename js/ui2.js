/* SUMMIT · views: Today's Expedition, Train hub, weekly Recap, Pack (settings, backup, reference), prerequisite graph */
(function () {
  'use strict';
  var S = window.S, h = S.h, E = S.E, CH = S.CH, CUR = S.CUR;
  S.MODS = {};                         // modules register {name, tag, go, summary(), plan(mins), task(mins)}

  /* ---------- Today's Expedition ---------- */
  function buildPlan(mins) {
    var items = [], due = E.due(), n = E.next();
    due.slice(0, mins <= 30 ? 1 : mins <= 60 ? 2 : 4).forEach(function (m) { items.push({ id: 'review' + m, ic: '↻', t: 'Rebuild the cairn at Ch ' + m, s: S.LBL[m] + ' · integrity ' + S.pct(E.integrity(m)) + ' · 4 questions', m: 5, act: ['review', m] }); });
    if (n) {
      var c = CH[n], r = E.peek(n), unread = c.secs.filter(function (s) { return !r.read[s.id]; });
      var quiz = { id: 'quiz' + n, ic: '✎', t: 'Take Quiz ' + n, s: S.LBL[n] + ' · ' + c.quiz.length + ' questions · 80% to pass, explain each miss', m: 15, act: ['quiz', n] };
      if (unread.length) {
        var cap = mins <= 30 ? 14 : mins <= 60 ? 26 : 50, take = [], tm = 0;
        for (var i = 0; i < unread.length; i++) { var sm = Math.max(1, Math.round(unread[i].w / 95)); if (take.length && tm + sm > cap) break; take.push(unread[i]); tm += sm; }
        var a = take[0], b = take[take.length - 1];
        items.push({ id: 'read' + n, ic: '§', t: 'Read Ch ' + n + ' §' + a.id + (take.length > 1 ? '–' + b.id : ''), s: (a.page === b.page ? 'p. ' + a.page : 'pp. ' + a.page + '–' + b.page) + ' in your doc · ' + S.LBL[n], m: Math.max(4, tm), go: S.readHash(a.id) });
        if (take.length === unread.length && mins >= 60) items.push(quiz);
      } else items.push(quiz);
    } else {
      var bp = CUR.parts.filter(function (p) { return E.bossReady(p.n) && !E.bossPassed(p.n); })[0];
      if (bp) items.push({ id: 'boss' + bp.n, ic: '⚑', t: bp.camp + ' Boss Exam', s: 'Mixed exam across Part ' + bp.roman + ' · pass at 80%', m: 40, act: ['boss', bp.n] });
    }
    var dn = S.dayNum(S.day());
    var ch = ['launch', 'hover', 'shop'].map(function (k) { return S.MODS[k] && S.MODS[k].plan ? S.MODS[k].plan(mins) : null; }).filter(Boolean);
    var pick = ch.length ? ch[dn % ch.length] : null; if (pick) items.push(pick);
    if (mins >= 120 && ch.length > 1) items.push(ch[(dn + 1) % ch.length]);          // a long block takes a second module challenge
    var tasks = ['career', 'shop'].map(function (k) { return S.MODS[k] && S.MODS[k].task ? S.MODS[k].task(mins) : null; }).filter(function (t) { return t && !items.some(function (x) { return x.id === t.id; }); });
    if (tasks.length) { if (mins >= 120) tasks.forEach(function (t) { items.push(t); }); else items.push(tasks[dn % tasks.length]); }
    return items;
  }
  function plan() {
    var p = S.state.plan, k = S.day(), mins = S.state.prefs.mins, done = S.today().m || [];
    if (p && p.items.some(function (it) { var m = /^(read|quiz)(\d+)$/.exec(it.id); return m && E.mastered(+m[2]) && done.indexOf(it.id) < 0; })) p = null;   // a leg for a chapter since mastered
    if (!p || p.day !== k || p.mins !== mins) { p = S.state.plan = { day: k, mins: mins, items: buildPlan(mins) }; S.dirty('main'); }
    return p;
  }
  S.view('today', function () {
    var st = S.state, mins = st.prefs.mins, p = plan(), done = S.today().m || [], q = st.quiz, sn = S.streakNow(), out = [];
    var d = new Date(), date = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    var total = p.items.reduce(function (a, x) { return a + x.m; }, 0), nd = p.items.filter(function (x) { return done.indexOf(x.id) >= 0; }).length;
    var setM = function (m) { st.prefs.mins = m; st.plan = null; S.dirty('main'); S.render(true); };
    out.push(h('div', { class: 'card hero' }, h('div', { class: 'eyebrow' }, date), h('h1', null, 'Today’s Expedition'),
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Time available today' }, [[30, '30 min'], [60, '1 hour'], [120, '2+ hours']].map(function (o) { return h('button', { 'aria-pressed': String(mins === o[0]), onclick: function () { setM(o[0]); } }, o[1]); })),
      h('p', { class: 'small muted' }, p.items.length ? nd + ' of ' + p.items.length + ' legs done · about ' + total + ' min planned' : 'Nothing is open right now. Check the mountain for what is locked and why.')));
    if (q && q.phase !== 'done') out.push(h('div', { class: 'card warn' }, h('div', { class: 'row' }, h('div', { class: 'grow' }, h('h3', null, (q.phase === 'answer' ? 'Resume ' : 'Finish ') + E.title(q)), h('p', { class: 'small muted' }, q.phase === 'answer' ? 'Question ' + (q.i + 1) + ' of ' + q.items.length + ' · answers saved' : q.phase === 'self' ? 'Written answers still need checking' : (q.pass && q.kind === 'quiz' && !E.mastered(q.ch) ? 'Passed at ' + S.pct(q.score) + '. Explain your misses to master the chapter.' : 'Results are waiting.'))), h('button', { class: 'btn go sm', onclick: function () { S.go('quiz'); } }, 'Open'))));
    if (sn.risk) out.push(h('div', { class: 'card warn' }, h('h3', null, S.plural(sn.risk, 'launch window') + ' missed'), h('p', { class: 'small' }, 'Do any leg today and ' + S.plural(sn.risk, 'fuel cell') + ' will cover the gap, keeping your ' + sn.n + '-day streak.')));
    else if (sn.lost) out.push(h('div', { class: 'card' }, h('h3', null, 'A new streak starts today'), h('p', { class: 'small muted' }, 'The last one reached ' + sn.lost + ' days and ran out of fuel cells. One leg today starts the next.')));
    if (p.items.length) out.push(h('div', { class: 'card' }, h('div', { class: 'row' }, h('h3', { class: 'grow' }, 'The plan'), h('button', { class: 'btn ghost sm', onclick: function () { st.plan = null; S.dirty('main'); S.render(true); } }, 'Rebuild')),
      h('div', { class: 'list' }, p.items.map(function (it) {
        var isDone = done.indexOf(it.id) >= 0;
        return h('button', { class: 'item' + (isDone ? ' done' : ''), onclick: function () { if (it.act) E.start(it.act[0], it.act[1]); else S.go(it.go); } }, h('span', { class: 'ic' }, isDone ? '✓' : it.ic), h('span', { class: 'grow' }, h('div', { class: 'ttl' }, it.t), h('div', { class: 'sub' }, it.s)), h('span', { class: 'tiny muted num' }, it.m + ' min'), h('span', { class: 'chev' }, '›'));
      }))));
    if (p.items.length && nd === p.items.length) out.push(h('div', { class: 'card' }, h('h3', null, 'Every leg done'), h('p', { class: 'small muted' }, 'More time today? Plan the next leg from where you now stand.'), h('button', { class: 'btn go', onclick: function () { st.plan = null; S.dirty('main'); S.render(true); } }, 'Plan the next leg')));
    var n = E.next(), m = E.masteredCount();
    out.push(h('div', { class: 'card' }, h('div', { class: 'row' }, h('h3', { class: 'grow' }, 'On the trail'), h('span', { class: 'pill' }, m + ' / 54 mastered')),
      n ? h('button', { class: 'item', style: 'padding:6px 2px', onclick: function () { S.go('ch-' + n); } }, h('span', { class: 'ic', style: 'color:var(--glow)' }, String(n)), h('span', { class: 'grow' }, h('div', { class: 'ttl' }, 'Next waypoint: ' + S.LBL[n]), h('div', { class: 'sub' }, E.secRange(n) + ' · ' + E.pages(n) + ' · ' + E.readCount(n) + '/' + CH[n].secs.length + ' sections read')), h('span', { class: 'chev' }, '›')) : h('p', { class: 'small muted' }, m >= 54 ? 'Every chapter mastered. Reviews keep the cairns standing; they come due here.' : 'No open chapter. A Boss Exam or a locked prerequisite is next: see the mountain.'),
      h('div', { class: 'col gap4' }, CUR.parts.map(function (P) { var k = P.ch.filter(E.mastered).length; return h('div', { class: 'hbar' }, h('span', { class: 'tiny muted' }, P.camp.split(' · ')[0]), h('div', { class: 'bar ' + (E.bossPassed(P.n) ? 'moss' : '') }, h('i', { style: 'width:' + Math.round(k / P.ch.length * 100) + '%' })), h('span', { class: 'v tiny' }, k + '/' + P.ch.length)); }))));
    var due = E.due();
    if (due.length) out.push(h('div', { class: 'card warn' }, h('h3', null, S.plural(due.length, 'cairn') + ' crumbling'), h('p', { class: 'small muted' }, 'Mastered chapters erode on a spaced schedule. A 4-question review rebuilds each one.'), h('div', { class: 'row wrap' }, due.slice(0, 8).map(function (x) { return h('button', { class: 'btn sm', onclick: function () { E.start('review', x); } }, 'Ch ' + x + ' · ' + S.pct(E.integrity(x))); }))));
    if (!m && !st.xp) out.push(h('div', { class: 'card' }, h('h3', null, 'How the climb works'), h('p', { class: 'small' }, 'Every waypoint is a chapter of your doc. A chapter opens only when the chapters it builds on are mastered: 80% on its quiz and an explanation of every miss. Know it already? Take a challenge exam and test out at 90%.'), h('button', { class: 'btn', onclick: function () { S.go('pack'); } }, 'All the rules')));
    return h('div', { class: 'col gap14' }, out);
  }, { tab: 'today' });

  /* ---------- Train hub ---------- */
  S.view('train', function () {
    var order = ['launch', 'hover', 'shop', 'career'];
    return h('div', { class: 'col gap14' }, h('div', null, h('h2', null, 'Train'), h('p', { class: 'small muted' }, 'Four modules, all gated by the mountain. Each level lists the chapters it stands on.')),
      order.map(function (k) {
        var M = S.MODS[k]; if (!M) return null; var s = M.summary();
        return h('div', { class: 'card' }, h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, M.tag), h('h3', { style: 'margin-top:4px' }, M.name)), s.pill ? h('span', { class: 'pill ' + (s.pillCls || '') }, s.pill) : null),
          h('p', { class: 'small' }, s.line), s.lock ? S.lockBox(s.lock) : null,
          h('button', { class: 'btn ' + (s.open ? 'go' : ''), onclick: function () { S.go(M.go); } }, s.open ? 'Open ' + M.name : 'See what unlocks it'));
      }));
  }, { tab: 'train' });

  /* ---------- weekly Recap ---------- */
  var KINDS = [['read', 'Reading'], ['quiz', 'Quizzes'], ['launch', 'Launch Window'], ['hover', 'Hoverslam'], ['shop', 'Shop'], ['career', 'Career']];
  var recapOff = 0;
  function nextWhy() {
    return E.open().map(function (n) {
      var deps = E.dependents(n), now = deps.filter(function (d) { var ms = E.missing(d); return ms.length === 1 && ms[0] === n && !E.gate(d); });
      var mods = S.MODREQ.filter(function (m) { return (m.req.ch || []).indexOf(n) >= 0 && !E.reqMet(m.req); }), last = mods.filter(function (m) { var ms = E.reqMissing(m.req); return ms.length === 1 && ms[0] === n; });
      var why = [];
      if (now.length) why.push('opens ' + E.list(now.slice(0, 4).map(function (d) { return 'Ch ' + d; })) + ' at once');
      if (last.length) why.push('is the last lock on ' + E.list(last.slice(0, 2).map(function (m) { return m.name; })));
      else if (mods.length) why.push('is needed for ' + E.list(mods.slice(0, 2).map(function (m) { return m.name; })));
      if (!why.length && deps.length) why.push(S.plural(deps.length, 'later chapter') + ' build on it');
      if (!why.length) why.push('completes ' + S.PART[CH[n].part].camp);
      return { n: n, score: 4 * now.length + 5 * last.length + 1.5 * mods.length + deps.length * 0.5 + (S.state.prefs.focus === n ? 50 : 0) - n * 0.02, why: why.join('; ') };
    }).sort(function (a, b) { return b.score - a.score; });
  }
  S.nextWhy = nextWhy;
  S.view('recap', function () {
    var start = S.dayAdd(S.weekStart(), -7 * recapOff), keys = [], st = S.state, xp = 0, t = {}, tot = 0, active = 0;
    for (var i = 0; i < 7; i++) keys.push(S.dayAdd(start, i));
    keys.forEach(function (k) { var d = st.days[k]; if (!d) return; xp += d.xp || 0; if (d.a) active++; Object.keys(d.t || {}).forEach(function (kd) { t[kd] = (t[kd] || 0) + d.t[kd]; tot += d.t[kd]; }); });
    var t0 = new Date(start.split('-')[0], start.split('-')[1] - 1, start.split('-')[2]).getTime(), t1 = t0 + 7 * 864e5;
    var hist = st.hist.filter(function (e) { return e.t >= t0 && e.t < t1; });
    var mastered = hist.filter(function (e) { return e.k === 'master'; }).map(function (e) { return e.ch; });
    var quizzes = hist.filter(function (e) { return e.k === 'quiz' || e.k === 'challenge' || e.k === 'boss' || e.k === 'review'; });
    var maxT = Math.max.apply(null, KINDS.map(function (k) { return t[k[0]] || 0; }).concat([1]));
    var weak = CUR.chapters.filter(function (c) { return E.mastered(c.n); }).map(function (c) { return { n: c.n, ig: E.integrity(c.n), miss: st.miss[c.n] || 0, used: E.dependents(c.n).filter(function (d) { return E.status(d) === 'open'; }).length }; })
      .sort(function (a, b) { return (a.ig - 0.12 * a.miss - 0.03 * a.used) - (b.ig - 0.12 * b.miss - 0.03 * b.used); }).slice(0, 4);
    var nw = nextWhy().slice(0, 3), today = S.day();
    var fmtD = function (k) { var p = k.split('-'); return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); };
    return h('div', { class: 'col gap14' },
      h('div', { class: 'row' }, h('div', { class: 'grow' }, h('h2', null, 'Weekly recap'), h('p', { class: 'small muted' }, fmtD(keys[0]) + ' – ' + fmtD(keys[6]) + (recapOff ? '' : ' · this week'))), h('button', { class: 'btn sm ghost', 'aria-label': 'Previous week', onclick: function () { recapOff++; S.render(); } }, '‹'), h('button', { class: 'btn sm ghost', 'aria-label': 'Next week', disabled: recapOff === 0, onclick: function () { recapOff--; S.render(); } }, '›')),
      h('div', { class: 'stat3' }, h('div', null, h('b', null, String(mastered.length)), h('span', null, 'chapters mastered')), h('div', null, h('b', null, S.fmt(xp)), h('span', null, 'XP earned')), h('div', null, h('b', null, tot >= 3600 ? (tot / 3600).toFixed(1) + ' h' : (tot ? Math.max(1, Math.round(tot / 60)) : 0) + ' m'), h('span', null, 'time on task'))),
      h('div', { class: 'card' }, h('div', { class: 'row' }, h('h3', { class: 'grow' }, 'Days on the trail'), h('span', { class: 'pill' }, active + ' of 7')),
        h('div', { class: 'row', style: 'gap:6px' }, keys.map(function (k) { var d = st.days[k], on = d && d.a; return h('div', { style: 'flex:1;text-align:center' }, h('div', { style: 'height:30px;border-radius:7px;border:1px solid var(--ridge);background:' + (on ? 'color-mix(in srgb, var(--moss) 45%, var(--scarp))' : k > today ? 'transparent' : 'var(--scarp)') }), h('div', { class: 'tiny muted', style: 'margin-top:3px' }, 'MTWTFSS'[keys.indexOf(k)])); })),
        mastered.length ? h('p', { class: 'small' }, 'Mastered: ' + E.list(mastered.map(function (n) { return 'Ch ' + n + ' ' + S.LBL[n]; })) + '.') : h('p', { class: 'small muted' }, 'No chapter mastered in this week.'),
        quizzes.length ? h('p', { class: 'small muted' }, S.plural(quizzes.length, 'quiz or exam') + ' taken, average ' + S.pct(quizzes.reduce(function (a, e) { return a + e.sc; }, 0) / quizzes.length) + '.') : null),
      h('div', { class: 'card' }, h('h3', null, 'Time on task'), tot ? h('div', { class: 'col gap4' }, KINDS.map(function (k) { var v = t[k[0]] || 0; return h('div', { class: 'hbar' }, h('span', { class: 'tiny' }, k[1]), h('div', { class: 'bar ice' }, h('i', { style: 'width:' + Math.round(v / maxT * 100) + '%' })), h('span', { class: 'v tiny' }, v ? Math.max(1, Math.round(v / 60)) + ' m' : '–')); })) : h('p', { class: 'small muted' }, 'No time logged in this week yet. Time counts while a reading, quiz or module screen is open and you are active.')),
      h('div', { class: 'card' }, h('h3', null, 'Weakest prerequisites'), weak.length ? h('div', { class: 'list' }, weak.map(function (w) { return h('button', { class: 'item', style: 'padding:9px 2px', onclick: function () { S.go('ch-' + w.n); } }, h('span', { class: 'ic', style: w.ig < E.THRESH ? 'color:var(--amber)' : '' }, String(w.n)), h('span', { class: 'grow' }, h('div', { class: 'ttl small' }, S.LBL[w.n]), h('div', { class: 'sub' }, 'integrity ' + S.pct(w.ig) + (w.miss ? ' · sent back here ' + S.plural(w.miss, 'time') : '') + (w.used ? ' · ' + S.plural(w.used, 'open chapter') + ' lean on it' : ''))), h('span', { class: 'chev' }, '›')); })) : h('p', { class: 'small muted' }, 'No cairns yet. Once chapters are mastered, the ones eroding fastest and the ones later quizzes sent you back to will be listed here.')),
      h('div', { class: 'card' }, h('h3', null, 'What to study next, and why'), nw.length ? h('div', { class: 'list' }, nw.map(function (x) { return h('button', { class: 'item', style: 'padding:9px 2px', onclick: function () { S.go('ch-' + x.n); } }, h('span', { class: 'ic', style: 'color:var(--glow)' }, String(x.n)), h('span', { class: 'grow' }, h('div', { class: 'ttl small' }, CH[x.n].t), h('div', { class: 'sub' }, 'Mastering it ' + x.why + '.')), h('span', { class: 'chev' }, '›')); })) : h('p', { class: 'small muted' }, 'No chapter is open. Look for a Boss Exam on the mountain.')));
  }, { tab: 'recap' });

  /* ---------- Pack ---------- */
  function backupCard() {
    var area = h('textarea', { class: 'code hide', id: 'bk', 'aria-label': 'Backup text', style: 'min-height:120px' });
    var file = h('input', { type: 'file', accept: '.json,application/json', id: 'bkfile', class: 'hide', 'aria-label': 'Backup file', onchange: function () { var f = file.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { restore(String(rd.result)); }; rd.readAsText(f); file.value = ''; } });
    function restore(txt) { S.ask('Replace all progress with this backup?', 'Everything now in SUMMIT is overwritten by the backup file.', [{ label: 'Restore the backup', cls: 'danger', fn: function () { try { S.importJSON(txt); S.toast('Backup restored.'); } catch (e) { S.toast(e.message || 'That file could not be read.'); } } }, { label: 'Cancel' }]); }
    return h('div', { class: 'card' }, h('h3', null, 'Backup'), h('p', { class: 'small muted' }, S.sync.mode === 'cloud' ? 'Progress saves to ' + ((window.SUMMIT_HOST && window.SUMMIT_HOST.acc) || 'your Claude account') + ' as you go and follows you across devices. A JSON backup is a second copy you hold.' : 'Progress is saved in this browser only right now. Export a JSON backup to keep a copy.'),
      h('div', { class: 'grid2' },
        h('button', { class: 'btn', onclick: async function () {
          var txt = S.exportJSON();
          if (S.dl) { try { await S.dl.save({ filename: 'summit-backup-' + S.day() + '.json', data: txt }); S.toast('Backup saved.'); return; } catch (e) { if (e && e.code === 'declined') return; } }
          area.value = txt; area.classList.remove('hide'); copy.classList.remove('hide'); S.toast('Copy the text below and keep it somewhere safe.');
        } }, 'Export JSON'),
        h('button', { class: 'btn', onclick: function () { file.click(); } }, 'Import JSON')),
      file, area,
      (function () { copy = h('button', { class: 'btn sm hide', onclick: function () { area.select(); try { navigator.clipboard.writeText(area.value).then(function () { S.toast('Copied.'); }, function () { S.toast('Select the text and copy it by hand.'); }); } catch (e) { S.toast('Select the text and copy it by hand.'); } } }, 'Copy backup text'); return copy; })(),
      h('details', null, h('summary', { class: 'small muted', style: 'cursor:pointer' }, 'Restore from pasted text'), (function () { var ta = h('textarea', { class: 'code', id: 'bkpaste', 'aria-label': 'Paste backup text', style: 'min-height:90px;margin-top:8px', placeholder: 'Paste a SUMMIT backup here' }); return h('div', { class: 'col' }, ta, h('button', { class: 'btn sm', onclick: function () { if (ta.value.trim()) restore(ta.value); } }, 'Restore from this text')); })()));
  }
  var copy;
  S.view('pack', function () {
    var st = S.state, ac = E.autoCount(), aiSt = S.ai.st;
    return h('div', { class: 'col gap14' }, h('h2', null, 'Pack'),
      h('div', { class: 'card' }, h('h3', null, 'Grading'),
        h('p', { class: 'small' }, ac[0] + ' of the doc’s ' + ac[1] + ' quiz questions are number-checked instantly with a tolerance. The written ones, and your explanations of misses, are graded ' + (S.ai.on() ? 'by Claude inside this page, on your own Claude usage.' : 'by you against the Appendix J key.')),
        h('div', { class: 'seg', role: 'group', 'aria-label': 'Who grades written answers' }, h('button', { 'aria-pressed': String(st.prefs.ai), disabled: aiSt === 'none', onclick: function () { st.prefs.ai = true; if (S.ai.st === 'off') S.ai.st = 'ok'; S.dirty('main'); S.render(true); } }, 'Claude grades'), h('button', { 'aria-pressed': String(!st.prefs.ai), onclick: function () { st.prefs.ai = false; S.dirty('main'); S.render(true); } }, 'I grade myself')),
        aiSt === 'none' ? h('p', { class: 'tiny muted' }, (window.SUMMIT_HOST ? 'Add a Claude API key below to have Claude grade written answers; until then you self-check them.' : 'Claude is not available in this view of the page, so written answers are self-checked here.')) : aiSt === 'off' ? h('p', { class: 'tiny', style: 'color:var(--amber)' }, 'Claude was declined or is unavailable for this visit. Written answers are self-checked until you allow it.') : null),
      window.SUMMIT_WEB ? window.SUMMIT_WEB.cards() : null,
      backupCard(),
      h('div', { class: 'card' }, h('h3', null, 'The rules of the mountain'), h('div', { class: 'doc', style: 'font-size:14.5px' },
        h('p', null, h('strong', null, 'Locks. '), 'A chapter opens when every chapter in its “Builds on” list is mastered. You may scout one camp ahead: a chapter in Part III or higher also needs the Boss Exam two Parts below it.'),
        h('p', null, h('strong', null, 'Mastery. '), 'Score ≥80% on the chapter quiz and explain each missed item. The first attempt is the doc’s own quiz; retakes use fresh numbers and fresh written questions.'),
        h('p', null, h('strong', null, 'Challenge exam. '), 'Any open chapter can be tested out of with ≥90% on ten mixed questions. A miss locks the challenge for 12 hours; the regular quiz stays open.'),
        h('p', null, h('strong', null, 'Erosion. '), 'Each mastered chapter has a predicted recall that decays. Under 80% its cairn crumbles and a 4-question review (pass at 75%) rebuilds it. Review gaps grow: 3, 7, 17, 41, 98 days and on. A crumbling prerequisite warns you but never re-locks anything.'),
        h('p', null, h('strong', null, 'Integrative misses. '), 'Miss an [I: Ch x] question and you are sent back to Chapter x, and its cairn is marked crumbling.'),
        h('p', null, h('strong', null, 'Streak and fuel. '), 'One streak for everything. Any finished leg counts for the day. A missed day burns a fuel cell instead of the streak; seven days in a row earns one back, to a maximum of three.'),
        h('p', null, h('strong', null, 'Ranks. '), 'Cadet: 1,000 XP and the Basecamp Boss. Flight Engineer: 5,000 XP and the Camp 2 Boss. Flight Director: 15,000 XP and the Camp 3 Boss. Summiteer: the Summit exam.'))),
      h('div', { class: 'card' }, h('h3', null, 'From your doc'), h('div', { class: 'list' },
        h('button', { class: 'item', style: 'padding:9px 2px', onclick: function () { S.go('graph'); } }, h('span', { class: 'ic' }, '⌥'), h('span', { class: 'grow' }, h('div', { class: 'ttl small' }, 'Prerequisite graph'), h('div', { class: 'sub' }, 'Every “Builds on” list as parsed')), h('span', { class: 'chev' }, '›')),
        h('button', { class: 'item', style: 'padding:9px 2px', onclick: function () { S.go('ap-pre'); } }, h('span', { class: 'ic' }, 'i'), h('span', { class: 'grow' }, h('div', { class: 'ttl small' }, 'Preface: How to Use This Document')), h('span', { class: 'chev' }, '›')),
        CUR.appendices.filter(function (a) { return a.id !== 'J'; }).map(function (a) { return h('button', { class: 'item', style: 'padding:9px 2px', onclick: function () { S.go('ap-' + a.id); } }, h('span', { class: 'ic' }, a.id), h('span', { class: 'grow' }, h('div', { class: 'ttl small' }, a.t), h('div', { class: 'sub' }, 'p. ' + a.page)), h('span', { class: 'chev' }, '›')); }))),
      h('div', { class: 'card' }, h('h3', null, 'Start over'), h('p', { class: 'small muted' }, 'Erases every chapter, score, streak and module result. Export a backup first if you might want it back.'), h('button', { class: 'btn danger', onclick: function () { S.ask('Erase all progress?', 'This cannot be undone without a backup.', [{ label: 'Erase everything', cls: 'danger', fn: function () { S.resetAll(); S.toast('Progress erased.'); } }, { label: 'Cancel' }]); } }, 'Erase all progress')));
  }, { tab: 'pack' });

  /* ---------- parsed prerequisite graph ---------- */
  S.view('graph', function () {
    return h('div', { class: 'col gap14' }, h('div', { class: 'row' }, S.backBtn('Pack', 'pack')), h('div', null, h('h2', null, 'Prerequisite graph'), h('p', { class: 'small muted' }, 'Parsed from each chapter’s “Builds on” box. All 54 rows match the prerequisite map in Appendix I.3. A chapter is locked until every chapter listed is mastered.')),
      h('div', { class: 'tw' }, h('table', null, h('thead', null, h('tr', null, h('th', null, 'Ch'), h('th', null, 'Title'), h('th', null, 'Builds on'), h('th', null, 'Status'))),
        h('tbody', null, CUR.chapters.map(function (c) { return h('tr', { style: 'cursor:pointer', onclick: function () { S.go('ch-' + c.n); } }, h('td', { class: 'num' }, String(c.n)), h('td', null, S.LBL[c.n]), h('td', null, c.buildsText === 'none' ? 'None' : c.buildsText.replace(/^Chapters? /, '')), h('td', null, S.pillFor(E.status(c.n)))); })))));
  }, { tab: 'pack' });
})();
