/* Astra Incognita · sonido
   Todo sintetizado con Web Audio, sin archivos (como en Thule: un fondo único y pocas cosas).
   - El cielo: el viento suave de la cumbre, un zumbido muy bajo y lento (dos notas que laten), de vez en cuando una nota
     de cristal (una estrella que titila) y el siseo de cada estrella fugaz, por el lado de la pantalla por donde cae.
   - Cada escena con lo suyo, al compás de lo que se ve.
   Empieza apagado: el botón ♪ lo enciende y se recuerda. Los navegadores solo dejan sonar después de un gesto.
   Las escenas suenan por su propio canal: si se salta la escena, su sonido se apaga con ella. */
(function () {
  'use strict';
  var AS = window.AS, E = AS.motor, U = AS.util, CI = AS.cielo, CLAVE = 'astra-incognita.sonido';
  var S = AS.sonido = { activo: false };
  var ac = null, master, salaEnv, ruido, musica, AMB = null, bus = null, escBus = null;
  // la escala del cielo: mi mayor pentatónica, aguda
  var CRISTAL = [659.25, 739.99, 830.61, 987.77, 1108.73, 1318.51, 1479.98];

  function crear() {
    var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return false;
    ac = new Ctx();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    var conv = ac.createConvolver(); conv.buffer = impulso(5.5, 2.4);   // un eco largo, de cúpula abierta
    salaEnv = ac.createGain(); salaEnv.gain.value = 0.5; salaEnv.connect(conv); var rv = ac.createGain(); rv.gain.value = 0.5; conv.connect(rv); rv.connect(master);
    musica = ac.createGain(); musica.gain.value = 1; musica.connect(master);
    AMB = { seco: master, sala: salaEnv }; bus = AMB;
    ruido = bufferRuido(4);
    S.viento = bucle(ruido, 'bandpass', 300, 0.6, 0);
    // el zumbido del cielo: mi y si graves que laten despacio
    var g = ac.createGain(); g.gain.value = 0; g.connect(master); var gs = ac.createGain(); gs.gain.value = 0.7; g.connect(gs); gs.connect(salaEnv);
    [[82.41, 0.5], [82.9, 0.4], [123.47, 0.3], [164.81, 0.12]].forEach(function (f) { var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f[0]; var og = ac.createGain(); og.gain.value = f[1]; o.connect(og); og.connect(g); o.start(); });
    S.zumbido = g;
    return true;
  }
  function bucle(buf, tipo, frec, q, desde) {
    var s = ac.createBufferSource(); s.buffer = buf; s.loop = true;
    var f = ac.createBiquadFilter(); f.type = tipo; f.frequency.value = frec; f.Q.value = q;
    var g = ac.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(0, desde || 0);
    return { f: f, g: g };
  }
  function bufferRuido(seg) {
    var n = Math.floor(ac.sampleRate * seg), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0), b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
    return b;
  }
  function impulso(seg, caida) {
    var n = Math.floor(ac.sampleRate * seg), b = ac.createBuffer(2, n, ac.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, caida); }
    return b;
  }
  function salida(nodo, sala, pan) {
    var n = nodo;
    if (pan && ac.createStereoPanner) { var p = ac.createStereoPanner(); p.pan.value = U.clamp(pan, -1, 1); nodo.connect(p); n = p; }
    n.connect(bus.seco);
    if (sala) { var g = ac.createGain(); g.gain.value = sala; n.connect(g); g.connect(bus.sala); }
  }
  function env(g, t, ataque, vol, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + ataque); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function tono(tipo, f, t, dur, vol, op) {
    op = op || {};
    var o = ac.createOscillator(), g = ac.createGain(); o.type = tipo; o.frequency.setValueAtTime(f, t);
    if (op.f2) o.frequency.exponentialRampToValueAtTime(op.f2, t + (op.glide || dur));
    env(g, t, op.ataque || 0.01, vol, dur);
    if (op.filtro) { var fl = ac.createBiquadFilter(); fl.type = op.tipoFiltro || 'lowpass'; fl.frequency.value = op.filtro; fl.Q.value = op.q || 0.7; o.connect(fl); fl.connect(g); } else o.connect(g);
    if (op.musica) { g.connect(musica); var g2 = ac.createGain(); g2.gain.value = 0.5; g.connect(g2); g2.connect(salaEnv); } else salida(g, op.sala == null ? 0.4 : op.sala, op.pan);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function golpe(t, dur, frec, vol, tipo, op) {
    op = op || {};
    var s = ac.createBufferSource(); s.buffer = ruido; var f = ac.createBiquadFilter(); f.type = tipo || 'lowpass'; f.frequency.setValueAtTime(frec, t); f.Q.value = op.q || (tipo === 'bandpass' ? 2 : 0.7);
    if (op.f2) f.frequency.exponentialRampToValueAtTime(op.f2, t + (op.barre || dur));
    var g = ac.createGain(); env(g, t, op.ataque || Math.min(0.02, dur * 0.2), vol, dur);
    s.loop = true; s.connect(f); f.connect(g);
    if (op.musica) { g.connect(musica); var g2 = ac.createGain(); g2.gain.value = 0.4; g.connect(g2); g2.connect(salaEnv); } else salida(g, op.sala == null ? 0.3 : op.sala, op.pan);
    s.start(t, Math.random() * 2); s.stop(t + dur + 0.05);
  }


  /* --- las piezas del cielo --- */
  function cristal(t, i, vol, pan) { var f = CRISTAL[((i % CRISTAL.length) + CRISTAL.length) % CRISTAL.length] * (i >= CRISTAL.length ? 2 : 1); tono('sine', f, t, 2.6, vol, { ataque: 0.005, sala: 1.3, musica: !pan, pan: pan }); tono('sine', f * 2.01, t, 0.8, vol * 0.22, { ataque: 0.005, sala: 1, musica: !pan, pan: pan }); }
  function siseo(t, vol, pan, dur) { golpe(t, dur || 0.7, 3200, vol, 'bandpass', { q: 1.2, ataque: 0.05, f2: 900, barre: dur || 0.7, sala: 0.8, pan: pan }); }
  function acorde(t, notas, dur, vol) { notas.forEach(function (f, i) { tono('sine', f, t + i * 0.08, dur, vol, { ataque: dur * 0.3, sala: 1.1, musica: true }); }); }
  function campana(t, f, vol) { [1, 2.76, 5.4, 8.93].forEach(function (m, i) { tono('sine', f * m, t, 4 / (i + 1), vol / (i + 1.4), { ataque: 0.003, sala: 1.2 }); }); }
  function pitido(t, f, dur, vol, pan) { tono('sine', f, t, dur, vol, { ataque: 0.004, sala: 0.5, pan: pan }); }

  /* --- el cielo --- */
  var prox = { cristal: 0 }, vistas = 0;
  E.en('cuadro', function () {
    if (!ac || !S.activo) return;
    var t = ac.currentTime, tt = E.t / 1000;
    S.viento.g.gain.setTargetAtTime(0.05 + 0.025 * Math.sin(tt * 0.13) + 0.015 * Math.sin(tt * 0.41 + 1), t, 0.8); S.viento.f.frequency.setTargetAtTime(260 + 120 * (0.5 + 0.5 * Math.sin(tt * 0.19)), t, 1);
    S.zumbido.gain.setTargetAtTime(E.escena ? 0.004 : 0.016, t, 1.5);
    if (E.escena) return;
    if (t > prox.cristal) { if (prox.cristal) cristal(t + 0.05, Math.floor(Math.random() * 7), 0.014, Math.random() * 1.6 - 0.8); prox.cristal = t + 6 + Math.random() * 9; }
    // cada estrella fugaz nueva, un siseo por su lado
    var f = CI.fugaces(); if (f.length > vistas) { var u = f[f.length - 1], q = E.proyHor(u.az, u.alt, 0); if (q && q[0] > -100 && q[0] < E.W + 100) siseo(t + 0.02, 0.025 * u.brillo, U.clamp(q[0] / E.W * 2 - 1, -0.9, 0.9)); }
    vistas = f.length;
  });

  /* --- las escenas --- */
  var ESCENAS = {
    wow: function (t) {
      golpe(t + 0.6, 6, 2600, 0.025, 'bandpass', { ataque: 0.8, q: 0.5, sala: 0.4 });   // el ruido de la radio
      tono('sine', 1420 / 2, t + 1.4, 3.2, 0.05, { ataque: 1.4, sala: 0.6 });   // la señal, que sube y baja (72 s en 3)
      tono('sine', 1420 / 4, t + 1.4, 3.2, 0.03, { ataque: 1.4, sala: 0.6 });
      golpe(t + 4.4, 1.1, 1400, 0.03, 'bandpass', { q: 3, sala: 0.2 });   // el rotulador
      cristal(t + 5.6, 4, 0.05); cristal(t + 5.8, 6, 0.045);
    },
    betelgeuse: function (t) { tono('sawtooth', 55, t + 1.4, 6, 0.03, { ataque: 2.5, filtro: 220, sala: 1 }); tono('sine', 41.2, t + 1.4, 7, 0.08, { ataque: 2.5, sala: 0.8 }); golpe(t + 1.5, 5, 180, 0.07, 'lowpass', { ataque: 2.4, sala: 0.8 }); for (var i = 0; i < 5; i++) cristal(t + 4.4 + i * 0.36, i, 0.03); },
    'estrella-invitada': function (t) {
      campana(t + 1.6, 196, 0.08); cristal(t + 1.7, 6, 0.05); cristal(t + 1.9, 4, 0.04);
      campana(t + 3.4, 261.6, 0.04); campana(t + 4.4, 220, 0.035);
      for (var i = 0; i < 60; i++) golpe(t + 7.8 + i / 30, 0.012, 3000, 0.04, 'highpass');   // el púlsar: 30 latidos por segundo
    },
    polar: function (t) { golpe(t + 1.7, 6.4, 400, 0.05, 'bandpass', { ataque: 2, q: 0.6, f2: 1600, barre: 5, sala: 0.8 }); acorde(t + 1.8, [164.81, 246.94, 329.63], 7, 0.03); [0, 2, 4].forEach(function (n, i) { cristal(t + 10.6 + i * 0.3, n, 0.045); }); campana(t + 11.6, 164.81, 0.04); },
    carro: function (t) { for (var i = 0; i < 7; i++) cristal(t + 1.4 + i * 0.32, i, 0.045); siseo(t + 3.9, 0.02, 0, 2); cristal(t + 5.7, 6, 0.05); cristal(t + 6.6, 2, 0.03); cristal(t + 6.75, 3, 0.025); acorde(t + 9, [110, 164.81, 220], 3, 0.03); },
    pleyades: function (t) { for (var i = 0; i < 9; i++) cristal(t + 1.5 + i * 0.22, i % 7, 0.04); for (i = 0; i < 40; i++) cristal(t + 3.9 + Math.random() * 2.6, 7 + Math.floor(Math.random() * 6), 0.008, Math.random() * 1.6 - 0.8); },
    andromeda: function (t) { acorde(t + 1.2, [82.41, 123.47, 164.81, 207.65], 9, 0.03); golpe(t + 4.8, 2.6, 800, 0.03, 'bandpass', { q: 1.2, f2: 2800, barre: 2.4, sala: 1 }); },
    voyager: function (t) {
      [0, 0.18, 0.36, 0.9, 1.08, 1.6].forEach(function (d) { pitido(t + 1.4 + d, 880, 0.08, 0.03); });   // la señal de la sonda
      for (var i = 0; i < 6; i++) cristal(t + 3 + i * 0.2, i, 0.025);
      acorde(t + 6, [220, 277.18, 329.63, 440], 6, 0.025);   // el disco de oro
    },
    deseo: function (t) { for (var i = 0; i < 26; i++) siseo(t + 1.3 + Math.random() * 9, 0.02 + Math.random() * 0.02, Math.random() * 1.6 - 0.8, 0.4 + Math.random() * 0.5); cristal(t + 0.2, 6, 0.05); },
    'alfa-centauri': function (t) { for (var i = 0; i < 18; i++) cristal(t + 0.6 + i * 0.16, [0, 4, 2, 6, 1, 5, 3][i % 7], 0.018, Math.sin(i) * 0.5); acorde(t + 4.6, [130.81, 196, 261.63], 6, 0.025); },
    gtc: function (t) { golpe(t + 0.3, 1.8, 120, 0.06, 'lowpass', { ataque: 0.3 }); tono('sawtooth', 48, t + 0.3, 1.8, 0.012, { filtro: 300 }); for (var i = 0; i < 36; i++) pitido(t + 1.2 + i * 0.09, 1200 + (i % 6) * 120, 0.06, 0.008, Math.sin(i) * 0.6); },
    final: function (t) { acorde(t + 0.4, [82.41, 123.47, 164.81, 246.94], 14, 0.035); for (var i = 0; i < 30; i++) cristal(t + 1.8 + i * 0.27, [0, 2, 4, 6, 5, 3, 4, 6, 7, 9][i % 10], 0.025, Math.sin(i * 1.7) * 0.6); acorde(t + 9.8, [164.81, 207.65, 246.94, 329.63], 8, 0.03); }
  };
  E.en('escena', function (d) {
    if (!ac || !S.activo) return;
    var t = ac.currentTime;
    if (d.fase === 'fin') { if (escBus) { escBus.seco.gain.setTargetAtTime(0, t, 0.25); escBus.sala.gain.setTargetAtTime(0, t, 0.25); escBus = null; } return; }
    if (d.fase !== 'inicio') return;
    escBus = { seco: ac.createGain(), sala: ac.createGain() }; escBus.seco.connect(master); escBus.sala.connect(salaEnv);
    bus = escBus;
    try { cristal(t + 0.05, 3, 0.04); var f = ESCENAS[d.huevo && d.huevo.id]; if (f) f(t); }
    finally { bus = AMB; }
  });

  /* --- encender y apagar --- */
  S.encender = function () {
    if (!ac && !crear()) return;
    if (ac.state === 'suspended') ac.resume();
    S.activo = true; master.gain.setTargetAtTime(0.9, ac.currentTime, 0.6);
    try { localStorage.setItem(CLAVE, '1'); } catch (e) { /* nada */ }
    pintarBoton();
  };
  S.apagar = function () {
    S.activo = false; if (ac) master.gain.setTargetAtTime(0, ac.currentTime, 0.25);
    try { localStorage.setItem(CLAVE, '0'); } catch (e) { /* nada */ }
    pintarBoton();
  };
  S.alternar = function () { if (S.activo) S.apagar(); else S.encender(); };
  S.medidor = function () { if (!ac) return null; var an = ac.createAnalyser(); an.fftSize = 2048; master.connect(an); return function () { var d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); var q = 0; for (var i = 0; i < d.length; i++) q += d[i] * d[i]; return Math.sqrt(q / d.length); }; };
  function pintarBoton() { var b = document.getElementById('b-sonido'); if (b) { b.setAttribute('aria-pressed', S.activo ? 'true' : 'false'); b.classList.toggle('activo', S.activo); } }
  // el botón va a la izquierda del del cuaderno (en el móvil, debajo)
  function colocar() {
    var b = document.getElementById('b-sonido'), c = document.getElementById('b-cuaderno'); if (!b || !c) return;
    var r = c.getBoundingClientRect(), movil = innerWidth < 640;
    b.style.top = (movil ? r.bottom + 8 : r.top) + 'px'; b.style.height = (movil ? 44 : r.height) + 'px';
    b.style.right = (movil ? innerWidth - r.right : innerWidth - r.left + 8) + 'px';
  }
  var quiere = false; try { quiere = localStorage.getItem(CLAVE) === '1'; } catch (e) { /* nada */ }
  function primerGesto() { if (quiere && !S.activo) S.encender(); window.removeEventListener('pointerdown', primerGesto, true); window.removeEventListener('keydown', primerGesto, true); }
  window.addEventListener('pointerdown', primerGesto, true); window.addEventListener('keydown', primerGesto, true);
  var b = document.getElementById('b-sonido');
  if (b) b.addEventListener('click', function (ev) { ev.stopPropagation(); quiere = false; S.alternar(); });
  window.addEventListener('resize', colocar); colocar(); setTimeout(colocar, 600);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(colocar);
  pintarBoton();
})();
