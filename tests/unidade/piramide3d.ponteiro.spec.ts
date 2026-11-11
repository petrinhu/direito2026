import { describe, expect, it } from 'vitest';
import {
  cantosDoRetangulo,
  cascoConvexo,
  dentroDoConvexo,
  dentroDoRetangulo,
  nivelSobPonteiro
} from '@/core/piramide3d/ponteiro';
import type { FormaNivel, Ponto } from '@/core/piramide3d/tipos';

const quadrado = (x: number, y: number, w: number, h: number): Ponto[] => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h }
];

const forma = (parcial: Partial<FormaNivel> & Pick<FormaNivel, 'nivel'>): FormaNivel => ({
  repouso: null,
  frente: null,
  profundidade: 5,
  rotulo: null,
  ...parcial
});

const silhuetaGrande = quadrado(-200, -200, 600, 600);
const p = { x: 50, y: 50 };

describe('ponteiro: nível sob o ponteiro', () => {
  it('a face do próprio nível vence a silhueta de um vizinho que vem antes na lista', () => {
    const formas = [
      forma({
        nivel: 'vizinho',
        repouso: cascoConvexo(silhuetaGrande),
        frente: cascoConvexo(quadrado(300, 300, 100, 100)),
        profundidade: 1
      }),
      forma({
        nivel: 'proprio',
        repouso: cascoConvexo(quadrado(0, 0, 100, 100)),
        frente: cascoConvexo(quadrado(0, 0, 100, 100)),
        profundidade: 9
      })
    ];
    expect(nivelSobPonteiro({ p, ativo: null, formas, zonas: new Map() })).toBe('proprio');
  });

  it('só a silhueta sob o ponteiro (topo ou costas) não ativa nada', () => {
    const formas = [
      forma({
        nivel: 'so-silhueta',
        repouso: cascoConvexo(silhuetaGrande),
        frente: cascoConvexo(quadrado(300, 300, 100, 100)),
        profundidade: 1
      })
    ];
    expect(nivelSobPonteiro({ p, ativo: null, formas, zonas: new Map() })).toBeNull();
  });

  it('duas faces que contêm o ponto: vence a mais próxima do observador', () => {
    const formas = [
      forma({ nivel: 'longe', frente: cascoConvexo(quadrado(0, 0, 100, 100)), profundidade: 9 }),
      forma({ nivel: 'perto', frente: cascoConvexo(quadrado(0, 0, 100, 100)), profundidade: 4 })
    ];
    expect(nivelSobPonteiro({ p, ativo: null, formas, zonas: new Map() })).toBe('perto');
  });

  it('o rótulo vale quando nenhuma face está sob o ponteiro', () => {
    const formas = [forma({ nivel: 'a', rotulo: { x: 0, y: 0, w: 100, h: 100 } })];
    expect(nivelSobPonteiro({ p, ativo: null, formas, zonas: new Map() })).toBe('a');
  });

  it('com b ativo, a face de a sob o ponteiro troca para a', () => {
    const formas = [
      forma({ nivel: 'a', frente: cascoConvexo(quadrado(0, 0, 100, 100)) }),
      forma({ nivel: 'b', frente: cascoConvexo(quadrado(400, 400, 100, 100)) })
    ];
    expect(nivelSobPonteiro({ p, ativo: 'b', formas, zonas: new Map() })).toBe('a');
  });

  it('com b ativo, o ponteiro na zona de permanência de b continua em b', () => {
    const formas = [forma({ nivel: 'a', frente: cascoConvexo(quadrado(0, 0, 100, 100)) })];
    const zonas = new Map([['b', cascoConvexo(quadrado(-10, -10, 200, 200))]]);
    expect(nivelSobPonteiro({ p, ativo: 'b', formas, zonas })).toBe('b');
  });

  it('com b ativo, fora da zona e fora de qualquer nível, devolve null (fechar)', () => {
    const formas = [forma({ nivel: 'a', frente: cascoConvexo(quadrado(300, 300, 50, 50)) })];
    const zonas = new Map([['b', cascoConvexo(quadrado(500, 500, 10, 10))]]);
    expect(nivelSobPonteiro({ p, ativo: 'b', formas, zonas })).toBeNull();
  });
});

describe('ponteiro: formas', () => {
  it('o casco convexo descarta o ponto de dentro e fica em sentido anti-horário', () => {
    const casco = cascoConvexo([...quadrado(0, 0, 10, 10), { x: 5, y: 5 }]);
    expect(casco).toHaveLength(4);
    expect(dentroDoConvexo({ x: 5, y: 5 }, casco)).toBe(true);
    expect(dentroDoConvexo({ x: 11, y: 5 }, casco)).toBe(false);
  });

  it('a borda conta como dentro; casco com menos de 3 pontos nunca contém nada', () => {
    const casco = cascoConvexo(quadrado(0, 0, 10, 10));
    expect(dentroDoConvexo({ x: 0, y: 5 }, casco)).toBe(true);
    expect(
      dentroDoConvexo({ x: 0, y: 0 }, [
        { x: 0, y: 0 },
        { x: 1, y: 1 }
      ])
    ).toBe(false);
  });

  it('retângulo: dentro, fora e os quatro cantos', () => {
    const r = { x: 10, y: 20, w: 30, h: 40 };
    expect(dentroDoRetangulo({ x: 10, y: 20 }, r)).toBe(true);
    expect(dentroDoRetangulo({ x: 41, y: 20 }, r)).toBe(false);
    expect(cantosDoRetangulo(r)).toEqual([
      { x: 10, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 60 },
      { x: 10, y: 60 }
    ]);
  });
});
