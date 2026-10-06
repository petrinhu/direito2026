/** Menor fator de fonte aceito: abaixo disso o texto fica pequeno demais para valer a pena. */
export const AJUSTE_MINIMO = 0.5;
const PRECISAO = 0.01;

function pixels(valor: string): number {
  const n = Number.parseFloat(valor);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Garante que o conteúdo caiba no palco lógico: se passar, reduz o fator
 * `--s-aj` (que multiplica fontes, espaços e margens do slide) até caber.
 * Busca binária; mede o bloco de conteúdo contra a área útil do corpo (sem o preenchimento),
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
  const cabe = (f: number): boolean => {
    slide.style.setProperty('--s-aj', String(f));
    return (
      (conteudo === corpo ? corpo.scrollHeight : conteudo.offsetHeight) <= alturaUtil + 1 &&
      conteudo.scrollWidth <= larguraUtil + 1
    );
  };
  if (cabe(1)) return 1;
  // Busca binária pelo maior fator que cabe: encolhe só até caber, sem sobra exagerada.
  let cabendo = AJUSTE_MINIMO;
  let estourando = 1;
  while (estourando - cabendo > PRECISAO) {
    const meio = (cabendo + estourando) / 2;
    if (cabe(meio)) cabendo = meio;
    else estourando = meio;
  }
  fator = Math.floor(cabendo * 100) / 100;
  slide.style.setProperty('--s-aj', String(fator));
  return fator;
}
