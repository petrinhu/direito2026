import { ESPACO, FISICA, GRUPO_NUVENS, KELSEN, NUVEM, PIRAMIDE, VELOCIDADE } from './constantes';
import { sortear } from './rng';

/**
 * Obstáculos em coordenadas de mundo: `x` é a borda esquerda, em px, medida desde o começo da
 * partida. `centro` é a distância de rolagem em que o centro do obstáculo fica alinhado ao
 * centro do corpo do Kelsen. Toda a regra de "é possível" sai daí.
 */
interface Base {
  readonly id: number;
  readonly x: number;
  readonly largura: number;
  readonly altura: number;
  readonly contado: boolean;
}

export interface Piramide extends Base {
  readonly tipo: 'piramide';
  readonly fator: number;
}

export interface Nuvem extends Base {
  readonly tipo: 'nuvem';
  readonly baseY: number;
  /** Quantas nuvens ainda vêm depois desta no mesmo grupo (0 a 2). */
  readonly restantes: number;
}

export type Obstaculo = Piramide | Nuvem;

const PROBABILIDADE_NUVEM = 0.35;

// ---- Física do salto, em forma fechada ----

/** Ápice do salto, em px: v²/2g. */
export function apexDoSalto(): number {
  return FISICA.velocidadeSalto ** 2 / (2 * FISICA.gravidade);
}

/** Tempo no ar, em s: 2v/g. */
export function tempoDeSalto(): number {
  return (2 * FISICA.velocidadeSalto) / FISICA.gravidade;
}

/** Distância percorrida pelo cenário durante o salto, na velocidade `v`. */
export function distanciaDeSalto(v: number): number {
  return v * tempoDeSalto();
}

/**
 * Quanto o ápice cai quando a janela de sobreposição do corpo com o obstáculo é `largura + corpo`.
 * A parábola é simétrica: a queda nas bordas da janela é g·(meia janela)²/(2v²) em tempo, e a
 * janela inteira vale o quádruplo dela, por isso o termo final é g·(janela)²/(8v²).
 */
export function curvaturaDaJanela(largura: number, v: number): number {
  const janela = largura + KELSEN.largura;
  return (FISICA.gravidade * janela * janela) / (8 * v * v);
}

/** Folga, em px, entre a altura da pirâmide e o alcance do pulo. Cobre erro de integração e de pouso. */
export function margemDeAlturaPiramide(): number {
  return 8;
}

// ---- Geometria ----

export function alturaPiramide(fator: number): number {
  return PIRAMIDE.alturaUnidades * PIRAMIDE.escala * fator;
}

export function larguraPiramide(fator: number): number {
  return PIRAMIDE.larguraUnidades * PIRAMIDE.escala * fator;
}

/** Distância de rolagem em que o centro do obstáculo fica sob o centro do corpo. */
export function centroDoObstaculo(o: Obstaculo): number {
  return o.x + o.largura / 2 - (KELSEN.x + KELSEN.largura / 2);
}

/** Meia janela de sobreposição (em px de rolagem): quanto o corpo ainda encosta de cada lado do centro. */
function meiaJanela(o: Obstaculo): number {
  return (o.largura + KELSEN.largura) / 2;
}

// ---- Saltabilidade ----

/** Pirâmide saltável: cabe no ápice do salto mais lento, com a folga de integração. */
export function ehSaltavel(o: Piramide): boolean {
  const teto =
    apexDoSalto() - curvaturaDaJanela(o.largura, VELOCIDADE.minima) - margemDeAlturaPiramide();
  return o.altura <= teto;
}

/** Nuvem passável abaixado: a altura agachada cabe sob a base e a altura em pé bate nela. */
export function ehPassavelAbaixado(o: Nuvem): boolean {
  return KELSEN.alturaAgachado < o.baseY && KELSEN.alturaEmPe > o.baseY;
}

/**
 * Obstáculo possível: pirâmide saltável, ou nuvem que se passa abaixado. Abaixar passa qualquer nuvem,
 * em qualquer grupo; pular por cima pode passar ou não, como no dinossauro.
 */
export function ehPossivel(o: Obstaculo): boolean {
  return o.tipo === 'piramide' ? ehSaltavel(o) : ehPassavelAbaixado(o);
}

/** Quanto a rolagem avança depois do centro até o próximo obstáculo poder começar. */
function extensaoAposCentro(o: Obstaculo, v: number): number {
  return o.tipo === 'piramide' ? distanciaDeSalto(v) / 2 : meiaJanela(o);
}

/** Quanto a rolagem precisa antes do centro para o obstáculo estar livre do anterior. */
function extensaoAntesCentro(o: Obstaculo, v: number): number {
  return o.tipo === 'piramide' ? distanciaDeSalto(v) / 2 : meiaJanela(o);
}

/**
 * Distância mínima entre os centros de `a` e `b` (a antes de b). Com `v` = velocidade máxima, vale
 * em qualquer velocidade da partida: o pouso de `a` e a preparação de `b` cabem na folga.
 */
export function folgaEntre(a: Obstaculo, b: Obstaculo, v: number = VELOCIDADE.maxima): number {
  return extensaoAposCentro(a, v) + extensaoAntesCentro(b, v) + ESPACO.folga;
}

// ---- Gerador ----

/**
 * Próximo obstáculo depois de `anterior` (ou o primeiro, se não houver anterior). A semente
 * avança a cada sorteio, então a partida inteira é reproduzível.
 */
export function proximoObstaculo(
  anterior: Obstaculo | undefined,
  semente: number,
  id: number
): { obstaculo: Obstaculo; semente: number } {
  const continuaGrupo = anterior?.tipo === 'nuvem' && anterior.restantes > 0;
  const tipoSorteio = continuaGrupo ? { valor: 0, semente } : sortear(semente);
  const ehNuvem = continuaGrupo || tipoSorteio.valor < PROBABILIDADE_NUVEM;
  let s = tipoSorteio.semente;

  const base = { id, contado: false } as const;
  let candidato: Obstaculo;
  if (ehNuvem) {
    // Grupo de 1 a 3 nuvens, como os pássaros do dinossauro: o sorteio do tamanho só vale no 1º da fila.
    let restantes = continuaGrupo ? anterior.restantes - 1 : 0;
    if (!continuaGrupo) {
      const sorteioGrupo = sortear(s);
      s = sorteioGrupo.semente;
      restantes = Math.min(2, Math.floor(sorteioGrupo.valor * 3));
    }
    candidato = {
      ...base,
      tipo: 'nuvem',
      x: 0,
      largura: NUVEM.largura,
      altura: NUVEM.altura,
      baseY: NUVEM.baseY,
      restantes
    };
  } else {
    const fatorSorteio = sortear(s);
    s = fatorSorteio.semente;
    const indice = Math.min(
      PIRAMIDE.fatores.length - 1,
      Math.floor(fatorSorteio.valor * PIRAMIDE.fatores.length)
    );
    const fator = PIRAMIDE.fatores[indice] as number;
    candidato = {
      ...base,
      tipo: 'piramide',
      fator,
      x: 0,
      largura: larguraPiramide(fator),
      altura: alturaPiramide(fator)
    };
  }

  const extraSorteio = sortear(s);
  s = extraSorteio.semente;
  const centroAnterior = anterior ? centroDoObstaculo(anterior) : undefined;
  const centro =
    centroAnterior === undefined || anterior === undefined
      ? ESPACO.inicial
      : continuaGrupo
        ? centroAnterior + NUVEM.largura + GRUPO_NUVENS.espaco
        : centroAnterior +
          folgaEntre(anterior, candidato) +
          extraSorteio.valor * ESPACO.extraMaximo;

  const x = centro - candidato.largura / 2 + KELSEN.x + KELSEN.largura / 2;
  return { obstaculo: { ...candidato, x } as Obstaculo, semente: s };
}

/** Sequência de tamanho `n` a partir da semente. Usada pelos testes; a partida gera sob demanda. */
export function geraSequencia(semente: number, n: number): Obstaculo[] {
  const saida: Obstaculo[] = [];
  let anterior: Obstaculo | undefined;
  let s = semente;
  for (let i = 0; i < n; i++) {
    const r = proximoObstaculo(anterior, s, i);
    saida.push(r.obstaculo);
    anterior = r.obstaculo;
    s = r.semente;
  }
  return saida;
}
