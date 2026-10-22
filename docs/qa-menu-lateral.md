# QA do menu lateral (medição rápida)

Rodada de medição rápida, pedida pelo líder em 22/10/2026 ("Medição rápida", sem capturas e sem rodada completa de QA). Escopo: menu lateral (`MenuCurriculo.vue`) em 1280 px, nos modos claro, escuro e leitura ampliada.

## 1. Congelamento (L-13)

- HEAD no início: `3b15875dec88a60a68ed1dc398d51ef95b0ab39f` (main, `fix(menu): Resumo e Petição navegam pelo rótulo e expandem pela seta`).
- `git status --short` no início (árvore principal): `?? mockups/selo-home.html` (não é deste QA).
- Cópia isolada: `.worktrees/qa-menu`, criada com `git worktree add` no HEAD `3b15875`. `node_modules` da cópia é link simbólico para o `node_modules` do projeto.
- Build: `node --import tsx scripts/gerar-dispositivos-por-unidade.ts` (exit 0) e `npx vite build` (exit 0), com `TMPDIR=/var/tmp`.
- md5 de `dist/` (`find dist -type f | sort | xargs md5sum | md5sum`), no início da medição: `a4bda5a52bcf79622ac71c3ab3993ebe`.
- Servidor: `npx vite preview --port 4199 --strictPort` na cópia, log em `/var/tmp/qa-menu/preview.log`. A porta 4173 não foi usada.

## 2. Processo (L-50, L-51, L-57)

- Navegador: Chromium já instalado (`/usr/bin/chromium-browser`, 155.0.8059.84), headless, dentro de caixa `bwrap` (`/dev` mínimo, sem `nvidia*` nem `dri`; `/run` vazio, sem `/run/user`; `WAYLAND_DISPLAY` e `DISPLAY` vazios; `XDG_RUNTIME_DIR` e `TMPDIR` próprios em `/var/tmp/qa-menu/`). Isolamento provado por sonda antes da medição.
- Perfil descartável: um contexto novo por modo e por alvo, sem perfil do líder. Nada instalado, nada baixado, sem janela visível, sem automação de foco.
- Medição: `/var/tmp/qa-menu/medir/medir.mjs` (fora do repositório). Cliques são reais (Playwright). Nenhum atributo de tema ou de modo foi gravado à mão: os modos vieram dos botões "Tema ..." e "Leitura ampliada".
- Rota medida: `/p/p1/intr-direito/u3-livro-textura-aberta/texto`. Árvore aberta por clique em todos os níveis (31 cliques, nenhum botão pendente).
- Dados brutos: `/var/tmp/qa-menu/medicao-{claro,escuro,ampliada}.json`, `teclado-*.json`, `hover-modos.json`, `interacao.json`.

## 3. Resultado

**Veredito: REPROVADO**, por dois desvios: D1 (hierarquia de tamanho invertida em leitura ampliada) e D3 (setas de Resumo e Petição com 26 px de largura, quando o próprio CSS exige 44 x 44 no modo adaptado). Interação, hover e foco por teclado passaram.

O menu tem 169 itens visíveis com a árvore toda aberta (1 calendário, 10 períodos, 5 cadeiras com conteúdo e 9 "em breve", o resto de unidades, abas, blocos e tópicos).

### 3.1 Tipografia por nível e tipo (1280 px, árvore toda aberta)

Claro e escuro dão os mesmos valores de fonte, tamanho, peso, cursor e geometria. Só a cor de fundo do tema muda, e as cores de texto por nível também são as mesmas nos dois.

| Nível / tipo | Fonte | Tamanho | Peso | Cor (claro = escuro) | Cursor | Alvo (w x h) |
|---|---|---|---|---|---|---|
| topo / Calendário | Inter | 17 px | 400 | rgb(250,249,245) | pointer | 280 x 45 |
| 1 / período (n=10) | Cormorant Garamond | 20 px | 700 | rgb(250,249,245) | pointer | 280 x 44 |
| 2 / cadeira, restrita (n=5) | Cormorant Garamond | 19 px | 600 | rgb(230,211,160) | pointer | 259 x 44 a 64 |
| 2 / "Sem cadeira publicada" (n=9) | Cormorant Garamond | 19 px | 600 | rgb(184,192,204) | auto | 259 x 64 |
| 3 / AV3 (n=1) | Inter | 14 px | 400 | rgb(169,200,234) | pointer | 238 x 44 |
| 3 / unidade, AV1 e AV3 (n=6) | Inter | 14 px | 400 | rgb(169,200,234) | pointer | 206 x 44 |
| 3 / atalho para Interdisciplinar (n=4) | Inter | 14 px | 400 | rgb(169,200,234) | pointer | 206 x 44 |
| 4 / Livro, Material de estudo, Quiz, Mapa, Fichamento, Mnemônicos (n=17) | Inter | 14 px | 400 | rgb(195,207,221) | pointer | 217 x 44 |
| 4 / Resumo, Petição (rótulo, n=8) | Inter | 14 px | 400 | rgb(195,207,221) | pointer | 191 x 44 |
| 5 / blocos de Resumo e seções de Petição, tópicos (n=94) | Inter | 13 px | 400 | rgb(167,180,198) | pointer | 190 x 44 a 82 |

Setas (seta de unidade, seta de Resumo, seta de Petição): não têm texto, usam a fonte padrão do botão (Arial 13,33 px). Não há desvio visível.

Dentro de cada nível e tipo com texto, os valores são iguais em todos os itens. Livro e Material de estudo, abas de nível 4 e AV3 contra unidades têm a mesma fonte, tamanho, peso e cor.

### 3.2 Tipografia em leitura ampliada (1280 px, tema claro)

| Nível / tipo | Fonte | Tamanho | Peso | Cor | Alvo (w x h) |
|---|---|---|---|---|---|
| topo / Calendário | Inter | 24 px | 500 | preto | 280 x 59 |
| 1 / período | Inter | 24 px | 500 | preto | 280 x 59 |
| 2 / cadeira e "Sem cadeira" | Inter | 21 px | 500 | preto | 259 x 54 a 92 |
| 3 / AV, unidade, atalho | Inter | 14 px | 500 | preto | 194 a 238 x 44 |
| 4 / Livro, Quiz, Mapa, Resumo, Petição | Inter | 14 px | 500 | preto | 179 a 205 x 44 a 66 |
| 5 / blocos, seções, tópicos | Inter | 18 px | 500 | preto | 178 x 48 a 275 |

Na leitura ampliada a família passa para Inter em todos os níveis (o Cormorant some), e a cor fica preta em tudo. Isso é uniforme.

### 3.3 Desvios

**D1. Hierarquia de tamanho invertida em leitura ampliada (tipografia, REPROVA o critério).** No nível 3 e no nível 4 o texto mede 14 px, e no nível 5 mede 18 px. O nível 5 fica maior que os dois níveis acima dele. Causa medida no código:
- Nível 5 usa `font-size: var(--escala-xs)` (`src/ui/componentes/MenuCurriculo.vue`, bloco `.menu-curriculo__nivel-5 > li > a`). A leitura ampliada troca `--escala-xs` de 13 px para 18 px (`src/ui/estilos/tokens.css:481`, valores fixados pelo líder).
- Nível 3 usa `font-size: 0.875rem` fixo (mesmo arquivo, bloco `.menu-curriculo__nivel-3 > li > .menu-curriculo__linha ...`), que não escala no modo ampliado.
- Nível 4 não tem regra própria de tamanho para o texto: mede 14 px, herdado. Não rastreei até a origem exata.

**D2. Níveis 3 e 4 têm o mesmo tamanho nos dois modos (14 px).** O comentário do CSS diz que "cada nível usa fonte um pouco menor que o pai". Medido: o nível 4 não é menor que o 3. Desvio em relação à intenção escrita, não à regra de leitura.

**D3. Alvo abaixo de 44 px de largura nas setas de Resumo e Petição (8 setas, nos três modos).** Medido em leitura ampliada: 8 de 8 setas de Resumo e Petição têm 26 px de largura. Altura: 44 px nas de Resumo e 66 px nas de Petição. Em claro e escuro a largura também é 26 px. Nenhum outro alvo clicável mede menos de 44 px em leitura ampliada. As setas de unidade medem 44 x 44 nesse modo (32 px no modo normal).

**D4. Calendário fora de qualquer nível.** Único item de seu tipo, com fonte e tamanho próprios (17 px no normal, 24 px no ampliado). Não há contra quem comparar; registro para decisão de desenho.

**Observação de cobertura (não de estilo).** O "Texto integral" não aparece no menu. Com a árvore toda aberta, nenhum dos 169 itens tem esse texto. O tópico "A textura aberta do direito", em Livro, é um link simples (nível 5) para a rota, sem abas. As abas Mapa, Fichamento, Mnemônicos e Quiz aparecem no menu só para unidades (Sociologia u3, Introdução u1). O critério "Texto integral vs demais abas" não se aplica como comparação de estilo, porque o item não existe na árvore.

**Observação sobre "em breve".** Hoje o único "em breve" do menu está no nível 2 ("Sem cadeira publicada", em 9 períodos sem cadeira). Não há "em breve" nos níveis 3, 4 ou 5. "Material de estudo" não é "em breve": tem um tópico e expande.

### 3.4 Interação (1280 px, tema claro, por clique real)

| Tipo (rótulo) | Esperado | Medido |
|---|---|---|
| Período | expande | expande (aria-expanded false -> true), URL igual |
| Cadeira (Introdução) | expande | expande, URL igual |
| AV3 | expande | expande, URL igual |
| Livro | expande | expande, URL igual |
| "Sem cadeira publicada em breve" | nada | nada (sem efeito) |
| Unidade (AV1, rótulo) | navega | navega para `/p/p1/intr-direito/u1` |
| Seta de unidade | expande | expande |
| Resumo (rótulo) | navega | navega para `/p/p1/intr-direito/u1` |
| Seta de Resumo | expande | alterna (aria-expanded true -> false, com a aba pré-aberta) |
| Petição comentada (rótulo) | navega | navega para `.../u1/peticao` |
| Seta de Petição | expande | alterna (true -> false, pré-aberta) |
| Mapa mental, Fichamento, Mnemônicos, Quiz | navega | navega (cada um para a rota da aba) |
| Bloco de Resumo | navega | navega |
| Tópico do Livro | navega | navega para `/p/p1/intr-direito/u3-livro-textura-aberta` |
| Calendário | navega | navega para `/calendario` (medido a partir de outra rota) |
| Cadeira restrita (Interdisciplinar) | navega | navega |
| Atalho para Interdisciplinar | navega | navega |

Nenhum clique foi interceptado por outro elemento. Todos os comportamentos batem com o briefing.

Limites desta medição:
- Para o rótulo de Resumo e de Petição, a prova de que o rótulo não aciona a seta é indireta. O clique navega, e o estado do menu se perde na página nova.
- As setas de Resumo e de Petição foram testadas com a aba já aberta (pré-aberta), porque a aba só existe depois que a unidade carrega. O resultado é a alternância do estado.

### 3.5 Hover (fundo do item sob o cursor)

- Claro: em todos os 14 tipos o fundo passa de transparente para rgba(255,255,255,0.08).
- Escuro e leitura ampliada: o mesmo, em todos os 14 tipos (`hover-modos.json`). Nenhum tipo ficou sem mudança.

### 3.6 Foco por teclado (Tab)

Percurso completo do menu em cada modo: 160 itens focáveis, cada um uma vez (o percurso fecha ao voltar ao primeiro).
- Claro e escuro: 160 de 160 com `:focus-visible` e contorno sólido de 2 px, rgb(250,249,245).
- Leitura ampliada: 160 de 160 com `:focus-visible` e contorno sólido de 2 px, preto.

Não medi o contraste do contorno contra o fundo lateral. Pela cor, o contorno claro sobre a lateral azul-marinho é visível, mas isso é leitura, não medida.

### 3.7 Alvos abaixo de 44 px em leitura ampliada

Só as setas de Resumo e Petição (D3). Lista completa: 8 itens, todos `seta-aba`, 26 px de largura.

## 4. Pendências para o líder

1. D1 (decisão de desenho e correção): o nível 5 fica maior que os níveis 3 e 4 na leitura ampliada. Duas saídas, a escolher: (a) fazer nível 3 e 4 usarem `--escala-xs` (ou um token próprio) para escalar com o modo; ou (b) fixar nível 5 em 14 px no modo ampliado. Não alterei o código.
2. D3: a seta de Resumo e de Petição mede 26 px. Para 44 px é preciso dar largura mínima à seta, o que tira espaço do rótulo na lateral de 280 px. Decisão de layout.
3. Calendário (D4): decidir se o link fica com estilo próprio ou segue um nível.
4. Texto integral fora do menu: confirmar se é desejado. Se for, o tópico do Livro precisa de abas na árvore, o que hoje não existe.

Nenhuma alteração de código, nenhum commit, nenhum push.

## 5. Congelamento no fim (L-13)

- HEAD no fim: `3b15875dec88a60a68ed1dc398d51ef95b0ab39f`, igual ao início.
- md5 de `dist/` no fim: `a4bda5a52bcf79622ac71c3ab3993ebe`, igual ao início.
- Limpeza: servidor na porta 4199 encerrado, link `node_modules` da cópia removido, `git worktree remove .worktrees/qa-menu` feito.
- `git status --short` no fim: `?? docs/qa-menu-lateral.md` (este relatório) e `?? mockups/selo-home.html` (não é deste QA).
- Evidência bruta fora do repositório, em `/var/tmp/qa-menu/`, para revisão do líder antes da limpeza de scratch.

## 6. Rodada 2 (HEAD 822791f)

Escopo pedido pelo coordenador: conferir os commits 61c912f (escada de tamanho por nível), 95cf5da (alvos de 44 px na leitura ampliada) e 822791f (abas dos tópicos do Livro e do Material no menu). Decisões do líder tratadas como não-desvio: na leitura ampliada os níveis 3, 4 e 5 ficam em 18 px (piso); abas de tópico no tamanho dos blocos (13 px no normal); Petição depois de Mnemônicos.

### 6.1 Congelamento (L-13)

- HEAD medido: `822791f` (cópia `.worktrees/qa-menu` criada nesse HEAD, `node_modules` por link simbólico).
- md5 de `dist/` no início: `6391ab3c375c5466172772a9cec2adef`. No fim: igual.
- Encerramento: servidor na porta 4199 parado, link `node_modules` removido, `git worktree remove .worktrees/qa-menu` feito.
- Árvore principal, no fim: `?? docs/qa-menu-lateral.md` e `?? mockups/selo-home.html` (não é deste QA). Mais quatro alterações que NÃO são deste QA e que surgiram durante a rodada (no início a árvore estava limpa): `M src/ui/componentes/MenuCurriculo.vue`, `M src/ui/componentes/MenuUnidadeComAbas.vue`, `?? src/ui/componentes/cadeiaDoCaminho.ts`, `?? tests/componente/MenuCurriculo.caminhoAberto.spec.ts`. Esta medição vale para o commit `822791f`, não para essas edições em andamento. Nada delas foi tocado.
- Dados brutos: `/var/tmp/qa-menu/` (medicao-*.json, teclado-*.json, hover-modos.json, contraste-modos.json, interacao.json, causa-cdp.json). A rodada 1 foi preservada em `/var/tmp/qa-menu/rodada1/`.

### 6.2 Veredito: REPROVADO

Dos 5 pontos pedidos, nenhum passa por inteiro:
1. Escada 20 > 19 > 17 > 15 > 13 e uniformidade por nível: REPROVA (D2 e D1).
2. Sem inversão na ampliada: REPROVA (D3).
3. Alvos clicáveis de 44 px ou mais na ampliada: REPROVA (D4).
4. Tópico de Hart: PASSA. Tópico do Material: PARCIAL (D8).
5. Clique: PASSA. Hover, cursor e foco: REPROVAM (D5, D6, D7). Piora em relação à rodada 1.

### 6.3 Desvios

| # | Nível / tipo | Propriedade | Esperado | Medido | Modo |
|---|---|---|---|---|---|
| D1 | níveis 3 a 5: unidade, aba, bloco, tópico (texto) | contraste texto x fundo | WCAG AA, 4,5:1 | texto rgb(22,58,95) sobre fundo rgb(13,36,64): 1,34:1 em 157 de 207 itens | claro |
| D2 | nível 4 abas; nível 5 blocos, tópicos e abas de tópico | tamanho | escada 15 (nível 4) e 13 (nível 5); abas de tópico = blocos | nível 4 abas 17 px (Livro e Material 15 px); nível 5 blocos, tópicos e abas 17 px | claro e escuro |
| D3 | níveis 3 a 5 na ampliada | tamanho | piso 18 px nos três; nenhuma inversão | unidade (3), abas (4) e blocos (5) em 24 px; AV, atalho e Livro em 18 px; cadeira (nível 2) em 21 px, menor que a unidade | ampliada |
| D4 | setas e rótulos clicáveis | alvo >= 44 x 44 | 44 px nos dois lados | 59 de 198 clicáveis menores: 18 setas com 16 px de largura (6 nível 3, 8 nível 4, 4 nível 5); 41 com 29 px de altura (unidades, abas e blocos) | ampliada |
| D5 | 11 de 18 tipos (rótulos de unidade, abas, blocos, tópicos e setas) | fundo no hover | muda ao passar o cursor | sem mudança em claro (rótulos e setas), escuro e ampliada. Na rodada 1, os 14 tipos mudavam | todos |
| D6 | setas de unidade, Resumo, Petição e tópico | cursor | pointer | default (medido em claro; mesmo nó nos outros modos) | claro |
| D7 | foco por Tab, 175 de 198 itens | contraste do contorno | visível contra o fundo | contorno rgb(22,58,95) 2 px sobre fundo rgb(13,36,64), 1,34:1. Na rodada 1 o contorno era creme | claro |
| D8 | tópico do Material | abas no menu | Texto integral antes de Resumo, como no tópico de Hart | o tópico do Material não tem Texto integral no menu: primeira aba é Resumo. Não verifiquei a página da rota fora do menu | claro |

Causa comum medida (CDP e atributos do DOM): dos 512 nós do menu, 378 não recebem o atributo de escopo do componente (`data-v-23fd4835`). Entre eles: a linha de unidade, a seta, o link de unidade, a lista de nível 4 e seus itens (abas e blocos). Regras de `font-size`, `cursor`, `min-width` e `:hover` do `MenuCurriculo.vue` não os alcançam. Consequências: o tamanho cai para o do `body` (17 px no normal, 24 px no ampliado, o que explica D2 e D3); o cursor e o hover voltam ao padrão (D5, D6); a largura da seta fica sem o mínimo de 44 px (D4). A cor de texto herdada do corpo, azul-marinho escuro na claro, explica D1 (cor herdada, não rastreada item a item). Na rodada 1 esses nós tinham o escopo: 13 px, cursor pointer, hover e alvo de 44 px.

### 6.4 Pontos que passam

- Escada, nível 1 (20 px), nível 2 (19 px), nível 3 em AV, atalho e unidade (17 px), nível 4 do grupo Livro e Material (15 px): iguais dentro de cada grupo nos dois temas.
- Tópico de Hart: rótulo navega para `/p/p1/intr-direito/u3-livro-textura-aberta`; seta expande (aria-expanded false para true); Texto integral (posição 31 na árvore) vem antes de Resumo (posição 33). Mapa, Fichamento, Mnemônicos e Quiz seguem.
- Tópico do Material: rótulo navega; seta expande. Sem Texto integral no menu (D8).
- Petição depois de Mnemônicos: a ordem está no código (`src/core/curriculo/ordemAbas.ts`: texto, resumo, mapa, fichamento, mnemonicos, peticao, quiz). No menu, Petição aparece antes de Quiz, na Introdução u1. Nenhuma unidade tem Petição e Mnemônicos juntas, então não é observável no menu.
- Cliques (claro, 21 alvos, nenhum interceptado): períodos, cadeiras, AV3 e Livro expandem sem mudar a rota; rótulos de unidade, Resumo, Petição, abas, blocos, tópicos, Calendário, cadeira restrita e atalho navegam; setas expandem; "em breve" não faz nada.
- Contraste ampliado 21:1 e escuro (mínimo 5,33:1 nas setas, 6,31:1 no texto): sem problema.

### 6.5 Limites

- Sem captura de tela (pedido na rodada 1 e mantido).
- A verificação de que o rótulo de Resumo e de Petição não aciona a seta continua indireta (o clique navega).
- O contraste é medido pela cor computada contra o fundo efetivo do ancestral. Não há imagem de fundo medida.

## 7. Checagem da cadeia aberta (HEAD 8199655)

Pedido do coordenador: o menu abre sozinho a cadeia até a página atual e não recolhe ao navegar (commit `8199655`). Medido no navegador isolado, mesma caixa, 1280 px salvo indicação, sem captura de tela.

- HEAD: `8199655`. Cópia `.worktrees/qa-menu` criada nesse HEAD. md5 de `dist/` no início: `a5ec8e0f46b0f2e0faadb874b4af551c`. Encerramento: servidor parado, link `node_modules` removido, cópia removida (md5 no fim verificado antes da remoção).
- Estado dos ramos lido pelo `aria-expanded` do botão e pela visibilidade da lista que ele controla. Página atual lida por `aria-current="page"`.

| Caso | Passo | Esperado | Medido | Resultado |
|---|---|---|---|---|
| (a) | Abrir direto `/p/p1/intr-direito/u3-livro-textura-aberta/mapa` | Ramos abertos: 1º período, Introdução ao Direito, AV3, Livro, "A textura aberta do direito"; atual = Mapa mental | Os cinco ramos com `aria-expanded="true"` e listas visíveis. Atual: "Mapa mental" (`/…/mapa`) | PASSA |
| (b) | Na barra da página (Abas da unidade), clicar em Quiz | Ramo continua aberto; atual passa a Quiz | Os cinco ramos seguem `true`. Atual: só "Quiz" (`/…/quiz`); Mapa deixou de ser atual | PASSA |
| (c) | Abrir Sociologia Jurídica à mão, navegar para outra página | Ramo não fechado | Em 1ª variante, navegou para a AV1 da própria Sociologia: ficou aberto, mas a página atual já pertence ao ramo, então o teste não separa "aberto à mão" de "aberto pela página" | Não conclusivo |
| (c2) | Abrir Sociologia à mão, depois sair para a AV1 da Introdução ao Direito | Sociologia continua aberta | Sociologia `true` antes e `false` depois. Marcador de janela não sobreviveu à navegação (recarregamento completo) | REPROVA |
| (d) | 390 px: abrir a gaveta pelo botão "Abrir menu do currículo" e checar a cadeia da página do Mapa | Gaveta visível e cadeia como em (a) | Gaveta entra na tela (x de -280 para 0, largura 280, dentro da viewport). Cinco ramos `true`. Atual: Mapa mental. Botão sem atributo `aria-expanded` | PASSA (com observação) |

Erros de página: nenhum em nenhum caso.

Causa provável de (c2): a navegação é um carregamento completo da página, e o menu só abre a cadeia da página atual no carregamento. Um ramo aberto à mão, fora da página atual, não sobrevive à troca de página. Isso contradiz "não recolhe ao navegar" para ramos abertos à mão. O commit cobre o ramo da página atual, não os ramos que o leitor abriu. Ainda não verifiquei o código para confirmar se a navegação deveria ser SPA.

Observação: o botão do celular não expõe `aria-expanded`, então o leitor de tela não anuncia se a gaveta está aberta ou fechada.

## 8. Rodada 3 (HEAD 8b4b7f4)

Mesmos critérios das seções 6 e 7, refeitos no HEAD `8b4b7f4` (estilos do menu viraram bloco global prefixado; links do menu como RouterLink; botão do celular com `aria-expanded`). As seções 6 e 7 ficam como registro dos HEADs 822791f e 8199655.

### 8.1 Congelamento (L-13)

- HEAD: `8b4b7f4`. Cópia `.worktrees/qa-menu` criada nesse HEAD. Linha de base `.worktrees/qa-base` no `3b15875` (a rodada 1), para comparar o que fica fora do menu.
- md5 de `dist/` no início: novo `fd993ade7fa6bc32d5ee0eb69726b3ef`; base `a4bda5a52bcf79622ac71c3ab3993ebe` (igual ao da rodada 1, portanto a base é exatamente a rodada 1). No fim: os mesmos valores.
- Encerramento: previews parados (portas 4198 e 4199), links `node_modules` removidos, `git worktree remove` das duas cópias.
- Árvore principal no fim: `?? docs/qa-menu-lateral.md` e `?? mockups/selo-home.html` (não é deste QA). Limpa de alterações de código.

### 8.2 Veredito: APROVADO (sem desvio de menu medido; uma observação de conteúdo no tópico do Material, ver 8.5)

Critérios de menu, todos medidos em 1280 px:

| Critério | Resultado |
|---|---|
| Escada 20 > 19 > 17 > 15 > 13 px, claro e escuro | PASSA |
| Uniformidade dentro de cada nível | PASSA (um item atual em peso 600, esperado) |
| Ampliada: piso de 18 px em 3, 4 e 5, sem inversão | PASSA |
| Ampliada: alvos clicáveis >= 44 px | PASSA: 0 de 198 abaixo de 44 px |
| Cursor de mão nas setas | PASSA (todas as setas `pointer`, nos três modos) |
| Hover muda o fundo | PASSA em claro e ampliado (18 de 18 tipos). Em escuro, 17 de 18: o item atual (Texto integral) já está destacado, sem variação |
| Contraste do texto, claro | PASSA: mínimo 7,43:1 (AAA). Escuro 7,43:1. Ampliado 21:1 |
| Contorno de foco, claro | PASSA: 198 de 198 itens com contorno creme sólido de 2 px, cerca de 14,8:1 contra o fundo navy (calculado pelos valores computados) |
| Clique por tipo | PASSA (21 alvos, nenhum interceptado) |
| Tópicos de Hart e do Material | PASSA |
| Cadeia aberta (a, b, c2, d) | PASSA |
| Nada fora do menu mudou em relação à rodada 1 | PASSA (21 blocos iguais: abas, trilha, título, texto e rodapé, fonte, tamanho, peso e cor) |

### 8.3 Tipografia por nível (1280 px)

Claro e escuro dão a mesma fonte, tamanho, peso, cursor e geometria. Só o tema muda a cor de fundo.

| Nível / tipo | Normal (claro = escuro) | Ampliada (claro) |
|---|---|---|
| 1 / período | Cormorant 20 px, peso 700 | Inter 24 px, peso 500 |
| 2 / cadeira, restrita, "Sem cadeira" | Cormorant 19 px, peso 600 | Inter 21 px, peso 500 |
| 3 / AV, unidade, atalho | Inter 17 px, peso 400; cor azul-claro | Inter 18 px, peso 500 |
| 3 / seta de unidade | Arial 13,3 px (sem texto) | sem texto |
| 4 / Livro, Material, abas (Quiz, Mapa, Resumo, Petição) | Inter 15 px, peso 400 | Inter 18 px, peso 500 |
| 5 / blocos, tópicos, abas de tópico | Inter 13 px, peso 400 | Inter 18 px, peso 500 |
| topo / Calendário | Inter 17 px | Inter 24 px |

Alvos na ampliada (todos >= 44 px): setas de 44 px de largura; unidades, abas e blocos com 48 px de altura ou mais. No normal, as setas medem 26 px (Resumo, Petição) e 32 px (unidades). Não há exigência de 44 px no normal.

Cores por nível, claro: período creme, cadeira dourada, nível 3 azul-claro (169,200,234), nível 4 cinza-azulado (195,207,221), nível 5 cinza (167,180,198). Escuro: as mesmas. Ampliada: preto em tudo.

### 8.4 Clique, hover e foco (claro, por clique real)

- Expandem, sem mudar a rota: período, cadeira, AV3, Livro, seta de unidade, seta de Resumo, seta de Petição, seta do tópico de Hart, seta do tópico do Material.
- Navegam: rótulo de unidade, Resumo, Petição, Mapa, Fichamento, Mnemônicos, Quiz, bloco de Resumo, rótulo do tópico de Hart, rótulo do tópico do Material, Texto integral do tópico, Calendário, cadeira restrita, atalho.
- Sem efeito: item "Sem cadeira publicada em breve".
- Hover: todos os tipos mudam o fundo, exceto o item atual em escuro (ver 8.2).
- Tab: 198 focáveis em cada modo, todos com `:focus-visible`.

### 8.5 Tópicos de Hart e do Material

- Hart: rótulo navega; seta expande; abas na ordem Texto integral, Resumo, Mapa, Fichamento, Mnemônicos, Quiz. Texto integral vem antes de Resumo.
- Material: rótulo navega; seta expande; abas Resumo, Mapa, Fichamento, Mnemônicos, Quiz. Não tem Texto integral no menu (a mesma observação da rodada 2, D8; não verifiquei a página da rota fora do menu).

### 8.6 Cadeia aberta na rota atual

- (a) Abrir direto `/p/p1/intr-direito/u3-livro-textura-aberta/mapa` a 1280 px: PASSA. Cinco ramos abertos (1º período, Introdução ao Direito, AV3, Livro, "A textura aberta do direito"). Mapa mental é o atual.
- (b) Clicar em Quiz na barra da página: PASSA. Ramo continua aberto; Quiz vira o atual; Mapa deixa de ser o atual.
- (c) Abrir Sociologia à mão e navegar para a AV1 da própria Sociologia: PASSA (a navegação é SPA; o ramo continua aberto).
- (c2) Abrir Sociologia à mão e sair para a AV1 da Introdução ao Direito, sem recarga: PASSA. Sociologia `aria-expanded="true"` antes e depois; a navegação preserva o estado (o marcador de janela sobreviveu, por isso é SPA). Esta é a correção do que reprovou na rodada 2 (8199655).
- (d) 390 px, abrir pelo botão "Abrir menu do currículo": PASSA. Gaveta entra na tela (x de -280 para 0). Botão com `aria-expanded="true"` depois de abrir. Cinco ramos abertos; Mapa mental atual. O valor antes de abrir não foi registrado.

### 8.7 Fora do menu (claro, base 3b15875 contra novo 8b4b7f4)

Comparei três páginas: o texto integral de Hart, a Introdução u1 e o mapa de Sociologia u3. Em cada uma: abas da unidade (tablist), trilha de navegação, título h1, texto corrido e rodapé (texto e link). Fonte, tamanho, peso e cor de cada bloco: 21 blocos iguais, nenhum diferente. O bloco global de estilos do menu não alterou nada visível fora da lateral nos pontos medidos.

### 8.8 Limites

- Sem captura de tela (mantido desde a rodada 1).
- O contraste do contorno de foco é calculado pela cor computada, não pelo pixel.
- O item atual em escuro não tem variação de hover por desenho, pelo que medi (fundo já destacado).
- A ordem Petição depois de Mnemônicos segue o código (`ordemAbas.ts`); no menu não há unidade que mostre as duas juntas.
