import type { Cadeira, Curriculo, Periodo, ReferenciaUnidade } from '@/core/curriculo/tipos';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

export type RegistroDeCarregadores = Record<string, () => Promise<ConteudoUnidade>>;

/**
 * Decora o currículo (dado puro de src/conteudo/) com os carregadores sob
 * demanda de cada unidade publicada. src/conteudo/ nunca importa de
 * src/app/ (seção 2 da arquitetura); é este módulo, e não o currículo, que
 * conhece o `import()` de cada unidade.
 */
export function decorarCurriculo(
  curriculo: Curriculo,
  registro: RegistroDeCarregadores
): Curriculo {
  return curriculo.map((periodo) => decorarPeriodo(periodo, registro));
}

function decorarPeriodo(periodo: Periodo, registro: RegistroDeCarregadores): Periodo {
  return {
    ...periodo,
    cadeiras: periodo.cadeiras.map((cadeira) => decorarCadeira(periodo.id, cadeira, registro))
  };
}

function decorarCadeira(
  periodoId: string,
  cadeira: Cadeira,
  registro: RegistroDeCarregadores
): Cadeira {
  return {
    ...cadeira,
    unidades: cadeira.unidades.map((unidade) =>
      decorarUnidade(periodoId, cadeira.id, unidade, registro)
    )
  };
}

function decorarUnidade(
  periodoId: string,
  cadeiraId: string,
  unidade: ReferenciaUnidade,
  registro: RegistroDeCarregadores
): ReferenciaUnidade {
  if (unidade.estado !== 'publicado') return unidade;
  const carregar = registro[`${periodoId}/${cadeiraId}/${unidade.id}`];
  return carregar ? { ...unidade, carregar } : unidade;
}
