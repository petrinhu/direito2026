import { describe, expect, it } from 'vitest';
import { conferirFormasCongeladas } from '@/app/quiz/conferirFormasCongeladas';
import type { FormaPergunta } from '@/core/quiz/tipos';

/**
 * AV3-K4b: a forma congelada é a forma LEGADA (v1.9.0.0) e não acompanha o conteúdo. O que
 * cresce é o conteúdo, por acréscimo. A conferência aceita acréscimo e reprova o que muda o
 * sentido de uma resposta salva por id.
 */
const MC4: FormaPergunta = { id: 1, tipo: 'mc', alternativas: 4 };
const MC4_B: FormaPergunta = { id: 2, tipo: 'mc', alternativas: 4 };
const VF: FormaPergunta = { id: 3, tipo: 'vf', alternativas: 2 };

const FORMAS = { 'p1/a/u1': [MC4, MC4_B, VF] };

function quarenta(): FormaPergunta[] {
  return Array.from(
    { length: 40 },
    (_, i) => ({ id: i + 1, tipo: 'mc', alternativas: 4 }) as FormaPergunta
  );
}

describe('conferirFormasCongeladas: deve passar (crescimento por acréscimo)', () => {
  it('unidade nova com quiz vazio é só informação', () => {
    const r = conferirFormasCongeladas(FORMAS, { ...FORMAS, 'p1/nova/u1': [] });
    expect(r.violacoes).toEqual([]);
  });

  it('unidade nova com 40 perguntas é aceita', () => {
    const r = conferirFormasCongeladas(FORMAS, { ...FORMAS, 'p1/nova/u1': quarenta() });
    expect(r.violacoes).toEqual([]);
  });

  it('pergunta nova no fim do quiz é aceita', () => {
    const atuais = {
      'p1/a/u1': [MC4, MC4_B, VF, { id: 99, tipo: 'mc', alternativas: 4 } as FormaPergunta]
    };
    expect(conferirFormasCongeladas(FORMAS, atuais).violacoes).toEqual([]);
  });

  it('pergunta antiga de 4 alternativas que passa a 5 é aceita', () => {
    const atuais = { 'p1/a/u1': [{ ...MC4, alternativas: 5 } as FormaPergunta, MC4_B, VF] };
    expect(conferirFormasCongeladas(FORMAS, atuais).violacoes).toEqual([]);
  });
});

describe('conferirFormasCongeladas: deve reprovar (o que muda o sentido de uma resposta salva)', () => {
  it('chave congelada sem unidade atual reprova', () => {
    expect(conferirFormasCongeladas(FORMAS, {}).violacoes.length).toBeGreaterThan(0);
  });

  it('id congelado que sumiu reprova', () => {
    expect(
      conferirFormasCongeladas(FORMAS, { 'p1/a/u1': [MC4, VF] }).violacoes.length
    ).toBeGreaterThan(0);
  });

  it('tipo que mudou reprova, nos dois sentidos', () => {
    const vfParaMc = {
      'p1/a/u1': [MC4, MC4_B, { id: 3, tipo: 'mc', alternativas: 2 } as FormaPergunta]
    };
    const mcParaVf = {
      'p1/a/u1': [MC4, { id: 2, tipo: 'vf', alternativas: 2 } as FormaPergunta, VF]
    };
    expect(conferirFormasCongeladas(FORMAS, vfParaMc).violacoes.length).toBeGreaterThan(0);
    expect(conferirFormasCongeladas(FORMAS, mcParaVf).violacoes.length).toBeGreaterThan(0);
  });

  it('menos alternativas que a forma reprova', () => {
    const atuais = {
      'p1/a/u1': [{ ...MC4, alternativas: 3 } as unknown as FormaPergunta, MC4_B, VF]
    };
    expect(conferirFormasCongeladas(FORMAS, atuais).violacoes.length).toBeGreaterThan(0);
  });

  it('ids congelados fora da ordem relativa reprovam', () => {
    const atuais = { 'p1/a/u1': [MC4_B, MC4, VF] };
    expect(conferirFormasCongeladas(FORMAS, atuais).violacoes.length).toBeGreaterThan(0);
  });
});
