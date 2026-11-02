/* Astra Incognita · piezas de las escenas
   Lo que comparten los secretos: el salto de la cámara a un punto del cielo (con un fundido a negro tinta y la vuelta a
   donde estabas al acabar), los rótulos de cristal oscuro con el filo azul de la lupa, los paneles, las láminas de papel
   y la letra. Todo en píxeles CSS. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, CI = AS.cielo;
  var TAU = Math.PI * 2, RAD = Math.PI / 180, ACENTO = '#9fd8ff', HUESO = '#ece6d6', NOCHE = 'rgba(9,9,10,.88)';
  var S = AS.esc = { ACENTO: ACENTO, HUESO: HUESO };

  /* ---------- la cámara ---------- */
  S.pos = function (ra, dec) { return E.proy(ra, dec); };
  S.guardar = function () { return { lst: E.lst, az: E.az, alt: E.alt, zoom: E.zoom }; };
  S.restaurar = function (g) { if (!g) return; E.lst = g.lst; E.az = g.az; E.alt = g.alt; E.zoom = g.zoom; E.vAz = E.vAlt = 0; E.obj = null; E.matriz(); CI.velo = 1; };
  // colocar el cielo y la cámara para ver (ra, dec): por defecto, con el objeto pasando por el meridiano (lo más alto posible)
  S.colocar = function (d) {
    E.lst = d.lst != null ? d.lst : d.ra; E.matriz();
    if (d.lst == null && E.horizontal(d.ra, d.dec).alt > 70) E.lst = (d.ra - 2.5 + 24) % 24;
    E.zoom = d.zoom || 1; E.matriz();
    var h = E.horizontal(d.ra, d.dec);
    E.az = d.az != null ? d.az : h.az; E.alt = U.clamp(d.alt != null ? d.alt : h.alt + (d.dAlt || 0), E.ALT_MIN, E.ALT_MAX);
    E.vAz = E.vAlt = 0; E.obj = null; E.matriz();
    // que el objeto quede donde manda la escena (a la derecha de la tarjeta en el ordenador), no tapado por ella
    var cc = d.donde || S.centro();
    for (var i = 0; i < 4; i++) {
      var p = E.proy(d.ra, d.dec); if (!p) break;
      var ppd = E.pxGrado();
      E.az = (E.az + (p[0] - cc[0]) / ppd / Math.max(0.3, Math.cos(E.alt * RAD)) + 360) % 360;
      E.alt = U.clamp(E.alt - (p[1] - cc[1]) / ppd, E.ALT_MIN, E.ALT_MAX); E.matriz();
    }
  };
  // un salto con fundido: a los 0,5 s, con todo negro, la cámara ya está en su sitio; al acabar la escena se vuelve
  S.salto = function (destino) {
    var g = null, hecho = false;
    return {
      inicio: function () { g = S.guardar(); hecho = false; },
      cuadro: function (t) { if (!hecho && t >= 500) { hecho = true; S.colocar(typeof destino === 'function' ? destino() : destino); } },
      velo: function (c, t, D) { var a = t < 500 ? U.suave(t / 500) : 1 - U.suave((t - 500) / 700); if (D && t > D - 600) a = Math.max(a, U.suave((t - (D - 600)) / 500)); if (a > 0.003) { c.fillStyle = 'rgba(9,9,10,' + a.toFixed(3) + ')'; c.fillRect(0, 0, E.W, E.H); } },
      fin: function () { S.restaurar(g); }
    };
  };

  /* ---------- letra ---------- */
  S.mono = function (c, txt, x, y, tam, color, alin, a) {
    if (a != null && a <= 0) return;
    c.save(); if (a != null) c.globalAlpha *= a; c.font = '500 ' + tam + 'px "IBM Plex Mono", monospace'; c.textAlign = alin || 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = (tam * 0.2).toFixed(1) + 'px';
    c.fillStyle = color || HUESO; c.fillText(txt, x, y); c.restore();
  };
  S.serif = function (c, txt, x, y, tam, color, alin, cursiva, a) {
    if (a != null && a <= 0) return;
    c.save(); if (a != null) c.globalAlpha *= a; c.font = (cursiva ? 'italic ' : '') + '400 ' + tam + 'px "Instrument Serif", Georgia, serif'; c.textAlign = alin || 'center'; c.textBaseline = 'middle';
    c.fillStyle = color || HUESO; c.fillText(txt, x, y); c.restore();
  };
  // un rótulo de cristal oscuro con el filo azul (sobre el cielo)
  S.rotulo = function (c, txt, x, y, a, color, tam) {
    if (a <= 0) return;
    c.save(); c.globalAlpha *= a; tam = tam || 11;
    c.font = '500 ' + tam + 'px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = (tam * 0.2).toFixed(1) + 'px';
    var w = c.measureText(txt).width + tam * 1.7, h = tam * 2;
    x = U.clamp(x, w / 2 + 8, E.W - w / 2 - 8);
    c.fillStyle = NOCHE; c.fillRect(x - w / 2, y - h / 2, w, h);
    c.strokeStyle = 'rgba(159,216,255,.38)'; c.lineWidth = 1; c.strokeRect(x - w / 2 + 2.5, y - h / 2 + 2.5, w - 5, h - 5);
    c.fillStyle = color || HUESO; c.fillText(txt, x, y + 0.5);
    c.restore();
  };
  // un anillo de puntos alrededor de algo del cielo, con su rótulo
  S.anillo = function (c, x, y, r, a, txt, abajo) {
    if (a <= 0) return;
    c.save(); c.globalAlpha *= a; c.fillStyle = 'rgba(159,216,255,.85)';
    var n = Math.max(24, Math.round(r * TAU / 4.6));
    for (var i = 0; i < n; i++) { var an = i / n * TAU; c.fillRect(x + Math.cos(an) * r - 0.9, y + Math.sin(an) * r - 0.9, 1.8, 1.8); }
    c.restore();
    if (txt) S.rotulo(c, txt, x, y + (abajo ? r + 22 : -r - 22), a, ACENTO, 10);
  };
  // una línea de puntos (en el acento por defecto), con un avance 0…1
  S.punteada = function (c, x0, y0, x1, y1, k, a, color, paso) {
    if (a <= 0 || k <= 0) return;
    c.save(); c.globalAlpha *= a; c.strokeStyle = color || 'rgba(159,216,255,.9)'; c.lineWidth = 1.8; c.lineCap = 'round'; c.setLineDash([0.01, paso || 3.6]);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(U.lerp(x0, x1, k), U.lerp(y0, y1, k)); c.stroke(); c.restore();
  };
  // un destello en el azul de la lupa
  S.destello = function (c, x, y, r, a, col) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = Math.min(1, a); c.globalCompositeOperation = 'lighter';
    var g = c.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, 'rgba(235,245,255,.9)'); g.addColorStop(1, col || 'rgba(159,216,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3, 0, TAU); c.fill();
    c.fillStyle = '#f4f9ff'; c.fillRect(x - r * 2.4, y - 0.6, r * 4.8, 1.2); c.fillRect(x - 0.6, y - r * 2.4, 1.2, r * 4.8);
    c.restore();
  };
  // un disco de puntos (para nebulosas, galaxias, cúmulos): semilla fija, para que no baile
  S.nube = function (c, x, y, rx, ry, rot, n, semilla, color, a, tam) {
    if (a <= 0) return;
    var r = U.azar(semilla), cr = Math.cos(rot), sr = Math.sin(rot);
    c.save(); c.globalAlpha *= a; c.fillStyle = color;
    for (var i = 0; i < n; i++) {
      var u = Math.sqrt(-2 * Math.log(r() + 1e-9)) * 0.42, an = r() * TAU, px = Math.cos(an) * u * rx, py = Math.sin(an) * u * ry, s = (tam || 1) * (0.6 + r() * 0.8);
      c.fillRect(x + px * cr - py * sr - s / 2, y + px * sr + py * cr - s / 2, s, s);
    }
    c.restore();
  };

  /* ---------- paneles y láminas ---------- */
  S.panel = function (c, x, y, w, h, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha *= a; c.fillStyle = 'rgba(9,9,10,.9)'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(159,216,255,.32)'; c.lineWidth = 1; c.strokeRect(x + 4.5, y + 4.5, w - 9, h - 9);
    c.strokeStyle = 'rgba(236,230,214,.14)'; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.restore();
  };
  // una lámina de papel (para documentos: el listado de 1977, la crónica china…); dibujo recibe el rectángulo de dentro
  S.lamina = function (c, x, y, w, h, a, dibujo, papel) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(x + 10, y + 12, w, h);
    c.fillStyle = papel || '#ece6d6'; c.fillRect(x, y, w, h);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); dibujo(x, y, w, h); c.restore();
    c.strokeStyle = 'rgba(9,9,10,.35)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    c.restore();
  };
  // dónde va una pieza de w × h: a la derecha en el ordenador (la tarjeta va a la izquierda), arriba en el móvil
  S.sitio = function (w, h) {
    var W = E.W, H = E.H, movil = W < 760;
    var s = movil ? Math.min(1, (W - 32) / w, (H * 0.39) / h) : Math.min(1, (W * 0.44) / w, (H * 0.74) / h);
    return { x: movil ? W / 2 - w * s / 2 : W * 0.95 - w * s, y: movil ? H * 0.1 : H / 2 - h * s / 2 - H * 0.02, s: s, w: w * s, h: h * s };
  };
  // el centro libre para lo que pasa en el cielo (a la derecha de la tarjeta en el ordenador)
  S.centro = function () { return E.W < 760 ? [E.W / 2, E.H * 0.34] : [E.W * 0.64, E.H * 0.44]; };
  // con un panel a la derecha: el objeto arriba, entre la marca y el panel
  S.centroConPanel = function () { return E.W < 760 ? [E.W / 2, E.H * 0.66] : [E.W * 0.36, E.H * 0.3]; };
})();
