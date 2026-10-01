import { expect, test } from '@playwright/test';
import { calcularContraste } from '../../src/core/design/contraste';
import { prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * Contraste MEDIDO NA PÁGINA RENDERIZADA (cor computada do texto contra o
 * fundo real do bloco, subindo pelos ancestrais até achar um fundo opaco),
 * nos temas claro e escuro e no modo adaptado. Texto mínimo 4,5:1; no modo
 * adaptado, preto sobre branco. Linhas de ligação do mapa: mínimo 3:1.
 */
const BASE = '/p/p1/filosofia-juridica/u1';

interface Par {
  texto: string;
  fundo: string;
}

function rgb(valor: string): [number, number, number] {
  const m = valor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) throw new Error(`cor ilegível: ${valor}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function hex(valor: string): string {
  return `#${rgb(valor)
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`;
}

async function medir(page: import('@playwright/test').Page, seletor: string): Promise<Par> {
  return page
    .locator(seletor)
    .first()
    .evaluate((el) => {
      const texto = getComputedStyle(el).color;
      let atual: typeof el | null = el;
      let fundo = 'rgba(0, 0, 0, 0)';
      while (atual) {
        const cor = getComputedStyle(atual).backgroundColor;
        if (!/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(cor)) {
          fundo = cor;
          break;
        }
        atual = atual.parentElement;
      }
      return { texto, fundo };
    });
}

const ELEMENTOS_DO_MAPA = [
  '#mapa-raiz > .no-mapa__corpo .no-mapa__rotulo',
  '#mapa-era-antiga > .no-mapa__corpo .no-mapa__rotulo',
  '#mapa-era-antiga > .no-mapa__corpo .no-mapa__nivel',
  '#mapa-fase-grecia-classica > .no-mapa__corpo .no-mapa__rotulo',
  '#mapa-pensador-platao > .no-mapa__corpo .no-mapa__rotulo',
  '#mapa-platao-modo > .no-mapa__corpo .no-mapa__rotulo',
  '#mapa-platao-modo > .no-mapa__corpo .no-mapa__detalhe',
  '#mapa-platao-direito > .no-mapa__corpo .no-mapa__detalhe',
  '#mapa-platao-conceito-0 > .no-mapa__corpo .no-mapa__rotulo'
];

const ELEMENTOS_DO_FICHAMENTO = [
  '#ficha-platao .ficha__nome',
  '#ficha-platao .ficha__campo dt',
  '#ficha-platao .ficha__campo dd',
  '#ficha-platao .ficha__fonte',
  '.fichamento__grupo-titulo'
];

const ELEMENTOS_DOS_MNEMONICOS = [
  '#mnemonico-leis-de-tomas .mnemonico__titulo',
  '#mnemonico-leis-de-tomas .mnemonico__tecnica',
  '#mnemonico-leis-de-tomas .mnemonico__dica',
  '#mnemonico-leis-de-tomas .mnemonico__botao'
];

for (const [nome, tema, adaptado] of [
  ['tema claro', 'claro', false],
  ['tema escuro', 'escuro', false],
  ['modo adaptado', 'claro', true]
] as const) {
  test(`mapa mental, ${nome}: texto contra o fundo real`, async ({ page }) => {
    await prepararEstadoInicial(page, { tema, modoAdaptado: adaptado });
    await page.goto(`${BASE}/mapa`);
    await page.getByRole('button', { name: 'Abrir todos os ramos' }).click();
    for (const seletor of ELEMENTOS_DO_MAPA) {
      const { texto, fundo } = await medir(page, seletor);
      const razao = calcularContraste(hex(texto), hex(fundo));
      expect(razao, `${seletor}: ${texto} sobre ${fundo}`).toBeGreaterThanOrEqual(
        adaptado ? 7 : 4.5
      );
      if (adaptado) {
        expect(rgb(texto), seletor).toEqual([0, 0, 0]);
        expect(rgb(fundo), seletor).toEqual([255, 255, 255]);
      }
    }
  });

  test(`mapa mental, ${nome}: a linha de ligação contra a página, no mínimo 3:1`, async ({
    page
  }) => {
    await prepararEstadoInicial(page, { tema, modoAdaptado: adaptado });
    await page.goto(`${BASE}/mapa`);
    const linha = await page
      .locator('#mapa-era-antiga > .no-mapa__grupo')
      .evaluate((el) => getComputedStyle(el).borderInlineStartColor);
    const pagina = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(
      calcularContraste(hex(linha), hex(pagina)),
      `${linha} sobre ${pagina}`
    ).toBeGreaterThanOrEqual(3);
  });

  test(`fichamento, ${nome}: texto contra o fundo real`, async ({ page }) => {
    await prepararEstadoInicial(page, { tema, modoAdaptado: adaptado });
    await page.goto(`${BASE}/fichamento`);
    await page.getByRole('button', { name: 'Abrir todas as fichas' }).click();
    for (const seletor of ELEMENTOS_DO_FICHAMENTO) {
      const { texto, fundo } = await medir(page, seletor);
      expect(
        calcularContraste(hex(texto), hex(fundo)),
        `${seletor}: ${texto} sobre ${fundo}`
      ).toBeGreaterThanOrEqual(adaptado ? 7 : 4.5);
    }
  });

  test(`mnemônicos, ${nome}: texto contra o fundo real`, async ({ page }) => {
    await prepararEstadoInicial(page, { tema, modoAdaptado: adaptado });
    await page.goto(`${BASE}/mnemonicos`);
    for (const seletor of ELEMENTOS_DOS_MNEMONICOS) {
      const { texto, fundo } = await medir(page, seletor);
      expect(
        calcularContraste(hex(texto), hex(fundo)),
        `${seletor}: ${texto} sobre ${fundo}`
      ).toBeGreaterThanOrEqual(adaptado ? 7 : 4.5);
    }
  });
}
