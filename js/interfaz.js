/* Astra Incognita · interfaz (la de Thule, con los instrumentos del cielo y la medalla de Orión)
   El registro de secretos, el progreso (en este navegador), el cuaderno, la tarjeta de cada escena, los avisos, los
   instrumentos (CONSTELACIÓN: la que hay en la lupa; COORDENADAS: AR y dec del centro de la lupa; MIRANDO: rumbo y
   altura; SEÑAL: late cuando la lupa se acerca a un secreto de lugar), la entrada y los créditos.
   Para volver o cerrar: la tecla ⌫ (nunca Esc, que saca de la pantalla completa). */
(function () {
  'use strict';
  var AS = window.AS, U = AS.util, E = AS.motor, CI = AS.cielo;
  var CLAVE = 'astra-incognita.v1';   // no se cambia nunca: borraría el progreso de quien ya juega
  var PRUEBA = /[?&]prueba\b/.test(location.search);
  var I = AS.interfaz = { prueba: PRUEBA };
  var huevos = [], final = null;
  var estado = { hallados: {}, final: false, introVista: false };
  var $ = function (id) { return document.getElementById(id); };
  var raiz = document.documentElement;
  var AUTOR = { nombre: 'Pau Morató Sebastià', linkedin: 'https://www.linkedin.com/in/pau-morat%C3%B3-sebasti%C3%A0-5554a01b2' };

  /* ---------- registro ----------
     Cada secreto: { id, n, nombre, tipo, pista, lugar?: () => {ra, dec}, radio? (grados), detectar(api), escena(motor, datos) } */
  AS.registrar = function (h) { huevos.push(h); huevos.sort(function (a, b) { return a.n - b.n; }); };
  AS.registrarFinal = function (h) { final = h; };
  I.huevos = function () { return huevos; };
  I.estado = function () { return estado; };

  function cargar() { try { var s = localStorage.getItem(CLAVE); if (s) { var o = JSON.parse(s); for (var k in o) estado[k] = o[k]; } } catch (e) { /* sin almacenamiento */ } }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ } }
  function visibles() { return huevos.filter(function (h) { return !h.escondido; }); }
  function escondidos() { return huevos.filter(function (h) { return h.escondido; }); }
  function cuantos(lista) { return (lista || visibles()).filter(function (h) { return estado.hallados[h.id]; }).length; }
  var TOTAL = 10;   // los secretos previstos (mientras se construyen, el contador ya cuenta diez)
  function total() { return Math.max(TOTAL, visibles().length); }

  /* ---------- disparar un secreto ---------- */
  I.disparar = function (h, datos, op) {
    op = op || {};
    if (!h.escena || E.escena || !$('intro').hidden || !$('creditos').hidden) return false;
    // un secreto ya encontrado no vuelve a salir solo; se vuelve a ver desde el cuaderno
    if (estado.hallados[h.id] && !op.cuaderno && !op.prueba) return false;
    cerrarCuaderno();
    var nuevo = !estado.hallados[h.id] && !op.prueba;
    if (nuevo) { estado.hallados[h.id] = Date.now(); guardar(); }
    h.ultimosDatos = datos || h.ultimosDatos || null;
    var envoltorio = { id: h.id, escena: function (motor) {
      var s = h.escena(motor, datos || h.ultimosDatos || null);
      if (s && s.tarjeta && !s.tarjeta.etiqueta) s.tarjeta.etiqueta = h.escondido ? 'Secreto escondido · ' + h.tipo : 'Secreto ' + U.dos(h.n) + ' / ' + U.dos(total()) + ' · ' + h.tipo;
      return s;
    } };
    E.reproducir(envoltorio, function () {
      pintarLista(nuevo ? h.id : null);
      if (nuevo) {
        if (h.escondido) aviso('Secreto escondido <b>' + cuantos(escondidos()) + '/' + escondidos().length + '</b> · ' + h.nombre);
        else aviso('Secreto encontrado <b>' + U.dos(cuantos()) + '/' + U.dos(total()) + '</b> · ' + h.nombre);
        var b = $('b-cuaderno'); b.classList.remove('pulso'); void b.offsetWidth; b.classList.add('pulso');
        if (!h.escondido && cuantos() === total() && !estado.final && final) setTimeout(function () { I.verFinal(); }, 1600);
      }
    });
    return true;
  };
  I.verFinal = function () {
    if (!final || E.escena) return;
    cerrarCuaderno();
    var primero = Infinity, ultimo = 0;
    visibles().forEach(function (h) { var t = estado.hallados[h.id]; if (t) { primero = Math.min(primero, t); ultimo = Math.max(ultimo, t); } });
    raiz.classList.add('final-activo');
    E.reproducir({ id: 'final', escena: function (motor) { return final.escena(motor, { desde: primero, hasta: ultimo, huevos: huevos }); } }, function () {
      raiz.classList.remove('final-activo');
      if (cuantos() === total()) { estado.final = true; guardar(); }
      pintarLista();
      mostrarCreditos();
    });
  };

  /* ---------- créditos ---------- */
  function mostrarCreditos() {
    var c = $('creditos');
    c.hidden = false; c.classList.remove('saliendo'); void c.offsetWidth; c.classList.add('visible');
    E.bloqueado = true;
    setTimeout(function () { var b = $('creditos-enlace'); try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }, 2600);
  }
  function cerrarCreditos() {
    var c = $('creditos'); if (c.hidden) return;
    c.classList.remove('visible'); c.classList.add('saliendo');
    E.bloqueado = false; E.ultimoInput = E.t;
    setTimeout(function () { c.hidden = true; c.classList.remove('saliendo'); }, 650);
  }
  I.mostrarCreditos = mostrarCreditos;

  /* ---------- tarjeta ---------- */
  I.tarjeta = function (t) {
    var el = $('tarjeta');
    if (!t) { el.classList.remove('visible'); return; }
    var v = function (x) { return typeof x === 'function' ? x() : (x || ''); };
    $('t-etq').textContent = v(t.etiqueta);
    $('t-tit').textContent = v(t.titulo);
    $('t-txt').innerHTML = v(t.texto);
    $('t-pie').textContent = v(t.pie);
    void el.offsetWidth; el.classList.add('visible');
  };

  /* ---------- aviso ---------- */
  var tAviso = null;
  function aviso(html, ms) {
    var el = $('aviso'); el.innerHTML = html; el.classList.add('visible');
    clearTimeout(tAviso); tAviso = setTimeout(function () { el.classList.remove('visible'); }, ms || 4200);
  }
  I.aviso = aviso;

  /* ---------- cuaderno ---------- */
  function abrirCuaderno() {
    $('cuaderno').classList.add('abierto'); $('cuaderno').setAttribute('aria-hidden', 'false');
    $('b-cuaderno').setAttribute('aria-expanded', 'true'); raiz.classList.add('cuaderno-abierto');
  }
  function cerrarCuaderno() {
    $('cuaderno').classList.remove('abierto'); $('cuaderno').setAttribute('aria-hidden', 'true');
    $('b-cuaderno').setAttribute('aria-expanded', 'false'); raiz.classList.remove('cuaderno-abierto');
  }
  I.abrirCuaderno = abrirCuaderno; I.cerrarCuaderno = cerrarCuaderno;

  function fecha(ms) {
    var d = new Date(ms);
    return U.dos(d.getDate()) + '.' + U.dos(d.getMonth() + 1) + '.' + d.getFullYear() + ' · ' + U.dos(d.getHours()) + ':' + U.dos(d.getMinutes());
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function pintarLista(recien) {
    var ol = $('lista'); ol.innerHTML = '';
    var fila = function (h) {
      var ok = !!estado.hallados[h.id];
      var li = el('li', 'entrada' + (ok ? ' hallada' : '') + (recien === h.id ? ' nueva' : ''));
      li.appendChild(el('div', 'e-num', h.escondido ? '✦' : U.dos(h.n)));
      var c = el('div', 'e-cuerpo');
      c.appendChild(el('div', 'e-tipo', h.tipo));
      var nom = el('div', 'e-nombre');
      if (ok) nom.textContent = h.nombre;
      else { var cen = el('span', 'e-censura'); cen.style.width = (h.nombre.length * 0.48 + 0.6) + 'em'; nom.appendChild(cen); nom.setAttribute('aria-label', 'Por descubrir'); }
      c.appendChild(nom);
      c.appendChild(el('p', 'e-pista', h.pista));
      if ((ok || PRUEBA) && h.escena) {
        var meta = el('div', 'e-meta');
        if (ok) meta.appendChild(el('span', '', 'Hallado · ' + fecha(estado.hallados[h.id])));
        var b = el('button', 'e-ver', ok ? 'Volver a ver' : '▶ Probar');
        b.type = 'button';
        b.addEventListener('click', function () { I.disparar(h, null, { prueba: !ok, cuaderno: true }); });
        meta.appendChild(b); c.appendChild(meta);
      }
      li.appendChild(c); ol.appendChild(li);
    };
    visibles().forEach(fila);
    var esc = escondidos(), vistos = esc.filter(function (h) { return estado.hallados[h.id] || PRUEBA; });
    if (vistos.length) {
      var cab = el('li', 'seccion'); cab.appendChild(el('span', '', 'Escondidos')); cab.appendChild(el('b', '', cuantos(esc) + '/' + esc.length)); ol.appendChild(cab);
      vistos.forEach(fila);
    }
    var n = cuantos(), tot = total();
    $('contador').textContent = U.dos(n) + '/' + U.dos(tot);
    var seg = $('segmentos'); seg.innerHTML = ''; seg.style.gridTemplateColumns = 'repeat(' + tot + ', 1fr)';
    for (var i = 0; i < tot; i++) seg.appendChild(el('i', i < n ? 'si' : ''));
    $('ver-final').hidden = !(estado.final || (PRUEBA && final));
    $('c-credito-linea').hidden = !estado.final;
    raiz.classList.toggle('cognita', !!estado.final);
  }

  /* ---------- instrumentos ---------- */
  var cuadroHud = 0, ultimos = {}, consActual = null;
  var RUMBOS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  function barras(id, valor) {
    var b = Math.ceil(valor * 5 - 0.15); if (ultimos[id] === b) return; ultimos[id] = b;
    var is = $(id).children; for (var i = 0; i < is.length; i++) is[i].classList.toggle('si', i < b);
  }
  // la distancia en grados entre dos puntos del cielo
  function sep(ra1, d1, ra2, d2) {
    var r = Math.PI / 180, c = Math.sin(d1 * r) * Math.sin(d2 * r) + Math.cos(d1 * r) * Math.cos(d2 * r) * Math.cos((ra1 - ra2) * 15 * r);
    return Math.acos(U.clamp(c, -1, 1)) / r;
  }
  I.sep = sep;
  function instrumentos() {
    var L = CI.lupa, objetivo = 0;
    huevos.forEach(function (h) {
      if (!h.lugar || h.escondido || estado.hallados[h.id]) return;
      var l = h.lugar(); if (!l) return;
      objetivo = Math.max(objetivo, U.clamp(1 - sep(L.ra, L.dec, l.ra, l.dec) / (h.radio || 14), 0, 1));
    });
    E.senal += (objetivo - E.senal) * 0.12;
    if (++cuadroHud % 5) return;
    barras('h-senal', E.senal);
    $('h-senal').classList.toggle('latiendo', E.senal > 0.12);
    $('h-senal').style.animationDuration = (1.3 - E.senal * 0.75).toFixed(2) + 's';
    $('h-coord').textContent = U.ar(L.ra) + ' · ' + U.dec(L.dec);
    $('h-mira').textContent = RUMBOS[Math.round(E.az / 45) % 8] + ' · ' + Math.round(E.alt) + '° · ×' + E.zoom.toFixed(1).replace('.', ',');
    var c = L.cons ? L.cons.nombre : '—';
    if (c !== consActual) { consActual = c; var hc = $('h-cons'); hc.classList.remove('h-cambia'); void hc.offsetWidth; hc.textContent = c; hc.classList.add('h-cambia'); }
  }

  /* ---------- teclas pulsadas (para los secretos de teclado) ---------- */
  var SIMBOLOS = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Backspace: '⌫' };
  function tecla(d) {
    if (E.escena && d.key !== 'Backspace') return;
    var s = SIMBOLOS[d.key] || (d.key.length === 1 && /\S/.test(d.key) ? d.key.toUpperCase() : null);
    if (!s || /^[+\-=_]$/.test(d.key)) return;
    var cont = $('teclas'), k = el('kbd', '', s);
    cont.appendChild(k);
    while (cont.children.length > 10) cont.removeChild(cont.firstChild);
    setTimeout(function () { if (k.parentNode) k.parentNode.removeChild(k); }, 2300);
  }

  /* ---------- la medalla de la entrada: Orión en puntos, con la lupa encendida ---------- */
  function medalla() {
    var cv = $('intro-medalla'); if (!cv) return;
    var d = Math.min(2, window.devicePixelRatio || 1), sz = 168, c2 = sz / 2; cv.width = cv.height = sz * d;
    var c = cv.getContext('2d'); c.scale(d, d);
    c.save(); c.beginPath(); c.arc(c2, c2, c2 - 2, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#09090a'; c.fillRect(0, 0, sz, sz);
    c.fillStyle = 'rgba(236,230,214,.12)'; for (var y = 3; y < sz; y += 6) for (var x = 3; x < sz; x += 6) c.fillRect(x, y, 1, 1);
    var r = U.azar(5); for (var i = 0; i < 70; i++) { c.fillStyle = 'rgba(236,230,214,' + (0.2 + r() * 0.5) + ')'; c.beginPath(); c.arc(r() * sz, r() * sz, 0.4 + r() * 0.7, 0, Math.PI * 2); c.fill(); }
    // Orión (posiciones aproximadas en la medalla) y sus colores de verdad
    var O = { bet: [62, 46, 3.4, '#ffaa66'], bel: [108, 52, 2.4, '#bcd0ff'], al1: [76, 86, 2.1, '#c7d6ff'], al2: [84, 82, 2.1, '#c7d6ff'], al3: [92, 78, 2.0, '#c7d6ff'], sai: [70, 124, 2.2, '#c7d6ff'], rig: [114, 118, 3.2, '#a8c4ff'], mei: [86, 34, 1.5, '#d4e0ff'] };
    c.strokeStyle = 'rgba(159,216,255,.85)'; c.lineWidth = 1.6; c.lineCap = 'round'; c.setLineDash([0.01, 3.4]);
    [['mei', 'bet'], ['mei', 'bel'], ['bet', 'al1'], ['bel', 'al3'], ['al1', 'al2'], ['al2', 'al3'], ['al1', 'sai'], ['al3', 'rig']].forEach(function (l) { c.beginPath(); c.moveTo(O[l[0]][0], O[l[0]][1]); c.lineTo(O[l[1]][0], O[l[1]][1]); c.stroke(); });
    c.setLineDash([]);
    for (var k in O) { var s = O[k], g = c.createRadialGradient(s[0], s[1], 0, s[0], s[1], s[2] * 4); g.addColorStop(0, s[3] + '66'); g.addColorStop(1, s[3] + '00'); c.fillStyle = g; c.fillRect(s[0] - s[2] * 4, s[1] - s[2] * 4, s[2] * 8, s[2] * 8); c.fillStyle = s[3]; c.beginPath(); c.arc(s[0], s[1], s[2], 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#09090a'; c.beginPath(); c.moveTo(0, sz); c.lineTo(0, 146); c.quadraticCurveTo(50, 138, 84, 144); c.quadraticCurveTo(126, 150, sz, 140); c.lineTo(sz, sz); c.fill();
    c.fillStyle = 'rgba(236,230,214,.35)'; for (y = 148; y < sz; y += 4) for (x = 2; x < sz; x += 4) c.fillRect(x, y, 1, 1);
    c.restore();
    c.strokeStyle = 'rgba(159,216,255,.8)'; c.fillStyle = 'rgba(159,216,255,.8)';
    for (i = 0; i < 120; i++) { var an = i / 120 * Math.PI * 2; c.fillRect(c2 + Math.cos(an) * (c2 - 1.5) - 0.8, c2 + Math.sin(an) * (c2 - 1.5) - 0.8, 1.6, 1.6); }
    cv.classList.add('listo');
  }

  /* ---------- arranque ---------- */
  I.iniciar = function () {
    cargar();
    var tactil = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    $('ayuda').textContent = tactil ? 'Desliza para mirar · pellizca para acercar' : 'Arrastra para mirar · rueda para acercar';

    huevos.forEach(function (h) {
      h.detectar && h.detectar({
        motor: E,
        en: function (n, fn) { E.en(n, fn); },
        capa: function (fn) { E.capas.push(fn); },
        hallado: function () { return !!estado.hallados[h.id]; },
        disparar: function (datos) { return I.disparar(h, datos); }
      });
    });
    E.en('cuadro', instrumentos);
    E.en('tecla', tecla);
    // ⌫ para volver: salta la escena, cierra el cuaderno o los créditos
    E.en('tecla', function (d) {
      if (d.key !== 'Backspace') return;
      if (E.escena) E.saltar();
      else if ($('cuaderno').classList.contains('abierto')) cerrarCuaderno();
      else if (!$('creditos').hidden) cerrarCreditos();
    });

    $('b-cuaderno').addEventListener('click', function () { $('cuaderno').classList.contains('abierto') ? cerrarCuaderno() : abrirCuaderno(); });
    $('cerrar-cuaderno').addEventListener('click', cerrarCuaderno);
    $('saltar').addEventListener('click', function () { E.saltar(); });
    $('ver-final').addEventListener('click', function () { I.verFinal(); });
    $('borrar').addEventListener('click', function () {
      if (!window.confirm('¿Borrar los secretos encontrados en este navegador?')) return;
      estado = { hallados: {}, final: false, introVista: true }; guardar(); pintarLista();
    });

    $('creditos-nombre').textContent = AUTOR.nombre;
    $('c-credito-nombre').textContent = AUTOR.nombre;
    $('creditos-enlace').href = AUTOR.linkedin; $('c-credito').href = AUTOR.linkedin;
    $('creditos-cerrar').addEventListener('click', cerrarCreditos);

    pintarLista();
    I.introPendiente = !estado.introVista && !PRUEBA;
  };
  // la entrada (solo la primera vez)
  I.mostrarIntro = function (alEmpezar) {
    var intro = $('intro');
    intro.hidden = false; E.bloqueado = true;
    medalla();
    $('empezar').addEventListener('click', function () {
      estado.introVista = true; guardar();
      intro.classList.add('saliendo'); E.bloqueado = false; E.ultimoInput = E.t;
      setTimeout(function () { intro.hidden = true; }, 900);
      alEmpezar && alEmpezar();
    });
    setTimeout(function () { try { $('empezar').focus({ preventScroll: true }); } catch (e) { /* nada */ } }, 50);
  };
})();
