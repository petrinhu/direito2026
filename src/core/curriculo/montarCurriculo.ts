import { agruparPorUnidade, type UnidadeDescoberta } from './agruparPorUnidade';
import { ErroDeConteudo } from './erroDeConteudo';
import type {
  AtalhoUnidade,
  Cadeira,
  Curriculo,
  EstadoPublicacao,
  Periodo,
  ReferenciaUnidade
} from './tipos';

/** Quantos períodos o curso tem; os que não têm pasta nascem vazios, "em breve". */
export const TOTAL_DE_PERIODOS = 10;

/** Conteúdo de cadeira.ts: a descrição de uma cadeira, escrita na própria pasta. */
export interface DescricaoCadeira {
  readonly nome: string;
  /** Posição no menu do período (menor vem antes). */
  readonly ordem: number;
  readonly estado: EstadoPublicacao;
  readonly restrita?: true;
  readonly atalhoUnidade?: AtalhoUnidade;
}

/** Os campos de meta.ts que o currículo usa; o resto do meta é do conteúdo. */
export interface DescricaoUnidade {
  readonly rotulo: string;
  readonly titulo: string;
  readonly estado: EstadoPublicacao;
}

/**
 * Tudo que a montagem precisa, já lido de disco ou do glob. As chaves são
 * caminhos relativos a src/conteudo ('p1/intr-direito/cadeira.ts',
 * 'p1/intr-direito/u1/meta.ts'), iguais nos dois modos de leitura.
 */
export interface EntradasDoCurriculo {
  readonly caminhos: readonly string[];
  readonly cadeiras: Readonly<Record<string, DescricaoCadeira>>;
  readonly metas: Readonly<Record<string, DescricaoUnidade>>;
}

/**
 * Monta o Curriculo a partir das descrições de cada pasta (D1: cada pasta se
 * descreve). Função pura: o mesmo dado de entrada dá o mesmo currículo, seja
 * qual for a fonte (glob no site, disco nos scripts).
 */
export function montarCurriculo(entradas: EntradasDoCurriculo): Curriculo {
  const unidades = agruparPorUnidade(entradas.caminhos);
  const unidadesPorCadeira = agruparPorCadeira(unidades);
  const chavesDeCadeira = new Set<string>([
    ...unidadesPorCadeira.keys(),
    ...Object.keys(entradas.cadeiras).map(chaveDaDescricaoDeCadeira)
  ]);

  for (const chave of chavesDeCadeira) {
    checarPeriodo(chave.split('/')[0] ?? '');
  }

  const cadeirasPorPeriodo = new Map<string, CadeiraOrdenada[]>();
  for (const chave of [...chavesDeCadeira].sort()) {
    const periodoId = chave.split('/')[0] ?? '';
    const descricao = entradas.cadeiras[`${chave}/cadeira.ts`];
    if (!descricao) {
      throw new ErroDeConteudo(`pasta sem descrição (cadeira.ts ausente) em ${chave}`);
    }
    const cadeira = montarCadeira(
      chave,
      descricao,
      unidadesPorCadeira.get(chave) ?? [],
      entradas.metas
    );
    const doPeriodo = cadeirasPorPeriodo.get(periodoId) ?? [];
    cadeirasPorPeriodo.set(periodoId, [...doPeriodo, { ordem: descricao.ordem, cadeira }]);
  }

  return Array.from({ length: TOTAL_DE_PERIODOS }, (_, indice) => {
    const numero = indice + 1;
    const id = `p${numero}`;
    return montarPeriodo(id, numero, cadeirasPorPeriodo.get(id) ?? []);
  });
}

function agruparPorCadeira(
  unidades: readonly UnidadeDescoberta[]
): Map<string, UnidadeDescoberta[]> {
  const porCadeira = new Map<string, UnidadeDescoberta[]>();
  for (const unidade of unidades) {
    const chave = `${unidade.periodo}/${unidade.cadeira}`;
    porCadeira.set(chave, [...(porCadeira.get(chave) ?? []), unidade]);
  }
  return porCadeira;
}

function chaveDaDescricaoDeCadeira(caminho: string): string {
  return caminho.slice(0, -'/cadeira.ts'.length);
}

const PERIODO = /^p\d+$/;

/** Pasta de período tem que ser pN, com N de 1 a TOTAL_DE_PERIODOS. Outra coisa reprova (não some por NaN). */
function checarPeriodo(periodoId: string): void {
  const numero = PERIODO.test(periodoId) ? Number(periodoId.slice(1)) : Number.NaN;
  if (!Number.isInteger(numero) || numero < 1 || numero > TOTAL_DE_PERIODOS) {
    throw new ErroDeConteudo(`período fora de 1 a ${TOTAL_DE_PERIODOS}: ${periodoId}`);
  }
}

/** Cadeira já montada, com a ordem do menu, que só serve para ordenar. */
interface CadeiraOrdenada {
  readonly ordem: number;
  readonly cadeira: Cadeira;
}

function montarPeriodo(id: string, numero: number, cadeiras: readonly CadeiraOrdenada[]): Periodo {
  checarOrdemUnica(id, cadeiras);
  const emOrdem = [...cadeiras].sort((a, b) => a.ordem - b.ordem);
  return {
    id,
    numero,
    rotulo: `${numero}º período`,
    cadeiras: emOrdem.map((item) => item.cadeira)
  };
}

function checarOrdemUnica(periodoId: string, cadeiras: readonly CadeiraOrdenada[]): void {
  const vistas = new Set<number>();
  for (const { ordem } of cadeiras) {
    if (vistas.has(ordem)) {
      throw new ErroDeConteudo(`ordem repetida em ${periodoId}: ${ordem}`);
    }
    vistas.add(ordem);
  }
}

function montarCadeira(
  chave: string,
  descricao: DescricaoCadeira,
  unidadesDaCadeira: readonly UnidadeDescoberta[],
  metas: Readonly<Record<string, DescricaoUnidade>>
): Cadeira {
  const id = chave.split('/')[1] ?? '';
  const unidades = [...unidadesDaCadeira]
    .sort((a, b) => numeroDaUnidade(a.unidade) - numeroDaUnidade(b.unidade))
    .map((unidade) => montarReferencia(unidade, metas));

  if (descricao.estado === 'publicado' && !descricao.restrita) {
    if (!unidades.some((unidade) => unidade.estado === 'publicado')) {
      throw new ErroDeConteudo(`cadeira publicada sem unidade publicada: ${chave}`);
    }
  }

  return {
    id,
    nome: descricao.nome,
    estado: descricao.estado,
    ...(descricao.restrita ? { restrita: true as const } : {}),
    unidades,
    ...(descricao.atalhoUnidade ? { atalhoUnidade: descricao.atalhoUnidade } : {})
  };
}

function montarReferencia(
  unidade: UnidadeDescoberta,
  metas: Readonly<Record<string, DescricaoUnidade>>
): ReferenciaUnidade {
  const meta = metas[unidade.arquivos.meta];
  if (!meta) {
    throw new ErroDeConteudo(`sem descrição de unidade (meta.ts) em ${unidade.chave}`);
  }
  if (meta.estado === 'publicado' && unidade.abas.length === 0) {
    throw new ErroDeConteudo(`unidade publicada sem nenhuma aba em ${unidade.chave}`);
  }
  return {
    id: unidade.unidade,
    rotulo: meta.rotulo,
    titulo: meta.titulo,
    estado: meta.estado,
    abas: meta.estado === 'publicado' ? unidade.abas : []
  };
}

function numeroDaUnidade(unidadeId: string): number {
  return Number(unidadeId.slice(1));
}
