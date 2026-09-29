import { test, expect } from '@playwright/test';
import { curriculo } from '../../src/conteudo/curriculo';
import { calcularContraste } from '../../src/core/design/contraste';
import {
  caminhosParaCabecalho,
  esperarLayoutAssentar,
  prepararEstadoInicial
} from './apoio/estadoInicial';

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

for (const caminho of caminhosParaCabecalho(curriculo)) {
  for (const modoAdaptado of [false, true]) {
    const rotuloModo = modoAdaptado ? 'modo adaptado' : 'modo normal';
    test(`título de ${caminho} fica visível abaixo do cabeçalho, ${rotuloModo}`, async ({
      page
    }) => {
      await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado });
      await page.setViewportSize({ width: 1280, height: ALTURA_DA_JANELA });
      await page.goto(caminho);
      await page.locator('main h1, main h2').first().waitFor({ state: 'visible' });
      for (const largura of [320, 360, 412, 768, 1280]) {
        await page.setViewportSize({ width: largura, height: ALTURA_DA_JANELA });
        await esperarLayoutAssentar(page);
        const medida = await page.evaluate<MedidaTitulo>(() => {
          const cabecalho = document.querySelector<HTMLElement>('.barra-topo')!;
          const titulo = document.querySelector<HTMLElement>('main h1, main h2')!;
          const caixaCabecalho = cabecalho.getBoundingClientRect();
          return {
            posicao: getComputedStyle(cabecalho).position,
            alturaCabecalho: caixaCabecalho.height,
            fundoCabecalho: caixaCabecalho.bottom,
            topoTitulo: titulo.getBoundingClientRect().top,
            titulo: titulo.textContent?.trim().slice(0, 50) ?? ''
          };
        });
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
      }
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
    await page.locator('main h1, main h2').first().waitFor({ state: 'visible' });
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
