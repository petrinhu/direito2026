import { describe, expect, it } from 'vitest';
import {
  contarTermosEncontrados,
  extrairTermosDeVazamento,
  indicesEncontrados,
  normalizarParaBusca
} from '@/core/restrito/termosVazamento';
import { conteudoRestritoFalso } from './apoio/conteudoRestritoFalso';

describe('normalizarParaBusca', () => {
  it('ignora caixa, acento e espaço repetido', () => {
    expect(normalizarParaBusca('  JOÃO   da  Silva\n')).toBe('joao da silva');
  });
});

describe('extrairTermosDeVazamento', () => {
  const longo = 'Este é um trecho fictício bastante longo para servir de impressão digital.';

  it('traz integrantes, instituição e trechos de resumo e quiz, normalizados', () => {
    const c = conteudoRestritoFalso() as {
      resumo: Record<string, unknown>[];
      quiz: Record<string, unknown>[];
    };
    c.resumo[0]!.corpoHtml = `<p>${longo}</p>`;
    c.quiz[0]!.explicacaoHtml = `<p>Curto.</p><p>${longo} Segundo.</p>`;
    const t = extrairTermosDeVazamento(c);
    expect(t.integrantes).toContain('pessoa ficticia um');
    expect(t.instituicao).toEqual(['instituicao ficticia']);
    expect(t.trechos.some((x) => x.startsWith('este e um trecho ficticio'))).toBe(true);
  });

  it('só aceita trecho com 40 caracteres ou mais, sem tags', () => {
    const t = extrairTermosDeVazamento(conteudoRestritoFalso());
    expect(t.trechos.length).toBeGreaterThan(0);
    for (const x of t.trechos) {
      expect(x.length).toBeGreaterThanOrEqual(40);
      expect(x).not.toMatch(/[<>]/);
    }
  });

  it('inclui trechos longos de slides e notas', () => {
    const c = conteudoRestritoFalso() as { slides: Record<string, unknown>[] };
    c.slides[3]!.destaque =
      'Frase de impacto fictícia suficientemente longa para ser uma impressão digital.';
    const t = extrairTermosDeVazamento(c);
    expect(t.trechos.some((x) => x.startsWith('frase de impacto ficticia suficientemente'))).toBe(
      true
    );
    expect(t.trechos.some((x) => x.startsWith('palavra0 palavra1'))).toBe(true);
  });

  it('não inclui o título do grupo nem metadados públicos', () => {
    const c = conteudoRestritoFalso() as { meta: { titulo: string } };
    c.meta.titulo = 'Título público do grupo para a página restrita';
    const todos = Object.values(extrairTermosDeVazamento(c)).flat();
    expect(todos.join('|')).not.toContain('titulo publico');
  });

  it('tolera JSON malformado sem lançar (campos ausentes viram lista vazia)', () => {
    expect(extrairTermosDeVazamento({})).toEqual({ integrantes: [], instituicao: [], trechos: [] });
  });
});

describe('contarTermosEncontrados', () => {
  it('conta termos distintos presentes, com acento e caixa diferentes', () => {
    const alvo = normalizarParaBusca('...Instituição FICTÍCIA e outra coisa');
    expect(contarTermosEncontrados(alvo, ['instituicao ficticia', 'ausente'])).toBe(1);
  });

  it('zero quando nada casa', () => {
    expect(contarTermosEncontrados('nada', ['x y z'])).toBe(0);
  });
});

describe('indicesEncontrados', () => {
  it('devolve as posições dos termos presentes, nunca o texto', () => {
    expect(indicesEncontrados('abc def ghi', ['zzz', 'def', 'abc'])).toEqual([1, 2]);
  });
});
