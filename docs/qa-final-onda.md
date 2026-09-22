# QA final da onda (conferência visual, pós-publicação)

Conferência sobre o site publicado (`https://direito2026.drpetrus.top`), Chromium e Brave, headless (sem janela, perfis descartáveis de sessão, sem automação de entrada no hospedeiro — Playwright já instalado pelo próprio projeto, `playwright.config.ts`, os mesmos dois binários que a suíte `tests/e2e/` já usa, nenhuma instalação nova, L-51). Interação só por API programática (clique/foco/teclado dispachados na página via CDP, nunca xdotool/wmctrl no hospedeiro, L-50). Capturas em `mockups/capturas/final/`.

Critérios medidos contra `docs/modo-adaptado.md`, seção 8. Achados anteriores conferidos contra `docs/qa-modo-adaptado.md` e `docs/revisao-modo-adaptado.md` (rodada pré-correção) e o commit `4dd5e8b`.

## Prova do coletor (L-36)

Antes de confiar em "zero erros", injetei `console.error` de teste e um `fetch` para domínio inexistente: os dois foram capturados nos dois navegadores antes de qualquer medição real começar. Resultado real, depois disso: **0 erros de console e 0 requisições com falha/4xx/5xx**, em Chromium e Brave, navegando home + resumo + petição + quiz.

## Os 9 itens do time-lead

1. **Balão de artigo de lei — SIM.** Abre por mouse (hover fino), por teclado real (Tab até o gatilho, abre sozinho via `:focus-visible`, sem precisar de Enter — é assim que o código funciona) e em tela estreita (360px, toque). Nos três casos o texto capturado é a lei de verdade (ex.: "Art. 319. A petição inicial indicará..."), não placeholder. 30 gatilhos encontrados na aba Resumo.
2. **Apêndice de dispositivos na impressão — SIM.** PDF gerado de verdade (Chromium `page.pdf()`, texto extraído por `pdftotext`): "Dispositivos citados" aparece com o texto integral do art. 319 do CPC, tanto no PDF do Resumo quanto no da Petição.
3. **Trilha do cabeçalho, modo ligado — SIM.** Medido (não só visual) nas 3 abas × 3 larguras (320/768/1280): nenhum texto de item da trilha ultrapassa a largura do próprio `<li>`, e `scrollWidth == clientWidth` do documento em todos os 9 casos. Visualmente a trilha quebra em duas linhas, sem sobrepor.
4. **Título da home sem serifa — SIM.** `font-family` computado com o modo ligado: `Inter, "Inter Fallback", ...` (sem Georgia/Lora).
5. **Fundo animado para ao vivo — SIM.** Prova em duas etapas: ANTES de ligar, duas capturas do canvas com 500ms de intervalo são diferentes (confirma que de fato anima); DEPOIS de ligar o modo com a home já aberta, sem recarregar, duas capturas ficam byte-a-byte idênticas (confirma que congelou). Testado nos dois navegadores.
6. **Fontes próprias, sem sacudir — SIM.** As 4 fontes (`inter-400/500/700`, `lora-700`) carregam do próprio domínio (`.../assets/fontes/*.woff2`, HTTP 200), `document.fonts` confirma carregamento, e o CLS acumulado medido após a troca é 0.
7. **Selo de acento + barra de progresso — SIM.** Selo "Aprofundamento" fora do modo: contraste medido 4,83:1 (bate com o valor do commit `6615b8f`). Barra de progresso: `role="progressbar"` com `aria-labelledby` resolvendo para o texto visível real ("0 de 9 blocos lidos").
8. **Foco preso na gaveta — SIM** (25 Tabs dentro da gaveta mobile aberta, foco nunca escapou para trás dela; Esc fecha e devolve o foco ao botão que abriu). **Alvos de toque — NÃO, achado real** (abaixo).

## Achado novo (não estava nas listas anteriores)

**IMPORTANTE — Sumário do resumo, alvo de toque abaixo do piso.** Com o modo ligado, os 9 links do sumário no topo da aba Resumo ("O que é o Direito?", "Linha do tempo histórica" etc., que levam a `#bloco-N`) medem só **29px de altura** (larguras variam, 227 a 643px). Piso exigido pela seção 2/critério 4: 44×44px. Causa: `src/ui/componentes/VisorResumo.vue`, bloco `.visor-resumo__sumario` (linhas 27–36) não tem `min-height` nem `min-width` nenhum, diferente de outros componentes do site que ao menos tentam (ainda que de forma incompleta) um piso de altura. Busquei o gêmeo (L-17): é o único lugar do código com `nav aria-label="Sumário..."`, não se repete em outro componente. Os demais 31 alvos interativos medidos na página (botões, abas, itens de menu, alternativas de quiz) passam de 44×44px.

## Comparação Chromium × Brave

Capturas lado a lado da home (3 larguras × 2 temas) e da unidade (3 abas × 3 larguras, modo ligado) nos dois navegadores: sem diferença visual relevante. Console e rede idênticos (zero e zero) nos dois.

## Varredura de rota morta

Levantei todo `href` real da home + unidade (ignorando âncoras internas): `/`, `/busca`, `/p/p1`, `/p/p1/intr-direito`, `/p/p1/intr-direito/u1`, `/p/p1/intr-direito/u1/peticao`, `/p/p1/intr-direito/u1/quiz`, e o link externo de rodapé `https://drpetrus.top`. Todos HTTP 200. Os botões de período 2º–10º no menu **não navegam** (só há conteúdo publicado para o 1º período/Introdução ao Direito — confirmado em `src/conteudo/`; clicar neles não muda a URL nem gera página vazia): não é rota morta, é item de menu ainda sem conteúdo, comportamento inerte e não enganoso.

## Critérios da seção 8, veredito por medição própria

1. Contraste ≥7:1, par principal ≥20:1 — **SIM** (medido 21:1 exato, `rgb(0,0,0)` / `rgb(255,255,255)`, texto de leitura real).
2. Sem rolagem horizontal em 320px — **SIM** (home e as 3 abas da unidade, `scrollWidth == clientWidth`).
3. Espaçamento de texto forçado sem corte — **SIM** (sobrepus os mínimos do WCAG 1.4.12 por cima dos valores do modo; sem overflow).
4. Alvo interativo ≥44×44px — **NÃO** (achado do sumário, acima; os demais 31 alvos passam).
5. Fonte do corpo ≥24px, estilo computado — **SIM** (24px).
6. Acerto/erro do quiz sobrevive à escala de cinza — **SIM** (`filter: grayscale(100%)`, confirmado por classe + texto: "... Correta" / "... Sua resposta, incorreta" no próprio texto do elemento, não só cor).
7. Nenhuma animação com o modo ligado — **SIM** (fundo congela ao vivo, gaveta sem transição sob o modo, confirmado no CSS).
8. Botão do cabeçalho, rótulo/aria-pressed/aria-label — **SIM** (os dois estados conferidos: "Leitura ampliada"/`false`/"Ativar..." e "Leitura normal"/`true`/"Desativar...").
9. Persistência (reload + segunda página) — **SIM** (ligado na home, sobrevive à navegação SPA para a unidade sem reload, e sobrevive a F5 na unidade).

**8 de 9 critérios SIM. 1 NÃO (critério 4, achado do sumário do resumo).**

## Resposta direta

**Ainda não por completo**, mas quase: uma pessoa com baixa visão já consegue estudar por este site hoje — o balão de lei, a impressão, a trilha, o quiz, a persistência e o contraste funcionam de ponta a ponta e foram medidos, não supostos. O único ponto real que falta é o sumário no topo do Resumo: os links de navegação interna da própria leitura ficam pequenos demais para toque confiável com o modo ligado.
