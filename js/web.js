/* SUMMIT · running outside Claude. Inside Claude's artifact viewer window.claude already exists and this file does nothing.
   Anywhere else (GitHub Pages, a local server) it supplies the four things the app asks Claude's runtime for:
     db         progress as JSON files in a private GitHub repo of yours, through the GitHub API and a fine-grained token
     user       a fixed id (the repo is yours alone)
     sample     Claude through the Anthropic Messages API with your own key (optional; the AI parts stay off without one)
     downloads  an ordinary browser download
   The token and the key stay in this browser's storage and are sent only to api.github.com and api.anthropic.com. */
(function () {
  'use strict';
  if (window.claude) return;
  var P = 'summit.web.', T = window.SUMMIT_TEST_API || {}, GH = T.github || 'https://api.github.com', AN = T.anthropic || 'https://api.anthropic.com';
  var MODELS = { quick: 'claude-haiku-5-5', 'default': 'claude-sonnet-5-5', complex: 'claude-opus-5-5' };
  var TIER = { 'claude-haiku-5-5': 'quick', 'claude-sonnet-5-5': 'default', 'claude-opus-5-5': 'complex' };
  var NAME = { 'claude-haiku-5-5': 'Claude Haiku 5.5', 'claude-sonnet-5-5': 'Claude Sonnet 5.5', 'claude-opus-5-5': 'Claude Opus 5.5' };
  var mem = {}, W = { lastGh: '', lastAi: '' };
  function load(k) { try { var v = localStorage.getItem(P + k); return v ? JSON.parse(v) : null; } catch (e) { return mem[k] || null; } }
  function keep(k, v) { mem[k] = v; try { if (v == null) localStorage.removeItem(P + k); else localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { /* private mode: this visit only */ } }
  function bad(code, human, text) { var e = { code: code, message: human, human: human }; if (text) e.text = text; return e; }

  /* ---------- progress: one JSON file per document, in progress/ of a private repo ---------- */
  function b64(s) { var u = new TextEncoder().encode(s), out = '', i; for (i = 0; i < u.length; i += 0x8000) out += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(out); }
  function unb64(s) { var b = atob(String(s).replace(/\s/g, '')), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new TextDecoder().decode(u); }
  function gh(cfg, path, o) {
    o = o || {};
    var hd = { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + cfg.token };
    if (o.body) hd['Content-Type'] = 'application/json';
    return fetch(GH + path, { method: o.method || 'GET', headers: hd, body: o.body, cache: 'no-store', keepalive: !!o.keepalive })
      .catch(function () { throw bad('unavailable', 'GitHub could not be reached. Progress is kept on this device and saved when the connection is back.'); });
  }
  async function ghErr(r, repo) {
    var m = ''; try { m = (await r.json()).message || ''; } catch (e) { m = ''; }
    if (r.status === 401) return bad('permission_denied', 'GitHub rejected the access token: it has expired or was revoked. Make a new one and connect again here.');
    if (r.status === 429 || (r.status === 403 && (r.headers.get('x-ratelimit-remaining') === '0' || /rate limit/i.test(m)))) return bad('resource_exhausted', 'GitHub asked SUMMIT to slow down. Saving resumes in a minute.');
    if (r.status === 403 || r.status === 404) return bad('permission_denied', 'The token cannot write to ' + repo + '. It needs access to that repository with Contents set to “Read and write”.');
    if (r.status === 409 && /empty/i.test(m)) return bad('permission_denied', repo + ' has no commits yet. On GitHub, add a README to it, then connect again.');
    if (r.status === 409 || r.status === 422) return bad('unavailable', 'Another device saved at the same moment. SUMMIT will merge and save again.');
    return bad('unavailable', 'GitHub had a problem (' + r.status + '). SUMMIT will try again.');
  }
  function snap(d) { return { exists: d != null, data: function () { return d; } }; }
  var chain = Promise.resolve();
  function serial(fn) { var p = chain.then(fn, fn); chain = p.catch(function () { }); return p; }   // one write at a time: GitHub commits to a branch one by one
  function db() {
    var cfg = load('gh'); if (!cfg || !cfg.repo || !cfg.token) return null;
    var sha = {}, base = '/repos/' + cfg.repo + '/contents/progress/';
    var note = function (p) { return p.then(function (v) { W.lastGh = ''; return v; }, function (e) { W.lastGh = (e && e.human) || 'Saving to GitHub failed.'; throw e; }); };
    return {
      doc: function (path) {
        var name = String(path).split('/').pop(), url = base + encodeURIComponent(name) + '.json';
        return {
          get: function () {
            return note((async function () {
              var r = await gh(cfg, url);
              if (r.status === 404) { delete sha[name]; return snap(null); }
              if (!r.ok) throw await ghErr(r, cfg.repo);
              var j = await r.json(); sha[name] = j.sha;
              try { return snap(JSON.parse(unb64(j.content || ''))); } catch (e) { throw bad('data_loss', 'progress/' + name + '.json in ' + cfg.repo + ' is not valid JSON. Fix or delete that file on GitHub.'); }
            })());
          },
          set: function (obj) {
            return note(serial(async function () {
              var body = JSON.stringify({ message: 'SUMMIT: save ' + name, content: b64(JSON.stringify(obj)), sha: sha[name] });
              var r = await gh(cfg, url, { method: 'PUT', body: body, keepalive: body.length < 60000 });
              if (!r.ok) throw await ghErr(r, cfg.repo);
              var j = await r.json(); if (j && j.content) sha[name] = j.content.sha;
            }));
          }
        };
      }
    };
  }
  async function ghCheck(repo, token) {
    repo = String(repo || '').trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/+$/, '');
    token = String(token || '').trim();
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw bad('invalid', 'Write the repository as owner/name, for example yourname/summit-progress.');
    if (token.length < 20) throw bad('invalid', 'Paste the whole token. Fine-grained tokens start with github_pat_.');
    var cfg = { repo: repo, token: token }, r = await gh(cfg, '/repos/' + repo);
    if (r.status === 401) throw bad('permission_denied', 'GitHub did not accept that token. Check that it was copied whole and has not expired.');
    if (r.status === 403 || r.status === 404) throw bad('permission_denied', 'That token cannot see ' + repo + '. When you make the token, choose “Only select repositories” and pick it.');
    if (!r.ok) throw await ghErr(r, repo);
    var j = await r.json();
    if (!j.private) throw bad('public', repo + ' is public, so anyone could read your progress there. Make it private on GitHub (Settings → Change visibility) or choose a private repository.');
    /* one small write proves the token can save */
    var f = '/repos/' + repo + '/contents/progress/connected.json', g = await gh(cfg, f), cur = null;
    if (g.ok) cur = await g.json(); else if (g.status !== 404) throw await ghErr(g, repo);
    var w = await gh(cfg, f, { method: 'PUT', body: JSON.stringify({ message: 'SUMMIT: a device connected', content: b64(JSON.stringify({ connected: new Date().toISOString() })), sha: cur ? cur.sha : undefined }) });
    if (!w.ok) throw await ghErr(w, repo);
    return cfg;
  }

  /* ---------- Claude through the Anthropic API, with the user's own key ---------- */
  function turns(input) {
    var t = typeof input === 'string' ? [{ role: 'user', content: input }] : Array.isArray(input) ? input : [], out = [];
    t.forEach(function (x) {
      var c = x && x.content != null ? String(x.content) : '', role = x && x.role === 'assistant' ? 'assistant' : 'user', l = out[out.length - 1];
      if (!c) return; if (l && l.role === role) l.content += '\n\n' + c; else out.push({ role: role, content: c });
    });
    return out;
  }
  async function apiErr(r) {
    var j = null; try { j = await r.json(); } catch (e) { j = null; }
    var t = (j && j.error && j.error.type) || '', m = (j && j.error && j.error.message) || '';
    if (r.status === 404 || t === 'not_found_error') return { code: 'model_missing', message: m };
    if (r.status === 401 || t === 'authentication_error') return bad('not_granted', 'The Anthropic API rejected your key. Check it in Pack → Claude API key.');
    if (r.status === 403 || t === 'permission_error') return bad('not_granted', 'Your API key is not allowed to do this' + (m ? ': ' + m : '.'));
    if (/credit balance/i.test(m)) return bad('rate_limited', 'Your Anthropic API account is out of credit. Add credit in the Claude Console, then try again.');
    if (r.status === 413 || /too long|too large/i.test(m)) return bad('prompt_too_large', 'That was too much text for one request. Try a shorter passage.');
    if (r.status === 429 || t === 'rate_limit_error') return bad('rate_limited', 'Your API key hit its rate limit. Try again in a minute.');
    if (r.status === 529 || t === 'overloaded_error') return bad('upstream_error', 'Claude is overloaded right now. Try again in a minute.');
    if (r.status === 400) return bad('invalid_request', 'The Claude API refused the request' + (m ? ': ' + m : '.'));
    return bad('upstream_error', 'The Claude API had a problem (' + r.status + '). Try again in a moment.');
  }
  async function once(key, model, msgs, opts) {
    var sig = opts.signal, text = '', stop = '', res;
    var stopped = function () { return { code: 'cancelled', message: 'Stopped.', text: text || undefined }; };
    if (sig && sig.aborted) throw stopped();
    try {
      res = await fetch(AN + '/v1/messages', { method: 'POST', signal: sig, headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: model, max_tokens: opts.maxTokens || 4096, stream: true, messages: msgs }) });
    } catch (e) { if (sig && sig.aborted) throw stopped(); throw bad('upstream_error', 'The Claude API could not be reached. Check the connection and try again.'); }
    if (!res.ok) throw await apiErr(res);
    var rd = res.body.getReader(), dec = new TextDecoder(), buf = '';
    var take = function (block) {
      var data = block.split(/\r?\n/).filter(function (l) { return l.indexOf('data:') === 0; }).map(function (l) { return l.slice(5).trim(); }).join('');
      if (!data) return; var d; try { d = JSON.parse(data); } catch (e) { return; }
      if (d.type === 'content_block_delta' && d.delta && d.delta.type === 'text_delta' && d.delta.text) {
        text += d.delta.text;
        if (opts.onText && !(sig && sig.aborted)) { try { opts.onText({ text: text, delta: d.delta.text }); } catch (e2) { console.error(e2); } }
      } else if (d.type === 'message_delta' && d.delta && d.delta.stop_reason) stop = d.delta.stop_reason;
      else if (d.type === 'error') {
        var et = d.error && d.error.type;
        throw et === 'overloaded_error' ? bad('upstream_error', 'Claude is overloaded right now. Try again in a minute.', text) : et === 'rate_limit_error' ? bad('rate_limited', 'Your API key hit its rate limit. Try again in a minute.', text) : bad('upstream_error', 'The answer was interrupted. Try again.', text);
      }
    };
    try {
      for (;;) { var x = await rd.read(); if (x.done) break; buf += dec.decode(x.value, { stream: true }); var parts = buf.split(/\r?\n\r?\n/); buf = parts.pop(); parts.forEach(take); }
      if (buf.trim()) take(buf);
    } catch (e) {
      if (sig && sig.aborted) throw stopped();
      if (e && e.code) throw e;
      throw bad('upstream_error', 'The connection dropped part-way. Try again.', text);
    }
    if (stop === 'refusal') throw bad('refused', 'Claude declined to answer that. Try asking another way.');
    if (!text.trim()) throw bad('empty_completion', 'Claude sent back nothing. Try a simpler request.');
    return { text: text, truncated: stop === 'max_tokens' };
  }
  async function call(input, opts, asJson) {
    opts = opts && typeof opts === 'object' ? opts : {};
    var cfg = load('ak'); if (!cfg || !cfg.key) throw bad('not_granted', 'Add an Anthropic API key in Pack to use Claude here.');
    var msgs = turns(input);
    if (!msgs.length || msgs[0].role !== 'user' || msgs[msgs.length - 1].role !== 'user') throw bad('invalid_request', 'A request has to start and end with a user turn.');
    if (asJson) msgs[msgs.length - 1].content += '\n\nYour reply is read by a program: reply with only the JSON value, with no other text and no code fence.';
    var tier = MODELS[opts.modelTier] ? opts.modelTier : 'default', named = typeof opts.model === 'string' && opts.model ? opts.model : '', list = [named || MODELS[tier]];
    [MODELS[tier], MODELS['default']].forEach(function (m) { if (list.indexOf(m) < 0) list.push(m); });   // a model this key cannot use falls back, as Claude's own runtime does
    for (var i = 0; i < list.length; i++) {
      try {
        var r = await once(cfg.key, list[i], msgs, opts);
        r.modelTierApplied = TIER[list[i]] || tier; if (named && list[i] === named) r.modelApplied = named;
        W.lastAi = ''; return r;
      } catch (e) {
        if (e && e.code === 'model_missing') { if (i < list.length - 1) continue; e = bad('upstream_error', 'This API key cannot use ' + (NAME[list[i]] || list[i]) + '.'); }
        if (e && e.code !== 'cancelled') W.lastAi = e.human || '';
        throw e;
      }
    }
  }
  function parseJSON(t) {
    try { return JSON.parse(t); } catch (e) { /* next */ }
    var m = /```(?:json)?\s*([\s\S]*?)```/.exec(t); if (m) { try { return JSON.parse(m[1]); } catch (e) { /* next */ } }
    var a = t.search(/[[{]/), b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { /* none */ } }
    return undefined;
  }
  function sample() {
    var cfg = load('ak'); if (!cfg || !cfg.key) return null;
    var f = function (input, opts) { return call(input, opts, false); };
    f.json = async function (input, opts) { var r = await call(input, opts, true), v = parseJSON(r.text); if (v === undefined || r.truncated) throw bad('invalid_json', 'Claude’s reply could not be read. Try again.', r.text); return v; };
    f.limits = function () { return Promise.resolve({ maxPromptBytes: 262144, modelTiers: ['default', 'complex', 'quick'] }); };
    return f;
  }
  async function akCheck(key) {
    key = String(key || '').trim();
    if (key.length < 20) throw bad('invalid', 'Paste the whole key. Anthropic API keys start with sk-ant-.');
    var list = [MODELS.quick, MODELS['default']];
    for (var i = 0; i < list.length; i++) {
      try { await once(key, list[i], [{ role: 'user', content: 'Reply with the single word OK.' }], { maxTokens: 16 }); return NAME[list[i]]; }
      catch (e) { if (e && e.code === 'model_missing' && i < list.length - 1) continue; throw e && e.human ? e : bad('upstream_error', 'The key could not be checked. Try again.'); }
    }
  }

  /* ---------- downloads ---------- */
  var downloads = { save: function (o) {
    return new Promise(function (res, rej) {
      try {
        o = o || {};
        var b = o.data instanceof Blob ? o.data : new Blob([o.data == null ? '' : String(o.data)], { type: /\.json$/i.test(o.filename || '') ? 'application/json' : 'text/plain' });
        var u = URL.createObjectURL(b), a = document.createElement('a');
        a.href = u; a.download = o.filename || 'summit-download.txt'; a.rel = 'noopener'; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 5000); res();
      } catch (e) { rej({ code: 'upstream_error', message: 'The download could not start.' }); }
    });
  } };

  window.SUMMIT_HOST = { kind: 'web', wait: T.wait || 10000, acc: 'your private GitHub repo' };
  window.claude = { use: function (name) {
    return Promise.resolve(name === 'db' ? db() : name === 'user' ? (load('gh') ? { id: function () { return Promise.resolve('me'); } } : null) : name === 'sample' ? sample() : name === 'downloads' ? downloads : null);
  } };

  /* ---------- the two cards in Pack ---------- */
  function cards() {
    var S = window.S, h = S.h, g = load('gh'), k = load('ak');
    var field = function (label, attrs) { var i = h('input', Object.assign({ class: 'webin', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' }, attrs)); return [h('label', { class: 'tiny muted weblabel' }, label, i), i]; };
    var busy = function (btn, on, label) { btn.disabled = on; btn.textContent = label; };
    /* sync */
    var gMsg = h('p', { class: 'small', role: 'status' }), gCard;
    if (g) {
      var stEl = h('p', { class: 'small muted', role: 'status' }), born = Date.now(), seen = false;
      var paint = function () {   /* the line follows the sync state while Pack is open */
        stEl.textContent = S.sync.dead ? (W.lastGh || 'Sync has stopped.') + ' Your progress is safe on this device.' : S.sync.err ? 'The last save has not reached GitHub yet; SUMMIT keeps trying. Your progress is safe on this device.' : S.sync.mode === 'cloud' ? 'Saving to GitHub as you go, about ten seconds after each change, and loading the newest progress when you come back to the page.' : 'Connecting…';
        stEl.className = 'small' + (S.sync.dead || S.sync.err ? '' : ' muted'); stEl.style.color = S.sync.dead ? 'var(--amber)' : '';
      };
      paint();
      var tick = setInterval(function () { if (stEl.isConnected) { seen = true; paint(); } else if (seen || Date.now() - born > 10000) clearInterval(tick); }, 1200);
      gCard = h('div', { class: 'card col gap10' }, h('h3', null, 'Sync with GitHub'), stEl,
        h('p', { class: 'tiny muted' }, 'Repository ', h('a', { href: 'https://github.com/' + g.repo + '/tree/HEAD/progress', target: '_blank', rel: 'noopener' }, g.repo), ', folder progress/. This device holds the token; disconnecting keeps your progress here and on GitHub.'),
        h('div', { class: 'grid2' },
          h('button', { class: 'btn', onclick: function () { if (!Object.keys(S.sync.dirty).length) { S.toast('Everything is already saved.'); return; } S.flush().then(function () { S.toast(S.sync.err ? 'Not saved yet: ' + (W.lastGh || 'GitHub could not be reached.') : 'Saved to GitHub.'); S.render(true); }); } }, 'Save now'),
          h('button', { class: 'btn ghost', onclick: function () { keep('gh', null); S.toast('Disconnected. Reloading…'); setTimeout(function () { location.reload(); }, 500); } }, 'Disconnect this device')), gMsg);
    } else {
      var rf = field('Private repository', { placeholder: 'yourname/summit-progress', inputmode: 'url' }), tf = field('Fine-grained access token', { type: 'password', placeholder: 'github_pat_…' });
      var go = h('button', { class: 'btn go', onclick: async function () {
        busy(go, true, 'Checking…'); gMsg.textContent = '';
        try { var cfg = await ghCheck(rf[1].value, tf[1].value); keep('gh', cfg); gMsg.textContent = 'Connected. Reloading to bring in your progress…'; setTimeout(function () { location.reload(); }, 600); }
        catch (e) { gMsg.textContent = (e && e.human) || 'That did not work. Check both fields and try again.'; busy(go, false, 'Connect'); }
      } }, 'Connect');
      gCard = h('div', { class: 'card col gap10' }, h('h3', null, 'Sync with GitHub'),
        h('p', { class: 'small muted' }, 'Right now your progress is saved in this browser only. Connect a private GitHub repository and SUMMIT saves there as you go, so your phone and your computer share one climb.'),
        h('details', { class: 'webhow' }, h('summary', { class: 'small' }, 'How to make the token (about two minutes)'),
          h('ol', { class: 'small' },
            h('li', null, 'On GitHub open ', h('a', { href: 'https://github.com/settings/personal-access-tokens/new', target: '_blank', rel: 'noopener' }, 'Settings → Developer settings → Fine-grained tokens → Generate new token'), '.'),
            h('li', null, 'Name it “SUMMIT sync” and pick an expiry (up to a year; SUMMIT tells you when it stops working).'),
            h('li', null, 'Repository access: ', h('b', null, 'Only select repositories'), ', then your private progress repository.'),
            h('li', null, 'Permissions → Repository permissions → ', h('b', null, 'Contents: Read and write'), '. Nothing else.'),
            h('li', null, 'Generate it, copy it (it starts with github_pat_) and paste it below.'))),
        rf[0], tf[0], go, gMsg,
        h('p', { class: 'tiny muted' }, 'The token is kept in this browser only and sent only to GitHub, and it can reach only the repository you chose. On iPhone a home-screen SUMMIT keeps its own storage, so connect there too.'));
    }
    /* Claude API key */
    var kMsg = h('p', { class: 'small', role: 'status' }), kCard;
    if (k) {
      var test = h('button', { class: 'btn', onclick: async function () { busy(test, true, 'Testing…'); kMsg.textContent = ''; try { var who = await akCheck(k.key); kMsg.textContent = 'The key works. ' + who + ' answered.'; } catch (e) { kMsg.textContent = (e && e.human) || 'The key could not be checked.'; } busy(test, false, 'Test the key'); } }, 'Test the key');
      kCard = h('div', { class: 'card col gap10' }, h('h3', null, 'Claude API key'),
        h('p', { class: 'small muted' }, 'Claude’s parts are on and billed to your key: Ask about a highlight asks Claude Opus 5.5; grading, unpacking and reviews use Claude Sonnet 5.5.'),
        W.lastAi || S.ai.st === 'off' ? h('p', { class: 'small', style: 'color:var(--amber)' }, W.lastAi || 'The last request was refused. Test the key.') : null,
        h('div', { class: 'grid2' }, test, h('button', { class: 'btn ghost', onclick: function () { keep('ak', null); S.toast('Key removed. Reloading…'); setTimeout(function () { location.reload(); }, 500); } }, 'Remove the key')), kMsg,
        h('p', { class: 'tiny muted' }, 'The key is kept in this browser only and sent only to api.anthropic.com. Set a monthly spend limit on it in the Claude Console.'));
    } else {
      var kf = field('Anthropic API key', { type: 'password', placeholder: 'sk-ant-…' });
      var save = h('button', { class: 'btn go', onclick: async function () {
        busy(save, true, 'Testing the key…'); kMsg.textContent = '';
        try { var who = await akCheck(kf[1].value); keep('ak', { key: String(kf[1].value).trim() }); kMsg.textContent = 'The key works (' + who + ' answered). Reloading…'; setTimeout(function () { location.reload(); }, 700); }
        catch (e) { kMsg.textContent = (e && e.human) || 'That key did not work.'; busy(save, false, 'Save and test'); }
      } }, 'Save and test');
      kCard = h('div', { class: 'card col gap10' }, h('h3', null, 'Claude API key'),
        h('p', { class: 'small muted' }, 'Optional. Outside Claude, SUMMIT’s AI parts (grading written answers, Ask about a highlight, Unpack with Claude, README review and video outlines) run on your own Anthropic API key. Without one they stay off and you self-check written answers.'),
        h('details', { class: 'webhow' }, h('summary', { class: 'small' }, 'How to get a key'),
          h('ol', { class: 'small' },
            h('li', null, 'Sign in to the Claude Console at ', h('a', { href: 'https://console.anthropic.com', target: '_blank', rel: 'noopener' }, 'console.anthropic.com'), '. API use is billed separately from a Claude subscription.'),
            h('li', null, 'Add a little credit under Billing and set a monthly spend limit.'),
            h('li', null, 'Under API keys, create a key, copy it (it starts with sk-ant-) and paste it below.'))),
        kf[0], save, kMsg,
        h('p', { class: 'tiny muted' }, 'Kept in this browser only and sent only to api.anthropic.com. Anyone who can use this browser could read it, so do not save it on a shared computer.'));
    }
    return [gCard, kCard];
  }
  window.SUMMIT_WEB = { cards: cards, ghCheck: ghCheck, akCheck: akCheck, load: load, keep: keep, state: W, parseJSON: parseJSON };
})();
