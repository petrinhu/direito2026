import { test, expect, type Page } from './apoio/sessaoDoEstudo';
import { calcularContraste } from '../../src/core/design/contraste';
import {
  caminhosParaCabecalho,
  esperarLayoutAssentar,
  prepararEstadoInicial
} from './apoio/estadoInicial';
import { curriculoDoDisco } from '../../scripts/apoio/conteudoDoDisco';

// Lido do disco: o glob do Vite não existe no Node que roda o Playwright.
const curriculo = await curriculoDoDisco();

/**
 * IMPORTANTE 1 do QA (docs/qa-sociologia-u1.md): em modo adaptado, a 360px,
 * o cabeçalho fixo tinha 433px (476 em Redação) contra os 220px que
 * `--altura-cabecalho` reservava, e cobria o título da página; e, ao rolar,
 * o fundo virava azul-marinho translúcido enquanto o texto da trilha
 * continuava preto (ilegível). Este arquivo mede as duas coisas no
 * navegador real (jsdom não faz layout):
 *
 * 1. no topo da página, o primeiro título (h1 ou h2 do conteúdo) começa
 *    abaixo do cabeçalho e aparece na primeira tela; se o cabeçalho for
 *    fixo, ocupa no máximo 40% da altura da janela (senão tem de sair do
 *    fluxo fixo);
 * 2. depois de rolar, todo texto do cabeçalho mantém contraste >= 7:1 contra
 *    o fundo REAL em que está (o do próprio elemento composto com os dos
 *    ancestrais), nunca contra "o fundo da página" em geral.
 */
const ALTURA_DA_JANELA = 640;
const LARGURA_MINIMA_DA_PRIMEIRA_TELA = 360;
const FRACAO_MAXIMA_DO_CABECALHO_FIXO = 0.4;
const CONTRASTE_MINIMO_MODO_ADAPTADO = 7;

interface MedidaTitulo {
  posicao: string;
  alturaCabecalho: number;
  fundoCabecalho: number;
  topoTitulo: number;
  titulo: string;
}

/**
 * Espera um título VISÍVEL do seletor. O `main` tem um h2 do calendário modal
 * (ModalCalendario.vue:88) que fica oculto dentro de um `<dialog>` fechado. O
 * `.first()` antigo pegava esse h2 oculto e esperava por ele até o timeout.
 */
async function esperarTituloVisivel(page: Page, seletor: string): Promise<void> {
  await page.waitForFunction(
    (s) =>
      Array.from(document.querySelectorAll<HTMLElement>(s)).some(
        (el) => el.getClientRects().length > 0
      ),
    seletor
  );
}

/**
 * Seletor do título que a regra mede. Na home, o título da página é o h1 da
 * fachada (`#titulo-caderno`, FachadaTemplo.vue:94), que fica fora do `main`:
 * a home mede esse h1, não o h2 "1º período" (decisão do CPO de 19/11/2026,
 * a ratificar pelo líder). Nas demais páginas, o título do conteúdo.
 */
function seletorDoTitulo(caminho: string): string {
  return caminho === '/' ? '#titulo-caderno' : 'main h1, main h2';
}

const LARGURAS_DO_CABECALHO = [320, 360, 412, 768, 1280];

/**
 * Falha de produto já conhecida (catálogo do TODO.md: E2E-G1-320 e
 * E2E-G1A-ADAPTADO). Cada entrada aponta UMA combinação rota × modo × largura
 * com medida. Só essa combinação recebe `test.fail()` e o ID no título: quando
 * o conserto chegar, o caso fica vermelho e a marca sai.
 *
 * Medidas: `/p/p1/intr-direito/u1`, modo normal, 320px, cabeçalho fixo de 266px
 * contra o teto de 256px (A3, relatorio.txt, item 1c). O modo adaptado a 360px
 * (E2E-G1A-ADAPTADO) não tem rota medida nesta lista e ainda não foi marcado.
 */
interface FalhaConhecida {
  id: string;
  caminho: string;
  modoAdaptado: boolean;
  largura: number;
  motivo: string;
}

const FALHAS_CONHECIDAS: readonly FalhaConhecida[] = [
  {
    id: 'E2E-G1-320',
    caminho: '/p/p1/intr-direito/u1',
    modoAdaptado: false,
    largura: 320,
    motivo: 'cabeçalho fixo de 266px contra o teto de 256px (E2E-G1-320)'
  }
];

function falhaConhecida(
  caminho: string,
  modoAdaptado: boolean,
  largura: number
): FalhaConhecida | undefined {
  return FALHAS_CONHECIDAS.find(
    (f) => f.caminho === caminho && f.modoAdaptado === modoAdaptado && f.largura === largura
  );
}

for (const caminho of caminhosParaCabecalho(curriculo)) {
  for (const modoAdaptado of [false, true]) {
    for (const largura of LARGURAS_DO_CABECALHO) {
      const rotuloModo = modoAdaptado ? 'modo adaptado' : 'modo normal';
      const falha = falhaConhecida(caminho, modoAdaptado, largura);
      const prefixo = falha ? `[${falha.id}] ` : '';
      test(`${prefixo}título de ${caminho} fica visível abaixo do cabeçalho, ${rotuloModo}, ${largura}px`, async ({
        page
      }) => {
        if (falha) test.fail(true, falha.motivo);
        await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado });
        await page.setViewportSize({ width: 1280, height: ALTURA_DA_JANELA });
        await page.goto(caminho);
        await esperarTituloVisivel(page, seletorDoTitulo(caminho));
        await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
        await esperarLayoutAssentar(page);
        const medida = await page.evaluate<MedidaTitulo, string>((seletor) => {
          const cabecalho = document.querySelector<HTMLElement>('.barra-topo')!;
          // O primeiro título com caixa de layout: o h2 oculto do modal não conta.
          const titulo = Array.from(document.querySelectorAll<HTMLElement>(seletor)).find(
            (el) => el.getClientRects().length > 0
          )!;
          const caixaCabecalho = cabecalho.getBoundingClientRect();
          return {
            posicao: getComputedStyle(cabecalho).position,
            alturaCabecalho: caixaCabecalho.height,
            fundoCabecalho: caixaCabecalho.bottom,
            topoTitulo: titulo.getBoundingClientRect().top,
            titulo: titulo.textContent?.trim().slice(0, 50) ?? ''
          };
        }, seletorDoTitulo(caminho));
        const rotulo = `${caminho}, ${rotuloModo}, ${largura}px (título "${medida.titulo}")`;
        expect(
          medida.topoTitulo,
          `${rotulo}: título começa abaixo do cabeçalho`
        ).toBeGreaterThanOrEqual(medida.fundoCabecalho - 0.5);
        // A 320px o critério do QA não pede primeira tela (só 360px foi
        // medido, 433px de cabeçalho): ali só vale "abaixo do cabeçalho".
        if (largura >= LARGURA_MINIMA_DA_PRIMEIRA_TELA) {
          expect(
            medida.topoTitulo,
            `${rotulo}: o título começa dentro da primeira tela`
          ).toBeLessThan(ALTURA_DA_JANELA);
        }
        if (medida.posicao === 'fixed') {
          expect(
            medida.alturaCabecalho,
            `${rotulo}: cabeçalho fixo ocupa ${medida.alturaCabecalho.toFixed(0)}px`
          ).toBeLessThanOrEqual(ALTURA_DA_JANELA * FRACAO_MAXIMA_DO_CABECALHO_FIXO);
        }
      });
    }
  }
}

interface TextoDoCabecalho {
  elemento: string;
  cor: string;
  fundo: string;
}

for (const largura of [360, 1280]) {
  test(`cabeçalho rolado, modo adaptado, ${largura}px: todo texto tem contraste >= 7:1 contra o fundo real`, async ({
    page
  }) => {
    await prepararEstadoInicial(page, { tema: 'escuro', modoAdaptado: true });
    await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
    await page.goto('/p/p1/sociologia-juridica/u1');
    await esperarTituloVisivel(page, 'main h1, main h2');
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(page.locator('.barra-topo')).toHaveClass(/barra-topo--rolado/);
    await esperarLayoutAssentar(page);

    const textos = await page.evaluate<TextoDoCabecalho[]>(() => {
      type Cor = { r: number; g: number; b: number; a: number };
      const ler = (css: string): Cor => {
        const numeros = (/\(([^)]+)\)/.exec(css)?.[1] ?? '0,0,0,0')
          .split(/[\s,/]+/)
          .filter(Boolean)
          .map(Number);
        return { r: numeros[0]!, g: numeros[1]!, b: numeros[2]!, a: numeros[3] ?? 1 };
      };
      const sobre = (frente: Cor, fundo: Cor): Cor => {
        const a = frente.a + fundo.a * (1 - frente.a);
        if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
        const mistura = (f: number, b: number): number =>
          (f * frente.a + b * fundo.a * (1 - frente.a)) / a;
        return {
          r: mistura(frente.r, fundo.r),
          g: mistura(frente.g, fundo.g),
          b: mistura(frente.b, fundo.b),
          a
        };
      };
      const hex = (c: Cor): string =>
        '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
      const fundoReal = (el: HTMLElement): Cor => {
        const camadas: Cor[] = [];
        for (let atual: HTMLElement | null = el; atual; atual = atual.parentElement) {
          camadas.push(ler(getComputedStyle(atual).backgroundColor));
        }
        let resultado: Cor = { r: 255, g: 255, b: 255, a: 1 };
        for (const camada of camadas.reverse()) resultado = sobre(camada, resultado);
        return resultado;
      };

      const cabecalho = document.querySelector<HTMLElement>('.barra-topo')!;
      const achados: Array<{ elemento: string; cor: string; fundo: string }> = [];
      for (const el of Array.from(cabecalho.querySelectorAll<HTMLElement>('*'))) {
        const temTexto = Array.from(el.childNodes).some(
          (no) => no.nodeType === window.Node.TEXT_NODE && (no.textContent ?? '').trim() !== ''
        );
        const ehCampo = el instanceof HTMLInputElement;
        if (!temTexto && !ehCampo) continue;
        const caixa = el.getBoundingClientRect();
        if (caixa.width <= 2 || caixa.height <= 2) continue;
        const fundo = fundoReal(el);
        const cor = sobre(ler(getComputedStyle(el).color), fundo);
        achados.push({
          elemento: `${el.tagName.toLowerCase()}.${el.className} "${(el.textContent ?? '').trim().slice(0, 24)}"`,
          cor: hex(cor),
          fundo: hex(fundo)
        });
      }
      return achados;
    });

    expect(textos.length, 'o cabeçalho tem texto medido').toBeGreaterThan(3);
    const abaixo = textos.filter(
      (t) => calcularContraste(t.cor, t.fundo) < CONTRASTE_MINIMO_MODO_ADAPTADO
    );
    expect(
      abaixo.map((t) => `${t.elemento}: ${t.cor} sobre ${t.fundo}`),
      `${largura}px, rolado`
    ).toEqual([]);
  });
}
