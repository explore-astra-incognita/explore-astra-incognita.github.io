/* Secreto escondido · El Gran Telescopio Canarias (Lugar)
   Tocar la cúpula del GTC, la grande con la rendija encendida (rumbo 201°, al sudoeste).
   La escena: un panel con el espejo primario: 36 piezas hexagonales que se encienden una a una hasta formar uno solo de
   10,4 m, con una persona a escala. No cuenta para los diez ni para el final. */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, S = AS.esc, CI = AS.cielo;
  var TAU = Math.PI * 2;
  // los 36 hexágonos: tres anillos alrededor de un hueco central (6 + 12 + 18), coordenadas axiales
  var HEX = [];
  (function () { for (var q = -3; q <= 3; q++) for (var r = -3; r <= 3; r++) { var s = -q - r, d = Math.max(Math.abs(q), Math.abs(r), Math.abs(s)); if (d >= 1 && d <= 3) HEX.push([q, r, d]); } HEX.sort(function (a, b) { return a[2] - b[2] || Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]); }); })();

  AS.registrar({
    id: 'gtc', n: 11, escondido: true, nombre: 'El Gran Telescopio', tipo: 'Lugar',
    pista: 'La cúpula grande guarda un espejo hecho de piezas.',
    detectar: function (api) { api.en('clic', function (d) { if (CI.sobreGTC(d.x, d.y)) api.disparar(); }); },
    escena: function () {
      var D = 14000 + E.lectura;
      return {
        duracion: D, pararCielo: true,
        tarjeta: { en: 6400, hasta: D - 400, titulo: 'El Gran Telescopio Canarias', pie: 'GTC · Roque de los Muchachos · primera luz en 2007',
          texto: 'La cúpula grande es la del Gran Telescopio Canarias, el mayor telescopio óptico del mundo: su espejo mide 10,4 metros y está hecho de 36 piezas hexagonales que se mueven por separado para trabajar como una sola. Vio su primera luz en 2007. Estas cumbres son de las mejores del planeta para mirar el cielo, y desde 1988 una ley, la «Ley del Cielo», protege la isla de la contaminación luminosa.' },
        frente: function (c, t) {
          var a = U.meseta(t, 300, 1000, D - 1300, D - 600), st = S.sitio(520, 520), s = st.s, cx = st.x + st.w / 2, cy = st.y + st.h / 2 - 10 * s;
          c.fillStyle = 'rgba(9,9,10,' + (0.55 * a).toFixed(3) + ')'; c.fillRect(0, 0, E.W, E.H);
          S.panel(c, st.x, st.y, st.w, st.h, a);
          var lado = 40 * s;
          HEX.forEach(function (h, i) {
            var k = U.tramo(t, 1200 + i * 90, 1700 + i * 90); if (k <= 0) return;
            var x = cx + lado * Math.sqrt(3) * (h[0] + h[1] / 2), y = cy + lado * 1.5 * h[1], brillo = 0.55 + 0.45 * Math.max(0, Math.sin(t / 700 - i * 0.35));
            c.save(); c.globalAlpha = a * k; c.beginPath();
            for (var j = 0; j < 6; j++) { var an = Math.PI / 6 + j * Math.PI / 3, rr = lado * 0.94; c[j ? 'lineTo' : 'moveTo'](x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
            c.closePath(); var g = c.createLinearGradient(x - lado, y - lado, x + lado, y + lado); g.addColorStop(0, 'rgba(210,225,240,' + (0.35 + 0.4 * brillo).toFixed(3) + ')'); g.addColorStop(1, 'rgba(120,140,170,.45)'); c.fillStyle = g; c.fill();
            c.strokeStyle = 'rgba(159,216,255,.75)'; c.lineWidth = 1; c.stroke(); c.restore();
          });
          // la persona a escala (1,75 m frente a 10,4 m)
          var kp = U.tramo(t, 5000, 5800), escM = lado * 7 / 10.4, px = cx + lado * 6.4, py = cy + lado * 3.4;
          if (kp > 0) { c.save(); c.globalAlpha = a * kp; c.fillStyle = '#ece6d6'; var hh = 1.75 * escM; c.beginPath(); c.arc(px, py - hh + hh * 0.08, hh * 0.08, 0, TAU); c.fill(); c.fillRect(px - hh * 0.09, py - hh * 0.82, hh * 0.18, hh * 0.45); c.fillRect(px - hh * 0.08, py - hh * 0.38, hh * 0.06, hh * 0.38); c.fillRect(px + hh * 0.02, py - hh * 0.38, hh * 0.06, hh * 0.38); c.restore(); S.mono(c, '1,75 M', px, py + 12 * s, Math.max(7, 9 * s), S.HUESO, 'center', a * kp); }
          S.mono(c, '10,4 M · 36 SEGMENTOS', cx, st.y + 30 * s, Math.max(8, 10 * s), S.ACENTO, 'center', a * U.tramo(t, 4400, 5200));
          var kd = U.tramo(t, 4400, 5200); S.punteada(c, cx - lado * 3.5 * Math.sqrt(3) / 1.0 * 0.92, st.y + st.h - 34 * s, cx + lado * 3.5 * Math.sqrt(3) * 0.92, st.y + st.h - 34 * s, kd, a, 'rgba(159,216,255,.7)');
        }
      };
    }
  });
})();
