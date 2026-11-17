# Level 2 · Integrate the trajectory yourself: Euler, then RK4.
# f(t, y) returns dy/dt as a list. y is a list of floats, here [altitude, velocity, mass].
# Each step function returns the new y as a list of the same length.

def euler_step(f, t, y, dt):
    """One explicit Euler step: y + dt * f(t, y)."""
    k = f(t, y)
    return list(y)   # TODO

def rk4_step(f, t, y, dt):
    """One classical Runge-Kutta step (four slope evaluations)."""
    # TODO: k1 at (t, y); k2 and k3 at the midpoint; k4 at the end;
    #       combine as y + dt/6 * (k1 + 2*k2 + 2*k3 + k4)
    return list(y)
