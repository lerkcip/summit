/* SUMMIT · question bank, Parts III–IV (Ch 15–35). See bank1.js for the format. */
(function (G) {
  'use strict';
  var P = G.PHYS, R = String.raw, N = P.fmt, T = G.BANK_T, S = G.BANK_S, X = G.BANK_X;
  var g0 = P.g0, MU = P.MU, sin = Math.sin, cos = Math.cos, tan = Math.tan, sqrt = Math.sqrt, exp = Math.exp, ln = Math.log, PI = Math.PI, pow = Math.pow, rad = P.rad, deg = P.deg, log10 = Math.log10;

  /* ───────── Ch 15 · Dynamics ───────── */
  (function () {
    var sites = [['Cape Canaveral', 28.5], ['Kourou', 5.2], ['Vandenberg', 34.7], ['Baikonur', 45.9], ['Wallops Island', 37.9], ['Kodiak', 57.4]];
    T(15, 1, { k: [0, [1, 2, 3, 4, 5]] }, function (v) {
      var s = sites[v.k], eq = P.OME * 6378137;
      return { q: R`Find Earth’s equatorial surface speed and the eastward speed at ${s[0]} (${s[1]}° N).`, f: [['Equatorial speed', eq, 'm/s', 0.005], [R`Speed at ${s[1]}°`, eq * cos(rad(s[1])), 'm/s', 0.005]] }; });
  })();
  T(15, 2, { V: [1000, 100, 7500, 100] }, function (v) {
    return { q: R`Find the Coriolis acceleration magnitude for a body moving at ${N(v.V)} m/s perpendicular to Earth’s axis.`, f: [['Coriolis acceleration', 2 * P.OME * v.V, 'm/s²']] }; });
  T(15, 3, { m: [10, [2, 5, 20, 40]], L: [2, [1, 3, 4, 0.5]] }, function (v) {
    return { q: R`A uniform rod of ${v.m} kg and ${v.L} m length rotates about one end. Find its moment of inertia.`, f: [['I', v.m * v.L * v.L / 3, 'kg·m²']] }; });
  T(15, 4, { I1: [100, [80, 200, 400]], I3: [50, [40, 150, 300, 600]], w: [10, [2, 5, 20]] }, function (v) {
    return { q: R`A torque-free axisymmetric body has \(I_1 = I_2\) = ${v.I1} kg·m², \(I_3\) = ${v.I3} kg·m² and spins at \(\omega_3\) = ${v.w} rad/s. Find the body-frame rate \(\lambda\) of the transverse angular velocity (with sign).`,
      f: [[R`\(\lambda\)`, (v.I3 - v.I1) * v.w / v.I1, 'rad/s', 0.01]] }; });
  T(15, 6, { L: [2, [0.5, 1, 4, 10]] }, function (v) {
    return { q: R`Give the small-angle period of a pendulum of length \(L\) = ${v.L} m (\(g\) = 9.807 m/s²).`, f: [['Period', 2 * PI * sqrt(v.L / 9.807), 's', 0.01]] }; });
  S(15, 7, [['Smallest principal moment', 0, 'kg·m²', { abs: 0.01 }], ['Middle principal moment', 4, 'kg·m²', { abs: 0.05 }], ['Largest principal moment', 4, 'kg·m²', { abs: 0.05 }]]);
  X(15, 'C', R`State the transport theorem relating the time derivative of a vector seen in an inertial frame to that seen in a rotating frame, and name the two fictitious accelerations it produces.`,
    R`\(\left.\frac{d\mathbf A}{dt}\right|_I = \left.\frac{d\mathbf A}{dt}\right|_B + \boldsymbol\omega\times\mathbf A\). Applied twice to position it gives the Coriolis term \(2\boldsymbol\omega\times\mathbf v\) and the centrifugal term \(\boldsymbol\omega\times(\boldsymbol\omega\times\mathbf r)\) (plus an Euler term if \(\boldsymbol\omega\) changes).`);
  X(15, 'C', R`Why is the rocket equation a variable-mass problem that \(F = ma\) alone handles incorrectly, and what is the correct momentum statement?`,
    R`\(F = ma\) applies to a fixed set of particles. A rocket sheds mass that carries momentum, so one must conserve the momentum of vehicle plus expelled propellant: \(m\,dv = -c\,dm\) with no external force, which integrates to the rocket equation.`);

  /* ───────── Ch 16 · Thermodynamics ───────── */
  (function () {
    var gases = [['air', 1.4, 287], ['helium', 1.667, 2077], ['hydrogen', 1.405, 4124], ['a combustion gas', 1.2, 400], ['steam', 1.33, 461.5], ['carbon dioxide', 1.289, 188.9]];
    T(16, 1, { k: [0, [1, 2, 3, 4, 5]] }, function (v) {
      var g = gases[v.k];
      return { q: R`Compute \(c_p\) and \(c_v\) for ${g[0]} (\(\gamma\) = ${g[1]}, \(R\) = ${N(g[2])} J/(kg·K)).`, f: [[R`\(c_p\)`, g[1] * g[2] / (g[1] - 1), 'J/(kg·K)', 0.01], [R`\(c_v\)`, g[2] / (g[1] - 1), 'J/(kg·K)', 0.01]] }; });
  })();
  T(16, 2, { T1: [300, [250, 288, 320]], r: [10, [5, 20, 30, 40]] }, function (v) {
    return { q: R`Air at 100 kPa and ${v.T1} K is compressed isentropically to ${N(v.r * 100)} kPa. Find \(T_2\).`, f: [[R`\(T_2\)`, v.T1 * pow(v.r, 0.4 / 1.4), 'K', 0.01]] }; });
  T(16, 3, { r: [30, [8, 10, 20, 40, 50]] }, function (v) {
    return { q: R`Find the ideal Brayton efficiency at a pressure ratio of ${v.r}.`, f: [['Efficiency', 1 - pow(v.r, -0.4 / 1.4), '', 0.01]] }; });
  T(16, 4, { T1: [300, [250, 300, 400]], T2: [600, [450, 900, 1200, 1500]] }, function (v) {
    return { q: R`Air is heated at constant pressure from ${v.T1} K to ${v.T2} K. Find \(\Delta s\) (\(c_p\) = 1004.5 J/(kg·K)).`, f: [[R`\(\Delta s\)`, 1004.5 * ln(v.T2 / v.T1), 'J/(kg·K)', 0.01]] }; });
  T(16, 5, { cp: [2000, [1500, 2500, 3000]], T0: [3000, [2500, 3300, 3600]], Te: [1000, [800, 1200, 1500]] }, function (v) {
    return { q: R`Gas with \(c_p\) = ${N(v.cp)} J/(kg·K) expands adiabatically from rest at ${N(v.T0)} K to ${N(v.Te)} K. Find the velocity reached.`, f: [['V', sqrt(2 * v.cp * (v.T0 - v.Te)), 'm/s', 0.01]] }; });
  T(16, 7, { T: [300, [250, 350, 400]], p: [1, [2, 5, 10]] }, function (v) {
    var rho = v.p * 101325 * 0.002016 / (8.314 * v.T);
    return { q: R`Find the density of gaseous hydrogen at ${v.T} K and ${v.p} atm, and the ratio of liquid-hydrogen density (70.8 kg/m³) to it.`, f: [['Gas density', rho, 'kg/m³', 0.015], ['Liquid / gas density ratio', 70.8 / rho, '', 0.02]] }; });
  X(16, 'C', R`Why does stagnation (total) temperature stay constant along an adiabatic nozzle while static temperature falls?`,
    R`With no heat or shaft work, total enthalpy \(h + V^{2}/2\) is conserved. As the gas accelerates, thermal energy is converted into kinetic energy, so the static temperature drops while \(T_0\) is unchanged.`);
  X(16, 'C', R`State the second law in terms of entropy for an adiabatic process, and say what “isentropic” assumes.`,
    R`In an adiabatic process the entropy of the fluid can only stay the same or rise: \(\Delta s \ge 0\). Isentropic means adiabatic and reversible (no friction, shocks or heat transfer across finite temperature differences), so \(\Delta s = 0\).`);
  X(16, 'I', R`A propellant gas has molar mass 20 kg/kmol and \(\gamma\) = 1.25. Using Chapter 6’s gas constant, find \(c_p\) and explain why low molar mass is attractive for a nozzle.`,
    R`\(R = 8314.46/20 = 415.7\) J/(kg·K) and \(c_p = \gamma R/(\gamma-1) = 2079\) J/(kg·K). A lighter gas has a larger \(c_p\) per kilogram, so the same temperature drop yields more kinetic energy per unit mass: exhaust velocity scales as \(\sqrt{T/\mathcal M}\).`, [6]);

  /* ───────── Ch 17 · Combustion ───────── */
  T(17, 1, { cp: [52, [45, 48, 56, 60]] }, function (v) {
    return { q: R`Estimate \(T_{ad}\) for H₂ + ½O₂ → H₂O from 298 K, ignoring dissociation, with a mean \(c_p\) of ${v.cp} J/(mol·K) for H₂O (\(\Delta h\) = 241.83 kJ/mol).`, f: [[R`\(T_{ad}\) (no dissociation)`, 298 + 241830 / v.cp, 'K', 0.01]] }; });
  T(17, 2, { dG: [100, [50, 150, 200, -50]], T: [3000, [2000, 2500, 3500]] }, function (v) {
    return { q: R`A reaction has \(\Delta G^\circ\) = ${v.dG > 0 ? '+' : ''}${v.dG} kJ/mol at ${N(v.T)} K. Find \(K_p\).`, f: [[R`\(K_p\)`, exp(-v.dG * 1000 / (8.314 * v.T)), '', 0.03]] }; });
  T(17, 3, { Ea: [150, [100, 200, 250]], T2: [1500, [1200, 2000, 2500]] }, function (v) {
    return { q: R`With \(E_a\) = ${v.Ea} kJ/mol, by what factor does \(k\) increase between 1000 K and ${N(v.T2)} K?`, f: [['Rate factor', exp(v.Ea * 1000 / 8.314 * (1 / 1000 - 1 / v.T2)), '×', 0.03]] }; });
  T(17, 4, { d: [100, [50, 150, 200, 300]], K: [1, [0.5, 2]] }, function (v) {
    return { q: R`Find the lifetime of a ${v.d} μm droplet with \(K\) = ${v.K} mm²/s.`, f: [['Lifetime', pow(v.d / 1000, 2) / v.K * 1000, 'ms']] }; });
  X(17, 'C', R`Why is the real adiabatic flame temperature of a rocket propellant well below the value computed from the heat of reaction and a constant \(c_p\)?`,
    R`At high temperature the products dissociate (H₂O → H, OH, O, H₂ …), which absorbs energy that would otherwise raise the temperature; \(c_p\) also rises with temperature. Equilibrium composition must be solved together with the energy balance.`);
  X(17, 'C', R`The Arrhenius law is \(k = A\,e^{-E_a/(R_uT)}\). What does it imply about the sensitivity of ignition to temperature?`,
    R`Reaction rate depends exponentially on \(-1/T\), so modest temperature rises multiply the rate by large factors. Ignition delay therefore falls steeply with temperature, and combustion tends to be either negligible or very fast.`);

  /* ───────── Ch 18 · Fluid mechanics ───────── */
  (function () {
    var liq = [['LOX', 1141], ['RP-1', 810], ['liquid methane', 423], ['liquid hydrogen', 70.8], ['water', 998]];
    T(18, 1, { k: [0, [1, 2, 3, 4]], h: [20, [5, 10, 30, 40]], n: [4, [2, 3, 5, 6]] }, function (v) {
      var l = liq[v.k];
      return { q: R`A ${l[0]} column (\(\rho\) = ${l[1]} kg/m³) ${v.h} m tall accelerates axially at ${v.n}g. Find the pressure increase at its base, beyond the ullage pressure, due to inertia alone.`, f: [[R`\(\Delta p\)`, l[1] * v.n * 9.807 * v.h / 1e6, 'MPa']] }; });
  })();
  T(18, 2, { T: [223.25, [216.65, 255.65, 288.15, 300]], V: [300, [100, 200, 500, 600]], L: [1, [0.5, 2, 5]] }, function (v) {
    var mu = 1.458e-6 * pow(v.T, 1.5) / (v.T + 110.4);
    return { q: R`Using Sutherland’s law, find \(\mu\) at ${v.T} K, then \(Re\) for \(V\) = ${v.V} m/s, \(\rho\) = 0.4135 kg/m³ and \(L\) = ${v.L} m.`, f: [[R`\(\mu\)`, mu * 1e5, '×10⁻⁵ Pa·s', 0.01], ['Re', 0.4135 * v.V * v.L / mu / 1e6, '×10⁶', 0.02]] }; });
  T(18, 3, { D: [5, [3, 4, 6, 8]], L: [2, [1, 3, 5]], Q: [5, [2, 4, 8]] }, function (v) {
    var d = v.D / 1000, Q = v.Q * 1e-6, V = Q / (PI * d * d / 4);
    return { q: R`Water (\(\mu\) = 10⁻³ Pa·s, \(\rho\) = 1000 kg/m³) flows at ${v.Q} × 10⁻⁶ m³/s through a ${v.D} mm tube ${v.L} m long. Find \(Re\) and the laminar \(\Delta p\).`, f: [['Re', 1000 * V * d / 1e-3, '', 0.02], [R`\(\Delta p\)`, 128 * 1e-3 * v.L * Q / (PI * pow(d, 4)), 'Pa', 0.02]] }; });
  T(18, 4, { x: [1, [0.5, 2]], Re: [1e6, [1e5, 2.5e5, 4e5]] }, function (v) {
    return { q: R`For a laminar plate boundary layer at \(x\) = ${v.x} m with \(Re_x\) = ${N(v.Re)}, find \(\delta_{99}\) and \(c_f\).`, f: [[R`\(\delta_{99}\)`, 5 * v.x / sqrt(v.Re) * 1000, 'mm', 0.01], [R`\(c_f\)`, 0.664 / sqrt(v.Re) * 1e4, '×10⁻⁴', 0.01]] }; });
  S(18, 5, [['Number of dimensionless groups', 3, '', { abs: 0.1 }]]);
  T(18, 8, { e: [1000, [10, 100, 1e4, 1e5]] }, function (v) {
    return { q: R`Find the Kolmogorov length for air (\(\nu\) = 1.5 × 10⁻⁵ m²/s) with \(\varepsilon\) = ${N(v.e)} m²/s³.`, f: [[R`\(\eta\)`, pow(pow(1.5e-5, 3) / v.e, 0.25) * 1e6, 'μm', 0.03]] }; });
  X(18, 'C', R`What does the Reynolds number compare, and what changes physically as it rises from 10 to 10⁷ in a pipe or over a plate?`,
    R`\(Re = \rho VL/\mu\) is the ratio of inertial to viscous forces. At low \(Re\) viscosity damps disturbances and flow is laminar; as \(Re\) rises, viscous effects are confined to thin boundary layers, instabilities grow and the flow becomes turbulent, raising friction and heat transfer.`);
  X(18, 'C', R`Write the control-volume momentum equation in words and explain how it gives thrust without knowing the pressure on every internal wall.`,
    R`The net force on the fluid in a control volume equals the rate of change of momentum inside plus the net momentum flux out. Drawing the volume around the engine, only the exit momentum flux and exit/ambient pressure difference appear, which sum to the thrust.`);

  /* ───────── Ch 19 · Heat transfer ───────── */
  T(19, 1, { k: [0.1, [0.05, 0.5, 1, 20]], dT: [1000, [300, 500, 1500]], L: [5, [1, 2, 10]] }, function (v) {
    return { q: R`Find the heat flux through a ${v.L} cm layer with \(k\) = ${v.k} W/(m·K) and a ${N(v.dT)} K temperature difference.`, f: [['Heat flux', v.k * v.dT / (v.L / 100) / 1000, 'kW/m²']] }; });
  T(19, 2, { d: [1, [0.5, 2, 3]], h: [50, [20, 100, 200, 500]] }, function (v) {
    var Lc = v.d / 100 / 6;
    return { q: R`A ${v.d} cm diameter aluminum sphere (\(\rho\) = 2700, \(c\) = 900, \(k\) = 237, SI units) is cooled with \(h\) = ${v.h} W/(m²·K). Find the Biot number and the lumped time constant.`, f: [['Bi', v.h * Lc / 237 * 1e4, '×10⁻⁴', 0.03], [R`\(\tau\)`, 2700 * 900 * Lc / v.h, 's', 0.02]] }; });
  T(19, 3, { q: [100, [50, 200, 500, 1000]], e: [0.85, [0.8, 0.9]] }, function (v) {
    return { q: R`A surface with \(\varepsilon\) = ${v.e} receives ${N(v.q)} kW/m² of convective heating and is in radiative equilibrium. Find \(T_w\).`, f: [[R`\(T_w\)`, pow(v.q * 1000 / (v.e * P.SIG), 0.25), 'K', 0.01]] }; });
  T(19, 4, { T1: [1500, [1000, 2000, 2500]], T2: [3000, [2000, 4000, 5800]] }, function (v) {
    return { q: R`Find the blackbody emissive power at ${N(v.T1)} K and the wavelength of peak emission at ${N(v.T2)} K.`, f: [[R`\(E_b\)`, P.SIG * pow(v.T1, 4) / 1000, 'kW/m²', 0.01], [R`\(\lambda_{\max}\)`, 2897.8 / v.T2, 'μm', 0.01]] }; });
  T(19, 5, { Re: [1e5, [2e4, 5e4, 2e5, 5e5]], Pr: [5, [0.7, 2, 7]] }, function (v) {
    return { q: R`Fluid in a tube has \(Re_D\) = ${N(v.Re)} and \(\Pr\) = ${v.Pr} and is being heated. Estimate \(Nu_D\) with the Dittus–Boelter correlation.`, f: [['Nu', 0.023 * pow(v.Re, 0.8) * pow(v.Pr, 0.4), '', 0.02]] }; });
  T(19, 7, { q: [1, [0.5, 2, 5]], t: [1, [0.5, 2, 5]] }, function (v) {
    return { q: R`A wall with \(k\) = 20 W/(m·K) and \(\alpha\) = 5 × 10⁻⁶ m²/s receives a sudden constant flux of ${v.q} MW/m². Find the surface temperature rise after ${v.t} s.`, f: [[R`\(\Delta T_s\)`, 2 * v.q * 1e6 / 20 * sqrt(5e-6 * v.t / PI), 'K', 0.015]] }; });
  X(19, 'C', R`What does the Biot number compare, and why does a small value justify treating a body as a single lumped temperature?`,
    R`\(Bi = hL_c/k\) compares internal conduction resistance with surface convection resistance. For \(Bi \ll 0.1\) heat spreads inside the body much faster than it crosses the surface, so internal gradients are negligible and one temperature describes the whole body.`);
  X(19, 'C', R`Radiative heat flux scales as \(T^{4}\). What does that imply for a hot structure’s ability to reject aerodynamic heating?`,
    R`A surface in radiative equilibrium balances incoming flux with \(\varepsilon\sigma T_w^{4}\), so its temperature rises only as the fourth root of the heating: doubling the flux raises \(T_w\) by 19%. High emissivity lowers the equilibrium temperature.`);

  /* ───────── Ch 20 · Solid mechanics ───────── */
  T(20, 1, { r: [1.5, [0.5, 1, 2, 3]], p: [0.3, [0.2, 0.5, 1, 3]], s: [300, [200, 450, 600]] }, function (v) {
    return { q: R`A cylindrical tank of radius ${v.r} m holds ${v.p} MPa with allowable stress ${v.s} MPa. Find the wall thickness required by hoop stress.`, f: [['Thickness', v.p * v.r / v.s * 1000, 'mm']] }; });
  T(20, 2, { I: [1, [0.5, 2, 4]], L: [2, [1, 3, 4]], E: [70, [110, 200]] }, function (v) {
    return { q: R`Find the Euler buckling load of a pinned tube with \(E\) = ${v.E} GPa, \(I\) = ${v.I} × 10⁻⁶ m⁴ and \(L\) = ${v.L} m.`, f: [[R`\(P_{cr}\)`, PI * PI * v.E * 1e9 * v.I * 1e-6 / (v.L * v.L) / 1000, 'kN', 0.01]] }; });
  T(20, 3, { dT: [500, [100, 200, 300, 800]] }, function (v) {
    return { q: R`An Inconel bar (\(E\) = 200 GPa, \(\alpha\) = 13 × 10⁻⁶ /K) is fully restrained and heated ${v.dT} K. Find the thermal stress.`, f: [['Thermal stress', 200e9 * 13e-6 * v.dT / 1e9, 'GPa']] }; });
  T(20, 4, { s: [200, [100, 150, 300, 400]], a: [2, [1, 4, 5, 10]] }, function (v) {
    return { q: R`Find \(K_I\) for \(\sigma\) = ${v.s} MPa and a crack with \(a\) = ${v.a} mm (\(Y\) = 1). Find the critical crack size for Ti-6Al-4V (\(K_{IC}\) ≈ 55 MPa√m).`, f: [[R`\(K_I\)`, v.s * sqrt(PI * v.a / 1000), 'MPa√m', 0.01], [R`\(a_c\)`, pow(55 / v.s, 2) / PI * 1000, 'mm', 0.02]] }; });
  T(20, 5, { s1: [200, [150, 300, 400]], s2: [100, [50, 150, -100]], s3: [0, [0, -50, 50]] }, function (v) {
    return { q: R`Find the von Mises stress for principal stresses ${v.s1}, ${v.s2} and ${v.s3} MPa.`, f: [['von Mises stress', sqrt(0.5 * (pow(v.s1 - v.s2, 2) + pow(v.s2 - v.s3, 2) + pow(v.s3 - v.s1, 2))), 'MPa', 0.01]] }; });
  T(20, 6, { a: [1, [0.5, 2, 3, 5]], b: [2, [1, 3, 4, 6]] }, function (v) {
    return { q: R`A part sees \(${N(v.a * 1e4)}\) cycles at a level where \(N\) = 10⁵ and \(${N(v.b * 1e5)}\) cycles where \(N\) = 10⁶. Find the Miner damage.`, f: [['Damage D', v.a * 0.1 + v.b * 0.1, '', 0.01]] }; });
  X(20, 'C', R`Why is the hoop stress in a thin cylindrical pressure vessel twice the axial stress, and what does that mean for how such a tank fails?`,
    R`Hoop stress is \(pr/t\) and axial stress \(pr/(2t)\): the pressure load across a diameter is carried by two wall strips, while the end-cap load is carried by the full circumference. The vessel therefore splits along its length (a longitudinal crack) first.`);
  X(20, 'C', R`Your MPCNC gantry deflects under cutting load. Which section property governs bending stiffness, and why is a tube stiffer per kilogram than a solid bar?`,
    R`Bending stiffness is \(EI\), with \(I\) the second moment of area. \(I\) grows with the square of the distance of material from the neutral axis, so a tube that places its material far from the axis achieves a much higher \(I\) for the same mass.`);

  /* ───────── Ch 21 · EM, circuits, signals ───────── */
  T(21, 1, { Rk: [10, [1, 4.7, 47, 100]], C: [10, [1, 100, 470]] }, function (v) {
    return { q: R`Find the cutoff frequency of an RC filter with \(R\) = ${v.Rk} kΩ and \(C\) = ${v.C} nF.`, f: [[R`\(f_c\)`, 1 / (2 * PI * v.Rk * 1e3 * v.C * 1e-9), 'Hz', 0.01]] }; });
  T(21, 2, { B: [1, [0.01, 0.1, 10, 100]] }, function (v) {
    var Pw = P.KB * 290 * v.B * 1e6;
    return { q: R`Find the thermal noise power at 290 K in a ${v.B} MHz bandwidth, in dBm.`, f: [['Noise power', 10 * log10(Pw / 1e-3), 'dBm', { abs: 0.3 }]] }; });
  T(21, 3, { f: [2.2, [0.437, 1.575, 8.4, 26]], d: [1000, [500, 2000, 36000, 384400]] }, function (v) {
    return { q: R`Find the free-space path loss at ${v.f} GHz over ${N(v.d)} km.`, f: [['Path loss', 20 * log10(4 * PI * v.d * 1000 / (P.C / (v.f * 1e9))), 'dB', { abs: 0.3 }]] }; });
  T(21, 4, { B: [0.02, [0.01, 0.05, 0.1]] }, function (v) {
    return { q: R`Find the cyclotron frequency (in MHz) of an electron in a ${v.B} T field.`, f: [['Cyclotron frequency', P.QE * v.B / (2 * PI * P.ME) / 1e6, 'MHz', 0.01]] }; });
  T(21, 5, { f: [300, [250, 350, 450, 700]], fs: [400, [400, 500, 1000]] }, function (v) {
    var al = Math.abs(v.f - Math.round(v.f / v.fs) * v.fs);
    return { q: R`A ${v.f} Hz vibration is sampled at ${v.fs} Hz without filtering. At what frequency does it appear?`, f: [['Apparent frequency', al, 'Hz', { abs: 1 }]] }; });
  T(21, 7, { p: [95, [63.2, 86.5, 90, 99]] }, function (v) {
    return { q: R`How long does an RC circuit take to reach ${v.p}% of a step input, in time constants?`, f: [[R`\(t/\tau\)`, -ln(1 - v.p / 100), '', 0.02]] }; });
  T(21, 8, { n: [16, [8, 10, 12, 14, 24]] }, function (v) {
    return { q: R`A ${v.n}-bit ADC: what is its ideal quantization-limited SNR?`, f: [['SNR', 6.02 * v.n + 1.76, 'dB', { abs: 0.3 }]] }; });
  X(21, 'C', R`State the Nyquist sampling criterion and describe what happens to a signal component above half the sampling rate.`,
    R`A signal must be sampled at more than twice its highest frequency. Any component above \(f_s/2\) folds back (aliases) to a lower frequency \(|f - nf_s|\) and becomes indistinguishable from a real low-frequency signal.`);
  X(21, 'C', R`A stepper motor driver on a CNC controller limits coil current by chopping. Using \(V = L\,di/dt + iR\), explain why a higher supply voltage lets a stepper keep its torque at higher speeds.`,
    R`Each step must build current in the inductive coil; \(di/dt \approx V/L\). A higher supply voltage raises the current faster, so the coil still reaches its rated current within the shorter time available per step at high speed, while the chopper holds the current at the set limit.`);

  /* ───────── Ch 22 · Feedback control ───────── */
  T(22, 1, { z: [0.5, [0.2, 0.3, 0.4, 0.6, 0.7]] }, function (v) {
    return { q: R`Find the percent overshoot for \(\zeta\) = ${v.z}.`, f: [['Overshoot', exp(-PI * v.z / sqrt(1 - v.z * v.z)) * 100, '%', 0.02]] }; });
  T(22, 2, { z: [0.5, [0.4, 0.6, 0.7]], w: [4, [2, 5, 8, 10]] }, function (v) {
    return { q: R`Find the 2% settling time for \(\zeta\) = ${v.z} and \(\omega_n\) = ${v.w} rad/s.`, f: [[R`\(t_s\)`, 4 / (v.z * v.w), 's', 0.02]] }; });
  T(22, 3, { a: [2, [1, 3, 4, 5]], b: [3, [2, 4, 5, 6]] }, function (v) {
    return { q: R`For what \(K > 0\) is \(s^{3} + ${v.a}s^{2} + ${v.b}s + K\) stable? Give the upper limit on \(K\).`, f: [['Upper limit on K', v.a * v.b, '', { abs: 0.05 }]] }; });
  T(22, 4, { a: [4, [1, 2, 9]], b: [2, [1, 4, 5]], w: [4, [3, 5, 6]], z: [0.7, [0.5, 0.6, 0.8]] }, function (v) {
    return { q: R`For \(\ddot\theta = ${v.a}\theta + ${v.b}\delta\) with PD control \(\delta = -K_p\theta - K_d\dot\theta\), choose \(K_p\) and \(K_d\) to give \(\omega_n\) = ${v.w} rad/s and \(\zeta\) = ${v.z}.`, f: [[R`\(K_p\)`, (v.w * v.w + v.a) / v.b, '', 0.01], [R`\(K_d\)`, 2 * v.z * v.w / v.b, '', 0.01]] }; });
  T(22, 5, { K: [10, [2, 5, 20, 50]] }, function (v) {
    var wc = sqrt((-1 + sqrt(1 + 4 * v.K * v.K)) / 2);
    return { q: R`Find the gain crossover frequency and phase margin of \(L(s) = ${v.K}/[s(s + 1)]\).`, f: [[R`\(\omega_c\)`, wc, 'rad/s', 0.01], ['Phase margin', 90 - deg(Math.atan(wc)), '°', 0.03]] }; });
  X(22, 'C', R`In a PID controller, what does each of the three terms contribute, and what is the usual price of adding more derivative action?`,
    R`Proportional action sets stiffness and speed of response; integral action removes steady-state error; derivative action adds damping by anticipating the error trend. Derivative gain amplifies high-frequency sensor noise, so it is filtered and limited.`);
  X(22, 'C', R`A launch vehicle is aerodynamically unstable in pitch (pole in the right half-plane). Why can feedback through thrust-vector control still stabilize it, and what sets a minimum on the controller’s bandwidth?`,
    R`Feedback moves the closed-loop poles: a PD law makes the characteristic equation \(s^{2} + bK_d s + (bK_p - a) = 0\), stable for sufficient gain. The loop must act faster than the instability grows, so the crossover frequency must exceed the unstable pole’s rate, while staying below actuator, slosh and bending-mode limits.`);
  X(22, 'I', R`A state-space system has controllability matrix \([\mathbf B\ \ \mathbf{AB}]\) of rank 1 for a two-state plant. What does that tell you, in terms of the linear algebra of Chapter 10?`,
    R`The columns are linearly dependent, so the input can move the state only along a one-dimensional subspace. One mode cannot be influenced: the system is not controllable, and no feedback gain can place that mode’s eigenvalue.`, [10]);

  /* ───────── Ch 23 · Compressible flow I ───────── */
  T(23, 1, { T: [216.65, [223.25, 255.65, 288.15, 300, 500]] }, function (v) {
    return { q: R`Find the speed of sound in air at ${v.T} K.`, f: [['a', sqrt(1.4 * 287.05 * v.T), 'm/s', 0.005]] }; });
  T(23, 2, { M: [2, [1.5, 2.5, 3, 4, 5]], T: [216.65, [216.65, 250, 288.15]] }, function (v) {
    return { q: R`Air at \(M\) = ${v.M} has \(T\) = ${v.T} K. Find \(T_0\) and \(p_0/p\).`, f: [[R`\(T_0\)`, v.T * P.T0T(v.M), 'K', 0.005], [R`\(p_0/p\)`, P.p0p(v.M), '', 0.01]] }; });
  T(23, 3, { M: [3, [1.5, 2, 2.5, 4, 5]] }, function (v) {
    return { q: R`Find \(A/A^{*}\) for \(M\) = ${v.M} (γ = 1.4).`, f: [[R`\(A/A^{*}\)`, P.AAs(v.M), '', 0.01]] }; });
  T(23, 4, { At: [0.01, [0.005, 0.02, 0.05]], p0: [1, [2, 5, 7, 10]], T0: [3000, [2500, 3300, 3600]] }, function (v) {
    return { q: R`A choked throat of ${v.At} m² passes gas with \(p_0\) = ${v.p0} MPa, \(T_0\) = ${N(v.T0)} K, \(\gamma\) = 1.2 and \(R\) = 400 J/(kg·K). Find \(\dot m\).`, f: [[R`\(\dot m\)`, P.Gam(1.2) * v.p0 * 1e6 * v.At / sqrt(400 * v.T0), 'kg/s', 0.01]] }; });
  T(23, 5, { ar: [10, [4, 6, 8, 20, 40]] }, function (v) {
    var M = P.MfromA(v.ar);
    return { q: R`A nozzle has \(A_e/A_t\) = ${v.ar} (γ = 1.4). Find the supersonic exit Mach number and \(p_e/p_0\).`, f: [[R`\(M_e\)`, M, '', 0.01], [R`\(p_e/p_0\)`, 1 / P.p0p(M), '', 0.03]] }; });
  T(23, 8, { T0: [300, [500, 800, 1000, 2000]] }, function (v) {
    return { q: R`Find \(V_{\max}\) for air with \(T_0\) = ${N(v.T0)} K (\(c_p\) = 1004.5 J/(kg·K)).`, f: [[R`\(V_{\max}\)`, sqrt(2 * 1004.5 * v.T0), 'm/s', 0.01]] }; });
  X(23, 'C', R`Use the area–velocity relation \(dA/A = (M^{2}-1)\,dV/V\) to explain why a rocket nozzle must converge and then diverge.`,
    R`For \(M<1\) a decrease in area accelerates the flow; for \(M>1\) an increase in area accelerates it. So subsonic chamber gas must be squeezed to reach \(M=1\) at the minimum area (throat) and then expanded in a diverging section to go supersonic.`);
  X(23, 'C', R`What does it mean for a nozzle to be choked, and why does lowering the back pressure further not increase the mass flow?`,
    R`The throat is sonic and passes the maximum mass flow for the given \(p_0\), \(T_0\) and area. Pressure signals travel at the speed of sound and cannot pass upstream through the sonic throat, so conditions upstream no longer respond to the back pressure.`);

  /* ───────── Ch 24 · Shocks and expansions ───────── */
  T(24, 1, { M: [3, [1.5, 2, 2.5, 4, 5]] }, function (v) {
    var s = P.ns(v.M);
    return { q: R`For a normal shock at \(M_1\) = ${v.M} (γ = 1.4), find \(M_2\), \(p_2/p_1\), \(T_2/T_1\) and \(p_{02}/p_{01}\).`, f: [[R`\(M_2\)`, s.M2, '', 0.01], [R`\(p_2/p_1\)`, s.p, '', 0.01], [R`\(T_2/T_1\)`, s.T, '', 0.01], [R`\(p_{02}/p_{01}\)`, s.p0, '', 0.015]] }; });
  T(24, 2, { M: [3, [2, 2.5, 4, 5]], th: [15, [5, 10, 20]] }, function (v) {
    var o = P.oblique(v.M, v.th);
    return { q: R`Find β, \(M_2\) and \(p_2/p_1\) for \(M_1\) = ${v.M} over a ${v.th}° wedge (weak solution, γ = 1.4).`, f: [['β', o.beta, '°', 0.015], [R`\(M_2\)`, o.M2, '', 0.015], [R`\(p_2/p_1\)`, o.p, '', 0.02]] }; });
  T(24, 3, { M: [2, [1.5, 2.5, 3]], th: [10, [5, 15, 20]] }, function (v) {
    return { q: R`Flow at \(M\) = ${v.M} expands around a ${v.th}° corner (γ = 1.4). Find \(M_2\).`, f: [[R`\(M_2\)`, P.MfromNu(P.nu(v.M) + v.th), '', 0.01]] }; });
  T(24, 4, { M: [3, [2, 2.5, 4, 5]] }, function (v) {
    var t = P.thetaMax(v.M);
    return { q: R`Find \(\theta_{\max}\) for an attached oblique shock at \(M\) = ${v.M} (γ = 1.4).`, f: [[R`\(\theta_{\max}\)`, t.theta, '°', 0.01]] }; });
  T(24, 5, { M: [2.5, [2, 3, 3.5]], T: [1500, [1200, 1800, 2000]] }, function (v) {
    return { q: R`A constant-area combustor receives air at \(M\) = ${v.M} with \(T_{01}\) = ${N(v.T)} K. What is the largest stagnation temperature reachable before thermal choking?`, f: [[R`\(T_0^{*}\)`, v.T / P.rayT0(v.M), 'K', 0.01]] }; });
  T(24, 7, { M: [2, [1.5, 2.5, 3, 4]] }, function (v) {
    return { q: R`A Pitot probe in a \(M\) = ${v.M} stream reads \(p_{02}\). Find \(p_{02}/p_1\) (γ = 1.4).`, f: [[R`\(p_{02}/p_1\)`, P.pitot(v.M), '', 0.01]] }; });
  T(24, 8, { M1: [0.5, [0.3, 0.4, 0.7]], M2: [2, [1.5, 3, 4]] }, function (v) {
    return { q: R`Find \(4\bar fL^{*}/D\) for \(M\) = ${v.M1} and \(M\) = ${v.M2} (γ = 1.4).`, f: [[R`At \(M\) = ${v.M1}`, P.fanno(v.M1), '', 0.02], [R`At \(M\) = ${v.M2}`, P.fanno(v.M2), '', 0.02]] }; });
  X(24, 'C', R`Across a normal shock, which of these rise, fall or stay constant: static pressure, static temperature, Mach number, stagnation temperature, stagnation pressure, entropy?`,
    R`Static pressure and temperature rise; Mach number falls to subsonic; stagnation temperature is unchanged (adiabatic); stagnation pressure falls; entropy rises.`);
  X(24, 'C', R`Why do supersonic inlets use several oblique shocks rather than one normal shock to slow the flow?`,
    R`Stagnation-pressure loss grows steeply with the normal Mach number of each shock. A sequence of weak oblique shocks reaches the same deceleration with a far smaller total loss than a single strong normal shock.`);

  /* ───────── Ch 25 · Aerodynamics ───────── */
  T(25, 1, { a: [4, [2, 3, 5, 6, 8]] }, function (v) {
    return { q: R`Find \(c_l\) for a symmetric thin airfoil at \(\alpha\) = ${v.a}°.`, f: [[R`\(c_l\)`, 2 * PI * rad(v.a), '', 0.01]] }; });
  T(25, 2, { CL: [0.5, [0.3, 0.8, 1.0]], AR: [8, [6, 10, 12]], e: [0.85, [0.8, 0.9]] }, function (v) {
    return { q: R`Find the induced drag coefficient for \(C_L\) = ${v.CL}, \(AR\) = ${v.AR} and \(e\) = ${v.e}.`, f: [[R`\(C_{D,i}\)`, v.CL * v.CL / (PI * v.AR * v.e), '', 0.015]] }; });
  T(25, 3, { cp: [-0.4, [-0.2, -0.6, -0.8]], M: [0.7, [0.5, 0.6, 0.8]] }, function (v) {
    return { q: R`A low-speed measurement gives \(C_{p0}\) = ${N(v.cp)}. Estimate \(C_p\) at \(M_\infty\) = ${v.M} with the Prandtl–Glauert rule.`, f: [[R`\(C_p\)`, v.cp / sqrt(1 - v.M * v.M), '', 0.01]] }; });
  T(25, 4, { a: [3, [2, 4, 5]], M: [2, [1.5, 2.5, 3]] }, function (v) {
    var al = rad(v.a), b = sqrt(v.M * v.M - 1);
    return { q: R`Find \(c_l\), \(c_{d,w}\) and \(L/D\) for a flat plate at ${v.a}° and Mach ${v.M} by linear theory.`, f: [[R`\(c_l\)`, 4 * al / b, '', 0.01], [R`\(c_{d,w}\)`, 4 * al * al / b, '', 0.015], ['L/D', 1 / al, '', 0.01]] }; });
  T(25, 5, { c: [0.02, [0.015, 0.025, 0.03]], k: [0.05, [0.04, 0.06, 0.08]] }, function (v) {
    return { q: R`Find \((L/D)_{\max}\) for \(C_{D0}\) = ${v.c} and \(k\) = ${v.k}.`, f: [[R`\((L/D)_{\max}\)`, 1 / (2 * sqrt(v.c * v.k)), '', 0.01]] }; });
  T(25, 7, { a: [3, [2, 4, 5]], M: [2, [2.5, 3]] }, function (v) {
    var o = P.oblique(v.M, v.a);
    return { q: R`Compare the Ackeret \(C_p\) on the compression side of a plate at ${v.a}°, Mach ${v.M}, with the exact oblique-shock value.`, f: [[R`Ackeret \(C_p\)`, 2 * rad(v.a) / sqrt(v.M * v.M - 1), '', 0.015], [R`Exact \(C_p\)`, (o.p - 1) / (0.7 * v.M * v.M), '', 0.02]] }; });
  T(25, 8, { cg: [6.0, [5, 5.5, 6.5]], cp: [7.0, [6.8, 7.5, 8]], d: [1, [0.5, 0.8]] }, function (v) {
    return { q: R`A 10 m rocket of ${v.d} m diameter has its CG at ${v.cg.toFixed(1)} m and CP at ${v.cp.toFixed(1)} m from the nose. Find the static margin in calibers.`, f: [['Static margin', (v.cp - v.cg) / v.d, 'cal', 0.01]] }; });
  X(25, 'C', R`Where does induced drag come from, and why does a high aspect ratio reduce it?`,
    R`A finite wing sheds trailing vortices that induce downwash, tilting the lift vector backward; the rearward component is induced drag, \(C_{D,i} = C_L^{2}/(\pi e AR)\). A longer span spreads the lift over more air, weakening the downwash.`);
  X(25, 'C', R`How does a rocket’s centre of pressure move between subsonic and supersonic flight, and why does that matter for fin sizing?`,
    R`Fin and body lift slopes change with Mach number: fin effectiveness drops at supersonic speed (\(\propto 1/\sqrt{M^{2}-1}\)) while nose lift persists, so the CP generally moves forward, reducing the static margin. Fins must be sized for the worst case across the whole Mach range.`);

  /* ───────── Ch 26 · Rocket propulsion ───────── */
  (function () {
    function eng(eps) { var g = 1.2, Rg = 8314.46 / 13, Tc = 3500, Me = P.MfromA(eps, g), pr = 1 / P.p0p(Me, g);
      var ue = sqrt(2 * g / (g - 1) * Rg * Tc * (1 - pow(pr, (g - 1) / g))), cs = sqrt(Rg * Tc) / P.Gam(g), cf = ue / cs + pr * eps;
      return { pe: pr * 10e6, pr: pr, ue: ue, cs: cs, cf: cf }; }
    T(26, 1, { e: [40, [10, 20, 60, 80]] }, function (v) {
      var x = eng(v.e);
      return { q: R`An ideal engine has \(p_c\) = 10 MPa, \(T_c\) = 3500 K, \(\mathcal M\) = 13 kg/kmol, \(\gamma\) = 1.2 and \(\varepsilon\) = ${v.e}. Find \(p_e\), \(u_e\), \(c^{*}\), \(C_{F,vac}\) and \(I_{sp,vac}\).`,
        f: [[R`\(p_e\)`, x.pe / 1000, 'kPa', 0.03], [R`\(u_e\)`, x.ue, 'm/s', 0.01], [R`\(c^{*}\)`, x.cs, 'm/s', 0.01], [R`\(C_{F,vac}\)`, x.cf, '', 0.01], [R`\(I_{sp,vac}\)`, x.cs * x.cf / g0, 's', 0.01]] }; });
    T(26, 2, { e: [40, [10, 20, 60, 80]] }, function (v) {
      var x = eng(v.e), cfs = x.cf - 0.101325 / 10 * v.e;
      return { q: R`An ideal engine has \(p_c\) = 10 MPa, \(T_c\) = 3500 K, \(\mathcal M\) = 13 kg/kmol, \(\gamma\) = 1.2 and \(\varepsilon\) = ${v.e}. Find its sea-level \(C_F\) and \(I_{sp}\), and \(p_e/p_a\) to check for flow separation.`,
        f: [[R`\(C_{F,SL}\)`, cfs, '', 0.01], [R`\(I_{sp,SL}\)`, x.cs * cfs / g0, 's', 0.01], [R`\(p_e/p_a\)`, x.pe / 101325, '', 0.04]] }; });
  })();
  T(26, 3, { dv: [9, [8, 8.5, 9.5]], I: [300, [320, 350]], es: [0.1, [0.08, 0.12]] }, function (v) {
    var n = exp(v.dv * 500 / (v.I * g0)), pi = (1 / n - v.es) / (1 - v.es);
    return { q: R`A two-stage vehicle has identical stages (\(I_{sp}\) = ${v.I} s, \(\varepsilon_s\) = ${v.es}), a 1000 kg payload and a total Δv of ${v.dv} km/s split equally. Find each stage’s mass ratio and payload fraction, and the liftoff mass.`,
      f: [['Stage mass ratio n', n, '', 0.01], ['Stage payload fraction π', pi, '', 0.02], ['Liftoff mass', 1000 / (pi * pi) / 1000, 't', 0.03]] }; });
  T(26, 4, { a: [15, [10, 12, 18, 20, 25]] }, function (v) {
    return { q: R`Find the divergence efficiency of a ${v.a}° conical nozzle.`, f: [['λ', (1 + cos(rad(v.a))) / 2, '', 0.002]] }; });
  T(26, 7, { tw: [1.3, [1.2, 1.5, 1.8]], n: [4, [3, 5, 6]], I: [300, [280, 330]] }, function (v) {
    var tb = v.I * (1 - 1 / v.n) / v.tw;
    return { q: R`A vertical ascent has liftoff \(T/W\) = ${v.tw}, \(I_{sp}\) = ${v.I} s and burns to mass ratio ${v.n}. Estimate the burn time and an upper bound on the gravity loss.`, f: [['Burn time', tb, 's', 0.01], ['Gravity loss bound', g0 * tb / 1000, 'km/s', 0.015]] }; });
  S(26, 8, [['LOX/RP-1 bulk density', 3.56 / (2.56 / 1141 + 1 / 810), 'kg/m³', 0.01], ['LOX/LH₂ bulk density', 7 / (6 / 1141 + 1 / 70.85), 'kg/m³', 0.01], ['Density-impulse ratio (RP-1 / LH₂)', 340 * 1024 / (450 * 361), '', 0.03]]);
  X(26, 'C', R`Define characteristic velocity \(c^{*}\) and thrust coefficient \(C_F\), and say which part of the engine each one grades.`,
    R`\(c^{*} = p_cA_t/\dot m\) measures how well the chamber turns propellant into high-pressure gas (combustion quality, set by \(T_c\), \(\mathcal M\), \(\gamma\)). \(C_F = F/(p_cA_t)\) measures how well the nozzle turns that pressure into thrust. \(I_{sp} = c^{*}C_F/g_0\).`);
  X(26, 'C', R`Why does staging beat a single stage for a large \(\Delta v\), in terms of the rocket equation?`,
    R`Empty tanks and engines are dead mass that the remaining propellant would otherwise have to accelerate. Dropping them resets the mass ratio for each stage, so the overall payload fraction is the product of achievable stage fractions instead of an impossible single mass ratio.`);
  X(26, 'I', R`An engine’s nozzle is over-expanded at sea level (\(p_e < p_a\)). Using the thrust equation of Chapter 7, explain how thrust changes as the vehicle climbs.`,
    R`\(F = \dot m u_e + (p_e - p_a)A_e\). The momentum term is fixed by the chamber and nozzle; as \(p_a\) falls with altitude the negative pressure term shrinks, passes through zero at the design altitude and becomes positive, so thrust rises toward its vacuum value.`, [7]);

  /* ───────── Ch 27 · Liquid engines ───────── */
  T(27, 1, { md: [500, [100, 250, 1000]], dp: [20, [10, 30, 40]], eta: [0.75, [0.65, 0.7, 0.8]] }, function (v) {
    return { q: R`Find the pump power to raise ${v.md} kg/s of LOX (\(\rho\) = 1141 kg/m³) by ${v.dp} MPa at ${N(v.eta * 100)}% efficiency.`, f: [['Pump power', v.md * v.dp * 1e6 / (1141 * v.eta) / 1e6, 'MW', 0.01]] }; });
  T(27, 2, { dp: [20, [10, 30, 40]] }, function (v) {
    return { q: R`Find the pump head for a ${v.dp} MPa rise in LOX (\(\rho\) = 1141 kg/m³) and in LH₂ (\(\rho\) = 70.8 kg/m³).`, f: [['LOX head', v.dp * 1e6 / (1141 * 9.807), 'm', 0.01], ['LH₂ head', v.dp * 1e6 / (70.8 * 9.807), 'm', 0.01]] }; });
  T(27, 3, { md: [1, [0.5, 2, 3]], dp: [2, [1, 3]], cd: [0.7, [0.6, 0.8]] }, function (v) {
    var A = v.md / (v.cd * sqrt(2 * 1141 * v.dp * 1e6));
    return { q: R`Size one LOX injector orifice for ${v.md} kg/s at Δp = ${v.dp} MPa with \(C_d\) = ${v.cd} (\(\rho\) = 1141 kg/m³).`, f: [['Orifice area', A * 1e6, 'mm²', 0.02], ['Orifice diameter', sqrt(4 * A / PI) * 1000, 'mm', 0.02]] }; });
  T(27, 4, { L: [1, [0.8, 1.2, 1.5]], At: [0.01, [0.005, 0.02, 0.05]] }, function (v) {
    return { q: R`A chamber has \(L^{*}\) = ${v.L} m and \(A_t\) = ${v.At} m². Find its volume.`, f: [[R`\(V_c\)`, v.L * v.At * 1000, 'litres', 0.01]] }; });
  T(27, 5, { D: [0.4, [0.2, 0.3, 0.6, 1.0]], a: [1200, [1000, 1400, 1500]] }, function (v) {
    return { q: R`Find the first-tangential acoustic frequency of a ${v.D} m diameter chamber with \(a\) = ${N(v.a)} m/s.`, f: [[R`\(f_{1T}\)`, 1.8412 * v.a / (PI * v.D), 'Hz', 0.01]] }; });
  S(27, 8, [['Pressure-fed / pump-fed tank mass ratio', 10, '×', 0.02]]);
  T(27, 9, { V: [10, [5, 20, 30]], p: [0.3, [0.2, 0.5]] }, function (v) {
    var m = v.p * 1e6 * v.V / (2077 * 300);
    return { q: R`Find the helium mass needed to expel ${v.V} m³ of propellant at ${v.p} MPa from a bottle at 300 K blown down from 30 MPa to 1 MPa, for an adiabatic and an isothermal bottle (\(R\) = 2077 J/(kg·K), γ = 5/3).`, f: [['Adiabatic bottle', m * (5 / 3) / (1 - 1 / 30), 'kg', 0.02], ['Isothermal bottle', m / (1 - 1 / 30), 'kg', 0.02]] }; });
  X(27, 'C', R`What is regenerative cooling, and why is the throat the hardest place to cool?`,
    R`Propellant (usually fuel) flows through channels in the chamber wall, absorbing heat before injection, so the heat is returned to the cycle. Heat flux peaks at the throat, where mass flux \(\rho V\) and therefore the gas-side heat-transfer coefficient are greatest.`);
  X(27, 'C', R`Why must a turbopump inlet have enough net positive suction head, and what happens if it does not?`,
    R`If local pressure in the inducer falls below the propellant’s vapor pressure, vapor bubbles form (cavitation). They block flow, drop the pump head, cause vibration and erosion, and can lead to loss of thrust or pump failure. Tank pressure and inducers provide the margin.`);

  /* ───────── Ch 28 · Solid, hybrid, other ───────── */
  T(28, 2, { x: [10, [5, 15, 20]], n: [0.35, [0.3, 0.4, 0.5]] }, function (v) {
    return { q: R`By what percentage does \(p_c\) change if \(A_b\) rises ${v.x}%, for a burn-rate exponent \(n\) = ${v.n}?`, f: [[R`Change in \(p_c\)`, (pow(1 + v.x / 100, 1 / (1 - v.n)) - 1) * 100, '%', 0.02]] }; });
  S(28, 1, [[R`\(p_c\)`, pow(1750 * 1550 * 200 * 5e-3 / 1e6, 1 / 0.65), 'MPa', 0.015]]);
  T(28, 3, { G: [200, [100, 300, 400, 500]] }, function (v) {
    return { q: R`A hybrid has \(\dot r = 3.0\times10^{-5}\,G_{ox}^{0.6}\) (SI units). Find \(\dot r\) at \(G_{ox}\) = ${v.G} kg/(m²·s).`, f: [[R`\(\dot r\)`, 3e-5 * pow(v.G, 0.6) * 1000, 'mm/s', 0.02]] }; });
  T(28, 4, { m: [1000, [500, 2000, 4000]], mp: [50, [20, 100, 200]], I: [230, [220, 235]] }, function (v) {
    return { q: R`A ${N(v.m)} kg spacecraft burns ${v.mp} kg of hydrazine at ${v.I} s. Find Δv.`, f: [['Δv', v.I * 9.807 * ln(v.m / (v.m - v.mp)), 'm/s', 0.01]] }; });
  S(28, 6, [['Thrust', 1.6 * 4.64e6 * 0.005 / 1000, 'kN', 0.015]]);
  (function () {
    var gs = [['nitrogen', 1.4, 296.8], ['helium', 1.667, 2077], ['argon', 1.667, 208.1], ['carbon dioxide', 1.289, 188.9]];
    T(28, 8, { k: [0, [1, 2, 3]], T: [300, [250, 300, 350]] }, function (v) {
      var g = gs[v.k];
      return { q: R`Find the ideal (fully expanded) cold-gas \(I_{sp}\) for ${g[0]} at ${v.T} K (\(\gamma\) = ${g[1]}, \(R\) = ${g[2]} J/(kg·K)).`, f: [[R`\(I_{sp}\)`, sqrt(2 * g[1] * g[2] * v.T / (g[1] - 1)) / 9.807, 's', 0.01]] }; });
  })();
  X(28, 'C', R`A certified commercial solid motor is labelled with a letter and a number, for example J350. What do the letter and number mean in terms of total impulse and average thrust?`,
    R`The letter is the total-impulse class: each letter doubles the range of the one before (A is up to 2.5 N·s, so J is 640.01–1280 N·s). The number is the average thrust in newtons, so burn time is roughly total impulse divided by that number.`);
  X(28, 'C', R`Why does the oxidizer-to-fuel ratio of a simple hybrid shift during the burn, while a liquid engine can hold it constant?`,
    R`Hybrid fuel flow depends on the regression rate, which falls as the port widens and oxidizer mass flux drops, while the oxidizer flow is set by the feed system. A liquid engine meters both propellants independently with valves or pumps.`);

  /* ───────── Ch 29 · Orbital mechanics I ───────── */
  function hoh(r1, r2) { var at = (r1 + r2) / 2, v1 = sqrt(MU / r1), v2 = sqrt(MU / r2), vp = sqrt(MU * (2 / r1 - 1 / at)), va = sqrt(MU * (2 / r2 - 1 / at)); return { v1: v1, v2: v2, vp: vp, va: va, dv1: vp - v1, dv2: v2 - va, t: PI * sqrt(at * at * at / MU) }; }
  T(29, 1, { h: [300, [200, 400, 500, 800, 1000]] }, function (v) {
    var x = hoh(6378 + v.h, 42164);
    return { q: R`Compute a Hohmann transfer from a ${v.h} km circular LEO (\(r\) = ${N(6378 + v.h)} km) to GEO (\(r\) = 42 164 km): both Δv’s, the total, and the transfer time.`,
      f: [[R`\(\Delta v_1\)`, x.dv1, 'km/s', 0.005], [R`\(\Delta v_2\)`, x.dv2, 'km/s', 0.005], ['Total Δv', x.dv1 + x.dv2, 'km/s', 0.005], ['Transfer time', x.t / 3600, 'h', 0.01]] }; });
  T(29, 2, { i: [28.5, [5.2, 37.9, 45.9, 51.6]] }, function (v) {
    var x = hoh(6678, 42164);
    return { q: R`A Hohmann transfer from a 300 km LEO reaches GEO radius with apogee speed 1.608 km/s; GEO speed is 3.075 km/s. Starting at ${v.i}° inclination, find the Δv to combine circularization with the plane change to 0°, and the Δv doing them separately.`,
      f: [['Combined burn', sqrt(x.va * x.va + x.v2 * x.v2 - 2 * x.va * x.v2 * cos(rad(v.i))), 'km/s', 0.01], ['Separate burns', x.dv2 + 2 * x.v2 * sin(rad(v.i / 2)), 'km/s', 0.01]] }; });
  T(29, 3, { a: [7000, [6700, 8000, 10000, 26560, 42164]] }, function (v) {
    return { q: R`Find the period of an orbit with \(a\) = ${N(v.a)} km.`, f: [['Period', 2 * PI * sqrt(pow(v.a, 3) / MU) / 60, 'min', 0.005]] }; });
  T(29, 4, { r: [8000, [7000, 9000, 10000, 12000]], f: [1.13333, [1.05, 1.1, 1.2, 1.3]] }, function (v) {
    var V = v.f === 1.13333 && v.r === 8000 ? 8 : +(v.f * sqrt(MU / v.r)).toFixed(2), en = V * V / 2 - MU / v.r, a = -MU / (2 * en), e = 1 - v.r / a;
    return { q: R`A spacecraft at \(r\) = ${N(v.r)} km moves horizontally at ${V} km/s. Find \(a\), \(e\) and \(r_a\).`, f: [['a', a, 'km', 0.01], ['e', e, '', 0.02], [R`\(r_a\)`, a * (1 + e), 'km', 0.015]] }; });
  T(29, 5, { c3: [10, [5, 15, 20, 30, 50]] }, function (v) {
    return { q: R`Find the Δv to depart a 300 km circular orbit (\(r\) = 6678 km) with \(C_3\) = ${v.c3} km²/s².`, f: [['Δv', sqrt(v.c3 + 2 * MU / 6678) - sqrt(MU / 6678), 'km/s', 0.005]] }; });
  T(29, 6, { i: [51.6, [35, 45, 60, 75, 90]] }, function (v) {
    return { q: R`What launch azimuth from latitude 28.5° reaches \(i\) = ${v.i}° (non-rotating Earth, northerly solution)?`, f: [['Azimuth', deg(Math.asin(cos(rad(v.i)) / cos(rad(28.5)))), '°', { abs: 0.6 }]] }; });
  T(29, 7, { e: [0.2, [0.1, 0.3, 0.5]], a: [10000, [8000, 15000, 20000]], nu: [90, [60, 120]] }, function (v) {
    var E = 2 * Math.atan(sqrt((1 - v.e) / (1 + v.e)) * tan(rad(v.nu) / 2)), M = E - v.e * sin(E);
    return { q: R`For \(e\) = ${v.e} and \(a\) = ${N(v.a)} km, find the time from periapsis to \(\nu\) = ${v.nu}°.`, f: [['Eccentric anomaly E', E, 'rad', 0.01], ['Time', M / sqrt(MU / pow(v.a, 3)), 's', 0.01]] }; });
  X(29, 'C', R`State the vis-viva equation and use it to explain why a spacecraft is fastest at periapsis.`,
    R`\(v^{2} = \mu(2/r - 1/a)\): specific orbital energy \(v^{2}/2 - \mu/r = -\mu/(2a)\) is constant. At the smallest \(r\) the potential energy is lowest, so kinetic energy and speed are greatest.`);
  X(29, 'C', R`A two-line element set gives mean motion in revolutions per day. How do you obtain the semi-major axis from it, and what orbit feature does eccentricity then add?`,
    R`Convert mean motion to rad/s, \(n = 2\pi N/86400\), and use \(n = \sqrt{\mu/a^{3}}\), so \(a = (\mu/n^{2})^{1/3}\). With \(e\), perigee and apogee radii follow as \(a(1 \mp e)\).`);
  X(29, 'I', R`Kepler’s equation \(M = E - e\sin E\) has no closed-form solution for \(E\). Which method from Chapter 14 solves it, and why does it converge quickly for moderate \(e\)?`,
    R`Newton’s method: \(E_{k+1} = E_k - (E_k - e\sin E_k - M)/(1 - e\cos E_k)\). The function is smooth with derivative bounded away from zero for \(e<1\), so convergence is quadratic from the starting guess \(E_0 = M\).`, [14]);

  /* ───────── Ch 30 · Astrodynamics II ───────── */
  T(30, 1, { h: [700, [500, 600, 800, 900, 1000]] }, function (v) {
    var a = 6378 + v.h, n = sqrt(MU / pow(a, 3)), ci = -1.991e-7 / (1.5 * n * 1.08263e-3 * pow(6378 / a, 2));
    return { q: R`Find the sun-synchronous inclination for a ${v.h} km circular orbit (\(J_2\) = 1.08263 × 10⁻³, required \(\dot\Omega\) = 1.991 × 10⁻⁷ rad/s).`, f: [['Inclination', deg(Math.acos(ci)), '°', { abs: 0.15 }]] }; });
  (function () {
    var pl = [['Mars', 1.5237], ['Venus', 0.7233], ['Jupiter', 5.2028], ['Mercury', 0.3871], ['Saturn', 9.5371]];
    T(30, 2, { k: [0, [1, 2, 3, 4]] }, function (v) {
      var mu = 1.32712e11, AU = 1.495979e8, r1 = AU, r2 = pl[v.k][1] * AU, at = (r1 + r2) / 2, ve = sqrt(mu / r1), vt = sqrt(mu * (2 / r1 - 1 / at)), vp = sqrt(mu / r2), va = sqrt(mu * (2 / r2 - 1 / at));
      return { q: R`Compute the heliocentric Hohmann transfer from Earth (1 AU) to ${pl[v.k][0]} (${pl[v.k][1]} AU): departure and arrival \(v_\infty\) and the transfer time (\(\mu_\odot\) = 1.32712 × 10¹¹ km³/s², 1 AU = 1.495979 × 10⁸ km).`,
        f: [[R`Departure \(v_\infty\)`, Math.abs(vt - ve), 'km/s', 0.01], [R`Arrival \(v_\infty\)`, Math.abs(vp - va), 'km/s', 0.012], ['Transfer time', PI * sqrt(pow(at, 3) / mu) / 86400, 'days', 0.01]] }; });
  })();
  T(30, 3, { vi: [2.94, [2.5, 3.5, 4, 6, 8.8]] }, function (v) {
    return { q: R`Find the Δv to inject from a 300 km circular parking orbit (\(r\) = 6678 km) with \(v_\infty\) = ${v.vi} km/s.`, f: [['Δv', sqrt(v.vi * v.vi + 2 * MU / 6678) - sqrt(MU / 6678), 'km/s', 0.005]] }; });
  T(30, 4, { vi: [5, [3, 7, 10]], h: [300, [500, 1000, 2000]] }, function (v) {
    var e = 1 + (6051.8 + v.h) * v.vi * v.vi / 324859;
    return { q: R`A spacecraft passes Venus (\(\mu\) = 324 859 km³/s², \(R\) = 6051.8 km) at ${N(v.h)} km altitude with \(v_\infty\) = ${v.vi} km/s. Find the flyby eccentricity and turn angle.`, f: [['Eccentricity', e, '', 0.01], ['Turn angle', 2 * deg(Math.asin(1 / e)), '°', 0.01]] }; });
  T(30, 5, { h: [400, [300, 500, 600, 800]], dr: [1, [0.5, 2, 5]] }, function (v) {
    return { q: R`For a target at ${v.h} km altitude, find \(n\) and the along-track drift per orbit of a chaser ${v.dr} km below it.`, f: [['n', sqrt(MU / pow(6378 + v.h, 3)) * 1000, '×10⁻³ rad/s', 0.005], ['Drift per orbit', 3 * PI * v.dr, 'km', 0.01]] }; });
  T(30, 7, { b: [100, [50, 200, 400]], rho: [3, [1, 5, 10]] }, function (v) {
    var r = 6778e3, mu = 3.986e14, vv = sqrt(mu / r);
    return { q: R`A satellite at 400 km (\(r\) = 6778 km) has \(\beta\) = ${v.b} kg/m² and \(\rho\) = ${v.rho} × 10⁻¹² kg/m³. Find the drag acceleration and the decay rate in metres per day.`, f: [['Drag acceleration', 0.5 * v.rho * 1e-12 * vv * vv / v.b * 1e7, '×10⁻⁷ m/s²', 0.02], ['Decay rate', v.rho * 1e-12 * sqrt(mu * r) / v.b * 86400, 'm/day', 0.02]] }; });
  T(30, 8, { di: [28.5, [0, 10, 45, 51.6]] }, function (v) {
    var v0 = sqrt(MU / 7000), v1 = sqrt(MU / 42164);
    return { q: R`Use Edelbaum’s formula for a low-thrust transfer from a 7000 km circular orbit to GEO (\(r\) = 42 164 km) with a ${v.di}° plane change.`, f: [['Low-thrust Δv', sqrt(v0 * v0 + v1 * v1 - 2 * v0 * v1 * cos(PI / 2 * rad(v.di))), 'km/s', 0.01]] }; });
  X(30, 'C', R`How does Earth’s oblateness (\(J_2\)) change an orbit over time, and how do mission designers exploit it?`,
    R`\(J_2\) leaves \(a\), \(e\) and \(i\) unchanged on average but makes the orbit plane precess (nodal regression) and the perigee rotate. Choosing \(a\) and \(i\) so the node precesses 360° per year gives a sun-synchronous orbit; \(i\) = 63.4° freezes the perigee (Molniya).`);
  X(30, 'C', R`In the Clohessy–Wiltshire picture, why does a chaser in a slightly lower orbit move ahead of the target?`,
    R`A lower orbit has a shorter period (higher mean motion), so the chaser gains angle on the target each revolution: an along-track drift of \(3\pi\,\Delta r\) per orbit for a radial offset \(\Delta r\).`);

  /* ───────── Ch 31 · Launch-vehicle flight mechanics ───────── */
  (function () {
    var alt = [[12, 0.3119], [10, 0.4135], [11, 0.3648], [14, 0.2279], [9, 0.4671]];
    T(31, 1, { k: [0, [1, 2, 3, 4]], V: [450, 300, 650, 25] }, function (v) {
      var a = alt[v.k];
      return { q: R`Find the dynamic pressure at ${a[0]} km (\(\rho\) = ${a[1]} kg/m³) and ${v.V} m/s.`, f: [['q', 0.5 * a[1] * v.V * v.V / 1000, 'kPa', 0.01]] }; });
  })();
  T(31, 2, { t: [150, [120, 160, 180]], s: [0.6, [0.5, 0.7, 0.8]] }, function (v) {
    return { q: R`Over a ${v.t} s first-stage burn the average \(\sin\gamma\) is ${v.s} and \(g\) = 9.7 m/s². Estimate the gravity loss.`, f: [['Gravity loss', v.s * 9.7 * v.t, 'm/s', 0.01]] }; });
  T(31, 3, { a: [5, [2, 3, 8, 10]], tm: [20, [15, 25, 30]], t: [100, [60, 150]] }, function (v) {
    return { q: R`Find the steering loss for a constant ${v.a}° angle of attack with average \(T/m\) = ${v.tm} m/s² over ${v.t} s.`, f: [['Steering loss', v.tm * v.t * (1 - cos(rad(v.a))), 'm/s', 0.02]] }; });
  T(31, 4, { V: [250, [150, 200, 300, 350]], tw: [3, [2, 2.5, 4]] }, function (v) {
    var a = (v.tw - 1) * 9.807;
    return { q: R`A stage falls vertically at ${v.V} m/s. With constant thrust giving \(T/W\) = ${v.tw} (ignore drag and mass change), find the landing-burn duration and ignition altitude.`, f: [['Burn duration', v.V / a, 's', 0.015], ['Ignition altitude', v.V * v.V / (2 * a) / 1000, 'km', 0.015]] }; });
  T(31, 6, { az: [45, [35, 60, 75, 90]] }, function (v) {
    return { q: R`Launching from 28.5° latitude at azimuth ${v.az}°, how much of Earth’s rotational velocity (408.7 m/s eastward) helps along the trajectory?`, f: [['Rotation credit', 408.7 * sin(rad(v.az)), 'm/s', 0.01]] }; });
  T(31, 7, { g: [1.2, [1.1, 1.4, 1.6]], d: [0.15, [0.1, 0.2]], s: [0.1, [0.05, 0.15]], r: [0.4, [0.3, 0.46]] }, function (v) {
    return { q: R`Build a LEO Δv budget: orbital speed 7.73 km/s, gravity loss ${v.g}, drag ${v.d}, steering ${v.s}, rotation credit ${v.r} km/s.`, f: [['Required Δv', 7.73 + v.g + v.d + v.s - v.r, 'km/s', 0.003]] }; });
  X(31, 'C', R`What is max-Q, and why do launch vehicles often throttle down around it?`,
    R`Max-Q is the peak of dynamic pressure \(q = \tfrac12\rho V^{2}\), where rising speed and falling density trade off (typically 10–15 km). Aerodynamic loads scale with \(q\) and \(q\alpha\), so thrust is reduced to cap structural loads through that region.`);
  X(31, 'C', R`In a propulsive landing with a minimum throttle above hover thrust, why must the landing burn be timed precisely (a “hoverslam”)?`,
    R`With \(T/W > 1\) even at minimum throttle the stage cannot hover: it decelerates continuously. Ignition must be timed so that velocity reaches zero exactly at zero altitude; starting early leaves it climbing again, starting late leaves residual impact speed.`);
  X(31, 'I', R`Why is the gravity-turn pitch-over begun shortly after liftoff rather than at high altitude? Use the gravity-loss integral \(\int g\sin\gamma\,dt\).`,
    R`Gravity loss accumulates only while the flight path is steep (\(\sin\gamma\) near 1). Turning early reduces \(\sin\gamma\) sooner and so cuts the loss, but too early a turn raises drag and aerodynamic loads in dense air; the pitch-over is a compromise.`, [26]);

  /* ───────── Ch 32 · Attitude dynamics ───────── */
  T(32, 1, { th: [90, [30, 45, 60, 120, 180]] }, function (v) {
    return { q: R`Write the quaternion for a ${v.th}° rotation about \(z\) (scalar first).`, f: [[R`\(q_0\) (scalar)`, cos(rad(v.th / 2)), '', { abs: 0.006 }], [R`\(q_3\) (z)`, sin(rad(v.th / 2)), '', { abs: 0.006 }]] }; });
  T(32, 2, { dI: [100, [10, 50, 500, 1000]], h: [400, [500, 600, 800]] }, function (v) {
    return { q: R`Estimate the maximum gravity-gradient torque for \(|I_z - I_y|\) = ${N(v.dI)} kg·m² at ${v.h} km altitude.`, f: [['Torque', 1.5 * 3.986e14 / pow((6378 + v.h) * 1000, 3) * v.dI * 1e4, '×10⁻⁴ N·m', 0.03]] }; });
  T(32, 3, { tq: [1, [0.5, 2, 5]] }, function (v) {
    return { q: R`A secular torque of ${v.tq} × 10⁻⁴ N·m acts for one 5553 s orbit. How much wheel momentum storage is needed?`, f: [['Momentum', v.tq * 1e-4 * 5553, 'N·m·s', 0.02]] }; });
  T(32, 4, { th: [90, [30, 45, 180]], tq: [0.1, [0.05, 0.2, 0.5]], I: [100, [50, 200, 500]] }, function (v) {
    return { q: R`Find the rest-to-rest bang-bang slew time for ${v.th}° with \(\tau_{\max}\) = ${v.tq} N·m and \(I\) = ${v.I} kg·m².`, f: [['Slew time', 2 * sqrt(rad(v.th) * v.I / v.tq), 's', 0.015]] }; });
  T(32, 6, { a: [3, [2, 4, 5]], q: [30, [20, 40]] }, function (v) {
    var Nf = v.q * 1000 * 10 * 2.5 * rad(v.a);
    return { q: R`At \(q\) = ${v.q} kPa, \(S\) = 10 m², \(C_{N\alpha}\) = 2.5 /rad and \(\alpha\) = ${v.a}°, the CP lies 8 m ahead of the CG. A 2 MN engine acts 20 m behind the CG. Find the normal force and the gimbal angle needed to trim.`, f: [['Normal force', Nf / 1000, 'kN', 0.01], ['Gimbal angle', deg(Math.asin(Nf * 8 / (2e6 * 20))), '°', 0.03]] }; });
  T(32, 8, { Rr: [2, [1, 1.5, 3]], n: [2, [1, 3, 4]] }, function (v) {
    var w = sqrt(1.841 * v.n * 9.807 / v.Rr * Math.tanh(1.841 * 4 / v.Rr));
    return { q: R`Find the first slosh frequency for a tank of \(R\) = ${v.Rr} m and \(h\) = 4 m at ${v.n}g axial acceleration.`, f: [[R`\(\omega\)`, w, 'rad/s', 0.015], ['f', w / (2 * PI), 'Hz', 0.02]] }; });
  X(32, 'C', R`Why can a spinning body be stable about its axis of greatest moment of inertia but not, in the long run, about its axis of least inertia?`,
    R`Angular momentum is conserved but real bodies dissipate energy (flexing, slosh). For fixed \(H\), kinetic energy \(H^{2}/(2I)\) is lowest for the largest \(I\), so dissipation drives the spin toward the major axis; minor-axis spin slowly diverges into a flat spin.`);
  X(32, 'C', R`How do reaction wheels control attitude without expelling mass, and why must they eventually be desaturated?`,
    R`Accelerating a wheel applies an equal and opposite torque to the spacecraft; total angular momentum is conserved. A persistent external torque makes the wheel speed build up until it reaches its limit, so thrusters or magnetic torquers must dump the stored momentum.`);

  /* ───────── Ch 33 · Structures and loads ───────── */
  T(33, 1, { al: [450, [400, 500, 600]], ap: [300, [250, 320, 350]], fs: [1.4, [1.25, 1.5]] }, function (v) {
    return { q: R`Find the margin of safety for an allowable of ${v.al} MPa, an applied stress of ${v.ap} MPa and FS = ${v.fs}.`, f: [['Margin of safety', v.al / (v.fs * v.ap) - 1, '', { abs: 0.006 }]] }; });
  T(33, 2, { Pp: [1, [0.5, 2, 3]], M: [2, [1, 4, 6]], Rr: [2, [1.5, 2.5, 4]] }, function (v) {
    var pe = v.Pp + 2 * v.M / v.Rr;
    return { q: R`A ${v.Rr} m radius cylinder carries ${v.Pp} MN of compression and a ${v.M} MN·m bending moment. Find \(P_{eq}\) and the peak compressive line load.`, f: [[R`\(P_{eq}\)`, pe, 'MN', 0.01], ['Peak line load', pe * 1e6 / (2 * PI * v.Rr) / 1000, 'kN/m', 0.01]] }; });
  T(33, 3, { f: [100, [50, 200, 400]], Q: [10, [15, 20, 25]], A: [0.04, [0.01, 0.1, 0.2]] }, function (v) {
    return { q: R`Use Miles’ equation for \(f_n\) = ${v.f} Hz, \(Q\) = ${v.Q} and ASD = ${v.A} g²/Hz.`, f: [[R`\(G_{rms}\)`, sqrt(PI / 2 * v.f * v.Q * v.A), 'g', 0.015]] }; });
  function kd(rt) { return 1 - 0.901 * (1 - exp(-sqrt(rt) / 16)); }
  T(33, 4, { rt: [400, [100, 200, 800, 1000, 1500]] }, function (v) {
    return { q: R`Find the SP-8007 knockdown factor for \(R/t\) = ${N(v.rt)}.`, f: [['Knockdown factor γ', kd(v.rt), '', 0.015]] }; });
  T(33, 5, { rt: [400, [200, 800, 1000]] }, function (v) {
    var s = 70000 / v.rt / sqrt(3 * (1 - 0.33 * 0.33));
    return { q: R`Find the classical and knocked-down buckling stresses of an aluminum cylinder (\(E\) = 70 GPa, \(\nu\) = 0.33, \(R/t\) = ${N(v.rt)}).`, f: [['Classical buckling stress', s, 'MPa', 0.01], ['Knocked-down stress', s * kd(v.rt), 'MPa', 0.02]] }; });
  T(33, 7, { m: [25, [5, 10, 50, 100]], k: [1e7, [1e6, 4e6, 4e7]] }, function (v) {
    return { q: R`Find the natural frequency of a ${v.m} kg component on a mount of stiffness ${N(v.k)} N/m.`, f: [[R`\(f_n\)`, sqrt(v.k / v.m) / (2 * PI), 'Hz', 0.01]] }; });
  X(33, 'C', R`Distinguish limit load, ultimate load and margin of safety, and say why a margin of exactly zero is acceptable.`,
    R`Limit load is the maximum expected in service; ultimate load is limit times the factor of safety; \(MS = \text{allowable}/(\text{FS}\times\text{applied}) - 1\). The factor of safety already carries the required conservatism, so \(MS \ge 0\) means the requirement is met.`);
  X(33, 'C', R`A centering ring in a model rocket transfers motor thrust to the airframe. Describe the load path and the two failure modes you would check.`,
    R`Thrust passes from the motor mount tube through the bonded ring into the airframe wall as shear at the two glue joints and bending of the ring between them. Check bond shear stress at the inner and outer joints, and bending or crushing of the ring itself.`);

  /* ───────── Ch 34 · Avionics, navigation, comms ───────── */
  T(34, 1, { E: [40, [30, 50, 60]], L: [200, [180, 190, 210]], G: [20, [10, 30]], Rb: [6, [4, 5, 7]] }, function (v) {
    return { q: R`Find \(E_b/N_0\) for EIRP = ${v.E} dBW, path loss ${v.L} dB, other losses 3 dB, \(G/T\) = ${v.G} dB/K and \(R_b\) = 10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[v.Rb]} bit/s.`, f: [[R`\(E_b/N_0\)`, v.E - v.L - 3 + v.G + 228.6 - 10 * v.Rb, 'dB', { abs: 0.2 }]] }; });
  T(34, 2, { D: [1, [0.5, 2, 3.7, 34]], f: [8.4, [2.2, 26, 32]] }, function (v) {
    return { q: R`Find the gain of a ${v.D} m dish at ${v.f} GHz with 60% efficiency.`, f: [['Gain', 10 * log10(0.6 * pow(PI * v.D / (P.C / (v.f * 1e9)), 2)), 'dBi', { abs: 0.3 }]] }; });
  T(34, 3, { B: [1, [0.5, 2, 10]], s: [15, [3, 7, 31, 63]] }, function (v) {
    return { q: R`Find the Shannon capacity for \(B\) = ${v.B} MHz and \(S/N\) = ${v.s}.`, f: [['Capacity', v.B * Math.log2(1 + v.s), 'Mbit/s', 0.01]] }; });
  T(34, 4, { b: [1, [0.01, 0.1, 10]], t: [10, [5, 30, 60, 90]] }, function (v) {
    return { q: R`An uncorrected gyro bias of ${v.b}°/h acts for ${v.t} minutes. Find the attitude error.`, f: [['Attitude error', v.b * v.t / 60, '°', 0.03]] }; });
  T(34, 5, { b: [1, [0.1, 0.5, 2, 5]], t: [60, [30, 120, 300, 600]] }, function (v) {
    return { q: R`An uncorrected ${v.b} mg accelerometer bias acts for ${v.t} s. Find the position error.`, f: [['Position error', 0.5 * v.b * 9.807e-3 * v.t * v.t, 'm', 0.01]] }; });
  T(34, 7, { n: [-114, [-120, -104, -110]], r: [-100, [-110, -90, -95]] }, function (v) {
    return { q: R`A receiver has a noise floor of ${N(v.n)} dBm and receives ${N(v.r)} dBm. Find the SNR.`, f: [['SNR', v.r - v.n, 'dB', { abs: 0.2 }]] }; });
  (function () {
    var bd = [['Earth', 6.371e6, 9.807], ['the Moon', 1.7374e6, 1.62], ['Mars', 3.3895e6, 3.71]];
    T(34, 8, { k: [0, [1, 2]] }, function (v) {
      var b = bd[v.k];
      return { q: R`Compute the Schuler period at the surface of ${b[0]} (\(R\) = ${N(b[1] / 1000)} km, \(g\) = ${b[2]} m/s²).`, f: [['Schuler period', 2 * PI * sqrt(b[1] / b[2]) / 60, 'min', 0.01]] }; });
  })();
  X(34, 'C', R`Why does an inertial navigation system’s position error grow with time even with perfect initial alignment, and how is the growth bounded in practice?`,
    R`Small accelerometer and gyro biases are integrated once into velocity and twice into position, so errors grow as \(t^{2}\) or faster. Aiding with an independent absolute reference (GNSS, star tracker, radar altimeter) through a Kalman filter bounds the drift.`);
  X(34, 'C', R`A flight-data pipeline receives telemetry packets with a sequence counter and a checksum. What two failure classes do these fields let ground software detect, and what should it do in each case?`,
    R`The sequence counter reveals dropped, duplicated or out-of-order packets (flag the gap, never silently interpolate). The checksum reveals bit corruption inside a packet (discard or quarantine it). Both should be logged with counts so data quality is visible to analysts.`);

  /* ───────── Ch 35 · Systems engineering ───────── */
  T(35, 1, { a: [1e-3, [1e-4, 5e-3]], b: [1e-2, [5e-2, 1e-1]], c: [2e-2, [1e-2, 5e-2]] }, function (v) {
    return { q: R`Top event = A OR (B AND C), with independent probabilities ${N(v.a)}, ${N(v.b)} and ${N(v.c)}. Find \(P(\text{top})\).`, f: [['P(top)', (v.a + v.b * v.c - v.a * v.b * v.c) * 1000, '×10⁻³', 0.01]] }; });
  T(35, 2, { r: [90, [80, 85, 95]], n: [8, [2, 4, 16, 32]] }, function (v) {
    return { q: R`With a ${v.r}% learning curve, what does unit ${v.n} cost relative to the first?`, f: [['Relative cost', pow(v.r / 100, Math.log2(v.n)), '', 0.01]] }; });
  T(35, 3, { mt: [10000, [5000, 20000, 50000]], t: [1000, [100, 500, 2000, 5000]] }, function (v) {
    return { q: R`A component has an MTBF of ${N(v.mt)} h. Find its reliability over a ${N(v.t)} h mission.`, f: [['Reliability', exp(-v.t / v.mt), '', 0.005]] }; });
  T(35, 4, { c: [800, [600, 700, 850, 900]] }, function (v) {
    return { q: R`The current best estimate of mass is ${v.c} kg and the allowable is 1000 kg. State the margin as a percentage of each basis.`, f: [['Margin, % of CBE', (1000 - v.c) / v.c * 100, '%', 0.015], ['Margin, % of allowable', (1000 - v.c) / 10, '%', 0.015]] }; });
  T(35, 6, { n: [20, [5, 10, 50, 100]] }, function (v) {
    return { q: R`With a uniform prior, a vehicle has ${v.n} successes in ${v.n} flights. Find the posterior mean failure probability (Laplace’s rule).`, f: [['Failure probability', 1 / (v.n + 2), '', 0.02]] }; });
  X(35, 'C', R`What is the difference between a requirement and a design solution, and why should requirements avoid stating solutions?`,
    R`A requirement states what the system must do and how well, in verifiable terms; a design is one way to do it. Embedding a solution in a requirement closes off better designs and makes the requirement untestable against the real need.`);
  X(35, 'C', R`Why does adding a redundant unit not always raise system reliability as much as the simple parallel formula predicts?`,
    R`The formula assumes independent failures. Common-cause failures (shared power, software, environment, design flaw) defeat all units together, and the switching or voting logic that manages redundancy adds its own failure modes.`);
  X(35, 'I', R`A component has a constant failure rate. Using the exponential model from Chapter 13, show that the probability of surviving two missions in a row equals the square of surviving one.`,
    R`\(R(t) = e^{-\lambda t}\), so \(R(2t) = e^{-2\lambda t} = [R(t)]^{2}\). A constant hazard rate has no memory: each mission is an independent trial with the same survival probability.`, [13]);
})(typeof window !== 'undefined' ? window : globalThis);
