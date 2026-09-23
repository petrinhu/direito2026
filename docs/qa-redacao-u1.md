# QA da unidade nova (Português e Redação Jurídica 1, U1)

Rodada sob exceção autorizada à L-50 (23/09/2026): navegador sem janela, sem compositor. Isolamento provado por baseline de descritores de arquivo (socket Wayland, barramento de sessão, dispositivo NVIDIA) antes de começar, vigia concorrente durante toda a execução, e confirmação da sessão do líder intacta ao final. Nenhuma instalação nova (binários chromium-browser e brave-browser já usados pelo `playwright.config.ts` do projeto).

## Status

Concluído.

## Prova de isolamento (L-50)

Variáveis do processo isolado, comparadas com a sessão do líder:

| Variável | Sessão do líder | Processo isolado |
|---|---|---|
| `WAYLAND_DISPLAY` | `wayland-0` | removida |
| `DISPLAY` | `:0` | removida |
| `DBUS_SESSION_BUS_ADDRESS` | `unix:path=/run/user/1000/bus` | removida |
| `XDG_RUNTIME_DIR` | `/run/user/1000` | `/var/tmp/xdg-e2e` (0700, próprio) |
| `TMPDIR` | (padrão) | `/var/tmp/pwt` (0700, próprio) |

Navegador sempre headless (`--headless=new --disable-gpu --no-sandbox`), configuração de override só desta rodada, nunca o `playwright.config.ts` do projeto.

Vigia concorrente: um processo `find` por volta (nunca um processo por item), varrendo `/proc` inteiro atrás de qualquer processo (fora do baseline pré-existente) com descritor aberto para o socket Wayland do líder, o barramento de sessão dele, ou dispositivo NVIDIA. A primeira versão do vigia disparou falso positivo contra o próprio compositor do líder (`kwin_wayland_wrapper`, PID pré-existente, dono legítimo do lock do Wayland dele); corrigido para excluir o baseline antes de rodar de verdade. Na execução real, zero achados fora do baseline; nenhum abort.

Checagem final: `xdg-document-portal.service` segue `active`; nenhum processo de teste (chromium/brave/playwright) sobrou vivo; contagem de despejos de memória (`coredumpctl`) igual antes e depois (736); contagem de processos do usuário (1790 para 1800, dentro da variação normal de churn da própria sessão de agentes, longe do teto de 4000).

## Suíte de ponta a ponta

Execução completa, dois alvos (`blink` = chromium, `brave`), 49 testes por alvo (98 no total), incluindo a verificação automática de acessibilidade (axe-core), que já cobre as três abas da unidade nova.

| Alvo | Passou | Falhou | Pulou |
|---|---|---|---|
| blink | 48 | 1 | 0 |
| brave | 47 | 2 | 0 |

Falha 1 (real, reproduzida isolada, nos dois alvos): `tests/e2e/navegacao.spec.ts:65` ("cada aba renderiza seu conteúdo uma única vez, sem id duplicado").

```
Error: expect(received).toEqual(expected)
- Expected  - 1
+ Received  + 6
- Array []
+ Array [ Array [ "lista-u-u1", 2 ] ]
```

Falha 2 (só brave, não reproduzida): `tests/e2e/modo-adaptado-espacamento.spec.ts:16`, erro `expect(total).toBeGreaterThan(1)` recebendo `0` parágrafos em `main p`. Repetida 3 vezes isolada (1 worker, mesmo alvo brave): passou nas 3. Achado de contenção sob paralelismo de 8 workers, não defeito do produto.

## Achados por severidade

### CRÍTICO: id duplicado `lista-u-u1` no menu de currículo

`src/ui/componentes/MenuCurriculo.vue:160` e `:175` geram o id da lista de unidades como `lista-u-${unidade.id}`, usando só o id da unidade (`u1`). Agora que existem duas cadeiras publicadas no 1º período (Introdução ao Direito e Português e Redação Jurídica 1), as duas têm uma unidade `u1`, e as duas geram o mesmo id `lista-u-u1`. HTML inválido (dois elementos com o mesmo id), com risco real para `aria-controls`/`getElementById`, mesmo funcionando hoje por sorte de ordem no DOM. Não corrigido por mim, apenas relatado (regra do QA em execução).

### OBSERVAÇÃO (não CRÍTICO): rolagem horizontal de 13px, quiz, tema escuro, 360px, modo adaptado ligado

Na varredura sistemática (3 rotas × 2 temas × 2 larguras × 2 modo = 24 combinações, uma captura cada), a combinação `quiz` + `escuro` + `360px` + `modo=on` mediu `scrollWidth=373` contra `clientWidth=360` (13px de estouro). Captura: `mockups/capturas/redacao/quiz-escuro-360-modoon.png`. Como o quiz sorteia a ordem das perguntas a cada carregamento, tentei reproduzir de novo com seeds novas 5 vezes seguidas e não recriei o estouro; é provável que dependa do texto de uma pergunta/alternativa específica que não quebra linha nessa combinação de tema e largura. As outras 23 combinações não têm rolagem horizontal (`scrollWidth == clientWidth`).

### Regressão anterior, confirmada corrigida

O achado CRÍTICO 2 de uma rodada de QA anterior (citação de artigo aparecendo como código HTML cru na explicação do quiz) está corrigido: `src/ui/componentes/CartaoPergunta.vue` usa `v-html` no enunciado e nas alternativas, com comentário datado de 22/09/2026 documentando a correção. Nenhuma marcação crua apareceu nas capturas desta rodada.

## Conferência visual e funcional, item a item

1. **Checklist do art. 319** (`.checklist-319`): clique marca o item na hora, e o estado sobrevive a um recarregamento completo da página (checado marcando um item e conferindo o mesmo estado após `reload`).
2. **Cinco cartões que viram por teclado** (`.cartoes-cinco-perguntas__cartao`, 5 encontrados): o primeiro vira com Enter, os outros quatro com Espaço, todos mudando `aria-pressed` de `false` para `true`.
3. **Quadro de dicas de forma** (`.dicas-forma`): presente na página.
4. **Bloco do método fato/fundamento/pedido, caso Ana e Carlos**: presente no resumo, com os rótulos "Fato:"/"Fundamento:" e o texto do caso (Ana, 38, e Carlos, 42, comunhão parcial, filhos Pedro e Lucas).
5. **Petição comentada**:
   - Enunciado do caso (Marina e Ricardo) aparece por inteiro, confirmado por posição no DOM que vem antes da primeira seção da peça (`compareDocumentPosition`), não só por presença.
   - Rótulos FATO/FUNDAMENTO/PEDIDO aparecem em negrito (`<strong>`, `font-weight: 700`) nos cinco tópicos de "Do Direito" (15 ocorrências, 5 tópicos × 3 rótulos).
   - "Dos Pedidos" termina, nesta ordem, com a citação do réu (item i) e a produção de todas as provas (item j), como no código-fonte.
6. **Balão de artigo, artigo novo**: testado com o art. 1.571, IV, do Código Civil (`cc-1571-iv`, "IV - pelo divórcio."). Uma primeira checagem por clique programático deu uma distância enganosa (1676px) entre o ponteiro e o balão; reproduzi de novo com a mesma técnica que o teste oficial do projeto usa (`page.mouse.move` com passos intermediários, não clique), e nas três ocorrências do botão na página o balão abre a cerca de 160-200px do ponto do ponteiro, sempre com o texto real da lei. O primeiro resultado era falso alarme do meu próprio método de teste, não um defeito do produto.
7. **Quiz com 30 perguntas**: confirmado pelo texto "Pergunta 1 de 30" exibido na página.
8. **Barra lateral, 1º período**: mostra exatamente "Introdução ao Direito" e "Português e Redação Jurídica 1", batendo com `src/conteudo/curriculo.ts`; nenhum item inventado.
9. **Unidade antiga (Introdução ao Direito)**: continua abrindo, e o balão de artigo dela continua funcionando (testado com o primeiro gatilho de citação encontrado na página).

## Capturas

Em `mockups/capturas/redacao/`: 24 capturas da varredura sistemática (`{resumo,peticao,quiz}-{claro,escuro}-{360,1280}-modo{on,off}.png`), mais `sidebar-periodo1-aberto.png` e `peticao-balao-art1571-aberto.png`.
