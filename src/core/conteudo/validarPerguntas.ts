import type { PerguntaQuiz } from '../unidade/tipos';
import type { ErroDeUnidade } from './tipos';

/**
 * Identidade e preenchimento de cada pergunta: id único no quiz, enunciado,
 * explicação e alternativas com texto, e a marca do caderno só como true.
 */
export function validarPerguntas(quiz: readonly PerguntaQuiz[]): ErroDeUnidade[] {
  const erros: ErroDeUnidade[] = [];
  const vistos = new Set<number>();
  const repetidos = new Set<number>();
  quiz.forEach((pergunta, i) => {
    if (vistos.has(pergunta.id)) repetidos.add(pergunta.id);
    vistos.add(pergunta.id);
    const base = `quiz[${i}]`;
    if (vazio(pergunta.enunciadoHtml)) erros.push(erroVazio(`${base}.enunciadoHtml`));
    if (vazio(pergunta.explicacaoHtml)) erros.push(erroVazio(`${base}.explicacaoHtml`));
    if ('alternativasHtml' in pergunta) {
      pergunta.alternativasHtml.forEach((alternativa, j) => {
        if (vazio(alternativa)) erros.push(erroVazio(`${base}.alternativasHtml[${j}]`));
      });
    }
    if ('gabaritoDoCaderno' in pergunta && pergunta.gabaritoDoCaderno !== true) {
      erros.push({
        regra: 'gabarito-do-caderno',
        caminho: `${base}.gabaritoDoCaderno`,
        detalhe: 'quando existe, gabaritoDoCaderno é true (nunca false)'
      });
    }
  });
  for (const id of repetidos) {
    erros.push({ regra: 'ids-unicos', caminho: 'quiz', detalhe: `id ${id} repetido no quiz` });
  }
  return erros;
}

function vazio(texto: string): boolean {
  return texto.trim() === '';
}

function erroVazio(caminho: string): ErroDeUnidade {
  return { regra: 'vazio', caminho, detalhe: 'campo vazio' };
}
