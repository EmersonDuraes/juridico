/* ============================================================
   Emerson Durães — comportamento do site
   ============================================================ */
(function () {
  "use strict";
  var S = window.SITE || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- dados do escritório (config.js) ---------- */
  function waLink(msg) {
    return "https://wa.me/" + (S.whatsapp || "") + "?text=" + encodeURIComponent(msg || S.mensagemPadrao || "");
  }
  $$("[data-wa]").forEach(function (a) {
    a.href = waLink(a.getAttribute("data-msg"));
    a.target = "_blank"; a.rel = "noopener";
  });
  $$("[data-mail]").forEach(function (a) { a.href = "mailto:" + (S.email || ""); });
  $$("[data-email]").forEach(function (e) { if (S.email) e.textContent = S.email; });
  $$("[data-phone]").forEach(function (e) { if (S.telefoneExibicao) e.textContent = S.telefoneExibicao; });
  $$("[data-address]").forEach(function (e) { if (S.endereco) e.textContent = S.endereco; });
  $$("[data-social]").forEach(function (a) {
    var url = (S.redes || {})[a.getAttribute("data-social")];
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; } else { a.hidden = true; }
  });
  var y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- menu ---------- */
  var burger = $("#burger"), menu = $("#menu");
  function toggleMenu(open) {
    burger.classList.toggle("open", open);
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-hidden", !open);
    document.body.classList.toggle("no-scroll", open);
  }
  burger.addEventListener("click", function () { toggleMenu(!menu.classList.contains("open")); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { toggleMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") toggleMenu(false); });

  /* ---------- aparecer ao rolar ---------- */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (en) {
    en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
  }, { threshold: 0.18 }) : null;
  $$(".reveal").forEach(function (el) { io ? io.observe(el) : el.classList.add("in"); });

  /* ---------- carrosséis ---------- */
  $$("[data-carousel]").forEach(function (car) {
    var track = $(".track", car), dotsBox = $("[data-dots]", car);
    var prev = $("[data-prev]", car), next = $("[data-next]", car);
    var dots = [];

    function step() {
      var c = track.children[0];
      if (!c) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return c.getBoundingClientRect().width + gap;
    }
    function perView() { return Math.max(1, Math.round(track.clientWidth / step())); }
    function maxScroll() { return track.scrollWidth - track.clientWidth; }
    function pages() { return Math.max(1, Math.ceil((track.children.length) / perView())); }

    function build() {
      dotsBox.innerHTML = ""; dots = [];
      var n = pages();
      for (var i = 0; i < n; i++) {
        (function (i) {
          var b = document.createElement("button");
          b.setAttribute("aria-label", "Ir para o grupo " + (i + 1));
          b.addEventListener("click", function () {
            track.scrollTo({ left: i * perView() * step(), behavior: "smooth" });
          });
          dotsBox.appendChild(b); dots.push(b);
        })(i);
      }
      dotsBox.style.display = n > 1 ? "flex" : "none";
      update();
    }
    function update() {
      var s = track.scrollLeft, m = maxScroll();
      var idx = m <= 0 ? 0 : (s >= m - 4 ? dots.length - 1 : Math.round(s / (perView() * step())));
      dots.forEach(function (d, i) { d.classList.toggle("on", i === Math.min(idx, dots.length - 1)); });
      if (prev) prev.disabled = s <= 4;
      if (next) next.disabled = s >= m - 4;
    }
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -step() * perView(), behavior: "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: step() * perView(), behavior: "smooth" }); });
    track.addEventListener("scroll", function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", build);
    window.addEventListener("load", build);
    build();
  });

  /* ---------- CTA: troca de mensagens ---------- */
  var slides = $$(".cta__slide"), cur = 0, timer;
  function show(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle("on", k === cur); });
  }
  function auto() { clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 7000); }
  var cp = $("#ctaPrev"), cn = $("#ctaNext");
  if (cp) cp.addEventListener("click", function () { show(cur - 1); auto(); });
  if (cn) cn.addEventListener("click", function () { show(cur + 1); auto(); });
  if (slides.length) auto();

  /* ---------- parallax suave ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pEls = $$("[data-parallax],[data-parallax-bg]").map(function (el) {
    return { el: el, k: parseFloat(el.getAttribute("data-parallax") || el.getAttribute("data-parallax-bg")) || 0.06,
             sec: el.closest("section") };
  });
  var ticking = false;
  function parallax() {
    var vh = window.innerHeight;
    pEls.forEach(function (p) {
      var r = p.sec.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var off = (r.top + r.height / 2 - vh / 2) * -p.k;
      p.el.style.transform = "translate3d(0," + off.toFixed(1) + "px,0)";
    });
    ticking = false;
  }
  if (!reduce) {
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(parallax); }
    }, { passive: true });
    parallax();
  }

  /* ---------- link ativo no menu ---------- */
  var navLinks = $$(".main-nav a");
  var secIds = ["areas", "escritorio", "contato"];
  window.addEventListener("scroll", function () {
    var pos = window.scrollY + window.innerHeight * 0.4;
    navLinks.forEach(function (a) {
      var t = document.getElementById(a.getAttribute("href").slice(1));
      a.classList.toggle("on", !!t && t.offsetTop <= pos && t.offsetTop + t.offsetHeight > pos);
    });
  }, { passive: true });

  /* ---------- formulário do rodapé ---------- */
  var form = $("#contactForm");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("#fEmail").value.trim(), ok = $("#fOk").checked, msg = $("#formMsg");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = "Informe um e-mail válido."; return; }
    if (!ok) { msg.textContent = "Marque a autorização para contato."; return; }
    msg.textContent = "Abrindo o WhatsApp para concluir o envio…";
    window.open(waLink("Olá! Gostaria de receber um retorno do escritório. Meu e-mail: " + email), "_blank", "noopener");
    form.reset();
  });
})();

/* ---------- Áreas de atuação: roda de círculos ---------- */
(function () {
  "use strict";
  var sec = document.getElementById("areas");
  if (!sec) return;
  var orbs = [].slice.call(sec.querySelectorAll(".orb")),
      bgs = [].slice.call(sec.querySelectorAll(".areas__bg")),
      dots = [].slice.call(sec.querySelectorAll(".areas__dots button")),
      nameEl = document.getElementById("areaName"),
      N = orbs.length, cur = 0, timer = null, visible = false, paused = false;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var names = orbs.map(function (o) { return o.querySelector("em").textContent; });

  function posFor(off) {            // off = deslocamento em relação ao ativo, entre -2 e +3
    return { "-2": "m2", "-1": "m1", "0": "0", "1": "p1", "2": "p2" }[off] || (off < 0 ? "top" : "bot");
  }
  function render() {
    orbs.forEach(function (o, i) {
      var off = ((i - cur) % N + N) % N;       // 0..N-1
      if (off > N - 3) off -= N;               // ... -2, -1
      o.setAttribute("data-pos", posFor(off));
      o.classList.toggle("is-active", off === 0);
      o.querySelector("button").tabIndex = Math.abs(off) <= 2 ? 0 : -1;
    });
    bgs.forEach(function (b, i) { b.classList.toggle("on", i === cur); });
    dots.forEach(function (d, i) { d.classList.toggle("on", i === cur); });
    if (nameEl) { nameEl.style.opacity = 0; setTimeout(function () { nameEl.textContent = names[cur]; nameEl.style.opacity = 1; }, 250); }
  }
  function go(i) { cur = ((i % N) + N) % N; render(); restart(); }
  function restart() {
    clearInterval(timer);
    if (reduce || !visible || paused) return;
    timer = setInterval(function () { go(cur + 1); }, 5200);
  }

  orbs.forEach(function (o, i) { o.querySelector("button").addEventListener("click", function () { go(i); }); });
  dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); }); });
  sec.addEventListener("mouseenter", function () { paused = true; clearInterval(timer); });
  sec.addEventListener("mouseleave", function () { paused = false; restart(); });
  sec.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") go(cur + 1);
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(cur - 1);
  });

  // gesto de arrastar (celular)
  var y0 = null;
  sec.addEventListener("touchstart", function (e) { y0 = e.touches[0].clientY; }, { passive: true });
  sec.addEventListener("touchend", function (e) {
    if (y0 === null) return;
    var dy = e.changedTouches[0].clientY - y0; y0 = null;
    if (Math.abs(dy) > 50) go(cur + (dy < 0 ? 1 : -1));
  }, { passive: true });

  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; restart(); }, { threshold: 0.4 }).observe(sec);
  render();
})();

/* ---------- Equipe jurídica ---------- */
(function () {
  "use strict";
  var sec = document.getElementById("equipe");
  if (!sec) return;
  var texts = [].slice.call(sec.querySelectorAll(".member")),
      photos = [].slice.call(sec.querySelectorAll(".mphoto")),
      btns = [].slice.call(sec.querySelectorAll(".team__nav button")),
      N = texts.length, cur = 0;
  // preenche nomes/textos a partir de js/config.js (S.equipe)
  ((window.SITE || {}).equipe || []).slice(0, N).forEach(function (m, i) {
    function set(el, v) { if (el && v) el.textContent = v; }
    set(texts[i].querySelector(".n1"), m.nome);
    set(texts[i].querySelector(".n2"), m.especialidade);
    set(texts[i].querySelector(".tag"), m.frase);
    set(texts[i].querySelector(".meta"), [m.cargo, m.oab].filter(Boolean).join(" · "));
    set(btns[i].querySelector("span"), m.nome);
    var img = photos[i].querySelector("img"); if (img && m.nome) img.alt = m.nome;
  });
  function show(i) {
    cur = ((i % N) + N) % N;
    texts.forEach(function (t, k) { t.classList.toggle("on", k === cur); t.setAttribute("aria-hidden", k !== cur); });
    photos.forEach(function (p, k) { p.classList.toggle("on", k === cur); });
    btns.forEach(function (b, k) { b.classList.toggle("on", k === cur); });
  }
  btns.forEach(function (b, i) { b.addEventListener("click", function () { show(i); }); });
  document.getElementById("teamPrev").addEventListener("click", function () { show(cur - 1); });
  document.getElementById("teamNext").addEventListener("click", function () { show(cur + 1); });
  sec.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") show(cur + 1); else if (e.key === "ArrowLeft") show(cur - 1);
  });
  var x0 = null;
  sec.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  sec.addEventListener("touchend", function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
