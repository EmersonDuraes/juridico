/* ============================================================
   Martins & Pamplona — comportamento do site
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
  (function () {
    var q = encodeURIComponent(S.mapaBusca || S.endereco || ""), f = document.getElementById("mapa");
    if (f && q) f.src = "https://maps.google.com/maps?q=" + q + "&z=16&output=embed";
    $$("[data-maplink]").forEach(function (a) { a.href = "https://www.google.com/maps/search/?api=1&query=" + q; });
  })();
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

  /* ---------- submenu Serviços ---------- */
  $$(".dd").forEach(function (d) {
    var b = d.querySelector(".dd__btn");
    b.addEventListener("click", function (e) { e.stopPropagation(); var o = d.classList.toggle("open"); b.setAttribute("aria-expanded", o); });
    document.addEventListener("click", function () { d.classList.remove("open"); b.setAttribute("aria-expanded", "false"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") d.classList.remove("open"); });
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
  var secIds = ["areas", "historia", "documentos", "contato"];
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

/* ---------- Áreas de atuação: arco giratório ---------- */
(function () {
  "use strict";
  var sec = document.getElementById("areas"); if (!sec) return;
  var imgs = [].slice.call(sec.querySelectorAll(".arc__img")), lbls = [].slice.call(sec.querySelectorAll(".arc__lbl")),
      decos = [].slice.call(sec.querySelectorAll(".arc__deco")), info = [].slice.call(sec.querySelectorAll(".ainfo")),
      names = lbls.map(function (l) { return l.textContent; }), N = imgs.length, cur = 0,
      timer = null, visible = false, paused = false, step = 360 / N;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function off(i) { var d = ((i - cur) % N + N) % N; return d > N / 2 ? d - N : d; }
  function render() {
    sec.setAttribute("data-c", cur);
    imgs.forEach(function (el, i) {
      var d = off(i);
      el.classList.toggle("on", d === 0);
      el.style.transform = d === 0 ? "rotate(0) scale(1)" : "rotate(" + (d * 40) + "deg) scale(.7)";
    });
    lbls.forEach(function (l, i) {
      var a = off(i) * step, ab = Math.abs(a);
      l.style.transform = "rotate(" + a + "deg)";
      l.style.opacity = ab > 112 ? 0 : (ab === 0 ? 1 : Math.max(.3, 1 - ab / 140));
      l.setAttribute("data-hide", ab > 112 ? "1" : "0");
      l.classList.toggle("on", i === cur); l.tabIndex = ab > 112 ? -1 : 0;
    });
    [].forEach.call(sec.querySelectorAll(".pop__bg"), function (b, i) { b.classList.toggle("on", i === cur); });
    decos.forEach(function (d, i) { d.classList.toggle("on", i === cur); });
    info.forEach(function (x, i) { x.classList.toggle("on", i === cur); });
    var cta = document.getElementById("areaCta");
    if (cta) cta.href = "https://wa.me/" + ((window.SITE && window.SITE.whatsapp) || "") + "?text=" + encodeURIComponent("Olá! Preciso de orientação em Direito " + names[cur] + ".");
  }
  function go(i) { cur = ((i % N) + N) % N; render(); restart(); }
  function restart() {
    clearInterval(timer);
    if (reduce || !visible || paused) return;
    timer = setInterval(function () { go(cur + 1); }, 6500);
  }
  lbls.forEach(function (l, i) { l.addEventListener("click", function () { go(i); }); });
  document.getElementById("popPrev").addEventListener("click", function () { go(cur - 1); });
  document.getElementById("popNext").addEventListener("click", function () { go(cur + 1); });
  sec.addEventListener("mouseenter", function () { paused = true; clearInterval(timer); });
  sec.addEventListener("mouseleave", function () { paused = false; restart(); });
  sec.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") go(cur + 1); if (e.key === "ArrowLeft") go(cur - 1);
  });
  var x0 = null;
  sec.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  sec.addEventListener("touchend", function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 45) go(cur + (dx < 0 ? 1 : -1));
  }, { passive: true });
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; restart(); }, { threshold: 0.4 }).observe(sec);
  function fit() {
    var arc = sec.querySelector(".arc"), mob = window.innerWidth <= 760;
    if (mob) { sec.style.setProperty("--dc", Math.min(window.innerWidth * .74, window.innerHeight * .36) + "px"); return; }
    var pb = 0, h = arc.clientHeight;
    var dc = Math.max(220, Math.min(window.innerWidth * .42, h - 14 - pb - 100));
    sec.style.setProperty("--dc", dc + "px");
  }
  function curve() {
    var dc = parseFloat(sec.style.getPropertyValue("--dc")) || 300, R = dc / 2 + 50, S = 2 * (R + 44), r = R + 12, c = S / 2,
        fs = Math.max(11, Math.min(15, dc * .04)), NS = "http://www.w3.org/2000/svg";
    lbls.forEach(function (l, i) {
      l.style.width = S + "px"; l.style.height = S + "px";
      l.innerHTML = "";
      var svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 " + S + " " + S); svg.setAttribute("width", S); svg.setAttribute("height", S);
      var path = document.createElementNS(NS, "path"); path.setAttribute("id", "arcp" + i);
      path.setAttribute("d", "M " + (c - r) + " " + c + " A " + r + " " + r + " 0 0 1 " + (c + r) + " " + c); path.setAttribute("fill", "none");
      var t = document.createElementNS(NS, "text"); t.setAttribute("font-size", fs); t.setAttribute("letter-spacing", fs * .2);
      var tp = document.createElementNS(NS, "textPath"); tp.setAttribute("href", "#arcp" + i); tp.setAttribute("startOffset", "50%"); tp.setAttribute("text-anchor", "middle");
      tp.textContent = names[i].toUpperCase(); t.appendChild(tp);
      t.addEventListener("click", function () { go(i); });
      svg.appendChild(path); svg.appendChild(t); l.appendChild(svg); l.setAttribute("aria-label", names[i]);
    });
  }
  window.addEventListener("resize", function () { fit(); curve(); }); fit(); curve();
  render();
})();

/* ---------- Equipe jurídica (editorial) ---------- */
(function () {
  "use strict";
  var sec = document.getElementById("equipe"); if (!sec) return;
  var cards = [].slice.call(sec.querySelectorAll(".tf")), N = cards.length, cur = 0, x0 = null,
      big = document.getElementById("tmBig"), idx = document.getElementById("tmIdx");
  // cartão virtual de cada advogado, na mesma ordem da equipe
  var CARTOES = ["cartao-lucia-martins.html", "cartao-meire-pamplona.html", "cartao-jose-antonio.html", "cartao.html"];
  ((window.SITE || {}).equipe || []).slice(0, N).forEach(function (m, i) {
    function set(sel, v) { var el = cards[i].querySelector(sel); if (el && v) el.textContent = v; }
    set(".n1", m.nome); set(".n2", m.especialidade); set(".tag", m.frase);
    set(".meta", [m.cargo, m.oab].filter(Boolean).join(" · "));
    if (m.nome) cards[i].setAttribute("aria-label", m.nome);
  });
  function T(i, s) { var el = cards[i].querySelector(s); return el ? el.textContent : ""; }
  function last(n) { var p = n.replace(/^(Dra?\.)\s*/i, "").split(" "); return p[p.length - 1]; }
  var btns = cards.map(function (c, i) {
    var b = document.createElement("button"); b.type = "button";
    b.innerHTML = "<i>" + ("0" + (i + 1)).slice(-2) + "</i><span>" + last(T(i, ".n1")) + "</span>";
    b.addEventListener("click", function () { go(i); }); idx.appendChild(b); return b;
  });
  function render() {
    cards.forEach(function (c, i) { c.classList.toggle("on", i === cur); c.setAttribute("aria-hidden", i === cur ? "false" : "true"); });
    btns.forEach(function (b, i) { b.classList.toggle("on", i === cur); });
    var cv = document.getElementById("tmCard");
    if (cv) { cv.href = CARTOES[cur] + "#aba"; cv.setAttribute("aria-label", "Cartão virtual de " + T(cur, ".n1") + " (abre em nova aba)"); }
    big.classList.add("swap");
    setTimeout(function () { big.textContent = last(T(cur, ".n1")).toUpperCase(); big.classList.remove("swap"); }, 220);
    var tx = sec.querySelector(".tmf__txt"); tx.classList.add("swap");
    setTimeout(function () {
      document.getElementById("tmName").textContent = T(cur, ".n1");
      document.getElementById("tmEsp").textContent = T(cur, ".n2");
      document.getElementById("tmTag").textContent = "“" + T(cur, ".tag") + "”";
      document.getElementById("tmMeta").textContent = T(cur, ".meta");
      tx.classList.remove("swap");
    }, 220);
  }
  function go(i) { cur = ((i % N) + N) % N; render(); }
  document.getElementById("tmPrev").addEventListener("click", function () { go(cur - 1); });
  document.getElementById("tmNext").addEventListener("click", function () { go(cur + 1); });
  sec.addEventListener("keydown", function (e) { if (e.key === "ArrowRight") go(cur + 1); if (e.key === "ArrowLeft") go(cur - 1); });
  sec.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  sec.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); }, { passive: true });
  big.textContent = last(T(0, ".n1")).toUpperCase();
  document.getElementById("tmName").textContent = T(0, ".n1"); document.getElementById("tmEsp").textContent = T(0, ".n2");
  document.getElementById("tmTag").textContent = "“" + T(0, ".tag") + "”"; document.getElementById("tmMeta").textContent = T(0, ".meta");
  render();
})();

/* ---------- Fundamentos da defesa: carrossel ---------- */
(function () {
  var sec = document.getElementById("fundamentos"); if (!sec) return;
  var slides = [].slice.call(sec.querySelectorAll(".fslide")), dots = [].slice.call(sec.querySelectorAll(".fdots button"));
  var cur = 0, timer = null, N = slides.length;
  function show(i) {
    cur = (i + N) % N;
    slides.forEach(function (s, k) { s.classList.toggle("on", k === cur); s.setAttribute("aria-hidden", k !== cur); });
    dots.forEach(function (d, k) { d.classList.toggle("on", k === cur); });
  }
  function play() { stop(); if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; timer = setInterval(function () { show(cur + 1); }, 8000); }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  sec.querySelector(".fnav--prev").addEventListener("click", function () { show(cur - 1); play(); });
  sec.querySelector(".fnav--next").addEventListener("click", function () { show(cur + 1); play(); });
  dots.forEach(function (d, k) { d.addEventListener("click", function () { show(k); play(); }); });
  sec.addEventListener("mouseenter", stop); sec.addEventListener("mouseleave", play);
  var x0 = null;
  sec.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  sec.addEventListener("touchend", function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) { show(cur + (dx < 0 ? 1 : -1)); play(); } x0 = null; }, { passive: true });
  document.addEventListener("keydown", function (e) { var r = sec.getBoundingClientRect(); if (r.top < innerHeight * .6 && r.bottom > innerHeight * .4) { if (e.key === "ArrowRight") { show(cur + 1); play(); } if (e.key === "ArrowLeft") { show(cur - 1); play(); } } });
  show(0); play();
})();
