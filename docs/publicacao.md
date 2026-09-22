# Publicação: pasta `site/`

Pacote publicável da primeira versão estática do site, montado a partir dos mockups aprovados em `mockups/`. É exatamente o conteúdo que sobe para a raiz do servidor (não há build: os arquivos aqui já são o produto final desta versão).

## O que está em `site/`

| Arquivo | O que faz |
|---|---|
| `index.html` | Página inicial, copiada de `mockups/home.html` com a marcação `<meta name="robots" content="noindex, nofollow">` e o link do favicon adicionados. Nenhum outro conteúdo foi alterado. |
| `unidade.html` | Versão final do mockup (`mockups/unidade.html`), com quiz funcional. Copiada depois de o outro agente liberar o arquivo (duas leituras seguidas com o mesmo md5) e com os mesmos ajustes do `index.html`: `<meta name="robots" content="noindex, nofollow">`, link do favicon, e os 4 links que apontavam para `home.html` corrigidos para `./`. Md5 de origem conferido antes de qualquer edição: `d8436940dc66f815fd261727c402c522` (`mockups/unidade.html`). Md5 do arquivo final em `site/unidade.html`, já com os ajustes: `ec0dd229ad3ded3ff451fd6ef84dc832`. |
| `tokens.css` | Cópia idêntica de `mockups/tokens.css` (paleta, tipografia, espaçamento, tema claro/escuro). Conferida por `diff` contra a origem. |
| `favicon.svg` | Ícone novo, gerado para esta entrega: quadrado arredondado azul-petróleo com o símbolo de parágrafo (§) em dourado, nas cores de marca já definidas em `tokens.css`. Não é emoji nem imagem baixada. |
| `404.html` | Página de erro, com a mesma barra lateral e alternância de tema do site, e um botão para voltar ao início (`./`). Referenciada pelo `.htaccess` (`ErrorDocument 404 /404.html`). |
| `.htaccess` | Ver seção abaixo. |

## `.htaccess`: o que cada bloco faz

- **Não indexação:** `Header set X-Robots-Tag "noindex, nofollow"`, dentro de `<IfModule mod_headers.c>`. Cobre também arquivos que não são HTML (CSS, SVG). Complementado pela marcação `<meta name="robots">` no `index.html` e no `404.html`. **De propósito, não há `robots.txt` com `Disallow`**: bloquear o rastreamento impediria o rastreador de ler a marcação de não indexação.
- **Erro 404:** `ErrorDocument 404 /404.html`.
- **Compressão:** `mod_deflate` para HTML, CSS, texto, JS, JSON e SVG, dentro de `<IfModule mod_deflate.c><IfModule mod_filter.c>`.
- **Tipo de conteúdo:** `mod_mime` declara `.css`, `.js`, `.svg` e `.html` explicitamente.
- **Cache:** `mod_expires` e `mod_headers` juntos, 1 ano para CSS/fontes/SVG (`immutable`) e 10 minutos para HTML.

Todos os blocos estão dentro de `<IfModule>`, para o site não cair se o servidor compartilhado não tiver algum módulo habilitado.

## O que precisa ser conferido depois do envio ao servidor

1. `curl -sI https://<domínio>/` responde 200 e o cabeçalho `X-Robots-Tag: noindex, nofollow` aparece.
2. `curl -s https://<domínio>/ | grep -c 'name="robots"'` maior que zero (a marcação está no HTML servido, não só no `.htaccess`).
3. Acessar uma URL inexistente no domínio e confirmar que a página 404 própria aparece (não a padrão do Apache/Hostinger).
4. Abrir `index.html`, `unidade.html` e `404.html` nos dois temas (claro e escuro) e conferir visualmente que o favicon aparece na aba do navegador, e que o quiz e o balão de citação legal funcionam no ar.
5. Conferir que a compressão (`Content-Encoding: gzip` ou `br`) está ativa em pelo menos um arquivo de texto, via `curl -sI -H "Accept-Encoding: gzip"`.
6. Captura de tela real em navegador (Chrome, Firefox, Safari, Edge) é responsabilidade do `qa-engineer` (L-13); nada disso foi validado visualmente nesta entrega.
7. Quando a varredura oficial de nomes proibidos (`scripts/verificar-proibicoes.sh`, prevista para a onda 0 em `docs/arquitetura.md`) existir, rodar contra `site/` antes de qualquer envio real: a verificação feita nesta entrega foi só uma heurística de grep, não a varredura oficial com a lista de termos.

## Verificações feitas nesta entrega, com `unidade.html` real (contagens medidas)

| Verificação | Arquivos varridos | Encontrados | Falharam |
|---|---|---|---|
| Link interno para arquivo inexistente | 3 páginas HTML | 16 referências analisadas | 0 |
| Caminho absoluto de máquina (`/home/`, `/Users/`, `file://`) | 6 | 0 ocorrências | não se aplica |
| Travessão longo/médio (U+2014/U+2013) | 6 | 0 ocorrências | não se aplica |
| Emoji | 6 | 3 ocorrências, todas em `unidade.html` | ver nota abaixo |
| Nome de pessoa/instituição (heurística de grep, sem a lista privada de termos) | 6 | 0 ocorrências | não se aplica |
| `<script>`/`<link>`/`<img>` com origem externa (dependência de rede para carregar) | 3 páginas HTML | 0 ocorrências | não se aplica |
| `fetch`/`XMLHttpRequest`/`import` no JavaScript embutido | 1 (`unidade.html`, único arquivo com script relevante) | 0 ocorrências | não se aplica |
| Caminho de disco local dentro do `<script>` embutido | 1 bloco de script analisado em `unidade.html` | 0 ocorrências | não se aplica |
| `url()` em CSS embutido apontando para rede ou disco local | 4 arquivos (3 HTML + `tokens.css`) | 0 ocorrências | não se aplica |

**Nota sobre os 3 emoji encontrados:** são o caractere `✓` (U+2713, check mark simples, sem seletor de variação de emoji) usado no marcador "lido" da barra lateral, três vezes. É parte do desenho já aprovado do mockup, não foi adicionado nesta entrega, e não foi alterado, conforme pedido.

**Nota sobre link externo:** `unidade.html` tem 8 links de texto (`<a href="https://www.planalto.gov.br/...">`) citando a fonte oficial da lei no balão de dispositivo legal. São links de clique do leitor, não recursos que a página carrega para funcionar; a página abre e funciona inteira sem rede. Nenhuma página depende de arquivo fora de `site/` para renderizar ou rodar o JavaScript.

## Pacote `dist/` (Vite/Vue, onda 1), decisões próprias

A seção acima documenta a primeira versão, estática (`site/`), publicada hoje. Esta seção documenta o pacote gerado por `npm run build`, que a substitui numa etapa futura decidida pelo líder (não confundir os dois: `site/` não é tocado por este build).

**Colisão de rota com pasta do pacote (achado do líder, 22/09/2026, medido no site publicado):** o destino original do índice de busca, `public/busca/indice.json`, virava a pasta `dist/busca/` no pacote. Essa pasta tem o MESMO nome do primeiro segmento da rota `/busca` da SPA. No Apache, quando existe diretório com o nome do caminho pedido, o módulo de diretório redireciona para a barra final (301) e, como a listagem é proibida, a segunda requisição devolve 403. Corrigido: o índice agora fica em `dist/assets/busca-indice.json` (a mesma pasta dos chunks JS/CSS com hash, nome de arquivo único, nunca nome de rota). Portão automático, `scripts/verificar-colisao-rotas.ts`, compara o primeiro segmento de cada rota da aplicação (`src/app/router/rotas.ts`) com os nomes de pasta de primeiro nível de `dist/`, e reprova a construção em qualquer interseção.

**Endereço inexistente devolve 200 com a página "não encontrada" desenhada pela aplicação: decisão consciente, não descuido.** A regra do `.htaccess` manda toda requisição que não bate em arquivo real para `index.html` (history mode do roteador, seção 5 de `docs/arquitetura.md`), e é o Vue Router, já carregado, quem decide que a rota não existe e desenha `NaoEncontrado.vue`. Isso é o comportamento padrão de uma aplicação de página única com roteamento no cliente: o servidor não sabe, no momento da requisição HTTP, se aquele caminho existe ou não dentro do currículo, então não pode devolver um 404 de verdade sem duplicar a lógica de rotas no servidor. O líder aceitou essa troca em 22/09/2026. Consequência registrada: uma ferramenta que só olha o código HTTP (sem rodar JavaScript) não distingue uma unidade real de uma inexistente; só a marcação `noindex` evita que isso vire problema de indexação, e a própria página "não encontrada" é redigida para deixar claro ao leitor que o endereço não existe.
