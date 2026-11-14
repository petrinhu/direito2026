import type { PerguntaQuiz } from '../../src/core/unidade/tipos';

/**
 * Portão de contagem do quiz de Filosofia AV3 (decisão do líder, 14/11/2026): no MÍNIMO 80
 * perguntas, com pelo menos 40 de múltipla escolha de 5 alternativas e pelo menos 40 de
 * verdadeiro ou falso. Ids em sequência a partir de 1, e toda pergunta com explicação.
 * Nada aqui imprime conteúdo: só devolve se conforme.
 */
const MINIMO_TOTAL = 80;
const MINIMO_MULTIPLA_ESCOLHA = 40;
const MINIMO_VERDADEIRO_OU_FALSO = 40;
const ALTERNATIVAS_DA_MULTIPLA_ESCOLHA = 5;

export function quizConforme(quiz: readonly PerguntaQuiz[]): boolean {
  if (quiz.length < MINIMO_TOTAL) return false;
  const vf = quiz.filter((p) => p.tipo === 'verdadeiro-ou-falso');
  const mc = quiz.filter((p) => p.tipo !== 'verdadeiro-ou-falso');
  if (mc.length < MINIMO_MULTIPLA_ESCOLHA || vf.length < MINIMO_VERDADEIRO_OU_FALSO) return false;
  const alternativas = mc.every(
    (p) => 'alternativasHtml' in p && p.alternativasHtml.length === ALTERNATIVAS_DA_MULTIPLA_ESCOLHA
  );
  if (!alternativas) return false;
  const sequencia = quiz.every((p, i) => p.id === i + 1);
  if (!sequencia) return false;
  return quiz.every((p) => String(p.explicacaoHtml ?? '').trim() !== '');
}
