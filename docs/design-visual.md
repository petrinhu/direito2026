# Design visual, Caderno de Direito

Decisões de design visual dos mockups estáticos em `mockups/`. Personalidade aprovada: "jurídico moderno sóbrio", serifa nos títulos, sem serifa no texto corrido, azul-petróleo como cor de marca, dourado/âmbar como acento raro, muito espaço em branco, cartões discretos.

**Mudança de rumo, 21/09/2026.** O esqueleto de navegação passou por duas rodadas na mesma tarde. Primeiro o líder reprovou a home com o menu no topo ocupando quase a tela inteira ("home a está péssima! O menu ocupa quase a tela inteira"). A correção proposta então foi um painel suspenso compacto (altura máxima 60% da janela, colunas por nível). O líder reprovou essa correção também ("ruim. Mantenha o design do arquivo original com o menu lateral") e decidiu manter o esqueleto do arquivo piloto de resumo da 1a unidade de Introdução ao Direito, que fica na árvore local de estudo, fora deste repositório: barra lateral fixa à esquerda, não menu no topo. **A seção sobre painel suspenso foi removida deste documento** porque a decisão que a gerou foi revogada; o histórico da conversa é quem guarda esse passo, não este arquivo (L-67: canon revogado é apagado, não arquivado).

## Arquivos

- `mockups/tokens.css`: variáveis de cor, tipografia, espaçamento, raio e sombra, para os dois modos, alinhadas ao arquivo piloto.
- `mockups/home.html`: página inicial única (as variações A e B foram descontinuadas por ordem do líder, 21/09/2026: "Mantenha o design do arquivo original com o menu lateral", que não previa duas variações de home).
- `mockups/unidade.html`: página de unidade com barra lateral, três abas (Resumo, Petição comentada, Quiz), balão de artigo de lei e linha do tempo em SVG.

## Paleta, com contraste medido

Contraste calculado pela fórmula de luminância relativa do WCAG 2.2 (não estimado), sempre contra o fundo real do elemento onde o texto aparece, não contra "o fundo da página" em geral.

### Modo claro

| Par | Hex texto | Hex fundo | Contraste | Uso |
|---|---|---|---|---|
| Texto principal / fundo da página | `#1c1c1c` | `#faf9f5` | 16.18:1 | Corpo de texto |
| Texto suave / fundo da página | `#4a4a4a` | `#faf9f5` | 8.41:1 | Metadados, legendas |
| Texto principal / cartão elevado | `#1c1c1c` | `#ffffff` | 17.04:1 | Texto dentro de cartão |
| Primária (azul-petróleo) / fundo da página | `#163a5f` | `#faf9f5` | 11.05:1 | Links, ícones |
| Primária / cartão elevado | `#163a5f` | `#ffffff` | 11.64:1 | Links dentro de cartão |
| Título/marca (`--cor-titulo-texto`) / fundo da página | `#0d2440` | `#faf9f5` | 14.84:1 | `h1`, `h2`, marca do cabeçalho |
| Título/marca / cartão elevado | `#0d2440` | `#ffffff` | 15.63:1 | Título dentro de cartão |
| Acento (dourado) / fundo da página | `#8a6d1f` | `#faf9f5` | **4.65:1** | Destaque raro em texto corrido |
| Acento (dourado) / cartão elevado | `#8a6d1f` | `#ffffff` | **4.90:1** | Destaque raro em texto corrido |
| Branco / primária-escura (cabeçalho, botão) | `#ffffff` | `#0d2440` | 15.63:1 | Botão primário, header |
| Bordo (garnet, ênfase rara) / fundo da página | `#7a2331` | `#faf9f5` | 9.44:1 | Ênfase pontual |
| Selo "em breve" texto (`--cor-selo-texto`) / fundo do selo (`--cor-selo-bg`) | `#5a5442` | `#ece7d6` | 6.10:1 | Badge "em breve", inclusive dentro de `<summary>` clicável |

### Modo escuro

| Par | Hex texto | Hex fundo | Contraste | Uso |
|---|---|---|---|---|
| Texto principal / fundo da página | `#eceff2` | `#12161c` | 15.72:1 | Corpo de texto |
| Texto suave / fundo da página | `#b8c0cc` | `#12161c` | 9.89:1 | Metadados, legendas |
| Texto principal / cartão elevado | `#eceff2` | `#1a1f27` | 14.34:1 | Texto dentro de cartão |
| Primária (azul claro) / fundo da página | `#7fa8d6` | `#12161c` | 7.32:1 | Links, ícones |
| Primária / cartão elevado | `#7fa8d6` | `#1a1f27` | 6.68:1 | Links dentro de cartão |
| Título/marca (`--cor-titulo-texto`) / fundo da página | `#7fa8d6` | `#12161c` | 7.32:1 | `h1`, `h2`, marca do cabeçalho |
| Título/marca / cartão elevado | `#7fa8d6` | `#1a1f27` | 6.68:1 | Título dentro de cartão |
| Título/marca / primária-clara (trilha ativa, cabeçalho de tabela) | `#7fa8d6` | `#132a42` | 5.90:1 | `thead th`, `.comentario-lateral strong`, item ativo do índice |
| Título/marca / fundo sutil | `#7fa8d6` | `#1f242d` | 6.28:1 | Selo de categoria do quiz |
| Acento (dourado claro) / fundo da página | `#d3b563` | `#12161c` | 9.12:1 | Destaque raro em texto corrido |
| Acento (dourado claro) / cartão elevado | `#d3b563` | `#1a1f27` | 8.32:1 | Destaque raro em texto corrido |
| Bordo (garnet claro) / fundo da página | `#e29a9a` | `#12161c` | 8.06:1 | Ênfase pontual |
| Selo "em breve" texto (`--cor-selo-texto`) / fundo do selo (`--cor-selo-bg`) | `#d8d2ba` | `#2e2a1c` | 9.46:1 | Badge "em breve" |

**Correção 21/09/2026 (achados CRÍTICOS do QA, `docs/qa-mockups.md`):** duas variáveis novas entraram no `tokens.css` porque o par certo não existia separado do errado.

1. `--cor-titulo-texto` nasceu porque título e marca usavam `--cor-primaria-escura` como `color:`. Esse token é pensado para FUNDO (cabeçalho, botão primário, atrás de texto branco); no modo escuro ele vale `#0b1a2c`, quase idêntico ao fundo da página (`#12161c`), e o texto que o usava como cor ficava com contraste medido de **1,04:1 a 1,06:1** (título e marca praticamente invisíveis). `--cor-titulo-texto` é sempre cor de TEXTO, nunca de fundo, e nos dois temas mede acima de 5,90:1 (ver linhas da tabela acima).
2. `--cor-selo-texto`/`--cor-selo-bg` nasceram porque o selo "em breve" usava as variáveis genéricas de "desativado" (`--cor-desativado-texto`/`--cor-desativado-bg`), que no modo claro valem `#8a8672`/`#ece7d6`, **2,96:1**, abaixo do piso AA. A exceção de contraste de "controle desabilitado" do WCAG 1.4.3 não cobre esse selo, porque ele também aparece dentro de `<summary>` ainda clicável (abre/fecha período e cadeira), não é ele mesmo um controle desabilitado. `--cor-desativado-texto`/`--cor-desativado-bg` continuam do jeito que estavam, sem alteração: seguem usadas só em cartão de período/cadeira genuinamente inativo (`pointer-events:none`, `aria-disabled="true"`), onde a exceção do WCAG se aplica de verdade.

**Pares mais apertados, depois da correção (os dois abaixo de AAA 7:1, mas acima de AA 4.5:1):** o acento dourado no modo claro, tanto contra o fundo da página (4.65:1) quanto contra o cartão elevado (4.90:1). Passam WCAG 2.2 AA folgado, mas ficam pertinho do limite se algum dia o dourado precisar escurecer ou o fundo clarear. Por isso o acento é usado só em texto curto (destaque raro em citações), nunca em parágrafo longo nem no selo "em breve" (que agora tem par dedicado, ver acima).

## Tipografia

- Título: pilha de sistema com serifa nos mockups (`Georgia, "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif`). **Fonte de verdade recomendada para produção: Lora**, a ser hospedada no próprio site (sem CDN externo).
- Texto corrido: pilha de sistema sem serifa nos mockups (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`). **Fonte de verdade recomendada: Inter**, também hospedada no próprio site.
- Escala: 13 / 15 / 17 / 20 / 28 / 40 / 52px, base em `rem`. Corpo de leitura longa em 17px com altura de linha 1.7 (generosa, para não cansar em leitura extensa).

## Grade e espaçamento

Espaçamento em base 8px (0.25rem a 6rem). Largura de leitura de texto corrido travada em `68ch`. Largura máxima de conteúdo, 1180px. Raio de cartão em três tamanhos (6 / 10 / 16px), sombra discreta em dois níveis (cartão parado, cartão elevado em hover).

## Estados dos componentes

- **Item da árvore de currículo (período/cadeira/unidade) ativo x "em breve":** o item inativo é um `<span>`, nunca uma âncora (não navega), com cor apagada (`#7f93ab` sobre o fundo escuro da lateral) e o selo "em breve" à direita. Só o ramo da unidade aberta nasce expandido (`<details open>`); o resto nasce recolhido.
- **Item de menu (seção da unidade) lido x não lido:** o marcador circular mostra o número/letra da seção por padrão, e um "✓" com fundo na cor de acento quando a seção está marcada como lida.
- **Alternativa de quiz:** três estados visuais, repouso (borda neutra), hover/foco (fundo `--cor-primaria-clara`), selecionada (borda e marcador preenchidos na cor primária, peso de fonte 600).
- **Botão primário desativado:** fundo e texto trocam para os tokens de desativado, cursor `not-allowed`.
- **Tema:** troca por atributo `data-theme` na tag `<html>`, persistida em `localStorage`; na ausência de escolha manual, segue `prefers-color-scheme` do sistema.

## Esqueleto de navegação: barra lateral (derivado do arquivo piloto)

Decisão do líder, 21/09/2026, verbatim: "Mantenha o design do arquivo original com o menu lateral." O esqueleto (não o conteúdo) de `home.html` e `unidade.html` deriva do arquivo piloto de Introdução ao Direito, medido diretamente no código-fonte dele, não estimado.

**O que veio do piloto, igual:**
- Barra lateral fixa à esquerda (`position: fixed`), 280px de largura (`--largura-sidebar`), fundo `--cor-primaria-escura`, texto claro, rolagem própria (`overflow-y: auto`).
- Conteúdo com margem esquerda igual à largura da lateral, coluna de leitura centralizada com `max-width: 760px` (`--largura-coluna-leitura`).
- Abaixo do ponto de quebra (880px, não os 640px usados no resto do site), a lateral sai da tela por `translateX(-100%)` e aparece uma barra superior com botão de menu e o título; abrir o menu escurece o fundo (`.fundo-escurecido`) e clicar nele fecha.
- Barra de progresso de leitura fininha (4px), fixa no topo da janela, com gradiente `linear-gradient(90deg, var(--cor-primaria), var(--cor-acento))`.
- Todos os 10 tokens de cor do tema claro e os 10 do tema escuro, valor por valor: já batiam com os do mockup antes desta rodada (`--cor-primaria`, `--cor-primaria-escura`, `--cor-primaria-clara`, `--cor-acento`, `--cor-bordo`, `--cor-fundo`, `--cor-fundo-elevado`, `--cor-texto`, `--cor-texto-suave`, `--cor-borda`), porque o mockup original já tinha amostrado essa paleta do mesmo arquivo piloto. Nenhum valor de cor mudou nesta rodada.

**O que é maior que o piloto, adaptado:** o piloto é uma página só, com âncoras de rolagem; este site tem 10 períodos (só 1 publicado) e a unidade usa abas em vez de rolagem contínua. A lateral por isso tem dois blocos de navegação empilhados: a árvore de currículo (período > cadeira > unidade, recolhível, só o ramo aberto expandido) sempre presente, e, só dentro de uma unidade, abaixo dela, as seções daquela unidade (grupos "Teoria"/"Prática", marcador circular, estado "lido"), igual ao piloto. Busca com atalho de teclado e botão de tema (decisões #2 e #4 do briefing original) ficam no topo da lateral, porque o piloto não tinha esses dois recursos e precisava de um lugar persistente para eles.

**Correção de contraste, um ponto onde o piloto errava:** o marcador "lido" do piloto usa texto `#2b2205` fixo sobre o fundo de acento (`--cor-acento`). No tema escuro, o acento vale `#d3b563`, e o par mede 7,92:1, acima do piso. No tema claro, porém, o acento vale `#8a6d1f`, e o mesmo par `#2b2205`/`#8a6d1f` mede só **3,21:1**, abaixo do piso AA de 4,5:1: o hex fixo do piloto só funciona bem num dos dois temas. Corrigido usando o token já existente `--cor-texto-invertido` no lugar do hex fixo: mede **4,65:1** no tema claro e **8,81:1** no tema escuro, os dois acima do piso, nos dois temas.

### Contraste da barra lateral, medido contra o fundo real dela (sempre escuro, nos dois temas do site)

| Par | Hex texto | Fundo da lateral | Contraste, claro | Fundo da lateral | Contraste, escuro |
|---|---|---|---|---|---|
| Título da marca (branco) | `#ffffff` | `#0d2440` | 15.63:1 | `#0b1a2c` | 16.55:1 |
| Subtítulo / rodapé de progresso | `#b7c6d9` | `#0d2440` | 9.00:1 | `#0b1a2c` | 10.09:1 |
| Item de navegação (texto claro) | `#dbe4ef` | `#0d2440` | 12.17:1 | `#0b1a2c` | 13.65:1 |
| Item "em breve" (badge translúcido) | `#b7c6d9` | `#253a53` (branco 10% sobre fundo claro) | 6.69:1 | `#233141` (branco 10% sobre fundo escuro) | 7.62:1 |
| Item ativo (branco sobre destaque 14%) | `#ffffff` | `#2f435b` (branco 14% sobre fundo claro) | 10.12:1 | equivalente, mais claro no tema escuro | > 10:1 |
| Marcador "lido" (ver correção acima) | `--cor-texto-invertido` | `--cor-acento` (`#8a6d1f`) | 4.65:1 | `--cor-acento` (`#d3b563`) | 8.81:1 |

Todos os pares passam AA (4.5:1), inclusive o mais apertado (marcador lido no claro, 4.65:1, corrigido acima).

### Submenu da unidade e abas na lateral

Dois achados do líder, 21/09/2026, resolvidos juntos por serem o mesmo nível da árvore: "a unidade no menu não tem os sub-menus" e "quero que os links das abas apareçam na lateral flutuantes no mesmo local ao rolar a pagina."

O item "Unidade 1" da árvore virou um `<details>` (como período e cadeira, mesma lógica recolhível), com um quarto nível dentro dele: Resumo, Petição comentada e Quiz. Esses três itens **são** os botões de aba, não uma cópia deles: clicar num troca o painel visível (`mudarAba()`), e o item ativo fica destacado (`aria-selected="true"`, mesmo tratamento visual do item de currículo ativo). Como a lateral é `position: fixed`, esses botões ficam sempre no mesmo lugar da tela enquanto o conteúdo rola, que é exatamente o pedido. Os 9 blocos do Resumo (marcadores lido/não lido) ficam aninhados um nível mais fundo, dentro do item "Resumo", em vez de formarem um grupo à parte na raiz da lateral: assim não existem duas entradas de "Petição comentada" nem de "Quiz" na mesma árvore.

Os botões de aba que ficavam soltos no topo do conteúdo (`.abas-lista`, antiga) saíram de lá. Abaixo do ponto de quebra de 880px, onde a lateral recolhe, uma faixa nova (`.abas-faixa-mobile`) fica presa logo abaixo da barra superior, sempre visível, com os mesmos três botões, para nunca depender de abrir o menu só para trocar de seção.

## Balão de artigo de lei citado

Pedido do líder (21/09/2026), verbatim: "Nos artigos citados, quero que o mouse ao passar por cima (hover) apareça um balao ou algo do tipo que não atrapalhe a pagina nem saia da pagina com a redacao do artigo correspondente citado." O mecanismo foi fixado pelo plano técnico (`docs/arquitetura.md`, seção 12) e o mockup desenha em cima dele, sem inventar outro: **um balão só, compartilhado pela página inteira**, não um balão por citação.

Implementado em `unidade.html`: 5 citações reais no corpo do texto (Código de Processo Civil art. 319, na aba Resumo, bloco 3; e Código Civil art. 186, art. 927, Constituição Federal art. 5º incisos V e X, e Código de Processo Civil art. 319, II, na aba Petição comentada) e um apêndice "Dispositivos citados" que só existe na impressão.

**Correção, 21/09/2026, achado do líder: "os balões da lei estão estáticos já na página, não aparecem como um balão sobre a página ao passar o mouse por cima."** Duas causas, as duas corrigidas:

1. **O painel de demonstração foi removido**, do HTML e do CSS. Existia um bloco (`.demo-balao`) com três réplicas estáticas do balão, sempre visíveis, no meio da aba Petição, pensado como referência de design numa rodada anterior. O efeito prático foi o oposto do pretendido: o líder leu aquelas réplicas como se o balão de verdade fosse estático, sem interação nenhuma. Não sobrou substituto: o balão real, único, já demonstra a si mesmo.
2. **O balão real não abria de fato porque ficava atrás da barra lateral.** Achado ao investigar o código, não suposto: `#balao-dispositivo` tinha `z-index: 60`, menor que o da lateral (`z-index: 190`, opaca). O cálculo de posição (`getBoundingClientRect`) considerava só a borda da janela como limite esquerdo, não a borda direita da lateral; numa citação perto do início da coluna de leitura, o balão podia calcular uma posição válida contra a janela mas ficar debaixo da lateral, escondido mesmo com `display: block`. Indistinguível de "não abriu". Corrigido em dois pontos: o `z-index` do balão subiu para 300 (acima de tudo na página), e o cálculo de posição agora usa a borda direita real da lateral como limite esquerdo, quando ela está visível na tela. O mecanismo de abertura em si (hover com 120ms de intenção, foco, toque, `Esc`, clique fora) não mudou, porque já implementava o que o líder pediu; o defeito era o balão abrir invisível, não deixar de abrir.

**Texto legal usado:** copiado verbatim de `docs/dispositivos-legais.json`/`docs/dispositivos-legais.md` (conferido contra planalto.gov.br, consulta em 21/09/2026, gravado por outro agente). Onde este mockup precisou de um dispositivo que não está nesses dois arquivos, isso é sinalizado abaixo; do contrário, todo texto de artigo exibido no balão já está reconferido.

### Um balão só, por delegação

Não existe `<span class="balao-...">` dentro de cada citação. Existe **um** elemento, `#balao-dispositivo`, uma vez só no HTML (fora das abas, antes do rodapé), com o atributo `popover="auto"`. Cada citação é só um botão (`<button class="citacao-artigo" data-id="cc-927" aria-controls="balao-dispositivo">`), e um controlador único (o `<script>` no fim do arquivo) escuta os eventos, descobre qual botão disparou pelo `data-id`, preenche o balão com o dispositivo certo (catálogo local no mockup, equivalente ao carregamento sob demanda descrito na arquitetura) e o reposiciona.

`popover="auto"` foi escolhido porque entrega de graça, do navegador: camada superior acima de qualquer `z-index`, fechamento por `Esc` e fechamento por clique fora. Onde o navegador não suporta (`typeof el.showPopover !== 'function'`), o mockup cai para uma classe CSS (`.balao-aberto`) controlada pelo mesmo JavaScript, incluindo `Esc`/clique-fora manuais, então o comportamento visual não muda, só a origem do fechamento automático.

### Marcação no texto corrido

Sublinhado pontilhado fino na cor de acento (dourado/âmbar), sem aparência de botão (fundo transparente, sem borda própria), que fica sólido com leve tingimento de fundo no hover ou enquanto `aria-expanded="true"`. Não é um link (não navega), por isso o cursor vira `help`.

### Conteúdo do balão

Cabeçalho com o nome do diploma e o número do artigo (fonte com serifa, cor de título), corpo com o texto do artigo, e um rodapé discreto com a fonte oficial **e a data da consulta** (por exemplo "Fonte: Código Civil, Lei nº 10.406/2002. Consultado em 21/09/2026."), separado por uma linha fina. Quando o dispositivo tem nota de alteração (caso de art. 186 e art. 927, que registram ADI pendente sem mudança de redação), ela aparece **acima** do texto do artigo, num quadro destacado na cor de acento: a informação de que algo pode ter mudado vale mais do que o texto em si.

### Cores e contraste, balão

O balão usa exatamente os tokens de "cartão elevado" já medidos na tabela de paleta acima (mesma cor de fundo), por isso os números de contraste são os mesmos, aqui reunidos no contexto do próprio componente.

Valores fixos do balão, sem par de contraste (não são texto sobre fundo):

| Elemento do balão | Modo claro | Modo escuro |
|---|---|---|
| Fundo do balão | `#ffffff` (`--cor-fundo-elevado`) | `#1a1f27` (`--cor-fundo-elevado`) |
| Borda do balão | `#dcd7c8` (`--cor-borda`) | `#2c333d` (`--cor-borda`) |
| Sombra | `--sombra-elevada`, a mesma sombra de cartão elevado no hover | `--sombra-elevada`, versão escura do mesmo token |

Contraste do texto de dentro do balão, medido contra o fundo real do balão (não contra o fundo da página):

| Par | Hex texto, claro | Contraste, claro | Hex texto, escuro | Contraste, escuro |
|---|---|---|---|---|
| Cabeçalho (nome do diploma) contra o fundo do balão | `#0d2440` | 15.63:1 | `#7fa8d6` | 6.68:1 |
| Corpo do artigo contra o fundo do balão | `#1c1c1c` | 17.04:1 | `#eceff2` | 14.34:1 |
| Rodapé da fonte e data contra o fundo do balão | `#4a4a4a` | 8.86:1 | `#b8c0cc` | 9.02:1 |

A nota de alteração usa o mesmo par de "acento contra fundo de acento claro" já usado em outros destaques do site: `#8a6d1f` sobre `#f3ead1` no claro, `#d3b563` sobre `#332b16` no escuro (tokens `--cor-acento`/`--cor-acento-claro`, mesmos hex já tabelados na paleta principal). Todos os pares do balão ficam bem acima do piso AA (4.5:1), inclusive no modo escuro, o mais apertado da paleta inteira.

### Não empurrar o conteúdo nem sair da tela

O balão é `position: fixed`, então nunca desloca o texto ao redor (não reflui o parágrafo). O controlador calcula, em JavaScript, o retângulo real do botão que disparou (`getBoundingClientRect`) e decide a posição: abre alinhado abaixo da citação por padrão; quando não sobra espaço à direita (a citação do art. 319, II, do CPC, no comentário lateral da petição, fica perto da borda direita da página), o balão abre alinhado pela direita em vez de virar para fora da tela. Também soma o espaço abaixo contra o espaço acima antes de decidir entre abrir para baixo ou para cima.

Isto é a versão de mockup do que o plano técnico descreve para produção: lá, o caminho preferido é `anchor-positioning` em CSS puro (`anchor-name`/`position-try-fallbacks: flip-block, flip-inline`), com uma biblioteca de posicionamento (`@floating-ui/dom`) como contorno só nos motores sem `@position-try` completo (ver `docs/arquitetura.md`, seção 12.4, e `docs/compatibilidade-navegadores.md`). O mockup não implementa os dois caminhos porque é uma peça de design, não o código de produção; usa só o cálculo em JavaScript, que produz o mesmo resultado visual em qualquer navegador com suporte a `getBoundingClientRect` (todos os alvos declarados).

### Tela estreita ou toque: faixa fixada embaixo

Abaixo de 640px de largura, **ou** com `pointer: coarse` (dedo, mesmo em tablet largo), o balão para de flutuar perto da citação e vira uma faixa de largura cheia (borda superior arredondada) presa à base da tela, com botão de fechar visível (círculo com "×" no canto superior direito). O mesmo gatilho abre (toque = clique, que o controlador já escuta); o botão de fechar chama a mesma função de fechamento do Esc e do clique fora. A faixa reserva `env(safe-area-inset-bottom)`, mesma técnica já usada no rodapé do site, para não ficar colada na faixa de gesto do iPhone.

### Teclado

O gatilho é um `<button>`, então já é alcançável por Tab sem precisar de `tabindex` extra. O balão abre só quando o navegador reconhece foco por teclado (`gatilho.matches(':focus-visible')`), não em foco por clique de mouse, para o caminho de mouse (hover com 120ms de intenção) e o de teclado não se atropelarem. `Esc` fecha em qualquer navegador (nativo com `popover`, ou pelo `keydown` do controlador nos demais). O contorno de foco visível é o mesmo padrão do resto do site (`outline: 3px solid var(--cor-primaria)`, de `tokens.css`), só com `outline-offset` maior para não ficar colado no sublinhado pontilhado.

### Impressão: apêndice "Dispositivos citados"

Em `@media print`, o balão nunca aparece (`display: none`), e as três abas imprimem juntas (senão o apêndice listaria um dispositivo citado numa aba que não estava ativa na hora de imprimir). Cada citação ganha uma marca numérica sobrescrita (contador CSS, `counter(dispositivo)`, reiniciado uma vez no início do conteúdo das abas), e ao final da unidade entra a lista "Dispositivos citados": cada item traz o diploma, o texto completo, a URL da fonte oficial e a data da consulta, numerados na mesma ordem em que aparecem no texto (1 = art. 319 CPC, no Resumo; 2 a 5 = os quatro dispositivos da petição, na ordem em que aparecem nela). A lista fica sempre no DOM, escondida por CSS (`display: none` fora de `@media print`), então a impressão funciona mesmo que o leitor nunca tenha aberto um balão antes.

### O que ainda depende de `docs/dispositivos-legais.json`

Todo texto de artigo usado nas 5 citações reais e no apêndice de impressão já está conferido nesse arquivo (existia no momento desta rodada). Se um conteúdo futuro citar um dispositivo que ainda não estiver lá, o texto correspondente precisa ser reconferido contra aquele arquivo antes de publicar, e não copiado de memória.

## Linha do tempo (redesenho vetorial)

Decisão do líder, 21/09/2026, verbatim: "a linha historica dos mocks estava ruim também." A versão anterior (`unidade.html`, bloco 2) era uma fileira de cartões de 200px em caixa flexível, todos do mesmo lado, linha simulada por pseudo-elemento: pobre visualmente e, junto com o grid antigo de duas colunas, a causa do vazamento horizontal em 360px que o QA registrou como CRÍTICO. Redesenhada seguindo o arquivo piloto, que já resolvia isso com desenho vetorial de verdade.

- **Desenho:** `<svg>` inline dentro de `.linha-tempo-caixa` (fundo elevado, borda, cantos arredondados, `overflow-x: auto` própria). Linha central contínua (`<line class="lt-linha">`), 10 marcos alternando acima e abaixo dela (os mesmos 10 do desenho anterior, nenhum inventado nem removido: Código de Hamurabi, Realeza romana, República romana, Império romano, Lei das XII Tábuas, Corpus Juris Civilis, Europa Medieval, Jusnaturalismo teológico, Ascensão da burguesia, Jusnaturalismo Contratualista). Cada marco tem um ponto cheio (`<circle class="lt-ponto">`), uma haste ligando o ponto ao rótulo (`<line class="lt-haste">`), o nome em `<text class="lt-nome">` (serifa, `var(--fonte-titulo)`) e a data em `<text class="lt-data">` (sem serifa, `var(--fonte-texto)`) logo abaixo.
- **Cores só por variável:** todo `fill`/`stroke` do SVG vem de uma `<style>` interna que referencia os custom properties do tema (`var(--cor-borda)`, `var(--cor-primaria)`, `var(--cor-acento)`, `var(--cor-bordo)`, `var(--cor-texto)`, `var(--cor-texto-suave)`), nunca hex fixo dentro do desenho. É por isso que o SVG muda de cor sozinho quando o tema troca, sem duplicar regra nenhuma.
- **Rótulos são texto de verdade:** `<text>`, não `<path>` nem imagem, por isso são achados por Ctrl+F e ficam disponíveis a leitor de tela. O `<svg>` tem `role="img"` e um `aria-label` com a descrição geral (do Código de Hamurabi ao Jusnaturalismo Contratualista, 10 marcos), no mesmo padrão do arquivo piloto.
- **Não escapa da tela em 360px:** o SVG tem largura fixa (1500px) maior que a caixa que o envolve; a caixa (`.linha-tempo-caixa`) é quem tem `overflow-x: auto`, então só o desenho rola de lado, nunca a página. Isso, mais a remoção do grid antigo de duas colunas (a árvore de navegação virou barra lateral, não mais uma coluna ao lado do conteúdo), fecha os dois lados do defeito CRÍTICO de rolagem horizontal que o QA mediu (scrollWidth 1424 contra clientWidth 360).
- **Abaixo de 640px, versão vertical:** o SVG horizontal é escondido (`display: none`) e um `<ol class="linha-tempo-vertical">` assume, com uma linha contínua à esquerda (`::before`, `position: absolute`) e os 10 marcos empilhados, cada um com ponto (`::before` do `<li>`), nome e data em HTML normal, não SVG. É uma segunda representação dos mesmos dados, não um redimensionamento do desenho horizontal, porque o líder pediu explicitamente "linha à esquerda e marcos empilhados, um embaixo do outro", um layout que um SVG de largura fixa não consegue reproduzir sozinho.

## Petição comentada: comentário ao lado do trecho certo

Achado do líder, 21/09/2026, verbatim: "A explicações da petição não estão todas do lado certo da parte certa da inicial." Antes, os 4 comentários existentes ficavam empilhados numa coluna à parte (`aside.trilha-comentarios`), em sequência, sem relação de posição com o trecho que explicavam: bastava a peça e os comentários terem alturas diferentes para o alinhamento visual quebrar.

Reestruturado em `unidade.html` como uma grade de duas colunas **por trecho**, não uma coluna de trecho ao lado de uma coluna com todos os comentários. Cada uma das 6 seções da petição (Endereçamento, Qualificação, Dos Fatos, Do Direito, Dos Pedidos, Valor da causa e encerramento) virou uma linha própria (`.peticao-secao`, `display: grid`, `align-items: start`), com o trecho da peça à esquerda (`.peca-trecho`) e o comentário daquele trecho à direita (`.comentario-lateral`), na mesma linha da grade: o topo de um alinha com o topo do outro, sempre, não importa a altura de nenhum dos dois. As 6 seções foram conferidas uma a uma contra o comentário certo. Duas seções que não tinham comentário (Dos Pedidos, Valor da causa e encerramento) ganharam um, com o mesmo texto do arquivo piloto.

Abaixo de 700px, cada linha vira uma coluna só, e o comentário desce para logo depois do trecho que ele explica, igual ao arquivo piloto (`grid-template-columns: minmax(0, 1fr)`, sem precisar mover nada no HTML, porque os dois já são vizinhos na mesma seção).

## Animação de fundo da home (canvas)

Não implementada no mockup, só reservada (`<div class="fundo-animado">`, com comentário HTML explicando o efeito no próprio arquivo). Efeito pretendido: partículas ou pontos finos em opacidade baixa (até 0.5), na paleta petróleo/dourado, deslocando-se devagar (um ciclo a cada ~40 segundos), sem repetição abrupta nem brilho chamativo, atrás do texto da primeira dobra. Sob `prefers-reduced-motion: reduce`, o canvas não anima: cai para o gradiente estático que já serve de espaço reservado no mockup.

## Compatibilidade entre navegadores

Requisito do líder (21/09/2026): renderizar igual em Chrome, Firefox, Safari e Edge, inclusive Safari de iPhone e iPad. A pesquisa detalhada de diferenças entre motores está em `docs/compatibilidade-navegadores.md`; aqui só o que cada peça do desenho usa e a alternativa quando o recurso não existe no navegador.

| Recurso de CSS usado | Onde | Alternativa quando não há suporte |
|---|---|---|
| `animation-timeline: scroll()` (barra de progresso de leitura acompanha a rolagem) | Os dois mockups, `.barra-progresso__preenchimento` | Envolvido em `@supports (animation-timeline: scroll())`; fora do suporte (hoje, só motor Blink), a barra fica no valor fixo de 38%, que já representa uma leitura em andamento |
| `env(safe-area-inset-*)` (notch/Dynamic Island e faixa de gesto do iPhone) | Topbar (topo) e faixa do balão (base) em tela estreita, nos dois mockups | Segundo argumento do próprio `env()` como `0px`; navegador sem suporte ao recurso ignora a declaração e mantém o preenchimento simples já definido antes dela |
| `forced-colors: active` (alto contraste do Windows, entregue pelo Edge) | Barra lateral, item ativo/lido, selo "em breve", barras de progresso, alternativa do quiz, botões, balão, linha do tempo em SVG | Fora do modo de alto contraste, essas regras simplesmente não entram: o visual normal (cor de marca) se aplica |
| `prefers-reduced-motion: reduce` | Regra global em `tokens.css`, mais a transição da lateral (`.sidebar{transition:transform .2s ease}`), anulada nessa media query | Já é a própria alternativa: navegador sem suporte à media query nunca reduz, e o site não depende dessa transição para funcionar (só suaviza a abertura do menu) |
| `prefers-color-scheme: dark` | `tokens.css`, modo escuro automático | Fora de suporte, o navegador cai no modo claro (o `:root` sem guarda nenhuma), que é o padrão declarado |
| `viewport-fit=cover` na tag `<meta name="viewport">` | Os dois mockups, necessário para os valores de `env(safe-area-inset-*)` saírem diferentes de zero no iPhone | Sem esse valor, o Safari trata a página como se não tivesse notch e os `env()` voltam ao fallback `0px`, mantendo o preenchimento simples |
| Tamanho de fonte dos campos de busca | `.busca-sidebar input` nos dois mockups | `font-size: max(1rem, 16px)`, fixo em pelo menos 16px, porque o Safari do iPhone aumenta o zoom sozinho ao focar campo com fonte menor que essa |
| `scroll-margin-top` em todo alvo de âncora | `.bloco-resumo` e `.peca-trecho h3` em `unidade.html` | Não depende de suporte condicional: é uma propriedade isolada, e sua ausência só faz o navegador voltar ao comportamento de rolar a âncora até encostar no topo |
| `popover="auto"` (balão de artigo de lei) | `#balao-dispositivo`, `unidade.html` | Documentado à parte na seção do balão: fallback por classe CSS controlada pelo mesmo JavaScript, `Esc`/clique fora reimplementados à mão onde falta suporte nativo |

Recursos que os mockups **não usam**, de propósito, porque exigiriam alternativa mais complexa: `:has()`, container queries, subgrid, anchor positioning completo (o balão usa só cálculo em JavaScript, ver a seção dele), view transitions, `backdrop-filter` (nenhum efeito de vidro no desenho aprovado), `color-mix()` e espaços de cor modernos (`oklch`, `lab`). Toda cor do projeto já é declarada como hexadecimal simples em `tokens.css`, que é a própria fonte da verdade. Nenhuma dobra usa `100vh` sozinho: as alturas vêm de conteúdo e `padding`, não de unidade de viewport. A barra lateral usa `position: fixed` (matching o piloto), não `sticky`, com rolagem própria (`overflow-y: auto`) para nunca ficar presa fora da área visível. Os comentários da petição não usam `position: sticky` mais: viraram grade por trecho (ver a seção da petição), então cada comentário já nasce alinhado ao trecho certo, sem precisar acompanhar rolagem nenhuma. A linha do tempo em SVG usa uma técnica correlata (elemento filho com largura fixa maior que o pai, pai com `overflow-x: auto`), a mesma lógica que resolveu o vazamento horizontal do grid antigo, dentro de um único componente contido.

## Fora da versão 1

- Busca com resultado ao vivo (o mockup só mostra o campo e o atalho de teclado `/`; a lógica de indexação e resultado fica para a implementação).
- Tela de "resultado e revisão" completa do quiz (o mockup mostra a pergunta corrente e uma prévia condensada desse segundo estado em `unidade.html`, não as 60 perguntas revisadas).
- Página "Sobre o caderno" (citada na lateral e no rodapé dos dois mockups, mas sem mockup próprio nesta rodada).
- Rastreamento real de leitura (quais seções o visitante marcou como lidas): o mockup mostra o estado visual (3 de 9 blocos marcados como lidos, número fixo), não a lógica de gravação; isso é `localStorage` ou conta de usuário na implementação, fora do escopo de um mockup estático.
- Fontes web reais (Lora/Inter): os mockups usam pilha de sistema de propósito; hospedar as fontes de verdade é tarefa da implementação, não do design.
