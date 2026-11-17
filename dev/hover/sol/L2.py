def euler_step(f, t, y, dt):
    k = f(t, y)
    return [yi + dt * ki for yi, ki in zip(y, k)]

def rk4_step(f, t, y, dt):
    k1 = f(t, y)
    k2 = f(t + dt / 2, [yi + dt / 2 * k for yi, k in zip(y, k1)])
    k3 = f(t + dt / 2, [yi + dt / 2 * k for yi, k in zip(y, k2)])
    k4 = f(t + dt, [yi + dt * k for yi, k in zip(y, k3)])
    return [yi + dt / 6 * (a + 2 * b + 2 * c + d) for yi, a, b, c, d in zip(y, k1, k2, k3, k4)]
