def control(theta, rate, dt, mem):
    a, b = mem['a'], mem['b']            # plant: theta'' = a*theta + b*delta
    wn, zeta = 5.0, 0.8                  # where the closed-loop poles should sit
    kp = (wn * wn + a) / b
    kd = 2 * zeta * wn / b
    ki = 0.8 * kp
    # integral with an anti-windup clamp
    mem['i'] = max(-0.2, min(0.2, mem.get('i', 0.0) + theta * dt))
    return -(kp * theta + kd * rate + ki * mem['i'])
