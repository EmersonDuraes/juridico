/* ============================================================
   CONFIGURAÇÕES DO SITE — edite aqui os dados do escritório
   ============================================================ */
window.SITE = {
  // WhatsApp: só números, com código do país + DDD. Ex.: 5511999998888
  whatsapp: "5511950817476",
  // Texto exibido para o telefone
  telefoneExibicao: "(11) 95081-7476",
  // E-mail de contato
  email: "contato@emersonduraes.com.br",
  // Endereço mostrado no rodapé
  endereco: "Endereço do escritório — São Paulo/SP",
  // Mensagem padrão que abre no WhatsApp
  mensagemPadrao: "Olá, Dr. Emerson. Gostaria de uma orientação sobre um caso criminal.",
  // Endereço do Worker da consulta processual (veja worker/LEIA-ME.md). Vazio = usa consultaChave; sem os dois, a página avisa que está indisponível
  consultaApi: "",
  // Alternativa mais simples (sem Worker): chave pública vigente do DataJud, sem o prefixo "APIKey ".
  // Depende de o CNJ permitir chamadas diretas do navegador; o Worker é o caminho garantido.
  consultaChave: "",
  // Redes sociais (deixe "" para ocultar o ícone)
  redes: {
    instagram: "",
    linkedin: "",
    facebook: "",
    youtube: ""
  }
};
