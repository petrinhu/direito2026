/** Menor fator de fonte aceito: abaixo disso o texto fica pequeno demais para valer a pena. */
export const AJUSTE_MINIMO = 0.5;
const PASSO = 0.04;

function pixels(valor: string): number {
  const n = Number.parseFloat(valor);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Garante que o conteúdo caiba no palco lógico: se passar, reduz o fator
 * `--s-aj` (que multiplica fontes, espaços e margens do slide) até caber.
 * Mede o bloco de conteúdo contra a área útil do corpo (sem o preenchimento),
 * então tanto o corte embaixo quanto o do título no topo são detectados.
 * Síncrono: a leitura de medidas força o layout a cada passo, e o resultado
 * já vale quando a função retorna (a impressão não espera).
 * Devolve o fator final. Elemento sem layout (altura 0) não é ajustado.
 */
export function ajustarFonteAoPalco(slide: HTMLElement, corpo: HTMLElement): number {
  let fator = 1;
  slide.style.setProperty('--s-aj', String(fator));
  if (corpo.clientHeight === 0 || corpo.clientWidth === 0) return fator;
  const estilo = getComputedStyle(corpo);
  const alturaUtil = corpo.clientHeight - pixels(estilo.paddingTop) - pixels(estilo.paddingBottom);
  const larguraUtil = corpo.clientWidth - pixels(estilo.paddingLeft) - pixels(estilo.paddingRight);
  const conteudo = corpo.querySelector<HTMLElement>('.ar-slide__conteudo') ?? corpo;
  const transborda = (): boolean =>
    conteudo.offsetHeight > alturaUtil + 1 ||
    conteudo.scrollWidth > larguraUtil + 1 ||
    corpo.scrollHeight > corpo.clientHeight + 1 ||
    corpo.scrollWidth > corpo.clientWidth + 1;
  while (transborda() && fator > AJUSTE_MINIMO) {
    fator = Math.max(AJUSTE_MINIMO, Math.round((fator - PASSO) * 100) / 100);
    slide.style.setProperty('--s-aj', String(fator));
  }
  return fator;
}
