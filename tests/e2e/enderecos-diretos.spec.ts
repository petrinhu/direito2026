import { test, expect } from '@playwright/test';
import { curriculo } from '../../src/conteudo/curriculo';
import { rotasDoCurriculo, rotasDeAbaAusente } from './apoio/rotasDoCurriculo';

/**
 * Prova, sem navegador com janela (headless, Playwright/Blink), que as
 * sete rotas da seção 5 da arquitetura abrem por acesso direto (deep
 * link), não só navegando a partir da home. Cada `page.goto` é uma nova
 * carga de página no servidor de preview, exercitando o fallback de
 * history mode servido pelo `vite preview`.
 */
/**
 * Além de "/" e "/busca", os endereços vêm do currículo (tests/e2e/apoio/
 * rotasDoCurriculo.ts): período, cadeira e cada aba de cada unidade
 * publicada. Uma unidade nova entra no currículo e é testada sem tocar
 * neste arquivo. Antes, cada rota era escrita à mão, e a terceira cadeira
 * teria ficado de fora.
 */
const ENDERECOS: ReadonlyArray<{ caminho: string; h1: string }> = [
  { caminho: '/', h1: 'Caderno de Direito' },
  { caminho: '/busca', h1: 'Busca' },
  ...rotasDoCurriculo(curriculo)
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

for (const caminho of rotasDeAbaAusente(curriculo)) {
  test(`aba que a unidade não tem, ${caminho}, abre "não encontrada"`, async ({ page }) => {
    await page.goto(caminho);
    await expect(page.locator('h1')).toContainText('Página não encontrada');
  });
}
