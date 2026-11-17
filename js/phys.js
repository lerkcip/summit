/* SUMMIT · shared numerics: constants, gas dynamics, statistics, seeded RNG */
(function (G) {
  'use strict';
  var P = {};
  P.g0 = 9.80665; P.MU = 398600; P.RE = 6378; P.RU = 8314.46; P.SIG = 5.670e-8;
  P.KB = 1.381e-23; P.QE = 1.602e-19; P.ME = 9.109e-31; P.AMU = 1.661e-27;
  P.EPS0 = 8.854e-12; P.MU0 = 4e-7 * Math.PI; P.C = 299792458; P.OME = 7.2921e-5;
  P.rad = function (d) { return d * Math.PI / 180; };
  P.deg = function (r) { return r * 180 / Math.PI; };
  P.erf = function (x) { // series / continued fraction, ~1e-10
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    if (x < 2.5) { var sum = x, term = x, n = 0; while (Math.abs(term) > 1e-16 * Math.abs(sum) && n < 200) { n++; term *= -x * x / n; sum += term / (2 * n + 1); } return s * 2 / Math.sqrt(Math.PI) * sum; }
    var t = 1 / (1 + 0.5 * x);
    var y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return s * (1 - y);
  };
  P.Phi = function (z) { return 0.5 * (1 + P.erf(z / Math.SQRT2)); };
  function bis(f, a, b, n) { var fa = f(a); for (var i = 0; i < (n || 80); i++) { var m = (a + b) / 2, fm = f(m); if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }
  P.bis = bis;
  // ---- isentropic / nozzle ----
  P.T0T = function (M, g) { g = g || 1.4; return 1 + (g - 1) / 2 * M * M; };
  P.p0p = function (M, g) { g = g || 1.4; return Math.pow(P.T0T(M, g), g / (g - 1)); };
  P.AAs = function (M, g) { g = g || 1.4; return (1 / M) * Math.pow(2 / (g + 1) * P.T0T(M, g), (g + 1) / (2 * (g - 1))); };
  P.MfromA = function (ar, g, sub) { g = g || 1.4; return sub ? bis(function (M) { return P.AAs(M, g) - ar; }, 1e-4, 1) : bis(function (M) { return P.AAs(M, g) - ar; }, 1, 60); };
  P.Gam = function (g) { return Math.sqrt(g) * Math.pow(2 / (g + 1), (g + 1) / (2 * (g - 1))); };
  // ---- shocks ----
  P.ns = function (M, g) {
    g = g || 1.4; var M2 = Math.sqrt((1 + (g - 1) / 2 * M * M) / (g * M * M - (g - 1) / 2));
    var p = 1 + 2 * g / (g + 1) * (M * M - 1), rho = (g + 1) * M * M / ((g - 1) * M * M + 2), T = p / rho;
    return { M2: M2, p: p, rho: rho, T: T, p0: P.p0p(M2, g) * p / P.p0p(M, g) };
  };
  P.thetaB = function (M, bDeg, g) { g = g || 1.4; var b = P.rad(bDeg); return P.deg(Math.atan(2 / Math.tan(b) * (M * M * Math.sin(b) * Math.sin(b) - 1) / (M * M * (g + Math.cos(2 * b)) + 2))); };
  P.thetaMax = function (M, g) { var best = { theta: 0, beta: 0 }, mu = P.deg(Math.asin(1 / M)); for (var b = mu; b <= 90; b += 0.005) { var t = P.thetaB(M, b, g); if (t > best.theta) best = { theta: t, beta: b }; } return best; };
  P.betaWeak = function (M, thDeg, g) { var mu = P.deg(Math.asin(1 / M)) + 1e-9, bm = P.thetaMax(M, g).beta; return bis(function (b) { return P.thetaB(M, b, g) - thDeg; }, mu, bm); };
  P.oblique = function (M, thDeg, g) { g = g || 1.4; var b = P.betaWeak(M, thDeg, g), Mn = M * Math.sin(P.rad(b)), s = P.ns(Mn, g); return { beta: b, M2: s.M2 / Math.sin(P.rad(b - thDeg)), p: s.p, T: s.T, p0: s.p0 }; };
  P.nu = function (M, g) { g = g || 1.4; var k = Math.sqrt((g + 1) / (g - 1)); return P.deg(k * Math.atan(Math.sqrt(M * M - 1) / k) - Math.atan(Math.sqrt(M * M - 1))); };
  P.MfromNu = function (nuDeg, g) { return bis(function (M) { return P.nu(M, g) - nuDeg; }, 1, 80); };
  P.rayT0 = function (M, g) { g = g || 1.4; return 2 * (g + 1) * M * M * (1 + (g - 1) / 2 * M * M) / Math.pow(1 + g * M * M, 2); };
  P.fanno = function (M, g) { g = g || 1.4; return (1 - M * M) / (g * M * M) + (g + 1) / (2 * g) * Math.log((g + 1) * M * M / (2 + (g - 1) * M * M)); };
  P.pitot = function (M, g) { g = g || 1.4; var s = P.ns(M, g); return P.p0p(s.M2, g) * s.p; };
  // ---- misc ----
  P.kepler = function (Mm, e) { var E = Mm; for (var i = 0; i < 50; i++) E -= (E - e * Math.sin(E) - Mm) / (1 - e * Math.cos(E)); return E; };
  P.eig2 = function (a, b, d) { var m = (a + d) / 2, r = Math.sqrt((a - d) * (a - d) / 4 + b * b); return [m - r, m + r]; };
  // ---- seeded RNG ----
  P.hash = function (s) { var h = 2166136261 >>> 0; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  P.rng = function (seed) { var a = (typeof seed === 'number' ? seed : P.hash(seed)) >>> 0; var f = function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    f.int = function (lo, hi) { return lo + Math.floor(f() * (hi - lo + 1)); };
    f.pick = function (arr) { return arr[Math.floor(f() * arr.length)]; };
    f.range = function (lo, hi) { return lo + f() * (hi - lo); };
    f.gauss = function () { var u = 1 - f(), v = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    f.shuffle = function (arr) { var a2 = arr.slice(); for (var i = a2.length - 1; i > 0; i--) { var j = Math.floor(f() * (i + 1)); var t = a2[i]; a2[i] = a2[j]; a2[j] = t; } return a2; };
    return f; };
  // ---- number formatting for question text ----
  P.fmt = function (x, sig) {
    if (typeof x !== 'number' || !isFinite(x)) return String(x);
    if (x === 0) return '0';
    var ax = Math.abs(x);
    if (ax >= 1e7 || ax < 1e-3) { var e = Math.floor(Math.log10(ax)), m = x / Math.pow(10, e); m = +m.toPrecision(sig || 4); if (Math.abs(m) >= 10) { m /= 10; e++; } return (m === 1 ? '' : m + ' × ') + '10' + String(e).replace(/-/g, '⁻').replace(/\d/g, function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]; }); }
    var s = String(+x.toPrecision(sig || 6));
    if (ax >= 10000 && Number.isInteger(+s)) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return s.replace('-', '−');
  };
  G.PHYS = P;
  if (typeof module !== 'undefined') module.exports = P;
})(typeof window !== 'undefined' ? window : globalThis);
