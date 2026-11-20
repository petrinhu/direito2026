import { test, expect } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * E2E-A2-SERRA (F5-02, decisão do líder de 20/11/2026 na Q-SERRA): no modo adaptado, de 772 a 993 px,
 * o cabeçalho chegava a 827 px e a primeira linha do título saía da primeira tela de 640 px (aceite
 * A2 da onda). O spec do cabeçalho mede só algumas larguras e ficava verde com a varredura
 * vermelha. Este varre toda largura inteira de 641 a 1279 px nas 5 rotas medidas na 10c.3. Uma
 * página por rota e faixa: as falhas se juntam e só se afirmam no fim, para o laço não parar na
 * primeira. A faixa de 1024 a 1279 px fica um passo além da borda da regra (BarraTopo.vue).
 */
const ALTURA_DA_JANELA = 640;
const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const ROTAS = [
  '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/mapa',
  '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/mapa',
  '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial/mapa',
  '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/quiz',
  '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/peticao'
] as const;
const FAIXAS = [
  { de: 641, ate: 768 },
  { de: 769, ate: 1023 },
  { de: 1024, ate: 1279 }
] as const;

for (const caminho of ROTAS) {
  for (const faixa of FAIXAS) {
    test(`modo adaptado, ${caminho}: primeira linha do título na primeira tela de ${faixa.de} a ${faixa.ate}px`, async ({
      page
    }) => {
      // Uma página mede até 256 larguras, e o teto padrão do Playwright é de 30 s por teste. O mais lento
      // levou 8,6 s no blink (revisão da 1.16.3.0); os 10 min são teto contra travamento, não estimativa.
      test.setTimeout(10 * 60_000);
      await page.clock.setFixedTime(new Date(DATA_FIXA));
      await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
      await page.setViewportSize({ width: 1280, height: ALTURA_DA_JANELA });
      await page.goto(caminho);
      await page.locator('main h1, main h2').first().waitFor({ state: 'attached' });
      const falhas: string[] = [];
      let medidas = 0;
      for (let largura = faixa.de; largura <= faixa.ate; largura++) {
        await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
        await esperarLayoutAssentar(page);
        const m = await page.evaluate(() => {
          const cabecalho = document.querySelector<HTMLElement>('.barra-topo')!;
          const titulo = Array.from(
            document.querySelectorAll<HTMLElement>('main h1, main h2')
          ).find((el) => el.getClientRects().length > 0)!;
          const caixa = titulo.getBoundingClientRect();
          const linha = parseFloat(getComputedStyle(titulo).lineHeight);
          return {
            topo: caixa.top,
            linha: Number.isFinite(linha) ? linha : caixa.height,
            fundoCabecalho: cabecalho.getBoundingClientRect().bottom
          };
        });
        medidas++;
        // Meio pixel de folga, a mesma do spec do cabeçalho (modo-adaptado-cabecalho.spec.ts:142): o topo do
        // título e o fundo do cabeçalho vêm em frações de pixel.
        if (m.topo < m.fundoCabecalho - 0.5 || m.topo + m.linha > ALTURA_DA_JANELA) {
          falhas.push(
            `${largura}px: topo ${m.topo.toFixed(1)} + linha ${m.linha.toFixed(1)}, cabeçalho até ${m.fundoCabecalho.toFixed(1)}`
          );
        }
      }
      expect(medidas, 'toda largura da faixa foi medida').toBe(faixa.ate - faixa.de + 1);
      expect(
        falhas,
        `${caminho} ${faixa.de}-${faixa.ate}: ${falhas.length} larguras reprovam o A2`
      ).toEqual([]);
    });
  }
}
