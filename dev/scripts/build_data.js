// Build app data files from the parsed curriculum JSON.
const fs = require('fs'), path = require('path');
const [, , curPath, appDir, nm] = process.argv;
const d = JSON.parse(fs.readFileSync(curPath, 'utf8'));
const out = path.join(appDir, 'data'); fs.mkdirSync(out, { recursive: true });
const CAMPS = ['Basecamp', 'Camp 1', 'Camp 2', 'Camp 3', 'Camp 4 · Death Zone', 'Summit'];
const SHORT = ['Foundations', 'Mathematics', 'Engineering Science', 'Aerospace Core', 'Graduate', 'Doctoral+'];
const cur = {
  title: 'Rocketry and Hypersonic Flight from First Principles',
  parts: d.parts.map((p, i) => ({ n: p.n, roman: p.roman, title: p.title, short: SHORT[i], camp: CAMPS[i], page: p.page, ch: d.chapters.filter(c => c.part === p.n).map(c => c.n) })),
  chapters: d.chapters.map(c => ({
    n: c.n, t: c.title, part: c.part, page: c.page, pageEnd: c.pageEnd, quizPage: c.quizPage,
    builds: c.builds, buildsText: c.buildsText, goals: c.goalsHtml,
    secs: c.secs.map(s => ({ id: s.id, t: s.t, page: s.page, flag: s.flag ? 1 : 0, w: Math.round(s.html.replace(/<[^>]+>/g, ' ').split(/\s+/).length) })),
    quiz: c.quiz.map(q => ({ n: q.n, tag: q.tag, refs: q.refs, q: q.q, a: q.a }))
  })),
  appendices: d.appendices.map(a => ({ id: a.id, t: a.title, page: a.page, secs: a.secs.filter(s => s.id).map(s => ({ id: s.id, t: s.t, page: s.page })) }))
};
fs.writeFileSync(path.join(out, 'cur.js'), 'window.CUR=' + JSON.stringify(cur) + ';');
// reader chunks: one file per Part, one for appendices + preface
let sizes = {};
for (const p of d.parts) {
  const o = {};
  for (const c of d.chapters.filter(c => c.part === p.n)) o[c.n] = { intro: c.intro, secs: Object.fromEntries(c.secs.map(s => [s.id, s.html])) };
  const js = `window.SUMMIT_READ&&window.SUMMIT_READ("p${p.n}",${JSON.stringify({ part: p.html, ch: o })});`;
  fs.writeFileSync(path.join(out, `read${p.n}.js`), js); sizes['read' + p.n] = js.length;
}
{
  const o = {};
  for (const a of d.appendices) { if (a.id === 'J') { o[a.id] = [{ id: '', t: '', html: a.secs[0].html + '<p><em>The answer keys live inside each chapter’s quiz results in this app.</em></p>' }]; continue; } o[a.id] = a.secs.map(s => ({ id: s.id || '', t: s.t || '', html: s.html })); }
  const pre = d.preface.secs.filter(s => s.html).map(s => ({ t: s.t, html: s.html }));
  const js = `window.SUMMIT_READ&&window.SUMMIT_READ("ax",${JSON.stringify({ ap: o, pre })});`;
  fs.writeFileSync(path.join(out, 'readA.js'), js); sizes.readA = js.length;
}
sizes.cur = fs.statSync(path.join(out, 'cur.js')).size;
// vendor: KaTeX (js, css, woff2 fonts only)
const kd = path.join(nm, 'katex/dist'), vd = path.join(appDir, 'vendor/katex'); fs.mkdirSync(path.join(vd, 'fonts'), { recursive: true });
fs.copyFileSync(path.join(kd, 'katex.min.js'), path.join(vd, 'katex.min.js'));
let css = fs.readFileSync(path.join(kd, 'katex.min.css'), 'utf8');
css = css.replace(/,url\(fonts\/[^)]+\.woff\) format\("woff"\),url\(fonts\/[^)]+\.ttf\) format\("truetype"\)/g, '');
fs.writeFileSync(path.join(vd, 'katex.min.css'), css);
let nf = 0; for (const f of fs.readdirSync(path.join(kd, 'fonts'))) if (f.endsWith('.woff2')) { fs.copyFileSync(path.join(kd, 'fonts', f), path.join(vd, 'fonts', f)); nf++; }
console.log(JSON.stringify(sizes), 'katex fonts', nf, 'css refs other formats left:', (css.match(/\.ttf|\.woff\)/g) || []).length);
