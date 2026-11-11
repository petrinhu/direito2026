import type { FatosDoAmbiente, ModoFigura } from '@/core/piramide3d/tipos';

/** Largura mínima da figura, em px, para valer a pena o desenho em três dimensões. */
export const LARGURA_MINIMA_3D = 560;
/** Janela mínima para o 3D: abaixo disso a figura mostra a versão plana. */
export const JANELA_MINIMA_3D = { largura: 900, altura: 600 } as const;

/**
 * Decide entre o 3D e a versão plana a partir de fatos já medidos. O 3D exige WebGL2, janela de
 * 900 x 600 px ou mais, figura com 560 px ou mais e o modo adaptado desligado. Qualquer outra
 * situação fica com a versão plana, que traz a informação inteira.
 */
export function decidirModo(fatos: FatosDoAmbiente): ModoFigura {
  if (fatos.modoAdaptado) return 'plana';
  if (!fatos.webgl2) return 'plana';
  if (fatos.larguraJanela < JANELA_MINIMA_3D.largura) return 'plana';
  if (fatos.alturaJanela < JANELA_MINIMA_3D.altura) return 'plana';
  if (fatos.larguraFigura < LARGURA_MINIMA_3D) return 'plana';
  return '3d';
}
