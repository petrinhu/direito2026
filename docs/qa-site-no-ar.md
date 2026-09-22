# QA do site publicado (no ar), Caderno de Direito

Endereço auditado: https://direito2026.drpetrus.top. Pedido urgente do líder: confirmar se a página aparece vazia. Capturado com Chromium headless (mesma técnica das rodadas anteriores, perfil descartável, sem janela na sessão gráfica do líder, L-50), navegando direto na URL publicada, não em arquivo local.

## Resposta direta

**A página não está vazia: o conteúdo existe, carrega e aparece no DOM em todas as 4 rotas testadas, sem nenhum erro de console nem requisição falhada.** Mas a home, no tema claro, PARECE quase vazia: o título principal "Caderno de Direito" está com contraste medido de 1,09:1 (praticamente invisível, texto escuro sobre fundo escuro) e a primeira dobra tem bastante espaço em branco com só um cartão pequeno visível. É muito provável que seja isso que o líder viu.

## Metodologia (correção registrada, L-36)

O coletor de erros de console/rede da primeira rodada de captura deu zero eventos em tudo, o que era suspeito demais para confiar de olhos fechados. Testei sabotando de propósito (um `console.error` forçado e uma chamada de rede para domínio inexistente): a primeira versão do coletor não pegou nem um nem outro, porque ele só lia mensagens novas do socket e ignorava as que já tinham sido lidas e guardadas em buffer por outras chamadas anteriores (mesmo defeito já corrigido antes na rodada 2 dos mockups locais). Corrigi, sabotei de novo, confirmei que agora pega o erro de console e a falha de rede real, e só então refiz a coleta completa. O resultado de zero erros abaixo é depois desse conserto, não antes.

## Sondagem inicial (HTTP puro, sem JavaScript)

`curl` na raiz devolve HTTP 200 e 738 bytes: um esqueleto de aplicação de página única (`<div id="app"></div>` vazio, com `<script type="module" src="/assets/index-D6lvZflO.js">`). **Isso é o comportamento normal de um app Vite/Vue**: o HTML puro nunca tem conteúdo, o JavaScript é quem desenha a página no navegador. Se alguém olhar o código-fonte da página (Ctrl+U) ou usar uma ferramenta que só lê HTML sem rodar JavaScript, vê exatamente essa casca vazia. Isso por si só não prova que o site está quebrado.

Assets (`index-D6lvZflO.js`, `index-Cg5gYWh_.css`, `manifest.webmanifest`) responderam 200 na sondagem HTTP direta.

## Capturas

18 capturas em `mockups/capturas/no-ar/`: `home`, `unidade-resumo`, `unidade-peticao`, `unidade-quiz`, cada uma em claro/escuro × 1280/390px de largura (16), mais `home-segunda-visita-1280.png` (teste de recarregamento) e a rodada de sabotagem descartada em scratch, fora da entrega.

Conteúdo real medido por rota (comprimento de texto do `<body>`, prova de que não é DOM vazio): home 711 caracteres, resumo 103.266, petição comentada 24.590, quiz 2.672. Nenhuma rota tem o DOM vazio.

## Achados

### CRÍTICO: título da home ilegível no tema claro

Medido por amostra de pixel real na captura `home-claro-1280.png`: o `<h1>` "Caderno de Direito" está em `rgb(13,36,64)` = `#0d2440` (a cor de título, `--cor-titulo-texto` claro), sobre um fundo em degradê que na região do título mede entre `#102b4a` e `#14345a`. **Contraste calculado pela fórmula WCAG 2.2: 1,09:1 a 1,24:1** (mínimo exigido: 4,5:1 texto normal, 3:1 texto grande). No tema escuro o MESMO título usa `--cor-titulo-texto` escuro (`#7fa8d6`) sobre o mesmo tipo de fundo escuro, e aí o contraste é 5,02:1, aprovado. **Causa provável:** a seção "capa" da home tem fundo sempre escuro (degradê fixo, não muda com o tema), mas o título usa a variável de cor de texto que SEGUE o tema — no claro, essa variável vale uma cor escura pensada para fundo claro, e cai sobre um fundo que continua escuro. Visualmente, o título vira uma mancha quase da cor do fundo (confirmado na captura).

### Layout esparso na home (contribui para a sensação de "vazio")

`home-claro-1280.png` tem só 1118px de altura total (bem mais curta que as páginas de unidade, que passam de 5000px). A dobra mostra a barra lateral com os 10 períodos, o título quase invisível, e um único cartão pequeno ("Unidade 1: Resumo de estudo..."), com uma faixa grande de espaço em branco abaixo dele até o fim da página. Não há erro técnico aqui (é layout/conteúdo, não quebra), mas visualmente reforça a impressão de página vazia ou incompleta.

### Console e rede: sem erro em nenhuma das 16 combinações

Zero eventos de erro de console, zero exceção não tratada, zero aviso do navegador (`Log.entryAdded` do tipo erro), zero requisição com status 4xx/5xx, zero falha de carregamento, nas 4 rotas × 2 temas × 2 larguras. `encontrados=0 analisados=16 falharam=0`. Coletor comprovado por sabotagem antes de confiar no zero (ver seção de metodologia).

### Segunda visita e Service Worker: sem cache interferindo

`navigator.serviceWorker.getRegistrations()` devolve lista vazia, e `navigator.serviceWorker.controller` é `false` tanto na primeira quanto na segunda visita (depois de recarregar). **Não há Service Worker registrado neste deploy**, então cache de Service Worker não é a causa de nada que o líder viu — se o conteúdo parecer desatualizado, o motivo é outro (cache do CDN/Hostinger, cache do navegador do próprio líder, ou o problema de contraste acima).

### Sondagem HTTP adicional: catch-all serve 200 para qualquer caminho

Testado de propósito (`/assets/caminho-que-nao-existe.js` e uma rota inventada): o servidor devolve HTTP 200 com o HTML da aplicação para QUALQUER caminho, inclusive sob `/assets/`. Isso é típico de single-page app com reescrita total para `index.html`, mas significa que um asset genuinamente ausente não gera 404 de verdade — ele volta como HTML disfarçado de asset, o que pode gerar erro de "tipo MIME incorreto" no navegador se algum dia um asset real cair. Não é o problema desta vez (os assets atuais existem), mas é uma fragilidade a registrar.
