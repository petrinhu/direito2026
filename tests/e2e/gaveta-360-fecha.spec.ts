import {
  esperarLayoutAssentar,
  prepararEstadoInicial,
  type EstadoInicial
} from './apoio/estadoInicial';
import { expect, test, type Page } from './apoio/sessaoDoEstudo';

/**
 * Gaveta do menu em tela estreita (AV3-F0e). Defeito antigo, anterior à onda: a gaveta
 * continuava aberta depois de um link do menu levar a outra página e cobria o conteúdo novo.
 * O foco da troca de rota já vai para o conteúdo (router, afterEach); o que faltava era fechar.
 *
 * Aceite, nos três modos (claro, escuro, adaptado), em Chromium e Brave:
 * 1. link para outra página e link da página atual fecham a gaveta, e o foco vai ao conteúdo;
 * 2. Esc fecha a gaveta e devolve o foco ao botão que a abriu;
 * 3. o botão de abrir tem 44x44 e está alcançável com a gaveta fechada, depois de Esc e de link;
 * 4. (critério do CPO, opção B, decisão autônoma a ratificar pelo líder) ao abrir, o foco vai ao
 *    botão "Fechar menu", primeiro focável da gaveta; ele mede 44x44 e acerta o próprio centro;
 *    clicar ou tocar nele fecha a gaveta e devolve o foco ao botão de abrir;
 * 5. a 1280 px nada muda: a gaveta segue visível, o botão segue oculto e o link não a fecha.
 * Com a gaveta aberta, a medida do botão de abrir só é registrada (o véu ou o link cobre esse
 * botão; por isso o aceite passou ao botão "Fechar menu").
 */

const ROTA_UNIDADE = '/p/p1/intr-direito/u1';
const ROTA_CALENDARIO = '/calendario';
const GAVETA = '#gaveta-do-curriculo';
const GATILHO = '.barra-topo__botao-gaveta';
const VEU = '.layout-base__sobreposicao';
// O Calendário é link de topo do menu: fica visível sem expandir nenhum nível.
const LINK_CALENDARIO = '#gaveta-do-curriculo a.menu-curriculo__calendario';
// Botão "Fechar menu": primeiro item focável da gaveta, dentro dela (AV3-F0e, critério do CPO).
const BOTAO_FECHAR = '#gaveta-do-curriculo .layout-base__fechar-gaveta';
const NOME_BOTAO_FECHAR = 'Fechar menu';

const MODOS: ReadonlyArray<{ rotulo: string; estado: EstadoInicial }> = [
  { rotulo: 'claro', estado: { tema: 'claro', modoAdaptado: false } },
  { rotulo: 'escuro', estado: { tema: 'escuro', modoAdaptado: false } },
  { rotulo: 'adaptado', estado: { tema: 'claro', modoAdaptado: true } }
];

interface MedidaGatilho {
  largura: number;
  altura: number;
  pelaPropria: boolean;
  cobridoPor: string;
}

async function abrirPagina(
  page: Page,
  largura: number,
  estado: EstadoInicial,
  caminho: string
): Promise<void> {
  await page.setViewportSize({ width: largura, height: 740 });
  await prepararEstadoInicial(page, estado);
  await page.goto(caminho);
  await esperarLayoutAssentar(page);
}

async function abrirGaveta(page: Page): Promise<void> {
  const gatilho = page.locator(GATILHO);
  await gatilho.click();
  await expect(page.locator(GAVETA)).toHaveClass(/layout-base__gaveta--aberta/);
  await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
  // A gaveta desliza 150 ms (transform). Medir no meio do deslize acha o botão fora da tela; a
  // medida vale só com a gaveta em repouso, em x = 0.
  await expect
    .poll(async () => ((await page.locator(GAVETA).boundingBox())?.x ?? -1) >= -0.5)
    .toBe(true);
}

/** Com a gaveta fechada, a borda direita dela fica em x = 0 (translateX(-100%)). */
async function bordaDireitaDaGaveta(page: Page): Promise<number> {
  const caixa = await page.locator(GAVETA).boundingBox();
  return caixa === null ? 0 : caixa.x + caixa.width;
}

async function expectGavetaFechada(page: Page): Promise<void> {
  await expect(page.locator(GAVETA)).not.toHaveClass(/layout-base__gaveta--aberta/);
  await expect(page.locator(GATILHO)).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator(VEU)).toHaveCount(0);
  await expect.poll(() => bordaDireitaDaGaveta(page)).toBeLessThanOrEqual(0.5);
}

/** O foco está dentro do <main> (conteúdo ou título da página nova), nunca dentro da gaveta. */
async function focoNoConteudo(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const ativo = document.activeElement;
    const conteudo = document.getElementById('conteudo-principal');
    return conteudo !== null && ativo !== null && conteudo.contains(ativo);
  });
}

async function focoDentroDaGaveta(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const ativo = document.activeElement;
    const gaveta = document.getElementById('gaveta-do-curriculo');
    return gaveta !== null && ativo !== null && gaveta.contains(ativo);
  });
}

/** Mede um alvo pelo seletor: tamanho, e se o centro dele devolve ele mesmo (ou um filho). */
async function medirAlvo(page: Page, seletor: string): Promise<MedidaGatilho | null> {
  return page.evaluate((s: string) => {
    const alvo = document.querySelector<HTMLElement>(s);
    if (!alvo) return null;
    const r = alvo.getBoundingClientRect();
    const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const pelaPropria = topo !== null && (topo === alvo || alvo.contains(topo));
    const cobridoPor =
      topo === null ? 'nada' : `${topo.tagName.toLowerCase()}.${topo.getAttribute('class') ?? ''}`;
    return { largura: r.width, altura: r.height, pelaPropria, cobridoPor };
  }, seletor);
}

/** Mede o botão de abrir: tamanho, e se o centro dele devolve ele mesmo (ou um filho). */
async function medirGatilho(page: Page): Promise<MedidaGatilho | null> {
  return medirAlvo(page, GATILHO);
}

/** O primeiro elemento focável da gaveta, pelo texto: é a ordem de foco do teclado. */
async function primeiroFocavelDaGaveta(page: Page): Promise<string> {
  return page.evaluate(() => {
    const gaveta = document.getElementById('gaveta-do-curriculo');
    const primeiro = gaveta?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    return (primeiro?.textContent ?? '').replace(/\s+/g, ' ').trim();
  });
}

function expectAlvoAlcancavel(
  medida: MedidaGatilho | null,
  quando: string,
  nome = 'botão de abrir'
): void {
  if (medida === null) throw new Error(`${nome} não achado (${quando})`);
  expect(medida.largura, `largura do ${nome} (${quando}, px)`).toBeGreaterThanOrEqual(44);
  expect(medida.altura, `altura do ${nome} (${quando}, px)`).toBeGreaterThanOrEqual(44);
  expect(medida.pelaPropria, `${nome} coberto por ${medida.cobridoPor} (${quando})`).toBe(true);
}

for (const { rotulo, estado } of MODOS) {
  test(`gaveta 360 px, ${rotulo}: link para outra página fecha a gaveta e leva o foco ao conteúdo`, async ({
    page
  }) => {
    await abrirPagina(page, 360, estado, ROTA_UNIDADE);
    await abrirGaveta(page);

    await page.locator(LINK_CALENDARIO).click();

    await expect(page).toHaveURL(/\/calendario$/);
    await expectGavetaFechada(page);
    await expect.poll(() => focoNoConteudo(page)).toBe(true);
  });

  test(`gaveta 360 px, ${rotulo}: link da página atual fecha a gaveta e leva o foco ao conteúdo`, async ({
    page
  }) => {
    await abrirPagina(page, 360, estado, ROTA_CALENDARIO);
    await abrirGaveta(page);

    await page.locator(LINK_CALENDARIO).click();

    await expect(page).toHaveURL(/\/calendario$/);
    await expectGavetaFechada(page);
    await expect.poll(() => focoNoConteudo(page)).toBe(true);
  });

  test(`gaveta 360 px, ${rotulo}: Esc fecha a gaveta e devolve o foco ao botão que a abriu`, async ({
    page
  }) => {
    await abrirPagina(page, 360, estado, ROTA_UNIDADE);
    await abrirGaveta(page);
    await expect.poll(() => focoDentroDaGaveta(page)).toBe(true);

    await page.keyboard.press('Escape');

    await expectGavetaFechada(page);
    await expect(page.locator(GATILHO)).toBeFocused();
  });

  test(`gaveta 360 px, ${rotulo}: botão de abrir com 44x44 e alcançável com a gaveta fechada, depois de Esc e de link`, async ({
    page
  }) => {
    await abrirPagina(page, 360, estado, ROTA_UNIDADE);
    expectAlvoAlcancavel(await medirGatilho(page), 'página carregada, gaveta fechada');

    await abrirGaveta(page);
    await expect.poll(() => focoDentroDaGaveta(page)).toBe(true);
    await page.keyboard.press('Escape');
    await expectGavetaFechada(page);
    expectAlvoAlcancavel(await medirGatilho(page), 'depois de Esc');

    await abrirGaveta(page);
    await page.locator(LINK_CALENDARIO).click();
    await expect(page).toHaveURL(/\/calendario$/);
    await expectGavetaFechada(page);
    expectAlvoAlcancavel(await medirGatilho(page), 'depois de link');
  });

  // Registro, não aceite: mostra se a gaveta aberta cobre o botão de abrir neste modo.
  test(`gaveta 360 px, ${rotulo}: medida do botão de abrir com a gaveta aberta (registro)`, async ({
    page
  }) => {
    await abrirPagina(page, 360, estado, ROTA_UNIDADE);
    await abrirGaveta(page);

    const medida = await medirGatilho(page);
    console.log(
      `[AV3-F0e] botão de abrir com a gaveta aberta, ${rotulo}: ${JSON.stringify(medida)}`
    );
    expect(medida, 'o botão de abrir existe com a gaveta aberta').not.toBeNull();
  });

  test(`gaveta 360 px, ${rotulo}: ao abrir, o foco vai para "${NOME_BOTAO_FECHAR}", primeiro item focável da gaveta`, async ({
    page
  }) => {
    await abrirPagina(page, 360, estado, ROTA_UNIDADE);
    await abrirGaveta(page);

    await expect(page.getByRole('button', { name: NOME_BOTAO_FECHAR })).toBeFocused();
    await expect.poll(() => primeiroFocavelDaGaveta(page)).toBe(NOME_BOTAO_FECHAR);
  });

  test(`gaveta 360 px, ${rotulo}: botão "${NOME_BOTAO_FECHAR}" com 44x44 e acerta o próprio centro, com a gaveta aberta`, async ({
    page
  }) => {
    await abrirPagina(page, 360, estado, ROTA_UNIDADE);
    await abrirGaveta(page);

    expectAlvoAlcancavel(
      await medirAlvo(page, BOTAO_FECHAR),
      'gaveta aberta',
      `botão "${NOME_BOTAO_FECHAR}"`
    );
  });

  test(`gaveta 360 px, ${rotulo}: clicar em "${NOME_BOTAO_FECHAR}" fecha a gaveta e devolve o foco ao botão de abrir`, async ({
    page
  }) => {
    await abrirPagina(page, 360, estado, ROTA_UNIDADE);
    await abrirGaveta(page);

    await page.getByRole('button', { name: NOME_BOTAO_FECHAR }).click();

    await expectGavetaFechada(page);
    await expect(page.locator(GATILHO)).toBeFocused();
  });

  test.describe(`toque, ${rotulo}`, () => {
    test.use({ hasTouch: true });

    test(`gaveta 360 px, ${rotulo}: toque em "${NOME_BOTAO_FECHAR}" fecha a gaveta e devolve o foco ao botão de abrir`, async ({
      page
    }) => {
      await abrirPagina(page, 360, estado, ROTA_UNIDADE);
      await abrirGaveta(page);

      await page.getByRole('button', { name: NOME_BOTAO_FECHAR }).tap();

      await expectGavetaFechada(page);
      await expect(page.locator(GATILHO)).toBeFocused();
    });
  });

  test(`gaveta 1280 px, ${rotulo}: a gaveta segue visível, o botão segue oculto e o link não a fecha`, async ({
    page
  }) => {
    await abrirPagina(page, 1280, estado, ROTA_UNIDADE);
    await expect(page.locator(GATILHO)).toBeHidden();
    await expect.poll(() => bordaDireitaDaGaveta(page)).toBeGreaterThan(0);

    await page.locator(LINK_CALENDARIO).click();

    await expect(page).toHaveURL(/\/calendario$/);
    await expect(page.locator(GAVETA)).toBeVisible();
    await expect(page.locator(VEU)).toHaveCount(0);
    await expect.poll(() => bordaDireitaDaGaveta(page)).toBeGreaterThan(0);
  });
}
