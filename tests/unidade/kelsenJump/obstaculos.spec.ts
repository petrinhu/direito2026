import { describe, expect, it } from 'vitest';
import {
  ESPACO,
  GRUPO_NUVENS,
  KELSEN,
  NUVEM,
  PIRAMIDE,
  TEMPO_RESPOSTA_S,
  VELOCIDADE
} from '@/core/kelsenJump/constantes';
import { colidem } from '@/core/kelsenJump/colisao';
import {
  alturaPiramide,
  apexDoSalto,
  centroDoObstaculo,
  distanciaDeSalto,
  ehPassavelAbaixado,
  ehPossivel,
  ehSaltavel,
  folgaEntre,
  geraSequencia,
  larguraPiramide,
  margemDeAlturaPiramide,
  type Nuvem
} from '@/core/kelsenJump/obstaculos';

const nuvem: Nuvem = {
  tipo: 'nuvem',
  x: 0,
  largura: NUVEM.largura,
  altura: NUVEM.altura,
  baseY: NUVEM.baseY,
  contado: false,
  id: 0,
  restantes: 0
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

describe('nuvem NHF: sempre se passa abaixado; em grupos de 1 a 3, como o dinossauro', () => {
  it('a altura agachada passa sob a base da nuvem, e a altura em pé bate nela', () => {
    expect(ehPassavelAbaixado(nuvem)).toBe(true);
  });

  it('a nuvem fica na altura da cabeça: topo abaixo do ápice do pulo', () => {
    expect(NUVEM.baseY + NUVEM.altura).toBeLessThan(apexDoSalto());
  });

  it('grupos de 1 a 3 nuvens; dentro do grupo, a distância entre centros é a largura mais o espaço do grupo', () => {
    for (const semente of [1, 7, 42, 2026]) {
      const seq = geraSequencia(semente, 300);
      for (let i = 0; i < seq.length; i++) {
        const o = seq[i]!;
        if (o.tipo !== 'nuvem') continue;
        expect(o.restantes).toBeGreaterThanOrEqual(0);
        expect(o.restantes).toBeLessThanOrEqual(2);
        const seguinte = seq[i + 1];
        if (o.restantes > 0) {
          expect(seguinte?.tipo).toBe('nuvem');
          expect(centroDoObstaculo(seguinte!) - centroDoObstaculo(o)).toBeCloseTo(
            NUVEM.largura + GRUPO_NUVENS.espaco,
            6
          );
        }
      }
    }
  });

  it('o gerador produz grupos de mais de uma nuvem', () => {
    const seq = geraSequencia(42, 400);
    expect(seq.some((o) => o.tipo === 'nuvem' && o.restantes > 0)).toBe(true);
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
        const dentroDoGrupo = a.tipo === 'nuvem' && a.restantes > 0;
        const minimo = dentroDoGrupo
          ? NUVEM.largura + GRUPO_NUVENS.espaco
          : folgaEntre(a, b, VELOCIDADE.maxima);
        expect(centroDoObstaculo(b) - centroDoObstaculo(a)).toBeGreaterThanOrEqual(minimo - 1e-9);
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

/** Grupos consecutivos de nuvens da sequência, do primeiro ao último (`restantes` chega a zero). */
function gruposDe(seq: ReturnType<typeof geraSequencia>): Nuvem[][] {
  const grupos: Nuvem[][] = [];
  let atual: Nuvem[] | undefined;
  for (const o of seq) {
    if (o.tipo !== 'nuvem') {
      atual = undefined;
      continue;
    }
    if (!atual) {
      atual = [];
      grupos.push(atual);
    }
    atual.push(o);
    if (o.restantes === 0) atual = undefined;
  }
  return grupos;
}

describe('grupo de nuvens: abaixar passa e em pé bate, em toda posição do corpo', () => {
  it('o vão entre nuvens é menor que a caixa do corpo: em pé, não há passagem', () => {
    expect(GRUPO_NUVENS.espaco).toBeLessThan(KELSEN.largura);
  });

  for (const semente of [1, 7, 42, 2026, 99991]) {
    it(`semente ${semente}: sobre todo grupo, agachado nunca colide e em pé colide sempre na faixa do grupo`, () => {
      const grupos = gruposDe(geraSequencia(semente, 300));
      expect(grupos.length).toBeGreaterThan(0);
      for (const grupo of grupos) {
        const esquerda = grupo[0]!.x;
        const direita = grupo[grupo.length - 1]!.x + NUVEM.largura;
        const caixas = grupo.map((c) => ({
          x0: c.x,
          x1: c.x + c.largura,
          y0: c.baseY,
          y1: c.baseY + c.altura
        }));
        for (let d = esquerda - KELSEN.largura - 2; d <= direita + 2; d += 0.25) {
          const x0 = d;
          const x1 = d + KELSEN.largura;
          const emPe = { x0, x1, y0: 0, y1: KELSEN.alturaEmPe };
          const agachado = { x0, x1, y0: 0, y1: KELSEN.alturaAgachado };
          const bateEmPe = caixas.some((c) => colidem(emPe, c));
          const bateAgachado = caixas.some((c) => colidem(agachado, c));
          expect(bateAgachado, `agachado colidiu em d=${d}`).toBe(false);
          const naFaixa = x1 > esquerda && x0 < direita;
          expect(bateEmPe, `em pé em d=${d}`).toBe(naFaixa);
        }
      }
    });
  }
});

describe('derivação da folga: nuvem em grupo seguida de pirâmide', () => {
  it('a folga é o tempo de resposta na velocidade máxima', () => {
    expect(ESPACO.folga).toBeCloseTo(TEMPO_RESPOSTA_S * VELOCIDADE.maxima, 9);
  });

  for (const semente of [1, 7, 42, 2026, 99991]) {
    it(`semente ${semente}: do fim do grupo ao início do salto da pirâmide sobram pelo menos ${TEMPO_RESPOSTA_S} s em velocidade máxima`, () => {
      const seq = geraSequencia(semente, 300);
      let casos = 0;
      for (let i = 1; i < seq.length; i++) {
        const a = seq[i - 1]!;
        const b = seq[i]!;
        if (a.tipo !== 'nuvem' || a.restantes !== 0 || b.tipo !== 'piramide') continue;
        casos++;
        const meiaJanela = (a.largura + KELSEN.largura) / 2;
        const decolagem = centroDoObstaculo(b) - distanciaDeSalto(VELOCIDADE.maxima) / 2;
        const livre = decolagem - (centroDoObstaculo(a) + meiaJanela);
        expect(livre).toBeGreaterThanOrEqual(TEMPO_RESPOSTA_S * VELOCIDADE.maxima - 1e-9);
      }
      expect(casos).toBeGreaterThan(0);
    });
  }
});
