import { PIRAMIDE } from './constantes';

/**
 * Forma plana da pirâmide de Kelsen: os cinco degraus do SVG da unidade u3-material-norma-interpretacao
 * (viewBox 400 x 729). Coordenadas originais do SVG; a base fica em y = 623 e o eixo em x = 78.
 */
export const EIXO_X_SVG = 78;
export const BASE_Y_SVG = 623;

export const DEGRAUS_SVG: readonly (readonly (readonly [number, number])[])[] = [
  [
    [70, 229],
    [86, 229],
    [95.9, 318],
    [60.1, 318]
  ],
  [
    [60.1, 318],
    [95.9, 318],
    [103.3, 384],
    [52.7, 384]
  ],
  [
    [52.7, 384],
    [103.3, 384],
    [109.1, 436],
    [46.9, 436]
  ],
  [
    [46.9, 436],
    [109.1, 436],
    [124.2, 571],
    [31.8, 571]
  ],
  [
    [31.8, 571],
    [124.2, 571],
    [130, 623],
    [26, 623]
  ]
];

/**
 * Degraus em px lógicos, com origem no centro da base e y para cima (0 = chão). `fator` escolhe
 * o tamanho da pirâmide mantendo o desenho.
 */
export function degrausEmPx(fator: number): [number, number][][] {
  const k = PIRAMIDE.escala * fator;
  return DEGRAUS_SVG.map((degrau) =>
    degrau.map(([x, y]): [number, number] => [(x - EIXO_X_SVG) * k, (BASE_Y_SVG - y) * k])
  );
}
