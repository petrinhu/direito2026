import type { AlternativasQuiz, IndiceAlternativa, PerguntaQuiz } from '../unidade/tipos';
import { ALTERNATIVAS_VERDADEIRO_OU_FALSO } from './alternativasVerdadeiroOuFalso';
import type {
  FormaPergunta,
  OrdemRodada,
  PerguntaEmbaralhada,
  Pontuacao,
  PontuacaoCategoria,
  RodadaQuiz
} from './tipos';

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
    const marcas = {
      ...(pergunta.gabaritoDoCaderno ? { gabaritoDoCaderno: true as const } : {}),
      ...(pergunta.origem ? { origem: pergunta.origem } : {})
    };
    const comum = {
      id: pergunta.id,
      categoria: pergunta.categoria,
      enunciadoHtml: pergunta.enunciadoHtml,
      explicacaoHtml: pergunta.explicacaoHtml,
      fonteExtra: pergunta.fonteExtra
    };

    if (pergunta.tipo === 'verdadeiro-ou-falso') {
      // Não gasta sorteio: as alternativas ficam sempre na ordem fixa.
      return {
        ...comum,
        tipo: 'verdadeiro-ou-falso' as const,
        alternativasHtml: ALTERNATIVAS_VERDADEIRO_OU_FALSO,
        indiceCorreto: (pergunta.correta ? 0 : 1) as IndiceAlternativa,
        ordemOriginal: [0, 1],
        ...marcas
      };
    }

    // Os índices vêm do tamanho da própria pergunta (4 ou 5): com 4, a
    // sequência sorteada é a de sempre, então uma semente já gravada no
    // navegador continua reconstituindo a mesma rodada.
    const indicesOriginais = pergunta.alternativasHtml.map((_, i) => i as IndiceAlternativa);
    const ordem = embaralhar(indicesOriginais, aleatorio);
    const alternativasHtml = ordem.map(
      (i) => pergunta.alternativasHtml[i]
    ) as unknown as AlternativasQuiz;
    const indiceCorreto = ordem.indexOf(pergunta.correta) as IndiceAlternativa;
    return { ...comum, alternativasHtml, indiceCorreto, ordemOriginal: ordem, ...marcas };
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
  indiceEscolhido: IndiceAlternativa
): boolean {
  return indiceEscolhido === pergunta.indiceCorreto;
}

export function calcularPontuacao(
  perguntas: readonly PerguntaEmbaralhada[],
  respostas: Readonly<Record<number, IndiceAlternativa>>
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

/**
 * Ordem de exibição só pela forma e pela semente (AV3-K4). Repete o sorteio de
 * embaralharRodada na mesma sequência: perguntas primeiro, depois as alternativas
 * de cada múltipla escolha, na ordem já embaralhada. Verdadeiro ou falso não gasta
 * sorteio. Um teste de paridade prova que as duas saem iguais.
 */
export function ordemDaRodada(formas: readonly FormaPergunta[], semente: number): OrdemRodada {
  const aleatorio = criarGerador(semente);
  const ordemPerguntas = embaralhar(
    formas.map((_, i) => i),
    aleatorio
  );
  const alternativas = new Map<number, readonly IndiceAlternativa[]>();
  for (const i of ordemPerguntas) {
    const forma = formas[i]!;
    if (forma.tipo === 'vf') {
      alternativas.set(forma.id, [0, 1]);
      continue;
    }
    const posicoes = Array.from({ length: forma.alternativas }, (_, k) => k as IndiceAlternativa);
    alternativas.set(forma.id, embaralhar(posicoes, aleatorio));
  }
  return { ids: ordemPerguntas.map((i) => formas[i]!.id), alternativas };
}
