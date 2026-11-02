/* Astra Incognita · el final
   Con los diez: la cámara mira arriba y se aleja, el cielo gira deprisa y las 88 constelaciones se encienden una a una
   por toda la esfera, en el azul de la lupa, con sus nombres. Llueven unas fugaces. El «in» del título se tacha:
   «Astra cognita». Después, los créditos. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc, CI = AS.cielo;
  AS.registrarFinal({
    escena: function () {
      var D = 17000 + E.lectura, g = null, orden = null;
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 10400, hasta: D - 400, titulo: 'Astra cognita', pie: 'Per aspera ad astra · los diez secretos del cielo',
          texto: 'Has encontrado los diez secretos del cielo. Las 88 constelaciones que acaban de encenderse son las que fijó la Unión Astronómica Internacional en 1922 y cubren la esfera entera, sin huecos: cualquier estrella cae en una. Muchas las nombraron los griegos; las del sur, los navegantes europeos de los siglos XVI al XVIII. Per aspera ad astra: por lo difícil, hasta las estrellas. El cielo desconocido ya no lo es tanto.' },
        inicio: function () {
          g = S.guardar();
          E.irA(E.az + 30, 68, 0.75, 3200);
          orden = CI.CONS.slice().sort(function (a, b) { return a.raP - b.raP; });
        },
        cuadro: function (t, dt) { E.lst = (E.lst + dt * 0.0011 * U.meseta(t, 600, 2400, D - 3000, D - 1200) + 24) % 24; if (t > 1200 && t < 9600 && Math.random() < dt / 600) CI.fugaz({ az: E.az + (Math.random() - 0.5) * 120, alt: 30 + Math.random() * 50 }); },
        fin: function () { S.restaurar(g); },
        frente: function (c, t) {
          var a = U.meseta(t, 0, 600, D - 1300, D - 600), k = U.tramo(t, 1800, 9800);
          if (!orden || a <= 0) return;
          c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.setLineDash([0.01, 3.4]); c.lineWidth = 1.8;
          for (var i = 0; i < orden.length; i++) {
            var u = U.clamp(k * orden.length - i, 0, 1); if (u <= 0) break;
            var C = orden[i]; c.strokeStyle = 'rgba(159,216,255,' + (0.35 + 0.55 * u).toFixed(3) + ')'; c.beginPath();
            C.lineas.forEach(function (ln) { var prev = null; ln.forEach(function (v) { var q = CI.proyVec(v); if (!q || q[0] < -300 || q[0] > E.W + 300 || q[1] < -300 || q[1] > E.H + 300) { prev = null; return; } if (prev) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); prev = q; }); });
            c.stroke();
          }
          c.restore();
          if ('letterSpacing' in c) c.letterSpacing = '3px';
          c.font = '500 10px "IBM Plex Mono", monospace';
          for (i = 0; i < orden.length; i++) {
            var un = U.clamp(k * orden.length - i, 0, 1); if (un <= 0) break;
            var q = CI.proyVec(orden[i].p); if (!q || q[0] < 40 || q[0] > E.W - 40 || q[1] < 30 || q[1] > E.H - 30) continue;
            CI.rotulo(c, orden[i].nombre.toUpperCase(), q[0], q[1], 'rgba(159,216,255,.9)', 'center', a * un * (0.5 + 0.5 * U.tramo(t, 9800, 11000)));
          }
          if ('letterSpacing' in c) c.letterSpacing = '0px';
          S.rotulo(c, '88 CONSTELACIONES · TODO EL CIELO', E.W / 2, E.H * 0.1, a * U.tramo(t, 9800, 10600), S.ACENTO, 11);
        }
      };
    }
  });
})();
