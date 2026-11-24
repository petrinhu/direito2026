import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * QUADRO-TITULO-CONTA-USUARIOS (Interface): no modo adaptado, /conta e /usuarios mostravam o quadro de
 * prova antes do título (h1), no topo do conteúdo. O certo é o que já vale nas outras páginas: o quadro
 * logo depois do h1, para o título ficar na primeira tela. Mesmo critério da F5-04 (QUADRO depois do
 * título e primeira linha do título dentro da primeira tela de 640 px), medido com sessão de estudo.
 */
const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const ALTURA_DA_JANELA = 640;
const LARGURAS = [360, 768, 881, 1280] as const;
const ROTAS = ['/conta', '/usuarios'] as const;
/** Título esperado de cada rota: se a página não for a que se quer medir, o teste reprova em vez de passar. */
const TITULO: Record<(typeof ROTAS)[number], string> = {
  '/conta': 'Trocar senha',
  '/usuarios': 'Gerenciar usuários'
};

async function ondeEstaOQuadro(page: Page): Promise<string> {
  return page.evaluate(() => {
    const quadro = document.querySelector('aside.quadro-prova');
    if (!quadro) return 'ausente';
    const alvo = quadro.closest('.alvo-quadro-prova');
    if (alvo)
      return alvo.previousElementSibling?.tagName === 'H1'
        ? 'depois-do-titulo'
        : 'alvo-fora-do-lugar';
    if (quadro.closest('#quadro-prova-do-conteudo')) return 'topo-do-conteudo';
    if (quadro.closest('.layout-base__inferior')) return 'pilha';
    return 'outro';
  });
}

async function medirTitulo(page: Page) {
  return page.evaluate(() => {
    const cabecalho = document.querySelector<HTMLElement>('.barra-topo')!;
    const titulo = Array.from(document.querySelectorAll<HTMLElement>('main h1')).find(
      (el) => el.getClientRects().length > 0
    )!;
    const caixa = titulo.getBoundingClientRect();
    const linha = parseFloat(getComputedStyle(titulo).lineHeight);
    return {
      topo: caixa.top,
      linha: Number.isFinite(linha) ? linha : caixa.height,
      fundoCabecalho: cabecalho.getBoundingClientRect().bottom
    };
  });
}

/**
 * /usuarios só mostra o painel a administrador: a sessão de estudo (usuario comum) não basta. Esta rota
 * de página sobrepõe a do contexto e responde como administrador, só nesse teste.
 */
async function comoAdministrador(page: Page): Promise<void> {
  await page.route('**/api/sessao.php', (rota) =>
    rota.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        autenticado: true,
        usuario: 'usuario-falso',
        admin: true,
        deveTrocarSenha: false,
        csrf: 'csrf-falso'
      })
    })
  );
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(DATA_FIXA));
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
});

for (const caminho of ROTAS) {
  for (const largura of LARGURAS) {
    test(`quadro depois do título e título na primeira tela, modo adaptado, ${caminho}, ${largura}px`, async ({
      page
    }) => {
      if (caminho === '/usuarios') await comoAdministrador(page);
      await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
      await page.goto(caminho);
      await page.locator('main h1', { hasText: TITULO[caminho] }).waitFor({ state: 'visible' });
      await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
      await esperarLayoutAssentar(page);

      await expect
        .poll(() => ondeEstaOQuadro(page), `lugar do quadro em ${caminho}, ${largura}px`)
        .toBe('depois-do-titulo');

      const medida = await medirTitulo(page);
      const resumo = `topo ${medida.topo.toFixed(1)} + linha ${medida.linha.toFixed(1)}, cabeçalho até ${medida.fundoCabecalho.toFixed(1)}`;
      expect(medida.topo, `${caminho} a ${largura}px: ${resumo}`).toBeGreaterThanOrEqual(
        medida.fundoCabecalho - 0.5
      );
      expect(
        medida.topo + medida.linha,
        `${caminho} a ${largura}px: ${resumo}`
      ).toBeLessThanOrEqual(ALTURA_DA_JANELA);
    });
  }
}
