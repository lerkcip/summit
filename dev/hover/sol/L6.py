import math

V_TD = 1.5       # touchdown speed to aim for, m/s

def guidance(s, p, mem):
    a_full = p['thrust_max'] / s['m'] - p['g']       # deceleration available at full throttle
    a_des = 0.88 * a_full                            # keep some in hand for steering and errors
    h = max(s['h'], 0.0)
    if not s['ignited']:
        if mem.get('on'):
            return 0.0, 0.0                          # already shut down at the pad
        stop = (s['vz'] ** 2 - V_TD ** 2) / (2 * a_des)   # height needed to slow to V_TD at a_des
        if not (s['vz'] < 0 and h <= stop + 4.0):
            return 0.0, 0.0                          # still falling: engine off
        mem['on'] = True
    if h < 0.15 or s['vz'] > -0.3:
        return 0.0, 0.0                              # touchdown: cut the engine, never climb away
    v_ref = -math.sqrt(V_TD ** 2 + 2 * a_des * h)    # constant-deceleration profile ending at V_TD
    a_cmd = a_des + 2.5 * (v_ref - s['vz'])
    t_go = max(1.2, (-s['vz'] - V_TD) / a_des - 2.0)
    ax = -6.0 * (s['x'] + s['vx'] * t_go) / t_go ** 2 + 2.0 * s['vx'] / t_go
    tilt = math.atan2(ax, max(6.0, a_cmd + p['g'])) * min(1.0, h / 4.0)
    frac = (a_cmd + p['g']) * s['m'] / p['thrust_max']
    if frac >= 1.0:
        return 1.0, 0.0                              # the descent profile comes first
    lim = math.acos(max(frac, 0.0))                  # the most tilt that still leaves enough vertical thrust
    tilt = max(-lim, min(lim, tilt))
    return max(p['min_throttle'], min(1.0, frac / math.cos(tilt))), tilt
