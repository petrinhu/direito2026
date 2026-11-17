import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { aplicarLimpeza, corDeLimpeza, type EstadoDoPalco } from '@/ui/piramide3d/limpeza';

/**
 * Decisão do líder, "Tirar o véu": a página não escurece nem clareia com o voo. A cor de limpeza do
 * renderer fica sempre transparente (alfa 0), em voo, na volta e na norma fundamental.
 */
interface RendererEspiao {
  cor: number | null;
  alfa: number | null;
  setClearColor(cor: number, alfa: number): void;
  getClearAlpha(): number;
}

function espiao(): RendererEspiao {
  const r: RendererEspiao = {
    cor: null,
    alfa: null,
    setClearColor(cor, alfa) {
      r.cor = cor;
      r.alfa = alfa;
    },
    getClearAlpha() {
      return r.alfa ?? -1;
    }
  };
  return r;
}

describe('voo sem véu sobre a página', () => {
  it('em repouso, o clear fica transparente', () => {
    const r = espiao();
    aplicarLimpeza(r, 'repouso');
    expect(r.getClearAlpha()).toBe(0);
  });

  it('o clear fica transparente em qualquer estado do voo: em voo, na volta e na norma fundamental', () => {
    const estados: EstadoDoPalco[] = [
      'repouso',
      'voo',
      'volta',
      'meio-da-volta',
      'norma-fundamental'
    ];
    for (const estado of estados) {
      const r = espiao();
      aplicarLimpeza(r, estado);
      expect(r.getClearAlpha(), estado).toBe(0);
      expect(corDeLimpeza(estado).alfa, estado).toBe(0);
    }
  });

  it('o código da cena não define mais nenhuma cor de limpeza com alfa diferente de zero', () => {
    const cena = readFileSync(resolve(__dirname, '../../src/ui/piramide3d/cena.ts'), 'utf-8');
    const chamadas = [...cena.matchAll(/setClearColor\(([^;]*)\);/g)].map((m) => m[1]);
    for (const argumentos of chamadas) {
      expect(argumentos).toMatch(/,\s*0\s*$/);
    }
  });
});
