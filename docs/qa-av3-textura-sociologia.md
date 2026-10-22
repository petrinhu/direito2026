# QA da AV3 (Sociologia Jurídica u3, Introdução ao Direito u3 "A textura aberta do direito") e dos rótulos AV1/AV3

Rodada local, antes da publicação. Artefato congelado no HEAD `fe65616`, construído em worktree de scratch (`.worktrees/qa-av3`, fora do git). Navegadores dentro de caixa `bwrap` (sem `/dev/nvidia*`, sem `/dev/dri`, sem `/run/user`, `XDG_RUNTIME_DIR` e `TMPDIR` próprios), headless. Vigia de conexões ao socket do host ativo durante a rodada. Capturas e logs em `/var/tmp/qa-av3/` (fora do repositório).

## Congelamento (L-13)

- HEAD no início: `fe65616bdafaab85358e187170e3ba39574cdd7d`. `git status --short` no início: `?? mockups/selo-home.html` (não é deste QA).
- `dist/` construído na worktree: 115 arquivos. md5 da lista (`find dist -type f | sort | xargs md5sum | md5sum`): início `e4bb20b227f47fad0f00a36cb3e84765`, fim `e4bb20b227f47fad0f00a36cb3e84765` (iguais).
- HEAD no fim: `488b9366e6d0e1e0eac60d6442ac7f5a058666c4`. Um commit novo entrou em `main` durante a rodada (`fix(busca): portão do índice mede o tamanho comprimido, como pede a RI6`, 01:05:18), por fora deste QA. O artefato testado continua sendo `fe65616`, que é ancestral do novo HEAD. Este QA não auditou `488b936`.
- Fim de `git status --short`: `?? docs/qa-av3-textura-sociologia.md` (este relatório) e `?? mockups/selo-home.html`. Nada mais foi alterado na árvore.
- Diff de escopo `d64bd67..fe65616`: 83 arquivos, 4618 inserções e 281 remoções; tudo em `src/`, `tests/`, `docs/` e `scripts/`.

## Build: gate do índice de busca vermelho em fe65616 (CRÍTICO 1)

- Em `fe65616`, `scripts/gerar-indice-busca.ts` sai com código 1: "índice passou do teto de 307200 bytes (seção 7, RI6)". Tamanho medido sem compressão: **349.849 bytes**, 170 documentos indexados. No commit base `d64bd67` o índice tem 281.316 bytes e o gate passa. O aumento vem do texto integral da Hart entrando na busca.
- Consequência em `fe65616`: `npm run build` aborta nesse passo, antes de `vue-tsc`, `validar-conteudo`, `vite build` e os demais portões. O `dist/` deste QA saiu com `npx vite build` direto, como pedido.
- Estado no novo HEAD: `488b936` muda o portão para medir o tamanho comprimido. Não verifiquei se o gate passa nele nem se o índice comprimido cabe; a checagem fica para o orquestrador antes de publicar.

## Automação executada (`/var/tmp/qa-av3/checks.mjs`, Playwright com teclado real, axe-core do projeto)

### Seção A, menu lateral: Chromium 13/13, Brave 13/13, Firefox 6/13
- Enter abre e Espaço fecha período; Introdução abre por Enter; AV1, Interdisciplinar e AV3 aparecem; toggle do AV3 com `aria-expanded` e rótulo "Mostrar submenu de AV3"; Livro e o link "A textura aberta do direito" aparecem, com `aria-current="page"` no link da rota atual; "Material de estudo" com "em breve" aparece sob AV3; foco visível em Chromium (outline sólido 2 px); nenhuma "Unidade 1/3" no menu; 360 px sem rolagem horizontal.
- Escape fecha o ramo "Livro" aberto (comportamento de disclosure; não há exigência declarada).
- Ao carregar a rota, a árvore começa fechada e não se abre até a rota atual. Comportamento observado; a confirmar com o líder se é o desejado.
- Firefox: as 7 falhas são de ativação por teclado no driver BiDi (ver Notas).

### Seção B, texto integral: 30/30 em Chromium, Brave e Firefox
- Em 1280 e 360, nos três modos (claro, escuro, adaptado): título "A textura aberta do direito"; fonte "HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1..."; 30 parágrafos; 30 itálicos; 16 marcadores [p. N] (primeiro [p. 137]); 1 subtítulo; sem `##`, sem `](`, sem tags cruas; sem rolagem horizontal; sem erro de console.
- Os asteriscos `(*)`, `(**)` e `(***)` são marcadores de nota do original, não marcação crua.

### Seção C, abas, trilha, quiz, mapa, fichamento, mnemônicos: 30/33 em cada navegador
- Hart: as 6 abas abrem (Resumo, Texto integral, Mapa mental, Fichamento, Mnemônicos, Quiz). A rota base do tópico é o Resumo; `/resumo` não existe e responde "Página não encontrada" (a entrada correspondente em `rotas.esperado.json` não corresponde a uma aba).
- Sociologia u3: as 5 abas abrem (Resumo, Mapa mental, Fichamento, Mnemônicos, Quiz). Não há aba "Texto integral"; `/texto` responde "Página não encontrada", o que é coerente. A lista `rotas.esperado.json` tem `/texto` para essa unidade, o que é inconsistência do catálogo.
- Quiz Hart (30) e quiz Sociologia u3 (40): responder três perguntas mostra veredito, explicação, avança a posição ("Pergunta 3 de 30" e "de 40") e soma o placar.
- Mapa de Hart e de Sociologia u3: SVG com 30 e 32 grupos com `aria-expanded`; clique abre ramo. Não usa `role=tree`; a navegação por setas não foi confirmada nessas duas rotas.
- Fichamento: Hart com 1 ficha; Sociologia u3 com 3. A ficha abre (teste corrigido para `h4 button`; a primeira versão apontava o botão "Abrir todos os ramos").
- Mnemônicos: Hart com 5 botões e 8 cartões; Sociologia u3 com 5 e 9. Revelar troca o rótulo para "Esconder a resposta".
- Os 3 testes vermelhos são a trilha (IMPORTANTE 1), nos três navegadores.

### Seção D, regressão: 6/6 em cada navegador
- Intro u1, Redação u1, Sociologia u1, Filosofia u1 e u3 abrem, com h1, abas, sem erro de console e sem "Unidade 1/3". Home com 4 ocorrências de AV1 e 3 de AV3, nenhuma "Unidade 1/3".

### Seção E, axe-core nas 11 rotas novas x claro/escuro/adaptado x 1280/360 (66 combinações)
- WCAG 2.x A/AA: **zero** em todas as combinações, nos três navegadores.
- Com todas as regras (inclui boas práticas): 102 violações moderadas, nos três navegadores: `region` no `.aviso-legal` (2 nós), `heading-order` nos enunciados do quiz (`#enunciado-N`) e no quadro-resumo do tópico, `landmark-unique` no quadro-resumo.
- As mesmas regras aparecem em rotas antigas intocadas (Filosofia u1 base e quiz, Sociologia u1 quiz, Intro u1 quiz): pré-existentes no HEAD. O precedente registrou zero porque, ao que parece, rodou sem as boas práticas. Reporto os dois números.

### Seção F, offline com service worker: 9/9 em Chromium e Brave
- As 9 rotas novas (texto, mapa, fichamento, mnemônicos, quiz de Hart; mapa, fichamento, mnemônicos, quiz de Sociologia u3) abrem sem rede depois de visitadas online. Em 4 delas, o tamanho do texto offline é igual ao online.
- Firefox: não aplicável (BiDi puro sem emulação de rede).

### Suíte e2e existente (`npx playwright test --project=blink --workers=2`, headless, bwrap)
- No HEAD `fe65616`: **293 passaram, 68 falharam, 36 pularam**.
- Os 68 falhos, por causa:
  - **Defeito de teste, seletor velho (10):** `menu-recuo.spec.ts` (9) e `abas-novas-navegacao.spec.ts:44` (1) procuram "Mostrar submenu de Unidade 1", rótulo que o produto não usa (agora AV1). Mesmo resultado em `d64bd67`.
  - **Pré-existente no HEAD, em rotas antigas (29, idênticos em `d64bd67` com os mesmos specs):** `modo-adaptado-cabecalho` (13 em rotas antigas: cabeçalho fixo com 266 px contra o teto de 256 px a 320 px, inclusive na home), `quiz-sem-rolagem-lateral` (10 em rotas antigas: clique forçado no radio que não muda o estado, em Intro u1, Sociologia u1, Redação u1 e Filosofia u1 e u3), `quiz-verdadeiro-ou-falso-selo` (6: Filosofia u3 sem cartão com selo, esperado 20). Não diagnostiquei a causa de cada uma.
  - **Novo, nas rotas da AV3 (29 testes):** `modo-adaptado-cabecalho` (14, títulos das rotas novas), `responsividade-360` (11, cabeçalho e trilha em modo adaptado) e `quiz-sem-rolagem-lateral` (4, quizzes novos). Ver IMPORTANTE 2.
- Comparação: os 5 specs de layout foram rodados em `d64bd67` com os mesmos arquivos de teste. Falharam os mesmos 67 títulos (conjunto idêntico), sem nenhuma falha exclusiva do HEAD. Logo, nas rotas antigas, a AV3 não introduziu falha nova. Nas rotas novas, as 29 falhas não têm comparação (as rotas não existiam em `d64bd67`).

## Achados (defeitos de produto)

### CRÍTICO 1. `npm run build` aborta no gate do índice de busca (fe65616)
- Medido: 349.849 bytes contra teto de 307.200. Base `d64bd67`: 281.316 bytes, gate verde. Ver seção Build. Status no novo HEAD `488b936`: não verificado.

### IMPORTANTE 1. Trilha do tópico não mostra Período, Cadeira, AV3 e Livro em 1280, 390 e 360 px
- Rota: `/p/p1/intr-direito/u3-livro-textura-aberta/texto` e demais abas do tópico. Exibido: "A textura aberta do direito > Texto integral". Pedido: "Período > Cadeira > AV3 > Livro > A textura aberta do direito > aba".
- Medido: o contêiner da trilha tem 363 px em 1280 e 366 px em 390. Pela regra de corte por contêiner, os níveis ficam com `display: none` até restarem 2.
- Pré-existente: a mesma largura corta a trilha das unidades antigas (Filosofia u1 mapa a 1280: "AV1 > Mapa mental"; Sociologia u3 quiz a 1280: "AV3 > Quiz"). Em 1920 a trilha completa aparece. A AV3 nova, com 6 níveis, torna o corte mais evidente.
- Acessibilidade: os níveis ocultos saem da árvore de acessibilidade.
- Decisão de desenho para o líder (corte, quebra em linhas ou trilha completa). Captura `trilha-1280-explora.png`.

### IMPORTANTE 2. Layout com modo adaptado nas rotas novas (e2e, 29 testes)
- Trilha do cabeçalho em modo adaptado a 656 px: a página atual "Resumo" fica "coberta por outro elemento" (`responsividade-360.spec.ts:189`, rota de Hart). Com a trilha de 6 níveis no modo adaptado, o cabeçalho cresce até 286 px a 1280 (medido em `mnemonicos` e `fichamento` de Hart).
- Controle do cabeçalho coberto: em 360 px, modo adaptado, o botão "Tema" fica coberto por "outro elemento no centro" na rota de Hart (`responsividade-360.spec.ts:139`); não ocorre na Sociologia u1 no mesmo tamanho. Causa provável: o cabeçalho mais alto empurra o controle para baixo do cartão de prazo (IMPORTANTE 3). Não confirmado por medição de `elementFromPoint` nesta rodada.
- Esses testes falham nas rotas novas e não em `d64bd67`, porque as rotas não existiam lá.

### IMPORTANTE 3. Cartão flutuante de prazo cobre leitura e alternativas do quiz (1280 e 360)
- Cartão fixo "24 dias para o fim das provas online..." (Minimizar e Abrir o calendário). Nas rotas novas, em 1280, cobre cerca de um terço das linhas do texto integral (claro e escuro) e corta parte do texto das alternativas do quiz de Hart (captura `quiz-Hart-3resp.png`, "Aplicar a regra a todos os casos..."). Em 360 cobre 4 a 6 linhas do texto integral; em modo adaptado cobre o meio da página (`texto-360-adaptado-meio.png`).
- Minimizável, o que mitiga. É widget do site inteiro (aparece também na home e no mapa); manter ou não nessas rotas é decisão de produto.
- No modo adaptado a 360, o botão fixo "Home" sobrepõe o final das linhas do texto.

### IMPORTANTE 4. Suíte e2e vermelha no HEAD (68 falhas, ver a seção da suíte)
- Parte é defeito de teste (seletor velho "Unidade 1", 10 testes); parte é pré-existente e não vem da AV3 (29 testes, idênticos em `d64bd67`); e 29 são novas nas rotas da AV3 (IMPORTANTE 2). Gate de CI vermelho bloqueia (L-36).

### COSMÉTICO 1. Trilha em "Leitura ampliada" a 1280 ocupa 4 linhas
- Com o modo adaptado ligado, a trilha mostra os 6 níveis e empurra o conteúdo para baixo. Funciona. Captura `texto-1280-adaptado-topo.png`.

### COSMÉTICO 2. Alinhamento de "Material de estudo" no menu
- Em `CH-menu-intr-av3-livro-1280.png`, "Material de estudo" (com "em breve") começa à esquerda do nível dos filhos de AV3, não alinhado ao recuo do ramo.

### COSMÉTICO 3. Campo "Período" do fichamento mostra o bloco
- Em Hart, a ficha mostra "PERÍODO: Bloco 2: A textura aberta, A textura aberta da linguagem". Conteúdo, para revisão editorial.

## Capturas olhadas (o que se vê)

Capturas de texto, mapa, fichamento, quiz, trilha e home foram gravadas pela última execução do Firefox (seção A a D); as do menu em Chromium têm o prefixo `CH-`.
- `texto-1280-claro-topo.png`: título, fonte, parágrafos, itálicos e [p. 137] discretos; leitura confortável; cartão de prazo à direita do texto.
- `texto-1280-escuro-topo.png`: mesmo layout no tema escuro; contraste bom; cartão presente.
- `texto-1280-adaptado-topo.png`: fonte grande, espaçamento amplo, trilha em 4 linhas; título sem palavra partida.
- `texto-360-claro-topo.png`: coluna única, sem rolagem horizontal; cartão ocupa o meio da tela.
- `texto-360-adaptado-topo.png`: título e fonte em coluna, palavras inteiras; cartão cobre parte do texto.
- `texto-360-adaptado-meio.png`: palavras inteiras; "Home" sobre o fim de uma linha.
- `CH-menu-intr-av3-livro-1280.png`: árvore 1º período > Introdução > AV1, Interdisciplinar, AV3 > Livro > A textura aberta; "em breve" visível; foco visível em "Livro". Ver COSMÉTICO 2.
- `CH-menu-360-aberto.png`: gaveta do menu a 360 com a mesma árvore, legível.
- `trilha-390.png`: cabeçalho "A textura aberta do direito / Texto integral" (IMPORTANTE 1).
- `mapa-Hart-1280.png`: "Ver em lista", "Abrir todos os ramos", "Centralizar" e o mapa com "Bloco 1: Comunicar padrões de conduta" e "Bloco 2"; cartão de prazo no canto direito.
- `fichamento-Hart-1280.png`: filtros, "1 ficha", primeira ficha aberta com PERÍODO e OBRAS DE REFERÊNCIA (COSMÉTICO 3).
- `quiz-Hart-3resp.png`: "Pergunta 3 de 30", "Acertos: 0 de 3", "Falhas: 3 de 3"; veredito "Sua resposta, incorreta" e "Correta" na alternativa certa; cartão encobre parte das alternativas (IMPORTANTE 3). Os cliques de teste escolheram sempre a primeira alternativa.
- `home-1280.png` e `home-360.png`: tela inicial com citação e selo; os cartões de cadeira ficam abaixo da dobra e não foram capturados (pendência).
- Não olhadas uma a uma: `texto-1280-claro-inteiro.png` (3,3 MB, página inteira), mapa e fichamento de Sociologia u3, quiz de Sociologia u3, `probe-soc-u3.png`.

## Notas de método

- Firefox (seção A, 7 falhas): o driver BiDi entrega as teclas à página (`keydown` e `keypress` chegam; Tab move o foco), mas Enter e Espaço não disparam o clique do botão, e a janela fica sem `hasFocus` em headless. Essas falhas são de ativação por teclado, não confirmadas; não as atribuo nem ao produto nem ao teste.
- Firefox: `:focus-visible` ficou falso depois de Tab no botão do menu (outline `none`), enquanto no Chromium o mesmo passo dá contorno sólido de 2 px. Sem janela visível (L-50), o foco visível no Firefox fica como pendência de verificação, não como defeito.
- Vigia: o primeiro vigia abortou às 00:52:12 com um processo não identificado que conectou ao socket do host e sumiu antes da leitura. Log arquivado em `/var/tmp/qa-av3/res/vigia-inc1.log`; vigia reiniciado. Nenhum dos processos do QA tem acesso a `/run/user` (tmpfs no bwrap). Registrado como ocorrência.
- Base `d64bd67` foi construído em worktree de scratch só para a comparação da suíte e removido depois.

## Pendências

- Captura de página inteira da home (cartões de cadeira com AV3).
- Verificar o gate do índice em `488b936` (novo HEAD).
- Foco visível e ativação por teclado no Firefox, com janela (L-50 impede hoje).
- Decisões para o líder: trilha do cabeçalho (IMPORTANTE 1); cartão de prazo nas rotas de leitura (IMPORTANTE 3); corte ou fatiamento do índice, se o gate de `488b936` não passar.

## Rodada 2 (HEAD `b2d3f32`, revisão dos consertos 36cd1cd e b2d3f32)

Revisão de conserto feita por este QA (L-12). Cópia isolada em `.worktrees/qa-av3` (fora do git), navegadores em bwrap, headless, vigia ativo e sem aborto nesta rodada.

### Congelamento
- HEAD no início e no fim: `b2d3f323161b7ff81afabd841fc838840fb86d60` (main). `git status --short` no início e no fim: só `?? mockups/selo-home.html` (não é deste QA).
- `dist/` (115 arquivos): md5 `26afa8f18273d0bc190ed9a7429a896d` no início (após o build) e no fim.

### Diff revisado
- `36cd1cd` (trilha de tópico de grupo): o tópico vira um item só, "Livro da AV3", com link para a cadeira. Antes eram três itens (AV, grupo e título). O título continua no h1 e no menu.
- `b2d3f32` (seletores e2e): `menu-recuo.spec.ts` e `abas-novas-navegacao.spec.ts` deixaram de buscar "Mostrar submenu de Unidade 1" e passam a buscar "Mostrar submenu de AV1". Duas linhas no helper de menu-recuo e uma em abas-novas.
- `488b936` (portão do índice, gzip): o portão passa a medir o tamanho comprimido.

### Build (`npm run build`, aceite: exit 0 com portão do índice passando)
- Exit 0. O portão imprime bruto e comprimido: `tamanho bruto do índice: 349849 bytes` e `tamanho comprimido do índice (gzip -9): 80302 bytes (teto 307200 bytes comprimidos)`. Passa.
- O pendente da rodada 1 (gate em `488b936`) está resolvido nesta medição.

### Suíte e2e (`npx playwright test --project=blink --workers=2`, headless, bwrap)
- 319 passaram, 42 falharam, 36 pularam (7,5 min).
- Os 42 falhos estão todos no conjunto conhecido (ver abaixo). Nenhum título fora do conjunto.

### Aceite
1. **16 testes da regressão de Hart: todos passam.** `modo-adaptado-cabecalho` em modo adaptado (5 de 5), `responsividade-360:139` em modo adaptado (5 de 5), `responsividade-360:189` em modo adaptado (5 de 5) e `responsividade-360:189` em `/mnemonicos` modo normal (1 de 1).
2. **10 testes de seletor "Unidade 1" para AV1: todos passam.** 9 de `menu-recuo` e 1 de `abas-novas-navegacao`.
3. **Falhas restantes, 42, todas no conjunto conhecido:**
   - 29 pré-existentes de `d64bd67` (medidos com os mesmos specs): `modo-adaptado-cabecalho` em rotas antigas (13, inclusive a home, com cabeçalho fixo de 266 px contra teto de 256 px a 320 px); `quiz-sem-rolagem-lateral` em rotas antigas (10); `quiz-verdadeiro-ou-falso-selo` em Filosofia u3 (6).
   - 13 de causa antiga nas rotas novas: `modo-adaptado-cabecalho` em modo normal a 320 px (9: Hart u3 em 5 entradas, Sociologia u3 em 4; mesmo cabeçalho de 266 px das rotas antigas) e `quiz-sem-rolagem-lateral` nos quizzes novos (4: Introdução u3 e Sociologia u3, em 320 normal e 360 adaptado).
   - Ressalva de transparência: o conjunto de `d64bd67` não tem as rotas novas (elas dão 404 lá), então as 13 de rotas novas são classificadas por padrão e medição de causa, não por comparação direta.

### Capturas olhadas (em `/var/tmp/qa-av3/caps/`, fora do repositório)
- `r2-texto-1280-adaptado-topo.png`: trilha completa em 4 níveis ("1º período > Introdução ao Direito > Livro da AV3 > Texto integral"), cabeçalho de 200 px (antes 286 px), título e fonte visíveis e sem palavra partida. O cartão de prazo ainda cobre parte do texto à direita (IMPORTANTE 3).
- `r2-texto-360-adaptado-topo.png`: trilha completa, em 4 linhas, sem corte; cabeçalho de 382 px. O cartão de prazo cobre a segunda linha do título ("A textura" visível antes do cartão).
- `r2-texto-360-adaptado-meio.png`: o botão "Home" fixo sobrepõe a palavra "de" no fim da linha, e o cartão de prazo cobre quatro linhas do texto (IMPORTANTE 3).
- `r2-trilha-mapa-1280-normal.png`: no modo normal a 1280, a trilha mostra só "Livro da AV3 > Mapa mental" (1º período e Introdução com `display: none`). IMPORTANTE 1 persiste no modo normal a 1280; não estava na lista de aceite desta rodada.

### Veredito da rodada 2: APROVADO nos critérios de aceite (build, 16 + 10 testes, e nenhum título fora do conjunto)
Defeitos abertos que não são critério desta rodada:
- IMPORTANTE 1: trilha no modo normal a 1280 px mostra 2 de 4 níveis (corte por contêiner). O modo adaptado já mostra os 4.
- IMPORTANTE 3: cartão de prazo e botão "Home" cobrem o texto integral e as alternativas do quiz (1280 e 360).
- Firefox: ativação por teclado e foco visível continuam sem verificação (BiDi e L-50).
- Itens da rodada 1 (COSMÉTICO 1 a 3) continuam valendo.
