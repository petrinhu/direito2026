import { describe, expect, it } from 'vitest';
import { validarUnidade } from '@/core/conteudo/validarUnidade';
import { ROTULOS_CATEGORIA_QUIZ } from '@/conteudo/quiz/categorias';
import { unidadeSintetica } from './apoio/unidadeSintetica';

/**
 * Os modelos do gerador nascem com um texto de espera ("A escrever antes da
 * publicação." em meta.ts, "A escrever." na petição). Esse texto é válido em
 * unidade em-breve, porque ela ainda não aparece ao aluno. Em unidade publicada,
 * ele reprova: a regra "placeholder" vale só quando o estado é publicado.
 */
const PLACEHOLDER_META = 'A escrever antes da publicação.';
const PLACEHOLDER_PETICAO = '<p>A escrever.</p>';

function placeholders(conteudo: ReturnType<typeof unidadeSintetica>) {
  return validarUnidade(conteudo, ROTULOS_CATEGORIA_QUIZ).filter((e) => e.regra === 'placeholder');
}

describe('placeholder: reprova só em unidade publicada', () => {
  it('reprova a descrição de espera do gerador numa unidade publicada', () => {
    const erros = placeholders(
      unidadeSintetica({
        meta: {
          rotulo: 'Unidade 1',
          estado: 'publicado',
          titulo: 'T',
          subtitulo: 'S',
          descricao: PLACEHOLDER_META
        }
      })
    );
    expect(erros.map((e) => e.caminho)).toEqual(['meta.descricao']);
  });

  it('reprova a nota de espera da petição numa unidade publicada', () => {
    const erros = placeholders(
      unidadeSintetica({
        peticao: { titulo: 'Peça', notaHtml: PLACEHOLDER_PETICAO, secoes: [] }
      })
    );
    expect(erros.map((e) => e.caminho)).toEqual(['peticao.notaHtml']);
  });

  it('aceita o mesmo texto de espera numa unidade em-breve', () => {
    const erros = placeholders(
      unidadeSintetica({
        meta: {
          rotulo: 'Unidade 1',
          estado: 'em-breve',
          titulo: 'T',
          subtitulo: 'S',
          descricao: PLACEHOLDER_META
        },
        peticao: { titulo: 'Peça', notaHtml: PLACEHOLDER_PETICAO, secoes: [] }
      })
    );
    expect(erros).toEqual([]);
  });

  it('compara o texto inteiro: frase real que apenas começa com "A escrever" passa', () => {
    const erros = placeholders(
      unidadeSintetica({
        resumo: [
          {
            ...unidadeSintetica().resumo[0]!,
            corpoHtml: 'A escrever sobre o tema exige cuidado com a fonte.'
          }
        ]
      })
    );
    expect(erros).toEqual([]);
  });
});
