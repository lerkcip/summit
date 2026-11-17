/* SUMMIT · question bank, Parts I–II (Ch 1–14)
   T(ch, q, params, fn, opt): code-checked template for doc Quiz ch.q. params {name:[base, lo, hi, step] | [base, [choices]]}.
     fn(v) -> {q: variant text, f: [[label, value, unit, tol?], ...]}; at base values f must reproduce Appendix J.
     opt.vo = variant only (the doc's own wording stays a written answer).
   S(ch, q, fields): fixed numeric fields for a doc question with no variant.
   X(ch, tag, q, a, refs): extra written question in the doc's style (tag 'C' or 'I'). */
(function (G) {
  'use strict';
  var P = G.PHYS, R = String.raw, N = P.fmt;
  var BANK = G.BANK = G.BANK || {};
  function B(ch) { return BANK[ch] || (BANK[ch] = { t: {}, s: {}, x: [] }); }
  var T = G.BANK_T = function (ch, q, p, fn, opt) { B(ch).t[q] = { p: p, fn: fn, vo: !!(opt && opt.vo) }; };
  var S = G.BANK_S = function (ch, q, f) { B(ch).s[q] = f; };
  var X = G.BANK_X = function (ch, tag, q, a, refs) { B(ch).x.push({ tag: tag, q: q, a: a, refs: refs || [] }); };
  /* instantiate a template: rng null -> the doc's own numbers; otherwise fresh numbers that differ from the doc's */
  G.BANK_INST = function (t, rng) {
    var keys = Object.keys(t.p), v, tries = 0, diff;
    do {
      v = {}; diff = false;
      keys.forEach(function (k) {
        var s = t.p[k], val;
        if (!rng) val = s[0];
        else if (Array.isArray(s[1])) val = rng.pick(s[1]);
        else { var n = Math.round((s[2] - s[1]) / s[3]); val = +(s[1] + s[3] * rng.int(0, n)).toFixed(6); }
        if (val !== s[0]) diff = true;
        v[k] = val;
      });
    } while (rng && !diff && ++tries < 8);
    var out = t.fn(v); out.v = v; return out;
  };
  var g0 = P.g0, MU = P.MU, sin = Math.sin, cos = Math.cos, sqrt = Math.sqrt, exp = Math.exp, ln = Math.log, PI = Math.PI, pow = Math.pow, rad = P.rad, deg = P.deg;

  /* ───────── Ch 1 · Units and dimensional analysis ───────── */
  T(1, 2, { p: [1, [5, 20, 50, 150, 300, 1000]], F: [1, [10, 50, 250, 1000, 5000]], L: [10000, [2500, 5000, 20000, 35000, 60000]] }, function (v) {
    return { q: R`Convert ${N(v.p)} psi to Pa, ${N(v.F)} lbf to N, and ${N(v.L)} ft to m.`,
      f: [['psi → Pa', v.p * 6894.757, 'Pa', 0.002], ['lbf → N', v.F * 4.448222, 'N', 0.002], ['ft → m', v.L * 0.3048, 'm', 0.002]] }; });
  T(1, 3, { F: [1.8, 0.4, 8, 0.1] }, function (v) {
    return { q: R`An engine produces ${N(v.F)} MN of thrust. Express this in lbf.`, f: [['Thrust', v.F * 1e6 / 4.448222, 'lbf', 0.005]] }; });
  (function () {
    var cases = [
      { q: R`Assume a pendulum period obeys \(T_p = kL^{a}g^{b}\). Find \(a\) and \(b\) by dimensional analysis.`, f: [['a', 0.5, ''], ['b', -0.5, '']] },
      { q: R`Assume circular orbital speed obeys \(v = k\,\mu^{a}r^{b}\), where \(\mu\) has units m³/s². Find \(a\) and \(b\) by dimensional analysis.`, f: [['a', 0.5, ''], ['b', -0.5, '']] },
      { q: R`Assume the speed of deep-water waves obeys \(c = k\,g^{a}\lambda^{b}\), with \(\lambda\) the wavelength. Find \(a\) and \(b\) by dimensional analysis.`, f: [['a', 0.5, ''], ['b', 0.5, '']] },
      { q: R`Assume the natural frequency of a mass on a spring obeys \(\omega = C\,m^{a}k_s^{b}\), with \(k_s\) in N/m. Find \(a\) and \(b\) by dimensional analysis.`, f: [['a', -0.5, ''], ['b', 0.5, '']] },
      { q: R`Assume the pressure at the base of a liquid column obeys \(p = C\,\rho^{a}g^{b}h^{c}\). Find \(a\), \(b\) and \(c\) by dimensional analysis.`, f: [['a', 1, ''], ['b', 1, ''], ['c', 1, '']] },
      { q: R`Assume high-speed drag obeys \(F = C\,\rho^{a}V^{b}L^{c}\). Find \(a\), \(b\) and \(c\) by dimensional analysis.`, f: [['a', 1, ''], ['b', 2, ''], ['c', 2, '']] }];
    T(1, 5, { k: [0, [1, 2, 3, 4, 5]] }, function (v) { return cases[v.k]; });
  })();
  T(1, 6, { m: [1000, 500, 5000, 500], V: [7.8, 7.5, 11, 0.1] }, function (v) {
    var E = 0.5 * v.m * pow(v.V * 1000, 2);
    return { q: R`Compute the kinetic energy of a ${N(v.m)} kg vehicle at ${N(v.V)} km/s. What mass of kerosene (43 MJ/kg) releases the same energy on burning?`,
      f: [['Kinetic energy', E / 1e9, 'GJ'], ['Kerosene mass', E / 43e6, 'kg']] }; });
  T(1, 7, { I: [300, 220, 460, 5] }, function (v) {
    return { q: R`Convert \(I_{sp}\) = ${v.I} s to effective exhaust velocity in m/s.`, f: [['c', v.I * g0, 'm/s', 0.005]] }; });
  X(1, 'C', R`Specific impulse quoted in seconds has the same numerical value in SI and in US customary units. Explain why.`,
    R`\(I_{sp} = F/(\dot m g_0)\) is thrust divided by the <em>weight</em> flow rate of propellant. Force over force-per-second leaves only seconds, so the unit system cancels. Effective exhaust velocity \(c = I_{sp}g_0\) does depend on the unit system.`);
  X(1, 'C', R`State the rule of dimensional homogeneity and use it to explain why \(\ln(m_0)\) on its own cannot appear in a valid physical equation.`,
    R`Every additive term in a valid equation has the same dimension, and the argument of any transcendental function (exp, ln, sin) must be dimensionless. A mass carries dimension M, so \(\ln(m_0)\) is meaningless; only the ratio \(\ln(m_0/m_f)\) is legitimate.`);
  X(1, 'C', R`List the four sanity checks to apply after any calculation, and say what each one catches.`,
    R`Units (dimensional slips and conversion errors), limiting cases (wrong functional form as a parameter goes to 0 or ∞), symmetry (sign and direction mistakes), and magnitude against known values (order-of-magnitude blunders).`);

  /* ───────── Ch 2 · Algebra, exponentials, logs ───────── */
  T(2, 1, { x: [2, -4, 6, 1], y: [3, -3, 7, 1], a: [3, 2, 5, 1], b: [2, 2, 5, 1] }, function (v) {
    var c = v.a * v.x + v.b * v.y, d = v.x - v.y;
    return { q: R`Solve \(${v.a}x + ${v.b}y = ${c}\), \(x - y = ${d}\).`, f: [['x', v.x, '', { abs: 0.01 }], ['y', v.y, '', { abs: 0.01 }]] }; });
  T(2, 2, { v0: [20, 10, 60, 5] }, function (v) {
    return { q: R`A ball has height \(h(t) = ${v.v0}t - 4.9t^{2}\) (SI units). Find its maximum height, the time it occurs and the landing time.`,
      f: [['Maximum height', v.v0 * v.v0 / 19.6, 'm'], ['Time of maximum', v.v0 / 9.8, 's'], ['Landing time', v.v0 / 4.9, 's']] }; });
  T(2, 3, { b: [2, [2, 3, 5]], n: [10, [7, 20, 50, 100]], k: [3, [2, 4, 5, -2]] }, function (v) {
    return { q: R`Solve \(${v.b}^{x} = ${v.n}\). Simplify \(\ln(e^{${v.k}})\).`, f: [['x', ln(v.n) / ln(v.b), '', 0.005], [R`\(\ln(e^{${v.k}})\)`, v.k, '', { abs: 0.01 }]] }; });
  T(2, 4, { dv: [9.4, 3, 12, 0.1], c: [3.3, 2.5, 4.5, 0.1] }, function (v) {
    var mr = exp(v.dv / v.c);
    return { q: R`A vehicle needs \(\Delta v\) = ${N(v.dv)} km/s with \(c\) = ${N(v.c)} km/s. Find the required mass ratio \(m_0/m_f\) and the fraction of liftoff mass that is propellant.`,
      f: [[R`\(m_0/m_f\)`, mr, ''], ['Propellant fraction', 1 - 1 / mr, '', 0.01]] }; });
  T(2, 5, { H: [8.5, [7, 7.5, 8]], h: [30, 5, 60, 5] }, function (v) {
    return { q: R`For an isothermal atmosphere with \(H\) = ${v.H} km, compute \(\rho(${v.h}\ \text{km})/\rho_0\).`, f: [[R`\(\rho/\rho_0\)`, exp(-v.h / v.H), '', 0.03]] }; });
  T(2, 6, { k: [5, [2, 4, 10, 20, 100]], n: [3, [-2, -1, 0.5, 2, 4]] }, function (v) {
    return { q: R`The law \(y = ${v.k}x^{${v.n}}\) is plotted on log–log axes (base 10). Give the slope of the line and the value of \(\log_{10}y\) where \(x = 1\).`,
      f: [['Slope', v.n, '', { abs: 0.01 }], [R`\(\log_{10}y\) at \(x=1\)`, Math.log10(v.k), '', { abs: 0.01 }]] }; }, { vo: true });
  T(2, 7, { k: [2, [1.5, 3, 4, 5]] }, function (v) {
    return { q: R`A spherical tank’s radius is multiplied by ${v.k} at the same wall thickness. By what factors do the propellant volume and the wall mass change?`,
      f: [['Volume factor', pow(v.k, 3), '×'], ['Wall-mass factor', v.k * v.k, '×']] }; });
  X(2, 'C', R`Why does the rocket equation make single-stage-to-orbit so demanding? Answer using the form \(m_0/m_f = e^{\Delta v/c}\).`,
    R`The mass ratio grows exponentially with \(\Delta v/c\). For orbital \(\Delta v\) near 9.4 km/s and chemical \(c\) of 3–4.5 km/s the ratio is about 8–20, so 88–95% of liftoff mass must be propellant, leaving only a few percent for structure, engines and payload.`);
  X(2, 'C', R`An engineering table and a Python script both use “log”. Why can that produce a wrong answer, and what rule avoids taking the logarithm of a bad quantity?`,
    R`“log” usually means \(\log_{10}\) in engineering tables but the natural log in most programming languages, a factor of 2.303 apart. Take logarithms only of dimensionless ratios, and state the base.`);
  X(2, 'I', R`A drag measurement fits \(F = kV^{n}\). On log–log axes the data fall on a line of slope 2. What are the SI units of \(k\) if \(F\) is in newtons and \(V\) in m/s?`,
    R`\(n = 2\), so \(k = F/V^{2}\) has units N·s²/m² = kg/m (dimension M L⁻¹).`, [1]);

  /* ───────── Ch 3 · Geometry, trig, vectors ───────── */
  T(3, 1, { r: [1.5, 0.5, 3, 0.25], L: [10, 2, 20, 1] }, function (v) {
    return { q: R`A propellant tank is a cylinder of radius ${N(v.r)} m and length ${v.L} m with hemispherical end caps. Compute its volume.`,
      f: [['Volume', PI * v.r * v.r * v.L + 4 / 3 * PI * pow(v.r, 3), 'm³']] }; });
  T(3, 2, { a: [30, [15, 45, 60, 75, 120, 150, 210]], k: [1, [2, 5, 10]] }, function (v) {
    return { q: R`Convert ${v.a}° to radians. Using \(R\) = 6371 km, find the surface distance spanned by ${v.k}° of a great circle.`,
      f: [['Angle', rad(v.a), 'rad', 0.005], ['Surface distance', 6371 * rad(v.k), 'km', 0.005]] }; });
  T(3, 3, { F: [100, 50, 2000, 50], d: [5, 1, 8, 0.5] }, function (v) {
    return { q: R`A ${N(v.F)} kN thrust is gimballed ${v.d}°. Find its axial and lateral components.`,
      f: [['Axial', v.F * cos(rad(v.d)), 'kN', 0.005], ['Lateral', v.F * sin(rad(v.d)), 'kN']] }; });
  T(3, 4, { a1: [3, [1, 2, 3]], a2: [4, [-2, 1, 4]], a3: [0, [0, 2]], b1: [4, [2, 4, -1]], b2: [-3, [-3, 1, 3]], b3: [5, [1, 5]] }, function (v) {
    return { q: R`For \(\mathbf{a} = (${v.a1},${v.a2},${v.a3})\) and \(\mathbf{b} = (${v.b1},${v.b2},${v.b3})\), compute \(\mathbf{a}\cdot\mathbf{b}\) and \(\mathbf{a}\times\mathbf{b}\).`,
      f: [[R`\(\mathbf{a}\cdot\mathbf{b}\)`, v.a1 * v.b1 + v.a2 * v.b2 + v.a3 * v.b3, '', { abs: 0.01 }], [R`\((\mathbf{a}\times\mathbf{b})_x\)`, v.a2 * v.b3 - v.a3 * v.b2, '', { abs: 0.01 }],
        [R`\((\mathbf{a}\times\mathbf{b})_y\)`, v.a3 * v.b1 - v.a1 * v.b3, '', { abs: 0.01 }], [R`\((\mathbf{a}\times\mathbf{b})_z\)`, v.a1 * v.b2 - v.a2 * v.b1, '', { abs: 0.01 }]] }; });
  T(3, 5, { s1: [300, 100, 900, 50], s2: [400, 100, 900, 50], A: [60, 20, 150, 10] }, function (v) {
    return { q: R`Two stations are ${v.s1} km and ${v.s2} km from a tracking site, separated by ${v.A}° as seen from the site. How far apart are the stations?`,
      f: [['Separation', sqrt(v.s1 * v.s1 + v.s2 * v.s2 - 2 * v.s1 * v.s2 * cos(rad(v.A))), 'km']] }; });
  T(3, 6, { th: [10, 5, 30, 5] }, function (v) {
    var t = rad(v.th);
    return { q: R`What is the relative error of \(\sin\theta \approx \theta\) at \(\theta\) = ${v.th}°?`, f: [['Relative error', (t - sin(t)) / sin(t) * 100, '%', 0.05]] }; });
  T(3, 7, { x: [1, [1, 2, 3]], y: [0, [0, 1, 2]], th: [30, [45, 60, 90, 120, 135, 210]] }, function (v) {
    var t = rad(v.th);
    return { q: R`Rotate the vector \((${v.x},${v.y})\) counterclockwise by ${v.th}°.`,
      f: [["x′", v.x * cos(t) - v.y * sin(t), '', { abs: 0.01 }], ["y′", v.x * sin(t) + v.y * cos(t), '', { abs: 0.01 }]] }; });
  T(3, 8, { r: [0.5, 0.2, 1, 0.1], V: [0.5, 0.1, 2, 0.1] }, function (v) {
    return { q: R`A nose cone of base radius ${N(v.r)} m has a volume of ${N(v.V)} m³. Find its height.`, f: [['Height', 3 * v.V / (PI * v.r * v.r), 'm']] }; });
  X(3, 'C', R`Why should code compute a heading with <code>atan2(y, x)</code> rather than <code>atan(y/x)</code>?`,
    R`\(\arctan\) returns values only in \((-\pi/2, \pi/2)\), so it cannot tell opposite quadrants apart and fails at \(x = 0\). The two-argument form uses the signs of both components and returns the correct quadrant over the full \((-\pi, \pi]\).`);
  X(3, 'C', R`What do the dot product and the cross product of two vectors each tell you geometrically? Give one rocketry use of each.`,
    R`\(\mathbf a\cdot\mathbf b = ab\cos\theta\) measures alignment (zero when perpendicular); it gives the component of thrust along the velocity. \(\mathbf a\times\mathbf b\) has magnitude \(ab\sin\theta\) and points normal to both; it gives torque \(\mathbf r\times\mathbf F\) or angular momentum \(\mathbf r\times m\mathbf v\).`);

  /* ───────── Ch 4 · Polar, conics, complex, series ───────── */
  T(4, 1, { a: [7000, 6600, 42000, 200], e: [0.1, 0.01, 0.7, 0.01] }, function (v) {
    return { q: R`An elliptical orbit has \(a\) = ${N(v.a)} km and \(e\) = ${N(v.e)}. Find \(r_{\min}\), \(r_{\max}\), \(p\) and \(b\).`,
      f: [[R`\(r_{\min}\)`, v.a * (1 - v.e), 'km', 0.005], [R`\(r_{\max}\)`, v.a * (1 + v.e), 'km', 0.005], [R`\(p\)`, v.a * (1 - v.e * v.e), 'km', 0.005], [R`\(b\)`, v.a * sqrt(1 - v.e * v.e), 'km', 0.005]] }; });
  T(4, 2, { a: [7000, 6600, 42000, 200], e: [0.1, 0.05, 0.7, 0.05], th: [90, [0, 60, 120, 180]] }, function (v) {
    return { q: R`An elliptical orbit has \(a\) = ${N(v.a)} km and \(e\) = ${N(v.e)}. Find \(r\) at \(\theta\) = ${v.th}°.`,
      f: [['r', v.a * (1 - v.e * v.e) / (1 + v.e * cos(rad(v.th))), 'km', 0.005]] }; });
  T(4, 3, { a: [3, [1, 2, 3, 5]], b: [4, [1, 4, 12, -2]], c: [1, [1, 2, 3]], d: [-2, [-2, 1, 3]] }, function (v) {
    return { q: R`Compute \((${v.a} ${v.b < 0 ? '-' : '+'} ${Math.abs(v.b)}i)(${v.c} ${v.d < 0 ? '-' : '+'} ${Math.abs(v.d)}i)\) and \(|${v.a} ${v.b < 0 ? '-' : '+'} ${Math.abs(v.b)}i|\).`,
      f: [['Real part of product', v.a * v.c - v.b * v.d, '', { abs: 0.01 }], ['Imaginary part of product', v.a * v.d + v.b * v.c, '', { abs: 0.01 }], ['Modulus', sqrt(v.a * v.a + v.b * v.b), '', 0.005]] }; });
  T(4, 4, { r: [0.5, [0.25, 0.2, 0.75, 0.6]], q: [0.9, [0.8, 0.95, 1.1, 0.7]], n: [10, [5, 8, 12, 20]] }, function (v) {
    return { q: R`Sum \(1 + ${v.r} + ${v.r}^{2} + \cdots\) to infinity, and \(\sum_{k=0}^{${v.n - 1}} ${v.q}^{k}\).`,
      f: [['Infinite sum', 1 / (1 - v.r), '', 0.005], ['Partial sum', (1 - pow(v.q, v.n)) / (1 - v.q), '', 0.005]] }; });
  T(4, 5, { x: [0.02, [0.01, 0.03, 0.05]], n: [10, [5, 8, 12, 20]] }, function (v) {
    var ap = 1 + v.n * v.x, ex = pow(1 + v.x, v.n);
    return { q: R`Estimate \(${(1 + v.x).toFixed(2)}^{${v.n}}\) with the first-order binomial approximation and compare with the exact value.`,
      f: [['First-order estimate', ap, '', 0.002], ['Exact value', ex, '', 0.002], ['Error of the estimate', (ex - ap) / ex * 100, '%', 0.08]] }; });
  T(4, 7, { e: [1.5, 1.1, 3, 0.1] }, function (v) {
    return { q: R`A hyperbolic flyby has \(e\) = ${N(v.e)}. Find the asymptote angle \(\theta_\infty\).`, f: [[R`\(\theta_\infty\)`, deg(Math.acos(-1 / v.e)), '°', 0.005]] }; });
  X(4, 'C', R`What is the geometric meaning of the semi-latus rectum \(p\) of a conic \(r = p/(1 + e\cos\theta)\), and what does \(e\) control?`,
    R`\(p\) is the radius at \(\theta = 90°\), a quarter-turn from periapsis; it sets the size. The eccentricity \(e\) sets the shape: circle (0), ellipse (0–1), parabola (1), hyperbola (>1).`);
  X(4, 'C', R`The first-order approximation \((1+x)^{n} \approx 1 + nx\) is used constantly in engineering. When is it valid, and how do you estimate its error?`,
    R`It holds for \(|nx| \ll 1\). The first neglected term is \(\tfrac{n(n-1)}{2}x^{2}\), which estimates the error; state and later check the assumption.`);

  /* ───────── Ch 5 · Physics I ───────── */
  T(5, 1, { V: [30, 10, 60, 5], t: [6, 2, 12, 1] }, function (v) {
    var a = v.V / v.t;
    return { q: R`A car accelerates uniformly from 0 to ${v.V} m/s in ${v.t} s. Find its acceleration and distance traveled.`, f: [['Acceleration', a, 'm/s²'], ['Distance', 0.5 * a * v.t * v.t, 'm']] }; });
  T(5, 2, { V: [100, 20, 300, 10], th: [45, [20, 30, 60, 70]] }, function (v) {
    return { q: R`A projectile is launched at ${v.V} m/s and ${v.th}° with no drag (\(g\) = 9.81 m/s²). Find its range and maximum height.`,
      f: [['Range', v.V * v.V * sin(2 * rad(v.th)) / 9.81, 'm'], ['Maximum height', pow(v.V * sin(rad(v.th)), 2) / (2 * 9.81), 'm']] }; });
  T(5, 3, { h: [400, 200, 2000, 50] }, function (v) {
    var r = 6378 + v.h, vc = sqrt(MU / r);
    return { q: R`Find the circular orbit speed and period at ${N(v.h)} km altitude (\(R_\oplus\) = 6378 km, \(\mu\) = 398 600 km³/s²).`,
      f: [['Orbit speed', vc, 'km/s', 0.005], ['Period', 2 * PI * r / vc / 60, 'min', 0.005]] }; });
  (function () {
    var bodies = [['Earth', 398600, 6378], ['the Moon', 4902.8, 1737.4], ['Mars', 42828, 3396.2], ['Venus', 324859, 6051.8], ['Jupiter (1-bar level)', 1.26687e8, 71492]];
    T(5, 4, { k: [0, [1, 2, 3, 4]] }, function (v) {
      var b = bodies[v.k];
      return { q: R`Find the escape speed from the surface of ${b[0]} (\(\mu\) = ${N(b[1])} km³/s², \(R\) = ${N(b[2])} km).`, f: [['Escape speed', sqrt(2 * b[1] / b[2]), 'km/s', 0.005]] }; });
    T(8, 5, { k: [0, [1, 2, 3]] }, function (v) {
      var b = bodies[v.k];
      return { q: R`How much energy per kilogram is needed to lift a mass from the surface of ${b[0]} (\(\mu\) = ${N(b[1])} km³/s², \(R\) = ${N(b[2])} km) to infinity?`, f: [['Energy per kg', b[1] / b[2], 'MJ/kg', 0.01]] }; });
  })();
  T(5, 5, { h: [400, 100, 36000, 100] }, function (v) {
    var fr = pow(6371 / (6371 + v.h), 2);
    return { q: R`Compute \(g\) at ${N(v.h)} km altitude as a fraction of the surface value (use the mean radius 6371 km), and in m/s².`, f: [['Fraction of surface g', fr, '', 0.01], ['g', fr * g0, 'm/s²', 0.01]] }; });
  T(5, 6, { F: [2, 0.5, 10, 0.5], t: [3, 1, 10, 1], m: [50, 10, 200, 10] }, function (v) {
    return { q: R`A ${N(v.F)} kN force acts for ${v.t} s on a ${v.m} kg body at rest. Find its final speed.`, f: [['Final speed', v.F * 1000 * v.t / v.m, 'm/s']] }; });
  T(5, 8, { F: [100, 50, 2000, 50], d: [5, 1, 8, 0.5], L: [8, 2, 20, 1] }, function (v) {
    return { q: R`A ${N(v.F)} kN thrust gimballed ${v.d}° acts ${v.L} m behind the vehicle’s CG. Find the pitching torque.`, f: [['Torque', v.F * sin(rad(v.d)) * v.L, 'kN·m']] }; });
  X(5, 'C', R`A satellite in a circular orbit moves at constant speed. Is it accelerating? What force provides the acceleration, and how does that give \(v_c = \sqrt{\mu/r}\)?`,
    R`Yes: its velocity direction changes continuously, a centripetal acceleration \(v^{2}/r\) toward the planet. Gravity \(\mu/r^{2}\) per unit mass provides it; equating the two gives \(v_c = \sqrt{\mu/r}\).`);
  X(5, 'C', R`State the impulse–momentum theorem and explain why it is the natural starting point for rocket thrust.`,
    R`The impulse \(\int F\,dt\) on a body equals its change in momentum. A rocket continuously throws mass backward; the momentum carried away per second by the exhaust equals the forward force on the vehicle, which leads directly to \(F = \dot m v_e\).`);

  /* ───────── Ch 6 · Chemistry ───────── */
  (function () {
    var fuels = [
      [R`H₂ + ½ O₂ → H₂O`, 'hydrogen', 0.5 * 31.999 / 2.016], [R`CH₄ + 2 O₂ → CO₂ + 2 H₂O`, 'methane', 2 * 31.999 / 16.043],
      [R`C₂H₅OH + 3 O₂ → 2 CO₂ + 3 H₂O`, 'ethanol (46.069 g/mol)', 3 * 31.999 / 46.069], [R`C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O`, 'propane (44.097 g/mol)', 5 * 31.999 / 44.097],
      [R`CO + ½ O₂ → CO₂`, 'carbon monoxide (28.010 g/mol)', 0.5 * 31.999 / 28.010], [R`C₁₂H₂₆ + 18.5 O₂ → 12 CO₂ + 13 H₂O`, 'dodecane (170.34 g/mol), a kerosene surrogate', 18.5 * 31.999 / 170.34]];
    var mk = function (v) { var f = fuels[v.k]; return { q: R`Compute the stoichiometric \(O/F\) by mass for ${f[0]} (fuel: ${f[1]}; O₂ = 31.999 g/mol).`, f: [[R`Stoichiometric \(O/F\)`, f[2], '', 0.01]] }; };
    T(6, 1, { k: [0, [2, 3, 4, 5]] }, mk); T(6, 2, { k: [1, [2, 3, 4, 5]] }, mk);
    T(17, 6, { k: [0, [1, 2, 3, 5]] }, function (v) { var f = fuels[v.k]; return { q: R`Compute the stoichiometric mixture fraction \(Z_{st}\) for ${f[1]} burning in pure oxygen (stoichiometric \(O/F\) = ${f[2].toFixed(3)}).`, f: [[R`\(Z_{st}\)`, 1 / (1 + f[2]), '', 0.01]] }; });
  })();
  (function () {
    var mix = [
      ['Dry air is 78.08% N₂, 20.95% O₂, 0.93% Ar and 0.04% CO₂ by mole.', 0.7808 * 28.013 + 0.2095 * 31.999 + 0.0093 * 39.948 + 0.0004 * 44.010],
      ['The atmosphere of Mars is about 95.1% CO₂ (44.010), 2.6% N₂ (28.013), 1.9% Ar (39.948) and 0.4% CO (28.010) by mole.', 0.951 * 44.010 + 0.026 * 28.013 + 0.019 * 39.948 + 0.004 * 28.010],
      ['A fuel-rich exhaust is 70% H₂O (18.015) and 30% H₂ (2.016) by mole.', 0.7 * 18.015 + 0.3 * 2.016],
      ['A methane-engine exhaust is 60% H₂O (18.015), 30% CO₂ (44.010) and 10% CO (28.010) by mole.', 0.6 * 18.015 + 0.3 * 44.010 + 0.1 * 28.010],
      ['A pressurant blend is 80% He (4.003) and 20% N₂ (28.013) by mole.', 0.8 * 4.003 + 0.2 * 28.013]];
    T(6, 3, { k: [0, [1, 2, 3, 4]] }, function (v) { return { q: mix[v.k][0] + ' Compute its molar mass.', f: [['Molar mass', mix[v.k][1], 'g/mol', 0.005]] }; });
  })();
  T(6, 4, { p: [101.325, [26.5, 54.05, 70.1, 89.9, 120]], T: [288.15, [216.65, 223.25, 255.7, 300, 320]] }, function (v) {
    return { q: R`Compute the density of air at ${N(v.p * 1000)} Pa and ${N(v.T)} K (\(R\) = 287.05 J/(kg·K)).`, f: [['Density', v.p * 1000 / (287.05 * v.T), 'kg/m³', 0.01]] }; });
  S(6, 5, [['Per kg of H₂', 241.83 / 2.016, 'MJ/kg', 0.01], ['Per kg of mixture', 241.83 / 18.015, 'MJ/kg', 0.01]]);
  T(6, 7, { n1: [2, 1, 5, 1], n2: [1, 1, 4, 1], p: [10, 2, 20, 1] }, function (v) {
    return { q: R`A gas of ${v.n1} mol H₂O and ${v.n2} mol H₂ is at ${v.p} MPa. Find the partial pressure of H₂.`, f: [[R`\(p_{H_2}\)`, v.p * v.n2 / (v.n1 + v.n2), 'MPa', 0.01]] }; });
  T(6, 8, { M: [13, 9, 30, 1] }, function (v) {
    return { q: R`Compute \(R\) for a combustion product gas of molar mass ${v.M} kg/kmol.`, f: [['R', 8314.46 / v.M, 'J/(kg·K)', 0.005]] }; });
  X(6, 'C', R`Define mixture ratio \(O/F\) and equivalence ratio \(\phi\). If an engine runs at \(\phi = 1.3\), is it fuel-rich or oxidizer-rich, and is its \(O/F\) above or below stoichiometric?`,
    R`\(O/F\) is oxidizer mass flow over fuel mass flow. \(\phi = (F/O)/(F/O)_{st}\). \(\phi = 1.3 > 1\) is fuel-rich, so \(O/F\) is below the stoichiometric value by the factor 1/1.3.`);
  X(6, 'C', R`Why must absolute temperature and absolute pressure be used in the ideal-gas law? Give a failure each mistake would cause.`,
    R`\(p = \rho RT\) is a statement about molecular energy and number density, which scale with absolute values. Using °C would give zero pressure at 0 °C; using gauge pressure would give zero density at one atmosphere.`);

  /* ───────── Ch 7 · Intro to rockets ───────── */
  T(7, 1, { md: [250, 50, 500, 10], ve: [3000, 2200, 4500, 50] }, function (v) {
    return { q: R`An engine has \(\dot m\) = ${v.md} kg/s and \(v_e\) = ${N(v.ve)} m/s with \(p_e = p_a\). Find \(F\) and \(I_{sp}\).`, f: [['F', v.md * v.ve / 1000, 'kN'], [R`\(I_{sp}\)`, v.ve / g0, 's', 0.005]] }; });
  T(7, 2, { m0: [50000, 20000, 500000, 5000], fr: [0.3, 0.1, 0.5, 0.02], I: [300, 250, 450, 10] }, function (v) {
    var mf = Math.round(v.m0 * v.fr / 100) * 100;
    return { q: R`A rocket with \(m_0\) = ${N(v.m0)} kg, \(m_f\) = ${N(mf)} kg and \(I_{sp}\) = ${v.I} s fires in free space. Find \(\Delta v\).`, f: [[R`\(\Delta v\)`, v.I * g0 * ln(v.m0 / mf), 'm/s', 0.005]] }; });
  T(7, 3, { F: [750, 500, 8000, 50], m: [50, 30, 550, 10] }, function (v) {
    return { q: R`Find the liftoff thrust-to-weight ratio for ${N(v.F)} kN of thrust and \(m_0\) = ${v.m} t.`, f: [['T/W', v.F * 1000 / (v.m * 1000 * g0), '', 0.01]] }; });
  (function () {
    var alt = [[10, 0.4135], [0, 1.225], [5, 0.7364], [15, 0.1948], [20, 0.0889]];
    T(7, 4, { k: [0, [1, 2, 3, 4]], V: [500, 100, 1500, 50] }, function (v) {
      var a = alt[v.k];
      return { q: R`Find \(q\) at ${a[0]} km (\(\rho\) = ${a[1]} kg/m³) and ${N(v.V)} m/s.`, f: [['q', 0.5 * a[1] * v.V * v.V / 1000, 'kPa']] }; });
  })();
  T(7, 6, { m0: [50000, 20000, 500000, 5000], fr: [0.3, 0.1, 0.5, 0.02], I: [300, 250, 450, 10], md: [250, 100, 2000, 50] }, function (v) {
    var mf = Math.round(v.m0 * v.fr / 100) * 100, tb = (v.m0 - mf) / v.md, loss = 9.81 * tb, dv = v.I * g0 * ln(v.m0 / mf);
    return { q: R`A rocket with \(m_0\) = ${N(v.m0)} kg, \(m_f\) = ${N(mf)} kg, \(I_{sp}\) = ${v.I} s and \(\dot m\) = ${N(v.md)} kg/s flies vertically without drag (\(g\) = 9.81 m/s²). Find the burn time, gravity loss and burnout velocity.`,
      f: [['Burn time', tb, 's'], ['Gravity loss', loss, 'm/s'], ['Burnout velocity', dv - loss, 'm/s']] }; });
  X(7, 'C', R`Write the thrust equation and say what each of its two terms represents physically. When does the second term vanish?`,
    R`\(F = \dot m v_e + (p_e - p_a)A_e\). The first term is the momentum flux of the exhaust; the second is the pressure imbalance over the exit area. The pressure term vanishes for a perfectly expanded nozzle, \(p_e = p_a\).`);
  X(7, 'C', R`What is gravity loss, and why does a higher thrust-to-weight ratio reduce it?`,
    R`While thrust fights gravity during a burn, velocity of about \(g\,t_b\) (for vertical flight) is spent just supporting the vehicle. A higher \(T/W\) shortens the burn time for the same \(\Delta v\), so less is lost.`);
  X(7, 'I', R`A model rocket’s CP is 2 calibers behind its CG at liftoff. As the motor burns out, the CG moves forward. Does the static margin grow or shrink, and what happens if the margin becomes very large?`,
    R`With the CG moving forward and the CP fixed, the margin grows. The rocket becomes more stable but over-stable: it weathercocks strongly into any crosswind, tilting the flight path and costing altitude.`, [5]);

  /* ───────── Ch 8 · Calculus ───────── */
  T(8, 1, { n: [2, [2, 3]], a: [1, [0.5, 1, 1.5, 2]] }, function (v) {
    return { q: R`Differentiate \(x^{${v.n}}\sin x\) and evaluate the derivative at \(x\) = ${v.a} (radians).`,
      f: [[R`\(f'(${v.a})\)`, v.n * pow(v.a, v.n - 1) * sin(v.a) + pow(v.a, v.n) * cos(v.a), '', 0.01]] }; }, { vo: true });
  (function () {
    var ints = [[R`\int_{0}^{\pi}\sin x\,dx`, 2], [R`\int_{0}^{\pi/2}\cos x\,dx`, 1], [R`\int_{0}^{2}3x^{2}\,dx`, 8], [R`\int_{1}^{e}\frac{1}{x}\,dx`, 1], [R`\int_{0}^{1}e^{2x}\,dx`, (exp(2) - 1) / 2], [R`\int_{0}^{\pi/2}\sin^{2}x\,dx`, PI / 4], [R`\int_{0}^{3}(2x+1)\,dx`, 12]];
    T(8, 2, { k: [0, [1, 2, 3, 4, 5, 6]] }, function (v) { return { q: R`Evaluate \(${ints[v.k][0]}\).`, f: [['Value', ints[v.k][1], '', 0.005]] }; });
    var lims = [[R`\lim_{x\to 0}\,(1-\cos x)/x^{2}`, 0.5], [R`\lim_{x\to 0}\,\sin(3x)/x`, 3], [R`\lim_{x\to 0}\,(e^{x}-1-x)/x^{2}`, 0.5], [R`\lim_{x\to 0}\,(1-\cos 2x)/x^{2}`, 2], [R`\lim_{x\to 0}\,\ln(1+x)/x`, 1], [R`\lim_{x\to 0}\,(\tan x - x)/x^{3}`, 1 / 3]];
    T(8, 7, { k: [0, [1, 2, 3, 4, 5]] }, function (v) { return { q: R`Evaluate \(${lims[v.k][0]}\).`, f: [['Limit', lims[v.k][1], '', 0.01]] }; });
  })();
  T(8, 3, { V: [10, 2, 50, 2] }, function (v) {
    var r = Math.cbrt(v.V / (2 * PI));
    return { q: R`A closed cylindrical tank must hold ${v.V} m³. Find the radius and height that minimize surface area.`, f: [['Radius', r, 'm', 0.01], ['Height', 2 * r, 'm', 0.01]] }; });
  T(8, 4, { x: [0.1, [0.2, 0.3, 0.5, -0.1]] }, function (v) {
    return { q: R`Estimate \(e^{${v.x}}\) with four Taylor terms and compare with the exact value.`,
      f: [['Four-term estimate', 1 + v.x + v.x * v.x / 2 + pow(v.x, 3) / 6, '', 0.0005], ['Exact value', exp(v.x), '', 0.0005]] }; });
  T(8, 6, { m0: [50, 30, 200, 10], md: [250, 100, 600, 50], c: [2942, [2600, 2942, 3200, 3400]], t: [100, 40, 120, 10] }, function (v) {
    var k = v.md / (v.m0 * 1000), U = 1 - k * v.t;
    if (U < 0.25) { v.t = 40; U = 1 - k * v.t; }
    return { q: R`A rocket flies vertically from rest without drag. With \(m_0\) = ${v.m0} t, \(\dot m\) = ${v.md} kg/s, \(c\) = ${N(v.c)} m/s and \(g\) = 9.80665 m/s², find \(v\) and \(h\) at \(t\) = ${v.t} s (use §8.8).`,
      f: [['v', -v.c * ln(U) - g0 * v.t, 'm/s'], ['h', ((v.c / k) * (U * ln(U) - U + 1) - 0.5 * g0 * v.t * v.t) / 1000, 'km']] }; });
  X(8, 'C', R`You have altitude samples from a flight computer every 0.1 s. How do you estimate velocity from them, and why does differentiating measured data amplify noise?`,
    R`Velocity is the derivative of altitude, estimated by finite differences such as \((h_{i+1}-h_{i-1})/(2\Delta t)\). Differencing divides small, noisy differences by a small \(\Delta t\), so noise of size \(\epsilon\) becomes velocity noise of order \(\epsilon/\Delta t\). Smooth or fit before differentiating.`);
  X(8, 'C', R`Total impulse is \(I_t = \int F\,dt\). Explain what this integral means on a thrust curve and how you would evaluate it from sampled data.`,
    R`It is the area under the thrust–time curve, in N·s. From samples, sum trapezoids: \(\sum \tfrac12(F_i + F_{i+1})\Delta t\). Dividing by the propellant weight burned gives the delivered specific impulse.`);
  X(8, 'I', R`Using the result \(v(t) = c\ln\!\big(m_0/m(t)\big) - gt\) for vertical flight, explain which term is the rocket equation of Chapter 7 and what the other term represents.`,
    R`\(c\ln(m_0/m)\) is the ideal (Tsiolkovsky) velocity gain. The \(-gt\) term is the gravity loss accumulated over the burn; it grows with burn time, which is why fast burns are favored.`, [7]);

  /* ───────── Ch 9 · Vector calculus ───────── */
  T(9, 1, { x: [1, [1, 2, -1]], y: [1, [1, 2]], z: [0, [0, 1]] }, function (v) {
    var e = exp(v.y * v.z);
    return { q: R`For \(f = x^{2}y + e^{yz}\), compute \(\nabla f\) at \((${v.x},${v.y},${v.z})\).`,
      f: [[R`\(\partial f/\partial x\)`, 2 * v.x * v.y, '', { abs: 0.02 }], [R`\(\partial f/\partial y\)`, v.x * v.x + v.z * e, '', 0.01], [R`\(\partial f/\partial z\)`, v.y * e, '', 0.01]] }; });
  T(9, 2, { a: [1, [1, 2, 3]], b: [1, [1, 2, -1]], c: [1, [1, 3]], k: [1, [1, 2, 3, 5]] }, function (v) {
    var s = function (n, t) { return (n === 1 ? '' : n === -1 ? '-' : n) + t; };
    return { q: R`Compute \(\nabla\cdot\mathbf{v}\) for \(\mathbf{v} = (${s(v.a, 'x')},${s(v.b, 'y')},${s(v.c, 'z')})\) and the \(z\)-component of \(\nabla\times\mathbf{w}\) for \(\mathbf{w} = (${s(-v.k, 'y')},${s(v.k, 'x')},0)\).`,
      f: [[R`\(\nabla\cdot\mathbf{v}\)`, v.a + v.b + v.c, '', { abs: 0.01 }], [R`\((\nabla\times\mathbf{w})_z\)`, 2 * v.k, '', { abs: 0.01 }]] }; });
  T(9, 3, { s: [10, 4, 40, 2] }, function (v) {
    return { q: R`Maximize \(xy\) subject to \(x + y = ${v.s}\) using a Lagrange multiplier.`, f: [['x', v.s / 2, ''], ['y', v.s / 2, ''], ['Maximum of xy', v.s * v.s / 4, '']] }; });
  T(9, 4, { M: [100, 10, 500, 10], r: [0.5, 0.1, 2, 0.1] }, function (v) {
    return { q: R`Evaluate the moment of inertia of a uniform solid sphere about a diameter for \(M\) = ${v.M} kg and \(R\) = ${N(v.r)} m.`, f: [['I', 0.4 * v.M * v.r * v.r, 'kg·m²']] }; });
  T(9, 5, { r: [2, [1, 3, 4, 0.5]] }, function (v) {
    return { q: R`Use the divergence theorem to find the flux of \(\mathbf{F} = (x,y,z)\) through a sphere of radius ${v.r}.`, f: [['Flux', 4 * PI * pow(v.r, 3), '']] }; });
  T(9, 7, { ur: [2, [1, 3, 4]], uv: [1, [0.5, 1.5, 2]] }, function (v) {
    return { q: R`\(q = \tfrac12\rho V^{2}\) with independent relative uncertainties of ${v.ur}% in \(\rho\) and ${v.uv}% in \(V\). Find the relative uncertainty in \(q\), combined in quadrature, and its worst case.`,
      f: [['Quadrature', sqrt(v.ur * v.ur + 4 * v.uv * v.uv), '%'], ['Worst case', v.ur + 2 * v.uv, '%']] }; });
  X(9, 'C', R`What does the gradient of a scalar field tell you, and in which direction does it point? Give an atmospheric example.`,
    R`\(\nabla f\) points in the direction of steepest increase of \(f\), with magnitude equal to that rate of change; it is perpendicular to surfaces of constant \(f\). The pressure gradient in the atmosphere points downward (toward higher pressure), and the force on a fluid parcel is \(-\nabla p\).`);
  X(9, 'C', R`State the divergence theorem in words and say why it is the bridge between integral and differential conservation laws.`,
    R`The flux of a vector field out through a closed surface equals the volume integral of its divergence inside. It converts surface flux terms in a control-volume balance into volume integrals, so the balance can be written at a point as a differential equation.`);

  /* ───────── Ch 10 · Linear algebra ───────── */
  T(10, 1, { a: [2, [2, 3, 4]], b: [1, [1, 2]], c: [1, [1, -1, 2]], d: [3, [3, 4, 5]] }, function (v) {
    var D = v.a * v.d - v.b * v.c;
    return { q: R`Find \(\det\mathbf{A}\) and \(\mathbf{A}^{-1}\) for \(\mathbf{A} = \begin{bmatrix} ${v.a} & ${v.b} \\ ${v.c} & ${v.d} \end{bmatrix}\).`,
      f: [['det A', D, '', { abs: 0.01 }], [R`\((A^{-1})_{11}\)`, v.d / D, '', { abs: 0.01 }], [R`\((A^{-1})_{12}\)`, -v.b / D, '', { abs: 0.01 }], [R`\((A^{-1})_{21}\)`, -v.c / D, '', { abs: 0.01 }], [R`\((A^{-1})_{22}\)`, v.a / D, '', { abs: 0.01 }]] }; });
  T(10, 2, { a: [2, [2, 3, 4, 5]], b: [1, [1, 2, 3]] }, function (v) {
    return { q: R`Find the eigenvalues of \(\begin{bmatrix} ${v.a} & ${v.b} \\ ${v.b} & ${v.a} \end{bmatrix}\).`, f: [['Smaller eigenvalue', v.a - v.b, '', { abs: 0.01 }], ['Larger eigenvalue', v.a + v.b, '', { abs: 0.01 }]] }; });
  T(10, 3, { y0: [1, [0, 1, 2]], y1: [3, [2, 3, 4, 5]], y2: [4, [4, 5, 6, 7]] }, function (v) {
    var b = (v.y2 - v.y0) / 2, a = (v.y0 + v.y1 + v.y2) / 3 - b;
    return { q: R`Fit \(y = a + bx\) by least squares to the points \((0,${v.y0})\), \((1,${v.y1})\), \((2,${v.y2})\).`, f: [['a', a, '', { abs: 0.01 }], ['b', b, '', { abs: 0.01 }]] }; });
  T(10, 4, { th: [90, [30, 45, 60, 180, -90]] }, function (v) {
    return { q: R`Apply an active ${v.th}° rotation about \(z\) to \((1,0,0)\).`, f: [["x′", cos(rad(v.th)), '', { abs: 0.01 }], ["y′", sin(rad(v.th)), '', { abs: 0.01 }], ["z′", 0, '', { abs: 0.01 }]] }; });
  T(10, 5, { k: [8, [4, 6, 10, 12]] }, function (v) {
    return { q: R`A system has condition number \(10^{${v.k}}\) and is solved in double precision (about 16 digits). How many digits of the solution can you trust?`, f: [['Trustworthy digits', 16 - v.k, '', { abs: 0.6 }]] }; });
  T(10, 6, { m: [2, [1, 3, 5]], a: [1, [1, 2]] }, function (v) {
    var r2 = 2 * v.a * v.a;
    return { q: R`A point mass of ${v.m} kg sits at \(\mathbf{r} = (${v.a},${v.a},0)\) m. Using \(\mathbf{I} = m(r^{2}\mathbf{E} - \mathbf{rr}^{T})\), compute its inertia tensor and principal moments.`,
      f: [[R`\(I_{xx}\)`, v.m * v.a * v.a, 'kg·m²', { abs: 0.01 }], [R`\(I_{xy}\)`, -v.m * v.a * v.a, 'kg·m²', { abs: 0.01 }], [R`\(I_{zz}\)`, v.m * r2, 'kg·m²', { abs: 0.01 }], ['Smallest principal moment', 0, 'kg·m²', { abs: 0.01 }], ['Largest principal moment', v.m * r2, 'kg·m²', { abs: 0.01 }]] }; });
  T(10, 7, { a: [4, [3, 5, 6]], b: [2, [1, 2]], d: [3, [2, 3, 4]] }, function (v) {
    var e = P.eig2(v.a, v.b, v.d);
    return { q: R`Find the eigenvalues of \(\begin{bmatrix} ${v.a} & ${v.b} \\ ${v.b} & ${v.d} \end{bmatrix}\) and decide whether it is positive definite.`, f: [['Larger eigenvalue', e[1], '', 0.01], ['Smaller eigenvalue', e[0], '', 0.01]] }; });
  X(10, 'C', R`What makes a matrix a valid rotation matrix, and why do those properties matter for flight software that composes many rotations?`,
    R`It is orthogonal (\(\mathbf R^{T}\mathbf R = \mathbf I\)) with determinant +1, so it preserves lengths and angles and has inverse \(\mathbf R^{T}\). Repeated floating-point products drift from orthogonality, so software must re-orthonormalize or use quaternions.`);
  X(10, 'C', R`In a least-squares fit \(\mathbf{Ax}\approx\mathbf b\), what is being minimized, and what geometric condition does the solution satisfy?`,
    R`The sum of squared residuals \(\|\mathbf{Ax}-\mathbf b\|^{2}\). At the solution the residual is orthogonal to the column space of \(\mathbf A\): \(\mathbf A^{T}(\mathbf{Ax}-\mathbf b) = 0\).`);

  /* ───────── Ch 11 · ODEs and Laplace ───────── */
  T(11, 1, { k: [2, [0.5, 1, 3]], y0: [5, [2, 10, 8]], t: [1, [0.5, 2]] }, function (v) {
    return { q: R`Solve \(y' = -${v.k}y\) with \(y(0) = ${v.y0}\), and evaluate \(y(${v.t})\).`, f: [[R`\(y(${v.t})\)`, v.y0 * exp(-v.k * v.t), '']] }; });
  T(11, 2, { m: [80, 50, 120, 5], cd: [1.0, [0.5, 0.75, 1.2]], A: [0.7, [0.3, 0.5, 1.0]] }, function (v) {
    return { q: R`Find the terminal velocity for \(m\) = ${v.m} kg, \(\rho\) = 1.225 kg/m³, \(C_D\) = ${v.cd} and \(A\) = ${v.A} m².`, f: [[R`\(V_t\)`, sqrt(2 * v.m * 9.807 / (1.225 * v.cd * v.A)), 'm/s']] }; });
  T(11, 3, { b: [4, [2, 6]], c: [20, [10, 13, 25, 40]] }, function (v) {
    var wn = sqrt(v.c);
    return { q: R`For \(\ddot x + ${v.b}\dot x + ${v.c}x = 0\), find \(\omega_n\), \(\zeta\), the real part of the roots and \(\omega_d\).`,
      f: [[R`\(\omega_n\)`, wn, 'rad/s', 0.01], [R`\(\zeta\)`, v.b / (2 * wn), '', 0.01], ['Real part of roots', -v.b / 2, '1/s', { abs: 0.02 }], [R`\(\omega_d\)`, sqrt(v.c - v.b * v.b / 4), 'rad/s', 0.01]] }; });
  T(11, 4, { a: [2, [1, 4, 5]], t: [1, [0.5, 2]] }, function (v) {
    return { q: R`Find the inverse Laplace transform of \(1/[s(s + ${v.a})]\) and evaluate it at \(t\) = ${v.t}.`, f: [[R`\(y(${v.t})\)`, (1 - exp(-v.a * v.t)) / v.a, '', 0.01]] }; }, { vo: true });
  T(11, 5, { K: [5, [2, 4, 6, 10]], p: [2, [3, 4, 5]] }, function (v) {
    return { q: R`Use the final value theorem on \(Y(s) = ${v.K}/[s(s^{2} + ${1 + v.p}s + ${v.p})]\).`, f: [[R`\(y(\infty)\)`, v.K / v.p, '', 0.01]] }; });
  (function () {
    var cs = [[3, 2], [5, 4], [5, 6], [4, 3], [7, 10], [6, 5]];
    T(11, 7, { k: [0, [1, 2, 3, 4, 5]] }, function (v) {
      var b = cs[v.k][0], c = cs[v.k][1], d = sqrt(b * b - 4 * c);
      return { q: R`Find the eigenvalues of \(\dot{\mathbf{x}} = \begin{bmatrix} 0 & 1 \\ -${c} & -${b} \end{bmatrix}\mathbf{x}\) and classify the equilibrium.`, f: [['More negative eigenvalue', (-b - d) / 2, '', { abs: 0.02 }], ['Less negative eigenvalue', (-b + d) / 2, '', { abs: 0.02 }]] }; });
  })();
  X(11, 'C', R`A second-order system has damping ratio \(\zeta\). Describe its free response for \(\zeta < 1\), \(\zeta = 1\) and \(\zeta > 1\).`,
    R`Underdamped (\(\zeta<1\)): decaying oscillation at \(\omega_d = \omega_n\sqrt{1-\zeta^{2}}\). Critically damped (\(\zeta=1\)): fastest return without overshoot. Overdamped (\(\zeta>1\)): two real decaying exponentials, a slower return with no oscillation.`);
  X(11, 'C', R`Why do engineers transform linear ODEs with the Laplace transform, and what does a pole in the right half-plane mean?`,
    R`The transform turns differentiation into multiplication by \(s\), so linear constant-coefficient ODEs become algebra and systems become transfer functions. A right-half-plane pole corresponds to a growing exponential in time: the system is unstable.`);
  X(11, 'I', R`The state matrix of a linear system has eigenvalues \(-1 \pm 3i\). Is the equilibrium stable, and what is the oscillation frequency and decay rate of the response?`,
    R`Stable (negative real parts): a stable spiral. The response decays as \(e^{-t}\) while oscillating at 3 rad/s.`, [10]);

  /* ───────── Ch 12 · PDEs, Fourier ───────── */
  T(12, 2, { x: [1, [0.5, 2, 3]], t: [100, [25, 50, 200, 400]], Ts: [1000, [800, 1200, 1500]] }, function (v) {
    var eta = v.x / 100 / (2 * sqrt(1e-5 * v.t));
    return { q: R`A semi-infinite solid (\(\alpha\) = 1.0 × 10⁻⁵ m²/s) initially at 300 K has its surface raised suddenly to ${v.Ts} K. Find the temperature ${v.x} cm deep after ${v.t} s.`,
      f: [[R`\(\eta = x/(2\sqrt{\alpha t})\)`, eta, '', 0.01], ['Temperature', v.Ts + (300 - v.Ts) * P.erf(eta), 'K', 0.01]] }; });
  T(12, 3, { n: [1, [3, 5, 7]], A: [1, [2, 5]] }, function (v) {
    return { q: R`A square wave of amplitude ${v.A} has Fourier series \(\frac{4A}{\pi}\sum_{n\ \text{odd}}\sin(nx)/n\). What is the amplitude of harmonic \(n\) = ${v.n}?`, f: [['Amplitude', 4 * v.A / (v.n * PI), '', 0.01]] }; });
  T(12, 5, { a: [340, [300, 1000, 1500, 5000]], t: [5, [2, 10, 20]] }, function (v) {
    return { q: R`An acoustic pulse travels along a tube at ${N(v.a)} m/s. How far does it move in ${v.t} ms?`, f: [['Distance', v.a * v.t / 1000, 'm']] }; });
  X(12, 'C', R`The heat equation smooths an initial temperature profile while the wave equation propagates it. Explain the difference using the Fourier modes of each equation.`,
    R`In the heat equation each mode decays as \(e^{-\alpha k^{2}t}\), fastest for short wavelengths, so sharp features vanish first. In the wave equation each mode oscillates in time without decay and travels at speed \(c\), so shapes are carried rather than erased.`);
  X(12, 'C', R`What is a similarity solution, and what does the variable \(\eta = x/(2\sqrt{\alpha t})\) tell you about how far heat has penetrated?`,
    R`A solution that depends on the independent variables only through one combined variable, collapsing a PDE to an ODE. Here the temperature depends only on \(\eta\), so the penetration depth grows as \(\sqrt{\alpha t}\): four times the time for twice the depth.`);
  X(12, 'I', R`A rod of length \(L\) with both ends held at zero temperature has modes \(\sin(n\pi x/L)\). Using the ODE for the time part, give the decay time constant of mode \(n\).`,
    R`The time part satisfies \(T' = -\alpha\lambda_n T\) with \(\lambda_n = (n\pi/L)^{2}\), so \(T \propto e^{-t/\tau_n}\) with \(\tau_n = L^{2}/(\alpha n^{2}\pi^{2})\).`, [11]);

  /* ───────── Ch 13 · Probability and statistics ───────── */
  T(13, 1, { s: [0.95, [0.9, 0.99, 0.8]], fp: [0.02, [0.01, 0.05, 0.1]], pr: [0.01, [0.005, 0.02, 0.05]] }, function (v) {
    return { q: R`A crack detector finds real cracks with ${N(v.s * 100)}% probability and gives false positives ${N(v.fp * 100)}% of the time; ${N(v.pr * 100)}% of parts are cracked. Given a positive result, what is the probability that the part is cracked?`,
      f: [['P(cracked | positive)', v.s * v.pr / (v.s * v.pr + v.fp * (1 - v.pr)), '', 0.01]] }; });
  T(13, 2, { a: [2, [1, 1.5, 2.5]], b: [3, [1, 1.5, 2.5]] }, function (v) {
    if (v.a === v.b) v.b = v.a === 1 ? 2 : 1;
    return { q: R`For a normal variable, what fraction of outcomes lie within ±${v.a}σ and within ±${v.b}σ?`, f: [[R`Within ±${v.a}σ`, P.erf(v.a / Math.SQRT2) * 100, '%', 0.003], [R`Within ±${v.b}σ`, P.erf(v.b / Math.SQRT2) * 100, '%', 0.003]] }; });
  T(13, 3, { r: [0.99, [0.9, 0.95, 0.98, 0.995]] }, function (v) {
    return { q: R`Three engines each have reliability ${v.r} for a mission. Find the system reliability if all three are required, and if any two suffice.`,
      f: [['All three required', pow(v.r, 3), '', 0.0005], ['Any two suffice', pow(v.r, 3) + 3 * v.r * v.r * (1 - v.r), '', 0.0005]] }; });
  T(13, 4, { uf: [0.5, [0.3, 1, 1.5]], um: [1.0, [0.5, 2]] }, function (v) {
    return { q: R`\(I_{sp} = F/(\dot m g_0)\), with 1σ uncertainties of ${v.uf}% in \(F\) and ${v.um}% in \(\dot m\). Find the relative uncertainty in \(I_{sp}\).`, f: [['Relative uncertainty', sqrt(v.uf * v.uf + v.um * v.um), '%', 0.01]] }; });
  (function () {
    var tv = { 5: 2.776, 10: 2.262, 16: 2.131, 25: 2.064 };
    T(13, 5, { n: [10, [5, 16, 25]], s: [2, [1, 3, 5]] }, function (v) {
      var se = v.s / sqrt(v.n);
      return { q: R`${v.n} thrust measurements have \(s\) = ${v.s} N. Find the standard error and the 95% confidence half-width (\(t_{${v.n - 1}}\) = ${tv[v.n]}).`, f: [['Standard error', se, 'N', 0.01], ['95% half-width', tv[v.n] * se, 'N', 0.01]] }; });
  })();
  T(13, 7, { a: [4, [3, 5, 6, 9]], b: [2, [1, 2]], d: [3, [2, 3, 4]] }, function (v) {
    var e = P.eig2(v.a, v.b, v.d);
    return { q: R`A 2-D position covariance is \(\begin{bmatrix} ${v.a} & ${v.b} \\ ${v.b} & ${v.d} \end{bmatrix}\) m². Find the principal standard deviations.`, f: [['Larger σ', sqrt(e[1]), 'm', 0.01], ['Smaller σ', sqrt(e[0]), 'm', 0.01]] }; });
  X(13, 'C', R`Why does averaging \(N\) independent measurements reduce the uncertainty of the mean only as \(1/\sqrt N\), and what kind of error does averaging not reduce at all?`,
    R`Variances of independent errors add, so the variance of the mean is \(\sigma^{2}/N\) and its standard deviation \(\sigma/\sqrt N\). Systematic (bias) errors are common to every reading and are untouched by averaging.`);
  X(13, 'C', R`Telemetry from two sensors has correlation coefficient 0.9. Does that show one causes the other? What does correlation actually measure?`,
    R`No. Correlation measures the strength of a <em>linear</em> association between two variables. Both can respond to a common cause (for example vehicle acceleration), and strong nonlinear relations can even give zero correlation.`);
  X(13, 'I', R`A 2-D covariance matrix has off-diagonal terms. What do its eigenvectors and eigenvalues describe about the error ellipse?`,
    R`The eigenvectors give the directions of the ellipse’s principal axes and the eigenvalues the variances along them; the semi-axes of the 1σ ellipse are the square roots of the eigenvalues.`, [10]);

  /* ───────── Ch 14 · Numerical methods ───────── */
  T(14, 1, { n: [2, [3, 5, 7, 10]] }, function (v) {
    var x = 1, o = []; for (var i = 0; i < 3; i++) { x = x - (x * x - v.n) / (2 * x); o.push(x); }
    return { q: R`Apply Newton’s method to \(x^{2} - ${v.n} = 0\) from \(x_0 = 1\) for three iterations.`, f: [[R`\(x_1\)`, o[0], '', 0.0005], [R`\(x_2\)`, o[1], '', 0.0005], [R`\(x_3\)`, o[2], '', 0.0005]] }; });
  T(14, 2, { M: [1, [0.5, 1.5, 2]], e: [0.5, [0.1, 0.2, 0.3, 0.7]] }, function (v) {
    return { q: R`Solve Kepler’s equation \(M = E - e\sin E\) for \(M\) = ${v.M} rad and \(e\) = ${v.e} to four decimals.`, f: [['E', P.kepler(v.M, v.e), 'rad', { abs: 0.0006 }]] }; });
  T(14, 3, { n: [3, [2, 4]], b: [1, [1, 2]] }, function (v) {
    var f = function (x) { return pow(x, v.n); }, h = v.b / 2;
    return { q: R`Approximate \(\int_{0}^{${v.b}}x^{${v.n}}dx\) with the trapezoid rule and with Simpson’s rule, using two intervals.`,
      f: [['Trapezoid', h * (f(0) / 2 + f(h) + f(v.b) / 2), '', 0.005], ['Simpson', h / 3 * (f(0) + 4 * f(h) + f(v.b)), '', 0.005]] }; });
  T(14, 4, { L: [1000, [50, 100, 500, 20000]] }, function (v) {
    return { q: R`What is the largest stable explicit Euler step for \(\dot y = -${N(v.L)}y\)?`, f: [[R`\(h_{\max}\)`, 2 / v.L, 's', 0.01]] }; });
  T(14, 5, { r: [4, [2, 8, 16]] }, function (v) {
    return { q: R`A grid study gives errors of \(${N(1e-3 * v.r / 4)}\) and \(${N(1e-3 / 4)}\) at steps \(h\) and \(h/2\). Find the observed order.`, f: [['Observed order p', Math.log2(v.r), '', { abs: 0.03 }]] }; });
  T(14, 7, { k: [6, [4, 5, 8]] }, function (v) {
    return { q: R`A system has eigenvalues \(-1\) and \(-10^{${v.k}}\). Find the stiffness ratio and the largest stable explicit Euler step.`, f: [['Stiffness ratio', pow(10, v.k), '', 0.01], [R`\(h_{\max}\)`, 2 * pow(10, -v.k), 's', 0.01]] }; });
  X(14, 'C', R`Compare Euler’s method with classical RK4 for integrating a trajectory: order of accuracy, cost per step, and when Euler is still acceptable.`,
    R`Euler has global error \(O(h)\) with one derivative evaluation per step; RK4 has \(O(h^{4})\) with four. For smooth problems RK4 reaches a given accuracy with far fewer total evaluations. Euler is acceptable for quick prototypes, very small steps, or when the model error dominates.`);
  X(14, 'C', R`What is catastrophic cancellation? Give an example expression and one way to avoid it.`,
    R`Subtracting two nearly equal floating-point numbers leaves few significant digits. Example: \(1-\cos x\) for small \(x\); rewrite as \(2\sin^{2}(x/2)\). Similarly \(\sqrt{x+1}-\sqrt{x}\) becomes \(1/(\sqrt{x+1}+\sqrt{x})\).`);
  X(14, 'I', R`You integrate \(\dot y = -1000y\) with explicit Euler and \(h\) = 0.01 s. Predict what the numerical solution does and why.`,
    R`\(h\lambda = -10\), so each step multiplies by \(1 + h\lambda = -9\): the solution oscillates in sign and grows ninefold per step, although the true solution decays. The step must satisfy \(h \le 2/1000\).`, [11]);
})(typeof window !== 'undefined' ? window : globalThis);
