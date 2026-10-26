# Site jurídico com parallax

Abra o `index.html` no navegador (duplo clique). Para as fontes aparecerem é preciso estar conectado à internet (Google Fonts).

## Estrutura

```
site-juridico-parallax/
├── index.html          estrutura: cabeçalho, menu, "sobre", contato, rodapé
├── css/
│   ├── variables.css   CORES, FONTES e medidas (comece por aqui)
│   ├── base.css        reset e tela de carregamento
│   ├── header.css      cabeçalho, aba social, rótulo vertical, menu
│   ├── hero.css        slides, títulos, contador, botão "clique e segure"
│   ├── panel.css       página branca: cards, sobre, contato, rodapé
│   └── responsive.css  celular e tablet
├── js/
│   ├── data.js         TEXTOS, ÁREAS, CARDS, WHATSAPP (edite aqui o conteúdo)
│   ├── slider.js       animação de troca + parallax
│   ├── hold.js         botão "clique e segure"
│   ├── panel.js        página branca + parallax de rolagem
│   └── main.js         menu, links do WhatsApp, formulário
└── images/
    ├── hero/           1 imagem por área (1920×1080 ou maior, horizontal)
    ├── cards/          3 imagens por área (800×800, quadradas)
    └── bg/contato.jpg  fundo da faixa de contato (1920×1000)
```

## Como trocar as imagens

As imagens atuais são provisórias. Salve as suas na mesma pasta **com o mesmo nome** (ex.: `images/hero/01-familia.jpg`) ou altere o caminho em `js/data.js`.
Prefira fotos escuras ou com bom contraste para o texto branco ficar legível.

## O que editar

| Quero mudar…                         | Onde                                    |
|--------------------------------------|-----------------------------------------|
| Nome do escritório                   | `index.html` (busque "MARTINS E PAMPLONA")   |
| Número do WhatsApp                   | `js/data.js` → `whatsapp`               |
| Áreas, títulos, textos e cards       | `js/data.js`                            |
| Texto "Sobre", endereço, e-mail, OAB | `index.html`                            |
| Links do Instagram e LinkedIn        | `index.html`, bloco `<aside class="social">` |
| Cores e fontes                       | `css/variables.css`                     |
| Tempo de "segurar" o botão           | `js/hold.js` → `DURATION`               |

Adicionar uma área nova: copie um bloco de `areas` em `data.js`. O contador (I — VI), o menu e o formulário se ajustam sozinhos.

## Como funciona

- **Setas, rolagem do mouse, toque ou os botões ‹ ›** trocam de área: a imagem encolhe, desliza e se expande.
- **Segurar o botão "Clique e segure"** (ou Enter) abre a página branca com os serviços da área.
- **Parallax:** a imagem e o texto se movem em velocidades diferentes, reagem ao mouse, e as imagens dos cards se deslocam ao rolar a página.
- Os botões dos cards e o formulário abrem o WhatsApp com a mensagem pronta (não há servidor nem coleta de dados).

## Lembrete ético

A publicidade na advocacia é regulada pelo Provimento 205/2021 do Conselho Federal da OAB: conteúdo informativo, sem mercantilização, sem promessa de resultado. Revise os textos antes de publicar.
