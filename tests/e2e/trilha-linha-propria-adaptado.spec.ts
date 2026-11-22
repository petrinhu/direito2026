import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * EP-F11.7-TRILHA (decisão do líder): no modo adaptado, acima de 880 px, a trilha do
 * cabeçalho tem linha própria, abaixo da linha da marca, da busca e dos botões, com
 * todos os níveis visíveis e nenhum cortado (comentário "nunca corta" do CSS). O
 * cabeçalho do modo adaptado segue o teto de 256 px a 1280 px (E2E-ADAPTADO-FIXO-1280).
 */
const BASE = '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias';
const ROTAS = [BASE, `${BASE}/mnemonicos`, `${BASE}/fichamento`];
const LARGURAS = [1024, 1280];
const TETO_CABECALHO_PX = 256;

interface MedidaCabecalho {
  altura: number;
  niveisTotal: number;
  niveisVisiveis: number;
  cortados: string[];
  trilhaAbaixoDaBusca: boolean;
}

async function medir(page: Page): Promise<MedidaCabecalho> {
  return page.evaluate(() => {
    const cabecalho = document.querySelector<HTMLElement>('.barra-topo')!;
    const trilha = document.querySelector<HTMLElement>('.trilha-navegacao')!;
    const busca = document.querySelector<HTMLElement>('.campo-busca')!;
    const itens = Array.from(document.querySelectorAll<HTMLElement>('.trilha-navegacao li'));
    const visiveis = itens.filter((li) => li.getClientRects().length > 0);
    const cortados: string[] = [];
    for (const li of visiveis) {
      const a = li.querySelector<HTMLElement>('a')!;
      const r = a.getBoundingClientRect();
      if (a.scrollWidth > a.clientWidth + 1 || r.right > window.innerWidth + 0.5) {
        cortados.push(a.textContent?.trim() ?? '');
      }
    }
    return {
      altura: cabecalho.getBoundingClientRect().height,
      niveisTotal: itens.length,
      niveisVisiveis: visiveis.length,
      cortados,
      trilhaAbaixoDaBusca:
        trilha.getBoundingClientRect().top >= busca.getBoundingClientRect().bottom - 0.5
    };
  });
}

async function abrir(page: Page, caminho: string, largura: number): Promise<MedidaCabecalho> {
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
  await page.setViewportSize({ width: largura, height: 800 });
  await page.goto(caminho);
  await page.locator('main').first().waitFor({ state: 'visible' });
  await esperarLayoutAssentar(page, { doTopo: true });
  return medir(page);
}

for (const caminho of ROTAS) {
  for (const largura of LARGURAS) {
    test(`trilha em linha própria, ${caminho}, ${largura}px, modo adaptado: trilha abaixo da busca e nenhum nível cortado`, async ({
      page
    }) => {
      const medida = await abrir(page, caminho, largura);
      expect(medida.niveisVisiveis, `${caminho} a ${largura}px: níveis visíveis`).toBe(
        medida.niveisTotal
      );
      expect(medida.cortados, `${caminho} a ${largura}px: níveis cortados`).toEqual([]);
      expect(medida.trilhaAbaixoDaBusca, `${caminho} a ${largura}px: trilha abaixo da busca`).toBe(
        true
      );
    });

    test(`cabeçalho até 256 px, ${caminho}, ${largura}px, modo adaptado`, async ({ page }) => {
      const medida = await abrir(page, caminho, largura);
      expect(medida.altura, `${caminho} a ${largura}px: altura do cabeçalho`).toBeLessThanOrEqual(
        TETO_CABECALHO_PX
      );
    });
  }
}
