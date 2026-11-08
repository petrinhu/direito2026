import { expect, test, type Page } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp } from './apoio/acoes';
import { CONTA_ADMIN } from './apoio/constantes';

/**
 * Gerenciar usuários: todo botão de linha (Redefinir, Ativar ou Desativar, Excluir) tem de ficar
 * inteiro na janela e alcançável por foco, em qualquer largura e nos dois modos (QA rodada 5,
 * achado 2: a 768x1024 em Leitura ampliada, botões fora da janela e o foco não rolava a tabela).
 * Medido com getBoundingClientRect e elementFromPoint em pontos interiores do botão.
 */
const CHAVE_MODO_ADAPTADO = 'caderno-direito:v1:modo-adaptado';

test.beforeEach(() => resetarPrivado());

async function ligarLeituraAmpliada(page: Page): Promise<void> {
  await page.addInitScript((chave) => localStorage.setItem(chave, 'true'), CHAVE_MODO_ADAPTADO);
}

/** Medida de um botão de linha: inteiro na janela e sem nada por cima. */
async function medirBotaoDeLinha(
  page: Page,
  indice: number
): Promise<{ dentro: boolean; limpo: boolean }> {
  return page.evaluate((i) => {
    const botao = document.querySelectorAll<HTMLElement>('button[data-acao]')[i] as HTMLElement;
    const r = botao.getBoundingClientRect();
    const dentro =
      r.left >= 0 &&
      r.top >= 0 &&
      r.right <= document.documentElement.clientWidth &&
      r.bottom <= window.innerHeight;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const pontos: Array<[number, number]> = [
      [cx, cy],
      [cx, r.top + 2],
      [cx, r.bottom - 2],
      [r.left + 2, cy],
      [r.right - 2, cy]
    ];
    const limpo = pontos.every(([x, y]) => {
      const alvo = document.elementFromPoint(x, y);
      return alvo !== null && (alvo === botao || botao.contains(alvo));
    });
    return { dentro, limpo };
  }, indice);
}

for (const largura of [360, 390, 768, 1280]) {
  for (const ampliada of [false, true]) {
    const modo = ampliada ? 'Leitura ampliada' : 'normal';
    test(`cada botão de linha de Gerenciar, focado, fica inteiro na janela e sem nada por cima a ${largura} px (${modo})`, async ({
      page
    }) => {
      await page.setViewportSize({ width: largura, height: 1024 });
      if (ampliada) await ligarLeituraAmpliada(page);
      await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
      await expect(page.locator('.ar-tabela-rolavel')).toBeVisible();
      const total = await page.locator('button[data-acao]').count();
      expect(total, 'botões de linha na tabela').toBeGreaterThanOrEqual(3);

      const semRolagemLateral = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      );
      expect(semRolagemLateral, 'rolagem lateral da página').toBe(true);

      for (let i = 0; i < total; i += 1) {
        await page.locator('button[data-acao]').nth(i).focus();
        await expect
          .poll(
            async () => {
              const medida = await medirBotaoDeLinha(page, i);
              return medida.dentro && medida.limpo;
            },
            { message: `botão de linha ${i} escondido ou coberto` }
          )
          .toBe(true);
      }
    });
  }
}
