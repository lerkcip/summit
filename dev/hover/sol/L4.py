def quat_mul(p, q):
    return [p[0]*q[0] - p[1]*q[1] - p[2]*q[2] - p[3]*q[3],
            p[0]*q[1] + p[1]*q[0] + p[2]*q[3] - p[3]*q[2],
            p[0]*q[2] - p[1]*q[3] + p[2]*q[0] + p[3]*q[1],
            p[0]*q[3] + p[1]*q[2] - p[2]*q[1] + p[3]*q[0]]

def quat_conj(q):
    return [q[0], -q[1], -q[2], -q[3]]

def quat_error(q, q_target):
    e = quat_mul(quat_conj(q_target), q)
    if e[0] < 0:
        e = [-c for c in e]
    return e

I = [900.0, 900.0, 120.0]
WN, ZETA = 0.35, 1.0

def control(q, w, q_target, dt, mem):
    e = quat_error(q, q_target)
    return [-I[i] * (2 * WN * WN * e[i + 1] + 2 * ZETA * WN * w[i]) for i in range(3)]
