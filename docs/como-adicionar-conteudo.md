# Como adicionar conteúdo ao site

> **Tipo:** how-to (Diátaxis). **Para quem:** o líder, que é iniciante em programação, e os agentes que escrevem texto. **Dono:** o líder. **Última revisão:** 2026-10-20.
>
> Para entender por que as pastas viram o currículo, veja [arquitetura.md](arquitetura.md), seção 4.1.1.

## Antes de começar

1. Abra o terminal na pasta do projeto, a que tem o arquivo `package.json`.
2. Instale as dependências uma vez, com `npm install`.
3. Regra de ouro: cada pasta se descreve. Período é a pasta `p1`, cadeira é a pasta `intr-direito` e unidade é a pasta `u1`. Não existe lista central para editar.

## Estado atual: leia antes de acrescentar

A estrutura gera os arquivos certos, mas hoje o `npm run preci` reprova depois de criar uma unidade ou uma cadeira nova, mesmo sem texto. Medido em 2026-10-20 com uma unidade `em-breve` criada e sem texto:

- `tests/caracterizacao/`: 2 testes reprovam (`carregadores.spec.ts` e `curriculo.spec.ts`). As referências `*.esperado.json` não têm comando de atualização; a mudança é manual.
- `tests/unidade/`: 3 testes reprovam em 2 arquivos. Um deles (`curriculo.atalhoInterdisciplinar.spec.ts`) tem a Unidade 1 de Introdução ao Direito escrita à mão.

Com uma cadeira nova, 3 testes reprovam, um em cada arquivo: `carregamento.registrosCompletos.spec.ts`, `carregadores.spec.ts` e `curriculo.spec.ts`. O efeito de criar um período novo não foi medido.

Quando isso acontecer, pare e leve a mensagem de erro a um programador. A seção 9 explica quando isso é preciso.

Estas travas funcionam: `scripts/validar-conteudo.ts` pega erro de texto e de quiz, e `scripts/verificar-proibicoes.sh` pega nome proibido (ele roda no `preci`).

Estas coisas não são pegas por nenhuma trava, e você precisa conferir à mão:

- travessão (o traço longo): nenhuma trava de conteúdo público reprova;
- o texto de exemplo `A escrever antes da publicação.` em `meta.ts`: passa na validação;
- o aviso legal: a trava de texto não lê o arquivo `avisoLegal.ts`.

## 1. Nova unidade numa cadeira existente

Troque `p1`, `intr-direito`, `u2` e o título pelos seus:

```bash
npm run nova-unidade -- p1 intr-direito u2 "Título da unidade"
```

Acrescente `--peticao` no fim se a unidade tiver peça comentada.

O comando cria a pasta `src/conteudo/p1/intr-direito/u2/` com estes arquivos:

| Arquivo | O que preencher |
|---|---|
| `meta.ts` | `descricao`: troque o texto de exemplo. Confira `titulo` e `subtitulo`. |
| `resumo.ts` | Blocos do resumo: `id` (`bloco-0`, `bloco-1`...), `numero`, `titulo` (sem "Bloco N"), `fonte`, `corpoHtml`, `resumo` (itens curtos) e `exemploHtml`. |
| `mapaFichamento.ts` | `eras` e `pensadores`. Cada pensador aponta para um bloco que existe, em `blocoResumo`. |
| `mnemonicos.ts` | Lista de mnemônicos: `id`, `titulo`, `tecnica` (uma de: `associacao`, `imagem`, `frase`, `acronimo`, `loci`, `chunking`), `dica`, `desafio`, `guarda`, `comoFunciona` e `blocoResumo`. |
| `quiz/index.ts` | Perguntas (veja a seção 4). |
| `peticao.ts` | Só com `--peticao`: `titulo`, `notaHtml` e `secoes`. |

Para publicar, troque `estado: 'em-breve'` por `estado: 'publicado'` em `meta.ts`. Faça isso só quando o resumo, o mapa, o fichamento, os mnemônicos e o quiz tiverem texto. Se a cadeira ainda estiver `em-breve`, troque também em `cadeira.ts`.

Para conferir:

```bash
node --import tsx scripts/validar-conteudo.ts
npx vue-tsc --noEmit
npx prettier --write src/conteudo/p1/intr-direito/u2
npm run preci
```

O validador termina com uma linha `encontradas=N validadas=N falharam=0` e sai sem erro. O `N` é o número de unidades do projeto.

## 2. Nova cadeira

```bash
npm run nova-unidade -- p1 cadeira-nova u1 "Título da unidade" --cadeira "Nome da cadeira"
```

- O nome da pasta (`cadeira-nova`) tem só letras minúsculas, números e hífen, sem acento. Ele aparece na URL.
- O comando cria `cadeira.ts` com `nome`, `ordem` (a próxima livre) e `estado: 'em-breve'`, e cria a unidade `u1`.
- Para mudar a posição no menu, edite `ordem` em `cadeira.ts`. Número menor aparece antes. Dois números iguais no mesmo período fazem os testes do currículo reprovar.
- Para publicar a cadeira, troque o `estado` de `cadeira.ts` para `'publicado'`, quando pelo menos uma unidade estiver publicada.
- Para o atalho Interdisciplinar, copie este bloco para o `cadeira.ts` da cadeira. O exemplo completo está em `src/conteudo/p1/intr-direito/cadeira.ts`. `apos` é o id da unidade depois da qual o atalho aparece:

```ts
  atalhoUnidade: {
    rotulo: 'Interdisciplinar',
    apos: 'u1',
    cadeiraId: 'interdisciplinar'
  }
```

A cadeira Interdisciplinar não tem unidade no repositório. O conteúdo dela fica no servidor, atrás do login. Não crie pasta de unidade para ela.

## 3. Novo período

```bash
npm run nova-unidade -- p2 cadeira-x u1 "Título da unidade" --cadeira "Nome da cadeira"
```

- A pasta `p2` é criada sozinha. Os períodos vão de `p1` a `p10`.
- Períodos sem pasta aparecem no site como "em breve". Não há nada para cadastrar.
- O efeito sobre o `preci` é o mesmo descrito no começo deste guia, mas não foi medido para período novo.

## 4. Mais perguntas de quiz

Abra o `quiz/index.ts` da unidade. Se a unidade usa o arquivo único `quiz.ts`, edite esse. Nunca use os dois ao mesmo tempo. Acrescente a pergunta dentro da lista. Este é o modelo de múltipla escolha, para colar dentro da lista:

```ts
{
  id: 7,
  categoria: 'teoria',
  enunciadoHtml: '<p>Qual afirmação descreve corretamente o conceito?</p>',
  alternativasHtml: [
    'Afirmação que confunde o conceito.',
    'Afirmação que troca o sentido do termo.',
    'Definição que descreve o conceito.',
    'Afirmação sobre outro tema.'
  ],
  correta: 2,
  fonteExtra: false,
  explicacaoHtml: '<p>A definição correta é a que descreve o conceito sem mudar o seu sentido.</p>'
},
```

Regras:

- Use 4 ou 5 alternativas. Escolha uma quantidade e use a mesma em todo o quiz. Não misture.
- `correta` é o número da alternativa certa, começando em 0, na ordem em que você escreveu. O site embaralha as alternativas a cada rodada. Por isso a explicação nunca aponta letra nem posição.
- Pergunta de verdadeiro ou falso: use `tipo: 'verdadeiro-ou-falso'` e `correta: true` ou `correta: false`. Não coloque `alternativasHtml`.
- O `id` precisa ser único dentro do quiz.
- A categoria precisa de rótulo em `src/conteudo/quiz/categorias.ts`. Para criar uma categoria nova, acrescente uma linha ali com o nome que o aluno vê, por exemplo `'nova-categoria': 'Nome para o aluno',`.
- `origem: 'professor'` (pergunta do simulado do professor) e `gabaritoDoCaderno: true` (resposta tirada do caderno de estudo) liberam só o enunciado e as alternativas da regra de aula e slide. A explicação nunca é liberada. Use só nesses dois casos.

Para conferir: `node --import tsx scripts/validar-conteudo.ts`.

## 5. Provas, feriados e prazos no calendário

Os dados ficam em `src/conteudo/calendario/`:

| Arquivo | Lista | Formato de cada item |
|---|---|---|
| `provas.ts` | `PROVAS` | `{ semestre, data, cadeiraId, tipo }` |
| `provas.ts` | `PERIODOS_ONLINE` | evento (formato abaixo) |
| `provas.ts` | `PRAZOS` | `{ semestre, data, descricao }` |
| `feriados.ts` | `FERIADOS` | evento |
| `calendarioAcademico.ts` | `EVENTOS_ACADEMICOS` | evento |
| `calendarioAcademico.ts` | `OBSERVACOES_ACADEMICAS` | `{ semestre, texto }` |

Campos:

- `semestre`: obrigatório em todo item, no formato `2026.1` ou `2026.2`.
- Datas: `AAAA-MM-DD`, por exemplo `'2026-09-22'`.
- Prova: `cadeiraId` é o nome da pasta da cadeira (`'intr-direito'`), não o nome por extenso. `tipo` é um de: `AV1`, `AV2`, `AV3`, `chamada`, `final`.
- Evento: `inicio` e `fim` (iguais quando dura um dia), `categoria`, `titulo` e `descricao`. Categorias aceitas: `AV1`, `AV2`, `AV3`, `chamada`, `final`, `online`, `feriado`, `prazo`, `semestre`.
- Prazo: o contador escreve "Faltam N dias para" seguido de `descricao`.

Exemplo de prova:

```ts
{ semestre: '2026.2', data: '2026-11-24', cadeiraId: 'intr-direito', tipo: 'AV3' },
```

Estas regras rodam nos testes, não no `validar-conteudo`. Para conferir, rode `npm run test:unit`. As mensagens de erro têm a forma `provas[N]: cadeiraId desconhecido "..."`, `prova duplicada`, `data inválida`, `fim (...) antes do início (...)` e `categoria desconhecida`.

Uma categoria de evento nova não cabe no dado. Ela exige código (seção 9).

## 6. Aviso legal

O arquivo é `src/conteudo/avisoLegal.ts`, com `rotulo` e `corpo`. O texto foi aprovado pelo líder e é usado exatamente como está.

Para mudar o texto:

1. o líder aprova o texto novo;
2. você troca o texto em `avisoLegal.ts`;
3. no mesmo commit, você atualiza a redação guardada em `tests/unidade/conteudo.avisoLegal.spec.ts`.

Atenção: o texto atual tem a expressão "o material", que as regras de texto proíbem nas unidades. Como o arquivo está fora do validador, ele passa. Esse ponto é uma decisão do líder, pendente.

## 7. Regras de texto e o que a trava reprova

A trava é `scripts/validar-conteudo.ts`. Ela lê todas as unidades e imprime cada problema assim:

```
FALHA p1/intr-direito/u2 resumo[0].corpoHtml [texto-proibido] trecho proibido: "aula"
```

A forma é `FALHA <unidade> <caminho> [<regra>] <detalhe>`. Quando falha, a última linha é `encontradas=N validadas=N falharam=M`, com `M` maior que zero, e o comando sai com erro. Corrija a linha indicada pelo caminho.

| Regra do líder | Regra técnica | Quem reprova |
|---|---|---|
| Nada de "aula", "aulas", "slide", "slides", "atividade de" seguido de número | `texto-proibido` | `validar-conteudo` |
| Nada de "o material" e variações ("no material", "do material", "segundo o material") nem "vale conferir" | `texto-proibido` | `validar-conteudo` |
| Fonte sem aula e sem data. A fonte genérica permitida é `Material de aula da disciplina.` | `fonte-proibida` | `validar-conteudo` |
| Explicação sem "alternativa B", "letra C", "primeira opção" e sem "acima" ou "abaixo" para apontar a resposta | `citacao-de-alternativa` | `validar-conteudo` |
| Quiz com 4 ou 5 alternativas, sempre a mesma quantidade | `alternativas`, `alternativas-homogeneas` | `validar-conteudo` |
| `correta` dentro da lista de alternativas | `correta` | `validar-conteudo` |
| `id` único no quiz | `ids-unicos` | `validar-conteudo` |
| Categoria com rótulo em `quiz/categorias.ts` | `categoria-sem-rotulo` | `validar-conteudo` |
| Mapa e mnemônicos apontando para um bloco que existe | `referencia-de-ficha` | `validar-conteudo` |
| Título de bloco sem "Bloco N" | `titulo-com-numero-de-bloco` | `validar-conteudo` |
| Fonte não repetida no corpo do bloco | `fonte-repetida-no-corpo` | `validar-conteudo` |
| Campo de `meta.ts` com texto | `vazio` | `validar-conteudo` |
| Nome de pessoa da turma, do professor ou da instituição | `PROIBIÇÃO ENCONTRADA: <termo> em <arquivo>` | `verificar-proibicoes.sh` (no `preci`) |

O verificador de nomes lê uma lista de termos guardada fora do repositório. Se faltar essa lista, ele falha de propósito. A mensagem mostra o termo encontrado. Quando aparecer, tire o nome do arquivo.

Não reprovados pela trava, e que você confere à mão:

- travessão (o traço longo): use vírgula, dois-pontos ou hífen comum;
- o texto `A escrever antes da publicação.` em `meta.ts`: troque antes de publicar;
- o aviso legal, que a trava de texto não lê.

## 8. O que não precisa mais ser tocado

- Carregadores (`src/app/carregamento/`): descobrem as unidades pelas pastas.
- Currículo (`src/conteudo/curriculo.ts`): é montado a partir das pastas. Não edite.
- Rotas, menu, home e busca: seguem sozinhos.
- `dispositivos.ts`: é gerado no build e está no `.gitignore`. Não crie nem edite.
- Cache do service worker: os pedaços de conteúdo saem como `conteudo-*.js`, com hash, no build.
- Testes de conteúdo (`tests/unidade/conteudo.*`): varrem todas as unidades sozinhos.

Os itens de "Estado atual" continuam pedindo ajuste de programador.

## 9. Quando a estrutura básica precisa de programador

Leve ao programador, ou a um agente de programação, quando:

- o `preci` reprovar por caracterização ou por teste de unidade depois de criar unidade ou cadeira;
- for preciso um tipo de bloco novo, uma aba nova ou um campo novo na unidade;
- for preciso uma categoria nova de evento no calendário, porque a lista é fechada e cada categoria precisa de rótulo no código;
- for preciso mudar uma regra de texto em `src/core/conteudo/regrasDeTexto.ts`;
- for preciso mudar menu, layout, cores ou rotas;
- for preciso mexer na área restrita, nos termos proibidos ou no cache.

Para agentes: leia este roteiro e `src/core/conteudo/regrasDeTexto.ts` antes de editar. Não mude tipos para acomodar um texto. Não crie `dispositivos.ts`.

## 10. Antes do commit

- Rode `npm run preci`. Hoje ele reprova em caso de unidade ou cadeira nova (veja "Estado atual").
- Faça o commit em Conventional Commits, por exemplo `feat(conteudo): unidade 2 de Introdução ao Direito`.
- Não envie para o GitHub sem combinar com o líder.
- Para publicar no servidor, veja [publicacao.md](publicacao.md).
