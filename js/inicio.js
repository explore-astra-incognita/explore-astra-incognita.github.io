/* Astra Incognita · arranque
   Con ?prueba en la dirección, el cuaderno deja probar todos los secretos (sin apuntarlos) y #id-del-secreto lo lanza al
   cargar. AS.debug sirve para probar desde la consola. */
(function () {
  'use strict';
  var AS = window.AS, E = AS.motor, I = AS.interfaz, CI = AS.cielo;
  CI.preparar();
  I.iniciar();
  E.iniciar(document.getElementById('lienzo'));
  // el grano: ruido pintado una vez, compuesto por CSS encima de todo (no cuesta nada al lienzo)
  (function () {
    var s = 220, c = document.createElement('canvas'); c.width = c.height = s;
    var x = c.getContext('2d'), im = x.createImageData(s, s), d = im.data, r = AS.util.azar(3);
    for (var i = 0; i < d.length; i += 4) { var v = 128 + (r() - 0.5) * 120; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(im, 0, 0);
    document.querySelector('.grano').style.backgroundImage = 'url(' + c.toDataURL() + ')';
  })();
  setTimeout(function () {
    var c = document.getElementById('cargando');
    if (c) { c.classList.add('fuera'); setTimeout(function () { c.hidden = true; }, 800); }
    if (I.introPendiente) I.mostrarIntro();
  }, 60);

  function buscar(id) { var h = null; I.huevos().forEach(function (x) { if (x.id === id) h = x; }); return h; }
  AS.debug = {
    disparar: function (id, datos) {
      if (id === 'final') { I.verFinal(); return true; }
      if (id === 'creditos') { I.mostrarCreditos(); return true; }
      var h = buscar(id); return h ? I.disparar(h, datos, { prueba: true }) : false;
    },
    congelar: E.congelar, paso: E.paso,
    mirar: function (az, alt, zoom) { E.az = az; E.alt = alt; if (zoom) E.zoom = zoom; E.vAz = E.vAlt = 0; E.obj = null; E.matriz(); },
    hora: function (lst) { E.lst = lst; E.matriz(); },
    puntero: function (x, y) { E.puntero.x = x; E.puntero.y = y; E.puntero.sobre = true; E.puntero.tipo = 'mouse'; },
    ids: function () { return I.huevos().map(function (h) { return h.id; }); }
  };
  if (location.hash.length > 1) {
    var id = decodeURIComponent(location.hash.slice(1));
    setTimeout(function () { AS.debug.disparar(id); }, 700);
  }
})();
