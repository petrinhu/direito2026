import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * E2E-G1A-ADAPTADO (Ramo B da F2, decisão do CTO de 20/11/2026, a ratificar pelo líder): no modo
 * adaptado, na página de unidade, o quadro de prova fica logo depois do título, dentro de main. Ao
 * sair da unidade ele volta ao topo do conteúdo e, ao entrar noutra, reaparece depois do novo título:
 * nunca some e nunca fica preso numa página que já saiu.
 */
const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const UNIDADE = '/p/p1/intr-direito/u1';
const OUTRA_UNIDADE = '/p/p1/filosofia-juridica/u1';

async function navegarPeloRoteador(page: Page, caminho: string): Promise<void> {
  await page.evaluate((destino) => {
    window.history.pushState({}, '', destino);
    window.dispatchEvent(new window.PopStateEvent('popstate'));
  }, caminho);
  await page.waitForURL(`**${caminho}`);
  await esperarLayoutAssentar(page);
}

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

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(DATA_FIXA));
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
  await page.setViewportSize({ width: 360, height: 640 });
});

test('quadro depois do título na unidade, modo adaptado, 360px', async ({ page }) => {
  await page.goto(UNIDADE);
  await page.locator('main h1').first().waitFor({ state: 'visible' });
  await esperarLayoutAssentar(page);
  expect(await ondeEstaOQuadro(page)).toBe('depois-do-titulo');
});

test('quadro acompanha a navegação sem sumir, modo adaptado, 360px', async ({ page }) => {
  await page.goto(UNIDADE);
  await page.locator('main h1').first().waitFor({ state: 'visible' });
  await esperarLayoutAssentar(page);
  await navegarPeloRoteador(page, '/');
  expect(await ondeEstaOQuadro(page)).toBe('topo-do-conteudo');
  await navegarPeloRoteador(page, OUTRA_UNIDADE);
  expect(await ondeEstaOQuadro(page)).toBe('depois-do-titulo');
  await navegarPeloRoteador(page, UNIDADE);
  expect(await ondeEstaOQuadro(page)).toBe('depois-do-titulo');
});

const ROTAS_FORA_DA_UNIDADE = [
  '/p/p1',
  '/p/p1/intr-direito',
  '/novidades',
  '/changelog',
  '/sobre',
  '/busca',
  '/pagina-que-nao-existe'
] as const;
const LARGURAS_FORA_DA_UNIDADE = [360, 768, 881, 1280] as const;
const ALTURA_DA_JANELA = 640;

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

// E2E-G1A-OUTRAS-PAGINAS (fatia F5-04): fora da unidade, o quadro também fica depois do título, e a
// primeira linha do título cabe na primeira tela de 640 px. Cada teste mede uma página numa largura;
// as falhas se juntam e só se afirmam no fim do teste.
for (const caminho of ROTAS_FORA_DA_UNIDADE) {
  for (const largura of LARGURAS_FORA_DA_UNIDADE) {
    test(`quadro depois do título e título na primeira tela, ${caminho}, ${largura}px`, async ({
      page
    }) => {
      const falhas: string[] = [];
      await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
      await page.goto(caminho);
      await page.locator('main h1').first().waitFor({ state: 'visible' });
      await esperarLayoutAssentar(page);
      try {
        await expect.poll(() => ondeEstaOQuadro(page)).toBe('depois-do-titulo');
      } catch {
        falhas.push(`lugar ${await ondeEstaOQuadro(page)}`);
      }
      const medida = await medirTitulo(page);
      const resumo = `topo ${medida.topo.toFixed(1)} + linha ${medida.linha.toFixed(1)}, cabeçalho até ${medida.fundoCabecalho.toFixed(1)}`;
      test
        .info()
        .annotations.push({ type: 'medida-titulo', description: `${largura}px: ${resumo}` });
      if (
        medida.topo < medida.fundoCabecalho - 0.5 ||
        medida.topo + medida.linha > ALTURA_DA_JANELA
      ) {
        falhas.push(`${largura}px: ${resumo}`);
      }
      expect(falhas, `${caminho} a ${largura}px`).toEqual([]);
    });
  }
}

test('quadro acompanha a navegação entre páginas com lugar depois do título, modo adaptado, 360px', async ({
  page
}) => {
  await page.goto(UNIDADE);
  await page.locator('main h1').first().waitFor({ state: 'visible' });
  await esperarLayoutAssentar(page);
  const passos = [
    ['/novidades', 'depois-do-titulo'],
    ['/sobre', 'depois-do-titulo'],
    ['/', 'topo-do-conteudo'],
    ['/busca', 'depois-do-titulo'],
    [UNIDADE, 'depois-do-titulo']
  ] as const;
  for (const [caminho, esperado] of passos) {
    await navegarPeloRoteador(page, caminho);
    await expect.poll(() => ondeEstaOQuadro(page), caminho).toBe(esperado);
  }
});
