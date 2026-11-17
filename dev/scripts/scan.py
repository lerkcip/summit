import re, sys, collections
txt = open(sys.argv[1], encoding='utf-8').read().split('\n')
# body starts at the second "Preface: How to Use This Document" w/o page number
start = max(i for i,l in enumerate(txt) if l.strip()=='Preface: How to Use This Document')
body = txt[start:]
ch_re = re.compile(r'^Chapter (\d+) · (.+)$')
quiz_re = re.compile(r'^Quiz (\d+)$')
appJ = next(i for i,l in enumerate(body) if l.startswith('Appendix J · Quiz Answer Keys'))
appK = next(i for i,l in enumerate(body) if l.startswith('Appendix K ·'))
main = body[:appJ]
chapters = {}
cur=None; inquiz=False
for i,l in enumerate(main):
    m = ch_re.match(l)
    if m:
        cur=int(m.group(1)); chapters[cur]={'title':m.group(2),'sections':[],'quiz':[],'line':i}; inquiz=False; continue
    if l.startswith('Appendix ') or l.startswith('Part '):
        inquiz=False
        if l.startswith('Appendix A'): cur=None
    if cur is None: continue
    if quiz_re.match(l): inquiz=True; continue
    sm = re.match(r'^(\d+)\.(\d+) (.+)$', l)
    if sm and int(sm.group(1))==cur and not inquiz:
        chapters[cur]['sections'].append(l)
    qm = re.match(r'^\s*(\d+)\.\s+\[(.+?)\]\s*(.*)$', l)
    if inquiz and qm:
        chapters[cur]['quiz'].append((int(qm.group(1)), qm.group(2), qm.group(3)[:60]))
tags = collections.Counter()
for c in sorted(chapters):
    d=chapters[c]
    t=[q[1] for q in d['quiz']]
    for x in t: tags['I' if x.startswith('I') else x]+=1
    print(c, '| secs', len(d['sections']), '| quiz', len(d['quiz']), '|', ' '.join(t))
print(tags, sum(tags.values()))
# answers
ans = body[appJ:appK]
acount = {}
cur=None
for l in ans:
    m = ch_re.match(l)
    if m: cur=int(m.group(1)); acount[cur]=0; continue
    if cur and re.match(r'^\s*\d+\.\s+', l): acount[cur]+=1
mis=[(c,len(chapters[c]['quiz']),acount.get(c)) for c in chapters if len(chapters[c]['quiz'])!=acount.get(c)]
print('mismatch q vs a:', mis)
