import { describe, expect, it } from 'vitest';
import { calcularEnquadre, type EntradaEnquadre } from '@/core/fichamento/enquadreMapa';

const base: EntradaEnquadre = {
  conteudo: { x1: 0, y1: 0, x2: 400, y2: 200 },
  quadro: { largura: 800, altura: 400 },
  escalaMinima: 0.75,
  escalaMaxima: 1.2,
  razao: 0.95,
  margem: 12,
  raiz: { y: 100 }
};

describe('calcularEnquadre', () => {
  it('cabendo, enquadra tudo (limitado à escala máxima) e centraliza', () => {
    const v = calcularEnquadre(base);
    expect(v.k).toBe(1.2);
    expect(v.x).toBeCloseTo((800 - 400 * 1.2) / 2);
    expect(v.y).toBeCloseTo((400 - 200 * 1.2) / 2);
  });

  it('não cabendo na escala mínima, trava nela e alinha a raiz à esquerda', () => {
    const v = calcularEnquadre({ ...base, conteudo: { x1: 10, y1: 0, x2: 3000, y2: 2000 } });
    expect(v.k).toBe(0.75);
    expect(v.x).toBeCloseTo(12 - 10 * 0.75);
    expect(v.y).toBeCloseTo(200 - 100 * 0.75);
  });

  it('com foco, trava na escala mínima e centraliza no nó', () => {
    const v = calcularEnquadre({
      ...base,
      conteudo: { x1: 0, y1: 0, x2: 3000, y2: 2000 },
      foco: { x: 500, y: 300 }
    });
    expect(v.k).toBe(0.75);
    expect(v.x).toBeCloseTo(400 - 500 * 0.75);
    expect(v.y).toBeCloseTo(200 - 300 * 0.75);
  });

  it('nunca devolve escala abaixo da mínima, por maior que seja o mapa', () => {
    const v = calcularEnquadre({ ...base, conteudo: { x1: 0, y1: 0, x2: 1e6, y2: 1e6 } });
    expect(v.k).toBe(0.75);
  });
});
