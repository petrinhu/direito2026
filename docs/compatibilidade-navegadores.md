# Compatibilidade entre navegadores

Guia de compatibilidade para o site estático de estudos jurídicos (Vite + Vue 3 + TypeScript, build local, hospedagem compartilhada Hostinger/Apache, sem backend). Pesquisado em 21/09/2026. Sempre que uma data está entre parênteses ao lado de um dado, é a data em que a fonte foi consultada ou publicada; sem data, o dado vem de status "Baseline amplamente disponível" já estável há anos e sem controvérsia entre as fontes consultadas.

## 1. Alvo de suporte declarado

Ordem do líder: compatibilidade com Chrome, Firefox, Safari e Edge, computador e celular, incluindo Safari no iPhone/iPad e o iOS em geral.

**Fato relevante sobre iOS:** todo navegador no iOS usa o motor WebKit por baixo, mesmo quando se chama Chrome, Firefox ou Edge. A União Europeia obrigou a Apple, via Digital Markets Act, a permitir motores alternativos (BrowserEngineKit, desde iOS 17.4/18.2), mas quinze meses depois do prazo de conformidade nenhum fabricante de navegador havia lançado um motor alternativo em produção no iOS; a Apple também tentou remover o PWA "Adicionar à Tela de Início" na UE em 2024 e recuou após reação de desenvolvedores e reguladores. Conclusão prática: testar no Safari (desktop e iOS) cobre, hoje, todo o tráfego do iOS, independente do nome do navegador que o usuário instalou. (Open Web Advocacy, blog, consultado 21/09/2026; developer.apple.com/support/dma-and-apps-in-the-eu/)

**Consulta de browserslist recomendada**, escrita para bater literalmente com "as quatro últimas versões" de cada navegador pedido pelo líder, em vez de usar o atalho `last 4 versions` (que no browserslist cobre TODOS os navegadores rastreados, não só os quatro pedidos):

```
last 4 Chrome versions
last 4 ChromeAndroid versions
last 4 Firefox versions
last 4 FirefoxAndroid versions
last 4 Edge versions
last 4 Safari versions
last 4 iOS versions
not dead
```

Justificativa dos dados de uso: essa é a leitura literal da ordem do líder (últimas 4 versões de cada navegador nomeado, computador e celular). É mais permissiva que o padrão "Baseline Widely Available" que o Vite 7 usa por default a partir de 2026 (`chrome111, edge111, firefox114, safari16.4`, fixado em 2026-01-01 e definido como piso de 30 meses de defasagem): ou seja, a consulta acima aceita recursos mais recentes do que o piso do Vite, e por isso a Seção 6 detalha o que fazer com o que "last 4 versions" aceita mas ainda não é amplamente suportado. Como o Safari lança poucas versões maiores por ano (a numeração pulou de 18 para 26 em 2025 para acompanhar o ano do macOS), "últimas 4 versões" do Safari pode cobrir uma janela de tempo mais longa que "últimas 4 versões" do Chrome (que lança a cada 4 semanas); isso é esperado e não é erro de configuração. (web.dev/blog/browserslist-supports-baseline, vite.dev/config/build-options, consultado 21/09/2026)

A resolução exata dos números de versão muda a cada semana (dado de uso do caniuse-lite é atualizado continuamente); o implementador deve rodar `npx browserslist` dentro do projeto, depois de instalado, para ver a lista resolvida no momento do build: não fixar números de cabeça aqui.

## 2. Matriz de recursos

Legenda: **BA** = Baseline amplamente disponível (suportado nos quatro alvos há tempo suficiente para uso direto sem fallback). **Parcial** = suportado com ressalva relevante para este site. **Atrás** = pelo menos um dos quatro navegadores-alvo ainda não suporta em versão estável.

| Recurso | Chrome | Firefox | Safari | Edge | Verificado em | Fonte |
|---|---|---|---|---|---|---|
| CSS nesting nativo | 120+ | 117+ | 17.2+ | 112+/acompanha Chrome | 21/09/2026 | [caniuse.com/css-nesting](https://caniuse.com/css-nesting) |
| Container queries (size) | 106+ | 110+ | 16.0+ | 106+ | 21/09/2026 | [caniuse.com/css-container-queries](https://caniuse.com/css-container-queries) |
| `:has()` | 105+ | 121+ | 15.4+ | 105+ | 21/09/2026 | [caniuse.com/css-has](https://caniuse.com/css-has) |
| Subgrid | 117+ | 71+ | 16.0+ | 117+ | 21/09/2026 | [caniuse.com/css-subgrid](https://caniuse.com/css-subgrid) |
| View Transitions, mesma página (SPA) | 111+ | não suportado | 18.0+ (parcial) | 111+ | 21/09/2026 | MDN View Transition API |
| View Transitions, entre páginas (MPA) | 126+ | não suportado em release estável | 18.2+ | 126+ | 21/09/2026 | css-tricks.com, testmuai.com |
| Scroll-driven animations (CSS puro) | 115+ | atrás de flag (`layout.css.scroll-driven-animations.enabled`), meta Interop 2026 | 26 (set/2025)+ | 115+ | 21/09/2026 | frontendhorizon.com, buildmvpfast.com |
| Anchor positioning | 125+ | 147+ (13/01/2026) | núcleo (`anchor-name`, `position-anchor`, `anchor()`) desde 18.x; `@position-try` completo mais recente | 125+ | 21/09/2026 | oddbird.net, testmuai.com |
| `popover` (HTML/API) | 114+ | 125+ | 17.0+ | 114+ | 21/09/2026 | [caniuse.com](https://caniuse.com/mdn-api_htmlelement_popover) |
| `<dialog>` (`showModal`, `::backdrop`) | BA desde mar/2022 | BA | BA | BA | 21/09/2026 | MDN, ~96% de uso global |
| `<details name="...">` | BA desde set/2024 | BA | BA | BA | 21/09/2026 | MDN HTMLDetailsElement.name |
| `text-wrap: balance` | 114+ | 121+ | 17.5+ | 114+ | 21/09/2026 | logrocket.com, savvy.co.il |
| `text-wrap: pretty` | 117+ | **não suportado** (ainda em 2026) | 26+ | 117+ | 21/09/2026 | webkit.org/blog/16547 |
| `color-mix()` e espaços de cor modernos (OKLCH, Display P3) | 111+ | 113+ | 16.2+ | 111+ | 21/09/2026 | Chrome for Developers, colorpick.app |
| `aspect-ratio` | BA | BA | BA (15+) | BA | conhecimento estável | MDN |
| `gap` em flexbox | BA | BA | BA (14.1+) | BA | conhecimento estável | MDN |
| `position: sticky` | BA | BA | BA (13+) | BA | conhecimento estável | MDN |
| `backdrop-filter` (sem prefixo) | 76+ | 103+ | precisa `-webkit-backdrop-filter` até a v17; sem prefixo desde a v18 | 79+ | 21/09/2026 | testmuai.com, MDN |
| `scrollbar-gutter` | 94+ | 97+ | **18.2+ somente** (antes: não suportado) | 94+ | 21/09/2026 | [caniuse.com](https://caniuse.com/mdn-css_properties_scrollbar-gutter) |
| `content-visibility` | 85+ | 125+ (versões 109 a 124 vinham desativadas por padrão) | 18.0+ | 85+ | 21/09/2026 | [caniuse.com](https://caniuse.com/css-content-visibility) |
| `font-display` | BA | BA | BA (11.1+) | BA | conhecimento estável | MDN |
| `@font-face { size-adjust }` | 92+ | 92+ | **17.0+ somente** | 92+ | 21/09/2026 | [caniuse.com](https://caniuse.com/mdn-css_at-rules_font-face_size-adjust) |
| `@property` (custom properties tipadas) | 85+ | 128+ (último a chegar) | 16.4+ | 85+ | 21/09/2026 | dev.to, MDN |
| `prefers-reduced-motion` | BA | BA | BA (10.1+) | BA | conhecimento estável | MDN |
| `prefers-color-scheme` | BA | BA | BA (12.1+) | BA | conhecimento estável | MDN |
| `forced-colors` (media query) | BA | BA | **não suportado** (macOS/iOS não têm modo de cores forçadas; Apple usa "Aumentar Contraste") | BA | 21/09/2026 | smashingmagazine.com, MDN |
| Unidades de viewport dinâmicas `dvh`/`svh` | 108+ | 101+ | 15.4+ | 108+ | 21/09/2026 | testmuai.com, ishadeed.com |
| `env(safe-area-inset-*)` | BA | BA | BA (11.2+, notch do iPhone X) | BA | conhecimento estável | webkit.org |
| `overscroll-behavior` | 65+ | 59+ | **16.0+ somente** (antes disso, desativado por padrão desde 14.1) | 79+ | 21/09/2026 | [caniuse.com](https://caniuse.com/css-overscroll-behavior) |
| Service Worker + Cache API | BA | BA | BA, com limite de armazenamento próprio (ver seção 3) | BA | conhecimento estável + seção 3 | MDN, WebKit |
| Web App Manifest / instalação no iOS | BA (instalável) | BA | somente via "Adicionar à Tela de Início", sem prompt automático `beforeinstallprompt` | BA | 21/09/2026 | mobiloud.com, magicbell.com |
| `localStorage` | BA | BA | BA, com comportamento especial em modo privado (ver seção 3) | BA | conhecimento estável + seção 3 | MDN |
| `IndexedDB` | 24+ | 10+ | 8+ | 12+ | 21/09/2026 | [caniuse.com](https://caniuse.com/mdn-api_indexeddb) |
| `Intl` (formatação de data/número) | BA | BA | BA | BA | conhecimento estável | MDN |
| `Element.scrollIntoView({behavior:"smooth"})` | BA | BA | Safari desktop moderno: BA; **iOS Safari ignorava `smooth` antes da v16 e pulava direto** | BA | 21/09/2026 | testmuai.com |
| `IntersectionObserver` | BA | BA | BA (12.1+) | BA | conhecimento estável | MDN |
| `ResizeObserver` | BA | BA | BA (13.1+) | BA | conhecimento estável | MDN |
| `requestIdleCallback` | BA | BA | **não suportado em produção**; existe atrás de feature flag experimental (Develop > Feature Flags no macOS, Ajustes > Safari > Avançado no iOS) | BA | 21/09/2026 | testmuai.com |
| Navigation API | 102+ | 147+ (jan/2026) | 26.2+ | 102+ | 21/09/2026 | infoq.com/news/2026/05 |
| `matchMedia().addEventListener` | BA | BA | BA (14+; antes exigia `addListener`) | BA | conhecimento estável | MDN |
| `inert` (atributo HTML) | 102+ | 112+ | 15.5+ | 102+ | 21/09/2026 (corrige achado inicial de busca que dizia "só Chromium"; conferido direto no caniuse) | [caniuse.com](https://caniuse.com/mdn-html_global_attributes_inert) |
| `:focus-visible` | BA | BA | BA (15.4+) | BA | conhecimento estável | MDN |
| `scroll-margin-top` (compensar cabeçalho fixo) | BA | BA | BA (14.1+) | BA | conhecimento estável | MDN |

## 3. Armadilhas do Safari e do WebKit

Todas as armadilhas abaixo se aplicam igualmente a "Chrome no iPhone" e "Firefox no iPhone", porque todos rodam WebKit ali (ver seção 1).

1. **Altura de viewport com a barra do navegador (100vh e teclado).** `height: 100vh` conta a tela cheia, não o espaço visível descontada a barra de endereço/teclado; ao focar um campo, a barra some e o layout "pula". Em iOS 26 há um bug documentado onde, ao fechar o teclado, `visualViewport.offsetTop` não volta a 0, deixando cabeçalho/rodapé fixos desalinhados. **Correção:** usar `dvh` (ou `svh` como fallback mais estável quando `dvh` oscilar) em vez de `vh` para telas cheias, e nunca depender só de `position: fixed` colado no topo/rodapé em telas com campo de formulário; ouvir `visualViewport.resize`/`scroll` quando o header precisar reagir ao teclado. (iifx.dev, ishadeed.com, 21/09/2026)

2. **Rolagem com momento e `position: fixed`.** Historicamente o Safari precisava de `-webkit-overflow-scrolling: touch` para rolagem suave em contêineres com `overflow: auto`; hoje isso é comportamento padrão, mas `position: fixed` dentro de um contêiner que rola ainda é uma fonte comum de bug visual no iOS (o elemento "treme" ou descola durante o momentum scroll). **Correção:** preferir `position: sticky` a `position: fixed` sempre que o elemento pertencer ao fluxo de rolagem de uma seção (por exemplo, o índice lateral fixo da página de conteúdo longo), e reservar `fixed` só para overlays de tela inteira.

3. **Zoom automático em campo de formulário com fonte menor que 16px.** O iOS Safari amplia a página ao focar um `<input>`/`<textarea>` cujo tamanho de fonte renderizado é menor que 16px; ele só deixa de fazer isso quando o tamanho renderizado é 16px ou mais. Isso afeta a busca do site (campo de busca) e qualquer campo de formulário futuro. **Correção:** todo campo de texto usa `font-size: 16px` (ou maior) no breakpoint mobile, nunca menor, mesmo que o design peça um campo compacto (compensar com padding/altura, não com fonte menor). (weblog.west-wind.com, 21/09/2026)

4. **Atraso de toque e feedback visual em alvos de toque.** Elementos interativos exibem um flash cinza translúcido padrão do WebKit ao toque, que quebra design customizado. **Correção:** `-webkit-tap-highlight-color: transparent` combinado com um estado `:active` desenhado explicitamente (para não perder o feedback de toque, só trocar o padrão do sistema pelo do site); garantir alvo de toque mínimo de 44x44px (recomendação de acessibilidade da própria Apple), relevante para o menu de três níveis e para as abas da página de conteúdo.

5. **Service Worker e limite de armazenamento (ITP de 7 dias).** O Safari aplica uma regra de inatividade de 7 dias a todo armazenamento gravável por script sem interação do usuário no site (localStorage, IndexedDB, sessionStorage, registro do Service Worker e o próprio Cache API do Service Worker); passado esse prazo sem uso, tudo é apagado, inclusive cookies de primeira parte. A Cache API no iOS também tem uma cota relativamente pequena (em torno de 50MB) comparada a outros navegadores. **Exceção importante:** um site "Adicionado à Tela de Início" (o comportamento mais próximo de PWA instalado no iOS) fica fora dessa regra de 7 dias, segundo a própria documentação da WebKit. **Correção para este site:** o quiz de 60 perguntas e a busca offline precisam re-popular o cache a cada abertura relevante (não assumir que o Service Worker sobrevive a duas semanas de inatividade do estudante), e vale incentivar o "Adicionar à Tela de Início" explicitamente na home para quem quiser persistência confiável. (support.didomi.io, developer.apple.com/forums/thread/710157, 21/09/2026)

6. **`localStorage` em modo privado.** Em modo privado, o Safari reduz a cota efetiva a zero; qualquer escrita lança `QuotaExceededError` (esse é o comportamento das versões atuais: em versões muito antigas do Safari a escrita falhava silenciosamente, o que já não é o caso hoje). **Correção:** todo uso de `localStorage` (estado salvo do quiz, preferência de tema) precisa de `try/catch` ao redor da escrita, com um estado em memória como fallback para a sessão corrente quando a escrita falhar; nunca supor que a escrita teve sucesso só porque não lançou erro em outros navegadores. (mattburke.dev, mspk.substack.com, 21/09/2026)

7. **Áudio e autoplay.** O Safari (desktop e iOS) bloqueia autoplay de vídeo/áudio com som; autoplay mudo é permitido. Relevante para a animação de canvas na primeira dobra: se ela algum dia ganhar som, vai precisar de gesto do usuário; como só é visual, não é afetada, mas qualquer áudio futuro (ex.: efeito sonoro do quiz) precisa nascer com `muted` e ser desmutado só após interação. (bitmovin.com, 21/09/2026)

8. **Canvas com muitos pixels e consumo de bateria.** O iOS Safari historicamente limitava a memória total de canvas por página (a marca de 384MB em versões mais antigas do iOS 15 é a mais citada; o limite varia por versão de iOS e por aparelho, e não há um número único confiável para "hoje"). Uma animação de canvas rodando continuamente na primeira dobra consome bateria mesmo fora da viewport se não for pausada. **Correção:** a animação de fundo deve (a) já nascer desligada quando `prefers-reduced-motion: reduce` estiver ativo, como já é requisito do projeto, (b) usar `IntersectionObserver` para pausar `requestAnimationFrame` quando a primeira dobra sair da viewport (rolagem para baixo), e (c) manter a resolução do canvas em `devicePixelRatio` limitado (não usar o pixel ratio bruto de um iPhone Pro sem teto), para não aproximar o limite de memória de canvas do WebKit. (canvasjs.com/forums, pqina.nl, 21/09/2026)

9. **Impressão pelo Safari.** O Safari tem bugs documentados e antigos de posicionamento em impressão (elemento que deveria ficar no fim da página aparece no início do PDF) e falta de suporte à regra `@page` em algumas versões. **Correção:** a folha de estilo de impressão do site não deve depender de posicionamento absoluto/fixo perto das quebras de página; testar a impressão de uma página de conteúdo longo especificamente no Safari antes de fechar essa entrega, e preferir fluxo normal de documento com `break-inside: avoid` nos blocos que não podem partir.

10. **Renderização de fonte.** O WebKit tende a aplicar hinting e suavização diferentes do Chromium/Firefox, deixando o mesmo peso de fonte com aparência ligeiramente diferente (mais fina ou mais grossa conforme o peso disponível no arquivo woff2). Como as fontes deste site são hospedadas localmente e recortadas, vale conferir visualmente os pesos usados (regular, negrito) no Safari real antes de fechar a tipografia, em vez de confiar só no preview do Chrome.

## 4. Diferenças do Firefox

1. **Barra de rolagem.** O Firefox não implementa `::-webkit-scrollbar` (ele ignora as regras, não lança erro, mas também não aplica); usa as propriedades padronizadas `scrollbar-width` e `scrollbar-color`. **Correção:** estilizar a barra de rolagem com as duas sintaxes lado a lado: `scrollbar-width`/`scrollbar-color` para Firefox, `::-webkit-scrollbar*` para os demais: e, quando fizer sentido, envolver a versão WebKit em `@supports selector(::-webkit-scrollbar)` para não vazar estilo pensado para um motor no outro.

2. **Renderização de fonte.** Texto em negrito pode parecer mais fino, e títulos mais finos, quando comparado a Chrome/Safari/Edge, especialmente se o peso exato solicitado não estiver disponível no arquivo de fonte (o Firefox sintetiza um "negrito falso" nesse caso, com aparência diferente dos outros motores). **Correção:** garantir que os woff2 hospedados localmente incluam de fato os pesos usados no CSS (400, 600, 700, o que for usado), em vez de declarar `font-weight: 700` e deixar o navegador inventar o negrito.

3. **Impressão e animações.** O Firefox tende a ser mais conservador com a folha de impressão (aplica `background` só com opção explícita do usuário na caixa de diálogo de impressão) e, em 2026, ainda mantém as animações orientadas a rolagem (scroll-driven animations) atrás de flag em release estável, ao contrário de Chrome/Edge/Safari (ver matriz, seção 2). **Correção:** qualquer animação de rolagem decorativa precisa de fallback sem `@supports (animation-timeline: scroll())` funcionando, ou seja, o conteúdo tem que ficar visível e utilizável sem a animação, já que o Firefox pode simplesmente não a aplicar.

## 5. Diferenças do Edge

O Edge atual roda sobre o mesmo motor Blink do Chrome, então a divergência de renderização entre os dois é mínima; o que diverge são recursos do próprio navegador que interferem na página:

1. **Leitor Imersivo (Immersive Reader).** Reescreve o layout da página (remove navegação, mantém só o texto principal) quando o usuário aciona o recurso em páginas de artigo. Como a página de conteúdo longo deste site tem índice lateral, barra de progresso e abas, o Leitor Imersivo do Edge pode simplificar demais e esconder essa estrutura; isso é decisão do usuário (ele que ativa) e não algo a bloquear, mas vale marcar a estrutura semântica (heading correto, `<main>`, `<article>`) para que, se o leitor entrar em ação, o conteúdo principal seja reconhecido corretamente. (positioniseverything.net, 21/09/2026)

2. **Tradutor integrado.** Pode reescrever texto da página via DOM, o que interage mal com componentes que dependem de comparar o texto de um nó (ex.: busca client-side comparando string exata). Não é um problema previsível para evitar de antemão; é um motivo a mais para a busca operar sobre um índice gerado no build, não sobre o texto renderizado na tela.

3. **Autopreenchimento.** O autopreenchimento do Edge (endereço, cartão, senha) é mais agressivo visualmente que o do Chrome em alguns campos, o que pode colidir com campos customizados do quiz se algum deles for reconhecido erroneamente como campo de formulário sensível. **Correção:** usar `autocomplete="off"` explicitamente nos campos do quiz que não são dados pessoais, e conferir visualmente o preenchimento automático no Edge antes de fechar essa tela.

4. **Modo de alto contraste do Windows (Forced Colors Mode).** O Edge (como o Chrome e o Firefox) suporta a media query `forced-colors: active`, que o Safari não suporta (ver matriz, seção 2). O Edge removeu de vez o suporte à sintaxe antiga não padronizada `-ms-high-contrast` a partir da versão 138, adotando só a versão padronizada. **Correção:** usar `forced-colors` e `forced-color-adjust` (padrão), nunca `-ms-high-contrast` (removido); testar o tema escuro/claro do site com o Alto Contraste do Windows ativado especificamente no Edge, já que é o navegador mais usado nesse modo. (blogs.windows.com/msedgedev, 30/06/2025)

## 6. Estratégia de compatibilização

Ordem de preferência, do mais barato ao mais caro:

1. **Aprimoramento progressivo com `@supports`.** Todo recurso "Atrás" ou "Parcial" na matriz da seção 2 (scroll-driven animations, anchor positioning completo, `text-wrap: pretty`, `overscroll-behavior` antes do Safari 16, `requestIdleCallback`) entra envolto em `@supports (propriedade: valor)` no CSS ou em checagem de recurso (`"requestIdleCallback" in window`) no JavaScript, com um estado visualmente aceitável quando a checagem falhar. Isso cobre a maior parte deste projeto porque quase tudo que ele usa é decoração/conforto (animação, transição, popover), não funcionalidade essencial.
2. **Fallback em CSS puro.** Onde `@supports` não é suficiente (por exemplo, `dvh` com fallback para `vh`, ou `gap` com fallback de margem em navegador hipoteticamente muito antigo que não faz parte do alvo declarado), declarar a propriedade duas vezes na mesma regra: primeiro o valor de fallback, depois o valor moderno: CSS ignora a declaração que não reconhece e mantém a última válida.
3. **Polyfill só quando indispensável.** Nenhum dos recursos desta lista exige polyfill hoje dentro do alvo de "últimas 4 versões" declarado (Seção 1), exceto `requestIdleCallback`, que precisa de um polyfill leve baseado em `setTimeout` para cobrir Safari (todas as versões, desktop e iOS) enquanto ele não sair da flag experimental. Não vale a pena carregar um polyfill de CSS (por exemplo, para `:has()` ou container queries) porque os quatro navegadores-alvo já suportam nativamente há mais de um ano.
4. **O que não vale a pena suportar:** navegadores fora dos quatro pedidos (não há orçamento de engenharia para Opera, Samsung Internet ou navegadores legados); Safari abaixo de aproximadamente 16 (perde `dvh`/`svh` de forma confiável, container queries, `:has()` com ressalvas e `overscroll-behavior`); qualquer navegador sem suporte a ES2020+ nativo (o próprio Vite já não gera build para esse público sem configuração extra, ver seção 7); e o modo de alto contraste do Windows dentro do próprio Safari, porque o Safari não implementa o recurso (a alternativa correta é seguir `prefers-contrast`, que o WebKit suporta, como complemento, não substituto, do que o Edge/Chrome/Firefox fazem com `forced-colors`).

**O que o Vite e o browserslist resolvem sozinhos:** transpilação de sintaxe JavaScript moderna para o alvo declarado (`esbuild`/`rollup` via `build.target`), prefixos e fallbacks de CSS quando o processador de CSS estiver configurado com o browserslist do projeto (ver seção 7), divisão de bundle e minificação. **O que eles não resolvem:** nada relacionado a comportamento de runtime específico de motor (as armadilhas das seções 3 a 5), nada relacionado a polyfill de API JavaScript nova (Navigation API, `requestIdleCallback`), e nada relacionado a limite de armazenamento ou política de autoplay: essas são decisões de código que o implementador precisa tomar deliberadamente.

## 7. Configuração concreta

### `.browserslistrc` (raiz do projeto)

```
last 4 Chrome versions
last 4 ChromeAndroid versions
last 4 Firefox versions
last 4 FirefoxAndroid versions
last 4 Edge versions
last 4 Safari versions
last 4 iOS versions
not dead
```

### Vite

```ts
// vite.config.ts
export default defineConfig({
  build: {
    // Vite 7 lê o .browserslistrc automaticamente quando presente;
    // manter explícito documenta a intenção e evita depender de
    // detecção implícita numa auditoria futura.
    target: 'esnext', // o alvo real de sintaxe vem do browserslist acima
    cssTarget: undefined // deixa o processador de CSS decidir (ver abaixo)
  },
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      // Lightning CSS lê o browserslist do projeto por padrão;
      // "drafts" habilita recursos ainda em rascunho da spec só se pedido explicitamente
    }
  }
})
```

### Lightning CSS ou autoprefixer: recomendação e por quê

**Recomendação: Lightning CSS**, nativo do Vite desde a versão 4/5 e integrado de forma mais profunda a partir do Vite 6/7. Motivos: é escrito em Rust e substitui de uma vez autoprefixer, `postcss-preset-env` e a minificação de CSS, é relatado como cerca de 100 vezes mais rápido que a cadeia PostCSS equivalente, e lê o mesmo `.browserslistrc` do projeto sem configuração adicional. Como este site é 100% Vite (sem necessidade de um plugin PostCSS específico que só exista para o ecossistema Tailwind ou similar), não há motivo para carregar a cadeia PostCSS/autoprefixer só por hábito. **Quando usar PostCSS/autoprefixer em vez disso:** se em algum momento o projeto adotar um plugin de CSS que só existe como plugin PostCSS (não há previsão disso hoje), ou se precisar de uma transformação muito específica de sintaxe rascunho que o Lightning CSS ainda não cobre; nesse caso, isolar o PostCSS só para esse plugin específico, mantendo Lightning CSS para o resto. (evilmartians.com/chronicles, pkgpulse.com, vite.dev, consultado 21/09/2026)

## 8. Plano de teste de compatibilidade nesta realidade

Restrições desta máquina (Linux, Fedora): proibido instalar navegador novo (L-57 e L-51 do orquestrador) e proibido automatizar janela/foco/entrada na sessão viva (L-50). O plano abaixo respeita as duas.

**O que dá para verificar em Linux sem instalar navegador novo:**
- Chrome e Edge: ambos existem como build headless/remoto via DevTools Protocol; qualquer checagem automatizada de layout, console e rede nesses dois motores pode rodar sem instalar nada além do que já existe na máquina, desde que isolada do desktop do líder (compositor aninhado, nunca a sessão gráfica viva, conforme regra desta máquina).
- Firefox: o Firefox nativo do Linux já cobre boa parte da verificação de motor Gecko (o Firefox para Windows/macOS renderiza de forma equivalente na imensa maioria dos casos relevantes para este site; a diferença de plataforma que mais importa aqui, fonte do sistema, já é neutralizada porque o site hospeda a própria fonte).
- Lighthouse/axe/ferramentas de auditoria automatizada rodam sobre Chrome/Edge headless e cobrem parte de performance e acessibilidade, mas nada disso substitui a verificação visual no motor WebKit.

**O que exige aparelho real com iOS:** absolutamente tudo que envolve Safari/WebKit: não existe Safari para Linux, e simuladores de iOS não rodam fora de macOS com Xcode. Isso cobre as dez armadilhas da seção 3 por inteiro: altura de viewport dinâmica, zoom de campo de formulário, ITP de 7 dias, `localStorage` em modo privado, autoplay, memória de canvas, impressão e renderização de fonte. Sem um iPhone/iPad físico (ou acesso a um Mac com Safari, que cobre a metade desktop mas não a metade iOS específica de toque/teclado/viewport), essa parte da matriz fica sem verificação visual real, só com o dado de compatibilidade documentado nesta pesquisa.

**O que pode ser coberto por serviço remoto:** serviços de nuvem para teste cross-browser (BrowserStack, LambdaTest e equivalentes) dão acesso a Safari real em iOS físico ou simulado sem precisar do hardware da Apple; é a forma recomendada de fechar a lacuna acima sem comprar um aparelho, mas é uma decisão de custo/ferramenta externa que cabe ao líder aprovar antes de contratar (ver L-01/L-51 do orquestrador: nenhuma instalação ou assinatura de serviço externo sem autorização explícita).

**Lista de verificação manual curta por navegador**, a rodar em cada tela do site (home, menu de três níveis, página de conteúdo longo, quiz, busca, tema claro/escuro):

- *Chrome/Edge desktop e Android:* menu de três níveis navega por teclado (Tab, setas, Esc); troca de tema persiste depois de recarregar; quiz mantém progresso ao fechar e reabrir a aba; impressão da página de conteúdo produz PDF legível sem cortar o índice lateral por cima do texto.
- *Firefox desktop e Android:* barra de rolagem customizada aparece corretamente (não a padrão do sistema, mas também não quebrada); peso de fonte negrito não parece "fake bold"; animação de rolagem (se usada) tem fallback aceitável já que pode estar atrás de flag; impressão respeita `prefers-color-scheme` do usuário sem forçar fundo escuro no papel.
- *Safari macOS:* `:has()`, container queries e subgrid renderizam o layout do menu e do índice lateral como esperado; `backdrop-filter` aparece sem serrilhado atrás de modais/popover; impressão não desloca elementos para o topo da página.
- *Safari iOS (iPhone e iPad, obrigatório em aparelho real):* focar o campo de busca não dá zoom; girar o aparelho e abrir o teclado não quebra o cabeçalho fixo; fechar a aba e reabrir depois de mais de sete dias sem visitar (ou logo após "Adicionar à Tela de Início") ainda mostra o progresso do quiz salvo; rolar a primeira dobra da home com a animação de canvas ativa não esquenta o aparelho nem trava a rolagem; com "Reduzir Movimento" ativado nos Ajustes de Acessibilidade, a animação de fundo não aparece.
- *Edge desktop, especificamente:* ativar o Alto Contraste do Windows e conferir que texto e botões continuam legíveis (`forced-colors`); ativar o Leitor Imersivo numa página de conteúdo longo e conferir que o texto principal é reconhecido.

## 9. Regras de codificação para o implementador

- Todo campo de texto usa `font-size` mínimo de 16px em telas mobile, sempre: evita o zoom automático do iOS Safari (armadilha 3, seção 3).
- Toda animação (canvas de fundo, transições, scroll-driven) nasce condicionada a `prefers-reduced-motion: reduce`, checada antes de iniciar, não só via CSS de transição: porque parte dos recursos de animação (scroll-driven) ainda não é universal e o fallback estático já precisa existir de qualquer forma.
- Toda altura de tela cheia usa `dvh` com fallback declarado em `vh` antes dela na mesma regra: nunca `vh` sozinho para telas que dependem de altura total (menu mobile, modal de resultado do quiz).
- Toda escrita em `localStorage` fica dentro de `try/catch`, com um estado em memória como plano B para a sessão corrente: o Safari em modo privado lança `QuotaExceededError` de forma silenciosa aos olhos de quem não está tratando o erro (armadilha 6, seção 3).
- O Service Worker deve re-verificar e re-popular seu cache a cada abertura do site, nunca supor que o cache de uma visita antiga ainda existe: o Safari pode ter apagado tudo depois de sete dias de inatividade fora da tela de início (armadilha 5, seção 3).
- Toda barra de rolagem customizada declara as duas sintaxes lado a lado (`scrollbar-width`/`scrollbar-color` e `::-webkit-scrollbar*`): o Firefox ignora a segunda sem avisar (seção 4).
- Todo recurso CSS fora do "Baseline amplamente disponível" da matriz (seção 2) entra atrás de `@supports`, com o estado sem esse recurso testado visualmente, não só assumido como "vai ficar razoável": vale especialmente para `overscroll-behavior`, anchor positioning completo e `text-wrap: pretty`.
- Nenhuma dependência de `requestIdleCallback` sem fallback de `setTimeout`: o Safari não suporta em produção (armadilha da matriz, seção 2).
- Todo alvo de toque (botão do menu, item do quiz, controle da abas) mede pelo menos 44x44px: reduz o efeito do atraso/flash de toque do WebKit e segue a recomendação de acessibilidade da própria Apple (armadilha 4, seção 3).
- A busca no conteúdo compara sempre contra o índice gerado no build, nunca contra o texto renderizado na tela: protege contra reescrita de DOM por tradutor/leitor integrado de Edge e Safari (seção 5) e é mais rápido de qualquer forma.
- A folha de impressão evita `position: fixed`/`absolute` perto de quebras de página e usa `break-inside: avoid` nos blocos que não podem partir: o Safari historicamente desloca elementos posicionados na impressão (armadilha 9, seção 3).
- Nenhum áudio ou vídeo futuro nasce com som ligado por padrão: Safari bloqueia autoplay com som (armadilha 7, seção 3).
- O canvas de fundo da home pausa via `IntersectionObserver` quando sai da viewport e respeita um teto de `devicePixelRatio`: protege contra o limite de memória de canvas do WebKit em iOS (armadilha 8, seção 3).

## 10. Fontes consultadas

- [caniuse.com/css-nesting](https://caniuse.com/css-nesting) (21/09/2026)
- [caniuse.com/css-container-queries](https://caniuse.com/css-container-queries) (21/09/2026)
- [caniuse.com/css-has](https://caniuse.com/css-has) (21/09/2026)
- [caniuse.com/css-subgrid](https://caniuse.com/css-subgrid) (21/09/2026)
- [css-tricks.com: Cross-Document View Transitions](https://css-tricks.com/cross-document-view-transitions-part-1/) (2026)
- [testmuai.com: View Transitions API browser support](https://www.testmuai.com/learning-hub/view-transitions-api-browser-support/) (2026)
- [frontendhorizon.com: View Transitions API and CSS Scroll-Driven Animations](https://www.frontendhorizon.com/blog/view-transitions-api-and-css-scroll-driven-animations-the-browser-wins-of-2026) (2026)
- [buildmvpfast.com: CSS Scroll-Driven Animations](https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026) (2026)
- [oddbird.net: Anchor Positioning Updates for Fall 2025](https://www.oddbird.net/2025/10/13/anchor-position-area-update/) (13/10/2025)
- [testmuai.com: CSS Anchor Positioning browser support](https://www.testmuai.com/learning-hub/css-anchor-positioning-browser-support/) (2026)
- [caniuse.com: popover HTMLElement API](https://caniuse.com/mdn-api_htmlelement_popover) (21/09/2026)
- [MDN: HTMLDetailsElement.name](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDetailsElement/name) (2026)
- [MDN: dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) (2026)
- [webkit.org/blog/16547: Better typography with text-wrap pretty](https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/) (2025)
- [blog.logrocket.com: text-wrap balance vs pretty](https://blog.logrocket.com/css-text-wrap-balance-vs-text-wrap-pretty/) (2026)
- [developer.chrome.com: CSS color-mix()](https://developer.chrome.com/docs/css-ui/css-color-mix) (2026)
- [caniuse.com: scrollbar-gutter](https://caniuse.com/mdn-css_properties_scrollbar-gutter) (21/09/2026)
- [caniuse.com: content-visibility](https://caniuse.com/css-content-visibility) (21/09/2026)
- [caniuse.com: @font-face size-adjust](https://caniuse.com/mdn-css_at-rules_font-face_size-adjust) (21/09/2026)
- [dev.to: CSS @property typed animatable custom properties](https://dev.to/grimicorn/css-property-typed-animatable-custom-properties-5hdd) (2026)
- [smashingmagazine.com: Windows High Contrast Mode e forced-colors](https://www.smashingmagazine.com/2022/03/windows-high-contrast-colors-mode-css-custom-properties/) (2022, conceito ainda válido em 2026)
- [testmuai.com: Viewport Units browser support (dvh/svh/lvh)](https://www.testmuai.com/learning-hub/viewport-units-browser-support/) (2026)
- [ishadeed.com: New Viewport Units](https://ishadeed.com/article/new-viewport-units/) (2026)
- [support.didomi.io: Apple 7-Day Cap on script-writable storage](https://support.didomi.io/apple-adds-a-7-day-cap-on-all-script-writable-storage) (2026)
- [developer.apple.com/forums/thread/710157: Safari iOS PWA Data Persistence Beyond 7 Days](https://developer.apple.com/forums/thread/710157) (2026)
- [mattburke.dev: DOM Exception 22, Quota Exceeded on Safari Private Browsing](https://mattburke.dev/dom-exception-22-quota-exceeded-on-safari-private-browsing-with-localstorage/) (2026)
- [open-web-advocacy.org: Apple's Browser Engine Ban Persists, Even Under the DMA](https://open-web-advocacy.org/blog/apples-browser-engine-ban-persists-even-under-the-dma/) (2026)
- [developer.apple.com/support/dma-and-apps-in-the-eu](https://developer.apple.com/support/dma-and-apps-in-the-eu/) (2026)
- [infoq.com/news/2026/05: Navigation API Reaches Baseline](https://www.infoq.com/news/2026/05/navigation-api-browser/) (05/2026)
- [testmuai.com: requestIdleCallback browser support](https://www.testmuai.com/learning-hub/requestidlecallback-browser-support/) (2026)
- [caniuse.com: inert HTML global attribute](https://caniuse.com/mdn-html_global_attributes_inert) (21/09/2026)
- [caniuse.com: CSS overscroll-behavior](https://caniuse.com/css-overscroll-behavior) (21/09/2026)
- [testmuai.com: scrollIntoView browser support](https://www.testmuai.com/learning-hub/scrollintoview-browser-support/) (2026)
- [dev.to: Styling the scrollbar in all modern browsers](https://dev.to/nickbenksim/styling-the-scrollbar-in-all-modern-browsers-1l4h) (2026)
- [sanechoice.cloud: Fix Firefox font rendering and weight issues](https://www.sanechoice.cloud/design/why-do-fonts-appear-differently-in-firefox/) (2026)
- [blogs.windows.com/msedgedev: Removing -ms-high-contrast](https://blogs.windows.com/msedgedev/2025/06/30/removing-ms-high-contrast-and-embracing-standards-based-forced-colors-in-microsoft-edge/) (30/06/2025)
- [positioniseverything.net: Immersive Reader no Edge](https://www.positioniseverything.net/how-to-use-immersive-reader-on-the-new-microsoft-edge-browser/) (2026)
- [web.dev/blog/browserslist-supports-baseline](https://web.dev/blog/browserslist-supports-baseline) (2026)
- [vite.dev/config/build-options](https://vite.dev/config/build-options) (2026)
- [evilmartians.com/chronicles: What we learned from creating PostCSS](https://evilmartians.com/chronicles/what-we-learned-from-creating-postcss) (2026)
- [pkgpulse.com: PostCSS vs Lightning CSS vs cssnano 2026](https://www.pkgpulse.com/blog/postcss-vs-lightningcss-vs-cssnano-css-processing-minification-2026) (2026)
- [canvasjs.com/forums: Total canvas memory use exceeds the maximum limit](https://canvasjs.com/forums/topic/safari-ios-total-canvas-memory-use-exceeds-the-maximum-limit/) (histórico, ainda referenciado em 2026)
- [bitmovin.com: Autoplay policies Safari e Chrome](https://bitmovin.com/blog/autoplay-policies-safari-14-chrome-64/) (histórico, política ainda vigente em 2026)
- [iifx.dev: Debugging iOS 26 fixed positioning post-keyboard](https://iifx.dev/en/articles/460201403/debugging-ios-26-how-to-correct-fixed-positioning-post-keyboard-interaction) (2026)
