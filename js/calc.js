/* SUMMIT · a small arithmetic evaluator (no eval). Numbers, + - * / ^, parentheses, pi, and
   sqrt sin cos tan asin acos atan atan2 ln log10 exp abs. Angles in radians. Returns NaN on anything else. */
(function (G) {
  'use strict';
  var F = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
    ln: Math.log, log10: function (x) { return Math.log(x) / Math.LN10; }, exp: Math.exp, abs: Math.abs };
  function calc(src) {
    if (typeof src !== 'string' || !src.trim() || src.length > 400) return NaN;
    var s = src.replace(/\*\*/g, '^').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/\s+/g, ''), i = 0;
    function expr() { var v = term(); while (s[i] === '+' || s[i] === '-') { var op = s[i++], r = term(); v = op === '+' ? v + r : v - r; } return v; }
    function term() { var v = unary(); while (s[i] === '*' || s[i] === '/') { var op = s[i++], r = unary(); v = op === '*' ? v * r : v / r; } return v; }
    function unary() { if (s[i] === '-') { i++; return -unary(); } if (s[i] === '+') { i++; return unary(); } return power(); }
    function power() { var b = prim(); if (s[i] === '^') { i++; return Math.pow(b, unary()); } return b; }
    function prim() {
      if (s[i] === '(') { i++; var v = expr(); if (s[i] !== ')') throw 0; i++; return v; }
      var m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(s.slice(i)); if (m) { i += m[0].length; return parseFloat(m[0]); }
      m = /^[a-z][a-z0-9]*/i.exec(s.slice(i)); if (!m) throw 0; i += m[0].length; var id = m[0].toLowerCase();
      if (id === 'pi') return Math.PI;
      if (!Object.prototype.hasOwnProperty.call(F, id) || s[i] !== '(') throw 0;
      i++; var args = [expr()]; while (s[i] === ',') { i++; args.push(expr()); } if (s[i] !== ')') throw 0; i++;
      if (args.length !== (id === 'atan2' ? 2 : 1)) throw 0;
      return F[id].apply(null, args);
    }
    try { var out = expr(); return i === s.length && isFinite(out) ? out : NaN; } catch (e) { return NaN; }
  }
  G.SUMMIT_CALC = calc;
  if (typeof module !== 'undefined') module.exports = calc;
})(typeof window !== 'undefined' ? window : globalThis);
