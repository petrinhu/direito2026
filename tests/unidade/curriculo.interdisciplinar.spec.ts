import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { resolverRota } from '@/core/curriculo/resolverRota';
import { rotas } from '@/app/router/rotas';

const periodo1 = curriculo.find((p) => p.id === 'p1')!;
const cadeira = periodo1.cadeiras.find((c) => c.id === 'interdisciplinar');

describe('currículo: Interdisciplinar (área restrita)', () => {
  it('entra no 1º período, publicada e marcada como restrita', () => {
    expect(cadeira?.nome).toBe('Interdisciplinar');
    expect(cadeira?.estado).toBe('publicado');
    expect(cadeira?.restrita).toBe(true);
  });

  it('não tem unidade inventada: o conteúdo não existe no repositório', () => {
    expect(cadeira?.unidades).toEqual([]);
  });

  it('só ela é restrita', () => {
    const restritas = curriculo.flatMap((p) => p.cadeiras).filter((c) => c.restrita);
    expect(restritas.map((c) => c.id)).toEqual(['interdisciplinar']);
  });

  it('a rota /p/p1/interdisciplinar é a rota de cadeira que já existe (sem rota nova)', () => {
    const rotaDeCadeira = rotas.find((r) => r.path === '/p/:periodo/:cadeira');
    expect(rotaDeCadeira).toBeDefined();
    expect(resolverRota(curriculo, '/p/p1/interdisciplinar').tipo).toBe('em-breve');
  });
});
