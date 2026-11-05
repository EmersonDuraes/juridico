/* ==========================================================
   HERO — troca de slides, título animado e miniaturas.
   Textos: js/conteudo.js > hero | Fotos: js/imagens.js > hero
   ========================================================== */
(function () {
  const { $, esc } = window.MP;
  const slides = window.CONTEUDO.hero, fotos = window.IMAGENS.hero;
  const dur = (window.CONTEUDO.autoplaySegundos || 6) * 1000;
  const hero = $("#inicio");
  if (!hero) return;

  // Fundos (duas camadas p/ troca suave)
  const bg = $("#heroBg");
  const camadas = [0, 1].map(() => { const im = document.createElement("img"); im.className = "hero__bg-img"; im.alt = ""; bg.appendChild(im); return im; });
  let camada = 0;

  // Pontos de progresso
  const pontos = $("#heroPontos");
  pontos.innerHTML = slides.map((_, i) => `<button class="hero__ponto" aria-label="Slide ${i + 1}"><i></i></button>`).join("");
  pontos.style.setProperty("--dur", dur / 1000 + "s");
  Array.from(pontos.children).forEach((p, i) => p.addEventListener("click", () => ir(i)));

  let atual = -1, timer, trava = false;

  function titulo(txt) {
    const t = $("#heroTitulo"); t.innerHTML = "";
    let k = 0;
    txt.split(" ").forEach((palavra, w, arr) => {
      const span = document.createElement("span"); span.style.whiteSpace = "nowrap"; span.style.display = "inline-block";
      [...palavra].forEach((ch) => {
        const l = document.createElement("span"); l.className = "letra"; l.textContent = ch;
        l.style.animationDelay = 0.55 + k++ * 0.035 + "s"; span.appendChild(l);
      });
      t.appendChild(span); if (w < arr.length - 1) t.appendChild(document.createTextNode(" "));
    });
    t.setAttribute("aria-label", txt);
  }

  function minis() {
    $("#heroMinis").innerHTML = slides.map((_, i) => i).filter((i) => i !== atual)
      .map((i) => `<button class="hero__mini" data-i="${i}" aria-label="${esc(slides[i].subtitulo)}"><img src="${fotos[i % fotos.length]}" alt=""></button>`).join("");
    document.querySelectorAll(".hero__mini").forEach((b) => b.addEventListener("click", () => ir(+b.dataset.i)));
  }

  function aplicar(i) {
    const s = slides[i];
    const nova = camadas[camada ^ 1], velha = camadas[camada];
    nova.src = fotos[i % fotos.length];
    nova.classList.remove("is-on"); void nova.offsetWidth; nova.classList.add("is-on");
    velha.classList.remove("is-on");
    camada ^= 1;
    atual = i;
    titulo(s.titulo);
    $("#heroSub").textContent = s.subtitulo;
    $("#heroTxt").textContent = s.texto;
    $("#heroBig").src = fotos[(i + 1) % fotos.length];
    minis();
    Array.from(pontos.children).forEach((p, k) => { p.classList.remove("is-on", "is-done"); void p.offsetWidth; if (k < i) p.classList.add("is-done"); if (k === i) p.classList.add("is-on"); });
    // reinicia animações do bloco de texto
    const info = document.querySelector(".hero__info");
    info.style.display = "none"; void info.offsetWidth; info.style.display = "";
  }

  function ir(i) {
    if (trava || i === atual) return;
    trava = true; clearTimeout(timer);
    setTimeout(() => aplicar(i), 100);
    setTimeout(() => { trava = false; }, 1250);
    timer = setTimeout(() => ir((i + 1) % slides.length), dur + 1250);
  }

  aplicar(0);
  timer = setTimeout(() => ir(1 % slides.length), dur);
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(timer); else { clearTimeout(timer); timer = setTimeout(() => ir((atual + 1) % slides.length), dur); } });
})();
