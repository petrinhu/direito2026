import type { Locator } from '@playwright/test';
import { test, expect, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * SB-F13d (M18, M19 e M20): a tabela da seção Para nerds da página Sobre vira lista abaixo de 641 px
 * e volta a ser tabela a partir de 641 px (src/ui/paginas/Sobre.vue:164-226).
 *
 * Roda no `vite preview` (tests/e2e), com a sessão sintética de apoio/sessaoDoEstudo.ts. O /sobre não
 * tem guarda de sessão no roteador: src/app/router/index.ts:4-27 e src/app/router/rotas.ts:111-116. O
 * bloco da conta só some sem sessão (src/App.vue:23-27), e o layout não condiciona por sessão
 * (src/ui/layout/LayoutBase.vue:209, :248, :258-260). Por isso o portão de sessão real fica em
 * tests/e2e-portao/sobre-portao.spec.ts, e este arquivo não o repete.
 *
 * Tema claro, sem modo adaptado, movimento reduzido. Cada caso declara o que o mutante quebra.
 */

const CONTEINERES = '.pagina-sobre__tabela';
const QUANTIDADE_ESPERADA = 2;

async function abrirSobre(page: Page): Promise<void> {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/sobre');
  await expect(page.locator('h1'), 'título da página Sobre').toContainText('Sobre');
  await esperarLayoutAssentar(page);
}

/** Piso não vazio: sem os dois contêineres e uma linha em cada, os laços abaixo não conferem nada. */
async function pisoDasTabelas(page: Page): Promise<void> {
  const contineres = page.locator(CONTEINERES);
  await expect(contineres, 'contêineres de tabela da seção Para nerds').toHaveCount(
    QUANTIDADE_ESPERADA
  );
  for (let i = 0; i < QUANTIDADE_ESPERADA; i++) {
    const linhas = await contineres.nth(i).locator('tbody tr').count();
    expect(linhas, `linhas de corpo no contêiner ${i}`).toBeGreaterThan(0);
  }
}

function estiloDe(elemento: Locator, propriedade: 'display' | 'overflowWrap'): Promise<string> {
  return elemento.evaluate(
    (el, prop) =>
      getComputedStyle(el).getPropertyValue(prop === 'display' ? 'display' : 'overflow-wrap'),
    propriedade
  );
}

function conteudoDoRotulo(elemento: Locator): Promise<string> {
  return elemento.evaluate((el) => getComputedStyle(el, '::before').content);
}

test.describe('Sobre, tabela em 360 px (abaixo de 641 px, vira lista)', () => {
  test.use({ viewport: { width: 360, height: 800 } });

  // M19: tirar `display: none` do thead deixa o cabeçalho visível na lista.
  test('o cabeçalho de cada tabela fica oculto abaixo de 641 px (thead com display none)', async ({
    page
  }) => {
    await abrirSobre(page);
    await pisoDasTabelas(page);
    for (let i = 0; i < QUANTIDADE_ESPERADA; i++) {
      const thead = page.locator(CONTEINERES).nth(i).locator('thead');
      expect(await estiloDe(thead, 'display'), `display do thead no contêiner ${i} em 360 px`).toBe(
        'none'
      );
    }
  });

  // Tabela e linha viram bloco na tela estreita: sem isso, a linha não empilha os pares.
  test('a tabela e a primeira linha viram bloco abaixo de 641 px (display block)', async ({
    page
  }) => {
    await abrirSobre(page);
    await pisoDasTabelas(page);
    for (let i = 0; i < QUANTIDADE_ESPERADA; i++) {
      const contorno = page.locator(CONTEINERES).nth(i);
      const tabela = contorno.locator('table');
      const linha = contorno.locator('tbody tr').first();
      expect(await estiloDe(tabela, 'display'), `display da table no contêiner ${i}`).toBe('block');
      expect(
        await linha.evaluate((el) => getComputedStyle(el).display),
        `display da primeira tr no contêiner ${i}`
      ).toBe('block');
    }
  });

  // M20: `content: none` no ::before tira o rótulo que vem de data-label. O valor obtido aparece na mensagem.
  test('o rótulo de cada célula vem de data-label, entre aspas (content do ::before)', async ({
    page
  }) => {
    await abrirSobre(page);
    await pisoDasTabelas(page);
    for (let i = 0; i < QUANTIDADE_ESPERADA; i++) {
      const celulas = page.locator(CONTEINERES).nth(i).locator('tbody tr').first().locator('td');
      const quantidade = await celulas.count();
      expect(quantidade, `células da primeira linha no contêiner ${i}`).toBeGreaterThan(0);
      for (let j = 0; j < quantidade; j++) {
        const celula = celulas.nth(j);
        const rotulo = await celula.getAttribute('data-label');
        const obtido = await conteudoDoRotulo(celula);
        expect(
          obtido,
          `content do ::before da célula ${j} no contêiner ${i} (data-label "${rotulo}")`
        ).toBe(`"${rotulo}"`);
      }
    }
  });

  // Regra real de quebra de palavra (a que M09 fingia). Nome longo de pacote precisa quebrar a 360 px.
  test('a célula quebra palavra longa (overflow-wrap anywhere) na tela estreita', async ({
    page
  }) => {
    await abrirSobre(page);
    await pisoDasTabelas(page);
    for (let i = 0; i < QUANTIDADE_ESPERADA; i++) {
      const celula = page
        .locator(CONTEINERES)
        .nth(i)
        .locator('tbody tr')
        .first()
        .locator('td')
        .first();
      expect(
        await estiloDe(celula, 'overflowWrap'),
        `overflow-wrap da primeira célula no contêiner ${i}`
      ).toBe('anywhere');
    }
  });

  // Sem rolagem horizontal da página: a tabela empilhada cabe na largura de 360 px.
  test('a página não rola na horizontal em 360 px com as duas tabelas', async ({ page }) => {
    await abrirSobre(page);
    await pisoDasTabelas(page);
    const medidas = await page.evaluate(() => ({
      larguraRolavel: document.documentElement.scrollWidth,
      larguraVisivel: document.documentElement.clientWidth
    }));
    expect(
      medidas.larguraRolavel,
      `scrollWidth ${medidas.larguraRolavel} contra clientWidth ${medidas.larguraVisivel} em 360 px`
    ).toBeLessThanOrEqual(medidas.larguraVisivel);
  });
});

test.describe('Sobre, tabela em 1280 px (a partir de 641 px, volta a ser tabela)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  // M18: se o media query deixa de valer a partir de 641 px, a tabela continua lista. Este caso é o que a pega.
  test('a tabela volta a ser tabela, com cabeçalho e sem rótulo ::before (M18)', async ({
    page
  }) => {
    await abrirSobre(page);
    await pisoDasTabelas(page);
    for (let i = 0; i < QUANTIDADE_ESPERADA; i++) {
      const contorno = page.locator(CONTEINERES).nth(i);
      expect(
        await estiloDe(contorno.locator('table'), 'display'),
        `display da table no contêiner ${i} em 1280 px`
      ).toBe('table');
      expect(
        await contorno.locator('thead').evaluate((el) => getComputedStyle(el).display),
        `display do thead no contêiner ${i} em 1280 px`
      ).toBe('table-header-group');
      const primeiraCelula = contorno.locator('tbody tr').first().locator('td').first();
      expect(
        await conteudoDoRotulo(primeiraCelula),
        `content do ::before da primeira célula no contêiner ${i} em 1280 px`
      ).toBe('none');
    }
  });
});
