/** Menor fator de fonte aceito: abaixo disso o texto fica pequeno demais para valer a pena. */
export const AJUSTE_MINIMO = 0.55;
const PASSO = 0.05;

/**
 * Garante que o conteúdo caiba no palco lógico: se passar, reduz o fator
 * `--s-aj` (que multiplica todas as fontes do slide) até caber. Síncrono de
 * propósito: a leitura de scrollHeight força o layout a cada passo, então
 * o resultado já vale quando a função retorna (a impressão não espera).
 * Devolve o fator final. Elemento sem layout (altura 0) não é ajustado.
 */
export function ajustarFonteAoPalco(slide: HTMLElement, corpo: HTMLElement): number {
  let fator = 1;
  slide.style.setProperty('--s-aj', String(fator));
  if (corpo.clientHeight === 0 || corpo.clientWidth === 0) return fator;
  const transborda = (): boolean =>
    corpo.scrollHeight > corpo.clientHeight + 1 || corpo.scrollWidth > corpo.clientWidth + 1;
  while (transborda() && fator > AJUSTE_MINIMO) {
    fator = Math.max(AJUSTE_MINIMO, Math.round((fator - PASSO) * 100) / 100);
    slide.style.setProperty('--s-aj', String(fator));
  }
  return fator;
}
