# Como adicionar conteúdo ao site

> **Tipo:** how-to (Diátaxis). **Para quem:** o líder, que é iniciante em programação, e os agentes que escrevem texto. **Dono:** o líder. **Última revisão:** 2026-10-20 (F9).
>
> Para entender por que as pastas viram o currículo, veja [arquitetura.md](arquitetura.md), seção 4.1.1.

## Antes de começar

1. Abra o terminal na pasta do projeto, a que tem o arquivo `package.json`.
2. Instale as dependências uma vez, com `npm install`.
3. Regra de ouro: cada pasta se descreve. Período é a pasta `p1`, cadeira é a pasta `intr-direito` e unidade é a pasta `u1`. Não existe lista central para editar.
4. Regra do passo a passo: sempre que você acrescentar conteúdo (unidade, cadeira, período ou pergunta), rode `npm run atualizar-referencias` antes do `npm run preci`. Veja a seção 10.

## Estado atual: o que mudou com a F9

Desde 2026-10-20 acrescentar conteúdo não exige mais mexer em código de teste. O único passo novo é `npm run atualizar-referencias`, que regrava a caracterização (os arquivos `tests/caracterizacao/*.esperado.json`) e mostra o que mudou. Confira que o resumo mostra só o que você acrescentou e commite junto com o conteúdo.

Medido em 2026-10-20, numa cópia do repositório, com estes três casos seguidos de `npm run atualizar-referencias`:

- unidade `em-breve` nova numa cadeira existente (`p1/sociologia-juridica/u3`);
- cadeira `em-breve` nova com uma unidade (`p1/direito-teste`);
- período novo com uma cadeira e uma unidade (`p2`).

Nos três, os testes de `tests/caracterizacao`, `tests/unidade` e `tests/componente` ficaram verdes, `npx vue-tsc --noEmit` saiu com 0 e `node --import tsx scripts/validar-conteudo.ts` saiu com 0.

Ainda não cobertas (lacunas conhecidas, registradas no `TODO.md`, na INBOX):

- **Contagem fixa de perguntas.** `tests/unidade/conteudo.quizzes.spec.ts` (Filosofia Jurídica, 1ª unidade) e `tests/componente/CartaoPergunta.marcacao.spec.ts` (Introdução ao Direito, 1ª unidade) conferem o número exato de perguntas. Acrescentar pergunta a essas duas unidades quebra a contagem. Pergunta nova em qualquer outra unidade não quebra.
- **Lista exata do calendário.** `tests/unidade/calendario.dadosDoSemestre.spec.ts` confere, com lista fixa, os feriados, prazos e períodos online do semestre 2026.2. Acrescentar item nesse semestre pode quebrar esse teste.
- **Atalho Interdisciplinar só no 1º período.** O teste do atalho confere as cadeiras do 1º período, onde mora a cadeira restrita Interdisciplinar. Uma cadeira de outro período não é conferida por ele.

Quando um teste reprovar e o resumo do `atualizar-referencias` não explicar a mudança, pare e leve a mensagem de erro a um programador. A seção 9 explica quando isso é preciso.

Estas travas funcionam e rodam sozinhas:

- `scripts/validar-conteudo.ts` pega erro de texto, de quiz, travessão e texto de espera em unidade publicada (seção 7);
- `scripts/verificar-proibicoes.sh` pega nome proibido (ele roda no `preci`).

## 1. Nova unidade numa cadeira existente

Troque `p1`, `intr-direito`, `u2` e o título pelos seus:

```bash
npm run nova-unidade -- p1 intr-direito u2 "Título da unidade"
```

Acrescente `--peticao` no fim se a unidade tiver peça comentada.

O comando cria a pasta `src/conteudo/p1/intr-direito/u2/` com estes arquivos:

| Arquivo | O que preencher |
|---|---|
| `meta.ts` | `descricao`: troque o texto de espera. Confira `titulo` e `subtitulo`. |
| `resumo.ts` | Blocos do resumo: `id` (`bloco-0`, `bloco-1`...), `numero`, `titulo` (sem "Bloco N"), `fonte`, `corpoHtml`, `resumo` (itens curtos) e `exemploHtml`. |
| `mapaFichamento.ts` | `eras` e `pensadores`. Cada pensador aponta para um bloco que existe, em `blocoResumo`. |
| `mnemonicos.ts` | Lista de mnemônicos: `id`, `titulo`, `tecnica` (uma de: `associacao`, `imagem`, `frase`, `acronimo`, `loci`, `chunking`), `dica`, `desafio`, `guarda`, `comoFunciona` e `blocoResumo`. |
| `quiz/index.ts` | Perguntas (veja a seção 4). |
| `peticao.ts` | Só com `--peticao`: `titulo`, `notaHtml` e `secoes`. |

Os modelos trazem `descricao` e `notaHtml` com um texto de espera (`A escrever antes da publicação.` e `A escrever.`). Ele é válido enquanto a unidade está `em-breve`, e reprova quando a unidade é publicada: troque o texto antes de publicar.

Para publicar, troque `estado: 'em-breve'` por `estado: 'publicado'` em `meta.ts`. Faça isso só quando o resumo, o mapa, o fichamento, os mnemônicos e o quiz tiverem texto. Se a cadeira ainda estiver `em-breve`, troque também em `cadeira.ts`.

Para conferir, nesta ordem:

```bash
node --import tsx scripts/validar-conteudo.ts
npx vue-tsc --noEmit
npx prettier --write src/conteudo/p1/intr-direito/u2
npm run atualizar-referencias
npm run preci
```

O validador termina com uma linha `encontradas=N validadas=N falharam=0` e sai com 0. O `N` é o número de unidades do projeto. Depois do `atualizar-referencias`, confira o resumo: deve aparecer só a unidade que você acrescentou.

## 2. Nova cadeira

```bash
npm run nova-unidade -- p1 cadeira-nova u1 "Título da unidade" --cadeira "Nome da cadeira"
```

- O nome da pasta (`cadeira-nova`) tem só letras minúsculas, números e hífen, sem acento. Ele aparece na URL.
- O comando cria `cadeira.ts` com `nome`, `ordem` (a próxima livre) e `estado: 'em-breve'`, e cria a unidade `u1`.
- Para mudar a posição no menu, edite `ordem` em `cadeira.ts`. Número menor aparece antes. Dois números iguais no mesmo período fazem os testes do currículo reprovar.
- Para publicar a cadeira, troque o `estado` de `cadeira.ts` para `'publicado'`, quando pelo menos uma unidade estiver publicada.
- **Atalho Interdisciplinar.** Toda cadeira pública do 1º período (publicada e não restrita) precisa do bloco abaixo em `cadeira.ts`. O teste `tests/unidade/curriculo.atalhoInterdisciplinar.spec.ts` reprova sem ele. Copie o bloco do exemplo completo em `src/conteudo/p1/intr-direito/cadeira.ts`. `apos` é o id da unidade depois da qual o atalho aparece, e ele tem de ser `u1`:

```ts
  atalhoUnidade: {
    rotulo: 'Interdisciplinar',
    apos: 'u1',
    cadeiraId: 'interdisciplinar'
  }
```

A cadeira Interdisciplinar não tem unidade no repositório. O conteúdo dela fica no servidor, atrás do login. Não crie pasta de unidade para ela. A posição `u2` é reservada para o atalho: uma unidade `u2` numa cadeira pública do 1º período reprova o teste.

Para conferir, rode os mesmos passos da seção 1, com `npm run atualizar-referencias` antes do `npm run preci`.

## 3. Novo período

```bash
npm run nova-unidade -- p2 cadeira-x u1 "Título da unidade" --cadeira "Nome da cadeira"
```

- A pasta `p2` é criada sozinha. Os períodos vão de `p1` a `p10`.
- Períodos sem material continuam aparecendo no site como "em breve". Não há nada para cadastrar.
- Medido em 2026-10-20 (cópia): criar `p2` com uma cadeira e uma unidade, rodar `npm run atualizar-referencias` e os testes de caracterização, unidade e componente deixou tudo verde. Para o caso geral, siga a seção 10.

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

Para conferir: `node --import tsx scripts/validar-conteudo.ts`. Depois de acrescentar pergunta a uma unidade publicada, rode `npm run atualizar-referencias`: a caracterização guarda o número de perguntas de cada unidade publicada, e o resumo deve mostrar a unidade alterada.

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

Acrescentar prova só quebra se repetir, para a mesma cadeira e no mesmo semestre, um tipo que já existe: o validador acusa `prova duplicada`. Acrescentar feriado ou prazo no semestre 2026.2 pode quebrar a lista exata descrita em "Estado atual".

Uma categoria de evento nova não cabe no dado. Ela exige código (seção 9).

## 6. Aviso legal

O arquivo é `src/conteudo/avisoLegal.ts`, com `rotulo` e `corpo`. O texto foi aprovado pelo líder e é usado exatamente como está.

**Exceção aprovada pelo líder (2026-10-20).** O aviso legal fica fora da validação de "o material": ele contém essa expressão, aprovada literalmente pelo líder, e o validador lê só as unidades, não este arquivo. Por isso, esse texto não passa por nenhuma regra de texto de unidade. Não há outra exceção.

Para mudar o texto:

1. o líder aprova o texto novo;
2. você troca o texto em `avisoLegal.ts`;
3. no mesmo commit, você atualiza a redação guardada em `tests/unidade/conteudo.avisoLegal.spec.ts`.

## 7. Regras de texto e o que a trava reprova

A trava é `scripts/validar-conteudo.ts`. Ela lê todas as unidades e imprime cada problema assim:

```
FALHA p1/intr-direito/u2 resumo[0].corpoHtml [texto-proibido] trecho proibido: "aula"
```

A forma é `FALHA <unidade> <caminho> [<regra>] <detalhe>`. Quando falha, a última linha é `encontradas=N validadas=N falharam=M`, com `M` maior que zero, e o comando sai com 1. Corrija a linha indicada pelo caminho.

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
| Travessão (o traço longo, U+2014, e o médio, U+2013) em qualquer campo da unidade, inclusive pergunta do professor. Use vírgula, dois-pontos ou hífen comum | `travessao` | `validar-conteudo` |
| Texto de espera do gerador (`A escrever antes da publicação.` e `A escrever.`) numa unidade publicada. Em `em-breve` ele passa | `placeholder` | `validar-conteudo` |
| Nome de pessoa da turma, do professor ou da instituição | `PROIBIÇÃO ENCONTRADA: <termo> em <arquivo>` | `verificar-proibicoes.sh` (no `preci`) |

O verificador de nomes lê uma lista de termos guardada fora do repositório. Se faltar essa lista, ele falha de propósito. A mensagem mostra o termo encontrado. Quando aparecer, tire o nome do arquivo.

Não reprovados pela trava, e que você confere à mão:

- o aviso legal (`src/conteudo/avisoLegal.ts`): exceção aprovada, seção 6.

## 8. O que não precisa mais ser tocado

- Carregadores (`src/app/carregamento/`): descobrem as unidades pelas pastas.
- Currículo (`src/conteudo/curriculo.ts`): é montado a partir das pastas. Não edite.
- Rotas, menu, home e busca: seguem sozinhos.
- `dispositivos.ts`: é gerado no build e está no `.gitignore`. Não crie nem edite.
- Cache do service worker: os pedaços de conteúdo saem como `conteudo-*.js`, com hash, no build.
- Testes de conteúdo (`tests/unidade/conteudo.*`): varrem todas as unidades sozinhos.
- Testes do currículo real (`tests/unidade/curriculo.*` e `tests/componente/MenuCurriculo.*`): leem as cadeiras e as unidades do currículo, sem lista à mão.
- Caracterização (`tests/caracterizacao/`): regravada por `npm run atualizar-referencias`, sem editar JSON à mão.

As lacunas da seção "Estado atual" continuam pedindo cuidado: pergunta de quiz em Filosofia Jurídica u1 ou Introdução ao Direito u1, e lista exata do calendário 2026.2.

## 9. Quando a estrutura básica precisa de programador

Leve ao programador, ou a um agente de programação, quando:

- o `npm run preci` reprovar mesmo depois do `npm run atualizar-referencias`, ou por um teste que não é de caracterização (o resumo do comando não explica a falha);
- o `atualizar-referencias` mostrar uma mudança que você não fez;
- for preciso um tipo de bloco novo, uma aba nova ou um campo novo na unidade;
- for preciso uma categoria nova de evento no calendário, porque a lista é fechada e cada categoria precisa de rótulo no código;
- for preciso mudar uma regra de texto em `src/core/conteudo/regrasDeTexto.ts`;
- for preciso mudar menu, layout, cores ou rotas;
- for preciso mexer na área restrita, nos termos proibidos ou no cache;
- a lista exata do calendário de 2026.2 ou a contagem de perguntas de uma das duas unidades citadas na seção "Estado atual" reprovar.

Para agentes: leia este roteiro e `src/core/conteudo/regrasDeTexto.ts` antes de editar. Não mude tipos para acomodar um texto. Não crie `dispositivos.ts`. Não edite `tests/caracterizacao/*.esperado.json` à mão: rode `npm run atualizar-referencias`.

## 10. Antes do commit

Ordem obrigatória sempre que você acrescentou conteúdo (unidade, cadeira, período, pergunta ou alteração de texto que mude a contagem):

1. Rode `npm run atualizar-referencias`. Ele imprime o que entrou (`+`), saiu (`-`) e mudou de forma (`~`).
2. Confira o resumo: deve aparecer só o que você acrescentou. Se aparecer algo a mais, pare e leve a um programador (seção 9).
3. Rode `npm run preci`.
4. Faça o commit em Conventional Commits, por exemplo `feat(conteudo): unidade 2 de Introdução ao Direito`. Inclua no mesmo commit os arquivos regravados em `tests/caracterizacao/`.
5. Não envie para o GitHub sem combinar com o líder.
6. Para publicar no servidor, veja [publicacao.md](publicacao.md).
