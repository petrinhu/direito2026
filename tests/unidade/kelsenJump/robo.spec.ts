import { describe, expect, it } from 'vitest';
import { KELSEN, PASSO_FIXO_S, VELOCIDADE } from '@/core/kelsenJump/constantes';
import { avancar, estadoInicial, type Entrada, type Estado } from '@/core/kelsenJump/partida';
import { centroDoObstaculo, distanciaDeSalto } from '@/core/kelsenJump/obstaculos';
import { velocidadeEm } from '@/core/kelsenJump/velocidade';

/**
 * Robô de referência: não vê o futuro além do próximo obstáculo, reage com um atraso de
 * `reacaoS` segundos (negativo = adianta) e só salta com o pé no chão. Se o robô atravessa a
 * partida inteira, o jogo é possível para um jogador com essa reação.
 */
function decidir(e: Estado, reacaoS: number): Entrada {
  const v = velocidadeEm(e.tempo);
  const meiaDoSalto = distanciaDeSalto(v) / 2;
  const corpoEsquerda = e.distancia + KELSEN.x;
  const proximo = e.obstaculos.find((o) => o.x + o.largura > corpoEsquerda);
  if (!proximo) return { pular: false, agachar: false };

  if (proximo.tipo === 'piramide') {
    const falta = centroDoObstaculo(proximo) - e.distancia;
    return { pular: e.jogador.pe === 0 && falta <= meiaDoSalto + v * reacaoS, agachar: false };
  }
  // Abaixa com 0,1 s de antecipação: a decisão do quadro só vale no quadro seguinte.
  const antecipacao = v * 0.1;
  const aproximando = corpoEsquerda + KELSEN.largura + antecipacao > proximo.x;
  const aindaNela = corpoEsquerda < proximo.x + proximo.largura;
  return { pular: false, agachar: aproximando && aindaNela };
}

function correr(semente: number, reacaoS: number, segundos: number) {
  let e = estadoInicial(semente);
  const eventos: string[] = [];
  let primeiro = true;
  const passos = Math.round(segundos / PASSO_FIXO_S);
  for (let i = 0; i < passos; i++) {
    const entrada: Entrada = primeiro ? { pular: true, agachar: false } : decidir(e, reacaoS);
    primeiro = false;
    const r = avancar(e, PASSO_FIXO_S, entrada);
    eventos.push(...r.eventos.map((x) => x.tipo));
    e = r.estado;
    if (eventos.includes('colisao')) break;
  }
  return { eventos, estado: e };
}

describe('robô de referência atravessa a partida (é possível)', () => {
  for (const semente of [1, 7, 42, 2026, 99991]) {
    for (const reacaoS of [-0.04, 0, 0.04]) {
      it(`semente ${semente}, reação ${reacaoS}s: 150 s sem colisão, com pontos`, () => {
        const { eventos, estado } = correr(semente, reacaoS, 150);
        expect(eventos).not.toContain('colisao');
        expect(eventos).toContain('ponto');
        expect(estado.tempo).toBeGreaterThan(149);
      });
    }
  }

  it('a velocidade chega ao teto dentro da partida de teste', () => {
    const { estado } = correr(42, 0, 150);
    expect(velocidadeEm(estado.tempo)).toBe(VELOCIDADE.maxima);
  });
});
