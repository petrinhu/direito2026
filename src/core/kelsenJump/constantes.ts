/**
 * Constantes do Kelsen Jump, em unidades lógicas do mundo (px de 960 x 320). A tela escala o mundo
 * inteiro, então a física e a geometria não mudam com o tamanho do celular.
 */

export const MUNDO = { largura: 960, altura: 320 } as const;

/** Passo fixo da simulação: a lógica avança sempre no mesmo tamanho de passo, qualquer que seja o quadro. */
export const PASSO_FIXO_S = 1 / 120;

/**
 * Kelsen: parado à esquerda da tela. `x` é a coluna do corpo no mundo; a largura é a caixa de colisão.
 * As alturas são as dos quadros normalizados pelo pé (src/ui/kelsenJump/sprites/medidas.json): em pé
 * 61 px, agachado 53 px (87% da altura em pé). A largura, 26 px, é a do corpo parado (29 px) com folga
 * de 3 px: caixas de 30 px ou mais fazem o robô de referência bater em pirâmides altas com 40 ms de
 * erro (medido em 22/11/2026). Os quadros de corrida são mais largos; a diferença é o braço, fora da caixa.
 */
export const KELSEN = {
  x: 150,
  largura: 26,
  alturaEmPe: 61,
  alturaAgachado: 53
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

/**
 * Nuvem baixa e larga com "NHF" dentro (PNG do PixelLab, 112 x 50, ampliado 1,5x: 168 x 75, o mesmo
 * tamanho que o script de geração grava em medidas.json). `baseY` é a altura da base acima do chão:
 * entre a altura agachada (53) e a em pé (61), então agachado passa por baixo e em pé bate.
 *
 * Ela não se vence por cima: o topo fica abaixo do ápice do pulo, então a barreira é a largura. A
 * conta está em `nuvemNaoSaltavel` (obstaculos.ts): a largura passa da distância que o corpo fica
 * acima do topo na velocidade máxima, mais a folga `FOLGA_NUVEM_S`.
 */
export const NUVEM = {
  largura: 168,
  baseY: 57,
  altura: 75,
  texto: 'NHF'
} as const;

/** Folga, em segundos de corrida na velocidade máxima, somada à conta de não saltabilidade da nuvem. */
export const FOLGA_NUVEM_S = 0.1;

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
