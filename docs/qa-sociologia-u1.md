# QA da unidade nova (Sociologia Jurídica, 1a unidade)

Rodada sob a exceção autorizada à L-50 (23/09/2026, estendida em 28/09/2026): navegador sem janela, sem compositor. Relatório gravado incrementalmente; seções marcadas "em andamento" ainda não têm resultado.

## Artefato congelado (L-13)

- HEAD: `f1ef9d0139d5820b82cd59caef3b3299f9039d62` (main); `git status --short` vazio no início.
- `dist/`: 48 arquivos, sem rebuild (nenhum fonte é mais novo que `dist/index.html`). Prova de conteúdo: o chunk `meta-xnJBF1jL.js` traz a descrição nova de f1ef9d0 ("leituras críticas do artigo-base dentro de cada autor") e o chunk do resumo de Sociologia (`resumo-D66jbQpB.js`) não contém "Aprofundamento" (o único chunk com essa palavra é o resumo de Introdução ao Direito, unidade antiga, com o selo legítimo do Pachukanis).
- Comando do md5 (o mesmo no início e no fim): `find dist -type f | sort | xargs md5sum | md5sum`. Lista de arquivos: 48 linhas. md5 da lista no início: `49f4db455077b6c0ab99c69fef66fd68` (é o md5 do arquivo de lista, gerado com `find dist -type f | sort | xargs md5sum`).
- Servidor de teste: `vite preview` próprio, `127.0.0.1:4611` (porta livre, `--strictPort`, sem reuso). Conferido que serve o dist certo: md5 de `/index.html` servido igual ao de `dist/index.html`.

## Prova de isolamento e incidente da GeForce (L-09/L-50)

**Incidente, 1a tentativa (abortada pelo vigia).** Com apenas as variáveis removidas (`XDG_RUNTIME_DIR`/`TMPDIR` próprios, `DBUS_SESSION_BUS_ADDRESS`/`WAYLAND_DISPLAY`/`DISPLAY` fora, `--headless=new --disable-gpu`), o processo `--type=gpu-process` do Chromium abriu descritor para `/dev/nvidia*` (o vigia registrou, em duas tentativas, um PID novo fora do baseline com `nv=[pid]`; na segunda com cmdline: `chromium-browser --type=gpu-process --no-sandbox ... --headless=new --ozone-platform=headless --use-angle=...`). Ou seja: `--disable-gpu` NÃO basta para impedir o Chromium de abrir o dispositivo NVIDIA nesta máquina. O vigia matou os processos e abortou, como pedido. Nenhum teste real tinha começado; só a página inicial do site foi aberta. Nenhum trabalho de GPU foi executado (só abertura de dispositivo pelo processo de GPU do navegador), mas é um toque, e fica registrado.

**Endurecimento adotado a seguir (não estava no protocolo, adicionei por conta do incidente; ver decisão pendente no fim).** Todo processo de navegador, Playwright e Node passou a rodar dentro de `bwrap --bind / / --dev /dev --tmpfs /run/user --die-with-parent`: um `/dev` mínimo (só `null zero random urandom tty pts shm ...`), sem `/dev/nvidia*` e sem `/dev/dri`, e sem `/run/user` (nem socket Wayland, nem barramento, nem portal). É isolamento por ambiente que torna o toque impossível, em vez de depender de flag. Sem compositor, sem dbus, sem instalar nada (`bwrap` já existia). Conferido de dentro do bwrap: `ls /dev/nvidia*` e `ls /dev/dri` inexistentes; `/run/user` vazio. Vigia reiniciado com log de cmdline e volta de 0,7 s; baseline: 51 PIDs de cliente de socket do líder e 1 PID com NVIDIA (o `RDD Process` do Firefox do próprio líder, PID 5066).

**Prova de ambiente (leitura de `/proc/<pid>/environ` do processo principal real do navegador em voo, dentro do bwrap):**

| Navegador | pid principal | variáveis relevantes no environ | dbus-daemon/launch antes/depois | processos do navegador varridos com DISPLAY/WAYLAND_DISPLAY/DBUS_SESSION_BUS_ADDRESS |
|---|---|---|---|---|
| Chromium | 1224162 | `TMPDIR=/var/tmp/qa-soc/tmp`, `XDG_RUNTIME_DIR=/var/tmp/qa-soc/xdg` (as três proibidas ausentes) | 0 / 0 | 0 de 9 |
| Brave | 1224715 | idem | 0 / 0 | 0 de 9 |
| Firefox 156 (WebDriver BiDi puro, perfil descartável em `/var/tmp/qa-soc/tmp/ffp-*`, sem geckodriver) | 1234575 | idem (`TMPDIR`, `XDG_RUNTIME_DIR` próprios; as três proibidas ausentes) | 0 / 0 | 0 dos processos legíveis do Firefox de teste (o `pgrep` também enxerga o Firefox do líder; não foi tocado) |

Prova de condução real do Firefox: captura da home renderizada (`mockups/capturas/sociologia/ff-prova-home.png`, mesma imagem: 3 cartões, barra lateral com 10 períodos).

Vigia, após o endurecimento: nenhuma violação nas provas de Chromium e Brave (sem `vigia.log` gerado).

## 1. Suíte e2e completa (Chromium e Brave)

Config de override em scratch (`/var/tmp/qa-soc/pw.config.mjs`, o do projeto não foi tocado), servidor próprio `127.0.0.1:4611`, `--workers=4`, `retries: 0`. Contagem real: **58 testes por navegador (116 no total, 14 arquivos)**, não 28 (o briefing estava defasado; `rotasDoCurriculo.ts` gera testes a partir do currículo). Resultado: **116 passaram, 0 falharam, 0 pularam** (32 s). Inclui a varredura de 360px do quiz de cada cadeira (Sociologia: as 80 perguntas, lidas da tela, com conferência das letras A a E), o axe de acessibilidade das abas de unidade e os balões de artigo (`balao-dispositivo-ponteiro`, `balao-dispositivo-producao`). Log: `/var/tmp/qa-soc/res/e2e-full.log`.

## 2. Unidade nova, verificações automáticas (Chromium, Brave, Firefox 156)

Scripts próprios em `/var/tmp/qa-soc/` (fora do repositório), mesmo código de verificação nos três navegadores (Playwright para Chromium/Brave, BiDi puro para Firefox). Resultados brutos: `/var/tmp/qa-soc/res/checks-*.json`.

| Verificação | Chromium | Brave | Firefox |
|---|---|---|---|
| Resumo abre com 12 blocos (`bloco-0` a `bloco-11`) | passou | passou | passou |
| Quadro Marx / Durkheim / Weber com linha de Ehrlich (linhas: Autor, Karl Marx, Émile Durkheim, Max Weber, Eugen Ehrlich) | passou | passou | passou |
| Ehrlich e Kelsen aparecem no texto | passou | passou | passou |
| Nenhum selo (`.bloco-teorico__badge` = 0) e nenhum bloco/texto "Aprofundamento" (a palavra "aprofunda" só aparece no verbo, no bloco 3: "o bloco 9 aprofunda Ehrlich e o contraste com Kelsen") | passou | passou | passou |
| 360px: quadro rola dentro de `.tabela-rolavel` (scrollWidth 2227 contra 296 visíveis), página sem rolagem horizontal (`scrollWidth` 360 = `clientWidth` 360) | passou | passou | passou |
| Quiz "Pergunta 1 de 80"; as 80 perguntas com 5 alternativas e letras A a E, ids únicos | passou | passou | passou |
| Placar: após responder a k-ésima, "Acertos: x de k / Falhas: y de k" nas 80 | passou | passou | passou |
| Nota neutra do caderno ("Esta resposta vem do caderno de estudo; não é o gabarito oficial da professora.") exatamente nos ids 1 a 10 e em nenhum outro | passou | passou | passou |
| `/peticao` de Sociologia abre "Página não encontrada"; abas da unidade só "Resumo" e "Quiz"; nenhum link de petição na página, na home, no menu lateral nem na busca | passou | passou | passou |
| Home: 3 cartões distintos (Introdução ao Direito, Português e Redação Jurídica 1, Sociologia Jurídica), nenhum link de petição | passou | passou | passou |
| Barra lateral do 1º período: exatamente as 3 cadeiras do currículo; períodos 2 a 10 sem cadeira inventada | passou | passou | (não rodado) |
| Busca "Durkheim" e "Ehrlich" encontram blocos e quiz de Sociologia | passou | passou | passou |
| Regressão: quizzes antigos (60 perguntas Introdução ao Direito, 30 Redação) só com 4 alternativas e sem letras | passou | passou | (não rodado, por briefing só Sociologia) |
| Balões de artigo nas unidades antigas abrem junto ao ponteiro com texto da lei | passou (suíte e2e `balao-dispositivo-ponteiro` e `balao-dispositivo-producao`) | passou (idem) | (não rodado) |
| Ids duplicados no DOM com o menu expandido / `aria-controls` sem alvo (o CRÍTICO `lista-u-u1` do QA anterior não reaparece) | 0 / 0 | 0 / 0 | 0 / 0 |
| Erros de console nas rotas da unidade nova (resumo, quiz, `/peticao`) | 0 | 0 | 0 |

## 3. Varredura de rolagem horizontal, modo adaptado, 360px (item 4)

Todas as perguntas de todos os quizzes, percorridas em ordem (não depende do sorteio), com medição de `scrollWidth <= clientWidth` do documento ANTES e DEPOIS de responder cada pergunta, nos temas claro e escuro. Além da suíte e2e (que só cobre o tema escuro).

| Quiz | Chromium | Brave | Firefox |
|---|---|---|---|
| Introdução ao Direito (60) claro e escuro | 0 estouros | 0 estouros | não pedido |
| Português e Redação Jurídica 1 (30) claro e escuro | 0 estouros | 0 estouros | não pedido |
| Sociologia Jurídica (80) claro e escuro | 0 estouros | 0 estouros | 0 estouros (largura útil 348, barra de rolagem do Firefox) |

Critério pedido: passou nos três. O critério, porém, não pega o defeito CRÍTICO 1 abaixo (o texto quebra letra a letra em vez de estourar a largura).

## 4. axe-core (item 6)

Rotas de resumo e quiz de Sociologia, tema claro e escuro, 1280 e 360, modo adaptado ligado (quiz com 4 perguntas respondidas, para exercitar acerto e erro), nos três navegadores, resultado idêntico: **zero violações critical ou serious**. Apenas dois achados moderate, ambos também presentes nas unidades antigas (medido em Introdução ao Direito e Redação): `heading-order` (resumo: `h4` do quadro-resumo do bloco 3; quiz: enunciado `h3` logo após `h1`) e `landmark-unique` (`aria-label="Quadro-resumo de revisão"` repetido nos blocos do resumo).

## 5. Console (item 7)

Zero erros de console, `pageerror` ou falha de requisição de rede nas rotas da unidade nova (resumo, quiz, `/peticao`, varreduras dos quizzes) em Chromium, Brave e Firefox.

## 6. Conteúdo (item 8)

- `bash scripts/verificar-proibicoes.sh` (padrão, 343 arquivos): **reprova, rc=1, 82 ocorrências de um termo**, todas em `test-results/` (artefatos `error-context.md` de 22/09, diretório ignorado pelo git, nenhum em `src/` nem `public/`). `bash scripts/verificar-proibicoes.sh dist/` (42 arquivos): **rc=0, limpo**. Termos não reproduzidos aqui.
- Travessão (U+2014) e meia-risca (U+2013) em `src/conteudo/p1/sociologia-juridica/`: **0**.

## 7. Matriz de capturas (item 5)

`mockups/capturas/sociologia/`: 16 capturas Chromium `{resumo,quiz}-{claro,escuro}-{360,1280}-{normal,adaptado}.png` (página inteira), mais recortes de viewport `vp-resumo-*` (topo, quadro comparativo, quadro rolado, bloco Ehrlich) e `hdr-*`, e 4 de Firefox (`ff-quiz-claro-1280-normal.png`, `ff-quiz-escuro-360-adaptado.png`, `ff-resumo-*-topo/quadro.png`; no Firefox o resumo saiu em recortes de viewport porque a página inteira passa do limite de 65535 px). Olhadas por mim: resumo 360 normal (topo, quadro, quadro rolado), resumo 360 adaptado claro e escuro (topo e quadro), resumo 1280 (quadro), quiz 360 normal claro e escuro, quiz 360 adaptado claro e escuro, quiz 1280 normal claro, quiz 1280 adaptado escuro, Firefox quiz 360 adaptado e quadro 1280. Não olhei uma a uma as demais (resumo 1280 adaptado, quiz 1280 escuro normal, quiz 1280 claro adaptado); a medição automática de corte/estouro (`scrollWidth`, elementos além da viewport) não apontou nada nelas além dos itens abaixo.

O que vi de bom: quadro comparativo legível em 1280 e rolando dentro do próprio contêiner em 360, com sombra lateral indicando continuação; quiz em 1280 com letras A a E alinhadas, marca "Correta" e explicação legíveis, nos dois temas; nota neutra do caderno presente onde deve.

## Achados

### CRÍTICO 1. Modo adaptado a 360px: o texto das alternativas do quiz de Sociologia colapsa numa coluna de 3 a 16 px
Em modo adaptado, 360px, a linha da alternativa (radio, letra A a E, texto, marca "Correta"/"Sua resposta, incorreta") deixa o texto com **16 px de largura no Chromium e no Brave e 3 px no Firefox, em todas as 80 perguntas**; o texto quebra letra a letra ("O / es / tu / do / da / vi ..."), e uma única alternativa chega a 5464 px de altura (Chromium/Brave) e a página do quiz a 13113 px (Firefox). É inutilizável para exatamente o público do modo. Medido em `/var/tmp/qa-soc/larg.mjs`, largura de `.cartao-pergunta__alt-texto` após responder: Sociologia adaptado 16/16/3 px (Chromium/Brave/Firefox); as unidades antigas já eram apertadas (54/54/41 px), mas legíveis por palavra; sem modo adaptado, 80 a 87 px em Sociologia (Chromium) contra 104 a 116 nas antigas, com palavras cortadas no meio ("desigualdad/es", "concretame/nte"). A coluna extra da letra (`comLetras` em `src/ui/componentes/CartaoPergunta.vue`, linhas 58 a 82, o `span.cartao-pergunta__letra` somado ao `span.cartao-pergunta__marca` na mesma linha flex) é o que empurra o texto. Capturas: `quiz-claro-360-adaptado.png`, `quiz-escuro-360-adaptado.png`, `ff-quiz-escuro-360-adaptado.png`; normal: `quiz-claro-360-normal.png`. A varredura `quiz-sem-rolagem-lateral.spec.ts` passa mesmo assim porque só mede `scrollWidth`. Sugestão (não aplicada): em telas estreitas e/ou modo adaptado, deixar a marca "Correta" abaixo do texto (linha própria) e reduzir a coluna da letra.

### IMPORTANTE 1 (pré-existente, atinge as três cadeiras; não introduzido por f1ef9d0). Cabeçalho em modo adaptado a 360px
Medido igual em Introdução ao Direito, Redação e Sociologia (Chromium): o cabeçalho fixo tem 433 px (476 em Redação) de altura contra `--altura-cabecalho` de 220 px, então cobre o título da página (h1 em y 284 a 457, cabeçalho até 433). Ao rolar, o cabeçalho ganha fundo `rgba(13,36,64,0.86)` (azul-marinho) mas o texto da trilha continua preto (`rgb(0,0,0)`): preto sobre azul-marinho, ilegível. Capturas: `hdr-soc-escuro-360-adaptado-scroll.png`, `vp-resumo-claro-360-adaptado-topo.png`, `vp-resumo-escuro-360-adaptado-quadro.png`.

### IMPORTANTE 2 (pré-existente, site inteiro). Botões "Leitura ampliada" e "Tema" fora da tela em 360 a 453 px, modo normal
O cabeçalho tem 487 px de conteúdo (`scrollWidth` 487 contra `clientWidth` 360) e corta o excedente: "Leitura ampliada" fica em x 349 a 393 (pedaço visível de 11 px) e "Tema" em 409 a 453, inteiro fora, em qualquer largura até cerca de 453 px (medido em 360, 390, 412; home e as duas unidades). O botão feito para a pessoa com baixa visão fica inalcançável no celular em modo normal. A página não rola na horizontal (por isso os testes passam). Captura: `hdr-soc-360-normal-topo.png`.

### COSMÉTICO 1 (pré-existente). axe moderate: `heading-order` e `landmark-unique` (ver seção 4); iguais nas unidades antigas.
### COSMÉTICO 2. Faixa dourada de progresso sobre o "1º período" da barra lateral em 1280 (`quiz-claro-1280-normal.png`, canto superior esquerdo da barra), visível também no resumo.
### COSMÉTICO 3. `test-results/` (ignorado pelo git) contém 82 ocorrências do termo proibido; faz `verificar-proibicoes.sh` (varredura padrão) reprovar localmente. `dist/` está limpo. Apagar o diretório é decisão do dono (não apaguei).
### COSMÉTICO 4. Resultados de busca mostram a trilha com ids crus (`p1 · sociologia-juridica · u1`) em vez dos nomes (Sociologia Jurídica, Unidade 1); não verifiquei se as unidades antigas fazem o mesmo.
### Observação (não é defeito de produto). O quadro comparativo tem 2227 px de largura para 5 colunas (rola dentro do contêiner tanto em 1280, onde só a coluna "Como vê o direito" cabe, quanto em 360). Funciona, mas em 1280 a pessoa precisa rolar para ver conceito-chave, método e exemplo.

## Ocorrências de processo (não são achados do produto)
- **GeForce (L-09).** Na 1a tentativa, o processo `--type=gpu-process` do Chromium abriu `/dev/nvidia*` apesar de `--disable-gpu` (registrado pelo vigia, que abortou como devido; nenhum trabalho de GPU). Daí em diante tudo rodou dentro de `bwrap` sem `/dev/nvidia*`, sem `/dev/dri` e sem `/run/user` (ver seção de isolamento). Esse endurecimento foi iniciativa minha, não estava no protocolo autorizado; o líder deve confirmar se aceita. Vigia final: 0 violações minhas; 3 eventos "ALHEIO-IGNORADO" (processos de outra sessão do usuário, fora da minha árvore) e um falso positivo idêntico na fase anterior que abortou a rodada e exigiu reiniciar o vigia (22:32:44).
- **Firefox, navegação intermitente.** Em cerca de 4 de 10 execuções iniciais, o BiDi devolveu `NS_BINDING_ABORTED` ou ficou na URL semente `/404-qa-semente` (não chegou à rota-alvo). Depois de eu adicionar verificação e repetição de `goto` no meu script, 5 execuções seguidas, inclusive a completa final, passaram sem nenhuma repetição registrada. Causa não isolada (suspeito do meu harness ou de carga da máquina; não há evidência de defeito do site, sem erro de console). Todos os números acima do Firefox vêm da execução completa final limpa.
- Suíte e2e: 116 de 116 na primeira execução, sem reprodução isolada necessária.

## Encerramento (L-13)
- HEAD no início e no fim: `f1ef9d0139d5820b82cd59caef3b3299f9039d62`; `git status --short` no fim: só `?? docs/qa-sociologia-u1.md` (este relatório; `mockups/capturas/` é ignorado pelo git).
- md5 de `dist/` (mesmo comando, `find dist -type f | sort | xargs md5sum`, 48 arquivos): início e fim idênticos, `md5sum` da lista `49f4db455077b6c0ab99c69fef66fd68` (`cmp` sem diferença).
- `systemctl --user is-active xdg-document-portal.service`: `active`. Servidor `vite preview` da porta 4611 encerrado; nenhum processo de Chromium/Brave/Firefox/Playwright meu sobrando (os que o `pgrep` ainda mostra são do líder e de outras sessões: `brave-browser --remote-debugging-port=9222`, servidores MCP). Teto de processos do usuário 4000, carga baixa (loadavg 0,8).
- Nada instalado, nada baixado, nenhum compositor, nenhum dbus (`dbus-daemon/launch` 0 antes e depois), nenhum xdotool. Scratch em `/var/tmp/qa-soc/` (scripts, resultados brutos, `vigia*.log`); não apaguei.
