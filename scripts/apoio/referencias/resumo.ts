import type { Referencias } from './capturar';
import { diferencaPorChave, secaoDoResumo, temMudanca, type Mudancas } from './diferencas';
import type { ProjecaoPeriodo } from '../../../tests/caracterizacao/projecoes';

/**
 * Monta o resumo do que mudou entre a referência gravada e o estado atual.
 * Cada seção diz o que entrou (+), o que saiu (-) e o que tem a mesma chave
 * mas outra forma (~). Referência ausente conta como vazia (primeira geração).
 */
export interface ResumoDeMudancas {
  readonly linhas: string[];
  readonly houveMudanca: boolean;
}

type Anterior = Partial<Referencias>;

export function resumirMudancas(anterior: Anterior, atual: Referencias): ResumoDeMudancas {
  const secoes: Array<[string, Mudancas]> = [
    [
      'carregadores de conteúdo (chaves)',
      diferencaPorChave(
        (anterior.carregadores?.chavesCarregadores ?? []).map((c) => ({ c })),
        atual.carregadores.chavesCarregadores.map((c) => ({ c })),
        (item) => item.c
      )
    ],
    [
      'carregadores de dispositivos (chaves)',
      diferencaPorChave(
        (anterior.carregadores?.chavesCarregadoresDispositivos ?? []).map((c) => ({ c })),
        atual.carregadores.chavesCarregadoresDispositivos.map((c) => ({ c })),
        (item) => item.c
      )
    ],
    [
      'unidades publicadas (forma do conteúdo carregado)',
      diferencaPorChave(
        Object.entries(anterior.carregadores?.unidades ?? {}).map(([chave, valor]) => ({
          chave,
          valor
        })),
        Object.entries(atual.carregadores.unidades).map(([chave, valor]) => ({ chave, valor })),
        (item) => item.chave
      )
    ],
    [
      'currículo: períodos, cadeiras e unidades (todos os estados)',
      diferencaPorChave(
        itensDoCurriculo(anterior.curriculo ?? []),
        itensDoCurriculo(atual.curriculo),
        (i) => i.chave
      )
    ],
    [
      'rotas do e2e (caminho)',
      diferencaPorChave(
        anterior.rotas?.rotasDoCurriculo ?? [],
        atual.rotas.rotasDoCurriculo,
        (r) => r.caminho
      )
    ],
    [
      'rotas de unidade do e2e (caminho)',
      diferencaPorChave(
        anterior.rotas?.rotasDeUnidades ?? [],
        atual.rotas.rotasDeUnidades,
        (r) => r.caminho
      )
    ],
    [
      'rotas de aba ausente (caminho)',
      diferencaPorChave(
        (anterior.rotas?.rotasDeAbaAusente ?? []).map((c) => ({ c })),
        atual.rotas.rotasDeAbaAusente.map((c) => ({ c })),
        (item) => item.c
      )
    ],
    [
      'documentos da busca (id)',
      diferencaPorChave(
        anterior.indiceBusca?.documentos ?? [],
        atual.indiceBusca.documentos,
        (d) => d.id
      )
    ]
  ];

  const linhas: string[] = [];
  let houveMudanca = false;
  for (const [titulo, mudancas] of secoes) {
    if (temMudanca(mudancas)) {
      houveMudanca = true;
      linhas.push(...secaoDoResumo(titulo, mudancas));
    }
  }
  if (!houveMudanca) linhas.push('nenhuma mudança: a referência já era o estado atual');
  return { linhas, houveMudanca };
}

/** Período, cadeira e unidade como itens achatados, com a forma inteira de cada um. */
function itensDoCurriculo(
  curriculo: readonly ProjecaoPeriodo[]
): Array<{ chave: string; valor: unknown }> {
  return curriculo.flatMap((periodo) => [
    { chave: `periodo ${periodo.id}`, valor: { ...periodo, cadeiras: undefined } },
    ...periodo.cadeiras.flatMap((cadeira) => [
      {
        chave: `cadeira ${periodo.id}/${cadeira.id}`,
        valor: { ...cadeira, unidades: undefined }
      },
      ...cadeira.unidades.map((unidade) => ({
        chave: `unidade ${periodo.id}/${cadeira.id}/${unidade.id}`,
        valor: unidade
      }))
    ])
  ]);
}
