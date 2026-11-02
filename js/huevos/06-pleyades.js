/* Secreto 06 · Las Siete Hermanas (Mirada)
   Acercarse del todo (×3,5 o más) con la lupa (o el centro, en táctil) sobre las Pléyades y quedarse un momento.
   La escena: con el máximo acercamiento salen los nombres de las hermanas y sus padres; después aparecen cientos de
   estrellas más débiles del cúmulo y la neblina azul que reflejan. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc, CI = AS.cielo, I = function () { return AS.interfaz; };
  var RA = 3.783, DEC = 24.2;
  var NOMBRES = [['ALCÍONE', 3.7914, 24.1051], ['ATLAS', 3.8193, 24.0534], ['ELECTRA', 3.7479, 24.1133], ['MAIA', 3.7636, 24.3678], ['MÉROPE', 3.7721, 23.9483], ['TAYGETA', 3.7535, 24.4672], ['PLÉYONE', 3.8194, 24.1367], ['CELENO', 3.7457, 24.2894], ['ASTÉROPE', 3.7580, 24.5544]];
  var miembros = null;
  function crearMiembros() { var r = U.azar(445), m = []; for (var i = 0; i < 520; i++) { var u = Math.sqrt(-2 * Math.log(r() + 1e-9)) * 0.55, an = r() * Math.PI * 2; m.push([RA + Math.cos(an) * u / 15 / Math.cos(DEC * Math.PI / 180), DEC + Math.sin(an) * u, 0.4 + r() * 0.9, r()]); } return m; }

  AS.registrar({
    id: 'pleyades', n: 6, nombre: 'Las Siete Hermanas', tipo: 'Mirada',
    pista: 'Hay un racimo de siete hermanas en el cielo. Acércate a él todo lo que puedas.',
    detectar: function (api) {
      var tiempo = 0;
      api.en('cuadro', function (d) {
        var L = CI.lupa, ok = E.zoom >= 3.5 && L.a > 0.5 && I().sep(L.ra, L.dec, RA, DEC) < 1.3 && E.horizontal(RA, DEC).alt > 3;
        tiempo = ok ? tiempo + d.dt : 0; if (tiempo > 1000) { tiempo = 0; api.disparar(); }
      });
    },
    escena: function () {
      var D = 15500 + E.lectura, salto = S.salto({ ra: RA, dec: DEC, zoom: 20 });
      if (!miembros) miembros = crearMiembros();
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 7600, hasta: D - 400, titulo: 'Las Siete Hermanas', pie: 'M45 · las Pléyades, en Tauro',
          texto: 'Las Pléyades son un cúmulo de estrellas jóvenes, de unos 100 millones de años, a unos 444 años luz. A simple vista casi todo el mundo cuenta seis, aunque en muchos mitos son siete hermanas, hijas de Atlas y Pléyone. En realidad son más de mil. La neblina azul es polvo que reflejan su luz: no es la nube donde nacieron, sino otra que atraviesan ahora. En japonés se llaman Subaru, y por eso el logo de la marca lleva seis estrellas.' },
        inicio: salto.inicio, cuadro: salto.cuadro, fin: salto.fin,
        frente: function (c, t) {
          var a = U.meseta(t, 1100, 1500, D - 1300, D - 600);
          if (a > 0) {
            var p0 = S.pos(RA, DEC), ppd = E.pxGrado();
            // la neblina azul (más fuerte alrededor de Mérope)
            var kn = U.tramo(t, 5200, 7600);
            if (p0 && kn > 0) [[4, 0.42, 0.3, 0.9], [4, 0.3, 0.2, 0.6], [3, 0.26, 0.18, 0.5], [2, 0.24, 0.18, 0.5], [0, 0.3, 0.26, 0.55]].forEach(function (n, j) { var q = S.pos(NOMBRES[n[0]][1], NOMBRES[n[0]][2]); if (q) S.nube(c, q[0], q[1] + (j === 0 ? 0.12 * ppd : 0), n[1] * ppd, n[2] * ppd, -0.6, 900, 70 + j, 'rgba(140,180,255,.5)', a * kn * n[3], 1.2); });
            // los cientos de miembros débiles
            var km = U.tramo(t, 3800, 6400);
            if (km > 0) { c.save(); miembros.forEach(function (m, i) { if (m[3] > km) return; var q = S.pos(m[0], m[1]); if (!q) return; c.fillStyle = 'rgba(220,230,255,' + (a * (0.35 + m[2] * 0.4)).toFixed(3) + ')'; c.fillRect(q[0] - m[2] / 2, q[1] - m[2] / 2, m[2], m[2]); }); c.restore(); }
            // las nueve con nombre
            NOMBRES.forEach(function (n, i) {
              var q = S.pos(n[1], n[2]); if (!q) return; var k = U.tramo(t, 1500 + i * 220, 2100 + i * 220);
              S.destello(c, q[0], q[1], i < 7 ? 2.4 : 1.8, a * k * 0.7);
              var izq = q[0] < (p0 ? p0[0] : 0); S.mono(c, n[0], q[0] + (izq ? -12 : 12), q[1] - 10, 10, i === 1 || i === 6 ? 'rgba(236,230,214,.7)' : '#ece6d6', izq ? 'right' : 'left', a * k);
            });
            if (p0) {
              var cuenta = Math.round(U.lerp(6, 1000, U.inOut(km)));
              S.rotulo(c, 'A SIMPLE VISTA: 6 · EN REALIDAD: ' + (km >= 1 ? 'MÁS DE 1.000' : U.num(cuenta)), p0[0], p0[1] + 1.25 * ppd, a * U.tramo(t, 3600, 4200), S.ACENTO, 10);
            }
          }
          salto.velo(c, t, D);
        }
      };
    }
  });
})();
