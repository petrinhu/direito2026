import { describe, expect, it } from 'vitest';
import { construirArvoreMapa, idsExpansiveis, percorrer } from '@/core/fichamento/arvoreMapa';
import { DADOS_SINTETICOS } from './apoio/dadosFichamento';

describe('construirArvoreMapa', () => {
  const raiz = construirArvoreMapa(DADOS_SINTETICOS);

  it('a raiz leva o título e tem uma era por filho, na ordem dos dados', () => {
    expect(raiz.tipo).toBe('raiz');
    expect(raiz.rotulo).toBe('Raiz de teste');
    expect(raiz.filhos.map((n) => n.rotulo)).toEqual(['Idade Antiga', 'Idade Média']);
  });

  it('respeita a hierarquia era, fase, pensador', () => {
    const antiga = raiz.filhos[0]!;
    expect(antiga.tipo).toBe('era');
    expect(antiga.filhos.map((f) => [f.tipo, f.rotulo])).toEqual([
      ['fase', 'Fase um'],
      ['fase', 'Fase dois']
    ]);
    const alfa = antiga.filhos[0]!.filhos[0]!;
    expect(alfa.tipo).toBe('pensador');
    expect(alfa.rotulo).toBe('Alfa (1-2)');
    expect(alfa.fichaId).toBe('alfa');
  });

  it('o pensador tem modo de pensar, conceitos-chave, para o Direito hoje e ressalva, nessa ordem', () => {
    const alfa = raiz.filhos[0]!.filhos[0]!.filhos[0]!;
    expect(alfa.filhos.map((n) => n.tipo)).toEqual(['modo', 'conceitos', 'direito', 'ressalva']);
    expect(alfa.filhos[0]!.rotulo).toBe('Modo de pensar');
    expect(alfa.filhos[0]!.detalhe).toBe('Pensa em açúcar.');
    expect(alfa.filhos[1]!.filhos.map((c) => c.rotulo)).toEqual(['Doce', 'Amargo']);
    expect(alfa.filhos[2]!.detalhe).toBe('Serve ao direito civil.');
  });

  it('omite os ramos vazios: sem conceitos e sem ressalva não nasce nó oco', () => {
    const gama = raiz.filhos[1]!.filhos[0]!.filhos[0]!;
    expect(gama.filhos.map((n) => n.tipo)).toEqual(['modo', 'direito']);
  });

  it('todo id é único na árvore inteira', () => {
    const ids = percorrer(raiz).map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('idsExpansiveis devolve só quem tem filhos', () => {
    const expansiveis = idsExpansiveis(raiz);
    expect(expansiveis).toContain(raiz.id);
    expect(expansiveis).toContain('mapa-pensador-alfa');
    expect(expansiveis).not.toContain('mapa-alfa-modo');
  });

  it('falha alto se um pensador aponta para fase que não existe', () => {
    const quebrado = {
      ...DADOS_SINTETICOS,
      pensadores: [{ ...DADOS_SINTETICOS.pensadores[0]!, faseId: 'fantasma' }]
    };
    expect(() => construirArvoreMapa(quebrado)).toThrow(/fantasma/);
  });
});
