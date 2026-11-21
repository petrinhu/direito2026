import { expect, test, type Page } from '@playwright/test';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * Rótulos da grade do /calendario no modo adaptado (CAL-ADAPTADO-ROTULOS). Com a fonte de 24px, o
 * rótulo de um evento não cabe numa célula estreita. Nenhum rótulo pode cortar (largura ou altura)
 * nem sair da caixa do evento, e a página não pode rolar de lado, em 360, 768, 1024 e 1280 px.
 *
 * Duas formas, pela largura da grade (não do viewport: a lateral muda a conta). Com a grade a partir
 * de 900 px, o título e o rótulo quebram nas palavras e a célula cresce. Abaixo disso, o evento mostra
 * um marcador (forma, não cor) e o nome completo fica no título, lido por leitor de tela, e na lista
 * de datas do mês.
 *
 * O relógio é fixado em 14/11/2026 (o cenário do QA). Só a data é fixada, os timers seguem rodando.
 */

const DATA_REFERENCIA = '2026-11-14T12:00:00-03:00';
const LARGURAS_PX = [360, 768, 1024, 1280] as const;
const LARGURA_GRADE_COM_TEXTO_PX = 900;
const TOLERANCIA_PX = 0.5;

interface Medida {
  larguraGrade: number;
  docLargura: number;
  docSemLados: number;
  eventos: number;
  cortes: string[];
  semRotulo: string[];
}

async function medirGrade(page: Page): Promise<Medida> {
  return page.evaluate(
    ({ tolerancia, larguraComTexto }) => {
      const grade = document.querySelector<HTMLElement>('.grade-calendario');
      if (!grade) throw new Error('sem .grade-calendario');
      const visivel = (el: HTMLElement): boolean => {
        const b = el.getBoundingClientRect();
        return b.width > 2 && b.height > 2;
      };
      const eventos = [...grade.querySelectorAll<HTMLElement>('.fc-event')].filter(visivel);
      const cortes: string[] = [];
      const semRotulo: string[] = [];
      type Caixa = { left: number; right: number; top: number; bottom: number };
      const dentro = (a: Caixa, b: Caixa): boolean =>
        a.left >= b.left - tolerancia &&
        a.right <= b.right + tolerancia &&
        a.top >= b.top - tolerancia &&
        a.bottom <= b.bottom + tolerancia;
      const larguraGrade = grade.clientWidth;
      const comTexto = larguraGrade >= larguraComTexto;

      for (const ev of eventos) {
        const caixa = ev.getBoundingClientRect();
        const barra = ev.classList.contains('cal-evento--barra');
        const celula = ev.closest('td.fc-daygrid-day')?.getBoundingClientRect();
        if (!barra && celula && !dentro(caixa, celula)) {
          cortes.push(`evento fora da célula: "${ev.textContent?.trim()}"`);
        }
        const rotulo = ev.querySelector<HTMLElement>('.cal-evento__rotulo');
        const titulo = ev.querySelector<HTMLElement>('.cal-evento__titulo');
        for (const el of [titulo, rotulo]) {
          if (!el || !visivel(el)) continue;
          const nome = `${el.className} "${el.textContent?.trim()}"`;
          if (el.scrollWidth > el.clientWidth + tolerancia)
            cortes.push(`corta na largura: ${nome}`);
          if (el.scrollHeight > el.clientHeight + tolerancia)
            cortes.push(`corta na altura: ${nome}`);
          if (!dentro(el.getBoundingClientRect(), caixa)) cortes.push(`invade o evento: ${nome}`);
        }
        if (comTexto) {
          if (!rotulo || !visivel(rotulo))
            semRotulo.push(`sem rótulo visível: "${ev.textContent?.trim()}"`);
        } else {
          const antes = getComputedStyle(ev, '::before');
          const marcado =
            antes.content !== 'none' && antes.display !== 'none' && parseFloat(antes.width) > 0;
          if (!marcado) semRotulo.push(`sem marcador: "${ev.textContent?.trim()}"`);
        }
      }

      for (let i = 0; i < eventos.length; i++) {
        for (let j = i + 1; j < eventos.length; j++) {
          const a = eventos[i]!.getBoundingClientRect();
          const b = eventos[j]!.getBoundingClientRect();
          const largura = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const altura = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (largura > 1 && altura > 1) cortes.push('eventos sobrepostos');
        }
      }

      const raiz = document.documentElement;
      return {
        larguraGrade,
        docLargura: raiz.scrollWidth,
        docSemLados: raiz.clientWidth,
        eventos: eventos.length,
        cortes,
        semRotulo
      };
    },
    { tolerancia: TOLERANCIA_PX, larguraComTexto: LARGURA_GRADE_COM_TEXTO_PX }
  );
}

for (const largura of LARGURAS_PX) {
  test(`modo adaptado em ${largura}px: nenhum rótulo da grade corta nem invade a caixa, sem rolagem lateral`, async ({
    page
  }) => {
    await page.clock.setFixedTime(new Date(DATA_REFERENCIA));
    await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
    await page.setViewportSize({ width: largura, height: 800 });
    await page.goto('/calendario');
    await page.waitForSelector('.grade-calendario .fc-event');
    await page.evaluate(() => document.fonts.ready);
    await esperarLayoutAssentar(page);

    const medida = await medirGrade(page);

    expect(medida.eventos, 'a grade tem eventos para medir').toBeGreaterThan(0);
    expect(medida.docLargura, 'a página não rola de lado').toBeLessThanOrEqual(medida.docSemLados);
    expect(medida.cortes).toEqual([]);
    expect(medida.semRotulo).toEqual([]);
  });
}

/**
 * CAL-SEMANA-360. No modo adaptado, a 360px, os cabeçalhos dos dias ("dom.", "seg."...) se sobrepõem:
 * a grade tem uma coluna de ~44px e o texto está em 24px. Mede a caixa visível de cada cabeçalho (o
 * texto de fato, não a célula) e exige que nenhuma intersecte a vizinha. Confere também que são os sete
 * cabeçalhos, que cada um mostra algo e que tem nome acessível completo (aria-label), para o teste não
 * passar vazio se a grade sumir.
 */
test('modo adaptado em 360px: cabeçalhos dos dias da semana não se sobrepõem', async ({ page }) => {
  await page.clock.setFixedTime(new Date(DATA_REFERENCIA));
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: true });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/calendario');
  await page.waitForSelector('.grade-calendario .fc-col-header-cell-cushion');
  await page.evaluate(() => document.fonts.ready);
  await esperarLayoutAssentar(page);

  const medida = await page.evaluate((tolerancia) => {
    const cabecalhos = [
      ...document.querySelectorAll<HTMLElement>('.grade-calendario .fc-col-header-cell-cushion')
    ];
    const caixas = cabecalhos.map((el) => {
      const intervalo = document.createRange();
      intervalo.selectNodeContents(el);
      const b = intervalo.getBoundingClientRect();
      return {
        texto: el.textContent?.trim() ?? '',
        rotulo: el.getAttribute('aria-label')?.trim() ?? '',
        esq: b.left,
        dir: b.right,
        topo: b.top,
        base: b.bottom,
        largura: b.width,
        altura: b.height
      };
    });
    const pares: string[] = [];
    for (let i = 0; i < caixas.length; i++) {
      for (let j = i + 1; j < caixas.length; j++) {
        const a = caixas[i]!;
        const b = caixas[j]!;
        const largura = Math.min(a.dir, b.dir) - Math.max(a.esq, b.esq);
        const altura = Math.min(a.base, b.base) - Math.max(a.topo, b.topo);
        if (largura > tolerancia && altura > tolerancia) {
          pares.push(`"${a.texto}" sobrepõe "${b.texto}" (${largura.toFixed(1)}px)`);
        }
      }
    }
    return {
      quantos: caixas.length,
      semRotulo: caixas.filter((c) => c.rotulo === '').map((c) => c.texto),
      invisiveis: caixas.filter((c) => c.largura < 1 || c.altura < 1).map((c) => c.texto),
      pares
    };
  }, TOLERANCIA_PX);

  expect(medida.quantos, 'são os sete dias da semana').toBe(7);
  expect(medida.semRotulo, 'cada cabeçalho tem nome acessível').toEqual([]);
  expect(medida.invisiveis, 'cada cabeçalho aparece').toEqual([]);
  expect(medida.pares, 'nenhum cabeçalho sobrepõe o vizinho').toEqual([]);
});
