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

Os itens 1, 2, 3 (versão adaptada à SPA, ver a nota no próprio script) e 5
abaixo agora rodam sozinhos, contra o endereço publicado, via
`npm run verificar:publicacao -- https://<domínio>` (`scripts/verificar-
publicacao.sh`). Reprova com erro se qualquer conferência falhar,
incluindo o piso de zero conferência executada. Os itens 4 e 6 continuam
manuais, de propósito (L-13: observação visual é do `qa-engineer`, nunca
de script).

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

**A publicação substitui o conteúdo do diretório remoto.** Medido pelo líder por FTP direto no servidor, 22/09/2026: o destino de publicação fica exatamente igual ao pacote enviado, sem sobra de versão anterior (nem pasta `busca/`, nem `unidade.html`, nem `tokens.css` do site estático antigo). Uma leitura anterior deste documento chegou a afirmar o contrário, a partir de `/unidade.html` e `/tokens.css` responderem 200; a causa real desses 200 é a de baixo (rota inexistente cai na aplicação, que devolve 200 com a página de não encontrado), não arquivo velho sobrando — a correção foi revertida.

**Colisão de rota com pasta do pacote (achado do líder, 22/09/2026, medido no site publicado):** o destino original do índice de busca, `public/busca/indice.json`, virava a pasta `dist/busca/` no pacote. Enquanto essa pasta existiu no servidor (de um envio anterior a esta correção), ela tinha o MESMO nome do primeiro segmento da rota `/busca` da SPA, e o módulo de diretório do Apache redireciona para a barra final (301) sempre que o caminho pedido bate um diretório físico — com listagem proibida, a requisição seguinte podia devolver 403. Corrigido: o índice agora fica em `dist/assets/busca-indice.json` (a mesma pasta dos chunks JS/CSS com hash, nome de arquivo único, nunca nome de rota), e a publicação seguinte já removeu a pasta antiga do servidor (ver aviso acima). Portão automático, `scripts/verificar-colisao-rotas.ts`, compara o primeiro segmento de cada rota da aplicação (`src/app/router/rotas.ts`) com os nomes de pasta de primeiro nível de `dist/`, e reprova a construção em qualquer interseção, para nenhum build futuro reabrir esse risco.

**Reforço, mesmo sem sobra confirmada:** `.htaccess` também troca a condição genérica de diretório (`RewriteCond %{REQUEST_FILENAME} -d`, "qualquer pasta que exista no servidor") por uma lista explícita das pastas que o pacote realmente tem (`assets`, `icones` e `api`), e desliga `DirectorySlash` (mod_dir), que é quem gera o redirecionamento de barra final por causa de diretório. As duas coisas juntas: nenhum caminho de rota pode ser redirecionado por colidir com nome de pasta, mesmo que uma pasta homônima volte a existir por engano num envio futuro. `scripts/verificar-htaccess-pastas.ts` confere, a cada build, que a lista bate com as pastas reais de `dist/`.

**Endereço inexistente devolve 200 com a página "não encontrada" desenhada pela aplicação: decisão consciente, não descuido.** A regra do `.htaccess` manda toda requisição que não bate em arquivo real para `index.html` (history mode do roteador, seção 5 de `docs/arquitetura.md`), e é o Vue Router, já carregado, quem decide que a rota não existe e desenha `NaoEncontrado.vue`. Isso é o comportamento padrão de uma aplicação de página única com roteamento no cliente: o servidor não sabe, no momento da requisição HTTP, se aquele caminho existe ou não dentro do currículo, então não pode devolver um 404 de verdade sem duplicar a lógica de rotas no servidor. O líder aceitou essa troca em 22/09/2026. Consequência registrada: uma ferramenta que só olha o código HTTP (sem rodar JavaScript) não distingue uma unidade real de uma inexistente, e é exatamente essa consequência que gerou a primeira leitura errada deste documento (200 interpretado como arquivo antigo sobrando, quando era a página de não encontrado); só a marcação `noindex` evita que isso vire problema de indexação, e a própria página "não encontrada" é redigida para deixar claro ao leitor que o endereço não existe.

## Área restrita (servidor)

Só a página da cadeira restrita usa servidor: PHP 8.3 do Hostinger, mais um diretório privado fora do webroot. O que o repositório público guarda é só o código (`public/api/`, que entra no `dist/` e no zip); nenhum login, senha, hash nem conteúdo restrito.

**Peças e onde ficam**

- Código PHP: `public/api/*.php` e `public/api/nucleo/` (biblioteca, negada ao acesso direto). Segue no zip como o resto do `dist/`; o zip continua igual (arquivos na raiz, destino substituído inteiro a cada publicação).
- Diretório privado: `~/domains/drpetrus.top/direito2026_privado/`, irmão de `public_html`, modo 700. Guarda `usuarios.json`, `tentativas.json`, `segredo.key`, `sessoes/`, `conteudo/` e `erros.log`. Não é tocado pela publicação do zip.
- Conteúdo restrito: `conteudo/interdisciplinar.json`, gerado fora do repositório e enviado só por `scp`.

**Passos (primeira vez; nas seguintes, só o zip e, se o conteúdo mudou, o JSON)**

1. Publicar o zip normalmente. A publicação traz `api/` junto.
2. Criar a estrutura privada e o primeiro admin pelo CLI, que não vai no pacote. Envie o arquivo para uma pasta temporária, rode com o terminal interativo (a senha provisória é digitada, sem eco) e apague a pasta:
   `scp servidor/cli/criar-admin.php hostinger:~/d26_cli_tmp/` (crie a pasta antes com `ssh hostinger 'mkdir -p ~/d26_cli_tmp'`);
   `ssh -t hostinger 'D26_NUCLEO=$HOME/domains/drpetrus.top/public_html/direito2026/api/nucleo php ~/d26_cli_tmp/criar-admin.php $HOME/domains/drpetrus.top/direito2026_privado <login>'`;
   `ssh hostinger 'rm -rf ~/d26_cli_tmp'`.
   O CLI cria as pastas (700) e os arquivos (600, inclusive `segredo.key`, o segredo do token anti-CSRF de quem ainda não entrou; se faltar, o PHP o cria sozinho na primeira necessidade; não o apague nem o troque com gente logada), grava o admin com troca de senha obrigatória no primeiro acesso e recusa se `usuarios.json` já existir (use `--substituir` só de propósito: ele troca todos os usuários).
3. Enviar o JSON restrito (a porta já vem do alias `hostinger`):
   `scp interdisciplinar.json hostinger:~/domains/drpetrus.top/direito2026_privado/conteudo/` e `ssh hostinger 'chmod 600 ~/domains/drpetrus.top/direito2026_privado/conteudo/interdisciplinar.json'`.
4. Conferir por `curl` (o servidor é a única prova de que o `.htaccess` e o PHP se comportam; teste local não vale por ele):
   - `curl -s https://direito2026.drpetrus.top/api/saude.php` devolve exatamente `{"ok":true}`, e não o código-fonte (se aparecer `<?php`, o PHP não está executando neste caminho: parar).
   - `curl -s -o /dev/null -w '%{http_code}' https://direito2026.drpetrus.top/api/conteudo.php` devolve 401 sem sessão.
   - `curl -s -o /dev/null -w '%{http_code}' https://direito2026.drpetrus.top/api/nucleo/contas.php` devolve 403 ou 404, nunca 200.
   - `curl -s -o /dev/null -w '%{http_code}' https://direito2026.drpetrus.top/api/nao-existe.php` devolve 404 e não a página da SPA.
   - `curl -sI https://direito2026.drpetrus.top/api/saude.php` mostra `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`.

**Testes antes de publicar:** `php servidor/testes/rodar.php` (suíte PHP, sem phpunit; sobe `php -S` local contra `servidor/dev/roteador.php`). No servidor, `php -S` sobe mas não aceita conexão em 127.0.0.1, então lá só roda a parte sem servidor: `php servidor/testes/rodar.php --sem-servidor` (copiando `public/api` e `servidor` para uma pasta temporária fora de `public_html`, e apagando-a depois).
