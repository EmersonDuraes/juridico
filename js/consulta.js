/* ============================================================
   Consulta processual — usa o Worker (worker/datajud-proxy.js)
   ============================================================ */
(function () {
  "use strict";
  var S = window.SITE || {};
  var form = document.getElementById("consultaForm");
  if (!form) return;
  var input = document.getElementById("numero");
  var msg = document.getElementById("cmsg");
  var out = document.getElementById("resultado");
  var btn = document.getElementById("btnBuscar");

  var ESTADUAIS = ["", "AC","AL","AP","AM","BA","CE","DFT","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SE","SP","TO"];

  /* máscara NNNNNNN-DD.AAAA.J.TR.OOOO */
  function mask(d) {
    d = d.replace(/\D/g, "").slice(0, 20);
    var r = d.slice(0, 7);
    if (d.length > 7) r += "-" + d.slice(7, 9);
    if (d.length > 9) r += "." + d.slice(9, 13);
    if (d.length > 13) r += "." + d.slice(13, 14);
    if (d.length > 14) r += "." + d.slice(14, 16);
    if (d.length > 16) r += "." + d.slice(16, 20);
    return r;
  }
  input.addEventListener("input", function () { input.value = mask(input.value); });

  /* dígito verificador (módulo 97) */
  function valid(n) {
    if (n.length !== 20) return false;
    var base = n.slice(0, 7) + n.slice(9) + "00", r = 0;
    for (var i = 0; i < base.length; i++) r = (r * 10 + Number(base[i])) % 97;
    return ("0" + (98 - r)).slice(-2) === n.slice(7, 9);
  }

  function setMsg(t, type) { msg.textContent = t || ""; msg.className = "cmsg" + (type ? " cmsg--" + type : ""); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function parseDate(v) {
    if (!v) return null;
    var s = String(v), d;
    if (/^\d{14}$/.test(s)) d = new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(8, 10), +s.slice(10, 12));
    else d = new Date(s);
    return isNaN(d) ? null : d;
  }
  function fmt(v, withTime) {
    var d = parseDate(v); if (!d) return "—";
    var o = { day: "2-digit", month: "2-digit", year: "numeric" };
    if (withTime) { o.hour = "2-digit"; o.minute = "2-digit"; }
    return d.toLocaleDateString("pt-BR", o).replace(",", " às");
  }

  /* tribunal a partir do número CNJ (para a consulta direta) */
  function alias(n) {
    var j = n.slice(13, 14), tr = parseInt(n.slice(14, 16), 10);
    if (j === "8" && ESTADUAIS[tr]) return ESTADUAIS[tr].toLowerCase();
    if (j === "4" && tr >= 1 && tr <= 6) return "trf" + tr;
    if (j === "5" && tr >= 1 && tr <= 24) return "trt" + tr;
    if (j === "3") return "stj";
    return null;
  }

  function unavailable() {
    out.innerHTML = "";
    var c = el("div", "ccard ccard--simple");
    c.appendChild(el("h2", null, "Consulta temporariamente indisponível"));
    c.appendChild(el("p", null, "Não conseguimos buscar o andamento agora. Fale com o escritório e informamos a situação do seu processo."));
    var a = el("a", "btn btn--gold", "Falar com o escritório");
    a.href = "https://wa.me/" + (S.whatsapp || "") + "?text=" + encodeURIComponent("Olá! Gostaria de saber o andamento do processo " + mask(input.value)); a.target = "_blank"; a.rel = "noopener";
    c.appendChild(a); out.appendChild(c);
  }

  /* busca: Worker (recomendado) ou direto no DataJud com a chave pública */
  function buscar(n) {
    if (S.consultaApi) {
      return fetch(S.consultaApi.replace(/\/$/, "") + "/?numero=" + n)
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });
    }
    var t = alias(n);
    if (!t) return Promise.resolve({ ok: false, j: { erro: "tribunal_nao_suportado" } });
    return fetch("https://api-publica.datajud.cnj.jus.br/api_publica_" + t + "/_search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "APIKey " + S.consultaChave },
      body: JSON.stringify({ size: 5, query: { match: { numeroProcesso: n } } })
    }).then(function (r) { return r.json().then(function (d) {
      if (!r.ok) return { ok: false, j: {} };
      var hits = (d.hits && d.hits.hits) || [];
      return { ok: true, j: { encontrado: hits.length > 0, processos: hits.map(function (h) {
        var x = h._source || {};
        return { numeroProcesso: x.numeroProcesso, classe: x.classe && x.classe.nome,
          assuntos: (x.assuntos || []).map(function (a) { return a.nome; }),
          orgaoJulgador: x.orgaoJulgador && x.orgaoJulgador.nome, tribunal: x.tribunal, grau: x.grau,
          dataAjuizamento: x.dataAjuizamento, atualizadoEm: x.dataHoraUltimaAtualizacao,
          movimentos: (x.movimentos || []).map(function (m) { return { nome: m.nome, dataHora: m.dataHora,
            complementos: (m.complementosTabelados || []).map(function (c) { return c.nome; }) }; }) };
      }) } };
    }); });
  }

  function render(p, n) {
    var card = el("article", "ccard");
    var head = el("header", "ccard__head");
    head.appendChild(el("span", "ccard__tag", (p.grau || "") + (p.tribunal ? " · " + p.tribunal : "")));
    head.appendChild(el("h2", null, p.classe || "Processo"));
    head.appendChild(el("p", "ccard__num", mask(p.numeroProcesso || n)));
    card.appendChild(head);

    var grid = el("dl", "ccard__grid");
    function row(k, v) { if (!v) return; var w = el("div"); w.appendChild(el("dt", null, k)); w.appendChild(el("dd", null, v)); grid.appendChild(w); }
    row("Órgão julgador", p.orgaoJulgador);
    row("Assunto", (p.assuntos || []).join(" · "));
    row("Distribuído em", p.dataAjuizamento ? fmt(p.dataAjuizamento) : "");
    row("Base atualizada em", p.atualizadoEm ? fmt(p.atualizadoEm, true) : "");
    card.appendChild(grid);

    var movs = (p.movimentos || []).slice().sort(function (a, b) {
      return (parseDate(b.dataHora) || 0) - (parseDate(a.dataHora) || 0);
    });
    card.appendChild(el("h3", null, "Últimas movimentações"));
    if (!movs.length) {
      card.appendChild(el("p", "cmuted", "Nenhuma movimentação disponível na base pública."));
    } else {
      var ol = el("ol", "timeline"), LIMIT = 10;
      movs.forEach(function (m, i) {
        var li = el("li", i >= LIMIT ? "extra" : "");
        li.appendChild(el("time", null, fmt(m.dataHora, true)));
        li.appendChild(el("strong", null, m.nome || "Movimentação"));
        if (m.complementos && m.complementos.length) li.appendChild(el("span", null, m.complementos.join(" · ")));
        ol.appendChild(li);
      });
      card.appendChild(ol);
      if (movs.length > LIMIT) {
        var more = el("button", "btn btn--outline btn--sm", "Ver todas (" + movs.length + ")");
        more.type = "button";
        more.addEventListener("click", function () { ol.classList.add("all"); more.remove(); });
        card.appendChild(more);
      }
    }
    out.appendChild(card);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    out.innerHTML = ""; setMsg("");
    var n = input.value.replace(/\D/g, "");
    if (n.length !== 20) { setMsg("Informe os 20 dígitos do número do processo.", "err"); return; }
    if (!valid(n)) { setMsg("Número inválido. Confira os dígitos e tente novamente.", "err"); return; }

    S = window.SITE || S;
    if (!S.consultaApi && !S.consultaChave) { unavailable(); return; }

    btn.disabled = true; btn.textContent = "Consultando…";
    setMsg("Buscando informações…");
    buscar(n)
      .then(function (res) {
        if (!res.ok) {
          if (res.j && res.j.erro === "tribunal_nao_suportado") setMsg("Este tribunal não está disponível na consulta.", "err");
          else unavailable(), setMsg("");
          return;
        }
        if (!res.j.encontrado) {
          setMsg("Processo não localizado na base pública. Pode ser recente, estar em segredo de justiça ou ainda não ter sido enviado ao CNJ. Fale com o escritório para confirmar.", "warn");
          return;
        }
        setMsg("");
        res.j.processos.forEach(function (p) { render(p, n); });
      })
      .catch(function () { setMsg(""); unavailable(); })
      .then(function () { btn.disabled = false; btn.textContent = "Consultar"; });
  });
})();
