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
 * Falhas de produto já catalogadas (TODO.md, INBOX). Cada grupo é um ID com uma
 * largura e um modo, e a lista exata das rotas que o mapa vermelho do M0 mediu
 * (relatório do M0, camada 2, base b1 = 810d537). O E2E-G1-320 (55 casos a
 * 320 px) saiu desta lista na F1 (21ddb0c, vermelho; 5fa7133, conserto). Por
 * projeto, ficam marcados 162 + 12 = 174 casos. Só essas combinações recebem
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

const FALHAS_CONHECIDAS: readonly GrupoDeFalha[] = [
  {
    id: 'E2E-G1A-ADAPTADO',
    largura: 360,
    modoAdaptado: true,
    motivo: 'modo adaptado: título fora da primeira tela (E2E-G1A-ADAPTADO)',
    rotas: [
      '/p/p1/filosofia-juridica/u1',
      '/p/p1/filosofia-juridica/u1/fichamento',
      '/p/p1/filosofia-juridica/u1/mapa',
      '/p/p1/filosofia-juridica/u1/mnemonicos',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial/fichamento',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial/mapa',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial/mnemonicos',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/fichamento',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/mapa',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/mnemonicos',
      '/p/p1/intr-direito/u1',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/fichamento',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/mapa',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/mnemonicos',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/texto',
      '/p/p1/intr-direito/u3-livro-teoria-pura',
      '/p/p1/intr-direito/u3-livro-teoria-pura/fichamento',
      '/p/p1/intr-direito/u3-livro-teoria-pura/mapa',
      '/p/p1/intr-direito/u3-livro-teoria-pura/mnemonicos',
      '/p/p1/intr-direito/u3-livro-teoria-pura/texto',
      '/p/p1/intr-direito/u3-livro-textura-aberta',
      '/p/p1/intr-direito/u3-livro-textura-aberta/fichamento',
      '/p/p1/intr-direito/u3-livro-textura-aberta/mapa',
      '/p/p1/intr-direito/u3-livro-textura-aberta/mnemonicos',
      '/p/p1/intr-direito/u3-livro-textura-aberta/texto',
      '/p/p1/intr-direito/u3-material-danos-morais',
      '/p/p1/intr-direito/u3-material-danos-morais/fichamento',
      '/p/p1/intr-direito/u3-material-danos-morais/mapa',
      '/p/p1/intr-direito/u3-material-danos-morais/mnemonicos',
      '/p/p1/intr-direito/u3-material-norma-interpretacao',
      '/p/p1/intr-direito/u3-material-norma-interpretacao/fichamento',
      '/p/p1/intr-direito/u3-material-norma-interpretacao/mapa',
      '/p/p1/intr-direito/u3-material-norma-interpretacao/mnemonicos',
      '/p/p1/redacao-juridica-1/u1',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/fichamento',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/mapa',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/mnemonicos',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/fichamento',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/mapa',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/mnemonicos',
      '/p/p1/sociologia-juridica/u1',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital/fichamento',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital/mapa',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital/mnemonicos',
      '/p/p1/sociologia-juridica/u3-eca-digital',
      '/p/p1/sociologia-juridica/u3-eca-digital/fichamento',
      '/p/p1/sociologia-juridica/u3-eca-digital/mapa',
      '/p/p1/sociologia-juridica/u3-eca-digital/mnemonicos',
      '/p/p1/sociologia-juridica/u3-eca-digital/texto'
    ]
  },
  {
    id: 'E2E-G1A-ADAPTADO',
    largura: 412,
    modoAdaptado: true,
    motivo: 'modo adaptado: título fora da primeira tela (E2E-G1A-ADAPTADO)',
    rotas: [
      '/p/p1/filosofia-juridica/u1',
      '/p/p1/filosofia-juridica/u1/fichamento',
      '/p/p1/filosofia-juridica/u1/mapa',
      '/p/p1/filosofia-juridica/u1/mnemonicos',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial/fichamento',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial/mapa',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial/mnemonicos',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/fichamento',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/mapa',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/mnemonicos',
      '/p/p1/intr-direito/u1',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/fichamento',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/mapa',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/mnemonicos',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/texto',
      '/p/p1/intr-direito/u3-livro-teoria-pura',
      '/p/p1/intr-direito/u3-livro-teoria-pura/fichamento',
      '/p/p1/intr-direito/u3-livro-teoria-pura/mapa',
      '/p/p1/intr-direito/u3-livro-teoria-pura/mnemonicos',
      '/p/p1/intr-direito/u3-livro-teoria-pura/texto',
      '/p/p1/intr-direito/u3-livro-textura-aberta',
      '/p/p1/intr-direito/u3-livro-textura-aberta/fichamento',
      '/p/p1/intr-direito/u3-livro-textura-aberta/mapa',
      '/p/p1/intr-direito/u3-livro-textura-aberta/mnemonicos',
      '/p/p1/intr-direito/u3-livro-textura-aberta/texto',
      '/p/p1/intr-direito/u3-material-danos-morais',
      '/p/p1/intr-direito/u3-material-danos-morais/fichamento',
      '/p/p1/intr-direito/u3-material-danos-morais/mapa',
      '/p/p1/intr-direito/u3-material-danos-morais/mnemonicos',
      '/p/p1/intr-direito/u3-material-norma-interpretacao',
      '/p/p1/intr-direito/u3-material-norma-interpretacao/fichamento',
      '/p/p1/intr-direito/u3-material-norma-interpretacao/mapa',
      '/p/p1/intr-direito/u3-material-norma-interpretacao/mnemonicos',
      '/p/p1/redacao-juridica-1/u1',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/fichamento',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/mapa',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/mnemonicos',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/fichamento',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/mapa',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/mnemonicos',
      '/p/p1/sociologia-juridica/u1',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital/fichamento',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital/mapa',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital/mnemonicos',
      '/p/p1/sociologia-juridica/u3-eca-digital',
      '/p/p1/sociologia-juridica/u3-eca-digital/fichamento',
      '/p/p1/sociologia-juridica/u3-eca-digital/mapa',
      '/p/p1/sociologia-juridica/u3-eca-digital/mnemonicos',
      '/p/p1/sociologia-juridica/u3-eca-digital/texto'
    ]
  },
  {
    id: 'E2E-G1A-ADAPTADO',
    largura: 768,
    modoAdaptado: true,
    motivo: 'modo adaptado: título fora da primeira tela (E2E-G1A-ADAPTADO)',
    rotas: [
      '/p/p1/filosofia-juridica/u1/fichamento',
      '/p/p1/filosofia-juridica/u1/mapa',
      '/p/p1/filosofia-juridica/u1/mnemonicos',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial/fichamento',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial/mapa',
      '/p/p1/filosofia-juridica/u3-decisao-perspectiva-racial/mnemonicos',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/fichamento',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/mapa',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/mnemonicos',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/fichamento',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/mapa',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/mnemonicos',
      '/p/p1/intr-direito/u3-livro-regras-primarias-secundarias/texto',
      '/p/p1/intr-direito/u3-livro-teoria-pura',
      '/p/p1/intr-direito/u3-livro-teoria-pura/fichamento',
      '/p/p1/intr-direito/u3-livro-teoria-pura/mapa',
      '/p/p1/intr-direito/u3-livro-teoria-pura/mnemonicos',
      '/p/p1/intr-direito/u3-livro-teoria-pura/texto',
      '/p/p1/intr-direito/u3-livro-textura-aberta',
      '/p/p1/intr-direito/u3-livro-textura-aberta/fichamento',
      '/p/p1/intr-direito/u3-livro-textura-aberta/mapa',
      '/p/p1/intr-direito/u3-livro-textura-aberta/mnemonicos',
      '/p/p1/intr-direito/u3-livro-textura-aberta/texto',
      '/p/p1/intr-direito/u3-material-danos-morais',
      '/p/p1/intr-direito/u3-material-danos-morais/fichamento',
      '/p/p1/intr-direito/u3-material-danos-morais/mapa',
      '/p/p1/intr-direito/u3-material-danos-morais/mnemonicos',
      '/p/p1/intr-direito/u3-material-norma-interpretacao',
      '/p/p1/intr-direito/u3-material-norma-interpretacao/fichamento',
      '/p/p1/intr-direito/u3-material-norma-interpretacao/mapa',
      '/p/p1/intr-direito/u3-material-norma-interpretacao/mnemonicos',
      '/p/p1/redacao-juridica-1/u1',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/fichamento',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/mapa',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/mnemonicos',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/fichamento',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/mapa',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/mnemonicos',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital/fichamento',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital/mapa',
      '/p/p1/sociologia-juridica/u3-artigos-infancia-digital/mnemonicos',
      '/p/p1/sociologia-juridica/u3-eca-digital',
      '/p/p1/sociologia-juridica/u3-eca-digital/fichamento',
      '/p/p1/sociologia-juridica/u3-eca-digital/mapa',
      '/p/p1/sociologia-juridica/u3-eca-digital/mnemonicos',
      '/p/p1/sociologia-juridica/u3-eca-digital/texto'
    ]
  },
  {
    id: 'E2E-ADAPTADO-FIXO-1280',
    largura: 1280,
    modoAdaptado: true,
    motivo: 'modo adaptado a 1280px: cabeçalho fixo acima de 256px (E2E-ADAPTADO-FIXO-1280)',
    rotas: [
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/fichamento',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/mapa',
      '/p/p1/filosofia-juridica/u3-moderna-contemporanea/mnemonicos',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/fichamento',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/mapa',
      '/p/p1/redacao-juridica-1/u3-material-caso-geladeira/mnemonicos',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/fichamento',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/mapa',
      '/p/p1/redacao-juridica-1/u3-material-peticao-consumidor/mnemonicos'
    ]
  }
];

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
