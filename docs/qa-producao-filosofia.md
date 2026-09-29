# QA de produção: Filosofia Jurídica no ar

Alvo: https://direito2026.drpetrus.top. Rodada sem edição de código, sem commit e sem publicação. Scratch em `/var/tmp/qa-prod/` (fora do repositório). Capturas em `mockups/capturas/producao-filosofia/` (43 arquivos, ignoradas pelo git).

## Artefato (L-13)
- HEAD local `350e88c`; `git status --short` no início e no fim: só este relatório.
- md5 da lista de `dist/` (`find dist -type f | sort | xargs md5sum | md5sum`), início e fim: `cd2de5f274476000692e07d0e45e5b29`, igual ao pacote publicado informado.
- Chunks de Filosofia no `dist/` (identificados por conteúdo): `resumo-Dxlkj85y.js`, `meta-KMqQ9we5.js`, `quiz--9CLQPc2.js`.

## Isolamento
- Tudo dentro de `bwrap --bind / / --dev /dev --tmpfs /run/user`, headless, `--disable-gpu`, `XDG_RUNTIME_DIR` e `TMPDIR` próprios em `/var/tmp/qa-prod` (700), `DISPLAY`/`WAYLAND_DISPLAY`/`DBUS_SESSION_BUS_ADDRESS` removidos.
- Dentro da caixa: `/dev` só com `core fd full null ptmx pts random shm stderr stdin stdout tty urandom zero`; sem `nvidia*` nem `dri`; `/run/user` vazio.
- `/proc/<pid>/environ` de Chromium, Brave e Firefox: só `TMPDIR` e `XDG_RUNTIME_DIR` próprios; processos varridos com variável proibida: 0; fds em `/dev/nvidia*`: 0.
- Vigia (o mesmo da rodada anterior nesta máquina de QA): 575 voltas, 0 abortos, 0 violações. Nenhum trecho refeito.
- Um trabalho pesado por vez, 1 navegador de cada vez (bem abaixo de 2 workers), sem laços de carga. `xdg-document-portal.service`: active. Nenhum processo meu sobrando. GeForce não tocada. Nada instalado nem baixado.

## Resultados (Chromium / Brave / Firefox 156 por BiDi)
| Verificação | Chromium | Brave | Firefox |
|---|---|---|---|
| Resumo: 12 blocos (`bloco-0` a `bloco-11`), abas só Resumo e Quiz, quadro Platão/Aristóteles/Tomás (4 colunas, 3 linhas), linha do tempo (10 períodos), a 1280 e 360, sem rolagem lateral da página | passou | passou | passou |
| Quiz "Pergunta 1 de 80", 80 ids únicos, 40 V/F (só "Verdadeiro" e "Falso", nessa ordem, sem letras) e 40 MC com letras A a E | passou | passou | passou |
| Selo "Revisão do professor" exatamente nas ids 1 a 20 (20 selos, texto único, antes do enunciado) | passou | passou | passou |
| Nenhuma nota do caderno em Filosofia (0 antes e 0 depois de responder, nas 80) | passou | passou | passou |
| Placar "Acertos: x de k / Falhas: y de k" certo nas 80; explicação em todas; marca da resposta em linha própria e dentro do cartão | passou | passou | passou |
| `/peticao` de Filosofia: "Página não encontrada"; sem link de petição na unidade nem na home | passou | passou | passou |
| Home com 4 cartões (Filosofia Jurídica: "Resumo de estudo e quiz"); barra lateral com 4 cadeiras; 0 ids duplicados | passou | passou | passou |
| Busca "Antígona": 5 resultados, 3 em Filosofia (bloco 1, bloco 11 e quiz); também pelo campo | passou | passou | passou |
| Foco no bloco de resultado ao responder, com Tab real + Espaço, 5 casos (V/F do professor em claro 1280, escuro 360 e adaptado 360; V/F do caderno; MC): `activeElement` é `.cartao-pergunta__resultado` (`tabindex=-1`, `:focus-visible`, contorno 2 px claro/escuro e 4 px preto no adaptado); veredito "Resposta correta/incorreta." no início; Tab seguinte vai a "Próxima" ou "Anterior", nunca a `body`; sem `aria-live` dentro do bloco | passou | passou | por `click()` no radio focado: `activeElement` é o bloco nos 5 casos; Tab real e `:focus-visible` não testáveis (limitação do headless) |
| Foco nas outras cadeiras (Introdução e Sociologia, uma execução cada) | passou | passou | passou (por clique) |
| Modo adaptado a 360, 80 perguntas, claro e escuro: texto da alternativa (antes/depois de responder, mínimo) | 193 / 187 px | 193 / 187 px | 180 / 174 px |
| Idem: rolagem lateral, marca em linha própria, letras/V/F corretos | 0 / 0 exceções / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Selo no adaptado (1280 e 360, 20 selos): fundo `rgb(255,255,255)` (sem cor), texto `rgb(0,0,0)`, borda `solid 2px`, peso 700; contraste texto/fundo | 21:1 | 21:1 | 21:1 |
| Selo fora do adaptado, claro: branco sobre `#7a2331`; contraste texto/fundo; fundo do selo contra o cartão branco | 9,94:1 / 9,94:1 | igual | igual |
| Selo fora do adaptado, escuro: `#12161c` sobre `#e29a9a`; contraste texto/fundo; fundo do selo contra o cartão `rgb(26,31,39)` | 8,06:1 / 7,35:1 | igual | igual |
| Service worker: registra na 1a visita; precache de 46 itens, manifesto inteiro em cache (0 faltando), com os 3 chunks de Filosofia; página fica controlada | passou | passou | passou |
| 2a visita OFFLINE: resumo de Filosofia (12 blocos, quadro), quiz (Pergunta 1 de 80, responde, placar atualiza; no Brave caiu uma V/F com 2 opções), navegação de volta ao resumo e home com 4 cartões | passou | passou | não testado (BiDi sem emulação offline) |
| axe-core nas rotas de Filosofia: resumo, quiz com V/F do professor respondida (selo visível) e quiz MC respondida x claro/escuro x adaptado on/off x 1280/360 = 24 combinações | 0 critical/serious | 0 | 0 |
| Regressão das outras 3 cadeiras (todas as perguntas, 1280): Introdução (60, 4 alt, sem letras, sem selo, sem nota), Redação (30, idem), Sociologia (80, letras A a E, nota nas ids 1 a 10, sem selo) | passou | passou | passou |
| Console nas rotas visitadas | 0 erros | 0 erros | ver COSMÉTICO 2 |

axe: só os dois moderate de sempre (`heading-order` 24/24 e `landmark-unique` 8/24, nos resumos), sem violação nova.

## Capturas (olhadas)
- `home-claro/escuro-360/1280.png`: 4 cartões (Introdução, Redação, Sociologia, Filosofia Jurídica "Resumo de estudo e quiz"); a 360 os cartões empilham e o menu vira ícone. Uma faixa fina no topo nas capturas de página inteira do Chromium é artefato de captura.
- `resumo-*.png`, `quadro-*.png`, `linha-do-tempo-*.png`: índice dos 12 blocos, "Quadro comparativo: Platão, Aristóteles e Tomás de Aquino" (a 1280 mostra 2 das 4 colunas; o resto exige rolagem dentro do contêiner, com sombra na borda) e "Linha do tempo" com 10 períodos (a 360 corta "Autor ou corrente" na borda, com rolagem interna). Legíveis nos dois temas.
- `quiz-vf-claro-1280.png`: selo bordô com texto branco "Revisão do professor" acima do enunciado em serifa, opções "Verdadeiro" e "Falso" sem letras, "Falso" em verde com "Correta" na linha de baixo, explicação com contorno azul-marinho (o foco), placar "Acertos: 1 de 1".
- `vf-professor-escuro-360.png`: selo rosa `#e29a9a` com texto escuro, opção verde com "Correta", explicação com contorno azul claro; o cabeçalho aparece no meio da imagem por ser captura de página inteira com elemento fixo (artefato).
- `vf-professor-claro-360-adaptado.png`: selo como caixa branca com texto preto e borda, sem cor de fundo; fonte grande com espaçamento largo; opção escolhida com "Sua resposta, incorreta" e a outra "Correta" em linha própria; explicação com contorno preto grosso; tudo legível, sem rolagem lateral.
- `foco-claro-1280.png`, `foco-claro-360-adaptado.png`: bloco de resultado com contorno visível. `quiz-mc-*.png`: letras A a E, sem selo e sem nota do caderno. `ff-*.png`: mesmo aspecto no Firefox.

## Achados
### CRÍTICO / IMPORTANTE: nenhum.
### COSMÉTICO
1. Rodapé com travessão em texto visível ("Copyright ©", travessão, "2026", travessão, "2026"), em todas as rotas. Pré-existente, ainda no ar (registrado na rodada anterior; viola a L-32).
2. Firefox: 1 a 3 erros de console "downloadable font ... NS_BINDING_ABORTED" nas fontes Inter, só quando uma navegação corta o carregamento da página anterior (artefato do harness; a rodada anterior provou 0 erros em carregamento único).
3. O texto da explicação encosta no contorno do bloco de foco (o bloco não tem preenchimento), nos dois temas (`quiz-vf-claro-1280.png`). Já conhecido da rodada local.
4. Quadro e linha do tempo largos: a 1280 metade das colunas fica atrás da rolagem interna. Já conhecido.

## Limitações
Firefox: sem Tab real nem `:focus-visible` (foco verificado por `click()` no radio), sem offline. O selo foi medido por cor computada e contraste calculado por script, não por amostragem de pixel.

## Encerramento (L-13)
HEAD `350e88c` e md5 de `dist/` `cd2de5f274476000692e07d0e45e5b29` no início e no fim; `xdg-document-portal.service` active.
