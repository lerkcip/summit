# usage: python3 -I dump_ch.py <curriculum.json> <n> [n...]   Prints chapters as plain text with $TeX$, for authoring.
import json,re,html,sys
C=json.load(open(sys.argv[1]))
def plain(h):
    h=re.sub(r'<span class="m[id]"[^>]*>(.*?)</span>',lambda m:'$'+html.unescape(m.group(1))+'$',h,flags=re.S)
    h=re.sub(r'<div class="key">','[KEY] ',h); h=re.sub(r'<div class="pit">','[PITFALL] ',h); h=re.sub(r'<aside class="flag">','[FLAG] ',h)
    h=re.sub(r'</(p|li|div|tr|h\d|aside)>','\n',h); h=re.sub(r'</t[dh]>',' | ',h); h=re.sub(r'<[^>]+>','',h)
    return re.sub(r'\n\s*\n+','\n',re.sub(r'[ \t]+',' ',html.unescape(h))).strip()
for n in map(int,sys.argv[2:]):
    c=C['chapters'][n-1]; print('=== CH',c['n'],c['title'],'| builds:',c['buildsText'][:90])
    for s in c['secs']: print('## §'+s['id'],s['t']); print(plain(s['html']))
