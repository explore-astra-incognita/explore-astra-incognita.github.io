/* Secreto 08 · La Voyager 1 (Lugar)
   En Ofiuco, acercado (×2,4 o más), parpadea un puntito que no es una estrella: tocarlo. SEÑAL guía.
   La escena: el anillo sobre la sonda; una regla del sistema solar en escala logarítmica, del Sol al día luz, con la
   distancia calculada para hoy; y el disco de oro con sus surcos. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc;
  var TAU = Math.PI * 2, RA = 17.215, DEC = 12.03, DIA_LUZ = 25902068371, UA = 149597870.7;
  // a un día luz del Sol hacia el 15 de noviembre de 2026, alejándose a unos 17 km/s (1.468.800 km al día)
  function distancia() { return DIA_LUZ + (Date.now() - Date.UTC(2026, 10, 15)) / 86400000 * 1468800; }
  var REGLA = [['MERCURIO', 0.39], ['TIERRA', 1], ['JÚPITER', 5.2], ['SATURNO', 9.5], ['NEPTUNO', 30.1], ['HELIOPAUSA · 2012', 121]];

  AS.registrar({
    id: 'voyager', n: 8, nombre: 'La Voyager 1', tipo: 'Lugar',
    pista: 'Entre las estrellas de Ofiuco parpadea algo que no es una estrella: lo hicimos nosotros.',
    lugar: function () { return { ra: RA, dec: DEC }; }, radio: 12,
    detectar: function (api) {
      // el puntito: solo se ve acercado; parpadea despacio, como una luz de posición
      api.capa(function (c) {
        if (E.zoom < 2.4) return;
        var p = E.proy(RA, DEC); if (!p || E.horizontal(RA, DEC).alt < 1) return;
        var k = 0.5 + 0.5 * Math.sin(E.t / 520); c.fillStyle = 'rgba(236,230,214,' + (0.25 + 0.6 * k * k).toFixed(3) + ')'; c.beginPath(); c.arc(p[0], p[1], 1.1, 0, TAU); c.fill();
      });
      api.en('clic', function (d) {
        if (E.zoom < 2.4) return;
        var p = E.proy(RA, DEC); if (p && Math.hypot(p[0] - d.x, p[1] - d.y) < 16) api.disparar();
      });
    },
    escena: function () {
      var D = 17500 + E.lectura, salto = S.salto(function () { return { ra: RA, dec: DEC, zoom: 3.2, donde: S.centroConPanel() }; }), km = distancia();
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 8600, hasta: D - 400, titulo: 'La Voyager 1', pie: 'Lanzada el 5 de septiembre de 1977',
          texto: 'La Voyager 1 es lo más lejano que ha construido el ser humano. Salió del viento del Sol en 2012 y hoy cruza el espacio interestelar en dirección a Ofiuco, a unos 17 km/s. Hacia noviembre de 2026 llega a un día luz: una orden enviada desde la Tierra tarda un día entero en alcanzarla. Lleva un disco de oro con sonidos, músicas, saludos en 55 idiomas y 116 imágenes de nuestro mundo, por si alguien lo encuentra algún día.' },
        inicio: salto.inicio, cuadro: salto.cuadro, fin: salto.fin,
        frente: function (c, t) {
          var a = U.meseta(t, 1100, 1500, D - 1300, D - 600), p = S.pos(RA, DEC);
          if (p && a > 0) { S.destello(c, p[0], p[1], 2, a * (0.5 + 0.5 * Math.sin(t / 300))); S.anillo(c, p[0], p[1], 16, a * U.tramo(t, 1300, 2000), 'VOYAGER 1 · ' + U.num(Math.round(km / 1e6)) + ' MILLONES DE KM', true); }
          // la regla del sistema solar (escala logarítmica en UA)
          var kr = U.meseta(t, 2600, 3400, D - 1300, D - 600);
          if (kr > 0) {
            var st = S.sitio(560, 470), s = st.s, x = st.x, y = st.y, w = st.w, ua = km / UA;
            S.panel(c, x, y, w, st.h, kr);
            var x0 = x + 28 * s, x1 = x + w - 28 * s, yl = y + 74 * s, lg = function (v) { return x0 + (Math.log(v) / Math.LN10 + 0.6) / 3 * (x1 - x0); };
            S.mono(c, 'DEL SOL A LA VOYAGER · ESCALA LOGARÍTMICA', x0, y + 28 * s, Math.max(7, 9 * s), 'rgba(236,230,214,.6)', 'left', kr);
            c.save(); c.globalAlpha = kr; c.strokeStyle = 'rgba(236,230,214,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, yl); c.lineTo(x1, yl); c.stroke(); c.restore();
            REGLA.forEach(function (r, i) { var xx = lg(r[1]), k = U.tramo(t, 3000 + i * 200, 3500 + i * 200); c.save(); c.globalAlpha = kr * k; c.fillStyle = i === 5 ? 'rgba(159,216,255,.8)' : '#ece6d6'; c.beginPath(); c.arc(xx, yl, i === 5 ? 2 : 2.4, 0, TAU); c.fill(); c.restore(); S.mono(c, r[0], i === 5 ? xx - 4 * s : xx, yl + (i % 2 ? 22 : -18) * s, Math.max(6.5, 8 * s), 'rgba(236,230,214,.75)', i === 5 ? 'right' : 'center', kr * k); });
            var kv = U.inOut(U.tramo(t, 4200, 6000)), xv = U.lerp(lg(121), lg(ua), kv), xd = lg(173.1);
            S.punteada(c, xd, yl - 26 * s, xd, yl + 26 * s, 1, kr * U.tramo(t, 4000, 4600), 'rgba(236,230,214,.7)', 3);
            S.mono(c, '1 DÍA LUZ', xd, yl + 40 * s, Math.max(6.5, 8 * s), S.HUESO, 'center', kr * U.tramo(t, 4000, 4600));
            S.destello(c, xv, yl, 3, kr * U.tramo(t, 4200, 4600));
            S.mono(c, 'VOYAGER 1', xv - 6 * s, yl - 32 * s, Math.max(7, 9 * s), S.ACENTO, 'right', kr * U.tramo(t, 4400, 5000));
            S.mono(c, '≈ ' + U.num(Math.round(km)) + ' KM · ' + U.num(ua, 1) + ' UA', x0, yl + 62 * s, Math.max(7, 9 * s), '#ece6d6', 'left', kr * U.tramo(t, 5600, 6200));
            S.mono(c, 'SU SEÑAL TARDA ' + U.num(km / 299792.458 / 3600, 1) + ' HORAS EN LLEGAR', x0, yl + 80 * s, Math.max(7, 9 * s), 'rgba(236,230,214,.7)', 'left', kr * U.tramo(t, 5800, 6400));
            // el disco de oro
            var kd = U.tramo(t, 6000, 7800), cx = x + w / 2, cy = y + st.h - 150 * s, R = 112 * s * U.sale(kd);
            if (kd > 0) {
              c.save(); c.globalAlpha = kr;
              var g = c.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.1, cx, cy, R); g.addColorStop(0, '#f6dc8c'); g.addColorStop(0.55, '#c99a3c'); g.addColorStop(1, '#8a6420'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
              c.strokeStyle = 'rgba(70,45,10,.35)'; c.lineWidth = 0.6; for (var rr = R * 0.36; rr < R * 0.97; rr += 2.2) { c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.stroke(); }
              var brillo = (t / 2600) % TAU; c.strokeStyle = 'rgba(255,248,220,.22)'; c.lineWidth = R * 0.5; c.beginPath(); c.arc(cx, cy, R * 0.66, brillo, brillo + 0.35); c.stroke();
              c.fillStyle = '#e8c870'; c.beginPath(); c.arc(cx, cy, R * 0.33, 0, TAU); c.fill(); c.fillStyle = '#09090a'; c.beginPath(); c.arc(cx, cy, R * 0.035, 0, TAU); c.fill();
              c.restore();
              S.mono(c, 'THE SOUNDS OF EARTH', cx, cy - R * 0.15, Math.max(5, 7 * s * U.sale(kd)), 'rgba(70,45,10,.85)', 'center', kr * kd);
              S.mono(c, 'EL DISCO DE ORO', cx, cy + R + 20 * s, Math.max(7, 9 * s), S.ACENTO, 'center', kr * kd);
            }
          }
          salto.velo(c, t, D);
        }
      };
    }
  });
})();
