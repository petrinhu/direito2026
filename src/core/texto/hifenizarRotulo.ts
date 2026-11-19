import { SILABAS_ROTULOS_ABA } from './silabasRotulosAba';

/** Hífen mole: some quando o texto cabe, aparece como hífen só quando a quebra acontece. */
const HIFEN_MOLE = '­';

/**
 * Devolve o rótulo com U+00AD nos pontos de sílaba da tabela fechada. Rótulo
 * fora da tabela volta igual, sem nenhuma alteração.
 */
export function hifenizarRotulo(rotulo: string): string {
  const marcado = SILABAS_ROTULOS_ABA.get(rotulo);
  if (marcado === undefined) return rotulo;
  return marcado.replaceAll('-', HIFEN_MOLE);
}
