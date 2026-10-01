import { test, expect, type Page } from '@playwright/test';
import {
  prepararEstadoInicial,
  esperarLayoutAssentar,
  type EstadoInicial
} from './apoio/estadoInicial';

/**
 * Recuo da árvore do menu lateral (ordem do líder, 22/09/2026). Defeito
 * medido no Firefox a 1920px: nenhum nível tinha recuo e o triângulo da
 * unidade ficava à direita. Aqui se mede o início do TEXTO de cada nível com
 * o menu aberto até o nível de aba (período, cadeira, unidade, Resumo e um
 * item do Resumo): cada um começa pelo menos 12px à direita do pai, o Quiz
 * (sem triângulo) alinha com o Resumo, e todo triângulo fica à esquerda do
 * texto da própria linha. Não foi executado por quem o escreveu (L-50).
 */
const RECUO_MINIMO = 12;
const ROTA = '/p/p1/intr-direito/u1';

const ESTADOS: ReadonlyArray<{ rotulo: string; estado: EstadoInicial }> = [
  { rotulo: 'modo normal, tema escuro', estado: { tema: 'escuro', modoAdaptado: false } },
  { rotulo: 'modo normal, tema claro', estado: { tema: 'claro', modoAdaptado: false } },
  { rotulo: 'modo adaptado', estado: { tema: 'claro', modoAdaptado: true } }
];
const LARGURAS = [1920, 1280, 360] as const;

interface Medidas {
  periodo: { texto: number; seta: number };
  cadeira: { texto: number; seta: number };
  unidade: { texto: number; seta: number };
  resumo: { texto: number; seta: number };
  quiz: { texto: number };
  bloco: { texto: number };
}

async function abrirMenuAteAba(page: Page, largura: number): Promise<void> {
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
  await abrir('button[aria-label="Mostrar submenu de Unidade 1"]');
  await abrir('button[aria-controls^="lista-resumo-"]');
  await menu.locator('[id^="lista-resumo-"] a').first().waitFor({ state: 'visible' });
  await esperarLayoutAssentar(page);
}

async function medir(page: Page): Promise<Medidas> {
  return page.evaluate(() => {
    const menu = document.querySelector('nav[aria-label="Currículo"]')!;
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
    const toggle = um('button[aria-label="Mostrar submenu de Unidade 1"]');
    const resumo = um('button[aria-controls^="lista-resumo-"]');
    const quiz = um('a[href$="/intr-direito/u1/quiz"]');
    const bloco = um('[id^="lista-resumo-"] a');
    return {
      periodo: { texto: textoEsquerda(periodo), seta: seta(periodo) },
      cadeira: { texto: textoEsquerda(cadeira), seta: seta(cadeira) },
      unidade: { texto: textoEsquerda(linkUnidade), seta: seta(toggle) },
      resumo: { texto: textoEsquerda(resumo), seta: seta(resumo) },
      quiz: { texto: textoEsquerda(quiz) },
      bloco: { texto: textoEsquerda(bloco) }
    };
  });
}

for (const largura of LARGURAS) {
  for (const { rotulo, estado } of ESTADOS) {
    test(`menu lateral: recuo de pelo menos ${RECUO_MINIMO}px por nível e triângulo à esquerda, ${largura}px, ${rotulo}`, async ({
      page
    }) => {
      await page.setViewportSize({ width: largura, height: 900 });
      await prepararEstadoInicial(page, estado);
      await page.goto(ROTA);
      await abrirMenuAteAba(page, largura);
      const m = await medir(page);

      const cadeia: Array<[string, number]> = [
        ['período', m.periodo.texto],
        ['cadeira', m.cadeira.texto],
        ['unidade', m.unidade.texto],
        ['aba (Resumo)', m.resumo.texto],
        ['item do Resumo', m.bloco.texto]
      ];
      for (let i = 1; i < cadeia.length; i++) {
        const [nomePai, xPai] = cadeia[i - 1]!;
        const [nome, x] = cadeia[i]!;
        expect(
          x - xPai,
          `${nome} (texto em x=${x.toFixed(1)}) deve começar pelo menos ${RECUO_MINIMO}px à direita de ${nomePai} (x=${xPai.toFixed(1)})`
        ).toBeGreaterThanOrEqual(RECUO_MINIMO);
      }

      expect(
        Math.abs(m.quiz.texto - m.resumo.texto),
        'Quiz (sem triângulo) alinha com Resumo'
      ).toBeLessThanOrEqual(1);

      for (const [nome, nivel] of [
        ['período', m.periodo],
        ['cadeira', m.cadeira],
        ['unidade', m.unidade],
        ['Resumo', m.resumo]
      ] as const) {
        expect(
          nivel.seta,
          `triângulo de ${nome} deve ficar à esquerda do texto da própria linha`
        ).toBeLessThanOrEqual(nivel.texto);
      }
    });
  }
}
