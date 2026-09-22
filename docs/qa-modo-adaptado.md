# QA visual do modo de leitura adaptada (baixa visão)

Conferência sobre o site publicado (`https://direito2026.drpetrus.top`), em Brave/Chromium sem janela (perfil do próprio `chrome-devtools` MCP, controlado por API de acessibilidade e JavaScript, nunca por automação de foco/entrada no hospedeiro). Critérios medidos contra `docs/modo-adaptado.md`, seção 8. Capturas em `mockups/capturas/modo-adaptado/`.

**Nota de processo (transparência, não é achado do produto):** o navegador interativo disponível (MCP `chrome-devtools`) já estava de pé com um perfil compartilhado e persistente (`~/.cache/chrome-devtools-mcp/chrome-profile`), fora do meu scratchpad e não descartável por mim — infraestrutura prévia, fora do meu controle de configuração. As interações foram só via API programática (clique por seletor de acessibilidade, leitura de estilo computado), nunca xdotool/wmctrl/foco no hospedeiro. Uma primeira tentativa de gerar o PDF de impressão com o binário `brave-browser` e a flag `--headless=new` produziu sinais de processo desktop-integrado (D-Bus, portal do KDE) e travou sem terminar; troquei para o binário `chromium-browser` com `--headless` (mesmo padrão já usado noutras verificações deste projeto, sem sinal nenhum de janela) e o PDF saiu limpo — detalhe na seção do item 8, abaixo.

## Resposta direta

**Não, ainda não.** O texto, o contraste, o espaçamento e o quiz cumprem a especificação com folga. Mas o cabeçalho de toda página de unidade fica ilegível com o modo ligado: a trilha de navegação sobrepõe as próprias palavras (achado 1) e, em telas estreitas, o título é cortado para fora da tela (achado 2). Como a trilha aparece em toda página de unidade, isso compromete a navegação para exatamente o público que o modo foi feito para atender.

## Achados

### 1. CRÍTICO — Trilha do cabeçalho sobrepõe o próprio texto (unidade, qualquer largura, inclusive 1280px)

Nas três abas da unidade (resumo, petição, quiz), com o modo ligado, a trilha "1º período / Introdução ao Direito / Unidade 1 / Resumo" não quebra linha nem encolhe o texto: cada item é um item flex com encolhimento padrão (`flex: 0 1 auto`) dentro de um `<ol>` com `flex-wrap: nowrap`, e o texto dentro de cada item tem `white-space: nowrap` (regra de `TrilhaNavegacao.vue`, sem exceção para o modo). O item encolhe, mas o texto não quebra dentro dele; o texto pinta por cima do item vizinho. Resultado visual: "1º períodIntrodução ao DimeidtaRíesu..." — palavras diferentes sobrepostas, ilegíveis. Reproduzido em `/p/p1/intr-direito/u1` (resumo, petição e quiz), 1280px. Capturas: `unidade-header-achado-trilha-sobreposta-1280.png`, `unidade-peticao-on-1280.png`, `unidade-quiz-on-1280-respondido.png`.

Contradiz `docs/modo-adaptado.md` seção 4 ("Trilha do cabeçalho: [...] quebra em mais de uma linha se o texto maior não couber numa linha só, nunca corta com reticências") — e aqui nem chega a truncar com reticências, sobrepõe pixel por cima de pixel.

### 2. CRÍTICO — Mesma causa, em 320px: o título do cabeçalho é cortado para fora da tela

Na home, 320px, modo ligado: o link "Caderno de Direito" do cabeçalho (`.barra-topo__trilha a`) mede 274px de largura de conteúdo dentro de um contêiner de 124px, com `overflow: visible` — o texto vaza para a direita e é cortado pela borda da janela, sem rolagem horizontal (por isso a varredura automática de `scrollWidth` do critério 2 não pega isto: o `scrollWidth` do documento continua ≤ viewport, o vazamento é só visual, sem gerar caixa de rolagem). Captura: `home-on-320.png`. Isto é um furo no próprio critério 2 tal como está escrito na especificação — vale registrar para quem revisar a seção 8: "nenhuma rolagem horizontal" não cobre texto que vaza sem rolagem.

**Causa raiz das duas, mesmo lugar:** `src/ui/componentes/TrilhaNavegacao.vue`, regras `.trilha-navegacao ol { flex-wrap: nowrap }` (linha 80) e `.trilha-navegacao li { white-space: nowrap }` (linha 87), sem exceção sob `:root[data-modo-adaptado='on']`. O componente foi desenhado para truncar com reticências em telas estreitas fora do modo (`data-truncavel`), não para o texto ~1,4× maior do modo.

### 3. IMPORTANTE — Título da home mantém serifa com o modo ligado

O `h1` "Caderno de Direito" da home continua em Georgia (serifa), contradizendo a seção 2 ("Título com serifa [...] sem serifa [...] troca para Inter"). Causa: `src/ui/paginas/Home.vue` linha 42, `.pagina-home__hero h1 { font-family: var(--fonte-titulo); ... }`, regra com escopo do componente Vue que empata em especificidade com a regra global do modo (`:root[data-modo-adaptado='on'] h1`) e não tem condição própria para o modo — como vem depois no pacote final, vence sempre, ligado ou não. A cor deste título está correta (preto, `--cor-hero-texto` é redefinida para `#000000` sob o modo, tokens.css linha 366); só a família da fonte não segue a regra. Captura: `home-on-1280.png`. Não achei o mesmo problema no `h3` do cartão de unidade logo abaixo, que troca para sem-serifa normalmente — o escopo do bug é só o hero da home.

### 4. CRÍTICO, mas FORA DO ESCOPO DO MODO ADAPTADO — o apêndice de dispositivos citados nunca aparece, em nenhum modo, para ninguém

Ao gerar o PDF de impressão do item 8 (seção própria abaixo), o apêndice "Dispositivos citados" (`ApendiceDispositivos.vue`, section `aria-label="Dispositivos citados"`) não apareceu nem na petição nem no resumo. Investiguei a causa antes de descartar como "só timing de impressão": com o navegador interativo, na aba petição, o elemento `.apendice-dispositivos` **não existe no DOM**, mesmo depois de 4s de espera (não é questão de tempo de carregamento). A lista de requisições de rede confirma: nenhum chunk de `dispositivos` é buscado — só `index`, `curriculo`, `Unidade`, `meta`, `resumo`, `peticao`, `quiz`.

Causa raiz, em `src/ui/paginas/Unidade.vue` linhas 53-63: o import dinâmico usa `/* @vite-ignore */` com um caminho montado em runtime pelo alias `@` (`import(/* @vite-ignore */ \`@/conteudo/${periodo}/${cadeira}/${unidade}/dispositivos\`)`). O comentário `@vite-ignore` diz ao Vite para NÃO analisar esse import estaticamente — e é exatamente essa análise estática que resolveria o alias `@` para um caminho real e incluiria o módulo no bundle de produção. Sem ela, o navegador tenta buscar, em produção, a URL literal `.../@/conteudo/p1/intr-direito/u1/dispositivos`, que não existe (`dist/` não tem nenhum arquivo de dispositivos, conferido por busca direta). O servidor, por ter fallback de SPA, devolve `index.html` com HTTP 200 e `content-type: text/html` para essa URL (confirmado por `curl`) — o navegador rejeita isso como módulo JS inválido, e o `catch {}` vazio (linha 58-63) engole o erro em silêncio, sem `console.error`, sem log nenhum. `dispositivos.value` fica `undefined` para sempre.

**Isto não é um bug do modo adaptado — acontece igual com o modo ligado ou desligado, em qualquer navegador.** Duas features inteiras dependem deste import e estão mudas em produção, para todo mundo: o balão de artigo de lei ao passar o mouse/tocar (`BalaoDispositivo.vue`) e este apêndice de impressão. Como fura diretamente o item 8 do roteiro desta QA, registro aqui; a correção pertence ao dono da camada de dados/build (fora do escopo de CSS do modo adaptado), não ao `impl-modo-adaptado`.

## Números medidos, nas três larguras (separado de impressão visual)

Tudo nesta tabela veio de `getComputedStyle` e `getBoundingClientRect` num parágrafo real de leitura (`.bloco-teorico`, sem classe própria, texto longo) na aba Resumo de `/p/p1/intr-direito/u1`, com o modo ligado — nunca "pareceu certo na captura". Contraste pela fórmula de luminância relativa do WCAG (a mesma usada no crítico 1), texto contra o fundo computado do `body` (fundo real do elemento, L-42).

| Largura da janela | `font-size` computado | `line-height` computado | Largura da coluna de texto | Contraste texto/fundo |
|---|---|---|---|---|
| 320px | 24px | 43.2px (1.8×) | 241px | 21,00:1 |
| 768px | 24px | 43.2px (1.8×) | 689px | 21,00:1 |
| 1280px | 24px | 43.2px (1.8×) | 800,86px | 21,00:1 |

Achado de percurso, não é bug: numa primeira leitura o script pegou o parágrafo errado (`.indicador-progresso__texto`, "0 de 9 blocos lidos") e mediu 18px — isso é o token `--escala-xs` (18px sob o modo), correto para aquele elemento pequeno, não o corpo de leitura. Corrigido antes de reportar.

A coluna não estoura o teto de 60ch da seção 2 em nenhuma largura: em 320/768px o texto ainda não alcança o teto (a coluna some menor que a área disponível), e em 1280px o teto entra em ação (800,86px ≈ 60 caracteres "0" nesta fonte a 24px). `document.documentElement.scrollWidth` bateu com `clientWidth` nas três larguras (307×305, 753×753, 1265×1265) — sem rolagem horizontal do documento em nenhuma delas, o que é exatamente por que o achado 2 (texto cortado no cabeçalho) não aparece numa varredura automática de `scrollWidth`: o vazamento é visual, não gera caixa de rolagem.

## O que foi conferido e passou

- **Persistência:** o atributo sobrevive a F5 e a navegar para outra página (home → unidade), critério 9. Confirmado por leitura direta do atributo, não só visual.
- **Tamanho, altura de linha, coluna e contraste nas três larguras (críticos 1, 3 e 5):** ver tabela acima — todos medidos com número, não impressão visual.
- **Espaçamento entre letras/palavras/parágrafos (crítico 5, complemento):** `letter-spacing` 2.88px (0.12em), `word-spacing` 3.84px (0.16em), `margin-block-end` de parágrafo 48px (2×), medidos em 1280px — batendo com a tabela da seção 2 da especificação.
- **Alvos de toque (crítico 4):** botão de período da lateral 280×59px, campo de busca 240×44px, botão do modo 197×61px, cada alternativa do quiz 871×102px (a correta, com borda, 871×151px) — todos ≥ 44×44px.
- **Acerto/erro do quiz sem depender de cor (crítico 6):** a alternativa correta ganha borda sólida e a palavra "Correta" anexada ao texto, visível mesmo sem cor nenhuma — conferido no DOM (classe `cartao-pergunta__alt--correta` + texto), não só suposto.
- **Movimento (crítico 7):** o gradiente da home, com o modo ligado, roda com `animation-name: none` — sem animação CSS ativa, confirmação por estilo computado, não só "pareceu parado".
- **Peça comentada empilhada (seção 4):** `.peca-comentada__grade` vira `grid-template-columns` de uma coluna só com o modo ligado, confirmando que o comentário sempre fica abaixo do trecho, nunca ao lado.
- **Rótulo/estado do botão do cabeçalho (crítico 8):** lido pela árvore de acessibilidade, não só por captura de tela — texto visível alterna "Leitura ampliada" ⇄ "Leitura normal", `aria-pressed` alterna `"false"`/`"true"`, `aria-label` muda de "Ativar [...]" para "Desativar [...]", exatamente como a seção 5 pede.
- **Console (Chromium):** coletor de erros comprovado por sabotagem (`console.error` de teste disparado e capturado) antes de confiar no resultado; zero erros reais em todas as páginas e interações desta sessão (home, resumo, petição, quiz, clique em alternativa).

## Item 8: PDF de impressão — concluído nesta rodada

Refeito com o pedido do time-lead: Chromium sem janela imprimindo direto para arquivo, perfil descartável no meu scratchpad, sem reaproveitar o perfil do `chrome-devtools` MCP em execução.

O que funcionou: binário `chromium-browser` (não `brave-browser`), flag `--headless` "clássica" (não `--headless=new`), `--no-sandbox --disable-gpu --user-data-dir=<perfil descartável> --run-all-compositor-stages-before-draw --virtual-time-budget=10000 --print-to-pdf=<arquivo>`. Sem `--virtual-time-budget`, o PDF sai com 1 página vazia (o `print-to-pdf` do Chromium, assim como o `--screenshot` do Firefox, dispara antes de os pedaços de rota carregados sob demanda pelo Vue Router terminarem de importar); com ele, o PDF sai completo. Nenhum sinal de janela ou de integração com o ambiente de mesa desta vez (sem D-Bus, sem portal), diferente da primeira tentativa com `brave-browser --headless=new` (que travou sem terminar, sem gerar arquivo — abortada por precaução, relatado à parte ao time-lead).

Para imprimir já com o modo ligado sem clicar: copiei só a pasta `Default/Local Storage` do perfil do `chrome-devtools` MCP (onde eu já tinha ligado o modo pela interface de acessibilidade) para dentro do perfil descartável do Chromium, antes de imprimir — mesmo mecanismo de "perfil preparado" que apliquei também no Firefox (seção abaixo), aqui bem-sucedido de ponta a ponta porque o formato LevelDB do Chromium não tem o problema de tempo de renderização que bloqueou o Firefox.

Resultado, ambas com o modo ligado, texto extraído por `pdftotext` (prova de conteúdo real, não só contagem de bytes):
- **Resumo** (`unidade-resumo-impressao-modo-on.pdf`): 32 páginas, texto completo e correto, da introdução até o último "Quadro-resumo" do bloco 9.
- **Petição comentada** (`unidade-peticao-impressao-modo-on.pdf`): 18 páginas, texto completo e correto, do título até "Nome do advogado, OAB nº ...".
- **Apêndice de dispositivos citados: ausente nas duas.** Não é falha da impressão — é o achado 4 acima (bug real e mais amplo que o modo adaptado, na camada de dados).
- Não notei nada decorativo sobrando (sem imagem de fundo do hero, sem ícones puramente visuais) nas páginas impressas — compatível com a folha de estilo `impressao.css` que já existe no projeto.

## Item Firefox — investigado a fundo, sem sucesso; caminho e motivo registrados

Segui a orientação do time-lead: sem instalar nada, com o modo de captura embutido do Firefox (`firefox --headless --screenshot=<arquivo> --window-size=W,H <url>`), perfil descartável no scratchpad. Quatro tentativas, nesta ordem:

1. **Captura direta da home, sem preparar nada:** imagem gerada com sucesso (é PNG real, dimensão certa) mas de uma cor só (`250,249,245`, o fundo cru do site) — confirmado por contagem de cores da imagem (`PIL.Image.getcolors`), não por impressão visual. Nada do conteúdo da aplicação Vue chegou a pintar.
2. **Teste de controle, para separar "o mecanismo de captura não funciona" de "esta página específica não pinta a tempo":** a mesma linha de comando, apontada para um HTML estático simples (sem framework), capturou corretamente (256 cores, vermelho e azul do teste, nitidamente renderizado). **Conclusão: o `--screenshot` do Firefox funciona; é este site, especificamente, que não termina de pintar antes do disparo do obturador.** Causa provável: as rotas do Vue Router são importadas sob demanda (`() => import(...)`), então o evento `load` (o gatilho do `--screenshot`) dispara antes de o import da rota resolver — o mesmo mecanismo, aliás, que exigiu `--virtual-time-budget` no PDF do Chromium (item 8, acima); só que o Firefox `--screenshot` não tem uma flag equivalente de espera.
3. **Perfil preparado (o caminho que o time-lead sugeriu) — parcialmente validado:** o armazenamento local do Firefox por origem (desde a versão atual, formato "LSNG") é um SQLite simples em `storage/default/<origem>/ls/data.sqlite`, tabela `data(key, value, compression_type, conversion_type, ...)`; a chave do modo (`caderno-direito:v1:modo-adaptado`) já aparece gravada como `false` (texto puro, sem compressão) assim que a página é visitada uma vez — ou seja, escrever `true` ali por fora, via `sqlite3`, sem instalar nada, é tecnicamente possível e cheguei a confirmar a leitura/escrita da linha. **Mas não pude provar o efeito de ponta a ponta**, porque a captura continua em branco pelo motivo do item 2 (o problema não é a leitura do estado, é a pintura da página) — e existe ainda o risco, não descartado, de o próprio código de inicialização do app sobrescrever minha semente de volta para `false` no boot (o mesmo trecho que grava `false`/`"sistema"` sozinho na primeira visita).
4. **Coletor de erros de console via stdout/stderr do Firefox headless:** testado com sabotagem (uma página local com `console.error` proposital) antes de confiar nele — não aparece no stdout/stderr. Método descartado antes de ser usado no site real (L-36): eu não ia relatar "zero erros" vindo de um coletor que a própria sabotagem provou que não coleta nada.

Um quinto caminho existe em tese — o "Remote Agent" nativo do Firefox (`--remote-debugging-port`), que não é uma instalação nova, é parte do próprio binário — mas nesta versão ele só respondeu com HTTP 404 nos endpoints estilo Chrome DevTools Protocol (`/json/version`, `/json/list`); o que sobra é o protocolo WebDriver BiDi por WebSocket bruto, e escrever um cliente para esse protocolo do zero é, na prática, construir uma ferramenta de automação nova — exatamente o que `docs/arquitetura.md` (seção 14) já decidiu, por escrito e por ordem do líder (21/09/2026), manter fora do portão automático deste projeto ("o portão automático é Blink, e só Blink [...] Gecko [...] fica de fora do automático, por desenho, não por esquecimento"). Não forcei essa porta.

**Cobertura real de Firefox nesta rodada: nenhuma captura de tela com conteúdo, e nenhuma medição de console.** Registrado como está, não como "zero achados".

## Capturas e PDFs

Em `mockups/capturas/modo-adaptado/`: `home-off-1280.png`, `home-on-1280.png`, `home-on-320.png`, `unidade-resumo-on-1280.png`, `unidade-header-achado-trilha-sobreposta-1280.png`, `unidade-peticao-on-1280.png`, `unidade-quiz-on-1280-respondido.png`, `unidade-resumo-impressao-modo-on.pdf`, `unidade-peticao-impressao-modo-on.pdf`.
