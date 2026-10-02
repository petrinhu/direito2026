# QA das abas Mapa mental, Fichamento e Mnemônicos (Filosofia Jurídica, u1, HEAD c193e95)

Primeira vez que estas telas são vistas por alguém (o engenheiro não abriu navegador). Rodada sob a exceção à L-50 (caixa `bwrap`, sem `/dev/nvidia*`, `/dev/dri` nem `/run/user`; ambiente próprio; headless; vigia). Capturas em `mockups/capturas/abas/` (65 arquivos, ignoradas pelo git).

## Congelamento (L-13) e diff de escopo
- HEAD no início e no fim: `c193e95527d69878dbb0ef7a467d53bac1925c3f`; `git status --short` vazio.
- `dist/` (55 arquivos): md5 `dd93ce885c1d7164fec0a73fcaa27bd2` no início e no fim. Um `git archive HEAD` construído em scratch deu lista idêntica.
- Diff de escopo `e740782..c193e95` (o hash certo é e740782): 13 commits, 52 arquivos, todos em `src/`, `tests/` e `docs/`. Nada fora dessas árvores.

## 1. Testes e2e
- `abas-novas-*.spec.ts` (41 testes por navegador, 82 no total): **72 passam, 10 falham** (5 testes x 2 navegadores).
- Suíte completa, duas execuções (Chromium e Brave, 4 workers): **378 passaram, 42 pularam, 10 falharam, nas duas** (as mesmas 10, deterministicamente). Os 42 pulos são o spec do selo/V/F nas cadeiras sem V/F, por desenho.
- As 10 falhas são **defeito do teste, produto correto** (provado com sonda no navegador):
  1. `abas-novas-navegacao.spec.ts:41-45` "o menu lateral leva às abas novas": espera os 3 links no DOM com o menu fechado; os links só existem depois de abrir período > cadeira > unidade (aberto, os 3 links estão lá, uma vez cada, na ordem Mapa mental, Fichamento, Mnemônicos, Quiz).
  2. `abas-novas-navegacao.spec.ts:109-120` "fichamento: filtra...": espera 1 ficha para `ockham`; aparecem 2 (Duns Escoto e Guilherme de Ockham), porque a ficha de Escoto cita Ockham como contraponto.
  3. `abas-novas-contraste.spec.ts:62-68` e `:114-124`, "fichamento, <claro|escuro|adaptado>: texto contra o fundo real" (3 testes): o seletor `#ficha-platao .ficha__fonte` não existe porque a ficha de Platão não traz citação (só 5 fichas têm); timeout de 30 s. Sugestão: usar a ficha de Sófocles.

### Mutação (2 asserções-chave, cópias exportadas fora da árvore)
| Asserção | Mutação | Resultado | Morde? |
|---|---|---|---|
| Teclado do mapa (Home volta à raiz) | `Home` passa a focar o 2º item | `mapa: teclado completo (setas, Enter, Espaço, Home e End)` vermelho nos dois navegadores | **sim** |
| Alvo de 44 px nos botões dos mnemônicos (modo adaptado) | botão do cartão com altura de 30 px | **28 de 28 VERDES: não morde** | **NÃO** |

**IMPORTANTE 1 (teste fraco):** `abas-novas-largura.spec.ts:90-91`: `await page.goto(.../mnemonicos); for (const el of await page.locator('button.mnemonico__botao').all())` roda sem esperar os botões existirem; `.all()` devolve lista vazia (a rota carrega em chunk), o laço não executa e o teste passa. Prova: cópia com `await page.locator('button.mnemonico__botao').first().waitFor()` antes do laço fica vermelha com a mutação (`Expected >= 44, Received 30`, 2 de 2) e passa no HEAD (2 de 2). O mesmo padrão aparece na linha 31 (cliques nos botões) e nos laços do fichamento: precisam do mesmo `waitFor`.

## 2. As telas, vistas (avaliação honesta)
Capturas: 3 abas x claro/escuro/adaptado x 360 e 1280, cada uma fechada e com tudo aberto (Chromium), e uma de cada no Firefox (`ff-*`, resultado igual).

**Mapa mental.** Lê-se bem como uma árvore hierárquica (outline com conectores), não como um mapa mental radial: raiz azul-marinho com título dourado > "Período" azul-marinho > "Fase" azul médio > "Pensador" cartão branco com barra dourada à esquerda > (aberto) "Modo de pensar", "Conceitos-chave" (subárvore de itens tracejados), "Para o Direito hoje", "Ressalva das fontes", "Ler a ficha completa". A hierarquia é clara e as cores são as do padrão do site (azul-marinho, dourado, creme, branco); os conectores (linhas verticais e ramos em "L") são visíveis nos dois temas; nada sobreposto a 1280. No escuro, o mesmo esquema com cartões cinza-azulados e barra dourada. Notas: (a) existe o nível extra "Fase" (Grécia clássica, Helenismo e Roma, Patrística, Escolástica, Contraponto) entre período e pensador, além do pedido "período > pensadores > modo de pensar" (decisão do líder); (b) dentro de um pensador aberto, os rótulos "Modo de pensar", "Conceitos-chave" têm o mesmo peso do texto, a hierarquia interna é mais plana que a externa; (c) **a 360 px o recuo consome a largura**: a coluna de texto do "modo de pensar" fica com ~170 px (normal) e ~190 px (adaptado), com 5 a 8 palavras por linha; legível, mas apertado; (d) **no modo adaptado a 360 px** (texto de 24 px, 6 linhas pretas de conector, coluna estreita) as palavras quebram no meio ("formulaç/ões", "particula/r", "Aristótel/es") e a página aberta chega a 65.094 px de altura (IMPORTANTE 2).

**Fichamento.** É a tela mais limpa: título, filtro por período, busca, "Abrir/Fechar todas as fichas", "12 fichas" como estado, índice numerado em duas colunas com os 12 nomes, ficha por pensador agrupada por período, e a ficha aberta com Período, Obras, Ideia central, Conceitos-chave, Citação (barra dourada, fonte), Comentário, Ressalva (caixa tracejada), Referências e "Ver o tema no Resumo". Muito legível nos 3 modos e nas duas larguras. A coluna é mais estreita que a das abas (margens laterais maiores), sem problema.

**Mnemônicos.** Dez cartões com título, etiqueta da técnica (Imagem mental, Associação, Percurso), a dica com barra dourada, "Tente dizer de cabeça" e o botão "Mostrar o que a dica guarda" que revela termo/explicação, "Como funciona" e "Atenção" (caixa tracejada) mais "Ver o tema no Resumo". Fica bonito e consistente com o resto, nos dois temas. Detalhe: na lista de resposta o primeiro termo aparece em linha ("Lei eterna  a lei de Deus...") e os demais em linha própria, formatação irregular e com espaço duplo.

**Abas a 360 px.** As 5 abas quebram em linhas (normal: 3 linhas, "Resumo | Mapa mental / Fichamento | Mnemônicos / Quiz"; adaptado: uma por linha, 5 linhas); funcionam, sem abas fora da tela, mas comem altura. O título da página ("Resumo, mapa mental, fichamento, mnemônicos e quiz") quebra no meio da palavra no adaptado a 360 ("fichament/o", "mnemônic/os").

**Menu lateral** (`menu-filosofia-escuro.png`, `-adaptado.png`): os 3 links novos aparecem como abas da unidade, alinhados com "Resumo" e "Quiz" (x = 89 px normal, 101 px adaptado), medido: período 26, cadeira 47, unidade 74, abas 89, itens 106 (recuo e cor por nível intactos, iguais ao fechado em 0e766c2; Chromium e Firefox). Como o Resumo aberto lista 12 itens, os links Mapa mental, Fichamento e Mnemônicos ficam abaixo dessa lista longa, exigindo rolar a barra (COSMÉTICO 3).

## 3. Teclado e leitor de tela (Chromium e Brave)
- **Mapa:** `role=tree` com nome "Mapa mental de Filosofia Jurídica", 127 `treeitem` (todos com `aria-level` 1 a 6 e nome), 32 grupos com `aria-expanded`, 32 `role=group`; só um item com `tabindex=0` (um único ponto no ciclo de Tab). Teclas: ArrowDown/ArrowUp andam, Enter e Espaço alternam (`aria-expanded` muda), ArrowRight abre e depois entra no 1º filho, ArrowLeft volta ao pai, End vai ao último visível (Ockham), Home vai à raiz. Foco visível em todos os passos: contorno de 2 px `rgb(22,58,95)` com `:focus-visible` (captura `foco-mapa-*.png`).
- **Fichas:** título `h4` com botão (`aria-expanded`, `aria-controls` aponta para o corpo existente, que fica oculto fechado); Enter e Espaço alternam; foco visível (2 px). Filtro e busca com rótulos ("Período ou fase", "Buscar nas fichas", "Índice das fichas") e `role=status` com o total ("12 fichas").
- **Mnemônicos:** botão com `aria-expanded`/`aria-controls`, rótulo alterna "Mostrar o que a dica guarda" / "Esconder a resposta", resposta oculta com `display:none` até abrir; o foco permanece no botão depois de Espaço.
- **Abas:** `tablist` com 5 `tab`, `aria-selected` correto, painel `tabpanel`.

## 4. Conteúdo, por amostra, contra `resumo.ts`
Conferidos: fichas de Tomás de Aquino (4 leis, "corrupção da lei" atribuída a Wolkmer, "deve prevalecer a humana" atribuída ao Manual de Humanística, datas 1225-1274 e 1224 no livro de apoio), de Sófocles (hybris, leitura não unânime) e de Ockham; mnemônicos "As leis em Tomás de Aquino", "Justiça comutativa x justiça distributiva" e "Ordem cronológica dos pensadores" (as dez paradas batem com a linha do tempo do bloco 12, datas iguais). **Nada distorcido; divergências atribuídas a cada autor; imagens e siglas declaradas "só apoio de memória, não constam do material".** Nenhuma citação de letra de alternativa. `verificar-proibicoes.sh` em `src` (136 arquivos), `public` (4) e `dist` (49): rc=0, zero ocorrências. Travessão e meia-risca nos arquivos novos: 0. Único ponto: a ficha de Ockham escreve "universalismo da lex naturale"; o resumo diz "lei natural" e não traz o termo latino (COSMÉTICO 4, não distorce).

## 5. Âncora
"Ler a ficha completa" (no mapa, ramo de Platão aberto) leva a `/fichamento#ficha-platao`, a aba Fichamento fica selecionada, a ficha abre (`aria-expanded=true`) e rola até ela (topo da ficha a 71 px, logo abaixo do cabeçalho fixo, dentro da janela). A carga direta de `/fichamento#ficha-tomas-de-aquino` também abre e posiciona a ficha. Igual em **Chromium, Brave e Firefox**.

## 6. Offline e impressão (Chromium e Brave)
- **Offline:** depois de visitar as rotas online, com o service worker controlando a página, a rede cortada e a página recarregada, `/mapa`, `/fichamento` e `/mnemonicos` abrem (e o spec `abas-novas-offline` também passa).
- **Impressão** (mídia print, `page.pdf` A4; PDFs em scratch, 3 prévias em `print-*.png`): mapa com os 127 itens visíveis e "Modo de pensar" presente 12 vezes (14 páginas); fichamento com as 12 fichas abertas, "Referências" 12 vezes, controles ocultos (21 páginas); mnemônicos com as 20 áreas de resposta visíveis e sem botões (11 páginas). Detalhes: a faixa de abas é impressa (ruído), os triângulos dos ramos aparecem como "fechados" embora o conteúdo esteja aberto, e a 1ª página dos mnemônicos fica quase vazia (só o título; os cartões começam na página seguinte) (COSMÉTICO 5).

## 7. axe-core e contraste
- **axe:** 3 rotas (com mapa e fichas totalmente abertos e mnemônicos revelados) x claro, escuro, adaptado x 1280 e 360 = 18 combinações por navegador, Chromium, Brave e Firefox: **zero violações** (nem moderate).
- **Contraste medido no navegador (Chromium), texto de cada classe contra o fundo real composto, pior caso por aba:** mapa claro 9,2:1 (rótulo/nível `#d9e6f5` sobre `#1a3a5c`), mapa escuro 6,68:1 (ação, `#7fa8d6` sobre `#1a1f27`), fichamento claro 8,41:1, fichamento escuro 6,68:1, mnemônicos claro **4,83:1** (etiqueta da técnica, `#7c621c` sobre `#f3ead1`, o menor, acima do piso de 4,5), mnemônicos escuro 6,68:1; modo adaptado 15,63:1 nas três (azul-marinho sobre branco). Nenhum abaixo de 4,5:1 (normal) nem de 7:1 (adaptado).

## 8. Regressão rápida (Chromium e Firefox)
Resumo e quiz das 4 cadeiras abrem (9, 15, 12 e 12 blocos; quizzes de 60, 30, 80 e 80), respondem, o placar atualiza e o bloco de resultado está presente; abas: Introdução e Redação "Resumo|Petição comentada|Quiz", Sociologia "Resumo|Quiz", Filosofia as 5 novas; 0 erros de console. Menu: recuo e cor por nível intactos (seção 2; `menu-recuo.spec.ts` passa nas duas execuções).

## Achados
### CRÍTICO: nenhum.
### IMPORTANTE 1. Suíte e2e vermelha e uma asserção vazia (seção 1)
10 falhas por defeito de teste (menu fechado, `ockham` = 2 fichas, ficha de Platão sem citação) e o teste dos 44 px dos mnemônicos nunca mede nada (mutação não é pega).
### IMPORTANTE 2. Mapa mental no modo adaptado a 360 px: legibilidade
Aninhamento de até 6 níveis com 24 px de texto deixa colunas de ~190 px, quebra palavras no meio ("formulaç/ões", "particula/r", "Aristótel/es"), seis linhas pretas de conector e 65.094 px de altura com tudo aberto (36.702 px nos mnemônicos, 57.222 px no fichamento). Funciona, mas é o pior ponto do público de baixa visão. Capturas `mapa-aberto-adaptado-360.png` (recorte dos "Conceitos-chave"). Sugestão: reduzir o recuo por nível (ou achatar os conceitos) quando o modo adaptado estiver ligado e usar `overflow-wrap: break-word` com `hyphens: manual`.
### COSMÉTICO 1. Título da página quebra no meio da palavra no adaptado a 360 px; abas em 3 linhas (normal) ou 5 (adaptado).
### COSMÉTICO 2. Lista de resposta dos mnemônicos com formatação irregular (primeiro termo em linha, demais em bloco; espaço duplo).
### COSMÉTICO 3. Links novos do menu ficam abaixo dos 12 itens do Resumo.
### COSMÉTICO 4. Termo latino "lex naturale" na ficha de Ockham não consta do resumo.
### COSMÉTICO 5. Impressão: faixa de abas impressa, triângulos como fechados, 1ª página dos mnemônicos quase em branco.
### COSMÉTICO 6. Mapa é um outline (árvore vertical), não um mapa mental radial; nível "Fase" extra. Decisão de desenho, não defeito.

## Ocorrências de processo
- **0 abortos do vigia por processos de outra sessão do usuário.** Nenhum processo do QA tocou a placa, o barramento ou o display; vigia original, sem alteração. O driver de tentativas refez uma captura do Firefox que falhou por limite de altura de captura (71.173 px acima de 65.535): erro do meu script, resolvido limitando a altura.
- Nada instalado nem baixado; L-11 respeitado (um trabalho pesado por vez, 4 workers).
- `xdg-document-portal.service`: active. Servidores e vigia encerrados; nenhum processo meu sobrando. HEAD e md5 de `dist/` conferidos no fim (iguais).

# Rodada 2 (HEAD 5a8baab, enxuta)

## Congelamento
HEAD no início e no fim `5a8baabe75aa290c61174a006e8f4595c4e98dea`; `git status --short` só este relatório. md5 de `dist/` (`find dist -type f | sort | xargs md5sum | md5sum`), início e fim: `65314d123b63899777fd74ceb8d1fc39`; `git archive HEAD` construído em scratch deu lista idêntica. Diff `c193e95..5a8baab`: nada fora de `src/`, `tests/`, `docs/`.

## Testes (Chromium e Brave)
- Os 4 specs pedidos (`abas-novas-mapa-estreito`, `-navegacao`, `-largura`, `-contraste`): **78 passaram, 6 falharam**. Suíte completa, uma execução: **386 passaram, 42 pularam, 6 falharam** (as mesmas 6). Os 10 vermelhos da rodada anterior caíram para 6; os de contraste do fichamento, o do filtro `ockham` e a asserção dos mnemônicos agora passam.
- **Mutação do botão de 30 px: VERMELHA** nos dois navegadores (`modo adaptado: texto do mapa em 24px e alvos de 44px...`, `Expected >= 44, Received 30`); 26 verdes. A asserção agora morde (a espera que faltava foi acrescentada).
- As 6 falhas:
  1. `abas-novas-mapa-estreito`, 2 testes x 2 navegadores: o piso que o próprio engenheiro fixou (texto do nó mais profundo >= 240 px) **não é atingido pelo produto**: medido 230 px no adaptado e 232 px no normal (`"Lei do Estado x leis divinas não escritas"`). É defeito do produto frente ao critério declarado, ou o piso está alto demais: 10 px a menos do que o prometido. A 2ª asserção do mesmo teste (nenhuma palavra partida) não chegou a rodar.
  2. `abas-novas-navegacao` "o menu lateral leva às abas novas", x 2: `a[href=".../fichamento"]` agora resolve para 2 elementos (o link do menu e o da aba); o teste espera 1. Defeito do teste (seletor ambíguo); o produto tem os links.

## Mapa a 360 px (Chromium, tudo aberto)
| | normal | adaptado | adaptado, Firefox 156 |
|---|---|---|---|
| Largura do texto do nó mais profundo (nível 6, 51 nós) | **232 px** | **230 px** | **218 px** (viewport útil 348) |
| Largura da caixa do nó mais profundo | 250 px | 250 px | 238 px |
| Palavra partida no meio de letras (largura suficiente) | **0** | **0** | **0** |
| Palavras quebradas só em hífen | 2 ("1225-1274", "(1285-1327)") | 18 (datas e "Conceitos-chave", todas em hífen) | n/a |
| Rolagem lateral da página | 0 | 0 | 0 |
| Altura da página aberta | 18.974 px | 46.148 px | 48.853 px |
Antes (rodada anterior): colunas de ~190 px no adaptado, palavras partidas ("formulaç/ões"), 65.094 px. Agora: texto de 230 px, palavras inteiras ("formulações", "Aristóteles"), -29% de altura. Visto (`r2-mapa-360-normal.png`, `r2-mapa-360-adaptado.png`, `r2-ff-mapa-360-adaptado.png`): conectores finos e visíveis, 4 a 6 palavras por linha no adaptado, normal confortável; o Firefox idêntico ao Chromium (coluna 12 px mais estreita pela barra de rolagem). Nota: o teste do engenheiro conta como "partida" qualquer palavra em duas linhas, o que pegaria também as quebras em hífen (datas); se essa for a intenção, a 2ª asserção também reprovaria.

## Mnemônico com resposta revelada
`r2-mnemonico-revelado-360.png` e `r2-mnemonico-revelado-1280.png` ("As leis em Tomás de Aquino"): termo em negrito com a explicação na linha de baixo, todos os 4 termos com a mesma formatação (o COSMÉTICO 2 da rodada anterior está consertado), "Como funciona" e "Atenção" legíveis, botão "Esconder a resposta".

## Achados
- **IMPORTANTE:** o mapa a 360 px não atinge o piso de 240 px do próprio teste (230/232 px). Melhorou muito (de ~190 px), mas o teste reprova; ajustar recuo ou piso.
- **IMPORTANTE (teste):** o teste do menu lateral tem seletor ambíguo (2 links iguais).
- Corrigidos: asserção vazia dos 44 px, falhas de `ockham` e contraste do fichamento, formatação dos mnemônicos, palavras partidas no mapa adaptado.

## Processo
0 abortos do vigia por processos de outra sessão do usuário; nenhum processo do QA tocou a placa, o barramento ou o display; vigia original. `xdg-document-portal.service` active; servidores e vigia encerrados; nada sobrando.

# Produção (commit 506eb8d no ar em direito2026.drpetrus.top)

Rodada enxuta contra o site publicado (2 workers, caixa `bwrap`, sem alterar nada). Specs do commit 506eb8d (cópia exportada em scratch) com `baseURL` de produção em config de override.

## Correspondência com o pacote
HEAD local `506eb8df7717a18fce0e9ed7cd48c996c32f3ad0`. O `index.html` servido tem o mesmo md5 do `dist/index.html` do pacote (`66beb662a3e39157e817e5f06d36ce09`); dos 54 arquivos do `dist/` testados por GET, 52 são byte a byte idênticos. Os 2 que diferem: `.htaccess` (configuração do servidor, não é servida) e a imagem `assets/oferecimento-logo-C17sdA4W.png` (servida com 5.988 bytes contra 5.892 do pacote, 96 bytes a mais; conteúdo visual não conferido; COSMÉTICO).

## 1. Specs contra produção (Chromium e Brave, 2 workers)
`abas-novas-mapa-estreito` + `abas-novas-navegacao`: **26 passaram, 6 falharam** (3 testes x 2 navegadores):
1. `abas-novas-mapa-estreito`, 360px normal e adaptado (4 falhas): o teste mede a largura do `.no-mapa__rotulo` do primeiro nó profundo, que é o rótulo curto "Physis x nomos": a caixa tem a largura do próprio texto (125 px normal, 227 px adaptado), não a da coluna disponível. Defeito do teste (a medida certa é a coluna): ver a medida abaixo, de 278 a 280 px.
2. `abas-novas-navegacao` "busca: uma ficha do fichamento aparece como resultado" (2 falhas): reproduz em produção 3 de 3 isoladas e **não é só do teste: é uma corrida real do produto** (IMPORTANTE abaixo).

## Largura do nó mais profundo do mapa a 360 px, tudo aberto (nível 6, 51 nós; piso 240)
| | normal (Chromium) | adaptado (Chromium) | adaptado (Firefox 156) |
|---|---|---|---|
| texto do nó mais profundo | **280 px** | **278 px** | **266 px** (viewport útil 348) |
| caixa do nó | 290 px | 290 px | 278 px |
| palavras partidas no meio de letras | 0 | 0 | 0 |
| rolagem lateral | 0 | 0 | 0 |
| altura da página aberta | 17.388 px | 40.639 px | 42.804 px |
Todos acima do piso de 240 px (eram 232/230 no 5a8baab e ~190 antes). Capturas `prod-mapa-360-normal.png`, `prod-mapa-360-adaptado.png`, `prod-ff-mapa-360-adaptado.png`.

## 2. A captura, vista
Mapa a 360 adaptado (Chromium e Firefox, iguais; o Firefox com a coluna 12 px mais estreita por causa da barra de rolagem): texto grande de 24 px em 4 a 6 palavras por linha ("Uma das primeiras / formulações do / debate entre / direito natural e / direito positivo"), palavras inteiras, conectores visíveis, caixas legíveis, sem sobreposição. **Está bom.** Único reparo: as caixas ficam quase encostadas na borda esquerda da tela (margem de poucos pixels com 6 linhas verticais de conector), aceitável (COSMÉTICO).

## 3. Smoke
- **As 3 abas abrem nos 3 navegadores** (aba certa selecionada, 149 itens na árvore/fichas/cartões somados conforme a aba). Console sem erro em Chromium e Brave. No Brave, 1 de 3 verificações do mapa falhou na 1ª visita fria porque a árvore ainda não tinha montado em 500 ms; com espera, 3 de 3 abrem (sondagem sem espera de 3 s a 0,7 s). **Firefox:** 3 erros de console na 1ª visita ("downloadable font: download failed", 3 fontes) **só quando a navegação é interrompida**: carregando a página e esperando 6 s, 0 erros e as fontes `loaded`; artefato do meu script (troca de página no meio do carregamento), não do site.
- **Offline (Chromium):** segunda visita com o service worker controlando e rede cortada: `/mapa`, `/fichamento` e `/mnemonicos` abrem. Impressão em produção igual à local (127 itens do mapa visíveis, 12 fichas abertas, respostas visíveis).

## Defeito encontrado (não corrigido)
### IMPORTANTE. Primeira busca sem resultado se digitada antes de o índice chegar (pré-existente, aparece em produção)
Em visita fria, o índice (`/assets/busca-indice.json`, 51.860 bytes) só é baixado depois da digitação e chega 200 a 1.200 ms depois; a consulta digitada antes disso **não é refeita quando o índice chega**: `/busca`, digitar "ockham", esperar 3 s dá **0 resultados** em 4 de 4 tentativas (índice em @946 a @2123 ms, depois do `fill` em @786 a @1417 ms); digitar outra letra e apagar (nova entrada) mostra 8 resultados (a ficha de Ockham é o 1º). Em loopback o índice chega em milissegundos e o problema não aparece, por isso a suíte local passa. Num celular em rede lenta a primeira busca pode parecer vazia. Captura de tela não aplicável (painel de resultados vazio, só o título "Busca"). Sugestão: refazer a consulta pendente quando o índice termina de carregar (ou pré-carregar o índice ao abrir `/busca`).

## Processo
0 abortos do vigia por processos de outra sessão do usuário; nenhum processo do QA tocou a placa, o barramento ou o display; vigia original. Só leituras e navegação em produção (nenhuma escrita). `xdg-document-portal.service`: active; vigia encerrado; nada sobrando.
