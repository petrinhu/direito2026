import { describe, expect, it } from 'vitest';
import { embaralharRodada, corrigirResposta, calcularPontuacao } from '@/core/quiz/motor';
import type { IndiceAlternativa, PerguntaMultiplaEscolha } from '@/core/unidade/tipos';

function perguntasDeTeste(): readonly PerguntaMultiplaEscolha[] {
  return [
    {
      id: 1,
      categoria: 'teoria',
      enunciadoHtml: 'Pergunta 1',
      alternativasHtml: ['a', 'b', 'c', 'd'],
      correta: 0,
      fonteExtra: false,
      explicacaoHtml: 'porque a'
    },
    {
      id: 2,
      categoria: 'peticao',
      enunciadoHtml: 'Pergunta 2',
      alternativasHtml: ['w', 'x', 'y', 'z'],
      correta: 2,
      fonteExtra: true,
      explicacaoHtml: 'porque y'
    },
    {
      id: 3,
      categoria: 'fundamentos',
      enunciadoHtml: 'Pergunta 3',
      alternativasHtml: ['1', '2', '3', '4'],
      correta: 3,
      fonteExtra: false,
      explicacaoHtml: 'porque 4'
    }
  ];
}

describe('embaralharRodada', () => {
  it('preserva o conjunto de perguntas e de alternativas', () => {
    const rodada = embaralharRodada(perguntasDeTeste(), 42);
    expect(rodada.perguntas).toHaveLength(3);
    const idsOriginais = perguntasDeTeste()
      .map((p) => p.id)
      .sort();
    const idsRodada = rodada.perguntas.map((p) => p.id).sort();
    expect(idsRodada).toEqual(idsOriginais);

    for (const original of perguntasDeTeste()) {
      const embaralhada = rodada.perguntas.find((p) => p.id === original.id)!;
      expect([...embaralhada.alternativasHtml].sort()).toEqual(
        [...original.alternativasHtml].sort()
      );
    }
  });

  it('indiceCorreto sempre aponta para o mesmo texto que era a correta original', () => {
    const rodada = embaralharRodada(perguntasDeTeste(), 7);
    for (const original of perguntasDeTeste()) {
      const embaralhada = rodada.perguntas.find((p) => p.id === original.id)!;
      const textoCorretoOriginal = original.alternativasHtml[original.correta];
      expect(embaralhada.alternativasHtml[embaralhada.indiceCorreto]).toBe(textoCorretoOriginal);
    }
  });

  it('a mesma semente produz sempre a mesma ordem (reconstituição a partir da semente)', () => {
    const r1 = embaralharRodada(perguntasDeTeste(), 123);
    const r2 = embaralharRodada(perguntasDeTeste(), 123);
    expect(r1.perguntas.map((p) => p.id)).toEqual(r2.perguntas.map((p) => p.id));
    expect(r1.perguntas.map((p) => p.alternativasHtml)).toEqual(
      r2.perguntas.map((p) => p.alternativasHtml)
    );
  });

  it('sementes diferentes tendem a produzir ordens diferentes', () => {
    const r1 = embaralharRodada(perguntasDeTeste(), 1);
    const r2 = embaralharRodada(perguntasDeTeste(), 2);
    const mudou =
      r1.perguntas.map((p) => p.id).join(',') !== r2.perguntas.map((p) => p.id).join(',') ||
      r1.perguntas.some(
        (p, i) => p.alternativasHtml.join('|') !== r2.perguntas[i]!.alternativasHtml.join('|')
      );
    expect(mudou).toBe(true);
  });

  it('começa não finalizada, sem respostas e no índice 0', () => {
    const rodada = embaralharRodada(perguntasDeTeste(), 1);
    expect(rodada.finalizada).toBe(false);
    expect(rodada.respostas).toEqual({});
    expect(rodada.indiceAtual).toBe(0);
  });
});

describe('corrigirResposta', () => {
  it('devolve acerto quando o índice escolhido é o correto', () => {
    const rodada = embaralharRodada(perguntasDeTeste(), 9);
    const pergunta = rodada.perguntas[0]!;
    expect(corrigirResposta(pergunta, pergunta.indiceCorreto)).toBe(true);
  });

  it('devolve erro quando o índice escolhido não é o correto', () => {
    const rodada = embaralharRodada(perguntasDeTeste(), 9);
    const pergunta = rodada.perguntas[0]!;
    const errado = ((pergunta.indiceCorreto + 1) % 4) as IndiceAlternativa;
    expect(corrigirResposta(pergunta, errado)).toBe(false);
  });
});

describe('calcularPontuacao', () => {
  it('soma acertos e total por categoria, e o total geral', () => {
    const rodada = embaralharRodada(perguntasDeTeste(), 5);
    const respostas: Record<number, IndiceAlternativa> = {};
    for (const p of rodada.perguntas) respostas[p.id] = p.indiceCorreto; // acerta tudo
    const pontuacao = calcularPontuacao(rodada.perguntas, respostas);
    expect(pontuacao.acertos).toBe(3);
    expect(pontuacao.total).toBe(3);
    const porCategoria = Object.fromEntries(pontuacao.porCategoria.map((c) => [c.categoria, c]));
    expect(porCategoria.teoria).toEqual({ categoria: 'teoria', acertos: 1, total: 1 });
    expect(porCategoria.peticao).toEqual({ categoria: 'peticao', acertos: 1, total: 1 });
    expect(porCategoria.fundamentos).toEqual({ categoria: 'fundamentos', acertos: 1, total: 1 });
  });

  it('pergunta sem resposta conta no total mas não no acerto', () => {
    const rodada = embaralharRodada(perguntasDeTeste(), 5);
    const pontuacao = calcularPontuacao(rodada.perguntas, {});
    expect(pontuacao.acertos).toBe(0);
    expect(pontuacao.total).toBe(3);
  });
});

describe('perguntas com cinco alternativas (Sociologia Jurídica)', () => {
  function perguntasDeCinco(): readonly PerguntaMultiplaEscolha[] {
    return [
      {
        id: 101,
        categoria: 'conceitos',
        enunciadoHtml: 'P1',
        alternativasHtml: ['a', 'b', 'c', 'd', 'e'],
        correta: 4,
        fonteExtra: false,
        explicacaoHtml: 'porque e'
      },
      {
        id: 102,
        categoria: 'classicos',
        enunciadoHtml: 'P2',
        alternativasHtml: ['v', 'w', 'x', 'y', 'z'],
        correta: 1,
        fonteExtra: false,
        explicacaoHtml: 'porque w',
        gabaritoDoCaderno: true
      }
    ];
  }

  it('embaralha as cinco alternativas sem perder nenhuma e mantém a correta apontando o mesmo texto', () => {
    for (const semente of [1, 2, 3, 42, 999]) {
      const rodada = embaralharRodada(perguntasDeCinco(), semente);
      for (const original of perguntasDeCinco()) {
        const emb = rodada.perguntas.find((p) => p.id === original.id)!;
        expect(emb.alternativasHtml).toHaveLength(5);
        expect([...emb.alternativasHtml].sort()).toEqual([...original.alternativasHtml].sort());
        expect(emb.alternativasHtml[emb.indiceCorreto]).toBe(
          original.alternativasHtml[original.correta]
        );
      }
    }
  });

  it('a quinta posição chega a receber a correta em alguma semente (E é alcançável)', () => {
    const indices = new Set<number>();
    for (let semente = 1; semente <= 60; semente++) {
      const rodada = embaralharRodada(perguntasDeCinco(), semente);
      for (const p of rodada.perguntas) indices.add(p.indiceCorreto);
    }
    expect(indices).toEqual(new Set([0, 1, 2, 3, 4]));
  });

  it('repassa a marca gabaritoDoCaderno só para a pergunta que a tem', () => {
    const rodada = embaralharRodada(perguntasDeCinco(), 3);
    expect(rodada.perguntas.find((p) => p.id === 102)!.gabaritoDoCaderno).toBe(true);
    expect(rodada.perguntas.find((p) => p.id === 101)!.gabaritoDoCaderno).toBeUndefined();
  });

  it('corrige e pontua com índice 4', () => {
    const rodada = embaralharRodada(perguntasDeCinco(), 8);
    const respostas: Record<number, IndiceAlternativa> = {};
    for (const p of rodada.perguntas) respostas[p.id] = p.indiceCorreto;
    expect(calcularPontuacao(rodada.perguntas, respostas).acertos).toBe(2);
    const p0 = rodada.perguntas[0]!;
    const errado = ((p0.indiceCorreto + 1) % 5) as IndiceAlternativa;
    expect(corrigirResposta(p0, errado)).toBe(false);
  });

  it('as perguntas de quatro alternativas seguem com a mesma ordem de sempre para a mesma semente', () => {
    // Congela o comportamento antigo: rodadas já gravadas no navegador
    // de quem estudou as outras cadeiras têm de reconstituir igual.
    const rodada = embaralharRodada(perguntasDeTeste(), 42);
    expect(rodada.perguntas.map((p) => p.id)).toEqual(ORDEM_IDS_SEMENTE_42);
    expect(rodada.perguntas.map((p) => p.alternativasHtml.join(''))).toEqual(
      ORDEM_ALTERNATIVAS_SEMENTE_42
    );
  });
});

const ORDEM_IDS_SEMENTE_42: number[] = [3, 1, 2];
const ORDEM_ALTERNATIVAS_SEMENTE_42: string[] = ['2134', 'dbac', 'ywxz'];
