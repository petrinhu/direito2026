import { compararVersao } from './compararVersao';

/** Uma entrada do histórico de versao.json, da mais nova para a mais velha. */
export interface EntradaHistorico {
  versao: string;
  novidades: string[];
}

export interface ResumoNovidades {
  rollback: boolean;
  foraDoHistorico: boolean;
  itens: string[];
  mais: number;
}

const MAXIMO_MOSTRADO = 3;

const VAZIO: ResumoNovidades = { rollback: false, foraDoHistorico: false, itens: [], mais: 0 };

/**
 * Novidades entre a versão da aba e a publicada. Versões puladas entram; a da aba fica de
 * fora. Repetidas saem; a "Melhoria técnica" sai quando há outra novidade; a ordem é
 * cadeira, depois recurso, depois técnica. Mostra até 3 e conta o resto.
 */
export function novidadesDesde(
  historico: readonly EntradaHistorico[],
  daAba: string,
  publicada: string
): ResumoNovidades {
  const comparacao = compararVersao(daAba, publicada);
  if (comparacao === 'igual' || comparacao === 'invalida') return VAZIO;
  if (comparacao === 'publicada-mais-velha') return { ...VAZIO, rollback: true };

  const indice = historico.findIndex((entrada) => entrada.versao === daAba);
  if (indice < 0) {
    const todas = arrumar(historico.flatMap((entrada) => entrada.novidades));
    return { ...VAZIO, foraDoHistorico: true, itens: todas.slice(0, MAXIMO_MOSTRADO) };
  }
  const novas = arrumar(historico.slice(0, indice).flatMap((entrada) => entrada.novidades));
  return {
    ...VAZIO,
    itens: novas.slice(0, MAXIMO_MOSTRADO),
    mais: Math.max(0, novas.length - MAXIMO_MOSTRADO)
  };
}

const TECNICA = 'Melhoria técnica';

function arrumar(novidades: readonly string[]): string[] {
  const sem = [...new Set(novidades)];
  const outras = sem.filter((item) => item !== TECNICA);
  const base = outras.length > 0 ? outras : sem;
  return [...base].sort((x, y) => ordem(x) - ordem(y));
}

/** Rótulos de item de uso (decisão 101): Novo, Melhorado e Corrigido, todos no mesmo grupo. */
const ROTULO_DE_USO = /^(Novo|Melhorado|Corrigido): /;

function ordem(item: string): number {
  if (item === TECNICA) return 2;
  if (ROTULO_DE_USO.test(item)) return 1;
  return 0;
}
