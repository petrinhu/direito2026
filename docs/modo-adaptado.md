# Modo de leitura adaptada (baixa visão)

Ordem do líder, 22/09/2026, verbatim: "Tem uma pessoa com baixa visão na turma. Ponha botão para página adaptada." Decisões que fecham o escopo, também dele: as duas coisas juntas (texto maior e mais espaçado, e contraste máximo em preto e branco); botão visível no cabeçalho, em toda página, ao lado da troca de tema.

Autor: `accessibility-specialist`. Data: 22/09/2026. Documento de especificação: nenhuma linha de código de produto foi escrita (L-51). Quem implementa é o `frontend-engineer`.

Pesquisa feita antes deste desenho (L-22): critérios do WCAG 2.2 (1.4.4 Redimensionar texto, 1.4.6 Contraste aprimorado, 1.4.8 Apresentação visual, 1.4.10 Refluxo, 1.4.12 Espaçamento de texto, 2.5.5 Tamanho de alvo aprimorado, 2.4.13 Aparência do foco), o documento `Accessibility Requirements for People with Low Vision` do W3C, e prática atual de "modo de leitura" documentada em fontes de 2026. Fontes ao final.

## 1. Decisão de desenho fundamental: mesma página, não página separada

O modo é um estado da própria página (um atributo global, no mesmo padrão do `data-theme` já usado para claro/escuro), nunca uma cópia de conteúdo em outra URL.

**Por que uma página separada envelhece e exclui.** Toda unidade nova, toda correção de texto e todo ajuste de layout passariam a exigir duas implementações mantidas a par, e a segunda cópia é sempre a que atrasa: é o padrão já medido neste mesmo projeto com o painel de demonstração do balão e do menu (`docs/design-visual.md`, "mockup não tem vitrine de componente"), onde a cópia estática divergiu do componente real e confundiu quem via as duas. Uma página "para quem tem baixa visão" também exclui por desenho: marca o leitor como categoria à parte, quebra o link que ele já tinha salvo ou recebido de um colega, tira a página das buscas internas e externas (duas URLs para o mesmo conteúdo), e ainda perde qualquer citação de artigo de lei aberta antes de trocar de versão. O pedido do líder foi "página adaptada", mas o que resolve o problema dele sem os efeitos colaterais acima é a mesma página, adaptada.

## 2. O que muda quando o modo liga, em número

Aplicado por uma variável de escala global, `× 1.4`, sobre a tabela tipográfica já existente (`docs/design-visual.md`).

| Propriedade | Valor normal | Valor no modo |
|---|---|---|
| Tamanho base do corpo de texto | 17px | **24px** |
| Escala completa de título (a mesma tabela 13/15/17/20/28/40/52px) | igual | **18 / 21 / 24 / 28 / 39 / 56 / 73px** |
| Altura de linha do corpo de leitura longa | 1.7 | **1.8** (acima do piso de 1.5× exigido pelo WCAG 1.4.12) |
| Espaço entre parágrafos | não fixado à parte | **2× o tamanho da fonte** (48px com o corpo em 24px; piso exato do WCAG 1.4.12) |
| Espaçamento entre letras | 0 (padrão do navegador) | **0.12em** (piso do WCAG 1.4.12) |
| Espaçamento entre palavras | 0 (padrão do navegador) | **0.16em** (piso do WCAG 1.4.12) |
| Largura máxima da coluna de leitura | 68ch (760px) | **60ch**, mais estreita de propósito, para reduzir o quanto o olho precisa percorrer por linha |
| Alvo mínimo de toque | 24×24px (piso AA, WCAG 2.5.8) | **44×44px** (piso AAA, WCAG 2.5.5) |
| Espessura de borda estrutural de cartão | sombra discreta, sem borda própria | **borda sólida de 2px**, cor igual à do texto; sombra não é sinal confiável de baixa visão |
| Contorno de foco | 3px sólido, cor primária | **4px sólido, preto**, deslocamento (`outline-offset`) maior, para nunca colar na borda de 2px do próprio elemento |
| Peso da fonte do corpo | 400 (regular) | **500 (medium)**, traço mais firme, sem virar negrito |
| Título com serifa (Lora) | serifa nos títulos | **sem serifa** (troca para Inter, a mesma família do corpo): traço fino de serifa é detalhe que a pesquisa aponta como mais difícil de distinguir em baixa acuidade, e o ganho de "jurídico moderno sóbrio" não compensa a perda de legibilidade aqui |

## 3. Paleta do modo: preto e branco, contraste máximo

O modo substitui, enquanto ligado, os tokens de cor do tema escolhido antes (claro ou escuro). A escolha de tema anterior fica memorizada e volta a valer assim que o modo é desligado.

| Par | Hex texto/elemento | Hex fundo | Contraste medido | Uso |
|---|---|---|---|---|
| Texto principal / fundo da página | `#000000` | `#ffffff` | **21:1** | Corpo de texto, títulos |
| Link não visitado / fundo da página | `#0d2440` (token já existente, `--cor-titulo-texto`) | `#ffffff` | **14.84:1** | Links |
| Link visitado / fundo da página | `#7a2331` (token já existente, `--cor-bordo`) | `#ffffff` | **9.44:1** | Links já visitados |
| Contorno de foco / fundo da página | `#000000` | `#ffffff` | **21:1** | Anel de foco de todo elemento interativo |
| Ícone e texto de acerto do quiz | `#000000` (ícone "✓", borda dupla sólida 3px) | `#ffffff` | **21:1** | "Resposta correta" |
| Ícone e texto de erro do quiz | `#000000` (ícone "✕", borda tracejada 3px) | `#ffffff` | **21:1** | "Sua resposta, incorreta" |

Nenhum par usa cor de matiz (nem o dourado, nem o azul-petróleo dos temas normais): o pedido do líder foi "preto e branco", e a distinção de acerto/erro do quiz passa a ser só ícone, borda e texto, nunca cor, o que já é reforço do que `docs/arquitetura.md` (seção 11) já exige para o quiz em qualquer modo.

**Critério mirado:** WCAG 1.4.6 (Contraste Aprimorado, AAA) pede 7:1 para texto normal. Todos os pares acima passam de 9:1, com folga de pelo menos 2× sobre o piso, o que cobre perda de contraste por antisserrilhamento de fonte em telas de baixa resolução.

**Convivência com os temas claro e escuro:** o modo não é um terceiro tema à escolha (claro/escuro/adaptado, um substituindo o outro para sempre); é uma camada que **liga por cima** de qualquer tema já escolhido e desliga voltando a ele. Isso evita duas fontes de verdade sobre "qual é o tema atual" e mantém a escolha de claro/escuro intacta para quando a pessoa desligar o modo.

**Polaridade, decisão do líder, 22/09/2026:** fundo branco com texto preto (como papel impresso, como a própria petição do site), confirmada depois de apresentados os dois lados. Fica registrado o raciocínio que levou à pergunta, para não se perder: a polaridade oposta (fundo preto, texto branco) reduz ofuscamento para quem tem fotofobia, mas pode "borrar" letras para quem tem opacidade de cristalino, e o documento do W3C usado na pesquisa (`w3.org/TR/low-vision-needs`) é explícito que a necessidade varia por pessoa. **Se a pessoa da turma relatar incômodo com o brilho do fundo branco, a inversão (fundo preto, texto branco) fica como possibilidade de v2**, com os mesmos tokens de contraste já medidos aqui, só trocados de lugar.

## 4. O que acontece com cada peça da interface

| Peça | O que muda no modo |
|---|---|
| Barra lateral em árvore | Mesma estrutura e mesma posição fixa; cores trocam para preto/branco pelos tokens da seção 3; texto e itens crescem pela escala da seção 2; nada muda de forma. |
| Trilha do cabeçalho | Mesmo lugar; quebra em mais de uma linha se o texto maior não couber numa linha só (nunca corta com reticências). |
| Balão de artigo de lei | Mesma mecânica (mesmo elemento único, mesmo acionamento); a largura máxima em `ch` já cresce sozinha com a fonte maior, sem mudança de lógica; o botão de fechar, na versão de faixa fixada embaixo (tela estreita), passa a respeitar o alvo mínimo de 44×44px da seção 2. |
| Comentário ao lado do trecho da petição | Sempre empilhado (comentário abaixo do trecho), nunca lado a lado: a grade de duas colunas que hoje só empilha abaixo de 700px passa a empilhar sempre que o modo está ligado, porque o texto maior não sobra espaço horizontal para as duas colunas ficarem legíveis. |
| Tabelas comparativas | **Correção contra o código real (achado ao preparar o briefing de implementação):** a versão publicada, `src/ui/componentes/BlocoTeorico.vue`, já contém cada tabela num quadro próprio (`.tabela-rolavel`, `overflow-x: auto`), então a rolagem já fica presa ao quadro da tabela, nunca vaza para a página inteira; o teste `tests/e2e/responsividade-360.spec.ts` já prova isso em 360px. Isto satisfaz o WCAG 1.4.10 por si só (conteúdo tabular é a exceção prevista pelo critério). O modo não precisa virar a tabela em lista empilhada: só herda o tamanho de fonte e a cor da seção 2 e 3, e o mesmo teste de rolagem lateral é repetido a 320px com o modo ligado (seção 8, critério 2). |
| Linha do tempo em desenho vetorial | **Ainda não existe como componente no código publicado** (só no mockup `mockups/unidade.html`; busca em `src/ui/componentes/` não encontrou nenhum arquivo de linha do tempo). Fica sem alteração nesta rodada; quando o componente for construído, ele adota a mesma regra descrita para o mockup: no modo, sempre a versão vertical empilhada, nunca o SVG horizontal de largura fixa. |
| Quiz e placar | Alvo de cada alternativa cresce para 44×44px; espaço entre alternativas cresce junto com o espaçamento de parágrafo da seção 2; certo/errado permanece ícone + borda + texto (nunca cor), como já descrito na seção 3; a barra de progresso ganha uma borda visível, porque preenchimento por cor sozinha não é suficiente neste modo. |
| Busca | Campo de busca cresce para o tamanho de fonte do modo (24px, já acima do piso de 16px que evita o zoom automático do iOS); itens de resultado ganham a mesma altura mínima de alvo de toque. |
| Faixa de aviso (material de estudo sem valor oficial) | Mesmo texto e posição; borda mais espessa (seção 2) para não depender só da cor de fundo para se destacar. |
| Rodapé | Mesmo conteúdo (nome do site, ano, aviso de material de estudo, aviso de progresso salvo no navegador); texto maior, mesmo tratamento de link da seção 3. |

## 5. Comportamento

- **Persistência:** uma chave própria no `localStorage`, separada da chave de tema (`caderno-direito:v1:modo-adaptado`), lida na subida da página. Falha de leitura ou escrita segue a mesma regra de robustez já definida para tema e progresso (`docs/arquitetura.md`, seção 8): o site funciona igual, só não lembra a escolha entre visitas.
- **Vale em toda página:** o atributo que liga o modo fica na raiz do documento (mesmo mecanismo do `data-theme`), então persiste ao navegar entre páginas dentro da mesma sessão sem precisar ligar de novo.
- **Botão, cabeçalho, ao lado do alternador de tema**, como pedido.
  - Estado desligado: rótulo visível "Leitura ampliada" com ícone de "A" grande; `aria-label="Ativar modo de leitura adaptada: texto maior e contraste máximo em preto e branco"`.
  - Estado ligado: rótulo visível muda para "Leitura normal"; `aria-pressed="true"`; `aria-label="Desativar modo de leitura adaptada e voltar ao tamanho e à cor normais"`.
  - O estado é sempre lido tanto pelo texto visível quanto pelo par `aria-pressed`/`aria-label`, nunca só pela troca de ícone.
- **Atalho de teclado: nenhum nesta v1.** Um atalho de tecla única arrisca colidir com o modificador que leitores de tela usam para os próprios comandos (NVDA e JAWS usam Insert, VoiceOver usa Control+Option), e o ganho de um atalho para um botão já alcançável por Tab no cabeçalho de toda página é pequeno perto desse risco. Fica registrado como possível item futuro, não como pendência desta v1.

## 6. Movimento e distração

O modo desliga todo movimento da página, **mesmo que o sistema não peça `prefers-reduced-motion`**, porque baixa visão e sensibilidade a movimento coexistem com frequência e o próprio ganho de contraste do modo é anulado por uma superfície que continua em movimento atrás do texto:

- **Animação de fundo da home:** substituída pelo gradiente estático que já é o retorno de `prefers-reduced-motion` (`docs/design-visual.md`, "Animação de fundo da home").
- **Transição da gaveta lateral em tela estreita:** removida (`transition: none`), mesmo destino que a media query de movimento reduzido já usa hoje.
- **Qualquer transição de troca de aba, de abertura do balão ou de progresso do quiz:** nenhuma, consistente com o que a seção 11 de `docs/arquitetura.md` já define para o quiz sob `prefers-reduced-motion`.

## 7. Interação com o sistema

- **Zoom do navegador e ampliação do sistema:** o modo usa `rem`/`em`, então o zoom do navegador e a ampliação do sistema operacional multiplicam por cima da escala do modo, sem conflito. O modo nunca fixa `maximum-scale` nem `user-scalable=no` na tag de viewport (isso já bloquearia zoom para todo mundo, com ou sem o modo ligado).
- **`prefers-contrast: more` do sistema (Safari/WebKit, seção 13 de `docs/compatibilidade-navegadores.md`):** o modo não liga sozinho por causa dessa preferência. Motivo: o modo também aumenta tamanho de fonte e espaçamento, que é um eixo diferente de contraste, e ligar os dois sem pedido explícito muda o layout sem consentimento. `prefers-contrast: more` continua livre para reforçar o que já existir fora do modo (trabalho já coberto fora deste documento).
- **Alto Contraste do Windows (`forced-colors: active`, Edge/Chrome/Firefox):** quando esse modo do sistema está ativo, o navegador substitui as cores da página pelas cores do sistema operacional, inclusive as deste modo. Nenhuma briga: os componentes seguem a mesma regra que `docs/compatibilidade-navegadores.md` já define para `forced-colors` no resto do site, e o modo não tenta anular a substituição do sistema com `!important` nem com `forced-color-adjust: none`.

## 8. Critérios de aprovação, fixados agora

Lista que o `qa-engineer` mede para aprovar, antes de qualquer implementação existir (L-43):

1. Contraste medido (fórmula de luminância relativa do WCAG, nunca estimado) de cada par da seção 3: todos ≥ 7:1, com o par principal (texto/fundo) medindo ≥ 20:1.
2. Em viewport de 320px de largura CSS, com o modo ligado, **nenhuma rolagem horizontal da página**. Exceção só para os componentes que o WCAG 1.4.10 já isenta por natureza bidimensional (a linha do tempo teria essa isenção fora do modo, mas dentro do modo ela nem aparece, ver seção 4), e tabelas comparativas, que passam a rolar em lista, não em grade.
3. Teste de espaçamento de texto forçado (WCAG 1.4.12): com o modo ligado, sobrepor via CSS os valores mínimos do critério (altura de linha 1.5×, espaço de parágrafo 2×, entrelinhas 0.12em, entrepalavras 0.16em) por cima dos valores já maiores do modo, e confirmar que nenhum texto é cortado, sobreposto ou truncado.
4. Todo alvo interativo (botão, alternativa de quiz, item de menu, botão de fechar do balão) medido ≥ 44×44 CSS px com o modo ligado.
5. Tamanho de fonte computado do corpo de texto ≥ 24px, medido pelo estilo computado da página, não pela folha de estilo fonte.
6. Nenhuma distinção de acerto/erro do quiz sobrevive à conversão da tela para escala de cinza (equivalente a já não haver cor nenhuma no modo, conferido, não suposto).
7. Nenhuma animação em execução com o modo ligado (captura de quadros da home, da gaveta lateral e da barra de progresso do quiz, comparando dois instantes: têm de ser idênticos).
8. Botão do cabeçalho: rótulo visível, `aria-pressed` e `aria-label` corretos nos dois estados, conferidos pela árvore de acessibilidade da página, não só por captura de tela.
9. Recarregar a página e navegar para uma segunda página: o modo continua ligado nas duas vezes.

## 9. Fora desta primeira versão

- Polaridade alternativa (fundo preto, texto branco) como opção do usuário: v1 fixa a polaridade branco/preto da seção 3, decisão do líder de 22/09/2026; fica como possibilidade de v2 só se a pessoa relatar incômodo com o brilho.
- Controle de tamanho de fonte em múltiplos níveis dentro do modo: v1 é liga/desliga, sem grau intermediário.
- Atalho de teclado dedicado (seção 5).
- Leitura em voz alta (texto para fala): o pedido do líder foi visual; não foi pedida narração.
- Modo adaptado dentro do PDF de impressão: a impressão do site já sai em preto sobre branco por padrão; escalar fonte de impressão fica para outra rodada.
- Ativação automática por `prefers-contrast`/`forced-colors` do sistema (seção 7): o modo continua exigindo o clique no botão.
- Exportar/importar a preferência entre aparelhos: exigiria conta de usuário, fora do escopo do projeto (R1, `docs/arquitetura.md`).

## Fontes

- [WCAG 2.2 (W3C)](https://www.w3.org/TR/WCAG22/)
- [Understanding SC 1.4.12: Text Spacing (W3C WAI)](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)
- [Accessibility Requirements for People with Low Vision (W3C)](https://www.w3.org/TR/low-vision-needs/)
- [What's New in WCAG 2.2 (W3C WAI)](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
