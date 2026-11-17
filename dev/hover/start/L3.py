# Level 3 · PID pitch hold with thrust-vector control.
# The booster is aerodynamically unstable in pitch:  theta'' = a*theta + b*delta
# The lab calls control() 100 times a second and puts the plant data in mem:
#   mem['a'], mem['b']   (this level: a = 4, b = 2)
# theta: pitch error (rad), rate: pitch rate (rad/s), dt: time step (s).
# mem is a dict that survives between calls: keep your integral there.
# Return the gimbal angle command in radians. The actuator stops at +/- 6 degrees.

def control(theta, rate, dt, mem):
    kp = 1.0     # TODO: this is too weak to beat the instability (need kp*b > a)
    kd = 0.0     # TODO: damping
    ki = 0.0     # TODO: removes the steady error from a constant wind torque
    mem['i'] = mem.get('i', 0.0) + theta * dt
    return -(kp * theta + kd * rate + ki * mem['i'])
