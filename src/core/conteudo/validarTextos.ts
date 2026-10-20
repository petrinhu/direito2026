import type { ConteudoUnidade, PerguntaQuiz } from '../unidade/tipos';
import { textosDoValor } from './caminhosDeTexto';
import type { ErroDeUnidade } from './tipos';
import {
  APONTA_PARA_MATERIAL,
  CITA_AULA_OU_SLIDE,
  FONTE_COM_AULA_OU_DATA,
  REFERENCIA_GENERICA_DE_MATERIAL
} from './regrasDeTexto';

/**
 * Texto ao aluno: nunca cita aula, slide nem "o material", e a fonte não traz
 * número de aula nem data. Varre a unidade inteira (meta, resumo, petição,
 * mapa, fichamento, mnemônicos e quiz), com as duas isenções da matéria: a
 * referência genérica "Material de aula da disciplina" (em `fonte` e em
 * `referencias`) e o enunciado de
 * pergunta do professor ou do caderno, que é de quem escreveu.
 */
export function validarTextos(conteudo: ConteudoUnidade): ErroDeUnidade[] {
  const { quiz, ...restante } = conteudo;
  const erros = textosDoValor(restante).flatMap(({ caminho, campo, texto }) => {
    if (campo === 'fonte' || campo === 'referencias') {
      const semGenerica = texto.replace(REFERENCIA_GENERICA_DE_MATERIAL, '');
      return erroSe(FONTE_COM_AULA_OU_DATA.exec(semGenerica), 'fonte-proibida', caminho);
    }
    return erroSe(
      CITA_AULA_OU_SLIDE.exec(texto) ?? APONTA_PARA_MATERIAL.exec(texto),
      'texto-proibido',
      caminho
    );
  });
  return [...erros, ...validarTextosDoQuiz(quiz ?? [])];
}

function validarTextosDoQuiz(quiz: readonly PerguntaQuiz[]): ErroDeUnidade[] {
  return quiz.flatMap((pergunta, i) => {
    const base = `quiz[${i}]`;
    const deOutraAutoria = pergunta.origem === 'professor' || pergunta.gabaritoDoCaderno === true;
    const alternativas = 'alternativasHtml' in pergunta ? pergunta.alternativasHtml : [];
    // A explicação é do caderno e nunca é isenta; o enunciado e as alternativas
    // do professor ou do caderno são isentos só da regra de aula.
    const campos: Array<{ caminho: string; texto: string; isentoDeAula: boolean }> = [
      { caminho: `${base}.explicacaoHtml`, texto: pergunta.explicacaoHtml, isentoDeAula: false },
      {
        caminho: `${base}.enunciadoHtml`,
        texto: pergunta.enunciadoHtml,
        isentoDeAula: deOutraAutoria
      },
      ...alternativas.map((texto, j) => ({
        caminho: `${base}.alternativasHtml[${j}]`,
        texto,
        isentoDeAula: deOutraAutoria
      }))
    ];
    return campos.flatMap(({ caminho, texto, isentoDeAula }) => {
      const aula = isentoDeAula ? null : CITA_AULA_OU_SLIDE.exec(texto);
      return erroSe(aula ?? APONTA_PARA_MATERIAL.exec(texto), 'texto-proibido', caminho);
    });
  });
}

function erroSe(
  achado: RegExpExecArray | null,
  regra: 'texto-proibido' | 'fonte-proibida',
  caminho: string
): ErroDeUnidade[] {
  if (!achado) return [];
  return [{ regra, caminho, detalhe: `trecho proibido: "${achado[0]}"` }];
}
