import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { resolverRota } from '@/core/curriculo/resolverRota';
import { ROTULOS_ABA } from '@/core/curriculo/rotulosAba';
import { meta } from '@/conteudo/p1/filosofia-juridica/u1/meta';

const base = '/p/p1/filosofia-juridica/u1';
const filosofia = curriculo
  .find((p) => p.id === 'p1')!
  .cadeiras.find((c) => c.id === 'filosofia-juridica')!;
const u1 = filosofia.unidades.find((u) => u.id === 'u1')!;

describe('abas Mapa mental, Fichamento e Mnemônicos', () => {
  it('têm rótulo próprio, com acentuação', () => {
    expect(ROTULOS_ABA.mapa).toBe('Mapa mental');
    expect(ROTULOS_ABA.fichamento).toBe('Fichamento');
    expect(ROTULOS_ABA.mnemonicos).toBe('Mnemônicos');
  });

  it('Filosofia u1 declara as abas na ordem Resumo, Mapa, Fichamento, Mnemônicos, Quiz', () => {
    expect([...u1.abas]).toEqual(['resumo', 'mapa', 'fichamento', 'mnemonicos', 'quiz']);
  });

  it.each(['mapa', 'fichamento', 'mnemonicos'] as const)(
    'a rota /%s resolve como encontrada',
    (aba) => {
      const r = resolverRota(curriculo, `${base}/${aba}`);
      expect(r.tipo).toBe('encontrado');
      if (r.tipo === 'encontrado') expect(r.aba).toBe(aba);
    }
  );

  it.each(['mapa', 'fichamento', 'mnemonicos'] as const)(
    'as outras cadeiras não ganham a aba %s',
    (aba) => {
      for (const cadeira of ['intr-direito', 'redacao-juridica-1', 'sociologia-juridica']) {
        const r = resolverRota(curriculo, `/p/p1/${cadeira}/u1/${aba}`);
        expect(r.tipo, cadeira).not.toBe('encontrado');
      }
    }
  );

  it('os metadados da unidade (título e descrição) acompanham as abas novas', () => {
    expect(meta.titulo).toBe(u1.titulo);
    const descricao = meta.descricao.toLowerCase();
    for (const termo of ['mapa mental', 'fichamento', 'mnemônicos', 'quiz']) {
      expect(descricao, termo).toContain(termo);
    }
  });
});
