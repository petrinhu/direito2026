import { describe, expect, it } from 'vitest';
import { agruparPorUnidade } from '@/core/curriculo/agruparPorUnidade';
import { ErroDeConteudo } from '@/core/curriculo/erroDeConteudo';

/**
 * Descoberta de unidades a partir dos caminhos dos arquivos de conteúdo.
 * Listas sintéticas: este teste não lê disco nem o glob do Vite. A
 * paridade com o disco real fica em conteudo.paridadeGlobDisco.spec.ts.
 */
const UNIDADE = 'p1/intr-direito/u1';

describe('agruparPorUnidade: abas na ordem fixa', () => {
  it('lista as abas presentes na ordem resumo, mapa, fichamento, mnemônicos, petição, quiz', () => {
    const [unidade] = agruparPorUnidade([
      `${UNIDADE}/quiz.ts`,
      `${UNIDADE}/peticao.ts`,
      `${UNIDADE}/mnemonicos.ts`,
      `${UNIDADE}/mapaFichamento.ts`,
      `${UNIDADE}/resumo.ts`,
      `${UNIDADE}/meta.ts`
    ]);
    expect(unidade?.abas).toEqual([
      'resumo',
      'mapa',
      'fichamento',
      'mnemonicos',
      'peticao',
      'quiz'
    ]);
  });

  it('mapaFichamento.ts entrega mapa e fichamento juntos', () => {
    const [unidade] = agruparPorUnidade([`${UNIDADE}/meta.ts`, `${UNIDADE}/mapaFichamento.ts`]);
    expect(unidade?.abas).toEqual(['mapa', 'fichamento']);
  });

  it('uma unidade com resumo, petição e quiz tem só essas abas', () => {
    const [unidade] = agruparPorUnidade([
      `${UNIDADE}/meta.ts`,
      `${UNIDADE}/resumo.ts`,
      `${UNIDADE}/peticao.ts`,
      `${UNIDADE}/quiz.ts`
    ]);
    expect(unidade?.abas).toEqual(['resumo', 'peticao', 'quiz']);
  });

  it('só meta, sem aba nenhuma, devolve lista vazia (quem reprova é a montagem)', () => {
    const [unidade] = agruparPorUnidade([`${UNIDADE}/meta.ts`]);
    expect(unidade?.abas).toEqual([]);
  });
});

describe('agruparPorUnidade: arquivos e quiz em pasta', () => {
  it('quiz/index.ts vira o arquivo de quiz e os sub-arquivos de quiz/ não viram aba', () => {
    const [unidade] = agruparPorUnidade([
      `${UNIDADE}/meta.ts`,
      `${UNIDADE}/quiz/index.ts`,
      `${UNIDADE}/quiz/revisao.ts`,
      `${UNIDADE}/quiz/antiga.ts`
    ]);
    expect(unidade?.abas).toEqual(['quiz']);
    expect(unidade?.arquivos.quiz).toBe(`${UNIDADE}/quiz/index.ts`);
  });

  it('dispositivos.ts é reconhecido como arquivo gerado e não vira aba', () => {
    const [unidade] = agruparPorUnidade([
      `${UNIDADE}/meta.ts`,
      `${UNIDADE}/resumo.ts`,
      `${UNIDADE}/dispositivos.ts`
    ]);
    expect(unidade?.abas).toEqual(['resumo']);
    expect(unidade?.arquivos.dispositivos).toBe(`${UNIDADE}/dispositivos.ts`);
  });

  it('devolve a chave, o período, a cadeira e a unidade separados', () => {
    const [unidade] = agruparPorUnidade([`${UNIDADE}/meta.ts`]);
    expect(unidade).toMatchObject({
      chave: UNIDADE,
      periodo: 'p1',
      cadeira: 'intr-direito',
      unidade: 'u1'
    });
  });
});

describe('agruparPorUnidade: prefixo do caminho não importa', () => {
  it('aceita caminho com prefixo de alias do Vite e caminho absoluto de disco', () => {
    const chaves = agruparPorUnidade([
      `../../conteudo/${UNIDADE}/meta.ts`,
      `/home/alguem/projeto/src/conteudo/p1/sociologia-juridica/u1/meta.ts`
    ]).map((u) => u.chave);
    expect(chaves).toEqual(['p1/intr-direito/u1', 'p1/sociologia-juridica/u1']);
  });

  it('ignora caminhos que não são de unidade (cadeira, calendário, tipos)', () => {
    const unidades = agruparPorUnidade([
      'p1/intr-direito/cadeira.ts',
      'calendario/provas.ts',
      'curriculo.ts',
      `${UNIDADE}/meta.ts`
    ]);
    expect(unidades.map((u) => u.chave)).toEqual([UNIDADE]);
  });

  it('ordena as unidades pela chave, para a saída não depender da ordem da entrada', () => {
    const chaves = agruparPorUnidade([
      'p1/sociologia-juridica/u1/meta.ts',
      'p1/intr-direito/u1/meta.ts'
    ]).map((u) => u.chave);
    expect(chaves).toEqual(['p1/intr-direito/u1', 'p1/sociologia-juridica/u1']);
  });
});

describe('agruparPorUnidade: erros explícitos de pasta inconsistente', () => {
  it('reprova quiz.ts e pasta quiz/ ao mesmo tempo, nomeando a unidade', () => {
    expect(() =>
      agruparPorUnidade([`${UNIDADE}/meta.ts`, `${UNIDADE}/quiz.ts`, `${UNIDADE}/quiz/index.ts`])
    ).toThrowError(ErroDeConteudo);
    expect(() =>
      agruparPorUnidade([
        `${UNIDADE}/meta.ts`,
        `${UNIDADE}/quiz.ts`,
        `${UNIDADE}/quiz/atividade.ts`
      ])
    ).toThrow(/quiz\.ts.*quiz\/.*p1\/intr-direito\/u1/);
  });

  it('reprova pasta de unidade sem meta.ts', () => {
    expect(() => agruparPorUnidade([`${UNIDADE}/resumo.ts`])).toThrow(/sem meta\.ts.*u1/);
  });

  it('reprova pasta quiz/ sem quiz/index.ts', () => {
    expect(() => agruparPorUnidade([`${UNIDADE}/meta.ts`, `${UNIDADE}/quiz/atividade.ts`])).toThrow(
      /quiz\/ sem quiz\/index\.ts/
    );
  });

  it('reprova arquivo que a unidade não reconhece (não some em silêncio)', () => {
    expect(() => agruparPorUnidade([`${UNIDADE}/meta.ts`, `${UNIDADE}/anotacoes.ts`])).toThrow(
      /arquivo não reconhecido.*anotacoes\.ts/
    );
  });

  it('reprova nome de unidade fora do padrão uN', () => {
    expect(() => agruparPorUnidade(['p1/intr-direito/capitulo1/meta.ts'])).toThrow(
      /unidade fora do padrão uN/
    );
  });
});
