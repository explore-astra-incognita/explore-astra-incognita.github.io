/* Astra Incognita · motor
   La esfera celeste vista desde dentro, desde la cumbre de La Palma (el Roque de los Muchachos, 28,76° N). La cámara mira
   en una dirección (rumbo y altura sobre el horizonte) y proyecta en estereográfica, que conserva las formas de las
   constelaciones. El cielo gira con el tiempo sidéreo acelerado (una hora del cielo por minuto). La entrada (arrastre,
   rueda, pellizco, teclado) se convierte en eventos con nombre, como en el resto de la familia. Todo en píxeles CSS. */
(function () {
  'use strict';
  var AS = window.AS = window.AS || {};
  var TAU = Math.PI * 2, RAD = Math.PI / 180;

  /* ------------------------------------------------------------------ utilidades */
  var U = AS.util = {
    clamp: function (x, a, b) { return x < a ? a : x > b ? b : x; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    tramo: function (t, a, b) { return U.clamp((t - a) / (b - a), 0, 1); },
    suave: function (t) { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); },
    sale: function (t) { t = U.clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); },
    inOut: function (t) { t = U.clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    meseta: function (t, a, b, c, d) { return t < a || t > d ? 0 : t < b ? U.suave((t - a) / (b - a)) : t > c ? 1 - U.suave((t - c) / (d - c)) : 1; },
    azar: function (semilla) { var s = (semilla | 0) || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; },
    rgba: function (c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')'; },
    dos: function (n) { return (n < 10 ? '0' : '') + n; },
    num: function (x, dec) {
      var s = Math.abs(x).toFixed(dec || 0).split('.'), ent = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return (x < 0 ? '−' : '') + ent + (s[1] ? ',' + s[1] : '');
    },
    // el ángulo más corto de a a b (en grados)
    difAng: function (a, b) { return ((b - a) % 360 + 540) % 360 - 180; },
    // 05 H 35 M · −05° 23′
    ar: function (h) { h = ((h % 24) + 24) % 24; var hh = Math.floor(h), mm = Math.floor((h - hh) * 60); return U.dos(hh) + ' H ' + U.dos(mm) + ' M'; },
    dec: function (d) { var s = d < 0 ? '−' : '+', a = Math.abs(d), g = Math.floor(a), m = Math.floor((a - g) * 60); return s + U.dos(g) + '° ' + U.dos(m) + '′'; }
  };
  AS.color = { tinta: [9, 9, 10], hueso: [236, 230, 214], acento: [159, 216, 255] };

  /* ------------------------------------------------------------------ el motor */
  var E = AS.motor = {
    t: 0, W: 800, H: 600, dpr: 1, S: 500,
    lat: 28.76,                     // el Roque de los Muchachos
    lst: 2.6,                       // la hora sidérea: empieza con Orión saliendo por el este, sobre el Teide
    ritmo: 1 / 60000,               // horas del cielo por milisegundo (una hora por minuto)
    az: 106, alt: 25, zoom: 1,      // la cámara: rumbo (0 = norte, 90 = este), altura y acercamiento
    vAz: 0, vAlt: 0, obj: null,
    puntero: { x: -999, y: -999, sobre: false, tipo: 'mouse', velocidad: 0 },
    senal: 0, escena: null, bloqueado: false, ligero: false, lectura: 5000, ultimoInput: 0,
    oyentes: {}, capas: [], M: null
  };
  var cv, ctx, raf = window.requestAnimationFrame.bind(window), ultimoRaf = null, congelado = false, cam = null, mediaDt = 16, nMedidos = 0;
  E.ALT_MIN = -8; E.ALT_MAX = 90; E.ZOOM_MIN = 0.7; E.ZOOM_MAX = 6;
  // mirando hacia arriba no se puede alejar tanto que el suelo entre por los lados: el borde de la pantalla se queda
  // a más de 11° sobre el horizonte (por encima de los pinos y del GTC). Mirando al frente, el mínimo de siempre.
  E.zoomMin = function () {
    var w = U.clamp((E.alt - 60) / 22, 0, 1); w = w * w * (3 - 2 * w);
    if (w <= 0) return E.ZOOM_MIN;
    var h = E.alt * RAD, ch = Math.cos(h), sh = Math.sin(h), lim = Math.sin(11 * RAD), base = Math.min(0.6 * E.H, 0.95 * E.W);
    var bordes = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [-0.5, -1], [0.5, -1]];
    function libre(S) {
      for (var i = 0; i < bordes.length; i++) {
        var X = bordes[i][0] * E.W / 2 / S, Y = bordes[i][1] * E.H / 2 / S, r2 = X * X + Y * Y, Z = (4 - r2) / (4 + r2), k = (1 + Z) / 2;
        if (Y * k * ch + Z * sh < lim) return false;
      }
      return true;
    }
    var lo = E.ZOOM_MIN, hi = E.ZOOM_MAX;
    if (libre(lo * base)) return E.ZOOM_MIN;
    for (var j = 0; j < 22; j++) { var m = (lo + hi) / 2; if (libre(m * base)) hi = m; else lo = m; }
    return U.lerp(E.ZOOM_MIN, hi, w);
  };

  E.en = function (n, fn) { (E.oyentes[n] = E.oyentes[n] || []).push(fn); };
  function emitir(n, d) { var l = E.oyentes[n]; if (!l) return; for (var i = 0; i < l.length; i++) { try { l[i](d); } catch (err) { console.error(err); } } }
  E.emitir = emitir;

  /* ---------- la matriz: de ecuatoriales (x hacia 0 h, y hacia 6 h, z al polo) a la cámara (derecha, arriba, delante) ---------- */
  function matriz() {
    var L = E.lst * 15 * RAD, f = E.lat * RAD, cL = Math.cos(L), sL = Math.sin(L), cf = Math.cos(f), sf = Math.sin(f);
    // ecuatoriales → horizontales (este, norte, cénit)
    var Hm = [[-sL, cL, 0], [-sf * cL, -sf * sL, cf], [cf * cL, cf * sL, sf]];
    var A = E.az * RAD, h = E.alt * RAD;
    var r = [Math.cos(A), -Math.sin(A), 0], fw = [Math.sin(A) * Math.cos(h), Math.cos(A) * Math.cos(h), Math.sin(h)];
    var u = [r[1] * fw[2] - r[2] * fw[1], r[2] * fw[0] - r[0] * fw[2], r[0] * fw[1] - r[1] * fw[0]];
    E.Hm = Hm; E.cam = [r, u, fw];
    var M = [];
    [r, u, fw].forEach(function (b) { M.push([0, 1, 2].map(function (j) { return b[0] * Hm[0][j] + b[1] * Hm[1][j] + b[2] * Hm[2][j]; })); });
    E.M = M;
    E.S = Math.min(0.6 * E.H, 0.95 * E.W) * E.zoom;
  }
  E.matriz = matriz;
  // ecuatoriales en grados (AR en horas) → vector
  E.vec = function (raH, dec) { var a = raH * 15 * RAD, d = dec * RAD; return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)]; };
  // un vector de la cámara → pantalla (o null si queda detrás)
  E.proyCam = function (X, Y, Z, fuera) {
    if (Z < (fuera == null ? -0.35 : fuera)) return null;
    var k = E.S * 2 / (1 + Z); return [E.W / 2 + X * k, E.H / 2 - Y * k, Z];
  };
  E.proy = function (raH, dec) { var v = E.vec(raH, dec), M = E.M; return E.proyCam(M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]); };
  // horizontales (rumbo, altura en grados) → pantalla
  E.proyHor = function (az, alt, fuera) {
    var a = az * RAD, h = alt * RAD, v = [Math.sin(a) * Math.cos(h), Math.cos(a) * Math.cos(h), Math.sin(h)], c = E.cam;
    return E.proyCam(c[0][0] * v[0] + c[0][1] * v[1] + c[0][2] * v[2], c[1][0] * v[0] + c[1][1] * v[1] + c[1][2] * v[2], c[2][0] * v[0] + c[2][1] * v[1] + c[2][2] * v[2], fuera);
  };
  // pantalla → dirección: { ra (h), dec, az, alt }
  E.desproy = function (x, y) {
    var X = (x - E.W / 2) / E.S, Y = -(y - E.H / 2) / E.S, r2 = X * X + Y * Y, Z = (4 - r2) / (4 + r2), k = (1 + Z) / 2;
    X *= k; Y *= k;
    var c = E.cam, hv = [c[0][0] * X + c[1][0] * Y + c[2][0] * Z, c[0][1] * X + c[1][1] * Y + c[2][1] * Z, c[0][2] * X + c[1][2] * Y + c[2][2] * Z];
    var H = E.Hm, q = [H[0][0] * hv[0] + H[1][0] * hv[1] + H[2][0] * hv[2], H[0][1] * hv[0] + H[1][1] * hv[1] + H[2][1] * hv[2], H[0][2] * hv[0] + H[1][2] * hv[1] + H[2][2] * hv[2]];
    var ra = Math.atan2(q[1], q[0]) / RAD / 15; if (ra < 0) ra += 24;
    return { ra: ra, dec: Math.asin(U.clamp(q[2], -1, 1)) / RAD, az: (Math.atan2(hv[0], hv[1]) / RAD + 360) % 360, alt: Math.asin(U.clamp(hv[2], -1, 1)) / RAD };
  };
  // ecuatoriales → horizontales (para saber si algo está por encima del horizonte)
  E.horizontal = function (raH, dec) {
    var v = E.vec(raH, dec), H = E.Hm, e = H[0][0] * v[0] + H[0][1] * v[1] + H[0][2] * v[2], n = H[1][0] * v[0] + H[1][1] * v[1] + H[1][2] * v[2], z = H[2][0] * v[0] + H[2][1] * v[1] + H[2][2] * v[2];
    return { az: (Math.atan2(e, n) / RAD + 360) % 360, alt: Math.asin(U.clamp(z, -1, 1)) / RAD };
  };
  // píxeles por grado en el centro de la pantalla
  E.pxGrado = function () { return E.S * RAD; };

  /* ---------- la cámara: movimientos guiados (escenas, secretos) ---------- */
  E.irA = function (az, alt, zoom, ms, ease) {
    cam = { az0: E.az, az1: E.az + U.difAng(E.az, az), alt0: E.alt, alt1: U.clamp(alt, E.ALT_MIN, E.ALT_MAX), z0: E.zoom, z1: zoom == null ? E.zoom : zoom, t0: E.t, dur: ms || 1600, ease: ease || U.inOut };
    E.vAz = E.vAlt = 0; E.obj = null;
  };
  // centrar una estrella o un punto del cielo (AR en horas, dec)
  E.mirarA = function (raH, dec, zoom, ms) { var h = E.horizontal(raH, dec); E.irA(h.az, Math.max(h.alt, 6), zoom, ms); };
  E.camaraActiva = function () { return !!cam; };

  /* ---------- tamaño ---------- */
  function medir() {
    var w = window.innerWidth, h = window.innerHeight;
    E.W = w; E.H = h;
    E.dpr = E.ligero ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * E.dpr); cv.height = Math.round(h * E.dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    matriz();
    emitir('tamano', { W: w, H: h });
  }

  /* ---------- la espera a WebKit (ver guía 05) ---------- */
  var unPixel = null;
  E.vaciar = function () {
    if (!unPixel) { unPixel = document.createElement('canvas'); unPixel.width = unPixel.height = 1; unPixel = unPixel.getContext('2d', { willReadFrequently: true }); }
    try { unPixel.fillRect(0, 0, 1, 1); unPixel.getImageData(0, 0, 1, 1); } catch (err) { /* nada */ }
  };

  /* ---------- dibujar un fotograma ---------- */
  function dibujar() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    var esc = E.escena, s = esc && esc.s, t = esc ? esc.t : 0;
    AS.cielo.dibujar(ctx, s, t);
    if (!s) for (var i = 0; i < E.capas.length; i++) { try { E.capas[i](ctx, E.t); } catch (err) { console.error(err); } }
    if (s && s.frente) { try { s.frente(ctx, t); } catch (err) { console.error(err); } }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- un paso del reloj ---------- */
  function actualizar(dt) {
    E.t += dt;
    var esc = E.escena, antes = [E.az, E.alt, E.zoom];
    if (!esc || !esc.s.pararCielo) E.lst = (E.lst + dt * E.ritmo * (esc && esc.s.ritmo != null ? esc.s.ritmo : 1)) % 24;
    if (cam) {
      var k = U.clamp((E.t - cam.t0) / cam.dur, 0, 1), e = cam.ease(k);
      E.az = (U.lerp(cam.az0, cam.az1, e) + 360) % 360; E.alt = U.lerp(cam.alt0, cam.alt1, e); E.zoom = Math.exp(U.lerp(Math.log(cam.z0), Math.log(cam.z1), e));
      if (k >= 1) cam = null;
    } else if (!esc) {
      // inercia del arrastre y muelle del acercamiento (la rueda no da saltos)
      if (Math.abs(E.vAz) + Math.abs(E.vAlt) > 0.00005) { E.az = (E.az + E.vAz * dt + 360) % 360; E.alt += E.vAlt * dt; var fr = Math.pow(0.93, dt / 16); E.vAz *= fr; E.vAlt *= fr; }
      if (E.obj) {
        var q = 1 - Math.exp(-dt / 120);
        E.zoom = Math.exp(Math.log(E.zoom) + (Math.log(E.obj.zoom) - Math.log(E.zoom)) * q);
        if (Math.abs(E.zoom - E.obj.zoom) < 0.002) { E.zoom = E.obj.zoom; E.obj = null; }
      }
    }
    E.alt = U.clamp(E.alt, E.ALT_MIN, E.ALT_MAX); E.zoom = esc ? U.clamp(E.zoom, E.ZOOM_MIN, 20) : U.clamp(E.zoom, E.zoomMin(), E.ZOOM_MAX);
    if (E.obj && !esc) E.obj.zoom = Math.max(E.obj.zoom, E.zoomMin());
    E.puntero.velocidad *= Math.pow(0.8, dt / 16);
    matriz();
    if (esc) {
      esc.t += dt;
      var sc = esc.s, ta = sc.tarjeta;
      if (ta && !esc.tv && esc.t >= ta.en) { esc.tv = true; AS.interfaz && AS.interfaz.tarjeta(ta); }
      if (ta && esc.tv && !esc.tq && esc.t >= ta.hasta) { esc.tq = true; AS.interfaz && AS.interfaz.tarjeta(null); }
      if (sc.cuadro) { try { sc.cuadro(esc.t, dt); } catch (err) { console.error(err); } }
      if (esc.t >= esc.dur) terminarEscena(false);
    }
    AS.cielo.actualizar(dt);
    if (!esc && !E.bloqueado) emitir('cuadro', { t: E.t, dt: dt, inactivo: E.t - E.ultimoInput, movido: Math.abs(U.difAng(antes[0], E.az)) + Math.abs(E.alt - antes[1]) });
  }
  function paso(dt) { actualizar(dt); dibujar(); }
  function bucle(ahora) {
    if (congelado) return;
    var dt = ultimoRaf === null ? 16 : Math.min(50, ahora - ultimoRaf); ultimoRaf = ahora;
    paso(dt);
    // si el equipo no llega (de media más de 28 ms por fotograma), modo ligero (resolución 1×)
    if (!E.ligero && !E.escena) { mediaDt = mediaDt * 0.95 + dt * 0.05; if (++nMedidos > 120 && mediaDt > 28) { E.ligero = true; medir(); } }
    raf(bucle);
  }

  /* ---------- escenas ---------- */
  E.reproducir = function (h, alTerminar) {
    if (E.escena) return false;
    var s = h.escena(E) || {};
    E.escena = { h: h, s: s, t: 0, dur: s.duracion || 8000, fin: alTerminar };
    E.vAz = E.vAlt = 0; cam = null; arrastre = null; E.obj = null;
    document.documentElement.classList.add('en-escena');
    if (s.inicio) { try { s.inicio(); } catch (err) { console.error(err); } }
    emitir('escena', { fase: 'inicio', huevo: h });
    return true;
  };
  function terminarEscena(saltada) {
    var e = E.escena; if (!e) return;
    try { e.s.fin && e.s.fin(saltada); } catch (err) { console.error(err); }
    E.escena = null; cam = null;
    AS.interfaz && AS.interfaz.tarjeta(null);
    document.documentElement.classList.remove('en-escena');
    E.ultimoInput = E.t;
    emitir('escena', { fase: 'fin', huevo: e.h, saltada: saltada });
    if (e.fin) e.fin(saltada);
  }
  E.saltar = function () { terminarEscena(true); };

  /* ---------- entrada ----------
     Arrastrar (o flechas): mirar a otro lado. Rueda, pellizco o + y −: acercar. Un clic sin moverse: «clic».
     Un secreto puede quedarse un arrastre que empieza sobre algo suyo: en «bajar», d.tomar() (llegan «arrastrar» y «soltar»). */
  var arrastre = null, punteros = {}, pellizco = null;
  function libre() { return !E.escena && !E.bloqueado; }
  function marcar() { E.ultimoInput = E.t; }
  function datos(x, y) { var d = E.desproy(x, y); d.x = x; d.y = y; return d; }
  // grados por píxel para el arrastre (con el acercamiento, se mueve menos)
  function gpp() { return 1 / E.pxGrado(); }

  function alBajar(ev) {
    marcar();
    var p = E.puntero; p.x = ev.clientX; p.y = ev.clientY; p.sobre = true; p.tipo = ev.pointerType || 'mouse';
    if (!libre()) return;
    punteros[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    if (Object.keys(punteros).length === 2) { arrastre = null; pellizco = { d0: null, z0: E.zoom }; return; }
    arrastre = { x0: ev.clientX, y0: ev.clientY, t0: E.t, movido: 0, tomado: false, pts: [[ev.clientX, ev.clientY, E.t]] };
    cam = null; E.vAz = E.vAlt = 0; E.obj = null;
    var d = datos(ev.clientX, ev.clientY); d.tomar = function () { if (arrastre) arrastre.tomado = true; };
    emitir('bajar', d);
    document.documentElement.classList.toggle('arrastrando', !!arrastre && !arrastre.tomado);   // (un secreto puede haber empezado ya)
  }
  function alMover(ev) {
    marcar();
    var p = E.puntero, dx = ev.clientX - p.x, dy = ev.clientY - p.y;
    if (p.sobre && E.t - (p.tm || 0) > 0) { var v = Math.hypot(dx, dy) / Math.max(1, E.t - (p.tm || E.t - 16)); p.velocidad = Math.max(p.velocidad, v); }
    p.x = ev.clientX; p.y = ev.clientY; p.sobre = ev.target === cv || !!arrastre; p.tm = E.t; p.tipo = ev.pointerType || p.tipo;
    if (punteros[ev.pointerId]) { punteros[ev.pointerId].x = ev.clientX; punteros[ev.pointerId].y = ev.clientY; }
    if (!libre()) return;
    if (pellizco) {
      var ids = Object.keys(punteros); if (ids.length < 2) return;
      var d = Math.hypot(punteros[ids[0]].x - punteros[ids[1]].x, punteros[ids[0]].y - punteros[ids[1]].y);
      if (pellizco.d0 == null) pellizco.d0 = d;
      var zq = pellizco.z0 * d / Math.max(20, pellizco.d0);
      if (zq > E.ZOOM_MAX * 1.12 && E.t - (pellizco.empuje || 0) > 300) { pellizco.empuje = E.t; emitir('empujar', { lado: 'cerca', d: zq / E.ZOOM_MAX }); }
      E.zoom = U.clamp(zq, E.zoomMin(), E.ZOOM_MAX); return;
    }
    var A = arrastre;
    if (A) {
      var ult = A.pts[A.pts.length - 1];
      A.movido += Math.hypot(ev.clientX - ult[0], ev.clientY - ult[1]);
      if (A.tomado) emitir('arrastrar', datos(ev.clientX, ev.clientY));
      else if (A.movido > 3) {
        // el cielo se agarra: arrastrar a la derecha gira la mirada a la izquierda
        var g = gpp(), mx = ev.clientX - ult[0], my = ev.clientY - ult[1];
        E.az = (E.az - mx * g / Math.max(0.35, Math.cos(E.alt * RAD)) + 360) % 360;
        var alt0 = E.alt; E.alt = U.clamp(E.alt + my * g, E.ALT_MIN, E.ALT_MAX);
        if (my > 0 && alt0 >= E.ALT_MAX - 0.01) emitir('empujar', { lado: 'cenit', d: my });
        if (my < 0 && alt0 <= E.ALT_MIN + 0.01) emitir('empujar', { lado: 'suelo', d: -my });
      }
      A.pts.push([ev.clientX, ev.clientY, E.t]);
    } else emitir('mover', datos(ev.clientX, ev.clientY));
  }
  function alSubir(ev) {
    marcar();
    delete punteros[ev.pointerId];
    document.documentElement.classList.remove('arrastrando');
    if (pellizco) { if (Object.keys(punteros).length < 2) pellizco = null; arrastre = null; return; }
    var A = arrastre; arrastre = null;
    if (!A || !libre()) return;
    var dur = E.t - A.t0, d = datos(ev.clientX, ev.clientY);
    if (A.tomado) { emitir('soltar', d); return; }
    if (A.movido < 6 && dur < 600) { emitir('clic', datos(A.x0, A.y0)); return; }
    // inercia: lo que llevaba el arrastre en los últimos 80 ms
    var n = A.pts.length;
    if (n > 2) {
      var a = A.pts[Math.max(0, n - 5)], b = A.pts[n - 1], dtA = Math.max(16, b[2] - a[2]), g = gpp();
      if (E.t - b[2] < 90) { E.vAz = -(b[0] - a[0]) / dtA * g / Math.max(0.35, Math.cos(E.alt * RAD)); E.vAlt = (b[1] - a[1]) / dtA * g; }
    }
    var pts = A.pts.map(function (q) { var z = E.desproy(q[0], q[1]); z.x = q[0]; z.y = q[1]; z.t = q[2]; return z; });
    emitir('trazo', { pts: pts, dur: dur, movido: A.movido });
  }
  E.acercar = function (factor) {
    var zMin = E.zoomMin(), base = E.obj ? E.obj.zoom : E.zoom, z = U.clamp(base * factor, zMin, E.ZOOM_MAX);
    if (factor > 1 && base >= E.ZOOM_MAX - 0.001) emitir('empujar', { lado: 'cerca', d: factor });
    if (factor < 1 && base <= zMin + 0.001) emitir('empujar', { lado: 'lejos', d: 1 / factor });
    E.obj = { zoom: z }; cam = null;
    emitir('rueda', { zoom: z });
  };

  E.iniciar = function (lienzo) {
    cv = lienzo; ctx = cv.getContext('2d'); E.ctx = ctx;
    medir();
    window.addEventListener('resize', medir);
    cv.addEventListener('pointerdown', alBajar);
    window.addEventListener('pointermove', function (ev) { if (ev.target === cv || arrastre || pellizco) alMover(ev); else { E.puntero.sobre = false; marcar(); } });
    window.addEventListener('pointerup', alSubir);
    window.addEventListener('pointercancel', function (ev) { delete punteros[ev.pointerId]; arrastre = null; pellizco = null; document.documentElement.classList.remove('arrastrando'); });
    cv.addEventListener('pointerleave', function (ev) { if (ev.pointerType === 'mouse' && !arrastre) E.puntero.sobre = false; });
    cv.addEventListener('wheel', function (ev) {
      ev.preventDefault(); marcar();
      if (!libre()) return;
      var d = ev.deltaY * (ev.deltaMode === 1 ? 16 : 1);
      // el trackpad: dos dedos en horizontal giran la mirada; el pellizco (ctrlKey) y la rueda acercan
      if (!ev.ctrlKey && Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) { E.az = (E.az + ev.deltaX * gpp() * 0.6 + 360) % 360; return; }
      E.acercar(Math.exp(-d * (ev.ctrlKey ? 0.01 : 0.0018)));
    }, { passive: false });
    window.addEventListener('keydown', function (ev) {
      marcar();
      var t = ev.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (ev.key === 'Backspace') ev.preventDefault();
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (libre()) {
        var paso = 0.05 / E.zoom;
        if (ev.key === 'ArrowRight') { ev.preventDefault(); cam = null; E.vAz = paso; }
        if (ev.key === 'ArrowLeft') { ev.preventDefault(); cam = null; E.vAz = -paso; }
        if (ev.key === 'ArrowUp') { ev.preventDefault(); cam = null; E.vAlt = paso; if (E.alt >= E.ALT_MAX - 0.01) emitir('empujar', { lado: 'cenit', d: 40 }); }
        if (ev.key === 'ArrowDown') { ev.preventDefault(); cam = null; E.vAlt = -paso; }
        if (ev.key === '+' || ev.key === '=') E.acercar(1.25);
        if (ev.key === '-' || ev.key === '_') E.acercar(0.8);
      }
      emitir('tecla', { key: ev.key });
    });
    document.addEventListener('visibilitychange', function () { ultimoRaf = null; marcar(); });
    raf(bucle);
  };

  /* ---------- pruebas: pasos manuales (cada fotograma simulado espera a que WebKit lo pinte) ---------- */
  E.congelar = function (si) { congelado = si !== false; if (!congelado) { ultimoRaf = null; raf(bucle); } };
  E.paso = function (ms, trozos) { trozos = trozos || Math.max(1, Math.round(ms / 16)); for (var i = 0; i < trozos; i++) { paso(ms / trozos); E.vaciar(); } };
})();
