import type { Locator, Page } from '@playwright/test';
import { test, expect } from './apoio/sessaoDoEstudo';
import {
  prepararEstadoInicial,
  esperarLayoutAssentar,
  type EstadoInicial
} from './apoio/estadoInicial';

/**
 * Guarda do recuo da árvore do menu lateral (ordem do líder, 22/09/2026;
 * reforçada em AV3-F0d). Três medidas, nos três modos e em 1920, 1280 e 360 px:
 *
 * 1. Cadeia do caminho aberto (período, cadeira, unidade, Resumo e item do
 *    Resumo): cada nível começa pelo menos `minimo` px à direita do pai.
 * 2. Todo par pai-filho de TODOS os níveis abertos (a lista inteira do menu):
 *    o texto do filho começa pelo menos `minimo` px à direita do texto do pai.
 *    É o que pega a hierarquia invertida (QA b7ec9e30: filhos da aba Resumo
 *    antes do rótulo Resumo).
 * 3. O Quiz (sem triângulo) alinha com o Resumo, e todo triângulo fica à
 *    esquerda do texto da própria linha.
 *
 * Mínimo: 12 px nos modos normais, 6 px no modo adaptado (decisão do líder,
 * 13/11/2026: recuo menor no adaptado, mas sempre para dentro, nunca invertido).
 */
const ROTA = '/p/p1/intr-direito/u1';
const LARGURAS = [1920, 1280, 360] as const;
const ESTADOS: ReadonlyArray<{ rotulo: string; estado: EstadoInicial; minimo: number }> = [
  {
    rotulo: 'modo normal, tema escuro',
    estado: { tema: 'escuro', modoAdaptado: false },
    minimo: 12
  },
  {
    rotulo: 'modo normal, tema claro',
    estado: { tema: 'claro', modoAdaptado: false },
    minimo: 12
  },
  { rotulo: 'modo adaptado, tema claro', estado: { tema: 'claro', modoAdaptado: true }, minimo: 6 }
];

interface Medidas {
  periodo: { texto: number; seta: number };
  cadeira: { texto: number; seta: number };
  unidade: { texto: number; seta: number };
  resumo: { texto: number; seta: number };
  quiz: { texto: number };
  bloco: { texto: number };
}

interface ParRecuo {
  nivel: string;
  pai: string;
  filho: string;
  degrau: number;
}

async function abrirMenuAteAba(page: Page, largura: number, adaptado: boolean): Promise<void> {
  if (largura <= 880) {
    await page.locator('.barra-topo__botao-gaveta').click();
  }
  const menu = page.locator('nav[aria-label="Currículo"]');
  const abrir = async (seletor: string): Promise<void> => {
    const botao = menu.locator(seletor).first();
    await botao.waitFor({ state: 'visible' });
    if ((await botao.getAttribute('aria-expanded')) !== 'true') await botao.click();
  };
  await abrir('button[aria-controls="lista-p1"]');
  await abrir('button[aria-controls="lista-intr-direito"]');
  await abrir('button[aria-label="Mostrar submenu de AV1"]');
  if (adaptado) {
    // R-CPO-MENU-2: no adaptado o Resumo é link simples; o submenu de blocos sai do menu.
    await menu.locator('a.menu-curriculo__link-aba').first().waitFor({ state: 'visible' });
  } else {
    await abrir('button[aria-controls^="lista-resumo-"]');
    await menu.locator('[id^="lista-resumo-"] a').first().waitFor({ state: 'visible' });
  }
  await esperarLayoutAssentar(page);
}

/**
 * Abre todo botão de expandir visível, até não sobrar nenhum fechado. Não abre a
 * gaveta: quem chama já a abriu (em 360 px o botão dela alterna, não só abre).
 */
async function abrirTodoOMenu(page: Page): Promise<void> {
  const menu = page.locator('nav[aria-label="Currículo"]');
  for (let volta = 0; volta < 200; volta++) {
    const fechado: Locator = menu.locator('button[aria-expanded="false"]:visible').first();
    if ((await fechado.count()) === 0) break;
    await fechado.click();
  }
  await esperarLayoutAssentar(page);
}

async function medir(page: Page, adaptado: boolean): Promise<Medidas> {
  return page.evaluate((adaptadoNaPagina) => {
    const menu = document.querySelector('nav[aria-label="Currículo"]')!;
    /** Início do primeiro texto de `el` que não seja de um controle sem texto (seta). */
    const textoEsquerda = (el: globalThis.Element): number => {
      const percurso = document.createTreeWalker(el, window.NodeFilter.SHOW_TEXT);
      for (let no = percurso.nextNode(); no; no = percurso.nextNode()) {
        if ((no.textContent ?? '').trim() === '') continue;
        const faixa = document.createRange();
        faixa.selectNodeContents(no);
        return faixa.getBoundingClientRect().left;
      }
      throw new Error('sem texto em ' + el.outerHTML.slice(0, 80));
    };
    const seta = (el: globalThis.Element): number =>
      el.querySelector('.menu-curriculo__seta')!.getBoundingClientRect().right;
    const um = (seletor: string): globalThis.Element => {
      const el = menu.querySelector(seletor);
      if (!el) throw new Error('não achei ' + seletor);
      return el;
    };
    const periodo = um('button[aria-controls="lista-p1"]');
    const cadeira = um('button[aria-controls="lista-intr-direito"]');
    const linkUnidade = um(
      'a.menu-curriculo__link-unidade[href="' + window.location.pathname + '"]'
    );
    const toggle = um('button[aria-label="Mostrar submenu de AV1"]');
    // A aba Resumo tem dois alvos: a seta (botão sem texto) e o rótulo (link).
    // O helper pega o rótulo no link e a seta no botão, pulando o controle sem texto.
    const rotuloResumo = um('a.menu-curriculo__link-aba');
    const quiz = um('a[href$="/intr-direito/u1/quiz"]');
    if (adaptadoNaPagina) {
      // R-CPO-MENU-2: a aba Resumo é link simples (sem seta); não há bloco no menu.
      return {
        periodo: { texto: textoEsquerda(periodo), seta: seta(periodo) },
        cadeira: { texto: textoEsquerda(cadeira), seta: seta(cadeira) },
        unidade: { texto: textoEsquerda(linkUnidade), seta: seta(toggle) },
        resumo: { texto: textoEsquerda(rotuloResumo), seta: NaN },
        quiz: { texto: textoEsquerda(quiz) },
        bloco: { texto: NaN }
      };
    }
    const listaResumo = um('[id^="lista-resumo-"]');
    const linhaResumo = listaResumo.parentElement!;
    const rotuloResumoNormal = linhaResumo.querySelector('a.menu-curriculo__link-aba')!;
    const setaResumo = linhaResumo.querySelector('button.menu-curriculo__toggle--aba')!;
    const bloco = um('[id^="lista-resumo-"] a');
    return {
      periodo: { texto: textoEsquerda(periodo), seta: seta(periodo) },
      cadeira: { texto: textoEsquerda(cadeira), seta: seta(cadeira) },
      unidade: { texto: textoEsquerda(linkUnidade), seta: seta(toggle) },
      resumo: { texto: textoEsquerda(rotuloResumoNormal), seta: seta(setaResumo) },
      quiz: { texto: textoEsquerda(quiz) },
      bloco: { texto: textoEsquerda(bloco) }
    };
  }, adaptado);
}

/**
 * Cada par pai-filho de todas as listas visíveis do menu. O texto de um item é
 * o primeiro nó de texto cujo <li> mais próximo é o próprio item (assim o texto
 * de um filho não entra na conta do pai). Controles sem texto são pulados.
 */
async function paresDeRecuo(page: Page): Promise<ParRecuo[]> {
  return page.evaluate(() => {
    const gaveta = document.getElementById('gaveta-do-curriculo')!;
    const primeiroTexto = (li: globalThis.Element): { x: number; texto: string } | null => {
      const percurso = document.createTreeWalker(li, window.NodeFilter.SHOW_TEXT);
      for (let no = percurso.nextNode(); no; no = percurso.nextNode()) {
        const texto = (no.textContent ?? '').trim();
        if (texto === '' || no.parentElement?.closest('li') !== li) continue;
        const faixa = document.createRange();
        faixa.selectNodeContents(no);
        const r = faixa.getBoundingClientRect();
        if (r.width > 0) return { x: r.left, texto };
      }
      return null;
    };
    const pares: ParRecuo[] = [];
    for (const lista of Array.from(
      gaveta.querySelectorAll<HTMLElement>('ul[class*="menu-curriculo__nivel-"]')
    )) {
      const pai = lista.parentElement;
      if (!pai || pai.tagName !== 'LI' || lista.getClientRects().length === 0) continue;
      const nivel = /menu-curriculo__nivel-(\d)/.exec(lista.className)?.[1] ?? '?';
      const textoPai = primeiroTexto(pai);
      if (!textoPai) continue;
      for (const filho of Array.from(lista.children)) {
        if (filho.tagName !== 'LI' || filho.getClientRects().length === 0) continue;
        const textoFilho = primeiroTexto(filho);
        if (!textoFilho) continue;
        pares.push({
          nivel,
          pai: textoPai.texto.slice(0, 40),
          filho: textoFilho.texto.slice(0, 40),
          degrau: Math.round((textoFilho.x - textoPai.x) * 10) / 10
        });
      }
    }
    return pares;
  });
}

function resumirPorNivel(pares: ParRecuo[]): string {
  const grupos = new Map<string, number[]>();
  for (const p of pares) grupos.set(p.nivel, [...(grupos.get(p.nivel) ?? []), p.degrau]);
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nivel, degraus]) => {
      const ordenados = [...degraus].sort((x, y) => x - y);
      const mediana = ordenados[Math.floor(ordenados.length / 2)];
      return `nivel ${nivel} (lista): n=${degraus.length} min=${ordenados[0]} mediana=${mediana}`;
    })
    .join('; ');
}

for (const largura of LARGURAS) {
  for (const { rotulo, estado, minimo } of ESTADOS) {
    test(`menu lateral: recuo de pelo menos ${minimo}px entre pai e filho em todos os níveis, ${largura}px, ${rotulo}`, async ({
      page
    }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await prepararEstadoInicial(page, estado);
      await page.goto(ROTA);
      const adaptado = estado.modoAdaptado;
      await abrirMenuAteAba(page, largura, adaptado);
      const m = await medir(page, adaptado);

      // No adaptado o submenu de blocos sai do menu (R-CPO-MENU-2): a cadeia para na aba.
      const cadeia: Array<[string, number]> = adaptado
        ? [
            ['período', m.periodo.texto],
            ['cadeira', m.cadeira.texto],
            ['unidade', m.unidade.texto],
            ['aba (Resumo)', m.resumo.texto]
          ]
        : [
            ['período', m.periodo.texto],
            ['cadeira', m.cadeira.texto],
            ['unidade', m.unidade.texto],
            ['aba (Resumo)', m.resumo.texto],
            ['item do Resumo', m.bloco.texto]
          ];
      for (let i = 1; i < cadeia.length; i++) {
        const [nomePai, xPai] = cadeia[i - 1]!;
        const [nome, x] = cadeia[i]!;
        expect
          .soft(
            x - xPai,
            `${nome} (texto em x=${x.toFixed(1)}) deve começar pelo menos ${minimo}px à direita de ${nomePai} (x=${xPai.toFixed(1)})`
          )
          .toBeGreaterThanOrEqual(minimo);
      }

      expect
        .soft(
          Math.abs(m.quiz.texto - m.resumo.texto),
          `Quiz (sem triângulo) alinha com Resumo: quiz x=${m.quiz.texto.toFixed(1)}, Resumo x=${m.resumo.texto.toFixed(1)}`
        )
        .toBeLessThanOrEqual(1);

      const niveisComTriangulo = adaptado
        ? ([
            ['período', m.periodo],
            ['cadeira', m.cadeira],
            ['unidade', m.unidade]
          ] as const)
        : ([
            ['período', m.periodo],
            ['cadeira', m.cadeira],
            ['unidade', m.unidade],
            ['Resumo', m.resumo]
          ] as const);
      for (const [nome, nivel] of niveisComTriangulo) {
        expect
          .soft(nivel.seta, `triângulo de ${nome} deve ficar à esquerda do texto da própria linha`)
          .toBeLessThanOrEqual(nivel.texto);
      }

      await abrirTodoOMenu(page);
      const pares = await paresDeRecuo(page);
      console.log(`[recuo] ${rotulo}, ${largura}px: ${resumirPorNivel(pares)}`);
      expect(pares.length, 'o laço de pares precisa ter visto itens').toBeGreaterThan(0);
      const violacoes = pares
        .filter((p) => p.degrau < minimo)
        .map((p) => `[nível ${p.nivel}] "${p.pai}" -> "${p.filho}": ${p.degrau} px`);
      expect(violacoes, `pares pai-filho com recuo menor que ${minimo} px`).toEqual([]);
    });
  }
}
