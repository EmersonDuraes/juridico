/* ==========================================================
   PÁGINA INICIAL — monta barra de busca, cards, equipe, contato
   ========================================================== */
(function () {
  const { $, esc, whatsapp, card, hoje } = window.MP;
  const C = window.CONTEUDO, I = window.IMAGENS, B = C.busca;

  window.MP.cabecalho(false);
  window.MP.rodape();

  // ---- Barra de agendamento ----
  $("#bArea").innerHTML = C.areas.map((a) => `<option>${esc(a.nome)}</option>`).join("");
  $("#bModo").innerHTML = B.modos.map((m) => `<option>${esc(m)}</option>`).join("");
  $("#bTurno").innerHTML = B.turnos.map((m) => `<option>${esc(m)}</option>`).join("");
  $("#bAreaDica").textContent = B.campos.area.dica;
  $("#bModoDica").textContent = B.campos.modo.dica;
  $("#bDataDica").textContent = B.campos.data.dica;
  $("#bTurnoDica").textContent = B.campos.turno.dica;
  $("#bData").min = hoje();
  $("#busca").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = $("#bData").value ? new Date($("#bData").value + "T12:00").toLocaleDateString("pt-BR") : "a combinar";
    const msg = `${B.mensagem}\nÁrea: ${$("#bArea").value}\nAtendimento: ${$("#bModo").value}\nData: ${d}\nPeríodo: ${$("#bTurno").value}`;
    window.open(whatsapp(msg), "_blank", "noopener");
  });

  // ---- Áreas ----
  $("#tituloAreas").textContent = C.tituloAreas;
  $("#verTodas").textContent = C.verTodas;
  $("#gradeAreas").innerHTML = C.areas.map((a, i) => card(a, i, i % 4)).join("");

  // ---- Escritório ----
  const e = C.escritorioSecao;
  $("#escTitulo").textContent = e.titulo;
  $("#escTexto").innerHTML = e.texto.map((p) => `<p>${esc(p)}</p>`).join("");
  $("#escNums").innerHTML = e.numeros.map((n) => `<div class="num"><b>${esc(n.valor)}</b><span>${esc(n.rotulo)}</span></div>`).join("");
  $("#escImg").src = I.hero[1];

  // ---- Equipe ----
  $("#tituloEquipe").textContent = C.tituloEquipe;
  $("#gradeEquipe").innerHTML = C.equipe.map((m, i) => `
    <article class="socio reveal" data-delay="${i}">
      <div class="socio__foto"><img src="${I.equipe[i % I.equipe.length]}" alt="${esc(m.nome)}" loading="lazy"></div>
      <div class="socio__corpo">
        <h3 class="socio__nome">${esc(m.nome)}</h3>
        <div class="socio__cargo">${esc(m.cargo)}</div>
        <div class="socio__oab">${esc(m.oab)}</div>
        <p class="socio__bio">${esc(m.bio)}</p>
      </div>
    </article>`).join("");

  // ---- Contato ----
  const E = C.escritorio;
  $("#ctTitulo").textContent = C.tituloContato;
  $("#ctTexto").textContent = C.textoContato;
  $("#ctLista").innerHTML = `
    <li><span>📞</span>${esc(E.telefone)}</li>
    <li><span>✉️</span>${esc(E.email)}</li>
    <li><span>📍</span>${esc(E.endereco)}</li>
    <li><span>🕒</span>${esc(E.horario)}</li>`;
  $("#fNome").placeholder = C.formulario.nome;
  $("#fTel").placeholder = C.formulario.telefone;
  $("#fMsg").placeholder = C.formulario.mensagem;
  $("#fBtn").textContent = C.formulario.botao;
  $("#form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const msg = `Olá! Meu nome é ${$("#fNome").value}. Telefone: ${$("#fTel").value}.\n${$("#fMsg").value}`;
    window.open(whatsapp(msg), "_blank", "noopener");
  });

  window.MP.reveal();
})();
