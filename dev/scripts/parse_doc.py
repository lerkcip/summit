#!/usr/bin/env python3
"""Parse pandoc HTML (docx+styles, --katex) of the curriculum into structured JSON.
Usage: parse_doc.py <cur_styles.html> <out.json>
"""
import re, sys, json
from bs4 import BeautifulSoup, NavigableString, Tag

src, out = sys.argv[1], sys.argv[2]
soup = BeautifulSoup(open(src, encoding='utf-8').read(), 'lxml')
body = soup.body

# ---------- TOC page numbers: id -> page ----------
pages = {}
for a in body.select('a[href^="#"]'):
    sp = a.find('span')
    if sp and sp.get_text(strip=True).isdigit():
        hid = a['href'][1:]
        pages.setdefault(hid, int(sp.get_text(strip=True)))

# ---------- helpers ----------
def fix_tex(t):
    t = t.replace('\\mspace{6mu}', '\\;').replace('\\mspace{9mu}', '\\;\\,').replace('\\mspace{2mu}', '\\,')
    t = re.sub(r'\\mspace\{(\d+)mu\}', lambda m: '\\mkern%smu ' % m.group(1), t)
    t = re.sub(r'\\mathcal\{l([^}]*)\}', lambda m: '\\ell' + ((' ' + m.group(1).strip()) if m.group(1).strip() else ''), t)
    return t

def clean(node):
    """Return compact HTML for a block node: math spans -> <span class=mi|md>, drop ids/styles."""
    node = BeautifulSoup(str(node), 'lxml').body
    for sp in node.select('span.math'):
        disp = 'display' in sp.get('class', [])
        tex = fix_tex(sp.get_text())
        new = soup.new_tag('span')
        new['class'] = 'md' if disp else 'mi'
        new.string = tex
        sp.replace_with(new)
    for t in node.find_all(['colgroup']):
        t.decompose()
    for t in node.find_all(True):
        for attr in list(t.attrs or {}):
            if attr in ('id', 'style', 'data-custom-style', 'width'):
                del t[attr]
    # unwrap plain divs
    for d in node.find_all('div'):
        d.unwrap()
    html = ''.join(str(c) for c in node.children)
    html = re.sub(r'\n+', ' ', html).strip()
    html = html.replace('<table>', '<div class="tw"><table>').replace('</table>', '</table></div>')
    html = html.replace(' class="header"', '').replace(' class="odd"', '').replace(' class="even"', '')
    html = re.sub(r' style="[^"]*"', '', html)
    return html

def text_of(node):
    return re.sub(r'\s+', ' ', node.get_text(' ', strip=True))

ROMAN = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6}

def parse_builds(txt):
    """'Chapters 8–13.' -> [8..13]; 'all previous chapters, especially ...' -> 'ALL' """
    t = txt.strip().rstrip('.')
    if t.lower().startswith('all previous'):
        return 'ALL'
    if not re.search(r'Chapter', t):
        return []
    nums = []
    for a, b in re.findall(r'(\d+)(?:\s*[–-]\s*(\d+))?', t):
        if b:
            nums.extend(range(int(a), int(b) + 1))
        else:
            nums.append(int(a))
    return sorted(set(nums))

# ---------- walk ----------
nodes = [n for n in body.children if isinstance(n, Tag)]
start = None
for i, n in enumerate(nodes):
    if n.name == 'p' and 'heading' in n.get('class', []) and n.get_text(strip=True) == 'Preface: How to Use This Document':
        start = i
        break
assert start is not None

parts, chapters, appendices = [], {}, []
preface = {'title': 'Preface: How to Use This Document', 'page': pages.get(nodes[start].get('id')), 'secs': [{'t': '', 'html': []}]}
ctx = {'kind': 'preface', 'obj': preface, 'sec': preface['secs'][0]}
answers = {}
flags_run = []          # accumulate consecutive SafetyBox blocks

def flush_flags():
    global flags_run
    if flags_run and ctx.get('sec') is not None:
        inner = ''.join(flags_run)
        ctx['sec']['html'].append('<aside class="flag">' + inner + '</aside>')
        ctx['sec']['flag'] = True
    flags_run = []

def add_block(html, cls=None):
    if ctx.get('sec') is None:
        return
    if cls:
        html = '<div class="%s">%s</div>' % (cls, html)
    ctx['sec']['html'].append(html)

mode_answers = False
ans_ch = None
for n in nodes[start:]:
    is_head = n.name == 'p' and 'heading' in n.get('class', [])
    style = n.get('data-custom-style') if n.name == 'div' else None
    if style == 'SafetyBox':
        flags_run.append(clean(n))
        continue
    flush_flags()
    if is_head:
        t = text_of(n)
        hid = n.get('id')
        pg = pages.get(hid)
        m = re.match(r'^Part ([IVX]+) — (.+)$', t)
        if m and not mode_answers:
            p = {'n': ROMAN[m.group(1)], 'roman': m.group(1), 'title': m.group(2), 'page': pg, 'html': []}
            parts.append(p)
            ctx = {'kind': 'part', 'obj': p, 'sec': p}
            continue
        m = re.match(r'^Chapter (\d+) · (.+)$', t)
        if m and not mode_answers:
            c = {'n': int(m.group(1)), 'title': m.group(2), 'page': pg, 'part': parts[-1]['n'],
                 'builds': None, 'buildsText': '', 'goals': [], 'intro': [], 'secs': [], 'quiz': [], 'quizPage': None}
            chapters[c['n']] = c
            ctx = {'kind': 'chapter', 'obj': c, 'sec': {'html': c['intro']}}
            continue
        if m and mode_answers:
            ans_ch = int(m.group(1))
            answers[ans_ch] = []
            ctx = {'kind': 'answers', 'obj': None, 'sec': None}
            continue
        m = re.match(r'^Quiz (\d+)$', t)
        if m:
            c = chapters[int(m.group(1))]
            c['quizPage'] = pg
            ctx = {'kind': 'quiz', 'obj': c, 'sec': None}
            continue
        m = re.match(r'^(\d+)\.(\d+) (.+)$', t)
        if m and ctx['kind'] in ('chapter', 'quiz') and int(m.group(1)) == ctx['obj']['n']:
            c = ctx['obj']
            s = {'id': '%s.%s' % (m.group(1), m.group(2)), 't': m.group(3), 'page': pg, 'html': []}
            c['secs'].append(s)
            ctx = {'kind': 'chapter', 'obj': c, 'sec': s}
            continue
        if t == 'Appendices':
            ctx = {'kind': 'none', 'obj': None, 'sec': None}
            continue
        m = re.match(r'^Appendix ([A-O]) · (.+)$', t)
        if m:
            a = {'id': m.group(1), 'title': m.group(2), 'page': pg, 'secs': [{'t': '', 'html': []}]}
            appendices.append(a)
            mode_answers = (m.group(1) == 'J')
            ctx = {'kind': 'appendix', 'obj': a, 'sec': a['secs'][0]}
            continue
        if mode_answers and re.match(r'^Part [IVX]+ answers', t):
            continue
        m = re.match(r'^([A-O])\.(\d+) (.+)$', t)
        if m and ctx['kind'] == 'appendix':
            a = ctx['obj']
            s = {'id': '%s.%s' % (m.group(1), m.group(2)), 't': m.group(3), 'page': pg, 'html': []}
            a['secs'].append(s)
            ctx['sec'] = s
            continue
        # other headings (preface sub-heads, unnumbered sub-heads): keep as inline heading
        if ctx.get('sec') is not None:
            if ctx['kind'] in ('preface',):
                s = {'t': t, 'page': pg, 'html': []}
                ctx['obj']['secs'].append(s)
                ctx['sec'] = s
            else:
                ctx['sec']['html'].append('<h4>%s</h4>' % clean(n).replace('<p class="heading">', '').replace('</p>', ''))
        else:
            print('UNPLACED HEADING:', t, file=sys.stderr)
        continue
    # ---- non-heading blocks ----
    if ctx['kind'] == 'quiz':
        if n.name == 'ol':
            for li in n.find_all('li', recursive=False):
                html = clean(li)
                html = re.sub(r'^<li>|</li>$', '', html).strip()
                html = re.sub(r'^<p>|</p>$', '', html).strip()
                m = re.match(r'^\[(C|N|I: Ch ([\d, ]+))\]\s*(.*)$', html, re.S)
                assert m, html[:80]
                tag = m.group(1)[0]
                refs = [int(x) for x in re.findall(r'\d+', m.group(2) or '')]
                ctx['obj']['quiz'].append({'n': len(ctx['obj']['quiz']) + 1, 'tag': tag, 'refs': refs, 'q': m.group(3)})
        else:
            print('NON-LIST IN QUIZ ch%d: %s' % (ctx['obj']['n'], text_of(n)[:80]), file=sys.stderr)
        continue
    if ctx['kind'] == 'answers':
        if n.name == 'ol':
            for li in n.find_all('li', recursive=False):
                html = clean(li)
                html = re.sub(r'^<li>|</li>$', '', html).strip()
                if html.count('<p>') == 1:
                    html = re.sub(r'^<p>|</p>$', '', html).strip()
                answers[ans_ch].append(html)
        else:
            print('NON-LIST IN ANSWERS ch%s: %s' % (ans_ch, text_of(n)[:80]), file=sys.stderr)
        continue
    if style == 'Prereq' and ctx['kind'] == 'chapter':
        t = text_of(n)
        m = re.match(r'^Builds on:\s*(.*?)\s*Goals:\s*(.*)$', t)
        assert m, t[:100]
        c = ctx['obj']
        c['buildsText'] = m.group(1).strip().rstrip('.')
        c['builds'] = parse_builds(m.group(1))
        # goals as HTML: take html after the Goals strong tag
        h = clean(n)
        gh = re.split(r'<strong>Goals:</strong>', h, 1)[1]
        gh = re.sub(r'</p>\s*$', '', gh).strip()
        c['goalsHtml'] = gh
        continue
    if style == 'KeyBox':
        add_block(clean(n), 'key'); continue
    if style == 'Pitfall':
        add_block(clean(n), 'pit'); continue
    if ctx['kind'] == 'part':
        ctx['obj']['html'].append(clean(n)); continue
    add_block(clean(n))
flush_flags()

# ---------- post-process ----------
for c in chapters.values():
    if c['builds'] == 'ALL':
        c['builds'] = list(range(1, c['n']))
    c['ans'] = answers.get(c['n'], [])
    assert len(c['ans']) == len(c['quiz']), (c['n'], len(c['ans']), len(c['quiz']))
    for q, a in zip(c['quiz'], c['ans']):
        q['a'] = a
    del c['ans']
    c['intro'] = ''.join(c['intro'])
    for s in c['secs']:
        s['html'] = ''.join(s['html'])
for a in appendices:
    for s in a['secs']:
        s['html'] = ''.join(s['html'])
for s in preface['secs']:
    s['html'] = ''.join(s['html'])
for p in parts:
    p['html'] = ''.join(p['html'])

# end pages: next heading's page
order = sorted(chapters)
for i, n in enumerate(order):
    c = chapters[n]
    nxt = chapters[order[i + 1]]['page'] if i + 1 < len(order) else None
    if nxt is None:
        nxt = appendices[0]['page'] - 1 if appendices and appendices[0]['page'] else c['quizPage']
    # a chapter ends on its quiz page (quiz is the last item)
    c['pageEnd'] = c['quizPage'] or c['page']

data = {'preface': preface, 'parts': parts, 'chapters': [chapters[n] for n in order], 'appendices': appendices}
json.dump(data, open(out, 'w', encoding='utf-8'), ensure_ascii=False)
print('parts', len(parts), 'chapters', len(chapters), 'appendices', len(appendices))
print('quiz questions', sum(len(c['quiz']) for c in chapters.values()))
print('sections', sum(len(c['secs']) for c in chapters.values()))
print('flagged sections', sum(1 for c in chapters.values() for s in c['secs'] if s.get('flag')))
miss = [c['n'] for c in chapters.values() if c['builds'] is None]
print('chapters missing builds:', miss)
nopage = [c['n'] for c in chapters.values() if not c['page'] or not c['quizPage']]
print('chapters missing page:', nopage)
