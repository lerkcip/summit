import math

G0 = 9.80665   # standard gravity, m/s^2 (defines Isp)
G = 9.81       # local gravity used by the lab

def burn_time(m_prop, mdot):
    return m_prop / mdot

def delta_v(isp, m0, mf):
    return isp * G0 * math.log(m0 / mf)

def burnout_velocity(isp, m0, mf, t_burn):
    return delta_v(isp, m0, mf) - G * t_burn

def coast_apogee(h_b, v_b):
    return h_b + v_b ** 2 / (2 * G)

def simulate(m0, mf, thrust, mdot, dt):
    h, v, t, m = 0.0, 0.0, 0.0, m0
    apogee = 0.0
    while True:
        burning = m > mf
        a = (thrust / m if burning else 0.0) - G
        h += v * dt
        v += a * dt
        if burning:
            m = max(mf, m - mdot * dt)
        t += dt
        apogee = max(apogee, h)
        if h <= 0 and t > 1:
            break
    return apogee, t
