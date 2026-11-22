import {
  avancar,
  escolherIndiceLicao,
  estadoInicial,
  PASSO_FIXO_S,
  type Entrada,
  type Estado,
  type Evento
} from '@/core/kelsenJump';
import { cenaDe, type Cena } from './cena';

export interface OpcoesJogo {
  readonly semente: number;
  /** Quantas lições existem, para sortear uma depois de cada colisão. */
  readonly totalLicoes: number;
  readonly aoAtualizar: (cena: Cena) => void;
  readonly aoEvento: (evento: Evento) => void;
  /** Agenda o próximo quadro. Padrão: requestAnimationFrame. Injetável para teste. */
  readonly agendar?: (quadro: (agora: number) => void) => number;
  readonly cancelar?: (id: number) => void;
}

export interface Jogo {
  pular(): void;
  agachar(ativo: boolean): void;
  iniciar(): void;
  parar(): void;
}

/** Limite de tempo por quadro: depois de uma aba oculta, o jogo não dá um salto de segundos. */
const DT_MAXIMO_S = 0.1;

/**
 * Laço do jogo com passo fixo: a lógica avança em PASSO_FIXO_S, sempre o mesmo, e o desenho é
 * feito a cada quadro com o estado atual. Sem pausa, sem estado de reatividade do Vue.
 */
export function criarJogo(op: OpcoesJogo): Jogo {
  const agendar = op.agendar ?? ((q) => requestAnimationFrame(q));
  const cancelar = op.cancelar ?? ((id) => cancelAnimationFrame(id));

  let estado: Estado = estadoInicial(op.semente);
  let licao: number | undefined;
  let pularPendente = false;
  let agachando = false;
  let acumulado = 0;
  let ultimo: number | undefined;
  let quadroId: number | undefined;
  let rodando = false;

  function passo(): void {
    const entrada: Entrada = { pular: pularPendente, agachar: agachando };
    pularPendente = false;
    const r = avancar(estado, PASSO_FIXO_S, entrada);
    estado = r.estado;
    if (estado.fase === 'correndo') licao = undefined;
    for (const evento of r.eventos) {
      if (evento.tipo === 'colisao') {
        licao = escolherIndiceLicao(estado.semente, op.totalLicoes);
      }
      op.aoEvento(evento);
    }
  }

  function quadro(agora: number): void {
    if (!rodando) return;
    if (ultimo === undefined) ultimo = agora;
    acumulado += Math.min(DT_MAXIMO_S, (agora - ultimo) / 1000);
    ultimo = agora;
    while (acumulado >= PASSO_FIXO_S) {
      passo();
      acumulado -= PASSO_FIXO_S;
    }
    const cena = cenaDe(estado);
    op.aoAtualizar(licao === undefined ? cena : { ...cena, licao });
    quadroId = agendar(quadro);
  }

  return {
    pular() {
      pularPendente = true;
    },
    agachar(ativo) {
      agachando = ativo;
    },
    iniciar() {
      if (rodando) return;
      rodando = true;
      ultimo = undefined;
      quadroId = agendar(quadro);
    },
    parar() {
      rodando = false;
      if (quadroId !== undefined) cancelar(quadroId);
      quadroId = undefined;
    }
  };
}
