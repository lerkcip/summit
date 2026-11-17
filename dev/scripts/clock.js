// Test clock: window.__skew (ms) shifts Date.now() and new Date() so days can pass without waiting.
(function () { var R = Date; try { window.__skew = +(sessionStorage.getItem('skew') || 0); } catch (e) { window.__skew = 0; }
  function D() { var a = arguments; if (!(this instanceof D)) return R(); if (a.length === 0) return new R(R.now() + window.__skew); return new (Function.prototype.bind.apply(R, [null].concat([].slice.call(a))))(); }
  D.prototype = R.prototype; D.now = function () { return R.now() + window.__skew; }; D.parse = R.parse; D.UTC = R.UTC; window.Date = D;
  window.__addDays = function (n) { window.__skew += n * 864e5; try { sessionStorage.setItem('skew', String(window.__skew)); } catch (e) { } }; })();
