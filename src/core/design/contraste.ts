/** Razão de contraste WCAG 2.2 entre duas cores hex (#rrggbb), simétrica. */
export function calcularContraste(corA: string, corB: string): number {
  const luminanciaA = luminanciaRelativa(corA);
  const luminanciaB = luminanciaRelativa(corB);
  const clara = Math.max(luminanciaA, luminanciaB);
  const escura = Math.min(luminanciaA, luminanciaB);
  return (clara + 0.05) / (escura + 0.05);
}

function luminanciaRelativa(hex: string): number {
  const [r, g, b] = componentesRgb(hex);
  return 0.2126 * linearizar(r) + 0.7152 * linearizar(g) + 0.0722 * linearizar(b);
}

function componentesRgb(hex: string): [number, number, number] {
  const limpo = hex.replace('#', '');
  return [
    parseInt(limpo.slice(0, 2), 16),
    parseInt(limpo.slice(2, 4), 16),
    parseInt(limpo.slice(4, 6), 16)
  ];
}

function linearizar(componente8bit: number): number {
  const c = componente8bit / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
