import { test, expect } from '@playwright/test';

/**
 * IMPORTANTE 3 do QA (docs/qa-modo-adaptado.md): o h1 "Caderno de
 * Direito" da home continua em Georgia (serifa) com o modo ligado.
 * Causa: `Home.vue`, `.pagina-home__hero h1 { font-family: var(--fonte-
 * titulo) }` - o `<style scoped>` do Vue injeta um seletor de atributo
 * (`[data-v-xxx]`) em cada regra, o que empata a especificidade com a
 * regra global do modo (`:root[data-modo-adaptado='on'] h1`, também com
 * um seletor de atributo) - com empate, quem vem DEPOIS no CSS final
 * vence, e o estilo do componente é sempre concatenado depois do global.
 *
 * Correção geral, não por componente: base.css passa a usar `!important`
 * nas duas propriedades tipográficas do modo (font-family, font-weight)
 * para h1-h4. `!important` é o único mecanismo do CSS com garantia
 * estrutural (não depende de contar pontos de especificidade contra
 * QUALQUER regra futura de QUALQUER componente) - não precisa de uma
 * correção por componente cada vez que outro `<style scoped>` declarar
 * font-family num título.
 *
 * Prova por medição real (getComputedStyle), não por leitura de CSS-fonte:
 * mede o valor computado de verdade no navegador, depois da cascata
 * inteira já resolvida.
 */
test('o h1 da home usa a fonte sem serifa do modo, nunca a serifa do componente', async ({
  page
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('caderno-direito:v1:modo-adaptado', 'true');
  });
  await page.goto('/');
  await page.locator('[data-modo-adaptado="on"]').waitFor({ state: 'attached' });
  const h1 = page.locator('.pagina-home__hero h1');
  await h1.waitFor({ state: 'visible' });

  const fontFamily = await h1.evaluate((el) => getComputedStyle(el).fontFamily);

  expect(fontFamily.toLowerCase()).not.toContain('georgia');
  expect(fontFamily).toContain('Inter');
});
