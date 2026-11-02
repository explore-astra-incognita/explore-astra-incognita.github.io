/* Astra Incognita · el cielo
   Todo en puntos, como Terra: la retícula de coordenadas, la Vía Láctea (24.000 puntos de polvo con su brillo real), las
   8.874 estrellas hasta la magnitud 6,5 (Hipparcos / Yale BSC, vía d3-celestial), las 88 constelaciones y la lupa, que
   enciende las líneas, los nombres y el color de verdad de cada estrella. Abajo, la cumbre del Roque de los Muchachos:
   el mar de nubes con el Teide asomando al este, el Gran Telescopio Canarias con la rendija abierta, los «muchachos» de
   roca y alguien con su telescopio. Se mueve: el cielo gira, las estrellas titilan (más cerca del horizonte), pasan
   estrellas fugaces y algún satélite, y el mar de nubes ondula. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, Cc = AS.color;
  var TAU = Math.PI * 2, RAD = Math.PI / 180;
  var TINTA = '#09090a', ACENTO = '#9fd8ff', HUESO = Cc.hueso;
  var CI = AS.cielo = { lupa: { x: 0, y: 0, r: 120, cons: null, n: 0, ra: 0, dec: 0, a: 1 }, ocultarLupa: false };

  /* ------------------------------------------------------------------ los datos */
  var N = 0, SX, SY, SZ, MAG, BV, FASE, COL = [], NOMBRE = {}, CONS = [], NP = 0, PX, PY, PZ, PL;
  function colorBV(bv) {
    var t = U.clamp((bv + 0.3) / 2.1, 0, 1), st = [[0, [160, 190, 255]], [0.25, [215, 228, 255]], [0.45, [255, 250, 240]], [0.7, [255, 215, 160]], [1, [255, 160, 90]]];
    for (var j = 0; j < st.length - 1; j++) if (t <= st[j + 1][0]) { var u = (t - st[j][0]) / (st[j + 1][0] - st[j][0]); return st[j][1].map(function (v, q) { return Math.round(v + (st[j + 1][1][q] - v) * u); }); }
    return st[4][1];
  }
  CI.colorBV = colorBV;
  function radio(m) { return Math.max(0.42, Math.pow(Math.max(0.1, 6.8 - m), 1.4) * 0.3); }
  CI.radio = radio;
  CI.preparar = function () {
    var D = window.AS_DATOS, A = D.alf, val = {}, i, k;
    for (i = 0; i < 64; i++) val[A[i]] = i;
    var dec = function (s, a, n) { var v = 0; for (var j = 0; j < n; j++) v = v * 64 + val[s[a + j]]; return v; };
    var s = D.estrellas; N = s.length / 10;
    SX = new Float32Array(N); SY = new Float32Array(N); SZ = new Float32Array(N); MAG = new Float32Array(N); BV = new Float32Array(N); FASE = new Float32Array(N);
    var r = U.azar(17);
    for (i = 0; i < N; i++) {
      var o = i * 10, ra = dec(s, o, 3) / 262144 * TAU, de = (dec(s, o + 3, 3) / 262143 * 180 - 90) * RAD;
      SX[i] = Math.cos(de) * Math.cos(ra); SY[i] = Math.cos(de) * Math.sin(ra); SZ[i] = Math.sin(de);
      MAG[i] = dec(s, o + 6, 2) / 100 - 1.6; BV[i] = dec(s, o + 8, 2) / 1000 - 0.5; FASE[i] = r() * TAU;
      COL[i] = colorBV(BV[i]);
    }
    D.nombres.forEach(function (n) { NOMBRE[n[0]] = n[1]; });
    var p = D.polvo; NP = p.length / 5;
    PX = new Float32Array(NP); PY = new Float32Array(NP); PZ = new Float32Array(NP); PL = new Uint8Array(NP);
    for (i = 0; i < NP; i++) {
      o = i * 5; ra = dec(p, o, 2) / 4096 * TAU; de = (dec(p, o + 2, 2) / 4095 * 180 - 90) * RAD;
      PX[i] = Math.cos(de) * Math.cos(ra); PY[i] = Math.cos(de) * Math.sin(ra); PZ[i] = Math.sin(de); PL[i] = val[p[o + 4]];
    }
    CONS = D.constelaciones.map(function (c) {
      var lineas = c.l.map(function (ln) { var v = []; for (k = 0; k < ln.length; k += 2) v.push(E.vec(ln[k] / 15, ln[k + 1])); return v; });
      return { id: c.id, nombre: c.n, latin: c.la, rango: c.r, p: E.vec(c.p[0] / 15, c.p[1]), raP: c.p[0] / 15, decP: c.p[1], lineas: lineas };
    });
    CI.N = N; CI.CONS = CONS;
    preparado = true;
  };
  var preparado = false;
  CI.listo = function () { return preparado; };
  // buscar una estrella por su nombre (para los secretos): { i, ra, dec, mag }
  CI.estrella = function (nombre) {
    for (var i in NOMBRE) if (NOMBRE[i] === nombre) { i = +i; var ra = Math.atan2(SY[i], SX[i]) / RAD / 15; return { i: i, ra: ra < 0 ? ra + 24 : ra, dec: Math.asin(SZ[i]) / RAD, mag: MAG[i] }; }
    return null;
  };
  // la estrella número i (ordenadas de más a menos brillante): { ra (h), dec, mag, bv }
  CI.estrellaN = function (i) { if (i < 0 || i >= N) return null; var ra = Math.atan2(SY[i], SX[i]) / RAD / 15; return { i: i, ra: ra < 0 ? ra + 24 : ra, dec: Math.asin(SZ[i]) / RAD, mag: MAG[i], bv: BV[i] }; };
  // proyectar un vector ecuatorial ya calculado (las líneas de las constelaciones)
  CI.proyVec = function (v) { var M = E.M; return E.proyCam(M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2], -0.1); };
  CI.constelacion = function (id) { for (var i = 0; i < CONS.length; i++) if (CONS[i].id === id) return CONS[i]; return null; };

  /* ------------------------------------------------------------------ el suelo: perfil en grados según el rumbo */
  // la cumbre: rocas al norte, abierta al este (el mar de nubes y el Teide) y al oeste, y la loma del observatorio al sur
  var PERFIL = [[0, 3.2], [20, 4.4], [42, 2.2], [62, -2.6], [90, -3.2], [114, -3.6], [140, -2.2], [160, 0.6], [171, -0.9], [180, -2.6], [189, -0.9], [200, 2.0], [226, 1.0], [252, -2.4], [290, -3.0], [318, 0.4], [340, 2.4], [360, 3.2]];
  function perfil(az) {
    az = ((az % 360) + 360) % 360;
    for (var i = 0; i < PERFIL.length - 1; i++) if (az <= PERFIL[i + 1][0]) {
      var a = PERFIL[i], b = PERFIL[i + 1], u = (az - a[0]) / (b[0] - a[0]);
      return a[1] + (b[1] - a[1]) * (0.5 - 0.5 * Math.cos(Math.PI * u)) + 0.35 * Math.sin(az * 0.31) + 0.18 * Math.sin(az * 1.13 + 1);
    }
    return PERFIL[0][1];
  }
  CI.perfil = perfil;
  var NUBES = -1.45;   // el techo del mar de nubes, visto desde 2.400 m (el horizonte del mar baja 1,6°)
  CI.horizonte = function (az) { return Math.max(perfil(az), NUBES); };

  /* ------------------------------------------------------------------ las tramas de puntos (se crean una vez) */
  var tramaSuelo = null, tramaNube = null;
  function trama(paso, r, a, col) {
    var d = Math.max(1, E.dpr), c = document.createElement('canvas'); c.width = c.height = Math.round(paso * d);
    var x = c.getContext('2d'); x.fillStyle = U.rgba(col, a); x.beginPath(); x.arc(paso * d / 2, paso * d / 2, r * d, 0, TAU); x.fill();
    x.beginPath(); x.arc(0, 0, r * d, 0, TAU); x.arc(paso * d, 0, r * d, 0, TAU); x.arc(0, paso * d, r * d, 0, TAU); x.arc(paso * d, paso * d, r * d, 0, TAU); x.fill();
    return c;
  }
  var dprTramas = 0;
  function tramas(ctx) {
    if (dprTramas === E.dpr && tramaSuelo) return;
    dprTramas = E.dpr;
    tramaSuelo = ctx.createPattern(trama(5, 0.72, 0.3, HUESO), 'repeat');
    tramaNube = ctx.createPattern(trama(4, 0.6, 0.34, [214, 226, 240]), 'repeat');
  }
  function moverTrama(pt, x, y) { if (pt && pt.setTransform && window.DOMMatrix) pt.setTransform(new DOMMatrix([1 / E.dpr, 0, 0, 1 / E.dpr, x, y])); }

  /* ------------------------------------------------------------------ lo que se mueve solo */
  var fugaces = [], proxFugaz = 6000, satelite = null, proxSat = 26000, rnd = U.azar(91);
  CI.velo = 0;
  CI.actualizar = function (dt) {
    if (!preparado) return;
    if (CI.velo > 0) CI.velo = Math.max(0, CI.velo - dt / 700);
    // la lupa: sigue al ratón; en táctil (o sin ratón) se queda en el centro
    var L = CI.lupa, p = E.puntero, R = Math.max(80, Math.min(0.165 * E.H, 0.26 * E.W));
    var ox = E.W / 2, oy = E.H * 0.42;
    if (p.sobre && p.tipo === 'mouse' && !E.escena) { ox = p.x; oy = p.y; }
    if (!L.iniciada) { L.x = ox; L.y = oy; L.iniciada = true; }
    var q = 1 - Math.exp(-dt / 70); L.x += (ox - L.x) * q; L.y += (oy - L.y) * q; L.r = R;
    L.a += ((CI.ocultarLupa || (E.escena && !E.escena.s.conLupa) ? 0 : 1) - L.a) * (1 - Math.exp(-dt / 160));
    // estrellas fugaces (una cada 7–22 s, más si alguien lo pide) y un satélite de vez en cuando
    proxFugaz -= dt * (CI.lluvia || 1);
    if (proxFugaz <= 0) { proxFugaz = 7000 + rnd() * 15000; CI.fugaz(); }
    for (var i = fugaces.length - 1; i >= 0; i--) { fugaces[i].t += dt; if (fugaces[i].t > fugaces[i].dur) fugaces.splice(i, 1); }
    proxSat -= dt;
    if (proxSat <= 0 && !satelite) { proxSat = 50000 + rnd() * 40000; var az0 = rnd() * 360; satelite = { t: 0, dur: 36000, a: az0, b: az0 + 140 + rnd() * 80, h: 18 + rnd() * 50 }; }
    if (satelite) { satelite.t += dt; if (satelite.t > satelite.dur) satelite = null; }
  };
  // una estrella fugaz: nace en el trozo de cielo que se ve (en grados del horizonte, para que no se deforme al mirar)
  CI.fugaz = function (op) {
    op = op || {};
    var az = op.az != null ? op.az : E.az + (rnd() - 0.5) * 70 / E.zoom, alt = op.alt != null ? op.alt : U.clamp(E.alt + (rnd() - 0.3) * 40 / E.zoom, 18, 80);
    var ang = op.ang != null ? op.ang : (rnd() < 0.5 ? -1 : 1) * (0.3 + rnd() * 1.0) - Math.PI / 2;
    fugaces.push({ az: az, alt: alt, ang: ang, largo: op.largo || 8 + rnd() * 12, t: 0, dur: op.dur || 650 + rnd() * 500, brillo: op.brillo || 0.7 + rnd() * 0.3 });
  };

  // ¿hay una estrella fugaz cerca de (x, y)? Devuelve la fugaz (y la marca como atrapada) o null
  CI.fugazEn = function (x, y, r) {
    for (var i = 0; i < fugaces.length; i++) {
      var f = fugaces[i], k = f.t / f.dur; if (k < 0.08 || k > 0.92) continue;
      var d = f.largo * U.sale(k), cosA = Math.max(0.25, Math.cos(f.alt * RAD)), q = E.proyHor(f.az + Math.cos(f.ang) * d / cosA, f.alt - Math.sin(f.ang) * d, 0);
      if (q && Math.hypot(q[0] - x, q[1] - y) < (r || 34)) { f.atrapada = true; return { x: q[0], y: q[1], az: f.az, alt: f.alt }; }
    }
    return null;
  };
  CI.fugaces = function () { return fugaces; };
  // ¿cae (x, y) sobre la cúpula del Gran Telescopio Canarias?
  CI.sobreGTC = function (x, y) {
    var p0 = E.proyHor(201, perfil(201), -0.6), p1 = E.proyHor(201, perfil(201) + 1, -0.6); if (!p0 || !p1) return false;
    var s = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), dx = (x - p0[0]) / s, dy = (p0[1] - y) / s;
    return dx > -4.8 && dx < 4.8 && dy > 0 && dy < 7.9 && (dy < 3.2 || Math.hypot(dx, dy - 3.2) < 4.7);
  };

  /* ------------------------------------------------------------------ pintar */
  var ultimoCuadro = { visibles: 0 };
  CI.dibujar = function (ctx, s, t) {
    if (!preparado) return;
    tramas(ctx);
    var W = E.W, H = E.H, M = E.M, Hm = E.Hm, S2 = E.S * 2, cx = W / 2, cy = H / 2, z = E.zoom, L = CI.lupa;
    var m00 = M[0][0], m01 = M[0][1], m02 = M[0][2], m10 = M[1][0], m11 = M[1][1], m12 = M[1][2], m20 = M[2][0], m21 = M[2][1], m22 = M[2][2];
    var h0 = Hm[2][0], h1 = Hm[2][1], h2 = Hm[2][2], tt = E.t / 1000;
    var bajo = s && s.cielo === false;
    if (s && s.fondo) s.fondo(ctx, t);

    if (!bajo) {
      // el resplandor del horizonte (la luz del aire y de las ciudades lejanas, por debajo del mar de nubes): muy tenue
      var ph = E.proyHor(E.az, 0, -0.9);
      if (ph && ph[1] < H + 200) { var gh = ctx.createLinearGradient(0, ph[1] - E.pxGrado() * 14, 0, ph[1]); gh.addColorStop(0, 'rgba(120,150,190,0)'); gh.addColorStop(1, 'rgba(120,150,190,.09)'); ctx.fillStyle = gh; ctx.fillRect(0, ph[1] - E.pxGrado() * 14, W, E.pxGrado() * 14 + 2); }

      reticula(ctx);

      // la Vía Láctea: 5 niveles, un relleno por nivel
      var tam = 1.15 * Math.pow(z, 0.5), cam5 = [new Path2D(), new Path2D(), new Path2D(), new Path2D(), new Path2D()];
      for (var i = 0; i < NP; i++) {
        var x = PX[i], y = PY[i], w = PZ[i], Z = m20 * x + m21 * y + m22 * w; if (Z < -0.2) continue;
        var k = S2 / (1 + Z), sx = cx + (m00 * x + m01 * y + m02 * w) * k, sy = cy - (m10 * x + m11 * y + m12 * w) * k;
        if (sx < -2 || sx > W + 2 || sy < -2 || sy > H + 2) continue;
        cam5[PL[i] - 1].rect(sx, sy, tam, tam);
      }
      var AL = [0.13, 0.19, 0.26, 0.34, 0.44];
      for (i = 0; i < 5; i++) { ctx.fillStyle = U.rgba(HUESO, AL[i]); ctx.fill(cam5[i]); }

      // las estrellas: las débiles en 9 cubos (un relleno cada uno), las brillantes una a una
      var cubos = [], NC = 9; for (i = 0; i < NC; i++) cubos.push(new Path2D());
      var enLupa = [], vis = 0, lx = L.x, ly = L.y, lr2 = L.r * L.r, zr = Math.pow(z, 0.35), lupaVis = L.a > 0.05;
      for (i = 0; i < N; i++) {
        x = SX[i]; y = SY[i]; w = SZ[i]; Z = m20 * x + m21 * y + m22 * w; if (Z < -0.2) continue;
        k = S2 / (1 + Z); sx = cx + (m00 * x + m01 * y + m02 * w) * k; sy = cy - (m10 * x + m11 * y + m12 * w) * k;
        if (sx < -12 || sx > W + 12 || sy < -12 || sy > H + 12) continue;
        var alt = h0 * x + h1 * y + h2 * w; if (alt < -0.03) continue;   // bajo el horizonte (el suelo las tapa igual)
        var m = MAG[i], ext = U.clamp(alt * 7 + 0.1, 0.15, 1);              // cerca del horizonte se apagan
        vis++;
        var r = radio(m) * zr, a = Math.min(1, 0.22 + (6.8 - m) * 0.17) * ext;
        if (lupaVis) { var dx = sx - lx, dy = sy - ly; if (dx * dx + dy * dy < lr2) enLupa.push(i, sx, sy, r, a); }
        if (m > 3.3) { var c = Math.min(NC - 1, Math.floor((m - 3.3) / 0.36)); cubos[c].rect(sx - r, sy - r, r * 2, r * 2); continue; }
        // titilar: más cerca del horizonte (más aire)
        var tw = 1 - (0.1 + 0.25 * (1 - ext)) * (0.5 + 0.5 * Math.sin(tt * (2.1 + FASE[i]) + FASE[i] * 7));
        a *= tw;
        if (m < 1.9) { var g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4.6); g.addColorStop(0, U.rgba(HUESO, 0.26 * a)); g.addColorStop(1, U.rgba(HUESO, 0)); ctx.fillStyle = g; ctx.fillRect(sx - r * 4.6, sy - r * 4.6, r * 9.2, r * 9.2); }
        ctx.fillStyle = U.rgba(HUESO, a); ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fill();
        if (m < 0.9) { ctx.strokeStyle = U.rgba(HUESO, 0.32 * a); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(sx, sy, r + 4, 0, TAU); ctx.stroke(); }
      }
      for (i = 0; i < NC; i++) { var mm = 3.3 + (i + 0.5) * 0.36; ctx.fillStyle = U.rgba(HUESO, Math.min(1, 0.22 + (6.8 - mm) * 0.17)); ctx.fill(cubos[i]); }
      ultimoCuadro.visibles = vis;

      // las constelaciones: líneas en puntitos; dentro de la lupa, en el acento
      var lineas = new Path2D(), cerca = [], gap = 5;
      for (var ci = 0; ci < CONS.length; ci++) {
        var C = CONS[ci], dentro = 0, dmin = 1e9;
        for (var li = 0; li < C.lineas.length; li++) {
          var ln = C.lineas[li], prev = null;
          for (var vi = 0; vi < ln.length; vi++) {
            var v = ln[vi], Zv = m20 * v[0] + m21 * v[1] + m22 * v[2];
            if (Zv < -0.1) { prev = null; continue; }
            var kv = S2 / (1 + Zv), q = [cx + (m00 * v[0] + m01 * v[1] + m02 * v[2]) * kv, cy - (m10 * v[0] + m11 * v[1] + m12 * v[2]) * kv];
            var dl = Math.hypot(q[0] - lx, q[1] - ly); if (dl < L.r) dentro++; if (dl < dmin) dmin = dl;
            if (prev) {
              var ddx = q[0] - prev[0], ddy = q[1] - prev[1], dd = Math.hypot(ddx, ddy);
              if (dd > gap * 2.6 && dd < W * 1.5) { var ux = ddx / dd * gap, uy = ddy / dd * gap; lineas.moveTo(prev[0] + ux, prev[1] + uy); lineas.lineTo(q[0] - ux, q[1] - uy); }
            }
            prev = q;
          }
        }
        if (dentro) cerca.push([dentro, -dmin, C]);
      }
      ctx.lineCap = 'round'; ctx.setLineDash([0.01, 4.2]); ctx.lineWidth = 1.15; ctx.strokeStyle = 'rgba(236,230,214,.26)'; ctx.stroke(lineas);
      cerca.sort(function (a, b) { return b[0] - a[0] || b[1] - a[1]; });
      L.cons = lupaVis && cerca.length ? cerca[0][2] : null;

      // los nombres de las constelaciones (más cuantos más te acercas)
      ctx.font = '500 10px "IBM Plex Mono", monospace'; if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
      for (ci = 0; ci < CONS.length; ci++) {
        C = CONS[ci]; if (C.rango > (z < 1.25 ? 1 : z < 2 ? 2 : 3)) continue;
        v = C.p; Zv = m20 * v[0] + m21 * v[1] + m22 * v[2]; if (Zv < 0) continue;
        kv = S2 / (1 + Zv); var nx = cx + (m00 * v[0] + m01 * v[1] + m02 * v[2]) * kv, ny = cy - (m10 * v[0] + m11 * v[1] + m12 * v[2]) * kv;
        if (nx < 60 || nx > W - 60 || ny < 30 || ny > H - 30) continue;
        var hz = E.desproy(nx, ny); if (hz.alt < CI.horizonte(hz.az) + 2) continue;
        var dn = Math.hypot(nx - lx, ny - ly), enL = lupaVis && dn < L.r;
        rotulo(ctx, C.nombre.toUpperCase(), nx, ny, enL ? ACENTO : 'rgba(236,230,214,.4)', 'center', enL ? L.a : 1);
      }

      // la lupa: color de verdad, líneas en el acento y los nombres de las brillantes
      if (lupaVis) lupa(ctx, lineas, enLupa);
      fugazYSatelite(ctx);
    }
    if (!(s && s.sinSuelo)) suelo(ctx);
    if (CI.velo > 0.003) { ctx.fillStyle = 'rgba(9,9,10,' + CI.velo.toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.setLineDash([]); ctx.lineCap = 'butt';
  };
  CI.estadistica = function () { return ultimoCuadro; };

  function rotulo(ctx, txt, x, y, col, al, a) {
    if (a != null && a < 0.02) return;
    ctx.save(); if (a != null) ctx.globalAlpha *= a;
    var w = ctx.measureText(txt).width, x0 = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
    ctx.fillStyle = TINTA; ctx.fillRect(x0 - 5, y - 10, w + 10, 14);
    ctx.textAlign = al || 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = col; ctx.fillText(txt, x, y);
    ctx.restore();
  }
  CI.rotulo = rotulo;

  /* ---------- la retícula de coordenadas: AR cada hora, dec cada 10° (en puntos) ---------- */
  function reticula(ctx) {
    var W = E.W, H = E.H, fina = new Path2D(), marcada = new Path2D(), etqAR = [], etqDec = [], ytop = 70, xizq = 34;
    var pasoD = 2.5 / Math.max(1, E.zoom * 0.8);
    function linea(path, fn, n, etq) {
      var prev = null;
      for (var j = 0; j <= n; j++) {
        var q = fn(j); if (!q || q[2] < -0.05 || q[0] < -400 || q[0] > W + 400 || q[1] < -400 || q[1] > H + 400) { prev = null; continue; }
        if (prev && Math.hypot(q[0] - prev[0], q[1] - prev[1]) < 300) { path.moveTo(prev[0], prev[1]); path.lineTo(q[0], q[1]); if (etq) etq(prev, q); }
        prev = q;
      }
    }
    for (var h = 0; h < 24; h++) {
      linea(h % 6 ? fina : marcada, function (j) { return E.proy(h, -88 + j * pasoD); }, Math.round(176 / pasoD), function (a, b) {
        if ((a[1] - ytop) * (b[1] - ytop) < 0) { var u = (ytop - a[1]) / (b[1] - a[1]), x = a[0] + (b[0] - a[0]) * u; if (x > 380 && x < W - 340) etqAR.push([U.dos(h) + ' H', x]); }
      });
    }
    for (var d = -80; d <= 80; d += 10) {
      linea(d === 0 ? marcada : fina, function (j) { return E.proy(j * pasoD / 15, d); }, Math.round(360 / pasoD), function (a, b) {
        if ((a[0] - xizq) * (b[0] - xizq) < 0) { var u = (xizq - a[0]) / (b[0] - a[0]), y = a[1] + (b[1] - a[1]) * u; if (y > 150 && y < H - 170) etqDec.push([(d > 0 ? '+' : d < 0 ? '−' : '') + Math.abs(d) + '°', y]); }
      });
    }
    ctx.lineCap = 'round'; ctx.lineWidth = 1.1;
    ctx.setLineDash([0.01, 6]); ctx.strokeStyle = 'rgba(236,230,214,.15)'; ctx.stroke(fina);
    ctx.setLineDash([0.01, 4]); ctx.strokeStyle = 'rgba(236,230,214,.24)'; ctx.stroke(marcada);
    ctx.setLineDash([]);
    ctx.font = '500 10px "IBM Plex Mono", monospace'; if ('letterSpacing' in ctx) ctx.letterSpacing = '1.5px';
    // sin repetidas y sin pisarse: cerca del polo las horas se juntan, y se queda una de cada dos (o de cada tres)
    var vistos = {}; etqAR = etqAR.filter(function (e) { if (vistos[e[0]]) return false; return (vistos[e[0]] = true); }); etqDec = etqDec.filter(function (e) { if (vistos[e[0]]) return false; return (vistos[e[0]] = true); });
    var ultX = -1e9; etqAR.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (e) { if (e[1] - ultX < 78) return; ultX = e[1]; rotulo(ctx, e[0], e[1], ytop + 4, 'rgba(236,230,214,.42)', 'center'); });
    var ultY = -1e9; etqDec.sort(function (a, b) { return a[1] - b[1]; }); etqDec = etqDec.filter(function (e) { if (e[1] - ultY < 34) return false; ultY = e[1]; return true; });
    etqDec.forEach(function (e) { rotulo(ctx, e[0], xizq + 6, e[1] + 4, 'rgba(236,230,214,.42)', 'left'); });
  }

  /* ---------- la lupa ---------- */
  function lupa(ctx, lineas, enLupa) {
    var L = CI.lupa, a = L.a, i;
    ctx.save(); ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(L.x, L.y, L.r, 0, TAU); ctx.clip();
    // dentro, el cielo se oscurece un poco para que el color resalte
    ctx.fillStyle = 'rgba(9,9,10,.35)'; ctx.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    ctx.lineCap = 'round'; ctx.setLineDash([0.01, 3.4]); ctx.lineWidth = 1.9; ctx.strokeStyle = 'rgba(159,216,255,.9)'; ctx.stroke(lineas); ctx.setLineDash([]);
    for (i = 0; i < enLupa.length; i += 5) {
      var s = enLupa[i], x = enLupa[i + 1], y = enLupa[i + 2], r = enLupa[i + 3], al = Math.min(1, enLupa[i + 4] * 1.25), col = COL[s];
      if (MAG[s] < 2.2) { var g = ctx.createRadialGradient(x, y, 0, x, y, r * 5); g.addColorStop(0, U.rgba(col, 0.38 * al)); g.addColorStop(1, U.rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10); }
      ctx.fillStyle = U.rgba(col, al); ctx.beginPath(); ctx.arc(x, y, r * 1.1, 0, TAU); ctx.fill();
    }
    ctx.restore();
    ctx.save(); ctx.globalAlpha = a;
    // el anillo en puntos y cuatro marcas
    ctx.fillStyle = 'rgba(159,216,255,.8)';
    var n = Math.round(L.r * TAU / 4.6);
    for (i = 0; i < n; i++) { var an = i / n * TAU; ctx.fillRect(L.x + Math.cos(an) * L.r - 0.9, L.y + Math.sin(an) * L.r - 0.9, 1.8, 1.8); }
    ctx.strokeStyle = 'rgba(159,216,255,.7)'; ctx.lineWidth = 1;
    for (i = 0; i < 4; i++) { an = i * Math.PI / 2; ctx.beginPath(); ctx.moveTo(L.x + Math.cos(an) * (L.r + 6), L.y + Math.sin(an) * (L.r + 6)); ctx.lineTo(L.x + Math.cos(an) * (L.r + 15), L.y + Math.sin(an) * (L.r + 15)); ctx.stroke(); }
    // los nombres de las estrellas brillantes que hay dentro
    ctx.font = '500 10px "IBM Plex Mono", monospace'; if ('letterSpacing' in ctx) ctx.letterSpacing = '2.5px';
    var puestos = 0, ocupado = [];
    for (i = 0; i < enLupa.length && puestos < 6; i += 5) {
      s = enLupa[i]; if (!NOMBRE[s] || MAG[s] > 2.6) continue;
      x = enLupa[i + 1]; y = enLupa[i + 2]; r = enLupa[i + 3];
      // el nombre, encima de su estrella y centrado (a un lado se confundía con la vecina)
      var tx = NOMBRE[s].toUpperCase(), wt = ctx.measureText(tx).width + 10, bx = x - wt / 2, by = y - r - 22, choca = false;
      ocupado.forEach(function (o) { if (bx < o[0] + o[2] && bx + wt > o[0] && by < o[1] + 16 && by + 16 > o[1]) choca = true; }); if (choca) continue;
      ocupado.push([bx, by, wt]);
      rotulo(ctx, tx, x, y - r - 9, 'rgba(236,230,214,.9)', 'center');
      puestos++;
    }
    // la ficha: la constelación, las coordenadas del centro y cuántas estrellas hay en la lupa
    var c = E.desproy(L.x, L.y); L.ra = c.ra; L.dec = c.dec; L.n = enLupa.length / 5;
    var sinTilde = function (x) { return x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase(); };
    var t1 = L.cons ? (sinTilde(L.cons.nombre) === sinTilde(L.cons.latin) ? L.cons.nombre.toUpperCase() : L.cons.nombre.toUpperCase() + ' · ' + L.cons.latin.toUpperCase()) : 'CIELO PROFUNDO', t2 = U.ar(c.ra) + ' · ' + U.dec(c.dec), t3 = L.n + (L.n === 1 ? ' ESTRELLA' : ' ESTRELLAS') + ' EN LA LUPA';
    var w = Math.max(ctx.measureText(t1).width, ctx.measureText(t2).width, ctx.measureText(t3).width) + 16;
    var der = L.x + L.r + 30 + w < E.W - 16, izq = L.x - L.r - 30 - w > 16, arriba = L.y - L.r * 0.75 - 30 > 16;
    var ax, ay, fx, fy;
    if (der || izq) {
      ax = L.x + (der ? 1 : -1) * L.r * 0.74; ay = L.y + (arriba ? -1 : 1) * L.r * 0.67; fx = der ? L.x + L.r + 26 : L.x - L.r - 26 - w; fy = ay + (arriba ? -14 : 14);
      ctx.strokeStyle = 'rgba(159,216,255,.55)'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(der ? fx : fx + w, fy); ctx.lineTo(der ? fx + w : fx, fy); ctx.stroke();
    } else {
      // pantalla estrecha: la ficha va debajo de la lupa, centrada
      fx = U.clamp(L.x - w / 2, 12, E.W - 12 - w); fy = L.y + L.r + 38;
      ctx.strokeStyle = 'rgba(159,216,255,.55)'; ctx.beginPath(); ctx.moveTo(L.x, L.y + L.r + 4); ctx.lineTo(L.x, fy - 26); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(9,9,10,.86)'; ctx.fillRect(fx, fy - 24, w, 18); ctx.fillRect(fx, fy + 3, w, 36);
    ctx.textAlign = 'left'; ctx.fillStyle = ACENTO; ctx.fillText(t1, fx + 6, fy - 11);
    ctx.fillStyle = 'rgba(236,230,214,.78)'; ctx.fillText(t2, fx + 6, fy + 16); ctx.fillText(t3, fx + 6, fy + 32);
    ctx.restore();
  }

  /* ---------- estrellas fugaces y el satélite ---------- */
  function fugazYSatelite(ctx) {
    fugaces.forEach(function (f) {
      var k = f.t / f.dur, e = U.sale(k), d = f.largo * e, cola = f.largo * 0.45 * (1 - k * 0.5);
      var ca = Math.cos(f.ang), sa = Math.sin(f.ang), cosA = Math.max(0.25, Math.cos(f.alt * RAD));
      var hA = E.proyHor(f.az + ca * d / cosA, f.alt - sa * d, 0), tA = E.proyHor(f.az + ca * (d - cola) / cosA, f.alt - sa * (d - cola), 0);
      if (!hA || !tA) return;
      var al = f.brillo * (k < 0.15 ? k / 0.15 : 1 - U.tramo(k, 0.6, 1));
      var g = ctx.createLinearGradient(tA[0], tA[1], hA[0], hA[1]); g.addColorStop(0, 'rgba(236,230,214,0)'); g.addColorStop(1, U.rgba(HUESO, al));
      ctx.strokeStyle = g; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(tA[0], tA[1]); ctx.lineTo(hA[0], hA[1]); ctx.stroke();
      var gg = ctx.createRadialGradient(hA[0], hA[1], 0, hA[0], hA[1], 6); gg.addColorStop(0, U.rgba(HUESO, al * 0.7)); gg.addColorStop(1, U.rgba(HUESO, 0)); ctx.fillStyle = gg; ctx.fillRect(hA[0] - 6, hA[1] - 6, 12, 12);
    });
    if (satelite) {
      var s = satelite, k = s.t / s.dur, az = U.lerp(s.a, s.b, k), alt = s.h * Math.sin(Math.PI * k) + 6, p = E.proyHor(az, alt, 0);
      if (p && alt > CI.horizonte(az) + 1) { var a = U.meseta(k, 0, 0.08, 0.8, 1) * 0.85; ctx.fillStyle = U.rgba(HUESO, a); ctx.beginPath(); ctx.arc(p[0], p[1], 1.25, 0, TAU); ctx.fill(); }
    }
  }

  /* ---------- el suelo ---------- */
  function contorno(fn, desde, hasta, paso) {
    var pts = [];
    for (var az = desde; az <= hasta + 1e-6; az += paso) { var q = E.proyHor(az, fn(az), -0.92); if (q) pts.push(q); }
    return pts;
  }
  function cerrar(pts) {
    var p = new Path2D(); if (pts.length < 2) return p;
    var a = pts[0], b = pts[pts.length - 1], abajo = E.H + 3000;
    p.moveTo(a[0], abajo); pts.forEach(function (q) { p.lineTo(q[0], q[1]); }); p.lineTo(b[0], abajo); p.closePath();
    return p;
  }
  function suelo(ctx) {
    var desde = E.az - 130, hasta = E.az + 130, ppd = E.pxGrado(), ox = -E.az * ppd, oy = E.alt * ppd, tt = E.t;
    // el Teide, asomando sobre el mar de nubes (rumbo 114°, a 132 km)
    var tq = E.proyHor(114, 0, -0.5);
    if (tq) silueta(ctx, 114, NUBES - 0.6, function (c) { c.moveTo(-8, 0); c.bezierCurveTo(-6, 0.4, -4.6, 1.0, -3.6, 1.45); c.bezierCurveTo(-3.0, 1.75, -2.4, 1.7, -1.9, 1.85); c.bezierCurveTo(-1.2, 2.3, -0.7, 2.75, -0.35, 3.05); c.lineTo(0.35, 3.1); c.bezierCurveTo(1.0, 2.6, 2.4, 1.4, 4.2, 0.75); c.bezierCurveTo(5.6, 0.3, 7, 0.1, 9, 0); c.closePath(); }, 1.05);
    // el mar de nubes: su techo ondula despacio
    var nubes = contorno(function (az) { return NUBES + 0.18 * Math.sin(az * 0.21 + tt / 5200) + 0.1 * Math.sin(az * 0.63 - tt / 3100); }, desde, hasta, 1.5);
    var pn = cerrar(nubes);
    ctx.fillStyle = TINTA; ctx.fill(pn);
    moverTrama(tramaNube, ox + tt / 900, oy); ctx.fillStyle = tramaNube; ctx.fill(pn);
    ctx.lineCap = 'round'; ctx.setLineDash([0.01, 2.6]); ctx.lineWidth = 1.4; ctx.strokeStyle = 'rgba(214,226,240,.5)'; var fn = new Path2D(); nubes.forEach(function (q, j) { if (j) fn.lineTo(q[0], q[1]); else fn.moveTo(q[0], q[1]); }); ctx.stroke(fn); ctx.setLineDash([]);
    if (nubes.length) { var yn = nubes[Math.floor(nubes.length / 2)][1], gn = ctx.createLinearGradient(0, yn - 4, 0, yn + ppd * 6); gn.addColorStop(0, 'rgba(9,9,10,0)'); gn.addColorStop(1, 'rgba(9,9,10,.82)'); ctx.fillStyle = gn; ctx.fill(pn); }
    // la cumbre: tierra en puntos, más callada arriba y más clara abajo
    var cima = contorno(perfil, desde, hasta, 1), pc = cerrar(cima);
    ctx.fillStyle = TINTA; ctx.fill(pc);
    moverTrama(tramaSuelo, ox, oy); ctx.fillStyle = tramaSuelo; ctx.fill(pc);
    var yc = E.proyHor(E.az, perfil(E.az), -0.92);
    if (yc) { var g = ctx.createLinearGradient(0, yc[1] - ppd * 3, 0, yc[1] + ppd * 30); g.addColorStop(0, 'rgba(9,9,10,.82)'); g.addColorStop(0.45, 'rgba(9,9,10,.45)'); g.addColorStop(1, 'rgba(9,9,10,.08)'); ctx.fillStyle = g; ctx.fill(pc); }
    ctx.lineCap = 'round'; ctx.setLineDash([0.01, 3.4]); ctx.lineWidth = 1.3; ctx.strokeStyle = 'rgba(236,230,214,.42)';
    var borde = new Path2D(); cima.forEach(function (q, j) { if (j) borde.lineTo(q[0], q[1]); else borde.moveTo(q[0], q[1]); }); ctx.stroke(borde);
    ctx.setLineDash([]);
    // las siluetas, ancladas a su rumbo
    SILUETAS.forEach(function (s) { if (Math.abs(U.difAng(E.az, s.az)) < 120) silueta(ctx, s.az, perfil(s.az) + (s.dy || 0), s.dibujo, s.escala || 1, s.luz); });
    // los puntos cardinales, sobre el suelo
    ctx.font = '500 10px "IBM Plex Mono", monospace'; if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
    [[0, 'N'], [45, 'NE'], [90, 'E'], [135, 'SE'], [180, 'S'], [225, 'SO'], [270, 'O'], [315, 'NO']].forEach(function (c) {
      var q = E.proyHor(c[0], Math.min(perfil(c[0]), NUBES) - 2.2, -0.5); if (!q || q[0] < 20 || q[0] > E.W - 20 || q[1] > E.H - 10) return;
      rotulo(ctx, c[1], q[0], q[1], c[1].length === 1 ? 'rgba(236,230,214,.75)' : 'rgba(236,230,214,.45)', 'center');
    });
  }
  // una silueta en grados (x a la derecha, y hacia arriba), anclada en el rumbo az y la altura alt; se rellena de tinta y
  // se bordea de puntos claros. luz(c): lo que brilla (la rendija), en el acento
  function silueta(ctx, az, alt, dibujo, escala, luz) {
    var p0 = E.proyHor(az, alt, -0.6), p1 = E.proyHor(az, alt + 1, -0.6); if (!p0 || !p1) return;
    var s = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * escala, ux = 0, uy = -s; if (s < 0.3) return;   // derechas aunque el horizonte se curve en los bordes
    if (p0[0] < -s * 20 || p0[0] > E.W + s * 20) return;
    var d = E.dpr;
    ctx.save(); ctx.setTransform(-uy * d, ux * d, ux * d, uy * d, p0[0] * d, p0[1] * d);
    // ojo: con y hacia arriba en local, el vector «arriba» es (ux, uy) y «derecha» es (−uy, ux)
    ctx.beginPath(); dibujo(ctx); ctx.fillStyle = TINTA; ctx.fill();
    ctx.lineCap = 'round'; ctx.setLineDash([0.01 / s, 3.4 / s]); ctx.lineWidth = 1.3 / s; ctx.strokeStyle = 'rgba(236,230,214,.6)'; ctx.stroke(); ctx.setLineDash([]);
    if (luz) luz(ctx, s);
    ctx.restore();
  }
  CI.silueta = silueta;

  /* ---------- las siluetas de la cumbre ---------- */
  function roca(c, pts) { pts.forEach(function (q, k) { c[k ? 'lineTo' : 'moveTo'](q[0], q[1]); }); c.closePath(); }
  function pino(c, h) {
    for (var k = 0; k < 6; k++) { var u = k / 6, w = h * 0.2 * (1 - u * 0.75), y = h * 0.12 + u * h * 0.78; c.moveTo(-w, y); c.lineTo(w * 0.15, y + h * 0.2); c.lineTo(w, y); c.closePath(); }
    c.rect(-h * 0.02, -1, h * 0.04, h * 0.2);
  }
  function cupula(r, alto, ancho) {
    return function (c) { c.moveTo(-ancho, -1.5); c.lineTo(-ancho, alto); c.lineTo(-r, alto); c.arc(0, alto, r, Math.PI, 0, true); c.lineTo(ancho, alto); c.lineTo(ancho, -1.5); c.closePath(); };
  }
  var SILUETAS = [
    // el Gran Telescopio Canarias (10,4 m, el mayor telescopio óptico de un solo espejo del mundo), con la rendija abierta
    { az: 201, dibujo: cupula(4.6, 3.2, 4.8), luz: function (c, s) {
      var g = c.createRadialGradient(0, 6.2, 0, 0, 6.2, 6); g.addColorStop(0, 'rgba(159,216,255,.24)'); g.addColorStop(1, 'rgba(159,216,255,0)'); c.fillStyle = g; c.fillRect(-6, 0.2, 12, 12);
      c.beginPath(); c.moveTo(-0.62, 3.6); c.lineTo(-0.5, 7.7); c.lineTo(0.5, 7.7); c.lineTo(0.62, 3.6); c.closePath(); c.fillStyle = 'rgba(159,216,255,.88)'; c.fill();
    } },
    { az: 214, dibujo: cupula(1.9, 1.5, 2.9) },
    { az: 222, dibujo: cupula(1.3, 1.1, 2.1) },
    { az: 190, dibujo: function (c) { c.moveTo(-0.7, -1); c.lineTo(-0.12, 6.8); c.lineTo(0.12, 6.8); c.lineTo(0.7, -1); c.closePath(); c.rect(-0.9, 4.8, 1.8, 0.16); c.rect(-0.6, 2.6, 1.2, 0.14); } },   // un mástil de celosía
    // alguien con su telescopio (mira hacia el sur)
    { az: 170, dibujo: function (c) {
      c.moveTo(0.55, 5.3); c.arc(0, 5.3, 0.55, 0, TAU);
      c.moveTo(-0.85, 4.5); c.lineTo(0.85, 4.5); c.lineTo(0.7, 2.0); c.lineTo(-0.7, 2.0); c.closePath();
      c.rect(-0.7, -1, 0.5, 3.1); c.rect(0.2, -1, 0.5, 3.1);
      c.moveTo(1.2, 4.6); c.lineTo(6.3, 8.0); c.lineTo(6.75, 7.3); c.lineTo(1.65, 3.95); c.closePath();
      c.moveTo(3.5, 5.6); c.lineTo(2.4, -1); c.lineTo(2.7, -1); c.lineTo(3.7, 5.3); c.lineTo(4.6, -1); c.lineTo(4.9, -1); c.lineTo(3.8, 5.6); c.closePath();
    } },
    // los «muchachos»: las rocas que, según la tradición, parecen un grupo de chicos y dan nombre al Roque
    { az: 16, dibujo: function (c) { roca(c, [[-13, -1], [-12.5, 0.6], [-11.2, 1.1], [-10.6, 2.4], [-10.1, 2.2], [-9.6, 3.6], [-9.0, 3.4], [-8.5, 1.8], [-7.2, 1.5], [-6.6, 2.9], [-6.1, 4.6], [-5.4, 4.3], [-5.0, 5.4], [-4.4, 5.2], [-4.1, 3.4], [-3.0, 2.6], [-2.4, 3.8], [-1.7, 6.1], [-1.1, 6.6], [-0.6, 6.2], [-0.2, 4.4], [0.6, 3.6], [1.3, 4.9], [1.9, 4.6], [2.3, 3.0], [3.4, 2.2], [4.1, 3.3], [4.6, 3.1], [5.1, 1.9], [6.6, 1.4], [7.4, 2.5], [8.0, 2.3], [8.6, 1.1], [10.4, 0.7], [12, -1]]); } },
    // pinos canarios, ladera abajo
    { az: 146, dy: -0.4, dibujo: function (c) { pino(c, 9); } }, { az: 150, dy: -0.3, dibujo: function (c) { pino(c, 6.5); } }, { az: 153.5, dy: -0.2, dibujo: function (c) { pino(c, 4.8); } },
    { az: 236, dy: -0.4, dibujo: function (c) { pino(c, 7.5); } }, { az: 240, dy: -0.4, dibujo: function (c) { pino(c, 10); } },
    { az: 329, dy: -0.3, dibujo: function (c) { pino(c, 8); } }, { az: 333, dy: -0.3, dibujo: function (c) { pino(c, 5.5); } }
  ];
})();
