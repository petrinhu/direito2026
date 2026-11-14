import type { Locator } from '@playwright/test';
import { test, expect, type Page } from './apoio/sessaoDoEstudo';
import {
  prepararEstadoInicial,
  esperarLayoutAssentar,
  type EstadoInicial
} from './apoio/estadoInicial';

/**
 * Estouro do menu lateral (QA b69c4298, AV3-F0c). No modo adaptado, o selo
 * "em breve" de "Perspectiva racial e o não-dito" e outros rótulos longos
 * passam da borda da gaveta. A gaveta tem overflow-y: auto, o que torna o
 * overflow-x auto: o documento mede 0 px e o estouro fica dentro da gaveta.
 *
 * Duas medidas: (a) o item do QA, com a AV3 de Filosofia aberta; (b) a
 * varredura completa, com TODOS os menus abertos, que pega os gêmeos (L-17).
 * Em ambas, mede-se o retângulo de cada texto visível contra a borda direita
 * da gaveta e a rolagem horizontal própria da gaveta.
 */
const ROTA = '/';
const LARGURAS = [360, 1280] as const;
const ESTADOS: ReadonlyArray<{ rotulo: string; estado: EstadoInicial }> = [
  { rotulo: 'modo normal, tema claro', estado: { tema: 'claro', modoAdaptado: false } },
  { rotulo: 'modo normal, tema escuro', estado: { tema: 'escuro', modoAdaptado: false } },
  { rotulo: 'modo adaptado, tema claro', estado: { tema: 'claro', modoAdaptado: true } },
  { rotulo: 'modo adaptado, tema escuro', estado: { tema: 'escuro', modoAdaptado: true } }
];

interface Medida {
  rolagemHorizontalDaGaveta: number;
  textosForaDaBorda: string[];
  textosMedidos: number;
}

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

/**
 * Abre todo botão de expandir visível, até não sobrar nenhum fechado. Limite
 * de voltas para um laço que não termina nunca passar em silêncio.
 */
async function abrirTodoOMenu(page: Page, largura: number): Promise<void> {
  if (largura <= 880) {
    await page.locator('.barra-topo__botao-gaveta').click();
  }
  const menu = page.locator('nav[aria-label="Currículo"]');
  for (let volta = 0; volta < 200; volta++) {
    const fechado = menu.locator('button[aria-expanded="false"]:visible').first();
    if ((await fechado.count()) === 0) return;
    await fechado.click();
  }
  throw new Error('o menu não terminou de abrir em 200 cliques (laço sem fim?)');
}

/** Mede cada texto visível da gaveta contra a borda direita dela. */
async function medirGaveta(page: Page, seletorRaiz: string | null): Promise<Medida> {
  return page.evaluate((seletor) => {
    const gaveta = document.getElementById('gaveta-do-curriculo');
    if (!gaveta) throw new Error('gaveta do currículo não encontrada');
    const raiz = seletor === null ? gaveta : gaveta.querySelector<HTMLElement>(seletor);
    if (!raiz) throw new Error(`raiz da medida não encontrada: ${seletor}`);
    const bordaDireita = gaveta.getBoundingClientRect().right;
    const textosForaDaBorda: string[] = [];
    let textosMedidos = 0;
    const percurso = document.createTreeWalker(raiz, window.NodeFilter.SHOW_TEXT);
    for (let no = percurso.nextNode(); no; no = percurso.nextNode()) {
      const texto = (no.textContent ?? '').trim();
      if (texto === '') continue;
      const faixa = document.createRange();
      faixa.selectNodeContents(no);
      for (const retangulo of Array.from(faixa.getClientRects())) {
        if (retangulo.width <= 0) continue;
        textosMedidos++;
        if (retangulo.right > bordaDireita + 0.5) {
          const excesso = (retangulo.right - bordaDireita).toFixed(1);
          const pai = no.parentElement;
          const nivel = pai?.closest('ul[class*="menu-curriculo__nivel"]')?.className ?? '';
          const hifen = pai ? getComputedStyle(pai).hyphens : '';
          textosForaDaBorda.push(
            `"${texto.slice(0, 120)}" passa ${excesso} px da borda [nivel=${nivel}; hyphens=${hifen}; lang=${document.documentElement.lang}]`
          );
        }
      }
    }
    return {
      rolagemHorizontalDaGaveta: gaveta.scrollWidth - gaveta.clientWidth,
      textosForaDaBorda,
      textosMedidos
    };
  }, seletorRaiz);
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

      const medida = await medirGaveta(page, '.estado-em-breve');
      expect(medida.textosMedidos, 'o laço de medida precisa ter visto texto').toBeGreaterThan(0);
      expect(
        medida.textosForaDaBorda.filter((t) => t.includes('em breve')),
        'selo "em breve" que passa da borda da gaveta'
      ).toEqual([]);
    });

    test(`menu lateral, todos os menus abertos: nenhum texto estoura a gaveta, ${largura}px, ${rotulo}`, async ({
      page
    }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await prepararEstadoInicial(page, estado);
      await page.goto(ROTA);
      await abrirTodoOMenu(page, largura);
      await esperarLayoutAssentar(page);

      const medida = await medirGaveta(page, null);

      expect(medida.textosMedidos, 'o laço de medida precisa ter visto texto').toBeGreaterThan(0);
      expect(medida.textosForaDaBorda, 'textos que passam da borda da gaveta').toEqual([]);
      expect(
        medida.rolagemHorizontalDaGaveta,
        'rolagem horizontal própria da gaveta do currículo (px)'
      ).toBe(0);

      // Alvo de toque (docs/modo-adaptado.md, seção 2): 44x44 em todo link e botão do menu, só no
      // modo adaptado (no normal o botão de triângulo tem 32 px, por desenho).
      if (estado.modoAdaptado) {
        const pequenos = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll<HTMLElement>(
              'nav[aria-label="Currículo"] a, nav[aria-label="Currículo"] button'
            )
          )
            .filter((el) => el.getClientRects().length > 0)
            .map((el) => {
              const r = el.getBoundingClientRect();
              return {
                texto: (el.textContent ?? '').trim().slice(0, 30),
                largura: Math.round(r.width * 10) / 10,
                altura: Math.round(r.height * 10) / 10
              };
            })
            .filter((alvo) => alvo.largura < 44 || alvo.altura < 44)
        );
        expect(pequenos, 'alvos do menu menores que 44x44').toEqual([]);
      }
    });
  }
}
