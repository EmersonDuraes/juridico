/* ==========================================================
   CONTEÚDO DO SITE — edite aqui textos, áreas e imagens.
   Para trocar uma imagem: substitua o arquivo na pasta images/
   mantendo o mesmo nome, ou altere o caminho abaixo.
   ========================================================== */
window.SITE_DATA = {

  // WhatsApp do escritório: só números, com 55 + DDD (ex.: 5511999999999)
  whatsapp: "5511999999999",
  whatsappMessage: "Olá! Gostaria de agendar uma consulta.",

  // Cada item abaixo é um slide do hero + uma página de serviços.
  // Pode adicionar, remover ou reordenar (o contador I—VI se ajusta sozinho).
  areas: [
    {
      label: "Família",                       // rótulo vertical na lateral
      over: "Direito de",                     // linha pequena acima do título
      title: "Família",                       // título grande
      subtitle: "Divórcio, guarda e alimentos",
      desc: "Orientação cuidadosa e firme nos momentos mais sensíveis da vida familiar, buscando sempre a solução mais equilibrada.",
      image: "images/hero/01-familia.jpg",
      panelTitle: "Soluções em Direito de Família",
      panelSub: "Cuidado e firmeza quando mais importa",
      cards: [
        { name: "Divórcio e União Estável", image: "images/cards/01-familia-1.jpg", text: "Dissolução consensual ou litigiosa e partilha de bens." },
        { name: "Guarda e Convivência",     image: "images/cards/01-familia-2.jpg", text: "Guarda, regime de visitas e alienação parental." },
        { name: "Pensão Alimentícia",       image: "images/cards/01-familia-3.jpg", text: "Fixação, revisão, execução e exoneração de alimentos." }
      ]
    },
    {
      label: "Previdenciário",
      over: "Direito",
      title: "Previdenciário",
      subtitle: "Aposentadorias e benefícios do INSS",
      desc: "Análise do seu histórico contributivo, requerimentos administrativos e ações judiciais para garantir o benefício devido.",
      image: "images/hero/02-previdenciario.jpg",
      panelTitle: "Soluções em Direito Previdenciário",
      panelSub: "Seu tempo de contribuição, bem aproveitado",
      cards: [
        { name: "Aposentadorias",           image: "images/cards/02-previdenciario-1.jpg", text: "Planejamento e concessão por idade, tempo e regras de transição." },
        { name: "Auxílios e BPC/LOAS",      image: "images/cards/02-previdenciario-2.jpg", text: "Auxílio por incapacidade, salário-maternidade e benefício assistencial." },
        { name: "Revisões e Pensão",        image: "images/cards/02-previdenciario-3.jpg", text: "Revisão de benefícios e pensão por morte." }
      ]
    },
    {
      label: "Consumidor",
      over: "Direito do",
      title: "Consumidor",
      subtitle: "Fraudes, golpes e cobranças indevidas",
      desc: "Defesa de quem foi lesado por bancos, operadoras, planos e empresas, com busca de reparação e restituição.",
      image: "images/hero/03-consumidor.jpg",
      panelTitle: "Soluções em Direito do Consumidor",
      panelSub: "Seus direitos nas relações de consumo",
      cards: [
        { name: "Fraudes Bancárias e Pix",  image: "images/cards/03-consumidor-1.jpg", text: "Golpes, empréstimos não contratados e transações indevidas." },
        { name: "Negativação Indevida",     image: "images/cards/03-consumidor-2.jpg", text: "Retirada do nome dos cadastros e indenização." },
        { name: "Planos de Saúde e Seguros",image: "images/cards/03-consumidor-3.jpg", text: "Negativas de cobertura e reajustes abusivos." }
      ]
    },
    {
      label: "Trabalhista",
      over: "Direito",
      title: "Trabalhista",
      subtitle: "Empregados e empregadores",
      desc: "Atuação preventiva e contenciosa, com foco em segurança jurídica para ambos os lados da relação de trabalho.",
      image: "images/hero/04-trabalhista.jpg",
      panelTitle: "Soluções em Direito do Trabalho",
      panelSub: "Segurança jurídica na relação de trabalho",
      cards: [
        { name: "Verbas Rescisórias",       image: "images/cards/04-trabalhista-1.jpg", text: "Cálculo, cobrança e defesa em rescisões." },
        { name: "Reconhecimento de Vínculo",image: "images/cards/04-trabalhista-2.jpg", text: "Registro em carteira e direitos decorrentes." },
        { name: "Horas Extras e Acidentes", image: "images/cards/04-trabalhista-3.jpg", text: "Jornada, adicionais e acidente de trabalho." }
      ]
    },
    {
      label: "Imobiliário",
      over: "Direito",
      title: "Imobiliário",
      subtitle: "Locação, propriedade e contratos",
      desc: "Assessoria a proprietários, inquilinos e compradores, da elaboração do contrato à solução do conflito.",
      image: "images/hero/05-imobiliario.jpg",
      panelTitle: "Soluções em Direito Imobiliário",
      panelSub: "Patrimônio protegido do contrato à matrícula",
      cards: [
        { name: "Locação e Despejo",        image: "images/cards/05-imobiliario-1.jpg", text: "Contratos de locação, cobrança de aluguéis e ações de despejo." },
        { name: "Adjudicação e Usucapião",  image: "images/cards/05-imobiliario-2.jpg", text: "Regularização do imóvel e escritura." },
        { name: "Contratos e Distratos",    image: "images/cards/05-imobiliario-3.jpg", text: "Compra e venda, promessa e rescisão." }
      ]
    },
    {
      label: "Sucessões",
      over: "Direito de",
      title: "Sucessões",
      subtitle: "Inventário, herança e planejamento",
      desc: "Condução de inventários e planejamento sucessório com discrição, rapidez e respeito ao momento da família.",
      image: "images/hero/06-sucessoes.jpg",
      panelTitle: "Soluções em Direito das Sucessões",
      panelSub: "Transmissão do patrimônio com tranquilidade",
      cards: [
        { name: "Inventário e Arrolamento", image: "images/cards/06-sucessoes-1.jpg", text: "Judicial ou extrajudicial, com partilha entre herdeiros." },
        { name: "Testamentos e Planejamento",image: "images/cards/06-sucessoes-2.jpg", text: "Organização antecipada do patrimônio." },
        { name: "Alvarás Judiciais",        image: "images/cards/06-sucessoes-3.jpg", text: "Levantamento de valores deixados pelo falecido." }
      ]
    }
  ]
};
