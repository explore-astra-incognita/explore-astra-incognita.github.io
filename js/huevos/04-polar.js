/* Secreto 04 · La Polar (Espera)
   Dejar la lupa (o el centro, en táctil) quieta sobre la Estrella Polar 8 segundos, mientras todo gira alrededor.
   La escena: el tiempo se acelera y el cielo deja rastros circulares alrededor de la Polar, que no se mueve; luego aparece
   el círculo de la precesión (26.000 años) con Thuban, la Polar de hoy y Vega, y un punto que lo recorre. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc, CI = AS.cielo;
  var TAU = Math.PI * 2, RAD = Math.PI / 180, POLAR = [2.530, 89.264], THUBAN = [14.073, 64.376], VEGA = [18.616, 38.784];
  var EPS = 23.44, POLO_ECL = [18, 66.56];
  // un punto del círculo de la precesión (el polo celeste gira alrededor del polo de la eclíptica): fase 0 = hoy
  function precesion(f) {
    var d0 = POLO_ECL[1] * RAD, e = EPS * RAD, th = f * TAU;   // f > 0: el futuro (hacia Cefeo, el Cisne y Vega)
    var sd = Math.sin(d0) * Math.cos(e) + Math.cos(d0) * Math.sin(e) * Math.cos(th), de = Math.asin(sd);
    var ra = POLO_ECL[0] * 15 * RAD + Math.atan2(Math.sin(th) * Math.sin(e) * Math.cos(d0), Math.cos(e) - Math.sin(d0) * sd);
    return [ra / RAD / 15, de / RAD];
  }

  AS.registrar({
    id: 'polar', n: 4, nombre: 'La Estrella Polar', tipo: 'Espera',
    pista: 'Hay una estrella que no se mueve mientras todo gira. Quédate con ella un rato.',
    detectar: function (api) {
      var tiempo = 0;
      api.en('cuadro', function (d) {
        var L = CI.lupa, p = E.proy(POLAR[0], POLAR[1]);
        var ok = p && L.a > 0.5 && Math.hypot(p[0] - L.x, p[1] - L.y) < Math.max(26, L.r * 0.22);
        tiempo = ok ? tiempo + d.dt : 0;
        if (tiempo > 8000) { tiempo = 0; api.disparar(); }
      });
    },
    escena: function () {
      var D = 17500 + E.lectura, g = null, lst0 = 0, giroTotal = 0, brillantes = [];
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 9000, hasta: D - 400, titulo: 'La Estrella Polar', pie: 'Alfa de la Osa Menor · la precesión de los equinoccios',
          texto: 'La Estrella Polar está casi encima del eje de la Tierra: mientras el cielo gira, ella se queda quieta, y su altura sobre el horizonte es tu latitud (aquí, 28,8°). No es de las más brillantes: guía porque no se mueve. Pero el eje de la Tierra se tambalea como una peonza y dibuja un círculo cada 26.000 años. Hace casi 5.000 años, cuando se levantaban las pirámides, la estrella polar era Thuban; hacia el año 14.000 lo será Vega.' },
        inicio: function () {
          g = S.guardar(); lst0 = E.lst; giroTotal = ((18.6 - lst0) % 24 + 24) % 24; if (giroTotal < 6) giroTotal += 24;   // acaba con Vega en lo alto: el círculo cabe entero
          E.irA(0, E.lat + 6, 0.85, 1600);
          brillantes = [];
          for (var i = 0; i < 170; i++) { var e = CI.estrellaN(i); if (e && e.dec > 5) brillantes.push(e); }
        },
        cuadro: function (t) { E.lst = (lst0 + giroTotal * U.inOut(U.tramo(t, 1700, 8000))) % 24; },
        fin: function () { S.restaurar(g); },
        frente: function (c, t) {
          var a = U.meseta(t, 300, 900, D - 1300, D - 600), giro = giroTotal * U.inOut(U.tramo(t, 1700, 8000));
          // los rastros: cada estrella deja el arco que ha recorrido (su posición de antes = la de AR + lo que ha girado)
          if (giro > 0.01) {
            c.save(); c.globalAlpha = a * (1 - U.tramo(t, 9000, 10500) * 0.6); c.lineCap = 'round'; c.lineWidth = 1.1;
            brillantes.forEach(function (e) {
              var n = Math.max(4, Math.ceil(giro * 4)), prev = null; c.beginPath();
              for (var k = 0; k <= n; k++) { var q = E.proy(e.ra + giro * k / n, e.dec); if (!q) { prev = null; continue; } if (prev) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); prev = q; }
              c.strokeStyle = 'rgba(236,230,214,' + (0.12 + Math.max(0, 3 - e.mag) * 0.1).toFixed(3) + ')'; c.stroke();
            });
            c.restore();
          }
          var pp = S.pos(POLAR[0], POLAR[1]);
          if (pp) { S.anillo(c, pp[0], pp[1], 14, a * U.tramo(t, 1600, 2400)); S.rotulo(c, 'LA POLAR · NO SE MUEVE', pp[0], pp[1] + 36, a * U.tramo(t, 2000, 2800), S.ACENTO, 10); }
          // el círculo de la precesión
          var kc = U.inOut(U.tramo(t, 8400, 10800));
          if (kc > 0) {
            c.save(); c.globalAlpha = a; c.strokeStyle = 'rgba(159,216,255,.85)'; c.lineWidth = 1.7; c.lineCap = 'round'; c.setLineDash([0.01, 3.6]); c.beginPath();
            var prev = null; for (var k = 0; k <= 160 * kc; k++) { var q = precesion(k / 160), s2 = S.pos(q[0], q[1]); if (!s2) { prev = null; continue; } if (prev) c.lineTo(s2[0], s2[1]); else c.moveTo(s2[0], s2[1]); prev = s2; }
            c.stroke(); c.restore();
            [[THUBAN, 'THUBAN · HACE 4.800 AÑOS', 10600], [POLAR, 'LA POLAR · HOY', 10900], [VEGA, 'VEGA · HACIA EL AÑO 14.000', 11200]].forEach(function (m) {
              var q = S.pos(m[0][0], m[0][1]); if (!q) return; var km = U.tramo(t, m[2], m[2] + 700);
              S.destello(c, q[0], q[1], 2.4, a * km * 0.8); if (m[0] !== POLAR) S.rotulo(c, m[1], q[0], q[1] - 26, a * km, S.ACENTO, 10);
            });
            // el polo, que recorre su círculo (una vuelta cada 26.000 años)
            var kp = U.tramo(t, 11600, D - 1200);
            if (kp > 0) { var f = (kp * 0.75) % 1, q2 = precesion(f), s3 = S.pos(q2[0], q2[1]); if (s3) { S.destello(c, s3[0], s3[1], 3.4, a); S.rotulo(c, 'AÑO ' + U.num(Math.round(2026 + f * 25772)), s3[0], s3[1] + 26, a, S.HUESO, 9); } }
          }
        }
      };
    }
  });
})();
