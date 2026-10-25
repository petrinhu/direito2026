# QA local: Sociologia AV3, Artigos e ECA Digital (PD-08)

QA visual local, headless e isolado, da mudança de Sociologia AV3 (Artigos e ECA Digital, com endereço antigo redirecionado). Escopo: menu lateral, página ECA Digital (abas, quiz, texto integral), redirecionamento do endereço antigo, trilha e modos de exibição. Só medição e observação: nenhum arquivo de produto foi alterado.

Commits do pacote: `ea751a8`, `8767121`, `b489e26`, `dd3071a`, `5aed0be`.

## 1. Congelamento (L-13)

- HEAD no início: `5aed0be7230e394697396db781aad4e02a4c2541` (main, `feat(conteudo): ECA Digital com texto integral da Lei 15.211 e quiz de 40 questões (PD-08)`).
- `git status --short` no início (árvore principal): `?? mockups/selo-home.html` (não é deste QA, não foi tocado).
- Cópia isolada: `.worktrees/qa-eca`, criada com `git worktree add` no HEAD `5aed0be`. A subpasta `.worktrees/` está ignorada pelo git (`git check-ignore` confirmou).
- `node_modules` da cópia: link simbólico para o `node_modules` do projeto. Dentro da cópia, o git mostra `?? node_modules` por causa do link (o `.gitignore` traz `node_modules/`, com barra final, que não casa com link simbólico). É artefato da cópia, não do produto.
- Build na cópia, com `TMPDIR=/var/tmp`, cada comando com `> log 2>&1; echo $?`:
  - `node --import tsx scripts/gerar-dispositivos-por-unidade.ts`: exit 0.
  - `npx vite build`: exit 0 (104 entradas de precache, `dist/sw.js` gerado).
- md5 de `dist/` (`find dist -type f | sort | xargs md5sum | md5sum`), no início: `016ed5a01c35cd6528d5a936929fc32a` (132 arquivos).
- md5 de `dist/` no fim: registrado na seção 6.
- Servidor: `npx vite preview --port 4197 --strictPort` na cópia, em background, log em `/var/tmp/qa-eca/preview.log`. Porta 4173 não usada.

## 2. Processo (L-50, L-51, L-57)

- Navegador: Chromium já instalado (`/usr/bin/chromium-browser`, 155.0.8059.84), via Playwright (`playwright-core`) já presente no projeto, headless, dentro de caixa `bwrap`. Nada foi instalado nem baixado.
- Caixa (`/var/tmp/qa-eca/caixa.sh`): `--clearenv` com PATH, LANG, HOME, TMPDIR e XDG_RUNTIME_DIR próprios em `/var/tmp/qa-eca/`; `/usr` e `/etc` só leitura; `/dev` mínimo (`--dev`) e `/dev/shm` próprio; `/run` vazio (`--tmpfs`); projeto só leitura; rede compartilhada com o host só para `localhost:4197`. Sem `DISPLAY` nem `WAYLAND_DISPLAY`. Sem janela visível, sem xdotool, wmctrl ou ydotool, sem automação de foco.
- Sonda de isolamento (saída bruta, `/var/tmp/qa-eca/sonda.log`), executada dentro da caixa:

  ```
  XDG_RUNTIME_DIR=/var/tmp/qa-eca/xdg
  WAYLAND_DISPLAY=(vazio) DISPLAY=(vazio)
  /dev: core fd full null ptmx pts random shm stderr stdin stdout tty urandom zero
  /run: (vazio)
  /run/user existe? false
  titulo: Caderno de Direito | versao: 155.0.8059.84
  ```

  Sem `nvidia*` nem `dri` em `/dev`. Isolamento provado antes de qualquer medição.
- Perfil descartável: um contexto novo por verificação (`browser.newContext`), sem perfil do líder.
- Modos: sempre pelos botões reais da página ("Tema ..." e "Leitura ampliada"), com clique do Playwright. Nenhum atributo de tema ou de modo foi gravado à mão.
- Scripts de medição (fora do repositório): `/var/tmp/qa-eca/medir/` (`comum.mjs`, `verif-a.mjs` e os demais). Saídas JSON em `/var/tmp/qa-eca/saida-*.json`. Capturas em `/var/tmp/qa-eca/capturas/`.
- Cada captura foi aberta e descrita após o registro do dado bruto.

## 3. Resultado

REPROVADO. A verificação f reprova por legibilidade em 390 px com Leitura ampliada (desvio F1). As verificações a, b, c, d e e passam, com observações. Veredito completo, tabela e desvios na seção 5.

## 4. Verificações

### 4.a. Menu lateral em 1280 px (`/p/p1/sociologia-juridica/u3-eca-digital/texto`)

Script: `/var/tmp/qa-eca/medir/verif-a.mjs`. Saída bruta: `/var/tmp/qa-eca/saida-a.json`.

| Item | Esperado | Medido | Resultado |
|---|---|---|---|
| Itens diretos sob 1º período > Sociologia Jurídica > AV3 | "Artigos" e "ECA Digital", sem grupo "Resumo" | Exatamente dois itens diretos: "Artigos" (href `/p/p1/sociologia-juridica/u3-artigos-infancia-digital`) e "ECA Digital" (href `/p/p1/sociologia-juridica/u3-eca-digital`). Nenhum "Resumo" entre os diretos | PASSA |
| Abas do ECA Digital no menu | Resumo aparece como aba do item, não como grupo de AV3 | "Resumo" existe como aba (nível 4) sob "ECA Digital", com seus blocos. Ver desvio D1 (interpretação) | PASSA (com observação D1) |
| Caminho até a página atual, sem clique | 1º período, Sociologia, AV3, ECA Digital abertos; atual = Texto integral | `aria-expanded` = true em 1º período, Sociologia Jurídica, AV3 e ECA Digital; atual = "Texto integral" | PASSA |
| Rótulo "ECA Digital" navega (a partir de Artigos) | Navega para a unidade | URL vira `/p/p1/sociologia-juridica/u3-eca-digital` (raiz da unidade, ver D1) | PASSA |
| Rótulo "Artigos" navega (a partir de ECA) | Navega | URL vira `/p/p1/sociologia-juridica/u3-artigos-infancia-digital` | PASSA |
| Seta de ECA Digital abre as abas | `aria-expanded` false -> true e aba "Texto integral" visível | Antes: `false`. Depois do clique: `true`. "Texto integral" visível | PASSA |
| Erros de console ou de página nos passos acima | nenhum | nenhum | PASSA |

Capturas (abertas e descritas):
- `/var/tmp/qa-eca/capturas/a1-menu-1280-rota-eca.png`: menu com 1º período, Sociologia Jurídica e AV3 abertos. Sob AV3 aparecem "Artigos" (seta fechada) e "ECA Digital" (seta aberta). Sob ECA Digital: "Texto integral" em destaque (atual), "Resumo" com seta, "Mapa mental", "Fichamento", "Mnemônicos" e "Quiz". Não há item "Resumo" entre AV3 e os dois itens. A cadeia já vem aberta sem clique.
- `/var/tmp/qa-eca/capturas/a3-menu-1280-seta-abre-abas.png`: página Artigos, menu com a seta de ECA Digital aberta. Abas do ECA Digital visíveis, na ordem Texto integral, Resumo, Mapa mental, Fichamento, Mnemônicos, Quiz.
- `/var/tmp/qa-eca/capturas/a4-pagina-1280-apos-rotulo-eca.png`: após clicar no rótulo "ECA Digital" a partir de Artigos. Título "ECA Digital", barra de abas com "Resumo" ativa, progresso "0 de 14 blocos lidos". O ramo Artigos continua aberto no menu, porque já estava aberto antes do clique (ver D2).

Dados brutos: `/var/tmp/qa-eca/saida-a.json`.

### 4.b. Página ECA Digital: abas, renderização e Texto integral

Script: `/var/tmp/qa-eca/medir/verif-b.mjs` (sete rotas, uma por contexto novo, 1280 px), `verif-b2.mjs` (controles) e `verif-b3.mjs` (recaptura dos arts. 36-A e 41-A depois de fechar o aviso pelo botão "Entendi"). Saídas: `/var/tmp/qa-eca/saida-b.json`, `saida-b2.json`, `saida-b3.json`.

| Rota | HTTP | Título (h1) | Ordem das abas (tablist "Abas da unidade") | Aba selecionada | Erros de console ou de página |
|---|---|---|---|---|---|
| `/texto` | 200 | ECA Digital | Texto integral, Resumo, Mapa mental, Fichamento, Mnemônicos, Quiz | Texto integral | nenhum |
| `/resumo` | 200 | Página não encontrada | - | - | nenhum (ver O2) |
| raiz da unidade | 200 | ECA Digital | igual | Resumo | nenhum |
| `/mapa` | 200 | ECA Digital | igual | Mapa mental | nenhum |
| `/fichamento` | 200 | ECA Digital | igual | Fichamento | nenhum |
| `/mnemonicos` | 200 | ECA Digital | igual | Mnemônicos | nenhum |
| `/quiz` | 200 | ECA Digital | igual | Quiz | nenhum |

Texto integral (`/texto`, medido no texto renderizado da página):

| Item | Esperado | Medido | Resultado |
|---|---|---|---|
| Capítulos | Capítulos da lei renderizados | 16 capítulos distintos, de "CAPÍTULO I DISPOSIÇÕES PRELIMINARES" a "CAPÍTULO XVI DISPOSIÇÕES FINAIS" | PASSA |
| Artigo "(VETADO)" | presente | 3 ocorrências: "§ 7º (VETADO).", "Art. 36. (VETADO).", "Art. 41. (VETADO)." | PASSA |
| Art. 36-A | presente e visível | "Art. 36-A. Os valores decorrentes das multas aplicadas com base nesta Lei serão destinados..." (Incluído pela Lei nº 15.504, de 2026). Visível | PASSA |
| Art. 41-A | presente e visível | "Art. 41-A. Esta Lei entra em vigor em 17 de março de 2026. (Incluído pela Lei nº 15.352, de 2026)". Visível | PASSA |

Capturas (abertas e descritas):
- `/var/tmp/qa-eca/capturas/b-texto-1280.png`: aba Texto integral ativa, primeira na barra. Título "Lei nº 15.211, de 17 de setembro de 2025" e "CAPÍTULO I DISPOSIÇÕES PRELIMINARES" aparecem, com o aviso "Entendi" cobrindo parte do texto (O1).
- `/var/tmp/qa-eca/capturas/b-texto-art36A-sem-aviso-1280.png`: aviso fechado pelo botão. Mostra "§ 7º (VETADO).", "Art. 36. (VETADO)." e, logo abaixo, "Art. 36-A..." com o texto completo e "(Incluído pela Lei nº 15.504, de 2026)", legível.
- `/var/tmp/qa-eca/capturas/b-texto-art41A-sem-aviso-1280.png`: aviso fechado. Mostra "Art. 41. (VETADO)." seguido de "Art. 41-A. Esta Lei entra em vigor em 17 de março de 2026. (Incluído pela Lei nº 15.352, de 2026)", e a assinatura. Legível.
- `/var/tmp/qa-eca/capturas/b-raiz-1280.png`: raiz da unidade, aba Resumo ativa, com "0 de 14 blocos lidos" e a lista de 14 itens. Ver D1 do menu.
- `/var/tmp/qa-eca/capturas/b-mapa-1280.png`: aba Mapa mental ativa, título e texto da aba, mapa renderizado (blocos e ramos visíveis, parcialmente coberto pelo aviso, O1).
- `/var/tmp/qa-eca/capturas/b-fichamento-1280.png`: aba Fichamento ativa, "12 fichas" em duas colunas de links.
- `/var/tmp/qa-eca/capturas/b-mnemonicos-1280.png`: aba Mnemônicos ativa, cartões com "Acrônimo" e botão "Mostrar o que a dica guarda".
- `/var/tmp/qa-eca/capturas/b-resumo-1280.png`: rota `/resumo`, "Página não encontrada" (O2).

### 4.c. Quiz: 40 questões e explicação

Script: `/var/tmp/qa-eca/medir/verif-c.mjs`, 1280 px, rota `/quiz`. Saída: `/var/tmp/qa-eca/saida-c.json`.

Método: percorrer o quiz pelo botão "Próxima", lendo o contador "Pergunta N de T" a cada passo. Em cada pergunta, clicar (real) na primeira alternativa. Ao final, clicar em "Finalizar".

| Item | Esperado | Medido | Resultado |
|---|---|---|---|
| Total declarado | 40 | Placar: "Quiz com 40 perguntas no total." | PASSA |
| Perguntas percorridas | 40 | 40 posições lidas, 40 distintas, de "Pergunta 1 de 40" a "Pergunta 40 de 40" | PASSA |
| Explicação antes de responder | ausente | 0 blocos `.cartao-pergunta__explicacao` na pergunta 1 antes do clique | PASSA |
| Explicação depois de responder | aparece, com veredito | Após o clique: veredito "Resposta incorreta." ou "Resposta correta.", e explicação com 396 caracteres na pergunta 1 (todas as 40 com texto, nenhuma vazia) | PASSA |
| Resultado final | placar | "Resultado: 7 de 40" (respondendo sempre a primeira alternativa, 7 acertos) e quatro categorias de 10 | PASSA |
| Erros de console ou de página | nenhum | nenhum | PASSA |

Capturas (abertas e descritas):
- `/var/tmp/qa-eca/capturas/c-quiz-q1-respondida-1280.png`: pergunta 1 respondida. A alternativa marcada aparece em vermelho com "Sua resposta, incorreta", a correta em verde com "Correta", e a explicação aparece abaixo, em texto corrido. Legível.
- `/var/tmp/qa-eca/capturas/c-quiz-resultado-1280.png`: "Resultado: 7 de 40", com as quatro categorias e a grade de 40 números coloridos por acerto e erro, e "Refazer o quiz".
- `/var/tmp/qa-eca/capturas/b-quiz-1280.png`: estado inicial, "Pergunta 1 de 40", "Acertos: 0 de 0", "Quiz com 40 perguntas no total.", com "Anterior" e "Próxima".

### 4.d. Endereço antigo redirecionado

Script: `/var/tmp/qa-eca/medir/verif-de.mjs`. Saída: `/var/tmp/qa-eca/saida-de.json`. Cada entrada abre em contexto novo, 1280 px.

| Entrada | Destino medido | Aba preservada | Página abre | Erros | Resultado |
|---|---|---|---|---|---|
| `/p/p1/sociologia-juridica/u3` | `/p/p1/sociologia-juridica/u3-artigos-infancia-digital` | Resumo (padrão) | h1 "Infância, redes sociais e tecnologias digitais", abas Resumo, Mapa mental, Fichamento, Mnemônicos, Quiz | nenhum | PASSA |
| `/p/p1/sociologia-juridica/u3/quiz` | `/p/p1/sociologia-juridica/u3-artigos-infancia-digital/quiz` | Quiz | igual, aba Quiz selecionada | nenhum | PASSA |
| `/p/p1/sociologia-juridica/u3/mapa?x=1#bloco-0` | `/p/p1/sociologia-juridica/u3-artigos-infancia-digital/mapa?x=1#bloco-0` | Mapa mental, com query e âncora preservadas | igual | nenhum | PASSA |
| Página Artigos, raiz | `/p/p1/sociologia-juridica/u3-artigos-infancia-digital` | Resumo | abre normalmente, 10 blocos, "0 de 10 blocos lidos" | nenhum | PASSA |

Capturas: `/var/tmp/qa-eca/capturas/d-redir-u3-1280.png` (entrada antiga resolvida na página Artigos, com ramo Artigos aberto no menu, aba Resumo ativa, lista de 10 itens) e `/var/tmp/qa-eca/capturas/d-artigos-raiz-1280.png` (mesma página, raiz direta). Ambas abertas e descritas.

### 4.e. Trilha (breadcrumb)

Script: o mesmo `verif-de.mjs`. Texto normalizado do `nav[aria-label="Trilha de navegação"]`, itens na ordem:

| Página | Itens da trilha | Texto exato (sem separadores visuais) |
|---|---|---|
| ECA Digital, `/texto` | 1º período > Sociologia Jurídica > ECA Digital da AV3 > Texto integral | `1º períodoSociologia JurídicaECA Digital da AV3Texto integral` |
| ECA Digital, raiz | ... > Resumo | `1º períodoSociologia JurídicaECA Digital da AV3Resumo` |
| ECA Digital, `/quiz` | ... > Quiz | `1º períodoSociologia JurídicaECA Digital da AV3Quiz` |
| Artigos, raiz | 1º período > Sociologia Jurídica > Artigos da AV3 > Resumo | `1º períodoSociologia JurídicaArtigos da AV3Resumo` |

Os separadores ("/") são desenho por CSS, por isso não aparecem no texto. A trilha visível, na captura, é "ECA Digital da AV3 / Texto integral". Observação: a trilha usa "ECA Digital da AV3" e "Artigos da AV3", e o menu usa "ECA Digital" e "Artigos". A mesma unidade tem dois rótulos. Não é defeito, mas vale a decisão do líder. Captura: `/var/tmp/qa-eca/capturas/e-trilha-eca_texto-1280.png`, aberta e descrita. Sem erros de console em nenhuma das quatro páginas.

### 4.f. Três modos, em 1280 e 390 px, rotas /texto e /quiz

Script: `/var/tmp/qa-eca/medir/verif-f.mjs`. Saída: `/var/tmp/qa-eca/saida-f.json`. Doze estados, cada um em contexto novo. Modos pelos botões reais: "Tema claro" e "Tema escuro" (atributo `data-theme` lido, nunca escrito) e "Leitura ampliada" (`button.botao-modo-adaptado`, estado em `aria-pressed`). Medição de overflow em `documentElement` e `body`. Captura de viewport, lida.

| Largura | Rota | Modo | `data-theme` | Ampliada | scrollWidth x clientWidth (html / body) | Estouro | Fonte do parágrafo | Erros |
|---|---|---|---|---|---|---|---|---|
| 1280 | /texto | claro | light | não | 1280 x 1280 / 1280 x 1280 | não | Inter 15,3 px, cor rgb(74,74,74) sobre rgb(250,249,245) | nenhum |
| 1280 | /texto | escuro | dark | não | 1280 x 1280 / 1280 x 1280 | não | Inter 15,3 px, cor rgb(184,192,204) sobre rgb(18,22,28) | nenhum |
| 1280 | /texto | ampliada | light | sim | 1280 x 1280 / 1280 x 1280 | não | Inter 21,6 px, preto sobre branco | nenhum |
| 1280 | /quiz | claro | light | não | 1280 x 1280 / 1280 x 1280 | não | igual | nenhum |
| 1280 | /quiz | escuro | dark | não | 1280 x 1280 / 1280 x 1280 | não | igual | nenhum |
| 1280 | /quiz | ampliada | light | sim | 1280 x 1280 / 1280 x 1280 | não | igual | nenhum |
| 390 | /texto | claro | light | não | 390 x 390 / 390 x 390 | não | Inter 15,3 px | nenhum |
| 390 | /texto | escuro | dark | não | 390 x 390 / 390 x 390 | não | Inter 15,3 px | nenhum |
| 390 | /texto | ampliada | light | sim | 390 x 390 / 390 x 390 | não | Inter 21,6 px | nenhum |
| 390 | /quiz | claro | light | não | 390 x 390 / 390 x 390 | não | Inter 15,3 px | nenhum |
| 390 | /quiz | escuro | dark | não | 390 x 390 / 390 x 390 | não | Inter 15,3 px | nenhum |
| 390 | /quiz | ampliada | light | sim | 390 x 390 / 390 x 390 | não | Inter 21,6 px | nenhum |

Estouro horizontal: nenhum em nenhum dos 12 estados. Nota de método: o seletor do "parágrafo" pega o primeiro `p` do documento, que pode não ser o do texto corrido. Por isso a coluna de fonte é indicativa, a legibilidade é julgada pela captura.

Capturas lidas, e o que se vê:
- 1280, /texto, claro, escuro, ampliada; 1280, /quiz, claro, escuro, ampliada: texto legível nos três modos. O aviso de primeira visita cobre parte do texto nas capturas de claro e escuro (O1). Na ampliada, o cabeçalho ocupa mais espaço, o título e as abas ficam por baixo do aviso, e o quiz mostra o enunciado cortado pelo aviso. Legível depois de fechar o aviso.
- 390, /texto e /quiz, claro e escuro: texto legível abaixo do aviso. O aviso cobre o título e as abas na primeira tela.
- 390, /texto e /quiz, ampliada (primeira visita): o aviso e o cartão "21 dias" ocupam quase toda a tela. Só aparecem o título parcialmente coberto e "Fichamento". O texto não é legível nessa primeira tela (desvio F1).
- Depois de fechar o aviso (botão "Entendi"): o cartão "21 dias" continua cobrindo a área de leitura (`f2-390-texto-ampliada-sem-aviso.png` e `f2-390-quiz-ampliada-sem-aviso.png`).
- Depois de minimizar o cartão (botão "Minimizar"): o título "ECA Digital" e as abas aparecem. A pílula minimizada ("21 dias", "Mostrar") ainda cobre parte das abas Resumo e Mapa mental (`/var/tmp/qa-eca/capturas/f3-390-texto-ampliada-minimizado.png`). Em 390 px com ampliada, as abas ficam empilhadas uma por linha.

Capturas de referência: `/var/tmp/qa-eca/capturas/f-1280-texto-claro.png`, `f-1280-texto-escuro.png`, `f-1280-texto-ampliada.png`, `f-1280-quiz-claro.png`, `f-1280-quiz-escuro.png`, `f-1280-quiz-ampliada.png`, `f-390-texto-claro.png`, `f-390-texto-escuro.png`, `f-390-texto-ampliada.png`, `f-390-quiz-claro.png`, `f-390-quiz-escuro.png`, `f-390-quiz-ampliada.png`. Todas abertas.

## 5. Veredito e desvios

Veredito consolidado: REPROVADO, por um desvio de legibilidade (F1), em 390 px com Leitura ampliada. As verificações a, b, c, d e e passaram. O estouro horizontal não ocorreu em nenhum dos 12 estados de f.

| Verificação | Veredito | Observação |
|---|---|---|
| a. Menu lateral em 1280 px | PASSA | D1 e D2 |
| b. Página ECA Digital, abas, renderização, Texto integral | PASSA | O2 |
| c. Quiz de 40 questões e explicação | PASSA | nenhuma |
| d. Endereço antigo redirecionado | PASSA | nenhuma |
| e. Trilha (breadcrumb) | PASSA | D3 |
| f. Três modos, 1280 e 390 px, /texto e /quiz | REPROVA (legibilidade em 390 px ampliada, F1) | sem estouro em 12 de 12; O1 |

### 5.1 Desvios

- **F1 (reprova f).** Em 390 px com Leitura ampliada, a primeira tela não mostra o texto. O aviso de primeira visita e o cartão "21 dias" (componentes globais do site, não do pacote) ocupam quase toda a tela. Depois de fechar o aviso, o cartão continua cobrindo a área de leitura. Depois de minimizá-lo, a pílula ainda cobre parte das abas Resumo e Mapa mental. Capturas: `/var/tmp/qa-eca/capturas/f-390-texto-ampliada.png`, `f2-390-texto-ampliada-sem-aviso.png`, `f3-390-texto-ampliada-minimizado.png`. Causa fora do conteúdo do pacote: decisão de desenho dos componentes globais (aviso de primeira visita e cartão "21 dias" fixos), a cargo do líder. Não medi se a pílula também cobre o texto em 390 px sem a ampliada.

### 5.2 Decisões e observações (sem reprovação)

- **D1 (decisão do líder, menu e raiz).** "Resumo" continua existindo como aba de ECA Digital, em nível 4, sem grupo intermediário sob AV3. Isso satisfaz o critério de "não existe grupo Resumo sob AV3", mas a palavra segue no menu. Além disso, o rótulo "ECA Digital" leva à raiz da unidade (`/p/p1/sociologia-juridica/u3-eca-digital`), que abre a aba Resumo ativa, não o Texto integral. A ordem das abas está correta. Confirmar se a raiz deve cair em Resumo (como ocorre na raiz das outras unidades) ou em Texto integral.
- **D2 (menu).** Quem navega de Artigos para ECA Digital mantém o ramo Artigos aberto no menu. É o comportamento de "não recolhe ao navegar" do QA anterior do menu. Não é defeito deste pacote.
- **D3 (rótulos).** A trilha diz "ECA Digital da AV3" e "Artigos da AV3"; o menu diz "ECA Digital" e "Artigos"; o título da página Artigos é "Infância, redes sociais e tecnologias digitais". Três nomes para a mesma unidade. Decisão de conteúdo.
- **O1 (aviso e cartão, fora do pacote).** Em primeira visita, o aviso "Este site guarda, só neste navegador..." cobre o início do texto em 1280 px e, no celular, a maior parte da tela. O cartão "21 dias" fica no canto. Afeta a leitura da primeira tela de todas as páginas, não só deste pacote. Ver também F1.
- **O2 (endereço, comum ao site).** `/resumo` não é rota. Renderiza "Página não encontrada" com HTTP 200 (fallback do SPA). O mesmo ocorre em `/p/p1/intr-direito/u1/resumo`, controle medido. O Resumo fica na raiz da unidade. Não é defeito deste pacote, mas o servidor responde 200 para página inexistente.

## 6. Encerramento (L-13)

- HEAD no fim: `5aed0be7230e394697396db781aad4e02a4c2541`, igual ao início. Nenhum arquivo de produto foi alterado.
- md5 de `dist/` no fim: `016ed5a01c35cd6528d5a936929fc32a`, igual ao início (132 arquivos).
- Encerramento: servidor na porta 4197 parado (porta fechada confirmada); link `node_modules` da cópia removido (só o link, o `node_modules` do projeto ficou intacto); `git worktree remove .worktrees/qa-eca` feito sem `--force`.
- Árvore principal, no fim: `?? mockups/selo-home.html` (não é deste QA, intocado) e o relatório deste QA, commitado. A cópia `.worktrees/pub`, de outra sessão, não foi tocada.
- Evidência bruta fora do repositório, para revisão antes da limpeza de scratch: `/var/tmp/qa-eca/` (saídas `saida-*.json`, logs, capturas em `capturas/`, scripts em `medir/`).
- Limites: o QA é de medição e de olhar captura; não há teste de leitor de tela nem de contraste medido pelo pixel. A verificação de sobreposição de componentes globais é por captura e por geometria, não por teste automatizado.
