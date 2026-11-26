import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * LU-F5.1-N1, cartão "Faltam N dias" no modo normal (fora do modo adaptado). O cartão fica na pilha
 * inferior e flutua sobre a página. O critério (OS-1, 25/11/2026, decisão do líder "Aceitar (Recomendado)")
 * são três verificações, nas larguras 320, 360, 768 e 1280 px, em duas páginas (Resumo e Petição):
 *
 *  (a) com a página no topo, o cartão não cobre o h1 do conteúdo;
 *  (b) percorrendo a página com Tab, cada foco é medido com a pilha de volta e assentada (ela some ao rolar,
 *      pelo useEsconderAoRolar, e volta com transição). A área livre é a faixa do fundo do cabeçalho fixo até
 *      o topo do cartão, com a altura de repouso do cabeçalho. Três casos:
 *      - o foco cabe na área livre: nenhuma parte dele pode ficar sob o cartão;
 *      - o foco é mais alto que a área livre: o topo dele e o contorno de cima ficam visíveis acima do cartão;
 *      - o foco fica totalmente coberto pelo cartão: reprova sempre.
 *  (c) com a página no fim, nenhum bloco de texto nem link do conteúdo fica coberto pelo cartão.
 *
 * Cada medida tem guardas contra o vazio: sem h1, sem alvo de foco, sem bloco medido, ou com o cartão
 * fora da janela, o teste reprova em vez de passar em branco. A data é fixada só para o cartão ter
 * contagem; os timers seguem rodando.
 */

const DATA_FIXA = '2026-11-14T12:00:00-03:00';
const ALTURA_PX = 800;
const LARGURAS_PX = [320, 360, 768, 1280] as const;
const TOLERANCIA_PX = 0.5;
const LIMITE_DE_TABS = 150;
const MINIMO_DE_FOCOS = 5;

const PAGINAS = [
  { nome: 'Resumo', caminho: '/p/p1/intr-direito/u3-material-norma-interpretacao' },
  { nome: 'Petição', caminho: '/p/p1/intr-direito/u3-material-danos-morais/peticao' }
] as const;

/** Resultado de uma medida: `cobertos` lista cada motivo de reprovação; `alvos` conta o que foi medido. */
interface Medida {
  cartaoVisivel: boolean;
  cartaoNaTela: boolean;
  alvos: number;
  cobertos: string[];
}

interface Foco {
  id: string;
  nome: string;
  dentroDoCartao: boolean;
  cartaoNaTela: boolean;
  cobertura: 'nenhuma' | 'parcial' | 'total';
  caso: 'cabe' | 'mais-alto';
  alturaDoFoco: number;
  topoLivre: number;
  topoDoCartao: number;
  topoVisivel: boolean;
  recuoDeBaixo: string;
}

async function prepararPagina(page: Page, caminho: string, largura: number): Promise<void> {
  await page.clock.setFixedTime(new Date(DATA_FIXA));
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.setViewportSize({ width: largura, height: ALTURA_PX });
  await page.goto(caminho);
  await expect(page.locator('aside.quadro-prova')).toBeVisible();
  await esperarLayoutAssentar(page, { doTopo: true });
}

/** Espera a rolagem parar: quadros seguidos sem mudar scrollY. Condição, não tempo fixo. */
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
 * Espera a pilha voltar e assentar. Depois de rolar, a pilha se esconde e volta só após ESPERA_PARADO_MS
 * sem rolagem. Ela volta com transição (transform e visibility, 150 ms): a classe sair não basta, então
 * depois da classe sai espera-se toda animação finita terminar (esperarLayoutAssentar). Medir antes
 * disso daria um cartão ainda no caminho, e a medida passaria vazia.
 */
async function esperarPilhaVisivel(page: Page): Promise<void> {
  await page.waitForFunction(
    () => !document.querySelector('.layout-base__inferior--escondida'),
    undefined,
    {
      timeout: 5000
    }
  );
  await esperarLayoutAssentar(page);
}

/** Mede o cartão contra o h1 do conteúdo, com a página no topo (verificação a). */
async function medirTopo(page: Page): Promise<Medida> {
  await esperarRolagemParar(page);
  await esperarPilhaVisivel(page);
  return page.evaluate((tolerancia: number) => {
    const cartao = document.querySelector<HTMLElement>('aside.quadro-prova');
    const h1 = document.querySelector<HTMLElement>('#conteudo-principal h1');
    if (!cartao || !h1)
      return { cartaoVisivel: false, cartaoNaTela: false, alvos: 0, cobertos: [] };
    const c = cartao.getBoundingClientRect();
    const h = h1.getBoundingClientRect();
    const cruza =
      Math.min(c.right, h.right) - Math.max(c.left, h.left) > tolerancia &&
      Math.min(c.bottom, h.bottom) - Math.max(c.top, h.top) > tolerancia;
    const titulo = (h1.textContent ?? '').trim().slice(0, 60);
    return {
      cartaoVisivel:
        c.width > 0 && c.height > 0 && getComputedStyle(cartao).visibility === 'visible',
      cartaoNaTela: c.top >= -tolerancia && c.bottom <= window.innerHeight + tolerancia,
      alvos: h1.getClientRects().length > 0 ? 1 : 0,
      cobertos: cruza ? [`h1 "${titulo}"`] : []
    };
  }, TOLERANCIA_PX);
}

/** Leva a página ao fim, espera a pilha assentar e mede cada bloco de texto do conteúdo (verificação c). */
async function medirFim(page: Page): Promise<Medida> {
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
  );
  await esperarRolagemParar(page);
  await esperarPilhaVisivel(page);
  return page.evaluate((tolerancia: number) => {
    const cartao = document.querySelector<HTMLElement>('aside.quadro-prova');
    const main = document.getElementById('conteudo-principal');
    if (!cartao || !main)
      return { cartaoVisivel: false, cartaoNaTela: false, alvos: 0, cobertos: [] };
    const seletor = 'p, li, h1, h2, h3, h4, td, th, blockquote, figcaption, dt, dd, a, button';
    const c = cartao.getBoundingClientRect();
    const blocos = Array.from(main.querySelectorAll<HTMLElement>(seletor)).filter(
      (el) =>
        !cartao.contains(el) &&
        !el.parentElement?.closest(seletor) &&
        el.getClientRects().length > 0 &&
        (el.textContent ?? '').trim().length > 0
    );
    const cobertos = blocos
      .filter((el) => {
        const b = el.getBoundingClientRect();
        return (
          Math.min(c.right, b.right) - Math.max(c.left, b.left) > tolerancia &&
          Math.min(c.bottom, b.bottom) - Math.max(c.top, b.top) > tolerancia
        );
      })
      .map((el) => `<${el.tagName.toLowerCase()}> "${(el.textContent ?? '').trim().slice(0, 60)}"`);
    return {
      cartaoVisivel:
        c.width > 0 && c.height > 0 && getComputedStyle(cartao).visibility === 'visible',
      cartaoNaTela: c.top >= -tolerancia && c.bottom <= window.innerHeight + tolerancia,
      alvos: blocos.length,
      cobertos
    };
  }, TOLERANCIA_PX);
}

/**
 * Lê o elemento focado e o compara com a área livre acima do cartão (verificação b). A área livre vai do
 * fundo do cabeçalho fixo ao topo do cartão e é medida junto com o foco. Também devolve o recuo de rolagem
 * de baixo que a página publica (scroll-padding-bottom), para o relato de uma reprovação.
 */
async function medirFoco(page: Page): Promise<Foco | null> {
  return page.evaluate((tolerancia: number) => {
    const ativo = document.activeElement as HTMLElement | null;
    if (!ativo || ativo === document.body) return null;
    const caminho = (el: HTMLElement): string => {
      const partes: string[] = [];
      let no: HTMLElement | null = el;
      while (no && no !== document.body) {
        const pai: HTMLElement | null = no.parentElement;
        const indice = pai ? Array.from(pai.children).indexOf(no) : 0;
        partes.unshift(`${no.tagName}[${indice}]`);
        no = pai;
      }
      return partes.join('/');
    };
    const nome = `${ativo.tagName.toLowerCase()} "${(
      ativo.textContent ??
      ativo.getAttribute('aria-label') ??
      ''
    )
      .trim()
      .slice(0, 50)}"`;
    const r = ativo.getBoundingClientRect();
    const cabecalho = document.querySelector<HTMLElement>('header.barra-topo');
    // Altura de repouso do cabeçalho (offsetHeight): ele some ao descer e volta ao subir.
    const topoLivre = cabecalho?.offsetHeight ?? 0;
    const base = {
      id: caminho(ativo),
      nome,
      alturaDoFoco: Math.round(r.height),
      topoLivre,
      recuoDeBaixo: getComputedStyle(document.documentElement).scrollPaddingBottom
    };
    const cartao = document.querySelector<HTMLElement>('aside.quadro-prova');
    if (!cartao) {
      return {
        ...base,
        dentroDoCartao: false,
        cartaoNaTela: false,
        cobertura: 'nenhuma' as const,
        caso: 'cabe' as const,
        topoDoCartao: 0,
        topoVisivel: true
      };
    }
    const c = cartao.getBoundingClientRect();
    const estilo = getComputedStyle(ativo);
    const contorno =
      estilo.outlineStyle === 'none'
        ? 0
        : parseFloat(estilo.outlineWidth) + parseFloat(estilo.outlineOffset);
    const dados = {
      ...base,
      cartaoNaTela: c.top >= -tolerancia && c.bottom <= window.innerHeight + tolerancia,
      topoDoCartao: Math.round(c.top),
      caso: r.height <= c.top - topoLivre + tolerancia ? ('cabe' as const) : ('mais-alto' as const),
      topoVisivel: r.top - contorno >= topoLivre - tolerancia && r.top <= c.top - tolerancia
    };
    if (cartao.contains(ativo))
      return { ...dados, dentroDoCartao: true, cobertura: 'nenhuma' as const };
    const cruza =
      Math.min(c.right, r.right) - Math.max(c.left, r.left) > tolerancia &&
      Math.min(c.bottom, r.bottom) - Math.max(c.top, r.top) > tolerancia;
    if (!cruza) return { ...dados, dentroDoCartao: false, cobertura: 'nenhuma' as const };
    const total =
      r.left >= c.left - tolerancia &&
      r.right <= c.right + tolerancia &&
      r.top >= c.top - tolerancia &&
      r.bottom <= c.bottom + tolerancia;
    return {
      ...dados,
      dentroDoCartao: false,
      cobertura: total ? ('total' as const) : ('parcial' as const)
    };
  }, TOLERANCIA_PX);
}

for (const pagina of PAGINAS) {
  for (const largura of LARGURAS_PX) {
    test.describe(`${pagina.nome} · ${largura} px · normal`, () => {
      test.setTimeout(600_000);

      test('(a) com a página no topo, o cartão não cobre o h1', async ({ page }) => {
        await prepararPagina(page, pagina.caminho, largura);
        const medida = await medirTopo(page);

        expect(medida.cartaoVisivel, 'cartão não visível na medida').toBe(true);
        expect(medida.cartaoNaTela, 'cartão fora da janela na medida').toBe(true);
        expect(medida.alvos, 'nenhum h1 no conteúdo para medir').toBeGreaterThan(0);
        expect(medida.cobertos, `o cartão cobre o h1: ${medida.cobertos.join(' | ')}`).toEqual([]);
      });

      test('(b) percorrendo com Tab, o foco cabe acima do cartão ou fica com o topo visível (WCAG 2.4.11)', async ({
        page
      }) => {
        await prepararPagina(page, pagina.caminho, largura);
        const primeiroId = { valor: '' };
        const focos: Foco[] = [];
        let tabs = 0;

        for (let i = 0; i < LIMITE_DE_TABS; i++) {
          await page.keyboard.press('Tab');
          tabs += 1;
          await esperarRolagemParar(page);
          await esperarPilhaVisivel(page);
          const foco = await medirFoco(page);
          if (!foco) break;
          if (primeiroId.valor === '') primeiroId.valor = foco.id;
          else if (foco.id === primeiroId.valor) break;
          if (!foco.dentroDoCartao) focos.push(foco);
        }

        const foraDaTela = focos.filter((f) => !f.cartaoNaTela).length;
        const totais = focos.filter((f) => f.cobertura === 'total');
        const cabeSobCartao = focos.filter((f) => f.caso === 'cabe' && f.cobertura === 'parcial');
        const topoEscondido = focos.filter((f) => f.caso === 'mais-alto' && !f.topoVisivel);
        const relato = (lista: Foco[]): string =>
          lista
            .map(
              (f) =>
                `${f.nome} (foco de ${f.alturaDoFoco}px; área livre de ${f.topoDoCartao - f.topoLivre}px; topo do cartão em ${f.topoDoCartao}px; scroll-padding-bottom ${f.recuoDeBaixo})`
            )
            .join(' | ');
        console.log(
          `MEDICAO ${pagina.nome} ${largura}px: ${JSON.stringify(focos.map((f) => [f.nome, f.caso, f.cobertura, f.topoVisivel, f.alturaDoFoco, f.topoDoCartao - f.topoLivre, f.recuoDeBaixo]))}`
        );

        expect(
          focos.length,
          `poucos alvos focados (${focos.length} em ${tabs} Tabs)`
        ).toBeGreaterThanOrEqual(MINIMO_DE_FOCOS);
        expect(foraDaTela, `${foraDaTela} medida(s) com o cartão fora da janela`).toBe(0);
        expect(
          totais.length,
          `${totais.length} foco(s) totalmente sob o cartão: ${relato(totais)}`
        ).toBe(0);
        expect(
          cabeSobCartao.length,
          `foco que cabe na área livre e fica sob o cartão: ${relato(cabeSobCartao)}`
        ).toBe(0);
        expect(
          topoEscondido.length,
          `foco mais alto que a área livre sem o topo visível acima do cartão: ${relato(topoEscondido)}`
        ).toBe(0);
      });

      test('(c) com a página no fim, nenhum bloco do conteúdo fica coberto pelo cartão', async ({
        page
      }) => {
        await prepararPagina(page, pagina.caminho, largura);
        const medida = await medirFim(page);

        expect(medida.cartaoVisivel, 'cartão não visível na medida').toBe(true);
        expect(medida.cartaoNaTela, 'cartão fora da janela na medida').toBe(true);
        expect(medida.alvos, 'nenhum bloco de texto medido no fim da página').toBeGreaterThan(0);
        expect(
          medida.cobertos,
          `o cartão cobre o conteúdo no fim: ${medida.cobertos.join(' | ')}`
        ).toEqual([]);
      });
    });
  }
}
