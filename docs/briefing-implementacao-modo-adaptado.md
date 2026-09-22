# Briefing de implementação: modo de leitura adaptada

Ordem de serviço para o `frontend-engineer`. Este documento é autossuficiente: quem implementa não herda o contexto da sessão que o escreveu.

Autor: `accessibility-specialist`. Data: 22/09/2026. **Nenhuma linha de código de produto foi escrita para preparar este briefing** (L-51); os trechos de código abaixo são citação de arquivo já existente no repositório, lidos, não inventados.

## 0. Leia antes, nesta ordem

1. `docs/modo-adaptado.md`, o documento inteiro. É a especificação; este briefing só traduz para arquivo e não substitui a leitura dele, principalmente as seções 3 (paleta), 6 (movimento) e 7 (interação com o sistema).
2. `docs/arquitetura.md`, seção 11 (Acessibilidade) e seção 2 (camadas).
3. `docs/design-visual.md`, a tabela de paleta com contraste medido (para não recalcular o que já está medido).
4. `docs/compatibilidade-navegadores.md`, a parte sobre `forced-colors` e `prefers-contrast` (Safari não suporta `forced-colors`; usa `prefers-contrast`).

## 1. Mecanismo: replicar o padrão já existente do tema, não inventar um novo

**[FATO]** o site já resolve exatamente este tipo de problema para claro/escuro/sistema, por um atributo em `<html>` mais um conjunto de variáveis CSS redefinidas por seletor de atributo. O modo adaptado usa o mesmo desenho, com um atributo próprio (sugestão: `data-modo-adaptado="on"`), **não** um terceiro valor de `data-theme`, porque o modo liga por cima do tema escolhido, sem substituí-lo (`docs/modo-adaptado.md`, seção 3).

Arquivos que já implementam o padrão do tema, para copiar a forma, não o conteúdo:

- `src/core/progresso/tipos.ts`: interface `RepositorioProgresso`, com `lerTema`/`salvarTema`.
- `src/app/persistencia/RepositorioLocalStorage.ts`: implementação real, `CHAVE_TEMA`.
- `src/app/persistencia/RepositorioMemoria.ts`: implementação em memória (fallback quando `localStorage` falha).
- `src/app/stores/tema.ts`: composable `criarStoreTema`, grava no repositório e aplica o atributo em `document.documentElement` com `flush: 'sync'`.
- `src/ui/componentes/AlternadorTema.vue`: o botão, com `min-height`/`min-width: 44px` já prontos (reaproveitar o mesmo CSS de alvo de toque).
- `src/app/chaves.ts`, `src/main.ts`, `src/App.vue`, `src/ui/layout/LayoutBase.vue`, `src/ui/layout/BarraTopo.vue`: fiação de injeção (`provide`/`inject`) e o lugar exato onde `AlternadorTema` já é renderizado (`BarraTopo.vue`, dentro de `.barra-topo__linha`, linha 99 no arquivo lido nesta rodada).

## 2. Lista de arquivos a tocar, com o que muda em cada um

| Arquivo | O que muda |
|---|---|
| `src/core/progresso/tipos.ts` | Acrescentar à interface `RepositorioProgresso`: `lerModoAdaptado(): boolean` e `salvarModoAdaptado(ativo: boolean): boolean`. Booleano, não um tipo com "sistema", porque o modo não tem estado "seguir o sistema" (seção 7 do documento de especificação: o modo nunca liga sozinho por preferência do sistema). |
| `src/app/persistencia/RepositorioLocalStorage.ts` | Nova chave `CHAVE_MODO_ADAPTADO = \`${PREFIXO}:modo-adaptado\`` (mesmo prefixo `caderno-direito:v1` já usado nas outras chaves). Implementar os dois métodos novos no mesmo padrão try/catch dos já existentes (`lerTema`/`salvarTema` são o modelo direto). |
| `src/app/persistencia/RepositorioMemoria.ts` | Campo privado `modoAdaptado = false`, e os dois métodos novos, mesmo padrão de `lerTema`/`salvarTema` desta classe. Incluir a limpeza em `limparTudo()`. |
| `src/app/stores/modoAdaptado.ts` (novo arquivo) | Composable `criarStoreModoAdaptado(repositorio)`, no mesmo molde de `src/app/stores/tema.ts`: um `ref<boolean>` iniciado por `repositorio.lerModoAdaptado()`, um `watch` com `flush: 'sync'` que grava e aplica `document.documentElement.setAttribute('data-modo-adaptado', 'on')` (ou `removeAttribute`), e uma função `alternar()`. |
| `src/app/chaves.ts` | Nova `CHAVE_STORE_MODO_ADAPTADO: InjectionKey<StoreModoAdaptado>`. |
| `src/main.ts` | Criar a store (`criarStoreModoAdaptado(repositorio)`) e `app.provide(CHAVE_STORE_MODO_ADAPTADO, storeModoAdaptado)`, ao lado de onde `storeTema` já é criado e fornecido (linhas 21 e 27 do arquivo lido nesta rodada). |
| `src/App.vue` | `inject(CHAVE_STORE_MODO_ADAPTADO)!` e repassar como prop para `LayoutBase`, junto de `storeTema`. |
| `src/ui/layout/LayoutBase.vue` | Receber a prop `storeModoAdaptado` e repassar para `BarraTopo`. |
| `src/ui/layout/BarraTopo.vue` | (a) Repassar a prop para um novo componente de botão (seção 3 abaixo); renderizar esse botão dentro de `.barra-topo__linha`, ao lado de `AlternadorTema` (linha 99 do arquivo lido). (b) **Mudança de comportamento:** hoje o cabeçalho recolhe ao rolar, e só deixa de recolher quando `prefereMenosMovimento` é verdadeiro (linha 27, variável `prefereMenosMovimento`, e a condição na função `aoRolar`, linhas 45 a 50). Trocar essa condição para também considerar o modo adaptado ligado (`prefereMenosMovimento \|\| storeModoAdaptado.ativo.value`): o botão do modo precisa continuar visível o tempo todo (é o próprio requisito do líder, "botão visível no cabeçalho, em toda página"), e um cabeçalho que soma e some é movimento que o modo existe para eliminar (seção 6 da especificação). |
| `src/ui/componentes/BotaoModoAdaptado.vue` (novo arquivo) | Componente de botão, no mesmo formato de `AlternadorTema.vue`: `aria-pressed`, `aria-label` e rótulo visível trocando nos dois estados (textos exatos na seção 3 abaixo), `min-height`/`min-width: 44px`. |
| `src/ui/estilos/tokens.css` | Bloco novo `:root[data-modo-adaptado="on"] { ... }`, depois dos blocos de tema já existentes (depois da linha 278, fim do bloco `:root[data-theme="dark"]`), redefinindo: as sete variáveis `--escala-*`, `--altura-linha-texto`, as variáveis de cor (`--cor-fundo`, `--cor-fundo-elevado`, `--cor-texto`, `--cor-primaria`, `--cor-bordo`, `--cor-sidebar-*`, etc., ver tabela de cores na seção 3 abaixo), `--largura-leitura`/`--largura-coluna-leitura` (60ch), `--raio-sm/md/lg` **mantidos como estão** (não há razão de acessibilidade para mudar raio de canto). Acrescentar também três variáveis que hoje não existem: `--letra-espaco`, `--palavra-espaco`, `--paragrafo-espaco`, com valor `0`/`normal`/`0` fora do modo e os valores da seção 3 dentro dele; e `--alvo-toque-minimo` (`24px` fora, `44px` dentro) e `--foco-espessura` (`2px` fora — o valor real do `:focus-visible` global em `base.css`, não os 3px do mockup — `4px` dentro). |
| `src/ui/estilos/base.css` | (a) `body`, `h1`-`h4`: já usam as variáveis de escala e cor (linhas 42-58), então herdam sozinhos; só falta acrescentar `letter-spacing: var(--letra-espaco, normal); word-spacing: var(--palavra-espaco, normal);` no `body`. (b) Regra nova para espaço de parágrafo: `p { margin-block-end: var(--paragrafo-espaco, 0); }`. (c) `:focus-visible` (linha 71-74): trocar `outline: 2px solid var(--cor-primaria)` para usar `var(--foco-espessura, 2px)` no lugar do `2px` fixo. (d) Regra nova de alvo de toque: `button, a, input, [role="button"], summary { min-height: var(--alvo-toque-minimo, 24px); }` (só altura mínima; largura mínima já é tratada individualmente em cada componente, ver próxima linha da tabela). (e) `h1`-`h4` no modo perdem a serifa: `:root[data-modo-adaptado="on"] h1, :root[data-modo-adaptado="on"] h2, :root[data-modo-adaptado="on"] h3, :root[data-modo-adaptado="on"] h4 { font-family: var(--fonte-texto); font-weight: 700; }`. (f) `body` ganha `font-weight: 500` só dentro do modo. |
| `src/ui/componentes/CartaoPergunta.vue` | As classes `.cartao-pergunta__alt--correta` e `.cartao-pergunta__alt--incorreta` (linhas 122-129 do arquivo lido) já usam `var(--cor-sucesso-bg)`/`var(--cor-erro-bg)`, que são cor de matiz (verde/vermelho) mesmo depois do token-swap, porque essas variáveis não têm bloco próprio dentro de `[data-modo-adaptado="on"]` ainda. Duas opções, decidir com o `accessibility-specialist` na revisão se a primeira não bastar: (1) redefinir `--cor-sucesso-bg`/`--cor-sucesso-borda`/`--cor-erro-bg`/`--cor-erro-borda` dentro do bloco do modo em `tokens.css`, todas para `#ffffff` de fundo e `#000000` de borda, diferenciando só pela espessura/estilo da borda (sólida dupla para acerto, tracejada para erro, ver seção 3); (2) se o CSS não permitir diferenciar sólida/tracejada só por variável, acrescentar uma classe condicional no próprio componente. Confirmar visualmente que o ícone (`✓`/`✕`, ou o texto "Sua resposta, incorreta" que já existe na linha 71) continua sendo o sinal principal, cor nunca é a única pista (isso já é verdade hoje, não é mudança de comportamento, só de paleta). |
| `src/ui/componentes/ApendiceDispositivos.vue` | Linha 46, `color: #333;`, é a única cor com hex fixo fora de `var()` encontrada nesta varredura. Verificar se essa regra só se aplica dentro de `@media print` (se sim, não precisa mudar: a impressão já sai preto sobre branco). Se aplicar fora da impressão também, trocar para `var(--cor-texto-suave)`. |
| `src/ui/componentes/FundoAnimado.vue` | **[FATO]** o componente já cai para quadro estático sob `prefers-reduced-motion` (citado em `docs/design-visual.md` e na seção 6 de `docs/modo-adaptado.md`). Estender a mesma condição de desligar a animação para incluir o modo adaptado ligado. |
| `src/ui/componentes/PecaComentadaVisor.vue` | Grade de duas colunas do comentário ao lado do trecho da petição: hoje empilha abaixo de 700px (`docs/design-visual.md`, seção da petição). Acrescentar `:root[data-modo-adaptado="on"] .peticao-secao { grid-template-columns: minmax(0, 1fr); }` (ou seletor equivalente ao nome real da classe neste arquivo, conferir ao abrir o arquivo) para empilhar sempre que o modo está ligado, independente da largura da tela. |
| Tabelas comparativas (`src/ui/componentes/BlocoTeorico.vue`) | **Sem mudança estrutural.** O contêiner `.tabela-rolavel` (linhas 112-113 e 160-161 do arquivo) já isola a rolagem no próprio quadro da tabela, nunca na página, e o teste `tests/e2e/responsividade-360.spec.ts` já prova isso em 360px. Só herda tamanho de fonte e cor dos tokens. |
| Linha do tempo em desenho vetorial | **Não existe no código publicado** (confirmado por busca em `src/ui/componentes/`, nenhum arquivo encontrado; existe só em `mockups/unidade.html`). Sem ação nesta rodada; quando o componente for construído, aplicar a regra descrita em `docs/modo-adaptado.md`, seção 4 (linha da tabela sobre a linha do tempo). |

## 3. Números e valores, repetidos aqui para não precisar caçar no documento de especificação

**Tamanho e espaçamento (tudo dentro de `:root[data-modo-adaptado="on"]`):**

```
--escala-xs: 1.125rem;    /* 18px, era 13px */
--escala-sm: 1.3125rem;   /* 21px, era 15px */
--escala-base: 1.5rem;    /* 24px, era 17px */
--escala-md: 1.75rem;     /* 28px, era 20px */
--escala-lg: 2.4375rem;   /* 39px, era 28px */
--escala-xl: 3.5rem;      /* 56px, era 40px */
--escala-xxl: 4.5625rem;  /* 73px, era 52px */

--altura-linha-texto: 1.8;      /* era 1.7 */
--letra-espaco: 0.12em;         /* não existe fora do modo (0/normal) */
--palavra-espaco: 0.16em;       /* não existe fora do modo (0/normal) */
--paragrafo-espaco: 2em;        /* 2x o tamanho da fonte, calculado no elemento (em, não rem) */

--largura-leitura: 60ch;              /* era 68ch */
--largura-coluna-leitura: 60ch;       /* era 760px fixo; usar ch, não px, para acompanhar a fonte */

--alvo-toque-minimo: 44px;   /* era 24px (piso AA do resto do site) */
--foco-espessura: 4px;       /* era 2px (valor real do CSS, não o 3px do mockup) */
```

Borda estrutural de cartão: **2px sólida**, cor igual à do texto (`var(--cor-texto)`, que no modo é `#000000`), no lugar da sombra discreta usada fora do modo.

**Cores (fixadas pelo líder, 22/09/2026: fundo branco, texto preto):**

| Token | Valor no modo | Contraste medido |
|---|---|---|
| `--cor-fundo` / `--cor-fundo-elevado` / `--cor-fundo-sutil` | `#ffffff` | — |
| `--cor-texto` | `#000000` | 21:1 contra `#ffffff` |
| `--cor-texto-suave` | `#000000` | 21:1 (o modo não usa um segundo tom de cinza para "texto suave": ou é texto, ou não aparece) |
| `--cor-primaria` / `--cor-titulo-texto` (links, títulos, ícones) | `#0d2440` | 14.84:1 contra `#ffffff` (reaproveita o token que já existe no projeto, sem inventar cor nova) |
| `--cor-bordo` (link visitado, ênfase) | `#7a2331` | 9.44:1 contra `#ffffff` |
| Contorno de foco | `#000000`, 4px, `outline-offset` maior que fora do modo | 21:1 |
| `--cor-sidebar-fundo` | `#ffffff` | — |
| `--cor-sidebar-texto` | `#000000` | 21:1 |
| Acerto do quiz | fundo `#ffffff`, borda dupla sólida 3px `#000000`, ícone "✓" preto, texto "Resposta correta" | 21:1 |
| Erro do quiz | fundo `#ffffff`, borda tracejada 3px `#000000`, ícone "✕" preto, texto "Sua resposta, incorreta" (texto já existe, linha 71 de `CartaoPergunta.vue`) | 21:1 |

Nenhum tom de dourado (`--cor-acento`) nem de azul mais claro (`--cor-primaria-clara`) sobrevive dentro do modo: onde esses tokens forem usados (destaque de badge, fundo de hover), redefinir também para preto/branco puros dentro do bloco do modo, mesma régua.

## 4. Proibições

- **Nenhuma página separada.** O modo é um estado da mesma URL, mesmo componente, mesmo conteúdo. Não criar rota `/adaptado`, não criar variante de arquivo `.vue` paralela.
- **Nenhum conteúdo diferente do da página normal.** O modo muda tamanho, espaço e cor. Nunca omite um parágrafo, uma citação legal, uma pergunta do quiz ou qualquer texto presente fora do modo.
- **Nenhuma funcionalidade escondida no modo adaptado.** Busca, balão de artigo, quiz, progresso, tudo continua funcionando igual; só muda a apresentação.
- **O modo nunca liga sozinho a partir de preferência do sistema.** Nem `prefers-contrast: more`, nem `forced-colors: active`, nem `prefers-color-scheme` ativam o modo. Só o clique no botão (ou a leitura da escolha salva anteriormente por esse mesmo clique).
- **Nenhum `maximum-scale`/`user-scalable=no` na tag de viewport**, dentro ou fora do modo: bloquearia o zoom do navegador para todo mundo.

## 5. Testes a escrever, vistos falhando antes (L-35: red primeiro, depois o código mínimo que faz passar)

Seguir o padrão de teste já usado no projeto (Vitest para unidade/componente, Playwright para o que precisa de layout real, `docs/arquitetura.md`, seção 14).

1. **Persistência do modo** (`tests/componente/modoAdaptado.store.spec.ts`, mesmo molde de `tests/componente/tema.store.spec.ts`, que já existe e serve de referência direta): criar a store com `RepositorioMemoria`, confirmar que começa desligada, que `alternar()` liga e grava (`salvarModoAdaptado` chamado com `true`, espionado com `vi.spyOn`), que uma segunda instância criada depois de `repo.salvarModoAdaptado(true)` já nasce ligada.
2. **O botão anuncia o estado** (componente ou e2e): montar `BotaoModoAdaptado.vue`, conferir `aria-pressed="false"` e o rótulo "Leitura ampliada" no estado inicial; clicar; conferir `aria-pressed="true"` e o rótulo "Leitura normal".
3. **Ausência de rolagem lateral em 320px com o texto ampliado** (Playwright, `tests/e2e/`, mesmo padrão de `tests/e2e/responsividade-360.spec.ts`, mas `viewport: { width: 320, height: 800 }` e ligando o modo antes de medir, por exemplo gravando a chave de `localStorage` antes de `page.goto` ou clicando no botão): medir `document.documentElement.scrollWidth === document.documentElement.clientWidth` com o modo ligado, na home e na página de unidade.
4. **Espaçamento de texto forçado** (Playwright): com o modo ligado, injetar via `page.addStyleTag` os valores mínimos do WCAG 1.4.12 por cima (altura de linha 1.5×, espaço de parágrafo 2×, entrelinhas 0.12em, entrepalavras 0.16em) e conferir, por captura de retângulos (`getBoundingClientRect`) de dois elementos de texto vizinhos, que não há sobreposição.

Estes quatro são o mínimo pedido; os demais itens da seção 8 abaixo também precisam de alguma forma de verificação automatizada ou documentada como verificação manual, decisão do `frontend-engineer` caso a caso, mas sem pular os quatro acima.

## 6. Critérios de aprovação (para o `qa-engineer` medir depois, texto igual ao da seção 8 de `docs/modo-adaptado.md`)

1. Contraste medido (fórmula de luminância relativa do WCAG, nunca estimado) de cada par da seção 3 acima: todos ≥ 7:1, com o par principal (texto/fundo) medindo ≥ 20:1.
2. Em viewport de 320px de largura CSS, com o modo ligado, nenhuma rolagem horizontal da página (tabelas comparativas continuam isentas, rolando só dentro do próprio quadro, ver seção 2).
3. Teste de espaçamento de texto forçado (WCAG 1.4.12) sem corte, sobreposição ou truncamento de texto.
4. Todo alvo interativo medido ≥ 44×44 CSS px com o modo ligado.
5. Tamanho de fonte computado do corpo de texto ≥ 24px, medido pelo estilo computado da página.
6. Nenhuma distinção de acerto/erro do quiz sobrevive à conversão da tela para escala de cinza.
7. Nenhuma animação em execução com o modo ligado (fundo animado da home, transição da gaveta lateral, barra de progresso do quiz).
8. Botão do cabeçalho: rótulo visível, `aria-pressed` e `aria-label` corretos nos dois estados, conferidos pela árvore de acessibilidade, não só por captura de tela.
9. Recarregar a página e navegar para uma segunda página: o modo continua ligado nas duas vezes.

## 7. Quando terminar

Não marcar como concluído sozinho: `docs/modo-adaptado.md` e este briefing preveem revisão pelo `accessibility-specialist` contra os critérios da seção 6, antes de qualquer aprovação do `qa-engineer`. Comunicar ao orquestrador quando a implementação estiver pronta para essa revisão, citando os arquivos efetivamente tocados (pode divergir da lista da seção 2 se, ao abrir o código, algo descrito aqui não bater com o que está lá — nesse caso, reportar a divergência, não corrigir este documento por conta própria).
