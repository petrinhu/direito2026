/**
 * Constantes do Kelsen Jump, em unidades lógicas do mundo (px de 960 x 320). A tela escala o mundo
 * inteiro, então a física e a geometria não mudam com o tamanho do celular.
 */

export const MUNDO = { largura: 960, altura: 320 } as const;

/** Passo fixo da simulação: a lógica avança sempre no mesmo tamanho de passo, qualquer que seja o quadro. */
export const PASSO_FIXO_S = 1 / 120;

/** Kelsen: parado à esquerda da tela. `x` é a coluna do corpo no mundo; a largura é a caixa de colisão. */
export const KELSEN = {
  x: 150,
  largura: 22,
  alturaEmPe: 62,
  alturaAgachado: 30
} as const;

/** Gravidade e velocidade inicial do pulo. O ápice é v²/2g; o tempo no ar é 2v/g. */
export const FISICA = {
  gravidade: 2600,
  velocidadeSalto: 860
} as const;

/** Velocidade do cenário, em px por segundo. Sobe de `minima` até `maxima` com o tempo. */
export const VELOCIDADE = {
  minima: 340,
  maxima: 640,
  aceleracao: 6
} as const;

/**
 * Pirâmide: o desenho plano de Kelsen (SVG 400 x 729 da unidade u3-material-norma-interpretacao)
 * tem 394 unidades de altura e 104 de base. `escala` converte unidades em px; `fatores` dá
 * alturas diferentes com o mesmo desenho.
 */
export const PIRAMIDE = {
  escala: 0.3,
  fatores: [0.45, 0.65, 0.85, 1] as const,
  alturaUnidades: 394,
  larguraUnidades: 104
} as const;

/** Nuvem baixa com "NHF" dentro. `baseY` é a altura da base acima do chão. */
export const NUVEM = {
  largura: 84,
  baseY: 40,
  /* Topo acima do ápice do pulo (142 px): nenhum pulo passa por cima, só a abaixada (pedido do líder). */
  altura: 130,
  texto: 'NHF'
} as const;

/**
 * Espaçamento do gerador. `inicial` é a distância do começo até o primeiro obstáculo. `folga`
 * é o tempo de pousar e preparar o próximo salto, em px. `extraMaximo` deixa a sequência variar.
 */
export const ESPACO = {
  inicial: 640,
  folga: 80,
  extraMaximo: 140
} as const;

export const PONTOS = {
  piramide: 10,
  nuvem: 5,
  distanciaPorPonto: 20
} as const;

/** Depois de bater, o jogo não reinicia antes deste prazo: quem martela espaço não pula a lição. */
export const REINICIO_TRAVA_S = 0.8;
