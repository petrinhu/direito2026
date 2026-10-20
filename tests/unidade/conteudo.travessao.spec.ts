import { describe, expect, it } from 'vitest';
import { validarUnidade } from '@/core/conteudo/validarUnidade';
import { ROTULOS_CATEGORIA_QUIZ } from '@/conteudo/quiz/categorias';
import { perguntaSintetica, unidadeSintetica } from './apoio/unidadeSintetica';

/**
 * Travessão (U+2014, em-dash, e U+2013, en-dash) é proibido em TODO texto de
 * conteúdo público, sem exceção dentro da unidade. Quem reprova é a regra
 * "travessao" de validarUnidade; o validador do conteúdo não tem isenção.
 */
const EM_DASH = '—';
const EN_DASH = '–';

function travessoes(conteudo: ReturnType<typeof unidadeSintetica>) {
  return validarUnidade(conteudo, ROTULOS_CATEGORIA_QUIZ).filter((e) => e.regra === 'travessao');
}

describe('travessao: proibido em todo texto de unidade', () => {
  it('reprova em-dash no corpo de um bloco do resumo', () => {
    const erros = travessoes(
      unidadeSintetica({
        resumo: [{ ...unidadeSintetica().resumo[0]!, corpoHtml: `Antes ${EM_DASH} depois.` }]
      })
    );
    expect(erros).toHaveLength(1);
    expect(erros[0]!.caminho).toBe('resumo[0].corpoHtml');
  });

  it('reprova en-dash na explicação de uma pergunta do quiz', () => {
    const erros = travessoes(
      unidadeSintetica({
        quiz: [perguntaSintetica({ explicacaoHtml: `A regra ${EN_DASH} explicada.` })]
      })
    );
    expect(erros.map((e) => e.caminho)).toEqual(['quiz[0].explicacaoHtml']);
  });

  it('reprova travessão no título da unidade (meta), não só no corpo', () => {
    const erros = travessoes(
      unidadeSintetica({
        meta: { ...unidadeSintetica().meta, titulo: `Título ${EM_DASH} com travessão` }
      })
    );
    expect(erros.map((e) => e.caminho)).toEqual(['meta.titulo']);
  });

  it('reprova travessão mesmo na pergunta do professor, que isenta a regra de aula', () => {
    const erros = travessoes(
      unidadeSintetica({
        quiz: [
          perguntaSintetica({
            origem: 'professor',
            enunciadoHtml: `Enunciado ${EM_DASH} do professor.`
          })
        ]
      })
    );
    expect(erros.map((e) => e.caminho)).toEqual(['quiz[0].enunciadoHtml']);
  });

  it('aceita hífen, dois-pontos e vírgula, que são os substitutos permitidos', () => {
    expect(
      travessoes(
        unidadeSintetica({
          resumo: [
            {
              ...unidadeSintetica().resumo[0]!,
              corpoHtml: 'Regra: a lei-base, sem pressa, vale para todos.'
            }
          ]
        })
      )
    ).toEqual([]);
  });
});
