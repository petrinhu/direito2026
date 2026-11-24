import { test, expect } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar } from './apoio/estadoInicial';

/**
 * Critério 2 da especificação (docs/modo-adaptado.md, seção 8): em 320px de
 * largura CSS, com o modo adaptado ligado, nenhuma rolagem horizontal da
 * página. Mesmo padrão de tests/e2e/responsividade-360.spec.ts (layout
 * real, por isso Playwright, não jsdom), mas ligando o modo ANTES de medir,
 * via a mesma chave de localStorage que o repositório real usa
 * (src/app/persistencia/RepositorioLocalStorage.ts, prefixo
 * "caderno-direito:v1").
 */
test.use({ viewport: { width: 320, height: 800 } });

/**
 * Relógio fixo (E2E-G1-320, decisão de 20/11/2026): a faixa do quadro de prova muda o tamanho da
 * pílula (QuadroProva.vue) e, com ela, a largura da linha do topo. Sem data fixa o resultado depende
 * do dia em que o teste roda.
 *
 * E2E-320-DATAS (23/11/2026): cada teste roda em três datas, uma por lado da prova e no dia dela,
 * e cada data declara a faixa esperada (contadorProva, urgencia.ts: dourado de 7 a 14 dias, garnet
 * de 3 a 6, pulsante no dia e em 2 dias ou menos). O `expect` do data-faixa prova que a data caiu na
 * faixa certa; sem ele, uma data errada passaria sem medir a faixa que o teste quer cobrir.
 *
 * - antes: 16/11/2026, prazo das provas online já passado, prova AV3 de intr-direito em 8 dias (dourado).
 * - no dia: 24/11/2026, AV3 de intr-direito (pulsante, "Hoje").
 * - depois: 25/11/2026, próxima prova é a AV3 de redacao-juridica-1 em 30/11, em 5 dias (garnet).
 */
const CASOS_DE_DATA = [
  { nome: 'antes da prova', data: '2026-11-16', faixa: 'dourado' },
  { nome: 'no dia da prova', data: '2026-11-24', faixa: 'pulsante' },
  { nome: 'depois da prova', data: '2026-11-25', faixa: 'garnet' }
] as const;

async function ligarModoAdaptado(
  page: import('@playwright/test').Page,
  caminho: string,
  caso: (typeof CASOS_DE_DATA)[number]
) {
  await page.clock.setFixedTime(new Date(`${caso.data}T12:00:00-03:00`));
  await page.addInitScript(() => {
    localStorage.setItem('caderno-direito:v1:modo-adaptado', 'true');
  });
  await page.goto(caminho);
  await expect(page.locator('aside.quadro-prova')).toHaveAttribute('data-faixa', caso.faixa);
}

for (const caso of CASOS_DE_DATA) {
  test(`em 320px, com o modo adaptado ligado, a home não estoura a largura (${caso.nome})`, async ({
    page
  }) => {
    await ligarModoAdaptado(page, '/', caso);
    await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraJanela = await page.evaluate(() => document.documentElement.clientWidth);

    expect(
      larguraDocumento,
      `scrollWidth ${larguraDocumento} vs clientWidth ${larguraJanela}`
    ).toBe(larguraJanela);
  });

  test(`em 320px, com o modo adaptado ligado, a página de unidade não estoura a largura (${caso.nome})`, async ({
    page
  }) => {
    await ligarModoAdaptado(page, '/p/p1/intr-direito/u1', caso);
    await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
    await page.locator('table').first().waitFor({ state: 'attached' });

    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraJanela = await page.evaluate(() => document.documentElement.clientWidth);

    expect(
      larguraDocumento,
      `scrollWidth ${larguraDocumento} vs clientWidth ${larguraJanela}`
    ).toBe(larguraJanela);
  });

  test(`em 320px, com o modo adaptado ligado, o botão do quadro de prova cabe no próprio texto (${caso.nome})`, async ({
    page
  }) => {
    await ligarModoAdaptado(page, '/p/p1/intr-direito/u1', caso);
    const localBotao = page.locator('aside.quadro-prova .quadro-prova__alternar');
    await localBotao.waitFor({ state: 'visible' });
    // Fora da janela, elementFromPoint devolve null (CSSOM View), e a 320 x 800 o botão pode ficar
    // abaixo da primeira tela: sem rolar até ele, "coberto" media "fora da janela" (E2E-G1-320).
    await localBotao.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await esperarLayoutAssentar(page);

    const botao = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>('aside.quadro-prova .quadro-prova__alternar')!;
      const caixa = el.getBoundingClientRect();
      const centroY = caixa.top + caixa.height / 2;
      const alvo = document.elementFromPoint(caixa.left + caixa.width / 2, centroY);
      return {
        larguraTexto: el.scrollWidth,
        larguraBotao: el.clientWidth,
        largura: caixa.width,
        altura: caixa.height,
        centroNaJanela: centroY >= 0 && centroY < window.innerHeight,
        noCentro:
          alvo === null
            ? 'nada'
            : `${alvo.tagName.toLowerCase()}.${alvo.getAttribute('class') ?? ''}`,
        coberto: !(alvo !== null && (alvo === el || el.contains(alvo)))
      };
    });

    expect(botao.larguraTexto, 'texto do botão não passa da largura do botão').toBeLessThanOrEqual(
      botao.larguraBotao
    );
    expect(botao.largura, 'alvo de toque com 44 px de largura').toBeGreaterThanOrEqual(44);
    expect(botao.altura, 'alvo de toque com 44 px de altura').toBeGreaterThanOrEqual(44);
    expect(botao.centroNaJanela, 'centro do botão dentro da janela depois de rolar até ele').toBe(
      true
    );
    expect(
      botao.coberto,
      `botão não coberto por outro elemento (no centro: ${botao.noCentro})`
    ).toBe(false);
  });

  /**
   * Ordem visual do topo do quadro (revisão da 1.16.3.0, achado I-3). Com a quebra da C31
   * (QuadroProva.vue, .quadro-prova__topo), a pílula fica antes do botão na tela, como no DOM e no Tab
   * (WCAG 1.3.2). Em 14/11, na u1, a 320 px a linha quebra (pílula em 707 px, botão em 778 px, medido na
   * revisão); a guarda de quebra impede o teste de passar sem a quebra acontecer. No X3 (wrap-reverse) a
   * guarda passa e a ordem reprova.
   */
  test(`em 320px, com o modo adaptado ligado, o topo do quadro quebra na ordem do DOM (${caso.nome})`, async ({
    page
  }) => {
    await ligarModoAdaptado(page, '/p/p1/intr-direito/u1', caso);
    await page.locator('.quadro-prova__topo').waitFor({ state: 'visible' });
    await esperarLayoutAssentar(page);
    const m = await page.evaluate(() => {
      const pilula = document
        .querySelector<HTMLElement>('.quadro-prova__pilula')!
        .getBoundingClientRect();
      const botao = document
        .querySelector<HTMLElement>('.quadro-prova__alternar')!
        .getBoundingClientRect();
      return {
        pilulaTopo: pilula.top,
        pilulaFundo: pilula.bottom,
        botaoTopo: botao.top,
        botaoFundo: botao.bottom
      };
    });
    const rotulo = `pílula em ${m.pilulaTopo.toFixed(1)}, botão em ${m.botaoTopo.toFixed(1)}`;
    // Quebrou quando as duas caixas não se cruzam na vertical; com align-items: center, só o topo diferente não prova.
    // A folga de 1 px, aqui e na ordem abaixo, cobre arredondamento de fração de pixel (as caixas vêm em
    // múltiplos de 1/64 px); na quebra medida o botão começa 70,8 px abaixo do topo da pílula.
    const quebrou = m.botaoTopo >= m.pilulaFundo - 1 || m.pilulaTopo >= m.botaoFundo - 1;
    expect(quebrou, `a linha do topo quebrou (${rotulo})`).toBe(true);
    // Premissa do DOM, não lida dele: no template de QuadroProva.vue a pílula (.quadro-prova__pilula)
    // vem antes do botão (.quadro-prova__alternar). Se o template inverter, este teste reprova pela
    // ordem visual, e a causa está no template, não no CSS.
    expect(
      m.botaoTopo,
      `o botão fica abaixo da pílula, na ordem do DOM (${rotulo})`
    ).toBeGreaterThanOrEqual(m.pilulaFundo - 1);
  });
}
