# usage: python3 -I build_fonts.py <node_modules> <appDir>   Copies the three open-licensed typefaces into the app.
import sys, os, shutil
nm, app = sys.argv[1], sys.argv[2]
out = os.path.join(app, 'vendor', 'fonts'); os.makedirs(out, exist_ok=True)
RANGE = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
FACES = [('barlow-condensed', 'Barlow Condensed', [(600, 'normal'), (700, 'normal'), (800, 'normal')]),
         ('instrument-sans', 'Instrument Sans', [(400, 'normal'), (400, 'italic'), (500, 'normal'), (600, 'normal')]),
         ('jetbrains-mono', 'JetBrains Mono', [(400, 'normal'), (600, 'normal')])]
css, lic, total = ['/* SUMMIT typefaces, served from the page itself. All three are under the SIL Open Font License 1.1 (see LICENSE.txt). */'], [], 0
for pkg, fam, ws in FACES:
    for w, style in ws:
        fn = '%s-latin-%d-%s.woff2' % (pkg, w, style)
        src = os.path.join(nm, '@fontsource', pkg, 'files', fn)
        shutil.copyfile(src, os.path.join(out, fn)); total += os.path.getsize(src)
        css.append('@font-face{font-family:"%s";font-style:%s;font-weight:%d;font-display:swap;src:url(%s) format("woff2");unicode-range:%s}' % (fam, style, w, fn, RANGE))
    lic.append('=' * 20 + ' ' + fam + ' ' + '=' * 20 + '\n' + open(os.path.join(nm, '@fontsource', pkg, 'LICENSE'), encoding='utf-8').read().strip())
open(os.path.join(out, 'fonts.css'), 'w', encoding='utf-8').write('\n'.join(css) + '\n')
open(os.path.join(out, 'LICENSE.txt'), 'w', encoding='utf-8').write('\n\n'.join(lic) + '\n')
print('fonts:', sorted(os.listdir(out)), total, 'bytes')
