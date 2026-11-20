/* ============================================================
   CONFIGURAÇÕES DO SITE — edite aqui os dados do escritório
   ============================================================ */
window.SITE = {
  // WhatsApp: só números, com código do país + DDD. Ex.: 5511999998888
  whatsapp: "5500000000000",
  // Texto exibido para o telefone
  telefoneExibicao: "(00) 00000-0000",
  // E-mail de contato
  email: "contato@seudominio.com.br",
  // Endereço mostrado no rodapé
  endereco: "Endereço do escritório — Cidade/UF",
  // Mensagem padrão que abre no WhatsApp
  mensagemPadrao: "Olá, Dr. Emerson. Gostaria de uma orientação sobre um caso criminal.",
  // Endereço do Worker da consulta processual (veja worker/LEIA-ME.md). Vazio = usa consultaChave; sem os dois, a página avisa que está indisponível
  consultaApi: "",
  // Alternativa mais simples (sem Worker): chave pública vigente do DataJud, sem o prefixo "APIKey ".
  // Depende de o CNJ permitir chamadas diretas do navegador; o Worker é o caminho garantido.
  consultaChave: "",

  // Chamada por vídeo (chamada.html). Servidores STUN gratuitos já funcionam na maioria das redes.
  // Para redes restritivas, acrescente um servidor TURN: { urls:"turn:SEU-SERVIDOR:3478", username:"...", credential:"..." }
  chamada: { ice: [ { urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" } ] },
  // EQUIPE JURÍDICA — edite aqui os 4 advogados (nome, especialidade, frase, cargo e OAB)
  equipe: [
    { nome: "Emerson Durães",    especialidade: "Advocacia Criminal",      frase: "A arte da defesa",      cargo: "Sócio fundador", oab: "OAB/UF 000.000" },
    { nome: "Nome do Advogado",  especialidade: "Direito Penal Econômico", frase: "Rigor e estratégia",    cargo: "Sócio",          oab: "OAB/UF 000.000" },
    { nome: "Nome da Advogada",  especialidade: "Tribunal do Júri",        frase: "Firmeza em plenário",   cargo: "Advogada",       oab: "OAB/UF 000.000" },
    { nome: "Nome do Advogado",  especialidade: "Execução Penal",          frase: "Cuidado em cada fase",  cargo: "Advogado",       oab: "OAB/UF 000.000" }
  ],
  // Redes sociais (deixe "" para ocultar o ícone)
  redes: {
    instagram: "",
    linkedin: "",
    facebook: "",
    youtube: ""
  }
};
