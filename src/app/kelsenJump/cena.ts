import {
  alturaDoCorpo,
  degrausEmPx,
  KELSEN,
  MUNDO,
  NUVEM,
  pontuacaoDe,
  type Estado,
  type Fase,
  type Obstaculo
} from '@/core/kelsenJump';

/** Forma pronta para desenhar, em px lógicos do mundo: x é a coluna na tela, y é 0 no chão e cresce para cima. */
export type FormaCena =
  | { tipo: 'piramide'; x: number; largura: number; altura: number; degraus: [number, number][][] }
  | { tipo: 'nuvem'; x: number; largura: number; altura: number; baseY: number; texto: string };

export interface Cena {
  readonly fase: Fase;
  readonly largura: number;
  readonly altura: number;
  readonly corpo: {
    readonly x: number;
    readonly largura: number;
    readonly pe: number;
    readonly altura: number;
  };
  readonly obstaculos: readonly FormaCena[];
  /** Distância percorrida, em px de rolagem: o cenário anda com ela. */
  readonly distancia: number;
  readonly pontuacao: number;
  readonly ultimaPontuacao?: number;
  /** Índice da lição da última colisão, na lista de lições. Ausente antes da primeira colisão. */
  readonly licao?: number;
}

function formaDe(o: Obstaculo, distancia: number): FormaCena {
  const x = o.x - distancia;
  if (o.tipo === 'piramide') {
    return {
      tipo: 'piramide',
      x,
      largura: o.largura,
      altura: o.altura,
      degraus: degrausEmPx(o.fator)
    };
  }
  return {
    tipo: 'nuvem',
    x,
    largura: o.largura,
    altura: o.altura,
    baseY: o.baseY,
    texto: NUVEM.texto
  };
}

/** Converte o estado do core na cena de desenho. Só lê o estado; quem desenha não importa a lógica. */
export function cenaDe(e: Estado): Cena {
  const visiveis = e.obstaculos
    .filter(
      (o) => o.x - e.distancia < MUNDO.largura && o.x + o.largura - e.distancia > -KELSEN.largura
    )
    .map((o) => formaDe(o, e.distancia));
  return {
    fase: e.fase,
    largura: MUNDO.largura,
    altura: MUNDO.altura,
    corpo: {
      x: KELSEN.x,
      largura: KELSEN.largura,
      pe: e.jogador.pe,
      altura: alturaDoCorpo(e.jogador)
    },
    obstaculos: visiveis,
    distancia: e.distancia,
    pontuacao: pontuacaoDe(e),
    ...(e.ultimaPontuacao === undefined ? {} : { ultimaPontuacao: e.ultimaPontuacao })
  };
}
