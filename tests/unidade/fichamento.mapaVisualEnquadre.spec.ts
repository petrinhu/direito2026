import { describe, expect, it } from 'vitest';
import {
  abertosIniciaisVisual,
  ajustarVista,
  arvoreVisual,
  layoutRadial,
  quebrarRotulo,
  todosAbertos
} from '@/core/fichamento/mapaVisual';
import { mapaFichamento } from '@/conteudo/p1/filosofia-juridica/u1/mapaFichamento';

const medir = (s: string) => s.length * 8;
const raiz = arvoreVisual(mapaFichamento);

function caixas(abertos: ReadonlySet<string>, orientacao: 'horizontal' | 'vertical') {
  return layoutRadial(raiz, abertos, { orientacao }).map((p) => {
    const linhas = quebrarRotulo(p.no.rotuloCurto ?? p.no.rotulo, 150, medir);
    const largura = Math.max(...linhas.map(medir)) + 30;
    return { x: p.x, y: p.y, largura, altura: linhas.length * 17 + 14 };
  });
}

describe('quebrarRotulo', () => {
  it('quebra em palavras inteiras, sem passar da largura', () => {
    const l = quebrarRotulo('Filosofia Jurídica: Idade Antiga e Idade Média', 160, medir);
    expect(l.length).toBeGreaterThan(1);
    for (const linha of l) expect(medir(linha)).toBeLessThanOrEqual(160);
    expect(l.join(' ')).toBe('Filosofia Jurídica: Idade Antiga e Idade Média');
  });

  it('texto curto fica numa linha só', () => {
    expect(quebrarRotulo('Platão', 160, medir)).toEqual(['Platão']);
  });

  it('no máximo 3 linhas; o excedente vira reticências, nunca some em silêncio', () => {
    const l = quebrarRotulo('palavra '.repeat(30).trim(), 100, medir);
    expect(l).toHaveLength(3);
    expect(l[2]!.endsWith('…')).toBe(true);
  });

  it('palavra maior que a largura não entra em laço infinito', () => {
    expect(quebrarRotulo('a'.repeat(40), 100, medir).length).toBeLessThanOrEqual(3);
  });
});

describe('layout em dois hemisférios', () => {
  it('na horizontal a Antiguidade fica à esquerda e a Idade Média à direita', () => {
    const pos = layoutRadial(raiz, new Set(todosAbertos(raiz)), { orientacao: 'horizontal' });
    const era = (id: string) => pos.find((p) => p.no.id === id)!;
    expect(era('mapa-era-antiga').x).toBeLessThan(0);
    expect(era('mapa-era-media').x).toBeGreaterThan(0);
    for (const id of ['agostinho', 'tomas-de-aquino', 'escoto', 'ockham']) {
      expect(era(`mapa-pensador-${id}`).x, id).toBeGreaterThan(0);
    }
    for (const id of ['sofocles', 'platao', 'aristoteles', 'cicero']) {
      expect(era(`mapa-pensador-${id}`).x, id).toBeLessThan(0);
    }
  });

  it('na vertical a Antiguidade fica em cima e a Idade Média embaixo', () => {
    const pos = layoutRadial(raiz, abertosIniciaisVisual(raiz), { orientacao: 'vertical' });
    expect(pos.find((p) => p.no.id === 'mapa-era-antiga')!.y).toBeLessThan(0);
    expect(pos.find((p) => p.no.id === 'mapa-era-media')!.y).toBeGreaterThan(0);
  });
});

describe('ajustarVista: todo nó cabe na janela', () => {
  const abertosCasos = [
    ['fechados', abertosIniciaisVisual(raiz)],
    ['tudo aberto', new Set(todosAbertos(raiz))]
  ] as const;

  for (const [largura, altura, orientacao] of [
    [360, 520, 'vertical'],
    [1280, 680, 'horizontal']
  ] as const) {
    for (const [nome, abertos] of abertosCasos) {
      it(`${largura}px, ${nome}: nenhuma cápsula fica fora da janela`, () => {
        const itens = caixas(abertos, orientacao);
        const v = ajustarVista(itens, largura, altura, 8);
        for (const c of itens) {
          const esq = largura / 2 + v.x + (c.x - c.largura / 2) * v.k;
          const dir = largura / 2 + v.x + (c.x + c.largura / 2) * v.k;
          const topo = altura / 2 + v.y + (c.y - c.altura / 2) * v.k;
          const base = altura / 2 + v.y + (c.y + c.altura / 2) * v.k;
          expect(esq).toBeGreaterThanOrEqual(-0.5);
          expect(dir).toBeLessThanOrEqual(largura + 0.5);
          expect(topo).toBeGreaterThanOrEqual(-0.5);
          expect(base).toBeLessThanOrEqual(altura + 0.5);
        }
        expect(v.k).toBeGreaterThan(0);
      });
    }
  }

  it('o enquadramento nunca amplia além de 1,2', () => {
    const v = ajustarVista(caixas(new Set([raiz.id]), 'horizontal'), 1280, 680, 8);
    expect(v.k).toBeLessThanOrEqual(1.2);
  });
});
