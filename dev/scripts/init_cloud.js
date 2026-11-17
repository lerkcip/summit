// Mock of window.claude (contract: use(name) -> namespace | null) backed by the local mock store.
(function () {
  var BASE = 'http://localhost:8766/', calls = (window.__calls = { sample: [], save: [], gets: 0, sets: 0 });
  function freeze(o) { return Object.freeze(o); }
  function doc(path) {
    if (path.split('/').length % 2) throw new TypeError('document path needs an even number of segments: ' + path);
    return { id: path.split('/').pop(), path: path,
      get: async function () { calls.gets++; var r = await (await fetch(BASE + 'doc?p=' + encodeURIComponent(path))).json(); return freeze({ id: this.id, exists: r.exists, data: function () { return r.exists ? freeze(r.data) : undefined; }, metadata: { fromCache: false, hasPendingWrites: false } }); },
      set: async function (data) { calls.sets++; if (!data || typeof data !== 'object' || Array.isArray(data)) throw { code: 'invalid_argument', message: 'body must be an object' }; var r = await fetch(BASE + 'doc?p=' + encodeURIComponent(path), { method: 'PUT', body: JSON.stringify(data) }); if (!r.ok) throw { code: 'invalid_argument', message: 'document too large' }; },
      update: async function () { throw { code: 'invalid_argument', message: 'not in mock' }; }, delete: async function () { } };
  }
  var db = freeze({ doc: doc, collection: function (p) { return { doc: function (id) { return doc(p + '/' + id); } }; } });
  var user = freeze({ id: async function () { return window.__uid || 'u_test1'; }, isOwner: async function () { return true; } });
  var sample = async function (input, opts) {      // chat double: streams window.__chatReply(input, opts) in window.__chatChunks pieces
    opts = opts || {};
    calls.sample.push(typeof input === 'string' ? input.slice(0, 200) : JSON.stringify(input));
    (calls.chat = calls.chat || []).push({ turns: Array.isArray(input) ? JSON.parse(JSON.stringify(input)) : null, model: opts.model, modelTier: opts.modelTier, cache: opts.cache, signal: !!(opts.signal && typeof opts.signal.aborted === 'boolean'), onText: typeof opts.onText });
    if (Array.isArray(input) && (!input.length || input[0].role !== 'user' || input[input.length - 1].role !== 'user' || input.some(function (t) { return !t.content || (t.role !== 'user' && t.role !== 'assistant'); }))) throw { code: 'invalid_request', message: 'turns must start and end on a user turn, with non-empty content' };
    if (window.__sampleFail) throw { code: window.__sampleFail, message: 'mock failure' };
    var full = String(window.__chatReply ? window.__chatReply(input, opts) : 'ok'), parts = window.__chatChunks || 1, text = '';
    for (var i = 0; i < parts; i++) {
      await new Promise(function (r) { setTimeout(r, window.__chatDelay || 0); });
      if (opts.signal && opts.signal.aborted) throw { code: 'cancelled', message: 'aborted', text: text || undefined };
      var d = full.slice(Math.floor(full.length * i / parts), Math.floor(full.length * (i + 1) / parts)); if (!d) continue; text += d;
      if (opts.onText) opts.onText({ text: text, delta: d });
      if (window.__chatFailMid && i === 0) throw { code: window.__chatFailMid, message: 'failed part-way', text: window.__chatFailMid === 'refused' ? undefined : text };
    }
    return { text: full, truncated: !!window.__chatTrunc, modelTierApplied: 'complex', modelApplied: window.__noModel ? undefined : opts.model };
  };
  sample.json = async function (prompt, opts) {
    calls.sample.push(prompt);
    if (window.__sampleFail) throw { code: window.__sampleFail, message: 'mock failure' };
    if (/Return JSON \{"outline"/.test(prompt)) return { outline: 'TAILORED OUTLINE\n' + 'x'.repeat(120) };
    if (/reviewing the README/.test(prompt)) return { score: 72, strengths: ['Clear question'], fixes: ['Pin the environment', 'State the uncertainty on the headline number'], verdict: 'Readable, but not yet reproducible.' };
    return window.__sampleReply ? window.__sampleReply(prompt) : null;
  };
  var downloads = freeze({ save: async function (req) { calls.save.push({ filename: req.filename, size: String(req.data).length }); if (window.__saveDecline) throw { code: 'declined', message: 'no' }; return { status: 'saved' }; } });
  var caps = { db: db, user: user, sample: sample, downloads: downloads };
  window.claude = Object.freeze({ use: function (name) { return new Promise(function (res) { setTimeout(function () { res(window.__noCaps ? null : (caps[name] || null)); }, window.__capDelay || 120); }); } });
})();
