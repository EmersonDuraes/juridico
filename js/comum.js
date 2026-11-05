/* ==========================================================
   COMUM — funções usadas em todas as páginas
   (cabeçalho, rodapé, WhatsApp, cards, animação de rolagem)
   ========================================================== */
(function () {
  const C = window.CONTEUDO, I = window.IMAGENS, E = C.escritorio;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function whatsapp(msg) {
    return "https://wa.me/" + E.whatsapp + "?text=" + encodeURIComponent(msg || C.busca.mensagem);
  }

  function cabecalho(claro) {
    const el = $("#cabecalho");
    if (!el) return;
    if (claro) el.classList.add("cabecalho--claro");
    el.innerHTML = `
      <div class="cabecalho__in">
        <a class="cabecalho__logo" href="index.html#inicio">
          <img src="${I.logo}" alt="Logo ${esc(E.nome)}">
          <span>${esc(E.nome)}<small>${esc(E.sufixo)}</small></span>
        </a>
        <span class="cabecalho__sep"></span>
        <nav class="cabecalho__menu" id="menu">
          ${C.menu.map((m) => `<a href="${m.link}">${esc(m.texto)}</a>`).join("")}
        </nav>
        <div class="cabecalho__dir">
          <a class="btn-contorno" style="border-color:currentColor;color:inherit" href="${whatsapp()}" target="_blank" rel="noopener">${esc(C.botaoTopo)}</a>
          <span class="cabecalho__pill"><span>☰</span><i></i></span>
          <button class="cabecalho__burger" id="burger" aria-label="Menu">☰</button>
        </div>
      </div>`;
    $("#burger").addEventListener("click", () => $("#menu").classList.toggle("is-open"));
    $$("#menu a").forEach((a) => a.addEventListener("click", () => $("#menu").classList.remove("is-open")));
    if (!claro) {
      const onScroll = () => el.classList.toggle("cabecalho--fixo", window.scrollY > window.innerHeight * 0.7);
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  function rodape() {
    const el = $("#rodape");
    if (!el) return;
    el.innerHTML = `
      <div class="container">
        <div class="rodape__sociais">
          ${E.instagram && E.instagram !== "#" ? `<a href="${E.instagram}" target="_blank" rel="noopener">Instagram</a>` : ""}
          ${E.linkedin && E.linkedin !== "#" ? `<a href="${E.linkedin}" target="_blank" rel="noopener">LinkedIn</a>` : ""}
          <a href="mailto:${E.email}">E-mail</a>
        </div>
        © ${new Date().getFullYear()} ${esc(E.nome)} ${esc(E.sufixo)}. ${esc(C.rodape)}
        <small>${esc(C.aviso)}</small>
      </div>`;
    const z = $("#zap");
    if (z) z.href = whatsapp();
  }

  function card(area, i, delay) {
    return `
      <a class="card reveal" ${delay != null ? `data-delay="${delay}"` : ""} href="area.html?area=${area.id}">
        <img class="card__img" src="${I.areas[i % I.areas.length]}" alt="${esc(area.nome)}" loading="lazy">
        <span class="card__tag">${esc(area.preco)}</span>
        <span class="card__seta">→</span>
        <div class="card__corpo">
          <div class="card__nome">${esc(area.nome)}</div>
          <div class="card__local">📍 ${esc(area.local)}</div>
          <div class="card__linha">${esc(area.tag)}</div>
        </div>
      </a>`;
  }

  function reveal() {
    const itens = $$(".reveal:not(.is-visible)");
    if (!("IntersectionObserver" in window)) return itens.forEach((e) => e.classList.add("is-visible"));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
    }), { threshold: 0.12 });
    itens.forEach((e) => io.observe(e));
  }

  function hoje() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  window.MP = { $, $$, esc, whatsapp, cabecalho, rodape, card, reveal, hoje };
})();
