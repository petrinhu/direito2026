const ALGARISMOS: ReadonlyArray<readonly [number, string]> = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I']
];

/**
 * Numeral romano de um período (1 a 39). Só cobre o intervalo do currículo:
 * fora dele, recusa em vez de devolver um texto errado.
 */
export function numeroRomano(numero: number): string {
  if (!Number.isInteger(numero) || numero < 1 || numero > 39) {
    throw new RangeError(`numeral romano fora de 1 a 39: ${numero}`);
  }
  let restante = numero;
  let romano = '';
  for (const [valor, simbolo] of ALGARISMOS) {
    while (restante >= valor) {
      romano += simbolo;
      restante -= valor;
    }
  }
  return romano;
}
