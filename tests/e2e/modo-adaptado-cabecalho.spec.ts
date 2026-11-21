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
 *    abaixo do cabeçalho, e a PRIMEIRA LINHA dele (topo mais altura de linha)
 *    cabe na primeira tela de 640 px (aceite A2 da onda, plano 3.1; antes
 *    deste spec só pedia o topo abaixo de 640, o que deixou passar o F5-01);
 *    se o cabeçalho for fixo, ocupa no máximo 40% da altura da janela (senão
 *    tem de sair do fluxo fixo);
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
  linhaTitulo: number;
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

// 340 e 348 são as bordas da faixa de 341 a 348 px (F1-b, D15): a regra vai até 348 px.
// 881 e 1024 px: modo adaptado acima de 880 px (E2E-ADAPTADO-FIXO-1280, F2c).
const LARGURAS_DO_CABECALHO = [320, 340, 341, 348, 349, 360, 412, 768, 881, 1024, 1280];

/**
 * Falhas de produto já catalogadas (TODO.md, INBOX). Cada grupo é um ID com uma
 * largura e um modo, e a lista exata das rotas que o mapa vermelho do M0 mediu
 * (relatório do M0, camada 2, base b1 = 810d537). O E2E-G1-320 (55 casos a
 * 320 px) saiu desta lista na F1 (21ddb0c, vermelho; 5fa7133, conserto). Por
 * projeto, não fica nenhum caso marcado (o E2E-G1A-ADAPTADO saiu no Ramo B da F2 e o E2E-ADAPTADO-FIXO-1280 na F2c). Só essas combinações recebem
 * `test.fail()` e o ID no título: quando o conserto chegar, o caso fica
 * vermelho e a marca sai. Qualquer vermelho fora desta lista é item novo da
 * INBOX, com marca própria (regra D5 do plano).
 */
interface GrupoDeFalha {
  id: string;
  largura: number;
  modoAdaptado: boolean;
  motivo: string;
  rotas: readonly string[];
}

const FALHAS_CONHECIDAS: readonly GrupoDeFalha[] = [];

function falhaConhecida(
  caminho: string,
  modoAdaptado: boolean,
  largura: number
): GrupoDeFalha | undefined {
  return FALHAS_CONHECIDAS.find(
    (g) => g.largura === largura && g.modoAdaptado === modoAdaptado && g.rotas.includes(caminho)
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
          // Altura de linha em px; se o line-height for "normal", cai na altura do título (mesmo critério da sonda reva2).
          const linha = parseFloat(getComputedStyle(titulo).lineHeight);
          return {
            posicao: getComputedStyle(cabecalho).position,
            alturaCabecalho: caixaCabecalho.height,
            fundoCabecalho: caixaCabecalho.bottom,
            topoTitulo: titulo.getBoundingClientRect().top,
            linhaTitulo: Number.isFinite(linha) ? linha : titulo.getBoundingClientRect().height,
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
            medida.topoTitulo + medida.linhaTitulo,
            `${rotulo}: a primeira linha do título termina na primeira tela (topo ${medida.topoTitulo.toFixed(1)} + linha ${medida.linhaTitulo.toFixed(1)})`
          ).toBeLessThanOrEqual(ALTURA_DA_JANELA);
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

/**
 * E2E-G1-320 no tema escuro (QA da F1, 20/11/2026): a 349 px o cabeçalho fixo do modo normal tinha
 * 265,8 px no escuro e 210,9 px no claro, então a borda medida no claro não vale no escuro. Mede só a
 * altura, no modo normal, nas bordas da regra e um passo fora de cada uma.
 */
const LARGURAS_DO_TEMA_ESCURO = [...new Set([348, 349, 351, 352])];

for (const caminho of caminhosParaCabecalho(curriculo)) {
  for (const largura of LARGURAS_DO_TEMA_ESCURO) {
    test(`cabeçalho fixo de ${caminho} cabe em 40% da janela, tema escuro, modo normal, ${largura}px`, async ({
      page
    }) => {
      await prepararEstadoInicial(page, { tema: 'escuro', modoAdaptado: false });
      await page.setViewportSize({ width: 1280, height: ALTURA_DA_JANELA });
      await page.goto(caminho);
      await esperarTituloVisivel(page, seletorDoTitulo(caminho));
      await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
      await esperarLayoutAssentar(page);
      const medida = await page.evaluate(() => {
        const cabecalho = document.querySelector<HTMLElement>('.barra-topo')!;
        return {
          tema: document.documentElement.getAttribute('data-theme'),
          posicao: getComputedStyle(cabecalho).position,
          altura: cabecalho.getBoundingClientRect().height
        };
      });
      expect(medida.tema, 'tema escuro aplicado').toBe('dark');
      expect(medida.posicao, 'cabeçalho do modo normal é fixo').toBe('fixed');
      expect(
        medida.altura,
        `${caminho}, tema escuro, ${largura}px: cabeçalho fixo ocupa ${medida.altura.toFixed(0)}px`
      ).toBeLessThanOrEqual(ALTURA_DA_JANELA * FRACAO_MAXIMA_DO_CABECALHO_FIXO);
    });
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
