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

## Rodada final, antes da publicação (mesmo protocolo de isolamento)

Pacote reconstruído às 07:29 de 23/09/2026. Mesma prova de isolamento da rodada anterior (variáveis de barramento/Wayland/X removidas, `XDG_RUNTIME_DIR`/`TMPDIR` próprios, GPU desligada, vigia concorrente, zero achados fora do baseline nas duas execuções desta rodada).

### Suíte de ponta a ponta, depois da correção do id duplicado

98 testes, dois alvos: **blink 49/49 passou, brave 49/49 passou, 0 falhas, 0 pulados.** O teste que antes falhava (`navegacao.spec.ts:65`, id duplicado) passa agora nos dois alvos, e a verificação automática de acessibilidade (axe-core) continua sem violação grave em nenhuma das duas unidades.

### Item 2: cartão e link na home

Dois cartões distintos na home (`Introdução ao Direito` e `Português e Redação Jurídica 1`), cada um com nome de cadeira em destaque (`h3.cartao-unidade__cadeira`) e `href` correto (`/p/p1/intr-direito/u1` e `/p/p1/redacao-juridica-1/u1`), confirmados nos dois temas, 360 e 1280px, com o modo adaptado ligado e desligado (8 combinações, sem rolagem lateral em nenhuma). Barra lateral da home: o botão da cadeira nova abre a lista, o link da unidade aponta para `/p/p1/redacao-juridica-1/u1`, e o clique navega de fato para lá.

### Item 3: resumo com 15 blocos

Os 15 blocos do resumo (eram 9, mais 6 nos últimos dois relatos, líder falou em "três blocos novos" mas a fonte tem 15 no total desde já) aparecem todos, e não há rolagem lateral em 360px.

### Item 4: rolagem de 13px no quiz, REPRODUZIDA (achado mais sério do que na rodada de manhã)

Repeti 10 carregamentos (tema escuro, 360px, modo adaptado ligado). Reproduziu em **2 das 10 tentativas**, não 0:

- **Tentativa 5: `scrollWidth=440` contra `clientWidth=360`, 80px de estouro** (bem mais grave que os 13px vistos de manhã). Pergunta: "Segundo a estrutura de oito passos ensinada em sala para a redação da petição inicial, qual é a sequência correta?" As quatro alternativas são listas separadas por vírgula (ex.: "Qualificação, Endereçamento, Direito, Fatos, Valor da Causa, Dos Pedidos, Data/Advogado/OAB/UF, Termos em que pede deferimento."), e a captura mostra uma borda vertical do cartão da pergunta esticada além da coluna de 360px, com o marcador da alternativa ("○") descolado do início do texto. Captura: `mockups/capturas/redacao-final/quiz-overflow-repro-tentativa5.png`.
- **Tentativa 9: `scrollWidth=373`, 13px de estouro** (o mesmo tamanho visto de manhã). Pergunta sobre o art. 1.658 do Código Civil (fundamento da partilha, casos Ana/Carlos e Marina/Ricardo). Captura: `mockups/capturas/redacao-final/quiz-overflow-repro-tentativa9.png`.

Achado real e intermitente (ligado ao conteúdo de perguntas/alternativas específicas com listas separadas por vírgula/barra que não quebram linha em 360px), não um artefato do meu método de teste. Não corrigido por mim, apenas relatado.

### Sessão do líder

Portal ativo, sem processo de teste sobrando nas duas execuções desta rodada. Coredumps: 742 → 746 durante a suíte e2e (4 novos), e 746 → 746 (nenhum novo) durante o QA visual final. Os 4 novos são o mesmo padrão sintético já visto de manhã (`kill -SEGV`/`kill -ABRT` numa aba de Konsole diferente da minha) mais um crash de `xmlstarlet` num projeto completamente diferente (`glintfx-win-lab`), também na mesma aba alheia — nada disso é dos meus processos de navegador.

### Capturas desta rodada

`mockups/capturas/redacao-final/`: 8 capturas da home (2 temas × 2 larguras × modo on/off), `home-sidebar-cadeira-nova.png`, `resumo-15-blocos-360.png`, e as 2 capturas do estouro do quiz reproduzido.
