# QA de produção: Caderno de Direito no ar (Sociologia Jurídica e consertos)

Alvo: https://direito2026.drpetrus.top. Rodada sem edição de código, sem commit e sem publicação. Scratch em `/var/tmp/qa-prod/` (fora do repositório). Relatório gravado incrementalmente.

## Artefato (L-13)
- HEAD local: `9e448a351f0ca0f78fcbb73dcdce189bfa706da6`, `git status --short` no início: vazio.
- md5 da lista de `dist/` (`find dist -type f | sort | xargs md5sum | md5sum`) no início: `0e73053e6cc1315a4074dfa2aad3098e`, igual ao pacote publicado informado.

## Isolamento
- Tudo roda dentro de `bwrap --bind / / --dev /dev --tmpfs /run/user`; dentro da caixa `/dev` só tem `core fd full null ptmx pts random shm stderr stdin stdout tty urandom zero` (sem `nvidia*`, sem `dri`), `/run/user` vazio. Headless, `--disable-gpu`, `XDG_RUNTIME_DIR` e `TMPDIR` próprios em `/var/tmp/qa-prod` (700), `DISPLAY`/`WAYLAND_DISPLAY`/`DBUS_SESSION_BUS_ADDRESS` removidos.
- Prova por `/proc/<pid>/environ` (Chromium, Brave, Firefox): só `TMPDIR` e `XDG_RUNTIME_DIR` próprios; processos varridos sem variável proibida: 0; fds em `/dev/nvidia*`: 0.
- Vigia (cópia do da rodada anterior, um processo de varredura por volta de 0,7 s; troquei só os caminhos e removi a linha que matava `vite preview`, porque nesta rodada não há servidor local e ela poderia atingir processo alheio).

- Vigia: 1887 voltas na última execução, 1 aborto por processo de outra sessão do usuário (trecho refeito), 0 violações minhas. Contagem de tentativas do primeiro trecho: 5 falhas foram erro de caminho do meu próprio comando (módulo não achado), não aborto.
- `xdg-document-portal.service`: active no fim. Nenhum processo meu sobrando (um Firefox de sonda ficou pendurado e foi encerrado por PID). GeForce não tocada. Nada instalado nem baixado.

## Encerramento (L-13)
HEAD `9e448a3` e `git status` (só este relatório) no fim; md5 da lista de `dist/` no fim `0e73053e6cc1315a4074dfa2aad3098e`, igual ao início.

## Resultados (Chromium, Brave, Firefox 156 BiDi; tráfego: 1 processo por vez, sem laços de carga)

| Verificação | Chromium | Brave | Firefox |
|---|---|---|---|
| Resumo: 12 blocos, quadro Marx/Durkheim/Weber + linha Ehrlich, 0 selos "Aprofundamento" (1280 e 360) | passou | passou | passou |
| Quiz: "Pergunta 1 de 80", 80 ids únicos, 5 alternativas A a E nas 80, placar "k de k" a cada resposta, nota do caderno só nas ids 1 a 10, sem rolagem lateral a 1280 | passou | passou | passou |
| /peticao de Sociologia: "Página não encontrada"; abas só Resumo e Quiz; petição de Redação continua existindo | passou | passou | passou |
| Home com 3 cartões; barra lateral com as 3 cadeiras; busca "Durkheim" (8 resultados) e "Ehrlich" | passou | passou | passou |
| Quiz a 360px adaptado, 80 perguntas x claro/escuro: texto da alternativa antes/depois de responder (mín. px) | 193/187 | 193/187 | 180/174 |
| Quiz 360 adaptado: marca "Correta/Sua resposta" em linha própria e dentro do cartão, sem rolagem lateral (3 cadeiras, 2 temas) | passou | passou | passou (Sociologia) |
| Cabeçalho normal 320/360/412/1024, home e 3 resumos: controles dentro da tela, sem cobertura, sem estouro (16 combinações) | passou | passou | passou |
| Título abaixo do cabeçalho, adaptado 360 (home + 3 resumos) | 4/4 | 4/4 | 4/4 |
| Trilha: item da página atual visível, sem cobertura, sem corte seco, 320 a 1280 passo 64, normal e adaptado, 4 rotas (128 combinações) | 0 falhas | 0 falhas | 0 falhas |
| Anel de foco da trilha com Tab real, 10 casos (360/412/1280, 2 temas), nenhum recorte por ancestral | passou | passou | limitação: `:focus-visible` não casa em headless, não testado |
| Regressão: unidades antigas com 4 alternativas e sem letras (60 e 30 perguntas); marca da resposta em linha própria nas 3 cadeiras | passou | passou | 4 alt/sem letras passou |
| Balão de artigo: abre junto ao ponteiro com o texto do art. 319, II, do CPC | passou (hover) | passou (hover) | por clique passou; hover não exercitável (headless Firefox: `hover`/`pointer` = none), limitação |
| Service worker: registra na 1a visita; precache de 42 itens com todo o manifesto em cache e os chunks da Sociologia (resumo, meta, quiz); página fica controlada | passou | passou | passou |
| 2a visita OFFLINE: resumo (12 blocos, quadro Ehrlich), quiz (80, responde, placar), navegação e home (3 cartões) | passou | passou | não testado (BiDi sem emulação offline) |
| axe-core: 6 rotas x 2 temas x adaptado on/off x 1280/360 (48) | 0 critical/serious | 0 | 0 |
| Console nas rotas visitadas | 0 erros | 0 erros | ver achado COSMÉTICO 2 |

Axe: só os dois moderate de sempre (`heading-order` 48/48, `landmark-unique` 24/48), sem violação nova.

## Capturas (`mockups/capturas/producao/`, ignoradas pelo git; olhadas uma a uma)
- `home-claro/escuro-360/1280.png`: 3 cartões (Introdução, Redação, Sociologia, "Resumo de estudo e quiz" no da Sociologia), barra lateral com 10 períodos a 1280, hero azul, rodapé; a 360 a gaveta some e o menu vira ícone; cabeçalho em duas linhas, tudo dentro da tela. Faixa dourada sobre "1º período" na lateral (pré-existente) e uma faixa fina de 8px acima do cabeçalho nas capturas de página inteira do Chromium (artefato de captura full-page, ausente nas de viewport e no Firefox).
- `resumo-claro/escuro-360/1280.png`: título, "0 de 12 blocos lidos", abas Resumo/Quiz, sumário numerado com os 12 blocos; trilha "... Sociologia Juríd... / Unidade 1 / Resumo" a 1280 e "... Resumo" a 360, com a página atual visível.
- `resumo-quadro-*.png`: quadro comparativo com Karl Marx, Émile Durkheim, Max Weber e Eugen Ehrlich (linha "Direito vivo: normas que surgem das práticas sociais"), dentro de contêiner rolável; a 1280 o contêiner (760px) mostra só duas colunas e o resto exige rolagem horizontal, com sombra na borda direita.
- `quiz-*-360/1280.png`: letras A a E, texto com largura útil, após responder: B vermelha "Sua resposta, incorreta" e D verde "Correta" em linha própria dentro do cartão, explicação e nota "Esta resposta vem do caderno de estudo; não é o gabarito oficial da professora." a 1280, placar "Acertos: 1 de 1". Legível e sem corte nos dois temas.
- `ff-*.png` (home 1280, resumo 1280 e 360, quadro, quiz 1280 e 360 escuro): mesmo aspecto do Chromium; no Firefox a 360 o ícone do tema cai para uma terceira linha sozinho (COSMÉTICO 3).
- `balao-peticao-1280.png`: balão de 480px logo acima do ponteiro, com o inciso II do art. 319 e "consultado em 2026-09-21 · fonte oficial".
- `anel-trilha-claro-1280.png`: caixa de foco branca de 2px inteira em volta de "Resumo".

## Achados
### CRÍTICO
Nenhum.
### IMPORTANTE
Nenhum.
### COSMÉTICO
1. Rodapé em produção mostra travessão (U+2014) em texto visível: "Copyright ©", travessão, "2026", travessão, "2026" (todas as capturas, todas as rotas). Viola L-32 e o requisito de acabamento do texto; o intervalo de anos também fica igual nos dois extremos (2026[travessão]2026). Pré-existente (já registrado em `qa-conserto-cabecalho-quiz.md`, cosmético 4), ainda no ar.
2. Firefox registra 3 erros de console "downloadable font: download failed ... status=2152398850" (NS_BINDING_ABORTED) nas fontes Inter 400/700 e Lora 700. Provado artefato do harness: só ocorre quando uma navegação corta o carregamento da página anterior (semente seguida da rota); carregamento único, com 6 s de espera, dá 0 erros e as fontes ficam `loaded`. Sem ação no produto.
3. Firefox a 360px, modo normal: ícone do tema sozinho numa terceira linha do cabeçalho (altura 170 px; Chromium/Brave 115 px). Pré-existente, sem cobertura nem estouro.
4. Quadro comparativo a 1280px mostra só 2 colunas de 4 sem rolagem; as demais exigem rolagem horizontal do contêiner (desenho aprovado em rodada anterior; registro apenas).

## Limitações
Firefox: sem `:focus-visible` real (anel), sem hover (balão por clique testado), sem offline. Trilha e anel testados em claro; escuro só no anel.
