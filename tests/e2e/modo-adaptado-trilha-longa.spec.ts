import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * E2E-A2-SERRA (fatia B da onda 1164): no modo adaptado, de 641 a 1023 px, só a trilha de mais de dois
 * níveis (data-trilha-longa) ganha linha própria. Na trilha curta a linha não muda. A 810 px, o iPad em
 * pé, o cabeçalho e a primeira linha do título cabem em 640 px numa trilha longa. Fora dessa faixa,
 * de 360 e 1280 px, nada muda: a 360 px a trilha já tem linha própria (bloco de 341 a 640 px).
 */
const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const ALTURA_DA_JANELA = 640;
const LARGURAS = [360, 768, 810, 1280] as const;
const LONGAS = [
  '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial/mapa',
  '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/mapa',
  '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/mapa',
  '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/quiz',
  '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/peticao'
] as const;
const CURTAS = ['/', '/novidades', '/p/p1', '/p/p1/intr-direito', '/p/p1/juri-simulado'] as const;
// E2E-ADAPTADO-TRILHA-LINHAS (decisão do CPO de 22/11/2026, TRILHA-ADAPTADO-LINHAS): até 640 px
// a trilha mostra só os dois últimos níveis; de 641 px para cima, todos.
const LARGURAS_DA_CONTAGEM = [360, 640, 641, 768, 810, 1280] as const;
const NIVEIS_ATE_640 = 2;

async function medirTrilha(page: Page) {
  return page.evaluate(() => {
    const trilha = document.querySelector<HTMLElement>('.barra-topo__trilha');
    const cabecalho = document.querySelector<HTMLElement>('.barra-topo')!;
    const titulo = Array.from(document.querySelectorAll<HTMLElement>('main h1')).find(
      (el) => el.getClientRects().length > 0
    );
    const caixa = titulo?.getBoundingClientRect();
    const linha = titulo ? parseFloat(getComputedStyle(titulo).lineHeight) : NaN;
    return {
      flexBasis: trilha ? getComputedStyle(trilha).flexBasis : 'ausente',
      fundoCabecalho: cabecalho.getBoundingClientRect().bottom,
      topo: caixa?.top ?? NaN,
      linha: Number.isFinite(linha) ? linha : (caixa?.height ?? NaN)
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(DATA_FIXA));
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
});

const ROTAS = [
  ...LONGAS.map((caminho) => ({ caminho, longa: true })),
  ...CURTAS.map((caminho) => ({ caminho, longa: false }))
];

for (const { caminho, longa } of ROTAS) {
  for (const largura of LARGURAS) {
    test(`trilha ${longa ? 'longa' : 'curta'}, ${caminho}, ${largura}px, modo adaptado`, async ({
      page
    }) => {
      await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
      await page.goto(caminho);
      await page.locator('main').first().waitFor({ state: 'visible' });
      await esperarLayoutAssentar(page);
      const medida = await medirTrilha(page);
      // EP-F11.7-TRILHA (decisão do líder): acima de 880 px, no modo adaptado, a trilha tem
      // linha própria, de qualquer tamanho. Entre 641 e 1023 px só a trilha longa ganha linha.
      const esperaFlex100 =
        largura === 360 || largura === 1280 || (longa && (largura === 768 || largura === 810));
      expect(
        medida.flexBasis === '100%',
        `${caminho} a ${largura}px: flex-basis ${medida.flexBasis}`
      ).toBe(esperaFlex100);
      if (longa && largura === 810) {
        expect(medida.fundoCabecalho, `${caminho} a 810px: fundo do cabeçalho`).toBeLessThanOrEqual(
          ALTURA_DA_JANELA
        );
        expect(
          medida.topo + medida.linha,
          `${caminho} a 810px: primeira linha do título`
        ).toBeLessThanOrEqual(ALTURA_DA_JANELA);
      }
    });
  }
}

for (const caminho of LONGAS) {
  for (const largura of LARGURAS_DA_CONTAGEM) {
    test(`níveis visíveis, trilha longa, ${caminho}, ${largura}px, modo adaptado`, async ({
      page
    }) => {
      await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
      await page.goto(caminho);
      await page.locator('main').first().waitFor({ state: 'visible' });
      await esperarLayoutAssentar(page);
      const contagem = await page.evaluate(() => {
        const itens = Array.from(document.querySelectorAll<HTMLElement>('.trilha-navegacao li'));
        return {
          total: itens.length,
          visiveis: itens.filter((li) => li.getClientRects().length > 0).length
        };
      });
      expect(contagem.total, `${caminho}: trilha com mais de dois níveis`).toBeGreaterThan(
        NIVEIS_ATE_640
      );
      const esperado = largura <= 640 ? NIVEIS_ATE_640 : contagem.total;
      expect(contagem.visiveis, `${caminho} a ${largura}px: níveis visíveis`).toBe(esperado);
    });
  }
}
