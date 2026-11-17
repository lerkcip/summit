def combined_cg(masses, positions):
    return sum(m * x for m, x in zip(masses, positions)) / sum(masses)

def combined_cp(cns, xs):
    return sum(c * x for c, x in zip(cns, xs)) / sum(cns)

def static_margin(x_cg, x_cp, d):
    return (x_cp - x_cg) / d

def design():
    # search the fin span for a 1.5-caliber margin with no ballast
    best = None
    for i in range(30, 251):
        span = i / 1000.0
        masses, xs = rocket_parts(span, 0.0)
        x_cp, _ = rocket_cp(span)
        sm = static_margin(combined_cg(masses, xs), x_cp, 0.10)
        if best is None or abs(sm - 1.5) < abs(best[1] - 1.5):
            best = (span, sm)
    print("span %.3f m gives %.2f calibers" % best)
    return best[0], 0.0
