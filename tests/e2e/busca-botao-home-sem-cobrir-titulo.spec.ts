import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * LU-F5.1-N1: na página de busca, o botão Home flutuante não cobre o título "Busca" nem o texto
 * dele, nos modos normal e adaptado, a 360 e a 412 px. O botão continua na tela e com alvo de 44 px.
 *
 * Causa medida: enquanto o índice da busca carrega, o campo mostra "Carregando índice de busca…"
 * dentro do cabeçalho, que cresce 86 px e empurra o h1 para baixo da pilha do Home. O teste segura o
 * download do índice para medir essa fase, e mede de novo depois que ele chega.
 */
const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const ALTURA_DA_JANELA = 640;
const ESTADOS_DE_BUSCA = [
  { nome: 'com resultados', caminho: '/busca?q=direito' },
  { nome: 'vazia', caminho: '/busca' }
] as const;
const LARGURAS = [360, 412] as const;
const MODOS = [
  { nome: 'normal', modoAdaptado: false },
  { nome: 'adaptado', modoAdaptado: true }
] as const;
const ALVO_MINIMO = 44;
const INDICE_DA_BUSCA = '**/assets/busca-indice.json';
const AVISO_CARREGANDO = '.campo-busca__carregando';

interface Caixa {
  esquerda: number;
  topo: number;
  direita: number;
  base: number;
}

interface MedidaBusca {
  janela: { largura: number; altura: number };
  botao: Caixa;
  botaoLargura: number;
  botaoAltura: number;
  h1: Caixa;
  textoH1: Caixa;
  pilhaEscondida: boolean;
}

function area(a: Caixa, b: Caixa): number {
  const largura = Math.min(a.direita, b.direita) - Math.max(a.esquerda, b.esquerda);
  const altura = Math.min(a.base, b.base) - Math.max(a.topo, b.topo);
  return largura > 0 && altura > 0 ? largura * altura : 0;
}

async function medirBusca(page: Page): Promise<MedidaBusca> {
  return page.evaluate(() => {
    const visivel = (el: HTMLElement): boolean => el.getClientRects().length > 0;
    const botao = document.querySelector<HTMLElement>('.layout-base__nav-home a.botao-home');
    const h1 = Array.from(document.querySelectorAll<HTMLElement>('main h1')).find(visivel);
    if (!botao || !h1) throw new Error('botão Home ou h1 ausente na página de busca');
    const caixaBotao = botao.getBoundingClientRect();
    const caixaH1 = h1.getBoundingClientRect();
    const texto = document.createRange();
    texto.selectNodeContents(h1);
    const caixaTexto = texto.getBoundingClientRect();
    const pilha = document.querySelector('.layout-base__inferior');
    const caixa = (r: { left: number; top: number; right: number; bottom: number }) => ({
      esquerda: r.left,
      topo: r.top,
      direita: r.right,
      base: r.bottom
    });
    return {
      janela: { largura: window.innerWidth, altura: window.innerHeight },
      botao: caixa(caixaBotao),
      botaoLargura: caixaBotao.width,
      botaoAltura: caixaBotao.height,
      h1: caixa(caixaH1),
      textoH1: caixa(caixaTexto),
      pilhaEscondida: pilha?.classList.contains('layout-base__inferior--escondida') ?? true
    };
  });
}

/** Segura o download do índice até `liberar()`, para a fase de carregamento durar o teste todo. */
async function segurarIndiceDaBusca(page: Page): Promise<() => void> {
  let liberar: () => void = () => undefined;
  const liberado = new Promise<void>((resolver) => {
    liberar = resolver;
  });
  await page.route(INDICE_DA_BUSCA, async (rota) => {
    await liberado;
    await rota.continue();
  });
  return () => liberar();
}

/**
 * No modo adaptado o Home está no fluxo, logo depois do cartão (ordem do CPO, 25/11/2026), e rola com a
 * página: pode ficar abaixo da primeira tela. Por isso só o modo normal (Home sticky) exige que ele esteja
 dentro da janela. Sobreposição com o título e alvo de 44 px valem nos dois modos.
 */
function conferir(medida: MedidaBusca, fase: string, modoAdaptado: boolean): void {
  expect(medida.pilhaEscondida, `${fase}: a pilha do Home não pode estar escondida`).toBe(false);
  expect(area(medida.botao, medida.h1), `${fase}: sobreposição do Home com a caixa do h1`).toBe(0);
  expect(
    area(medida.botao, medida.textoH1),
    `${fase}: sobreposição do Home com o texto do h1`
  ).toBe(0);
  expect(medida.botao.esquerda, `${fase}: Home fora da tela à esquerda`).toBeGreaterThanOrEqual(0);
  expect(medida.botao.direita, `${fase}: Home fora da tela à direita`).toBeLessThanOrEqual(
    medida.janela.largura
  );
  if (!modoAdaptado) {
    expect(medida.botao.topo, `${fase}: Home fora da tela em cima`).toBeGreaterThanOrEqual(0);
    expect(medida.botao.base, `${fase}: Home fora da tela embaixo`).toBeLessThanOrEqual(
      medida.janela.altura
    );
  }
  expect(medida.botaoLargura, `${fase}: largura do alvo do Home`).toBeGreaterThanOrEqual(
    ALVO_MINIMO
  );
  expect(medida.botaoAltura, `${fase}: altura do alvo do Home`).toBeGreaterThanOrEqual(ALVO_MINIMO);
}

for (const estado of ESTADOS_DE_BUSCA) {
  for (const modo of MODOS) {
    for (const largura of LARGURAS) {
      test(`botão Home não cobre o título nem o texto, ${estado.nome}, ${modo.nome}, ${largura}px`, async ({
        page
      }) => {
        await page.clock.setFixedTime(new Date(DATA_FIXA));
        await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: modo.modoAdaptado });
        await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
        const liberarIndice = await segurarIndiceDaBusca(page);
        try {
          await page.goto(estado.caminho);
          await page.locator('main h1').first().waitFor({ state: 'visible' });
          await page.locator(AVISO_CARREGANDO).waitFor({ state: 'visible' });
          await esperarLayoutAssentar(page);

          const durante = await medirBusca(page);
          test.info().annotations.push({
            type: 'medida-busca-carregando',
            description: JSON.stringify(durante)
          });
          conferir(durante, 'durante o carregamento do índice', modo.modoAdaptado);

          liberarIndice();
          await page.locator(AVISO_CARREGANDO).waitFor({ state: 'detached' });
          await esperarLayoutAssentar(page);

          const depois = await medirBusca(page);
          test.info().annotations.push({
            type: 'medida-busca-pronta',
            description: JSON.stringify(depois)
          });
          conferir(depois, 'depois do carregamento do índice', modo.modoAdaptado);
        } finally {
          liberarIndice();
        }
      });
    }
  }
}
