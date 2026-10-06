import { describe, expect, it } from 'vitest';
import { paraArvoreLista, paraArvoreMarkmapRestrita } from '@/core/restrito/arvoreRestrita';
import { idsExpansiveis, percorrer } from '@/core/fichamento/arvoreMapa';
import { abertosIniciais } from '@/core/fichamento/navegacaoArvore';
import type { NoMapa } from '@/core/restrito/tipos';

const mapa: NoMapa = {
  rotulo: 'Raiz <fictícia> & cia',
  filhos: [
    { rotulo: 'Ramo A', filhos: [{ rotulo: 'A1' }, { rotulo: 'A2', filhos: [{ rotulo: 'A2x' }] }] },
    { rotulo: 'Ramo B', filhos: [{ rotulo: 'B1' }] },
    { rotulo: 'Ramo C' }
  ]
};

describe('paraArvoreMarkmapRestrita', () => {
  const raiz = paraArvoreMarkmapRestrita(mapa);

  it('escapa o rótulo: nada de marcação chega ao SVG', () => {
    expect(raiz.content).toBe('Raiz &lt;fictícia&gt; &amp; cia');
  });

  it('dá um ramo de cor por filho direto da raiz, herdado pelos descendentes', () => {
    expect(raiz.children.map((c) => c.payload?.ramo)).toEqual([0, 1, 2]);
    expect(raiz.children[0]!.children[1]!.payload?.ramo).toBe(0);
    expect(raiz.children[0]!.children[1]!.children[0]!.payload?.ramo).toBe(0);
  });

  it('começa com raiz e ramos abertos e o resto recolhido', () => {
    expect(raiz.payload?.fold).toBe(0);
    expect(raiz.children[0]!.payload?.fold).toBe(0);
    expect(raiz.children[0]!.children[1]!.payload?.fold).toBe(1);
  });

  it('não cria nada que o mapa de origem não tenha', () => {
    const contar = (n: { children: unknown[] }): number =>
      1 + (n.children as { children: unknown[] }[]).reduce((s, f) => s + contar(f), 0);
    expect(contar(raiz)).toBe(8);
  });
});

describe('paraArvoreLista (mesma fonte do mapa visual)', () => {
  const arvore = paraArvoreLista(mapa);

  it('mantém rótulos e ordem', () => {
    expect(percorrer(arvore).map((n) => n.rotulo)).toEqual([
      'Raiz <fictícia> & cia',
      'Ramo A',
      'A1',
      'A2',
      'A2x',
      'Ramo B',
      'B1',
      'Ramo C'
    ]);
  });

  it('gera ids únicos', () => {
    const ids = percorrer(arvore).map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('nunca usa os tipos de Filosofia (Período, Fase, Pensador)', () => {
    const tipos = new Set(percorrer(arvore).map((n) => n.tipo));
    for (const proibido of ['era', 'fase', 'pensador'])
      expect(tipos.has(proibido as never)).toBe(false);
  });

  it('abre raiz e ramos no início e deixa o resto fechado', () => {
    const abertos = abertosIniciais(arvore);
    const porRotulo = (r: string) => percorrer(arvore).find((n) => n.rotulo === r)!;
    expect(abertos.has(arvore.id)).toBe(true);
    expect(abertos.has(porRotulo('Ramo A').id)).toBe(true);
    expect(abertos.has(porRotulo('A2').id)).toBe(false);
    expect(idsExpansiveis(arvore)).toContain(porRotulo('A2').id);
  });
});
