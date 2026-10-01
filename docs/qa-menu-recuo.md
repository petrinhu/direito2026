# QA do menu lateral: recuo por nível, triângulo e cor por nível (HEAD 0e766c2)

Rodada focada, sob a exceção à L-50 (caixa `bwrap`, sem `/dev/nvidia*`, `/dev/dri` nem `/run/user`; ambiente próprio; headless; vigia). Capturas em `mockups/capturas/menu/` (20 arquivos, ignoradas pelo git).

## 1. Congelamento (L-13)
- HEAD no início e no fim: `0e766c2de98fe0d91d873a7f2aaf45fe11bd6b05`; `git status --short` vazio.
- md5 de `dist/` (mesmo comando, 52 arquivos), início e fim: `5f713a515204cea216de73e43d6bbdb1`. Um `git archive HEAD` construído em scratch deu lista idêntica. Escopo `224aed4..HEAD`: nada fora de `src/`, `tests/` e `docs/`.

## 2. VERMELHO: `tests/e2e/menu-recuo.spec.ts` (18 = 9 por navegador) contra 224aed4 exportado fora da árvore
**18 de 18 vermelhos**, zero timeout, todos pela asserção de recuo: `cadeira (texto em x=N) deve começar pelo menos 12px à direita de período (x=N)`.

## 3. VERDE
- `menu-recuo.spec.ts` no HEAD (Chromium e Brave): **18 de 18 passam**.
- Suíte e2e completa (uma execução, 4 workers): **258 passaram, 42 pularam, 0 falharam** (os pulos são o spec do selo/V/F nas cadeiras sem V/F, por desenho).

## 4. Firefox 156 (BiDi puro), antes (224aed4) e depois (HEAD): x do início do texto de cada nível aberto
Menu aberto até o nível de aba na rota da Unidade 1 de Introdução ao Direito; x em px, mesma medida a 1920 e 1280. Recuo = diferença de x para o nível acima.

| Estado | | período | cadeira | unidade | aba Resumo | item do Resumo | recuos (c, u, a, i) | recuo mínimo | triângulo da unidade |
|---|---|---|---|---|---|---|---|---|---|
| normal, escuro, normal claro | ANTES | 26 | 27 | 18 | 29 | 20 | +1, -9, +11, -9 | **-9** | **direita** |
| adaptado | ANTES | 26 | 27 | 20 | 29 | 20 | +1, -7, +9, -9 | **-9** | **direita** |
| normal, escuro, normal claro | DEPOIS | 26 | 47 | 74 | 89 | 106 | +21, +27, +15, +17 | **15** | esquerda |
| adaptado | DEPOIS | 26 | 47 | 88 | 101 | 118 | +21, +41, +13, +17 | **13** | esquerda |

- Antes: reproduz o relato do líder (sem recuo, subitens recuados para a esquerda dos pais, triângulo da unidade à direita do texto).
- Depois: todo nível tem recuo >= 13 px (piso pedido: 12), todos os triângulos (período, cadeira, unidade, aba) à esquerda do próprio texto, e a aba "Quiz" alinha com a aba "Resumo" (diferença <= 1 px). Resultado idêntico a 1920 e 1280, e idêntico em Chromium e Brave (mesmos x e recuos).

## 5. Capturas (olhadas; Firefox e Chromium, 1920, escuro, claro e adaptado, gaveta a 360)
- **Antes (`*-old-*`):** lista toda colada na mesma coluna, "Unidade 1" com o triângulo à direita, sem linhas-guia; reproduz o relato.
- **Depois, escuro e claro** (a lateral é azul-marinho fixo nos dois temas): árvore com recuo progressivo e linhas verticais finas de guia por nível; período em creme, cadeira em dourado claro, unidade atual em branco negrito sobre faixa azul mais clara, aba "Resumo", "Petição comentada" e "Quiz" em azul-acinzentado claro, itens do Resumo em cinza-azulado mais discreto e de fonte menor. **Sóbrio** (4 matizes frios mais 1 dourado, sem saturação alta) e **distinguível** (cada nível tem cor própria mais o recuo e o tamanho). Triângulos à esquerda do texto em todos os níveis. O item atual ("Unidade 1") continua claramente destacado (peso 600, fundo mais claro, ver contraste).
- **Adaptado:** tudo preto sobre branco, fonte grande com espaçamento largo, linhas-guia pretas, "Unidade 1" atual em caixa com borda de 2 px; legível. Sem cor por nível (por desenho).
- **Gaveta a 360:** mesma árvore com recuo; itens do Resumo quebram em 2 a 3 linhas por causa da largura útil (~230 px), legíveis; no adaptado a gaveta é branca com texto preto e itens em várias linhas.
- Detalhe: com o recuo, "Português e Redação Jurídica 1" quebra em duas linhas ("1" sozinho) na lateral de 300 px (COSMÉTICO 1).

## 6. Contraste medido no navegador, de cada nível contra o fundo real (compõe os fundos até a raiz); Firefox, igual em Chromium e Brave
| Nível | Cor do texto | Fundo | Contraste |
|---|---|---|---|
| período | `#faf9f5` | `#0d2440` | 14,84:1 |
| cadeira | `#e6d3a0` | `#0d2440` | 10,56:1 |
| unidade (a ATUAL, item ativo) | `#faf9f5` (peso 600) | `#1a3a5c` (faixa do item ativo) | 11,05:1 |
| aba Resumo / Quiz | `#c3cfdd` | `#0d2440` | 9,89:1 |
| item do Resumo | `#a7b4c6` | `#0d2440` | 7,43:1 |
| unidade NÃO ativa (cor própria `#a9c8ea`; não aparece na rota medida, calculado) | `#a9c8ea` | `#0d2440` | 9,03:1 |
| adaptado: todos os níveis, inclusive o ativo | `#000000` | `#ffffff` | 21:1 |
Todos acima de 7:1 (AAA), inclusive o item ativo e o mais discreto (item do Resumo, 7,43:1).

## 7. axe-core (Chromium, Brave, Firefox)
Home e unidade com o menu aberto (45 itens visíveis) x claro, escuro e adaptado x 1280 e 360 (gaveta aberta) = 12 combinações por navegador: **zero critical e zero serious**; só `heading-order` (moderate, 12 de 12, cartões da home) e `landmark-unique` (moderate, 6 de 12, quadro-resumo dos blocos), os mesmos moderate de sempre.

## Achados
### CRÍTICO / IMPORTANTE: nenhum. O defeito do relato está consertado e coberto por teste que reprova o código antigo.
### COSMÉTICO 1. Nome longo de cadeira quebra com "1" sozinho
"Português e Redação Jurídica 1" ocupa 2 linhas na lateral de 300 px com o recuo (e itens do Resumo em 2 a 3 linhas na gaveta de 360 px).
### COSMÉTICO 2. Unidade não ativa não verificada em tela
Só existe a Unidade 1 em Introdução ao Direito; a cor `#a9c8ea` da unidade não ativa foi calculada (9,03:1), não medida no navegador.

## Processo
- 0 abortos do vigia por processos de outra sessão do usuário; nenhum processo do QA tocou a placa, o barramento ou o display. Original do vigia, sem alteração. Falhas de script próprio (um `null` na medição) fizeram o driver de tentativas refazer; sem relação com o vigia.
- Nada instalado nem baixado; L-11 respeitado (um trabalho pesado por vez, 4 workers). Cinco processos de Firefox deixados por um script meu que falhou foram encerrados.
- `xdg-document-portal.service`: active. Servidores e vigia encerrados; nenhum processo meu sobrando. HEAD e md5 de `dist/` conferidos de novo no fim (iguais).
