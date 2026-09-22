import type { CategoriaQuiz, PerguntaQuiz } from '../unidade/tipos';
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
    const alternativas = ordem.map((i) => pergunta.alternativas[i]) as [
      string,
      string,
      string,
      string
    ];
    const indiceCorreto = ordem.indexOf(pergunta.correta) as 0 | 1 | 2 | 3;
    return {
      id: pergunta.id,
      categoria: pergunta.categoria,
      enunciado: pergunta.enunciado,
      explicacao: pergunta.explicacao,
      fonteExtra: pergunta.fonteExtra,
      alternativas,
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

export interface ContagemCategoria {
  readonly categoria: CategoriaQuiz;
  readonly contagem: number;
}

/**
 * Agrupa as perguntas (não embaralhadas, como vêm do conteúdo) por
 * categoria e conta quantas há em cada uma. Usado pelo 4o nível do menu
 * (MenuCurriculo.vue, submenu de Quiz, ordem do líder 22/09/2026): mostra
 * a categoria com a contagem, sem embaralhar nem tocar em resposta/rodada.
 * Ordem de saída: a de primeira aparição da categoria no array de entrada.
 */
export function contarPorCategoria(
  perguntas: readonly PerguntaQuiz[]
): readonly ContagemCategoria[] {
  const contagemMapa = new Map<CategoriaQuiz, number>();
  for (const pergunta of perguntas) {
    contagemMapa.set(pergunta.categoria, (contagemMapa.get(pergunta.categoria) ?? 0) + 1);
  }
  return [...contagemMapa.entries()].map(([categoria, contagem]) => ({ categoria, contagem }));
}
