import type { ConteudoUnidade, PerguntaMultiplaEscolha } from '@/core/unidade/tipos';

/**
 * Unidade sintética mínima e válida para os testes de regra de conteúdo. Cada
 * caso sobrescreve só o campo que quer quebrar (L-35: um teste por regra). Não
 * é conteúdo: nunca entra em src/conteudo.
 */
export function perguntaSintetica(
  sobrescrita: Partial<PerguntaMultiplaEscolha> = {}
): PerguntaMultiplaEscolha {
  return {
    id: 1,
    categoria: 'teoria',
    enunciadoHtml: 'Qual é a regra geral?',
    fonteExtra: false,
    explicacaoHtml: 'A lei fixa a regra porque protege a segurança das relações.',
    alternativasHtml: ['Uma regra', 'Outra regra', 'Terceira regra', 'Quarta regra'] as const,
    correta: 0,
    ...sobrescrita
  };
}

export function unidadeSintetica(sobrescrita: Partial<ConteudoUnidade> = {}): ConteudoUnidade {
  return {
    meta: {
      rotulo: 'Unidade 1',
      estado: 'publicado',
      titulo: 'Título da unidade',
      subtitulo: 'Subtítulo',
      descricao: 'Descrição curta'
    },
    resumo: [
      {
        id: 'bloco-0',
        numero: 1,
        titulo: 'Conceito básico',
        fonte: 'Autor, Obra, 2020',
        corpoHtml: 'Texto do bloco.',
        resumo: ['Item do quadro'],
        exemploHtml: 'Exemplo na prática.'
      }
    ],
    quiz: [perguntaSintetica()],
    ...sobrescrita
  };
}
