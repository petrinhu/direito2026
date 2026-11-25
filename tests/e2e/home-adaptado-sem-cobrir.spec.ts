import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * Botão Home no modo adaptado (regressão de 24/11/2026, ordem do CPO ratificada pelo líder em 25/11):
 * o Home fica sticky na pilha inferior, e o cartão de prova, que no modo adaptado já vive no conteúdo,
 * fica coberto por ele ao rolar a 360 px. Correção: no modo adaptado o Home sai da pilha e vai para o
 * fluxo, logo depois do cartão, sem cobri-lo. Fora do modo adaptado, a pilha não muda.
 *
 * Medido no layout real (Playwright), porque jsdom não calcula posição nem sticky. Larguras fixas do
 * projeto: 360 px (celular), 768 px (tablet) e 1280 px (desktop). A rolagem vai de cima a baixo em passos
 * de 40 px, para pegar qualquer posição em que o Home encoste no cartão.
 */

const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const ALTURA_PX = 800;
const LARGURAS_PX = [360, 768, 1280] as const;
const PASSO_DE_ROLAGEM_PX = 40;
const TOLERANCIA_PX = 0.5;
const ALVO_MINIMO_PX = 44;

const PAGINAS = [
  { nome: 'Resumo', caminho: '/p/p1/intr-direito/u3-material-norma-interpretacao' },
  { nome: 'Petição', caminho: '/p/p1/intr-direito/u3-material-danos-morais/peticao' }
] as const;

interface Caixa {
  esquerda: number;
  topo: number;
  direita: number;
  base: number;
}

interface Medida {
  quadroVisivel: boolean;
  homeNoConteudo: boolean;
  homeNaPilha: boolean;
  homeDepoisDoQuadro: boolean;
  alvoLargura: number;
  alvoAltura: number;
  /** Posições de rolagem (scrollY) em que o Home cruza o cartão. */
  rolagensComSobreposicao: number[];
}

async function prepararPagina(page: Page, caminho: string, largura: number, modoAdaptado: boolean) {
  await page.clock.setFixedTime(new Date(DATA_FIXA));
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado });
  await page.setViewportSize({ width: largura, height: ALTURA_PX });
  await page.goto(caminho);
  await expect(page.locator('aside.quadro-prova')).toBeVisible();
  await esperarLayoutAssentar(page, { doTopo: true });
}

/**
 * Anda a página de cima a baixo e, em cada posição, verifica se o Home cruza o cartão. Tudo num único
 * evaluate, para que a leitura de posição seja feita com o layout já assentado em cada passo.
 */
async function medirHomeContraCartao(page: Page): Promise<Medida> {
  return page.evaluate(
    ({ tolerancia, passo }: { tolerancia: number; passo: number }) => {
      const cartao = document.querySelector<HTMLElement>('aside.quadro-prova');
      const main = document.getElementById('conteudo-principal');
      const pilha = document.querySelector<HTMLElement>('.layout-base__inferior');
      const link = document.querySelector<HTMLElement>('.layout-base__nav-home a.botao-home');
      if (!cartao || !main || !link) {
        return {
          quadroVisivel: false,
          homeNoConteudo: false,
          homeNaPilha: false,
          homeDepoisDoQuadro: false,
          alvoLargura: 0,
          alvoAltura: 0,
          rolagensComSobreposicao: []
        };
      }

      const sobrepoe = (a: DOMRect, b: DOMRect): boolean =>
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > tolerancia &&
        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > tolerancia;

      const maximo = document.documentElement.scrollHeight - window.innerHeight;
      const rolagensComSobreposicao: number[] = [];
      for (let y = 0; y <= maximo + passo; y += passo) {
        const alvo = Math.min(y, maximo);
        window.scrollTo({ top: alvo, behavior: 'instant' });
        if (sobrepoe(cartao.getBoundingClientRect(), link.getBoundingClientRect())) {
          rolagensComSobreposicao.push(Math.round(window.scrollY));
        }
      }
      window.scrollTo({ top: 0, behavior: 'instant' });

      const caixaLink = link.getBoundingClientRect();
      const ordem = cartao.compareDocumentPosition(link.closest('nav') ?? link);
      return {
        quadroVisivel: cartao.getBoundingClientRect().width > 0,
        homeNoConteudo: main.contains(link),
        homeNaPilha: pilha ? pilha.contains(link) : false,
        homeDepoisDoQuadro: (ordem & window.Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
        alvoLargura: caixaLink.width,
        alvoAltura: caixaLink.height,
        rolagensComSobreposicao: [...new Set(rolagensComSobreposicao)]
      };
    },
    { tolerancia: TOLERANCIA_PX, passo: PASSO_DE_ROLAGEM_PX }
  );
}

test.describe('botão Home no modo adaptado: não cobre o cartão de prova', () => {
  for (const pagina of PAGINAS) {
    for (const largura of LARGURAS_PX) {
      test(`${pagina.nome} · ${largura} px · adaptado: o Home fica no fluxo, depois do cartão, sem cobri-lo`, async ({
        page
      }) => {
        test.setTimeout(240_000);
        await prepararPagina(page, pagina.caminho, largura, true);
        const medida = await medirHomeContraCartao(page);

        expect(medida.quadroVisivel, 'cartão não visível').toBe(true);
        expect(
          medida.rolagensComSobreposicao,
          `Home cobre o cartão com a página rolada em y=${medida.rolagensComSobreposicao.join(', ')}`
        ).toEqual([]);
        expect(medida.homeNaPilha, 'Home ainda na pilha inferior (sticky)').toBe(false);
        expect(medida.homeNoConteudo, 'Home fora da coluna de conteúdo').toBe(true);
        expect(
          medida.homeDepoisDoQuadro,
          'Home não vem logo depois do cartão na ordem do DOM'
        ).toBe(true);
        expect(medida.alvoLargura, 'alvo do Home mais estreito que 44 px').toBeGreaterThanOrEqual(
          ALVO_MINIMO_PX
        );
        expect(medida.alvoAltura, 'alvo do Home mais baixo que 44 px').toBeGreaterThanOrEqual(
          ALVO_MINIMO_PX
        );
      });
    }
  }
});

test.describe('botão Home fora do modo adaptado: a pilha inferior não muda', () => {
  for (const largura of LARGURAS_PX) {
    test(`Resumo · ${largura} px · normal: o Home continua na pilha inferior, e o cartão também`, async ({
      page
    }) => {
      await prepararPagina(page, PAGINAS[0].caminho, largura, false);
      const estado = await page.evaluate(() => {
        const pilha = document.querySelector('.layout-base__inferior');
        return {
          homeNaPilha: pilha?.querySelector('.layout-base__nav-home a.botao-home') != null,
          cartaoNaPilha: pilha?.querySelector('aside.quadro-prova') != null,
          sticky: pilha ? getComputedStyle(pilha).position === 'sticky' : false
        };
      });
      expect(estado.homeNaPilha, 'Home saiu da pilha inferior fora do modo adaptado').toBe(true);
      expect(estado.cartaoNaPilha, 'cartão saiu da pilha inferior fora do modo adaptado').toBe(
        true
      );
      expect(estado.sticky, 'pilha inferior deixou de ser sticky fora do modo adaptado').toBe(true);
    });
  }
});
