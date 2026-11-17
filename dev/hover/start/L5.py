# Level 5 · Noisy sensors and a Kalman filter.
# The booster falls from 3000 m at about -120 m/s. Two sensors:
#   accelerometer, 20 Hz: specific force (it does NOT feel gravity), noisy and biased
#   radar altimeter, 5 Hz: altitude, noise = 0.3 m + 0.4% of altitude
# State x = [h, v]. est is a dict {'x': [h, v], 'P': [[p00, p01], [p10, p11]]}.
# After ignite() returns True the engine holds the deceleration your ESTIMATE says is needed,
# between 8 and 20 m/s^2. A bad estimate means a bad landing.
G = 9.81

def kf_init():
    """Initial estimate and how unsure you are about it."""
    return {'x': [3000.0, -120.0], 'P': [[400.0, 0.0], [0.0, 100.0]]}

def kf_predict(est, a_meas, dt):
    """Propagate with the accelerometer: a = a_meas - G.
    x = F x + B a   with F = [[1, dt], [0, 1]],  B = [dt*dt/2, dt]
    P = F P F^T + Q  (Q: how much you distrust the accelerometer)"""
    h, v = est['x']
    a = a_meas - G
    est['x'] = [h + v * dt, v + a * dt]
    # TODO: propagate P. Right now P never changes, so the filter cannot weigh anything.
    return est

def kf_update(est, z, R):
    """Blend in an altimeter reading z with variance R (H = [1, 0]).
    K = P H^T / (H P H^T + R);  x = x + K (z - h);  P = (I - K H) P"""
    # TODO
    return est

def ignite(est):
    """Return True when the landing burn should start."""
    h, v = est['x']
    return False   # TODO: light it when v*v / (2*h) reaches about 16 m/s^2
