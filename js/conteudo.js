/* ==========================================================
   CONTEÚDO — todos os textos do site ficam aqui.
   Edite à vontade; não precisa mexer no HTML.
   ========================================================== */
window.CONTEUDO = {

  escritorio: {
    nome: "Martins & Pamplona",
    sufixo: "Advocacia",
    whatsapp: "5511999999999",           // só números, com DDI+DDD
    telefone: "(11) 99999-9999",
    email: "contato@martinsepamplona.com.br",
    endereco: "Rua Exemplo, 000 — Sala 00, São Paulo/SP",
    horario: "Segunda a sexta, das 9h às 18h",
    instagram: "#",
    linkedin: "#"
  },

  menu: [
    { texto: "Início",  link: "index.html#inicio" },
    { texto: "Áreas de atuação", link: "index.html#areas" },
    { texto: "O escritório", link: "index.html#escritorio" },
    { texto: "Equipe", link: "index.html#equipe" },
    { texto: "Contato", link: "index.html#contato" }
  ],
  botaoTopo: "Fale conosco",

  /* Slides do hero: título gigante + texto lateral. Cada slide usa
     a imagem de mesma posição em imagens.js > hero */
  hero: [
    {
      titulo: "BEM-VINDO AO ESCRITÓRIO",
      subtitulo: "Conheça a Martins & Pamplona",
      texto: "Atendimento próximo, estratégia clara e atuação técnica para proteger seus direitos."
    },
    {
      titulo: "ENCONTRE SUA SOLUÇÃO",
      subtitulo: "Áreas de atuação",
      texto: "Cível, família, consumidor, trabalhista, previdenciário, penal e muito mais."
    },
    {
      titulo: "CONHEÇA NOSSA EQUIPE",
      subtitulo: "Sócios e advogados",
      texto: "Profissionais dedicados a cada caso, com transparência em todas as etapas."
    }
  ],
  autoplaySegundos: 6,

  /* Barra de agendamento flutuante */
  busca: {
    campos: {
      area:  { rotulo: "Área do direito", dica: "Escolha a área" },
      modo:  { rotulo: "Atendimento",     dica: "Presencial ou online" },
      data:  { rotulo: "Data",            dica: "Dia preferido" },
      turno: { rotulo: "Período",         dica: "Manhã ou tarde" }
    },
    modos: ["Presencial", "Online (vídeo)", "WhatsApp"],
    turnos: ["Manhã", "Tarde"],
    mensagem: "Olá! Gostaria de agendar uma consulta."
  },

  /* Lista de áreas */
  tituloAreas: "Áreas de atuação em destaque",
  verTodas: "Ver todas",
  areas: [
    { id: "civil", nome: "Direito Civil", local: "Contratos, responsabilidade civil", tag: "Consultivo e contencioso", detalhes: "Contratos, indenizações, cobranças e relações patrimoniais.",
      descricao: "Atuação em contratos, responsabilidade civil, cobranças e demais conflitos patrimoniais, com análise detalhada de cada documento e estratégia para solução rápida, seja por acordo ou por ação judicial.", preco: "1ª conversa gratuita" },
    { id: "familia", nome: "Família e Sucessões", local: "Divórcio, guarda, inventário", tag: "Atendimento humanizado", detalhes: "Divórcio, guarda, pensão, inventário e planejamento sucessório.",
      descricao: "Condução sensível e técnica de divórcios, uniões estáveis, guarda, alimentos, inventários e arrolamentos, sempre buscando o melhor caminho para a família.", preco: "1ª conversa gratuita" },
    { id: "consumidor", nome: "Direito do Consumidor", local: "Bancos, fraudes, serviços", tag: "Juizados Especiais", detalhes: "Fraudes bancárias, cobranças indevidas e falhas na prestação de serviço.",
      descricao: "Defesa do consumidor em casos de fraudes, cobranças indevidas, negativação irregular e vícios em produtos ou serviços, nos Juizados e na Justiça comum.", preco: "1ª conversa gratuita" },
    { id: "trabalhista", nome: "Direito Trabalhista", local: "Empregados e empresas", tag: "Empregado e empregador", detalhes: "Reclamações, defesas, acordos e consultoria preventiva.",
      descricao: "Atuação para trabalhadores e empresas em reclamações trabalhistas, verbas rescisórias, acordos e orientação preventiva para reduzir riscos.", preco: "1ª conversa gratuita" },
    { id: "previdenciario", nome: "Previdenciário", local: "INSS e benefícios", tag: "Aposentadorias e benefícios", detalhes: "Aposentadorias, auxílios, pensões e revisões.",
      descricao: "Planejamento e requerimento de aposentadorias, auxílios, pensões por morte e BPC, além de recursos administrativos e ações judiciais contra o INSS.", preco: "1ª conversa gratuita" },
    { id: "penal", nome: "Direito Penal", local: "Defesa criminal", tag: "Plantão e acompanhamento", detalhes: "Defesa em inquéritos, ações penais e execução penal.",
      descricao: "Defesa técnica em todas as fases: inquérito, ação penal, júri, acordos de não persecução penal e execução, com sigilo e dedicação integral.", preco: "1ª conversa gratuita" },
    { id: "imobiliario", nome: "Imobiliário e Locação", local: "Compra, venda, despejo", tag: "Segurança na negociação", detalhes: "Contratos, usucapião, adjudicação, locação e despejo.",
      descricao: "Assessoria em compra e venda, locação, despejo, usucapião e adjudicação compulsória, com análise documental completa para uma negociação segura.", preco: "1ª conversa gratuita" },
    { id: "empresarial", nome: "Empresarial e Marcas", local: "Empresas e INPI", tag: "Para o seu negócio", detalhes: "Contratos empresariais, registro de marcas e consultoria.",
      descricao: "Apoio jurídico a empresas: contratos, registro de marcas no INPI, societário e consultoria preventiva para que o negócio cresça com segurança.", preco: "1ª conversa gratuita" }
  ],

  /* Página de detalhe da área (area.html) */
  detalhe: {
    migalhas: "Áreas de atuação",
    por: "Equipe Martins & Pamplona",
    sobre: "Sobre esta área",
    tituloAgenda: "Agendar consulta",
    rotuloData: "Data desejada",
    rotuloModo: "Atendimento",
    botaoAgenda: "Agendar agora",
    destaque: "Resposta em até 24h",
    destaqueSub: "no horário comercial",
    botaoSecundario: "Falar no WhatsApp",
    tituloDiferenciais: "Nossos diferenciais",
    diferenciais: [
      { icone: "💬", texto: "Atendimento direto" },
      { icone: "📄", texto: "Análise documental" },
      { icone: "🔒", texto: "Sigilo absoluto" },
      { icone: "⚖️", texto: "Atuação estratégica" },
      { icone: "🕒", texto: "Acompanhamento de prazos" },
      { icone: "📱", texto: "Atualizações por WhatsApp" }
    ],
    tituloSimilares: "Outras áreas de atuação"
  },

  /* Seção O escritório */
  escritorioSecao: {
    titulo: "O escritório",
    texto: [
      "A Martins & Pamplona Advocacia nasceu do compromisso de oferecer atendimento jurídico próximo, claro e eficiente.",
      "Cada caso é tratado de forma individual: ouvimos, analisamos e traçamos a estratégia mais adequada para o seu objetivo."
    ],
    numeros: [
      { valor: "8", rotulo: "áreas de atuação" },
      { valor: "3", rotulo: "sócios" },
      { valor: "100%", rotulo: "atendimento personalizado" }
    ]
  },

  /* Seção Equipe — a ordem acompanha imagens.js > equipe */
  tituloEquipe: "Nossa equipe",
  equipe: [
    { nome: "Lucia Martins", cargo: "Sócia-fundadora", oab: "OAB/SP 000.000", bio: "Atuação nas áreas cível, família, consumidor e criminal." },
    { nome: "Meire Pamplona", cargo: "Sócia", oab: "OAB/SP 000.000", bio: "Texto de apresentação da sócia. Edite em js/conteudo.js." },
    { nome: "José", cargo: "Sócio", oab: "OAB/SP 000.000", bio: "Texto de apresentação do sócio. Edite em js/conteudo.js." }
  ],

  /* Contato */
  tituloContato: "Vamos conversar sobre o seu caso?",
  textoContato: "Envie sua mensagem e retornamos o mais breve possível.",
  formulario: { nome: "Seu nome", telefone: "Telefone / WhatsApp", mensagem: "Conte brevemente seu caso", botao: "Enviar pelo WhatsApp" },

  rodape: "Todos os direitos reservados.",
  aviso: "Este site tem caráter meramente informativo, nos termos do Provimento 205/2021 da OAB."
};
