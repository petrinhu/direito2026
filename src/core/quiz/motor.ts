import type { PerguntaQuiz } from '../unidade/tipos';
import type { PerguntaEmbaralhada, Pontuacao, PontuacaoCategoria, RodadaQuiz } from './tipos';

/**
 * PRNG determinístico (mulberry32) a partir de uma semente numérica. Nunca
 * `Math.random()`: a rodada precisa ser reconstituível a partir da semente
 * guardada (seção 8 da arquitetura), sem gravar as 60 perguntas embaralhadas
 * no localStorage.
 */
function criarGerador(semente: number): () => number {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates com gerador injetado, para ser determinístico e testável. */
function embaralhar<T>(itens: readonly T[], aleatorio: () => number): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}

/**
 * Constrói uma rodada nova a partir das perguntas do conteúdo e de uma
 * semente. A mesma semente sobre o mesmo conjunto de perguntas sempre
 * produz a mesma ordem, tanto de perguntas quanto de alternativas: é o que
 * permite reconstituir a rodada só a partir da semente guardada.
 */
export function embaralharRodada(perguntas: readonly PerguntaQuiz[], semente: number): RodadaQuiz {
  const aleatorio = criarGerador(semente);
  const perguntasEmbaralhadas = embaralhar(perguntas, aleatorio);

  const resultado: PerguntaEmbaralhada[] = perguntasEmbaralhadas.map((pergunta) => {
    const indicesOriginais = [0, 1, 2, 3] as const;
    const ordem = embaralhar(indicesOriginais, aleatorio);
    const alternativasHtml = ordem.map((i) => pergunta.alternativasHtml[i]) as [
      string,
      string,
      string,
      string
    ];
    const indiceCorreto = ordem.indexOf(pergunta.correta) as 0 | 1 | 2 | 3;
    return {
      id: pergunta.id,
      categoria: pergunta.categoria,
      enunciadoHtml: pergunta.enunciadoHtml,
      explicacaoHtml: pergunta.explicacaoHtml,
      fonteExtra: pergunta.fonteExtra,
      alternativasHtml,
      indiceCorreto
    };
  });

  return {
    perguntas: resultado,
    respostas: {},
    indiceAtual: 0,
    finalizada: false
  };
}

export function corrigirResposta(
  pergunta: PerguntaEmbaralhada,
  indiceEscolhido: 0 | 1 | 2 | 3
): boolean {
  return indiceEscolhido === pergunta.indiceCorreto;
}

export function calcularPontuacao(
  perguntas: readonly PerguntaEmbaralhada[],
  respostas: Readonly<Record<number, 0 | 1 | 2 | 3>>
): Pontuacao {
  const porCategoriaMapa = new Map<string, { acertos: number; total: number }>();

  let acertos = 0;
  for (const pergunta of perguntas) {
    const atual = porCategoriaMapa.get(pergunta.categoria) ?? { acertos: 0, total: 0 };
    atual.total += 1;
    const resposta = respostas[pergunta.id];
    if (resposta !== undefined && corrigirResposta(pergunta, resposta)) {
      atual.acertos += 1;
      acertos += 1;
    }
    porCategoriaMapa.set(pergunta.categoria, atual);
  }

  const porCategoria: PontuacaoCategoria[] = [...porCategoriaMapa.entries()].map(
    ([categoria, v]) => ({
      categoria: categoria as PontuacaoCategoria['categoria'],
      acertos: v.acertos,
      total: v.total
    })
  );

  return { acertos, total: perguntas.length, porCategoria };
}
