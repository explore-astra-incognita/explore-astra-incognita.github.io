/* Secreto 03 · La estrella invitada (Lugar)
   Tocar, acercado (×2 o más), el sitio vacío junto a ζ Tauri donde está la nebulosa del Cangrejo (M1). SEÑAL guía.
   La escena: en ese punto aparece una estrella nueva, roja y blanca, con rayos en cuatro direcciones, como la anotaron en
   la China de los Song (la tira de papel con la crónica); se apaga y, en el visor de un telescopio, crece la nebulosa del
   Cangrejo con su púlsar latiendo en el centro. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc;
  var TAU = Math.PI * 2, RA = 5.5755, DEC = 22.0145;
  // «晝見如太白，芒角四出，色赤白，凡見二十三日»: se vio de día como Venus, con rayos en cuatro direcciones, rojiza y blanca, 23 días
  var CRONICA = ['晝見如太白', '芒角四出', '色赤白', '凡見二十三日'];

  AS.registrar({
    id: 'estrella-invitada', n: 3, nombre: 'La estrella invitada', tipo: 'Lugar',
    pista: 'Junto al cuerno del toro, en 1054, una estrella se vio de día. Busca su sitio vacío.',
    lugar: function () { return { ra: RA, dec: DEC }; }, radio: 9,
    detectar: function (api) {
      api.en('clic', function (d) {
        if (E.zoom < 1.95) return;
        var p = E.proy(RA, DEC); if (p && Math.hypot(p[0] - d.x, p[1] - d.y) < 20) api.disparar();
      });
    },
    escena: function () {
      var D = 16500 + E.lectura, salto = S.salto({ ra: RA, dec: DEC, zoom: 2.4 });
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 8200, hasta: D - 400, titulo: 'La estrella invitada', pie: 'Crónicas de la dinastía Song · 1054 · M1, la nebulosa del Cangrejo',
          texto: 'El 4 de julio de 1054, los astrónomos de la China de los Song anotaron una «estrella invitada» junto a la estrella Tianguan (ζ Tauri): se vio de día, como Venus, durante 23 días, y de noche casi dos años. Era una supernova, una estrella que explotó a unos 6.500 años luz. Lo que quedó es la nebulosa del Cangrejo, que aún se expande a unos 1.500 km/s, y en su centro un púlsar: lo que queda de la estrella, del tamaño de una ciudad, que gira 30 veces por segundo.' },
        inicio: salto.inicio, cuadro: salto.cuadro, fin: salto.fin,
        frente: function (c, t) {
          var p = S.pos(RA, DEC), a = U.meseta(t, 1100, 1500, D - 1300, D - 600);
          if (p && a > 0) {
            var x = p[0], y = p[1];
            // la estrella invitada: se enciende, con cuatro rayos, y se apaga
            var ke = U.meseta(t, 1500, 3200, 6200, 8200);
            if (ke > 0) {
              var r = 3 + 9 * ke, fl = 0.85 + 0.15 * Math.sin(t / 90);
              c.save(); c.globalAlpha = a * ke; c.globalCompositeOperation = 'lighter';
              var g = c.createRadialGradient(x, y, 0, x, y, r * 9); g.addColorStop(0, 'rgba(255,236,226,.95)'); g.addColorStop(0.25, 'rgba(255,150,120,.4)'); g.addColorStop(1, 'rgba(255,120,90,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 9, 0, TAU); c.fill();
              c.fillStyle = 'rgba(255,240,232,' + fl + ')'; for (var i = 0; i < 4; i++) { c.save(); c.translate(x, y); c.rotate(i * Math.PI / 2 + 0.2); c.beginPath(); c.moveTo(0, -1.6); c.lineTo(r * 7, 0); c.lineTo(0, 1.6); c.fill(); c.restore(); }
              c.restore();
              S.rotulo(c, 'AÑO 1054 · 晝見 · SE VE DE DÍA', x, y - 54, a * U.tramo(t, 2400, 3200), S.HUESO, 10);
            }
            // el visor del telescopio: la nebulosa del Cangrejo, hoy
            var kn = U.tramo(t, 7000, 9800), kv = U.meseta(t, 6600, 7400, D - 1300, D - 600);
            if (kv > 0) {
              var R = Math.min(E.W, E.H) * (E.W < 760 ? 0.2 : 0.2), vx = U.clamp(x + (E.W < 760 ? 0 : R * 1.9), R + 16, E.W - R - 16), vy = E.W < 760 ? y + R * 1.6 : y;
              S.punteada(c, x, y, vx - (E.W < 760 ? 0 : R), vy - (E.W < 760 ? R : 0), kv, a, 'rgba(159,216,255,.7)');
              c.save(); c.globalAlpha = a * kv; c.fillStyle = 'rgba(9,9,10,.94)'; c.beginPath(); c.arc(vx, vy, R, 0, TAU); c.fill(); c.clip();
              var esc = R * 0.9 * U.sale(kn);
              var gg = c.createRadialGradient(vx, vy, 0, vx, vy, esc * 0.9); gg.addColorStop(0, 'rgba(150,210,235,.32)'); gg.addColorStop(1, 'rgba(150,210,235,0)'); c.fillStyle = gg; c.fillRect(vx - esc, vy - esc, esc * 2, esc * 2);
              S.nube(c, vx, vy, esc * 1.15, esc * 0.8, 0.5, 2600, 54, 'rgba(130,205,230,.6)', 1, 1.1);   // el gas azul (sincrotrón)
              var rr = U.azar(1054);
              for (var f = 0; f < 46; f++) {   // los filamentos rojizos, una jaula alrededor del gas
                var an = rr() * TAU, l0 = esc * (0.3 + rr() * 0.5), l1 = esc * (0.85 + rr() * 0.35);
                c.strokeStyle = f % 3 ? 'rgba(255,120,80,.75)' : 'rgba(255,190,120,.7)'; c.lineWidth = 1.2; c.lineCap = 'round'; c.setLineDash([0.01, 2.6]);
                c.beginPath(); c.moveTo(vx + Math.cos(an) * l0 * 1.15, vy + Math.sin(an) * l0 * 0.8); c.quadraticCurveTo(vx + Math.cos(an + 0.2) * (l0 + l1) * 0.6, vy + Math.sin(an + 0.2) * (l0 + l1) * 0.45, vx + Math.cos(an + 0.08) * l1 * 1.15, vy + Math.sin(an + 0.08) * l1 * 0.8); c.stroke();
              }
              c.setLineDash([]);
              // el púlsar: un latido rapidísimo (30 por segundo; aquí, lo que da la pantalla)
              var lat = (Math.floor(t / 33) % 2) ? 1 : 0.35; S.destello(c, vx, vy, 2.6, kn * lat);
              c.restore();
              c.save(); c.globalAlpha = a * kv; c.fillStyle = 'rgba(159,216,255,.8)'; for (i = 0; i < 160; i++) { var aa = i / 160 * TAU; c.fillRect(vx + Math.cos(aa) * R - 0.9, vy + Math.sin(aa) * R - 0.9, 1.8, 1.8); } c.restore();
              S.rotulo(c, 'HOY · LA NEBULOSA DEL CANGREJO', vx, vy + R + 22, a * kn, S.ACENTO, 10);
              S.rotulo(c, 'PÚLSAR · 30 VUELTAS POR SEGUNDO', vx, vy - R - 22, a * U.tramo(t, 9400, 10200), S.HUESO, 9);
            }
          }
          // la crónica: una tira de papel con columnas verticales, de derecha a izquierda
          var al = U.meseta(t, 2600, 3400, 6900, 7600);
          if (al > 0) {
            var st = S.sitio(250, 520), s = st.s, lx = E.W < 760 ? st.x : E.W * 0.06 + 0 * st.w;
            S.lamina(c, lx, st.y, st.w, st.h, al, function (x0, y0, w, h) {
              c.fillStyle = 'rgba(160,40,30,.85)'; c.font = '400 ' + Math.round(54 * s) + 'px "Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
              c.fillText('客', x0 + w - 44 * s, y0 + 60 * s); c.fillText('星', x0 + w - 44 * s, y0 + 122 * s);
              c.fillStyle = '#26241f'; c.font = '400 ' + Math.round(24 * s) + 'px "Songti SC", "STSong", "SimSun", "Noto Serif CJK SC", serif';
              CRONICA.forEach(function (col, j) { var k = U.tramo(t, 3200 + j * 500, 3700 + j * 500); for (var q = 0; q < col.length; q++) { if (q / col.length > k) break; c.fillText(col[q], x0 + w - 100 * s - j * 34 * s, y0 + 50 * s + q * 32 * s); } });
              S.mono(c, '«ESTRELLA INVITADA»', x0 + w / 2, y0 + h - 40 * s, Math.max(7, 9 * s), 'rgba(38,36,31,.75)', 'center');
              S.mono(c, 'DE DÍA, COMO VENUS · 23 DÍAS', x0 + w / 2, y0 + h - 22 * s, Math.max(7, 8 * s), 'rgba(38,36,31,.6)', 'center');
            }, '#ece2c8');
          }
          salto.velo(c, t, D);
        }
      };
    }
  });
})();
