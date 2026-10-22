# QA de produção: v1.1.0.0 no ar (AV3 da Introdução ao Direito u3 e da Sociologia Jurídica u3)

Alvo: https://direito2026.drpetrus.top, versão v1.1.0.0, tag `v1.1.0.0` = commit `2cb70d2`. Rodada sem edição de código, sem commit, sem push, sem deploy. Scratch em `/var/tmp/qa-prod-av3/` (fora do repositório). Capturas em `/var/tmp/qa-prod-av3/caps/`. Relatório gravado incrementalmente.

## Veredito

**APROVADO** para os 7 itens do checklist. Não há defeito CRÍTICO. Há 1 defeito IMPORTANTE de acessibilidade (rótulo do botão de modo adaptado, decisão de especificação para o líder) e 4 COSMÉTICOS, listados em Achados.

## Congelamento (L-13)

- HEAD no início e no fim: `2cb70d2` (commit `chore(release): v1.1.0.0`, 22/10/2026 02:17:04 -0300). A tag `v1.1.0.0` aponta para ele.
- `git status --short` no início e no fim: `?? mockups/selo-home.html` (não é deste QA) e este relatório.
- Identidade do artefato no ar, conferida por bytes e não por declaração:
  - `dist/` local NÃO serve de referência. Foi gerado às 02:08:22, antes do commit de release (02:17), e o bundle `index-DSAJoiQP.js` dele não traz `1.1.0.0`. O md5 da lista de `dist/` local no início e no fim: `659fe1aefde20c59b0a129fb72f6931b` (igual nas duas pontas). `dist/` é ignorado pelo git e não afeta o site.
  - Build do tag feito fora da árvore: `git archive 2cb70d2` extraído em `/var/tmp/qa-prod-av3/src/`, `node_modules` ligado por symlink ao do projeto (somente leitura), `npm run build` completo dentro da caixa. Saída em `/var/tmp/qa-prod-av3/build-tag.log`, rc 0, 115 arquivos, todos os portões OK.
  - Comparação com o ar: `sw.js` igual byte a byte (`cmp`); `index.html` igual; bundle `assets/index-fFdZ20Ws.js` igual (md5 `f5da3f66b62b46e81d0107b426d84efc` nos dois lados). Os 86 itens do precache foram baixados do ar e comparados com o build do tag: 85 idênticos e 1 divergente (ver item 7).
  - md5 da lista do `dist/` do tag: `de34dbfc8de98ba8f4336f1e4a835af1`, 115 arquivos.

## Isolamento (L-50, L-57, L-51)

- Caixa: `env -u DISPLAY -u WAYLAND_DISPLAY -u DBUS_SESSION_BUS_ADDRESS XDG_RUNTIME_DIR=/var/tmp/qa-prod-av3/run TMPDIR=/var/tmp/qa-prod-av3/tmp bwrap --bind / / --dev /dev --tmpfs /run/user`.
- `/dev` dentro da caixa: `core fd full null ptmx pts random shm stderr stdin stdout tty urandom zero`. Nenhum `nvidia*`, nenhum `dri`.
- Ambiente dos navegadores: NÃO comprovado por `/proc/<pid>/environ`. Os processos filhos do Chromium negaram a leitura (`Permissão negada`). A prova disponível é a do processo pai (script Node), que herda o ambiente da caixa.
- Navegadores: `/usr/bin/chromium-browser` (155) e `/usr/bin/brave-browser` (155), headless, perfis descartáveis em `/var/tmp/qa-prod-av3/perfil-*`. Playwright do `node_modules` do projeto (1.63). Nada instalado, nenhum `playwright install`.
- Um processo de navegador por vez. Nenhuma janela na sessão do líder. Ao final, nenhum processo de QA sobrando.
- Limite de cobertura: itens 3, 4 e 5 rodaram só no Chromium. Brave cobriu o item 6 (offline). Firefox não foi usado nesta rodada.

## Resultados por item do checklist

### 1. Rodapé mostra "v1.1.0.0": APROVADO
- Home e rota da Hart: rodapé com "v1.1.0.0 · © 2026 Caderno de Direito".
- Travessão (U+2014 e U+2013) no rodapé: 0 ocorrências. O cosmético de rodapé da rodada anterior (travessão e intervalo "2026-2026") está resolvido.
- Captura: `rodape-home-1280.png`.

### 2. Menu: APROVADO
- Enumeração completa do menu, expandido só por teclado (Enter no botão com `aria-expanded="false"`; 30 expansões, 0 fechados restantes).
- Introdução ao Direito: AV1 (com "Petição comentada" e Quiz), Interdisciplinar, AV3 > Livro > "A textura aberta do direito". "Material de estudo" aparece com a marca "em breve", no mesmo nível de AV1, Interdisciplinar e AV3 (o ancestral com botão mais próximo é a própria cadeira).
- Outras cadeiras do 1º período: Português e Redação Jurídica 1 (AV1), Sociologia Jurídica (AV1 e AV3), Filosofia Jurídica (AV1 e AV3). Os períodos 2º a 10º mostram "Sem cadeira publicada / em breve".
- Nenhuma ocorrência de "Unidade" no menu (checagem do texto inteiro do menu).
- Observação para o líder (não é defeito do checklist): Português e Redação Jurídica 1 tem só AV1; confirmar se é o desenho pretendido.
- Captura: `menu-expandido-1280.png`.

### 3. Hart (`/p/p1/intr-direito/u3-livro-textura-aberta`): APROVADO
- Abas: Resumo, Texto integral (rota `/texto`), Mapa mental, Fichamento, Mnemônicos e Quiz abrem. Nenhuma mostra "Página não encontrada". Quiz: "Pergunta 1 de 30".
- Trilha: "Livro da AV3" visível em 1280 e 360 (no modo normal a trilha mostra "Livro da AV3 > Resumo"; no adaptado, a trilha completa "1º período > Introdução ao Direito > Livro da AV3 > Resumo"). Conserto de `f07959d` confirmado em produção.
- Texto integral: 16 marcadores `[p. N]`, o primeiro é `[p. 137]`; 10 ocorrências de notas `(*)`, `(**)`, `(***)`. A contagem de parágrafos da prosa (30) NÃO foi isolada nesta rodada; a medição que fiz pegou todos os `<p>` da página (101), o que não prova a contagem.
- Cobertura por `document.elementFromPoint` no centro do elemento (link `aria-current="page"` da trilha, botão Tema, botão de modo adaptado), em 4 combinações (1280/360 x normal/adaptado), mais o botão Tema na aba Texto integral: todas OK, sem cobertura, sem rolagem horizontal da página.
- Erros de console e respostas HTTP >= 400 nas abas: 0.
- Capturas: `hart-normal-1280-resumo.png`, `hart-adaptado-1280-resumo.png`, `hart-normal-360-resumo.png`, `hart-adaptado-360-resumo.png`, `hart-texto-normal-1280.png`, `hart-texto-adaptado-1280.png`, `hart-texto-normal-360.png`, `hart-texto-adaptado-360.png`, `hart-quiz-*`, `hart-mapa-*`, `hart-fichamento-*`, `hart-mnemonicos-*` (1280 e 360, normal e adaptado).
- Achados desta rota: ver IMPORTANTE 1 (rótulo do modo adaptado) e COSMÉTICO 1 (alternativas sem letras) e COSMÉTICO 4 (cartão de calendário).

### 4. Sociologia Jurídica u3 (`/p/p1/sociologia-juridica/u3`): APROVADO
- 5 abas: Resumo, Mapa mental, Fichamento, Mnemônicos e Quiz. Não há aba "Texto integral" (correto para esta unidade).
- Quiz: "Pergunta 1 de 40" e "Quiz com 40 perguntas no total". Resposta respondida mostra veredito ("Sua resposta, incorreta" e "Correta") e placar "Falhas: 1 de 1".
- Cobertura OK em 1280 normal, 360 normal e 360 adaptado (trilha atual, Tema, modo adaptado). Sem rolagem horizontal. Erros de console: 0.
- Capturas: `sociologia-resumo-normal-1280.png`, `sociologia-mapa-mental-normal-1280.png`, `sociologia-fichamento-normal-1280.png`, `sociologia-mnemonicos-normal-1280.png`, `sociologia-quiz-normal-1280.png`, `sociologia-quiz-respondido-1280.png`, e as versões 360 normal e adaptado.

### 5. Regressão (home e unidades antigas): APROVADO
- Enumeração de todas as rotas do menu (116 hrefs, 31 rotas únicas sem fragmento, incluindo home e as cadeiras), por um navegador só, Chromium: todas HTTP 200, todas com `h1`, nenhuma com "Página não encontrada", 0 erros de console ou de resposta >= 400.
- Rotas inexistentes mostram "Cadeira não encontrada" (raiz de cadeira) ou "Unidade não encontrada" (subrota), com a marca "em breve". É o comportamento de desenho, não defeito.
- Captura da rota inexistente: `rota-inexistente-offline-1280.png` (mostra "Cadeira não encontrada" offline).

### 6. Offline com service worker: APROVADO (Chromium e Brave)
- Visita online à home, espera de `controller` (após recarga) e de 86 entradas no cache do workbox. Visitas online às 5 rotas novas.
- Corte de rede (`setOffline(true)`) e navegação direta por `goto` a cada rota:
  - Chromium: 5/5 abrem (Hart resumo, texto, quiz: "Pergunta 1 de 30"; Sociologia u3 e quiz: "Pergunta 1 de 40"). Nenhum erro do navegador na página.
  - Brave: 5/5 abrem, mesmos resultados.
- Quiz offline: uma alternativa respondida dá veredito ("Sua resposta, incorreta" e "Correta") e placar, nos dois navegadores.
- Console offline: a única falha é `/manifest.webmanifest` (ERR_INTERNET_DISCONNECTED), porque o manifest não está no precache. Ver COSMÉTICO 2.
- Captura `offline-quiz-chromium-1280.png` e `offline-quiz-brave-1280.png`: ATENÇÃO, o harness tirou a captura depois de navegar para uma rota inexistente, então mostram "Cadeira não encontrada", não o quiz. A prova do quiz offline é o texto do veredito, não a captura.

### 7. Precache (`sw.js`): APROVADO
- `encontrados=86 analisados=86 falharam=0`. Todas as URLs do precache respondem HTTP 200.
- Bytes idênticos ao build do tag: 85/86. A divergente é `assets/oferecimento-logo-C17sdA4W.png` (logo do rodapé). Ver COSMÉTICO 3.
- Nenhuma entrada de rota `/p/` no precache (correto: as rotas são servidas pelo `index.html` via fallback).

## Achados

### CRÍTICO
Nenhum.

### IMPORTANTE
1. **Rótulo do botão de modo adaptado não contém o texto visível (WCAG 2.5.3, Label in Name, nível A).** Componente `src/ui/componentes/BotaoModoAdaptado.vue` (no tag `2cb70d2`). Rótulo visível "Leitura ampliada" (estado desligado) e "Leitura normal" (ligado), mas o `aria-label` é "Ativar modo de leitura adaptada: texto maior e contraste máximo em preto e branco" e "Desativar modo de leitura adaptada e voltar ao tamanho e à cor normais". Nenhum dos dois contém o rótulo visível. Quem usa comando de voz ("clicar em Leitura ampliada") não consegue acionar o botão. Origem declarada: texto exato da especificação `docs/modo-adaptado.md`, seção 5. Trata-se de decisão de especificação: corrigir exige o líder decidir se o `aria-label` passa a conter o rótulo visível ou se o rótulo visível muda. Não decidi nada.
   - Captura: `hart-adaptado-1280-resumo.png`, mostra o botão "Leitura normal" no estado ligado.

### COSMÉTICO
1. **Quiz da AV3 de Hart (30 perguntas) sem letras nas alternativas.** As 4 alternativas aparecem sem "A", "B", "C", "D" (capturas `hart-quiz-normal-1280.png` e `hart-quiz-adaptado-1280.png`). A Sociologia u3 mostra letras. O padrão de letras é da especificação de quiz novo; confirmar se as unidades antigas sem letras são o desenho pretendido para a Hart.
2. **Manifest fora do precache.** `/manifest.webmanifest` não está nas 86 entradas do `sw.js`. Offline, o console registra ERR_INTERNET_DISCONNECTED em cada rota. Sem efeito visível nas páginas.
3. **Logo do rodapé com bytes diferentes do build do tag.** `assets/oferecimento-logo-C17sdA4W.png`: o nome traz o hash de conteúdo, e os dois arquivos têm o mesmo nome, mas o chunk `eXIf` diverge (120 bytes no ar, 180 no build do tag). Os dados de pixel descomprimidos são idênticos (comparação de IDAT). Causa não identificada. Não afeta a imagem; vale checar o passo de publicação, que aplica regras diferentes a `.png`.
4. **Cartão flutuante "24 dias" (calendário de provas) cobre conteúdo em 360 px.** O cartão aparece no estado inicial sobre o texto e sobre a lista de resumo, nas duas telas e nos dois modos (capturas `hart-*-360-*`, `sociologia-*-360-*`). Tem botão Minimizar. Não avaliei se o estado minimizado persiste entre páginas. Não é regressão medida nesta rodada (sem build anterior para comparar).

## Observações para o orquestrador (não são defeitos de produção)
- `dist/` local foi gerado antes do commit de release (02:08 contra 02:17). Não afeta o site, mas não serve como artefato de referência para o tag.
- Consulta a `/p/p1/rota-que-nao-existe` mostra "Cadeira não encontrada", não "Página não encontrada". Comportamento de desenho.
- Português e Redação Jurídica 1 só tem AV1 no menu (ver item 2).

## Limitações
- Navegadores: Chromium cobriu os itens 1 a 5 e 7; Brave cobriu o item 6; Firefox não foi usado.
- Prova de ambiente dos navegadores por `/proc/<pid>/environ`: não obtida (negada nos processos filhos). Prova de `/dev` obtida.
- Contagem de 30 parágrafos da prosa do texto integral: não isolada.
- Capturas em `/var/tmp/qa-prod-av3/caps/` (47 arquivos), todas vistas, parte em montagens de 4 a 12 por imagem para caber no contexto (`/var/tmp/qa-prod-av3/montagens/`). Não são visões individuais de cada captura em tamanho real.

## Encerramento (L-13)
- HEAD no fim: `2cb70d2`. `git status --short` no fim: `?? mockups/selo-home.html` e `?? docs/qa-producao-av3.md` (este relatório).
- md5 da lista do `dist/` local no fim: `659fe1aefde20c59b0a129fb72f6931b`, igual ao início.
- Processos de QA sobrando: nenhum.
- Nada instalado, nada baixado para o repositório, nenhum commit, push ou deploy.
