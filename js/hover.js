/* SUMMIT · Hoverslam Lab: write Python controllers that bring a booster back down onto its own launch pad.
   Python runs in the browser with Pyodide (in a Web Worker when possible, so a runaway loop can be stopped). */
(function () {
  'use strict';
  var S = window.S, h = S.h, E = S.E, PYD = window.HOVER_PY, R = String.raw;
  var CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  function urls() { if (window.SUMMIT_PY_URLS) return window.SUMMIT_PY_URLS; var u = [CDN]; if (window.SUMMIT_PY_LOCAL) u.push(new URL('vendor/pyodide/', location.href).href); return u; }

  /* ---------- Python runtime ---------- */
  var Py = S.Py = { st: 'idle', mode: '', w: null, seq: 0, wait: {}, err: '' };
  var WSRC = "var py=null;onmessage=async function(e){var m=e.data;try{if(m.cmd==='init'){importScripts(m.url+'pyodide.js');py=await loadPyodide({indexURL:m.url});py.runPython(m.harness);postMessage({id:m.id,ok:true});return;}py.globals.set('_code',m.code);py.globals.set('_args',m.args);var out=py.runPython('run(_code,_args)');postMessage({id:m.id,ok:true,out:out});}catch(err){postMessage({id:m.id,ok:false,err:String(err&&err.message||err)});}};";
  function call(msg, ms) {
    return new Promise(function (res, rej) {
      var id = ++Py.seq; msg.id = id;
      var t = setTimeout(function () { delete Py.wait[id]; rej(new Error('timeout')); }, ms);
      Py.wait[id] = function (m) { clearTimeout(t); if (m.ok) res(m.out); else rej(new Error(m.err)); };
      Py.w.postMessage(msg);
    });
  }
  async function initWorker(url) {
    var w = new Worker(URL.createObjectURL(new Blob([WSRC], { type: 'text/javascript' })));
    Py.w = w;
    w.onmessage = function (e) { var f = Py.wait[e.data.id]; if (f) { delete Py.wait[e.data.id]; f(e.data); } };
    w.onerror = function (e) { Object.keys(Py.wait).forEach(function (k) { var f = Py.wait[k]; delete Py.wait[k]; f({ ok: false, err: 'worker: ' + ((e && e.message) || 'could not start') }); }); };
    await call({ cmd: 'init', url: url, harness: PYD.harness }, 90000);
  }
  async function initMain(url) {
    if (!window.loadPyodide) await new Promise(function (res, rej) { var s = document.createElement('script'); s.src = url + 'pyodide.js'; s.onload = res; s.onerror = function () { rej(new Error('the Python loader was blocked')); }; document.head.append(s); });
    var py = await window.loadPyodide({ indexURL: url }); py.runPython(PYD.harness); Py.main = py;
  }
  Py.ensure = function (note) {
    if (Py.st === 'ready') return Promise.resolve();
    if (Py.st === 'loading') return Py.loading;
    Py.st = 'loading';
    Py.loading = (async function () {
      var us = urls(), errs = [], i;
      for (i = 0; i < us.length; i++) {
        try { note('Starting Python (first run takes a few seconds)…'); await initWorker(us[i]); Py.mode = 'worker'; Py.st = 'ready'; return; }
        catch (e) { errs.push(String(e.message || e)); try { if (Py.w) Py.w.terminate(); } catch (x) { /* ignore */ } Py.w = null; }
      }
      for (i = 0; i < us.length; i++) {
        try { note('Starting Python on the page…'); await initMain(us[i]); Py.mode = 'main'; Py.st = 'ready'; return; }
        catch (e2) { errs.push(String(e2.message || e2)); }
      }
      Py.st = 'failed'; Py.err = errs.join(' · '); throw new Error(Py.err);
    })();
    return Py.loading;
  };
  Py.run = async function (code, args, note) {
    await Py.ensure(note || function () { });
    var a = JSON.stringify(args);
    if (Py.mode === 'worker') {
      try { return JSON.parse(await call({ cmd: 'run', code: code, args: a }, 25000)); }
      catch (e) {
        if (e.message === 'timeout') { try { Py.w.terminate(); } catch (x) { /* ignore */ } Py.w = null; Py.st = 'idle'; throw new Error('Your code ran for more than 25 seconds and was stopped. Look for a loop that never ends.'); }
        throw e;
      }
    }
    Py.main.globals.set('_code', code); Py.main.globals.set('_args', a);
    return JSON.parse(Py.main.runPython('run(_code,_args)'));
  };

  /* ---------- levels ---------- */
  var LV = [
    { id: 0, t: 'Ballistic hop', sub: 'No control. Rebuild your Python basics.', req: { ch: [1, 5, 7] },
      brief: R`<p>A 1.6-tonne booster burns straight up and coasts. Nothing steers it and nothing slows it, so it comes back hard. Before you can land it you need to predict it.</p><p>Write five small functions: burn time, the rocket equation \(\Delta v = I_{sp}g_0\ln(m_0/m_f)\), burnout speed with gravity loss, coast apogee, and your own time-stepping loop. The lab tests each one, then flies the hop with drag so you can see what your no-drag numbers miss.</p><p class="small muted">Doc: §1.3 units, §5.2 kinematics, §7.2–7.3 thrust and the rocket equation.</p>`,
      hints: ['Burn time is propellant mass over mass flow. Gravity loss for a vertical burn is g times the burn time.', 'Coast: with no drag, v² = 2g(h − h_b), so the extra height is v_b²/(2g).', 'In simulate(): while burning, a = thrust/m − G. Update h with the old v, then v, then the mass (never below mf). Stop when h comes back to 0 after the first second.'] },
    { id: 1, t: 'Passive stability', sub: 'Fins and ballast: CP behind CG.', req: { ch: [7, 25], sec: { 7: '§7.6', 25: '§25.9' } },
      brief: R`<p>A finned rocket flies straight only if its centre of pressure sits behind its centre of gravity. The gap, in body diameters, is the static margin. Under one caliber it is twitchy; over two it weathercocks into every gust and carries fin or ballast mass for nothing.</p><p>Write the CG, CP and static-margin functions, then choose a fin span and nose ballast that put the margin between 1.0 and 2.0 calibers. The lab flies your design through a crosswind gust and compares its apogee with a clean 1.5-caliber design.</p><p class="small muted">Doc: §7.6 static stability, §25.9 static stability and control.</p>`,
      hints: ['CG and CP are both weighted averages: sum of (weight × position) over the sum of weights.', 'Static margin = (x_cp − x_cg) / d. Positive means stable.', 'Loop span from 0.03 to 0.25 m in 1 mm steps, compute the margin for each with rocket_parts() and rocket_cp(), and keep the one closest to 1.5.'] },
    { id: 2, t: 'Integrate the trajectory', sub: 'Euler, then RK4.', req: { ch: [8, 11, 14] },
      brief: R`<p>The flight is an ODE: \(\dot h = v\), \(\dot v = (T - D)/m - g\), \(\dot m = -\dot m_p\). Write the two workhorse steppers and let the lab measure them.</p><p>Explicit Euler uses one slope and is first order: halve the step and the error halves. Classical RK4 uses four slopes and is fourth order: halve the step and the error falls sixteenfold. The lab checks one step of each exactly, measures the observed order of both, and then flies a full ascent with your RK4.</p><p class="small muted">Doc: §8.8 rocket flight equations, §11.2 first-order ODEs, §14.4 ODE integration.</p>`,
      hints: ['Euler: [y_i + dt * k_i for y_i, k_i in zip(y, f(t, y))].', 'RK4: k1 = f(t, y); k2 = f(t + dt/2, y + dt/2·k1); k3 = f(t + dt/2, y + dt/2·k2); k4 = f(t + dt, y + dt·k3).', 'Combine: y + dt/6 · (k1 + 2·k2 + 2·k3 + k4), element by element.'] },
    { id: 3, t: 'PID pitch hold', sub: 'Stabilize an unstable booster with thrust-vector control.', req: { ch: [15, 22], sec: { 22: '§22.10' } },
      brief: R`<p>On the way up the booster is aerodynamically unstable in pitch: \(\ddot\theta = a\theta + b\delta\) with \(a > 0\). Left alone, any error grows. Your controller reads the pitch error and rate 100 times a second and commands the gimbal angle \(\delta\), which stops at ±6°.</p><p>With a PD law \(\delta = -K_p\theta - K_d\dot\theta\) the closed loop is \(s^{2} + bK_ds + (bK_p - a) = 0\): choose \(\omega_n\) and \(\zeta\), then solve for the gains. A steady wind torque leaves a constant error that only integral action removes. Pass: stable, peak error under 3°, steady error under 0.2°, gimbal off its stops.</p><p class="small muted">Doc: §22.10 stabilizing an unstable launch vehicle in pitch; Quiz 22 Q4.</p>`,
      hints: ['Kp must beat the instability: bKp − a = ωn². For a = 4, b = 2 and ωn = 5 rad/s, Kp = 14.5.', 'Kd = 2ζωn / b. With ζ = 0.8 and ωn = 5, Kd = 4.', 'Add Ki of roughly 0.5 to 1 times Kp and clamp the integral (anti-windup) to about ±0.2 rad·s so a gust cannot wind it up.'] },
    { id: 4, t: 'Rigid-body attitude', sub: 'Quaternions, Euler’s equations, a three-axis slew.', req: { ch: [10, 32] },
      brief: R`<p>After separation the booster is tumbling, 140° from where it should point. Cold-gas jets give up to 400 N·m about each body axis. Attitude is a unit quaternion \(q = [w, x, y, z]\); the lab integrates Euler’s equations with the gyroscopic coupling between axes.</p><p>Write the quaternion product, conjugate and error, then a control law. The error quaternion’s vector part is half the rotation needed for small angles, so \(\tau_i = -I_i(k_pe_i + k_d\omega_i)\) acts like three PD loops. Remember that \(q\) and \(-q\) are the same attitude: take the short way round. Pass: within 2° and 0.5°/s, held for 5 s.</p><p class="small muted">Doc: §10.6 rotations, §32.1–32.3 attitude kinematics and dynamics.</p>`,
      hints: ['Hamilton product, scalar first: w = p0q0 − p1q1 − p2q2 − p3q3; x = p0q1 + p1q0 + p2q3 − p3q2; y = p0q2 − p1q3 + p2q0 + p3q1; z = p0q3 + p1q2 − p2q1 + p3q0.', 'quat_error = quat_mul(quat_conj(q_target), q); if its first element is negative, negate all four.', 'Critically damped: kp = 2ωn², kd = 2ωn with ωn about 0.35 rad/s. The factor 2 on kp is because the vector part is half the angle.'] },
    { id: 5, t: 'Noisy sensors + Kalman filter', sub: 'Estimate altitude and speed, then time the burn from the estimate.', req: { ch: [13, 34], read: ['46.1'] },
      brief: R`<p>Real sensors lie a little. The radar altimeter is noisy (0.3 m plus 0.4% of altitude) and slow; the accelerometer is fast but biased, and it cannot feel gravity. A Kalman filter blends them: predict with the accelerometer, correct with the altimeter, and carry the covariance \(\mathbf P\) that says how much to trust each.</p><p>Predict: \(\hat{\mathbf x}^- = \mathbf F\hat{\mathbf x} + \mathbf Ba\), \(\mathbf P^- = \mathbf{FPF}^T + \mathbf Q\). Update: \(\mathbf K = \mathbf P^-\mathbf H^T(\mathbf{HP}^-\mathbf H^T + R)^{-1}\), \(\hat{\mathbf x} = \hat{\mathbf x}^- + \mathbf K(z - \mathbf H\hat{\mathbf x}^-)\), \(\mathbf P = (\mathbf I - \mathbf{KH})\mathbf P^-\). Here \(\mathbf H = [1\ 0]\), so everything is 2×2 arithmetic you can write out by hand. Then light the engine from your estimate: after ignition it holds the deceleration your filter says is needed.</p><p class="small muted">Doc: §13.7 estimation, §34.2 inertial sensor errors, §46.1 the Kalman filter (briefing).</p>`,
      hints: ['F P Fᵀ for F = [[1, dt], [0, 1]]: p00 + dt(p01 + p10) + dt²·p11; p01 + dt·p11; p11. Add Q built from an acceleration variance q: [[dt⁴/4, dt³/2], [dt³/2, dt²]]·q.', 'With H = [1, 0]: S = p00 + R; K = [p00/S, p10/S]; x += K·(z − h); P = [[(1−k0)p00, (1−k0)p01], [p10 − k1·p00, p11 − k1·p01]].', 'ignite: return v < 0 and v*v / (2*max(h, 1)) >= 16.'] },
    { id: 6, t: 'The hoverslam', sub: 'Throttled, fuel-optimal powered descent onto your own pad.', req: { ch: [26, 31, 46, 50], sec: { 31: '§31.8', 46: '§46.9' } },
      brief: R`<p>The booster is falling at about 170 m/s, 80 m to one side of its launch pad, with 300 kg of propellant. The engine throttles between 40% and 100%, and even 40% out-pushes gravity near the end, so it cannot hover. One ignition. Speed must reach zero as altitude reaches zero.</p><p>Fuel-optimal thrust is bang-bang: fall as long as you dare, then burn hard. Height to stop from \(v\) at net deceleration \(a\) is \(v^{2}/(2a)\); tracking \(v_{ref}(h) = -\sqrt{v_{td}^{2} + 2ah}\) with the throttle holds a constant deceleration to a gentle touchdown. Lean the thrust to cancel the sideways offset and speed, vertical profile first. Score: 50 for a safe landing on the pad, 30 for propellant left against the lab’s reference guidance, 10 for softness, 10 for precision.</p><p class="small muted">Doc: §31.8 booster recovery, §46.9 powered descent and landing guidance, §50.1 design as optimization. This lab lands a booster on its own pad and nothing else.</p>`,
      hints: ['a_full = thrust_max/m − g. Use a_des of 0.8 to 0.9 of it and ignite when h ≤ (vz² − v_td²)/(2·a_des) plus a few metres.', 'Throttle from the profile: a_cmd = a_des + k·(v_ref − vz) with k about 2.5; throttle = (a_cmd + g)·m / (thrust_max·cos(tilt)).', 'Sideways: the doc’s ZEM/ZEV law, a_x = −6(x + vx·t_go)/t_go² + 2vx/t_go with t_go ≈ (−vz − v_td)/a_des; tilt = atan2(a_x, a_cmd + g). Return (0, 0) below about 0.15 m or if vz rises above −0.3 m/s.'] }
  ];
  LV.forEach(function (l) { S.MODREQ.push({ id: 'hs' + l.id, name: 'Hoverslam L' + l.id + ': ' + l.t, req: l.req, go: 'hover-' + l.id }); });
  function st() { return S.state.hs; }
  function unlocked() { return LV.filter(function (l) { return E.reqMet(l.req); }); }
  function dailyLevel() { var u = unlocked(); return u.length ? u[u.length - 1] : null; }
  function daySeed(lv) { return +S.day().replace(/-/g, '') * 7 + lv; }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#fff'; }

  /* ---------- drawing ---------- */
  function setup(cv, H) { var W = cv.clientWidth || 340, d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(W * d); cv.height = Math.round(H * d); cv.style.height = H + 'px'; var c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return { c: c, W: W, H: H }; }
  function plot(cv, p) {
    var o = setup(cv, 176), c = o.c, W = o.W, H = o.H, L = 48, Rm = 10, T = 26, B = 22, cols = [css('--ice'), css('--glow'), css('--moss')];
    var xs = p.x, x0 = xs[0], x1 = xs[xs.length - 1], y0 = Infinity, y1 = -Infinity;
    p.series.forEach(function (s) { s.y.forEach(function (v) { if (v < y0) y0 = v; if (v > y1) y1 = v; }); });
    if (y1 - y0 < 1e-9) { y1 += 1; y0 -= 1; } var pad = (y1 - y0) * 0.07; y0 -= pad; y1 += pad; if (x1 === x0) x1 = x0 + 1;
    var X = function (x) { return L + (x - x0) / (x1 - x0) * (W - L - Rm); }, Y = function (y) { return T + (1 - (y - y0) / (y1 - y0)) * (H - T - B); };
    c.clearRect(0, 0, W, H); c.font = '10px ' + css('--mono'); c.fillStyle = css('--scree'); c.strokeStyle = css('--ridge'); c.lineWidth = 1;
    for (var g = 0; g <= 4; g++) { var yy = y0 + (y1 - y0) * g / 4; c.beginPath(); c.moveTo(L, Y(yy)); c.lineTo(W - Rm, Y(yy)); c.stroke(); c.textAlign = 'right'; c.fillText(S.fmt(+yy.toPrecision(3)), L - 5, Y(yy) + 3); }
    c.textAlign = 'left'; c.fillText(S.fmt(+x0.toPrecision(3)), L, H - 6); c.textAlign = 'right'; c.fillText(S.fmt(+x1.toPrecision(3)) + ' ' + p.xl, W - Rm, H - 6);
    if (y0 < 0 && y1 > 0) { c.strokeStyle = css('--scree'); c.setLineDash([3, 3]); c.beginPath(); c.moveTo(L, Y(0)); c.lineTo(W - Rm, Y(0)); c.stroke(); c.setLineDash([]); }
    p.series.forEach(function (s, i) {
      var col = cols[i % 3]; c.strokeStyle = col; c.fillStyle = col;
      if (s.dots) { c.globalAlpha = 0.55; s.y.forEach(function (v, k) { c.beginPath(); c.arc(X(xs[k]), Y(v), 1.6, 0, 6.3); c.fill(); }); c.globalAlpha = 1; }
      else { c.lineWidth = 1.8; c.beginPath(); s.y.forEach(function (v, k) { if (k) c.lineTo(X(xs[k]), Y(v)); else c.moveTo(X(xs[k]), Y(v)); }); c.stroke(); }
    });
    c.font = '600 11px ' + css('--body'); c.textAlign = 'left'; c.fillStyle = css('--snow'); c.fillText(p.title + ' · ' + p.yl, L, 14);
    if (p.series.length > 1) { var lx = W - Rm; c.textAlign = 'right'; c.font = '10px ' + css('--body'); for (var i2 = p.series.length - 1; i2 >= 0; i2--) { c.fillStyle = cols[i2 % 3]; c.fillText(p.series[i2].name, lx, 14); lx -= c.measureText(p.series[i2].name).width + 12; } }
  }
  function flightAnim(cv, f) {
    var o = setup(cv, 280), c = o.c, W = o.W, H = o.H, n = f.t.length, hmax = Math.max.apply(null, f.h.concat([10])), xr = Math.max.apply(null, f.x.map(Math.abs).concat([(f.pad || 6) * 2.2, hmax * 0.04])) * 1.2;
    var gy = H - 30, top = 22, raf = 0, t0 = null, dur = Math.min(9000, Math.max(4500, (f.t[n - 1] - f.t[0]) * 110));
    var Y = function (hh) { return gy - (gy - top) * Math.sqrt(Math.max(hh, 0) / hmax); }, X = function (x) { return W / 2 + x / xr * (W / 2 - 34); };
    var sky = c.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, '#0a1118'); sky.addColorStop(1, '#16242e');
    function draw(k) {
      c.clearRect(0, 0, W, H); c.fillStyle = sky; c.fillRect(0, 0, W, gy); c.fillStyle = '#10181d'; c.fillRect(0, gy, W, H - gy);
      c.font = '10px ' + css('--mono'); c.textAlign = 'left';
      [1, 0.5, 0.25, 0.1, 0.02].forEach(function (fr) { var hh = hmax * fr; c.strokeStyle = 'rgba(140,176,186,0.14)'; c.beginPath(); c.moveTo(0, Y(hh)); c.lineTo(W, Y(hh)); c.stroke(); c.fillStyle = css('--scree'); c.fillText(S.fmt(+hh.toPrecision(2)) + ' m', 4, Y(hh) - 3); });
      var pw = Math.max(18, X(f.pad || 6) - X(-(f.pad || 6)));
      c.fillStyle = css('--moss'); c.fillRect(W / 2 - pw / 2, gy - 1.5, pw, 4); c.fillStyle = css('--scree'); c.textAlign = 'center'; c.fillText('pad', W / 2, gy + 16);
      c.strokeStyle = 'rgba(127,212,230,0.55)'; c.lineWidth = 1.3; c.beginPath(); for (var i = 0; i <= k; i++) { if (i) c.lineTo(X(f.x[i]), Y(f.h[i])); else c.moveTo(X(f.x[i]), Y(f.h[i])); } c.stroke();
      var x = X(f.x[k]), y = Y(f.h[k]), thr = f.thr[k] || 0, last = k === n - 1;
      c.save(); c.translate(x, y); c.rotate(f.tilt[k] || 0);
      if (thr > 0 && !(last && f.crash)) { var fl = 8 + 22 * thr; c.fillStyle = css('--glow'); c.beginPath(); c.moveTo(-3.5, 0); c.lineTo(0, fl); c.lineTo(3.5, 0); c.fill(); c.fillStyle = '#ffe2c2'; c.beginPath(); c.moveTo(-1.6, 0); c.lineTo(0, fl * 0.55); c.lineTo(1.6, 0); c.fill(); }
      c.fillStyle = css('--snow'); var bh = f.small ? 18 : 26, bw = f.small ? 4 : 7; c.fillRect(-bw / 2, -bh, bw, bh); c.beginPath(); c.moveTo(-bw / 2, -bh); c.lineTo(0, -bh - (f.small ? 7 : 5)); c.lineTo(bw / 2, -bh); c.fill();
      c.strokeStyle = css('--snow'); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-bw / 2, -3); c.lineTo(-bw / 2 - 4, 1); c.moveTo(bw / 2, -3); c.lineTo(bw / 2 + 4, 1); c.stroke();
      c.restore();
      if (last) { c.font = '800 15px ' + css('--display'); c.textAlign = 'center'; if (f.crash) { c.strokeStyle = css('--red'); c.lineWidth = 2; [9, 16, 23].forEach(function (r) { c.beginPath(); c.arc(x, gy - 2, r, Math.PI, 0); c.stroke(); }); c.fillStyle = css('--red'); c.fillText(f.h[k] < 1 ? 'IMPACT' : 'LOST', W / 2, 40); } else { c.fillStyle = css('--moss'); c.fillText(f.h[k] < 1 ? 'TOUCHDOWN' : 'APOGEE', W / 2, 40); } }
      c.font = '11px ' + css('--mono'); c.textAlign = 'right'; c.fillStyle = css('--snow'); c.fillText('t ' + f.t[k].toFixed(1) + ' s   h ' + S.fmt(Math.round(f.h[k])) + ' m', W - 8, 16);
    }
    function frame(ts) { if (t0 === null) t0 = ts; var u = Math.min(1, (ts - t0) / dur); draw(Math.min(n - 1, Math.floor(u * (n - 1)))); if (u < 1) raf = requestAnimationFrame(frame); }
    cv._replay = function () { cancelAnimationFrame(raf); t0 = null; raf = requestAnimationFrame(frame); };
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) draw(n - 1); else cv._replay();
  }

  /* ---------- results ---------- */
  function record(lv, daily, res) {
    var s = st(); s.runs = s.runs || {}; s.runs[lv.id] = (s.runs[lv.id] || 0) + 1;
    if (!daily) {
      var b = s.best[lv.id]; if (!b || res.score > b.s) s.best[lv.id] = { s: res.score, t: Date.now(), fuel: res.fuel == null ? null : Math.round(res.fuel), td: res.td == null ? null : +res.td.toFixed(2) };
      if (res.passed && !s.done[lv.id]) { s.done[lv.id] = Date.now(); S.addXP(120, 'Hoverslam L' + lv.id + ' cleared'); S.doneToday('hover'); }
      else if (res.passed) S.doneToday('hover');
    } else {
      var k = S.day(), d = s.daily[k], first = !(d && d.p);
      if (!d || res.score >= d.s) s.daily[k] = { lv: lv.id, s: res.score, fuel: res.fuel == null ? null : Math.round(res.fuel), td: res.td == null ? null : +res.td.toFixed(2), p: (d && d.p) || (res.passed ? 1 : 0) };
      if (res.passed && first) { s.daily[k].p = 1; S.addXP(60, 'Daily flight landed'); S.doneToday('hover'); }
      var ks = Object.keys(s.daily).sort(); while (ks.length > 45) delete s.daily[ks.shift()];
    }
    S.markActive(); S.dirty('mods', 'main', 'log');
  }
  function showResult(box, res, lv, daily) {
    var out = [];
    if (res.error) out.push(h('div', { class: 'con' }, h('span', { class: 'err' }, res.error)));
    out.push(h('div', { class: 'card ' + (res.passed ? 'hero' : '') }, h('div', { class: 'row' }, h('span', { class: 'big' }, String(res.score)), h('div', { class: 'grow' }, h('h3', null, res.passed ? (daily ? 'Daily flight landed' : 'Level ' + lv.id + ' cleared') : res.error ? 'Your code stopped' : 'Not there yet'), h('p', { class: 'small muted' }, 'Score out of 100 · clear at 70 with every test passing'))),
      res.tests.length ? h('div', { class: 'col gap4' }, res.tests.map(function (t) { return h('div', { class: 'fb ' + (t.ok ? 'ok' : 'bad') }, h('strong', null, (t.ok ? '✓ ' : '✗ ') + t.name), h('div', { class: 'small', style: 'margin-top:2px' }, t.detail)); })) : null,
      (res.msgs || []).map(function (m) { return h('p', { class: 'small' }, m); }),
      Object.keys(res.stats || {}).length ? h('dl', { class: 'kv' }, Object.keys(res.stats).map(function (k) { return [h('dt', null, k), h('dd', { class: 'num' }, res.stats[k])]; })) : null));
    if (res.flight && res.flight.t && res.flight.t.length > 1) { var cv = h('canvas', { class: 'viz', role: 'img', 'aria-label': 'Flight playback' }); out.push(h('div', { class: 'col gap4' }, cv, h('button', { class: 'btn sm ghost', onclick: function () { if (cv._replay) cv._replay(); } }, 'Replay the flight'))); setTimeout(function () { flightAnim(cv, res.flight); }, 30); }
    (res.plots || []).forEach(function (p) { if (!p.x || p.x.length < 2) return; var cv2 = h('canvas', { class: 'viz', role: 'img', 'aria-label': p.title }); out.push(cv2); setTimeout(function () { plot(cv2, p); }, 30); });
    if (res.stdout) out.push(h('div', null, h('div', { class: 'eyebrow', style: 'margin-bottom:5px' }, 'print() output'), h('div', { class: 'con' }, res.stdout)));
    S.put(box, out);
  }

  /* ---------- level screen ---------- */
  var lastRes = {};
  S.view('hover-', function (arg) {
    var daily = /d$/.test(arg), id = parseInt(arg, 10), lv = LV[id]; if (!lv) return h('p', null, 'No such level.');
    var s = st(), out = [];
    out.push(h('div', { class: 'row' }, S.backBtn('Hoverslam Lab', 'hoverslam'), h('span', { class: 'grow' }), s.done[id] ? h('span', { class: 'pill ok' }, 'Cleared') : null, daily ? h('span', { class: 'pill glow' }, 'Daily') : null));
    out.push(h('div', null, h('div', { class: 'eyebrow' }, 'Level ' + id + (daily ? ' · today’s seeded flight' : '')), h('h2', null, lv.t)));
    if (!E.reqMet(lv.req)) { out.push(h('div', { class: 'card lock' }, S.lockBox(E.reqText(lv.req)), E.reqMissing(lv.req).length ? h('div', { class: 'row wrap' }, E.reqMissing(lv.req).slice(0, 5).map(function (m) { return h('button', { class: 'btn sm ice', onclick: function () { S.go('ch-' + m); } }, 'Ch ' + m + ' ' + S.LBL[m]); })) : h('div', { class: 'row wrap' }, E.reqRead(lv.req).map(function (r) { return h('button', { class: 'btn sm ice', onclick: function () { S.go(S.readHash(r)); } }, 'Read §' + r); })))); out.push(S.rich('div', 'card doc', lv.brief)); return h('div', { class: 'col gap14' }, out); }
    var er = E.erodedPrereqs(lv.req);
    if (er.length) out.push(h('div', { class: 'card warn' }, h('p', { class: 'small' }, 'Prerequisite eroding: ' + E.list(er.map(function (m) { return 'Ch ' + m + ' at ' + S.pct(E.integrity(m)); })) + '. The level stays open; a 4-question review restores it.'), h('button', { class: 'btn sm', onclick: function () { E.start('review', er[0]); } }, 'Refresh Ch ' + er[0])));
    out.push(h('details', { class: 'card', open: s.done[id] || s.code[id] != null ? null : true }, h('summary', { style: 'cursor:pointer;font-weight:600' }, 'Mission brief'), S.rich('div', 'doc', lv.brief), daily ? h('p', { class: 'small', style: 'color:var(--glow)' }, 'Daily flight: today’s seed changes the wind, masses and sensor noise. Same code, new conditions.') : null));
    var ta = h('textarea', { class: 'code', id: 'pyed', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', wrap: 'off', 'aria-label': 'Python code for level ' + id });
    ta.value = s.code[id] != null ? s.code[id] : PYD.start[id];
    var fit = function () { ta.style.height = Math.min(640, Math.max(240, ta.value.split('\n').length * S.lh(ta) + 26)) + 'px'; }, saveT;
    var ins = function (t) { var a = ta.selectionStart, b = ta.selectionEnd; ta.value = ta.value.slice(0, a) + t + ta.value.slice(b); ta.selectionStart = ta.selectionEnd = a + t.length; ta.dispatchEvent(new Event('input')); ta.focus(); };
    ta.addEventListener('input', function () { fit(); clearTimeout(saveT); saveT = setTimeout(function () { s.code[id] = ta.value; S.dirty('mods'); }, 900); });
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') { e.preventDefault(); ins('    '); }
      else if (e.key === 'Enter') { e.preventDefault(); var line = ta.value.slice(0, ta.selectionStart).split('\n').pop(); ins('\n' + line.match(/^\s*/)[0] + (/:\s*(#.*)?$/.test(line) ? '    ' : '')); }
    });
    var dedent = function () { var p = ta.selectionStart, ls = ta.value.lastIndexOf('\n', p - 1) + 1, m = ta.value.slice(ls).match(/^ {1,4}/); if (!m) return; ta.value = ta.value.slice(0, ls) + ta.value.slice(ls + m[0].length); ta.selectionStart = ta.selectionEnd = Math.max(ls, p - m[0].length); ta.dispatchEvent(new Event('input')); ta.focus(); };
    var keys = h('div', { class: 'keys', role: 'toolbar', 'aria-label': 'Code keys' }, h('button', { type: 'button', onclick: function () { ins('    '); }, 'aria-label': 'Indent' }, '⇥'), h('button', { type: 'button', onclick: dedent, 'aria-label': 'Dedent' }, '⇤'),
      [':', '(', ')', '[', ']', '=', '_', '.', ',', '*', '/', '+', '-', '<', '>', '"', "'", '#'].map(function (k) { return h('button', { type: 'button', onclick: function () { ins(k); } }, k); }));
    var status = h('span', { class: 'small muted', role: 'status' }, Py.st === 'ready' ? 'Python ready' : Py.st === 'failed' ? 'Python could not start' : 'Python starts on the first run');
    var resBox = h('div', { class: 'col gap14', id: 'hsres' });
    var runBtn = h('button', { class: 'btn go', onclick: async function () {
      s.code[id] = ta.value; S.dirty('mods'); runBtn.disabled = true; runBtn.replaceChildren(h('span', { class: 'spin' }), 'Flying…');
      try {
        var res = await Py.run(ta.value, { level: id, seed: daily ? daySeed(id) : 1, daily: daily }, function (m) { status.textContent = m; });
        status.textContent = 'Python ready' + (Py.mode === 'main' ? ' (running on the page: a loop that never ends would freeze this tab)' : '');
        lastRes[arg] = res; record(lv, daily, res); showResult(resBox, res, lv, daily);
        if (resBox.scrollIntoView) resBox.scrollIntoView({ block: 'start', behavior: 'smooth' });
      } catch (e) {
        status.textContent = Py.st === 'failed' ? 'Python could not start' : 'Python ready';
        resBox.replaceChildren(h('div', { class: 'card warn' }, h('h3', null, Py.st === 'failed' ? 'Python could not load here' : 'The run stopped'), h('p', { class: 'small' }, Py.st === 'failed' ? 'The Python runtime (Pyodide) did not load in this view. Check your connection and try again; if it keeps failing, open SUMMIT in a desktop browser.' : String(e.message || e)), Py.st === 'failed' ? h('p', { class: 'tiny muted' }, Py.err) : null, Py.st === 'failed' ? h('button', { class: 'btn sm', onclick: function () { Py.st = 'idle'; runBtn.click(); } }, 'Try again') : null));
      }
      runBtn.disabled = false; runBtn.textContent = daily ? 'Fly today’s conditions' : 'Run';
    } }, daily ? 'Fly today’s conditions' : 'Run');
    var nRuns = (s.runs || {})[id] || 0, canRef = !!s.done[id] || nRuns >= 5, hintBox = h('div', { class: 'col gap4' }), nh = 0;
    out.push(h('div', { class: 'col' }, keys, ta,
      h('div', { class: 'row wrap' }, runBtn, h('button', { class: 'btn', onclick: function () { if (nh < lv.hints.length) { hintBox.append(h('div', { class: 'fb part' }, 'Hint ' + (nh + 1) + ': ' + lv.hints[nh])); nh++; } else S.toast('No more hints for this level.'); } }, 'Hint'),
        h('button', { class: 'btn ghost', onclick: function () { S.ask('Reset to the starter code?', 'Your current code for this level is replaced.', [{ label: 'Reset', cls: 'danger', fn: function () { ta.value = PYD.start[id]; ta.dispatchEvent(new Event('input')); } }, { label: 'Cancel' }]); } }, 'Reset')),
      status, hintBox,
      canRef ? h('details', null, h('summary', { class: 'small muted', style: 'cursor:pointer' }, 'Reference solution'), h('pre', { class: 'code con', style: 'max-height:340px;margin-top:8px' }, PYD.sol[id]), h('button', { class: 'btn sm ghost', onclick: function () { S.ask('Load the reference into the editor?', 'Your current code for this level is replaced.', [{ label: 'Load it', fn: function () { ta.value = PYD.sol[id]; ta.dispatchEvent(new Event('input')); } }, { label: 'Cancel' }]); } }, 'Load into the editor')) : h('p', { class: 'tiny muted' }, 'A reference solution opens after you clear the level or after five runs (' + nRuns + ' so far).')));
    out.push(resBox);
    if (!daily && E.reqMet(lv.req)) out.push(h('button', { class: 'btn ghost sm', onclick: function () { S.go('hover-' + id + 'd'); } }, 'Fly this level in today’s conditions'));
    S.afterRender = function () { fit(); if (lastRes[arg]) showResult(resBox, lastRes[arg], lv, daily); };
    return h('div', { class: 'col gap14' }, out);
  }, { tab: 'train', track: 'hover' });

  /* ---------- lab home ---------- */
  S.view('hoverslam', function () {
    var s = st(), out = [], dl = dailyLevel(), today = s.daily[S.day()];
    out.push(h('div', { class: 'row' }, S.backBtn('Train', 'train')));
    out.push(h('div', null, h('div', { class: 'eyebrow' }, 'Landing-control simulator'), h('h2', null, 'Hoverslam Lab'), h('p', { class: 'small muted', style: 'margin-top:4px' }, 'Write Python that brings a booster back down onto its own launch pad. Seven levels, from a ballistic hop to a fuel-optimal landing burn. Your code runs in this page.')));
    if (dl) out.push(h('div', { class: 'card hero' }, h('div', { class: 'eyebrow' }, 'Daily seeded flight · ' + S.day()), h('h3', null, 'Level ' + dl.id + ': ' + dl.t), h('p', { class: 'small' }, 'Today’s seed sets the wind, the masses and the sensor noise. ' + (today ? 'Best today: ' + today.s + (today.fuel != null ? ' · ' + today.fuel + ' kg burned' : '') + (today.td != null ? ' · touchdown ' + today.td + ' m/s' : '') + '.' : 'Not flown yet.')),
      h('button', { class: 'btn go', onclick: function () { S.go('hover-' + dl.id + 'd'); } }, today && today.p ? 'Fly it again' : 'Fly today’s conditions')));
    else out.push(h('div', { class: 'card lock' }, S.lockBox(E.reqText(LV[0].req)), h('p', { class: 'small muted' }, 'Level 0 opens with Chapters 1, 5 and 7. The daily flight uses the highest level you have unlocked.')));
    out.push(h('h3', null, 'Levels'));
    LV.forEach(function (l) {
      var met = E.reqMet(l.req), b = s.best[l.id];
      out.push(h('div', { class: 'card ' + (met ? '' : 'lock') }, h('div', { class: 'row' }, h('span', { class: 'ic item', style: 'width:36px;height:36px;border-radius:9px;background:var(--scarp);display:grid;place-items:center;font:800 15px var(--display);color:' + (s.done[l.id] ? 'var(--moss)' : met ? 'var(--glow)' : 'var(--scree)') + ';padding:0;flex:none' }, 'L' + l.id), h('div', { class: 'grow' }, h('div', { style: 'font-weight:600' }, l.t), h('div', { class: 'small muted' }, l.sub)), s.done[l.id] ? h('span', { class: 'pill ok' }, 'Cleared') : met ? h('span', { class: 'pill glow' }, 'Open') : h('span', { class: 'pill' }, 'Locked')),
        met ? null : S.lockBox(E.reqText(l.req)),
        b ? h('p', { class: 'tiny muted num' }, 'Personal best ' + b.s + (b.fuel != null ? ' · ' + b.fuel + ' kg burned' : '') + (b.td != null ? ' · touchdown ' + b.td + ' m/s' : '') + ' · ' + S.ago(b.t)) : null,
        h('button', { class: 'btn ' + (met && !s.done[l.id] ? 'go' : '') + ' sm', onclick: function () { S.go('hover-' + l.id); } }, met ? (s.code[l.id] != null ? 'Continue' : 'Start') : 'See the brief')));
    });
    var dk = Object.keys(s.daily).sort().reverse().slice(0, 14);
    out.push(h('div', { class: 'card' }, h('h3', null, 'Personal bests'), Object.keys(s.best).length || dk.length ? h('div', { class: 'tw' }, h('table', null, h('thead', null, h('tr', null, h('th', null, 'Flight'), h('th', null, 'Score'), h('th', null, 'Fuel'), h('th', null, 'Touchdown'))),
      h('tbody', null, LV.filter(function (l) { return s.best[l.id]; }).map(function (l) { var b = s.best[l.id]; return h('tr', null, h('td', null, 'L' + l.id + ' ' + l.t), h('td', { class: 'num' }, String(b.s)), h('td', { class: 'num' }, b.fuel != null ? b.fuel + ' kg' : '–'), h('td', { class: 'num' }, b.td != null ? b.td + ' m/s' : '–')); }),
        dk.map(function (k) { var d = s.daily[k]; return h('tr', null, h('td', null, 'Daily ' + k.slice(5) + ' · L' + d.lv), h('td', { class: 'num' }, String(d.s)), h('td', { class: 'num' }, d.fuel != null ? d.fuel + ' kg' : '–'), h('td', { class: 'num' }, d.td != null ? d.td + ' m/s' : '–')); })))) : h('p', { class: 'small muted' }, 'Your best score, fuel burned and touchdown speed for each level and each daily flight will be kept here.')));
    out.push(h('p', { class: 'tiny muted' }, 'Scope: a learning simulator for propulsive landing on the vehicle’s own pad, following §31.8 and §46.9 of your doc and the omissions in its safety flags.'));
    return h('div', { class: 'col gap14' }, out);
  }, { tab: 'train', track: 'hover' });
  S.MODS.hover = { name: 'Hoverslam Lab', tag: 'Landing-control simulator', go: 'hoverslam',
    summary: function () { var u = unlocked(), nd = Object.keys(st().done).length; return u.length ? { open: true, pill: nd + '/7 cleared', pillCls: nd ? 'ok' : '', line: 'Python controllers for a booster returning to its own pad. ' + S.plural(u.length, 'level') + ' open; a seeded daily flight changes the wind, mass and sensor noise.' } : { open: false, pill: 'Locked', line: 'Write Python controllers that land a booster on its own pad, from a ballistic hop up to a fuel-optimal hoverslam.', lock: E.reqText(LV[0].req) }; },
    plan: function (mins) { var dl = dailyLevel(); if (!dl) return null; return { id: 'hover', ic: '▼', t: 'Hoverslam daily flight', s: 'Level ' + dl.id + ' · ' + dl.t + ' in today’s wind and noise', m: mins <= 30 ? 10 : mins <= 60 ? 15 : 30, go: 'hover-' + dl.id + 'd' }; } };
  S.HS = { LV: LV, plot: plot, flightAnim: flightAnim };
})();
