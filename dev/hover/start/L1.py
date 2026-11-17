# Level 1 · Passive stability: keep the centre of pressure behind the centre of gravity.
# The lab provides the airframe for you:
#   rocket_parts(span, ballast) -> (masses, positions)   kg and m from the nose tip
#   rocket_cp(span)             -> (x_cp, total_CN)      Barrowman, nose + 4 fins
# Body diameter is 0.10 m. All positions are measured from the nose tip.

def combined_cg(masses, positions):
    """Centre of gravity of point masses: sum(m*x) / sum(m)."""
    return 0.0   # TODO

def combined_cp(cns, xs):
    """Centre of pressure of several components: sum(CN*x) / sum(CN)."""
    return 0.0   # TODO

def static_margin(x_cg, x_cp, d):
    """Static margin in calibers: how far the CP sits behind the CG, in body diameters."""
    return 0.0   # TODO

def design():
    """Choose (fin_span_m, nose_ballast_kg) so the static margin is between 1.0 and 2.0 calibers.
    Span may be 0.03 to 0.25 m, ballast 0 to 1.5 kg. Less fin and less ballast flies higher."""
    span, ballast = 0.04, 0.0
    # TODO: use rocket_parts(), rocket_cp() and your functions above to check the margin,
    # then pick a span (try a loop over candidate spans) that lands in the band.
    masses, xs = rocket_parts(span, ballast)
    x_cp, cn = rocket_cp(span)
    print("margin:", static_margin(combined_cg(masses, xs), x_cp, 0.10))
    return span, ballast
