# QA dos mockups estáticos, Caderno de Direito

Relatório gravado incrementalmente pelo agente de QA, conforme a auditoria avança (L-13). Escopo próprio, não aceito de olhos fechados do briefing: `mockups/home-a.html`, `mockups/home-b.html`, `mockups/unidade.html`, `mockups/tokens.css`, contra `docs/design-visual.md` e `docs/compatibilidade-navegadores.md`.

Ambiente de captura: Chromium headless (`chromium-browser --headless=new --disable-gpu --no-sandbox`), perfil descartável em `/var/tmp/...scratchpad/chrome-profile`, controlado via CDP (Chrome DevTools Protocol) por script Python isolado, sem nenhuma janela aberta na sessão gráfica do líder (L-50). Tema forçado por `document.documentElement.setAttribute('data-theme', 'light'|'dark')` via `Runtime.evaluate`, sobrepondo `prefers-color-scheme` (o mesmo caminho que o botão de troca do próprio site usa). Aba "Petição comentada" ativada, quando preciso, chamando a própria função `mudarAba('peticao')` já existente no mockup. Estados do balão de artigo abertos chamando `.focus()` (API do DOM, não input simulado) no botão da citação, o que aciona `:focus-within` no CSS — sem clique, mouse ou teclado.

## Status

Concluído.

## 0. Congelamento do artefato (md5, nas duas pontas)

O orquestrador avisou que os três arquivos HTML mudaram durante a auditoria (balão de artigo acrescentado a `unidade.html`, rodapé trocado nos três) e passou os hashes da versão congelada. Conferido agora, depois de todas as capturas e medições:

| Arquivo | md5 congelado (recebido) | md5 medido agora | Bate |
|---|---|---|---|
| `home-a.html` | `27839e7c5c1ab8f1cb6af6cb0b01cacc` | `27839e7c5c1ab8f1cb6af6cb0b01cacc` | sim |
| `home-b.html` | `4966bec9171841bb089cbbd5b93db521` | `4966bec9171841bb089cbbd5b93db521` | sim |
| `unidade.html` | `06c59af12d920d5650a25746083d9598` | `06c59af12d920d5650a25746083d9598` | sim |
| `tokens.css` | `fc91aafa76823c330f9ac91e5960b430` | `fc91aafa76823c330f9ac91e5960b430` | sim |

Os quatro arquivos batem com a versão congelada. **Nenhuma captura precisa ser refeita:** o `mtime` dos três HTML é `1790033031` (21/09/2026 20:23:51, hora real do sistema, `stat -c %y`), e o `mtime` de TODAS as 22 capturas fica entre `1790033443` e `1790033465` (20:30:43 a 20:31:05), ou seja, entre 412 e 434 segundos DEPOIS da última alteração dos arquivos. Como o md5 atual bate com o congelado e o arquivo não muda de conteúdo sem mudar de `mtime`, isso prova que todas as capturas (incluindo as do balão de artigo, com as quatro citações reais e o painel de demonstração de três estados) já foram feitas em cima da versão final, não da versão anterior. As medições de contraste, overflow e estrutura de título também rodaram depois desse horário, pela mesma técnica (headless navegando no arquivo ao vivo), então valem igualmente contra a versão congelada.

## 9. Texto proibido (verificação feita pelo orquestrador)

O orquestrador rodou a varredura com os termos em mãos (nome de pessoa, inclusive formas parciais e sem acento, e nome de instituição), sem diferenciar maiúscula de minúscula, cobrindo todos os arquivos da pasta do projeto fora de `.git`. Resultado: **encontrados=0, analisados=33, falharam=0**. Os termos não são reproduzidos aqui nem em nenhum arquivo do projeto.

## Resumo dos achados por severidade

- **CRÍTICO 1:** título/marca praticamente ilegíveis no modo escuro (contraste ~1,04:1 a 1,06:1), `--cor-primaria-escura` usada como cor de texto em vez de só fundo, nas três páginas.
- **CRÍTICO 2:** rolagem horizontal real em 360px na aba Resumo de `unidade.html` (overflow de 1064px), causada pela linha do tempo sem contenção no grid de duas colunas.
- **CRÍTICO 3:** selo "em breve" com contraste real de 2,96:1 (abaixo de AA), divergente da cor que `design-visual.md` declara para esse mesmo uso.
- **IMPORTANTE:** salto de nível de título (h1 → h3 → h2) em `home-a.html` e `home-b.html`, no cartão "Continuar de onde parou".
- **COSMÉTICO:** numeração da lista "Nesta página" no índice de `unidade.html` continua de 10 a 12 em vez de reiniciar (`counter-reset: none` não reseta).

## 1. Capturas

22 capturas gravadas em `mockups/capturas/`, todas full-page (altura real do documento, não só a primeira dobra), encontradas=22 analisadas=22 falharam=0:

- 18 obrigatórias: `{home-a,home-b,unidade}-{claro,escuro}-{360,768,1280}.png`.
- 4 do balão de artigo em `unidade.html`, aba Petição comentada: `unidade-balao-demo-1280.png` (painel de demonstração do próprio mockup, com os 3 estados forçados abertos por CSS, sem interação), `unidade-balao-real-aberto-1280.png` e `unidade-balao-real-virado-1280.png` (citação real focada via `.focus()` do DOM, não input simulado, larga em 1280px), `unidade-balao-real-faixa-360.png` (mesma técnica, viewport real 360x740, captura só da tela visível para preservar o posicionamento `fixed`, que uma captura de página inteira deformaria).

Tema forçado por `data-theme` explícito, provado por amostra de pixel real contra o hex declarado em `tokens.css`: fundo do cartão elevado, `#ffffff` no claro vira `rgb(26,31,39)` = `#1a1f27` no escuro (bate exato); fundo da página, `#faf9f5` (`rgb(250,249,245)`) vira `#12161c` (`rgb(18,22,28)`) (bate exato). Tema realmente mudou, não é só o atributo presente sem efeito.

## 2. Conferência item a item

### Item 12, coerência com o guia de compatibilidade (lido por inteiro antes de julgar)

Recursos usados nos mockups e cobertura no guia (`docs/compatibilidade-navegadores.md`):

- `animation-timeline: scroll()` (barra de leitura, `unidade.html:48-53`): envolto em `@supports`, com fallback estático em 38% já presente antes da regra `@supports`. Conforme.
- `env(safe-area-inset-*)` (cabeçalho e rodapé dos três arquivos): usado com segundo argumento `0px` em todas as ocorrências (`padding-top: env(safe-area-inset-top, 0px)` etc.). Conforme.
- `forced-colors: active` (selo "em breve", barras de progresso, alternativa de quiz, botões, cartões de período): presente nos três arquivos com `forced-color-adjust: none` e cores de sistema (`CanvasText`, `Highlight`, `ButtonText`). Conforme, e cobre também `.citacao-artigo`/`.balao-artigo` em `unidade.html:412-430`, que não está na tabela do guia mas segue o mesmo padrão dos demais.
- `prefers-reduced-motion: reduce` (`tokens.css:184-191`): regra global presente. O canvas de fundo da home não está implementado (é reserva, ver `docs/design-visual.md`), então não há animação disparada por JS para checar `matchMedia` — consistente com o que o próprio guia prevê ("não há movimento para reduzir de qualquer forma" nesta fase).
- `prefers-color-scheme: dark` (`tokens.css:99-138`): presente, guardado por `:root:not([data-theme="light"])`. Conforme.
- `viewport-fit=cover` na tag `<meta name="viewport">`: presente nos três arquivos (`home-a.html:5`, `home-b.html:5`, `unidade.html:5`). Conforme.
- Tamanho de fonte do campo de busca (`.busca-topo input`): `font-size: max(1rem, 16px)` nos três arquivos. Conforme com a regra 9 do guia (`font-size` mínimo 16px em mobile).
- `scroll-margin-top`: presente em `[id]` nas duas homes e em `.bloco-resumo`/`.peca h3` em `unidade.html`. Conforme.

**Achado COSMÉTICO:** o guia (seção 9) manda "todo alvo de toque mede pelo menos 44x44px"; ver item 5 abaixo para a medição real dos alvos, que achou elementos abaixo desse piso (o botão de tema tem 40x40, por exemplo) — não é recurso de CSS sem alternativa, mas é desvio da própria regra de codificação que o guia lista.

**Recursos fora do "Baseline" citados no guia como não usados de propósito** (`:has()`, container queries, subgrid, anchor positioning, view transitions, `backdrop-filter`, `color-mix()`/espaços de cor modernos): busca no CSS dos três arquivos e do `tokens.css` não encontrou nenhuma dessas propriedades. Conforme com o que o guia declara.

Nenhuma divergência CRÍTICA ou IMPORTANTE encontrada no item 12 até aqui.

### Item 7, estrutura de títulos (achado IMPORTANTE)

`home-a.html`: ordem de heading no documento é `h1` (linha 380) → **`h3`** (linha 398, `.cartao-continuar h3`) → `h2` (linha 409, `.titulo-secao`). Pula de h1 direto para h3 antes de qualquer h2, porque a seção "Continuar de onde parou" usa `<h3>` e vem, na ordem do documento, antes da seção "Os 10 períodos" que abre com `<h2>`. Mesmo padrão em `home-b.html`: `h1` (379) → `h3` (450) → `h2` (461) → `h3`×3 (466, 471, 476). Salto de nível real (WCAG 2.2, 1.3.1). Correção sugerida: trocar o `h3` do cartão "Continuar de onde parou" por `h2`, ou mover a seção para depois da primeira `h2` da página.
`unidade.html`: ordem correta em toda a página (h1 → h2 → h2 → h2×9 → h3×6 → h3), sem saltos.

### Item 3, contraste (recalculado pela fórmula WCAG 2.2, contra o fundo real do elemento)

Todos os 18 pares TABELADOS em `docs/design-visual.md` batem exatamente com o valor declarado (diferença 0,00 em todos, incluindo o par mais apertado, o acento dourado: 4,65:1 contra o fundo da página e 4,90:1 contra o cartão elevado, ambos confirmados). Sem divergência entre declarado e medido nos pares que o documento cobre.

**Achado CRÍTICO, fora da tabela do design:** o selo "em breve" (`.selo-em-breve`, usado em `home-a.html:126-129`, `home-b.html` equivalente, e dentro de `unidade-inativa`/`cadeira-inativa` nos dois arquivos) usa no CSS real `color: var(--cor-desativado-texto)` sobre `background: var(--cor-desativado-bg)`. Essas variáveis, em `tokens.css:90-91`, valem `#8a8672` sobre `#ece7d6` no modo claro — contraste medido **2,96:1**, abaixo do mínimo WCAG AA de 4,5:1 para texto normal. O `design-visual.md:29` declara um par diferente para esse mesmo uso ("Selo em breve texto / fundo do selo", `#5a5442`/`#ece7d6`, 6,10:1 aprovado), mas essa cor `#5a5442` não existe em `tokens.css` nem é usada em lugar nenhum do CSS: o selo real ficou com a cor genérica de "desativado", não com a cor dedicada que o documento de design descreve. Isso reprova em pelo menos um contexto não-desabilitado: o selo aparece dentro de `<summary>` de período/cadeira (`home-a.html:356-360`), que continua clicável (expande/recolhe), não é um controle desabilitado, então não se qualifica pela exceção de contraste de componente inativo do WCAG. **O que precisa ser feito:** ou o CSS ganha uma variável própria para o selo (ex.: implementar de fato `#5a5442`/`#ece7d6` como o documento descreve), ou o documento de design é corrigido para refletir a cor realmente usada e o par corrigido para passar em AA.

Pares adicionais fora da tabela, só para registro (não são achado, a exceção de "controle desabilitado" do WCAG 1.4.3 se aplica porque `aria-disabled="true"` e `pointer-events:none` estão presentes nesses casos): texto desativado sobre fundo da página, claro, 3,48:1; mesmo par no escuro, 3,75:1 (cartões de período/cadeira genuinamente inativos). Pares de sucesso (revisão do quiz) não tabelados, mas passam com folga (9,61:1 claro, 9,38:1 escuro).

### Item 2, texto cortado/sobreposto/saindo do cartão (verificado por amostragem visual, não por captura inteira)

Amostras inspecionadas: cabeçalho + menu de três níveis (`home-a`/`home-b`, 360, claro), cartões "1º a 3º período" (`home-a`, 360, claro), cabeçalho + índice + bloco 1 do resumo (`unidade`, 1280, escuro), balão aberto e balão virado (`unidade`, 1280, claro), folha inferior do balão (`unidade`, 360 viewport). Em nenhuma dessas amostras há texto cortado, sobreposto ou saindo da borda do cartão. Isto é amostragem dirigida às áreas de maior risco (textos longos, menu aninhado, balão), não inspeção pixel a pixel das 22 capturas inteiras.

### Item 1, rolagem horizontal em 360 pixels (achado CRÍTICO)

Medição real via `document.documentElement.scrollWidth` contra `clientWidth` (headless, 360px), não por inspeção visual (a captura de tela sozinha não revela isso, porque o clipe da imagem já corta em 360px e escode o vazamento):

- `home-a.html`: scrollWidth 360, clientWidth 360, sem overflow. Conforme.
- `home-b.html`: scrollWidth 360, clientWidth 360, sem overflow. Conforme.
- `unidade.html`, aba Resumo: **scrollWidth 1424, clientWidth 360, overflow de 1064px.** Reprova o item 1.
- `unidade.html`, abas Petição comentada e Quiz: sem overflow (360/360).

**Causa raiz confirmada:** `.linha-tempo` (`unidade.html:182`, bloco 2 do resumo) é um `flex` com `overflow-x:auto` e 7 `.marco-tempo` de `flex: 0 0 200px` cada (1400px de conteúdo). Isso teria rolagem PRÓPRIA e contida, mas `.layout-unidade` (`unidade.html:131-134`) é um grid `260px 1fr` sem `min-width: 0`/`minmax(0, 1fr)` na segunda coluna, inclusive no breakpoint de 980px (`unidade.html:433`, que só muda para `1fr` sem adicionar `minmax(0, 1fr)`). Sem essa contenção, o item flex mais largo (a linha do tempo) força a coluna do grid a crescer além do espaço disponível, e o vazamento se propaga para o documento inteiro: captura de evidência em `crops/timeline-real.png` (script de apoio, não faz parte da entrega) mostra a linha do tempo renderizando os 7 marcos lado a lado sem quebra, ultrapassando os 360px da tela. **Correção sugerida:** adicionar `min-width: 0` a `.conteudo-abas` (ou trocar `1fr` por `minmax(0, 1fr)` nas duas ocorrências de `grid-template-columns` que afetam essa coluna, linhas 132 e 433).

### Item 10 e 11, traço longo/médio e emoji

Varredura em `home-a.html`, `home-b.html`, `unidade.html` e `tokens.css`: encontrados=0, analisados=4, falharam=0, para U+2014 (em-dash), U+2013 (en-dash) e para as principais faixas Unicode de emoji (U+1F300–U+1FAFF, U+2600–U+27BF, bandeiras U+1F1E6–U+1F1FF). Nenhuma ocorrência nos 4 arquivos. Conforme.

### Item 5, alvos de toque (medido via `getBoundingClientRect`, 360px)

Amostra de elementos acionáveis, uma leitura por seletor (encontrados/analisados/falharam=0 evidenciados no log de apoio): botão de tema 40x40, itens do menu principal 72-126 largura × 43,5, links de unidade 272x41,5, botão fechar do balão 28x28, gatilho de citação de artigo 190,9x29,9, abas 99-187 × 55,9/84,8, alternativa do quiz 246x128+. Todos acima do piso de 24x24 da checklist, a maioria também acima dos 44x44 recomendados pela Apple (guia de compatibilidade, armadilha 4). Único elemento abaixo de 24px: `kbd.atalho` (o indicador visual da tecla `/`), 21,8 de largura — mas não é ele mesmo o alvo de toque, é decoração dentro do campo de busca (que mede bem mais que 24x24); não conta como achado.

### Item 6, ordem de tabulação e foco visível

`:focus-visible` global em `tokens.css`-equivalente de cada arquivo (contorno de 3px, cor primária) cobre todos os elementos acionáveis, inclusive o gatilho do balão de artigo (`unidade.html:237`, ajuste só de `outline-offset`). Ordem de tabulação é a ordem do documento, sem `tabindex` fora do padrão, exceto `tabindex="-1"` nos itens do painel de demonstração do balão (`unidade.html:684,695,707,712`), que é o uso correto (remove da navegação um bloco que é só referência visual, não conteúdo real da petição). Sem achado.

### Item 8, balão de artigo

Existe, mostra diploma + número do artigo (cabeçalho), texto do artigo (corpo) e fonte com o ano da lei (rodapé, ex.: "Lei nº 10.406/2002"). Não empurra conteúdo (posicionamento `absolute`/`fixed`, fora do fluxo). Tem estado de tela estreita (folha inferior fixada, confirmado por captura real em viewport 360x740, não apenas pela demonstração estática da aba). Sem achado.

### Item 9, texto proibido

Aguardando os dois termos exatos (nome do professor e nome da instituição) do orquestrador, pedidos por `SendMessage`. Preenchido assim que a resposta chegar.

### Achado adicional CRÍTICO fora da lista original (escopo próprio do QA, L-13): texto de título ilegível no modo escuro

Medição de pixel real (não estimativa), `unidade-escuro-1280.png`: o glifo do `h1.titulo-unidade` mede `rgb(12,25,44)` (≈ `#0c192c`), quase idêntico ao valor declarado de `--cor-primaria-escura` no modo escuro (`#0b1a2c`, `tokens.css:112`). O fundo da página atrás dele mede `rgb(18,22,28)` (`#12161c`, bate com `--cor-fundo` escuro). **Contraste medido pela fórmula WCAG 2.2: 1,04:1** (mínimo exigido: 4,5:1 texto normal, 3:1 texto grande). A marca "Caderno de Direito" no cabeçalho tem o mesmo problema contra o fundo do cabeçalho (`#1a1f27`): **1,06:1**. Texto praticamente invisível, confirmado visualmente em `unidade-escuro-1280.png` (os títulos aparecem como uma mancha quase da cor do fundo).

**Causa raiz:** `--cor-primaria-escura` é comentada em `tokens.css:74` como destinada a "cabeçalho, hero, botão primário" — ou seja, pensada para uso como FUNDO (por trás de texto branco, caso do `.botao-primario`, que continua correto). Só que o mesmo token também foi usado como `color:` (texto) em muitos seletores dos três arquivos, o que funciona bem no modo claro (contraste alto, texto escuro sobre fundo claro) mas falha no modo escuro porque o token vira um azul quase preto (`#0b1a2c`) que se confunde com o próprio fundo escuro. `docs/design-visual.md` nunca lista `--cor-primaria-escura` como par de texto no modo escuro (só lista "Primária" `#7fa8d6`), então o problema não foi pego na tabela de contraste declarada.

**Abrangência (grep pelas três páginas), tudo em modo escuro:**
- `home-a.html:54,179,192,203,243,251` — marca do cabeçalho, `h1` do hero, botão secundário, `h2.titulo-secao`, `h3` do cartão "continuar", citação em destaque.
- `home-b.html:53,175,186,216,232,245` — mesmos pontos, mais `h3` dos três cartões "O que tem em cada unidade".
- `unidade.html:73,126,167,177,193,199,206,217,274,356,362,384` — marca, `h1.titulo-unidade`, aba selecionada, `h2.titulo-bloco` (todos os 9 blocos do resumo), cabeçalho da tabela comparativa, citação em destaque, `h3` da petição (todos os 6), rótulo dos comentários laterais, cabeçalho do balão de artigo, selo de categoria do quiz, enunciado da pergunta, título do estado final.

**O que precisa ser feito:** criar uma variável de texto dedicada para título/marca (algo como `--cor-titulo-texto`, clara no escuro e escura no claro) e trocar essas ocorrências de `color: var(--cor-primaria-escura)` por ela, deixando `--cor-primaria-escura` só como cor de fundo.

### Achado adicional COSMÉTICO fora da lista original (escopo próprio do QA, L-13)

`unidade.html:505`, índice lateral, segunda lista (`<ol style="counter-reset: none;">`, "Nesta página"): `counter-reset: none` é um valor CSS válido que significa "não reinicia o contador", não "sem numeração". Como a primeira lista (`aside.indice ol`, `unidade.html:144`) já usa `counter-reset: bloco` e chega a 9, a segunda lista herda a numeração e mostra os itens "Resumo", "Petição comentada" e "Quiz" como 10, 11 e 12 em vez de reiniciar em 1 (visível na captura, confirmado por `crops/timeline-overflow-full.png`, script de apoio). Correção sugerida: `counter-reset: bloco 0` (reinicia de fato) ou remover a numeração dessa lista com `list-style` sem contador.
