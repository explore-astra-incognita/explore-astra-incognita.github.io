/* Secreto 05 · El Carro (Gesto)
   Dibujar el Carro: empezar a arrastrar sobre una de sus siete estrellas (así el cielo no se mueve) y pasar por las siete,
   el mango en orden. El Carro sale por el nordeste y es circumpolar a medias: hay que esperar a que esté alto.
   La escena: las líneas se encienden; Merak y Dubhe señalan la Polar (cinco veces su distancia); en un visor, Mizar y
   Alcor; y, con su movimiento propio real (Hipparcos), cómo será el Carro dentro de 100.000 años. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc;
  var TAU = Math.PI * 2, RAD = Math.PI / 180;
  // [nombre, AR h, dec, μα* mas/año, μδ mas/año]
  var CARRO = [['ALKAID', 13.792, 49.313, -121.17, -14.91], ['MIZAR', 13.399, 54.925, 119.01, -25.97], ['ALIOTH', 12.900, 55.960, 111.91, -8.24], ['MEGREZ', 12.257, 57.033, 103.56, 7.81],
    ['PHECDA', 11.897, 53.695, 107.68, 11.01], ['MERAK', 11.031, 56.382, 81.43, 33.49], ['DUBHE', 11.062, 61.751, -134.11, -34.70]];
  var LINEAS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]], ALCOR = [13.420, 54.988], POLAR = [2.530, 89.264];
  function futuro(e, años) { var k = años / 3.6e6; return [e[1] + e[3] * k / Math.cos(e[2] * RAD) / 15, e[2] + e[4] * k]; }

  AS.registrar({
    id: 'carro', n: 5, nombre: 'El Carro', tipo: 'Gesto',
    pista: 'Cuando el Carro suba por el nordeste, dibújalo: sus siete estrellas, de la punta del mango al fondo.',
    detectar: function (api) {
      var trazo = null;
      api.en('bajar', function (d) {
        trazo = null;
        for (var i = 0; i < 7; i++) { var p = E.proy(CARRO[i][1], CARRO[i][2]); if (p && Math.hypot(p[0] - d.x, p[1] - d.y) < 26 && E.horizontal(CARRO[i][1], CARRO[i][2]).alt > 2) { d.tomar(); trazo = [[d.x, d.y]]; return; } }
      });
      api.en('arrastrar', function (d) { if (trazo) trazo.push([d.x, d.y]); });
      api.en('soltar', function () {
        var tr = trazo; trazo = null; if (!tr || tr.length < 6) return;
        // cada estrella: el punto del trazo más cercano (en los tramos, no solo en los puntos)
        var idx = [];
        for (var i = 0; i < 7; i++) {
          var p = E.proy(CARRO[i][1], CARRO[i][2]), mejor = 1e9, donde = -1; if (!p) return;
          for (var j = 0; j < tr.length - 1; j++) {
            var ax = tr[j][0], ay = tr[j][1], bx = tr[j + 1][0], by = tr[j + 1][1], l2 = (bx - ax) * (bx - ax) + (by - ay) * (by - ay), u = l2 ? U.clamp(((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / l2, 0, 1) : 0;
            var dd = Math.hypot(ax + (bx - ax) * u - p[0], ay + (by - ay) * u - p[1]); if (dd < mejor) { mejor = dd; donde = j + u; }
          }
          if (mejor > 30) return;
          idx.push(donde);
        }
        // el mango, en orden (en un sentido o en el otro)
        var sube = idx[0] < idx[1] && idx[1] < idx[2] && idx[2] < idx[3], baja = idx[0] > idx[1] && idx[1] > idx[2] && idx[2] > idx[3];
        if (sube || baja) api.disparar();
      });
    },
    escena: function () {
      var D = 17500 + E.lectura, salto = S.salto({ ra: 12.25, dec: 56.5, zoom: 1.15 });
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 9800, hasta: D - 400, titulo: 'El Carro', pie: 'Ursa Major · el asterismo del Carro',
          texto: 'El Carro no es una constelación: son las siete estrellas más brillantes de la Osa Mayor. Si alargas unas cinco veces la línea de Merak a Dubhe, llegas a la Estrella Polar. Cinco de las siete nacieron juntas y viajan juntas por el espacio; Dubhe y Alkaid van hacia el otro lado, y dentro de 100.000 años el Carro se habrá deformado. En la curva del mango, Mizar tiene al lado a Alcor: se cuenta que distinguirlas era una prueba de vista.' },
        inicio: salto.inicio, cuadro: salto.cuadro, fin: salto.fin,
        frente: function (c, t) {
          var a = U.meseta(t, 1100, 1500, D - 1300, D - 600), P = CARRO.map(function (e) { return S.pos(e[1], e[2]); });
          if (P.every(Boolean) && a > 0) {
            var kd = U.tramo(t, 9000, 11400), kf = U.inOut(kd);
            var Q = CARRO.map(function (e, i) { var f = futuro(e, 100000), q = S.pos(f[0], f[1]); return q ? [U.lerp(P[i][0], q[0], kf), U.lerp(P[i][1], q[1], kf)] : P[i]; });
            var kl = U.tramo(t, 1300, 3600);
            LINEAS.forEach(function (l, i) { var u = U.clamp(kl * LINEAS.length - i, 0, 1); S.punteada(c, Q[l[0]][0], Q[l[0]][1], Q[l[1]][0], Q[l[1]][1], u, a); });
            Q.forEach(function (q, i) { S.destello(c, q[0], q[1], 2.2, a * U.tramo(t, 1300 + i * 300, 1900 + i * 300)); S.rotulo(c, CARRO[i][0], q[0], q[1] + 20, a * U.tramo(t, 1500 + i * 300, 2100 + i * 300) * (1 - kd * 0.6), S.HUESO, 9); });
            // los punteros: de Merak a Dubhe, cinco veces más, hasta la Polar
            var kp = U.tramo(t, 3800, 6000), pol = S.pos(POLAR[0], POLAR[1]);
            if (pol && kp > 0) {
              S.punteada(c, P[5][0], P[5][1], pol[0], pol[1], U.inOut(kp), a * (1 - kd), 'rgba(236,230,214,.75)', 5);
              S.anillo(c, pol[0], pol[1], 12, a * U.tramo(t, 5600, 6200) * (1 - kd), 'LA POLAR · ×5', true);
            }
            // el visor: Mizar y Alcor
            var kv = U.meseta(t, 6200, 6900, 8600, 9200);
            if (kv > 0) {
              var R = Math.min(E.W, E.H) * 0.13, vx = U.clamp(P[1][0] + R * 1.8, R + 12, E.W - R - 12), vy = U.clamp(P[1][1] + R * 1.4, R + 12, E.H - R - 12), m = P[1], al = S.pos(ALCOR[0], ALCOR[1]);
              S.punteada(c, m[0], m[1], vx, vy, kv, a, 'rgba(159,216,255,.6)');
              c.save(); c.globalAlpha = a * kv; c.fillStyle = 'rgba(9,9,10,.94)'; c.beginPath(); c.arc(vx, vy, R, 0, TAU); c.fill(); c.restore();
              if (al) { var dx = al[0] - m[0], dy = al[1] - m[1], k = R * 0.55 / Math.max(1, Math.hypot(dx, dy)); S.destello(c, vx - dx * k * 0.5, vy - dy * k * 0.5, 2.8, a * kv); S.destello(c, vx + dx * k * 0.5, vy + dy * k * 0.5, 1.6, a * kv * 0.8); }
              c.save(); c.globalAlpha = a * kv; c.fillStyle = 'rgba(159,216,255,.8)'; for (var i = 0; i < 110; i++) { var aa = i / 110 * TAU; c.fillRect(vx + Math.cos(aa) * R - 0.9, vy + Math.sin(aa) * R - 0.9, 1.8, 1.8); } c.restore();
              S.rotulo(c, 'MIZAR Y ALCOR · ¿LAS VES?', vx, vy + R + 20, a * kv, S.ACENTO, 9);
            }
            if (kd > 0) S.rotulo(c, 'DENTRO DE ' + U.num(Math.round(kd * 100000)) + ' AÑOS', (Q[2][0] + Q[4][0]) / 2, Math.min(Q[0][1], Q[6][1]) - 50, a * U.tramo(t, 9000, 9600), S.ACENTO, 10);
          }
          salto.velo(c, t, D);
        }
      };
    }
  });
})();
