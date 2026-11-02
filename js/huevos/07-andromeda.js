/* Secreto 07 · Andrómeda (Distancia)
   Con la vista en la galaxia de Andrómeda y el acercamiento al máximo, seguir acercando (rueda, + o pellizco): tres veces.
   La escena: la mancha se abre en una galaxia espiral de puntos, inclinada como la vemos (eje mayor a 35°, 3,2° de largo),
   con sus dos compañeras (M32 y M110); un rayo de luz viaja hacia nosotros y cuenta los años. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc, CI = AS.cielo, I = function () { return AS.interfaz; };
  var TAU = Math.PI * 2, RAD = Math.PI / 180, RA = 0.7123, DEC = 41.269, PA = 35 * RAD, M32 = [0.7114, 40.865], M110 = [0.6730, 41.685];
  var puntos = null;
  // la galaxia en su plano (en grados): disco exponencial con dos brazos, el bulbo y las bandas de polvo
  function crear() {
    var r = U.azar(964), p = [];
    for (var i = 0; i < 9000; i++) {
      var tipo = r(), x, y, col;
      if (tipo < 0.28) { var u = Math.sqrt(-2 * Math.log(r() + 1e-9)) * 0.12, an = r() * TAU; x = Math.cos(an) * u; y = Math.sin(an) * u * 0.8; col = 0; }
      else { var rr = -Math.log(1 - r() * 0.98) * 0.42, brazo = r() < 0.5 ? 0 : Math.PI, th = Math.log(Math.max(0.05, rr) / 0.08) / 0.32 + brazo + (r() - 0.5) * (r() < 0.6 ? 0.5 : 2.2); x = Math.cos(th) * rr; y = Math.sin(th) * rr; col = rr > 0.9 && r() < 0.4 ? 2 : 1; }
      p.push([x, y, col, r()]);
    }
    return p;
  }
  function vistaCentro() { return E.desproy(E.W / 2, E.H / 2); }

  AS.registrar({
    id: 'andromeda', n: 7, nombre: 'Andrómeda', tipo: 'Distancia',
    pista: 'Lo más lejano que ven tus ojos está en Andrómeda. Acércate a ello más de lo que se puede.',
    detectar: function (api) {
      var cuenta = 0, ultimo = -1e9;
      api.en('empujar', function (d) {
        if (d.lado !== 'cerca') return;
        var L = CI.lupa, c = vistaCentro(), cerca = Math.min(I().sep(c.ra, c.dec, RA, DEC), L.a > 0.5 ? I().sep(L.ra, L.dec, RA, DEC) : 99) < 2.5;
        if (!cerca || E.horizontal(RA, DEC).alt < 2) { cuenta = 0; return; }
        if (E.t - ultimo > 1800) cuenta = 0; ultimo = E.t;
        if (++cuenta >= 3) { cuenta = 0; api.disparar(); }
      });
    },
    escena: function () {
      var D = 16000 + E.lectura, salto = S.salto({ ra: RA, dec: DEC, zoom: 8.5 });
      if (!puntos) puntos = crear();
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 7800, hasta: D - 400, titulo: 'Andrómeda', pie: 'M31 · descrita por al-Sufi en el año 964',
          texto: 'La galaxia de Andrómeda es lo más lejano que se puede ver sin telescopio: está a unos 2,5 millones de años luz, así que la luz que te llega salió de allí cuando en África vivían los primeros humanos. Tiene alrededor de un billón de estrellas y en el cielo ocupa lo que seis lunas llenas, aunque a simple vista solo se ve su centro. El astrónomo persa al-Sufi la describió en el año 964 como una «pequeña nube». Se acerca a nosotros: puede chocar con la Vía Láctea dentro de unos 4.500 millones de años, aunque un estudio de 2025 lo deja en un cara o cruz.' },
        inicio: salto.inicio, cuadro: salto.cuadro, fin: salto.fin,
        frente: function (c, t) {
          var a = U.meseta(t, 1100, 1500, D - 1300, D - 600), p0 = S.pos(RA, DEC);
          if (p0 && a > 0) {
            // la base del plano de la galaxia en la pantalla: norte y este de 1°
            var pn = S.pos(RA, DEC + 1), pe = S.pos(RA + 1 / 15 / Math.cos(DEC * RAD), DEC); if (!pn || !pe) { salto.velo(c, t, D); return; }
            var N = [pn[0] - p0[0], pn[1] - p0[1]], Es = [pe[0] - p0[0], pe[1] - p0[1]];
            var ux = Math.cos(PA) * N[0] + Math.sin(PA) * Es[0], uy = Math.cos(PA) * N[1] + Math.sin(PA) * Es[1], vx = -Math.sin(PA) * N[0] + Math.cos(PA) * Es[0], vy = -Math.sin(PA) * N[1] + Math.cos(PA) * Es[1];
            var kg = U.sale(U.tramo(t, 1400, 4600)), inc = 0.31, cols = ['rgba(255,236,200,', 'rgba(236,230,214,', 'rgba(170,200,255,'];
            c.save();
            for (var i = 0; i < puntos.length; i++) {
              var q = puntos[i]; if (q[3] > kg) continue;
              var gx = q[0] * 1.6, gy = q[1] * 1.6 * inc, sx = p0[0] + ux * gx + vx * gy, sy = p0[1] + uy * gx + vy * gy;
              // las bandas de polvo: una franja oscura a un lado del núcleo
              var bandas = Math.abs(q[1] * 1.6 * inc + 0.06) < 0.025 && Math.abs(q[0]) > 0.25;
              c.fillStyle = cols[q[2]] + (a * (bandas ? 0.12 : q[2] === 0 ? 0.7 : 0.45)).toFixed(3) + ')';
              var s = q[2] === 0 ? 1.4 : 1.1; c.fillRect(sx - s / 2, sy - s / 2, s, s);
            }
            c.restore();
            var g = c.createRadialGradient(p0[0], p0[1], 0, p0[0], p0[1], Math.hypot(ux, uy) * 0.25); g.addColorStop(0, 'rgba(255,240,210,' + (0.5 * a * kg).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,240,210,0)'); c.fillStyle = g; c.beginPath(); c.arc(p0[0], p0[1], Math.hypot(ux, uy) * 0.25, 0, TAU); c.fill();
            [[M32, 'M32'], [M110, 'M110']].forEach(function (m) { var q = S.pos(m[0][0], m[0][1]); if (!q) return; S.nube(c, q[0], q[1], Math.hypot(ux, uy) * (m[1] === 'M32' ? 0.07 : 0.12), Math.hypot(ux, uy) * 0.06, 0.6, 160, m[1].length, 'rgba(255,236,210,.7)', a * kg, 1); S.mono(c, m[1], q[0] + 18, q[1], 9, 'rgba(236,230,214,.75)', 'left', a * U.tramo(t, 4000, 4800)); });
            // el rayo de luz que viene hacia nosotros, contando los años
            var kr = U.tramo(t, 4800, 7400);
            if (kr > 0) {
              var yb = E.H - (E.W < 760 ? 120 : 70), x0 = p0[0], y0 = p0[1] + 40, x1 = E.W < 760 ? E.W / 2 : E.W * 0.82;
              S.punteada(c, x0, y0, x1, yb, kr, a, 'rgba(255,240,210,.85)');
              S.destello(c, U.lerp(x0, x1, kr), U.lerp(y0, yb, kr), 2.6, a);
              S.rotulo(c, U.num(Math.round(2500000 * U.inOut(kr))) + ' AÑOS DE VIAJE', U.lerp(x0, x1, kr), U.lerp(y0, yb, kr) - 26, a, S.ACENTO, 10);
            }
            S.rotulo(c, 'M31 · LA GALAXIA DE ANDRÓMEDA', p0[0], p0[1] - Math.hypot(ux, uy) * 0.75 - 14, a * U.tramo(t, 3400, 4200), S.HUESO, 10);
          }
          salto.velo(c, t, D);
        }
      };
    }
  });
})();
