# Publicação: pasta `site/`

Pacote publicável da primeira versão estática do site, montado a partir dos mockups aprovados em `mockups/`. É exatamente o conteúdo que sobe para a raiz do servidor (não há build: os arquivos aqui já são o produto final desta versão).

## Publicar uma versão

Use o comando único `npm run publicar`. Ele grava a versão nova em `package.json`, cria o commit e a tag, monta o pacote, publica no servidor, confere o ar e só então envia o commit e a tag ao GitHub. Você não mexe em número de versão nem em tag à mão.

### Escolha o tipo da mudança

A versão tem quatro números, A.B.C.D (a mesma regra do GlintFx). O tipo decide qual número sobe:

| Tipo | Quando usar | Exemplo, a partir de 0.1.0 |
|---|---|---|
| `recurso` | Algo novo para quem usa o site: tela, função ou conteúdo que muda a experiência. Sobe B e zera C e D. | 0.2.0.0 |
| `correcao` | Só conserto de erro, sem nada novo. Sobe C e zera D. | 0.1.1.0 |
| `construcao` | Só empacotamento, teste ou build, sem efeito para quem usa o site. Sobe D. | 0.1.0.1 |

O número A só muda por ordem expressa do líder. O cálculo não mexe nele: para isso existe `--versao` (ver abaixo).

### Exemplos

Veja o plano sem alterar nada:

```
npm run publicar -- correcao --seco
```

Publicação de verdade (exige branch `main` e nenhuma mudança não commitada em arquivo rastreado):

```
npm run publicar -- recurso
```

Primeira publicação, na versão 1.0.0.0 (só por ordem do líder):

```
npm run publicar -- recurso --versao 1.0.0.0
```

`--versao` precisa ter quatro números e ser maior que a versão atual. Sem `--versao`, o comando calcula a versão sozinho.

### O que o comando faz, em ordem

1. Recusa se a branch não for `main`, se houver mudança não commitada em arquivo rastreado (arquivo novo ainda não adicionado não bloqueia), se o tipo for inválido ou se a versão for inválida.
2. Grava a versão nova em `package.json` e cria o commit `chore(release): vX.Y.Z.W`, só com esse arquivo.
3. Cria a tag anotada `vX.Y.Z.W`.
4. Prepara a cópia de trabalho `.worktrees/pub` no commit da tag, apaga nela os `dispositivos.ts` que sobraram de uma geração anterior (só os ignorados pelo git, só dentro de `src/conteudo`, e as pastas que ficaram vazias por isso; o comando imprime quantos removeu), copia os `dispositivos.ts` atuais e roda o `preci`, a mesma verificação do CI local. Se o `preci` falhar, o comando desfaz o commit e a tag que ele mesmo criou, e para. Nada vai ao servidor.
5. Publica o pacote `dist/` no servidor por rsync, em duas etapas. A primeira envia tudo menos `index.html`, `sw.js`, `404.html` e `manifest.webmanifest`, e faz a higiene descrita abaixo. A segunda envia esses quatro, sem apagar nada. Por último grava os manifestos (ver abaixo).
6. Confere o ar: compara o md5 de cada arquivo do pacote com a resposta do endereço, confere `api/saude.php` (`{"ok":true}`), `api/conteudo.php` (401 sem sessão), a raiz do site principal (que não pode mudar) e roda `scripts/verificar-publicacao.sh`.
7. Só com tudo verde, envia `main` e a tag ao GitHub e confirma os dois com `git ls-remote`.

### Higiene do servidor: o que pode ser apagado

Cada publicação apaga no servidor só arquivos velhos de `assets/` e `workbox-*.js` que não estão no pacote atual **nem** na geração publicada antes dele. Quem ainda tem a página da versão anterior aberta não leva 404 no meio do uso.

- **Manifestos.** O comando grava no servidor `.publicacao-manifesto.txt` (o que está no ar) e `.publicacao-manifesto-anterior.txt` (a geração anterior). Assim cada publicação protege as duas gerações mais recentes.
- **Teto.** No máximo 500 arquivos apagados por publicação. Se a simulação passar disso, o comando para antes de apagar qualquer coisa.
- **Escopo.** Se houver algo a apagar fora de `assets/` e `workbox-*.js`, o comando para e mostra a lista. Para apagar mesmo assim, revise a lista e rode de novo com `--apagar-fora-de-assets`.
- **Dados do servidor nunca são apagados.** O PHP grava seus dados fora de `direito2026/`, em `direito2026_privado` (`public/api/nucleo/config.php:32-37`; contas em `contas.php:24`, tentativas em `armazenamento.php:214`, erros em `respostas.php:83`, sessões em `sessao.php:20`). As regras de proteção (`regras_fixas_protecao` em `scripts/publicar.sh`) guardam os mesmos nomes caso apareçam dentro do destino: `usuarios.json`, `tentativas.json`, `segredo.key`, `erros.log`, `verificacoes.log`, `pausado-*`, `*.lock`, `sessoes/`, `conteudo/`, `cgi-bin/`, `.well-known/`, `.user.ini`, `error_log`, e os próprios manifestos.
- **Primeira publicação com o comando.** Não há manifesto no servidor ainda. Então o comando lê a lista de precache do `sw.js` que está no ar (`https://direito2026.drpetrus.top/sw.js`, linhas `url:"..."` e a referência `./workbox-...`) e a grava como manifesto anterior: a versão que o navegador já tem em cache fica protegida por uma publicação. Só depois disso a regra normal passa a valer. Se o `sw.js` não puder ser baixado ou não tiver lista legível, o comando AVISA e publica **sem apagar nada**.
- **Antes de apagar, nada é escrito.** A simulação usa `rsync -n` contra o destino real; o `--seco` não consulta o servidor.


### Se a conferência falhar

O comando para com erro e diz o que divergiu. Ele NÃO desfaz o deploy, porque o servidor já mudou. Nada foi enviado ao GitHub. O commit de release e a tag ficam locais, e a mensagem diz o SHA e o nome da tag. Decida com o líder antes de corrigir ou repetir: rodar de novo calcula outra versão.

### Como verificar depois

- A última linha do comando é `publicado: vX.Y.Z.W sha=... divergencias=0`.
- `git ls-remote --tags github refs/tags/vX.Y.Z.W` mostra a tag, e `git ls-remote github refs/heads/main` mostra o mesmo commit.
- `curl -s https://direito2026.drpetrus.top/api/saude.php` responde `{"ok":true}`.

### Se algo der errado

- Recusa logo no início: nada foi alterado. Leia a mensagem.
- Falha depois do commit e antes do deploy: o comando desfaz sozinho o que criou. Se avisar que não desfez, porque o HEAD já mudou, desfaça à mão a tag local e o commit de release, sem tocar em mais nada.
- Falha no `preci`: o diagnóstico fica numa pasta `/var/tmp/publicar.*` (permissão 700). Ela pode conter trechos do conteúdo restrito. Leia e apague à mão. O caminho é impresso na mensagem.
- Falha depois do rsync: o servidor pode ter ficado parcial. Não há desfazer automático.
- Se o push for recusado, resolva o histórico e rode de novo. O comando nunca força push, nunca usa `--no-verify` e nunca reescreve commit.

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

**Admin trancado por tentativas de outra pessoa (socorro)**

O limite de tentativas tem uma chave por conta (10 falhas em 15 min, espera de até 60 s). Para um atacante distribuído não trancar o admin, quem já entrou antes recebe o cookie `__Host-d26disp` (30 dias, token aleatório por aparelho; o servidor guarda só o sha256, no máximo 5 por conta) e não é barrado por essa chave; ele continua sujeito às chaves usuário+IP e IP. Troca de senha, redefinição, desativação e exclusão invalidam todos os aparelhos da conta; o admin também pode derrubá-los pela ação `revogar-aparelhos`, que além de esvaziar os aparelhos incrementa a `versaoSessao` do alvo (derruba também as sessões dele; aba Admin da API, `POST /api/usuarios.php`; não vale para a própria conta, que se resolve trocando a senha). Se mesmo assim o admin ficar sem conseguir entrar (navegador novo, cookie apagado), zere os contadores daquela conta pelo CLI, que não vai no pacote:

1. `ssh hostinger 'mkdir -p ~/d26_cli_tmp'` e `scp servidor/cli/desbloquear.php hostinger:~/d26_cli_tmp/`;
2. `ssh hostinger 'D26_NUCLEO=$HOME/domains/drpetrus.top/public_html/direito2026/api/nucleo php ~/d26_cli_tmp/desbloquear.php $HOME/domains/drpetrus.top/direito2026_privado <login>'`;
3. `ssh hostinger 'rm -rf ~/d26_cli_tmp'`.

O CLI remove a chave de conta e as chaves usuário+IP daquele login em `tentativas.json`; não mexe nas outras contas, não cria nada e não imprime IP. Entre logo depois: se o ataque continuar, os contadores sobem de novo.

**Senha esquecida (redefinir UMA conta)**

`criar-admin.php --substituir` apaga todas as contas; para uma só, use o CLI de redefinição, que também não vai no pacote:

1. `ssh hostinger 'mkdir -p ~/d26_cli_tmp'` e `scp servidor/cli/redefinir-senha.php hostinger:~/d26_cli_tmp/`;
2. `ssh -t hostinger 'D26_NUCLEO=$HOME/domains/drpetrus.top/public_html/direito2026/api/nucleo php ~/d26_cli_tmp/redefinir-senha.php $HOME/domains/drpetrus.top/direito2026_privado <login>'` (a senha provisória é digitada, sem eco; pode ser curta);
3. `ssh hostinger 'rm -rf ~/d26_cli_tmp'`.

O CLI exige que a conta exista (login com maiúsculas e minúsculas exatas), grava o hash novo, marca a troca obrigatória no próximo acesso, derruba as sessões abertas (`versaoSessao`), revoga os aparelhos confiáveis e zera os contadores de tentativa daquele login. Não muda ativo nem admin, não toca nas outras contas e não imprime senha nem hash.

**Estado provisionado, travas e administração (regras de operação)**

- `tentativas.json` é criado pelo CLI junto com o primeiro admin. Depois de provisionado (existe `usuarios.json`), se `tentativas.json` sumir a API responde 503 `indisponivel` em vez de recomeçar com os limites zerados; para recuperar, recrie-o com o conteúdo `{"u":[],"ip":[],"c":[]}` (modo 600) ou rode o CLI de criação de estrutura.
- Toda leitura/gravação de JSON usa trava com teto de 2 s: trava presa por outro processo, JSON ilegível, falha de escrita ou campo de conta com tipo errado respondem 503 `indisponivel` (fechado, nunca "livre"), e o detalhe vai só para `erros.log`.
- Há um admin por desenho: não existe promoção a admin pela API e o CLI cria só o primeiro. Nenhuma ação deixa o sistema sem admin ativo (409 `ultimo-admin`), e o admin é revalidado dentro da trava a cada ação.
- Ordem fixa de travas no código: `tentativas.json` antes de `usuarios.json`, nunca o inverso.

**Testes antes de publicar:** `php servidor/testes/rodar.php` (suíte PHP, sem phpunit; sobe `php -S` local contra `servidor/dev/roteador.php`). No servidor, `php -S` sobe mas não aceita conexão em 127.0.0.1, então lá só roda a parte sem servidor: `php servidor/testes/rodar.php --sem-servidor` (copiando `public/api` e `servidor` para uma pasta temporária fora de `public_html`, e apagando-a depois).

## Área do Júri: instalação (servidor)

Esta seção instala a conta, o acervo de imagens e o conteúdo da área do Júri. O código (`public/api/juri/`) já vai no pacote publicado, junto com o resto do site. Os dados não vão no pacote: são instalados à mão, uma vez. O procedimento de "esqueci a senha" está na seção seguinte.

**Antes de começar.** Esta instalação muda produção. Ela cria a conta e a chave de cifragem, e as duas são difíceis de desfazer. Antes de rodar o passo 4, siga o roteiro de deploy irreversível (sete fases, com checklist anotado como `[PASSOU]`, `[FALHOU]` ou `[BLOQUEADO]`). Ele fica fora deste repositório. Este guia diz só os comandos. A decisão de ir ao ar é do líder.

**Marcadores.** Nos comandos abaixo, o que está entre `<` e `>` é um valor seu. Nenhum valor real está escrito aqui. O alias `hostinger` é o nome SSH configurado na sua máquina, como nas outras seções deste documento.

| Marcador | O que é |
|---|---|
| `<dominio>` | o domínio raiz da conta de hospedagem, que é o nome da pasta em `~/domains/` (ex.: `domains/<dominio>/juri2026_privado`). Não é o endereço do site: o site fica no subdomínio `direito2026.<dominio>`, e é esse endereço que vai nas URLs deste guia |
| `<pasta-do-site>` | a pasta dentro de `public_html` onde o pacote foi publicado; dentro dela fica `api/nucleo` |
| `<raiz-do-repositorio>` | a pasta onde está o clone deste repositório na sua máquina |
| `<pasta-originais>` | a pasta com as fotos originais, fora do repositório |
| `<pasta-saida>` | pasta nova, fora do repositório, onde a ferramenta grava o acervo |
| `<caminho-do-juri.json>` | o arquivo de conteúdo da área, fora do repositório (ver `docs/como-adicionar-conteudo.md`, seção 11) |
| `<senha-provisoria>` | a senha de 20 caracteres que a ferramenta mostra uma vez |

**Requisitos na sua máquina.**
- Clone deste repositório na branch `main`, com as dependências do projeto instaladas.
- Node.js 22 ou mais novo.
- `exiftool` no PATH. Sem ele, a ferramenta para com a mensagem `exiftool não encontrado no PATH`. A ferramenta não instala nada; o pacote é do sistema.
- Pasta de originais fora do repositório, com só imagens JPEG, PNG ou WebP. Se houver PDF, pasta ou atalho, a ferramenta recusa a rodada inteira, sem dizer o nome do arquivo.
- Acesso SSH ao servidor já configurado.

**Passo 1: gerar o acervo cifrado (na sua máquina).**

```
cd <raiz-do-repositorio>
node --import tsx scripts/juri/acervo.ts iniciar --originais <pasta-originais> --saida <pasta-saida>
```

- A pasta de saída não pode existir, ou precisa estar vazia. A pasta pai precisa existir.
- A ferramenta mostra uma linha, a senha provisória. Guarde essa linha para entregar ao administrador. Ela não aparece de novo. Se for perdida antes da instalação, rode o passo de novo com outra pasta de saída: isso gera outra senha e outro acervo.
- O `ids.tsv` é criado, ou ganha linhas novas, dentro da pasta de originais. Ele guarda os ids das imagens e é o que permite refazer o acervo depois. Não apague esse arquivo.

**Passo 2: conferir antes de enviar (na sua máquina).**

Desligue o histórico do shell durante a chamada. A senha vai na linha de comando.

```
set +o history
node --import tsx scripts/juri/acervo.ts conferir --saida <pasta-saida> --senha <senha-provisoria>; echo "codigo=$?"
set -o history
```

Resultado esperado: uma linha `conferido: N imagens decifram com a senha, sem etiqueta de metadado` e `codigo=0`. Se aparecer outro código, não envie nada. Refaça o passo 1.

**Passo 3: preparar a pasta temporária no servidor e enviar o instalador e a credencial.**

```
ssh hostinger 'mkdir -m 700 $HOME/juri-cli-tmp'
scp <raiz-do-repositorio>/servidor/cli/juri-instalar.php hostinger:juri-cli-tmp/
scp <pasta-saida>/credencial-admin.json hostinger:juri-cli-tmp/
ssh hostinger 'chmod 600 $HOME/juri-cli-tmp/credencial-admin.json'
```

A credencial vale como a senha provisória até o primeiro acesso. Por isso ela sai do servidor logo depois do passo 4.

**Passo 4: rodar o instalador no servidor.**

```
ssh hostinger 'D26_NUCLEO=$HOME/domains/<dominio>/public_html/<pasta-do-site>/api/nucleo php $HOME/juri-cli-tmp/juri-instalar.php $HOME/domains/<dominio>/juri2026_privado $HOME/juri-cli-tmp/credencial-admin.json'
```

Resultado esperado: `Conta da Júri instalada: admin (deve trocar a senha no primeiro acesso)`.

- O caminho do diretório privado precisa terminar em `juri2026_privado` e ficar ao lado de `public_html`, fora do alcance do site. É aí que o site procura: a partir da pasta do código, ele sobe quatro níveis e acrescenta esse nome. Se o nome estiver errado, o instalador recusa e não grava nada.
- O instalador cria a pasta privada e as subpastas com permissão 700, e os arquivos de controle com 600.
- Se já existir `usuarios.json`, o instalador recusa. Trocar a conta existente só com a opção `--substituir`, no procedimento de "esqueci a senha".

**Passo 5: enviar acervo, imagens e conteúdo.**

Envie depois do passo 4, porque o instalador é quem cria as pastas com a permissão certa.

```
scp <pasta-saida>/acervo.json hostinger:domains/<dominio>/juri2026_privado/
scp <pasta-saida>/imagens/*.juri hostinger:domains/<dominio>/juri2026_privado/imagens/
scp <caminho-do-juri.json> hostinger:domains/<dominio>/juri2026_privado/conteudo/juri.json
ssh hostinger 'cd $HOME/domains/<dominio>/juri2026_privado && chmod 600 acervo.json imagens/*.juri conteudo/juri.json'
```

Confira as permissões:

```
ssh hostinger 'stat -c "%a %n" $HOME/domains/<dominio>/juri2026_privado $HOME/domains/<dominio>/juri2026_privado/imagens $HOME/domains/<dominio>/juri2026_privado/conteudo $HOME/domains/<dominio>/juri2026_privado/acervo.json $HOME/domains/<dominio>/juri2026_privado/conteudo/juri.json'
```

Resultado esperado: `700` nas três pastas e `600` nos três arquivos. Se algum número for diferente, corrija com `chmod` antes de seguir.

**Passo 6: apagar as cópias temporárias do servidor.**

Liste antes de apagar. Depois apague pelo caminho exato. Não use curinga.

```
ssh hostinger 'ls -l $HOME/juri-cli-tmp'
ssh hostinger 'rm -f $HOME/juri-cli-tmp/credencial-admin.json $HOME/juri-cli-tmp/juri-instalar.php && rmdir $HOME/juri-cli-tmp'
```

O `rmdir` só remove a pasta se ela estiver vazia. Se ele falhar, sobrou algo lá: leia o `ls` e apague o que for seu.

**Passo 7: apagar a credencial da sua máquina.**

Confira o caminho antes de apagar:

```
ls -l <pasta-saida>/credencial-admin.json
rm -f <pasta-saida>/credencial-admin.json
```

O restante da pasta de saída (`acervo.json`, `imagens/`, `conferencia.tsv`) pode ficar até o passo 8 passar. Depois, apague a pasta inteira pelo caminho exato, com `ls` antes. Nunca apague a pasta de originais nem o `ids.tsv`.

**Passo 8: conferir o ar.** As URLs abaixo usam o subdomínio do site, `direito2026.<dominio>`. A raiz do domínio não serve a API da Júri e responde 404 para `/api/juri`.

```
curl -s -o /dev/null -w '%{http_code}\n' https://direito2026.<dominio>/api/juri/conteudo.php
curl -s -o /dev/null -w '%{http_code}\n' "https://direito2026.<dominio>/api/juri/imagem.php?id=00000000000000000000000000000000"
curl -sI https://direito2026.<dominio>/api/juri/conteudo.php | grep -i '^cache-control'
```

Resultado esperado: `401`, `401` e `Cache-Control: no-store`. O 401 vem antes de qualquer checagem de conteúdo ou de id.

**Login.** Abra `https://direito2026.<dominio>/p/p1/juri-simulado` no navegador. Entre com o usuário `admin` e a senha provisória. A área pede a troca de senha antes de liberar qualquer conteúdo. A senha nova tem 15 caracteres ou mais, sem regra de tipo de caractere.

Enquanto a cadeira estiver marcada como `em-breve` no código, a página mostra só a entrada. O conteúdo aparece depois que a cadeira for publicada, pelo mesmo roteiro de deploy irreversível.

## Área do Júri: esqueci a senha

Não há chave de recuperação, por decisão do líder. Se a senha do administrador for esquecida, o acervo é cifrado de novo com outra chave, a partir dos originais. Os ids das imagens são reusados, por isso o `juri.json` não muda.

**O que precisa existir:** a pasta de originais e o arquivo `ids.tsv` dentro dela. Guarde os dois em pelo menos mais um lugar, fora do repositório. Sem eles, veja o último trecho desta seção.

**Janela sem imagens.** Entre o passo 4 e o passo 5 abaixo, a conta antiga já não entra e as imagens antigas não abrem com a conta nova. Esse intervalo dura o tempo de dois comandos. Prepare o passo 3 inteiro antes de começar o passo 4.

**Passo 1: gerar o acervo novo (na sua máquina).** Use o mesmo `--originais` e uma pasta de saída nova, que ainda não exista.

```
cd <raiz-do-repositorio>
node --import tsx scripts/juri/acervo.ts iniciar --originais <pasta-originais> --saida <pasta-saida-nova>
```

Anote a senha provisória. Ela vale até o primeiro acesso.

**Passo 2: conferir (na sua máquina).** Use o passo 2 da instalação, trocando `<pasta-saida>` por `<pasta-saida-nova>`. Só siga com `codigo=0`.

**Passo 3: enviar para a área de troca e preparar a credencial.** Escolha `<data>` no formato `AAAA-MM-DD`.

```
ssh hostinger 'mkdir -m 700 $HOME/domains/<dominio>/juri2026_privado/troca-<data> $HOME/domains/<dominio>/juri2026_privado/troca-<data>/imagens'
scp <pasta-saida-nova>/acervo.json hostinger:domains/<dominio>/juri2026_privado/troca-<data>/
scp <pasta-saida-nova>/imagens/*.juri hostinger:domains/<dominio>/juri2026_privado/troca-<data>/imagens/
ssh hostinger 'chmod 600 $HOME/domains/<dominio>/juri2026_privado/troca-<data>/acervo.json $HOME/domains/<dominio>/juri2026_privado/troca-<data>/imagens/*.juri'
ssh hostinger 'mkdir -m 700 $HOME/juri-cli-tmp'
scp <raiz-do-repositorio>/servidor/cli/juri-instalar.php hostinger:juri-cli-tmp/
scp <pasta-saida-nova>/credencial-admin.json hostinger:juri-cli-tmp/
ssh hostinger 'chmod 600 $HOME/juri-cli-tmp/credencial-admin.json'
```

A pasta `troca-<data>` fica dentro do privado, e não em outro lugar do servidor, para que o `mv` do passo 5 seja uma troca dentro do mesmo sistema de arquivos.

**Passo 4: trocar a conta.** Rode logo depois do passo 3.

```
ssh hostinger 'D26_NUCLEO=$HOME/domains/<dominio>/public_html/<pasta-do-site>/api/nucleo php $HOME/juri-cli-tmp/juri-instalar.php $HOME/domains/<dominio>/juri2026_privado $HOME/juri-cli-tmp/credencial-admin.json --substituir'
```

Resultado esperado: `Conta da Júri instalada: admin (deve trocar a senha no primeiro acesso)`.

- Antes de gravar, o instalador copia o `usuarios.json` antigo para `usuarios.json.bak-<data-e-hora>`, em UTC, com permissão 600. Essa cópia guarda a conta antiga. Veja o passo 7.
- O instalador só troca o arquivo se ele for mesmo o da Júri. Se não for, recusa e não muda nada.

**Passo 5: trocar o acervo e as imagens.** Rode logo depois do passo 4.

```
ssh hostinger 'cd $HOME/domains/<dominio>/juri2026_privado && mv -f troca-<data>/acervo.json acervo.json && mv -f troca-<data>/imagens/*.juri imagens/ && rmdir troca-<data>/imagens troca-<data>'
```

O `rmdir` só funciona se a pasta de troca estiver vazia. Ele é a trava de que nada ficou para trás.

**Passo 6: conferir.**

- Confira se `imagens/` tem o mesmo número de arquivos que o índice do acervo:

```
ssh hostinger 'ls $HOME/domains/<dominio>/juri2026_privado/imagens | wc -l'
python3 -c "import json,sys; print(len(json.load(open(sys.argv[1]))['indice']))" <pasta-saida-nova>/acervo.json
```

Os dois números devem ser iguais. Se não forem, sobrou foto de uma troca anterior, ou faltou alguma. Liste com `ls`, decida com calma e apague o que sobrou pelo caminho exato.

- Entre com a senha provisória nova em `https://direito2026.<dominio>/p/p1/juri-simulado`, troque a senha e abra cada imagem. Todas precisam abrir. Se alguma não abrir, não apague nada. Compare o hash de cada `.juri` do servidor com o da pasta de saída nova, com `md5sum` dos dois lados. Se algum hash não bater, a troca do passo 5 não entrou inteira. Envie de novo só o arquivo que não bate, pelo caminho exato, e confira o hash outra vez.

**Passo 7: apagar o que sobrou.** Só depois do passo 6.

```
ssh hostinger 'ls -l $HOME/domains/<dominio>/juri2026_privado/usuarios.json.bak-*'
ssh hostinger 'rm -f $HOME/domains/<dominio>/juri2026_privado/usuarios.json.bak-<data-e-hora-exatos>'
ssh hostinger 'rm -f $HOME/juri-cli-tmp/credencial-admin.json $HOME/juri-cli-tmp/juri-instalar.php && rmdir $HOME/juri-cli-tmp'
rm -f <pasta-saida-nova>/credencial-admin.json
```

- O `usuarios.json.bak-*` guarda a conta antiga, com a senha esquecida. Ele não serve para mais nada depois que a conta nova entrar. Apague pelo nome exato que o `ls` mostrar. Não use curinga no `rm`.
- Depois de apagar a credencial local, a pasta `<pasta-saida-nova>` pode ser apagada pelo caminho exato, com `ls` antes. A pasta de originais e o `ids.tsv` ficam.

**Se os originais sumirem.** Sem a pasta de originais e o `ids.tsv`, os ids não podem ser reusados. Então o acervo é refeito a partir de novas cópias das imagens, os ids mudam, e o `juri.json` precisa ser refeito com os ids novos (ver `docs/como-adicionar-conteudo.md`, seção 11). Esse é o caso mais caro. Por isso a pasta de originais e o `ids.tsv` devem ter cópia de segurança.

**Cópias temporárias que sobram.** A ferramenta cria uma cópia limpa de cada imagem em pasta temporária com permissão 700, dentro de `TMPDIR` ou de `/var/tmp`, com prefixo `juri-acervo-`. A pasta é apagada quando a ferramenta termina normalmente. Se o processo for morto com `kill -9`, a pasta pode ficar, com as imagens em claro (já sem metadados). Depois de uma saída anormal, liste as pastas com esse prefixo, confira o nome com `ls` e apague a que for sua, pelo caminho exato.
