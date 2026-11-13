import type { FormaPergunta } from '@/core/quiz/tipos';

/** Violações e novidades ao conferir as formas congeladas contra o conteúdo atual (AV3-K4b). */
export interface ResultadoConferencia {
  readonly violacoes: readonly string[];
  readonly novas: readonly string[];
}

/**
 * A forma congelada é a forma LEGADA: a que as respostas salvas no formato antigo indexam.
 * Ela não acompanha o conteúdo. O conteúdo cresce por acréscimo, e o que reprova é o que
 * muda o sentido de uma resposta salva por id: unidade congelada que sumiu, pergunta que
 * sumiu, tipo trocado, menos alternativas que a forma, ou ids congelados fora da ordem
 * relativa. Pergunta e unidade novas são só informação.
 */
export function conferirFormasCongeladas(
  formas: Readonly<Record<string, readonly FormaPergunta[]>>,
  atuais: Readonly<Record<string, readonly FormaPergunta[]>>
): ResultadoConferencia {
  const violacoes: string[] = [];
  const novas: string[] = [];
  for (const chave of Object.keys(formas)) {
    const atual = atuais[chave];
    if (atual === undefined) {
      violacoes.push(`${chave}: unidade da forma congelada não tem mais quiz`);
      continue;
    }
    violacoes.push(...conferirUnidade(chave, formas[chave]!, atual));
    novas.push(...perguntasNovas(chave, formas[chave]!, atual));
  }
  for (const chave of Object.keys(atuais)) {
    if (!(chave in formas)) novas.push(`${chave}: unidade nova no quiz (sem registro legado)`);
  }
  return { violacoes, novas };
}

function conferirUnidade(
  chave: string,
  congeladas: readonly FormaPergunta[],
  atuais: readonly FormaPergunta[]
): string[] {
  const porId = new Map(atuais.map((pergunta) => [pergunta.id, pergunta]));
  const violacoes: string[] = [];
  for (const forma of congeladas) {
    const atual = porId.get(forma.id);
    if (atual === undefined) {
      violacoes.push(`${chave} pergunta ${forma.id}: sumiu do quiz`);
    } else if (atual.tipo !== forma.tipo) {
      violacoes.push(
        `${chave} pergunta ${forma.id}: tipo mudou de ${forma.tipo} para ${atual.tipo}`
      );
    } else if (forma.tipo === 'mc' && atual.alternativas < forma.alternativas) {
      violacoes.push(
        `${chave} pergunta ${forma.id}: menos alternativas (de ${forma.alternativas} para ${atual.alternativas})`
      );
    }
  }
  const ordemCongelada = congeladas.map((forma) => forma.id).filter((id) => porId.has(id));
  const ordemAtual = atuais
    .map((pergunta) => pergunta.id)
    .filter((id) => ordemCongelada.includes(id));
  if (JSON.stringify(ordemCongelada) !== JSON.stringify(ordemAtual)) {
    violacoes.push(`${chave}: ids congelados fora da ordem relativa`);
  }
  return violacoes;
}

function perguntasNovas(
  chave: string,
  congeladas: readonly FormaPergunta[],
  atuais: readonly FormaPergunta[]
): string[] {
  const conhecidas = new Set(congeladas.map((forma) => forma.id));
  return atuais
    .filter((pergunta) => !conhecidas.has(pergunta.id))
    .map((pergunta) => `${chave} pergunta ${pergunta.id}: pergunta nova no quiz`);
}
