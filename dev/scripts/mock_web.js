// Test double for the two outside services web.js talks to, written from their documented behaviour:
//   /gh/...  GitHub REST: GET /repos/:o/:r, GET|PUT /repos/:o/:r/contents/progress/:file (base64 content, sha checks, 409/422)
//   /an/...  Anthropic Messages API: POST /v1/messages with stream:true (server-sent events), browser-access header required
//   /admin/  reset | dump | seed (POST {repo, files:{name: obj}}) | set (POST behaviour flags) | touch (POST {repo, name, obj}: write as "another device")
// CORS is answered like the real services. usage: node mock_web.js [port]
const http = require('http'), crypto = require('crypto');
const port = +(process.argv[2] || 8767);
const GOOD = 'github_pat_good_0123456789abcdef', RO = 'github_pat_readonly_0123456789ab';
let S;
function reset() {
  S = { repos: { 'me/summit-progress': { private: true, files: {} }, 'me/open-repo': { private: false, files: {} } }, commits: 0, revoked: false,
        an: [], beh: { noOpus: false, delay: 40, chunks: 5, midError: '', stopReason: 'end_turn' } };
}
reset();
const sha = s => crypto.createHash('sha1').update(s).digest('hex');
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, If-Match, If-None-Match, X-Requested-With, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access',
  'Access-Control-Expose-Headers': 'x-ratelimit-remaining' };
function send(res, code, obj, extra) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json' }, cors, extra || {})); res.end(obj === undefined ? '' : JSON.stringify(obj)); }
function body(req) { return new Promise(r => { let b = ''; req.on('data', d => b += d); req.on('end', () => r(b)); }); }
const put = (repo, name, txt) => { const f = { content: txt, sha: sha(txt + Date.now() + Math.random()) }; S.repos[repo].files[name] = f; S.commits++; return f; };

async function github(req, res, path) {
  const auth = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (S.revoked || (auth !== GOOD && auth !== RO)) return send(res, 401, { message: 'Bad credentials' });
  let m = /^\/repos\/([^/]+\/[^/]+)$/.exec(path);
  if (m) { const r = S.repos[m[1]]; return r ? send(res, 200, { full_name: m[1], private: r.private, permissions: { admin: true, push: true, pull: true } }) : send(res, 404, { message: 'Not Found' }); }
  m = /^\/repos\/([^/]+\/[^/]+)\/contents\/progress\/([^/?]+)$/.exec(path);
  if (!m || !S.repos[m[1]]) return send(res, 404, { message: 'Not Found' });
  const repo = S.repos[m[1]], name = decodeURIComponent(m[2]), f = repo.files[name];
  if (req.method === 'GET') return f ? send(res, 200, { name, path: 'progress/' + name, sha: f.sha, encoding: 'base64', content: Buffer.from(f.content, 'utf8').toString('base64').replace(/(.{60})/g, '$1\n') }) : send(res, 404, { message: 'Not Found' });
  if (req.method === 'PUT') {
    if (auth === RO) return send(res, 403, { message: 'Resource not accessible by personal access token' });
    const b = JSON.parse(await body(req) || '{}');
    if (!b.message || typeof b.content !== 'string') return send(res, 422, { message: 'Invalid request.' });
    if (f && !b.sha) return send(res, 422, { message: 'Invalid request.\n\n"sha" wasn\'t supplied.' });
    if (f && b.sha !== f.sha) return send(res, 409, { message: 'progress/' + name + ' does not match ' + b.sha });
    const nf = put(m[1], name, Buffer.from(b.content, 'base64').toString('utf8'));
    return send(res, f ? 200 : 201, { content: { name, path: 'progress/' + name, sha: nf.sha }, commit: { sha: sha('c' + S.commits), message: b.message } });
  }
  return send(res, 405, { message: 'Method not allowed' });
}

function replyFor(msgs) {
  const last = msgs[msgs.length - 1].content;
  if (/Reply with the single word OK/.test(last)) return 'OK';
  if (/Unpack ONE section/.test(last)) return JSON.stringify({ items: [
    { k: 'eq', n: 'Web: average speed', x: 'v = \\frac{d}{t}', w: 'Speed equals distance divided by time.', s: [['v', 'speed', 'm/s']],
      e: [['A ride', '30 km in 1.5 h', '20 km/h', '30/1.5', 20], ['A walk', '5 km in 1 h', '5 km/h', '5/1', 5]], c: ['With units', '20 km/h is 20*1000/3600', '5.56 m/s', '20*1000/3600', 5.556], u: 'Flight logs turn positions into speeds this way.' }] });
  return 'Force has the **dimension** \\(M L T^{-2}\\): mass times length over time squared.\n\n- From the newton: \\(1\\ \\text{N} = 1\\ \\text{kg m s}^{-2}\\)\n- Check: \\[ F = m a \\]\n\nThat is all.';
}
async function anthropic(req, res, path) {
  if (path !== '/v1/messages' || req.method !== 'POST') return send(res, 404, { type: 'error', error: { type: 'not_found_error', message: 'Not found' } });
  if (req.headers['anthropic-dangerous-direct-browser-access'] !== 'true') return send(res, 401, { type: 'error', error: { type: 'authentication_error', message: "CORS requests must set 'anthropic-dangerous-direct-browser-access' header" } });
  const key = req.headers['x-api-key'] || '', b = JSON.parse(await body(req) || '{}');
  S.an.push({ model: b.model, max_tokens: b.max_tokens, stream: b.stream, messages: b.messages, version: req.headers['anthropic-version'], key: key.slice(0, 12) });
  if (key === 'sk-ant-nocredit-0123456789abcdef') return send(res, 400, { type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API.' } });
  if (key !== 'sk-ant-good-0123456789abcdef') return send(res, 401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } });
  if (!b.model || !b.max_tokens || !Array.isArray(b.messages) || !b.messages.length) return send(res, 400, { type: 'error', error: { type: 'invalid_request_error', message: 'bad request' } });
  for (let i = 0; i < b.messages.length; i++) if (b.messages[i].role !== (i % 2 ? 'assistant' : 'user')) return send(res, 400, { type: 'error', error: { type: 'invalid_request_error', message: 'roles must alternate' } });
  if (S.beh.noOpus && b.model === 'claude-opus-5-5') return send(res, 404, { type: 'error', error: { type: 'not_found_error', message: 'model: claude-opus-5-5' } });
  if (!/^claude-(haiku|sonnet|opus)-5-5$/.test(b.model)) return send(res, 404, { type: 'error', error: { type: 'not_found_error', message: 'model: ' + b.model } });
  const text = replyFor(b.messages), n = S.beh.chunks;
  res.writeHead(200, Object.assign({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }, cors));
  const ev = (type, data) => res.write('event: ' + type + '\ndata: ' + JSON.stringify(Object.assign({ type }, data)) + '\n\n');
  ev('message_start', { message: { id: 'msg_test', type: 'message', role: 'assistant', model: b.model, content: [], stop_reason: null, usage: { input_tokens: 10, output_tokens: 1 } } });
  ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
  ev('ping', {});
  let closed = false; req.on('close', () => { closed = true; });
  for (let i = 0; i < n; i++) {
    await new Promise(r => setTimeout(r, S.beh.delay));
    if (closed) return;
    const d = text.slice(Math.floor(text.length * i / n), Math.floor(text.length * (i + 1) / n));
    if (d) ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: d } });
    if (S.beh.midError && i === 0) { ev('error', { error: { type: S.beh.midError, message: 'Overloaded' } }); return res.end(); }
  }
  ev('content_block_stop', { index: 0 });
  ev('message_delta', { delta: { stop_reason: S.beh.stopReason, stop_sequence: null }, usage: { output_tokens: 20 } });
  ev('message_stop', {});
  res.end();
}

http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x'), p = u.pathname;
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    if (p.startsWith('/gh/')) return github(req, res, p.slice(3));
    if (p.startsWith('/an/')) return anthropic(req, res, p.slice(3));
    if (p === '/admin/reset') { reset(); return send(res, 200, { ok: true }); }
    if (p === '/admin/dump') { const out = {}; Object.keys(S.repos).forEach(k => { out[k] = {}; Object.keys(S.repos[k].files).forEach(n => { out[k][n] = JSON.parse(S.repos[k].files[n].content); }); }); return send(res, 200, { repos: out, commits: S.commits, an: S.an, revoked: S.revoked }); }
    if (p === '/admin/seed') { const b = JSON.parse(await body(req)); Object.keys(b.files).forEach(n => put(b.repo, n, JSON.stringify(b.files[n]))); return send(res, 200, { ok: true }); }
    if (p === '/admin/touch') { const b = JSON.parse(await body(req)); put(b.repo, b.name, JSON.stringify(b.obj)); return send(res, 200, { ok: true }); }
    if (p === '/admin/set') { const b = JSON.parse(await body(req)); if ('revoked' in b) S.revoked = !!b.revoked; Object.assign(S.beh, b.beh || {}); return send(res, 200, { beh: S.beh }); }
    send(res, 404, { message: 'Not Found' });
  } catch (e) { send(res, 500, { message: String(e) }); }
}).listen(port, () => console.log('mock_web on ' + port));
