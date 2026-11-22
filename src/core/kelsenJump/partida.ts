import { colidem, type Caixa } from './colisao';
import { KELSEN, MUNDO, PONTOS, REINICIO_TRAVA_S } from './constantes';
import { centroDoObstaculo, proximoObstaculo, type Obstaculo } from './obstaculos';
import { alturaDoCorpo, passoDoJogador, saltar, type Jogador } from './fisica';
import { sortear } from './rng';
import { velocidadeEm } from './velocidade';

export type Fase = 'aguardando' | 'correndo';

export interface Entrada {
  /** Verdadeiro só no quadro em que a tecla de pulo foi pressionada. */
  readonly pular: boolean;
  /** Verdadeiro enquanto a tecla de abaixar estiver pressionada. */
  readonly agachar: boolean;
}

export type Evento =
  | { readonly tipo: 'pulo' }
  | { readonly tipo: 'ponto'; readonly origem: 'piramide' | 'nuvem' }
  | { readonly tipo: 'colisao' };

export interface Estado {
  readonly fase: Fase;
  /** Tempo de corrida, em s. Zera a cada partida. */
  readonly tempo: number;
  /** Distância de rolagem, em px. */
  readonly distancia: number;
  readonly jogador: Jogador;
  readonly obstaculos: readonly Obstaculo[];
  readonly semente: number;
  readonly proximoId: number;
  readonly piramides: number;
  readonly nuvens: number;
  /** Segundos que faltam para aceitar um salto depois de uma colisão. */
  readonly trava: number;
  /** Pontuação da última partida encerrada, para a lição. Ausente antes da primeira colisão. */
  readonly ultimaPontuacao?: number;
}

const JOGADOR_PARADO: Jogador = { pe: 0, vy: 0, agachado: false };
const MARGEM_GERACAO = 200;

export function pontuacaoDe(e: Estado): number {
  return (
    e.piramides * PONTOS.piramide +
    e.nuvens * PONTOS.nuvem +
    Math.floor(e.distancia / PONTOS.distanciaPorPonto)
  );
}

/** Garante obstáculos até uma margem depois da borda direita da tela. */
function preencher(e: Estado): Estado {
  const obstaculos = [...e.obstaculos];
  let semente = e.semente;
  let proximoId = e.proximoId;
  let anterior = obstaculos[obstaculos.length - 1];
  const limite = e.distancia + MUNDO.largura + MARGEM_GERACAO;
  while (anterior === undefined || centroDoObstaculo(anterior) < limite) {
    const r = proximoObstaculo(anterior, semente, proximoId);
    obstaculos.push(r.obstaculo);
    anterior = r.obstaculo;
    semente = r.semente;
    proximoId++;
  }
  return { ...e, obstaculos, semente, proximoId };
}

export function estadoInicial(semente: number, ultimaPontuacao?: number, trava = 0): Estado {
  const base: Estado = {
    fase: 'aguardando',
    tempo: 0,
    distancia: 0,
    jogador: JOGADOR_PARADO,
    obstaculos: [],
    semente,
    proximoId: 0,
    piramides: 0,
    nuvens: 0,
    trava,
    ...(ultimaPontuacao === undefined ? {} : { ultimaPontuacao })
  };
  return preencher(base);
}

function caixaDoCorpo(e: Estado, jogador: Jogador): Caixa {
  const x0 = e.distancia + KELSEN.x;
  return {
    x0,
    x1: x0 + KELSEN.largura,
    y0: jogador.pe,
    y1: jogador.pe + alturaDoCorpo(jogador)
  };
}

function caixaDoObstaculo(o: Obstaculo): Caixa {
  const y0 = o.tipo === 'nuvem' ? o.baseY : 0;
  return { x0: o.x, x1: o.x + o.largura, y0, y1: y0 + o.altura };
}

/** Avança a partida em `dt` segundos, com a entrada deste quadro. Puro: não muta o estado recebido. */
export function avancar(
  estado: Estado,
  dt: number,
  entrada: Entrada
): { estado: Estado; eventos: Evento[] } {
  if (estado.fase === 'aguardando') {
    const trava = Math.max(0, estado.trava - dt);
    if (entrada.pular && trava === 0) {
      const iniciado: Estado = {
        ...estado,
        fase: 'correndo',
        trava: 0,
        jogador: saltar(estado.jogador)
      };
      return { estado: iniciado, eventos: [{ tipo: 'pulo' }] };
    }
    return { estado: { ...estado, trava }, eventos: [] };
  }

  const eventos: Evento[] = [];
  let jogador = estado.jogador;
  if (entrada.pular && jogador.pe === 0) {
    jogador = saltar(jogador);
    eventos.push({ tipo: 'pulo' });
  }
  jogador = passoDoJogador(jogador, dt, entrada.agachar);

  const v = velocidadeEm(estado.tempo);
  const distancia = estado.distancia + v * dt;
  const avancado: Estado = { ...estado, tempo: estado.tempo + dt, distancia, jogador };

  const corpo = caixaDoCorpo(avancado, jogador);
  if (avancado.obstaculos.some((o) => colidem(corpo, caixaDoObstaculo(o)))) {
    eventos.push({ tipo: 'colisao' });
    const reiniciado = estadoInicial(
      sortear(estado.semente).semente,
      pontuacaoDe(avancado),
      REINICIO_TRAVA_S
    );
    return { estado: reiniciado, eventos };
  }

  let piramides = estado.piramides;
  let nuvens = estado.nuvens;
  const corpoAtras = distancia + KELSEN.x;
  const obstaculos = avancado.obstaculos.map((o) => {
    if (o.contado || o.x + o.largura > corpoAtras) return o;
    if (o.tipo === 'piramide') {
      piramides++;
      eventos.push({ tipo: 'ponto', origem: 'piramide' });
    } else {
      nuvens++;
      eventos.push({ tipo: 'ponto', origem: 'nuvem' });
    }
    return { ...o, contado: true };
  });

  const limpo = obstaculos.filter((o) => o.x + o.largura > distancia - MARGEM_GERACAO);
  const proximo = preencher({ ...avancado, obstaculos: limpo, piramides, nuvens });
  return { estado: proximo, eventos };
}
