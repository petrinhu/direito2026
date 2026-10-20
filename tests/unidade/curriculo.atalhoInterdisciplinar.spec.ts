import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { resolverRota } from '@/core/curriculo/resolverRota';

/**
 * Ordem do líder: "ponha em todas as disciplinas (no menu lateral) que a
 * segunda unidade é o interdisciplinar (link para ele)". O atalho é um dado
 * da cadeira, não uma unidade: não entra em `unidades`, então busca, home,
 * trilha, roteador e registros de carregamento nunca o veem como conteúdo.
 */
const periodo1 = curriculo.find((p) => p.id === 'p1')!;
const cadeirasPublicas = [
  'intr-direito',
  'redacao-juridica-1',
  'sociologia-juridica',
  'filosofia-juridica'
];

function cadeiraDe(id: string) {
  return periodo1.cadeiras.find((c) => c.id === id)!;
}

describe('atalho para a Unidade 2 (Interdisciplinar) nas cadeiras públicas', () => {
  it.each(cadeirasPublicas)('%s aponta para a cadeira restrita, logo depois da Unidade 1', (id) => {
    expect(cadeiraDe(id).atalhoUnidade).toEqual({
      apos: 'u1',
      rotulo: 'Interdisciplinar',
      cadeiraId: 'interdisciplinar'
    });
  });

  it('em Filosofia Jurídica o atalho cai entre a Unidade 1 e a Unidade 3', () => {
    const filosofia = cadeiraDe('filosofia-juridica');
    expect(filosofia.unidades.map((u) => u.id)).toEqual(['u1', 'u3']);
    expect(filosofia.atalhoUnidade?.apos).toBe('u1');
  });

  it.each(['intr-direito', 'redacao-juridica-1', 'sociologia-juridica'])(
    '%s: a única unidade é a Unidade 1, e o atalho vem depois dela',
    (id) => {
      expect(cadeiraDe(id).unidades.map((u) => u.id)).toEqual(['u1']);
      expect(cadeiraDe(id).atalhoUnidade?.apos).toBe('u1');
    }
  );

  it('o destino é a cadeira restrita Interdisciplinar, no mesmo período', () => {
    const destino = cadeiraDe('interdisciplinar');
    expect(destino.restrita).toBe(true);
    expect(destino.estado).toBe('publicado');
  });

  it.each(cadeirasPublicas)('%s: a unidade apontada pelo atalho existe de verdade', (id) => {
    const atalho = cadeiraDe(id).atalhoUnidade!;
    expect(cadeiraDe(id).unidades.some((u) => u.id === atalho.apos)).toBe(true);
  });

  it.each(cadeirasPublicas)('%s: o atalho não vira unidade falsa na lista de conteúdo', (id) => {
    expect(cadeiraDe(id).unidades.map((u) => u.id)).not.toContain('u2');
    expect(resolverRota(curriculo, `/p/p1/${id}/u2`).tipo).toBe('inexistente');
  });

  it('a cadeira restrita não ganha atalho próprio', () => {
    expect(cadeiraDe('interdisciplinar').atalhoUnidade).toBeUndefined();
  });
});
