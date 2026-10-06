/** O slide é um palco 16:9 de tamanho lógico fixo, escalado por transform para caber. */
export const LARGURA_LOGICA = 1600;
export const ALTURA_LOGICA = 900;

const PIXELS_POR_POLEGADA = 96;
const MILIMETROS_POR_POLEGADA = 25.4;

/**
 * Maior escala que faz o palco caber inteiro no espaço, sem cortar e sem
 * mudar a proporção. Medida inválida (zero, negativa, não finita) devolve 1:
 * melhor um palco no tamanho lógico do que invisível ou NaN.
 */
export function calcularEscala(larguraDisponivel: number, alturaDisponivel: number): number {
  const valida = (n: number): boolean => Number.isFinite(n) && n > 0;
  if (!valida(larguraDisponivel) || !valida(alturaDisponivel)) return 1;
  return Math.min(larguraDisponivel / LARGURA_LOGICA, alturaDisponivel / ALTURA_LOGICA);
}

export function milimetrosParaPixels(milimetros: number): number {
  return (milimetros / MILIMETROS_POR_POLEGADA) * PIXELS_POR_POLEGADA;
}
