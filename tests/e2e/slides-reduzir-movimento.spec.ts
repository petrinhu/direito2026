import { expect, test } from '@playwright/test';
import { abrirAbaSlides, prepararAreaRestritaFalsa } from './apoio/areaRestritaFalsa';

// "Mostrar animações" desligado no Windows = prefers-reduced-motion: reduce.
// Nesse modo o palco não pode ficar vazio em nenhum slide. Escrito, não executado
// nesta máquina (L-50): o QA roda no ambiente isolado.
// Sessão e conteúdo são interceptados (apoio/areaRestritaFalsa): sem conta real.
test.describe('Slides com movimento reduzido', () => {
  test('percorre todos os slides mostrando conteúdo em cada um, sem erro no console', async ({
    page
  }) => {
    const erros: string[] = [];
    page.on('pageerror', (erro) => erros.push(erro.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') erros.push(msg.text());
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1024, height: 768 });
    await prepararAreaRestritaFalsa(page);
    await page.goto('/p/p1/interdisciplinar');
    await abrirAbaSlides(page);

    const slide = page.locator('[aria-roledescription="slide"]');
    const rotulo = await slide.getAttribute('aria-label');
    const total = Number(/de (\d+)$/.exec(rotulo ?? '')?.[1]);
    expect(total).toBeGreaterThan(0);

    for (let n = 1; n <= total; n++) {
      await expect(slide).toHaveAttribute('aria-label', `Slide ${n} de ${total}`);
      await expect(page.locator('.ar-palco-slide__escala > *')).toHaveCount(1);
      expect((await slide.innerText()).trim().length).toBeGreaterThan(0);
      if (n < total) {
        await page.keyboard.press('ArrowRight');
      }
    }
    expect(erros).toEqual([]);
  });
});
