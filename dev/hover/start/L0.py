# Level 0 · Ballistic hop: rebuild your Python basics.
# Fill in each function, then Run. The lab tests them one by one and flies the hop.
import math

G0 = 9.80665   # standard gravity, m/s^2 (it defines Isp)
G = 9.81       # gravity used by the lab, m/s^2

def burn_time(m_prop, mdot):
    """Seconds to burn m_prop kg of propellant at mdot kg/s."""
    return 0.0   # TODO

def delta_v(isp, m0, mf):
    """Ideal velocity gain from the rocket equation, m/s."""
    return 0.0   # TODO

def burnout_velocity(isp, m0, mf, t_burn):
    """Burnout speed for a vertical burn: ideal delta-v minus the gravity loss. No drag."""
    return 0.0   # TODO

def coast_apogee(h_b, v_b):
    """Peak altitude after cutoff at height h_b (m) and speed v_b (m/s). No drag."""
    return 0.0   # TODO

def simulate(m0, mf, thrust, mdot, dt):
    """Step a vertical flight from the pad until it comes back to the ground.
    No drag, gravity G, constant thrust until the mass reaches mf.
    Return (apogee_m, flight_time_s)."""
    h, v, t, m = 0.0, 0.0, 0.0, m0
    apogee = 0.0
    # TODO: a while loop of Euler steps of size dt.
    #   acceleration = thrust / m - G while burning, -G after
    #   update h, v, m and t; track the highest h; stop when h is back at 0
    return apogee, t
