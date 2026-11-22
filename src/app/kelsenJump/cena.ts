import {
  alturaDoCorpo,
  degrausEmPx,
  KELSEN,
  MUNDO,
  NUVEM,
  pontuacaoDe,
  ROTULO_NHF,
  REINICIO_TRAVA_S,
  type Estado,
  type Fase,
  type Obstaculo
} from '@/core/kelsenJump';

/**
 * Pose do boneco, escolhida pelo estado: parado antes da 1ª partida, correndo (2 quadros), pulando
 * (o quadro de corrida congelado, como o dinossauro), abaixado (2 quadros) e batida (o quadro parado,
 * com tremor logo depois da colisão).
 */
export type PoseKelsen = 'parado' | 'correndo' | 'pulando' | 'abaixado' | 'batida';

/** Px de rolagem por quadro de animação de corrida. */
const PASSO_ANIMACAO = 18;
/** Tremor da batida: deslocamentos em px, um por intervalo de `TREMOR_INTERVALO_S`. */
const TREMOR = [3, -3, 2] as const;
const TREMOR_INTERVALO_S = 0.05;

/** Tremor da batida em px, pelo tempo decorrido desde a colisão (a trava conta para baixo). */
export function tremorDe(trava: number): number {
  const decorrido = REINICIO_TRAVA_S - trava;
  if (decorrido < 0) return 0;
  const indice = Math.floor(decorrido / TREMOR_INTERVALO_S + 1e-9);
  return indice < TREMOR.length ? (TREMOR[indice] ?? 0) : 0;
}

/** Forma pronta para desenhar, em px lógicos do mundo: x é a coluna na tela, y é 0 no chão e cresce para cima. */
export type FormaCena =
  | { tipo: 'piramide'; x: number; largura: number; altura: number; degraus: [number, number][][] }
  | { tipo: 'nuvem'; x: number; largura: number; altura: number; baseY: number };

/** Rótulo "NHF" de um grupo: centro horizontal na tela e altura do centro acima do chão, em px lógicos. */
export interface RotuloCena {
  readonly x: number;
  readonly alturaChao: number;
  readonly texto: string;
}

export interface Cena {
  readonly fase: Fase;
  readonly largura: number;
  readonly altura: number;
  readonly corpo: {
    readonly x: number;
    readonly largura: number;
    readonly pe: number;
    readonly altura: number;
    readonly pose: PoseKelsen;
    /** Quadro da pose (0 ou 1): corrida e abaixado têm dois; as demais poses usam sempre 0 ou 1 fixo. */
    readonly quadro: 0 | 1;
    /** Deslocamento horizontal do tremor da batida, em px; zero fora da batida. */
    readonly tremor: number;
  };
  readonly obstaculos: readonly FormaCena[];
  /** Um rótulo por grupo de nuvens visível, centrado acima do grupo. Não é colisão. */
  readonly rotulos: readonly RotuloCena[];
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
    baseY: o.baseY
  };
}

/**
 * Pose do boneco a partir do estado. Antes da primeira partida: parado. Depois de uma colisão, a
 * tela de fim mostra a batida (até a próxima partida). Em corrida, o quadro troca a cada
 * `PASSO_ANIMACAO` px de rolagem; no ar, o quadro de corrida fica congelado.
 */
function poseDe(e: Estado): { pose: PoseKelsen; quadro: 0 | 1; tremor: number } {
  if (e.fase === 'aguardando') {
    if (e.ultimaPontuacao === undefined) return { pose: 'parado', quadro: 0, tremor: 0 };
    return { pose: 'batida', quadro: 0, tremor: tremorDe(e.trava) };
  }
  if (e.jogador.pe > 0) return { pose: 'pulando', quadro: 1, tremor: 0 };
  const quadro = (Math.floor(e.distancia / PASSO_ANIMACAO) % 2) as 0 | 1;
  return { pose: e.jogador.agachado ? 'abaixado' : 'correndo', quadro, tremor: 0 };
}

/** Altura, acima do chão, do centro do rótulo: topo da nuvem, folga e meia fonte. */
const ALTURA_ROTULO = NUVEM.baseY + NUVEM.altura + ROTULO_NHF.folga + ROTULO_NHF.fonte / 2;

/** Converte o estado do core na cena de desenho. Só lê o estado; quem desenha não importa a lógica. */
export function cenaDe(e: Estado): Cena {
  const noQuadro = (o: Obstaculo) =>
    o.x - e.distancia < MUNDO.largura && o.x + o.largura - e.distancia > -KELSEN.largura;
  const visiveis = e.obstaculos.filter((o) => noQuadro(o)).map((o) => formaDe(o, e.distancia));
  const rotulos: RotuloCena[] = e.obstaculos
    .filter(
      (o): o is Extract<Obstaculo, { tipo: 'nuvem' }> =>
        o.tipo === 'nuvem' && o.primeira && noQuadro(o)
    )
    .map((o) => ({
      x: o.x + o.larguraGrupo / 2 - e.distancia,
      alturaChao: ALTURA_ROTULO,
      texto: NUVEM.texto
    }));
  return {
    fase: e.fase,
    largura: MUNDO.largura,
    altura: MUNDO.altura,
    corpo: {
      x: KELSEN.x,
      largura: KELSEN.largura,
      pe: e.jogador.pe,
      altura: alturaDoCorpo(e.jogador),
      ...poseDe(e)
    },
    obstaculos: visiveis,
    rotulos,
    distancia: e.distancia,
    pontuacao: pontuacaoDe(e),
    ...(e.ultimaPontuacao === undefined ? {} : { ultimaPontuacao: e.ultimaPontuacao })
  };
}
