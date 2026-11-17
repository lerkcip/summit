# Level 6 · The hoverslam: a throttled, fuel-optimal powered descent onto your own launch pad.
# The lab calls guidance() 50 times a second.
#   s: state   s['h'] altitude (m), s['x'] sideways offset from the pad centre (m),
#              s['vz'], s['vx'] velocities (m/s), s['m'] mass (kg), s['fuel'] (kg),
#              s['ignited'] True while the engine is running, s['t'] time (s)
#   p: vehicle p['thrust_max'] N, p['min_throttle'] 0.4, p['isp'] s, p['m_dry'] kg, p['g'],
#              p['max_tilt'] rad, p['pad_radius'] m, p['wind_estimate'] m/s
#   mem: a dict that survives between calls
# Return (throttle, tilt). throttle 0 = engine off; once lit it runs between 0.4 and 1.0.
# Shutting it down after ignition is final. tilt (rad) leans the thrust toward +x.
# Minimum throttle still out-pushes gravity: there is no hovering.
import math

def guidance(s, p, mem):
    # A naive start: light the engine at 900 m and hold full throttle. Watch what happens.
    if s['h'] > 900.0 and not s['ignited']:
        return 0.0, 0.0
    return 1.0, 0.0
    # TODO: 1. start the burn at the height where full-ish deceleration just stops you at the pad
    #       2. track a speed profile v_ref(h) with the throttle
    #       3. steer with tilt to null x and vx, keeping the vertical profile first
    #       4. cut the engine at touchdown instead of climbing away
