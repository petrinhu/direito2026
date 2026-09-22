# Revisão do modo de leitura adaptada, contra a especificação

Autor: `accessibility-specialist` (revisor, não implementador, L-12). Data: 22/09/2026.
Verificação por execução: suíte `vitest run tests/unidade tests/componente` rodada de
verdade (32 arquivos, 215 testes, todos verdes), leitura de todo o CSS/TS/Vue tocado e
medição manual dos valores contra `docs/modo-adaptado.md` §3/§8 e o briefing. Os testes
Playwright (`tests/e2e/`) NÃO foram executados nesta revisão (L-50/L-13: abrir navegador
com janela é vedado aqui; a prova visual é do `qa-engineer`, em paralelo) — foram lidos e
avaliados quanto ao que provam, não rodados.

## Critérios da seção 8, um a um

1. **Contraste (≥7:1, par principal ≥20:1). SIM.** `tests/unidade/design.contrasteModoAdaptado.spec.ts` mede de verdade (lê `tokens.css`, calcula luminância) 4 pares e passa: texto/fundo 21:1, link/fundo 14,84:1, bordo/fundo 9,44:1, sidebar 21:1. Confirmei os hex batendo com `tokens.css:288-360`. Ressalva: o par "contorno de foco", que a especificação lista com hex próprio (`#000000`, 21:1), não é testado à parte porque o foco usa `var(--cor-primaria)` (`base.css:126`), que dentro do modo é `#0d2440` (14,84:1) — passa o piso de 7:1, mas não é o valor que a especificação fixou. Ver achado 1 abaixo.

2. **Sem rolagem horizontal em 320px. Parcialmente verificável, não medido por mim.** Existe teste (`tests/e2e/modo-adaptado-320.spec.ts`, home + unidade) e há uma correção real registrada em `base.css:85-101` (`overflow-wrap: anywhere` em títulos/parágrafos do modo, com comentário do achado). Não executei o Playwright (ver nota acima). Resposta: **não posso dizer sim ou não por medição própria**; depende da rodada do `qa-engineer`.

3. **Espaçamento de texto forçado (WCAG 1.4.12), sem corte/sobreposição. Mesma ressalva do item 2**: teste existe (`tests/e2e/modo-adaptado-espacamento.spec.ts`) e é logicamente correto (mede `getBoundingClientRect` de parágrafos vizinhos), mas não rodei.

4. **Alvo interativo ≥44×44px. NÃO — não medido, nem automatizado nem manual.** Não existe nenhum teste (unidade, componente ou e2e) que meça largura computada de alvo nenhum. Vários elementos têm só `min-height: 44px` fixo sem `min-width` correspondente (`MotorQuiz.vue:114`, `Rodape.vue:149`, `GradeRevisao.vue:41`, `MenuCurriculo.vue:333/357`, `ResultadoQuiz.vue:34`, `TrilhaNavegacao.vue:106`, `CampoBusca.vue:55`) — a largura real depende de padding/conteúdo, nunca foi conferida. A própria seção 8 do documento e a seção 5 do briefing pedem medição, não suposição; aqui não há nem uma nem outra. Achado 2.

5. **Fonte do corpo ≥24px, medida pelo estilo computado. NÃO — não medido.** `--escala-base: 1.5rem` dentro do bloco do modo (`tokens.css:291`) resulta em 24px assumindo `html` em 16px (confirmado: `base.css` não redefine `font-size` do `html`), mas isso é cálculo estático meu, não "estilo computado da página" como o critério exige por escrito. Nenhum teste lê `getComputedStyle`.

6. **Distinção acerto/erro sobrevive à escala de cinza, "conferido, não suposto". NÃO conferido — só posso dizer que a substância está correta.** `CartaoPergunta.vue` diferencia por borda (`--cartao-alt-correta-borda: 3px double`, `--cartao-alt-incorreta-borda: 3px dashed`, `tokens.css:320-321`) e por texto ("Correta" / "Sua resposta, incorreta"), nunca só por cor — isso é real e correto. Mas o "✓"/"✕" que a própria especificação (seção 3) e o briefing (seção 3) descrevem como parte do sinal **não existe no código**: não há nenhum ícone, em lugar nenhum de `CartaoPergunta.vue`. E não há teste de conversão para escala de cinza nem qualquer verificação automatizada ou documentação de verificação manual. Achado 3 (documentação diverge do código) e achado 4 (critério sem prova).

7. **Nenhuma animação em execução com o modo ligado. NÃO — achei dois casos reais de movimento que sobrevive.**
   - `FundoAnimado.vue:90-93`: a checagem de modo adaptado só roda **uma vez**, dentro de `onMounted`, antes de decidir animar ou desenhar quadro estático. Se a pessoa está na home com o fundo já animando e liga o modo pelo botão (sem recarregar a página), a animação **continua rodando** — só para se a página for recarregada com o modo já salvo. Isso contraria a própria frase da especificação, seção 6: "O modo desliga todo movimento da página". Os testes e2e existentes ligam o modo por `localStorage` **antes** de `page.goto`, então nunca exercitam esse caminho (alternância ao vivo) e não pegam o defeito.
   - `LayoutBase.vue`: a transição da gaveta lateral (`transition: transform var(--transicao-rapida, 150ms ease)`, linha 119) **não tem nenhuma regra que a desligue**, nem para `prefers-reduced-motion`, nem para `data-modo-adaptado`. Conferi com `grep` no arquivo inteiro: zero ocorrências de `reduced-motion` ou `modo-adaptado`. A especificação (seção 6) e o briefing listam essa transição nominalmente como uma das três coisas a zerar; a briefing, porém, nunca atribuiu essa mudança a nenhum arquivo na tabela da seção 2 — é uma lacuna do próprio briefing que a implementação herdou.
   - O que **está** correto: o recolhimento do cabeçalho ao rolar (`BarraTopo.vue`, `prefereMenosMovimento || storeModoAdaptado.ativo.value`, testado e reativo de verdade) e a barra de progresso de leitura (`.barra-topo--fixa .barra-topo__progresso-barra { transition: none; }`) reagem corretamente e ao vivo.
   - Achado menor: `.barra-topo__onda-forma` mantém `transition: fill 220ms ease` (linha 232) sem override sob `--fixa` nem sob o modo; é uma transição de cor de 220ms disparada por scroll, não uma animação contínua, severidade baixa.

8. **Botão do cabeçalho: rótulo, `aria-pressed`, `aria-label` nos dois estados. SIM, com ressalva de método.** `BotaoModoAdaptado.vue:19-30` implementa os três, com os textos exatos da especificação (conferi caractere a caractere contra `docs/modo-adaptado.md` §5). `tests/componente/BotaoModoAdaptado.spec.ts` prova isso rodando de verdade (montei e rodei: passa). Ressalva: o teste lê atributos DOM via jsdom, não a árvore de acessibilidade da página propriamente dita (o critério pede a árvore, "não só por captura de tela") — para este par de atributos a diferença é pequena, mas não é literalmente o que o critério pede.

9. **Persistência entre recarregamento e segunda página. NÃO — sem teste que recarregue página real nem navegue entre duas páginas.** O único teste relacionado (`tests/componente/modoAdaptado.store.spec.ts`) prova que uma **segunda instância de store**, criada depois de `repo.salvarModoAdaptado(true)`, já nasce ligada — é um proxy de unidade, não o "recarregar a página e navegar para uma segunda página" que o critério pede por escrito. Não há Playwright para isso.

**Resumo do bloco 1: passaram 3 de 9 por medição própria (1, 7 parcialmente positivo mas com dois achados reais, 8), 4 não têm prova nenhuma (4, 5, 6, 9), e 2 dependem do Playwright que não rodei aqui (2, 3).**

## Valores da especificação contra o código

Bati número a número a tabela da seção 2/3 de `docs/modo-adaptado.md` contra o bloco `:root[data-modo-adaptado="on"]` em `tokens.css:288-378`: escalas (18/21/24/28/39/56/73px), altura de linha 1,8, `--letra-espaco` 0,12em, `--palavra-espaco` 0,16em, `--paragrafo-espaco` 2em, `--largura-coluna-leitura` 60ch, `--alvo-toque-minimo` 44px, `--foco-espessura` 4px, peso 500 no corpo, títulos sem serifa — **todos batem exatamente**. A única divergência de valor é a cor do contorno de foco (achado 1: especificação pede `#000000`/21:1, código usa `#0d2440`/14,84:1 por reaproveitar `--cor-primaria`) e o `outline-offset`, que a especificação pede maior dentro do modo e o código mantém em `2px` nos dois estados (`base.css:127` e `BotaoModoAdaptado.vue:52`, mesmo valor de fora do modo).

## Proibições

- Nenhuma página separada: confirmado, não há rota nova nem arquivo `.vue` paralelo.
- Nenhum conteúdo omitido: confirmado, mudanças são só de CSS/atributo, nenhum `v-if` some conteúdo.
- Nenhuma funcionalidade escondida: busca, balão, quiz continuam presentes estruturalmente; não testei interação real (fora do escopo que me cabe aqui).
- Modo nunca liga sozinho por preferência do sistema: confirmado, `criarStoreModoAdaptado` só lê o repositório, nunca `matchMedia`.
- Sem `maximum-scale`/`user-scalable=no`: confirmado, `index.html:5` só tem `width=device-width, initial-scale=1`.

## Suíte de teste

Rodei `npx vitest run tests/unidade tests/componente`: **32 arquivos, 215 testes, todos verdes**. Para o modo adaptado especificamente: `modoAdaptado.store.spec.ts` (2), `BotaoModoAdaptado.spec.ts` (1), `design.contrasteModoAdaptado.spec.ts` (4) — 7 testes de unidade/componente, todos passando e todos provando exatamente o que dizem provar. Mais 3 testes e2e (`modo-adaptado-320.spec.ts` ×2, `modo-adaptado-espacamento.spec.ts` ×1) que li mas não executei. Nenhum teste, em lugar nenhum da suíte, mede alvo de toque, fonte computada ou persistência entre navegação real — os critérios 4, 5 e 9 estão sem prova de qualquer tipo, automatizada ou manual documentada.

## Achados, por severidade

- **MODERADO — achado 1.** `FundoAnimado.vue`: alternar o modo ao vivo na home (sem recarregar) não para a animação em curso; só para no próximo carregamento com o modo já salvo. Contraria a frase literal da especificação (seção 6). Onde: `src/ui/componentes/FundoAnimado.vue:90-93` (checagem única em `onMounted`, não reativa).
- **MODERADO — achado 2.** `LayoutBase.vue`: a transição da gaveta lateral em tela estreita nunca é desligada, nem por `prefers-reduced-motion` nem pelo modo adaptado — zero ocorrência dos dois no arquivo. A especificação pede isso nominalmente (seção 6); o briefing nunca atribuiu a mudança a um arquivo. Onde: `src/ui/layout/LayoutBase.vue:113-122`.
- **MODERADO — achado 3.** Critério 4 (alvo de toque ≥44×44) sem nenhuma medição, automatizada ou manual documentada, em toda a suíte e em toda a documentação do projeto.
- **BAIXO/COSMÉTICO — achado 4.** Contorno de foco no modo usa `#0d2440` (14,84:1), não o `#000000` (21:1) que a especificação fixa por escrito; ainda passa o piso de 7:1 do critério 1, mas diverge do valor exato pedido. `outline-offset` também não cresce dentro do modo, ao contrário do texto da especificação seção 2.
- **BAIXO/COSMÉTICO — achado 5.** Ícone "✓"/"✕" descrito na especificação (seção 3) e no briefing (seção 3) para acerto/erro do quiz não existe em nenhum lugar do código; a distinção fica só em borda + texto, o que já cumpre a exigência de não depender de cor, mas diverge do que o próprio documento descreve.
- **BAIXO/COSMÉTICO — achado 6.** `.barra-topo__onda-forma` mantém uma transição de cor de 220ms disparada por scroll, sem desligar sob o modo.
- **NOTA, sem severidade de defeito.** O "botão de fechar" do balão de artigo, citado no briefing como algo a ajustar para 44×44px, não existe em `BalaoDispositivo.vue` — o fechamento é nativo do Popover API (Esc/clique fora), então esse item do briefing não se aplica ao código real.

## Achado mais grave

Os critérios 4 (alvo de toque), 5 (fonte computada) e 9 (persistência entre navegação) não têm prova nenhuma, nem automatizada nem manual documentada, apesar de o próprio briefing exigir "alguma forma de verificação automatizada ou documentada como verificação manual, decisão do frontend-engineer caso a caso" para todos os itens da seção 8. Depois vem o achado 2 (transição da gaveta lateral nunca desliga) e o achado 1 (fundo animado não para ao ligar o modo ao vivo), os dois violando a frase literal da especificação sobre eliminar movimento — bugs reais, reproduzíveis, não hipóteses.
