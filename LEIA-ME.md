# Martins & Pamplona Advocacia — Site

Abra `index.html` no navegador para ver o site (não precisa de instalação).

## Estrutura de pastas

```
index.html        → página inicial (hero, áreas, escritório, equipe, contato)
area.html         → página de detalhe de cada área (area.html?area=familia)
css/
  variaveis.css   → CORES, FONTES e medidas (mude a identidade aqui)
  base.css        → regras gerais e animação de rolagem
  cabecalho.css   → menu do topo
  hero.css        → tela cheia: título gigante, miniaturas
  busca.css       → barra branca de agendamento
  cards.css       → cards das áreas
  secoes.css      → escritório, equipe, contato, rodapé, botão WhatsApp
  detalhe.css     → página area.html
js/
  conteudo.js     → TODOS OS TEXTOS (nome, menu, áreas, sócios, contato, WhatsApp)
  imagens.js      → TODAS AS FOTOS (caminhos de cada imagem)
  comum.js        → cabeçalho, rodapé, cards (funções compartilhadas)
  hero.js         → lógica dos slides
  pagina-inicial.js / area.js → montam cada página
assets/
  img/logo.png    → substitua pelo logo do escritório (mesmo nome)
  img/hero/       → fundos do topo (recomendado 1920x1080)
  img/areas/      → fotos dos cards (recomendado 600x800, vertical)
  img/equipe/     → fotos dos sócios (recomendado 400x500)
```

## Como alterar

- **Textos / WhatsApp / telefone / sócios / OAB:** `js/conteudo.js`
- **Fotos:** coloque o arquivo em `assets/img/...` e troque o nome em `js/imagens.js`
- **Cores e fontes:** `css/variaveis.css`
- **Nova área de atuação:** copie um bloco em `conteudo.js > areas` (e adicione uma foto em `imagens.js > areas`)
- **Tempo de troca do topo:** `autoplaySegundos` em `conteudo.js`

As imagens atuais são ilustrações de exemplo: substitua pelas fotos reais do escritório.
Os números de OAB e o WhatsApp estão como exemplo — preencha com os dados reais.
