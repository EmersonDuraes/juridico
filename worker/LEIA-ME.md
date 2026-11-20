# Como ativar a consulta processual (uma vez só, ~10 minutos)

O site mostra a consulta dentro da própria página, usando a API pública do CNJ (DataJud).
Como a chave do CNJ não deve ficar exposta no site, usamos um pequeno "intermediário" gratuito.

1. Crie uma conta gratuita em https://dash.cloudflare.com e abra **Workers & Pages > Create > Worker**.
2. Dê o nome `consulta-emerson`, clique em **Deploy**, depois em **Edit code**.
3. Apague o código de exemplo, cole todo o conteúdo do arquivo `datajud-proxy.js` e clique em **Deploy**.
4. Em **Settings > Variables**, crie duas variáveis:
   - `DATAJUD_KEY`: a chave pública vigente do CNJ, **sem** o prefixo `APIKey ` (veja em https://datajud-wiki.cnj.jus.br/api-publica/acesso). O CNJ pode trocar a chave; se a consulta parar, atualize aqui.
   - `ALLOWED_ORIGIN`: o endereço do site, ex.: `https://www.seusite.com.br`
5. Copie o endereço do Worker (algo como `https://consulta-emerson.SEU-USUARIO.workers.dev`).
6. No arquivo `js/config.js`, preencha `consultaApi` com esse endereço.

Sem o passo 6 (e sem `consultaChave`), a página avisa que a consulta está indisponível e oferece o WhatsApp do escritório. O cliente nunca é enviado para outro site.
