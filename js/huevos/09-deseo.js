/* Secreto 09 · Pide un deseo (Gesto)
   Atrapar una estrella fugaz: tocarla mientras cae (pasan cada 7–22 s).
   La escena: el cielo salta a Perseo y llega la lluvia de las Perseidas: decenas de fugaces que salen todas del mismo
   punto (el radiante), como si vinieran hacia ti. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc, CI = AS.cielo;
  var TAU = Math.PI * 2, RA = 3.07, DEC = 58.0;   // el radiante de las Perseidas (cerca de η Persei)

  AS.registrar({
    id: 'deseo', n: 9, nombre: 'Pide un deseo', tipo: 'Gesto',
    pista: 'Cuando una estrella caiga, atrápala antes de que se apague.',
    detectar: function (api) {
      api.en('clic', function (d) { var f = CI.fugazEn(d.x, d.y, 38); if (f) api.disparar(f); });
      api.en('bajar', function (d) { var f = CI.fugazEn(d.x, d.y, 38); if (f) { d.tomar(); api.disparar(f); } });
    },
    escena: function () {
      var D = 15500 + E.lectura, salto = S.salto({ ra: RA, dec: DEC, zoom: 0.95, lst: RA - 2.5 }), lluvia = [], r = U.azar(813), prox = 1400;
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 6600, hasta: D - 400, titulo: 'Pide un deseo', pie: 'Las Perseidas · el cometa 109P/Swift-Tuttle · máximo hacia el 12 de agosto',
          texto: 'Una estrella fugaz es un grano de polvo, casi siempre más pequeño que uno de arena, que entra en la atmósfera a decenas de kilómetros por segundo y se quema a unos 100 km de altura. Cada agosto la Tierra cruza el rastro del cometa Swift-Tuttle y llegan las Perseidas: hasta un centenar por hora en su máximo, que parecen salir todas de Perseo y entran a 59 km/s. En España se las llama «lágrimas de San Lorenzo». Ya has pedido tu deseo.' },
        inicio: salto.inicio, fin: salto.fin,
        cuadro: function (t, dt) {
          salto.cuadro(t);
          prox -= dt; if (t > 1300 && t < D - 1800 && prox <= 0) { prox = 40 + r() * 150 * (t < 3000 ? 2 : 1); lluvia.push({ t0: t, an: r() * TAU, d0: 3 + r() * 30, largo: 6 + r() * 16, dur: 350 + r() * 650, b: 0.5 + r() * 0.5 }); }
          lluvia = lluvia.filter(function (f) { return t - f.t0 < f.dur; });
        },
        frente: function (c, t) {
          var a = U.meseta(t, 1100, 1500, D - 1300, D - 600), p = S.pos(RA, DEC), ppd = E.pxGrado();
          if (p && a > 0) {
            S.anillo(c, p[0], p[1], 10, a * U.tramo(t, 1500, 2300), 'EL RADIANTE · PERSEO', true);
            lluvia.forEach(function (f) {
              var k = (t - f.t0) / f.dur, e = U.sale(k), d1 = (f.d0 + f.largo * e) * ppd, d0 = (f.d0 + f.largo * Math.max(0, e - 0.35)) * ppd;
              var cx = Math.cos(f.an), cy = Math.sin(f.an), hx = p[0] + cx * d1, hy = p[1] + cy * d1, tx = p[0] + cx * d0, ty = p[1] + cy * d0;
              var al = a * f.b * (k < 0.12 ? k / 0.12 : 1 - U.tramo(k, 0.55, 1));
              var g = c.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, 'rgba(236,230,214,0)'); g.addColorStop(1, 'rgba(240,246,255,' + al.toFixed(3) + ')');
              c.strokeStyle = g; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(hx, hy); c.stroke();
              S.destello(c, hx, hy, f.b > 0.85 ? 1.8 : 1.1, al * 0.75);
            });
          }
          salto.velo(c, t, D);
        }
      };
    }
  });
})();
