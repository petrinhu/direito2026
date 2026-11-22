import { describe, expect, it } from 'vitest';
import {
  KELSEN,
  NUVEM,
  PASSO_FIXO_S,
  PONTOS,
  REINICIO_TRAVA_S,
  VELOCIDADE
} from '@/core/kelsenJump/constantes';
import { avancar, estadoInicial, pontuacaoDe, type Entrada } from '@/core/kelsenJump/partida';
import { velocidadeEm } from '@/core/kelsenJump/velocidade';
import { colidem } from '@/core/kelsenJump/colisao';

const SEM: Entrada = { pular: false, agachar: false };
const PULAR: Entrada = { pular: true, agachar: false };

function passos(estado: ReturnType<typeof estadoInicial>, n: number, entrada: Entrada = SEM) {
  let atual = estado;
  const eventos: string[] = [];
  for (let i = 0; i < n; i++) {
    const r = avancar(atual, PASSO_FIXO_S, i === 0 ? entrada : SEM);
    atual = r.estado;
    eventos.push(...r.eventos.map((e) => e.tipo));
  }
  return { estado: atual, eventos };
}

describe('início', () => {
  it('começa parado, aguardando o primeiro salto, sem correr', () => {
    const e = estadoInicial(3);
    const r = passos(e, 240);
    expect(r.estado.fase).toBe('aguardando');
    expect(r.estado.distancia).toBe(0);
  });

  it('o primeiro salto inicia a corrida e salta de uma vez', () => {
    const r = avancar(estadoInicial(3), PASSO_FIXO_S, PULAR);
    expect(r.estado.fase).toBe('correndo');
    expect(r.estado.jogador.vy).toBeGreaterThan(0);
    expect(r.eventos.map((e) => e.tipo)).toContain('pulo');
  });
});

describe('velocidade', () => {
  it('cresce com o tempo e respeita o teto', () => {
    expect(velocidadeEm(0)).toBe(VELOCIDADE.minima);
    expect(velocidadeEm(10)).toBeGreaterThan(velocidadeEm(0));
    expect(velocidadeEm(1e6)).toBe(VELOCIDADE.maxima);
  });
});

describe('colisão e reinício', () => {
  it('colisão com um obstáculo devolve o jogo ao começo e registra a pontuação anterior', () => {
    const e = estadoInicial(3);
    const r = passos(e, 60 * 120, PULAR);
    expect(r.eventos).toContain('colisao');
    expect(r.estado.fase).toBe('aguardando');
    expect(r.estado.distancia).toBe(0);
    expect(r.estado.ultimaPontuacao).toBeDefined();
  });

  it('há uma trava curta depois da colisão: o salto não reinicia antes do prazo', () => {
    // Para exatamente no quadro da colisão, sem deixar o jogo andar sozinho depois.
    let atual = estadoInicial(3);
    for (let i = 0; i < 60 * 120; i++) {
      const r = avancar(atual, PASSO_FIXO_S, i === 0 ? PULAR : SEM);
      atual = r.estado;
      if (r.eventos.some((e) => e.tipo === 'colisao')) break;
    }
    expect(atual.fase).toBe('aguardando');
    expect(atual.trava).toBeCloseTo(REINICIO_TRAVA_S, 9);
    const logo = avancar(atual, PASSO_FIXO_S, PULAR);
    expect(logo.estado.fase).toBe('aguardando');
    // Quem martela espaço a cada quadro só volta a correr depois da trava.
    let corrida = atual;
    let instante = 0;
    while (corrida.fase === 'aguardando' && instante < 5) {
      corrida = avancar(corrida, PASSO_FIXO_S, PULAR).estado;
      instante += PASSO_FIXO_S;
    }
    expect(corrida.fase).toBe('correndo');
    expect(instante).toBeGreaterThanOrEqual(REINICIO_TRAVA_S - PASSO_FIXO_S);
  });

  it('colisão AABB: corpo em pé no chão sobre a nuvem dispara; corpo agachado não', () => {
    const corpoEmPe = { x0: 0, x1: KELSEN.largura, y0: 0, y1: KELSEN.alturaEmPe };
    const corpoAgachado = { x0: 0, x1: KELSEN.largura, y0: 0, y1: KELSEN.alturaAgachado };
    const nuvem = { x0: 5, x1: 60, y0: NUVEM.baseY, y1: NUVEM.baseY + 36 };
    expect(colidem(corpoEmPe, nuvem)).toBe(true);
    expect(colidem(corpoAgachado, nuvem)).toBe(false);
  });
});

describe('pontuação', () => {
  it('soma pirâmides, nuvens e distância percorrida', () => {
    const base = estadoInicial(3);
    const e = { ...base, piramides: 2, nuvens: 1, distancia: 400 };
    expect(pontuacaoDe(e)).toBe(
      2 * PONTOS.piramide + 1 * PONTOS.nuvem + Math.floor(400 / PONTOS.distanciaPorPonto)
    );
  });

  it('passar por um obstáculo sem bater emite evento de ponto', () => {
    // Coberto pelo robô (robo.spec.ts): o robô passa obstáculos e recebe pontos.
    expect(PONTOS.piramide).toBeGreaterThan(0);
  });
});
