/* ==========================================================
   SLIDER COM PARALLAX
   Fluxo ao trocar de área (igual ao vídeo):
   1) a imagem encolhe e vira um cartão  2) a faixa desliza
   3) o novo cartão se expande em tela cheia.
   Durante o movimento, imagem e texto andam em velocidades
   diferentes (parallax) e reagem ao mouse.
   ========================================================== */
(function () {
  'use strict';

  var D = window.SITE_DATA, areas = D.areas, N = areas.length;
  var ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
  var $ = function (s) { return document.querySelector(s); };

  var stage = $('#stage'), zoomEl = $('#zoom'), track = $('#track');
  var cntCur = $('#cntCur'), cntTotal = $('#cntTotal'), sideLabel = $('#sideLabel');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0, gap = 0, zoomOut = 0.62;
  var idx = 0, pos = 0, posT = 0, zoom = 1, zoomT = 1, phase = 'idle';
  var mx = 0, my = 0, tmx = 0, tmy = 0, last = 0, started = false;
  var slides = [];

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var panelOpen = function () { return document.body.classList.contains('panel-open'); };

  /* ---------- Monta os slides a partir de data.js ---------- */
  function build() {
    track.innerHTML = '';
    areas.forEach(function (a, i) {
      var el = document.createElement('article');
      el.className = 'slide';
      el.setAttribute('aria-label', a.over + ' ' + a.title);

      // título dividido em letras (para a animação de entrada)
      var n = 0;
      var words = a.title.split(' ').map(function (w) {
        var chars = w.split('').map(function (c) { return '<span class="ch" style="--n:' + (n++) + '">' + c + '</span>'; }).join('');
        return '<span class="w">' + chars + '</span>';
      }).join(' ');

      el.innerHTML =
        '<div class="slide-bg"><img src="' + a.image + '" alt="" draggable="false"></div>' +
        '<div class="slide-shade"></div>' +
        '<div class="slide-content">' +
          '<p class="over">' + a.over + '</p>' +
          '<h2 class="title" aria-label="' + a.title + '">' + words + '</h2>' +
          '<hr class="rule">' +
          '<h3 class="sub">' + a.subtitle + '</h3>' +
          '<p class="desc">' + a.desc + '</p>' +
        '</div>';

      el.addEventListener('click', function () { if (i !== idx) goTo(i); });
      track.appendChild(el);
      slides.push({ el: el, bg: el.querySelector('.slide-bg'), content: el.querySelector('.slide-content') });
    });
    cntTotal.textContent = ROMAN[N - 1] || N;
  }

  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    gap = Math.round(W * 0.04);
    zoomOut = W < 720 ? 0.76 : 0.62;
    track.style.gap = gap + 'px';
    slides.forEach(function (s) { s.el.style.width = W + 'px'; s.el.style.height = H + 'px'; });
    if (phase === 'shrink' || phase === 'move') zoomT = zoomOut;
  }

  /* ---------- Interface (contador e rótulo) ---------- */
  function updateUI() {
    cntCur.textContent = ROMAN[idx] || (idx + 1);
    cntCur.classList.remove('flash'); void cntCur.offsetWidth; cntCur.classList.add('flash');
    sideLabel.textContent = areas[idx].label.toUpperCase();
  }
  function activate() { slides.forEach(function (s, i) { s.el.classList.toggle('is-in', i === idx); }); }
  function deactivate() { slides.forEach(function (s) { s.el.classList.remove('is-in'); }); }

  /* ---------- Navegação ---------- */
  function goTo(n) {
    n = ((n % N) + N) % N;
    if (n === idx && phase === 'idle') return;
    idx = n;
    updateUI(); deactivate();
    if (reduce) { pos = posT = idx; zoom = zoomT = 1; phase = 'idle'; activate(); render(); return; }
    if (phase === 'idle' || phase === 'grow') { phase = 'shrink'; zoomT = zoomOut; }
    else if (phase === 'move') { posT = idx; }
  }
  var next = function () { goTo(idx + 1); };
  var prev = function () { goTo(idx - 1); };

  /* ---------- Desenho de cada quadro ---------- */
  function render() {
    var step = W + gap;
    track.style.transform = 'translate3d(' + (-pos * step) + 'px,0,0)';
    zoomEl.style.transform = 'scale(' + zoom + ')';
    var fade = clamp((zoom - 0.9) / 0.1, 0, 1);

    for (var i = 0; i < slides.length; i++) {
      var d = i - pos;
      if (Math.abs(d) > 1.7) continue;
      var s = slides[i];
      // PARALLAX: imagem e texto deslocam em velocidades diferentes
      s.bg.style.transform = 'translate3d(' + (-d * W * 0.07 - mx * 18) + 'px,' + (-my * 12) + 'px,0)';
      s.content.style.transform = 'translate3d(' + (d * W * 0.12 + mx * 8) + 'px,' + (my * 5) + 'px,0)';
      s.content.style.opacity = fade * Math.max(0, 1 - Math.abs(d) * 1.4);
    }
  }

  function tick(t) {
    requestAnimationFrame(tick);
    if (panelOpen()) { last = t; return; }
    var dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;

    if (phase === 'shrink' && zoom <= zoomOut + 0.015) { phase = 'move'; posT = idx; }
    if (phase === 'move' && Math.abs(pos - posT) < 0.004) { pos = posT; phase = 'grow'; zoomT = 1; }
    if (phase === 'grow' && zoom >= 0.994) { zoom = 1; phase = 'idle'; activate(); }

    zoom += (zoomT - zoom) * (1 - Math.exp(-dt * 8));
    pos += (posT - pos) * (1 - Math.exp(-dt * 6));
    mx += (tmx - mx) * (1 - Math.exp(-dt * 3));
    my += (tmy - my) * (1 - Math.exp(-dt * 3));
    render();
  }

  /* ---------- Entradas do usuário ---------- */
  var wheelLock = 0;
  window.addEventListener('wheel', function (e) {
    if (panelOpen() || document.body.classList.contains('menu-open')) return;
    e.preventDefault();
    var now = performance.now(), dy = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (now < wheelLock || Math.abs(dy) < 12) return;
    wheelLock = now + 900;
    dy > 0 ? next() : prev();
  }, { passive: false });

  window.addEventListener('keydown', function (e) {
    if (panelOpen() || document.body.classList.contains('menu-open')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
  });

  window.addEventListener('mousemove', function (e) {
    tmx = (e.clientX / window.innerWidth - 0.5) * 2;
    tmy = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  var tx = 0, ty = 0;
  stage.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return;
    var v = Math.abs(dx) > Math.abs(dy) ? dx : dy;
    v < 0 ? next() : prev();
  }, { passive: true });

  $('#nextBtn').addEventListener('click', next);
  $('#prevBtn').addEventListener('click', prev);
  window.addEventListener('resize', resize);

  /* ---------- Início ---------- */
  build(); resize(); updateUI(); render();
  requestAnimationFrame(tick);

  window.LEX = window.LEX || {};
  window.LEX.slider = {
    goTo: goTo, next: next, prev: prev,
    get index() { return idx; },
    start: function () { if (!started) { started = true; activate(); } }
  };
})();
