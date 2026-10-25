# QA de produção: v1.3.0.0 no ar (ECA Digital, PD-08)

Alvo: site de produção do projeto (mesmo domínio dos QA de produção anteriores), versão v1.3.0.0, commit `7ce1f6b` (tag `v1.3.0.0`). Rodada só de medição: nenhum arquivo de produto editado, nenhum push, deploy ou publicação. Scratch fora do repositório, em `/var/tmp/qa-prod-eca/`.

## Veredito

**BLOQUEADO.** Não é aprovado nem reprovado. A única navegação com Chromium headless ao site voltou HTTP 403 com a página de desafio anti-bot ("Checking your browser before accessing. Just a moment..."). Por isso os itens de renderização (b, c, d, e, f) não foram executados. O desafio não foi contornado, pela L-57. A parte verificável por bytes e por HTTP comum está conferida e bate com o build do tag.

| Item | Situação |
|---|---|
| a. Versão servida v1.3.0.0 e service worker novo | PARCIAL (bytes conferidos; rodapé visual e troca do SW no navegador não observados) |
| b. Menu em 1280 px, Sociologia > AV3 | NÃO EXECUTADO |
| c. Abas e texto integral (arts. 36-A, 41-A, VETADO), sem erro de console | NÃO EXECUTADO (só dado de fonte, ver abaixo) |
| d. Quiz com 40 perguntas | NÃO EXECUTADO na página (dado de fonte: 40 ids) |
| e. Redirecionamento de `u3/quiz` preservando a aba | NÃO EXECUTADO (regra de redirecionamento existe no código) |
| f. Capturas PNG 1280 px claro e 390 px escuro | NÃO EXECUTADO; nenhuma captura produzida |

Problema conhecido ("21 dias" cobrindo texto em 390 px com Leitura ampliada): não observado, porque não houve renderização.

## Congelamento (L-13)

- HEAD no início: `7ce1f6b` (`chore(release): v1.3.0.0`). A tag `v1.3.0.0` aponta para ele.
- `git status --short` no início: `?? mockups/selo-home.html`, que não é deste QA e não foi tocado.
- Build do tag feito fora da árvore: `git archive 7ce1f6b` extraído no scratch, `node_modules` ligado por link simbólico ao do projeto (somente leitura), `npm run build` completo. Código de saída 0. Log em `/var/tmp/qa-prod-eca/build-tag.log`. Resultado do build: 134 arquivos; 105 com cache imutável; 0 sem impressão digital; sw analisado 1, com 0 problemas.
- md5 da lista de `dist/` do tag (134 arquivos): `774c3021819271fecd85cf1a823f5d3c`.

## Identidade do artefato no ar (por bytes, não por declaração)

- `sw.js`, `index.html` e o bundle principal (`assets/index-C8X-jmPP.js`): idênticos byte a byte ao build do tag.
- O bundle servido contém `1.3.0.0`. Versão servida: v1.3.0.0, por bytes.
- Precache: 105 URLs listadas no `sw.js` servido, todas com HTTP 200. Comparação com o build do tag: 104 idênticas e 1 divergente.
- Divergente: `assets/oferecimento-logo-C17sdA4W.png` (logo do rodapé). No ar, 5988 bytes, com o chunk `eXIf` (120 bytes) antes de `pHYs`. No build, 5892 bytes, com `eXIf` (180 bytes) depois de `pHYs`. Os pixels descomprimidos (IDAT) são idênticos. É o mesmo cosmético já registrado na rodada da v1.1.0.0 (`docs/qa-producao-av3.md`), sem correção. Comparação feita com `/var/tmp/qa-prod-eca/medir/png_chunks.py`.

## Isolamento (L-50, L-57, L-51)

- Caixa `bwrap` (`/var/tmp/qa-prod-eca/caixa.sh`): ambiente limpo (`env -i`), `DISPLAY` e `WAYLAND_DISPLAY` vazios, `XDG_RUNTIME_DIR` e `TMPDIR` próprios em `/var/tmp/qa-prod-eca/`, `/dev` mínimo.
- Sonda (`/var/tmp/qa-prod-eca/sonda.log`), executada dentro da caixa: `/dev` = `core fd full null ptmx pts random shm stderr stdin stdout tty urandom zero`. Sem `nvidia*` nem `dri`. `/run/user` inexistente.
- **Desvio de isolamento, declarado:** `/etc/resolv.conf` é um link para `/run/systemd/resolve/stub-resolv.conf`. Com `/run` vazio, o DNS falhou (`ERR_NAME_NOT_RESOLVED`, medido). Para resolver, dentro de `/run` foi montada uma cópia desse stub, só para DNS. Essa cópia é o único conteúdo de `/run`. A referência anterior usou `--tmpfs /run/user`.
- Navegador: `/usr/bin/chromium-browser` 155.0.8059.84, Playwright 1.63.0 do `node_modules` do projeto, headless, contexto descartável (sem perfil do líder). Nada instalado nem baixado.
- Ambiente dos processos filhos do navegador: não comprovado por `/proc` (não tentado nesta rodada).

## Desvio de acesso: desafio anti-bot no site

- Chromium headless, uma navegação à home: HTTP 403, título "Checking your browser before accessing. Just a moment...". Log em `/var/tmp/qa-prod-eca/sonda.log`.
- A mesma URL por HTTP comum (curl, sem navegador): HTTP 200, com cabeçalho `server: hcdn`.
- Não capturei os cabeçalhos da requisição do Chromium nem os da resposta 403. Não testei variantes de navegador ou de User-Agent, nem esperei o desafio terminar sozinho. Passar por desafio anti-bot é o que a L-57 proíbe. Qualquer tentativa de contorno depende de decisão do líder.
- Antes desse acesso houve duas falhas de preparo, sem efeito no site: DNS dentro da caixa (ver Isolamento) e um argumento inválido de `launch` do Playwright, corrigido.

## Dados de fonte (não substituem a página renderizada, L-41)

- Texto integral: no bundle servido (arquivos de `assets/` idênticos ao build do tag) aparecem `36-A`, `41-A` e 3 ocorrências de `VETADO`. A ordem e a visibilidade na página não foram observadas.
- Quiz: 4 arquivos por tema em `src/conteudo/p1/sociologia-juridica/u3-eca-digital/quiz/`, com 10 ids cada (contagem exata de `id:`): 40 perguntas no código. A exibição na página não foi observada.
- Redirecionamento: `src/app/curriculo/enderecosMovidos.ts` mapeia `p1/sociologia-juridica/u3` para `u3-artigos-infancia-digital`. A preservação da aba `/quiz` depende de `src/app/router/rotas.ts`, não verificada.

## Resultados por item

- **a. PARCIAL.** Versão `1.3.0.0` no bundle, e `sw.js`, `index.html` e bundle idênticos ao build do tag. Não observado: rodapé na tela e troca do service worker no navegador.
- **b. NÃO EXECUTADO.** Menu não renderizado.
- **c. NÃO EXECUTADO.** Abas, ordem e console não observados na página. Dado de fonte acima.
- **d. NÃO EXECUTADO na página.** Dado de fonte: 40 ids.
- **e. NÃO EXECUTADO.** Regra de redirecionamento existe no código; comportamento não observado.
- **f. NÃO EXECUTADO.** Nenhuma captura em `/var/tmp/qa-prod-eca/capturas/` (diretório vazio).

## Decisão pendente do líder (L-01)

Opções operacionais para executar b a f:

1. **Recomendada:** liberar o QA no painel do host, pausando a proteção anti-bot durante a janela do teste, e reexecutar b a f. Depois religar a proteção.
2. Rodar a partir de uma origem que a proteção já libera.
3. **Evasão, não recomendada e não feita:** trocar o User-Agent, esperar o desafio ou usar outro navegador para passar pelo anti-bot. Só caberia com autorização expressa do líder, e nunca como procedimento de QA (L-57).

## Limitações

- Nenhuma verificação de página renderizada (b a f) nesta rodada.
- Nenhum cabeçalho de requisição ou resposta do navegador registrado.
- Logo do rodapé: divergência de bytes mantida; pixels iguais.

## Encerramento (L-13)

- HEAD no fim: `7ce1f6b`.
- `git status --short` no fim: `?? mockups/selo-home.html` e este relatório.
- Processos de QA sobrando: nenhum (confirmado no fim da rodada).
- Nada instalado nem baixado para o repositório; nenhum commit além do relatório; nenhum push, deploy ou publicação.
