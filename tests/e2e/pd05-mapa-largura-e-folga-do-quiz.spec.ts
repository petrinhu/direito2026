import { test, expect, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';
import { abrirMapaEmLista } from './apoio/elementos';

/**
 * PD-05 (TODO.md, W1). Dois defeitos da Filosofia u1, medidos em ponta a ponta.
 *
 * 1) Lista do mapa recolhe demais em larguras médias. "Recolher" aqui é a perda de
 *    coluna de texto para o recuo dos ramos: a fração da largura da lista que o
 *    recuo come até o nó mais fundo. Critério: em 360, 768 e 1024 px essa fração
 *    não passa da que a mesma lista tem em 1280 px (a referência do desktop).
 *    Um teste por largura, para que uma falha não esconda as seguintes.
 *
 * 2) Texto da explicação do quiz encosta no contorno de foco. Critério: a folga entre
 *    o texto e a borda interna do contorno é de pelo menos 2 px, no modo normal e no
 *    adaptado, em 360 e 1280 px. O MotorQuiz é compartilhado: a conferência cobre
 *    Filosofia u1, Introdução ao Direito u1 e Sociologia Jurídica u1.
 */

const BASE_FILOSOFIA = '/p/p1/filosofia-juridica/u1';

/**
 * Fração da largura da lista que o recuo consome, medida no nó mais fundo de todos.
 * O espaço útil do texto é a largura interna do .no-mapa__corpo, sem o padding.
 */
async function fracaoDoRecuo(page: Page): Promise<number> {
  return page.evaluate(() => {
    const area = document.querySelector<HTMLElement>('.mapa-mental__area');
    if (!area) throw new Error('lista do mapa ausente');
    const largura = area.clientWidth;
    let pior = 0;
    for (const corpo of document.querySelectorAll<HTMLElement>(
      '[role="treeitem"] > .no-mapa__corpo'
    )) {
      const estilo = getComputedStyle(corpo);
      const util =
        corpo.clientWidth -
        Number.parseFloat(estilo.paddingLeft) -
        Number.parseFloat(estilo.paddingRight);
      pior = Math.max(pior, (largura - util) / largura);
    }
    return pior;
  });
}

for (const adaptado of [false, true]) {
  for (const largura of [360, 768, 1024]) {
    test(`mapa em lista, ${adaptado ? 'modo adaptado' : 'modo normal'}, ${largura}px: recuo não come mais da lista do que em 1280px`, async ({
      page
    }) => {
      await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: adaptado });
      await page.setViewportSize({ width: 1280, height: 900 });
      await abrirMapaEmLista(page, BASE_FILOSOFIA);
      await page.getByRole('button', { name: 'Abrir todos os ramos' }).click();
      await esperarLayoutAssentar(page);
      const referencia = await fracaoDoRecuo(page);

      await page.setViewportSize({ width: largura, height: 900 });
      await esperarLayoutAssentar(page);
      const medida = await fracaoDoRecuo(page);

      expect(
        medida,
        `recuo em ${largura}px: ${(medida * 100).toFixed(1)}% da lista; em 1280px: ${(referencia * 100).toFixed(1)}%`
      ).toBeLessThanOrEqual(referencia);
    });
  }
}

const UNIDADES_COM_QUIZ = [
  '/p/p1/filosofia-juridica/u1/quiz',
  '/p/p1/intr-direito/u1/quiz',
  '/p/p1/sociologia-juridica/u1/quiz'
] as const;

for (const caminho of UNIDADES_COM_QUIZ) {
  for (const adaptado of [false, true]) {
    for (const largura of [360, 1280]) {
      test(`${caminho}, ${adaptado ? 'modo adaptado' : 'modo normal'}, ${largura}px: folga de pelo menos 2px entre a explicação e o contorno de foco`, async ({
        page
      }) => {
        await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: adaptado });
        await page.setViewportSize({ width: largura, height: 900 });
        await page.goto(caminho);
        await page.locator('.cartao-pergunta').first().waitFor({ state: 'visible' });

        // Teclado, não clique: a resposta por Espaço deixa o foco no bloco de resultado com
        // :focus-visible verdadeiro, que é o estado em que o contorno aparece.
        await page.locator('.cartao-pergunta input[type="radio"]').first().focus();
        await page.keyboard.press('Space');
        const bloco = page.locator('.cartao-pergunta__resultado');
        await expect(bloco).toBeFocused();
        await esperarLayoutAssentar(page);

        const folga = await page.evaluate(() => {
          const bloco = document.querySelector<HTMLElement>('.cartao-pergunta__resultado')!;
          const explicacao = document.querySelector<HTMLElement>('.cartao-pergunta__explicacao')!;
          if (!bloco.matches(':focus-visible')) throw new Error('foco sem :focus-visible');
          // Borda interna do contorno: a caixa do bloco afastada pelo outline-offset.
          const deslocamento = Number.parseFloat(getComputedStyle(bloco).outlineOffset);
          const caixa = bloco.getBoundingClientRect();
          const interna = {
            esquerda: caixa.left - deslocamento,
            topo: caixa.top - deslocamento,
            direita: caixa.right + deslocamento,
            base: caixa.bottom + deslocamento
          };
          const trecho = document.createRange();
          trecho.selectNodeContents(explicacao);
          const linhas = [...trecho.getClientRects()].filter((r) => r.width > 0);
          const texto = {
            esquerda: Math.min(...linhas.map((r) => r.left)),
            topo: Math.min(...linhas.map((r) => r.top)),
            direita: Math.max(...linhas.map((r) => r.right)),
            base: Math.max(...linhas.map((r) => r.bottom))
          };
          return Math.min(
            texto.esquerda - interna.esquerda,
            texto.topo - interna.topo,
            interna.direita - texto.direita,
            interna.base - texto.base
          );
        });

        expect(folga, `folga de ${folga} px`).toBeGreaterThanOrEqual(2);
      });
    }
  }
}
