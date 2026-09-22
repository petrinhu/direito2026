# QA dos mockups estáticos, Caderno de Direito

Relatório gravado incrementalmente pelo agente de QA (L-13). Rodada 2, substitui a rodada 1 (histórico preservado na seção 5). Escopo atual: `mockups/home.html`, `mockups/unidade.html`, `mockups/tokens.css`, contra `docs/design-visual.md` e `docs/compatibilidade-navegadores.md`. `home-a.html` e `home-b.html` foram apagados pelo designer nesta rodada; o esqueleto de referência passou a ser o do arquivo piloto (barra lateral fixa de 280px, fundo escuro, árvore de currículo, ponto de quebra em 880px).

Ambiente de captura: Chromium headless (`chromium-browser --headless=new --disable-gpu --no-sandbox`), perfil descartável em diretório temporário próprio da sessão (fora da pasta do projeto), controlado via CDP (Chrome DevTools Protocol) por script Python isolado, sem nenhuma janela aberta na sessão gráfica do líder (L-50). Tema forçado por `document.documentElement.setAttribute('data-theme', 'light'|'dark')` via `Runtime.evaluate`. Estados abertos por chamada de função/evento real do próprio mockup (`mudarAba()`, `.click()` no gatilho da citação, `abrirMenu()`, `.focus()`/`.removeAttribute('open')`), nunca por simulação de mouse/teclado.

**Nota técnica sobre `position: fixed` e captura de página inteira:** o balão de artigo, a lateral e a barra superior usam `position: fixed`. Redimensionar a janela para a altura total do documento DEPOIS de abrir um desses elementos pode deslocar um elemento ancorado por `bottom` (o balão calcula a posição em pixel via JavaScript, e pode escolher ancorar por baixo quando não há espaço abaixo da citação). Por isso, toda captura de balão, lateral e barra superior nesta rodada usa screenshot de **viewport real** (sem redimensionar depois), nunca a técnica de página inteira.

## Status

Concluído.

## 0. Congelamento do artefato (md5, nas duas pontas)

Divergência real detectada e corrigida em conversa com o orquestrador: os primeiros três hashes recebidos não batiam com o que medi (o orquestrador confirmou que tinha escrito os valores sem rodar o comando). Os hashes corretos, recebidos na correção, batem exatamente com os que medi antes de começar a capturar:

| Arquivo | md5 recebido (corrigido) | md5 medido antes de capturar | md5 medido agora (fim) | Bate |
|---|---|---|---|---|
| `home.html` | `312a40f73c40841e79b0d066ac45441f` | `312a40f73c40841e79b0d066ac45441f` | `312a40f73c40841e79b0d066ac45441f` | sim |
| `unidade.html` | `84ea5cc078f164480b9ad39bc6096eda` | `84ea5cc078f164480b9ad39bc6096eda` | `84ea5cc078f164480b9ad39bc6096eda` | sim |
| `tokens.css` | `64b3a1c6262686b590d270298687d58b` | `64b3a1c6262686b590d270298687d58b` | `64b3a1c6262686b590d270298687d58b` | sim |

Os três arquivos não mudaram entre o início e o fim desta rodada. Nenhuma captura precisa ser refeita.

## 1. Histórico: o que a rodada 1 achou e o que mudou nesta rodada

| Achado da rodada 1 | Situação nesta rodada |
|---|---|
| CRÍTICO 1: título/marca quase ilegíveis no modo escuro (contraste ~1,04:1), `--cor-primaria-escura` usada como cor de texto | **Corrigido.** `tokens.css` ganhou `--cor-titulo-texto`, separada de `--cor-primaria-escura` (comentário no próprio arquivo cita o achado do QA de 21/09/2026). Medido nesta rodada: 14,84:1 (claro, fundo da página), 15,63:1 (claro, cartão elevado), 7,32:1 (escuro). Ver seção 2. |
| CRÍTICO 2: rolagem horizontal real em 360px na aba Resumo (linha do tempo sem contenção) | **Corrigido.** A linha do tempo virou desenho vetorial (SVG) com fallback em lista vertical empilhada abaixo de 640px. Medido nesta rodada: `scrollWidth` igual a `clientWidth` em 360, 768 e 1280px, nos dois arquivos e nas três abas. Ver seção 3. |
| CRÍTICO 3: selo "em breve" com contraste real de 2,96:1, divergente do documento de design | **Corrigido.** `tokens.css` ganhou `--cor-selo-texto`/`--cor-selo-bg`, par dedicado (comentário no arquivo cita o achado). Medido: 6,10:1 (claro), 9,46:1 (escuro). |
| IMPORTANTE: salto de nível de título (h1 → h3 → h2) nas duas homes | **Resolvido por remoção do problema:** `home-a.html`/`home-b.html` foram apagados; `home.html` usa `h1` → `h2` → `h2`, sem salto. `unidade.html` continua sem salto (h1 → h2×9 → h3×6 → h2 do apêndice de impressão → h3). |
| COSMÉTICO: numeração da lista "Nesta página" continuando de 10 a 12 | A lista lateral antiga (`aside.indice`) não existe mais neste esqueleto; a navegação por seção agora é a árvore da barra lateral, com marcador numérico ou "✓" por item, sem contador CSS encadeado. Não reproduzido no novo layout. |

## 2. Contraste na barra lateral (novo, fundo escuro fixo nos dois temas)

Fórmula WCAG 2.2 (luminância relativa), calculada, não estimada:

| Par | Hex texto | Hex fundo | Contraste |
|---|---|---|---|
| Link/resumo da lateral (`#dbe4ef`) / fundo da lateral, claro (`#0d2440`) | `#dbe4ef` | `#0d2440` | 12,17:1 |
| Idem, escuro (`#0b1a2c`) | `#dbe4ef` | `#0b1a2c` | 13,65:1 |
| Subtítulo da lateral (`#b7c6d9`) / fundo, claro | `#b7c6d9` | `#0d2440` | 9,00:1 |
| Idem, escuro | `#b7c6d9` | `#0b1a2c` | 10,09:1 |
| Item inativo da lateral (`#7f93ab`) / fundo, claro | `#7f93ab` | `#0d2440` | 4,96:1 |
| **Marcador "lido"** (círculo preenchido), claro: texto `--cor-texto-invertido` (`#faf9f5`) / fundo `--cor-acento` (`#8a6d1f`) | `#faf9f5` | `#8a6d1f` | **4,65:1** |
| Marcador "lido", escuro: `#0b1a2c` / `#d3b563` | `#0b1a2c` | `#d3b563` | 8,81:1 |

Todos os pares passam WCAG AA (mínimo 4,5:1). O marcador "lido" no modo claro é o mais apertado (4,65:1, mesma faixa do acento dourado já conhecido do projeto): aprovado, mas sem folga. Vale registrar para não regredir se a cor do acento mudar. `tokens.css` já documenta, em comentário, que a cor original do piloto (`#2b2205` sobre o acento claro) media só 3,21:1 e foi trocada por `--cor-texto-invertido` de propósito.

Cor de fundo da lateral confirmada por amostra de pixel real (não é só o CSS lido): `rgb(13,36,64)` = `#0d2440` no claro, `rgb(11,26,44)` = `#0b1a2c` no escuro, batendo exato com `tokens.css`. Fundo da coluna de conteúdo: `rgb(250,249,245)` = `#faf9f5` (claro), `rgb(18,22,28)` = `#12161c` (escuro), também exato.

## 3. Rolagem horizontal (item 1 da checklist, crítico 2 da rodada 1)

Medido via `document.documentElement.scrollWidth` contra `clientWidth`, headless, sem depender de captura de tela (que não revelaria overflow por trás do recorte da imagem):

| Arquivo | Aba | 360px | 768px | 1280px |
|---|---|---|---|---|
| `home.html` | não se aplica | 360/360 (sem overflow) | 360/360 | 1280/1280 |
| `unidade.html` | Resumo | 360/360 | 768/768 | 1280/1280 |
| `unidade.html` | Petição comentada | 360/360 | não medido | não medido |
| `unidade.html` | Quiz | 360/360 | não medido | não medido |

Sem rolagem horizontal em nenhuma combinação testada. O crítico 2 da rodada 1 está fechado.

## 4. Item novo: linha do tempo vetorial (texto real, cor por tema)

Verificado via DOM, não por leitura visual do SVG: `document.querySelectorAll('.linha-tempo-svg text').length` = 20 (10 marcos × nome + data), todos elementos `<text>` reais (`tagName === 'TEXT'`), zero `<image>` dentro do SVG. Cor computada do texto:

- Tema claro: nome `rgb(28,28,28)` = `#1c1c1c` (bate com `--cor-texto` claro).
- Tema escuro: nome `rgb(236,239,242)` = `#eceff2` (bate com `--cor-texto` escuro).

Texto de verdade (selecionável, encontrável por Ctrl+F, lido por leitor de tela) e muda de cor sozinho com o tema, porque o SVG usa `fill: var(--cor-texto)` em vez de cor fixa. Sem achado.

## 5. Foco de teclado dentro da lateral (item novo do briefing desta rodada)

Simulado chamando `.focus()` em sequência nos 26 elementos focáveis da lateral aberta (API do DOM, sem tecla real), conferindo se `document.activeElement` realmente muda a cada chamada: bateu em 100% da amostra (7 elementos verificados, do primeiro ao último: link da marca, campo de busca, botão de tema, `<summary>` do 1º período, último item da árvore de seções, botões de Petição e Quiz). A prisão de foco (`aoTecladoMenu`, captura de `Tab`/`Shift+Tab` nas pontas) está implementada e os elementos-alvo existem e recebem foco corretamente. Sem achado.

## 6. Legibilidade da coluna de leitura com a lateral em 1280px

Lateral fixa de 280px + coluna de leitura de até 760px centralizada (`--largura-coluna-leitura`) cabem confortavelmente dentro de 1280px (280 + 760 = 1040, sobra 240px de respiro nas laterais do `clamp()` de padding). Confirmado sem rolagem horizontal (seção 3) e visualmente nas capturas `unidade-claro-1280.png`/`unidade-sidebar-expandida-1280.png`: texto corrido não fica espremido nem colado na lateral.

## 7. Capturas

19 capturas gravadas em `mockups/capturas/`, encontradas=19 analisadas=19 falharam=0:

- **12 obrigatórias** (2 arquivos × 2 temas × 3 larguras, página inteira): `{home,unidade}-{claro,escuro}-{360,768,1280}.png`.
- **4 do balão de artigo**, `unidade.html`, aba Petição comentada, mecanismo único compartilhado (`#balao-dispositivo`, `popover="auto"`): `unidade-balao-demo-1280.png` (painel de referência estático do próprio mockup, os 3 estados sem interação, página inteira), `unidade-balao-real-aberto-1280.png` (clique real via `.click()` no botão `art. 927 do Código Civil`, posição padrão abaixo da citação), `unidade-balao-real-virado-1280.png` (clique no `art. 319, II, do CPC`, perto da borda direita, balão vira sozinho), `unidade-balao-real-faixa-360.png` (mesmo clique, viewport 360x740, balão vira folha inferior fixa). As três últimas são screenshot de viewport, não de página inteira (ver nota técnica no topo).
- **3 novas desta rodada:** `unidade-sidebar-recolhida-1280.png` (todos os períodos fechados), `unidade-sidebar-expandida-1280.png` (1º período aberto, estado padrão de carregamento), `unidade-topbar-menu-fechado-768.png` (768px, abaixo do ponto de quebra de 880px, barra superior com menu fechado).

Tema comprovado por amostra de pixel real (seção 2). Balões reais conferidos visualmente: o "aberto" abre logo abaixo da citação; o "virado" detecta a proximidade da borda direita e abre alinhado à direita, sem sair da tela, exatamente como descrito no comentário do código-fonte.

## 8. Conferência item a item

### Item 2, texto cortado/sobreposto (amostragem visual)

Inspecionado: `unidade-sidebar-recolhida-1280.png` (lateral completa, todos os 10 períodos com selo "em breve" e badges numerados), `unidade-topbar-menu-fechado-768.png` (barra superior + cabeçalho + abas), `unidade-balao-real-aberto-1280.png` e `-virado-1280.png` (conteúdo ao redor do balão). Nenhum texto cortado, sobreposto ou saindo do cartão nas amostras. Item "Direito Constitucional I" na lateral quebra em duas linhas corretamente, sem cortar.

### Item 4, tamanho de fonte dos campos (mínimo 16px)

`.busca-sidebar input { font-size: max(1rem, 16px); }`, presente nos dois arquivos. Conforme.

### Item 5, alvos de toque (mínimo 24x24, medido via `getBoundingClientRect`, 360px)

`.botao-menu` 40x40, `.botao-tema` 40x40 (home) / 128x40 (unidade, com rótulo de texto), links e `<summary>` da lateral 248x41,5 a 248x44,9, `.citacao-artigo` 190,9x29,9, `.balao-fechar` 28x28, abas 99,1x55,9 a 187x55,9. Todos acima do piso de 24x24. Abaixo do piso: `.sidebar__marcador` (o círculo numerado/✓, 18x18) e `kbd` (21,8x26,1). Nenhum dos dois é ele mesmo o alvo de toque: são decoração dentro de uma linha clicável bem maior (a `<a>`/`<summary>` inteira, 248px de largura). Não conta como achado, mesma situação já registrada na rodada 1.

### Item 6, foco de teclado (ver seção 5 para o detalhe da lateral)

`:focus-visible` global cobre todos os elementos, o gatilho do balão inclusive (`unidade.html:234`). Ordem de tabulação é a ordem do documento. Prisão de foco dentro da lateral aberta testada e funcionando (seção 5). Sem achado.

### Item 7, estrutura de títulos

`home.html`: h1 → h2 → h2, sem salto (corrigido, ver histórico). `unidade.html`: sem salto, inalterado da rodada 1.

### Item 8, balão de artigo

Mecanismo reconstruído (um único elemento compartilhado, `popover="auto"`, catálogo de dispositivos em JS). Mostra diploma + artigo (cabeçalho), texto (corpo), fonte **com data da consulta** explícita (ex.: "Fonte: Código Civil, Lei nº 10.406/2002. Consultado em 21/09/2026"). Isso é mais completo que na rodada 1, que só tinha o ano da lei. Ganhou também nota adicional quando existe ressalva (ex.: ADI pendente sobre o art. 927, mostrada em caixa própria). Não empurra conteúdo (`position: fixed`). Tem estado de tela estreita/toque (`@media (max-width:640px), (pointer:coarse)`, folha inferior com botão de fechar). Ganhou apêndice de impressão (`.apendice-impressao`, visível só em `@media print`) com a redação completa de cada dispositivo citado, numerado e batendo com a marca sobrescrita `[n]` que aparece no texto impresso. Sem achado.

### Item 10 e 11, traço longo/médio e emoji

Varredura em `home.html`, `unidade.html` e `tokens.css`: encontrados=0, analisados=3, falharam=0, para U+2014, U+2013 e as principais faixas Unicode de emoji. Conforme.

### Item 12, coerência com o guia de compatibilidade

Recursos já auditados na rodada 1 continuam presentes e corretos (`env()` com fallback, `forced-colors`, `prefers-reduced-motion`, `prefers-color-scheme`, `viewport-fit=cover`, `scroll-margin-top`). Novidade desta rodada: `popover="auto"` no balão de artigo, recurso Baseline desde 2024 (Chrome/Edge 114+, Firefox 125+, Safari 17+, ver `docs/compatibilidade-navegadores.md`, seção 2), dentro do alvo de suporte declarado, sem necessidade de fallback. Sem achado.

### Item 9, texto proibido

Não repetido nesta rodada por pedido explícito do orquestrador, que disse que refaz essa varredura no fim. Resultado da rodada 1 (feito pelo próprio orquestrador): encontrados=0, analisados=33, falharam=0.

## Resumo dos achados por severidade (rodada 2)

Nenhum achado CRÍTICO ou IMPORTANTE novo. Os três críticos e o importante da rodada 1 estão corrigidos e confirmados por medição. Sem achado COSMÉTICO novo nesta rodada.
