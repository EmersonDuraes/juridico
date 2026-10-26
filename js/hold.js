/* ==========================================================
   BOTÃO "CLIQUE E SEGURE"
   Segurar ~1,1 s preenche o círculo e abre a página branca.
   Teclado: Enter ou Espaço abre direto (acessibilidade).
   ========================================================== */
(function () {
  'use strict';
  var btn = document.getElementById('hold');
  var DURATION = 1.1;           // segundos segurando (mude aqui)
  var p = 0, holding = false, running = false, last = 0;

  function loop(t) {
    var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    p += holding ? dt / DURATION : -dt / 0.35;
    p = Math.max(0, Math.min(1, p));
    btn.style.setProperty('--p', p.toFixed(4));

    if (holding && p >= 1) {
      holding = false; btn.classList.remove('is-holding');
      window.LEX.panel.open(window.LEX.slider.index);
    }
    if (p > 0 || holding) requestAnimationFrame(loop); else running = false;
  }
  function start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); } }

  function press(e) {
    if (document.body.classList.contains('panel-open')) return;
    if (e && e.cancelable) e.preventDefault();
    holding = true; btn.classList.add('is-holding'); start();
  }
  function release() { holding = false; btn.classList.remove('is-holding'); start(); }

  btn.addEventListener('pointerdown', press);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, release); });
  btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  btn.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      window.LEX.panel.open(window.LEX.slider.index);
    }
  });

  window.LEX.resetHold = function () { holding = false; p = 0; btn.style.setProperty('--p', 0); btn.classList.remove('is-holding'); };
})();
