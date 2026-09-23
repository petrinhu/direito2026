import { test, expect } from '@playwright/test';

/**
 * Prova, sem navegador com janela (headless, Playwright/Blink), que as
 * sete rotas da seção 5 da arquitetura abrem por acesso direto (deep
 * link), não só navegando a partir da home. Cada `page.goto` é uma nova
 * carga de página no servidor de preview, exercitando o fallback de
 * history mode servido pelo `vite preview`.
 */
const ENDERECOS: ReadonlyArray<{ caminho: string; h1: RegExp }> = [
  { caminho: '/', h1: /Caderno de Direito/ },
  { caminho: '/busca', h1: /Busca/ },
  { caminho: '/p/p1', h1: /1º período/ },
  { caminho: '/p/p1/intr-direito', h1: /Introdução ao Direito/ },
  { caminho: '/p/p1/intr-direito/u1', h1: /Resumo de estudo, petição comentada e quiz/ },
  { caminho: '/p/p1/intr-direito/u1/peticao', h1: /Resumo de estudo, petição comentada e quiz/ },
  { caminho: '/p/p1/intr-direito/u1/quiz', h1: /Resumo de estudo, petição comentada e quiz/ },
  { caminho: '/p/p1/redacao-juridica-1', h1: /Português e Redação Jurídica 1/ },
  { caminho: '/p/p1/redacao-juridica-1/u1', h1: /Resumo de estudo, petição comentada e quiz/ },
  {
    caminho: '/p/p1/redacao-juridica-1/u1/peticao',
    h1: /Resumo de estudo, petição comentada e quiz/
  },
  { caminho: '/p/p1/redacao-juridica-1/u1/quiz', h1: /Resumo de estudo, petição comentada e quiz/ }
];

for (const { caminho, h1 } of ENDERECOS) {
  test(`acesso direto a ${caminho} abre a página certa`, async ({ page }) => {
    const respostas: number[] = [];
    page.on('response', (resposta) => {
      if (resposta.url().endsWith(caminho) || caminho === '/') respostas.push(resposta.status());
    });
    await page.goto(caminho);
    await expect(page.locator('h1')).toContainText(h1);
  });
}
