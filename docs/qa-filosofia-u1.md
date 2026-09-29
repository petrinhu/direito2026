# QA da unidade nova (Filosofia Jurídica, 1a unidade, HEAD eb70c19)

Rodada sob a exceção à L-50 (caixa `bwrap`, sem `/dev/nvidia*`, `/dev/dri` nem `/run/user`; ambiente próprio; headless; vigia). Relatório gravado incrementalmente; capturas em `mockups/capturas/filosofia/` (23 arquivos, ignoradas pelo git).

## Artefato congelado (L-13) e diff de escopo
- HEAD no início e no fim: `eb70c192ad4f6800fbb6282503d7254e61e27bf6`; `git status --short` no fim vazio (a árvore não tinha nada não commitado).
- `dist/` (52 arquivos): md5 `7b4b6ca34ab2e3cd8f589fec6e64feb8` no início e no fim (`find dist -type f | sort | xargs md5sum | md5sum`). Um `git archive HEAD` construído em scratch deu lista de md5 idêntica (o `dist/` do projeto é o HEAD).
- Diff de escopo `0f8b539..eb70c19` fora de `docs/`: 32 arquivos, todos em `src/` e `tests/` (tipo V/F e selo no motor, cartão e tokens; conteúdo e metadados de Filosofia; carregadores; testes). Nada fora dessas duas árvores.
- Servidor de teste: `vite preview`, `127.0.0.1:4611`, md5 de `/index.html` servido igual ao do arquivo.
- Nota: o briefing menciona "Local e produção"; esta rodada foi só local (nada foi publicado nem testado em produção).

## 1. Suíte e2e completa (Chromium e Brave, 4 workers, duas execuções)
141 testes por navegador (282 no total): **240 passaram e 42 pularam em cada uma das duas execuções, 0 falharam**. Os 42 "skip" são o spec do selo e do V/F nas outras 3 cadeiras (7 por cadeira x 3 x 2 navegadores), que se declaram ignoradas porque não têm V/F nem selo (por desenho). Os 14 testes do selo e V/F de Filosofia (7 por navegador: 3 estados x 2 larguras, mais teclado) rodaram de verdade e **passaram nas duas execuções**.

### Os testes mordem? Mutação em cópia exportada fora da árvore (`git archive HEAD` em scratch, build, servidor próprio, só o spec do selo, Chromium e Brave)
| Mutação | Resultado do spec do selo/V/F de Filosofia | Morde? |
|---|---|---|
| 1. Selo removido do template do cartão | **14 de 14 VERDES** | **NÃO** |
| 2. Fundo do selo (tema claro) igual ao do cartão (`#ffffff`, texto preto) | 4 vermelhos (claro, 320 e 360, 2 navegadores): `fundo do selo contra o cartão` | sim |
| 3. Modo adaptado com fundo colorido no selo (`#ffe08a`) | 4 vermelhos: `sem fundo colorido no modo adaptado` | sim |
| 4. Ordem das opções trocada para `Falso`, `Verdadeiro` | 14 de 14 vermelhos (`opções`, e o teste de teclado) | sim |

**Achado IMPORTANTE 1 (teste fraco):** `tests/e2e/quiz-verdadeiro-ou-falso-selo.spec.ts` só examina o selo `if (l.selo)` (laço `for (const l of comSelo)`, em torno das linhas ~186-210) e só se declara ignorado quando NÃO há selo nem V/F; como Filosofia tem V/F, a ausência total do selo passa despercebida. Falta afirmar que as perguntas de ids 1 a 20 têm selo (e as demais não). Não há afirmação de contagem (20) nem de ids. Também não se testa o selo no tema escuro contra a mutação análoga da 2 (o token escuro não foi mutado por mim; o teste mede os dois temas por construção).

## 2. Nos três navegadores (Chromium, Brave, Firefox 156 por BiDi puro): resultados idênticos
| Verificação | Resultado (os 3) |
|---|---|
| Resumo abre com 12 blocos (`bloco-0` a `bloco-11`); título "Resumo de estudo e quiz"; abas só "Resumo" e "Quiz" | sim |
| Quadro Platão / Aristóteles / Tomás de Aquino (colunas Autor, O que é justiça, Fonte da lei, Ideia que se costuma cobrar; 4 linhas) e "Linha do tempo" (bloco 12, 10 períodos/autores), a 1280 e 360 px | presentes e legíveis; a página não rola na horizontal (`scrollWidth` = `clientWidth`); as tabelas rolam dentro do próprio contêiner (2116 px de tabela em 760 px a 1280, em 296 a 360) |
| Quiz "Pergunta 1 de 80"; 80 ids únicos; 40 V/F (só "Verdadeiro" e "Falso", nessa ordem, sem letras) e 40 de 5 alternativas (letras A a E, sem exceção) | sim |
| V/F responde: marca "Correta" / "Sua resposta, incorreta", explicação, opções desabilitadas; placar (`Acertos: x de k / Falhas: y de k`) certo nas 80; final 28 de 80 (respondendo sempre a 1a opção) | sim, 0 erros |
| Selo "Revisão do professor" nos ids 1 a 20 e SÓ neles (20 selos, texto único, antes do enunciado) | sim |
| Nota do caderno ("não é o gabarito oficial") | em nenhuma das 80 (0 antes e 0 depois de responder) |
| `/peticao` de Filosofia | "Página não encontrada"; nenhum link de petição na página nem na home |
| Home com 4 cartões (Introdução ao Direito, Português e Redação Jurídica 1, Sociologia Jurídica, Filosofia Jurídica) | sim |
| Barra lateral do 1º período com 4 cadeiras | sim; 0 ids duplicados |
| Busca "Antígona" (5 resultados, 3 em Filosofia: bloco 1, linha do tempo, quiz) e "Tomás" (19 resultados, 6 em Filosofia); também pelo campo de busca | sim |
| Erros de console, `pageerror` ou falha de rede | 0 |

## 3. Modo adaptado (360 e 320 px), todas as 80, antes e depois de responder; e contraste fora do modo adaptado
| | Chromium | Brave | Firefox |
|---|---|---|---|
| Largura útil mínima do texto da alternativa, 360 px (antes / depois) | 193 / 187 px | 193 / 187 | 180 / 174 |
| idem, 320 px | 153 / 147 px | 153 / 147 | 140 / 134 |
| Rolagem lateral (80 perguntas x 2 larguras) | 0 | 0 | 0 |
| Selo: 20 unidades; fundo `rgb(255,255,255)`, texto `rgb(0,0,0)`, borda `solid 2px`, peso 700 | sim | sim | sim |
| Contraste texto/fundo do selo (adaptado) | 21:1 (mínimo 7:1) | 21:1 | 21:1 |
| Marca "Correta/incorreta" em linha própria | 80 de 80 | 80 de 80 | 80 de 80 |

Fora do modo adaptado, 20 selos medidos por tema, a 360 e 1280 px (iguais nos 3 navegadores):
- **Claro:** texto `#ffffff` sobre `rgb(122,35,49)` (`#7a2331`): **9,94:1** (piso 4,5); fundo do selo contra o cartão branco: **9,94:1** (piso 3); negrito 700; largura 150 px (cartão 296 px a 360).
- **Escuro:** texto `rgb(18,22,28)` sobre `rgb(226,154,154)` (`#e29a9a`): **8,06:1**; fundo do selo contra o cartão `rgb(26,31,39)`: **7,35:1**; negrito 700.
- Nenhum estouro de largura.

## 4. Teclado em V/F (Chromium e Brave, `page.keyboard`)
Partindo do enunciado, o primeiro Tab cai no radio "Verdadeiro" com anel de foco visível (contorno sólido de 2 px, `:focus-visible`); Espaço responde "Verdadeiro" (marca, placar e explicação atualizam, opções desabilitadas); ArrowDown seleciona e responde "Falso"; Tab seguinte vai ao botão "Anterior". Idêntico nos dois navegadores. Captura do foco: `teclado-vf-foco-chromium.png`, `-brave.png`.
Achado (pré-existente, atinge todas as cadeiras): depois de responder, o radio fica desabilitado e o foco cai em `body` (medido em Introdução ao Direito e em MC de Filosofia também): quem usa teclado ou leitor de tela perde o ponto de foco (COSMÉTICO 1).

## 5. Capturas (olhadas)
- `vf-professor-respondida-claro-360.png`: selo bordô `#7a2331` com texto branco em negrito ("Revisão do professor"), acima do enunciado em serifa; duas opções "Verdadeiro"/"Falso" sem letras, a escolhida com marca "Correta" em verde na linha de baixo; sem nota do caderno.
- `...-escuro-360.png`: selo rosa `#e29a9a` com texto escuro; cartão escuro, opções com marcações verde/vermelho escuras legíveis.
- `...-adaptado-360.png`: selo como caixa branca com texto preto e borda de 2 px, em 2 linhas ("Revisão do / professor", com espaçamento largo); enunciado e opções em fonte grande, tudo legível, sem cor de fundo.
- `...-claro-1280.png`, `...-escuro-1280.png`, `...-adaptado-1280.png`: selo compacto em uma linha; "Sua resposta, incorreta" (vermelho claro) e "Correta" (verde claro) sob os textos; sem rolagem.
- `mc-respondida-claro-360.png`, `mc-respondida-escuro-1280.png`: letras A a E, marca em linha própria, sem selo (pergunta do caderno) e sem nota do caderno.
- `resumo-topo-360/1280.png`: cabeçalho com trilha "... Filosofia Jurídica / Unidade 1 / Resumo", índice dos 12 blocos.
- `resumo-quadro-360/1280.png` e `resumo-linha-do-tempo-360/1280.png`: tabelas legíveis; a 1280 o quadro mostra 2 das 4 colunas e a linha do tempo mostra "Período" e "Autor ou corrente" e corta "Ideia central" na borda; é preciso rolar dentro do contêiner (sombra lateral indica); ver COSMÉTICO 2.
- Firefox (`ff-*`): pergunta V/F do professor (claro 360 e adaptado 360, escuro 1280), MC (claro 1280), resumo topo, quadro e linha do tempo: mesmo resultado que o Chromium.

## 6. axe-core (Chromium, Brave, Firefox)
Resumo, quiz com MC respondida e quiz com V/F do professor respondida (selo visível) x claro/escuro x adaptado on/off x 1280/360 = 24 combinações por navegador: **zero critical e zero serious**. Só dois moderate, iguais aos das outras cadeiras: `heading-order` (24 de 24) e `landmark-unique` (8 de 24, resumos).

## 7. Regressão: as outras 3 cadeiras (Chromium, Brave, Firefox, 1280 px, todas as perguntas)
Introdução ao Direito (60) e Redação (30): 4 alternativas, sem letras, sem selo, sem V/F, sem nota do caderno. Sociologia (80): 5 alternativas com letras A a E, sem selo, sem V/F, nota do caderno exatamente nos ids 1 a 10. 0 erros de console. Igual ao que era.

## 8. Proibições
`bash scripts/verificar-proibicoes.sh` em `src` (120 arquivos), `public` (4) e `dist` (46), um alvo por chamada: rc=0, zero ocorrências, piso de varredura não vazio. Lista de termos não impressa. Travessão e meia-risca em `src/conteudo/p1/filosofia-juridica/`: 0.

## Achados
### CRÍTICO: nenhum.
### IMPORTANTE 1. O spec do selo/V/F não pega a ausência do selo (mutação 1)
Ver seção 1. Sugestão: afirmar que as perguntas de ids 1 a 20 (todas V/F do professor) têm o selo e que nenhuma outra tem, com contagem 20.
### COSMÉTICO 1 (pré-existente, todas as cadeiras). Foco perdido depois de responder
Radios desabilitados; `document.activeElement` vira `body` (seção 4). Sugestão: mover o foco para a explicação ou para o botão "Próxima".
### COSMÉTICO 2. Quadro e linha do tempo largos no desktop
A tabela tem 2116 px em contêiner de 760 px a 1280: metade das colunas fica atrás da rolagem lateral do contêiner (mesmo padrão observado em Sociologia).
### COSMÉTICO 3. Documento diz 33 perguntas do professor, o conteúdo tem 20
`docs/arquitetura.md:1294`: "das quais 33 são do simulado do professor"; `src/conteudo/p1/filosofia-juridica/u1/quiz/revisao.ts` traz 20 (todas com `origem: 'professor'`), e a tela mostra 20 selos (ids 1 a 20), como o briefing diz.
### COSMÉTICO 4 (pré-existente). Falta espaço depois de "Na prática do operador do direito:"
`src/ui/componentes/BlocoTeorico.vue:57-58`: o `<strong>` e o `<span>` ficam separados só por quebra de linha do template, que o Vue condensa; o texto renderizado cola ("direito:Uma leitura"). Presente em todas as unidades.

## Ocorrências de processo
- **0 abortos do vigia nesta rodada.** Todo trecho terminou na 1a tentativa; nenhum processo do QA tocou a placa, o barramento ou o display. O vigia original foi mantido sem alteração.
- Ajuste meu: o alvo do script de proibições só aceita um diretório por chamada; rodei `src`, `public` e `dist` separadamente.

## Encerramento (L-13)
- HEAD início e fim `eb70c192ad4f6800fbb6282503d7254e61e27bf6`; md5 de `dist/` início e fim `7b4b6ca34ab2e3cd8f589fec6e64feb8`.
- Isolamento: `bwrap --bind / / --dev /dev --tmpfs /run/user` (`/dev` sem `nvidia*` nem `dri`, `/run/user` vazio), headless, `--disable-gpu`, `XDG_RUNTIME_DIR` e `TMPDIR` próprios em `/var/tmp` (700), `DISPLAY`/`WAYLAND_DISPLAY`/`DBUS_SESSION_BUS_ADDRESS` removidos; sem compositor, sem xdotool. Nada instalado nem baixado; L-11 respeitado (um trabalho pesado por vez, 4 workers).
- `xdg-document-portal.service`: active. Servidores e vigia encerrados; nenhum processo meu sobrando. Scratch em `/var/tmp/qa-soc2/r5/` (inclui as 4 cópias mutadas, só para prova).

# Rodada 2 (HEAD 4d0a352)

Mesmo protocolo (caixa `bwrap`, vigia, servidor `vite preview` em `127.0.0.1:4611`). Todos os 6 itens concluídos.

## R2.1 Artefato congelado (L-13) e diff de escopo
- HEAD no início e no fim: `4d0a35290648ce9107143a68e5e7efa34de4e2b1`. `git status --short` no fim: só este relatório (não versionado).
- md5 de `dist/` (mesmo comando), início e fim: `cd2de5f274476000692e07d0e45e5b29`. `git archive HEAD` construído em scratch deu lista idêntica (o `dist/` do projeto é o HEAD).
- Diff de escopo `eb70c19..4d0a352`: nada fora de `src/`, `tests/` e `docs/`.

## R2.1 (item 1) Mutações em cópias exportadas fora da árvore, spec do selo/V/F completo (as 4 cadeiras), Chromium e Brave
| Mutação | Resultado | Morde? |
|---|---|---|
| 1. Selo removido do template do cartão | **12 vermelhos** (6 estados x 2 navegadores) + 2 verdes (o teste de teclado, que não mede o selo): `Filosofia Jurídica: cartões com selo na tela x perguntas com origem professor no conteúdo` | **sim (era 14 de 14 verdes na rodada 1)** |
| 2. Fundo do selo (tema claro) igual ao do cartão | 4 vermelhos: `fundo do selo contra o cartão` | sim |
| 3. Fundo colorido no selo do modo adaptado | 4 vermelhos: `sem fundo colorido no modo adaptado` | sim |
| 4. Opções trocadas para `Falso`, `Verdadeiro` | 14 vermelhos (`opções` e o teste de teclado) | sim |
Em todas, 42 pulos (as 3 cadeiras sem V/F nem selo, por desenho). O IMPORTANTE 1 da rodada 1 está consertado.

## R2.2 Suíte e2e completa (Chromium e Brave, 4 workers, duas execuções)
141 testes por navegador (282 no total). Execução 1: **240 passaram, 42 pularam, 0 falharam**. Execução 2: **240 passaram, 42 pularam, 0 falharam**. Inclui o teste de teclado com as novas afirmações (o bloco de resultado está em foco e o Tab seguinte não cai em `body`).

## R2.3 Foco depois de responder, com Tab real (Chromium e Brave)
Método: foco no enunciado, Tab até o radio, Espaço; depois lê `document.activeElement`. Casos: Filosofia V/F do professor e MC, cada um em claro e escuro (360 e 1280) e adaptado (360 e 1280), mais Introdução ao Direito (MC de 4 alternativas; claro 360 e 1280, adaptado 360): 15 execuções por navegador.
- **O foco vai para o bloco de resultado (`.cartao-pergunta__resultado`, `tabindex=-1`) em 100% dos casos, nos dois navegadores**, com `:focus-visible` verdadeiro. O texto do bloco começa por "Resposta correta." ou "Resposta incorreta." (veredito só para leitor de tela, invisível na tela), e o `aria-live` da explicação foi removido (medido).
- **Anel de foco no bloco: visível.** Claro: contorno sólido de 2 px `rgb(22,58,95)`, `outline-offset` 2 px. Escuro: 2 px `rgb(127,168,214)`. Adaptado: 4 px preto, offset 4 px.
- **Próximo Tab:** com pergunta que tem Anterior habilitado, Tab leva a "Anterior" e o Tab seguinte a "Próxima" (no 1º cartão, "Anterior" está desabilitado e vai direto a "Próxima"). Quando a explicação contém citação de artigo (botão dentro do próprio bloco), o Tab entra primeiro nela ("art. 186..."), o que é esperado (a citação é um controle dentro do bloco). Nunca cai em `body`.
- **Abrir pergunta já respondida não rouba o foco:** Enter em "Próxima" e depois Enter em "Anterior" reabre a pergunta respondida (bloco de resultado presente); o foco fica em "Anterior" (ou em `body` quando o botão fica desabilitado no 1º cartão), nunca no bloco de resultado. 15 de 15 nos dois navegadores.
- **Cabeçalho fixo não cobre o foco** (medido em 360x640, 360x480 e 1280x720, Filosofia e Introdução): topo do bloco sempre abaixo da borda do cabeçalho (quando visível). No modo adaptado a 360x640, com o cabeçalho fora do fluxo fixo, o bloco de explicação é mais alto que a tela (topo em y -91 com 640 de janela), então a borda superior do anel só aparece rolando (COSMÉTICO 2).
- **Capturas** (`mockups/capturas/filosofia2/foco-*`, 17 arquivos; a página inteira do cartão): 
  - `foco-filos-vf-claro-360.png`: cartão V/F com opções respondidas; abaixo, a explicação dentro de uma caixa de contorno azul-marinho de 2 px, bem visível.
  - `foco-filos-vf-escuro-360/1280.png`: mesmo, contorno azul claro sobre o cartão escuro, texto legível.
  - `foco-filos-vf-adaptado-360/1280.png` e `foco-filos-mc-adaptado-*`: contorno preto grosso de 4 px em torno da explicação, texto preto em fonte grande.
  - `foco-filos-mc-*` e `foco-intr--mc4-*`: idêntico nas cadeiras de MC (Filosofia MC e Introdução ao Direito).
  - Em todas o texto da explicação encosta na borda do contorno (o bloco não tem preenchimento), legível mas apertado (COSMÉTICO 1). Nas capturas de 1280 e adaptado aparece, no meio do cartão, o cabeçalho fixo: é artefato da captura de página inteira (elemento fixo desenhado na posição de rolagem), não um defeito.

## R2.4 Firefox 156 (BiDi puro)
- O Firefox headless não tem foco de janela (`document.hasFocus()` falso): o Espaço sintético por BiDi não marca o radio (Tab por BiDi funciona) e `:focus-visible` não casa. Por isso a resposta foi dada por `click()` no radio focado (a mesma via de `escolher()` do componente). Resultado, 3 casos (Filosofia V/F, Filosofia MC, Introdução ao Direito): **`activeElement` é o bloco de resultado** ("Resposta correta." ou "Resposta incorreta." no início do texto), placar atualiza, radios desabilitados, sem `aria-live`; Tab seguinte vai a "Anterior" ou "Próxima".
- Anel (aproximação, marcada como tal): cloneei as regras `:focus-visible` da folha de estilos entregue para uma classe aplicada ao bloco focado: contorno `solid 2px rgb(22,58,95)`, offset 2 px, caixa inteira em torno da explicação (`ff-foco-filos-vf-claro-360.png`). Não prova o seletor real com janela focada.
- **Espaço em "Na prática do operador do direito:"**: presente nas 4 cadeiras nos 3 navegadores: 9/9 blocos em Introdução, 15/15 em Redação, 12/12 em Sociologia, 12/12 em Filosofia têm o texto `operador do direito: <espaço> <texto>` (`Na prática do operador do direito: No dia a dia forense...`). O COSMÉTICO 4 da rodada 1 está consertado.

## R2.5 axe-core (Chromium, Brave, Firefox)
Quiz das 4 cadeiras x claro/escuro x adaptado on/off x 1280 e 360 = 32 combinações por navegador, com a 1a pergunta respondida (bloco de resultado presente em todas). **Zero critical e zero serious**; só `heading-order` (moderate, 32 de 32). Sem violação nova (o bloco de resultado com `tabindex=-1` não gerou nada).

## R2.6 Regressão rápida das 4 cadeiras (Chromium, Brave, Firefox)
Quiz abre em "Pergunta 1 de N" (60, 30, 80, 80), responde, o placar vai a "Acertos: x de 1 / Falhas: y de 1", radios desabilitados, veredito só para leitor de tela, explicação visível, sem `aria-live`; Sociologia mantém a nota do caderno (ids 1 a 10) e Filosofia não tem nota. Sem erro de console.

## Achados da rodada 2
### CRÍTICO / IMPORTANTE: nenhum. O IMPORTANTE 1 e os COSMÉTICOS 1, 3 e 4 da rodada 1 estão consertados (spec agora exige 20 selos e morde; foco não se perde; documento diz 20; espaço presente).
### COSMÉTICO 1. Texto da explicação encostado no contorno do foco
O bloco de resultado não tem preenchimento; com `outline-offset: 2px` o texto começa colado à borda do anel em todos os temas (capturas `foco-*`).
### COSMÉTICO 2. Modo adaptado em janela baixa: bloco de resultado mais alto que a tela
A 360x640, o topo do anel fica fora da tela (y -91); o leitor de tela anuncia o veredito e a tela mostra a parte de baixo, sem prejuízo funcional.
### COSMÉTICO 3 (herdado). Quadro e linha do tempo largos no desktop (2116 px em contêiner de 760 px a 1280); trilha em modo normal recolhida; nada mudou.

## R2.7 Ocorrências de processo
**0 abortos do vigia nesta rodada; nenhum processo do QA tocou a placa, o barramento ou o display.** Todo trecho terminou na 1a tentativa; vigia original, sem alteração. Nada instalado nem baixado; um trabalho pesado por vez, 4 workers.

## R2.8 Encerramento
- HEAD início e fim `4d0a35290648ce9107143a68e5e7efa34de4e2b1`; md5 de `dist/` início e fim `cd2de5f274476000692e07d0e45e5b29`.
- Isolamento igual (bwrap sem `/dev/nvidia*`, `/dev/dri`, `/run/user`; env próprio; headless). `xdg-document-portal.service`: active. Servidores e vigia encerrados; nenhum processo meu sobrando. Cópias mutadas e exportações em `/var/tmp/qa-soc2/r6/`.
