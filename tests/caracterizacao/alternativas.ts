import { createHash } from 'node:crypto';
import { ALTERNATIVAS_VERDADEIRO_OU_FALSO } from '@/core/quiz/alternativasVerdadeiroOuFalso';
import type { PerguntaQuiz } from '@/core/unidade/tipos';

/**
 * Portão das alternativas do quiz (AV3-K4). Por unidade e por id de pergunta: a impressão
 * curta (sha256, 12 hex) de cada alternativa, na ordem do conteúdo, e a posição da correta.
 * Não guarda texto. Decisão do líder de 13/11/2026 ("Aceitar e avisar"):
 * - reordenar, remover, pôr alternativa antiga fora do fim ou trocar a correta REPROVA;
 * - alternativa nova no fim passa sem aviso;
 * - editar o texto no lugar passa, e AVISA: a lista vai para quem publica conferir.
 */
export interface ImpressoesDaPergunta {
  readonly alternativas: readonly string[];
  /** Posição (0 a 4) da alternativa correta no conteúdo. Número, sem texto. */
  readonly correta: number;
}
export type AlternativasPorUnidade = Readonly<
  Record<string, Readonly<Record<string, ImpressoesDaPergunta>>>
>;

export interface ComparacaoAlternativas {
  /** Mudanças que reprovam: pergunta ou alternativa sumiu, reordenada, fora do fim, gabarito trocado. */
  readonly reprovacoes: readonly string[];
  /** Edições de texto no lugar: passam, mas quem publica deve conferir. */
  readonly avisos: readonly string[];
  /** Mudanças aceitas sem aviso: alternativa nova no fim, pergunta nova, unidade nova. */
  readonly aceitas: readonly string[];
}

export function impressaoDaAlternativa(texto: string): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex').slice(0, 12);
}

export function projetarAlternativas(
  quiz: readonly PerguntaQuiz[]
): Readonly<Record<string, ImpressoesDaPergunta>> {
  const porId: Record<string, ImpressoesDaPergunta> = {};
  for (const pergunta of quiz) {
    const verdadeiroOuFalso = pergunta.tipo === 'verdadeiro-ou-falso';
    const textos = verdadeiroOuFalso ? ALTERNATIVAS_VERDADEIRO_OU_FALSO : pergunta.alternativasHtml;
    const correta = verdadeiroOuFalso ? (pergunta.correta ? 0 : 1) : pergunta.correta;
    porId[String(pergunta.id)] = {
      alternativas: textos.map(impressaoDaAlternativa),
      correta
    };
  }
  return porId;
}

/** Compara a referência gravada com o estado atual, unidade por unidade e pergunta por pergunta. */
export function compararAlternativas(
  esperado: AlternativasPorUnidade,
  atual: AlternativasPorUnidade
): ComparacaoAlternativas {
  const reprovacoes: string[] = [];
  const avisos: string[] = [];
  const aceitas: string[] = [];
  for (const [unidadeChave, perguntasEsperadas] of Object.entries(esperado)) {
    const perguntasAtuais = atual[unidadeChave];
    if (perguntasAtuais === undefined) {
      reprovacoes.push(`${unidadeChave}: unidade sumiu do quiz`);
      continue;
    }
    for (const [id, esperada] of Object.entries(perguntasEsperadas)) {
      const rotulo = `${unidadeChave} pergunta ${id}`;
      const atualPergunta = perguntasAtuais[id];
      if (atualPergunta === undefined) {
        reprovacoes.push(`${rotulo}: pergunta sumiu`);
        continue;
      }
      const parte = compararPergunta(rotulo, esperada, atualPergunta);
      reprovacoes.push(...parte.reprovacoes);
      avisos.push(...parte.avisos);
      aceitas.push(...parte.aceitas);
    }
    for (const id of Object.keys(perguntasAtuais)) {
      if (!(id in perguntasEsperadas))
        aceitas.push(`${unidadeChave} pergunta ${id}: pergunta nova`);
    }
  }
  for (const unidadeChave of Object.keys(atual)) {
    if (!(unidadeChave in esperado)) aceitas.push(`${unidadeChave}: unidade nova no quiz`);
  }
  return { reprovacoes, avisos, aceitas };
}

interface Parte {
  reprovacoes: string[];
  avisos: string[];
  aceitas: string[];
}

/**
 * Uma pergunta. As posições que já existiam ficam nas mesmas posições (ou com texto
 * editado no lugar, que avisa); as novas só entram depois da última. Impressão antiga fora
 * da posição dela, alternativa que sumiu, ou gabarito trocado reprovam.
 */
function compararPergunta(
  rotulo: string,
  esperada: ImpressoesDaPergunta,
  atual: ImpressoesDaPergunta
): Parte {
  const reprovacoes: string[] = [];
  const avisos: string[] = [];
  const aceitas: string[] = [];
  const esperadas = esperada.alternativas;
  const atuais = atual.alternativas;

  if (esperada.correta !== atual.correta) {
    reprovacoes.push(
      `${rotulo}: gabarito trocado (de ${esperada.correta + 1} para ${atual.correta + 1})`
    );
  }
  if (atuais.length < esperadas.length) {
    reprovacoes.push(`${rotulo}: alternativa sumiu (de ${esperadas.length} para ${atuais.length})`);
    return { reprovacoes, avisos, aceitas };
  }
  esperadas.forEach((impressao, i) => {
    // Há pelo menos tantas atuais quanto esperadas (o caso contrário já saiu acima).
    const atualNaPosicao = atuais[i]!;
    if (atualNaPosicao === impressao) return;
    if (esperadas.includes(atualNaPosicao)) {
      reprovacoes.push(`${rotulo}: alternativa fora de ordem na posição ${i + 1} (reordenação)`);
    } else {
      const marca = i === atual.correta ? ' (alternativa correta)' : '';
      avisos.push(`${rotulo}: alternativa ${i + 1} editada no lugar${marca}`);
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
  return { reprovacoes, avisos, aceitas };
}
