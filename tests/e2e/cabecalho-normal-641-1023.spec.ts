import { test, expect } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * E2E-A2-SERRA, lado do modo normal (revisão da 1.16.3.0, achado I-1). A regra do K1 (BarraTopo.vue,
 * bloco de 341 a 1023 px) põe a trilha numa linha só apenas no modo adaptado. Sem o guarda do modo,
 * a 768 px no modo normal o cabeçalho da home ia de 70,9 para 174,9 px e o das unidades de 166,9 para
 * 190,9 px, e nenhum teste reprovava, porque o teto de 40% ainda cabia. Aqui, de 641 a 1023 px no modo
 * normal, a trilha divide a linha com outro item do cabeçalho. A faixa de 1024 a 1279 px fica um passo
 * além da borda da regra. Uma página por rota e faixa, como em modo-adaptado-serra.spec.ts: as falhas
 * se juntam e só se afirmam no fim, para o laço não parar na primeira.
 */
const ALTURA_DA_JANELA = 640;
const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const ROTAS = [
  '/',
  '/p/p1/intr-direito/u1',
  '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/peticao'
] as const;
const FAIXAS = [
  { de: 641, ate: 768 },
  { de: 769, ate: 1023 },
  { de: 1024, ate: 1279 }
] as const;

for (const caminho of ROTAS) {
  for (const faixa of FAIXAS) {
    test(`modo normal, ${caminho}: a trilha divide a linha do cabeçalho de ${faixa.de} a ${faixa.ate}px`, async ({
      page
    }) => {
      // Uma página mede até 256 larguras, e o teto padrão do Playwright é de 30 s por teste.
      test.setTimeout(10 * 60_000);
      await page.clock.setFixedTime(new Date(DATA_FIXA));
      await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
      await page.setViewportSize({ width: 1280, height: ALTURA_DA_JANELA });
      await page.goto(caminho);
      await page.locator('.barra-topo__trilha').waitFor({ state: 'attached' });
      const falhas: string[] = [];
      let medidas = 0;
      for (let largura = faixa.de; largura <= faixa.ate; largura++) {
        await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
        await esperarLayoutAssentar(page);
        const m = await page.evaluate(() => {
          const trilha = document.querySelector<HTMLElement>('.barra-topo__trilha');
          const altura = document
            .querySelector<HTMLElement>('.barra-topo')!
            .getBoundingClientRect().height;
          if (!trilha || trilha.getClientRects().length === 0)
            return { existe: false, divide: false, altura };
          const t = trilha.getBoundingClientRect();
          const outros = Array.from(
            document.querySelectorAll<HTMLElement>('.barra-topo__linha > *')
          ).filter(
            (el) =>
              el !== trilha &&
              el.getClientRects().length > 0 &&
              el.getBoundingClientRect().width > 0
          );
          const divide = outros.some((el) => {
            const c = el.getBoundingClientRect();
            return Math.min(c.bottom, t.bottom) - Math.max(c.top, t.top) > 1;
          });
          return { existe: true, divide, altura };
        });
        medidas++;
        if (!m.existe || !m.divide) {
          falhas.push(
            `${largura}px: trilha ${m.existe ? 'sozinha na linha' : 'sem caixa'}, cabeçalho ${m.altura.toFixed(1)}`
          );
        }
      }
      expect(medidas, 'toda largura da faixa foi medida').toBe(faixa.ate - faixa.de + 1);
      expect(
        falhas,
        `${caminho} ${faixa.de}-${faixa.ate}: ${falhas.length} larguras com a trilha sem dividir a linha`
      ).toEqual([]);
    });
  }
}
