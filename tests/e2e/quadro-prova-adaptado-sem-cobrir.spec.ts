import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * Quadro de prova no modo adaptado (AV3-F0f, decisão do CPO a ratificar pelo líder): o cartão deixa
 * de flutuar sobre a página e passa a ocupar espaço próprio no topo da coluna de conteúdo. Por isso
 * nenhuma parte dele pode cruzar o texto do conteúdo: nem quando um link do sumário leva a um título
 * (QA de 14/11, rodada 2, medida sobre a extensão do TEXTO e não sobre a caixa), nem com a página
 * rolada ao topo, ao meio e ao fim. Vale com o cartão aberto e com o cartão minimizado.
 *
 * O relógio é fixado em 14/11/2026 (véspera de prova, pílula "Amanhã", o cenário do QA). Só a data é
 * fixada: os timers continuam rodando, para não travar a animação nem o layout.
 */

const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const ALTURA_PX = 800;
const LARGURAS_PX = [360, 768, 1280, 1920] as const;
const TOLERANCIA_PX = 0.5;

interface AlvoSumario {
  nome: string;
  caminho: string;
  nomeDoSumario: string;
  seletorDaSecao: string;
  seletorDoTitulo: string;
}

const RESUMO: AlvoSumario = {
  nome: 'Resumo',
  caminho: '/p/p1/intr-direito/u3-material-norma-interpretacao',
  nomeDoSumario: 'Sumário do resumo',
  seletorDaSecao: 'section.bloco-teorico',
  seletorDoTitulo: '.bloco-teorico__titulo'
};

const PETICAO: AlvoSumario = {
  nome: 'Petição',
  caminho: '/p/p1/intr-direito/u3-material-danos-morais/peticao',
  nomeDoSumario: 'Sumário da petição',
  seletorDaSecao: 'section.peca-comentada__secao',
  seletorDoTitulo: 'h3'
};

const ALVOS: readonly AlvoSumario[] = [RESUMO, PETICAO];

/** Resultado de uma medida da página: cada item é um motivo de reprovação, nunca um número solto. */
interface Medida {
  cartaoVisivel: boolean;
  cartaoEmMain: boolean;
  cartaoNaPilha: boolean;
  linhasMedidas: number;
  linhasCruzadas: string[];
  tituloCoberto: string[];
}

async function fixarRelogio(page: Page): Promise<void> {
  await page.clock.setFixedTime(new Date(DATA_FIXA));
}

async function prepararPagina(
  page: Page,
  caminho: string,
  largura: number,
  modoAdaptado: boolean
): Promise<void> {
  await fixarRelogio(page);
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado });
  await page.setViewportSize({ width: largura, height: ALTURA_PX });
  await page.goto(caminho);
  await expect(page.locator('aside.quadro-prova')).toBeVisible();
  await esperarLayoutAssentar(page, { doTopo: true });
}

/** Põe o cartão no estado pedido ("aberto" ou "minimizado") tocando no botão só quando preciso. */
async function definirEstadoDoCartao(page: Page, aberto: boolean): Promise<void> {
  const botao = page.locator('aside.quadro-prova .quadro-prova__alternar');
  const esperado = aberto ? 'true' : 'false';
  if ((await botao.getAttribute('aria-expanded')) !== esperado) await botao.click();
  await expect(botao).toHaveAttribute('aria-expanded', esperado);
  await esperarLayoutAssentar(page);
}

/** Espera a rolagem parar: quadros seguidos sem mudar scrollY (rolagem suave de âncora). */
async function esperarRolagemParar(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolver) => {
        let anterior = -1;
        let estaveis = 0;
        const passo = (): void => {
          const y = window.scrollY;
          estaveis = y === anterior ? estaveis + 1 : 0;
          anterior = y;
          if (estaveis >= 12) resolver();
          else requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
      })
  );
}

/**
 * Mede o cartão contra o texto do conteúdo na página atual. `linhasCruzadas` cruza o retângulo do
 * cartão com cada linha de texto de <main> (fora do próprio cartão): é o critério do aceite, sobre o
 * texto. `tituloCoberto` usa a técnica do QA (elementFromPoint sobre a extensão do texto do título,
 * em três pontos) e diz qual elemento do cartão está por cima.
 */
async function medirCartao(
  page: Page,
  alvo: AlvoSumario,
  idDaSecao: string | null
): Promise<Medida> {
  return page.evaluate(
    ({
      seletorDoTitulo,
      idDaSecao,
      tolerancia
    }: {
      seletorDoTitulo: string;
      idDaSecao: string | null;
      tolerancia: number;
    }) => {
      const cartao = document.querySelector<HTMLElement>('aside.quadro-prova');
      const main = document.getElementById('conteudo-principal');
      const pilha = document.querySelector('.layout-base__inferior');
      const vazio: Medida = {
        cartaoVisivel: false,
        cartaoEmMain: false,
        cartaoNaPilha: false,
        linhasMedidas: 0,
        linhasCruzadas: [],
        tituloCoberto: []
      };
      if (!cartao || !main) return vazio;
      const cr = cartao.getBoundingClientRect();

      const linhas: Array<{
        r: {
          left: number;
          right: number;
          top: number;
          bottom: number;
          width: number;
          height: number;
        };
        t: string;
      }> = [];
      const caminhante = document.createTreeWalker(main, window.NodeFilter.SHOW_TEXT);
      for (let no = caminhante.nextNode(); no; no = caminhante.nextNode()) {
        const texto = (no.textContent ?? '').trim();
        const pai = no.parentElement;
        if (!texto || !pai || pai.closest('.quadro-prova') || pai.closest('script, style'))
          continue;
        const intervalo = document.createRange();
        intervalo.selectNodeContents(no);
        for (const r of Array.from(intervalo.getClientRects())) {
          if (r.width > 0 && r.height > 0) linhas.push({ r, t: texto.slice(0, 40) });
        }
      }
      const linhasCruzadas = linhas
        .filter(
          ({ r }) =>
            r.left < cr.right - tolerancia &&
            r.right > cr.left + tolerancia &&
            r.top < cr.bottom - tolerancia &&
            r.bottom > cr.top + tolerancia
        )
        .map(({ t, r }) => `"${t}" em y=${Math.round(r.top)}`);

      const tituloCoberto: string[] = [];
      const secao = idDaSecao ? document.getElementById(idDaSecao) : null;
      const titulo = secao?.querySelector<HTMLElement>(seletorDoTitulo) ?? null;
      if (titulo) {
        const intervalo = document.createRange();
        intervalo.selectNodeContents(titulo);
        const caixa = intervalo.getBoundingClientRect();
        if (caixa.width > 0) {
          const y = caixa.top + caixa.height / 2;
          for (const x of [caixa.left + 4, caixa.left + caixa.width / 2, caixa.right - 4]) {
            const topo = document.elementFromPoint(x, y);
            const dentro = topo?.closest('aside.quadro-prova');
            if (dentro)
              tituloCoberto.push(
                `${topo?.tagName.toLowerCase()}.${String(topo?.getAttribute('class') ?? '').split(' ')[0]}`
              );
          }
        }
      }

      return {
        cartaoVisivel: cr.width > 0 && cr.height > 0,
        cartaoEmMain: main.contains(cartao),
        cartaoNaPilha: pilha ? pilha.contains(cartao) : false,
        linhasMedidas: linhas.length,
        linhasCruzadas,
        tituloCoberto: [...new Set(tituloCoberto)]
      };
    },
    { seletorDoTitulo: alvo.seletorDoTitulo, idDaSecao, tolerancia: TOLERANCIA_PX }
  );
}

/** Piso de varredura (L-36): zero linha medida é varredura quebrada, nunca página limpa. */
function motivosDeReprovacao(medida: Medida, onde: string): string[] {
  const motivos: string[] = [];
  if (!medida.cartaoVisivel) motivos.push(`${onde}: cartão não visível`);
  if (medida.linhasMedidas === 0)
    motivos.push(`${onde}: nenhuma linha de texto medida (varredura vazia)`);
  if (medida.linhasCruzadas.length > 0) {
    motivos.push(
      `${onde}: cartão cruza ${medida.linhasCruzadas.length} linha(s) de texto: ${medida.linhasCruzadas.slice(0, 3).join('; ')}`
    );
  }
  if (medida.tituloCoberto.length > 0) {
    motivos.push(`${onde}: texto do título coberto por ${medida.tituloCoberto.join(', ')}`);
  }
  return motivos;
}

for (const alvo of ALVOS) {
  for (const largura of LARGURAS_PX) {
    for (const aberto of [true, false]) {
      const estado = aberto ? 'aberto' : 'minimizado';
      test(`${alvo.nome} · ${largura} px · cartão ${estado}: nenhum links do sumário nem rolagem cruza o texto`, async ({
        page
      }) => {
        test.setTimeout(240_000);
        await prepararPagina(page, alvo.caminho, largura, true);
        await definirEstadoDoCartao(page, aberto);

        const links = page.getByRole('navigation', { name: alvo.nomeDoSumario }).getByRole('link');
        await links.first().waitFor({ state: 'visible' });
        const total = await links.count();
        expect(total, `sumário "${alvo.nomeDoSumario}" sem links`).toBeGreaterThan(0);

        const falhas: string[] = [];
        for (let i = 0; i < total; i += 1) {
          const link = links.nth(i);
          const href = (await link.getAttribute('href')) ?? '';
          await link.click();
          await expect.poll(() => new URL(page.url()).hash).toBe(href);
          await esperarRolagemParar(page);
          const medida = await medirCartao(page, alvo, href.slice(1));
          falhas.push(...motivosDeReprovacao(medida, `link ${i + 1} ${href}`));
        }

        for (const posicao of ['topo', 'meio', 'fim'] as const) {
          await page.evaluate((pos: 'topo' | 'meio' | 'fim') => {
            const maximo = document.documentElement.scrollHeight - window.innerHeight;
            const y = pos === 'topo' ? 0 : pos === 'meio' ? Math.floor(maximo / 2) : maximo;
            window.scrollTo({ top: y, behavior: 'instant' });
          }, posicao);
          await esperarRolagemParar(page);
          const medida = await medirCartao(page, alvo, null);
          falhas.push(...motivosDeReprovacao(medida, `rolagem ao ${posicao}`));
        }

        expect(falhas, falhas.join('\n')).toEqual([]);
      });
    }
  }
}

test.describe('cartão de prova: estrutura entre os modos', () => {
  test('no modo adaptado o cartão sai da pilha inferior e fica dentro da coluna de conteúdo', async ({
    page
  }) => {
    await prepararPagina(page, RESUMO.caminho, 1280, true);
    const medida = await medirCartao(page, RESUMO, null);
    expect(medida.cartaoEmMain, 'cartão fora de <main>').toBe(true);
    expect(medida.cartaoNaPilha, 'cartão ainda na pilha inferior').toBe(false);
  });

  test('fora do modo adaptado o cartão continua na pilha inferior (nada muda)', async ({
    page
  }) => {
    await prepararPagina(page, RESUMO.caminho, 1280, false);
    const medida = await medirCartao(page, RESUMO, null);
    expect(medida.cartaoNaPilha, 'cartão saiu da pilha inferior fora do modo adaptado').toBe(true);
    expect(medida.cartaoEmMain).toBe(false);
  });

  for (const alvo of ALVOS) {
    test(`${alvo.nome} · 360 px adaptado: sem violação grave de acessibilidade com o cartão no conteúdo`, async ({
      page
    }) => {
      await prepararPagina(page, alvo.caminho, 360, true);
      const resultado = await new AxeBuilder({ page }).analyze();
      const graves = resultado.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(
        graves.map((v) => `${v.id} (${v.impact}): ${v.help}`),
        'violações graves com o cartão no conteúdo'
      ).toEqual([]);
    });
  }
});
