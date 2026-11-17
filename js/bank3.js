/* SUMMIT · question bank, Parts V–VI (Ch 36–54). See bank1.js for the format. */
(function (G) {
  'use strict';
  var P = G.PHYS, R = String.raw, N = P.fmt, T = G.BANK_T, S = G.BANK_S, X = G.BANK_X;
  var g0 = P.g0, sin = Math.sin, cos = Math.cos, tan = Math.tan, sqrt = Math.sqrt, exp = Math.exp, ln = Math.log, PI = Math.PI, pow = Math.pow, rad = P.rad, deg = P.deg;

  /* ───────── Ch 36 · Advanced gas dynamics ───────── */
  T(36, 1, { a: [340, [300, 340, 400]], u: [100, [50, 200, 300]] }, function (v) {
    return { q: R`Gas at rest has \(a\) = ${v.a} m/s (\(\gamma\) = 1.4). A piston withdraws at ${v.u} m/s. Find the sound speed in the expanded gas next to the piston, and the maximum possible escape speed.`, f: [['Sound speed at piston', v.a - 0.2 * v.u, 'm/s', 0.01], ['Maximum escape speed', 5 * v.a, 'm/s', 0.01]] }; });
  T(36, 2, { M: [2, [1.5, 2.5, 3, 4]] }, function (v) {
    var s = P.ns(v.M), a1 = sqrt(1.4 * 287.05 * 300);
    return { q: R`A shock with \(M_s\) = ${v.M} moves into air at 300 K. Find \(p_2/p_1\), \(T_2/T_1\) and the gas velocity behind it.`, f: [[R`\(p_2/p_1\)`, s.p, '', 0.01], [R`\(T_2/T_1\)`, s.T, '', 0.01], ['Gas velocity', 2 * a1 / 2.4 * (v.M - 1 / v.M), 'm/s', 0.015]] }; });
  S(36, 3, [[R`\(p_4/p_1\), helium driver`, 9.7, '', 0.04], [R`\(p_4/p_1\), air driver`, 33.7, '', 0.04]]);
  S(36, 4, [[R`\(p_2/p_1\) at \(M\) = 10`, 3.47, '', 0.02], [R`\(p_2/p_1\) at \(M\) = 20`, 3.47, '', 0.02]]);
  S(36, 7, [[R`\(M_s\)`, 2, '', 0.02]]);
  X(36, 'C', R`What is a characteristic in unsteady one-dimensional gas dynamics, and what is carried along it?`,
    R`A path in the \(x\)–\(t\) plane with slope \(u \pm a\) along which information travels. In homentropic flow the Riemann invariants \(J_\pm = u \pm 2a/(\gamma-1)\) are constant along them, which turns the PDEs into algebra.`);
  X(36, 'C', R`State the hypersonic similarity parameter and what it allows a designer to do.`,
    R`\(K = M_\infty\tau\) (Mach number times slenderness or flow-deflection angle). Slender bodies with the same \(K\) and \(\gamma\) have the same pressure distribution in similarity form, so one test or computation maps to a family of Mach-number/thickness combinations.`);

  /* ───────── Ch 37 · Viscous flow ───────── */
  T(37, 1, { M: [6, [4, 5, 8, 10]], T: [220, [220, 250]] }, function (v) {
    var r = pow(0.71, 1 / 3);
    return { q: R`A turbulent boundary layer has \(M_e\) = ${v.M}, \(T_e\) = ${v.T} K and \(\Pr\) = 0.71. Find \(T_{aw}\) and \(T_0\).`, f: [[R`\(T_{aw}\)`, v.T * (1 + r * 0.2 * v.M * v.M), 'K', 0.01], [R`\(T_0\)`, v.T * (1 + 0.2 * v.M * v.M), 'K', 0.01]] }; });
  T(37, 2, { u: [1000, [800, 1500, 2000]], d: [5, [2, 3, 10]] }, function (v) {
    return { q: R`Estimate the second-mode frequency for \(u_e\) = ${N(v.u)} m/s and \(\delta\) = ${v.d} mm.`, f: [['Frequency', v.u / (2 * v.d / 1000) / 1000, 'kHz', 0.02]] }; });
  T(37, 3, { M: [10, [6, 8, 12]], Re: [1e6, [4e6, 1e7]] }, function (v) {
    var chi = pow(v.M, 3) / sqrt(v.Re);
    return { q: R`Find \(\bar\chi\) and the weak-interaction \(p/p_\infty \approx 1 + 0.31\bar\chi + 0.05\bar\chi^{2}\) for \(M_\infty\) = ${v.M}, \(Re_x\) = ${N(v.Re)} and \(C\) = 1.`, f: [[R`\(\bar\chi\)`, chi, '', 0.02], [R`\(p/p_\infty\)`, 1 + 0.31 * chi + 0.05 * chi * chi, '', 0.015]] }; });
  T(37, 4, { y: [100, [30, 50, 300, 1000]] }, function (v) {
    return { q: R`Find \(u^{+}\) at \(y^{+}\) = ${N(v.y)} (log law, \(\kappa\) = 0.41, \(B\) = 5.0).`, f: [[R`\(u^{+}\)`, ln(v.y) / 0.41 + 5.0, '', 0.01]] }; });
  T(37, 5, { Re: [1e7, [1e6, 5e6, 5e7]] }, function (v) {
    var cf = 0.0592 * pow(v.Re, -0.2);
    return { q: R`For a flat plate at \(Re_x\) = ${N(v.Re)} (\(x\) = 1 m), estimate the first-cell height giving \(y^{+}\) = 1, using \(c_f = 0.0592Re_x^{-0.2}\).`, f: [['First-cell height', 1 / (v.Re * sqrt(cf / 2)) * 1e6, 'μm', 0.04]] }; });
  X(37, 'C', R`What is the recovery factor, and why is the adiabatic-wall temperature below the stagnation temperature for air?`,
    R`\(r = (T_{aw} - T_e)/(T_0 - T_e)\), about \(\Pr^{1/2}\) laminar and \(\Pr^{1/3}\) turbulent. For \(\Pr < 1\) heat conducts away from the wall region faster than viscous work is deposited there, so the wall recovers only part of the kinetic energy.`);

  /* ───────── Ch 38 · Hypersonic aerodynamics ───────── */
  T(38, 1, { M: [10, [5, 8, 15, 20]] }, function (v) {
    return { q: R`Find \(C_{p,\max}\) at \(M_\infty\) = ${v.M} (γ = 1.4).`, f: [[R`\(C_{p,\max}\)`, (P.pitot(v.M) - 1) / (0.7 * v.M * v.M), '', 0.01]] }; });
  T(38, 2, { a: [10, [5, 15, 20, 30]] }, function (v) {
    var al = rad(v.a);
    return { q: R`Find Newtonian \(C_L\), \(C_D\) and \(L/D\) for a flat plate at \(\alpha\) = ${v.a}°.`, f: [[R`\(C_L\)`, 2 * sin(al) * sin(al) * cos(al), '', 0.015], [R`\(C_D\)`, 2 * pow(sin(al), 3), '', 0.02], ['L/D', 1 / tan(al), '', 0.01]] }; });
  T(38, 3, { M: [6, [5, 8, 10, 15, 20]] }, function (v) {
    return { q: R`Find Küchemann’s \(L/D\) barrier at \(M_\infty\) = ${v.M}.`, f: [[R`\((L/D)_{\max}\)`, 4 * (v.M + 3) / v.M, '', 0.01]] }; });
  T(38, 4, { M: [6, [4, 8, 10, 20]], Rr: [0.5, [0.25, 1, 2]] }, function (v) {
    return { q: R`Estimate the shock standoff of a sphere of radius ${v.Rr} m at \(M_\infty\) = ${v.M} using \(\Delta/R = 0.143\,e^{3.24/M^{2}}\).`, f: [['Standoff distance', 0.143 * exp(3.24 / (v.M * v.M)) * v.Rr * 100, 'cm', 0.02]] }; });
  S(38, 5, [['β in the hypersonic limit', 12, '°', 0.02], ['Exact β at M = 20', 12.7, '°', 0.02]]);
  S(38, 7, [[R`Exact \(C_p\)`, 0.093, '', 0.04], [R`Newtonian \(C_p\)`, 0.0603, '', 0.03], [R`Modified Newtonian \(C_p\)`, 0.055, '', 0.04]]);
  T(38, 8, { M: [20, [10, 15, 25]], x: [5, [2, 10, 20]] }, function (v) {
    return { q: R`Find the blast-wave pressure ratio on a blunt cylinder at \(M_\infty\) = ${v.M}, \(C_D\) = 1, \(x/d\) = ${v.x}, using \(p/p_\infty = 0.067M_\infty^{2}\sqrt{C_D}/(x/d)\).`, f: [[R`\(p/p_\infty\)`, 0.067 * v.M * v.M / v.x, '', 0.02]] }; });
  X(38, 'C', R`State the Newtonian pressure law and the physical picture behind it. Why is it better for blunt bodies at very high Mach number?`,
    R`\(C_p = 2\sin^{2}\theta\): the stream is treated as particles that lose their normal momentum on striking the surface and then slide along it. At high Mach number the shock lies close to the body, so the thin shock layer behaves like that impact model; the modified form scales by the true stagnation \(C_{p,\max}\).`);

  /* ───────── Ch 39 · High-temperature gas dynamics ───────── */
  T(39, 1, { M: [25, [15, 20, 30]], T: [220, [220, 250]] }, function (v) {
    return { q: R`Compute the perfect-gas temperature behind a normal shock at \(M\) = ${v.M} with \(T_1\) = ${v.T} K (γ = 1.4).`, f: [[R`\(T_2/T_1\)`, P.ns(v.M).T, '', 0.01], [R`\(T_2\)`, P.ns(v.M).T * v.T, 'K', 0.015]] }; });
  T(39, 2, { T: [3000, [1000, 2000, 4000, 6000]] }, function (v) {
    var x = 3390 / v.T, e = 1 / (exp(x) - 1);
    return { q: R`For N₂ at ${N(v.T)} K (\(\theta_v\) = 3390 K), compute \(e_{vib}/(R\theta_v)\), \(e_{vib}\) in kJ/kg (\(R\) = 296.8 J/(kg·K)) and \(c_{v,vib}/R\).`, f: [[R`\(e_{vib}/(R\theta_v)\)`, e, '', 0.02], [R`\(e_{vib}\)`, e * 296.8 * 3390 / 1000, 'kJ/kg', 0.02], [R`\(c_{v,vib}/R\)`, x * x * exp(x) / pow(exp(x) - 1, 2), '', 0.02]] }; });
  T(39, 3, { T: [3000, [1000, 2000, 5000, 8000]] }, function (v) {
    return { q: R`What fraction of N₂ molecules occupy \(v = 1\) relative to \(v = 0\) at ${N(v.T)} K (\(\theta_v\) = 3390 K)?`, f: [[R`\(N_1/N_0\)`, exp(-3390 / v.T), '', 0.03]] }; });
  T(39, 4, { p: [0.01, [0.001, 0.1]] }, function (v) {
    var f = function (p) { return sqrt(0.013 / (4 * p + 0.013)); };
    return { q: R`With \(K_p\) = 0.013 atm for O₂ ⇌ 2O at 3000 K, find the dissociated fraction \(\alpha\) at 1 atm and at ${v.p} atm, using \(K_p = 4\alpha^{2}p/(1-\alpha^{2})\).`, f: [['α at 1 atm', f(1), '', 0.03], [R`α at ${v.p} atm`, f(v.p), '', 0.03]] }; });
  T(39, 7, { e: [1.6, [1.5, 1.7, 1.8]] }, function (v) {
    return { q: R`Equilibrium air at some state has \(h\) = 2.0 × 10⁷ J/kg and \(e\) = ${v.e} × 10⁷ J/kg. Find \(\gamma_{eff}\).`, f: [[R`\(\gamma_{eff}\)`, 2.0 / v.e, '', 0.01]] }; });
  X(39, 'C', R`Why does the ratio of specific heats of air fall below 1.4 at high temperature, and what does a lower effective \(\gamma\) do to the density ratio across a strong shock?`,
    R`Vibration, dissociation and ionization absorb energy, raising the specific heats and bringing \(c_p/c_v\) toward 1. The strong-shock density ratio \((\gamma+1)/(\gamma-1)\) rises from 6 toward 10–20, thinning the shock layer.`);

  /* ───────── Ch 40 · Nonequilibrium and rarefied flow ───────── */
  T(40, 1, { L: [1, [0.5, 2, 4]] }, function (v) {
    var lam = P.KB * 195 / (Math.SQRT2 * PI * pow(3.7e-10, 2) * 0.032);
    return { q: R`Find the hard-sphere mean free path at 100 km (\(T\) = 195 K, \(p\) = 0.032 Pa, \(d\) = 3.7 × 10⁻¹⁰ m) and \(Kn\) for a ${v.L} m capsule.`, f: [['Mean free path', lam, 'm', 0.05], ['Kn', lam / v.L, '', 0.05]] }; });
  S(40, 2, [[R`Da for \(\tau_{chem}\) = 10⁻⁶ s`, 100, '', 0.02], [R`Da for \(\tau_{chem}\) = 10⁻² s`, 0.01, '', 0.02]]);
  T(40, 3, { s: [10, [5, 20, 50]] }, function (v) {
    return { q: R`A 1/${v.s}-scale model is tested at flight velocity. By what factor must the density exceed the flight density to preserve binary scaling?`, f: [['Density factor', v.s, '×', 0.02]] }; });
  (function () {
    var gs = [['N₂', 28.01], ['O₂', 32.00], ['He', 4.003], ['Ar', 39.95], ['H₂', 2.016]];
    T(40, 4, { k: [0, [1, 2, 3, 4]], T: [300, [200, 300, 1000]] }, function (v) {
      var g = gs[v.k];
      return { q: R`Find the mean molecular speed of ${g[0]} (${g[1]} u) at ${N(v.T)} K.`, f: [['Mean speed', sqrt(8 * P.KB * v.T / (PI * g[1] * P.AMU)), 'm/s', 0.01]] }; });
  })();
  T(40, 5, { V: [7.8, [7.5, 8, 11]] }, function (v) {
    return { q: R`Estimate the free-molecular heat flux at 150 km (\(\rho\) = 2.07 × 10⁻⁹ kg/m³) at ${v.V} km/s with \(\alpha\) = 1.`, f: [['Heat flux', 0.5 * 2.07e-9 * pow(v.V * 1000, 3), 'W/m²', 0.015]] }; });
  T(40, 7, { p: [95, [86.5, 90, 99]] }, function (v) {
    return { q: R`With Landau–Teller relaxation and constant \(\tau_v\) = 10⁻⁵ s, how long does \(e_v\) take to close ${v.p}% of the gap to equilibrium?`, f: [['Time', -ln(1 - v.p / 100) * 10, 'μs', 0.02]] }; });
  S(40, 8, [[R`\(p\tau\)`, 6.7, '×10⁻⁶ atm·s', 0.08]]);
  X(40, 'C', R`What does the Knudsen number measure, and what are the usual regime boundaries?`,
    R`\(Kn = \lambda/L\), mean free path over body scale. Below about 0.01 the gas is a continuum (Navier–Stokes); 0.01–0.1 slip flow; 0.1–10 transitional (DSMC); above 10 free-molecular.`);

  /* ───────── Ch 41 · Aerothermodynamics ───────── */
  function sg(V, rho, Rn) { return 1.7415e-4 * sqrt(rho / Rn) * pow(V, 3); }
  T(41, 1, { V: [7.5, [6, 7, 7.8, 11]], rho: [3, [1, 5, 10]], Rn: [1, [0.3, 0.5, 2]] }, function (v) {
    return { q: R`Use Sutton–Graves to find the stagnation heating for \(V\) = ${v.V} km/s, \(\rho_\infty\) = ${v.rho} × 10⁻⁴ kg/m³ and \(R_n\) = ${v.Rn} m.`, f: [['Stagnation heat flux', sg(v.V * 1000, v.rho * 1e-4, v.Rn) / 1e4, 'W/cm²', 0.015]] }; });
  T(41, 2, { Rn: [0.01, [0.04, 0.0625, 0.25]] }, function (v) {
    var f = sqrt(1 / v.Rn);
    return { q: R`A body with \(R_n\) = 1 m sees 1.27 MW/m² at the stagnation point. How does this change if \(R_n\) = ${v.Rn} m?`, f: [['Increase factor', f, '×', 0.02], ['New heat flux', 1.27 * f, 'MW/m²', 0.02]] }; });
  T(41, 3, { q: [1.27, [0.5, 1, 2, 5]], e: [0.85, [0.8, 0.9]] }, function (v) {
    return { q: R`Find the radiative-equilibrium wall temperature for a heat flux of ${v.q} MW/m² with \(\varepsilon\) = ${v.e}.`, f: [[R`\(T_w\)`, pow(v.q * 1e6 / (v.e * P.SIG), 0.25), 'K', 0.01]] }; });
  T(41, 4, { q: [1, [0.5, 2, 3]], t: [60, [30, 120, 200]] }, function (v) {
    return { q: R`A heating pulse is \(q(t) = q_{\max}e^{-(t-t_0)^{2}/\tau^{2}}\) with \(q_{\max}\) = ${v.q} MW/m² and \(\tau\) = ${v.t} s. Find the heat load.`, f: [['Heat load', v.q * sqrt(PI) * v.t, 'MJ/m²', 0.01]] }; });
  S(41, 8, [['Local heat flux', 12.7, 'MW/m²', 0.02]]);
  X(41, 'C', R`Stagnation-point convective heating scales roughly as \(\sqrt{\rho_\infty/R_n}\,V^{3}\). What two design choices does this suggest for an entry capsule?`,
    R`Use a blunt nose (large \(R_n\)) to lower the heating rate, and decelerate high in the atmosphere where \(\rho_\infty\) is small (a low ballistic coefficient or lifting entry), since the cubic dependence on speed makes heating at high velocity dominant.`);

  /* ───────── Ch 42 · Thermal protection ───────── */
  T(42, 1, { Q: [50, [20, 100, 200]], dT: [700, [500, 900]] }, function (v) {
    return { q: R`A copper heat-sink nose (\(c\) = 385 J/(kg·K)) must absorb ${v.Q} MJ/m² with a ${v.dT} K allowable temperature rise. Find its areal mass.`, f: [['Areal mass', v.Q * 1e6 / (385 * v.dT), 'kg/m²', 0.01]] }; });
  T(42, 2, { a: [1, [0.5, 2]], b: [3, [4, 5, 6]] }, function (v) {
    var f = function (B) { return ln(1 + B) / B; };
    return { q: R`Evaluate the laminar blowing correction \(\ln(1+B')/B'\) for \(B'\) = ${v.a} and \(B'\) = ${v.b}.`, f: [[R`At \(B'\) = ${v.a}`, f(v.a), '', 0.015], [R`At \(B'\) = ${v.b}`, f(v.b), '', 0.015]] }; });
  T(42, 3, { qs: [30, [20, 40, 50]], L: [300, [100, 600, 1000]] }, function (v) {
    return { q: R`An ablator has \(Q^{*}\) = ${v.qs} MJ/kg and must absorb a ${N(v.L)} MJ/m² heat load by ablation. Find the mass loss per unit area.`, f: [['Mass loss', v.L / v.qs, 'kg/m²', 0.01]] }; });
  T(42, 4, { q: [0.5, [0.2, 1, 1.5]] }, function (v) {
    return { q: R`Find the radiative-equilibrium temperature of C/C (\(\varepsilon\) = 0.85) under ${v.q} MW/m².`, f: [['Temperature', pow(v.q * 1e6 / (0.85 * P.SIG), 0.25), 'K', 0.01]] }; });
  T(42, 5, { t: [1500, [500, 1000, 2000, 3000]] }, function (v) {
    return { q: R`Estimate the thermal penetration depth into tile insulation (\(\alpha\) = 3.5 × 10⁻⁷ m²/s) during a ${N(v.t)} s entry.`, f: [['Penetration depth', sqrt(3.5e-7 * v.t) * 100, 'cm', 0.03]] }; });
  X(42, 'C', R`How does an ablative heat shield protect a vehicle? Name three mechanisms.`,
    R`The material absorbs heat by pyrolysis and phase change (endothermic decomposition), the released gases blow into the boundary layer and block convective heating, and the char layer re-radiates heat at high temperature while insulating the virgin material beneath.`);

  /* ───────── Ch 43 · Atmospheric entry ───────── */
  T(43, 1, { V: [7.5, [6, 7.8, 11]], g: [5, [2, 10, 20]] }, function (v) {
    return { q: R`A ballistic body enters at ${v.V} km/s and γ = −${v.g}°, with \(H\) = 7.2 km. Find \(a_{\max}\) (in g) and the velocity at which it occurs.`, f: [[R`\(a_{\max}\)`, pow(v.V * 1000, 2) * sin(rad(v.g)) / (2 * Math.E * 7200) / 9.807, 'g', 0.015], ['Velocity at peak', exp(-0.5) * v.V * 1000, 'm/s', 0.01]] }; });
  T(43, 2, { b: [300, [100, 500, 1000]], g: [5, [2, 10, 20]] }, function (v) {
    return { q: R`For \(\beta\) = ${N(v.b)} kg/m², \(\rho_0\) = 1.225 kg/m³, \(H\) = 7.2 km and γ = −${v.g}°, find the altitude of peak deceleration.`, f: [['Altitude', 7.2 * ln(1.225 * 7200 / (v.b * sin(rad(v.g)))), 'km', 0.015]] }; });
  T(43, 3, { V: [6, [4, 5, 7]], ld: [1, [0.5, 2, 3]] }, function (v) {
    return { q: R`In equilibrium glide at ${v.V} km/s with L/D = ${v.ld} (\(g\) = 9.5 m/s², \(r\) = 6471 km), find the deceleration.`, f: [['Deceleration', 9.5 * (1 - pow(v.V * 1000, 2) / (9.5 * 6.471e6)) / v.ld, 'm/s²', 0.015]] }; });
  T(43, 4, { V: [7.0, [5, 6, 7.5]], ld: [2, [1, 3]] }, function (v) {
    return { q: R`Find the equilibrium-glide range from ${v.V} km/s with L/D = ${v.ld} (\(g\) = 9.5 m/s², \(r\) = 6471 km).`, f: [['Range', 6471 / 2 * v.ld * ln(1 / (1 - pow(v.V * 1000, 2) / (9.5 * 6.471e6))), 'km', 0.015]] }; });
  T(43, 5, { V: [1800, [1500, 2100]], I: [1200, [1000, 1500]], ld: [4, [3, 5]], w: [1.5, [1.3, 2]] }, function (v) {
    return { q: R`Find the Breguet range for \(V\) = ${v.V} m/s, \(I_{sp}\) = ${v.I} s, L/D = ${v.ld} and \(W_i/W_f\) = ${v.w}.`, f: [['Range', v.V * v.I * v.ld * ln(v.w) / 1000, 'km', 0.01]] }; });
  T(43, 9, { V: [1800, [1500, 3000, 5000]], ld: [4, [2, 6]] }, function (v) {
    return { q: R`Estimate the phugoid period at \(V\) = ${v.V} m/s, and its damping ratio for \(L/D\) = ${v.ld}.`, f: [['Period', 2 * PI / (Math.SQRT2 * 9.807 / v.V), 's', 0.015], ['Damping ratio', 1 / (Math.SQRT2 * v.ld), '', 0.02]] }; });
  X(43, 'C', R`Compare ballistic and lifting entry for a crewed capsule: peak deceleration, heating and landing accuracy.`,
    R`A ballistic entry gives the highest peak deceleration (set by entry speed and angle) and a short, intense heat pulse. Modest lift (L/D ≈ 0.3) flattens the trajectory, cutting peak g to a few g and peak heat rate, lengthening the pulse, and lets bank-angle modulation steer to a landing site.`);

  /* ───────── Ch 44 · Air-breathing hypersonic propulsion ───────── */
  T(44, 1, { M: [3, [2, 2.5, 4, 5]] }, function (v) {
    return { q: R`Find the ideal-ramjet thermal efficiency at \(M_0\) = ${v.M}.`, f: [['Thermal efficiency', 1 - 1 / (1 + 0.2 * v.M * v.M), '', 0.01]] }; });
  T(44, 2, { M: [7, [5, 6, 8, 10]] }, function (v) {
    var Tt = 230 * (1 + 0.2 * v.M * v.M);
    return { q: R`At \(M_0\) = ${v.M} with \(T_0\) = 230 K, find \(T_t\), and the static temperature if the air is slowed only to \(M\) = 2.5.`, f: [[R`\(T_t\)`, Tt, 'K', 0.01], [R`Static \(T\) at \(M\) = 2.5`, Tt / 2.25, 'K', 0.01]] }; });
  T(44, 3, { M: [3, [2, 2.5, 3.5]], T4: [2200, [1800, 2000, 2400]] }, function (v) {
    var a0 = sqrt(1.4 * 287.05 * 220), Tt0 = 220 * (1 + 0.2 * v.M * v.M);
    return { q: R`Find the ideal-ramjet specific thrust at \(M_0\) = ${v.M}, \(T_0\) = 220 K and \(T_{t4}\) = ${v.T4} K.`, f: [['Specific thrust', a0 * v.M * (sqrt(v.T4 / Tt0) - 1), 'N·s/kg', 0.015]] }; });
  S(44, 4, [[R`\(T_t^{*}\)`, 3498, 'K', 0.01], ['Fuel–air ratio f', 0.0101, '', 0.03], ['Equivalence ratio φ', 0.35, '', 0.04]]);
  T(44, 5, { F: [10, [5, 20]], u: [2000, [1500, 2500]], mf: [0.5, [0.25, 1]] }, function (v) {
    return { q: R`An engine gives ${v.F} kN at \(u_0\) = ${v.u} m/s while burning ${v.mf} kg/s of hydrogen (\(h_{PR}\) = 120 MJ/kg). Find \(\eta_o\) and \(I_{sp}\).`, f: [[R`\(\eta_o\)`, v.F * 1000 * v.u / (v.mf * 1.2e8), '', 0.015], [R`\(I_{sp}\)`, v.F * 1000 / (v.mf * 9.807), 's', 0.01]] }; });
  T(44, 7, { M: [4, [2, 2.5, 3, 5]] }, function (v) {
    return { q: R`Find the Kantrowitz minimum throat-to-entrance area ratio for \(M_1\) = ${v.M} (γ = 1.4).`, f: [[R`\(A_t/A_1\)`, 1 / P.AAs(P.ns(v.M).M2), '', 0.015]] }; });
  X(44, 'C', R`Why does a ramjet give way to a scramjet above roughly Mach 5–6?`,
    R`Slowing the air to subsonic speed raises its static temperature and pressure enormously at high flight Mach number: shock losses, structural loads and dissociation absorb the energy that combustion should add. Keeping the flow supersonic through the combustor limits the static temperature rise.`);

  /* ───────── Ch 45 · CFD ───────── */
  T(45, 1, { dx: [1, [0.1, 0.5, 2]], s: [2000, [1000, 3000, 5000]], c: [0.8, [0.5, 0.9]] }, function (v) {
    return { q: R`Find the maximum explicit time step for \(\Delta x\) = ${v.dx} mm, \(|u| + a\) = ${N(v.s)} m/s and CFL = ${v.c}.`, f: [[R`\(\Delta t\)`, v.c * v.dx * 1e-3 / v.s * 1e6, 'μs', 0.01]] }; });
  (function () {
    var cs = [[1.010, 1.050], [1.005, 1.025], [1.008, 1.072], [1.020, 1.060], [1.004, 1.012]];
    T(45, 2, { k: [0, [1, 2, 3, 4]] }, function (v) {
      var f2 = cs[v.k][0], f3 = cs[v.k][1], p = ln((f3 - f2) / (f2 - 1)) / ln(2), d = (f2 - 1) / (pow(2, p) - 1);
      return { q: R`Three grids (\(r\) = 2) give \(f_1\) = 1.000 (finest), \(f_2\) = ${f2.toFixed(3)} and \(f_3\) = ${f3.toFixed(3)}. Find \(p\), the Richardson estimate and the fine-grid GCI (safety factor 1.25).`, f: [['Observed order p', p, '', { abs: 0.03 }], ['Richardson estimate', 1 - d, '', 0.0005], ['Fine-grid GCI', 1.25 * d * 100, '%', 0.03]] }; });
  })();
  T(45, 3, { a: [1, [2, 10]], dx: [0.01, [0.02, 0.05]], c: [0.5, [0.2, 0.8]] }, function (v) {
    return { q: R`Find the numerical viscosity of first-order upwinding for \(a\) = ${v.a}, \(\Delta x\) = ${v.dx} and CFL = ${v.c}.`, f: [[R`\(\nu_{num}\)`, v.a * v.dx * (1 - v.c) / 2, '', 0.01]] }; });
  T(45, 4, { rho: [0.01, [0.005, 0.02, 0.05]] }, function (v) {
    return { q: R`Find the wall spacing for \(Re_{cell}\) = 1 with \(\rho_w\) = ${v.rho} kg/m³, \(a_w\) = 300 m/s and \(\mu_w\) = 1.8 × 10⁻⁵ Pa·s.`, f: [['Wall spacing', 1.8e-5 / (v.rho * 300) * 1e6, 'μm', 0.01]] }; });
  X(45, 'C', R`What does the CFL condition say, physically, for an explicit scheme?`,
    R`In one time step information must not travel farther than the numerical stencil can see: \((|u|+a)\Delta t/\Delta x \le\) a scheme-dependent limit near 1. Otherwise the numerical domain of dependence no longer contains the physical one and the scheme is unstable.`);

  /* ───────── Ch 46 · Advanced GNC ───────── */
  T(46, 1, { Pm: [4, [1, 2, 9]], z: [12, [8, 11, 14]], Rm: [1, [0.5, 2, 4]] }, function (v) {
    var K = v.Pm / (v.Pm + v.Rm);
    return { q: R`A scalar filter has prior \(\hat x^{-}\) = 10, \(P^{-}\) = ${v.Pm} and measurement \(z\) = ${v.z} with \(R\) = ${v.Rm}. Find \(K\), \(\hat x\) and \(P\).`, f: [['K', K, '', 0.01], [R`\(\hat x\)`, 10 + K * (v.z - 10), '', 0.005], ['P', (1 - K) * v.Pm, '', 0.01]] }; });
  T(46, 2, { dt: [1, [0.5, 2, 3]] }, function (v) {
    return { q: R`With \(\mathbf F = \begin{bmatrix} 1 & ${v.dt} \\ 0 & 1 \end{bmatrix}\), \(\mathbf P = \mathbf I\) and \(\mathbf Q = 0\), find \(\mathbf P^{-} = \mathbf{FPF}^{T}\).`, f: [[R`\(P^{-}_{11}\)`, 1 + v.dt * v.dt, '', { abs: 0.01 }], [R`\(P^{-}_{12}\)`, v.dt, '', { abs: 0.01 }], [R`\(P^{-}_{22}\)`, 1, '', { abs: 0.01 }]] }; });
  T(46, 3, { a: [1, [0.5, 2, -1, 3]] }, function (v) {
    var s = sqrt(v.a * v.a + 1);
    return { q: R`Solve the scalar LQR problem for \(\dot x = ${v.a === 1 ? '' : v.a === -1 ? '-' : v.a}x + u\) with \(q = r = 1\): find \(P\), \(K\) and the closed-loop pole.`, f: [['P', v.a + s, '', 0.01], ['K', v.a + s, '', 0.01], ['Closed-loop pole', -s, '', 0.01]] }; });
  T(46, 4, { x: [1, [2, 4, 9, 16]] }, function (v) {
    return { q: R`A double integrator \(\ddot x = u\), \(|u| \le 1\), starts at \(x\) = ${v.x}, \(\dot x\) = 0. Find the switching point and the total time of the minimum-time control to the origin.`, f: [['Switch at x', v.x / 2, '', 0.01], ['Total time', 2 * sqrt(v.x), 's', 0.01]] }; });
  T(46, 8, { t: [10, [5, 20]], zm: [50, [20, 100]], zv: [-5, [-2, 0, 4]] }, function (v) {
    return { q: R`During a powered descent to the landing pad, with \(t_{go}\) = ${v.t} s, ZEM = ${v.zm} m and ZEV = ${N(v.zv)} m/s along one axis, find the ZEM/ZEV acceleration command.`, f: [['Acceleration command', 6 * v.zm / (v.t * v.t) - 2 * v.zv / v.t, 'm/s²', 0.01]] }; });
  X(46, 'C', R`In a Kalman filter, what happens to the gain when the measurement noise \(R\) is very large, and when it is very small? Interpret each case.`,
    R`\(K = P^{-}/(P^{-} + R)\) in the scalar case. Large \(R\) gives \(K \to 0\): the filter ignores the measurement and trusts its model. Small \(R\) gives \(K \to 1\): the estimate jumps to the measurement. The gain weighs the two by their uncertainties.`);
  X(46, 'C', R`Why is fuel-optimal powered descent to a landing pad naturally “bang-bang” in thrust magnitude?`,
    R`Propellant use is the integral of thrust magnitude, which enters the Hamiltonian linearly, so the optimum sits on a thrust bound whenever the switching function is nonzero: maximum thrust or minimum thrust, with at most a few switches (max–min–max for the classical problem).`);

  /* ───────── Ch 47 · Advanced combustion ───────── */
  S(47, 1, [[R`\(D_{CJ}\)`, 1837, 'm/s', 0.01]]);
  T(47, 2, { L: [0.5, [0.3, 0.8, 1]], a: [1100, [1000, 1200, 1400]] }, function (v) {
    return { q: R`Find the first longitudinal acoustic frequency of a ${v.L} m chamber with \(a\) = ${N(v.a)} m/s (closed–closed approximation).`, f: [['Frequency', v.a / (2 * v.L), 'Hz', 0.01]] }; });
  S(47, 3, [['Phase lag for τ = 0.3 ms', 119, '°', 0.02], ['Phase lag for τ = 0.1 ms', 39.6, '°', 0.02]]);
  S(47, 4, [[R`\(M_c\)`, 1.0, '', 0.02]]);
  T(47, 8, { d: [0.5, [0.2, 1]], e: [50, [20, 100]] }, function (v) {
    return { q: R`A flame has \(\delta_L\) = ${v.d} mm in turbulence with \(\eta\) = ${v.e} μm. Find \(Ka\).`, f: [['Ka', pow(v.d * 1000 / v.e, 2), '', 0.02]] }; });
  X(47, 'C', R`State Rayleigh’s criterion for thermoacoustic instability.`,
    R`An acoustic mode is driven when heat-release fluctuations are in phase with pressure fluctuations: the integral of \(p'q'\) over a cycle and the combustor volume is positive (phase difference within ±90°) and exceeds the acoustic losses.`);

  /* ───────── Ch 48 · Plasma and electric propulsion ───────── */
  T(48, 1, { f: [2.2, [0.437, 1.575, 26]] }, function (v) {
    return { q: R`Find the critical electron density for communications at ${v.f} GHz (\(f_p \approx 8.98\sqrt{n_e}\) Hz).`, f: [['Critical density', pow(v.f * 1e9 / 8.98, 2) / 1e16, '×10¹⁶ m⁻³', 0.03]] }; }, { vo: true });
  S(48, 1, [['S-band critical density', 6.0, '×10¹⁶ m⁻³', 0.03], ['X-band critical density', 8.7, '×10¹⁷ m⁻³', 0.03]]);
  T(48, 2, { V: [1100, [300, 600, 1500, 2000]] }, function (v) {
    var ve = sqrt(2 * P.QE * v.V / (131.29 * P.AMU));
    return { q: R`Find the exhaust velocity and \(I_{sp}\) of xenon ions (131.29 u) accelerated through ${N(v.V)} V.`, f: [['Exhaust velocity', ve / 1000, 'km/s', 0.01], [R`\(I_{sp}\)`, ve / 9.807, 's', 0.015]] }; });
  T(48, 3, { F: [0.25, [0.08, 0.5, 1]], I: [1600, [1500, 2000, 2500]], e: [0.55, [0.5, 0.6]] }, function (v) {
    return { q: R`Find the input power for a ${v.F} N Hall thruster at ${v.I} s with ${N(v.e * 100)}% efficiency.`, f: [['Input power', v.F * v.I * 9.807 / (2 * v.e) / 1000, 'kW', 0.015]] }; });
  T(48, 4, { n: [18, [16, 17, 19]], Te: [1, [3, 5, 10]] }, function (v) {
    return { q: R`Find the Debye length for \(n_e\) = 10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[1]}${'⁰¹²³⁴⁵⁶⁷⁸⁹'[v.n - 10]} m⁻³ and \(T_e\) = ${v.Te} eV.`, f: [['Debye length', sqrt(P.EPS0 * v.Te / (pow(10, v.n) * P.QE)) * 1e6, 'μm', 0.02]] }; });
  S(48, 5, [['Child–Langmuir current density', 174, 'A/m²', 0.03]]);
  S(48, 7, [['Electric propellant fraction', 0.28, '', 0.03], ['Chemical propellant fraction', 0.74, '', 0.02]]);
  T(48, 8, { s: [100, [50, 1000, 5000]], L: [1, [0.5, 2]] }, function (v) {
    return { q: R`Find \(Rm\) for \(\sigma\) = ${N(v.s)} S/m, \(U\) = 3000 m/s and \(L\) = ${v.L} m.`, f: [['Rm', P.MU0 * v.s * 3000 * v.L, '', 0.02]] }; });
  X(48, 'C', R`Why does an entry vehicle suffer a communications blackout, and why do higher frequencies help?`,
    R`The hot shock layer ionizes, forming a plasma sheath. Radio waves below the plasma frequency (which rises as \(\sqrt{n_e}\)) are reflected or absorbed. A higher carrier frequency has a higher critical electron density, so it penetrates a denser plasma.`);

  /* ───────── Ch 49 · Experimental hypersonics ───────── */
  S(49, 1, [[R`\(T_5\)`, 3560, 'K', 0.01], [R`\(p_5/p_1\)`, 191, '', 0.02]]);
  T(49, 2, { r: [0.1, [0.01, 0.05, 0.5, 1.225]] }, function (v) {
    return { q: R`Find \(n - 1\) for air at \(\rho\) = ${v.r} kg/m³ (Gladstone–Dale constant 2.26 × 10⁻⁴ m³/kg).`, f: [[R`\(n - 1\)`, 2.26e-4 * v.r * 1e5, '×10⁻⁵', 0.01]] }; });
  T(49, 3, { q: [1, [0.5, 2, 5]], t: [1, [0.5, 2, 5]] }, function (v) {
    return { q: R`A thin-film gauge on a Macor substrate (\(k\) = 1.46 W/(m·K), \(\rho\) = 2520 kg/m³, \(c\) = 790 J/(kg·K)) sees a sudden ${v.q} MW/m². Find its temperature rise after ${v.t} ms.`, f: [['Temperature rise', 2 * v.q * 1e6 * sqrt(v.t / 1000) / (sqrt(PI) * sqrt(2520 * 790 * 1.46)), 'K', 0.03]] }; });
  T(49, 4, { L: [0.1, [0.05, 0.2, 0.5]] }, function (v) {
    return { q: R`A 2 m vehicle flies at 60 km (\(\rho\) = 3.1 × 10⁻⁴ kg/m³). What density must a ${v.L} m model have to preserve binary scaling at the same velocity?`, f: [['Model density', 3.1e-4 * 2 / v.L * 1000, '×10⁻³ kg/m³', 0.01]] }; });
  X(49, 'C', R`Why do shock tunnels reach flight enthalpy but only for milliseconds, and what does that demand of the instrumentation?`,
    R`A shock compresses and heats the test gas almost instantly using energy stored in the driver, but the test slug is short and is soon overtaken by driver gas and reflected waves. Sensors must respond in microseconds: thin-film gauges, piezoelectric transducers and high-speed optical diagnostics.`);

  /* ───────── Ch 50 · MDO and UQ ───────── */
  S(50, 1, [[R`\(f'(2)\)`, 12, '', 0.001]]);
  T(50, 2, { k: [10, [2, 3, 5, 20]] }, function (v) {
    return { q: R`By what factor must Monte Carlo samples increase to cut the standard error by a factor of ${v.k}?`, f: [['Sample factor', v.k * v.k, '×', 0.01]] }; });
  T(50, 3, { ms: [350, [300, 380, 400]], ss: [40, [30, 50]] }, function (v) {
    var b = (500 - v.ms) / sqrt(2500 + v.ss * v.ss);
    return { q: R`Strength \(R \sim N(500, 50^{2})\) MPa and load \(S \sim N(${v.ms}, ${v.ss}^{2})\) MPa are independent. Find \(\beta\) and \(P_f\).`, f: [['β', b, '', 0.01], [R`\(P_f\)`, P.Phi(-b), '', 0.06]] }; });
  S(50, 4, [['Finite-difference flow solves', 1001, '', 0.002], ['Adjoint method: total solves', 4, '', { abs: 0.1 }]]);
  T(50, 8, { a: [2, [1, 3, 4]], b: [1, [1, 2, 3]] }, function (v) {
    var t = v.a * v.a + v.b * v.b;
    return { q: R`\(Y = ${v.a === 1 ? '' : v.a}X_1 + ${v.b === 1 ? '' : v.b}X_2\) with \(X_1\), \(X_2\) independent standard normals. Find the Sobol indices.`, f: [[R`\(S_1\)`, v.a * v.a / t, '', 0.01], [R`\(S_2\)`, v.b * v.b / t, '', 0.01]] }; });
  X(50, 'C', R`Why is the adjoint method the standard way to obtain gradients for aerodynamic shape optimization?`,
    R`Its cost is one extra (adjoint) solve per output, independent of the number of design variables, whereas finite differences cost one flow solve per variable. Shape problems have thousands of variables and only a few objectives and constraints.`);

  /* ───────── Ch 51 · Beyond chemical propulsion ───────── */
  T(51, 1, { dv: [4, [3, 6, 8]] }, function (v) {
    return { q: R`Compare the mass ratios for Δv = ${v.dv} km/s at 900 s (nuclear thermal) and at 450 s (LOX/LH₂).`, f: [['Mass ratio at 900 s', exp(v.dv * 1000 / (900 * 9.807)), '', 0.01], ['Mass ratio at 450 s', exp(v.dv * 1000 / (450 * 9.807)), '', 0.01]] }; });
  T(51, 2, { A: [1000, [500, 5000, 10000]], m: [10, [5, 50, 100]] }, function (v) {
    return { q: R`A perfectly reflecting ${N(v.A)} m² sail of ${v.m} kg total mass faces the Sun at 1 AU (pressure 9.08 × 10⁻⁶ N/m²). Find its acceleration.`, f: [['Acceleration', 9.08e-6 * v.A / v.m * 1000, 'mm/s²', 0.015]] }; });
  T(51, 3, { mr: [10, [2, 5, 100]] }, function (v) {
    return { q: R`A photon rocket has mass ratio ${v.mr}. Find its final speed as a fraction of \(c\).`, f: [['v/c', Math.tanh(ln(v.mr)), '', 0.003]] }; });
  T(51, 4, { Pw: [1, [0.1, 0.5, 5]], T: [800, [500, 600, 1000]] }, function (v) {
    return { q: R`Find the two-sided radiator area needed to reject ${v.Pw} MW at ${v.T} K with \(\varepsilon\) = 0.9.`, f: [['Radiator area', v.Pw * 1e6 / (2 * 0.9 * P.SIG * pow(v.T, 4)), 'm²', 0.015]] }; });
  T(51, 5, { q: [13.4, [10, 15, 20]] }, function (v) {
    var ve = sqrt(2 * v.q * 1e6);
    return { q: R`Find the theoretical maximum exhaust velocity and \(I_{sp}\) for \(q\) = ${v.q} MJ/kg.`, f: [['Exhaust velocity', ve / 1000, 'km/s', 0.01], [R`\(I_{sp}\)`, ve / 9.807, 's', 0.01]] }; });
  S(51, 8, [['Energy release', 3.4, '×10¹⁴ J/kg', 0.03], [R`\(v_{\max}/c\)`, 0.087, '', 0.03]]);
  X(51, 'C', R`Why does a nuclear thermal rocket roughly double the specific impulse of a chemical engine at a similar chamber temperature?`,
    R`Exhaust velocity scales as \(\sqrt{T_c/\mathcal M}\). The reactor heats pure hydrogen (\(\mathcal M \approx 2\)) instead of combustion products (\(\mathcal M \approx 13\)–18), so for a comparable temperature the exhaust is roughly \(\sqrt{13/2}\approx 2.5\) times faster.`);

  /* ───────── Ch 52–54 ───────── */
  T(52, 3, { a: [2, [1, 3, 4]], b: [3, [2, 4, 5]], c: [1, [0.5, 2]] }, function (v) {
    return { q: R`Three independent uncertainty sources contribute ${v.a}%, ${v.b}% and ${v.c}%. Find the combined (root-sum-square) uncertainty.`, f: [['Combined uncertainty', sqrt(v.a * v.a + v.b * v.b + v.c * v.c), '%', 0.01]] }; });
  X(52, 'C', R`Distinguish code verification, solution verification and validation.`,
    R`Code verification shows the equations are solved correctly (for example by manufactured solutions and observed order). Solution verification estimates the numerical error of a particular result (grid convergence, GCI). Validation compares the model with experiment to judge whether the right equations are being solved.`);
  T(53, 6, { n: [9, [8, 10, 12]], k: [10, [5, 100, 1000]] }, function (v) {
    return { q: R`If transition in flight occurs at \(N\) = ${v.n} and a tunnel’s noise makes initial disturbance amplitudes ${N(v.k)} times larger, at what \(N\) will transition appear in the tunnel?`, f: [[R`\(N_{tunnel}\)`, v.n - ln(v.k), '', 0.02]] }; });
  X(53, 'C', R`Give two reasons why “surpassing the state of the art” usually starts with reproducing a published result.`,
    R`Reproduction verifies your tools and your understanding against a known answer, and it exposes the assumptions, sensitivities and gaps in the original work, which is where a real contribution can be made and credibly measured.`);
  T(54, 1, { V: [0.1, [0.05, 0.2, 0.5]], p: [30, [20, 35, 40]] }, function (v) {
    var E = v.p * 1e6 * v.V / (2 / 3) * (1 - pow(0.1 / v.p, 0.4));
    return { q: R`Find the energy stored in a ${v.V} m³ helium vessel at ${v.p} MPa (γ = 5/3), expanding isentropically to 0.1 MPa, and its TNT equivalent (4.184 MJ/kg).`, f: [['Stored energy', E / 1e6, 'MJ', 0.02], ['TNT equivalent', E / 4.184e6, 'kg', 0.06]] }; });
  T(54, 5, { l: [0.1, [0.02, 0.05, 0.2]], V: [2, [1, 4, 5]] }, function (v) {
    return { q: R`${v.l} m³ (at ambient conditions) of hydrogen leaks into a closed ${v.V} m³ enclosure. Find the hydrogen concentration by volume and compare it with the 4% lower flammability limit.`, f: [['Concentration', v.l / v.V * 100, '% vol', 0.02]] }; });
  X(54, 'C', R`You plan to post a build video of rocket hardware you machined. What kinds of technical detail should make you stop and check export-control and safety guidance first?`,
    R`Detailed design, manufacturing or test data for propulsion systems, guidance or re-entry hardware can be export-controlled technical data even when shared online, and energetic-material or motor-making procedures are both hazardous and regulated. Airframe, recovery and tooling work for certified commercial motors under NAR or TRA rules is the safe, open territory; when unsure, ask before publishing.`);
})(typeof window !== 'undefined' ? window : globalThis);
