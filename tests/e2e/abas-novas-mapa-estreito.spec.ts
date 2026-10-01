import { expect, test } from '@playwright/test';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';
import { abrirMapaEmLista, todosOsPresentes } from './apoio/elementos';

/**
 * QA, IMPORTANTE 2: no modo adaptado a 360px, seis níveis de aninhamento com
 * texto de 24px deixavam colunas de cerca de 190px e partiam palavras no
 * meio. Piso fixado antes do conserto: o texto do nó mais profundo tem pelo
 * menos 240px de largura e nenhuma palavra do mapa inteiro é partida.
 */
const BASE = '/p/p1/filosofia-juridica/u1';
const LARGURA_MINIMA_DO_TEXTO = 240;

for (const adaptado of [true, false]) {
  test(`360px, ${adaptado ? 'modo adaptado' : 'modo normal'}: texto do nó mais profundo com no mínimo ${LARGURA_MINIMA_DO_TEXTO}px e nenhuma palavra partida`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: adaptado });
    await abrirMapaEmLista(page, BASE);
    await page.getByRole('button', { name: 'Abrir todos os ramos' }).click();
    await esperarLayoutAssentar(page);

    const profundos = await todosOsPresentes(
      page,
      '[aria-level="6"] > .no-mapa__corpo .no-mapa__rotulo'
    );
    for (const rotulo of profundos) {
      const caixa = await rotulo.boundingBox();
      const texto = await rotulo.innerText();
      expect(caixa!.width, `"${texto}"`).toBeGreaterThanOrEqual(LARGURA_MINIMA_DO_TEXTO);
    }

    const partidas = await page.evaluate(() => {
      const achadas: string[] = [];
      const raiz = document.querySelector('[role="tree"]')!;
      const andador = document.createTreeWalker(raiz, 4 /* NodeFilter.SHOW_TEXT */);
      for (let no = andador.nextNode(); no; no = andador.nextNode()) {
        const texto = no.textContent ?? '';
        for (const m of texto.matchAll(/\S+/g)) {
          // Quebra logo depois de hífen (427-348, palavras compostas) é legítima:
          // só conta quebra entre duas letras.
          const letra = document.createRange();
          for (let i = 0; i < m[0].length - 1; i++) {
            letra.setStart(no, m.index! + i);
            letra.setEnd(no, m.index! + i + 2);
            const rs = [...letra.getClientRects()];
            const caracteres = m[0].slice(i, i + 2);
            const quebrou = new Set(rs.map((r) => Math.round(r.top))).size > 1;
            if (quebrou && !caracteres.includes('-')) achadas.push(m[0]);
          }
        }
      }
      return achadas;
    });
    expect(partidas, `palavras partidas: ${partidas.join(', ')}`).toEqual([]);
  });
}
