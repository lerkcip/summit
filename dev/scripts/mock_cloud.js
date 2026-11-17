// Test double for the artifact runtime. Serves a tiny document store over HTTP so two browser contexts
// ("two devices") can share one account copy.  usage: node mock_cloud.js <port>
const http = require('http');
const docs = {}; let log = [];
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'); const p = u.searchParams.get('p');
  res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS'); res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.end(); return; }
  if (u.pathname === '/dump') { res.end(JSON.stringify({ docs, log })); return; }
  if (u.pathname === '/reset') { for (const k in docs) delete docs[k]; log = []; res.end('ok'); return; }
  if (req.method === 'GET') { log.push('get ' + p); res.end(JSON.stringify(p in docs ? { exists: true, data: docs[p] } : { exists: false })); return; }
  if (req.method === 'PUT') { let b = ''; req.on('data', c => b += c); req.on('end', () => { const size = Buffer.byteLength(b); if (size > 262144) { res.statusCode = 413; res.end('too big'); log.push('REJECT ' + p + ' ' + size); return; } docs[p] = JSON.parse(b); log.push('set ' + p + ' ' + size); res.end('ok'); }); return; }
  res.end('?');
}).listen(+process.argv[2], () => console.log('mock cloud on', process.argv[2]));
