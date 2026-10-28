/**
 * Fixture FALSA e sintética do conteúdo da área da Júri (L-28: nenhum texto do
 * caso real, nenhum nome de pessoa, nenhuma cidade). Todos os textos são
 * inventados e neutros, e evitam de propósito as expressões de letra e de
 * posição de alternativa, para o caminho feliz passar pelas regras do quiz.
 */

import { validarConteudoJuri } from '@/core/juri/validar';
import type { ConteudoJuriValidado } from '@/core/juri/tipos';

/** Id de imagem de 32 hex minúsculos, determinístico. */
export function idFalso(n: number): string {
  return n.toString(16).padStart(32, '0');
}

/** Índice de acervo falso: os ids 0, 1 e 2. */
export function idsFalsos(): Set<string> {
  return new Set([idFalso(0), idFalso(1), idFalso(2)]);
}

function perguntaFalsa(id: number): Record<string, unknown> {
  const base = {
    id,
    categoria: `Tema fictício ${(id % 3) + 1}`,
    enunciadoHtml: `<p>Enunciado fictício número ${id}.</p>`,
    explicacaoHtml: `<p>Explicação fictícia <strong>${id}</strong>.</p>`,
    fontes: [`Fonte fictícia da pergunta ${id}`]
  };
  if (id % 5 === 0) {
    return { ...base, tipo: 'verdadeiro-ou-falso', correta: id % 10 === 0 };
  }
  return {
    ...base,
    alternativasHtml: [
      `Resposta fictícia um da pergunta ${id}`,
      `Resposta fictícia dois da pergunta ${id}`,
      `Resposta fictícia três da pergunta ${id}`,
      `Resposta fictícia quatro da pergunta ${id}`
    ],
    correta: id % 4
  };
}

export function conteudoJuriFalso(): Record<string, unknown> {
  return {
    titulo: 'Título fictício da área',
    resumo: [
      {
        id: 'bloco-1',
        titulo: 'Bloco fictício um',
        corpoHtml: '<p>Texto fictício do bloco um &amp; mais.</p><ul><li>item fictício</li></ul>',
        linhaA: '<p>Linha A fictícia do bloco um.</p>',
        linhaB: '<p>Linha B fictícia do bloco um.</p>',
        fontes: ['Fonte fictícia um']
      },
      {
        id: 'bloco-2',
        titulo: 'Bloco fictício dois',
        corpoHtml: '<p>Texto fictício do bloco dois.</p>',
        fontes: ['Fonte fictícia dois']
      }
    ],
    quadroTermos: [1, 2, 3].map((n) => ({
      termo: `Termo fictício ${n}`,
      definicaoHtml: `<p>Definição fictícia número ${n}.</p>`,
      regiao: `Região fictícia ${n}`,
      fontes: [`Fonte fictícia do termo ${n}`]
    })),
    fichamento: [
      {
        id: 'ficha-1',
        titulo: 'Ficha fictícia um',
        oQueEHtml: '<p>Conceito fictício.</p>',
        fonteDizHtml: '<p>Fonte fictícia diz isto.</p>',
        acusacaoUsaHtml: '<p>Uso fictício na acusação.</p>',
        defesaAtacaHtml: '<p>Ataque fictício da defesa.</p>',
        fontes: ['Fonte fictícia da ficha']
      }
    ],
    respostasDefesa: [
      {
        id: 'defesa-1',
        teseHtml: '<p>Tese fictícia da defesa.</p>',
        respostaHtml: '<p>Resposta fictícia ao ataque.</p>',
        limiteHtml: '<p>Limite fictício da resposta.</p>',
        fontes: ['Fonte fictícia da defesa']
      }
    ],
    mnemonicos: [
      {
        id: 'mnemonico-1',
        dicaHtml: '<p>Dica fictícia.</p>',
        respostaHtml: '<p>Resposta fictícia da dica.</p>',
        fontes: ['Fonte fictícia do mnemônico']
      }
    ],
    mapa: {
      rotulo: 'Raiz fictícia',
      filhos: [
        {
          rotulo: 'Ramo um',
          filhos: [{ rotulo: 'Galho um', filhos: [{ rotulo: 'Folha um' }] }]
        },
        { rotulo: 'Ramo dois' }
      ]
    },
    quiz: Array.from({ length: 40 }, (_, i) => perguntaFalsa(i + 1)),
    imagens: [
      {
        id: idFalso(0),
        legenda: 'Legenda fictícia da imagem um',
        fontes: ['Fonte fictícia da imagem um']
      },
      {
        id: idFalso(1),
        legenda: 'Legenda fictícia da imagem dois',
        fontes: ['Fonte fictícia da imagem dois']
      }
    ]
  };
}

/** A fixture já passada pelo validador (o tipo que a interface recebe). Falha alto se a fixture quebrar. */
export function conteudoJuriValidadoFalso(): ConteudoJuriValidado {
  const resultado = validarConteudoJuri(conteudoJuriFalso(), idsFalsos());
  if (!resultado.ok) {
    throw new Error(`fixture falsa da Júri inválida: ${JSON.stringify(resultado.erros)}`);
  }
  return resultado.conteudo;
}
