/**
 * Compara a versão da aba com a publicada, por partes numéricas (A.B.C.D). Qualquer
 * diferença vale aviso, inclusive rollback (decisão D1 do plano). A ordem só decide
 * se há lista de novidades.
 */
export type ResultadoComparacao =
  'igual' | 'publicada-mais-nova' | 'publicada-mais-velha' | 'invalida';

const FORMATO = /^\d+\.\d+\.\d+\.\d+$/;

export function compararVersao(daAba: string, publicada: string): ResultadoComparacao {
  const a = partesDaVersao(daAba);
  const p = partesDaVersao(publicada);
  if (a === null || p === null) return 'invalida';
  for (let i = 0; i < 4; i++) {
    if (a[i] !== p[i]) return p[i]! > a[i]! ? 'publicada-mais-nova' : 'publicada-mais-velha';
  }
  return 'igual';
}

function partesDaVersao(versao: string): number[] | null {
  if (!FORMATO.test(versao)) return null;
  return versao.split('.').map(Number);
}
