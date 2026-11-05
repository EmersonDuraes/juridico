/* ==========================================================
   PÁGINA DE DETALHE — lê ?area=id da URL e monta a página.
   Textos de cada área: js/conteudo.js > areas
   ========================================================== */
(function () {
  const { $, esc, whatsapp, card, hoje } = window.MP;
  const C = window.CONTEUDO, I = window.IMAGENS, D = C.detalhe;

  window.MP.cabecalho(true);
  window.MP.rodape();

  const id = new URLSearchParams(location.search).get("area");
  let idx = C.areas.findIndex((a) => a.id === id);
  if (idx < 0) idx = 0;
  const a = C.areas[idx];

  document.title = `${a.nome} — ${C.escritorio.nome} ${C.escritorio.sufixo}`;
  $("#migalhas").innerHTML = `<a href="index.html">${esc(C.escritorio.nome)}</a><span>›</span><a href="index.html#areas">${esc(D.migalhas)}</a><span>›</span>${esc(a.nome)}`;

  $("#dFoto").src = I.areas[idx % I.areas.length];
  $("#dFoto").alt = a.nome;
  $("#dMini").innerHTML = I.galeria.map((g, i) =>
    `<div><img src="${g}" alt="">${i === 2 ? '<span class="detalhe__mais">+9</span>' : ""}</div>`).join("");

  $("#dTitulo").textContent = a.nome;
  $("#dPor").innerHTML = `${esc(a.local)} · <b>${esc(D.por)}</b>`;
  $("#dSobreT").textContent = `${D.sobre} — ${a.nome}`;
  $("#dSobre").textContent = a.descricao;
  $("#dPreco").textContent = a.preco;

  $("#aTitulo").textContent = D.tituloAgenda;
  $("#aRotData").textContent = D.rotuloData;
  $("#aRotModo").textContent = D.rotuloModo;
  $("#aModo").innerHTML = C.busca.modos.map((m) => `<option>${esc(m)}</option>`).join("");
  $("#aData").min = hoje();
  $("#aBtn").textContent = D.botaoAgenda;
  $("#aZap").textContent = D.botaoSecundario;
  $("#aZap").href = whatsapp(`Olá! Tenho interesse em ${a.nome}.`);
  $("#agenda").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = $("#aData").value ? new Date($("#aData").value + "T12:00").toLocaleDateString("pt-BR") : "a combinar";
    window.open(whatsapp(`Olá! Gostaria de agendar uma consulta sobre ${a.nome}.\nAtendimento: ${$("#aModo").value}\nData: ${d}`), "_blank", "noopener");
  });

  $("#dDest").textContent = D.destaque;
  $("#dDestSub").textContent = D.destaqueSub;
  $("#difT").textContent = D.tituloDiferenciais;
  $("#difG").innerHTML = D.diferenciais.map((d) => `<div class="dif__item"><span>${d.icone}</span>${esc(d.texto)}</div>`).join("");

  $("#simT").textContent = D.tituloSimilares;
  $("#simG").innerHTML = C.areas.map((x, i) => ({ x, i })).filter((o) => o.i !== idx).slice(0, 4)
    .map((o, k) => card(o.x, o.i, k)).join("");

  window.MP.reveal();
})();
