import { expect, test, type Locator, type Page } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { entrarNoApp, esperarEntrada, preencherEntrada } from './apoio/acoes';
import { CONTA_ADMIN, CONTA_COMUM } from './apoio/constantes';

/**
 * Leitura ampliada em telas estreitas, com o aviso de armazenamento na tela (QA F5.1, seções
 * 8.4 e 8.6). Preferência salva antes de qualquer página carregar, como o leitor a deixou no
 * navegador (chave do RepositorioLocalStorage). Sintético: login e conta vêm de constantes.ts.
 */
const CHAVE_MODO_ADAPTADO = 'caderno-direito:v1:modo-adaptado';

test.beforeEach(() => resetarPrivado());

async function ligarLeituraAmpliada(page: Page): Promise<void> {
  await page.addInitScript((chave) => localStorage.setItem(chave, 'true'), CHAVE_MODO_ADAPTADO);
}

/** O ponto central do alvo cai nele ou num descendente: é o que um clique real alcança. */
async function alcancavel(alvo: Locator): Promise<boolean> {
  return alvo.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return topo !== null && (topo === el || el.contains(topo));
  });
}

for (const largura of [360, 390]) {
  test.describe(`Leitura ampliada a ${largura} px, com o aviso de armazenamento aberto`, () => {
    test.use({ viewport: { width: largura, height: 640 } });

    test('o botão da gaveta é clicável, e o menu abre com Sair alcançável', async ({ page }) => {
      await ligarLeituraAmpliada(page);
      await entrarNoApp(page, CONTA_COMUM, '/');
      await expect(page.locator('html')).toHaveAttribute('data-modo-adaptado', 'on');
      await expect(page.locator('.aviso-armazenamento')).toBeVisible();

      const botaoGaveta = page.locator('.barra-topo__botao-gaveta');
      await expect
        .poll(() => alcancavel(botaoGaveta), { message: 'o aviso cobre o botão da gaveta' })
        .toBe(true);
      await botaoGaveta.click();

      const sair = page.locator('.menu-curriculo__sair');
      await expect
        .poll(() => alcancavel(sair), { message: 'o aviso cobre o botão Sair do menu' })
        .toBe(true);
    });

    test('Entendi esconde o bloco e fica gravado: não volta ao recarregar', async ({ page }) => {
      await ligarLeituraAmpliada(page);
      await entrarNoApp(page, CONTA_COMUM, '/');
      const aviso = page.locator('.aviso-armazenamento');
      await expect(aviso).toBeVisible();
      await page.getByRole('button', { name: 'Entendi' }).click();
      await expect(aviso).toHaveCount(0);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-modo-adaptado', 'on');
      await expect(page.locator('.barra-topo')).toBeVisible();
      await expect(aviso).toHaveCount(0);
    });

    test('Gerenciar usuários cabe na largura: sem rolagem lateral e com o formulário dentro da janela', async ({
      page
    }) => {
      await ligarLeituraAmpliada(page);
      await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
      const formulario = page.locator('form.ar-admin__criar');
      await expect(formulario).toBeVisible();

      const medidas = await page.evaluate(() => ({
        larguraDocumento: document.documentElement.scrollWidth,
        larguraJanela: document.documentElement.clientWidth
      }));
      expect(medidas.larguraDocumento, 'rolagem lateral da página').toBeLessThanOrEqual(
        medidas.larguraJanela
      );

      const caixaForm = await formulario.boundingBox();
      expect(caixaForm!.x + caixaForm!.width, 'direita do formulário').toBeLessThanOrEqual(largura);

      const botaoCriar = formulario.getByRole('button', { name: 'Criar usuário' });
      const caixaBotao = await botaoCriar.boundingBox();
      expect(
        caixaBotao!.x + caixaBotao!.width,
        'direita do botão Criar usuário'
      ).toBeLessThanOrEqual(largura);
    });
  });
}

/** Texto do aviso e caixa do aviso sem corte: nada escondido por rolagem interna. */
async function medirCorteDoAviso(
  page: Page
): Promise<{ aviso: boolean; texto: boolean; rolagem: string }> {
  return page.evaluate(() => {
    const aviso = document.querySelector<HTMLElement>('.aviso-armazenamento')!;
    const texto = aviso.querySelector<HTMLElement>('.aviso-armazenamento__texto')!;
    return {
      aviso: aviso.scrollHeight > aviso.clientHeight + 1,
      texto: texto.scrollHeight > texto.clientHeight + 1,
      rolagem: getComputedStyle(texto).overflowY
    };
  });
}

for (const largura of [360, 390, 768, 1280]) {
  for (const ampliada of [false, true]) {
    const modo = ampliada ? 'Leitura ampliada' : 'normal';
    test(`texto do aviso aparece inteiro, sem rolagem interna, a ${largura} px (${modo})`, async ({
      page
    }) => {
      await page.setViewportSize({ width: largura, height: 640 });
      if (ampliada) await ligarLeituraAmpliada(page);
      await entrarNoApp(page, CONTA_COMUM, '/');
      await expect(page.locator('.aviso-armazenamento')).toBeVisible();
      const corte = await medirCorteDoAviso(page);
      expect(corte.aviso, 'a caixa do aviso corta conteúdo').toBe(false);
      expect(corte.texto, 'o texto do aviso corta conteúdo').toBe(false);
      expect(corte.rolagem, 'o texto tem rolagem interna').not.toMatch(/auto|scroll/);
    });
  }
}

/**
 * Campo de Gerenciar focado: inteiro na janela e sem nada fixo por cima (o aviso agora rola com a
 * página, decisão do líder: bloco no topo). Mede o centro e as bordas do campo contra o elemento
 * que o navegador devolve naquele ponto.
 */
async function campoLivreNaJanela(page: Page): Promise<{ dentro: boolean; coberto: boolean }> {
  return page.evaluate(() => {
    const campo = document.querySelector<HTMLElement>(
      'form.ar-admin__criar input[name="novoUsuario"]'
    )!;
    const r = campo.getBoundingClientRect();
    const dentro =
      r.top >= 0 &&
      r.left >= 0 &&
      r.bottom <= window.innerHeight &&
      r.right <= document.documentElement.clientWidth;
    const cx = r.left + r.width / 2;
    const pontos = [r.top + 2, r.top + r.height / 2, r.bottom - 2];
    const coberto = pontos.some((y) => {
      const topo = document.elementFromPoint(cx, y);
      return !(topo === campo || campo.contains(topo));
    });
    return { dentro, coberto };
  });
}

for (const largura of [360, 390, 768, 1280]) {
  for (const ampliada of [false, true]) {
    const modo = ampliada ? 'Leitura ampliada' : 'normal';
    test(`campo focado de Gerenciar fica inteiro e sem nada por cima a ${largura} px (${modo})`, async ({
      page
    }) => {
      await page.setViewportSize({ width: largura, height: 640 });
      if (ampliada) await ligarLeituraAmpliada(page);
      await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
      const campo = page.locator('form.ar-admin__criar input[name="novoUsuario"]');
      await expect(campo).toBeVisible();
      await campo.focus();
      await expect
        .poll(
          async () => {
            const medida = await campoLivreNaJanela(page);
            return medida.dentro && !medida.coberto;
          },
          { message: 'o campo focado está escondido ou coberto por algo fixo' }
        )
        .toBe(true);
    });
  }
}

test('com a pilha inferior presente, o campo de Gerenciar focado fica inteiro acima do topo da pilha, a 360x640', async ({
  page
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await entrarNoApp(page, CONTA_ADMIN, '/usuarios');
  const ultimo = page.locator('form.ar-admin__criar input[name="novoUsuario"]');
  await expect(ultimo).toBeVisible();
  await ultimo.focus();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const campo = document
            .querySelector<HTMLElement>('form.ar-admin__criar input[name="novoUsuario"]')!
            .getBoundingClientRect();
          const pilha = document.querySelector('.layout-base__inferior')!.getBoundingClientRect();
          return campo.bottom <= pilha.top + 0.5 && campo.top >= 0;
        }),
      { message: 'o último campo focado ficou sob o topo da pilha inferior' }
    )
    .toBe(true);
});

for (const [rota, ampliada] of [
  ['/', false],
  ['/', true],
  ['/usuarios', false]
] as const) {
  const modo = ampliada ? 'Leitura ampliada' : 'normal';
  test(`o aviso é a primeira coisa sob a barra, antes da faixa, a 360x640 (${rota}, ${modo})`, async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    if (ampliada) await ligarLeituraAmpliada(page);
    await entrarNoApp(page, CONTA_COMUM, rota);
    await page.evaluate(() => window.scrollTo(0, 0));
    const medida = await page.evaluate(() => {
      const barra = document.querySelector('.barra-topo')!.getBoundingClientRect();
      const aviso = document.querySelector('.aviso-armazenamento')!.getBoundingClientRect();
      const faixa = document.querySelector('#faixa-do-layout');
      const antesDaFaixa = faixa
        ? Boolean(
            document.querySelector('.aviso-armazenamento')!.compareDocumentPosition(faixa) & 4
          )
        : true;
      return { folgaSobBarra: aviso.top - barra.bottom, antesDaFaixa, scrollY: window.scrollY };
    });
    expect(medida.folgaSobBarra, 'topo do aviso abaixo do fim da barra').toBeGreaterThanOrEqual(0);
    expect(
      medida.folgaSobBarra,
      'topo do aviso no máximo 24 px abaixo da barra'
    ).toBeLessThanOrEqual(24);
    expect(medida.antesDaFaixa, 'o aviso vem antes da faixa na ordem do DOM').toBe(true);
  });
}

test('o aviso é bloco do fluxo: sem position fixed nem sticky, a 360 em Leitura ampliada', async ({
  page
}) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await ligarLeituraAmpliada(page);
  await entrarNoApp(page, CONTA_COMUM, '/');
  const posicao = await page
    .locator('.aviso-armazenamento')
    .evaluate((el) => getComputedStyle(el).position);
  expect(['static', 'relative']).toContain(posicao);
});

test.describe('Trocar senha (/conta) em Leitura ampliada a 360 px', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('o formulário de troca cabe na largura, sem rolagem lateral', async ({ page }) => {
    await ligarLeituraAmpliada(page);
    await page.goto('/conta');
    await esperarEntrada(page);
    await preencherEntrada(page, CONTA_COMUM);
    const formulario = page.locator('form.ar-formulario');
    await expect(formulario).toBeVisible();
    const medidas = await page.evaluate(() => ({
      larguraDocumento: document.documentElement.scrollWidth,
      larguraJanela: document.documentElement.clientWidth
    }));
    expect(medidas.larguraDocumento, 'rolagem lateral da página de troca').toBeLessThanOrEqual(
      medidas.larguraJanela
    );
  });
});
