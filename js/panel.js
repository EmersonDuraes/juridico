/* ==========================================================
   PÁGINA BRANCA (serviços, sobre, contato) + PARALLAX DE ROLAGEM
   ========================================================== */
(function () {
  'use strict';
  var D = window.SITE_DATA, areas = D.areas;
  var body = document.body;
  var panel = document.getElementById('panel');
  var scroller = document.getElementById('panelScroll');
  var areaSection = document.getElementById('areaSection');
  var isOpen = false, ticking = false;

  var ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17L17 7M8 7h9v9"/></svg>';
  var CHEV = '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg>';

  function whatsUrl(text) { return 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(text); }

  function renderArea(i) {
    var a = areas[i];
    var cards = a.cards.map(function (c, k) {
      var msg = 'Olá! Tenho interesse em ' + c.name + ' (' + a.panelTitle.replace('Soluções em ', '') + ').';
      return '<a class="card reveal" style="--d:' + (k * 130) + 'ms" href="' + whatsUrl(msg) + '" target="_blank" rel="noopener">' +
        '<div class="card-media"><img data-speed="0.07" src="' + c.image + '" alt="" loading="lazy"></div>' +
        '<span class="card-icon">' + ARROW + '</span>' +
        '<div class="card-body"><span class="card-name">' + c.name + '</span><span class="card-text">' + c.text + '</span></div>' +
        '</a>';
    }).join('');

    areaSection.innerHTML =
      '<h2 class="panel-title reveal">' + a.panelTitle + '</h2>' +
      '<div class="panel-rule reveal"></div>' +
      '<div class="panel-subrow reveal"><button class="back" data-close>' + CHEV + ' Voltar</button>' +
      '<p class="panel-sub">' + a.panelSub + '</p></div>' +
      '<div class="cards">' + cards + '</div>';
  }

  /* ---------- Revelar ao rolar ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { root: scroller, threshold: 0.12 }) : null;

  function observe() {
    panel.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
      if (io) io.observe(el); else el.classList.add('in');
    });
  }

  /* ---------- Parallax de rolagem ---------- */
  function parallax() {
    ticking = false;
    var vh = window.innerHeight;
    panel.querySelectorAll('[data-speed]').forEach(function (el) {
      var box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) return;
      var c = box.top + box.height / 2 - vh / 2;
      el.style.transform = 'translate3d(0,' + (-c * parseFloat(el.dataset.speed)).toFixed(1) + 'px,0)';
    });
    body.classList.toggle('panel-scrolled', scroller.scrollTop > 10);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }
  scroller.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Abrir / fechar ---------- */
  function open(i, sectionId) {
    if (typeof i === 'number') renderArea(i);
    else if (!areaSection.innerHTML) renderArea(window.LEX.slider.index);
    isOpen = true;
    body.classList.add('panel-open');
    body.classList.remove('menu-open');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    scroller.scrollTop = 0;
    observe(); parallax();
    setActiveNav(sectionId || 'areas');
    if (sectionId) setTimeout(function () { scrollToSection(sectionId); }, 650);
    setTimeout(function () { window.LEX.resetHold && window.LEX.resetHold(); }, 400);
    panel.focus && panel.setAttribute('tabindex', '-1');
    panel.focus({ preventScroll: true });
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    body.classList.remove('panel-open', 'panel-scrolled');
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    setActiveNav('areas');
  }

  function scrollToSection(id) {
    var el = document.getElementById(id === 'about' ? 'sobre' : id === 'contact' ? 'contato' : id);
    if (!el) return;
    var top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 10;
    scroller.scrollTo({ top: top, behavior: 'smooth' });
  }

  function setActiveNav(action) {
    document.querySelectorAll('.nav a').forEach(function (a) { a.classList.toggle('is-active', a.dataset.action === action); });
  }

  /* Fechar: botão Voltar, botão flutuante, tecla Esc */
  document.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  window.LEX = window.LEX || {};
  window.LEX.panel = { open: open, close: close, scrollTo: scrollToSection, isOpen: function () { return isOpen; }, setActiveNav: setActiveNav };

  observe();
})();
