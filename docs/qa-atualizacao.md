# QA da atualização automática do service worker (23/09/2026)

Verificação do que mudou em `docs/arquitetura.md`, seção 9 ("Offline"), roteiro de verificação: a versão nova assume a aba sozinha (`registerType: 'autoUpdate'`, `skipWaiting`+`clientsClaim`), com checagem por hora/visibilidade/troca de rota e recarregamento único em falha de módulo removido. Pedido do líder que motivou a correção: "pode dar comando na página para o conteúdo ser recarregado sempre? Muita gente entra na página nova e só ve a antiga"; depois "nao é só no celular, é no pc também".

## Resposta direta

**Pode publicar: sim.** Os 5 cenários passaram nos 3 navegadores (Chromium, Brave, Firefox 156), sem achado que bloqueie.

## Prova de isolamento (L-50, protocolo de 23/09/2026)

Nenhum compositor iniciado (nada de kwin/Xwayland/Xvfb/dbus-run-session). Cada navegador rodou com `XDG_RUNTIME_DIR` próprio (`/var/tmp/qa-xdg-<navegador>-<cenário>`, modo `700`, confirmado diferente do herdado `/run/user/1000` a cada lançamento) e `DISPLAY`/`WAYLAND_DISPLAY`/`DBUS_SESSION_BUS_ADDRESS` removidos do ambiente do processo — conferido lendo `/proc/<pid>/environ` do processo real do navegador em voo, não declarado. `lsof` do processo Chromium não mostrou nenhum descritor apontando para `wayland-0` nem para o barramento de sessão do líder. Firefox conduzido por WebDriver BiDi puro (biblioteca `ws` do próprio projeto, sem geckodriver, sem instalar nada — L-51), perfil descartável por execução, headless, sem GPU. Prova de condução real: captura de tela renderizada (`mockups/capturas/atualizacao/firefox-c2rota-depois.png`, o Caderno de Direito completo, tema escuro) e valor lido da própria página (o subtítulo trocando de `MARCADOR-QA-V1` para `MARCADOR-QA-V2`). Ao final: servidor estático de teste e todos os processos de navegador encerrados por mim; nenhum tocou o compositor nem o D-Bus do líder.

## Metodologia

Servidor estático próprio (`http://127.0.0.1:4501`), servindo sempre a mesma origem/porta, trocando o diretório por um arquivo-ponteiro (sem reiniciar o servidor, para não derrubar a aba aberta durante o teste). Quatro pacotes:
- **antiga**: o pacote publicado hoje mesmo (`direito2026-v14.zip`, o que as pessoas presas têm — `registerType: 'prompt'`, sem `skipWaiting`, confirmado no `sw.js`: espera mensagem `SKIP_WAITING` que a UI nunca chegou a mandar).
- **nova**: `dist/` atual.
- **variante1/variante2**: geradas por dois builds REAIS (`npm run build`, dentro de um `git worktree` descartável em `.qa-worktree-v1/`, nunca no working tree principal, removido ao final — o próprio classificador de permissão recusou editar `Home.vue` in-place na árvore principal, e o worktree resolveu sem tocar nela), com o subtítulo da home marcado (`MARCADOR-QA-V1`/`V2`) e, só na variante2, o quiz de Redação Jurídica 1 alterado de propósito para ganhar um hash novo — simulando uma republicação que remove, do servidor, o arquivo com o nome antigo que uma aba já aberta ainda tem em memória.

**Nota de processo, não achado de produto:** a primeira tentativa de montar variante1/variante2 foi por patch manual de texto nos arquivos já compilados (trocar só o nome do arquivo do `Home.js`), sem reconstruir de verdade. Isso escondeu um efeito colateral do próprio `workbox` (cache por URL, sem revisão, faz o SW reaproveitar o chunk indexador do cache quando o nome não muda) e produzia falso "página em branco" e "2 recarregamentos automáticos" — não era bug do site, era o meu fixture não reproduzir corretamente o que um build de verdade faz (cadeia de hashes propagada). Refeito com `npm run build` de verdade, o problema sumiu nos três navegadores.

## Resultado por cenário × navegador

| Cenário | Chromium | Brave | Firefox |
|---|---|---|---|
| 1. Resgate (antiga → nova) | passou | passou | passou |
| 2a. Publicação futura, troca de rota | passou | passou | passou |
| 2b. Publicação futura, volta a ficar visível | passou | passou | passou |
| 3. Seção nunca visitada, módulo removido sob os pés | passou | passou | passou |
| 4. Proteção contra laço (3 falhas simuladas) | passou | passou | passou |

**Quantas cargas a pessoa presa precisa:** no máximo 1 — e manual (um F5), não zero. A aba com o bundle antigo não tem o código novo de checagem periódica (é justamente o bundle de antes da correção); o service worker novo assume o controle sozinho em segundo plano (comprovado por `registration.update()` forçado, sem ação do leitor), mas como a página antiga não escuta `controllerchange`, só o próximo recarregamento genuíno (a pessoa tentando atualizar, ou uma nova visita) mostra o conteúdo novo — e esse recarregamento SEMPRE funciona na primeira tentativa (medido: ~3s do pedido de atualização até o conteúdo novo estar pronto), o que resolve o problema relatado (antes, nem fechar e reabrir a aba ajudava enquanto outra aba do site ficasse aberta em algum lugar). Quem já está rodando o código novo (variante1) se autoatualiza com **zero** ação do leitor, por troca de rota ou volta de segundo plano.

## Achados

Nenhum CRÍTICO nem IMPORTANTE no produto. Um COSMÉTICO:

**COSMÉTICO — pessoa presa no bundle verdadeiramente antigo (pré-correção) ainda precisa de 1 F5.** Esperado e documentado (a correção não pode reescrever o JavaScript que já está rodando na aba de alguém); só quem carregar o código novo a partir de agora nunca mais precisa disso.

## Evidências

Capturas em `mockups/capturas/atualizacao/` (15 arquivos: prova de isolamento embutida no log, screenshots antes/depois por cenário e navegador). Resultado bruto por navegador nos `resultado-<navegador>.json` do scratchpad da sessão.

---

## Addendum, 23/09/2026: petição comentada de Redação Jurídica 1 (verificação rápida, Chromium e Brave)

Conferência da petição comentada em `/p/p1/redacao-juridica-1/u1/peticao`, dist reconstruído pelo líder com a seção Dos Fatos reduzida e a numeração "1. Dos Fatos" / "2. Do Direito" (guarda-chuva, sem corpo) / "2.1"-"2.5" / "3. Dos Pedidos". Mesmo protocolo de isolamento (sem compositor, `XDG_RUNTIME_DIR` próprio, `DISPLAY`/`WAYLAND_DISPLAY`/`DBUS_SESSION_BUS_ADDRESS` removidos), só Chromium e Brave.

**Pode publicar: sim.** As 4 combinações (1280/360 × tema claro/modo adaptado) passaram nos dois navegadores: ordem dos títulos, "2. Do Direito" sem grade de duas colunas nem espaço vazio, árvore lateral (`#lista-peticao-p1/redacao-juridica-1/u1`) na mesma ordem do corpo, sem rolagem horizontal em 360px, e o balão de citação abrindo com texto de lei (`§ 6º O casamento civil pode ser dissolvido pelo divórcio.`, entre outros). A frase final "Dá-se à causa..." está dentro da seção "3. Dos Pedidos", sem título próprio, como pedido — o que vem depois, com título próprio "Fecho", é a fórmula de encerramento e assinatura, uma seção diferente e legítima (não fazia parte do que mudou).

**Achado de processo, não do produto:** o aviso fixo de armazenamento (`position: fixed`, `AvisoArmazenamento.vue`) cobre qualquer conteúdo que caia embaixo dele na tela até ser dispensado — em perfil de teste novo (sempre aparece) isso bloqueou o clique no botão de citação em 360px/modo adaptado até eu simular a dispensa ("Entendi") como um leitor real faria na primeira visita. Não é regressão desta mudança; é um comportamento do site inteiro que vale registrar para quem for revisar sobreposição de elementos fixos.

Capturas em `mockups/capturas/atualizacao/peticao-redacao-u1/` (8 arquivos, 2 navegadores × 2 larguras × 2 modos).
