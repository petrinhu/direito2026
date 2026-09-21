# Design visual, Caderno de Direito

Decisões de design visual dos mockups estáticos em `mockups/`. Personalidade aprovada: "jurídico moderno sóbrio", serifa nos títulos, sem serifa no texto corrido, azul-petróleo como cor de marca, dourado/âmbar como acento raro, muito espaço em branco, cartões discretos.

## Arquivos

- `mockups/tokens.css`: variáveis de cor, tipografia, espaçamento, raio e sombra, para os dois modos.
- `mockups/home-a.html`: variação A da home, abertura editorial de coluna larga.
- `mockups/home-b.html`: variação B da home, abertura em grade dos 10 períodos.
- `mockups/unidade.html`: página de unidade com as três abas (Resumo, Petição comentada, Quiz).

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
| Acento (dourado) / fundo da página | `#8a6d1f` | `#faf9f5` | **4.65:1** | Selo, destaque raro |
| Acento (dourado) / cartão elevado | `#8a6d1f` | `#ffffff` | **4.90:1** | Selo, destaque raro |
| Branco / primária-escura (cabeçalho, botão) | `#ffffff` | `#0d2440` | 15.63:1 | Botão primário, header |
| Bordo (garnet, ênfase rara) / fundo da página | `#7a2331` | `#faf9f5` | 9.44:1 | Ênfase pontual |
| Selo "em breve" texto / fundo do selo | `#5a5442` | `#ece7d6` | 6.10:1 | Badge desativado |

### Modo escuro

| Par | Hex texto | Hex fundo | Contraste | Uso |
|---|---|---|---|---|
| Texto principal / fundo da página | `#eceff2` | `#12161c` | 15.72:1 | Corpo de texto |
| Texto suave / fundo da página | `#b8c0cc` | `#12161c` | 9.89:1 | Metadados, legendas |
| Texto principal / cartão elevado | `#eceff2` | `#1a1f27` | 14.34:1 | Texto dentro de cartão |
| Primária (azul claro) / fundo da página | `#7fa8d6` | `#12161c` | 7.32:1 | Links, ícones |
| Primária / cartão elevado | `#7fa8d6` | `#1a1f27` | 6.68:1 | Links dentro de cartão |
| Acento (dourado claro) / fundo da página | `#d3b563` | `#12161c` | 9.12:1 | Selo, destaque raro |
| Acento (dourado claro) / cartão elevado | `#d3b563` | `#1a1f27` | 8.32:1 | Selo, destaque raro |
| Bordo (garnet claro) / fundo da página | `#e29a9a` | `#12161c` | 8.06:1 | Ênfase pontual |

**Pares mais apertados (os dois abaixo de AAA 7:1, mas acima de AA 4.5:1):** o acento dourado no modo claro, tanto contra o fundo da página (4.65:1) quanto contra o cartão elevado (4.90:1). Passam WCAG 2.2 AA folgado, mas ficam pertinho do limite se algum dia o dourado precisar escurecer ou o fundo clarear. Por isso o acento é usado só em texto curto (selos, rótulos, citações em destaque), nunca em parágrafo longo.

## Tipografia

- Título: pilha de sistema com serifa nos mockups (`Georgia, "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif`). **Fonte de verdade recomendada para produção: Lora**, a ser hospedada no próprio site (sem CDN externo).
- Texto corrido: pilha de sistema sem serifa nos mockups (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`). **Fonte de verdade recomendada: Inter**, também hospedada no próprio site.
- Escala: 13 / 15 / 17 / 20 / 28 / 40 / 52px, base em `rem`. Corpo de leitura longa em 17px com altura de linha 1.7 (generosa, para não cansar em leitura extensa).

## Grade e espaçamento

Espaçamento em base 8px (0.25rem a 6rem). Largura de leitura de texto corrido travada em `68ch`. Largura máxima de conteúdo, 1180px. Raio de cartão em três tamanhos (6 / 10 / 16px), sombra discreta em dois níveis (cartão parado, cartão elevado em hover).

## Estados dos componentes

- **Cartão de período ativo x "em breve":** o cartão inativo perde a cor de marca (número e nome ficam em `--cor-desativado-texto`), ganha `aria-disabled="true"`, não é mais um link clicável (`pointer-events: none`) e mostra o selo "em breve" no lugar da meta-informação.
- **Item de menu (cadeira/unidade) desativado:** mesmo padrão, span em vez de âncora, cursor `not-allowed`.
- **Alternativa de quiz:** três estados visuais, repouso (borda neutra), hover/foco (fundo `--cor-primaria-clara`), selecionada (borda e marcador preenchidos na cor primária, peso de fonte 600).
- **Botão primário desativado:** fundo e texto trocam para os tokens de desativado, cursor `not-allowed`.
- **Tema:** troca por atributo `data-theme` na tag `<html>`, persistida em `localStorage`; na ausência de escolha manual, segue `prefers-color-scheme` do sistema.

## Animação de fundo da home (canvas)

Não implementada nos mockups, só reservada (`<div class="fundo-animado">` ou `.fundo-animado-b`, com comentário HTML explicando o efeito no próprio arquivo). Efeito pretendido: partículas ou pontos finos em opacidade baixa (até 0.5), na paleta petróleo/dourado, deslocando-se devagar (um ciclo a cada ~40 segundos), sem repetição abrupta nem brilho chamativo. Na variação A, ocupa a dobra inteira atrás do texto; na variação B, fica restrita à faixa direita, atrás da grade de períodos, que passa por cima. Sob `prefers-reduced-motion: reduce`, o canvas não anima: cai para o gradiente ou trama de pontos estático que já serve de espaço reservado no mockup.

## Compatibilidade entre navegadores

Requisito do líder (21/09/2026): renderizar igual em Chrome, Firefox, Safari e Edge, inclusive Safari de iPhone e iPad. A pesquisa detalhada de diferenças entre motores está em `docs/compatibilidade-navegadores.md`; aqui só o que cada peça do desenho usa e a alternativa quando o recurso não existe no navegador.

| Recurso de CSS usado | Onde | Alternativa quando não há suporte |
|---|---|---|
| `animation-timeline: scroll()` (barra de progresso de leitura acompanha a rolagem) | `unidade.html`, `.barra-leitura` | Envolvido em `@supports (animation-timeline: scroll())`; fora do suporte (hoje, só motor Blink), a barra fica no valor fixo de 38%, que já representa uma leitura em andamento |
| `env(safe-area-inset-*)` (notch/Dynamic Island e faixa de gesto do iPhone) | Cabeçalho (topo) e rodapé (base) dos três mockups | Segundo argumento do próprio `env()` como `0px`; navegador sem suporte ao recurso ignora a declaração e mantém o preenchimento simples já definido antes dela |
| `forced-colors: active` (alto contraste do Windows, entregue pelo Edge) | Selo "em breve", barra de progresso, barra do quiz, alternativa do quiz, botões primário/secundário, cartão de período | Fora do modo de alto contraste, essas regras simplesmente não entram: o visual normal (cor de marca) se aplica |
| `prefers-reduced-motion: reduce` | Regra global em `tokens.css`, aplicada a toda transição/animação | Já é a própria alternativa: navegador sem suporte à media query nunca reduz, e como não há nenhuma animação disparada por JavaScript além da troca de aba/tema, não há movimento para reduzir de qualquer forma |
| `prefers-color-scheme: dark` | `tokens.css`, modo escuro automático | Fora de suporte, o navegador cai no modo claro (o `:root` sem guarda nenhuma), que é o padrão declarado |
| `viewport-fit=cover` na tag `<meta name="viewport">` | Os três mockups, necessário para os valores de `env(safe-area-inset-*)` saírem diferentes de zero no iPhone | Sem esse valor, o Safari trata a página como se não tivesse notch e os `env()` voltam ao fallback `0px`, mantendo o preenchimento simples |
| Tamanho de fonte dos campos de busca | `.busca-topo input` nos três mockups | `font-size: max(1rem, 16px)`, fixo em pelo menos 16px, porque o Safari do iPhone aumenta o zoom sozinho ao focar campo com fonte menor que essa |
| `scroll-margin-top` em todo alvo de âncora | `[id]` nas duas homes, `.bloco-resumo` e `.peca h3` em `unidade.html` | Não depende de suporte condicional: é uma propriedade isolada, e sua ausência só faz o navegador voltar ao comportamento de rolar a âncora até encostar no topo (ficando atrás do cabeçalho fixo) |

Recursos que os mockups **não usam**, de propósito, porque exigiriam alternativa mais complexa: `:has()`, container queries, subgrid, anchor positioning, view transitions, `backdrop-filter` (nenhum efeito de vidro no desenho aprovado), `color-mix()` e espaços de cor modernos (`oklch`, `lab`). Toda cor do projeto já é declarada como hexadecimal simples em `tokens.css`, que é a própria fonte da verdade, não uma alternativa a outra sintaxe. Nenhuma dobra usa `100vh` sozinho: as alturas do mockup vêm de conteúdo e `padding`, não de unidade de viewport, então o problema da barra do navegador no iPhone não se aplica hoje; se uma dobra em altura de tela inteira entrar em versão futura, ela precisa reservar altura com `svh`/`dvh` e fallback em `vh`, não `100vh` isolado. O índice lateral (`aside.indice`) e a trilha de comentários da petição usam `position: sticky`, nunca `position: fixed`, então não têm o problema de ficar presos fora da área de rolagem em `unidade.html`.

## Fora da versão 1

- Busca com resultado ao vivo (o mockup só mostra o campo e o atalho de teclado `/`; a lógica de indexação e resultado fica para a implementação).
- Tela de "resultado e revisão" completa do quiz (o mockup mostra a pergunta corrente e uma prévia condensada desse segundo estado em `unidade.html`, não as 60 perguntas revisadas).
- Página "Sobre o caderno" (citada no cabeçalho e no rodapé dos três mockups, mas sem mockup próprio nesta rodada).
- Fontes web reais (Lora/Inter): os mockups usam pilha de sistema de propósito; hospedar as fontes de verdade é tarefa da implementação, não do design.
