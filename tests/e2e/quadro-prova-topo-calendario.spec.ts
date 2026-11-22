import { expect, test, type Page } from './apoio/sessaoDoEstudo';
import { esperarLayoutAssentar, prepararEstadoInicial } from './apoio/estadoInicial';

/**
 * CAL-QUADRO-1280 (decisão do líder, 21/11/2026: "Quadro no topo, só no calendário"). Na página do
 * calendário, com o quadro de prova expandido, ele sai do flutuante do canto e vai para o topo da coluna
 * de conteúdo. Assim não cobre o rótulo "1ª AV: Filosofia Jurídica" da grade a 1024 e 1280 px. Fora do
 * calendário, e com o quadro minimizado, nada muda: o quadro segue na pilha inferior.
 */
const CALENDARIO = '/calendario';
const OUTRA_PAGINA = '/sobre';
const ROTULO = '1ª AV: Filosofia Jurídica';
const LARGURAS = [1024, 1280] as const;
const FAIXAS = [
  { faixa: 'dourado', data: '2026-09-15T12:00:00-03:00' },
  { faixa: 'garnet', data: '2026-09-19T12:00:00-03:00' },
  { faixa: 'pulsante', data: '2026-09-21T12:00:00-03:00' }
] as const;
const CARTAO = 'aside.quadro-prova';
const BOTAO = `${CARTAO} .quadro-prova__alternar`;

type Lugar = 'topo' | 'pilha' | 'ausente' | 'outro';

async function lugarDoQuadro(page: Page): Promise<Lugar> {
  return page.evaluate(() => {
    const cartao = document.querySelector('aside.quadro-prova');
    if (!cartao) return 'ausente';
    if (cartao.closest('#quadro-prova-do-conteudo')) return 'topo';
    if (cartao.closest('.layout-base__inferior')) return 'pilha';
    return 'outro';
  });
}

async function abrirCalendario(page: Page, largura: number, data: string): Promise<void> {
  await page.clock.setFixedTime(new Date(data));
  await prepararEstadoInicial(page, { tema: 'claro', modoAdaptado: false });
  await page.setViewportSize({ width: largura, height: 800 });
  await page.goto(CALENDARIO);
  await page.locator('.grade-calendario').waitFor({ state: 'visible' });
  await esperarLayoutAssentar(page);
}

async function expandirQuadro(page: Page): Promise<void> {
  const botao = page.locator(BOTAO);
  if ((await botao.getAttribute('aria-expanded')) === 'false') await botao.click();
  await expect(page.locator(CARTAO)).not.toHaveClass(/quadro-prova--minimizado/);
  await esperarLayoutAssentar(page);
}

/**
 * Rola a página de cima a baixo, em passos de 40 px, e em cada posição em que o rótulo cabe inteiro
 * na janela testa cinco pontos dele com elementFromPoint. Devolve as posições em que outro elemento
 * ficou por cima, com o nome de quem cobriu. Sem a varredura, o teste só olharia a posição do topo.
 */
async function coberturaDoRotulo(page: Page): Promise<{ visiveis: number; cobertos: string[] }> {
  return page.evaluate((rotulo) => {
    const grade = document.querySelector('.grade-calendario');
    const alvo = Array.from(grade?.querySelectorAll<HTMLElement>('*') ?? []).find(
      (el) => el.children.length === 0 && el.textContent?.trim() === rotulo
    );
    if (!alvo) return { visiveis: -1, cobertos: ['rótulo não encontrado na grade'] };
    const quemCobre = (el: ReturnType<typeof document.elementFromPoint>): string => {
      if (!el) return 'nada';
      if (el.closest('aside.quadro-prova')) return 'quadro-prova';
      if (el.closest('.barra-topo')) return 'barra-topo';
      if (el.closest('.botao-home')) return 'botao-home';
      return el.tagName.toLowerCase();
    };
    const maximo = document.documentElement.scrollHeight - window.innerHeight;
    let visiveis = 0;
    const cobertos: string[] = [];
    for (let y = 0; y <= maximo + 40; y += 40) {
      window.scrollTo({ top: Math.min(y, maximo), behavior: 'instant' });
      const caixa = alvo.getBoundingClientRect();
      if (caixa.top < 0 || caixa.bottom > window.innerHeight || caixa.width === 0) continue;
      visiveis += 1;
      const pontos: [number, number][] = [
        [caixa.left + caixa.width / 2, caixa.top + caixa.height / 2],
        [caixa.left + 3, caixa.top + 3],
        [caixa.right - 3, caixa.top + 3],
        [caixa.left + 3, caixa.bottom - 3],
        [caixa.right - 3, caixa.bottom - 3]
      ];
      for (const [x, yy] of pontos) {
        const topo = document.elementFromPoint(x, yy);
        if (topo !== alvo && !alvo.contains(topo)) {
          cobertos.push(`rolagem ${Math.round(window.scrollY)}: ${quemCobre(topo)}`);
          break;
        }
      }
    }
    return { visiveis, cobertos };
  }, ROTULO);
}

for (const largura of LARGURAS) {
  for (const { faixa, data } of FAIXAS) {
    test(`quadro expandido vai ao topo e não cobre o rótulo, ${largura}px, faixa ${faixa}`, async ({
      page
    }) => {
      await abrirCalendario(page, largura, data);
      await expandirQuadro(page);
      await expect(page.locator(CARTAO)).toHaveAttribute('data-faixa', faixa);
      await expect.poll(() => lugarDoQuadro(page)).toBe('topo');
      const { visiveis, cobertos } = await coberturaDoRotulo(page);
      expect(visiveis, 'o rótulo precisa caber na janela em alguma rolagem').toBeGreaterThan(0);
      const cobertosPeloQuadro = cobertos.filter((c) => c.endsWith('quadro-prova'));
      expect(cobertosPeloQuadro).toEqual([]);
    });
  }
}

test('ao voltar a expandir depois de minimizar, o quadro segue no topo com o foco no botão', async ({
  page
}) => {
  await abrirCalendario(page, 1280, FAIXAS[0].data);
  await expandirQuadro(page);
  await expect(page.locator(BOTAO)).toBeFocused();
  await page.locator(BOTAO).click();
  await expect(page.locator(CARTAO)).toHaveClass(/quadro-prova--minimizado/);
  await expect.poll(() => lugarDoQuadro(page)).toBe('pilha');
  await expect(page.locator(BOTAO)).toBeFocused();
  await page.locator(BOTAO).click();
  await expect.poll(() => lugarDoQuadro(page)).toBe('topo');
  await expect(page.locator(BOTAO)).toBeFocused();
});

test('minimizado no calendário fica na pilha inferior (nada muda)', async ({ page }) => {
  await abrirCalendario(page, 1280, FAIXAS[0].data);
  await expect(page.locator(CARTAO)).toHaveClass(/quadro-prova--minimizado/);
  await expect.poll(() => lugarDoQuadro(page)).toBe('pilha');
});

test('expandido em outra página fica na pilha inferior, e sai do topo ao deixar o calendário', async ({
  page
}) => {
  await abrirCalendario(page, 1280, FAIXAS[0].data);
  await expandirQuadro(page);
  await expect.poll(() => lugarDoQuadro(page)).toBe('topo');
  await page.evaluate((caminho) => {
    window.history.pushState({}, '', caminho);
    window.dispatchEvent(new window.PopStateEvent('popstate'));
  }, OUTRA_PAGINA);
  await page.waitForURL(`**${OUTRA_PAGINA}`);
  await esperarLayoutAssentar(page);
  await expect.poll(() => lugarDoQuadro(page)).toBe('pilha');
});
