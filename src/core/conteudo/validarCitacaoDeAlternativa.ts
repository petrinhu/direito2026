import type { PerguntaQuiz } from '../unidade/tipos';
import type { ErroDeUnidade } from './tipos';
import { CITA_LETRA, CITA_POSICAO, EXPRESSAO_ACIMA_DO_HOMEM } from './regrasDeTexto';

/**
 * A explicação e o enunciado não citam letra nem posição de alternativa: o
 * motor embaralha as respostas, então "alternativa B" ou "acima" ficam errados
 * a cada rodada.
 */
export function validarCitacaoDeAlternativa(quiz: readonly PerguntaQuiz[]): ErroDeUnidade[] {
  const erros: ErroDeUnidade[] = [];
  quiz.forEach((pergunta, i) => {
    const explicacao = pergunta.explicacaoHtml.replace(EXPRESSAO_ACIMA_DO_HOMEM, '');
    const achado =
      CITA_LETRA.exec(pergunta.explicacaoHtml) ??
      CITA_POSICAO.exec(explicacao) ??
      CITA_LETRA.exec(pergunta.enunciadoHtml);
    if (achado) {
      erros.push({
        regra: 'citacao-de-alternativa',
        caminho: `quiz[${i}]`,
        detalhe: `cita letra ou posição de alternativa: "${achado[0]}"`
      });
    }
  });
  return erros;
}
