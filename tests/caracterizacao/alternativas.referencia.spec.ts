import { describe, expect, it } from 'vitest';
import { curriculo } from '@/conteudo/curriculo';
import { CARREGADORES } from '@/app/carregamento/carregadores';
import esperado from './alternativas.esperado.json';
import { chavesDasUnidadesPublicadas } from './projecoes';
import { projetarAlternativas, type AlternativasPorUnidade } from './alternativas';

/**
 * Caracterização das alternativas do quiz (AV3-K4): o conteúdo atual bate, pergunta por
 * pergunta, com a referência gravada. Depois de acrescentar alternativa no fim de propósito,
 * rode `npm run atualizar-referencias` e commite a referência junto. Reordenar ou remover
 * alternativa reprova no comando e aqui.
 */
const referencia = esperado as AlternativasPorUnidade;

describe('alternativas: referência cobre as unidades com quiz', () => {
  it('há unidades com quiz para conferir (piso contra varredura vazia)', () => {
    expect(Object.keys(referencia).length).toBeGreaterThan(0);
  });

  it('a referência cobre exatamente as unidades publicadas que têm quiz', async () => {
    const comQuiz: string[] = [];
    for (const chave of chavesDasUnidadesPublicadas(curriculo)) {
      const conteudo = await CARREGADORES[chave]!();
      if (conteudo.quiz !== undefined) comQuiz.push(chave);
    }
    expect([...comQuiz].sort()).toEqual(Object.keys(referencia).sort());
  });
});

describe('alternativas: conteúdo atual bate com a referência, pergunta por pergunta', () => {
  it.each(Object.keys(referencia))('%s', async (chave) => {
    const conteudo = await CARREGADORES[chave]!();
    expect(projetarAlternativas(conteudo.quiz ?? [])).toEqual(referencia[chave]);
  });
});
