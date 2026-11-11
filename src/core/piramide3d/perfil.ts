// Perfil de cada figura: a ordem dos níveis de baixo para cima, as setas e os blocos fora da série.
// A conversão para o mundo 3D usa fatias de altura igual (geometria.ts); as faixas abaixo só dizem
// quais níveis existem e em que ordem.

export interface CamadaPerfil {
  readonly nivel: string;
}

export interface SetaPerfil {
  readonly nivel: string;
  /** Deslocamento em x no mundo, a partir do centro da pirâmide. */
  readonly x: number;
  readonly sentido: 'cima' | 'baixo';
}

export interface PerfilFigura {
  /** Blocos retos acima do ápice (norma fundamental e Constituição em sentido lógico). */
  readonly fantasma: readonly string[];
  /** Camadas da pirâmide, de cima para baixo. */
  readonly camadas: readonly CamadaPerfil[];
  readonly setas: readonly SetaPerfil[];
}

export const PERFIS: Readonly<Record<'kelsen' | 'brasil', PerfilFigura>> = {
  kelsen: {
    fantasma: ['norma-fundamental', 'constituicao-logico'],
    camadas: [
      { nivel: 'constituicao-positiva' },
      { nivel: 'normas-gerais' },
      { nivel: 'regulamentos' },
      { nivel: 'normas-individuais' },
      { nivel: 'ato-execucao' }
    ],
    setas: [
      { nivel: 'fundamento-validade', x: -0.98, sentido: 'cima' },
      { nivel: 'criacao-aplicacao', x: -1.16, sentido: 'baixo' }
    ]
  },
  brasil: {
    fantasma: [],
    camadas: [
      { nivel: 'constituicao-emendas' },
      { nivel: 'supralegal' },
      { nivel: 'leis' },
      { nivel: 'decretos' }
    ],
    setas: []
  }
};
