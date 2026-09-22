import { describe, expect, it } from 'vitest';
import { montarDocumentosUnidade } from '@/core/busca/montarIndice';
import type { ConteudoUnidade } from '@/core/unidade/tipos';

function unidadeDeExemplo(): ConteudoUnidade {
  return {
    meta: { titulo: 'Conceito e fontes do Direito', subtitulo: 'sub', descricao: 'desc' },
    resumo: [
      {
        id: 'bloco-1',
        numero: 1,
        titulo: 'Introdução',
        fonte: 'Autor, Ano',
        corpoHtml: '<p>O Direito é <b>um sistema</b> de normas.</p>',
        resumo: ['ponto 1'],
        exemploHtml: '<p>exemplo</p>'
      }
    ],
    peticao: {
      titulo: 'Petição inicial',
      notaHtml: '<p>nota</p>',
      secoes: [
        {
          id: 'enderecamento',
          titulo: 'Endereçamento',
          corpoHtml: '<p>Excelentíssimo Juiz</p>',
          comentarioHtml: '<p>comentário</p>'
        }
      ]
    },
    quiz: [
      {
        id: 1,
        categoria: 'teoria',
        enunciado: 'p1',
        alternativas: ['a', 'b', 'c', 'd'],
        correta: 0,
        fonteExtra: false,
        explicacao: 'x'
      }
    ]
  };
}

describe('montarDocumentosUnidade', () => {
  const docs = montarDocumentosUnidade({
    periodo: 'p1',
    cadeira: 'intr-direito',
    unidade: 'u1',
    conteudo: unidadeDeExemplo()
  });

  it('um documento por bloco teórico', () => {
    const dosBlocos = docs.filter((d) => d.aba === 'resumo');
    expect(dosBlocos).toHaveLength(1);
    expect(dosBlocos[0]!.id).toBe('p1/intr-direito/u1#bloco-1');
    expect(dosBlocos[0]!.corpo).toContain('sistema');
  });

  it('um documento por seção da peça', () => {
    const daPeca = docs.filter((d) => d.aba === 'peticao');
    expect(daPeca).toHaveLength(1);
    expect(daPeca[0]!.id).toBe('p1/intr-direito/u1/peticao#enderecamento');
  });

  it('um único documento para o quiz inteiro, nunca por pergunta (não entrega a resposta na busca)', () => {
    const doQuiz = docs.filter((d) => d.aba === 'quiz');
    expect(doQuiz).toHaveLength(1);
    expect(doQuiz[0]!.corpo).not.toContain('correta');
  });

  it('cada documento carrega a trilha completa e a url', () => {
    for (const d of docs) {
      expect(d.periodo).toBe('p1');
      expect(d.cadeira).toBe('intr-direito');
      expect(d.unidade).toBe('u1');
      expect(d.url.startsWith('/p/p1/intr-direito/u1')).toBe(true);
    }
  });

  it('trecho tem no máximo ~200 caracteres', () => {
    for (const d of docs) {
      expect(d.trecho.length).toBeLessThanOrEqual(200);
    }
  });
});
