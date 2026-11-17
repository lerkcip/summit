# Level 4 · Rigid-body attitude with quaternions.
# Quaternions are [w, x, y, z] with the scalar first. q rotates body axes to inertial.
# The booster is tumbling after separation. Slew to the target attitude and hold.
# Inertia about the body axes: I = [900, 900, 120] kg m^2. Jets give up to 400 N m per axis.

def quat_mul(p, q):
    """Hamilton product p (x) q."""
    return [1.0, 0.0, 0.0, 0.0]   # TODO

def quat_conj(q):
    """Conjugate: the inverse rotation for a unit quaternion."""
    return list(q)   # TODO

def quat_error(q, q_target):
    """Error quaternion conj(q_target) (x) q, taking the short way round:
    q and -q are the same attitude, so flip the sign when the scalar part is negative."""
    return [1.0, 0.0, 0.0, 0.0]   # TODO

I = [900.0, 900.0, 120.0]

def control(q, w, q_target, dt, mem):
    """Return body torques [tx, ty, tz] in N m.
    w is the body angular rate in rad/s. A PD law on the error works:
    torque_i = -I_i * (kp * e_vec_i + kd * w_i), with e_vec the vector part of the error."""
    e = quat_error(q, q_target)
    return [0.0, 0.0, 0.0]   # TODO
