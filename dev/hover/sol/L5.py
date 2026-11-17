G = 9.81
A_NOM = 16.0     # light the engine when the deceleration needed reaches this, m/s^2

def kf_init():
    return {'x': [3000.0, -120.0], 'P': [[400.0, 0.0], [0.0, 100.0]]}

def kf_predict(est, a_meas, dt):
    h, v = est['x']
    P = est['P']
    a = a_meas - G                       # the accelerometer feels specific force; put gravity back
    est['x'] = [h + v * dt + 0.5 * a * dt * dt, v + a * dt]
    # P = F P F^T + Q, with F = [[1, dt], [0, 1]]
    p00 = P[0][0] + dt * (P[1][0] + P[0][1]) + dt * dt * P[1][1]
    p01 = P[0][1] + dt * P[1][1]
    p11 = P[1][1]
    q = 0.8 ** 2                          # accelerometer noise and bias, treated as process noise
    est['P'] = [[p00 + 0.25 * dt ** 4 * q, p01 + 0.5 * dt ** 3 * q],
                [p01 + 0.5 * dt ** 3 * q, p11 + dt * dt * q]]
    return est

def kf_update(est, z, R):
    h, v = est['x']
    P = est['P']
    S = P[0][0] + R                       # innovation variance (H = [1, 0])
    k0, k1 = P[0][0] / S, P[1][0] / S     # Kalman gain
    y = z - h                             # innovation
    est['x'] = [h + k0 * y, v + k1 * y]
    est['P'] = [[(1 - k0) * P[0][0], (1 - k0) * P[0][1]],
                [P[1][0] - k1 * P[0][0], P[1][1] - k1 * P[0][1]]]
    return est

def ignite(est):
    h, v = est['x']
    return v < 0 and v * v / (2 * max(h, 1.0)) >= A_NOM
