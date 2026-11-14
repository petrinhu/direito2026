import { expect, test, type Page } from '@playwright/test';
import { prepararEstadoInicial } from './apoio/estadoInicial';
import { prepararSessaoDoEstudo } from './apoio/sessaoDoEstudo';

/**
 * Chegada por sumário (AV3-P1S, reprovada no QA visual da base c9b2330): ao
 * clicar num link do sumário, o título da seção de destino tem de ficar
 * visível, abaixo do cabeçalho fixo e sem o balão de dispositivo por cima.
 * Vale para o sumário da Petição comentada e para o do Resumo, que usa o
 * mesmo mecanismo de âncora.
 *
 * Medida direta (não aparência): o topo do título contra a base do cabeçalho
 * visível, e a interseção do título com o balão quando ele está aberto. A folga
 * mínima de 8 px cobre fração de pixel sem deixar o título encostado no fio.
 */

const FOLGA_MINIMA_PX = 8;
const UNIDADE = '/p/p1/intr-direito/u3-material-danos-morais';

interface Casos {
  nome: string;
  largura: number;
  altura: number;
  tema: 'claro' | 'escuro';
  modoAdaptado: boolean;
}

const CASOS: readonly Casos[] = [
  { nome: '360 claro', largura: 360, altura: 640, tema: 'claro', modoAdaptado: false },
  { nome: '360 escuro', largura: 360, altura: 640, tema: 'escuro', modoAdaptado: false },
  { nome: '360 adaptado', largura: 360, altura: 640, tema: 'claro', modoAdaptado: true },
  { nome: '1280 claro', largura: 1280, altura: 800, tema: 'claro', modoAdaptado: false },
  { nome: '1280 escuro', largura: 1280, altura: 800, tema: 'escuro', modoAdaptado: false },
  { nome: '1280 adaptado', largura: 1280, altura: 800, tema: 'claro', modoAdaptado: true }
];

interface Chegada {
  alvo: string;
  folga: number;
  balaoAberto: boolean;
  balaoSobreTitulo: boolean;
  estiloBalao: string;
  existe: boolean;
}

/** Espera a rolagem parar (quadros seguidos sem mudar scrollY). */
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

async function medirChegada(page: Page, id: string): Promise<Chegada> {
  return page.evaluate((idAlvo) => {
    // A folga mede o topo da SEÇÃO (o alvo real da âncora): no Resumo o rótulo
    // "Bloco N" fica no topo da seção, acima do título, e pode ser o que se cobre.
    const secao = document.getElementById(idAlvo);
    const titulo = secao?.querySelector<HTMLElement>('h2, h3');
    const cabecalho = document.querySelector<HTMLElement>('header.barra-topo');
    const balao = document.getElementById('balao-dispositivo');
    const balaoAberto = balao?.matches(':popover-open') ?? false;
    const t = titulo?.getBoundingClientRect();
    const b = balaoAberto && balao ? balao.getBoundingClientRect() : undefined;
    const sobrepoe =
      !!t &&
      !!b &&
      !(b.bottom <= t.top || b.top >= t.bottom || b.right <= t.left || b.left >= t.right);
    const baseCabecalho = cabecalho?.getBoundingClientRect().bottom ?? Number.NaN;
    const topoSecao = secao?.getBoundingClientRect().top ?? Number.NaN;
    return {
      alvo: idAlvo,
      existe: !!secao && !!titulo,
      folga: topoSecao - baseCabecalho,
      balaoAberto,
      balaoSobreTitulo: sobrepoe,
      estiloBalao: balao?.getAttribute('style') ?? ''
    };
  }, id);
}

/**
 * Clica em cada link do sumário, na mesma página e em sequência (como uma
 * pessoa faria), e mede a chegada de cada um. Devolve só o que reprova.
 */
async function reprovacoesDoSumario(
  page: Page,
  nomeNav: string
): Promise<Array<Chegada & { motivo: string }>> {
  const links = page.getByRole('navigation', { name: nomeNav }).getByRole('link');
  // count() não espera: a página chega por import dinâmico, então espera o primeiro link.
  await links.first().waitFor({ state: 'visible' });
  const total = await links.count();
  expect(total, `sumário "${nomeNav}" sem links`).toBeGreaterThan(0);

  const reprovadas: Array<Chegada & { motivo: string }> = [];
  for (let i = 0; i < total; i += 1) {
    const link = links.nth(i);
    const href = (await link.getAttribute('href')) ?? '';
    await link.click();
    await esperarRolagemParar(page);
    // Os balões de hover abrem após um atraso curto (citacoes.ts, 120 ms).
    await page.waitForTimeout(400);
    const medida = await medirChegada(page, href.slice(1));
    if (!medida.existe) {
      reprovadas.push({ ...medida, motivo: 'alvo sem título' });
    } else if (!(medida.folga >= FOLGA_MINIMA_PX)) {
      reprovadas.push({ ...medida, motivo: `título ${medida.folga.toFixed(1)} px do cabeçalho` });
    } else if (medida.balaoSobreTitulo) {
      reprovadas.push({ ...medida, motivo: 'balão de dispositivo por cima do título' });
    }
  }
  return reprovadas;
}

for (const caso of CASOS) {
  test.describe(`chegada por sumário, ${caso.nome}`, () => {
    test.beforeEach(async ({ context, page }) => {
      await prepararSessaoDoEstudo(context);
      await prepararEstadoInicial(page, { tema: caso.tema, modoAdaptado: caso.modoAdaptado });
      await page.setViewportSize({ width: caso.largura, height: caso.altura });
    });

    test('Petição comentada: cada link leva a um título visível abaixo do cabeçalho', async ({
      page
    }) => {
      await page.goto(`${UNIDADE}/peticao`);
      const reprovadas = await reprovacoesDoSumario(page, 'Sumário da petição');
      expect(reprovadas, JSON.stringify(reprovadas, null, 2)).toEqual([]);
    });

    test('Resumo: cada link leva a um título visível abaixo do cabeçalho', async ({ page }) => {
      await page.goto(UNIDADE);
      const reprovadas = await reprovacoesDoSumario(page, 'Sumário do resumo');
      expect(reprovadas, JSON.stringify(reprovadas, null, 2)).toEqual([]);
    });

    if (caso.largura <= 640) {
      test('balão de hover em faixa estreita fica encaixado embaixo, não solto no ponteiro', async ({
        page
      }) => {
        await page.goto(`${UNIDADE}/peticao`);
        const citacao = page.locator('button[data-dispositivo]').first();
        await citacao.scrollIntoViewIfNeeded();
        await citacao.hover();
        await page.waitForTimeout(400);
        const medida = await page.evaluate(() => {
          const balao = document.getElementById('balao-dispositivo');
          const aberto = balao?.matches(':popover-open') ?? false;
          const r = balao?.getBoundingClientRect();
          return {
            aberto,
            base: r?.bottom ?? Number.NaN,
            alturaTela: window.innerHeight,
            estilo: balao?.getAttribute('style') ?? ''
          };
        });
        expect(medida.aberto, 'balão de hover não abriu').toBe(true);
        // Encaixado embaixo: a base do balão encosta na base da janela. Com a posição
        // inline de floating-ui (top/left) ele sai do lugar e a base não encosta.
        expect(medida.base, JSON.stringify(medida)).toBeGreaterThanOrEqual(medida.alturaTela - 1);
      });
    }
  });
}
