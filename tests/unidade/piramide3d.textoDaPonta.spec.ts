import { describe, expect, it } from 'vitest';
import type { Medidor } from '@/core/piramide3d/layoutFace';
import {
  layoutDaPonta,
  meiaLarguraNaAltura,
  type TrianguloPonta
} from '@/core/piramide3d/layoutPonta';

/**
 * PONTA, texto (ordem do líder, 17/11): na face de ponta (triângulo, ápice em cima) nenhum texto pode
 * passar da aresta, e a fonte é uma só, sem esticar. Medidor fake: cada caractere mede 0,55 da fonte.
 */
const medidor: Medidor = {
  definirFonte(fonte) {
    const m = /(\d+(?:\.\d+)?)px/.exec(fonte);
    this.tamanho = m ? Number(m[1]) : 16;
  },
  largura(texto) {
    return texto.length * (this.tamanho ?? 16) * 0.55;
  }
} as Medidor & { tamanho?: number };

const info = {
  nivel: 'constituicao-positiva',
  nome: 'Texto de teste da ponta, linha um, com p',
  rotulo: 'Texto de teste da ponta, linha um, com p',
  explicacao:
    'Texto de teste da ponta, linha um, com palavras comuns para medir o layout. Texto de teste da ponta, linha um, com palavras comuns para medir o layout. Texto de teste da ponta, linha um, com palavras comuns para medir o layout. Texto de teste da ponta, linha um, com palavras comuns para ',
  exemplo:
    'Texto de teste da ponta, linha um, com palavras comuns para medir o layout. Texto de teste da ponta, linha um, com palavras comuns para medir o layout. '
};
const fontes = {
  nome: (f: number) => `700 ${f * 1.5}px "Cormorant Garamond"`,
  corpo: (f: number) => `400 ${f}px "Inter"`,
  rotulo: (f: number) => `700 ${f * 1.1}px "Cormorant Garamond"`
};
const MARGEM = 8;

describe('texto da face de ponta', () => {
  for (const [W, a] of [
    [600, 0.64],
    [1280, 0.64]
  ] as const) {
    const t: TrianguloPonta = { W, H: W * a };

    it(`(${W} px) nenhuma linha passa da aresta do triângulo, com margem`, () => {
      const lay = layoutDaPonta(medidor, info, t, fontes, {
        fInicial: 24,
        fMinimo: 12,
        margem: MARGEM
      });
      expect(lay).not.toBeNull();
      for (const l of lay!.linhas) {
        medidor.definirFonte(l.fonte);
        const meia = medidor.largura(l.t) / 2;
        const topo = l.topo;
        const base = l.topo + l.altura;
        expect(meia).toBeLessThanOrEqual(meiaLarguraNaAltura(t, topo) - MARGEM + 1e-6);
        expect(meia).toBeLessThanOrEqual(meiaLarguraNaAltura(t, base) - MARGEM + 1e-6);
        expect(base).toBeLessThanOrEqual(t.H - MARGEM + 1e-6);
      }
    });

    it(`(${W} px) uma só escala de fonte para o corpo, sem esticar`, () => {
      const lay = layoutDaPonta(medidor, info, t, fontes, {
        fInicial: 24,
        fMinimo: 12,
        margem: MARGEM
      });
      const corpo = new Set(
        lay!.linhas.filter((l) => l.cor === 'explicacao' || l.cor === 'exemplo').map((l) => l.fonte)
      );
      expect(corpo.size).toBe(1);
      expect(corpo.values().next().value).toBe(fontes.corpo(lay!.f));
    });
  }
});
