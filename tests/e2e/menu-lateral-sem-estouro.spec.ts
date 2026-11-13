import type { Locator } from '@playwright/test';
import { test, expect, type Page } from './apoio/sessaoDoEstudo';
import {
  prepararEstadoInicial,
  esperarLayoutAssentar,
  type EstadoInicial
} from './apoio/estadoInicial';

/**
 * Estouro do item "Perspectiva racial e o não-dito" no menu lateral (QA
 * b69c4298, AV3-F0c). Estado do QA: 1º período > Filosofia Jurídica > AV3
 * abertos. O item é um "em breve" dentro de uma linha flex: sem min-width:0,
 * o item não encolhe abaixo do próprio conteúdo e passa da borda da gaveta em
 * 60 px no modo adaptado. A gaveta tem overflow-y: auto, o que torna o
 * overflow-x auto: o documento mede 0 px e o estouro fica dentro da gaveta.
 *
 * Mede o retângulo de cada texto do item contra a borda direita da gaveta.
 * Não cobre outros itens do menu (ver a INBOX do TODO.md).
 */
// Home: a rota de uma unidade abre também os tópicos dela, e o QA mediu só com
// período, Filosofia e AV3 abertos.
const ROTA = '/';
const LARGURAS = [360, 1280] as const;
const ESTADOS: ReadonlyArray<{ rotulo: string; estado: EstadoInicial }> = [
  { rotulo: 'modo normal, tema claro', estado: { tema: 'claro', modoAdaptado: false } },
  { rotulo: 'modo normal, tema escuro', estado: { tema: 'escuro', modoAdaptado: false } },
  { rotulo: 'modo adaptado, tema claro', estado: { tema: 'claro', modoAdaptado: true } },
  { rotulo: 'modo adaptado, tema escuro', estado: { tema: 'escuro', modoAdaptado: true } }
];

/** Expande o botão só se ele estiver fechado; espera o estado aberto. */
async function abrirSeFechado(botao: Locator): Promise<void> {
  await botao.waitFor({ state: 'visible' });
  if ((await botao.getAttribute('aria-expanded')) !== 'true') await botao.click();
  await expect(botao).toHaveAttribute('aria-expanded', 'true');
}

/** Abre o caminho do QA: 1º período, Filosofia Jurídica e a AV3. */
async function abrirAv3DeFilosofia(page: Page, largura: number): Promise<void> {
  if (largura <= 880) {
    await page.locator('.barra-topo__botao-gaveta').click();
  }
  const menu = page.locator('nav[aria-label="Currículo"]');
  await abrirSeFechado(menu.locator('button[aria-controls="lista-p1"]'));
  await abrirSeFechado(menu.locator('button[aria-controls="lista-filosofia-juridica"]'));
  await abrirSeFechado(
    menu.locator('#lista-filosofia-juridica button.menu-curriculo__toggle--av', { hasText: 'AV3' })
  );
}

/** Retângulos de cada texto do item "Perspectiva racial" e a borda direita da gaveta. */
async function medirItemPerspectiva(page: Page): Promise<{ borda: number; textos: string[] }> {
  return page.evaluate(() => {
    const gaveta = document.getElementById('gaveta-do-curriculo');
    if (!gaveta) throw new Error('gaveta do currículo não encontrada');
    const borda = gaveta.getBoundingClientRect().right;
    const item = Array.from(gaveta.querySelectorAll<HTMLElement>('.estado-em-breve')).find((el) =>
      (el.textContent ?? '').includes('Perspectiva racial')
    );
    if (!item) throw new Error('item "Perspectiva racial" não encontrado na gaveta');
    const textos: string[] = [];
    const percurso = document.createTreeWalker(item, window.NodeFilter.SHOW_TEXT);
    for (let no = percurso.nextNode(); no; no = percurso.nextNode()) {
      const texto = (no.textContent ?? '').trim();
      if (texto === '') continue;
      const faixa = document.createRange();
      faixa.selectNodeContents(no);
      for (const retangulo of Array.from(faixa.getClientRects())) {
        if (retangulo.width > 0 && retangulo.right > borda + 0.5) {
          textos.push(`"${texto.slice(0, 40)}" passa ${(retangulo.right - borda).toFixed(1)} px`);
        }
      }
    }
    return { borda, textos };
  });
}

for (const largura of LARGURAS) {
  for (const { rotulo, estado } of ESTADOS) {
    test(`menu lateral, AV3 de Filosofia aberta: "Perspectiva racial" cabe na gaveta, ${largura}px, ${rotulo}`, async ({
      page
    }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await prepararEstadoInicial(page, estado);
      await page.goto(ROTA);
      await abrirAv3DeFilosofia(page, largura);
      await esperarLayoutAssentar(page);

      const medida = await medirItemPerspectiva(page);

      expect(medida.textos, 'textos do item que passam da borda da gaveta').toEqual([]);
    });
  }
}
