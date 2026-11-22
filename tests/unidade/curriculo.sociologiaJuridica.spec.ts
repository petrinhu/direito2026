import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { resolverRota } from '@/core/curriculo/resolverRota';

const periodo1 = curriculo.find((p) => p.id === 'p1')!;
const sociologia = periodo1.cadeiras.find((c) => c.id === 'sociologia-juridica');

/**
 * Abas de conteúdo da u1 que o disco sustenta: mapa e fichamento vêm do
 * mesmo arquivo (mapaFichamento.ts), mnemônicos de mnemonicos.ts.
 */
function abasDeArquivo(cadeira: string): string[] {
  const existe = (arquivo: string): boolean =>
    existsSync(resolve(__dirname, '../../src/conteudo/p1', cadeira, 'u1', arquivo));
  return [
    'resumo',
    ...(existe('mapaFichamento.ts') ? ['mapa', 'fichamento'] : []),
    ...(existe('mnemonicos.ts') ? ['mnemonicos'] : [])
  ];
}

describe('currículo: Sociologia Jurídica, 1a unidade', () => {
  it('a cadeira entra no 1º período com o nome dela, entre as publicadas', () => {
    expect(sociologia?.nome).toBe('Sociologia Jurídica');
    expect(sociologia?.estado).toBe('publicado');
    const publicas = periodo1.cadeiras.filter((c) => c.estado === 'publicado' && !c.restrita);
    expect(publicas.length).toBeGreaterThan(0);
    expect(publicas.map((c) => c.id)).toContain('sociologia-juridica');
  });

  it('tem as abas que os arquivos da u1 sustentam (resumo, mapa, fichamento, mnemônicos, quiz), e o título não fala de petição', () => {
    const u1 = sociologia!.unidades.find((u) => u.id === 'u1')!;
    expect([...u1.abas]).toEqual([...abasDeArquivo('sociologia-juridica'), 'quiz']);
    expect([...u1.abas]).toEqual(['resumo', 'mapa', 'fichamento', 'mnemonicos', 'quiz']);
    expect(u1.titulo.toLowerCase()).not.toContain('peti');
  });

  it('resumo e quiz resolvem como encontrados; a aba de petição não existe', () => {
    const base = '/p/p1/sociologia-juridica/u1';
    expect(resolverRota(curriculo, base).tipo).toBe('encontrado');
    expect(resolverRota(curriculo, `${base}/quiz`).tipo).toBe('encontrado');
    expect(resolverRota(curriculo, `${base}/peticao`).tipo).not.toBe('encontrado');
  });

  it('as cadeiras com petição seguem com as abas que os arquivos sustentam, mais petição e quiz', () => {
    for (const id of ['intr-direito', 'redacao-juridica-1']) {
      const u1 = periodo1.cadeiras.find((c) => c.id === id)!.unidades[0]!;
      expect([...u1.abas]).toEqual([...abasDeArquivo(id), 'peticao', 'quiz']);
    }
  });
});
