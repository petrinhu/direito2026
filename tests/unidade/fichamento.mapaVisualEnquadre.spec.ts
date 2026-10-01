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

/* ---- rodada 2: sem sobreposição, acordeão, texto legível em tela estreita ---- */
import {
  abertosTodosVisual,
  alternarRamo,
  dimensionar,
  vistaLegivel
} from '@/core/fichamento/mapaVisual';

const medirTexto = (s: string, fonte: number) => s.length * fonte * 0.56;

function itensReais(abertos: ReadonlySet<string>, orientacao: 'horizontal' | 'vertical') {
  const medidas = new Map<string, ReturnType<typeof dimensionar>>();
  const medida = (no: (typeof raiz)['filhos'][number], profundidade: number) => {
    const m = dimensionar(no, profundidade, medirTexto);
    medidas.set(no.id, m);
    return m;
  };
  const pos = layoutRadial(raiz, abertos, { orientacao, medida });
  return pos.map((p) => ({ p, m: medidas.get(p.no.id)! }));
}

function sobrepostos(itens: ReturnType<typeof itensReais>): string[] {
  const achados: string[] = [];
  for (let i = 0; i < itens.length; i++) {
    for (let j = i + 1; j < itens.length; j++) {
      const a = itens[i]!;
      const b = itens[j]!;
      const dx = Math.abs(a.p.x - b.p.x) - (a.m.largura + b.m.largura) / 2;
      const dy = Math.abs(a.p.y - b.p.y) - (a.m.altura + b.m.altura) / 2;
      if (dx < 2 && dy < 2) achados.push(`${a.p.no.id} x ${b.p.no.id}`);
    }
  }
  return achados;
}

describe('nenhuma cápsula cobre outra (1280px)', () => {
  it('com "Abrir todos os ramos"', () => {
    expect(sobrepostos(itensReais(abertosTodosVisual(raiz), 'horizontal'))).toEqual([]);
  });

  it('com um pensador aberto, conceitos incluídos', () => {
    for (const id of ['mapa-pensador-platao', 'mapa-pensador-tomas-de-aquino']) {
      const abertos = new Set([
        ...abertosIniciaisVisual(raiz),
        id,
        `${id.replace('pensador-', '')}-conceitos`
      ]);
      expect(sobrepostos(itensReais(abertos, 'horizontal')), id).toEqual([]);
    }
  });

  it('também na vertical (tela estreita)', () => {
    expect(sobrepostos(itensReais(abertosTodosVisual(raiz), 'vertical'))).toEqual([]);
  });
});

describe('acordeão', () => {
  it('abrir um pensador fecha os outros do mesmo período, não os do outro', () => {
    let a = alternarRamo(raiz, abertosIniciaisVisual(raiz), 'mapa-pensador-platao');
    a = alternarRamo(raiz, a, 'mapa-pensador-tomas-de-aquino');
    a = alternarRamo(raiz, a, 'mapa-pensador-socrates');
    expect(a.has('mapa-pensador-socrates')).toBe(true);
    expect(a.has('mapa-pensador-platao')).toBe(false);
    expect(a.has('mapa-pensador-tomas-de-aquino')).toBe(true);
  });

  it('fechar o ramo aberto o fecha; e os conceitos do irmão fechado também somem', () => {
    let a = alternarRamo(raiz, abertosIniciaisVisual(raiz), 'mapa-pensador-platao');
    a = alternarRamo(raiz, a, 'mapa-platao-conceitos');
    a = alternarRamo(raiz, a, 'mapa-pensador-socrates');
    expect(a.has('mapa-platao-conceitos')).toBe(false);
    a = alternarRamo(raiz, a, 'mapa-pensador-socrates');
    expect(a.has('mapa-pensador-socrates')).toBe(false);
  });
});

describe('texto legível em tela estreita (360px)', () => {
  const MINIMA = 12 / 14;

  function efetivo(abertos: ReadonlySet<string>, focoId: string): number {
    const itens = itensReais(abertos, 'vertical');
    const caixa = ({ p, m }: (typeof itens)[number]) => ({
      x: p.x,
      y: p.y,
      largura: m.largura,
      altura: m.altura
    });
    const sel = itens.find((i) => i.p.no.id === focoId)!;
    const ids = new Set<string>();
    const sobe = (id: string | undefined): void => {
      if (!id) return;
      ids.add(id);
      sobe(itens.find((i) => i.p.no.id === id)?.p.paiId);
    };
    sobe(focoId);
    const descende = (id: string): void => {
      for (const i of itens.filter((x) => x.p.paiId === id)) {
        ids.add(i.p.no.id);
        descende(i.p.no.id);
      }
    };
    descende(focoId);
    const foco = [sel, ...itens.filter((i) => ids.has(i.p.no.id) && i !== sel)].map(caixa);
    const v = vistaLegivel(itens.map(caixa), foco, 360, 520, 8, MINIMA);
    return v.k * 14;
  }

  it('nunca abaixo de 12px, com tudo aberto e com um pensador aberto', () => {
    expect(efetivo(abertosTodosVisual(raiz), 'mapa-era-antiga')).toBeGreaterThanOrEqual(12 - 1e-6);
    const um = new Set([...abertosIniciaisVisual(raiz), 'mapa-pensador-platao']);
    expect(efetivo(um, 'mapa-pensador-platao')).toBeGreaterThanOrEqual(12 - 1e-6);
  });

  it('em tela larga o mapa inteiro continua cabendo, sem trocar para o foco', () => {
    const itens = itensReais(abertosTodosVisual(raiz), 'horizontal');
    const caixas = itens.map(({ p, m }) => ({
      x: p.x,
      y: p.y,
      largura: m.largura,
      altura: m.altura
    }));
    const v = vistaLegivel(caixas, [], 1280, 680, 8, MINIMA);
    const inteira = ajustarVista(caixas, 1280, 680, 8);
    expect(v.k).toBeCloseTo(Math.max(inteira.k, MINIMA), 6);
  });
});
