/* Secreto 02 · Betelgeuse (Lugar)
   Acercarse (×2 o más) y tocar Betelgeuse, el hombro de Orión.
   La escena: la estrella crece hasta llenar el centro, roja y hirviendo (celdas de convección en puntos), y encima se
   dibujan, a la misma escala, las órbitas de Mercurio, Venus, la Tierra, Marte y Júpiter: el Sol sería un punto. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc;
  var TAU = Math.PI * 2, RA = 5.919, DEC = 7.407, RADIO_UA = 3.55;   // unos 764 radios solares (las medidas van de 640 a 1.000)
  var ORBITAS = [['MERCURIO', 0.39], ['VENUS', 0.72], ['TIERRA', 1], ['MARTE', 1.52], ['JÚPITER', 5.2]];

  AS.registrar({
    id: 'betelgeuse', n: 2, nombre: 'Betelgeuse', tipo: 'Lugar',
    pista: 'Acércate al hombro rojo del cazador y tócalo.',
    lugar: function () { return { ra: RA, dec: DEC }; }, radio: 10,
    detectar: function (api) {
      api.en('clic', function (d) {
        if (E.zoom < 1.95) return;
        var p = E.proy(RA, DEC); if (p && Math.hypot(p[0] - d.x, p[1] - d.y) < 18) api.disparar();
      });
    },
    escena: function () {
      var D = 15000 + E.lectura, salto = S.salto({ ra: RA, dec: DEC, zoom: 2.6 });
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 6800, hasta: D - 400, titulo: 'Betelgeuse', pie: 'Alfa de Orión · supergigante roja · unos 550 años luz',
          texto: 'Betelgeuse es una supergigante roja: si estuviera en el lugar del Sol, llegaría más allá de la órbita de Marte. Está a unos 550 años luz (las medidas aún bailan entre 500 y 700). A finales de 2019 perdió casi dos tercios de su brillo, el «Gran Oscurecimiento»: había soltado una nube de polvo que la tapó. Está al final de su vida y explotará como supernova, quizá en los próximos 100.000 años; entonces se verá incluso de día.' },
        inicio: salto.inicio, cuadro: salto.cuadro, fin: salto.fin,
        frente: function (c, t) {
          var p = S.pos(RA, DEC), a = U.meseta(t, 1100, 1600, D - 1300, D - 600);
          if (p && a > 0) {
            var Rmax = Math.min(E.W, E.H) * (E.W < 760 ? 0.3 : 0.27), R = U.lerp(4, Rmax, U.inOut(U.tramo(t, 1500, 4200))), x = p[0], y = p[1];
            c.save(); c.globalAlpha = a;
            // el resplandor y el disco, con el borde más oscuro (oscurecimiento del limbo)
            var g = c.createRadialGradient(x, y, R * 0.6, x, y, R * 1.9); g.addColorStop(0, 'rgba(255,120,60,.35)'); g.addColorStop(1, 'rgba(255,120,60,0)'); c.fillStyle = g; c.fillRect(x - R * 2, y - R * 2, R * 4, R * 4);
            var gd = c.createRadialGradient(x - R * 0.2, y - R * 0.2, R * 0.1, x, y, R); gd.addColorStop(0, '#ffb070'); gd.addColorStop(0.6, '#f07a3c'); gd.addColorStop(1, '#a8331c'); c.fillStyle = gd; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
            // las celdas de convección: manchas de puntos que hierven despacio
            c.save(); c.beginPath(); c.arc(x, y, R, 0, TAU); c.clip();
            var r = U.azar(58);
            for (var i = 0; i < 9; i++) { var an = r() * TAU + t / (9000 + i * 900), dd = r() * R * 0.75, cx = x + Math.cos(an) * dd, cy = y + Math.sin(an) * dd; S.nube(c, cx, cy, R * (0.18 + r() * 0.16), R * (0.14 + r() * 0.14), r() * 3, 260, 100 + i, i % 3 ? 'rgba(255,214,150,.5)' : 'rgba(120,20,10,.45)', 0.9, Math.max(1, R / 120)); }
            c.restore();
            c.restore();
            // las órbitas, a la misma escala
            var ko = U.tramo(t, 4300, 6200), ua = Rmax / RADIO_UA;
            ORBITAS.forEach(function (o, j) {
              var kk = U.clamp(ko * 5 - j, 0, 1); if (kk <= 0) return;
              c.save(); c.globalAlpha = a * kk; c.strokeStyle = j === 4 ? 'rgba(236,230,214,.75)' : 'rgba(60,12,4,.8)'; c.lineWidth = 1.2; c.lineCap = 'round'; c.setLineDash([0.01, 4]);
              c.beginPath(); c.arc(x, y, o[1] * ua, -Math.PI / 2, -Math.PI / 2 + TAU * kk); c.stroke(); c.restore();
              var ang = -0.55 - j * 0.32, lx = x + Math.cos(ang) * o[1] * ua, ly = y + Math.sin(ang) * o[1] * ua;
              if (j >= 2) S.rotulo(c, o[0], lx, ly, a * kk, j === 2 ? S.ACENTO : S.HUESO, 9);
            });
            var ks = U.tramo(t, 6200, 7000);
            if (ks > 0) { c.fillStyle = 'rgba(255,250,235,' + (a * ks).toFixed(3) + ')'; c.beginPath(); c.arc(x, y, 1.4, 0, TAU); c.fill(); S.punteada(c, x + 4, y + 4, x + Rmax * 0.42, y + Rmax * 0.42, ks, a, 'rgba(236,230,214,.9)'); S.rotulo(c, 'EL SOL, A ESTA ESCALA', x + Rmax * 0.42, y + Rmax * 0.42 + 14, a * ks, S.HUESO, 9); }
          }
          salto.velo(c, t, D);
        }
      };
    }
  });
})();
