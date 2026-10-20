import type { PerguntaQuiz } from '../unidade/tipos';
import type { ErroDeUnidade } from './tipos';

/** Quantidades de alternativa permitidas na múltipla escolha. */
const TAMANHOS_PERMITIDOS: readonly number[] = [4, 5];

/**
 * Número de alternativas (4 ou 5, igual dentro de um mesmo quiz; verdadeiro
 * ou falso fica à parte) e a correta dentro do intervalo, ou booleana no V/F.
 */
export function validarAlternativas(quiz: readonly PerguntaQuiz[]): ErroDeUnidade[] {
  const erros: ErroDeUnidade[] = [];
  const tamanhos = new Set<number>();

  quiz.forEach((pergunta, i) => {
    const base = `quiz[${i}]`;
    if (pergunta.tipo === 'verdadeiro-ou-falso') {
      if (typeof pergunta.correta !== 'boolean') {
        erros.push({
          regra: 'correta',
          caminho: `${base}.correta`,
          detalhe: 'verdadeiro ou falso exige correta booleana'
        });
      }
      return;
    }
    const total = pergunta.alternativasHtml.length;
    tamanhos.add(total);
    if (!TAMANHOS_PERMITIDOS.includes(total)) {
      erros.push({
        regra: 'alternativas',
        caminho: `${base}.alternativasHtml`,
        detalhe: `${total} alternativas (esperado 4 ou 5)`
      });
    }
    const correta = pergunta.correta;
    if (!Number.isInteger(correta) || correta < 0 || correta >= total) {
      erros.push({
        regra: 'correta',
        caminho: `${base}.correta`,
        detalhe: `correta ${String(correta)} fora de 0 a ${total - 1}`
      });
    }
  });

  if (tamanhos.size > 1) {
    erros.push({
      regra: 'alternativas-homogeneas',
      caminho: 'quiz',
      detalhe: `quantidades misturadas no mesmo quiz: ${[...tamanhos].sort().join(', ')}`
    });
  }
  return erros;
}
