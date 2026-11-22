import { describe, expect, it } from 'vitest';
import {
  ESPACO,
  FOLGA_NUVEM_S,
  KELSEN,
  NUVEM,
  PASSO_FIXO_S,
  PIRAMIDE,
  VELOCIDADE
} from '@/core/kelsenJump/constantes';
import { colidem, type Caixa } from '@/core/kelsenJump/colisao';
import { passoDoJogador, saltar, type Jogador } from '@/core/kelsenJump/fisica';
import {
  alturaPiramide,
  apexDoSalto,
  centroDoObstaculo,
  distanciaAcimaDe,
  distanciaDeSalto,
  ehPassavelAbaixado,
  ehPossivel,
  ehSaltavel,
  folgaEntre,
  geraSequencia,
  larguraPiramide,
  margemDeAlturaPiramide,
  nuvemNaoSaltavel,
  tempoDeSalto,
  type Nuvem
} from '@/core/kelsenJump/obstaculos';

const nuvem: Nuvem = {
  tipo: 'nuvem',
  x: 0,
  largura: NUVEM.largura,
  altura: NUVEM.altura,
  baseY: NUVEM.baseY,
  contado: false,
  id: 0
};

describe('pirâmide: altura dentro do alcance do pulo', () => {
  it('a pirâmide mais alta fica abaixo do ápice menos a folga, na velocidade mínima', () => {
    const maior = Math.max(...PIRAMIDE.fatores);
    expect(alturaPiramide(maior)).toBeLessThan(apexDoSalto() - margemDeAlturaPiramide());
  });

  it('há pelo menos três alturas diferentes de pirâmide', () => {
    expect(new Set(PIRAMIDE.fatores.map(alturaPiramide)).size).toBeGreaterThanOrEqual(3);
  });

  it('a largura e a altura crescem na mesma proporção (mesmo desenho, outra escala)', () => {
    const a = PIRAMIDE.fatores[0];
    const b = PIRAMIDE.fatores[1];
    expect(larguraPiramide(b) / larguraPiramide(a)).toBeCloseTo(b / a, 6);
    expect(alturaPiramide(b) / alturaPiramide(a)).toBeCloseTo(b / a, 6);
  });
});

describe('nuvem NHF: passa-se abaixado, nunca em pé e nunca pulada', () => {
  it('a altura agachada cabe sob a base da nuvem, e a altura em pé bate nela', () => {
    expect(ehPassavelAbaixado(nuvem)).toBe(true);
  });

  it('a nuvem fica abaixo do ápice: quem a vence é a largura, não a altura', () => {
    expect(NUVEM.baseY + NUVEM.altura).toBeLessThan(apexDoSalto());
  });

  it('a largura passa do intervalo que o corpo fica acima do topo, mais a folga, na velocidade máxima', () => {
    const topo = nuvem.baseY + nuvem.altura;
    const acima = distanciaAcimaDe(topo, VELOCIDADE.maxima);
    expect(nuvem.largura + KELSEN.largura).toBeGreaterThan(
      acima + VELOCIDADE.maxima * FOLGA_NUVEM_S
    );
    expect(nuvemNaoSaltavel(nuvem)).toBe(true);
  });

  it('o pulo colide com a nuvem em toda decolagem que a sobrepõe, em todas as velocidades', () => {
    const caixa: Caixa = {
      x0: nuvem.x,
      x1: nuvem.x + nuvem.largura,
      y0: nuvem.baseY,
      y1: nuvem.baseY + nuvem.altura
    };
    const meia = (nuvem.largura + KELSEN.largura) / 2;
    for (const v of [VELOCIDADE.minima, VELOCIDADE.maxima]) {
      const alcance = meia + distanciaDeSalto(v) / 2;
      for (let k = 0; k <= 80; k++) {
        const deslocamento = (k / 80 - 0.5) * 2 * alcance * 0.95;
        // O ápice cai em centro + deslocamento: a decolagem fica meio salto antes.
        const decolagem = centroDoObstaculo(nuvem) + deslocamento - distanciaDeSalto(v) / 2;
        let jogador: Jogador = saltar({ pe: 0, vy: 0, agachado: false });
        let s = decolagem;
        let colidiu = false;
        const passos = Math.ceil((tempoDeSalto() + 0.2) / PASSO_FIXO_S);
        for (let i = 0; i < passos && !colidiu; i++) {
          jogador = passoDoJogador(jogador, PASSO_FIXO_S, false);
          s += v * PASSO_FIXO_S;
          const x0 = s + KELSEN.x;
          colidiu = colidem(
            { x0, x1: x0 + KELSEN.largura, y0: jogador.pe, y1: jogador.pe + KELSEN.alturaEmPe },
            caixa
          );
        }
        expect(colidiu, `velocidade ${v}, deslocamento ${deslocamento.toFixed(1)}`).toBe(true);
      }
    }
  });
});

describe('espaçamento entre obstáculos', () => {
  it('pirâmide após pirâmide: folga = meio pulo de cada lado + folga, na velocidade máxima', () => {
    const pir = {
      tipo: 'piramide' as const,
      fator: 1,
      x: 0,
      largura: larguraPiramide(1),
      altura: alturaPiramide(1),
      contado: false,
      id: 0
    };
    expect(folgaEntre(pir, pir, VELOCIDADE.maxima)).toBeCloseTo(
      distanciaDeSalto(VELOCIDADE.maxima) + ESPACO.folga,
      6
    );
  });

  it('nuvem após nuvem: a folga inclui a janela de cada nuvem e a folga', () => {
    const janela = (NUVEM.largura + KELSEN.largura) / 2;
    expect(folgaEntre(nuvem, nuvem, VELOCIDADE.maxima)).toBeCloseTo(2 * janela + ESPACO.folga, 6);
  });
});

describe('gerador: toda sequência gerada é possível', () => {
  for (const semente of [1, 7, 42, 2026, 99991]) {
    it(`semente ${semente}: 300 obstáculos, todos possíveis`, () => {
      const seq = geraSequencia(semente, 300);
      expect(seq).toHaveLength(300);
      for (const o of seq) expect(ehPossivel(o)).toBe(true);
    });

    it(`semente ${semente}: centros em ordem crescente e folga mínima respeitada`, () => {
      const seq = geraSequencia(semente, 300);
      for (let i = 1; i < seq.length; i++) {
        const a = seq[i - 1]!;
        const b = seq[i]!;
        expect(centroDoObstaculo(b) - centroDoObstaculo(a)).toBeGreaterThanOrEqual(
          folgaEntre(a, b, VELOCIDADE.maxima) - 1e-9
        );
      }
    });
  }

  it('a mesma semente gera a mesma sequência', () => {
    expect(geraSequencia(5, 40)).toEqual(geraSequencia(5, 40));
  });

  it('sementes diferentes geram sequências diferentes', () => {
    expect(geraSequencia(5, 40)).not.toEqual(geraSequencia(6, 40));
  });

  it('pirâmide gerada é saltável; ehSaltavel só aceita pirâmide', () => {
    const p = geraSequencia(42, 50).find((o) => o.tipo === 'piramide');
    expect(p && p.tipo === 'piramide' && ehSaltavel(p)).toBe(true);
  });
});
