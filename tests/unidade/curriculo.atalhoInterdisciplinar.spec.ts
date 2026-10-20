import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { resolverRota } from '@/core/curriculo/resolverRota';

/**
 * Ordem do líder: "ponha em todas as disciplinas (no menu lateral) que a
 * segunda unidade é o interdisciplinar (link para ele)". O atalho é um dado
 * da cadeira, não uma unidade: não entra em `unidades`, então busca, home,
 * trilha, roteador e registros de carregamento nunca o veem como conteúdo.
 *
 * Nenhuma cadeira está listada à mão. "Cadeira pública" é a que o aluno vê
 * no menu (publicada e não restrita), lida do currículo. Assim, uma cadeira
 * nova publicada sem o atalho reprova aqui, e uma cadeira nova em-breve não.
 */
const periodo1 = curriculo.find((p) => p.id === 'p1')!;
const cadeirasPublicas = periodo1.cadeiras.filter((c) => c.estado === 'publicado' && !c.restrita);
const restrita = periodo1.cadeiras.find((c) => c.id === 'interdisciplinar');

function cadeiraDe(id: string) {
  return periodo1.cadeiras.find((c) => c.id === id)!;
}

describe('atalho para a Unidade 2 (Interdisciplinar) nas cadeiras públicas', () => {
  it('há cadeiras públicas e a cadeira restrita de destino para conferir (piso)', () => {
    expect(cadeirasPublicas.length).toBeGreaterThan(0);
    expect(restrita?.restrita).toBe(true);
    expect(restrita?.estado).toBe('publicado');
  });

  it.each(cadeirasPublicas.map((c) => c.id))(
    '%s: o atalho aponta para a restrita e vem logo depois da Unidade 1',
    (id) => {
      const cadeira = cadeiraDe(id);
      expect(cadeira.unidades[0]?.id, 'primeira unidade').toBe('u1');
      expect(cadeira.atalhoUnidade).toEqual({
        apos: 'u1',
        rotulo: 'Interdisciplinar',
        cadeiraId: 'interdisciplinar'
      });
    }
  );

  it.each(cadeirasPublicas.map((c) => c.id))(
    '%s: a unidade apontada pelo atalho existe de verdade',
    (id) => {
      const cadeira = cadeiraDe(id);
      expect(cadeira.atalhoUnidade, `${id} sem bloco atalhoUnidade`).toBeDefined();
      const atalho = cadeira.atalhoUnidade!;
      expect(cadeira.unidades.some((u) => u.id === atalho.apos)).toBe(true);
    }
  );

  it.each(cadeirasPublicas.map((c) => c.id))(
    '%s: o slot da Unidade 2 é do atalho, então não existe unidade u2 nem rota para ela',
    (id) => {
      expect(cadeiraDe(id).unidades.map((u) => u.id)).not.toContain('u2');
      expect(resolverRota(curriculo, `/p/p1/${id}/u2`).tipo).toBe('inexistente');
    }
  );

  it('a cadeira restrita não ganha atalho próprio', () => {
    expect(restrita?.atalhoUnidade).toBeUndefined();
  });
});
