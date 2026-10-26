/* ==========================================================
   PRINCIPAL — menu, navegação, WhatsApp, formulário e carregamento
   ========================================================== */
(function () {
  'use strict';
  var D = window.SITE_DATA, areas = D.areas, L = window.LEX;
  var body = document.body;
  var ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

  function whatsUrl(text) { return 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(text); }

  /* Todos os links com [data-whats] viram link do WhatsApp */
  document.querySelectorAll('[data-whats]').forEach(function (a) { a.href = whatsUrl(D.whatsappMessage); });

  /* ---------- Menu em tela cheia ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var menuList = document.getElementById('menuList');
  var menu = document.getElementById('menu');

  menuList.innerHTML = areas.map(function (a, i) {
    return '<li><button style="--i:' + i + '" data-go="' + i + '"><small>' + ROMAN[i] + '</small>' + a.title + '</button></li>';
  }).join('');

  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
  }
  menuBtn.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
  menuList.addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]'); if (!b) return;
    setMenu(false); L.panel.close(); L.slider.goTo(parseInt(b.dataset.go, 10));
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Navegação do cabeçalho / menu ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-action]'); if (!a) return;
    e.preventDefault();
    var act = a.dataset.action;
    setMenu(false);
    if (act === 'areas') { L.panel.close(); return; }
    if (L.panel.isOpen()) { L.panel.scrollTo(act); L.panel.setActiveNav(act); }
    else L.panel.open(L.slider.index, act);
  });

  /* ---------- Formulário -> WhatsApp ---------- */
  var sel = document.getElementById('assuntoSelect');
  sel.innerHTML = areas.map(function (a) { return '<option>' + a.title + '</option>'; }).join('') + '<option>Outro assunto</option>';

  document.getElementById('contactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, nome = f.nome.value.trim();
    f.nome.classList.toggle('invalid', !nome);
    if (!nome) { f.nome.focus(); return; }
    var txt = 'Olá! Meu nome é ' + nome + '. Assunto: ' + f.assunto.value + '.' +
      (f.mensagem.value.trim() ? '\n\n' + f.mensagem.value.trim() : '');
    window.open(whatsUrl(txt), '_blank', 'noopener');
  });

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Carregamento ---------- */
  function ready() {
    setTimeout(function () { body.classList.remove('is-loading'); L.slider.start(); }, 700);
  }
  if (document.readyState === 'complete') ready(); else window.addEventListener('load', ready);
  setTimeout(function () { if (body.classList.contains('is-loading')) { body.classList.remove('is-loading'); L.slider.start(); } }, 4000);
})();
