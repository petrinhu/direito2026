import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * LEITOR-TELA-SHY (TODO, W1): o nome acessível de cada item da trilha sai sem o hífen mole
 * (U+00AD) e é igual ao texto visível.
 *
 * A prova lê a árvore de acessibilidade NATIVA do Chromium (CDP, Accessibility.getFullAXTree),
 * que é o que um leitor de tela recebe. Não usa getByRole nem toHaveAccessibleName: esses usam o
 * motor de nomes do próprio Playwright, que descarta o U+00AD e deixaria passar a regressão.
 *
 * Unidade escolhida: a rota de mnemônicos do Hart. O rótulo da aba "Mnemônicos" vem da tabela
 * SILABAS_ROTULOS_ABA (src/core/texto/silabasRotulosAba.ts), com U+00AD nos pontos de sílaba, então
 * o último item da trilha traz hífen mole no texto visível.
 */
const HIFEN_MOLE = '­';
const ROTA = '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/mnemonicos';
const NOME_DA_TRILHA = 'Trilha de navegação';

interface NoDaArvore {
  nodeId: string;
  role?: { value: string };
  name?: { value: string };
  childIds?: string[];
}

/** Nomes dos links da trilha, na ordem do DOM, lidos da árvore nativa do navegador. */
async function nomesDosLinksNaArvore(page: Page): Promise<string[]> {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('Accessibility.enable');
    const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: NoDaArvore[] };
    const porId = new Map(nodes.map((no) => [no.nodeId, no]));
    const nav = nodes.find(
      (no) => no.role?.value === 'navigation' && no.name?.value === NOME_DA_TRILHA
    );
    if (!nav) throw new Error(`"${NOME_DA_TRILHA}" não aparece na árvore de acessibilidade`);
    const nomes: string[] = [];
    const percorrer = (id: string): void => {
      const no = porId.get(id);
      if (!no) return;
      if (no.role?.value === 'link') nomes.push(no.name?.value ?? '');
      for (const filho of no.childIds ?? []) percorrer(filho);
    };
    for (const filho of nav.childIds ?? []) percorrer(filho);
    return nomes;
  } finally {
    await cdp.detach();
  }
}

test('nome acessível de cada item da trilha, na árvore nativa, sai sem U+00AD e é igual ao texto visível', async ({
  page
}) => {
  // arrange: modo adaptado a 1280px mostra todos os níveis (EP-F11.7-TRILHA). No modo normal,
  // a trilha numa caixa estreita do cabeçalho oculta os níveis de cima (display:none), e eles
  // saem da árvore de acessibilidade por desenho; aqui queremos ler todos.
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(ROTA);
  const trilha = page.getByRole('navigation', { name: NOME_DA_TRILHA });
  await trilha.locator('a[aria-current="page"]').waitFor({ state: 'visible' });

  // act
  const { total, textosVisiveis } = await trilha.locator('a').evaluateAll((links) => ({
    total: links.length,
    textosVisiveis: links
      .filter((a) => a.getClientRects().length > 0)
      .map((a) => a.textContent?.trim() ?? '')
  }));
  const nomesNaArvore = await nomesDosLinksNaArvore(page);

  // assert
  expect(
    textosVisiveis.length,
    'precondição: todos os níveis da trilha visíveis, nenhum lido a menos'
  ).toBe(total);
  expect(
    textosVisiveis.some((texto) => texto.includes(HIFEN_MOLE)),
    `precondição: algum item da trilha traz U+00AD no texto visível (${JSON.stringify(textosVisiveis)})`
  ).toBe(true);
  expect(
    nomesNaArvore,
    'mesmos links na árvore nativa e na tela, na mesma ordem'
  ).toHaveLength(textosVisiveis.length);
  textosVisiveis.forEach((visivel, indice) => {
    expect(nomesNaArvore[indice], `nome nativo do item "${visivel}"`).toBe(
      visivel.replaceAll(HIFEN_MOLE, '')
    );
  });
});
