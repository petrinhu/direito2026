// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { rotas } from '@/app/router/rotas';

/**
 * Endereço movido (ordem do líder, 25/10/2026: a AV3 de Sociologia deixa de ser
 * a unidade `u3` e vira o tópico `u3-artigos-infancia-digital`). O endereço antigo
 * leva ao novo, mantendo a aba e a âncora. Rotas reais, navegação por `push`.
 */
async function irPara(url: string) {
  const router = createRouter({ history: createMemoryHistory(), routes: rotas });
  await router.push(url);
  return router.currentRoute.value;
}

const NOVO = '/p/p1/sociologia-juridica/u3-artigos-infancia-digital';

describe('endereço movido: Sociologia AV3 vai para o tópico Artigos', () => {
  it('o endereço da unidade antiga chega ao novo', async () => {
    const rota = await irPara('/p/p1/sociologia-juridica/u3');
    expect(rota.path).toBe(NOVO);
  });

  it('a aba do endereço antigo (/quiz) chega à mesma aba no endereço novo', async () => {
    const rota = await irPara('/p/p1/sociologia-juridica/u3/quiz');
    expect(rota.path).toBe(`${NOVO}/quiz`);
    expect(rota.name).toBe('unidade-quiz');
  });

  it('a âncora do endereço antigo (#bloco-2) é mantida no endereço novo', async () => {
    const rota = await irPara('/p/p1/sociologia-juridica/u3#bloco-2');
    expect(rota.path).toBe(NOVO);
    expect(rota.hash).toBe('#bloco-2');
  });
});
