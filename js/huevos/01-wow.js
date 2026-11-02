/* Secreto 01 · La señal Wow! (Teclado)
   Escribir 6EQUJ5, la secuencia del listado de Big Ear.
   La escena: la cámara salta a Sagitario, de donde vino la señal; ondas de radio salen del punto y entra el listado de
   papel continuo de 1977, con la columna 6-E-Q-U-J-5 que se rodea en rojo, el «Wow!» escrito a mano y la intensidad de
   cada letra (señal / ruido: 6, 14, 26, 30, 19, 5). */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc;
  var TAU = Math.PI * 2, CLAVE = '6EQUJ5', RA = 19.425, DEC = -26.95, ROJO = '#c8372a';
  var VALOR = { '6': 6, E: 14, Q: 26, U: 30, J: 19, '5': 5 };
  // el listado: columnas de intensidad, casi todo 1 y espacios (ruido), y la columna de la señal
  var FILAS = 22, COLS = 13, COL = 7, DESDE = 9, rejilla = [];
  (function () { var r = U.azar(1977); for (var f = 0; f < FILAS; f++) { var fila = []; for (var c = 0; c < COLS; c++) { var v = r(); fila.push(v < 0.42 ? ' ' : v < 0.88 ? '1' : v < 0.97 ? '2' : '3'); } rejilla.push(fila); } for (var i = 0; i < 6; i++) rejilla[DESDE + i][COL] = CLAVE[i]; })();

  AS.registrar({
    id: 'wow', n: 1, nombre: 'La señal Wow!', tipo: 'Teclado',
    pista: 'Seis caracteres en un listado de 1977 hicieron que alguien escribiera «Wow!».',
    detectar: function (api) {
      var b = '';
      api.en('tecla', function (d) { if (!d.key || d.key.length !== 1) return; b = (b + d.key.toUpperCase()).slice(-CLAVE.length); if (b === CLAVE) { b = ''; api.disparar(); } });
    },
    escena: function () {
      var D = 14500 + E.lectura, salto = S.salto(function () { return { ra: RA, dec: DEC, zoom: 1.8, donde: S.centroConPanel() }; });
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 7200, hasta: D - 400, titulo: 'La señal Wow!', pie: 'Big Ear, Delaware (Ohio) · 15 de agosto de 1977',
          texto: 'El 15 de agosto de 1977, el radiotelescopio Big Ear de la Universidad Estatal de Ohio captó durante 72 segundos una señal fortísima y muy estrecha, junto a la frecuencia del hidrógeno (1.420 MHz), que venía de Sagitario. Días después, el astrónomo Jerry Ehman la rodeó en el listado y escribió al lado «Wow!». Nunca se ha vuelto a captar. En 2024 un estudio propuso una explicación natural, una nube de hidrógeno que se encendió de golpe, pero aún se discute.' },
        inicio: salto.inicio, cuadro: salto.cuadro, fin: salto.fin,
        frente: function (c, t) {
          var p = S.pos(RA, DEC), a = U.meseta(t, 1100, 1700, D - 1300, D - 600);
          if (p && a > 0) {
            // las ondas de radio que salen del punto (72 segundos, en bucle)
            for (var i = 0; i < 4; i++) { var k = ((t - 1200) / 2400 + i / 4) % 1; if (t < 1200) continue; S.anillo(c, p[0], p[1], 8 + k * 120, a * (1 - k) * 0.8); }
            S.destello(c, p[0], p[1], 3.2, a * (0.6 + 0.4 * Math.sin(t / 200)));
            S.rotulo(c, 'SAGITARIO · 15 AGO 1977 · 72 S', p[0], p[1] + 46, a * U.tramo(t, 1500, 2300), S.ACENTO, 10);
          }
          // el listado de papel continuo
          var al = U.meseta(t, 2400, 3200, D - 1300, D - 600); if (al <= 0) return;
          var st = S.sitio(420, 560), s = st.s, x = st.x, y = st.y + (1 - U.sale(U.tramo(t, 2400, 3400))) * 40;
          S.lamina(c, x, y, st.w, st.h, al, function (x0, y0, w, h) {
            var fh = (h - 180 * s) / FILAS, fs = Math.max(7, 11 * s);
            // las bandas verdes y los agujeros del arrastre
            for (var f = 0; f < FILAS; f += 2) { c.fillStyle = 'rgba(120,170,130,.2)'; c.fillRect(x0 + 26 * s, y0 + 46 * s + f * fh, w - 52 * s, fh); }
            for (var yy = y0 + 14 * s; yy < y0 + h; yy += 22 * s) { c.fillStyle = 'rgba(9,9,10,.16)'; c.beginPath(); c.arc(x0 + 11 * s, yy, 4 * s, 0, TAU); c.arc(x0 + w - 11 * s, yy, 4 * s, 0, TAU); c.fill(); }
            c.font = '500 ' + fs + 'px "IBM Plex Mono", monospace'; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillStyle = '#26241f';
            c.save(); if ('letterSpacing' in c) c.letterSpacing = (fs * 0.15) + 'px'; c.textAlign = 'left'; c.fillText('BIG EAR · AUG 15 1977 · 22:16 EDT', x0 + 30 * s, y0 + 28 * s); c.restore();
            var cw = (w - 70 * s) / COLS;
            for (f = 0; f < FILAS; f++) for (var k = 0; k < COLS; k++) { var ch = rejilla[f][k]; if (ch === ' ') continue; var esSenal = k === COL && f >= DESDE && f < DESDE + 6; c.fillStyle = esSenal ? '#111' : 'rgba(38,36,31,.72)'; c.fillText(ch, x0 + 35 * s + (k + 0.5) * cw, y0 + 46 * s + (f + 0.5) * fh); }
            // el círculo rojo y el «Wow!»
            var cx = x0 + 35 * s + (COL + 0.5) * cw, cy = y0 + 46 * s + (DESDE + 3) * fh, kc = U.inOut(U.tramo(t, 4300, 5500));
            if (kc > 0) { c.strokeStyle = ROJO; c.lineWidth = 2.2 * s; c.lineCap = 'round'; c.beginPath(); c.ellipse(cx, cy, cw * 0.95, fh * 3.6, -0.05, -Math.PI / 2, -Math.PI / 2 + TAU * 1.04 * kc); c.stroke(); }
            var kw = U.tramo(t, 5500, 6300);
            if (kw > 0) { c.save(); c.globalAlpha *= kw; c.translate(cx + cw * 2.3, cy - fh * 2.2); c.rotate(-0.12); c.font = 'italic 400 ' + Math.round(40 * s) + 'px "Instrument Serif", serif'; c.fillStyle = ROJO; c.textAlign = 'left'; c.fillText('Wow!', 0, 0); c.restore(); }
            // la intensidad de cada letra (veces el ruido)
            var bx = x0 + 34 * s, by = y0 + h - 22 * s, bw = (w - 68 * s) / 6, bh = 92 * s, kb = U.tramo(t, 3600, 5200);
            c.strokeStyle = 'rgba(38,36,31,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bw * 6, by); c.stroke();
            CLAVE.split('').forEach(function (ch, j) {
              var v = VALOR[ch] / 30 * bh * U.sale(U.clamp(kb * 6 - j, 0, 1));
              c.fillStyle = ch === 'U' ? ROJO : 'rgba(38,36,31,.75)'; c.fillRect(bx + j * bw + bw * 0.3, by - v, bw * 0.4, v);
              c.fillStyle = '#26241f'; c.font = '500 ' + fs + 'px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.fillText(ch, bx + j * bw + bw / 2, by + 11 * s);
              if (kb * 6 - j > 1) c.fillText(String(VALOR[ch]), bx + j * bw + bw / 2, by - v - 10 * s);
            });
            c.save(); c.font = '500 ' + Math.max(7, 9 * s) + 'px "IBM Plex Mono", monospace'; if ('letterSpacing' in c) c.letterSpacing = (2 * s) + 'px'; c.fillStyle = 'rgba(38,36,31,.6)'; c.textAlign = 'left'; c.fillText('SEÑAL / RUIDO', bx, by - bh - 14 * s); c.restore();
          });
          salto.velo(c, t, D);
        }
      };
    }
  });
})();
