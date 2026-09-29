import { describe, expect, it } from 'vitest';
import { montarDocumentosUnidade } from '@/core/busca/montarIndice';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

/** Cadeira sem petição (Sociologia Jurídica): a busca só aponta para resumo e quiz. */
const conteudo: ConteudoUnidade = {
  meta: { titulo: 'Resumo de estudo e quiz', subtitulo: 's', descricao: 'd' },
  resumo: [
    {
      id: 'bloco-0',
      numero: 1,
      titulo: 'O que é Sociologia',
      fonte: 'f',
      corpoHtml: '<p>ciência da sociedade</p>',
      resumo: ['item'],
      exemploHtml: 'ex'
    }
  ],
  quiz: [
    {
      id: 1,
      categoria: 'conceitos',
      enunciadoHtml: 'Enunciado?',
      alternativasHtml: ['a', 'b', 'c', 'd', 'RESPOSTA-SECRETA'],
      correta: 4,
      fonteExtra: false,
      explicacaoHtml: 'porque'
    }
  ]
};

describe('montarDocumentosUnidade sem petição', () => {
  it('gera só documentos de resumo e de quiz, nenhum de petição', () => {
    const docs = montarDocumentosUnidade({
      periodo: 'p1',
      cadeira: 'sociologia-juridica',
      unidade: 'u1',
      conteudo
    });
    expect(docs.map((d) => d.aba).sort()).toEqual(['quiz', 'resumo']);
    expect(docs.some((d) => d.url.includes('/peticao'))).toBe(false);
  });

  it('o documento do quiz não vaza alternativa nem resposta', () => {
    const docs = montarDocumentosUnidade({
      periodo: 'p1',
      cadeira: 'sociologia-juridica',
      unidade: 'u1',
      conteudo
    });
    const quiz = docs.find((d) => d.aba === 'quiz')!;
    expect(quiz.corpo).not.toContain('RESPOSTA-SECRETA');
  });
});
