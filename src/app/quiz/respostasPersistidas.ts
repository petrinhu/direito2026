import type { PerguntaEmbaralhada } from '@/core/quiz/tipos';
import type { IndiceAlternativa } from '@/core/unidade/tipos';

/**
 * Converte as respostas guardadas pela posição ORIGINAL (AV3-K4) para a posição que
 * cada alternativa tem nesta rodada. Resposta cuja posição não existe na pergunta é ignorada.
 */
export function respostasParaExibir(
  perguntas: readonly PerguntaEmbaralhada[],
  originais: Readonly<Record<number, IndiceAlternativa>>
): Record<number, IndiceAlternativa> {
  const exibidas: Record<number, IndiceAlternativa> = {};
  for (const pergunta of perguntas) {
    const original = originais[pergunta.id];
    if (original === undefined) continue;
    const indice = pergunta.ordemOriginal.indexOf(original);
    if (indice !== -1) exibidas[pergunta.id] = indice as IndiceAlternativa;
  }
  return exibidas;
}

/** Inverso: a alternativa escolhida na tela, pela posição original que ela tem no conteúdo. */
export function indiceOriginalDaEscolha(
  perguntas: readonly PerguntaEmbaralhada[],
  idPergunta: number,
  indiceExibido: IndiceAlternativa
): IndiceAlternativa | undefined {
  return perguntas.find((p) => p.id === idPergunta)?.ordemOriginal[indiceExibido];
}
