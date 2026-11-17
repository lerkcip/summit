const fs = require('fs'), path = require('path');
const [, , hdir, out] = process.argv;
const o = { harness: fs.readFileSync(path.join(hdir, 'harness.py'), 'utf8'), start: {}, sol: {} };
for (let i = 0; i < 7; i++) { o.start[i] = fs.readFileSync(path.join(hdir, 'start', `L${i}.py`), 'utf8'); o.sol[i] = fs.readFileSync(path.join(hdir, 'sol', `L${i}.py`), 'utf8'); }
fs.writeFileSync(out, '/* SUMMIT · Hoverslam Lab: Python harness, starter code and reference solutions (generated) */\nwindow.HOVER_PY=' + JSON.stringify(o) + ';\n');
console.log('hoverpy.js', fs.statSync(out).size, 'bytes');
