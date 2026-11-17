import sys, json, importlib.util
hdir = sys.argv[1]
spec = importlib.util.spec_from_file_location('harness', hdir + '/harness.py'); H = importlib.util.module_from_spec(spec); spec.loader.exec_module(H)
which = sys.argv[2] if len(sys.argv) > 2 else 'sol'
for lv in range(7):
    try: code = open('%s/%s/L%d.py' % (hdir, which, lv)).read()
    except FileNotFoundError: continue
    if lv == 1: code = code  # rocket_parts / rocket_cp are provided to the user's namespace by the lab
    for daily, seed in [(False, 1)] + ([(True, s) for s in (20261110, 20261111, 20261112, 7, 99)] if which == 'sol' else []):
        r = json.loads(H.run(code, json.dumps({'level': lv, 'seed': seed, 'daily': daily})))
        t = ' '.join('%s' % ('✓' if x['ok'] else '✗') for x in r['tests'])
        print('L%d %s seed %-9s score %3d passed %-5s tests %s %s' % (lv, 'daily' if daily else 'base ', seed, r['score'], r['passed'], t, ('ERR ' + r['error']) if r.get('error') else ''))
        if not daily or not r['passed']:
            for x in r['tests']: print('     ', '✓' if x['ok'] else '✗', x['name'], '—', x['detail'])
            for m in r['msgs']: print('      ·', m)
            print('      stats', r['stats'], 'stdout', repr(r['stdout'][:120]))
