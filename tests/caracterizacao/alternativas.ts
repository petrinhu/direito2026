import { createHash } from 'node:crypto';
import { ALTERNATIVAS_VERDADEIRO_OU_FALSO } from '@/core/quiz/alternativasVerdadeiroOuFalso';
import type { PerguntaQuiz } from '@/core/unidade/tipos';

/**
 * Portão das alternativas do quiz (AV3-K4). Por unidade e por id de pergunta, a
 * impressão curta (sha256, 12 hex) de cada alternativa, na ordem do conteúdo. Não
 * guarda texto. Regra que o portão impõe: alternativa só entra NO FIM da lista;
 * reordenar ou remover alternativa reprova, porque a resposta guardada por posição
 * original deixaria de apontar para o texto que o aluno escolheu.
 */
export type ImpressoesDaPergunta = Readonly<Record<string, readonly string[]>>;
export type AlternativasPorUnidade = Readonly<Record<string, ImpressoesDaPergunta>>;

export interface ComparacaoAlternativas {
  /** Mudanças que reprovam: pergunta sumiu, alternativa sumiu, reordenada ou fora do fim. */
  readonly reprovacoes: readonly string[];
  /** Mudanças aceitas: alternativa nova no fim, pergunta nova, texto editado no lugar. */
  readonly aceitas: readonly string[];
}

export function impressaoDaAlternativa(texto: string): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex').slice(0, 12);
}

export function projetarAlternativas(quiz: readonly PerguntaQuiz[]): ImpressoesDaPergunta {
  const porId: Record<string, readonly string[]> = {};
  for (const pergunta of quiz) {
    const textos =
      pergunta.tipo === 'verdadeiro-ou-falso' ? ALTERNATIVAS_VERDADEIRO_OU_FALSO : pergunta.alternativasHtml;
    porId[String(pergunta.id)] = textos.map(impressaoDaAlternativa);
  }
  return porId;
}

/** Compara a referência gravada com o estado atual, unidade por unidade e pergunta por pergunta. */
export function compararAlternativas(
  esperado: AlternativasPorUnidade,
  atual: AlternativasPorUnidade
): ComparacaoAlternativas {
  const reprovacoes: string[] = [];
  const aceitas: string[] = [];
  for (const [unidadeChave, perguntasEsperadas] of Object.entries(esperado)) {
    const perguntasAtuais = atual[unidadeChave];
    if (perguntasAtuais === undefined) {
      reprovacoes.push(`${unidadeChave}: unidade sumiu do quiz`);
      continue;
    }
    for (const [id, impressoesEsperadas] of Object.entries(perguntasEsperadas)) {
      const rotulo = `${unidadeChave} pergunta ${id}`;
      const impressoesAtuais = perguntasAtuais[id];
      if (impressoesAtuais === undefined) {
        reprovacoes.push(`${rotulo}: pergunta sumiu`);
        continue;
      }
      const parte = compararPergunta(rotulo, impressoesEsperadas, impressoesAtuais);
      reprovacoes.push(...parte.reprovacoes);
      aceitas.push(...parte.aceitas);
    }
    for (const id of Object.keys(perguntasAtuais)) {
      if (!(id in perguntasEsperadas)) aceitas.push(`${unidadeChave} pergunta ${id}: pergunta nova`);
    }
  }
  for (const unidadeChave of Object.keys(atual)) {
    if (!(unidadeChave in esperado)) aceitas.push(`${unidadeChave}: unidade nova no quiz`);
  }
  return { reprovacoes, aceitas };
}

/**
 * Uma pergunta. As posições que já existiam ficam nas mesmas posições (ou com texto
 * editado no lugar); as novas só entram depois da última. Qualquer impressão antiga
 * fora da posição dela, ou alternativa que sumiu, reprova.
 */
function compararPergunta(
  rotulo: string,
  esperadas: readonly string[],
  atuais: readonly string[]
): { reprovacoes: string[]; aceitas: string[] } {
  const reprovacoes: string[] = [];
  const aceitas: string[] = [];
  if (atuais.length < esperadas.length) {
    reprovacoes.push(`${rotulo}: alternativa sumiu (de ${esperadas.length} para ${atuais.length})`);
    return { reprovacoes, aceitas };
  }
  esperadas.forEach((impressao, i) => {
    // Há pelo menos tantas atuais quanto esperadas (o caso contrário já saiu acima).
    const atualNaPosicao = atuais[i]!;
    if (atualNaPosicao === impressao) return;
    if (esperadas.includes(atualNaPosicao)) {
      reprovacoes.push(`${rotulo}: alternativa fora de ordem na posição ${i + 1} (reordenação)`);
    } else {
      aceitas.push(`${rotulo}: alternativa ${i + 1} editada no lugar`);
    }
  });
  atuais.slice(esperadas.length).forEach((impressao, k) => {
    const posicao = esperadas.length + k + 1;
    if (esperadas.includes(impressao)) {
      reprovacoes.push(`${rotulo}: alternativa antiga na posição ${posicao} (fora do fim)`);
    } else {
      aceitas.push(`${rotulo}: alternativa nova no fim (posição ${posicao})`);
    }
  });
  return { reprovacoes, aceitas };
}
