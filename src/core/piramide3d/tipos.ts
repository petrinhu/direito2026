/** Ponto em duas dimensões (px da janela ou do canvas). */
export interface Ponto {
  readonly x: number;
  readonly y: number;
}

/** Retângulo em px: canto superior esquerdo e tamanho. */
export interface Retangulo {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Vetor no mundo 3D. Tipo próprio: o core não importa a biblioteca gráfica. */
export interface Vetor3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Quatérnio de rotação (x, y, z, w), na mesma convenção da biblioteca gráfica. */
export interface Quaternio {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

/** Dimensões de um tronco de seção retangular: larguras e profundidades de base e topo, e altura. */
export interface DimensoesTronco {
  readonly LB: number;
  readonly LT: number;
  readonly PB: number;
  readonly PT: number;
  readonly h: number;
}

/** Uma fatia em repouso: altura da base e do topo, largura da base e do topo. */
export interface Fatia {
  readonly base: number;
  readonly topo: number;
  readonly LB: number;
  readonly LT: number;
}

/** Os dois desenhos: a estrutura escalonada segundo Kelsen e a hierarquia brasileira. */
export type ChaveFigura3d = 'piramide-kelsen' | 'piramide-brasil';

/** Texto de um nível: nome (na face em voo), rótulo curto (em repouso), explicação e exemplo. */
export interface NivelFigura3d {
  readonly nivel: string;
  readonly nome: string;
  readonly rotulo: string;
  readonly explicacao: string;
  readonly exemplo: string;
}

/** Tudo o que uma figura precisa do conteúdo: os níveis e a descrição para leitor de tela. */
export interface DadosFigura3d {
  readonly niveis: readonly NivelFigura3d[];
  readonly aria: string;
}

/** Forma de um nível na tela, em px do cliente, para decidir qual nível está sob o ponteiro. */
export interface FormaNivel {
  readonly nivel: string;
  readonly repouso: readonly Ponto[] | null;
  readonly frente: readonly Ponto[] | null;
  readonly profundidade: number;
  readonly rotulo: Retangulo | null;
}

/** O que o ambiente do leitor permite, medido no momento da decisão. */
export interface FatosDoAmbiente {
  readonly webgl2: boolean;
  readonly larguraJanela: number;
  readonly alturaJanela: number;
  readonly larguraFigura: number;
  readonly modoAdaptado: boolean;
}

export type ModoFigura = '3d' | 'plana';
