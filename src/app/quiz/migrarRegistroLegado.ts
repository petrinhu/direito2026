import { ordemDaRodada } from '@/core/quiz/motor';
import type { ChaveUnidade, RegistroProgressoUnidade } from '@/core/progresso/tipos';
import type { FormaPergunta } from '@/core/quiz/tipos';
import type { IndiceAlternativa } from '@/core/unidade/tipos';
import { CORTES_QUIZ_CRESCEU } from './cortesQuizCresceu';
import { FORMAS_CONGELADAS } from './formasCongeladas';

export interface FontesMigracao {
  readonly formas: Readonly<Record<ChaveUnidade, readonly FormaPergunta[]>>;
  readonly cortes: Readonly<Record<ChaveUnidade, string>>;
}

const FONTES_DO_SITE: FontesMigracao = {
  formas: FORMAS_CONGELADAS,
  cortes: CORTES_QUIZ_CRESCEU
};

/**
 * Registro legado (antes da AV3-K4) vira formato novo, uma vez, na leitura. Três saídas:
 * - formato novo ou sem quiz: passa intacto;
 * - não dá para provar que a resposta é posterior ao corte, ou não há forma/semente:
 *   zera o quiz (lidos e aba ficam);
 * - o resto: traduz cada resposta da posição embaralhada para a posição original.
 * A decisão de zerar é tomada aqui, com o registro como foi lido, antes de qualquer gravação.
 */
export function migrarRegistroLegado(
  registro: RegistroProgressoUnidade,
  chave: ChaveUnidade,
  fontes: FontesMigracao = FONTES_DO_SITE
): RegistroProgressoUnidade {
  if (registro.quizRespostasOriginais !== undefined) return registro;
  const temQuiz = registro.quizSemente !== undefined || registro.quizRespostas !== undefined;
  if (!temQuiz) return registro;

  const corte = fontes.cortes[chave];
  if (corte !== undefined && !(Date.parse(registro.atualizadoEm) >= Date.parse(corte))) {
    return semQuiz(registro);
  }
  const forma = fontes.formas[chave];
  if (forma === undefined || registro.quizSemente === undefined) return semQuiz(registro);
  return traduzir(registro, forma, registro.quizSemente);
}

function semQuiz(registro: RegistroProgressoUnidade): RegistroProgressoUnidade {
  const { quizSemente, quizRespostas, quizFinalizado, ...restante } = registro;
  void quizSemente;
  void quizRespostas;
  void quizFinalizado;
  return { ...restante, quizRespostasOriginais: {} };
}

function traduzir(
  registro: RegistroProgressoUnidade,
  forma: readonly FormaPergunta[],
  semente: number
): RegistroProgressoUnidade {
  const ordem = ordemDaRodada(forma, semente);
  const originais: Record<number, IndiceAlternativa> = {};
  for (const [idTexto, mostrada] of Object.entries(registro.quizRespostas ?? {})) {
    const id = Number(idTexto);
    const original = ordem.alternativas.get(id)?.[mostrada];
    if (original !== undefined) originais[id] = original;
  }
  const { quizRespostas, ...restante } = registro;
  void quizRespostas;
  return {
    ...restante,
    quizRespostasOriginais: originais,
    quizIdsDaRodada: forma.map((f) => f.id)
  };
}
