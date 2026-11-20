/* ============================================================
   Proxy da consulta processual (Cloudflare Workers — plano gratuito)
   Esconde a chave do DataJud/CNJ e libera a consulta só para o seu site.

   Variáveis (Settings > Variables do Worker):
     DATAJUD_KEY     -> a chave pública vigente, SEM o prefixo "APIKey "
                        (veja em https://datajud-wiki.cnj.jus.br/api-publica/acesso)
     ALLOWED_ORIGIN  -> endereço do seu site, ex.: https://www.seusite.com.br
   ============================================================ */

const ESTADUAIS = ["", "tjac","tjal","tjap","tjam","tjba","tjce","tjdft","tjes","tjgo","tjma","tjmt","tjms","tjmg","tjpa","tjpb","tjpr","tjpe","tjpi","tjrj","tjrn","tjrs","tjro","tjrr","tjsc","tjse","tjsp","tjto"];

function alias(n) {              // n = 20 dígitos do número CNJ
  const j = n.slice(13, 14), tr = parseInt(n.slice(14, 16), 10);
  if (j === "8" && ESTADUAIS[tr]) return ESTADUAIS[tr];
  if (j === "4" && tr >= 1 && tr <= 6) return "trf" + tr;
  if (j === "5" && tr >= 1 && tr <= 24) return "trt" + tr;
  if (j === "3") return "stj";
  return null;
}

function mod97ok(n) {            // valida o dígito verificador CNJ
  const dd = n.slice(7, 9);
  const base = n.slice(0, 7) + n.slice(9) + "00";
  let r = 0;
  for (const ch of base) r = (r * 10 + Number(ch)) % 97;
  return String(98 - r).padStart(2, "0") === dd;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": allowed === "*" ? "*" : (origin === allowed ? origin : allowed),
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (allowed !== "*" && origin && origin !== allowed) return json({ erro: "origem_nao_permitida" }, 403);

    const numero = (new URL(request.url).searchParams.get("numero") || "").replace(/\D/g, "");
    if (numero.length !== 20 || !mod97ok(numero)) return json({ erro: "numero_invalido" }, 400);
    const tribunal = alias(numero);
    if (!tribunal) return json({ erro: "tribunal_nao_suportado" }, 400);

    try {
      const r = await fetch(`https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "APIKey " + env.DATAJUD_KEY },
        body: JSON.stringify({ size: 5, query: { match: { numeroProcesso: numero } } }),
        cf: { cacheTtl: 300, cacheEverything: true }
      });
      if (!r.ok) return json({ erro: "falha_datajud", status: r.status }, 502);
      const data = await r.json();
      const hits = (data.hits && data.hits.hits) || [];
      // devolve só o necessário (sem nomes de partes)
      const processos = hits.map(h => {
        const s = h._source || {};
        return {
          numeroProcesso: s.numeroProcesso,
          classe: s.classe && s.classe.nome,
          assuntos: (s.assuntos || []).map(a => a.nome),
          orgaoJulgador: s.orgaoJulgador && s.orgaoJulgador.nome,
          tribunal: s.tribunal,
          grau: s.grau,
          dataAjuizamento: s.dataAjuizamento,
          atualizadoEm: s.dataHoraUltimaAtualizacao,
          movimentos: (s.movimentos || []).map(m => ({
            nome: m.nome,
            dataHora: m.dataHora,
            complementos: (m.complementosTabelados || []).map(c => c.nome)
          }))
        };
      });
      return json({ encontrado: processos.length > 0, processos });
    } catch (e) {
      return json({ erro: "erro_interno" }, 500);
    }
  }
};
