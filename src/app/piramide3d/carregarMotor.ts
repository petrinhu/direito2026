import type { MotorFigura } from './tiposMotor';

/**
 * Único ponto que importa o motor 3D, e só sob demanda: a página da unidade carrega o componente
 * leve, e o pedaço com a biblioteca gráfica só chega quando uma figura vai mesmo ser desenhada.
 */
export function carregarMotor(): Promise<MotorFigura> {
  return import('@/ui/piramide3d/motor');
}
