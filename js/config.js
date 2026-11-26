/* ============================================================
   CONFIGURAÇÕES DO SITE — edite aqui os dados do escritório
   ============================================================ */
window.SITE = {
  // WhatsApp: só números, com código do país + DDD. Ex.: 5511999998888
  whatsapp: "5500000000000",
  // Texto exibido para o telefone
  telefoneExibicao: "(11) 00000-0000",
  // E-mail de contato
  email: "contato@mpadvocacia.com.br",
  // Endereço mostrado no rodapé
  // Mapa: endereço usado na busca do Google Maps (pode ser o mesmo do endereço acima)
  mapaBusca: "Rua Do Bosque, 1621, São Paulo",
  endereco: "Rua Do Bosque, 1621 — São Paulo/SP",
  // Mensagem padrão que abre no WhatsApp
  mensagemPadrao: "Olá! Gostaria de uma orientação jurídica.",
  // Endereço do Worker da consulta processual (veja worker/LEIA-ME.md). Vazio = usa consultaChave; sem os dois, a página avisa que está indisponível
  consultaApi: "",
  // Alternativa mais simples (sem Worker): chave pública vigente do DataJud, sem o prefixo "APIKey ".
  // Depende de o CNJ permitir chamadas diretas do navegador; o Worker é o caminho garantido.
  consultaChave: "",

  // Envio de documentos (scanner.html). O PDF é enviado por e-mail pelo serviço gratuito FormSubmit.
  // email: deixe "" para usar o e-mail principal acima. No PRIMEIRO envio, o FormSubmit manda um e-mail de ativação
  // para esse endereço: abra-o e clique em "Activate". Depois disso, os envios chegam normalmente.
  scanner: { email: "", endpoint: "" },

  // Chamada por vídeo (chamada.html). Servidores STUN gratuitos já funcionam na maioria das redes.
  // Para redes restritivas, acrescente um servidor TURN: { urls:"turn:SEU-SERVIDOR:3478", username:"...", credential:"..." }
  chamada: { ice: [ { urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" } ] },
  // EQUIPE JURÍDICA — edite aqui os 4 advogados (nome, especialidade, frase, cargo e OAB)
  equipe: [
    { nome: "Dra. Lucia Martins",    especialidade: "CIVIL - EMPRESARIAL",      frase: "A arte da defesa", cargo: "Sócia Fundadora", oab: "OAB/UF 000.000" },
    { nome: "Dra. Meire Pamplona",  especialidade: "PREVIDENCIÁRIO", frase: "Rigor e estratégia", cargo: "Sócia Fundadora", oab: "OAB/UF 000.000" },
    { nome: "Dr. José Antônio",  especialidade: "CRIMINAL", frase: "Firmeza em plenário", cargo: "Associado", oab: "OAB/UF 000.000" },
    { nome: "Dr. Emerson Durães",  especialidade: "TRABALHISTA", frase: "Cuidado em cada fase", cargo: "Associado", oab: "OAB/UF 000.000" }
  ],
  // Redes sociais (deixe "" para ocultar o ícone)
  redes: {
    instagram: "",
    linkedin: "",
    facebook: "",
    youtube: ""
  }
};
