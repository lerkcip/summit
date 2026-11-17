/* SUMMIT · Launch Window: timed, adaptive math drills. Every concept track is gated by a chapter and earns a rocketry capability badge. */
(function () {
  'use strict';
  var S = window.S, h = S.h, E = S.E, P = window.PHYS, R = String.raw, N = P.fmt;
  var sin = Math.sin, cos = Math.cos, sqrt = Math.sqrt, exp = Math.exp, ln = Math.log, PI = Math.PI, pow = Math.pow, rad = P.rad, deg = P.deg;
  function r1(x, d) { var k = Math.pow(10, d == null ? 1 : d); return Math.round(x * k) / k; }
  var AB = { abs: 0.011 };
  /* each generator: (rng) -> {q, f:[[label, value, unit, tol]], s: solution} */
  var G = {
    alg: [[
      function (g) { var a = g.int(2, 9), x = g.int(-6, 9), b = g.int(-12, 12); return { q: R`Solve \(${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${a * x + b}\).`, f: [['x', x, '', AB]], s: R`\(x = (${a * x + b} - (${b}))/${a} = ${x}\).` }; },
      function (g) { var c = g.pick([2.6, 2.9, 3.1, 3.4, 4.4]), mr = g.pick([2, 3, 4, 5, 8]); return { q: R`A stage has \(c\) = ${c} km/s and mass ratio \(m_0/m_f\) = ${mr}. Find \(\Delta v\).`, f: [[R`\(\Delta v\)`, c * ln(mr), 'km/s']], s: R`\(\Delta v = c\ln(m_0/m_f) = ${c}\ln ${mr} = ${r1(c * ln(mr), 2)}\) km/s.` }; },
      function (g) { var k = g.int(2, 6), b = g.pick([2, 10]); return { q: R`Evaluate \(\log_{${b}}(${pow(b, k)})\).`, f: [['Value', k, '', AB]], s: R`\(${b}^{${k}} = ${pow(b, k)}\), so the log is ${k}.` }; }
    ], [
      function (g) { var dv = r1(g.range(2, 9.5)), c = g.pick([2.9, 3.1, 3.4, 4.4]); return { q: R`A mission needs \(\Delta v\) = ${dv} km/s with \(c\) = ${c} km/s. Find the mass ratio \(m_0/m_f\).`, f: [[R`\(m_0/m_f\)`, exp(dv / c), '']], s: R`\(m_0/m_f = e^{\Delta v/c} = e^{${r1(dv / c, 3)}} = ${r1(exp(dv / c), 2)}\).` }; },
      function (g) { var b = g.pick([2, 3, 5]), n = g.pick([7, 20, 50, 200]); return { q: R`Solve \(${b}^{x} = ${n}\).`, f: [['x', ln(n) / ln(b), '', 0.01]], s: R`\(x = \ln ${n}/\ln ${b} = ${r1(ln(n) / ln(b), 3)}\).` }; },
      function (g) { var v0 = g.int(3, 12) * 5; return { q: R`A ball follows \(h(t) = ${v0}t - 4.9t^{2}\) (SI). When does it land, and how high does it go?`, f: [['Landing time', v0 / 4.9, 's'], ['Maximum height', v0 * v0 / 19.6, 'm']], s: R`Landing: \(t = ${v0}/4.9\). Peak at half that time: \(h = v_0^{2}/19.6\).` }; }
    ], [
      function (g) { var H = g.pick([7.2, 8, 8.5]), f = g.pick([0.5, 0.1, 0.01, 0.25]); return { q: R`In an isothermal atmosphere with scale height ${H} km, at what altitude has density fallen to ${f * 100}% of its surface value?`, f: [['Altitude', -H * ln(f), 'km']], s: R`\(\rho/\rho_0 = e^{-h/H}\), so \(h = -H\ln(${f}) = ${r1(-H * ln(f), 2)}\) km.` }; },
      function (g) { var dv = r1(g.range(8.8, 9.6)), c = g.pick([3.1, 3.4, 3.6]), mr = exp(dv / (2 * c)); return { q: R`A two-stage rocket splits \(\Delta v\) = ${dv} km/s equally between stages with \(c\) = ${c} km/s each. Find each stage’s mass ratio and the propellant fraction of one stage.`, f: [['Stage mass ratio', mr, ''], ['Propellant fraction', 1 - 1 / mr, '', 0.01]], s: R`Each stage delivers ${r1(dv / 2, 2)} km/s: \(e^{${r1(dv / 2, 2)}/${c}} = ${r1(mr, 3)}\); fraction \(1 - 1/${r1(mr, 3)}\).` }; },
      function (g) { var t = g.pick([5, 10, 12, 30]), f = g.pick([0.5, 0.25, 0.1]); return { q: R`A tank pressure decays as \(p = p_0e^{-kt}\) and falls to ${f * 100}% of \(p_0\) in ${t} min. Find \(k\).`, f: [['k', -ln(f) / t, '1/min']], s: R`\(k = -\ln(${f})/${t} = ${r1(-ln(f) / t, 4)}\) per minute.` }; }
    ]],
    trig: [[
      function (g) { var a = g.pick([15, 30, 45, 60, 75, 120, 135, 150, 210, 270]); return { q: R`Convert ${a}° to radians.`, f: [['Angle', rad(a), 'rad', 0.005]], s: R`\(${a}\times\pi/180 = ${r1(rad(a), 4)}\) rad.` }; },
      function (g) { var F = g.int(2, 40) * 50, d = g.int(2, 16) / 2; return { q: R`An engine’s ${N(F)} kN thrust is gimballed ${d}°. Find the axial and lateral components.`, f: [['Axial', F * cos(rad(d)), 'kN', 0.005], ['Lateral', F * sin(rad(d)), 'kN']], s: R`Axial \(F\cos\delta\), lateral \(F\sin\delta\).` }; },
      function (g) { var a = g.int(3, 12), b = g.int(3, 12); return { q: R`A right triangle has legs ${a} and ${b}. Find the hypotenuse and the angle opposite the side of length ${a}.`, f: [['Hypotenuse', sqrt(a * a + b * b), ''], ['Angle', deg(Math.atan2(a, b)), '°']], s: R`\(\sqrt{${a}^2 + ${b}^2}\) and \(\arctan(${a}/${b})\).` }; }
    ], [
      function (g) { var a = [g.int(-4, 5), g.int(-4, 5), g.int(0, 4)], b = [g.int(-4, 5), g.int(1, 5), g.int(-3, 4)], d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2], ma = sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) || 1, mb = sqrt(b[0] * b[0] + b[1] * b[1] + b[2] * b[2]); if (ma === 1 && !a[0] && !a[1] && !a[2]) { a = [1, 2, 2]; d = b[0] + 2 * b[1] + 2 * b[2]; ma = 3; } return { q: R`For \(\mathbf a = (${a.join(',')})\) and \(\mathbf b = (${b.join(',')})\), find \(\mathbf a\cdot\mathbf b\) and the angle between them.`, f: [[R`\(\mathbf a\cdot\mathbf b\)`, d, '', AB], ['Angle', deg(Math.acos(Math.max(-1, Math.min(1, d / (ma * mb))))), '°', { abs: 0.6 }]], s: R`\(\cos\theta = \mathbf a\cdot\mathbf b/(|\mathbf a||\mathbf b|) = ${d}/(${r1(ma, 3)}\times${r1(mb, 3)})\).` }; },
      function (g) { var vx = g.int(2, 20) * 100, vz = g.int(1, 15) * 100; return { q: R`A rocket has horizontal speed ${vx} m/s and vertical speed ${vz} m/s. Find its speed and flight-path angle above horizontal.`, f: [['Speed', sqrt(vx * vx + vz * vz), 'm/s'], ['Flight-path angle', deg(Math.atan2(vz, vx)), '°', { abs: 0.5 }]], s: R`\(V = \sqrt{v_x^2 + v_z^2}\), \(\gamma = \operatorname{atan2}(v_z, v_x)\).` }; },
      function (g) { var s1 = g.int(2, 9) * 100, s2 = g.int(2, 9) * 100, A = g.int(2, 15) * 10; return { q: R`Two tracking stations are ${s1} km and ${s2} km from a site, ${A}° apart as seen from it. How far apart are they?`, f: [['Separation', sqrt(s1 * s1 + s2 * s2 - 2 * s1 * s2 * cos(rad(A))), 'km']], s: R`Law of cosines: \(c^2 = a^2 + b^2 - 2ab\cos C\).` }; }
    ], [
      function (g) { var r = [g.int(1, 6), g.int(-3, 3), 0], F = [g.int(-5, 5), g.int(2, 9), 0], z = r[0] * F[1] - r[1] * F[0]; return { q: R`A force \(\mathbf F = (${F[0]},${F[1]},0)\) kN acts at \(\mathbf r = (${r[0]},${r[1]},0)\) m from the CG. Find the \(z\)-component of the torque \(\mathbf r\times\mathbf F\).`, f: [['Torque z', z, 'kN·m', AB]], s: R`\(\tau_z = r_xF_y - r_yF_x = ${z}\) kN·m.` }; },
      function (g) { var t = g.pick([5, 10, 15, 20, 25]), x = rad(t); return { q: R`Find the relative error of the small-angle approximation \(\sin\theta\approx\theta\) at ${t}°.`, f: [['Relative error', (x - sin(x)) / sin(x) * 100, '%', 0.05]], s: R`\((\theta - \sin\theta)/\sin\theta\) with \(\theta\) = ${r1(x, 5)} rad.` }; },
      function (g) { var la = g.pick([5.2, 28.5, 34.7, 45.9]), V = 465.1 * cos(rad(la)); return { q: R`Earth’s equatorial surface speed is 465.1 m/s. What eastward speed does a pad at latitude ${la}° get from rotation?`, f: [['Speed', V, 'm/s', 0.005]], s: R`\(465.1\cos(${la}°) = ${r1(V)}\) m/s.` }; }
    ]],
    conic: [[
      function (g) { var a = g.int(67, 420) * 100, e = g.int(1, 60) / 100; return { q: R`An orbit has \(a\) = ${N(a)} km and \(e\) = ${e}. Find the periapsis and apoapsis radii.`, f: [[R`\(r_p\)`, a * (1 - e), 'km', 0.005], [R`\(r_a\)`, a * (1 + e), 'km', 0.005]], s: R`\(r_p = a(1-e)\), \(r_a = a(1+e)\).` }; },
      function (g) { var rp = g.int(66, 80) * 100, ra = rp + g.int(1, 300) * 100; return { q: R`An orbit has \(r_p\) = ${N(rp)} km and \(r_a\) = ${N(ra)} km. Find \(a\) and \(e\).`, f: [['a', (rp + ra) / 2, 'km', 0.005], ['e', (ra - rp) / (ra + rp), '', 0.01]], s: R`\(a = (r_p + r_a)/2\), \(e = (r_a - r_p)/(r_a + r_p)\).` }; }
    ], [
      function (g) { var a = g.int(70, 300) * 100, e = g.int(5, 60) / 100, t = g.pick([30, 60, 90, 120, 150]); return { q: R`For \(a\) = ${N(a)} km and \(e\) = ${e}, find \(r\) at true anomaly ${t}°.`, f: [['r', a * (1 - e * e) / (1 + e * cos(rad(t))), 'km', 0.005]], s: R`\(r = a(1-e^2)/(1+e\cos\theta)\).` }; },
      function (g) { var a = g.int(1, 6), b = g.int(1, 6); return { q: R`For \(z = ${a} + ${b}i\), find \(|z|\) and its argument in degrees.`, f: [[R`\(|z|\)`, sqrt(a * a + b * b), '', 0.005], ['Argument', deg(Math.atan2(b, a)), '°', { abs: 0.5 }]], s: R`\(|z| = \sqrt{${a}^2+${b}^2}\), \(\arg z = \arctan(${b}/${a})\).` }; },
      function (g) { var r = g.pick([0.5, 0.8, 0.9, 0.25]), n = g.pick([5, 8, 10, 12]); return { q: R`Sum the geometric series \(\sum_{k=0}^{${n - 1}} ${r}^{k}\).`, f: [['Sum', (1 - pow(r, n)) / (1 - r), '', 0.005]], s: R`\((1-r^{n})/(1-r)\) with \(r\) = ${r}, \(n\) = ${n}.` }; }
    ], [
      function (g) { var e = g.int(11, 30) / 10; return { q: R`A hyperbolic flyby has \(e\) = ${e}. Find the turn angle \(\delta = 2\arcsin(1/e)\).`, f: [['Turn angle', 2 * deg(Math.asin(1 / e)), '°', 0.005]], s: R`\(2\arcsin(1/${e})\).` }; },
      function (g) { var x = g.pick([0.01, 0.02, 0.03, 0.05]), n = g.pick([5, 8, 10, 15]), ap = 1 + n * x, ex = pow(1 + x, n); return { q: R`Approximate \((1 + ${x})^{${n}}\) to first order and give the percentage error of the approximation.`, f: [['Approximation', ap, '', 0.002], ['Error', (ex - ap) / ex * 100, '%', 0.08]], s: R`\(1 + nx = ${ap}\); exact ${r1(ex, 5)}.` }; },
      function (g) { var a = g.int(70, 420) * 100, e = g.int(5, 70) / 100; return { q: R`For \(a\) = ${N(a)} km and \(e\) = ${e}, find the semi-latus rectum \(p\) and semi-minor axis \(b\).`, f: [['p', a * (1 - e * e), 'km', 0.005], ['b', a * sqrt(1 - e * e), 'km', 0.005]], s: R`\(p = a(1-e^2)\), \(b = a\sqrt{1-e^2}\).` }; }
    ]],
    deriv: [[
      function (g) { var a = g.int(1, 5), b = g.int(-6, 6), c = g.int(-5, 5), x = g.int(-3, 4); return { q: R`For \(f(x) = ${a}x^{3} ${b < 0 ? '-' : '+'} ${Math.abs(b)}x^{2} ${c < 0 ? '-' : '+'} ${Math.abs(c)}x\), find \(f'(${x})\).`, f: [[R`\(f'(${x})\)`, 3 * a * x * x + 2 * b * x + c, '', AB]], s: R`\(f' = ${3 * a}x^2 ${2 * b < 0 ? '-' : '+'} ${Math.abs(2 * b)}x ${c < 0 ? '-' : '+'} ${Math.abs(c)}\).` }; },
      function (g) { var h1 = g.int(10, 60) * 10, dv = g.int(8, 40), dt = g.pick([0.1, 0.2, 0.5]), h0 = h1 - dv * dt * 0.95, h2 = h1 + dv * dt * 1.05; h0 = r1(h0, 2); h2 = r1(h2, 2); return { q: R`An altimeter logs ${h0} m, ${h1} m and ${h2} m at samples ${dt} s apart. Estimate the velocity at the middle sample by central difference.`, f: [['Velocity', (h2 - h0) / (2 * dt), 'm/s']], s: R`\(v \approx (h_{i+1} - h_{i-1})/(2\Delta t) = (${h2} - ${h0})/${2 * dt}\).` }; }
    ], [
      function (g) { var a0 = g.int(15, 60), v0 = g.int(5, 40), dt = g.pick([0.5, 1]), hs = [0, 1, 2, 3, 4].map(function (i) { var t = i * dt; return r1(100 + v0 * t + 0.5 * a0 * t * t, 1); }); return { q: R`Flight-computer altitudes at ${dt} s intervals are ${hs.join(', ')} m. Estimate the velocity and the acceleration at the third sample.`, f: [['Velocity', (hs[3] - hs[1]) / (2 * dt), 'm/s'], ['Acceleration', (hs[3] - 2 * hs[2] + hs[1]) / (dt * dt), 'm/s²', 0.04]], s: R`Central difference for \(v\); second difference \((h_{i+1} - 2h_i + h_{i-1})/\Delta t^2\) for \(a\).` }; },
      function (g) { var n = g.pick([2, 3]), a = g.pick([0.5, 1, 1.5, 2]); return { q: R`Differentiate \(x^{${n}}\cos x\) and evaluate at \(x\) = ${a} rad.`, f: [[R`\(f'(${a})\)`, n * pow(a, n - 1) * cos(a) - pow(a, n) * sin(a), '', 0.01]], s: R`Product rule: \(${n}x^{${n - 1}}\cos x - x^{${n}}\sin x\).` }; },
      function (g) { var k = g.pick([0.5, 2, 3]), x = g.pick([0.5, 1, 2]); return { q: R`Differentiate \(e^{-${k}x^{2}}\) and evaluate at \(x\) = ${x}.`, f: [[R`\(f'(${x})\)`, -2 * k * x * exp(-k * x * x), '', 0.01]], s: R`Chain rule: \(-${2 * k}x\,e^{-${k}x^2}\).` }; }
    ], [
      function (g) { var V = g.int(2, 30) * 2; var r = Math.cbrt(V / (2 * PI)); return { q: R`A closed cylindrical tank must hold ${V} m³. Find the radius that minimizes its surface area.`, f: [['Radius', r, 'm', 0.01]], s: R`Minimize \(2\pi r^2 + 2V/r\): \(r = (V/2\pi)^{1/3}\), and \(h = 2r\).` }; },
      function (g) { var c = g.pick([2900, 3100, 3400]), m0 = g.int(3, 20) * 10, md = g.int(1, 6) * 100, t = g.int(2, 8) * 10; if (md * t / (m0 * 1000) > 0.7) t = 20; var m = m0 * 1000 - md * t; return { q: R`A rocket of initial mass ${m0} t burns ${md} kg/s with \(c\) = ${N(c)} m/s in free space. Find its acceleration \(dv/dt = c\,\dot m/m\) at \(t\) = ${t} s.`, f: [['Acceleration', c * md / m, 'm/s²']], s: R`\(m(${t}) = ${N(m)}\) kg, so \(a = ${c}\times${md}/${m}\).` }; },
      function (g) { var x = g.pick([0.1, 0.2, 0.3]), ap = 1 + x + x * x / 2; return { q: R`Estimate \(e^{${x}}\) with the Taylor series through the \(x^{2}\) term, and give the size of the first neglected term.`, f: [['Estimate', ap, '', 0.0005], ['Neglected term', pow(x, 3) / 6, '', 0.02]], s: R`\(1 + x + x^2/2\); next term \(x^3/6\).` }; }
    ]],
    integ: [[
      function (g) { var a = g.int(1, 6), b = g.int(1, 4), n = g.pick([1, 2, 3]); return { q: R`Evaluate \(\int_{0}^{${b}} ${a}x^{${n}}\,dx\).`, f: [['Value', a * pow(b, n + 1) / (n + 1), '', 0.005]], s: R`\(${a}x^{${n + 1}}/${n + 1}\) from 0 to ${b}.` }; },
      function (g) { var F = g.int(2, 40) * 5, t = r1(g.range(0.8, 4), 1); return { q: R`A motor gives a constant ${F} N for ${t} s. Find its total impulse.`, f: [['Total impulse', F * t, 'N·s']], s: R`\(I_t = \int F\,dt = F\,t_b\).` }; },
      function (g) { var F = g.int(4, 30) * 10, t = r1(g.range(1, 5), 1); return { q: R`A thrust curve rises linearly from 0 to ${F} N and back to 0 over ${t} s (a triangle). Find the total impulse.`, f: [['Total impulse', 0.5 * F * t, 'N·s']], s: R`Area of the triangle: \(\tfrac12 F_{\max}t\).` }; }
    ], [
      function (g) { var dt = g.pick([0.1, 0.2, 0.25]), pk = g.int(6, 30) * 10, shape = [0, 0.6, 1, 0.85, 0.7, 0.55, 0.3, 0], Fs = shape.map(function (s) { return Math.round(pk * s); }), I = 0; for (var i = 0; i < Fs.length - 1; i++) I += 0.5 * (Fs[i] + Fs[i + 1]) * dt; return { q: R`A static test logs thrust every ${dt} s: ${Fs.join(', ')} N. Use the trapezoid rule to find the total impulse and the average thrust over the burn.`, f: [['Total impulse', I, 'N·s'], ['Average thrust', I / (dt * (Fs.length - 1)), 'N']], s: R`Sum \(\tfrac12(F_i + F_{i+1})\Delta t\) over the ${Fs.length - 1} intervals; divide by the ${r1(dt * (Fs.length - 1), 2)} s burn for the average.` }; },
      function (g) { var a = g.pick([1, 2, 3]), b = g.pick([1, 2]); return { q: R`Evaluate \(\int_{0}^{${b}} e^{-${a}t}\,dt\).`, f: [['Value', (1 - exp(-a * b)) / a, '', 0.005]], s: R`\((1 - e^{-${a * b}})/${a}\).` }; },
      function (g) { var k = g.pick([1, 2, 3]); return { q: R`Evaluate \(\int_{0}^{\pi/${k}}\sin(${k}x)\,dx\).`, f: [['Value', 2 / k, '', 0.005]], s: R`\([-\cos(${k}x)/${k}]\) from 0 to \(\pi/${k}\) = \(2/${k}\).` }; }
    ], [
      function (g) { var I = g.int(20, 120) * 10, mp = g.int(10, 60) * 10; return { q: R`A motor delivers ${I} N·s of total impulse from ${mp} g of propellant. Find its delivered specific impulse.`, f: [[R`\(I_{sp}\)`, I / (mp / 1000 * 9.80665), 's']], s: R`\(I_{sp} = I_t/(m_pg_0)\).` }; },
      function (g) { var dt = g.pick([0.5, 1]), as = [g.int(15, 30), g.int(18, 34), g.int(22, 40), g.int(26, 48), g.int(30, 56)], dv = 0; for (var i = 0; i < 4; i++) dv += 0.5 * (as[i] + as[i + 1]) * dt; return { q: R`An accelerometer reads ${as.join(', ')} m/s² at ${dt} s intervals. Integrate with the trapezoid rule to find the velocity gained.`, f: [['Velocity gained', dv, 'm/s']], s: R`\(\Delta v = \int a\,dt \approx \sum\tfrac12(a_i + a_{i+1})\Delta t\).` }; },
      function (g) { var m0 = g.int(2, 10) * 10, k = g.pick([0.004, 0.005, 0.008]), t = g.pick([40, 60, 80, 100]), c = g.pick([2900, 3100]); return { q: R`With \(m(t) = m_0(1 - ${k}t)\) and \(c\) = ${c} m/s in free space, find \(\Delta v = \int_0^{${t}} c\,${k}/(1 - ${k}t)\,dt\).`, f: [[R`\(\Delta v\)`, -c * ln(1 - k * t), 'm/s']], s: R`\(-c\ln(1 - ${k}\times${t}) = ${r1(-c * ln(1 - k * t))}\) m/s (the rocket equation).` }; }
    ]],
    vcalc: [[
      function (g) { var a = g.int(1, 4), b = g.int(1, 4), x = g.int(1, 3), y = g.int(1, 3); return { q: R`For \(f = ${a}x^{2}y + ${b}y^{3}\), find \(\partial f/\partial x\) and \(\partial f/\partial y\) at \((${x},${y})\).`, f: [[R`\(\partial f/\partial x\)`, 2 * a * x * y, '', AB], [R`\(\partial f/\partial y\)`, a * x * x + 3 * b * y * y, '', AB]], s: R`\(f_x = ${2 * a}xy\), \(f_y = ${a}x^2 + ${3 * b}y^2\).` }; },
      function (g) { var a = g.int(1, 5), b = g.int(1, 5), c = g.int(1, 5); return { q: R`Find \(|\nabla f|\) for \(f = ${a}x + ${b}y + ${c}z\).`, f: [[R`\(|\nabla f|\)`, sqrt(a * a + b * b + c * c), '', 0.005]], s: R`\(\nabla f = (${a},${b},${c})\).` }; }
    ], [
      function (g) { var a = g.int(1, 4), b = g.int(-3, 4), c = g.int(1, 4), k = g.int(1, 5); return { q: R`Find \(\nabla\cdot\mathbf v\) for \(\mathbf v = (${a}x, ${b}y, ${c}z)\) and \((\nabla\times\mathbf w)_z\) for \(\mathbf w = (-${k}y, ${k}x, 0)\).`, f: [[R`\(\nabla\cdot\mathbf v\)`, a + b + c, '', AB], [R`\((\nabla\times\mathbf w)_z\)`, 2 * k, '', AB]], s: R`Divergence ${a} + (${b}) + ${c}; curl \(z\) = \(\partial w_y/\partial x - \partial w_x/\partial y = ${2 * k}\).` }; },
      function (g) { var x = g.int(1, 3), y = g.int(1, 3); var gx = 2 * x * y, gy = x * x; return { q: R`For \(f = x^{2}y\), find the directional derivative at \((${x},${y})\) along the unit vector \((0.6, 0.8)\).`, f: [['Directional derivative', 0.6 * gx + 0.8 * gy, '', 0.01]], s: R`\(\nabla f = (${gx}, ${gy})\); dot with (0.6, 0.8).` }; }
    ], [
      function (g) { var r = g.pick([1, 2, 3, 0.5]), k = g.int(1, 4); return { q: R`Use the divergence theorem to find the flux of \(\mathbf F = ${k}(x,y,z)\) out of a sphere of radius ${r}.`, f: [['Flux', 3 * k * 4 / 3 * PI * pow(r, 3), '']], s: R`\(\nabla\cdot\mathbf F = ${3 * k}\); times the volume \(\tfrac43\pi r^3\).` }; },
      function (g) { var ur = g.pick([1, 2, 3]), uv = g.pick([0.5, 1, 1.5, 2]); return { q: R`\(q = \tfrac12\rho V^{2}\) with independent uncertainties of ${ur}% in \(\rho\) and ${uv}% in \(V\). Find the relative uncertainty in \(q\).`, f: [['Uncertainty in q', sqrt(ur * ur + 4 * uv * uv), '%']], s: R`\(\sqrt{u_\rho^2 + (2u_V)^2}\): the exponent 2 doubles the velocity term.` }; },
      function (g) { var s = g.int(2, 20) * 2; return { q: R`Maximize \(xy\) subject to \(x + y = ${s}\).`, f: [['Maximum', s * s / 4, '']], s: R`Lagrange: \(y = \lambda = x\), so \(x = y = ${s / 2}\).` }; }
    ]],
    linalg: [[
      function (g) { var a = g.int(-4, 6), b = g.int(-4, 6), c = g.int(-4, 6), d = g.int(-4, 6); return { q: R`Find \(\det\begin{bmatrix} ${a} & ${b} \\ ${c} & ${d} \end{bmatrix}\).`, f: [['Determinant', a * d - b * c, '', AB]], s: R`\(ad - bc = ${a * d - b * c}\).` }; },
      function (g) { var a = g.int(1, 5), b = g.int(-3, 4), c = g.int(-3, 4), d = g.int(1, 5), x = g.int(-3, 4), y = g.int(-3, 4); return { q: R`Compute \(\begin{bmatrix} ${a} & ${b} \\ ${c} & ${d} \end{bmatrix}\begin{bmatrix} ${x} \\ ${y} \end{bmatrix}\).`, f: [['First component', a * x + b * y, '', AB], ['Second component', c * x + d * y, '', AB]], s: R`Row times column.` }; }
    ], [
      function (g) { var x = g.int(-4, 5), y = g.int(-4, 5), a = g.int(2, 5), b = g.int(1, 4), c = g.int(1, 3), d = g.int(-4, -1); return { q: R`Solve \(${a}x + ${b}y = ${a * x + b * y}\), \(${c}x - ${-d}y = ${c * x + d * y}\).`, f: [['x', x, '', AB], ['y', y, '', AB]], s: R`Eliminate or use Cramer’s rule: \(x = ${x}\), \(y = ${y}\).` }; },
      function (g) { var t = g.pick([30, 45, 60, 90, 120]), x = g.int(1, 4), y = g.int(0, 3); return { q: R`Rotate \((${x},${y})\) counterclockwise by ${t}°.`, f: [["x′", x * cos(rad(t)) - y * sin(rad(t)), '', AB], ["y′", x * sin(rad(t)) + y * cos(rad(t)), '', AB]], s: R`\(\begin{bmatrix}\cos\theta & -\sin\theta\\ \sin\theta & \cos\theta\end{bmatrix}\) times the vector.` }; },
      function (g) { var a = g.int(2, 6), b = g.int(1, 3), d = g.int(2, 6), e = P.eig2(a, b, d); return { q: R`Find the eigenvalues of \(\begin{bmatrix} ${a} & ${b} \\ ${b} & ${d} \end{bmatrix}\).`, f: [['Smaller eigenvalue', e[0], '', 0.01], ['Larger eigenvalue', e[1], '', 0.01]], s: R`\(\lambda^2 - ${a + d}\lambda + ${a * d - b * b} = 0\).` }; }
    ], [
      function (g) { var m = [g.int(1, 4), g.int(0, 3), g.int(-2, 2), g.int(-2, 3), g.int(1, 4), g.int(0, 3), g.int(0, 2), g.int(-2, 2), g.int(1, 4)], det = m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]); return { q: R`Find \(\det\begin{bmatrix} ${m[0]} & ${m[1]} & ${m[2]} \\ ${m[3]} & ${m[4]} & ${m[5]} \\ ${m[6]} & ${m[7]} & ${m[8]} \end{bmatrix}\).`, f: [['Determinant', det, '', AB]], s: R`Expand along the first row: ${det}.` }; },
      function (g) { var ys = [g.int(0, 3), g.int(2, 5), g.int(4, 8), g.int(6, 11)], sx = 6, sy = ys[0] + ys[1] + ys[2] + ys[3], sxy = ys[1] + 2 * ys[2] + 3 * ys[3], b = (4 * sxy - sx * sy) / (4 * 14 - 36), a = (sy - b * sx) / 4; return { q: R`Fit \(y = a + bx\) by least squares to \((0,${ys[0]})\), \((1,${ys[1]})\), \((2,${ys[2]})\), \((3,${ys[3]})\).`, f: [['a', a, '', { abs: 0.02 }], ['b', b, '', { abs: 0.02 }]], s: R`\(b = (n\sum xy - \sum x\sum y)/(n\sum x^2 - (\sum x)^2)\), \(a = \bar y - b\bar x\).` }; }
    ]],
    ode: [[
      function (g) { var y0 = g.pick([5, 10, 20, 100]), tau = g.pick([0.5, 2, 4, 5]), t = g.pick([1, 2, 5]); return { q: R`\(\dot y = -y/${tau}\) with \(y(0) = ${y0}\). Find \(y(${t})\).`, f: [[R`\(y(${t})\)`, y0 * exp(-t / tau), '']], s: R`\(y = y_0e^{-t/\tau}\).` }; },
      function (g) { var p = g.pick([63.2, 90, 95, 99]); return { q: R`How many time constants does a first-order system need to reach ${p}% of a step?`, f: [[R`\(t/\tau\)`, -ln(1 - p / 100), '']], s: R`\(1 - e^{-t/\tau} = ${p / 100}\).` }; }
    ], [
      function (g) { var b = g.pick([2, 4, 6]), c = g.pick([13, 20, 25, 40, 100]); return { q: R`For \(\ddot x + ${b}\dot x + ${c}x = 0\), find \(\omega_n\) and \(\zeta\).`, f: [[R`\(\omega_n\)`, sqrt(c), 'rad/s', 0.01], [R`\(\zeta\)`, b / (2 * sqrt(c)), '', 0.01]], s: R`\(\omega_n = \sqrt{${c}}\), \(\zeta = ${b}/(2\omega_n)\).` }; },
      function (g) { var m = g.int(5, 60) / 10, cd = g.pick([0.5, 0.75, 1.2, 1.5]), d = g.pick([0.3, 0.45, 0.6, 0.9]), A = PI * d * d / 4; return { q: R`A ${m} kg rocket descends under a ${d} m parachute with \(C_D\) = ${cd} (\(\rho\) = 1.225 kg/m³). Find its terminal velocity.`, f: [['Terminal velocity', sqrt(2 * m * 9.807 / (1.225 * cd * A)), 'm/s']], s: R`\(V_t = \sqrt{2mg/(\rho C_DA)}\) with \(A = \pi d^2/4\).` }; }
    ], [
      function (g) { var m = g.int(8, 40) / 10, T = g.int(4, 20) * 10, v = g.int(10, 80), hh = g.int(5, 60) * 10, k = g.pick([0.002, 0.004, 0.006]), dt = g.pick([0.05, 0.1]), a = T / m - 9.81 - k * v * v / m; return { q: R`Your trajectory code is at \(h\) = ${hh} m, \(v\) = ${v} m/s. Thrust is ${T} N, mass ${m} kg, drag \(D = ${k}v^{2}\) N, \(g\) = 9.81 m/s². Take one explicit Euler step of ${dt} s.`, f: [['Acceleration', a, 'm/s²'], ['New velocity', v + a * dt, 'm/s', 0.005], ['New altitude', hh + v * dt, 'm', 0.005]], s: R`\(a = T/m - g - D/m\); \(v \leftarrow v + a\,\Delta t\); \(h \leftarrow h + v\,\Delta t\) using the old \(v\).` }; },
      function (g) { var a = g.pick([1, 2, 4]), t = g.pick([0.5, 1, 2]); return { q: R`Solve \(\dot y + ${a}y = ${a}\) with \(y(0) = 0\) and find \(y(${t})\).`, f: [[R`\(y(${t})\)`, 1 - exp(-a * t), '']], s: R`\(y = 1 - e^{-${a}t}\).` }; },
      function (g) { var z = g.pick([0.2, 0.3, 0.5, 0.7]), wn = g.pick([2, 4, 5, 10]); return { q: R`A second-order system has \(\zeta\) = ${z} and \(\omega_n\) = ${wn} rad/s. Find the damped frequency and percent overshoot.`, f: [[R`\(\omega_d\)`, wn * sqrt(1 - z * z), 'rad/s', 0.01], ['Overshoot', exp(-PI * z / sqrt(1 - z * z)) * 100, '%', 0.03]], s: R`\(\omega_d = \omega_n\sqrt{1-\zeta^2}\); \(M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}}\).` }; }
    ]],
    pde: [[
      function (g) { var a = g.pick([340, 1000, 1200, 1500]), L = g.pick([0.3, 0.5, 1, 2]); return { q: R`Find the first longitudinal acoustic frequency of a ${L} m closed chamber with sound speed ${a} m/s.`, f: [['Frequency', a / (2 * L), 'Hz']], s: R`\(f = a/(2L)\).` }; },
      function (g) { var al = g.pick([1e-5, 5e-6, 1e-6]), t = g.pick([10, 60, 100, 600]); return { q: R`Estimate how deep heat penetrates in ${t} s into a solid with \(\alpha\) = ${N(al)} m²/s, using \(\delta\approx\sqrt{\alpha t}\).`, f: [['Depth', sqrt(al * t) * 1000, 'mm']], s: R`\(\sqrt{\alpha t}\).` }; }
    ], [
      function (g) { var n = g.pick([1, 3, 5, 7]), A = g.pick([1, 2, 5]); return { q: R`A square wave of amplitude ${A} has series \(\frac{4A}{\pi}\sum_{n\ \text{odd}}\frac{\sin nx}{n}\). Find the amplitude of harmonic ${n}.`, f: [['Amplitude', 4 * A / (n * PI), '', 0.01]], s: R`\(4A/(n\pi)\).` }; },
      function (g) { var L = g.pick([0.01, 0.02, 0.05]), al = g.pick([1e-5, 5e-6]), n = g.pick([1, 2, 3]); return { q: R`A slab ${L * 1000} mm thick with both faces held at fixed temperature has \(\alpha\) = ${N(al)} m²/s. Find the decay time constant of mode \(n\) = ${n}.`, f: [['Time constant', L * L / (al * n * n * PI * PI), 's']], s: R`\(\tau_n = L^2/(\alpha n^2\pi^2)\).` }; }
    ], [
      function (g) { var Ts = g.pick([800, 1000, 1200]), x = g.pick([5, 10, 20]), t = g.pick([50, 100, 200]), eta = x / 1000 / (2 * sqrt(1e-5 * t)), er = P.erf(eta); return { q: R`A thick wall at 300 K (\(\alpha\) = 10⁻⁵ m²/s) has its surface raised to ${Ts} K. Find \(\eta = x/(2\sqrt{\alpha t})\) at ${x} mm depth after ${t} s, then the temperature there given \(\operatorname{erf}(\eta)\) = ${r1(er, 4)}.`, f: [[R`\(\eta\)`, eta, '', 0.01], ['Temperature', Ts + (300 - Ts) * er, 'K', 0.01]], s: R`\(T = T_s + (T_i - T_s)\operatorname{erf}(\eta)\).` }; },
      function (g) { var f = g.pick([300, 450, 700, 900]), fs = g.pick([400, 500, 1000]); if (Math.abs(f - Math.round(f / fs) * fs) < 1) f += 50; return { q: R`A ${f} Hz vibration is sampled at ${fs} Hz with no anti-alias filter. At what frequency does it appear?`, f: [['Apparent frequency', Math.abs(f - Math.round(f / fs) * fs), 'Hz', { abs: 1 }]], s: R`It folds to \(|f - nf_s|\) for the nearest multiple of \(f_s\).` }; }
    ]],
    stats: [[
      function (g) { var xs = [0, 1, 2, 3, 4].map(function () { return g.int(95, 110); }); var m = xs.reduce(function (a, b) { return a + b; }, 0) / 5; return { q: R`Five thrust readings are ${xs.join(', ')} N. Find the mean.`, f: [['Mean', m, 'N', 0.003]], s: R`Sum / 5 = ${m}.` }; },
      function (g) { var s = g.pick([1, 2, 3, 5]), n = g.pick([4, 9, 16, 25]); return { q: R`${n} measurements have a sample standard deviation of ${s} N. Find the standard error of the mean.`, f: [['Standard error', s / sqrt(n), 'N']], s: R`\(s/\sqrt{n}\).` }; }
    ], [
      function (g) { var xs = [0, 1, 2, 3].map(function () { return g.int(40, 60); }); var m = (xs[0] + xs[1] + xs[2] + xs[3]) / 4, v = xs.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / 3; if (v === 0) { xs[0] += 4; m = (xs[0] + xs[1] + xs[2] + xs[3]) / 4; v = xs.reduce(function (a, x) { return a + (x - m) * (x - m); }, 0) / 3; } return { q: R`Four apogee readings are ${xs.join(', ')} m. Find the sample standard deviation (divide by \(n - 1\)).`, f: [['Sample standard deviation', sqrt(v), 'm', 0.02]], s: R`Mean ${m}; \(s = \sqrt{\sum(x - \bar x)^2/3}\).` }; },
      function (g) { var a = g.pick([0.5, 1, 1.5, 2]), b = g.pick([0.5, 1, 2, 3]); return { q: R`\(I_{sp} = F/(\dot mg_0)\) with independent 1σ uncertainties of ${a}% in \(F\) and ${b}% in \(\dot m\). Find the uncertainty in \(I_{sp}\).`, f: [['Uncertainty', sqrt(a * a + b * b), '%']], s: R`Relative uncertainties of a quotient add in quadrature.` }; },
      function (g) { var r = g.pick([0.9, 0.95, 0.98, 0.99]), n = g.pick([2, 3, 4, 5]); return { q: R`${n} components in series each have reliability ${r}. Find the system reliability.`, f: [['Reliability', pow(r, n), '', 0.002]], s: R`\(${r}^{${n}}\).` }; }
    ], [
      function (g) { var s = g.pick([0.9, 0.95, 0.99]), fp = g.pick([0.01, 0.02, 0.05]), pr = g.pick([0.01, 0.02, 0.05]); return { q: R`A sensor fault detector catches ${s * 100}% of real faults and false-alarms on ${fp * 100}% of healthy units; ${pr * 100}% of units are faulty. Given an alarm, find the probability of a real fault.`, f: [['P(fault | alarm)', s * pr / (s * pr + fp * (1 - pr)), '', 0.01]], s: R`Bayes: \(\frac{${s}\times${pr}}{${s}\times${pr} + ${fp}\times${r1(1 - pr, 2)}}\).` }; },
      function (g) { var tv = { 5: 2.776, 10: 2.262, 16: 2.131 }, n = g.pick([5, 10, 16]), s = g.pick([1, 2, 4]); return { q: R`${n} burn-time measurements have \(s\) = ${s} ms. Find the 95% confidence half-width of the mean (\(t\) = ${tv[n]}).`, f: [['Half-width', tv[n] * s / sqrt(n), 'ms']], s: R`\(t\,s/\sqrt{n}\).` }; },
      function (g) { var r = g.pick([0.9, 0.95, 0.99]); return { q: R`Three flight computers each have reliability ${r}; the vehicle needs any two. Find the system reliability.`, f: [['Reliability', pow(r, 3) + 3 * r * r * (1 - r), '', 0.001]], s: R`\(R^3 + 3R^2(1-R)\).` }; }
    ]],
    num: [[
      function (g) { var n = g.pick([2, 3, 5, 7, 10]), x0 = g.pick([1, 2, 3]); return { q: R`Take one Newton step for \(x^{2} - ${n} = 0\) from \(x_0\) = ${x0}.`, f: [[R`\(x_1\)`, x0 - (x0 * x0 - n) / (2 * x0), '', 0.002]], s: R`\(x_1 = x_0 - f/f' = ${x0} - (${x0 * x0 - n})/${2 * x0}\).` }; },
      function (g) { var ys = [g.int(0, 4), g.int(2, 8), g.int(4, 12)], hh = g.pick([0.5, 1, 2]); return { q: R`Samples \(f\) = ${ys.join(', ')} are spaced ${hh} apart. Integrate with the trapezoid rule.`, f: [['Integral', hh * (ys[0] / 2 + ys[1] + ys[2] / 2), '']], s: R`\(h(f_0/2 + f_1 + f_2/2)\).` }; }
    ], [
      function (g) { var ys = [g.int(0, 4), g.int(2, 8), g.int(4, 12)], hh = g.pick([0.5, 1, 2]); return { q: R`Samples \(f\) = ${ys.join(', ')} are spaced ${hh} apart. Integrate with Simpson’s rule.`, f: [['Integral', hh / 3 * (ys[0] + 4 * ys[1] + ys[2]), '', 0.005]], s: R`\(\tfrac h3(f_0 + 4f_1 + f_2)\).` }; },
      function (g) { var L = g.pick([50, 200, 1000, 5000]); return { q: R`What is the largest stable explicit Euler step for \(\dot y = -${L}y\)?`, f: [[R`\(h_{\max}\)`, 2 / L, 's', 0.01]], s: R`\(|1 + h\lambda| \le 1\) gives \(h \le 2/${L}\).` }; },
      function (g) { var r = g.pick([2, 4, 8, 16]); return { q: R`Halving the step cuts a method’s error by a factor of ${r}. What is its observed order?`, f: [['Order', Math.log2(r), '', { abs: 0.03 }]], s: R`\(p = \log_2 ${r}\).` }; }
    ], [
      function (g) { var k = g.pick([1, 2, 4]), hh = g.pick([0.1, 0.2, 0.25]), y0 = g.pick([1, 2, 10]), ym = y0 + 0.5 * hh * (-k * y0), y1 = y0 + hh * (-k * ym); return { q: R`Take one midpoint (RK2) step of size ${hh} for \(\dot y = -${k}y\) from \(y_0\) = ${y0}. Compare with the exact value.`, f: [['RK2 value', y1, '', 0.002], ['Exact value', y0 * exp(-k * hh), '', 0.002]], s: R`Half-step slope: \(y_{1/2} = y_0 + \tfrac h2f(y_0)\); then \(y_1 = y_0 + hf(y_{1/2})\).` }; },
      function (g) { var M = g.pick([0.5, 1, 1.5, 2]), e = g.pick([0.1, 0.2, 0.3, 0.5]); return { q: R`Solve Kepler’s equation \(M = E - e\sin E\) for \(M\) = ${M} rad, \(e\) = ${e}, to three decimals.`, f: [['E', P.kepler(M, e), 'rad', { abs: 0.002 }]], s: R`Newton: \(E \leftarrow E - (E - e\sin E - M)/(1 - e\cos E)\), starting from \(E = M\).` }; },
      function (g) { var k = g.pick([3, 4, 5, 6]); return { q: R`A system has eigenvalues \(-1\) and \(-10^{${k}}\). Find the largest stable explicit Euler step, and how many such steps cover a 10 s simulation.`, f: [[R`\(h_{\max}\)`, 2 * pow(10, -k), 's', 0.01], ['Steps', 10 / (2 * pow(10, -k)), '', 0.02]], s: R`\(h \le 2/10^{${k}}\); the stiff mode sets the step though it decays almost at once.` }; }
    ]]
  };
  var TRACKS = [
    { id: 'alg', name: 'Algebra, exponentials & logs', req: [2], badge: 'Mass-ratio math', cap: 'Turn a Δv budget into a propellant load' },
    { id: 'trig', name: 'Trig & vectors', req: [3], badge: 'Thrust vectoring', cap: 'Resolve a gimballed thrust and a flight-path angle' },
    { id: 'conic', name: 'Polar, conics & series', req: [4], badge: 'Orbit shapes', cap: 'Read an orbit from a and e' },
    { id: 'deriv', name: 'Derivatives', req: [8], badge: 'Velocity from altitude data', cap: 'Differentiate flight-computer logs' },
    { id: 'integ', name: 'Integrals', req: [8], badge: 'Total impulse from a thrust curve', cap: 'Integrate a static-test trace' },
    { id: 'vcalc', name: 'Vector calculus', req: [9], badge: 'Fields and fluxes', cap: 'Gradients, divergence and error propagation' },
    { id: 'linalg', name: 'Linear algebra', req: [10], badge: 'Rotations and fits', cap: 'Rotate frames and fit data' },
    { id: 'ode', name: 'ODEs', req: [11], badge: 'My own trajectory', cap: 'Step a powered ascent by hand' },
    { id: 'pde', name: 'PDEs & Fourier', req: [12], badge: 'Heat soak and spectra', cap: 'Diffusion depths, modes and aliasing' },
    { id: 'stats', name: 'Statistics & uncertainty', req: [13], badge: 'Error bars on flight data', cap: 'Uncertainty, Bayes and reliability' },
    { id: 'num', name: 'Numerical methods', req: [14], badge: 'Solver toolkit', cap: 'Newton, quadrature and stable steps' }
  ];
  TRACKS.forEach(function (t) { S.MODREQ.push({ id: 'lw_' + t.id, name: 'Launch Window: ' + t.name, req: { ch: t.req }, go: 'launch' }); });
  function st() { return S.state.lw; }
  function tr(id) { var s = st().tr; return s[id] || (s[id] = { r: 1, n: 0, ok: 0, h: [] }); }
  function open() { return TRACKS.filter(function (t) { return E.reqMet({ ch: t.req }); }); }
  function hasBadge(id) { return !!st().badges[id]; }
  function checkBadge(t) {
    var x = tr(t.id), last = x.h.slice(-10);
    if (hasBadge(t.id) || last.length < 10) return false;
    var ok = last.filter(function (e) { return e[1]; }).length, hard = last.filter(function (e) { return e[1] && e[0] >= 2; }).length;
    if (ok >= 8 && hard >= 3) { st().badges[t.id] = Date.now(); S.addXP(150, 'Capability: ' + t.badge); return true; }
    return false;
  }
  function draw(ses) {
    var ts = open(); if (ses.focus) ts = ts.filter(function (t) { return t.id === ses.focus; });
    var w = ts.map(function (t) { var x = tr(t.id); return (hasBadge(t.id) ? 1 : 2.2) + (4 - x.r) * 0.6 + (ses.lastT === t.id ? -0.8 : 0); }), tot = w.reduce(function (a, b) { return a + b; }, 0), u = ses.rng() * tot, k = 0;
    while (k < ts.length - 1 && u > w[k]) { u -= w[k]; k++; }
    var t = ts[k], x = tr(t.id), base = Math.min(3, Math.max(1, Math.floor(x.r))), roll = ses.rng(), lvl = roll < 0.18 && base > 1 ? base - 1 : roll > 0.88 && base < 3 ? base + 1 : base;
    var gens = G[t.id][lvl - 1], gi = Math.floor(ses.rng() * gens.length); if (ses.lastG === t.id + lvl + gi && gens.length > 1) gi = (gi + 1) % gens.length;
    ses.lastT = t.id; ses.lastG = t.id + lvl + gi;
    var o = gens[gi](ses.rng), f = o.f.map(function (z) { return { l: z[0], v: z[1], u: z[2] || '', tol: z[3] == null ? 0.02 : z[3] }; });
    return { t: t, lvl: lvl, q: S.tex(o.q), sol: S.tex(o.s), f: f, ans: { f: f.map(function () { return ''; }) }, t0: Date.now() };
  }
  var ses = null, tick = null;
  function endSession(why) {
    if (!ses) return; clearInterval(tick); tick = null;
    var s = ses; s.ended = why || 'time'; s.t1 = Date.now();
    var full = s.n >= 5 || (s.t1 - s.t0) > s.len * 0.6 * 60000;
    if (full) { S.doneToday('launch'); st().ses.push({ t: s.t0, len: s.len, n: s.n, ok: s.ok }); if (st().ses.length > 60) st().ses.shift(); var bonus = s.len >= 30 ? 60 : s.len >= 15 ? 30 : 15; S.addXP(bonus, 'Launch window closed out'); }
    S.dirty('mods', 'log'); S.render();
  }
  function startSession(len, focus) {
    ses = { len: len, t0: Date.now(), end: Date.now() + len * 60000, n: 0, ok: 0, xp: 0, rng: P.rng('lw' + Date.now()), focus: focus || null, log: [], gained: [] };
    ses.cur = draw(ses); S.markActive(); S.dirty('main');
    clearInterval(tick); tick = setInterval(function () { if (!ses || ses.ended) { clearInterval(tick); return; } var el = document.getElementById('lwclock'); if (el) el.textContent = clock(); if (Date.now() >= ses.end && ses.cur && ses.cur.done) endSession('time'); }, 1000);
    S.render();
  }
  function clock() { var s = Math.max(0, Math.round((ses.end - Date.now()) / 1000)); return 'T−' + Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
  function sessionView() {
    var c = ses.cur, out = [];
    out.push(h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, ses.len + '-minute window' + (ses.focus ? ' · ' + c.t.name : '')), h('div', { class: 'big', id: 'lwclock', style: 'font-size:34px' }, clock())), h('div', { class: 'stat3', style: 'grid-template-columns:repeat(2,minmax(0,1fr));min-width:150px' }, h('div', null, h('b', null, ses.ok + '/' + ses.n), h('span', null, 'correct')), h('div', null, h('b', null, '+' + ses.xp), h('span', null, 'XP')))));
    var body = h('div', { class: 'qcard' }, h('div', { class: 'row' }, h('span', { class: 'eyebrow grow' }, c.t.name), h('span', { class: 'pill ' + (c.lvl === 3 ? 'glow' : c.lvl === 2 ? 'ice' : '') }, 'Level ' + c.lvl)), S.rich('div', 'qtext', c.q));
    if (!c.done) {
      c.f.forEach(function (f, i) { body.append(S.numField(c, i, 'lw' + ses.n)); });
      body.append(h('div', { class: 'grid2' }, h('button', { class: 'btn', onclick: function () { answer(true); } }, 'Skip'), h('button', { class: 'btn go', onclick: function () { answer(false); } }, 'Check')));
    } else {
      c.f.forEach(function (f, i) { var ok = c.okv[i]; body.append(S.rich('div', 'fb ' + (ok ? 'ok' : 'bad'), '<span class="num">' + S.tex(f.l) + ': <strong>' + S.esc(String(c.ans.f[i]).trim() || '—') + '</strong> ' + S.esc(f.u) + (ok ? ' ✓' : ' ✗ &nbsp;correct: <strong>' + E.showNum(f.v) + '</strong> ' + S.esc(f.u)) + '</span>')); });
      body.append(S.rich('div', 'keyans small', '<span class="eyebrow">Method</span>' + c.sol));
      body.append(h('button', { class: 'btn go block', id: 'lwnext', onclick: function () { if (Date.now() >= ses.end) endSession('time'); else { ses.cur = draw(ses); S.render(); } } }, Date.now() >= ses.end ? 'Window closed: see the debrief' : 'Next'));
    }
    out.push(body);
    out.push(h('button', { class: 'btn ghost sm', onclick: function () { S.ask('Close this window early?', ses.n >= 5 ? 'It still counts: you have answered ' + ses.n + ' questions.' : 'A window counts for today after 5 questions or 60% of its time.', [{ label: 'Keep drilling', cls: 'go' }, { label: 'Close the window', fn: function () { endSession('early'); } }]); } }, 'Close the window early'));
    return h('div', { class: 'col gap14' }, out);
  }
  function answer(skip) {
    var c = ses.cur, x = tr(c.t.id);
    c.okv = c.f.map(function (f, i) { return !skip && E.fieldOK(f, c.ans.f[i]); });
    var ok = c.okv.every(Boolean), secs = (Date.now() - c.t0) / 1000, fast = secs < 45 + 30 * c.lvl;
    c.done = true; c.ok = ok; ses.n++; x.n++;
    if (ok) { ses.ok++; x.ok++; x.r = Math.min(3.99, x.r + (fast ? 0.34 : 0.22)); var xp = 4 + 4 * c.lvl; ses.xp += xp; S.state.xp += xp; S.today().xp += xp; S.renderTop(); }
    else x.r = Math.max(1, x.r - 0.3);
    x.h.push([c.lvl, ok ? 1 : 0]); if (x.h.length > 14) x.h.shift();
    ses.log.push({ t: c.t.id, l: c.lvl, ok: ok });
    if (checkBadge(c.t)) ses.gained.push(c.t.badge);
    S.dirty('mods', 'main', 'log'); S.render();
    S.afterRender = null; var nb = document.getElementById('lwnext'); if (nb && nb.scrollIntoView) nb.scrollIntoView({ block: 'nearest' });
  }
  function debrief() {
    var s = ses, by = {}; s.log.forEach(function (e) { var b = by[e.t] || (by[e.t] = { n: 0, ok: 0 }); b.n++; b.ok += e.ok ? 1 : 0; });
    return h('div', { class: 'col gap14' }, h('div', { class: 'card hero' }, h('div', { class: 'eyebrow' }, 'Window closed'), h('h2', null, 'Debrief'),
      h('div', { class: 'stat3' }, h('div', null, h('b', null, String(s.n)), h('span', null, 'answered')), h('div', null, h('b', null, s.n ? S.pct(s.ok / s.n) : '–'), h('span', null, 'accuracy')), h('div', null, h('b', null, '+' + s.xp), h('span', null, 'XP from answers'))),
      s.gained.length ? h('p', null, 'Capability earned: ' + s.gained.join(', ') + '.') : null),
      h('div', { class: 'card' }, h('h3', null, 'By track'), Object.keys(by).length ? h('div', { class: 'col gap4' }, Object.keys(by).map(function (id) { var t = TRACKS.filter(function (x) { return x.id === id; })[0]; return h('div', { class: 'hbar', style: 'grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) 46px' }, h('span', { class: 'tiny' }, t.name), h('div', { class: 'bar ice' }, h('i', { style: 'width:' + Math.round(by[id].ok / by[id].n * 100) + '%' })), h('span', { class: 'v tiny' }, by[id].ok + '/' + by[id].n)); })) : h('p', { class: 'small muted' }, 'No questions answered.')),
      h('div', { class: 'grid2' }, h('button', { class: 'btn', onclick: function () { ses = null; S.render(); } }, 'Back to tracks'), h('button', { class: 'btn go', onclick: function () { var l = s.len, f = s.focus; ses = null; startSession(l, f); } }, 'Another window')));
  }
  S.view('launch', function () {
    if (ses && !ses.ended) return sessionView();
    if (ses && ses.ended) return debrief();
    var op = open(), out = [], fuel = S.state.streak.fuel;
    out.push(h('div', { class: 'row' }, S.backBtn('Train', 'train')));
    out.push(h('div', null, h('div', { class: 'eyebrow' }, 'Math drills'), h('h2', null, 'Launch Window'), h('p', { class: 'small muted', style: 'margin-top:4px' }, 'Timed drills that adapt to you: get one right and the next is harder. Every day is a launch window; miss one and a fuel cell burns to protect your streak (' + fuel + ' of 3 left).')));
    if (!op.length) out.push(h('div', { class: 'card lock' }, S.lockBox(E.reqText({ ch: [2] })), h('p', { class: 'small muted' }, 'The first track, algebra with exponentials and logs, opens with Chapter 2. Each later track opens with its own chapter.'), h('button', { class: 'btn', onclick: function () { S.go('ch-2'); } }, 'Go to Chapter 2')));
    else out.push(h('div', { class: 'card hero' }, h('h3', null, 'Open a window'), h('p', { class: 'small' }, S.plural(op.length, 'track') + ' in the mix, weighted toward your weakest and the badges you have not earned.'),
      h('button', { class: 'btn go', onclick: function () { startSession(30); } }, '30-minute launch window'), h('div', { class: 'grid2' }, h('button', { class: 'btn', onclick: function () { startSession(15); } }, '15-minute window'), h('button', { class: 'btn', onclick: function () { startSession(10); } }, '10-minute sprint'))));
    out.push(h('h3', null, 'Tracks and capabilities'));
    TRACKS.forEach(function (t) {
      var met = E.reqMet({ ch: t.req }), x = S.state.lw.tr[t.id] || { r: 1, n: 0, ok: 0, h: [] }, got = hasBadge(t.id), last = x.h.slice(-10), okc = last.filter(function (e) { return e[1]; }).length;
      out.push(h('div', { class: 'badge ' + (got ? 'on' : met ? '' : 'off') }, h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { style: 'font-weight:600' }, t.name), h('div', { class: 'tiny muted' }, 'Ch ' + t.req.join(', ') + ' · capability: ' + t.badge)), got ? h('span', { class: 'pill ok' }, 'Earned') : met ? h('span', { class: 'pill ice' }, 'Level ' + Math.floor(x.r)) : h('span', { class: 'pill' }, 'Locked')),
        met ? h('div', { class: 'row' }, h('div', { class: 'bar grow ' + (got ? 'moss' : '') }, h('i', { style: 'width:' + Math.round((x.r - 1) / 3 * 100) + '%' })), h('span', { class: 'tiny muted num' }, x.n ? x.ok + '/' + x.n + ' right' : 'not started')) : S.lockBox(E.reqText({ ch: t.req })),
        met && !got ? h('p', { class: 'tiny muted' }, t.cap + '. Badge: 8 of your last 10 right, 3 of them at level 2 or 3' + (last.length ? ' (now ' + okc + ' of ' + last.length + ').' : '.')) : null,
        met ? h('button', { class: 'btn sm ghost', onclick: function () { startSession(10, t.id); } }, '10-minute sprint on this track') : null));
    });
    return h('div', { class: 'col gap14' }, out);
  }, { tab: 'train', track: 'launch' });
  S.MODS.launch = { name: 'Launch Window', tag: 'Math drills', go: 'launch',
    summary: function () { var op = open(), nb = Object.keys(st().badges).length; return op.length ? { open: true, pill: nb + '/11 capabilities', pillCls: nb ? 'ok' : '', line: 'Timed 30-minute windows of adaptive drills across ' + S.plural(op.length, 'open track') + '. Miss a day and a fuel cell burns.' } : { open: false, pill: 'Locked', line: 'Timed, adaptive math drills. Each concept earns a rocketry capability badge.', lock: E.reqText({ ch: [2] }) }; },
    plan: function (mins) { if (!open().length) return null; var len = mins <= 30 ? 10 : mins <= 60 ? 15 : 30; return { id: 'launch', ic: '∑', t: 'Launch Window · ' + len + ' min', s: 'Adaptive drills on ' + S.plural(open().length, 'open track'), m: len, go: 'launch' }; } };
  S.LW = { G: G, TRACKS: TRACKS, ses: function () { return ses; } };
})();
