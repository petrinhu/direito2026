/**
 * Teclado do Kelsen Jump. Espaço e Seta para cima pulam; Seta para baixo abaixa enquanto estiver
 * pressionada. O jogo ouve no documento, então não precisa de foco no canvas, mas não rouba a tecla
 * de quem a usa: campo de texto, seleção, botão ou link que não seja o canvas, e modal aberto.
 */
const TECLAS_DE_PULO: ReadonlySet<string> = new Set([' ', 'Spacebar', 'ArrowUp']);

export function ehTeclaDePulo(tecla: string): boolean {
  return TECLAS_DE_PULO.has(tecla);
}

export function ehTeclaDeAbaixar(tecla: string): boolean {
  return tecla === 'ArrowDown';
}

export function ehTeclaDoJogo(tecla: string): boolean {
  return ehTeclaDePulo(tecla) || ehTeclaDeAbaixar(tecla);
}

/** O que importa do elemento com foco para decidir se o jogo fica com a tecla. */
export interface AlvoTeclado {
  readonly ehCanvas: boolean;
  readonly editavel: boolean;
  readonly interativo: boolean;
}

/** Decide se o jogo fica com a tecla. Sem foco, ou com o foco no canvas, fica; com modal aberto, não. */
export function jogoFicaComATecla(alvo: AlvoTeclado | null, modalAberto: boolean): boolean {
  if (modalAberto) return false;
  if (alvo === null || alvo.ehCanvas) return true;
  return !alvo.editavel && !alvo.interativo;
}

const SELETOR_INTERATIVO = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="slider"]'
].join(', ');

/** Lê o elemento com foco no DOM. Sem elemento, o alvo é nulo (o jogo fica com a tecla). */
export function alvoDoTeclado(
  el: globalThis.Element | null,
  canvas: globalThis.Element | null
): AlvoTeclado | null {
  if (el === null) return null;
  const ehCanvas = el === canvas;
  return {
    ehCanvas,
    editavel:
      el.matches('input, textarea, select') ||
      (el as globalThis.HTMLElement).isContentEditable === true,
    interativo: !ehCanvas && el.matches(SELETOR_INTERATIVO)
  };
}

/** Há um modal aberto no documento: dialog com open, ou qualquer elemento com aria-modal="true". */
export function temModalAberto(doc: globalThis.Document): boolean {
  return doc.querySelector('dialog[open], [aria-modal="true"]') !== null;
}
