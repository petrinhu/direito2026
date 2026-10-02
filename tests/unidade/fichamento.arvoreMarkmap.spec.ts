import { describe, expect, it } from 'vitest';
import {
  definirTodosRamos,
  escaparHtml,
  paraArvoreMarkmap,
  todosRamosAbertos
} from '@/core/fichamento/arvoreMarkmap';
import { DADOS_SINTETICOS } from './apoio/dadosFichamento';

const base = '/p/p1/c/u1';

describe('paraArvoreMarkmap', () => {
  const raiz = paraArvoreMarkmap(DADOS_SINTETICOS, base);

  it('raiz, períodos e pensadores, sem o nível de fase', () => {
    expect(raiz.content).toBe('Raiz de teste');
    expect(raiz.children.map((e) => e.content)).toEqual(['Idade Antiga', 'Idade Média']);
    const antiga = raiz.children[0]!;
    expect(antiga.children.map((p) => p.content)).toEqual(['Alfa (1-2)', 'Beta']);
  });

  it('pensadores começam recolhidos; raiz e períodos abertos', () => {
    expect(raiz.payload?.fold).toBeUndefined();
    expect(raiz.children[0]!.payload?.fold).toBeUndefined();
    expect(raiz.children[0]!.children.every((p) => p.payload?.fold === 1)).toBe(true);
  });

  it('o pensador leva modo de pensar, conceitos, direito hoje e o link da ficha', () => {
    const alfa = raiz.children[0]!.children[0]!;
    const textos = alfa.children.map((n) => n.content);
    expect(textos[0]).toContain('Modo de pensar');
    expect(textos[0]).toContain('Pensa em açúcar.');
    expect(alfa.children.some((n) => n.content.startsWith('Conceitos-chave'))).toBe(true);
    const conceitos = alfa.children.find((n) => n.content.startsWith('Conceitos-chave'))!;
    expect(conceitos.children.map((c) => c.content)).toEqual(['Doce', 'Amargo']);
    expect(textos.some((t) => t.includes('Serve ao direito civil.'))).toBe(true);
    expect(textos[textos.length - 1]).toBe(
      `<a href="${base}/fichamento#ficha-alfa">Ler a ficha completa</a>`
    );
  });

  it('cada pensador tem o seu ramo (cor), herdado pelos filhos', () => {
    const [alfa, beta] = raiz.children[0]!.children;
    expect(alfa!.payload?.ramo).toBe(0);
    expect(beta!.payload?.ramo).toBe(1);
    expect(alfa!.children.every((n) => n.payload?.ramo === 0)).toBe(true);
    expect(raiz.children[1]!.children[0]!.payload?.ramo).toBe(2);
  });

  it('escapa HTML dos textos', () => {
    expect(escaparHtml('a < b & "c"')).toBe('a &lt; b &amp; &quot;c&quot;');
  });
});

describe('todosRamosAbertos', () => {
  it('falso com pensador recolhido; verdadeiro quando nenhum ramo está recolhido', () => {
    const raiz = paraArvoreMarkmap(DADOS_SINTETICOS, base);
    expect(todosRamosAbertos(raiz)).toBe(false);
    const abre = (n: typeof raiz): void => {
      if (n.payload) n.payload = { ...n.payload, fold: 0 };
      n.children.forEach(abre);
    };
    abre(raiz);
    expect(todosRamosAbertos(raiz)).toBe(true);
  });

  it('definirTodosRamos abre tudo e recolhe de volta ao começo', () => {
    const raiz = paraArvoreMarkmap(DADOS_SINTETICOS, base);
    definirTodosRamos(raiz, true);
    expect(todosRamosAbertos(raiz)).toBe(true);
    definirTodosRamos(raiz, false);
    expect(todosRamosAbertos(raiz)).toBe(false);
    expect(raiz.payload?.fold).toBe(0);
    expect(raiz.children[0]!.payload?.fold).toBe(0);
    expect(raiz.children[0]!.children[0]!.payload?.fold).toBe(1);
  });
});
