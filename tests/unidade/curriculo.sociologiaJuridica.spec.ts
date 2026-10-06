import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { resolverRota } from '@/core/curriculo/resolverRota';

const periodo1 = curriculo.find((p) => p.id === 'p1')!;
const sociologia = periodo1.cadeiras.find((c) => c.id === 'sociologia-juridica');

describe('currículo: Sociologia Jurídica, 1a unidade', () => {
  it('a cadeira entra no 1º período com o nome dela, entre as publicadas', () => {
    expect(sociologia?.nome).toBe('Sociologia Jurídica');
    expect(sociologia?.estado).toBe('publicado');
    expect(periodo1.cadeiras.filter((c) => c.estado === 'publicado' && !c.restrita)).toHaveLength(
      4
    );
  });

  it('tem só duas abas, resumo e quiz, e o título não fala de petição', () => {
    const u1 = sociologia!.unidades.find((u) => u.id === 'u1')!;
    expect([...u1.abas]).toEqual(['resumo', 'quiz']);
    expect(u1.titulo.toLowerCase()).not.toContain('peti');
  });

  it('resumo e quiz resolvem como encontrados; a aba de petição não existe', () => {
    const base = '/p/p1/sociologia-juridica/u1';
    expect(resolverRota(curriculo, base).tipo).toBe('encontrado');
    expect(resolverRota(curriculo, `${base}/quiz`).tipo).toBe('encontrado');
    expect(resolverRota(curriculo, `${base}/peticao`).tipo).not.toBe('encontrado');
  });

  it('as cadeiras antigas seguem com as três abas', () => {
    for (const id of ['intr-direito', 'redacao-juridica-1']) {
      const u1 = periodo1.cadeiras.find((c) => c.id === id)!.unidades[0]!;
      expect([...u1.abas]).toEqual(['resumo', 'peticao', 'quiz']);
    }
  });
});
