# Arquitetura do site "Caderno de Direito"

Spec de arquitetura e fatiamento em ondas. Documento de planejamento: nenhuma linha de código de produto foi escrita nem nenhuma dependência instalada (L-51). Quem implementa é o `frontend-engineer`.

Autor: Caetano (CTO). Data: 21/09/2026.

## Como ler este documento

Cada afirmação sobre o material existente vem marcada:

- **[FATO]** verificado por leitura direta, com arquivo e linha, ou verbatim do líder.
- **[INFERÊNCIA]** conclusão ou decisão minha, sujeita a revisão.

Arquivo piloto lido nesta análise: o HTML de resumo da 1a unidade de Introdução ao Direito, 1o período, na árvore local de estudo, fora deste repositório (1555 linhas, 783.349 bytes). O caminho absoluto **não** é reproduzido aqui porque contém o nome da instituição, e este documento é versionado (R3); ele está na ordem de serviço do orquestrador. Todas as citações de linha abaixo se referem a esse arquivo.

---

## 1. Objetivo e restrições

### Objetivo

Publicar um site estático de estudo que reúne o material de todos os períodos do curso, uma página por unidade, com três abas por unidade (resumo teórico, peça processual comentada, quiz). O piloto é a primeira unidade de Introdução ao Direito.

### Restrições duras

| # | Restrição | Origem |
|---|---|---|
| R1 | Hospedagem compartilhada Hostinger. Só conteúdo estático servido por Apache. Nada de backend Node em execução. | [FATO] briefing do orquestrador |
| R2 | Destino: `direito2026.drpetrus.top`, pasta remota `/public_html/direito2026`, que é a raiz do subdomínio (base `/`). | [FATO] briefing |
| R3 | **Duas palavras são proibidas em todo o produto: o nome próprio do professor e o nome da instituição de ensino.** No lugar delas entram as palavras genéricas `professor` e `faculdade`. Vale para texto visível, metadado, título de página, comentário de código, nome de arquivo e URL. Portão automático obrigatório (seção 1, logo abaixo). | [FATO] decisão 8 do líder, refinada em 21/09/2026, verbatim: "Escreva 'professor' e 'faculdade' no lugar. As partes da petição são fictícias." |
| R4 | Stack fixada: Vite + Vue 3 + TypeScript. Build local, publica só o resultado estático. | [FATO] decisão 1, verbatim: "Vite + Vue 3 + TypeScript" |
| R5 | Nome no cabeçalho e no `<title>`: "Caderno de Direito". | [FATO] decisão 6 |
| R6 | Estrutura completa de 10 períodos visível desde já, itens sem material visíveis e desativados. | [FATO] decisão 2, verbatim: "10 períodos, vazios em 'em breve'" |
| R7 | Nada de CDN externo. Fontes e bibliotecas servidas do próprio domínio. | [INFERÊNCIA] decorre de R1 mais o requisito de funcionar offline (decisão 7) |
| R8 | Tema segue o sistema, com botão de troca que lembra a escolha. | [FATO] decisão 5 |
| R9 | Funcionar em Chrome, Firefox, Safari e Edge, em computador e celular, incluindo Safari no iPhone e no iPad. **Restrição de projeto, não ajuste de fim de onda.** Detalhe na seção 13. | [FATO] ordem do líder, 21/09/2026, verbatim: "o site deve ser compativel com chrome/firefox/safari/edge. Busque na web diferencas e como compatibilizar" |

### O que R3 implica na prática

[FATO] o piloto tem 2 ocorrências do nome da instituição (linhas 424 e 532) e 1 do nome do professor (linha 461), medidas por `grep`.

**As duas palavras proibidas não aparecem neste documento nem aparecerão no código.** Elas ficam num arquivo fora do repositório, e o implementador as pede ao orquestrador. Escrevê-las aqui reintroduziria exatamente o vazamento que R3 fecha, e em arquivo versionado, que é pior.

**Substituição:** onde estava o nome do professor entra a palavra `professor`; onde estava o nome da instituição entra a palavra `faculdade`. [FATO] as partes da petição (autora e ré) são fictícias e **ficam como estão**, por decisão do líder.

**R3 NÃO é uma proibição geral de nome de pessoa.** Esclarecimento do líder, 22/09/2026, verbatim: "pode deixar no texto o nome dos autores dos livros e das figuras historicas". R3 vale para exatamente dois nomes reais — o do professor e o da instituição de ensino do piloto — e para mais nenhum. Nome de autor citado como referência bibliográfica (Hart, Bobbio, Ferraz Jr., Groppali, Kelsen e outros) e nome de figura histórica (Hobbes, Locke, Rousseau, Justiniano, Hamurabi e outros) são conteúdo de estudo e **ficam no texto**, sempre. Por isso `verificar-proibicoes.sh` não usa nenhuma regra genérica de "parece nome próprio": ele só compara contra os dois termos exatos do arquivo externo (`grep -qF`, string fixa), e um agente futuro que veja um nome próprio no conteúdo não deve apagá-lo por zelo nem estreitar o portão além dos dois termos reais — isso reintroduziria exatamente o mesmo vazamento que R3 fecha, só que ao contrário (apagando referência legítima).

**Portão `verificar-proibicoes.sh`, obrigatório (L-36):**

- Lê os termos de `~/.config/secrets/` (caminho fora do repositório, mesma convenção já usada nesta máquina), nunca de um arquivo versionado.
- Varre, em cada execução: todo `src/`, todo `public/`, o `dist/` construído, os nomes de arquivo e de diretório, e a resposta HTTP do servidor depois da publicação.
- Busca sem distinguir maiúscula de minúscula e sem distinguir acento, porque o nome da instituição aparece em caixa alta no piloto e um nome próprio aparece acentuado e não acentuado.
- **Piso de varredura:** imprime sempre `arquivos varridos: N`, e sai com `exit 1` se N for zero. Zero arquivo varrido é portão quebrado, não código limpo.
- Sai com `exit 1` na primeira ocorrência, nomeando arquivo e linha, **antes** do empacotamento e antes do envio.
- **Nasce provado vermelho:** o commit de estreia insere um dos termos num arquivo de teste descartável, mostra o portão reprovando a construção, e remove o termo no mesmo commit. Portão nunca visto reprovando não conta.

Os commits também entram no escopo: o `pre-commit` do repositório chama o mesmo script sobre o que está prestes a virar commit.

### Fora de escopo

Backend, login, sincronização entre dispositivos, edição de conteúdo pelo navegador, analytics de terceiro.

---

## 2. Camadas e dependência unidirecional (L-33)

Quatro camadas. Cada uma só importa das de baixo. Um front estático tem as quatro; elas não somem por não haver servidor.

| Camada | Pasta | O que mora aqui | O que é proibido aqui |
|---|---|---|---|
| **Front** | `src/ui/` | Componentes Vue, páginas, folhas de estilo, tokens de tema. | Regra de correção de quiz, cálculo de progresso, acesso direto a `localStorage`, montagem de índice de busca. |
| **Mid** | `src/app/` | Router, stores, composables, adaptadores de persistência, carregamento sob demanda de conteúdo, consulta ao índice. | Regra de domínio. Esta camada traduz e orquestra, não decide. |
| **Back** | `src/core/` | Domínio puro em TypeScript: tipos do currículo e da unidade, correção e embaralhamento do quiz, cálculo de progresso, construção e consulta do índice, resolução de rota a partir do currículo. | `import` de Vue, de `vue-router`, de `window`, `document` ou `localStorage`. Roda em Node sem DOM. |
| **Foundation** | `public/`, `scripts/`, raiz | `.htaccess`, `manifest.webmanifest`, ícones, service worker gerado, `vite.config.ts`, scripts de build/recorte de fonte/índice/deploy, CI, pré-CI. | Conteúdo de estudo. |

`src/conteudo/` é **dado**, não camada: arquivos `.ts` que só exportam objetos tipados pelos tipos de `core`. Importa de `core` (os tipos) e de mais nada.

Sentido permitido: `ui` -> `app` -> `core`. `conteudo` -> `core`. `foundation` não é importada em runtime por ninguém, ela produz o artefato.

**Como isso é provado e não só declarado:** `dependency-cruiser` com regras nomeadas (`core-sem-vue`, `core-sem-dom`, `ui-nao-pula-app`, `conteudo-so-tipos`), rodando no pré-CI e no CI. A trava nasce provada vermelha (L-36): no commit de estreia entra um import proibido de propósito, mostra-se o gate reprovando, e o import é revertido no mesmo commit.

### SOLID e DRY neste projeto

- **Dependency Inversion concreto:** `core` declara a interface `RepositorioProgresso`; `app/persistencia` traz duas implementações (localStorage e memória). O teste de `core` nunca toca no navegador.
- **Single Responsibility concreto:** o motor do quiz (sortear, corrigir, pontuar) não sabe o que é uma aba nem uma rota.
- **DRY com regra de 3:** nada de "componente genérico de conteúdo" na onda 1. A segunda unidade é escrita duplicando o que for preciso. Na terceira, o `frontend-engineer` extrai e nomeia por escrito a razão de mudança comum às três.

---

## 3. Estrutura de pastas

```
site_direito2026/
├── README.md                     # hub único da documentação (L-73), entrega da onda 0
├── docs/
│   ├── arquitetura.md            # este documento
│   ├── design-visual.md          # de outro agente
│   ├── compatibilidade-navegadores.md  # fonte única de R9, de outro agente
│   └── publicacao.md             # runbook de deploy, entrega da onda 1
├── mockups/
├── public/                       # copiado cru para dist/
│   ├── .htaccess
│   ├── manifest.webmanifest
│   └── icones/
├── scripts/
│   ├── preci.sh
│   ├── gerar-indice-busca.ts
│   ├── gerar-dispositivos-por-unidade.ts
│   ├── verificar-dispositivos.ts # portão: toda citação existe no catálogo
│   ├── recortar-fontes.sh
│   ├── verificar-proibicoes.sh   # gate de R3
│   └── publicar.sh
├── src/
│   ├── core/
│   │   ├── curriculo/            # tipos + resolução de rota + estado publicado
│   │   ├── unidade/              # tipos do conteúdo de uma unidade
│   │   ├── quiz/                 # embaralhar, corrigir, pontuar
│   │   ├── dispositivos/         # tipos e busca do artigo citado
│   │   ├── progresso/            # tipos + interface RepositorioProgresso
│   │   └── busca/                # documento indexável, normalização, consulta
│   ├── app/
│   │   ├── router/
│   │   ├── stores/
│   │   ├── persistencia/         # localStorage e memória
│   │   └── carregamento/         # import() por unidade
│   ├── ui/
│   │   ├── layout/
│   │   ├── componentes/
│   │   ├── paginas/
│   │   ├── estilos/
│   │   └── fontes/               # .woff2 recortados
│   ├── dados/                    # dado compartilhado entre TODAS as cadeiras
│   │   └── dispositivos-legais.json   # catálogo verificado, entrada de build
│   ├── conteudo/
│   │   ├── curriculo.ts          # os 10 períodos
│   │   └── p1/
│   │       └── intr-direito/
│   │           └── u1/
│   │               ├── meta.ts
│   │               ├── resumo.ts
│   │               ├── peticao.ts
│   │               ├── quiz.ts
│   │               └── dispositivos.ts # GERADO no build, subconjunto da unidade
│   └── main.ts
├── tests/
│   ├── unidade/
│   ├── componente/
│   └── e2e/
└── dist/                         # ignorado pelo git
```

**Caminho concreto de uma unidade de conteúdo:** `src/conteudo/p1/intr-direito/u1/resumo.ts`.

[INFERÊNCIA] Os slugs de pasta (`p1`, `intr-direito`, `u1`) foram escolhidos para não carregarem nome de pessoa nem de instituição, atendendo R3 também no nome de arquivo, e para serem o mesmo texto que aparece na URL.

**Quatro arquivos por unidade, não um.** [FATO] o piloto reúne tudo num arquivo de 1555 linhas, com a petição inteira num único literal de template (linha 890) e as 60 perguntas num único array (linha 941). [INFERÊNCIA] isso é monolito de documento e a L-34 o proíbe em qualquer nível. Separado em quatro, cada arquivo tem um assunto, o diff de uma correção no quiz não toca o resumo, e o `import()` sob demanda passa a ser possível por aba.

---

## 4. Modelo de dados

### 4.1 Currículo

```ts
// src/core/curriculo/tipos.ts

/** Estado de publicação de qualquer nó do currículo. */
export type EstadoPublicacao = 'publicado' | 'em-breve';

/** Abas possíveis de uma unidade. Fechado de propósito: o layout depende disso. */
export type ChaveAba = 'resumo' | 'peticao' | 'quiz';

export interface ReferenciaUnidade {
  /** Slug estável usado na URL. Ex.: 'u1'. */
  readonly id: string;
  /** Rótulo curto no menu. Ex.: 'Unidade 1'. */
  readonly rotulo: string;
  /** Título longo, usado no cabeçalho da página. */
  readonly titulo: string;
  readonly estado: EstadoPublicacao;
  /** Abas que esta unidade realmente tem. Vazio quando estado é 'em-breve'. */
  readonly abas: readonly ChaveAba[];
  /**
   * Carregador sob demanda do conteúdo. Ausente quando estado é 'em-breve'.
   * Implementado como () => import('../../conteudo/p1/intr-direito/u1').
   */
  readonly carregar?: () => Promise<ConteudoUnidade>;
}

export interface Cadeira {
  /** Slug usado na URL. Ex.: 'intr-direito'. */
  readonly id: string;
  readonly nome: string;
  readonly estado: EstadoPublicacao;
  readonly unidades: readonly ReferenciaUnidade[];
}

export interface Periodo {
  /** Slug usado na URL. Ex.: 'p1'. */
  readonly id: string;
  /** 1 a 10. */
  readonly numero: number;
  /** Ex.: '1o período'. */
  readonly rotulo: string;
  readonly cadeiras: readonly Cadeira[];
}

export type Curriculo = readonly Periodo[];

/** Resultado da resolução de uma URL contra o currículo. Função pura de core. */
export type ResolucaoRota =
  | { readonly tipo: 'encontrado'; readonly periodo: Periodo; readonly cadeira: Cadeira; readonly unidade: ReferenciaUnidade; readonly aba: ChaveAba }
  | { readonly tipo: 'em-breve'; readonly periodo: Periodo; readonly cadeira?: Cadeira; readonly unidade?: ReferenciaUnidade }
  | { readonly tipo: 'inexistente' };
```

[INFERÊNCIA] `estado` existe nos três níveis porque R6 pede o esqueleto completo visível: um período inteiro pode estar vazio, uma cadeira pode existir sem nenhuma unidade pronta, e uma unidade pode estar anunciada sem conteúdo. Um booleano `publicado` só resolveria um nível.

### 4.2 Conteúdo de uma unidade

```ts
// src/core/unidade/tipos.ts

export interface MetaUnidade {
  readonly titulo: string;
  readonly subtitulo: string;
  /** Usado em <meta name="description"> e no cartão de resultado da busca. */
  readonly descricao: string;
}

/** Um bloco teórico do resumo. O piloto tem 9 (linhas 579 a 887). */
export interface BlocoResumo {
  /** Âncora estável dentro da página. Ex.: 'bloco-0'. */
  readonly id: string;
  /** Posição exibida, começando em 1. */
  readonly numero: number;
  readonly titulo: string;
  /** Referência bibliográfica da fonte do bloco. */
  readonly fonte: string;
  /** Selo opcional. O piloto usa 'Aprofundamento' em um bloco (linha 869). */
  readonly badge?: string;
  /** Corpo em HTML confiável, de origem interna. Ver nota de segurança abaixo. */
  readonly corpoHtml: string;
  /** Itens do quadro-resumo de revisão. */
  readonly resumo: readonly string[];
  /** Parágrafo "na prática do operador do direito", em HTML confiável. */
  readonly exemploHtml: string;
}

/** Uma seção da peça comentada. O piloto tem 6 (linhas 890 a 940). */
export interface SecaoPeca {
  /** Âncora estável. Ex.: 'enderecamento'. */
  readonly id: string;
  /** Ex.: 'Endereçamento', 'Qualificação', 'Dos Fatos'. */
  readonly titulo: string;
  /** O texto da peça em si. */
  readonly corpoHtml: string;
  /** O comentário "como fazer", exibido em destaque ao lado ou abaixo. */
  readonly comentarioHtml: string;
}

export interface PecaComentada {
  readonly titulo: string;
  /** Nota introdutória que explica a natureza do documento e dos comentários. */
  readonly notaHtml: string;
  readonly secoes: readonly SecaoPeca[];
}

/** O piloto usa exatamente estas três (40, 10 e 10 perguntas). */
export type CategoriaQuiz = 'teoria' | 'peticao' | 'fundamentos';

export interface PerguntaQuiz {
  readonly id: number;
  readonly categoria: CategoriaQuiz;
  readonly enunciado: string;
  /** Sempre 4 alternativas. A tupla trava isso no compilador. */
  readonly alternativas: readonly [string, string, string, string];
  /** Índice da correta no array original, antes de embaralhar. */
  readonly correta: 0 | 1 | 2 | 3;
  /** true quando a explicação apoia-se em artigo fora do conjunto base da disciplina. */
  readonly fonteExtra: boolean;
  readonly explicacao: string;
}

export interface ConteudoUnidade {
  readonly meta: MetaUnidade;
  readonly resumo: readonly BlocoResumo[];
  readonly peticao?: PecaComentada;
  readonly quiz?: readonly PerguntaQuiz[];
}
```

**Tipos de runtime do quiz** (gerados, nunca escritos à mão em `conteudo/`):

```ts
// src/core/quiz/tipos.ts

export interface PerguntaEmbaralhada {
  readonly id: number;
  readonly categoria: CategoriaQuiz;
  readonly enunciado: string;
  readonly explicacao: string;
  readonly fonteExtra: boolean;
  readonly alternativas: readonly [string, string, string, string];
  readonly indiceCorreto: 0 | 1 | 2 | 3;
}

export interface RodadaQuiz {
  readonly perguntas: readonly PerguntaEmbaralhada[];
  /** Chave: id da pergunta. Valor: índice escolhido na ordem embaralhada. */
  readonly respostas: Readonly<Record<number, 0 | 1 | 2 | 3>>;
  readonly indiceAtual: number;
  readonly finalizada: boolean;
}

export interface PontuacaoCategoria {
  readonly categoria: CategoriaQuiz;
  readonly acertos: number;
  readonly total: number;
}

export interface Pontuacao {
  readonly acertos: number;
  readonly total: number;
  readonly porCategoria: readonly PontuacaoCategoria[];
}
```

[FATO] o piloto embaralha perguntas e alternativas por Fisher-Yates a cada rodada (linhas 1368 a 1394) e recalcula o índice da correta. [INFERÊNCIA] essa lógica sobe inteira para `core/quiz`, onde é testável sem navegador. A regra "o embaralhamento não muda enquanto a pergunta está na tela" passa a ser garantida pelo tipo: `RodadaQuiz` é imutável e só é recriada em "reiniciar".

### 4.3 Dispositivos legais citados

Dado **compartilhado entre todas as cadeiras**: o art. 186 do Código Civil é o mesmo em Introdução ao Direito e em Responsabilidade Civil. Por isso não mora em `src/conteudo/<período>/<cadeira>/<unidade>/`, e sim em `src/dados/`, ao lado de `src/conteudo/` e no mesmo nível hierárquico.

```ts
// src/core/dispositivos/tipos.ts

export interface DispositivoLegal {
  /** Identificador estável citado no conteúdo. Ex.: 'cc-186', 'cpc-319-ii'. */
  readonly id: string;
  /** Nome por extenso. Ex.: 'Código Civil'. */
  readonly diploma: string;
  /** Sigla usada no rótulo curto. Ex.: 'CC'. */
  readonly diplomaSigla: string;
  /** Número do artigo, como texto. Ex.: '186', '5º'. */
  readonly artigo: string;
  /** Inciso, quando a citação é de um inciso e não do caput. Ex.: 'II'. */
  readonly inciso?: string;
  /** Redação oficial, verbatim, como está na fonte. */
  readonly texto: string;
  /** URL da fonte oficial consultada. */
  readonly urlFonte: string;
  /** ISO 8601. Data em que a fonte foi consultada. */
  readonly dataConsulta: string;
  /** Nota sobre alteração, revogação ou redação dada por lei posterior. */
  readonly notaAlteracao?: string;
}

/** Forma do arquivo entregue pela verificação: lista. */
export type CatalogoDispositivos = readonly DispositivoLegal[];

/** Forma consumida em runtime: indexada por id, montada no build. */
export type IndiceDispositivos = Readonly<Record<string, DispositivoLegal>>;
```

[FATO] as nove chaves acima são as que o agente de verificação jurídica vai gravar. [INFERÊNCIA] `inciso` e `notaAlteracao` são opcionais porque nem toda citação é de inciso e nem todo artigo sofreu alteração; os outros sete são obrigatórios, e o portão da seção 14 reprova a construção se algum faltar.

**Origem e destino do arquivo.** A verificação jurídica entrega o catálogo em `docs/dispositivos-legais.json`. O local canônico de build é `src/dados/dispositivos-legais.json`: a onda 1 copia o arquivo para lá e deixa em `docs/` apenas uma nota de procedência (de onde veio, quem verificou, como acrescentar um dispositivo novo). Motivo: `docs/` é documentação para humanos, e um arquivo que o build lê é entrada de build, não documentação. Nenhum conteúdo é alterado nessa cópia.

**`dataConsulta` e `notaAlteracao` não são enfeite.** Lei muda. O balão mostra a data da consulta em letra pequena e o link para a fonte oficial, para que o leitor saiba de quando é aquele texto e possa conferir. Um material de estudo que exibe redação revogada sem avisar é pior que um que não exibe nada.

### 4.4 Nota de segurança sobre `corpoHtml`

[FATO] o piloto injeta HTML por `v-html` em três pontos (linhas 445, 452, 462). [INFERÊNCIA] isso é aceitável enquanto a origem é um arquivo `.ts` do próprio repositório, e é injeção de script no dia em que a origem mudar. A regra que fica: **`v-html` só recebe valor vindo de `src/conteudo/`**, e um gate ESLint reprova `v-html` ligado a qualquer outra expressão. Conteúdo vindo de URL, de `localStorage` ou de consulta de busca nunca entra por `v-html`.

---

## 5. Roteamento e URLs

### URLs

| Rota | Página |
|---|---|
| `/` | Home |
| `/busca?q=<termo>` | Resultados da busca |
| `/p/:periodo` | Período, lista de cadeiras |
| `/p/:periodo/:cadeira` | Cadeira, lista de unidades |
| `/p/:periodo/:cadeira/:unidade` | Unidade, aba `resumo` (padrão) |
| `/p/:periodo/:cadeira/:unidade/peticao` | Unidade, aba petição |
| `/p/:periodo/:cadeira/:unidade/quiz` | Unidade, aba quiz |

Exemplo real: `https://direito2026.drpetrus.top/p/p1/intr-direito/u1/quiz`.

Âncora (`#bloco-3`) fica reservada para pular para um bloco dentro do resumo, como no piloto (linha 428).

### Decisão: history mode com `.htaccess`, não hash

**Recomendo history mode.** Duas razões: (a) a pasta remota é a raiz do subdomínio, então `base` é `/` e o `.htaccess` é um arquivo de seis linhas sem `RewriteBase` de subpasta, que é justamente onde essa configuração costuma quebrar; (b) o hash já é usado para pular entre blocos do resumo, e entregá-lo ao router obrigaria a inventar uma segunda sintaxe de âncora, piorando o link que o leitor copia e cola.

`public/.htaccess`:

```apache
Options -MultiViews
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^ index.html [L]

<IfModule mod_headers.c>
  <FilesMatch "\.(js|css|woff2|png|svg|webp)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "^(index\.html|sw\.js|manifest\.webmanifest)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
```

**Restrição do WebKit que muda o desenho, não só a implementação:** o Safari lança `SecurityError` quando `pushState` ou `replaceState` passa de 100 chamadas em 30 segundos. Isso não é teórico para nós, porque a troca de aba é navegação (seção 6) e o resumo tem um observador de rolagem por bloco. As três regras que ficam: (a) só ação do leitor escreve no histórico, nunca um laço nem um observador; (b) o marcador de bloco lido e o realce do bloco corrente atualizam estado interno e **não** tocam na URL; (c) se algum dia a âncora do bloco corrente precisar aparecer na barra de endereço, isso vai por `replaceState` com estrangulamento de 350 ms, nunca por chamada direta. O e2e no WebKit traz um caso que troca de aba trinta vezes seguidas e reprova se qualquer exceção aparecer no console.

**Plano B se o host ignorar `AllowOverride`:** `dist/404.html` como cópia byte a byte de `index.html`. A Hostinger serve o `404.html` do diretório, o Vue Router lê `location.pathname` e monta a rota certa. O leitor recebe status 404 em vez de 200, o que é ruim para buscador mas não quebra a navegação. A escolha entre A e B se decide medindo (seção 15), não supondo.

---

## 6. Componentes previstos

Um parágrafo por componente, com a fronteira.

**`LayoutBase`** envolve toda página autenticada pelo router: barra de topo, gaveta de navegação, área de conteúdo, rodapé e o link "pular para o conteúdo". Recebe apenas o slot da página. Depende de `MenuCurriculo`, `BarraTopo` e `Rodape`, e de mais nada.

**`BarraTopo`** mostra "Caderno de Direito", o botão que abre a gaveta em telas estreitas, o `CampoBusca` e o `AlternadorTema`. Não conhece a rota atual além de emitir o pedido de abrir a gaveta; quem sabe onde está é o `MenuCurriculo`.

**`MenuCurriculo`** desenha cinco níveis (período, cadeira, unidade e, dentro de cada unidade publicada, Resumo/Petição comentada/Quiz com seus próprios itens: blocos, seções e categorias) como disclosures aninhados a partir do objeto `Curriculo`. Recebe o currículo e a resolução da rota atual; emite navegação. É o componente mais exigente em acessibilidade (seção 11) e o único que sabe renderizar o estado `em-breve`. Não guarda conteúdo de unidade nenhuma de antemão: o 4o/5o nível busca sob demanda, ao abrir a unidade, pelo mesmo `unidade.carregar()` que `Unidade.vue` usa (nunca por import direto de `src/conteudo/.../resumo|peticao|quiz`, que empacotaria o HTML inteiro no chunk da lateral) — ordem do líder, 22/09/2026: "faltou os submenus da 1a unidade: resumo, peticao comentada, quiz" / "submenus de resumo, de peticao... e de quiz".

**`EstadoEmBreve`** é o item desativado do menu e também a página que aparece quando alguém digita a URL de uma unidade não publicada. Recebe o rótulo e devolve um item não navegável com nome acessível que contém a palavra "em breve". Existe separado para que "em breve" seja uma coisa só no site inteiro, e não três renderizações parecidas.

**`AlternadorTema`** alterna entre sistema, claro e escuro, nessa ordem, e grava a escolha. Depende da store de tema em `app/stores`; não escreve em `localStorage` diretamente. O estado inicial é "sistema", que lê `prefers-color-scheme`.

**`CampoBusca`** é o input mais o atalho de teclado. Ao receber foco pela primeira vez, dispara o `import()` do índice, para que o primeiro caractere digitado já encontre o motor carregado. Não sabe buscar: chama `app/stores/busca`, que chama `core/busca`.

**`PainelResultadosBusca`** lista os acertos com a trilha (período, cadeira, unidade, aba) e um trecho com o termo destacado. O destaque é feito por marcação segura (`<mark>` montado no componente), nunca por `v-html` sobre o texto consultado.

**`CartaoUnidade`** é o item das listagens de período e de cadeira: título, rótulo, selo de estado e, quando publicada, o indicador de progresso. Recebe uma `ReferenciaUnidade` e nada mais.

**`AbasUnidade`** implementa o padrão de abas (resumo, petição, quiz) sincronizado com a URL: trocar de aba é navegar, não é estado local. Recebe as abas disponíveis e a aba ativa; renderiza o painel por slot. Responsável por `role="tablist"`, setas de teclado e `aria-controls`.

**`VisorResumo`** percorre os blocos e renderiza um `BlocoTeorico` por item, mais o sumário no topo. Sabe marcar bloco como lido quando ele passa pelo viewport, delegando o cálculo para a store de progresso.

**`BlocoTeorico`** desenha um bloco: numeração, título, selo, fonte citada, corpo, `QuadroResumo` e o exemplo prático. É o átomo repetido 9 vezes na unidade piloto.

**`QuadroResumo`** é a caixa de revisão de véspera de prova: uma lista de itens curtos. Separado do `BlocoTeorico` porque na folha de impressão ele tem regra própria de quebra de página.

**`PecaComentada`** renderiza as seções da peça, cada uma com o texto e o comentário "como fazer" em destaque visual distinto. Recebe `PecaComentada`; não sabe nada sobre quiz nem resumo. Em tela estreita o comentário vai abaixo do trecho; em tela larga, ao lado.

**`MotorQuiz`** é o componente que segura a `RodadaQuiz`: pergunta atual, navegação, finalização, reinício, e a persistência das respostas. Delega toda a matemática a `core/quiz` e toda a gravação a `app/persistencia`. Renderiza `CartaoPergunta` ou `ResultadoQuiz`.

**`CartaoPergunta`** mostra o enunciado, as quatro alternativas como grupo de rádio, e, depois de responder, a explicação e o aviso de artigo complementar. Recebe a pergunta embaralhada e a resposta dada, se houver; emite a escolha. Não decide se está certo: recebe isso pronto.

**`ResultadoQuiz` e `GradeRevisao`** mostram a pontuação total, a pontuação por categoria e a grade clicável de 60 quadrados que leva de volta a cada pergunta. Recebem `Pontuacao` e a rodada.

**`FundoAnimado`** é o canvas da home. Recebe apenas a altura desejada; monta o laço de animação em `requestAnimationFrame`, pausa quando a aba perde visibilidade, e desenha um único quadro estático quando `prefers-reduced-motion` está ativo. É o único componente do site que toca em canvas. Por causa do WebKit em aparelho móvel, que derruba a aba por memória antes dos outros motores, ele nasce com três limites fixados **antes** de qualquer medição (L-43): área de backing store no máximo 4 milhões de pixels, `devicePixelRatio` efetivo travado em 2, e desistência com queda para um gradiente CSS estático se a criação do contexto falhar. Nenhuma informação do site vive dentro do canvas, então perdê-lo não custa nada ao leitor.

**`IndicadorProgresso`** mostra "X de Y blocos lidos" e a barra. Recebe números prontos; não conta nada.

**`Rodape`** traz exatamente três coisas, decididas pelo líder em 21/09/2026: o nome do site, o ano, e o aviso de que é material de estudo sem valor oficial. Mais o aviso de que o progresso fica salvo neste navegador. **Sem autoria, sem instituição, sem contato.** É o ponto mais sensível de R3 e está coberto pelo portão `verificar-proibicoes.sh`.

**`CitacaoLegal` (controlador) e `BalaoDispositivo`** formam o balão que mostra a redação do artigo ao apontar uma citação. Não é um componente por citação: é um controlador único por delegação de evento mais um único elemento `popover` compartilhado na página. Desenho completo na seção 12.

**`ApendiceDispositivos`** é a lista "Dispositivos citados" que só existe no papel: escondida na tela, impressa ao final da unidade com a redação, a fonte e a data de consulta de cada dispositivo citado ali (seção 12.6).

---

## 7. Busca

### Geração no build

`scripts/gerar-indice-busca.ts` roda antes do `vite build`, em Node, importando os mesmos arquivos de `src/conteudo/` que o site importa. Para cada unidade publicada, produz um documento por unidade de sentido:

```ts
// src/core/busca/tipos.ts
export interface DocumentoBusca {
  /** Ex.: 'p1/intr-direito/u1#bloco-3'. */
  readonly id: string;
  readonly url: string;
  readonly periodo: string;
  readonly cadeira: string;
  readonly unidade: string;
  readonly aba: ChaveAba;
  readonly titulo: string;
  /** Texto puro, sem tags, usado para casar o termo. */
  readonly corpo: string;
  /** Primeiros ~200 caracteres, usados no cartão de resultado. */
  readonly trecho: string;
}
```

Granularidade: um documento por bloco teórico, um por seção da peça, e um por unidade para o quiz (não se indexa pergunta por pergunta: entregaria a resposta na busca). O HTML é reduzido a texto puro por remoção de tags no próprio script, sem depender de DOM.

Saída: `public/busca/indice.json`, com `JSON.stringify(mini.toJSON())`. Se passar de 300 KB comprimido, o índice é fatiado por período e o carregador baixa só os períodos que têm material. Esse teto de 300 KB fica fixado **agora, antes de existir a medição** (L-43).

Piso de varredura obrigatório (L-36): o script imprime sempre `documentos encontrados: N / indexados: M`, mesmo quando N é zero, e sai com `exit 1` se N for zero ou se N e M divergirem. Zero documento é varredura quebrada, não conteúdo limpo.

### Consumo no navegador

Import dinâmico no primeiro foco do campo de busca. `MiniSearch.loadJSON()` reconstitui o índice sem reindexar. Configuração: `prefix: true`, `fuzzy: 0.2`, `boost: { titulo: 3 }`, `combineWith: 'AND'`.

Normalização de acento é obrigatória, não enfeite: `processTerm` aplica `String.prototype.normalize('NFD')` e remove os diacríticos, dos dois lados (indexação e consulta). Quem digita "peticao" tem de achar "petição", e quem digita "zetetica" tem de achar "Zetética".

### Biblioteca

**Recomendada: MiniSearch.** Lê os dados tipados direto, sem depender de HTML já renderizado, cabe em cerca de 8 KB comprimidos, tem serialização do índice pronta e expõe os ganchos de ranking de que se precisa. Para o corpo atual (uma unidade, nove blocos, seis seções) é folgado.

**Alternativa: Pagefind.** Indexa o HTML já construído, fatia o índice automaticamente e carrega só os pedaços necessários, com carga inicial na casa de 30 KB de WebAssembly. Compensa quando o currículo chegar a milhares de páginas, que não é o caso da onda 1 e provavelmente nem do curso inteiro. A migração é contida: só o que está em `core/busca` e no script muda, porque o resto do site conversa com uma interface `MotorBusca`, não com a biblioteca.

Descartadas: Lunr (índice grande, projeto parado), Fuse.js (busca difusa sem índice invertido, perde precisão em corpo de texto longo), Algolia e similares (serviço externo, contraria R1 e R7).

---

## 8. Progresso no navegador

### O que é guardado

| Dado | Granularidade |
|---|---|
| Blocos lidos | Conjunto de ids de bloco, por unidade |
| Última aba visitada | Por unidade |
| Respostas do quiz | Mapa id da pergunta -> índice escolhido, por unidade |
| Quiz finalizado e pontuação | Por unidade |
| Tema escolhido | Global: `sistema`, `claro` ou `escuro` |

### Chaves

Prefixo com nome do produto e versão do formato:

- `caderno-direito:v1:tema`
- `caderno-direito:v1:progresso:p1/intr-direito/u1`

Uma chave por unidade, não um blob único (L-34 no nível do dado): salvar uma unidade não reescreve o estado das outras, e um registro corrompido não derruba tudo.

Cada valor carrega `{ versao: 1, atualizadoEm: <ISO>, ... }`. Leitor que encontra `versao` desconhecida descarta aquele registro em silêncio, nunca tenta adivinhar.

[FATO] o piloto usa duas chaves globais, `introdireito_lidos_v1` e `introdireito_quiz_v1` (linhas 1364 e 1365), e grava o array inteiro de perguntas embaralhadas dentro da chave do quiz (linha 1497). [INFERÊNCIA] gravar as perguntas é desperdício: elas vivem no bundle. Grava-se só a semente do embaralhamento mais as respostas, e a rodada é reconstituída a partir da semente. Isso derruba o tamanho do registro de dezenas de KB para algumas centenas de bytes.

### Quando o armazenamento não está disponível

`localStorage` pode lançar na leitura e na escrita: janela anônima, dados de site bloqueados, cota estourada. A regra:

1. `core` define `RepositorioProgresso` como interface. `app/persistencia` traz `RepositorioLocalStorage` e `RepositorioMemoria`.
2. Na subida, uma sonda tenta escrever e ler uma chave descartável dentro de `try/catch`. Falhou, o site usa `RepositorioMemoria` pelo resto da sessão.
3. Toda leitura e toda escrita ficam em `try/catch` mesmo depois da sonda: a cota pode estourar no meio.
4. **O site funciona inteiro sem persistência.** Nada é bloqueado, nenhum banner de erro aparece. A única diferença observável é que, ao recarregar, o progresso volta a zero.
5. Cota estourada: descarta o registro de unidade com o `atualizadoEm` mais antigo e tenta de novo, uma vez.

Isso é coberto por teste de componente com um mock que lança (seção 14), não é promessa.

### Safari no iOS: o progresso some sozinho, e isso não é defeito

[FATO, verificado em pesquisa] desde o iOS 13.4 e o Safari 13.1, **todo armazenamento gravável por script é apagado após 7 dias sem interação do leitor com o site**: `localStorage`, `sessionStorage`, IndexedDB, Cache API e o registro do service worker, juntos. Site adicionado à Tela de Início tem contador próprio de dias de uso e escapa dessa expiração.

[INFERÊNCIA] a consequência é que, num iPhone usado com intervalo maior que uma semana, o progresso de leitura e as respostas do quiz **desaparecem sem que nada tenha dado errado**. O site não pode tratar isso como erro, e a arquitetura tem de assumir que o armazenamento é volátil por natureza, não por acidente.

**Comportamento esperado quando o armazenamento some ou falha** (vale igual para expiração de 7 dias, modo privado, cota estourada e dados de site bloqueados):

1. O site volta ao estado zero **em silêncio**. Sem banner de erro, sem tela de recuperação, sem pedido de permissão.
2. **Nenhum conteúdo fica atrás do progresso.** Todo bloco, toda seção da peça e toda pergunta continuam acessíveis. O progresso é enfeite útil, nunca porta.
3. "0 de 9 lidos" é um estado válido da interface, não um estado de erro, e é renderizado como tal.
4. O rodapé promete exatamente "o progresso fica salvo neste navegador", nunca "seus dados ficam salvos". A promessa tem de caber no que o sistema garante.
5. O quiz já finalizado que perde as respostas volta ao início embaralhado, sem mensagem de sessão expirada.

**Redução de dano possível sem servidor** (R1 proíbe backend, então não há conta nem sincronização): exportar e importar o progresso como um arquivo JSON pequeno, botão na página da unidade. É a única saída real para quem não quer perder nada. Item da onda 3, não da onda 1.

**Convite a "Adicionar à Tela de Início"** no iOS, uma linha discreta na home, jamais um modal. É o único caminho que de fato isenta o site da expiração de 7 dias, e de quebra é o que torna o modo offline confiável naquele aparelho.

**Modo privado do Safari:** o `localStorage` existe mas morre ao fechar a aba, e versões mais antigas do iOS lançam `QuotaExceededError` já na primeira escrita. O desenho acima (sonda na subida mais `try/catch` em toda operação mais queda para `RepositorioMemoria`) já cobre os dois casos **sem uma linha nova**. O que muda com R9 é o estatuto: deixa de ser caso exótico e vira caso de teste obrigatório na suíte de componente e no e2e do WebKit.

**Cota:** o Safari trabalha com folga menor que os demais motores. A decisão desta seção de não gravar as perguntas embaralhadas, só a semente e as respostas, mantém o registro por unidade na casa das centenas de bytes, longe de qualquer teto em qualquer motor.

---

## 9. Offline e impressão

### Offline

`vite-plugin-pwa` em modo `generateSW` (Workbox), com `registerType: 'prompt'`. O `prompt` é deliberado: numa página de leitura longa, trocar o conteúdo sob o leitor no meio de um bloco é pior que mostrar um aviso discreto de "nova versão disponível".

- **Precache:** `index.html`, JS e CSS com hash, os `.woff2`, os ícones, o manifest e `busca/indice.json`. `globPatterns` precisa listar `woff2` explicitamente: é falha conhecida do plugin deixar fonte de fora do glob padrão.
- **Runtime `CacheFirst`:** os chunks de conteúdo por unidade (`assets/conteudo-*.js`), que são imutáveis por causa do hash.
- **Runtime `NetworkFirst`:** navegação, com `navigateFallback: '/index.html'`.
- **Escopo:** unidade já visitada abre offline. Unidade nunca visitada mostra um estado "este material ainda não foi baixado" em vez de uma tela branca.
- **Escape documentado:** o runbook de publicação traz como limpar o service worker preso, porque service worker mal configurado é a forma mais fácil de deixar um leitor numa versão velha para sempre.
- O site **não** é uma PWA instalável obrigatória; o manifest existe pelo ícone e pelo nome.
- **No WebKit:** o registro do service worker é armazenamento gravável por script e cai na mesma expiração de 7 dias da seção 8. Depois dela, a primeira visita simplesmente rebaixa tudo da rede de novo. Por isso **nada no site fica atrás do service worker**: o modo offline é melhoria, nunca requisito de funcionamento. O iOS também não tem `beforeinstallprompt`, então não se promete botão de instalar: documenta-se "Adicionar à Tela de Início" como caminho manual.

### Impressão

`src/ui/estilos/impressao.css`, dentro de `@media print`.

**Remove:** gaveta de navegação, barra de topo, botão de tema, campo de busca, painel de resultados, canvas de fundo, barra de progresso de leitura, botões de navegação do quiz, botão de reiniciar e a grade de revisão.

**Mantém e ajusta:**
- O resumo inteiro, com os nove blocos expandidos, independentemente da aba ativa quando o leitor manda imprimir.
- A peça com os comentários, com o comentário abaixo do trecho comentado (nunca em coluna lateral, que quebra mal no papel).
- O quiz vira uma lista numerada de perguntas com as quatro alternativas, e o gabarito com as explicações em bloco separado ao final, para poder resolver no papel.
- Fundo branco forçado, texto quase preto, `print-color-adjust: exact` só nas caixas que perdem sentido sem cor de fundo.
- `a[href^="http"]::after { content: " (" attr(href) ")" }`, para o link sobreviver ao papel.
- `break-inside: avoid` em quadro-resumo, exemplo prático, seção de peça e cartão de pergunta. `break-before: page` no início de cada bloco teórico.
- Margem de página em `@page` e o título da unidade repetido no topo.
- **Citações legais viram nota:** o botão da citação imprime como texto normal com marca numérica, e o apêndice "Dispositivos citados" fecha a unidade com a redação completa de cada dispositivo, a URL da fonte e a data de consulta (seção 12.6).
- Nada de `position: fixed` nem `absolute` perto de quebra de página: o guia de compatibilidade registra que o Safari desloca elemento posicionado na impressão.

A folha de impressão só é aceita contra PDF gerado por Chromium headless (L-46) e inspecionado, nunca contra a pré-visualização do navegador na sessão do líder (L-50).

---

## 10. Tipografia e fontes

### O problema medido

[FATO] o piloto tem 783.349 bytes, dos quais cerca de 490 KB são `@font-face` com `src: url(data:font/woff2;base64,...)` das famílias Inter e Lora (a partir da linha 10). Efeito observável: a página só começa a pintar depois de baixar o arquivo inteiro, e uma correção de uma vírgula no texto obriga o leitor a rebaixar os 490 KB de fonte junto.

### Alvo

Arquivos `.woff2` próprios em `src/ui/fontes/`, versionados no repositório, servidos pelo Vite com hash no nome e cache imutável de um ano. Nenhum CDN (R7).

### Como sair de um para o outro

1. Trazer os arquivos originais por `@fontsource-variable/inter` e `@fontsource/lora`, que publicam os `.woff2` para self-host, sem CDN.
2. Recortar com `pyftsubset` (pacote `fonttools`), em `scripts/recortar-fontes.sh`:

```bash
pyftsubset InterVariable.woff2 \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD" \
  --layout-features="kern,liga,clig,calt" \
  --flavor=woff2 --output-file=src/ui/fontes/inter-var.woff2
```

O intervalo acima é o mesmo `unicode-range` que o piloto já declara nos seus `@font-face`, então o recorte não perde nenhum caractere que o material use.

3. Quatro arquivos, não doze: Inter variável (cobre 400 a 700 num arquivo), Lora 400, Lora 600 e Lora itálico 400. [FATO] o piloto tem `@font-face` separados para Inter 400, 500, 600 e 700 e para Lora normal e itálico.
4. `@font-face` local com `font-display: swap`; `<link rel="preload">` apenas para Inter variável e Lora 400, que são as duas usadas acima da dobra.

[INFERÊNCIA] Estimativa de resultado: entre 25 e 45 KB por arquivo recortado, abaixo de 150 KB no total, contra os 490 KB de hoje. É estimativa, não medição; a medição entra no fechamento da onda 0.

**Alternativa sem instalar `fonttools`:** usar direto os subsets `latin` que o Fontsource já publica separados por `unicode-range`, sem recorte próprio. Fica maior que o recorte sob medida, mas não exige ferramenta nova. Decidir depois da autorização de instalação (seção 16).

**Gate:** `scripts/verificar-fontes.sh` reprova o build se algum `.woff2` em `dist/` passar de 60 KB, ou se sobrar a sequência `data:font` em qualquer arquivo de `dist/`. Termina com `exit 1` antes do empacotamento, não com um `echo` (L-36).

---

## 11. Acessibilidade

Piso: WCAG 2.2 nível AA, nos dois temas.

### Menu de três níveis

**Padrão escolhido: disclosure aninhado, não `menubar` ARIA.** [INFERÊNCIA] `menubar` exige roving tabindex, navegação completa por setas em duas dimensões e comportamento de aplicativo, e é justamente o padrão que mais quebra em navegação de site. Disclosure é o recomendado para navegação hierárquica e é o que o leitor de tela já espera.

Obrigatório:

- Contêiner `<nav aria-label="Currículo">`. Só um `nav` com esse rótulo no documento.
- Cada nível expansível é um `<button aria-expanded="true|false" aria-controls="<id da lista>">`, com a lista `<ul>` aninhada logo depois. Nunca `<div>` com `onclick`.
- **Teclado:** Tab percorre na ordem visual; Enter e Espaço alternam o disclosure; Escape fecha o nível aberto e devolve o foco ao botão que o abriu; Home e End vão ao primeiro e ao último item da lista aberta; setas para cima e para baixo movem entre irmãos do mesmo nível.
- **Foco:** anel visível sempre, com contraste mínimo de 3:1 contra o fundo adjacente nos dois temas. `outline: none` só com substituto visível no mesmo commit.
- **Item em breve:** é `<span aria-disabled="true">` dentro do `<li>`, não `<a>` sem `href` e não `<button disabled>` (que sai da ordem de foco e desaparece para quem navega por teclado). O nome acessível contém a palavra "em breve", porque a distinção não pode ser só de cor nem só de opacidade.
- **Item atual:** `aria-current="page"` no link da unidade aberta.
- **Link de salto:** "Pular para o conteúdo" como primeiro elemento focável, visível ao receber foco.
- **Mudança de rota:** o foco vai para o `<h1>` da página nova, que tem `tabindex="-1"`, e uma região `aria-live="polite"` anuncia o título. Sem isso, quem usa leitor de tela troca de página e continua ouvindo a página anterior.
- **Gaveta em tela estreita:** foco preso dentro da gaveta enquanto aberta, `inert` no resto do documento, Escape fecha e devolve o foco ao botão que abriu.
- **Alvo de toque:** mínimo de 24 por 24 CSS px nos itens de menu (WCAG 2.2, critério 2.5.8).

### Quiz

- Alternativas como `role="radiogroup"` com `<input type="radio">` nativos, não quatro `<button>`. Motivo: o leitor de tela anuncia "2 de 4" sozinho e as setas funcionam sem código.
- O enunciado é o rótulo do grupo, por `aria-labelledby`.
- O feedback após responder entra numa região `aria-live="polite"`, para ser lido sem roubar o foco de quem está navegando.
- Certo e errado **nunca só por cor**: ícone mais texto ("Correta" e "Sua resposta, incorreta"). [FATO] o piloto hoje distingue por classe de cor (linhas 491 a 494) e por uma frase no título da explicação.
- O aviso de "artigo complementar" é texto, não só um selo colorido.
- Progresso do quiz com `role="progressbar"` e `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- A ordem embaralhada **não muda** enquanto a pergunta está na tela. Reembaralhar só em "reiniciar".
- Contraste: 4.5:1 para texto, 3:1 para borda de componente e para o anel de foco, medido contra o fundo real do elemento (L-42), nos dois temas.
- `prefers-reduced-motion`: sem transição entre perguntas, sem animação na barra, e o canvas da home desenha um quadro estático.

---

## 12. Citação legal com balão

[FATO] requisito do líder, 21/09/2026, verbatim: *"Nos artigos citados, quero que o mouse ao passar por cima (hover) apareça um balao ou algo do tipo que não atrapalhe a pagina nem saia da pagina com a redacao do artigo correspondente citado. Busque na web se necessário para nao errar o texto."*

Três exigências dentro dessa frase, e nenhuma é decoração: **não atrapalhar a página** (não empurrar conteúdo, não cobrir o trecho lido), **não sair da página** (nem virar link para fora, nem transbordar da tela) e **não errar o texto** (redação oficial verificada, com fonte e data).

### 12.1 Como a citação é marcada no conteúdo

O conteúdo já é HTML confiável renderizado por `v-html` (seção 4.4), e Vue não instancia componente dentro de `v-html`. Em vez de mudar o modelo de conteúdo, a citação é marcada como um botão com um atributo de dado:

```html
<button type="button" class="citacao" data-dispositivo="cc-186"
        aria-expanded="false" aria-controls="balao-dispositivo">art. 186 do Código Civil</button>
```

Três razões para `<button>` e não `<span>` nem `<a>`: recebe foco de teclado sem `tabindex` inventado; anuncia-se como controle no leitor de tela; e não é link, então nunca tira o leitor da página, que é metade do pedido.

### 12.2 Um balão só, compartilhado, por delegação

**Não existe um balão por citação.** Existe **um** elemento `popover` na página inteira, e um controlador único (`src/ui/componentes/citacoes.ts`) que escuta os eventos na região de conteúdo e descobre qual citação disparou.

Ganhos concretos: uma página com quarenta citações tem quarenta botões e **um** balão, não quarenta; a camada superior do navegador nunca tem mais de um elemento; e o custo de acrescentar citações ao conteúdo é zero em DOM.

```html
<div id="balao-dispositivo" popover="auto" role="note" aria-live="polite"></div>
```

`popover="auto"` foi escolhido em vez de `manual` porque entrega de graça, pelo navegador, três coisas que costumam ser mal implementadas à mão: camada superior acima de qualquer `z-index`, fechamento por `Esc` e fechamento por clique fora. [FATO, guia de compatibilidade, seção 2] `popover` é suportado a partir de Chrome e Edge 114, Firefox 125 e Safari 17, todos dentro do alvo declarado.

### 12.3 Acionamento: mouse, toque e teclado

Apontar com o mouse não existe em celular. Os três caminhos são desenhados separadamente e nenhum é consequência acidental do outro.

| Entrada | Abre | Fecha | Detalhe |
|---|---|---|---|
| **Mouse** | `pointerenter` no botão, com 120 ms de intenção antes de abrir | sair do botão e do balão, com 200 ms de tolerância | O caminho de hover é ligado só dentro de `@media (hover: hover) and (pointer: fine)`. O balão é apontável, para o leitor conseguir selecionar e copiar o texto do artigo. |
| **Toque** | um toque no botão abre; outro toque fecha | toque fora, ou o botão de fechar | Sem hover, sem o problema clássico do primeiro toque virar hover e o segundo virar clique, porque o caminho de hover está atrás da media query acima. |
| **Teclado** | o botão recebe foco e o balão abre quando `elemento.matches(':focus-visible')` for verdadeiro | `Esc`, pelo próprio navegador | Abrir só em `:focus-visible` evita que o clique do mouse dispare o caminho de teclado. |

**O foco nunca sai do texto.** Abrir o balão não move o foco, nem no teclado nem no toque. O botão continua focado, `aria-expanded` passa a `true`, e é o `aria-live="polite"` que faz o leitor de tela anunciar a redação do artigo sem que o leitor perca o lugar na leitura. `Esc` fecha e não há foco a devolver, porque nunca foi tirado.

[INFERÊNCIA] `aria-live` foi preferido a `aria-describedby` permanente porque a redação de um artigo é um parágrafo, não uma etiqueta curta: com `aria-describedby` fixo, o leitor de tela recitaria o artigo inteiro toda vez que o foco passasse pelo botão, inclusive quando o leitor só quisesse seguir lendo.

### 12.4 Posicionamento sem sair da tela e sem cobrir a linha

Dois caminhos, escolhidos por detecção de recurso, nunca por detecção de navegador.

**Caminho preferido, CSS puro (anchor positioning).** O controlador põe `anchor-name` apenas no botão ativo, um de cada vez; o balão declara `position-anchor`, `position-area` acima da linha, e `position-try-fallbacks: flip-block, flip-inline`, que é o que faz o balão virar para baixo quando não há espaço em cima e para o lado quando não há espaço na borda. Mais `position-visibility: anchors-visible`, para o balão sumir junto quando a citação rola para fora da tela.

**Por que precisa de contorno declarado.** [FATO, guia de compatibilidade, seção 2] o núcleo de anchor positioning está em Chrome e Edge 125+, Firefox 147+ (13/01/2026) e Safari desde a série 18, **mas o `@position-try` completo no Safari é mais recente que isso**, e a seção 6 do guia manda envolver anchor positioning completo em `@supports`. Sem `@position-try` o balão não vira, e num parágrafo perto do rodapé ele sairia da tela: exatamente o que o líder pediu para não acontecer.

**Caminho de contorno, carregado só quando necessário.** Guarda em `CSS.supports('position-try-fallbacks', 'flip-block')`. Se faltar, o controlador faz `import('@floating-ui/dom')` e posiciona com `computePosition` mais `offset`, `flip`, `shift` e `size`. Quem tem suporte completo **nunca baixa esse pacote**: ele é um pedaço separado do build, buscado só no ramo do contorno.

**Os dois caminhos dividem os mesmos limites**, para o resultado ser o mesmo em qualquer motor:

- `max-inline-size: min(36ch, calc(100vw - 32px))`, então o balão nunca encosta nas bordas.
- `max-block-size: 40vh` com rolagem interna, então um artigo longo nunca cobre a tela.
- Deslocamento de 8 px da linha do texto, e preferência por abrir **acima** da linha quando há espaço: o trecho que está sendo lido fica visível, que é a segunda exigência do líder.
- O balão vive na camada superior do navegador, então **não empurra nem reflui nada**: nenhuma palavra do texto se move quando ele abre. Essa é a primeira exigência.

**Em tela de toque, o balão não é balão.** Abaixo de 640 px de largura, ou com `pointer: coarse`, o mesmo elemento vira uma folha na base da tela, largura cheia, com botão de fechar. Dois motivos: uma bolha ancorada a uma palavra é ilegível num telefone, e o dedo cobre justamente o que se quer ler. De quebra, isso tira anchor positioning do caminho na plataforma onde ele é menos previsível.

### 12.5 Carregamento: um subconjunto por unidade, não um catálogo global

O catálogo verificado tem todos os dispositivos de todas as cadeiras, e **nunca é enviado ao navegador**. Ele é entrada de build.

`scripts/gerar-dispositivos-por-unidade.ts` varre o conteúdo de cada unidade, coleta os `data-dispositivo` que ela de fato cita, e emite `src/conteudo/<p>/<cadeira>/<u>/dispositivos.ts` com **só esses**. Esse arquivo entra no mesmo pedaço que o conteúdo da unidade, que já é carregado sob demanda pelo `carregar()` da seção 4.1.

[INFERÊNCIA] **isto muda o mecanismo que a ordem de serviço descreveu, e cumpre melhor o que ela pede.** A ordem pedia que o arquivo de dispositivos não entrasse no pacote inicial e fosse carregado sob demanda. O subconjunto por unidade entrega isso e mais quatro coisas: nada global é baixado nunca; o balão não espera uma segunda requisição além do pedaço da unidade que já era necessário; funciona offline de graça, porque o pedaço da unidade já é pré-cacheado (seção 9); e a folha de impressão fica determinística (12.6), o que um carregamento preguiçoso global não permitiria. O piloto cita cerca de sete dispositivos distintos, então o subconjunto é de poucos KB. Se o orquestrador preferir o catálogo global sob demanda, é trocar o script e o carregador, sem tocar no componente.

**Enquanto o dado não chegou**, o texto já está legível e os botões de citação já estão lá: só o conteúdo do balão depende do pedaço. Se o pedaço falhar (rede caída na primeira visita), o balão abre com o rótulo da citação, o aviso de que a redação não está disponível sem conexão e o link da fonte oficial. **Nunca um balão vazio, nunca um girador eterno.**

### 12.6 Impressão

O balão não existe no papel. A citação vira **nota**: no corpo impresso o botão vira texto normal com uma marca numérica, e ao final da unidade entra o apêndice **"Dispositivos citados"**, com diploma, artigo, inciso, redação completa, URL da fonte e data de consulta.

Por que apêndice e não expansão em linha: um artigo citado cinco vezes aparece **uma** vez, e o fluxo de leitura não é partido por parágrafos de lei no meio do argumento. É também como material jurídico é impresso.

O apêndice é montado a partir do mesmo `dispositivos.ts` da unidade, que chega junto com o conteúdo. Fica no DOM sempre, escondido com `@media screen`, e por isso **imprimir funciona offline e não depende de o leitor ter aberto algum balão antes**. Componente: `ApendiceDispositivos`.

### 12.7 Manutenção do catálogo de leis

[FATO] decisão do líder, 21/09/2026: **revisar a cada seis meses e sempre que conteúdo novo for publicado.** Cada dispositivo guarda a data da consulta, e o balão mostra essa data de forma discreta.

| Quando | O que se faz |
|---|---|
| A cada seis meses | Reconferir na fonte oficial todos os dispositivos do catálogo. Atualizar `texto`, `dataConsulta` e, quando for o caso, `notaAlteracao`. |
| Sempre que uma unidade nova é publicada | Conferir os dispositivos que ela cita, incluir os que faltarem e reconferir os que já estavam. Isso já é obrigatório na prática, porque o portão da seção 14 reprova a construção se algum id citado não existir. |
| Quando uma lei muda fora dessas janelas | Atualizar na hora. Não esperar a janela dos seis meses. |

**O que a interface mostra.** No rodapé do balão, em letra menor e sem competir com a redação: a sigla e o número do dispositivo, a data da consulta, e o link para a fonte oficial. Quando `notaAlteracao` existe, ela aparece **acima** da redação e em destaque, porque a informação de que aquele texto foi alterado ou revogado vale mais que o texto em si.

[INFERÊNCIA] a data visível não é burocracia: é o que separa um material de estudo honesto de um que ensina redação revogada em silêncio. O leitor vê de quando é aquele texto e tem um clique para conferir.

**Quem executa:** a revisão é trabalho de verificação jurídica, não de engenharia. O que a engenharia garante é que o dado tem os campos, que toda citação resolve, e que a data aparece na tela.

### 12.8 Componentes e onde cada peça mora

| Peça | Camada | Responsabilidade |
|---|---|---|
| `core/dispositivos/tipos.ts` | Back | Os tipos da seção 4.3. |
| `core/dispositivos/rotulo.ts` | Back | Monta o rótulo curto (artigo, inciso, sigla) a partir do dispositivo. Função pura, testável sem DOM. |
| `src/dados/dispositivos-legais.json` | Dado | Catálogo verificado. Entrada de build, nunca enviado ao navegador. |
| `scripts/gerar-dispositivos-por-unidade.ts` | Foundation | Gera o subconjunto por unidade. |
| `scripts/verificar-dispositivos.ts` | Foundation | Portão de construção (seção 14). |
| `ui/componentes/citacoes.ts` | Front | Controlador único: delegação de evento, intenção de hover, `:focus-visible`, escolha do caminho de posicionamento. |
| `ui/componentes/BalaoDispositivo.vue` | Front | O elemento `popover` compartilhado e o seu conteúdo. |
| `ui/componentes/ApendiceDispositivos.vue` | Front | O apêndice de impressão. |

---

## 13. Compatibilidade entre navegadores

**Fonte única: [`compatibilidade-navegadores.md`](compatibilidade-navegadores.md).** A matriz de recursos por navegador, as versões mínimas, o alvo de `browserslist`, as armadilhas do WebKit e as regras de codificação moram lá e **não são repetidas aqui**. Esta seção registra só o que a compatibilidade muda na arquitetura. Se os dois documentos discordarem, o guia vence e este texto é corrigido (L-73: fonte única, e duas cópias que divergem são pior que uma).

### Alvo

[FATO] ordem do líder, 21/09/2026, verbatim: *"o site deve ser compativel com chrome/firefox/safari/edge. Busque na web diferencas e como compatibilizar"*. Cobre computador e celular, com Safari no iPhone e no iPad explicitados pelo orquestrador.

### A restrição de fundo: no iOS, todo navegador é Safari

[FATO, guia de compatibilidade, seção 1] Chrome, Firefox e Edge no iPhone e no iPad são invólucros sobre o WebKit do sistema. O guia acrescenta que, apesar de o Digital Markets Act ter obrigado a Apple a permitir motores alternativos, nenhum fabricante lançou um em produção até a consulta de 21/09/2026. [INFERÊNCIA] a consequência arquitetural é direta e não tem contorno: **no iOS não existe plano B de navegador**. Onde o WebKit não faz, ninguém faz naquele aparelho, e o contorno tem de estar no nosso código.

Na prática são três motores a atender, não quatro: Blink (Chrome e Edge), Gecko (Firefox) e WebKit (Safari em toda plataforma, mais todo navegador no iOS). Edge não é um quarto alvo de engenharia. O Edge não está instalado neste sistema, mas **existe uma máquina virtual de Windows 11 aqui** (inventário e roteiro na seção 14), e é nela que os recursos próprios dele que o guia lista (Leitor Imersivo, tradutor, autopreenchimento) e o alto contraste do Windows passam a ser conferidos de verdade, uma vez por onda. A engenharia continua seguindo as regras do guia (marcação semântica correta, busca contra o índice do build e não contra o texto da tela, `autocomplete="off"` nos campos do quiz, `forced-colors` em vez da sintaxe removida), só que agora com prova em cima.

É por isso que R9 entra como restrição na seção 1 e não como item de acabamento: um contorno de WebKit descoberto na última onda custa redesenho, e cada decisão abaixo já nasceu com ele considerado.

### Alvo de `browserslist`

Fixado pelo guia, em `.browserslistrc` na raiz. A forma explícita por navegador é deliberada: o atalho `last 4 versions` cobriria **todos** os navegadores rastreados, não os quatro pedidos.

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

É mais permissivo que o padrão do Vite 7 (`Baseline Widely Available`), então a regra da seção 6 do guia vale sem exceção: **todo recurso fora do Baseline amplamente disponível entra atrás de `@supports`**, com o estado sem ele conferido visualmente. Os números resolvidos mudam toda semana; o implementador roda `npx browserslist` no projeto em vez de fixar versão de cabeça.

### Onde cada decisão deste documento encosta no WebKit

| Decisão | Risco conhecido | Plano de contorno, já embutido no desenho |
|---|---|---|
| **Roteamento** history mode (seção 5) | Safari lança `SecurityError` acima de 100 chamadas de `pushState` ou `replaceState` em 30 segundos. | Só ação do leitor escreve no histórico; observador de rolagem nunca toca na URL; se precisar, `replaceState` com estrangulamento de 350 ms. Detalhe na seção 5. |
| **Roteamento**, parte servidor | Nenhum: o `.htaccess` é do Apache, não do navegador. | Sem risco de motor. O plano B `404.html` também é neutro. |
| **Offline** (seção 9) | Registro de service worker expira com os 7 dias do iOS; não há `beforeinstallprompt`. | Nada do site fica atrás do service worker; offline é melhoria. "Adicionar à Tela de Início" documentado como caminho manual. |
| **Progresso** (seção 8) | Expiração de 7 dias, modo privado que lança, cota menor. | Sonda na subida, `try/catch` em toda operação, queda para memória, nenhum conteúdo atrás do progresso. Detalhe na seção 8. |
| **Busca** (seção 7) | `String.prototype.normalize('NFD')` é seguro nos três motores há anos; o risco real está em regex com `lookbehind`, que só entrou no Safari 16.4. | Regra de codificação: o normalizador de acento e o removedor de tags **não usam `lookbehind` nem lookahead negativo**; onde faria falta, resolve-se em duas passagens. O índice é JSON puro, sem formato binário. |
| **Canvas** da home (seção 6) | WebKit em aparelho móvel impõe teto de área de canvas e derruba a aba por memória antes dos outros motores. | Área limitada a 4 milhões de pixels, `devicePixelRatio` travado em 2, pausa em `visibilitychange`, quadro estático sob `prefers-reduced-motion`, e queda para gradiente CSS se o contexto falhar. Nenhuma informação vive no canvas. |
| **Impressão** (seção 9) | Suporte a `@page` e a quebras de página é o mais irregular do WebKit, e no iOS não há como automatizar a conferência. | A folha de impressão **não depende de `@page` para funcionar**, só para ficar melhor: margens vêm do container, quebras vêm de `break-inside: avoid` com o alias antigo `page-break-inside: avoid` no mesmo bloco. Conferência automatizada no Chromium (L-46); no WebKit, conferência manual em aparelho real, uma vez por onda. |
| **Altura de tela** | `100vh` no Safari do iPhone conta a barra de ferramentas retrátil e corta o conteúdo. | `100dvh` com `100vh` declarado antes como reserva. Nenhuma tela do site depende de altura exata de viewport: toda página é rolagem de leitura. |
| **Balão de citação** (seção 12) | `popover` é seguro no alvo; **anchor positioning completo não é**: o `@position-try` do Safari é mais recente que o núcleo, e sem ele o balão não vira e sai da tela. | Caminho preferido em CSS atrás de `CSS.supports('position-try-fallbacks', 'flip-block')`; contorno com `@floating-ui/dom` importado só nesse ramo. Em `pointer: coarse` o balão vira folha inferior e dispensa ancoragem. Detalhe na seção 12.4. |
| **Fontes** (seção 10) | Nenhum. `.woff2` é universal nos quatro. O guia alerta que o WebKit aplica suavização diferente e pede conferência visual dos pesos no Safari real. | O recorte proposto não usa recurso de formato que o WebKit não leia; a conferência de peso entra na lista de aparelho real (seção 14). |
| **Campo de busca** (seção 7) | O iOS amplia a página ao focar campo com fonte menor que 16 px. | `font-size: 16px` no `CampoBusca` em telas estreitas, compensando com altura e espaçamento, nunca com fonte menor. Regra do guia, seção 9. |
| **`requestIdleCallback`** | Não suportado em produção no Safari. | Só é usado com reserva em `setTimeout`. Afeta a pré-busca ociosa mencionada na seção 12.5. |
| **Camadas e tipos** (seção 2) | Nenhum: `core` é TypeScript puro compilado para o alvo do `browserslist`. | Sem risco de motor. |

### O que fica no guia, não aqui

Matriz de recursos e versões mínimas, alvo de `browserslist`, prefixos, política de polyfill, e as regras de escrita de CSS e de TypeScript. Quem for implementar lê o guia **antes** de escrever a primeira linha, não depois de o teste falhar.

---

## 14. Estratégia de testes

Conforme `manuals/TESTES.md`, stack Node/TypeScript, seção T15.4 do manual. TDD red/green/refactor em tudo que é `core` (L-35). **Sem meta numérica de cobertura**: cobertura é consequência, nunca alvo.

### Unitário (Vitest, sem DOM)

Todo `src/core/`. Cada item começa por um teste visto falhar:

- Quiz: embaralhar preserva o conjunto de alternativas e mantém `indiceCorreto` apontando para o mesmo texto; corrigir devolve acerto e erro corretos; pontuação por categoria soma 40, 10 e 10; reconstituir a rodada a partir da semente dá exatamente a mesma ordem.
- Progresso: marcar e desmarcar bloco, contagem, migração de registro com `versao` desconhecida (descarta sem lançar), registro corrompido (descarta sem lançar).
- Currículo: resolver `/p/p1/intr-direito/u1/quiz` devolve `encontrado`; resolver unidade `em-breve` devolve `em-breve`, não `inexistente`; resolver período inexistente devolve `inexistente`; aba pedida que a unidade não tem cai para `resumo`.
- Busca: construir índice a partir de conteúdo de exemplo; consultar sem acento acha com acento; consultar com prefixo parcial acha; consulta vazia devolve lista vazia e não erro.

### Componente (Vitest mais `@vue/test-utils`)

- `MenuCurriculo`: expande, colapsa, Escape fecha e devolve o foco, item `em-breve` não é focável como link e tem "em breve" no nome acessível.
- `AbasUnidade`: trocar de aba navega (router mockado), aba ausente não é renderizada.
- `CartaoPergunta`: antes de responder não há explicação; depois de responder, as alternativas ficam bloqueadas e a explicação aparece.
- `AlternadorTema`: ciclo sistema, claro, escuro, e persistência chamada.
- `RepositorioProgresso`: com um `localStorage` mockado que **lança** em `setItem`, o site continua funcionando e o repositório cai para memória.
- `EstadoEmBreve`: rende o texto e não emite navegação.

### Ponta a ponta (Playwright contra `vite preview`)

- Deep link direto em `/p/p1/intr-direito/u1/quiz` carrega a página certa. Este é o teste que prova o fallback de history mode.
- Responder o quiz inteiro, recarregar, as respostas continuam lá.
- Buscar "peticao" sem acento encontra a peça.
- Escolher tema escuro, recarregar, continua escuro.
- Percorrer do primeiro Tab até responder uma pergunta, sem mouse.
- Segundo carregamento com a rede desligada abre a unidade já visitada.
- Varredura de R3: nenhuma página renderizada contém o nome da instituição nem nome de pessoa (lista de termos vinda de arquivo fora do repositório).
- a11y automatizada: `@axe-core/playwright` na home, numa unidade e no quiz. Qualquer violação `serious` ou `critical` reprova.

### Citação legal (seção 12)

**Portão de construção, não teste manual.** `scripts/verificar-dispositivos.ts` roda no pré-CI, no CI e antes do empacotamento:

1. Varre todo `corpoHtml`, `exemploHtml`, `comentarioHtml` e `explicacao` de **todas** as unidades e extrai cada `data-dispositivo`.
2. Reprova com `exit 1`, nomeando arquivo e id, se alguma citação apontar para um id que não existe no catálogo. **Citação órfã é erro de construção**, nunca um balão vazio descoberto pelo leitor.
3. Reprova se algum dispositivo do catálogo estiver sem um dos sete campos obrigatórios da seção 4.3.
4. Avisa, sem reprovar, quando um dispositivo do catálogo não é citado por ninguém.
5. **Piso de varredura:** imprime sempre `citações encontradas: N / resolvidas: M`, mesmo com zero, e sai 1 se N for zero ou se N e M divergirem. Zero citação no site inteiro é varredura quebrada, não conteúdo sem citação.
6. **Nasce provado vermelho:** commit de estreia com um id inventado no conteúdo, portão reprovando, id removido no mesmo commit.

**Unitário:** montagem do rótulo curto a partir de artigo, inciso e sigla; geração do subconjunto por unidade a partir de um conteúdo de exemplo (inclui o caso do mesmo dispositivo citado cinco vezes aparecendo uma vez só).

**Componente:** abre no `pointerenter` só quando a media query de hover casa; abre em `:focus-visible` e não abre em clique de mouse pelo caminho de teclado; `Esc` fecha; `aria-expanded` alterna; **o foco permanece no botão em todos os casos**; o conteúdo do balão corresponde ao id acionado; sem dado carregado, aparece o aviso de indisponível e o link da fonte, nunca um balão vazio.

**Ponta a ponta, nos três motores:** com o caminho de CSS e, forçando `CSS.supports` a devolver falso, com o caminho do `@floating-ui/dom`, para que o contorno seja exercitado e não só declarado. Em 360 px de largura, com uma citação colada na borda direita e outra colada no rodapé, o `getBoundingClientRect` do balão tem de caber inteiro dentro de `innerWidth` e `innerHeight`, e não pode intersectar o retângulo da linha da citação. Emulando `pointer: coarse`, o balão vira folha inferior e um toque abre.

**Impressão:** o PDF do Chromium contém o apêndice "Dispositivos citados" com os dispositivos daquela unidade, cada um com fonte e data, e nenhum balão.

### O que o portão automático cobre, e o que ele não cobre

O desenho anterior supunha os três motores no CI. **Isso caiu quando o inventário da máquina foi medido.**

**[FATO] inventário medido em 21/09/2026, por `command -v` e `rpm -q`:**

| Instalado | Ausente |
|---|---|
| `/usr/bin/brave-browser` (Blink) | Safari: **não existe para Linux** |
| `/usr/bin/chromium-browser` (Blink) | Edge: não instalado |
| `/usr/bin/firefox` (Gecko) | Epiphany ou qualquer navegador sobre WebKitGTK: não instalado |
| biblioteca `webkit2gtk4.1-2.52.5`, sem nenhum navegador que a use | Nenhum navegador em flatpak |
| **máquina virtual de Windows 11, desligada e persistente** (detalhe abaixo) | |

**[FATO] decisão do líder, 21/09/2026, verbatim:** *"tenho instalados brave, chromium e safari. Os outros viram conferência manual dos usuarios depois"*. A intenção é clara e está acatada; o inventário acima corrige a parte do Safari, que não existe nesta plataforma.

**[FATO] existe uma máquina virtual de Windows nesta máquina, conferida por `virsh` em 21/09/2026:**

| Item | Valor medido |
|---|---|
| Domínio libvirt de sessão (`qemu:///session`) | `glintfx-win11-lab`, desligado, persistente, sem início automático |
| Recursos | 4 vCPU, 8 GiB de memória |
| Disco | disco próprio da VM, fora deste repositório, 17 GB ocupados |
| Mídia anexada | `win11-ltsc2024-ptbr-x64-eval.iso`, `answer-disc.iso`, `virtio-win-stable.iso` |
| Rede | `type='user'` (slirp) com modelo `virtio`, o que faz o host ser alcançável de dentro do Windows pelo endereço `10.0.2.2` |

[FATO, documentação da Microsoft, consultada em 21/09/2026] no Windows 11 Enterprise LTSC 2024 o **Edge é o navegador padrão e vem incluído**, ao contrário do Windows 10 LTSC, onde não vinha. O Internet Explorer não existe mais nessa versão.

**[VERIFICAÇÃO PENDENTE, não é fato]** ninguém ligou a VM para confirmar que a instalação do Windows terminou e que o Edge está lá. O tamanho do disco sugere que sim, sugerir não é medir, e o primeiro uso da VM no plano começa por confirmar isso.

**Regra que fica: nenhum binário de navegador é baixado.** A VM não é exceção: ela já existe, e nada é instalado dentro dela para este projeto.

#### O que roda no portão automático

Blink, e só Blink. O Playwright é apontado por `executablePath` para o `chromium-browser` ou o `brave-browser` já instalados. Isso cobre Chrome e Edge, que são o mesmo motor.

#### Por que Gecko não entra no automático, mesmo com Firefox instalado

Ponto que precisa ficar escrito para ninguém concluir depois que dava e foi esquecido: **o Playwright não usa o Firefox do sistema.** Ele usa uma compilação própria, remendada, com um protocolo de automação que o Firefox de distribuição não expõe. Apontar `executablePath` para `/usr/bin/firefox` não funciona. Automatizar Gecko exigiria `npx playwright install firefox`, que é baixar binário de navegador, o que está vedado. Portanto **Gecko fica fora do automático**, e isso é consequência de uma decisão, não de um esquecimento.

#### O que a VM de Windows passa a cobrir

O Edge sai da coluna "sem como verificar". Com a VM, e **sem tocar na sessão gráfica do líder** (L-50), passam a ter prova quatro coisas que até agora não tinham nenhuma:

1. **O Edge real**, e com ele os recursos próprios que o guia de compatibilidade lista como capazes de alterar a página: Leitor Imersivo, tradução automática e autopreenchimento.
2. **Modo de alto contraste do Windows** (`forced-colors: active`), que é o cenário para o qual a regra existe e que nenhum navegador de Linux reproduz.
3. **Impressão no Windows**, que tem diálogo e motor de impressão próprios.
4. **Renderização de fonte no Windows**, com o hinting do sistema, que difere do Linux e do macOS e é onde o recorte da seção 10 pode surpreender.

Continua sendo **verificação manual**, não portão automático: a VM não entra no CI.

**Ligar a VM é trabalho pesado.** São 8 GiB de memória e 4 vCPU. Vale o portão de **um trabalho pesado por vez** (L-11): a VM não sobe junto com uma construção, com a suíte de testes nem com outra VM. Quem for usá-la fecha o que estiver pesado antes.

#### Por que WebKit não entra de jeito nenhum

**A VM de Windows não resolve isto.** Windows não tem WebKit, e o Safari para Windows foi descontinuado há mais de uma década. Safari não existe para Linux. A biblioteca `webkit2gtk4.1` está no sistema, mas biblioteca não é navegador: seria preciso instalar algo como o Epiphany, que é instalar navegador (vedado pela L-57) e instalar pacote (L-51). O WebKit do Playwright é outro download. **Não há caminho automatizado para WebKit nesta máquina**, e é justamente o motor onde moram os maiores riscos deste projeto: o contorno do balão de citação, o `localStorage` que lança em modo privado, a expiração de 7 dias, a impressão e o limite de memória do canvas.

#### O que sai do automático e vira verificação manual declarada

| Motor | Como é verificado | Quem |
|---|---|---|
| Blink (Chrome, Edge) | Portão automático completo, nos três tamanhos e nos dois temas, mais axe | CI |
| Gecko (Firefox) | Passada manual no Firefox instalado, uma por onda, roteiro escrito | `qa-engineer` |
| WebKit desktop (Safari em macOS) | Não verificável nesta máquina. Conferência do usuário, depois | Líder ou usuários |
| WebKit móvel (iPhone, iPad) | Lista de verificação do líder, logo abaixo | Líder |
| Edge real, mais alto contraste, impressão e fonte do Windows | Passada manual na VM `glintfx-win11-lab`, uma por onda, roteiro na lista abaixo | `qa-engineer` |

**Regra de relato, sem exceção: nenhum fechamento de onda pode afirmar "três motores verdes".** A frase honesta é "Blink verde no automático; Gecko conferido à mão em tal data; WebKit não verificado nesta máquina". Um relatório que arredonde isso para cima é relato falso, e a L-06 já diz que cumprimento parcial é não.

### Roteiro de conferência no Windows, na máquina virtual

Executado pelo `qa-engineer`, uma vez por onda. Nada é instalado dentro da VM.

**Passo 0, antes de tudo:** fechar construção, suíte e qualquer outro trabalho pesado. A VM pede 8 GiB e vale a regra de um pesado por vez (L-11).

**Passo 1, no host:** subir a pré-visualização do site em `vite preview --host 0.0.0.0 --port 4173`. O `--host` é necessário: sem ele o servidor só escuta em `localhost` e a VM não alcança.

**Passo 2:** ligar a VM (`virsh -c qemu:///session start glintfx-win11-lab`) e abrir o visualizador. **Na primeira vez, confirmar que a instalação do Windows terminou e que o Edge está presente**, que é a verificação ainda pendente registrada acima. Se não estiver, o roteiro para aqui e o achado é reportado; nada é instalado para contornar.

**Passo 3, dentro do Windows, no Edge:** abrir `http://10.0.2.2:4173`. A rede da VM é do tipo `user`, então `10.0.2.2` é o host, sem nenhuma configuração de rede.

**Passo 4, o que olhar:**

| Tela | O que fazer | O que deve acontecer |
|---|---|---|
| Home e uma unidade | Navegar normalmente, trocar de aba, abrir o menu de três níveis | Nada divergente do Chromium no Linux. Divergência aqui é divergência de sistema, não de motor, e merece investigação. |
| Uma unidade longa | Acionar o **Leitor Imersivo** do Edge | O texto do resumo é reconhecido como conteúdo principal. Perder o menu e as abas é esperado, é o que o recurso faz; perder o corpo do resumo não é. |
| Uma unidade | Deixar o **tradutor** do Edge traduzir a página | A página continua utilizável. A busca não pode quebrar, porque ela consulta o índice do build e não o texto da tela. |
| Quiz | Responder algumas perguntas | O autopreenchimento do Edge não pode aparecer nos campos do quiz. |
| Site inteiro, nos dois temas | Ligar o **alto contraste** do Windows nos ajustes do sistema | Texto legível, foco visível, nenhum elemento sumindo. É o cenário de `forced-colors`, que nenhum navegador de Linux reproduz. |
| Uma unidade | Mandar **imprimir** e conferir a pré-visualização | Mesmo resultado do PDF do Chromium: sem menu, sem balão, com o apêndice "Dispositivos citados" no fim. |
| Qualquer página | Olhar os pesos da tipografia | O hinting do Windows difere do Linux. Título e negrito não podem ficar finos demais nem borrados. |
| Citação legal | Apontar uma citação | O balão abre, não empurra o texto e não sai da tela. |

**Passo 5:** desligar a VM. Deixá-la ligada segura 8 GiB.

### Lista de conferência no iPhone ou iPad, para o líder

[FATO] decisão do líder, 21/09/2026: ele tem o aparelho e confere quando pedirmos. Então isto deixa de ser pendência permanente e vira uma lista disparada no fechamento de cada onda.

Oito itens. Abrir o site no iPhone ou no iPad e conferir:

1. **Ler uma unidade inteira.** Rolar do começo ao fim de um resumo. O texto não pode ficar escondido atrás da barra do navegador quando ela aparece e some, e nada pode saltar de lugar durante a rolagem.
2. **Tocar numa citação de artigo.** Um toque abre uma faixa na parte de baixo da tela com o texto da lei. Tem que dar para ler sem aumentar o zoom, e tem que fechar tocando fora.
3. **Responder cinco perguntas do quiz e sair do site.** Voltar depois e conferir se as respostas continuam marcadas.
4. **Abrir o site sem internet.** Ligar o modo avião e abrir de novo uma unidade já visitada. Ela tem que abrir normalmente.
5. **Adicionar à Tela de Início** pelo menu de compartilhar do Safari, abrir por esse ícone e conferir se funciona igual. É isso que faz o progresso durar mais de uma semana.
6. **Abrir numa janela privada** e navegar. Tudo tem que funcionar, só o progresso é que não fica salvo. Nenhuma mensagem de erro pode aparecer.
7. **Mandar imprimir** uma unidade pelo menu de compartilhar. No fim tem que aparecer a lista "Dispositivos citados" com o texto das leis, e nenhum balão.
8. **Olhar a home por um minuto.** A animação do fundo não pode travar nem esquentar o aparelho. Depois ligar "Reduzir movimento" nos ajustes do sistema e conferir se ela para.

Se voltar de uma semana sem abrir e o progresso tiver zerado, **isso é o esperado**, é uma regra da Apple e não um defeito do site (seção 8).

### O que só a captura de tela prova (L-13)

Executado pelo `qa-engineer`, nunca pelo orquestrador nem pelo implementador, em ambiente isolado (L-50):

- Tema claro e tema escuro, em 360, 768 e 1440 px de largura.
- Menu de três níveis aberto em largura de telefone.
- Alinhamento entre trecho da peça e o comentário correspondente.
- O fundo animado da home, e o mesmo com `prefers-reduced-motion` ativo.
- A folha de impressão, como PDF gerado por Chromium headless (L-46), conferido página a página.
- Contraste medido no pixel, contra o fundo real de cada elemento (L-42), não estimado do token.

### Estática e gates

`tsc --noEmit`, `vue-tsc`, ESLint com `--max-warnings 0`, Prettier `--check`, `dependency-cruiser` com as quatro regras de camada, `verificar-fontes.sh`, `verificar-proibicoes.sh` (R3), e o piso de varredura do índice de busca. Cada gate nasce provado vermelho antes de ser aceito como verde (L-36).

`scripts/preci.sh` roda a mesma sequência que o CI, antes do push, no molde da seção T15.4 do manual.

---

## 15. Publicação

### Não indexar

[FATO] decisão do líder, 21/09/2026: não indexar. O site continua aberto a quem tem o link.

**Mecanismo, decidido em 21/09/2026 depois da nota técnica deste documento: só a marcação nas páginas, sem bloqueio no `robots.txt`.**

- `<meta name="robots" content="noindex, nofollow">` no `index.html`.
- `Header set X-Robots-Tag "noindex, nofollow"` no `.htaccess`, que cobre também os arquivos que não são HTML.
- **Nenhum `Disallow` no `robots.txt`.** Bloquear o rastreamento impediria o rastreador de buscar a página, e portanto de ler a marcação de não indexação, com o efeito conhecido de a URL acabar listada sem descrição a partir de um link de terceiro. Deixando o rastreador entrar, ele lê o `noindex` e não indexa, que é o que o líder quer.

Verificação: `curl -sI` traz o cabeçalho `X-Robots-Tag`, e o `index.html` servido contém a marcação. Entram como V9 e V10 na lista de verificação pós-envio.

### Do build ao servidor

1. `bash scripts/preci.sh` verde na máquina local.
2. `npm run build`. Gera `dist/`, já com `.htaccess`, manifest, ícones, service worker e `busca/indice.json`.
3. Conferência local, com `exit 1` em cada item antes de seguir:
   - `test -f dist/.htaccess`
   - `grep -rL 'data:font' dist/` não acha nada, ou seja, nenhuma fonte embutida sobrou
   - `bash scripts/verificar-proibicoes.sh dist/` (R3) sai zero
   - `node scripts/verificar-dispositivos.ts` sai zero, com `citações encontradas` maior que zero
   - a marcação `noindex` está presente no `index.html` construído
   - `npx vite preview` e abrir um deep link no navegador
4. Empacotar: `direito2026_YYYYMMDD_HHMMSS.zip` a partir do conteúdo de `dist/` (o zip contém os arquivos na raiz, não uma pasta `dist/` dentro).
5. Enviar (ver comparação abaixo).
6. Verificar no destino (lista adiante). Nenhum item é opcional.

### FTP contra API da Hostinger

Ordem de prioridade da L-75: MCP antes de API REST, API REST antes de SSH, SSH antes de CLI genérico.

| Canal | A favor | Contra |
|---|---|---|
| **MCP `hosting_deployStaticWebsite`** | Uma chamada, envia o zip e extrai no servidor. Não manipula credencial no shell. Primeiro na ordem da L-75. | A ferramenta resolve o usuário e o diretório **a partir do domínio**. O destino é um subdomínio cuja pasta é `/public_html/direito2026`. Se resolver para `/public_html` da conta, publica por cima do site principal. Não verificado. |
| **FTP com `lftp mirror -R --delete`** | Destino explícito no comando, envia só o que mudou, `--delete` limpa artefato velho de hash antigo. Credencial já existe na máquina (`HOSTINGER_FTP_TOKEN`). | Transferência não atômica: o site fica alguns segundos inconsistente. É CLI genérico, último na ordem da L-75. Arquivo que começa com ponto (`.htaccess`) é o que cliente de FTP mais esquece. |

**Recomendação:** tentar o MCP primeiro, **precedido de um teste de destino**. O teste é publicar um zip com um único `index.html` de uma linha contendo um marcador aleatório, e conferir por `curl` em qual dos dois endereços ele apareceu. Só depois de provado que grava dentro de `/public_html/direito2026` é que o site real vai por esse canal. Se gravar no lugar errado, cai-se para `lftp`, registra-se a limitação e não se insiste (L-51: resultado negativo honesto vale mais que improviso).

Em nenhum dos dois canais se usa `--delete` na primeira execução.

O valor de `HOSTINGER_FTP_TOKEN` e de `HOSTINGER_API_TOKEN` nunca é lido, impresso, logado nem passado em linha de comando visível.

### Verificação depois do envio

| # | Verificação | Prova o quê |
|---|---|---|
| V1 | `curl -sI https://direito2026.drpetrus.top/` responde 200 e `content-type: text/html` | O site subiu e está na raiz certa |
| V2 | `curl -sI https://direito2026.drpetrus.top/p/p1/intr-direito/u1/quiz` responde 200 | O `.htaccess` subiu e o rewrite funciona. 404 aqui significa que o plano B da seção 5 precisa entrar |
| V3 | `curl -s .../ \| grep -c 'Caderno de Direito'` maior que zero | O HTML entregue é o do build novo, não um cache |
| V4 | `curl -sI .../assets/<fonte>.woff2` responde 200 com `content-type: font/woff2` | As fontes subiram e o servidor sabe o tipo |
| V5 | `curl -s .../busca/indice.json \| wc -c` maior que um piso fixado antes | O índice subiu e não está vazio |
| V6 | `curl -s .../ \| bash scripts/verificar-proibicoes.sh -` sai zero | R3 valendo no ar, não só no repositório |
| V7 | Certificado válido, sem conteúdo misto, checado no console do navegador | HTTPS realmente fechado |
| V8 | Segundo carregamento com a rede desligada abre a unidade visitada | O service worker está ativo |
| V9 | `curl -sI .../` traz `X-Robots-Tag: noindex, nofollow` | O cabeçalho de não indexação subiu com o `.htaccess` |
| V10 | `curl -s .../ \| grep -c 'name="robots"'` maior que zero | A marcação de não indexação está no HTML servido |

V1 a V6, V9 e V10 são automatizáveis em `scripts/publicar.sh`, que termina com `exit 1` no primeiro que falhar. V7 e V8 são do `qa-engineer` em navegador real (L-13).

---

## 16. Dependências propostas

> **Autorização CONCEDIDA pelo líder em 21/09/2026** para o conjunto completo abaixo (L-51), com uma condição, que foi a que eu mesmo propus: **o Playwright aponta para o Brave já instalado e não baixa navegador** (L-57). O que isso custa em cobertura de motor está logo abaixo, no ponto de atenção.

### Vão para o navegador

| Pacote | Para que serve | Tamanho aprox. (comprimido) |
|---|---|---|
| `vue` 3.5+ | Framework de interface. Decisão do líder. | ~35 KB |
| `vue-router` 4 | Rotas e histórico do navegador. | ~10 KB |
| `minisearch` 7 | Busca no conteúdo, no navegador. | ~8 KB |
| `@floating-ui/dom` | **Condicional.** Posiciona o balão de citação só nos motores sem `@position-try` completo. Importado dinamicamente no ramo do contorno, então quem tem suporte nativo não baixa. | ~6 KB, e **0 KB** em navegador com suporte completo |

Total de biblioteca em runtime: abaixo de 55 KB comprimidos, antes do código do site.

### Só no build, não vão para o navegador

| Pacote | Para que serve |
|---|---|
| `vite` 7, `@vitejs/plugin-vue` | Empacotador e suporte a componentes Vue |
| `typescript` 5, `vue-tsc` | Tipos e checagem de tipo em componentes |
| `vite-plugin-pwa` (traz Workbox) | Gera o service worker do modo offline |
| `@fontsource-variable/inter`, `@fontsource/lora` | Arquivos de fonte para self-host, sem CDN |
| `vitest`, `@vue/test-utils`, `jsdom` | Testes unitários e de componente |
| `@playwright/test`, `@axe-core/playwright` | Ponta a ponta e acessibilidade automatizada |
| `eslint`, `eslint-plugin-vue`, `@typescript-eslint/*`, `prettier` | Padrão de código |
| `dependency-cruiser` | Gate das quatro camadas (seção 2) |
| `fonttools` (Python, `pyftsubset`) | Recorte das fontes. **Fora do npm.** Dispensável se a alternativa da seção 10 for aceita |

### Existem só por compatibilidade

Resposta curta: **quase nenhuma, e nenhuma em runtime.** O alvo são as versões atuais de quatro navegadores, não navegador antigo, então não há polyfill a carregar.

| Item | Existe só por compatibilidade? | É mesmo necessário? |
|---|---|---|
| `browserslist` (campo no `package.json`, não é pacote) | Sim | **Sim.** É de onde o Vite tira o alvo de transpilação e o prefixo de CSS. Sem ele, cada ferramenta adota um alvo diferente por conta própria. Custo zero: é uma lista no `package.json`. |
| Prefixação de CSS a partir do `browserslist` | Sim | **Sim, mas sem pacote novo.** O Vite 7 faz isso com Lightning CSS ligando `css.transformer`. Só se medir que falta alguma coisa é que entram `postcss` e `autoprefixer`, e aí com a medição por escrito. Decidir na onda 0, medindo, não supondo. |
| `@vitejs/plugin-legacy` mais `core-js` | Sim | **Não. Descartar.** Serve para navegador antigo, que não está no alvo. Traria um segundo bundle e um `<script nomodule>` para ninguém. |
| Qualquer polyfill avulso | Sim | **Não, por ora.** Só entra com o recurso nomeado, a versão de navegador que falta e a medição junto. Polyfill preventivo é peso permanente para um problema hipotético. |
| Navegador WebKit do Playwright | Sim | **Sim, e não foi autorizado.** Ver o ponto de atenção logo abaixo. |
| `@floating-ui/dom` | Sim, é contorno de `@position-try` | **Sim, enquanto o `@position-try` do Safari não estiver no alvo inteiro.** É a única dependência de runtime que existe puramente por compatibilidade, custa 0 KB para quem não precisa dela, e sai do projeto no dia em que o guia registrar suporte completo nos quatro. Marcar para reavaliação a cada revisão do guia. |

**Ponto de atenção para o Playwright, agora resolvido e com a consequência assumida.** O Playwright aponta por `executablePath` para o `chromium-browser` ou o `brave-browser` já instalados, e **nenhum binário de navegador é baixado**.

O que isso custa, dito de frente: o Playwright não sabe dirigir o Firefox de distribuição (usa compilação própria), e não há nada com WebKit instalado nesta máquina. Então o portão automático é **Blink e só Blink**. Gecko vira passada manual no Firefox instalado; WebKit não tem cobertura automatizada nenhuma. O inventário medido, o raciocínio completo e a regra de relato estão na seção 14.

### Veredicto sobre as bibliotecas que o líder listou

| Biblioteca | Veredicto | Motivo em uma linha |
|---|---|---|
| p5.js | Descartar | Framework de sketch na casa de 1 MB para uma animação de fundo que a API Canvas nativa resolve em poucas dezenas de linhas. |
| SVG | **Usar** | Nativo, sem dependência, ícones e marca inline com `currentColor` seguindo o tema automaticamente. |
| canvas | **Usar** | É a escolha certa para o fundo animado da home, com quadro estático sob `prefers-reduced-motion`. |
| anime.js | Descartar na onda 1 | A v4 é ESM e enxuta, mas as transições do Vue mais CSS cobrem o que um desenho sóbrio pede; reavaliar se o design pedir coreografia. |
| AOS | Descartar | `IntersectionObserver` nativo mais uma classe CSS fazem o mesmo, sem a biblioteca e sem o CSS extra dela. |
| fullPage.js | Descartar | Sequestra a rolagem, o que é ruim em página de leitura longa e com leitor de tela, e o uso comercial é licenciado. |
| popper.js (hoje Floating UI) | **Entra, condicionalmente.** Decisão anterior revista. | A condição que eu mesmo escrevi ("só entra se aparecer um tooltip ancorado de termo jurídico") foi acionada pelo requisito do balão de citação. Entra só como contorno de `@position-try`, por importação dinâmica, e não é baixado por quem tem suporte nativo. |
| vue.js | **Usar** | Decisão 1 do líder. |
| webix | Descartar | Framework de UI comercial e pesado, com estética própria que briga com "jurídico moderno sóbrio" e com o Vue. |

---

## 17. Fatiamento em ondas

Toda onda fecha pelos quatro tempos da L-24 (commit por fatia, push para branch, tudo verde, então merge). **O critério de fechamento é o escrito aqui, não o verde do CI** (L-24, emenda de 08/09/2026). Nenhuma onda começa antes da anterior fechar.

### Onda 0: fundação

Repositório, Vite mais Vue mais TypeScript, as quatro pastas de camada, `dependency-cruiser` com as quatro regras, ESLint, Prettier, `tsc`, Vitest, `preci.sh`, `README.md` como hub, `.htaccess`, tokens de tema vindos do documento de design visual, fontes recortadas, **`browserslist` e o alvo de build fixados a partir do guia de compatibilidade** (seção 13), `robots.txt` e a marcação `noindex`, e os dois portões de conteúdo (`verificar-proibicoes.sh` e `verificar-dispositivos.ts`).

**Fechamento:** `preci.sh` verde; gate de camadas demonstrado vermelho contra um import proibido e depois verde; `npm run build` produz `dist/` com `.htaccess` presente e sem nenhuma ocorrência de `data:font`; tamanho real de cada `.woff2` medido e registrado no `README.md`; `browserslist` escrito e a decisão sobre prefixação de CSS tomada **com a medição anexa**, não por suposição; **os dois portões de conteúdo provados vermelhos e depois verdes**, cada um no seu commit de estreia.

### Onda 1: home e unidade piloto

Currículo com os 10 períodos (só o primeiro com cadeira real, o resto `em-breve`), roteamento com as sete rotas, `MenuCurriculo` acessível de três níveis, `AlternadorTema`, home com `FundoAnimado`, a unidade piloto inteira nas três abas (9 blocos, peça em 6 seções, quiz de 60 perguntas), progresso no navegador, **balão de citação legal com o subconjunto de dispositivos da unidade e o apêndice de impressão (seção 12)**, folha de impressão, primeira publicação no destino.

**Fechamento:** as sete rotas abrem por deep link em `vite preview` e no ar; unitários, de componente e e2e verdes; axe sem violação `serious` nem `critical` nas três páginas; screenshots do `qa-engineer` aprovados nos dois temas e nas três larguras; PDF de impressão conferido; as oito verificações V1 a V8 da seção 15 passando; `verificar-proibicoes.sh` verde no `dist/` e na resposta do servidor; **portão automático verde em Blink, passada manual no Firefox registrada com data, roteiro do Windows executado na máquina virtual com data, WebKit de computador declarado como não verificado nesta máquina, e a lista de oito itens conferida pelo líder no iPhone ou iPad** (seção 14); todo `data-dispositivo` do piloto resolvido pelo portão, e o balão conferido nos dois caminhos de posicionamento, inclusive com `CSS.supports` forçado a falso.

### Onda 2: busca e offline

`gerar-indice-busca.ts` com o piso de varredura, `CampoBusca`, `PainelResultadosBusca`, `vite-plugin-pwa`, aviso de nova versão.

**Fechamento:** buscar sem acento encontra o termo acentuado, provado por e2e; o script reprova com `exit 1` quando forçado a indexar zero documento; segundo carregamento com a rede desligada abre a unidade visitada; tamanho real do índice medido e comparado com o teto de 300 KB fixado na seção 7; busca sem acento verde também no WebKit; e o offline conferido em iPhone real depois de "Adicionar à Tela de Início".

### Onda 3: escala do conteúdo

Ferramenta de conversão de um HTML antigo para os quatro arquivos de dados de uma unidade, mais duas ou três unidades reais convertidas. Primeira oportunidade real de aplicar a regra de 3 (L-33): o que doer na terceira repetição vira abstração, com a razão de mudança comum escrita.

**Fechamento:** três unidades publicadas e navegáveis; nenhuma abstração extraída antes da terceira ocorrência; tempo de build e tamanho do índice medidos e registrados; a ferramenta de conversão coberta por teste com um HTML de exemplo.

### Onda 4: currículo completo e acabamento

Todas as cadeiras dos dez períodos cadastradas, com `em-breve` onde não há material; páginas de período e de cadeira; página 404; `sitemap.xml`; metadados de compartilhamento sem nome de pessoa nem de instituição.

**Fechamento:** todo item do menu leva a uma página que existe (varredura automatizada de rota morta, com piso não vazio); Lighthouse medido e registrado; nenhuma URL contém nome de pessoa nem de instituição.

---

## 18. Riscos e pendências

### Riscos

| # | Risco | Mitigação |
|---|---|---|
| RI1 | O MCP da Hostinger publica na raiz da conta em vez da pasta do subdomínio, sobrescrevendo outro site. | Teste de destino com `index.html` de uma linha e marcador aleatório, antes de qualquer publicação real (seção 15). |
| RI2 | O `.htaccess` não sobe (arquivo oculto) ou o host ignora `AllowOverride`, e todo deep link dá 404. | V2 detecta na primeira publicação. Plano B já desenhado: `404.html` cópia do `index.html` (seção 5). |
| RI3 | Service worker mal configurado prende o leitor numa versão velha. | `registerType: 'prompt'`, `no-cache` em `index.html` e `sw.js`, e procedimento de limpeza documentado no runbook. |
| RI4 | Converter cada HTML antigo à mão não escala e erra acento e aspas tipográficas. | A onda 3 constrói a ferramenta de conversão em vez de repetir o trabalho manual. |
| RI5 | `v-html` deixa de receber só conteúdo próprio e vira injeção de script. | Regra escrita mais gate ESLint que reprova `v-html` ligado a expressão que não venha de `src/conteudo/` (seção 4.4). |
| RI6 | O índice de busca cresce com o currículo e vira um download pesado. | Teto de 300 KB comprimido fixado antes de existir a medição; ultrapassado, fatia por período; ultrapassado de novo, migra para Pagefind atrás da interface `MotorBusca`. |
| RI7 | `localStorage` bloqueado apaga o progresso sem o leitor entender por quê. | Fallback em memória com a mesma interface, coberto por teste de componente com mock que lança. |
| RI8 | R3 é violada por descuido num commit futuro (comentário, metadado, nome de pasta). | `verificar-proibicoes.sh` no pré-CI, no CI e na verificação pós-publicação, com `exit 1` e piso de varredura não vazio. |
| RI9 | O progresso some no iPhone depois de 7 dias sem uso e o leitor conclui que o site é defeituoso. | Nenhum conteúdo atrás do progresso, estado zero renderizado como estado válido, promessa do rodapé limitada ao que o sistema garante, exportar e importar progresso na onda 3, e convite a "Adicionar à Tela de Início" (seção 8). |
| RI10 | Verde no automático é confundido com prova de que funciona no iPhone. | O automático hoje é só Blink, e está escrito na seção 14 que nem WebKit nem Gecko entram nele. A lista de oito itens do líder, no aparelho dele, é o que prova iOS, e é disparada no fechamento de cada onda. Nenhum relato de onda pode dizer "três motores verdes". |
| RI11 | Um contorno de WebKit aparece tarde e obriga a redesenhar uma decisão já implementada. | R9 é restrição desde a seção 1, a tabela da seção 13 já mapeia as dez decisões que encostam no motor, e o guia de compatibilidade é leitura obrigatória antes da primeira linha de código. |
| RI12 | O texto de um artigo no catálogo envelhece: a lei muda e o balão passa a ensinar redação revogada. | Revisão a cada seis meses e a cada conteúdo novo publicado, decidida pelo líder (seção 12.7). O balão sempre exibe a data da consulta e o link da fonte, e a nota de alteração aparece acima da redação quando existe. |
| RI13 | WebKit não tem nenhuma cobertura automatizada, e é o motor de maior risco deste projeto. | Não há contorno técnico nesta máquina: Safari não existe para Linux, instalar navegador é vedado (L-57) e baixar binário do Playwright também. O que resta é honestidade de processo: a limitação está escrita na seção 14, a lista do líder cobre WebKit móvel no fechamento de cada onda, WebKit de computador fica com os usuários, e nenhum fechamento pode arredondar isso para cima. A máquina virtual de Windows resolve Edge e o que é próprio do Windows, e **não** resolve WebKit. |
| RI14 | A VM de Windows pode estar com a instalação incompleta ou sem o Edge, e o roteiro depender dela sem que ninguém tenha conferido. | O passo 1 do roteiro da seção 14 é justamente confirmar isso, e está escrito como verificação pendente, não como fato. Se o Edge não estiver lá, o roteiro para e o achado é reportado, sem instalar nada para contornar. |

### Decisões do líder, 21/09/2026

Registradas como fecho das pendências que este documento havia levantado. Não se reabrem.

| Era | Decisão | Onde já está no plano |
|---|---|---|
| P1, nome do professor | A palavra `professor` entra no lugar do nome próprio. As partes da petição são fictícias e ficam. | R3 e "O que R3 implica", seção 1 |
| P1, nome da instituição | A palavra `faculdade` entra no lugar. Vale para metadado, título, comentário de código e nome de arquivo, com portão automático provado vermelho. | R3 e "O que R3 implica", seção 1 |
| P2, buscadores | Não indexar: `robots.txt` bloqueando tudo mais marcação `noindex`. Site segue aberto a quem tem o link. | "Não indexar", seção 15 |
| P3, instalação | Autorizado o conjunto completo de dependências, com o Playwright apontando para o Brave já instalado, sem baixar navegador. | Seção 16, com a consequência de cobertura explicitada |
| P4, rodapé | Nome do site, ano, e aviso de material de estudo sem valor oficial. Sem autoria, sem instituição, sem contato. | Componente `Rodape`, seção 6 |
| P5 e P6, endereço | Permanece como está. O nome no domínio é escolha do líder e não entra na proibição, que vale para o conteúdo das páginas. | Nenhuma mudança necessária |

### Pendências abertas

**Nenhuma.** PA1, PA2 e PA3 foram decididas pelo líder em 21/09/2026 e estão incorporadas: a lista de conferência no aparelho dele (seção 14), a cobertura de motor limitada a Blink no automático (seção 14) e a cadência de seis meses do catálogo (seção 12.7).

Fica no lugar delas **uma limitação declarada, que não é pendência porque não há decisão a tomar**: WebKit e Gecko não têm cobertura automatizada nesta máquina, e isso só muda se a proibição de baixar binário de navegador mudar. Enquanto valer, todo relato de fechamento de onda nomeia os três motores separadamente, com o estado real de cada um.

## Referências consultadas

- [Different History modes, Vue Router](https://router.vuejs.org/guide/essentials/history-mode.html)
- [Search for Static Sites: Client-Side Indexes That Cost Nothing Per Query](https://johal.in/static-site-search-options-guide)
- [flexsearch vs minisearch (2026), devpick](https://devpick.co/flexsearch-vs-minisearch)
- [Vite Plugin PWA, generateSW](https://vite-pwa-org.netlify.app/workbox/generate-sw)
- [vite-plugin-pwa, issue 243: woff2 em assets não é cacheado](https://github.com/vite-pwa/vite-plugin-pwa/issues/243)
- [Best JavaScript Scroll Animation Libraries 2026](https://cssauthor.com/best-javascript-scroll-animation-scrollytelling-libraries/)
- [Apple adds a 7-Day Cap on All Script-Writable Storage](https://support.didomi.io/apple-adds-a-7-day-cap-on-all-script-writable-storage)
- [Apple cops flak for deleting local browser storage after 7 days, iTnews](https://www.itnews.com.au/news/apple-cops-flak-for-deleting-local-browser-storage-after-7-days-539833)
- [iOS Safari, limite de `history.pushState`, Apple Developer Forums](https://developer.apple.com/forums/thread/71510)

As duas últimas sustentam apenas as afirmações das seções 8 e 5 sobre WebKit. A pesquisa ampla de compatibilidade é do guia irmão, não deste documento.
