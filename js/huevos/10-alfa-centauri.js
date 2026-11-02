/* Secreto 10 · Alfa Centauri (Mirada)
   Mirar al sur, rozando el horizonte (altura de la vista < 14°, acercado ×1,5 o más), cuando Alfa Centauri asoma: desde
   el Roque no sube más de un grado sobre el mar de nubes, y solo durante un rato de cada vuelta del cielo.
   La escena: la cámara se acerca a la estrella, que titila en colores por el aire; Próxima, debajo del horizonte; y la
   escala del viaje: 4,37 años luz, más de 70.000 años de Voyager. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc, CI = AS.cielo;
  var TAU = Math.PI * 2, RA = 14.660, DEC = -60.835, PROXIMA = [14.495, -62.68];
  var COLORES = ['255,255,255', '180,210,255', '255,200,170', '200,255,220', '255,240,200'];

  AS.registrar({
    id: 'alfa-centauri', n: 10, nombre: 'Alfa Centauri', tipo: 'Mirada',
    pista: 'La vecina más cercana apenas asoma por el sur. Mira rozando el horizonte, de cerca, cuando el Centauro pase.',
    lugar: function () { return { ra: RA, dec: DEC }; }, radio: 16,
    detectar: function (api) {
      var tiempo = 0;
      api.en('cuadro', function (d) {
        var h = E.horizontal(RA, DEC), p = h.alt > 0.05 ? E.proy(RA, DEC) : null;
        var ok = p && E.alt < 14 && E.zoom >= 1.5 && Math.abs(U.difAng(E.az, h.az)) < 12 && Math.abs(p[0] - E.W / 2) < E.W * 0.32;
        tiempo = ok ? tiempo + d.dt : 0; if (tiempo > 1200) { tiempo = 0; api.disparar(); }
      });
    },
    escena: function () {
      var D = 16000 + E.lectura, g = null, salto = S.salto(function () { return { ra: RA, dec: DEC, zoom: 1.6, lst: E.horizontal(RA, DEC).alt > 0.15 ? E.lst : RA, donde: [E.W / 2, E.H * (E.W < 760 ? 0.36 : 0.56)] }; }), acercado = false;
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 7400, hasta: D - 400, titulo: 'Alfa Centauri', pie: 'Alfa Centauri · la vecina más cercana',
          texto: 'Alfa Centauri es el sistema de estrellas más cercano al Sol: dos soles parecidos al nuestro a 4,37 años luz, y una tercera, Próxima, un poco más cerca (4,24) pero invisible a simple vista, con un planeta donde podría haber agua líquida. Desde aquí asoma un rato y no sube más de un grado sobre el horizonte; por eso Canarias es el único lugar de España desde donde se puede ver. Titila en colores porque su luz cruza mucho aire. La Voyager 1 tardaría más de 70.000 años en llegar.' },
        inicio: function () { salto.inicio(); acercado = false; },
        cuadro: function (t) { salto.cuadro(t); if (!acercado && t > 520) { acercado = true; E.irA(E.az, E.alt, 4.2, 2400); } },
        fin: salto.fin,
        frente: function (c, t) {
          var a = U.meseta(t, 600, 1100, D - 1300, D - 600), p = S.pos(RA, DEC);
          if (p && a > 0) {
            // el titileo en colores (la luz cruza 40 veces más aire que en el cénit)
            var col = COLORES[Math.floor(t / 110) % COLORES.length], fl = 0.7 + 0.3 * Math.sin(t / 47) * Math.sin(t / 71);
            c.save(); c.globalCompositeOperation = 'lighter'; var gr = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], 34); gr.addColorStop(0, 'rgba(' + col + ',' + (0.75 * a * fl).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], 34, 0, TAU); c.fill(); c.restore();
            S.destello(c, p[0], p[1], 3.4, a * fl);
            S.rotulo(c, 'ALFA CENTAURI A Y B · 4,37 AÑOS LUZ', p[0], p[1] - 48, a * U.tramo(t, 2200, 3000), S.ACENTO, 10);
            var px = S.pos(PROXIMA[0], PROXIMA[1]);
            if (px) { var kp = U.tramo(t, 3400, 4200); S.punteada(c, p[0], p[1] + 10, px[0], px[1], kp, a, 'rgba(236,230,214,.6)', 4); S.rotulo(c, 'PRÓXIMA · 4,24 · BAJO EL HORIZONTE', U.lerp(p[0], px[0], 0.5), Math.min(E.H - 40, px[1]) - 6, a * kp, S.HUESO, 9); }
            // la escala del viaje
            var kv = U.tramo(t, 4600, 7000), y = E.W < 760 ? E.H * 0.44 : E.H * 0.16, x0 = E.W < 760 ? E.W * 0.12 : E.W * 0.42, x1 = E.W < 760 ? E.W * 0.88 : E.W * 0.9;
            if (kv > 0) {
              S.punteada(c, x0, y, x1, y, kv, a, 'rgba(236,230,214,.55)', 5);
              S.mono(c, 'EL SOL', x0, y - 16, 9, S.HUESO, 'left', a * kv); S.mono(c, 'ALFA CENTAURI', x1, y - 16, 9, S.ACENTO, 'right', a * kv);
              S.destello(c, U.lerp(x0, x1, U.tramo(t, 5200, D - 1400) * 0.06), y, 2, a * kv);
              S.mono(c, 'VOYAGER 1 · MÁS DE 70.000 AÑOS DE VIAJE', (x0 + x1) / 2, y + 18, 9, 'rgba(236,230,214,.75)', 'center', a * U.tramo(t, 5600, 6400));
            }
          }
          salto.velo(c, t, D);
        }
      };
    }
  });
})();
