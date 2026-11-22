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
 * Nuvem baixa com "NHF" dentro, do PNG do PixelLab reduzido sem suavização até a largura da cabeça do
 * Kelsen parado (29 px, src/ui/kelsenJump/sprites/medidas.json): 29 por 13 px, na mesma proporção do PNG.
 * Vem em grupo de 1 a 3, na altura da cabeça. `baseY` fica entre a altura agachada (53) e a em pé (61):
 * agachado passa sob qualquer grupo, em pé bate. Pular por cima pode passar ou não, como no dinossauro.
 */
export const NUVEM = {
  largura: 29,
  altura: 13,
  baseY: 57,
  texto: 'NHF'
} as const;

/**
 * Espaço livre entre duas nuvens do mesmo grupo, em px. Menor que a largura da cabeça (26 px da caixa
 * do corpo): o Kelsen em pé nunca cabe no vão e sempre bate em alguma nuvem do grupo.
 */
export const GRUPO_NUVENS = { espaco: 14 } as const;

/**
 * Tempo, em s, para levantar depois do grupo e pular a próxima pirâmide. A folga é esse tempo na
 * velocidade máxima: 0,3 s × 640 px/s = 192 px. O robô de referência reage com ±0,04 s; humano reage mais devagar.
 */
export const TEMPO_RESPOSTA_S = 0.3;

/**
 * Espaçamento do gerador. `inicial` é a distância do começo até o primeiro obstáculo. `folga`
 * é o tempo de pousar e preparar o próximo salto, em px. `extraMaximo` deixa a sequência variar.
 */
export const ESPACO = {
  inicial: 640,
  folga: VELOCIDADE.maxima * TEMPO_RESPOSTA_S,
  extraMaximo: 140
} as const;

export const PONTOS = {
  piramide: 10,
  nuvem: 5,
  distanciaPorPonto: 20
} as const;

/** Depois de bater, o jogo não reinicia antes deste prazo: quem martela espaço não pula a lição. */
export const REINICIO_TRAVA_S = 0.8;
