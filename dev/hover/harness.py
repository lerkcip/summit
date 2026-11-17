# SUMMIT · Hoverslam Lab harness. Runs in the browser under Pyodide (and natively for tests).
# Scope: a learning simulator. A booster flies up and returns to land on its own launch pad. Nothing here guides anything to an external target.
import json, math, random, io, sys, traceback, contextlib

G0 = 9.80665
G = 9.81

class Fail(Exception):
    pass

def need(ns, name):
    f = ns.get(name)
    if not callable(f):
        raise Fail("Define a function named %s()." % name)
    return f

def close(a, b, rel=0.02, ab=1e-9):
    try:
        return abs(float(a) - float(b)) <= rel * abs(b) + ab
    except Exception:
        return False

def num(x, what):
    try:
        v = float(x)
    except Exception:
        raise Fail("%s should be a number, got %r." % (what, x))
    if v != v or v in (float('inf'), float('-inf')):
        raise Fail("%s is not finite." % what)
    return v

def run_test(tests, name, fn):
    try:
        ok, detail = fn()
    except Fail as e:
        ok, detail = False, str(e)
    except Exception as e:
        ok, detail = False, "%s: %s" % (type(e).__name__, e)
    tests.append({'name': name, 'ok': bool(ok), 'detail': detail})
    return bool(ok)

def thin(arr, n=240):
    if len(arr) <= n:
        return [round(v, 3) for v in arr]
    k = len(arr) / float(n)
    out = [round(arr[int(i * k)], 3) for i in range(n)]
    out[-1] = round(arr[-1], 3)
    return out

def rho(h):
    return 1.225 * math.exp(-max(h, 0.0) / 8500.0)

# ───────────────────────── L0 · ballistic hop, Python basics ─────────────────────────
def run_L0(ns, rng, daily):
    isp = rng.choice([240.0, 260.0, 300.0]) if daily else 280.0
    m0 = round(rng.uniform(1400, 1800)) * 1.0 if daily else 1600.0
    mp = round(rng.uniform(450, 650)) * 1.0 if daily else 600.0
    thrust = 30000.0
    mdot = thrust / (isp * G0)
    mf = m0 - mp
    tb = mp / mdot
    tests = []
    def t1():
        f = need(ns, 'burn_time'); got = num(f(mp, mdot), 'burn_time')
        return close(got, tb), "burn_time(%.0f, %.3f) = %.3f s, expected %.3f s" % (mp, mdot, got, tb)
    def t2():
        f = need(ns, 'delta_v'); exp = isp * G0 * math.log(m0 / mf); got = num(f(isp, m0, mf), 'delta_v')
        return close(got, exp), "delta_v(%.0f, %.0f, %.0f) = %.1f m/s, expected %.1f m/s" % (isp, m0, mf, got, exp)
    def t3():
        f = need(ns, 'burnout_velocity'); exp = isp * G0 * math.log(m0 / mf) - G * tb; got = num(f(isp, m0, mf, tb), 'burnout_velocity')
        return close(got, exp), "burnout_velocity = %.1f m/s, expected %.1f m/s (ideal Δv minus g·t_burn)" % (got, exp)
    def t4():
        f = need(ns, 'coast_apogee'); hb, vb = 5200.0, 310.0; exp = hb + vb * vb / (2 * G); got = num(f(hb, vb), 'coast_apogee')
        return close(got, exp), "coast_apogee(5200, 310) = %.0f m, expected %.0f m" % (got, exp)
    # reference Euler flight, no drag
    def ref(dt):
        h = v = t = 0.0; m = m0; ap = 0.0
        while True:
            T = thrust if m > mf + 1e-9 else 0.0
            a = T / m - G
            h += v * dt; v += a * dt
            if T > 0: m = max(mf, m - mdot * dt)
            t += dt; ap = max(ap, h)
            if h <= 0 and t > 1: break
            if t > 2000: break
        return ap, t
    user = {}
    def t5():
        f = need(ns, 'simulate'); r = f(m0, mf, thrust, mdot, 0.05)
        if not isinstance(r, (tuple, list)) or len(r) != 2: raise Fail("simulate() should return (apogee_m, flight_time_s).")
        ap, ft = num(r[0], 'apogee'), num(r[1], 'flight time'); e_ap, e_t = ref(0.05)
        user['ap'] = ap
        return close(ap, e_ap, 0.02) and close(ft, e_t, 0.02), "simulate() gave apogee %.0f m, flight time %.1f s; expected about %.0f m and %.1f s" % (ap, ft, e_ap, e_t)
    n_ok = sum([run_test(tests, 'burn_time', t1), run_test(tests, 'delta_v (rocket equation)', t2), run_test(tests, 'burnout_velocity (gravity loss)', t3), run_test(tests, 'coast_apogee', t4), run_test(tests, 'simulate: your own flight loop', t5)])
    # the flight as it would really go, with drag, for the playback
    T_, H_, V_, TH_ = [], [], [], []
    h = v = t = 0.0; m = m0; dt = 0.02; ap_real = 0.0
    while t < 600:
        Tn = thrust if m > mf + 1e-9 else 0.0
        D = 0.5 * rho(h) * 1.2 * v * abs(v)
        a = (Tn - D) / m - G
        h += v * dt; v += a * dt
        if Tn > 0: m = max(mf, m - mdot * dt)
        t += dt; ap_real = max(ap_real, h)
        if int(t / dt) % 10 == 0:
            T_.append(t); H_.append(max(h, 0)); V_.append(v); TH_.append(1.0 if Tn > 0 else 0.0)
        if h <= 0 and t > 1: break
    msgs = []
    if 'ap' in user:
        msgs.append("Your no-drag apogee: %.0f m. With drag the hop tops out at %.0f m and comes back at %.0f m/s with nothing to slow it." % (user['ap'], ap_real, abs(v)))
    msgs.append("No control, no landing: the booster hits the pad at speed. The next levels fix that.")
    return {'score': 20 * n_ok, 'passed': n_ok == 5, 'tests': tests, 'msgs': msgs,
            'stats': {'Apogee with drag': '%.0f m' % ap_real, 'Impact speed': '%.0f m/s' % abs(v), 'Burn time': '%.1f s' % tb},
            'flight': {'t': thin(T_), 'h': thin(H_), 'x': [0.0] * len(thin(T_)), 'thr': thin(TH_), 'tilt': [0.0] * len(thin(T_)), 'crash': True},
            'plots': [{'title': 'Altitude with drag', 'x': thin(T_), 'xl': 't (s)', 'yl': 'h (m)', 'series': [{'name': 'altitude', 'y': thin(H_)}]}]}

# ───────────────────────── L1 · passive stability: CP behind CG ─────────────────────────
ROCKET = {'d': 0.10, 'L': 2.0, 'nose_len': 0.30, 'fin_le': 1.80, 'cr': 0.15, 'ct': 0.08, 'sweep': 0.05, 'n': 4}
def fin_cn(span):
    r = ROCKET; d = r['d']; R = d / 2.0
    lf = math.sqrt(span ** 2 + (r['sweep'] + r['ct'] / 2.0 - r['cr'] / 2.0) ** 2)
    cn = (1 + R / (span + R)) * (4 * r['n'] * (span / d) ** 2) / (1 + math.sqrt(1 + (2 * lf / (r['cr'] + r['ct'])) ** 2))
    return cn
def fin_xcp():
    r = ROCKET; cr, ct, xr = r['cr'], r['ct'], r['sweep']
    return r['fin_le'] + xr / 3.0 * (cr + 2 * ct) / (cr + ct) + (cr + ct - cr * ct / (cr + ct)) / 6.0
def rocket_parts(span, ballast):
    masses = [0.30, 0.80, 1.20, 0.40, 0.25 * span / 0.10, ballast]
    xs = [0.20, 1.00, 1.75, 0.60, 1.87, 0.10]
    return masses, xs
def rocket_cp(span):
    cns = [2.0, fin_cn(span)]; xs = [0.466 * ROCKET['nose_len'], fin_xcp()]
    return sum(c * x for c, x in zip(cns, xs)) / sum(cns), sum(cns)
def fly_L1(span, ballast, wind, gust_t):
    masses, xs = rocket_parts(span, ballast)
    m = sum(masses); xcg = sum(a * b for a, b in zip(masses, xs)) / m
    xcp, cna = rocket_cp(span)
    d = ROCKET['d']; S = math.pi * d * d / 4
    margin = (xcp - xcg) / d
    I = sum(mm * (xx - xcg) ** 2 for mm, xx in zip(masses, xs)) + m * ROCKET['L'] ** 2 / 40.0
    cda = 0.0060 + 0.020 * span
    thrust, tb = 160.0, 2.2
    x = z = 0.0; vx = 0.0; vz = 0.5; th = 0.0; om = 0.0; t = 0.0; dt = 0.002
    T_, X_, Z_, A_, TH_ = [], [], [], [], []
    amax = 0.0; tumbled = False; ap = 0.0
    while t < 60:
        w = wind * (1.0 + (0.8 if gust_t <= t <= gust_t + 0.6 else 0.0)) * min(1.0, z / 30.0 + 0.2)
        ax_, az_ = vx - w, vz
        V = math.hypot(ax_, az_)
        gam = math.atan2(ax_, az_)                      # air-relative flight direction from vertical
        alpha = th - gam
        alpha = (alpha + math.pi) % (2 * math.pi) - math.pi
        q = 0.5 * rho(z) * V * V
        Nf = q * S * cna * math.sin(alpha) if abs(alpha) < 1.2 else q * S * cna * math.copysign(0.9, alpha)
        Df = q * cda
        Tn = thrust if t < tb else 0.0
        # forces in inertial frame: thrust along body, drag opposite air-relative velocity, normal force perpendicular to body
        fx = Tn * math.sin(th) - Df * math.sin(gam) + Nf * math.cos(th)
        fz = Tn * math.cos(th) - Df * math.cos(gam) - Nf * math.sin(th) - m * G
        tq = -Nf * (xcp - xcg) - 0.5 * rho(z) * V * S * cna * (xcp - xcg) ** 2 * om - 0.02 * om
        if z <= 0 and fz < 0 and t < 0.3: fz = 0.0; fx = 0.0
        vx += fx / m * dt; vz += fz / m * dt; x += vx * dt; z += vz * dt
        if z > 2.0: om += tq / I * dt; th += om * dt          # the launch rail holds it straight for the first 2 m
        t += dt; ap = max(ap, z)
        if t > 0.25 and vz > 5 and V > 12: amax = max(amax, abs(alpha))
        if abs(th) > 1.4 and vz > 0: tumbled = True
        if int(t / dt) % 25 == 0:
            T_.append(t); X_.append(x); Z_.append(max(z, 0)); A_.append(math.degrees(alpha) if V > 5 else 0.0); TH_.append(th)
        if (vz < 0 and z < ap - 2) or z < -1: break
    return {'margin': margin, 'xcg': xcg, 'xcp': xcp, 'apogee': ap, 'amax': math.degrees(amax), 'tumbled': tumbled, 'drift': x, 'mass': m,
            't': T_, 'x': X_, 'z': Z_, 'alpha': A_, 'th': TH_}
def run_L1(ns, rng, daily):
    wind = rng.uniform(3.0, 8.0) * rng.choice([-1, 1]) if daily else 5.0
    gust_t = rng.uniform(0.6, 1.6) if daily else 1.0
    tests = []
    def t1():
        f = need(ns, 'combined_cg'); got = num(f([2.0, 1.0, 1.0], [0.5, 1.5, 2.5]), 'combined_cg')
        return close(got, 1.25), "combined_cg([2,1,1],[0.5,1.5,2.5]) = %.3f m, expected 1.250 m" % got
    def t2():
        f = need(ns, 'combined_cp'); got = num(f([2.0, 6.0], [0.14, 1.90]), 'combined_cp')
        return close(got, 1.46), "combined_cp([2,6],[0.14,1.90]) = %.3f m, expected 1.460 m" % got
    def t3():
        f = need(ns, 'static_margin'); got = num(f(1.20, 1.38, 0.10), 'static_margin')
        return close(got, 1.8), "static_margin(1.20, 1.38, 0.10) = %.2f cal, expected 1.80 cal" % got
    n_ok = sum([run_test(tests, 'combined_cg', t1), run_test(tests, 'combined_cp', t2), run_test(tests, 'static_margin', t3)])
    res = {}
    def t4():
        f = need(ns, 'design'); r = f()
        if not isinstance(r, (tuple, list)) or len(r) != 2: raise Fail("design() should return (fin_span_m, nose_ballast_kg).")
        span, bal = num(r[0], 'fin span'), num(r[1], 'ballast')
        if not (0.03 <= span <= 0.25): raise Fail("Fin span must be between 0.03 and 0.25 m.")
        if not (0.0 <= bal <= 1.5): raise Fail("Nose ballast must be between 0 and 1.5 kg.")
        res.update(fly_L1(span, bal, wind, gust_t)); res['span'] = span; res['bal'] = bal
        ok = 1.0 <= res['margin'] <= 2.0
        return ok, "Static margin %.2f calibers (CG %.3f m, CP %.3f m from the nose). Target: 1.0 to 2.0." % (res['margin'], res['xcg'], res['xcp'])
    ok4 = run_test(tests, 'design(): static margin in the 1–2 caliber band', t4)
    score = 15 * n_ok; msgs = []; flight = None; plots = []
    if res:
        best = fly_L1(0.089, 0.0, wind, gust_t)
        stable = not res['tumbled'] and res['margin'] > 0
        frac = res['apogee'] / best['apogee'] if best['apogee'] > 0 else 0
        if ok4: score += 25
        if stable: score += int(round(30 * min(1.0, frac)))
        if res['tumbled'] or res['margin'] <= 0: msgs.append("CP is ahead of the CG (or too close): the rocket swapped ends. Move the CP aft with more fin span or the CG forward with ballast.")
        elif res['margin'] > 2.0: msgs.append("Over-stable at %.1f calibers: it weathercocked hard into the %.0f m/s wind and carries extra fin drag or ballast." % (res['margin'], abs(wind)))
        elif res['margin'] < 1.0: msgs.append("Marginal at %.2f calibers: stable on paper, but with little reserve as the CP shifts with angle of attack." % res['margin'])
        else: msgs.append("Stable. Apogee %.0f m, which is %.0f%% of a clean 1.5-caliber design in this wind." % (res['apogee'], 100 * frac))
        flight = {'t': thin(res['t']), 'h': thin(res['z']), 'x': thin(res['x']), 'thr': [1.0 if tt < 2.2 else 0.0 for tt in thin(res['t'])], 'tilt': thin(res['th']), 'crash': bool(res['tumbled']), 'small': True}
        plots = [{'title': 'Angle of attack', 'x': thin(res['t']), 'xl': 't (s)', 'yl': 'α (deg)', 'series': [{'name': 'α', 'y': thin(res['alpha'])}]}]
    stats = {}
    if res: stats = {'Static margin': '%.2f cal' % res['margin'], 'Apogee': '%.0f m' % res['apogee'], 'Peak angle of attack': '%.1f°' % res['amax'], 'Wind': '%.1f m/s' % abs(wind)}
    return {'score': min(100, score), 'passed': n_ok == 3 and ok4 and bool(res) and not res['tumbled'] and score >= 70, 'tests': tests, 'msgs': msgs, 'stats': stats, 'flight': flight, 'plots': plots}

# ───────────────────────── L2 · integrate the trajectory: Euler → RK4 ─────────────────────────
def run_L2(ns, rng, daily):
    isp = 280.0; thrust = 30000.0; mdot = thrust / (isp * G0)
    m0 = round(rng.uniform(1400, 1800)) * 1.0 if daily else 1600.0
    mp = 600.0; mf = m0 - mp; tb = mp / mdot
    cda = rng.uniform(0.8, 1.6) if daily else 1.2
    def f_burn(t, y):
        h, v, m = y
        return [v, (thrust - 0.5 * rho(h) * cda * v * abs(v)) / m - G, -mdot]
    def f_coast(t, y):
        h, v, m = y
        return [v, -0.5 * rho(h) * cda * v * abs(v) / m - G, 0.0]
    def rk4(f, t, y, dt):
        k1 = f(t, y); k2 = f(t + dt / 2, [a + dt / 2 * b for a, b in zip(y, k1)]); k3 = f(t + dt / 2, [a + dt / 2 * b for a, b in zip(y, k2)]); k4 = f(t + dt, [a + dt * b for a, b in zip(y, k3)])
        return [a + dt / 6 * (b + 2 * c + 2 * d + e) for a, b, c, d, e in zip(y, k1, k2, k3, k4)]
    def flight(step, dt, log=None):
        y = [0.0, 0.0, m0]; t = 0.0; n = int(round(tb / dt)); hb = tb / n
        for i in range(n):
            y = step(f_burn, t, y, hb); t += hb
            if log is not None: log.append((t, y[0]))
        y = [float(y[0]), float(y[1]), mf]; guard = 0
        while y[1] > 0 and guard < 200000:
            y2 = step(f_coast, t, y, dt)
            if y2[1] <= 0:
                fr = y[1] / (y[1] - y2[1]); y = [y[0] + fr * (y2[0] - y[0]), 0.0, mf]; t += fr * dt
                if log is not None: log.append((t, y[0]))
                break
            y = [float(a) for a in y2]; t += dt; guard += 1
            if log is not None: log.append((t, y[0]))
        return y[0]
    def as_list(v, what):
        if not isinstance(v, (list, tuple)) or len(v) == 0: raise Fail("%s should return a list of floats the same length as y." % what)
        return [num(a, what) for a in v]
    tests = []
    lin = lambda t, y: [-2.0 * y[0]]
    def t1():
        f = need(ns, 'euler_step'); got = as_list(f(lin, 0.0, [1.0], 0.1), 'euler_step')[0]
        return close(got, 0.8, 1e-9, 1e-9), "One Euler step of y' = -2y from 1.0 with dt = 0.1 gave %.6f, expected 0.800000" % got
    def t2():
        f = need(ns, 'rk4_step'); got = as_list(f(lin, 0.0, [1.0], 0.1), 'rk4_step')[0]; exp = 1 - 0.2 + 0.02 - 0.004 / 3 + 0.0002 / 3
        return close(got, exp, 1e-9, 1e-9), "One RK4 step of y' = -2y from 1.0 with dt = 0.1 gave %.8f, expected %.8f" % (got, exp)
    y_start = [3000.0, 250.0, mf]
    def end_state(step, dt, T=2.0):
        y = list(y_start); t = 0.0
        for i in range(int(round(T / dt))):
            y = as_list(step(f_coast, t, y, dt), 'your step'); t += dt
        return y
    exact = end_state(rk4, 0.001)
    def order(step):
        e1 = abs(end_state(step, 0.2)[0] - exact[0]); e2 = abs(end_state(step, 0.1)[0] - exact[0])
        if e2 <= 0: return 99.0, e1, e2
        return math.log(e1 / e2, 2), e1, e2
    def t3():
        p, e1, e2 = order(need(ns, 'euler_step'))
        return 0.7 <= p <= 1.4, "Euler: altitude error %.3g m at dt = 0.2 and %.3g m at dt = 0.1, so observed order %.2f (expected about 1)" % (e1, e2, p)
    def t4():
        p, e1, e2 = order(need(ns, 'rk4_step'))
        return (3.4 <= p <= 4.8) or e1 < 1e-7, "RK4: altitude error %.3g m at dt = 0.2 and %.3g m at dt = 0.1, so observed order %.2f (expected about 4)" % (e1, e2, p)
    ref_ap = flight(rk4, 0.002)
    info = {}
    def t5():
        ap = flight(lambda f, t, y, dt: as_list(need(ns, 'rk4_step')(f, t, y, dt), 'rk4_step'), 0.1)
        info['rk'] = ap
        return close(ap, ref_ap, 0.002), "Full flight with your RK4 at dt = 0.1 s: apogee %.1f m; reference %.1f m" % (ap, ref_ap)
    n_ok = sum([run_test(tests, 'euler_step: one step', t1), run_test(tests, 'rk4_step: one step', t2), run_test(tests, 'Euler is first order', t3), run_test(tests, 'RK4 is fourth order', t4), run_test(tests, 'Apogee within 0.2% of the reference', t5)])
    plots = []; msgs = []
    try:
        le, lr, lf = [], [], []
        flight(lambda f, t, y, dt: as_list(ns['euler_step'](f, t, y, dt), 'euler_step'), 1.0, le)
        flight(rk4, 0.05, lf)
        ape = max(p[1] for p in le)
        msgs.append("Euler at dt = 1 s puts apogee at %.0f m against the reference %.0f m: an error of %.0f m. RK4 at dt = 0.1 s is within %.2f m." % (ape, ref_ap, abs(ape - ref_ap), abs(info.get('rk', ref_ap) - ref_ap)))
        tt = [i * 0.5 for i in range(int(lf[-1][0] / 0.5) + 1)]
        def interp(log, t):
            if t <= log[0][0]: return log[0][1] * t / log[0][0] if log[0][0] > 0 else 0.0
            for i in range(1, len(log)):
                if log[i][0] >= t:
                    a, b = log[i - 1], log[i]; return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0])
            return log[-1][1]
        plots.append({'title': 'Ascent: reference vs your Euler at dt = 1 s', 'x': thin(tt), 'xl': 't (s)', 'yl': 'h (m)', 'series': [{'name': 'reference', 'y': thin([interp(lf, t) for t in tt])}, {'name': 'Euler, dt = 1 s', 'y': thin([interp(le, t) for t in tt])}]})
    except Exception:
        pass
    return {'score': 20 * n_ok, 'passed': n_ok == 5, 'tests': tests, 'msgs': msgs, 'stats': {'Reference apogee': '%.0f m' % ref_ap, 'Burn time': '%.1f s' % tb}, 'flight': None, 'plots': plots}

# ───────────────────────── L3 · PID pitch hold ─────────────────────────
def sim_L3(ctrl, a, b, bias, gusts, noise, seed, th0=1.5):
    r = random.Random(seed); dt = 0.01; th = math.radians(th0); om = 0.0; de = 0.0; mem = {'a': a, 'b': b}
    T_, TH_, DE_ = [], [], []; iae = 0.0; mx = 0.0; sat = 0; lim = math.radians(6.0); diverged = False; tail = []
    n = int(20.0 / dt)
    for i in range(n):
        t = i * dt
        d = bias + sum(g[1] for g in gusts if g[0] <= t < g[0] + 0.5)
        cmd = num(ctrl(th + r.gauss(0, noise), om + r.gauss(0, noise * 2), dt, mem), 'control() output')
        if abs(cmd) >= lim: sat += 1
        cmd = max(-lim, min(lim, cmd))
        de += (cmd - de) / 0.05 * dt
        om += (a * th + b * de + d) * dt; th += om * dt
        iae += abs(th) * dt; mx = max(mx, abs(th)) if t > 0.05 else mx
        if t >= 18.0: tail.append(th)
        if i % 5 == 0: T_.append(t); TH_.append(math.degrees(th)); DE_.append(math.degrees(de))
        if abs(th) > math.radians(25): diverged = True; break
    ss = abs(sum(tail) / len(tail)) if tail else 9.0
    return {'iae': iae, 'max': math.degrees(mx), 'sat': sat / float(n), 'ss': math.degrees(ss), 'div': diverged, 't': T_, 'th': TH_, 'de': DE_}
def ref_pid(a, b):
    wn, z = 5.0, 0.8; kp = (wn * wn + a) / b; kd = 2 * z * wn / b; ki = 0.8 * kp
    def c(th, om, dt, mem):
        mem['i'] = max(-0.2, min(0.2, mem.get('i', 0.0) + th * dt))
        return -(kp * th + kd * om + ki * mem['i'])
    return c
def run_L3(ns, rng, daily):
    a = rng.uniform(2.0, 5.5) if daily else 4.0
    b = a * rng.uniform(0.5, 0.9) if daily else 2.0
    th0 = 1.0 if daily else 1.5
    auth = b * math.radians(6.0)                      # angular acceleration the gimbal can command
    bias = rng.uniform(0.08, 0.15) * auth * rng.choice([-1, 1]) if daily else 0.035
    gusts = [(rng.uniform(3, 6), rng.uniform(0.25, 0.45) * auth * rng.choice([-1, 1])), (rng.uniform(9, 14), rng.uniform(0.25, 0.45) * auth * rng.choice([-1, 1]))] if daily else [(4.0, 0.12), (11.0, -0.14)]
    noise = math.radians(0.03); seed = rng.randint(1, 10 ** 6)
    tests = []; res = {}
    def t0():
        f = need(ns, 'control'); mem = {'a': a, 'b': b}
        v = num(f(0.01, 0.0, 0.01, mem), 'control() output')
        return v < 0, "A positive pitch error should command a negative (restoring) gimbal angle; control(0.01, 0, 0.01, mem) returned %.4f rad" % v
    ok0 = run_test(tests, 'Sign: the gimbal opposes the error', t0)
    def t1():
        res.update(sim_L3(need(ns, 'control'), a, b, bias, gusts, noise, seed, th0))
        return not res['div'], "Stayed within 25° for the whole 20 s flight" if not res['div'] else "Diverged: the pitch error ran away. The plant is unstable on its own (a = %.1f), so the loop needs enough proportional gain: Kp·b > a." % a
    ok1 = run_test(tests, 'Closed loop is stable', t1)
    score = 0; msgs = []; plots = []
    if res:
        refr = sim_L3(ref_pid(a, b), a, b, bias, gusts, noise, seed, th0)
        def t2(): return res['max'] < 3.0, "Peak pitch error %.2f° (limit 3°)" % res['max']
        def t3(): return res['ss'] < 0.2, "Steady error over the last 2 s: %.3f° (limit 0.2°). A constant wind torque needs integral action." % res['ss']
        def t4(): return res['sat'] < 0.2, "Gimbal on its ±6° stop %.0f%% of the time (limit 20%%)" % (100 * res['sat'])
        ok2 = run_test(tests, 'Peak error under 3°', t2); ok3 = run_test(tests, 'Steady-state error under 0.2°', t3); ok4 = run_test(tests, 'Gimbal not saturated', t4)
        if ok1:
            score = 30 + (20 if ok2 else 0) + (20 if ok3 else 0) + (10 if ok4 else 0) + int(round(20 * min(1.0, refr['iae'] / max(res['iae'], 1e-9))))
        msgs.append("Integrated error %.3f rad·s; a well-tuned PID on this plant scores %.3f." % (res['iae'], refr['iae']))
        plots = [{'title': 'Pitch error', 'x': res['t'], 'xl': 't (s)', 'yl': 'θ (deg)', 'series': [{'name': 'θ', 'y': [round(v, 3) for v in res['th']]}]},
                 {'title': 'Gimbal angle', 'x': res['t'], 'xl': 't (s)', 'yl': 'δ (deg)', 'series': [{'name': 'δ', 'y': [round(v, 3) for v in res['de']]}]}]
        for p in plots: p['x'] = thin(p['x']); p['series'][0]['y'] = thin(p['series'][0]['y'])
    stats = {'Plant': "θ'' = %.1fθ + %.1fδ" % (a, b)}
    if res: stats.update({'Peak error': '%.2f°' % res['max'], 'Steady error': '%.3f°' % res['ss']})
    return {'score': min(100, score), 'passed': bool(res) and ok0 and ok1 and score >= 70, 'tests': tests, 'msgs': msgs, 'stats': stats, 'flight': None, 'plots': plots}

# ───────────────────────── L4 · rigid-body attitude with quaternions ─────────────────────────
def qmul(p, q):
    return [p[0] * q[0] - p[1] * q[1] - p[2] * q[2] - p[3] * q[3], p[0] * q[1] + p[1] * q[0] + p[2] * q[3] - p[3] * q[2], p[0] * q[2] - p[1] * q[3] + p[2] * q[0] + p[3] * q[1], p[0] * q[3] + p[1] * q[2] - p[2] * q[1] + p[3] * q[0]]
def qnorm(q):
    n = math.sqrt(sum(c * c for c in q)); return [c / n for c in q]
def sim_L4(ctrl, q0, w0, I, tmax, T=90.0):
    dt = 0.02; q = list(q0); w = list(w0); mem = {}; qt = [1.0, 0.0, 0.0, 0.0]
    T_, A_, W_ = [], [], []; effort = 0.0; settle = None; hold = 0.0
    def wdot(w, tq):
        return [(tq[0] - (I[2] - I[1]) * w[1] * w[2]) / I[0], (tq[1] - (I[0] - I[2]) * w[2] * w[0]) / I[1], (tq[2] - (I[1] - I[0]) * w[0] * w[1]) / I[2]]
    n = int(T / dt)
    for i in range(n):
        t = i * dt
        out = ctrl(list(q), list(w), list(qt), dt, mem)
        if not isinstance(out, (list, tuple)) or len(out) != 3: raise Fail("control() should return a list of three torques [tx, ty, tz] in N·m.")
        tq = [max(-tmax, min(tmax, num(c, 'torque'))) for c in out]
        effort += sum(abs(c) for c in tq) * dt
        k1 = wdot(w, tq); wm = [a + 0.5 * dt * b for a, b in zip(w, k1)]; k2 = wdot(wm, tq)
        w = [a + dt * b for a, b in zip(w, k2)]
        dq = qmul(q, [0.0, w[0], w[1], w[2]])
        q = qnorm([a + 0.5 * dt * b for a, b in zip(q, dq)])
        ang = math.degrees(2 * math.acos(min(1.0, abs(q[0]))))
        wn = math.degrees(math.sqrt(sum(c * c for c in w)))
        if ang < 2.0 and wn < 0.5:
            hold += dt
            if hold >= 5.0 and settle is None: settle = t - 5.0
        else: hold = 0.0; settle = None if hold == 0.0 and settle is not None and ang > 4.0 else settle
        if i % 10 == 0: T_.append(t); A_.append(ang); W_.append(wn)
    return {'settle': settle, 'ang': ang, 'rate': wn, 'effort': effort, 't': T_, 'a': A_, 'w': W_}
def run_L4(ns, rng, daily):
    I = [900.0, 900.0, 120.0]; tmax = 400.0
    ax = [rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.4, 0.4)] if daily else [0.6, -0.7, 0.2]
    n = math.sqrt(sum(c * c for c in ax)); ax = [c / n for c in ax]
    ang0 = math.radians(rng.uniform(100, 170) if daily else 140.0)
    q0 = [math.cos(ang0 / 2)] + [c * math.sin(ang0 / 2) for c in ax]
    if (rng.random() < 0.5) if daily else True: q0 = [-c for c in q0]          # same attitude, opposite sign: the long way round if ignored
    w0 = [math.radians(rng.uniform(-4, 4)) for _ in range(3)] if daily else [math.radians(3.0), math.radians(-2.0), math.radians(1.0)]
    tests = []
    a_, b_ = qnorm([0.3, 0.5, -0.4, 0.7]), qnorm([0.9, -0.1, 0.3, 0.2])
    def veq(u, v, tol=1e-6): return len(u) == len(v) and all(abs(float(x) - float(y)) < tol for x, y in zip(u, v))
    def t1():
        f = need(ns, 'quat_mul'); got = list(f(a_, b_)); exp = qmul(a_, b_)
        return veq(got, exp), "quat_mul matches the Hamilton product" if veq(got, exp) else "quat_mul(a, b) gave %s, expected %s" % ([round(float(c), 4) for c in got], [round(c, 4) for c in exp])
    def t2():
        f = need(ns, 'quat_conj'); got = list(f(a_)); exp = [a_[0], -a_[1], -a_[2], -a_[3]]
        return veq(got, exp), "quat_conj flips the vector part" if veq(got, exp) else "quat_conj gave %s" % [round(float(c), 4) for c in got]
    def t3():
        f = need(ns, 'quat_error'); qt = [1.0, 0.0, 0.0, 0.0]; q = qnorm([-0.9, 0.1, 0.3, -0.2]); got = list(f(q, qt))
        ok = float(got[0]) >= 0 and veq([abs(float(c)) for c in got], [abs(c) for c in q], 1e-6)
        return ok, "quat_error returns the short-way error (scalar part ≥ 0)" if ok else "quat_error(q, target) should be conj(target) ⊗ q with its sign flipped when the scalar part is negative; got %s" % [round(float(c), 4) for c in got]
    n_ok = sum([run_test(tests, 'quat_mul', t1), run_test(tests, 'quat_conj', t2), run_test(tests, 'quat_error takes the short way', t3)])
    res = {}
    def t4():
        res.update(sim_L4(need(ns, 'control'), q0, w0, I, tmax))
        ok = res['settle'] is not None
        return ok, ("Settled within 2° and 0.5°/s at t = %.1f s" % res['settle']) if ok else "Not settled after 90 s: final error %.1f°, rate %.2f°/s" % (res['ang'], res['rate'])
    ok4 = run_test(tests, 'Slew from a %.0f° tumble and hold' % math.degrees(ang0), t4)
    score = 10 * n_ok; msgs = []; plots = []
    if res:
        if ok4: score += 40 + int(round(30 * min(1.0, 32.0 / max(res['settle'], 1.0))))
        msgs.append("Torque impulse used: %.0f N·m·s. The fastest slews saturate the ±%.0f N·m jets, then brake." % (res['effort'], tmax))
        plots = [{'title': 'Attitude error', 'x': thin(res['t']), 'xl': 't (s)', 'yl': 'error (deg)', 'series': [{'name': 'angle', 'y': thin(res['a'])}]}, {'title': 'Body rate', 'x': thin(res['t']), 'xl': 't (s)', 'yl': '|ω| (deg/s)', 'series': [{'name': 'rate', 'y': thin(res['w'])}]}]
    stats = {'Start': '%.0f° off, tumbling' % math.degrees(ang0)}
    if res and res['settle'] is not None: stats['Settled at'] = '%.1f s' % res['settle']
    return {'score': min(100, score), 'passed': n_ok == 3 and ok4 and score >= 70, 'tests': tests, 'msgs': msgs, 'stats': stats, 'flight': None, 'plots': plots}

# ───────────────────────── L5 · noisy sensors and a Kalman filter ─────────────────────────
def alt_sigma(h, k):
    return 0.3 + k * max(h, 0.0)            # radar altimeter: error grows with range
def run_L5(ns, rng, daily):
    k_alt = rng.uniform(0.003, 0.006) if daily else 0.004
    sig_a = rng.uniform(0.3, 0.8) if daily else 0.5
    bias = rng.uniform(-0.25, 0.25) if daily else 0.15
    m = rng.uniform(1050, 1250) if daily else 1150.0
    cda = 1.2; a_nom = 16.0; a_lo, a_hi = 8.0, 20.0
    seed = rng.randint(1, 10 ** 6); r = random.Random(seed)
    tests = []; res = {}
    def flight():
        init = need(ns, 'kf_init'); pred = need(ns, 'kf_predict'); upd = need(ns, 'kf_update'); ign = need(ns, 'ignite')
        est = init()
        if not isinstance(est, dict) or 'x' not in est or 'P' not in est: raise Fail("kf_init() should return a dict with 'x' = [h, v] and 'P' = 2×2 covariance.")
        h, v, t, dt = 3000.0, -120.0, 0.0, 0.05
        T_, H_, HE_, V_, VE_, Z_ = [], [], [], [], [], []
        eh = ev = ez = 0.0; n = nz = 0; burning = False; h_ign = None; i = 0; zlast = h; cut_h = None
        while t < 200:
            he, ve = num(est['x'][0], 'estimated h'), num(est['x'][1], 'estimated v')
            if burning:
                a_app = max(a_lo, min(a_hi, ve * ve / (2 * max(he, 0.3))))      # throttle holds the deceleration your estimate says is needed
                sf = a_app + G
            else:
                sf = -0.5 * rho(h) * cda * v * abs(v) / m
            a_meas = sf + bias + r.gauss(0, sig_a)
            est = pred(est, a_meas, dt) or est
            h += v * dt; v += (sf - G) * dt; t += dt; i += 1
            if i % 4 == 0:
                sg = alt_sigma(h, k_alt); zlast = h + r.gauss(0, sg)
                est = upd(est, zlast, alt_sigma(zlast, k_alt) ** 2) or est
                if t > 4.0: ez += (zlast - h) ** 2; nz += 1
            he, ve = num(est['x'][0], 'estimated h'), num(est['x'][1], 'estimated v')
            if t > 4.0: eh += (he - h) ** 2; ev += (ve - v) ** 2; n += 1
            if not burning and bool(ign(est)): burning = True; h_ign = h
            if i % 4 == 0: T_.append(t); H_.append(h); HE_.append(he); V_.append(v); VE_.append(ve); Z_.append(zlast)
            if burning and v >= -0.2 and h > 0: cut_h = h; break
            if h <= 0: break
        vt = abs(v) if h <= 0 else math.sqrt(v * v + 2 * G * max(h, 0.0))     # engine cut at rest above the pad: it falls the rest
        res.update({'rh': math.sqrt(eh / max(n, 1)), 'rv': math.sqrt(ev / max(n, 1)), 'rz': math.sqrt(ez / max(nz, 1)), 'vt': vt, 'cut_h': cut_h, 'burned': burning,
                    't': T_, 'h': H_, 'he': HE_, 'v': V_, 've': VE_, 'z': Z_, 'h_ign': h_ign})
    def t1():
        flight()
        return res['rh'] < 0.65 * res['rz'], "Altitude estimate RMS error %.2f m; the raw altimeter averaged ±%.2f m (need under 65%% of that)" % (res['rh'], res['rz'])
    ok1 = run_test(tests, 'Filter beats the raw altimeter', t1)
    score = 0; msgs = []; plots = []; flightd = None
    if res:
        def t2(): return res['rv'] < 2.5, "Velocity estimate RMS error %.2f m/s (need under 2.5 m/s). The altimeter never measures velocity: it comes from the model and the cross terms of P." % res['rv']
        def t3():
            if not res['burned']: return False, "ignite() never returned True: the booster hit the pad at %.0f m/s." % res['vt']
            return res['vt'] <= 6.0, "Touchdown at %.1f m/s%s (need 6 m/s or less)" % (res['vt'], '' if not res['cut_h'] or res['cut_h'] < 0.3 else ', after coming to rest %.1f m up and dropping' % res['cut_h'])
        ok2 = run_test(tests, 'Velocity estimate', t2); ok3 = run_test(tests, 'Landing burn timed from your estimate', t3)
        score = (25 if ok1 else int(15 * min(1, 0.65 * res['rz'] / max(res['rh'], 1e-6)))) + (25 if ok2 else int(15 * min(1, 2.5 / max(res['rv'], 1e-6))))
        if res['burned']: score += 50 if res['vt'] <= 3 else 40 if res['vt'] <= 6 else 22 if res['vt'] <= 12 else 8 if res['vt'] <= 25 else 0
        if res['h_ign'] is not None: msgs.append("Burn started at %.0f m. The engine can hold between %.0f and %.0f m/s² of net deceleration; lighting it when v²/(2h) reaches about %.0f m/s² leaves room both ways." % (res['h_ign'], a_lo, a_hi, a_nom))
        plots = [{'title': 'Altitude error: altimeter vs your estimate', 'x': thin(res['t']), 'xl': 't (s)', 'yl': 'error (m)', 'series': [{'name': 'altimeter', 'y': thin([a - b for a, b in zip(res['z'], res['h'])]), 'dots': True}, {'name': 'estimate', 'y': thin([a - b for a, b in zip(res['he'], res['h'])])}]},
                 {'title': 'Velocity: truth and your estimate', 'x': thin(res['t']), 'xl': 't (s)', 'yl': 'v (m/s)', 'series': [{'name': 'truth', 'y': thin(res['v'])}, {'name': 'estimate', 'y': thin(res['ve'])}]}]
        hs = thin(res['h'])
        flightd = {'t': thin(res['t']), 'h': [max(0.0, x) for x in hs], 'x': [0.0] * len(hs), 'thr': [0.8 if (res['h_ign'] is not None and hh <= res['h_ign']) else 0.0 for hh in hs], 'tilt': [0.0] * len(hs), 'crash': res['vt'] > 6.0}
    stats = {'Altimeter': '±(0.3 m + %.1f%% of altitude)' % (100 * k_alt), 'Accelerometer': '±%.1f m/s², biased' % sig_a}
    if res: stats.update({'Touchdown': '%.1f m/s' % res['vt'], 'h error (RMS)': '%.2f m' % res['rh'], 'v error (RMS)': '%.2f m/s' % res['rv']})
    return {'score': min(100, score), 'passed': bool(res) and score >= 70 and res['vt'] <= 6.0, 'tests': tests, 'msgs': msgs, 'stats': stats, 'flight': flightd, 'plots': plots, 'td': res.get('vt') if res else None}

# ───────────────────────── L6 · throttled powered descent: the hoverslam ─────────────────────────
def sim_L6(guide, P, s0, wind):
    dt = 0.02; x, h, vx, vz, m = s0['x'], s0['h'], s0['vx'], s0['vz'], s0['m']
    t = 0.0; tilt = 0.0; ignited = False; cut = False; mem = {}; fuel0 = m - P['m_dry']
    T_, X_, H_, VZ_, TH_, TI_ = [], [], [], [], [], []
    i = 0
    while t < 150.0:
        fuel = m - P['m_dry']
        s = {'t': t, 'x': x, 'h': h, 'vx': vx, 'vz': vz, 'm': m, 'fuel': fuel, 'ignited': ignited and not cut}
        out = guide(s, dict(P), mem)
        if not isinstance(out, (list, tuple)) or len(out) != 2: raise Fail("guidance() should return (throttle, tilt).")
        thr, tc = num(out[0], 'throttle'), num(out[1], 'tilt')
        if cut or fuel <= 0: thr = 0.0
        elif thr <= 0.0:
            if ignited: cut = True                        # one ignition: shutting down is final
            thr = 0.0
        else:
            ignited = True; thr = max(P['min_throttle'], min(1.0, thr))
        tc = max(-P['max_tilt'], min(P['max_tilt'], tc))
        tilt += max(-0.5 * dt, min(0.5 * dt, tc - tilt))
        Tn = thr * P['thrust_max']
        w = wind(h); rx, rz = vx - w, vz; V = math.hypot(rx, rz)
        D = 0.5 * rho(h) * P['cda'] * V
        ax = (Tn * math.sin(tilt) - D * rx) / m
        az = (Tn * math.cos(tilt) - D * rz) / m - G
        vx += ax * dt; vz += az * dt; x += vx * dt; h += vz * dt
        m -= Tn / (P['isp'] * G0) * dt; t += dt; i += 1
        if i % 5 == 0: T_.append(t); X_.append(x); H_.append(max(h, 0.0)); VZ_.append(vz); TH_.append(thr); TI_.append(tilt)
        if h <= 0.0: break
    return {'t': t, 'x': x, 'vx': vx, 'vz': vz, 'tilt': tilt, 'fuel_used': fuel0 - (m - P['m_dry']), 'fuel_left': m - P['m_dry'], 'landed': h <= 0.0,
            'log': {'t': T_, 'x': X_, 'h': H_, 'vz': VZ_, 'thr': TH_, 'tilt': TI_}}
def ref_guidance(s, p, mem):
    # reference: free-fall, then hold a constant deceleration at 80% of full authority that reaches the pad at about 1.5 m/s
    a_full = p['thrust_max'] / s['m'] - p['g']; a_des = 0.80 * a_full; v_td = 1.5
    h = max(s['h'], 0.0)
    if not s['ignited']:
        if mem.get('on'): return 0.0, 0.0                 # engine already cut at the pad
        if not (s['vz'] < 0 and h <= (s['vz'] ** 2 - v_td ** 2) / (2 * a_des) + 5.0): return 0.0, 0.0
        mem['on'] = True
    if h < 0.15 or s['vz'] > -0.3: return 0.0, 0.0          # touchdown: shut down rather than climb away
    v_ref = -math.sqrt(v_td ** 2 + 2 * a_des * h)
    a_cmd = a_des + 2.5 * (v_ref - s['vz'])
    tgo = max(1.2, (-s['vz'] - v_td) / a_des - 2.0)
    ax = -6.0 * (s['x'] + s['vx'] * tgo) / tgo ** 2 + 2.0 * s['vx'] / tgo      # ZEM/ZEV toward the pad centre with zero sideways speed
    tilt = math.atan2(ax, max(6.0, a_cmd + p['g'])) * min(1.0, h / 4.0)
    frac = (a_cmd + p['g']) * s['m'] / p['thrust_max']                           # vertical thrust fraction the profile needs
    if frac >= 1.0: return 1.0, 0.0                                               # the descent profile comes first
    lim = math.acos(max(frac, 0.0)); tilt = max(-lim, min(lim, tilt))
    return max(p['min_throttle'], min(1.0, frac / math.cos(tilt))), tilt
def run_L6(ns, rng, daily):
    P = {'g': G, 'thrust_max': 30000.0, 'min_throttle': 0.4, 'isp': 280.0, 'm_dry': rng.uniform(950, 1080) if daily else 1000.0, 'max_tilt': 0.35, 'cda': 1.2, 'pad_radius': 15.0}
    fuel0 = rng.uniform(240, 330) if daily else 300.0
    s0 = {'h': rng.uniform(1600, 2600) if daily else 2000.0, 'vz': -(rng.uniform(140, 210) if daily else 170.0), 'x': rng.uniform(30, 75) * rng.choice([-1, 1]) if daily else 80.0, 'vx': rng.uniform(-8, 8) if daily else -5.0, 'm': 0.0}
    s0['m'] = P['m_dry'] + fuel0
    w0 = rng.uniform(3, 8) * rng.choice([-1, 1]) if daily else 6.0
    wind = lambda h: w0 * (0.4 + 0.6 * min(1.0, h / 1000.0))
    P['wind_estimate'] = round(w0, 1)
    tests = []; res = {}
    def t1():
        res.update(sim_L6(need(ns, 'guidance'), P, s0, wind))
        if not res['landed']: return False, "Never reached the ground within 150 s (still at altitude: the engine cannot hover, so climbing away wastes the fuel)."
        ok = abs(res['vz']) <= 3.0
        return ok, "Vertical touchdown speed %.2f m/s (limit 3 m/s)" % abs(res['vz'])
    ok1 = run_test(tests, 'Soft touchdown', t1)
    score = 0; msgs = []; plots = []; flight = None
    if res:
        def t2(): return abs(res['x']) <= P['pad_radius'], "Landed %.1f m from the centre of its own pad (pad radius %.0f m)" % (abs(res['x']), P['pad_radius'])
        def t3(): return abs(res['vx']) <= 2.0 and abs(res['tilt']) <= 0.15, "Sideways speed %.2f m/s (limit 2), tilt %.1f° (limit 8.6°)" % (abs(res['vx']), math.degrees(abs(res['tilt'])))
        ok2 = run_test(tests, 'On the pad', t2); ok3 = run_test(tests, 'Upright and not sliding', t3)
        refr = sim_L6(ref_guidance, P, s0, wind)
        landed = res['landed'] and ok1 and ok2 and ok3
        if landed:
            fr = res['fuel_left'] / max(refr['fuel_left'], 1.0)
            score = 50 + int(round(30 * min(1.15, max(0.0, fr)) / 1.15)) + int(round(10 * (1 - abs(res['vz']) / 3.0))) + int(round(10 * (1 - abs(res['x']) / P['pad_radius'])))
            msgs.append("Landed with %.0f kg of propellant left after burning %.0f kg. The reference guidance burns %.0f kg." % (res['fuel_left'], res['fuel_used'], refr['fuel_used']))
        else:
            if res['landed']: score = (15 if abs(res['vz']) <= 12 else 5) + (10 if ok2 else 0)
            if res['landed'] and abs(res['vz']) > 3: msgs.append("Hit at %.0f m/s. Minimum throttle still out-pushes gravity, so there is no hover: start the burn so that speed reaches zero at zero altitude." % abs(res['vz']))
            if res['fuel_left'] <= 0.5: msgs.append("Tanks ran dry. Burning early at low throttle wastes propellant on gravity losses.")
        L = res['log']
        flight = {'t': thin(L['t']), 'h': thin(L['h']), 'x': thin(L['x']), 'thr': thin(L['thr']), 'tilt': thin(L['tilt']), 'crash': not landed, 'pad': P['pad_radius']}
        plots = [{'title': 'Descent rate', 'x': thin(L['t']), 'xl': 't (s)', 'yl': 'vz (m/s)', 'series': [{'name': 'vz', 'y': thin(L['vz'])}]}, {'title': 'Throttle', 'x': thin(L['t']), 'xl': 't (s)', 'yl': 'throttle', 'series': [{'name': 'throttle', 'y': thin(L['thr'])}]}]
    stats = {'Start': '%.0f m, %.0f m/s down, %.0f m off the pad' % (s0['h'], -s0['vz'], abs(s0['x'])), 'Wind': '%.0f m/s' % abs(w0)}
    if res: stats.update({'Fuel used': '%.0f kg' % res['fuel_used'], 'Touchdown': '%.2f m/s' % abs(res['vz']), 'Miss': '%.1f m' % abs(res['x'])})
    return {'score': min(100, score), 'passed': bool(res) and score >= 70, 'tests': tests, 'msgs': msgs, 'stats': stats, 'flight': flight, 'plots': plots,
            'fuel': res.get('fuel_used') if res else None, 'td': abs(res['vz']) if res and res.get('landed') else None}

LEVELS = {0: run_L0, 1: run_L1, 2: run_L2, 3: run_L3, 4: run_L4, 5: run_L5, 6: run_L6}

# ---------- interview drills (Hire Me Mission): call one function against a list of cases ----------
def same(got, exp, tol=1e-6, atol=1e-9):
    if exp is None or isinstance(exp, bool):
        return got is exp
    if isinstance(exp, (int, float)):
        if isinstance(got, bool) or not isinstance(got, (int, float)):
            return False
        if got != got:
            return False
        return abs(got - exp) <= max(tol * abs(exp), atol)
    if isinstance(exp, str):
        return got == exp
    if isinstance(exp, (list, tuple)):
        if not isinstance(got, (list, tuple)) or len(got) != len(exp):
            return False
        return all(same(g, e, tol, atol) for g, e in zip(got, exp))
    if isinstance(exp, dict):
        if not isinstance(got, dict) or set(got.keys()) != set(exp.keys()):
            return False
        return all(same(got[k], exp[k], tol, atol) for k in exp)
    return got == exp

def short(v, n=90):
    s = repr(v)
    return s if len(s) <= n else s[:n - 1] + '…'

def run_drill(ns, d):
    out = {'score': 0, 'passed': False, 'tests': [], 'msgs': [], 'stats': {}, 'flight': None, 'plots': []}
    fn = need(ns, d['fn'])
    ok = 0
    for i, t in enumerate(d['tests']):
        args = json.loads(json.dumps(t['args']))
        hidden = bool(t.get('hidden'))
        name = ('Hidden case %d' % (i + 1)) if hidden else ('%s(%s)' % (d['fn'], ', '.join(short(a, 44) for a in t['args'])))
        try:
            got = fn(*args)
            good = same(got, t['expect'], t.get('tol', 1e-6), t.get('atol', 1e-9))
            if good:
                detail = 'returned %s' % short(got)
            elif hidden:
                detail = 'wrong result%s' % ((': ' + t['why']) if t.get('why') else '')
            else:
                detail = 'returned %s · expected %s' % (short(got), short(t['expect']))
        except Exception as e:
            good = False
            detail = '%s: %s' % (type(e).__name__, e)
        if good:
            ok += 1
        out['tests'].append({'name': name, 'ok': good, 'detail': detail})
    n = len(d['tests'])
    out['score'] = int(round(100.0 * ok / n)) if n else 0
    out['passed'] = n > 0 and ok == n
    out['stats'] = {'Cases passed': '%d of %d' % (ok, n)}
    return out


def run(code, args):
    args = json.loads(args) if isinstance(args, str) else args
    buf = io.StringIO(); out = {'score': 0, 'passed': False, 'tests': [], 'msgs': [], 'stats': {}, 'flight': None, 'plots': []}
    ns = {'__name__': 'controller', 'math': math, 'rocket_parts': rocket_parts, 'rocket_cp': rocket_cp, 'fin_cn': fin_cn, 'fin_xcp': fin_xcp}
    try:
        with contextlib.redirect_stdout(buf):
            exec(compile(code, 'your_code.py', 'exec'), ns)
            if args.get('drill'):
                out = run_drill(ns, args['drill'])
            else:
                rng = random.Random(int(args.get('seed', 1)))
                out = LEVELS[int(args['level'])](ns, rng, bool(args.get('daily')))
    except Fail as e:
        out['error'] = str(e)
    except SyntaxError as e:
        out['error'] = "SyntaxError on line %s: %s" % (e.lineno, e.msg)
    except Exception as e:
        tb = traceback.extract_tb(sys.exc_info()[2]); line = None
        for fr in tb:
            if fr.filename == 'your_code.py': line = fr.lineno
        out['error'] = "%s: %s%s" % (type(e).__name__, e, (" (your code, line %d)" % line) if line else "")
    out['stdout'] = buf.getvalue()[-4000:]
    return json.dumps(out)
