import { expect, test, type Locator, type Page } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp, esperarEntrada, preencherEntrada } from './apoio/acoes';
import { CONTA_ADMIN, CONTA_COMUM } from './apoio/constantes';

/**
 * Leitura ampliada em telas estreitas, com o aviso de armazenamento na tela (QA F5.1, seções
 * 8.4 e 8.6). Preferência salva antes de qualquer página carregar, como o leitor a deixou no
 * navegador (chave do RepositorioLocalStorage). Sintético: login e conta vêm de constantes.ts.
 */
const CHAVE_MODO_ADAPTADO = 'caderno-direito:v1:modo-adaptado';

test.beforeEach(() => resetarPrivado());

async function ligarLeituraAmpliada(page: Page): Promise<void> {
  await page.addInitScript((chave) => localStorage.setItem(chave, 'true'), CHAVE_MODO_ADAPTADO);
}

/** O ponto central do alvo cai nele ou num descendente: é o que um clique real alcança. */
async function alcancavel(alvo: Locator): Promise<boolean> {
  return alvo.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return topo !== null && (topo === el || el.contains(topo));
  });
}

for (const largura of [360, 390]) {
  test.describe(`Leitura ampliada a ${largura} px, com o aviso de armazenamento aberto`, () => {
    test.use({ viewport: { width: largura, height: 640 } });

    test('o botão da gaveta é clicável, e o menu abre com Sair alcançável', async ({ page }) => {
      await ligarLeituraAmpliada(page);
      await entrarNoApp(page, CONTA_COMUM, '/');
      await expect(page.locator('html')).toHaveAttribute('data-modo-adaptado', 'on');
      await expect(page.locator('.aviso-armazenamento')).toBeVisible();

      const botaoGaveta = page.locator('.barra-topo__botao-gaveta');
      await expect
        .poll(() => alcancavel(botaoGaveta), { message: 'o aviso cobre o botão da gaveta' })
        .toBe(true);
      await botaoGaveta.click();

      const sair = page.locator('.menu-curriculo__sair');
      await expect
        .poll(() => alcancavel(sair), { message: 'o aviso cobre o botão Sair do menu' })
        .toBe(true);
    });

    test('o aviso ocupa no máximo 30% da altura da janela e o botão Entendi fica visível', async ({
      page
    }) => {
      await ligarLeituraAmpliada(page);
      await entrarNoApp(page, CONTA_COMUM, '/');
      const aviso = page.locator('.aviso-armazenamento');
      await expect(aviso).toBeVisible();

      const caixa = await aviso.boundingBox();
      expect(caixa, 'caixa do aviso').not.toBeNull();
      expect(caixa!.height, `altura do aviso com janela de 640 px`).toBeLessThanOrEqual(
        640 * 0.3 + 1
      );
      await expect(page.getByRole('button', { name: 'Entendi' })).toBeInViewport();
    });

    test('Gerenciar usuários cabe na largura: sem rolagem lateral e com o formulário dentro da janela', async ({
      page
    }) => {
      await ligarLeituraAmpliada(page);
      await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
      const formulario = page.locator('form.ar-admin__criar');
      await expect(formulario).toBeVisible();

      const medidas = await page.evaluate(() => ({
        larguraDocumento: document.documentElement.scrollWidth,
        larguraJanela: document.documentElement.clientWidth
      }));
      expect(medidas.larguraDocumento, 'rolagem lateral da página').toBeLessThanOrEqual(
        medidas.larguraJanela
      );

      const caixaForm = await formulario.boundingBox();
      expect(caixaForm!.x + caixaForm!.width, 'direita do formulário').toBeLessThanOrEqual(largura);

      const botaoCriar = formulario.getByRole('button', { name: 'Criar usuário' });
      const caixaBotao = await botaoCriar.boundingBox();
      expect(
        caixaBotao!.x + caixaBotao!.width,
        'direita do botão Criar usuário'
      ).toBeLessThanOrEqual(largura);
    });
  });
}

test.describe('aviso de armazenamento em tela larga', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('o aviso não passa de 30% da altura da janela', async ({ page }) => {
    await entrarNoApp(page, CONTA_COMUM, '/');
    const caixa = await page.locator('.aviso-armazenamento').boundingBox();
    expect(caixa, 'caixa do aviso').not.toBeNull();
    expect(caixa!.height).toBeLessThanOrEqual(800 * 0.3 + 1);
  });
});

test.describe('Trocar senha (/conta) em Leitura ampliada a 360 px', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('o formulário de troca cabe na largura, sem rolagem lateral', async ({ page }) => {
    await ligarLeituraAmpliada(page);
    await page.goto('/conta');
    await esperarEntrada(page);
    await preencherEntrada(page, CONTA_COMUM);
    const formulario = page.locator('form.ar-formulario');
    await expect(formulario).toBeVisible();
    const medidas = await page.evaluate(() => ({
      larguraDocumento: document.documentElement.scrollWidth,
      larguraJanela: document.documentElement.clientWidth
    }));
    expect(medidas.larguraDocumento, 'rolagem lateral da página de troca').toBeLessThanOrEqual(
      medidas.larguraJanela
    );
  });
});
