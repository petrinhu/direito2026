import { expect, test, type Page, type Response } from '@playwright/test';
import {
  esvaziarSessoes,
  publicarVersaoSintetica,
  resetarPrivado,
  restaurarVersaoBase
} from './apoio/ambiente';
import { entrarNoApp, esperarApp } from './apoio/acoes';
import { CONTA_ANA_PAULA, CONTA_TROCA, DESTINO_INTERDISCIPLINAR } from './apoio/constantes';

/**
 * Aviso de versão nova (AV-F12), ponta a ponta contra o portão de verdade. Tudo sintético: login
 * "ana.paula" (espelho de semear.php), versões e novidades inventadas. A publicação é simulada
 * gravando APP/atual/versao.json e a entrada do manifesto (apoio/ambiente.ts), como o separador
 * faria. Nunca toca o conteúdo restrito real.
 *
 * Decisões do líder usadas aqui (ratificar-13-11, itens 46c, 46e, 46g e 72): nome composto "Ana
 * Paula", faixa logo abaixo do cabeçalho (fixa ao rolar), botão "Fechar aviso" que some o aviso
 * sem recarregar e não deixa voltar na mesma aba, e frase do quiz só nas áreas restritas.
 *
 * Como a troca de página dispara a consulta: o vigia consulta /versao.json na troca de rota (não
 * na carga) e no máximo uma vez por minuto por página. Hoje a PRIMEIRA troca depois de carregar a
 * página não consulta (defeito, ver o teste "a primeira troca..."). Por isso os cenários fazem a
 * troca que não conta (trocarPagina) e depois a que consulta (irPara). Quando o defeito for
 * corrigido, a primeira troca passa a consultar e a segunda cai dentro do minuto: aí o helper
 * trocarDuasVezes deve virar uma troca só.
 */

const QUIZ_COMUM = '/p/p1/intr-direito/u3-material-norma-interpretacao/quiz';
const VERSAO_NOVA = '1.99.0.0';
const NOVIDADES = ['Cadeira sintética (1º período) atualizada', 'Novo: rádio sintético'];
const FRASE_QUIZ =
  'Se você estiver fazendo o quiz desta área, as respostas marcadas aqui se perdem ao recarregar.';
const TEXTO_AVISO = '.aviso-versao__texto';
const BOTAO_GAVETA = 'Abrir menu do currículo';

/** Marca gravada na janela para provar que a página não recarregou (ela some num reload). */
type JanelaDeTeste = { marcaDoTeste?: string };

test.beforeEach(() => {
  resetarPrivado();
  restaurarVersaoBase();
});

test.afterEach(() => {
  restaurarVersaoBase();
});

const ehConsulta = (resposta: Response): boolean =>
  new URL(resposta.url()).pathname === '/versao.json';

/**
 * Um link interno visível que troca de página pelo roteador (sem âncora, de rota de unidade ou a
 * Home), diferente da atual. Espera o menu montar (a Home renderiza depois do login). Áreas
 * restritas ficam de fora: o teste não abre conteúdo restrito. Âncoras da mesma página não entram:
 * não passam pelo roteador e não disparam a troca de rota.
 */
async function linkParaOutraPagina(page: Page): Promise<string> {
  const atual = new URL(page.url());
  const chaveAtual = atual.pathname + atual.hash;
  for (let tentativa = 0; tentativa < 40; tentativa++) {
    await page.evaluate(() => window.scrollTo(0, 0));
    for (const zona of ['#gaveta-do-curriculo', '#conteudo-principal']) {
      for (const link of await page.locator(`${zona} a[href^="/p/p1/"]:visible`).all()) {
        const destino = await link.getAttribute('href');
        const restrito = destino !== null && /juri|interdisciplinar/.test(destino);
        if (destino !== null && destino !== chaveAtual && !restrito) return destino;
      }
    }
    await page.waitForTimeout(250);
  }
  throw new Error('nenhum link interno visível para outra página');
}

/** Troca de página que NÃO espera consulta (a primeira depois de carregar, ver o teste do defeito). */
async function trocarPagina(page: Page): Promise<void> {
  const destino = await linkParaOutraPagina(page);
  await page.locator(`a[href="${destino}"]:visible`).first().click();
  await page.waitForFunction(
    (alvo) => window.location.pathname + window.location.hash === alvo,
    destino
  );
}

/** Troca de página que dispara a consulta de /versao.json, e espera a resposta. */
async function irPara(page: Page): Promise<void> {
  const destino = await linkParaOutraPagina(page);
  const consulta = page.waitForResponse(ehConsulta);
  await page.locator(`a[href="${destino}"]:visible`).first().click();
  await consulta;
}

/**
 * Troca até a consulta acontecer: se a primeira troca já consulta (o defeito AV-F11 não se
 * manifesta), para aí; se não consulta, a segunda troca consulta. Assim o cenário não depende
 * do defeito, e o teste do defeito é quem o registra.
 */
async function trocarDuasVezes(page: Page): Promise<void> {
  const consultouNaPrimeira = page.waitForResponse(ehConsulta, { timeout: 3_000 }).then(
    () => true,
    () => false
  );
  await trocarPagina(page);
  if (!(await consultouNaPrimeira)) await irPara(page);
}

/** Abre a gaveta do menu só se ela estiver fechada (em 360 px a troca de página pode fechá-la). */
async function garantirGavetaAberta(page: Page): Promise<void> {
  const botao = page.getByRole('button', { name: BOTAO_GAVETA });
  if ((await botao.getAttribute('aria-expanded')) !== 'true') await botao.click();
}

/** Entrada sintética, publicação simulada e duas trocas de página: o aviso aparece. */
async function entrarEVerAviso(
  page: Page,
  novidades: readonly string[] = NOVIDADES
): Promise<void> {
  await entrarNoApp(page, CONTA_ANA_PAULA, '/');
  publicarVersaoSintetica(VERSAO_NOVA, novidades);
  await trocarDuasVezes(page);
  await expect(page.locator(TEXTO_AVISO)).toBeVisible();
}

/** Clique no link de recarregar e espera a navegação para a Home. */
async function clicarRecarregar(page: Page): Promise<void> {
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/'),
    page.getByRole('link', { name: 'Recarregar a página' }).click()
  ]);
}

test('defeito AV-F11: a primeira troca de página depois de carregar consulta /versao.json', async ({
  page
}) => {
  await entrarNoApp(page, CONTA_ANA_PAULA, '/');
  publicarVersaoSintetica(VERSAO_NOVA, NOVIDADES);
  const consultou = page.waitForResponse(ehConsulta, { timeout: 5_000 }).then(
    () => true,
    () => false
  );
  await trocarPagina(page);
  expect(
    await consultou,
    'a primeira troca de rota depois do carregamento devia consultar /versao.json (vigiaVersaoPublicada trata a carga como troca)'
  ).toBe(true);
  await expect(page.locator(TEXTO_AVISO)).toBeVisible();
});

test('mostra o aviso com o nome em Ana Paula e as novidades, depois da troca de página', async ({
  page
}) => {
  await entrarEVerAviso(page);

  const texto = page.locator(TEXTO_AVISO);
  await expect(texto).toContainText('Ana Paula, o site foi atualizado');
  await expect(texto).toContainText(NOVIDADES[0]!);
  await expect(texto).toContainText(NOVIDADES[1]!);
  await expect(page.getByRole('link', { name: 'Recarregar a página' })).toHaveAttribute(
    'href',
    '/'
  );
});

test('com quatro novidades, mostra as três primeiras e "e mais 1"', async ({ page }) => {
  await entrarEVerAviso(page, [
    'Cadeira sintética um atualizada',
    'Novo: rádio sintético',
    'Novo: busca sintética',
    'Novo: marca sintética'
  ]);
  await expect(page.locator(TEXTO_AVISO)).toContainText('e mais 1 novidade');
});

test('a faixa fica logo abaixo do cabeçalho, com a largura da janela, também depois de rolar', async ({
  page
}) => {
  await entrarEVerAviso(page);

  const medir = () =>
    page.evaluate(() => {
      const cabecalho = document.querySelector('header')!.getBoundingClientRect();
      const faixa = document.querySelector('.aviso-versao-posicao')!.getBoundingClientRect();
      return {
        topoDaFaixa: faixa.top,
        baseDoCabecalho: cabecalho.bottom,
        esquerda: faixa.left,
        largura: faixa.width,
        larguraDaJanela: document.documentElement.clientWidth,
        alturaDaJanela: window.innerHeight
      };
    });

  const noTopo = await medir();
  expect(noTopo.topoDaFaixa).toBeCloseTo(noTopo.baseDoCabecalho, 0);
  expect(noTopo.esquerda).toBe(0);
  expect(noTopo.largura).toBe(noTopo.larguraDaJanela);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  // O cabeçalho anima ao recolher; espera a altura assentar antes de comparar a faixa com a base dele.
  await expect
    .poll(async () => {
      const m = await medir();
      return Math.abs(m.topoDaFaixa - m.baseDoCabecalho);
    })
    .toBeLessThan(0.5);
  const rolado = await medir();
  expect(rolado.topoDaFaixa).toBeCloseTo(rolado.baseDoCabecalho, 0);
  expect(rolado.topoDaFaixa).toBeGreaterThanOrEqual(0);
  expect(rolado.topoDaFaixa).toBeLessThan(rolado.alturaDaJanela);
  expect(rolado.largura).toBe(rolado.larguraDaJanela);
});

test('o cabeçalho não recolhe enquanto o aviso está na tela (D9 do plano, a confirmar)', async ({
  page
}) => {
  await entrarEVerAviso(page);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const topoDoCabecalho = await page.evaluate(
    () => document.querySelector('header')!.getBoundingClientRect().top
  );
  expect(topoDoCabecalho).toBe(0);
});

test('o centro do título da página não é coberto pelo aviso', async ({ page }) => {
  await entrarEVerAviso(page);
  await page.evaluate(() => window.scrollTo(0, 0));

  const resultado = await page.evaluate(() => {
    const titulo = Array.from(document.querySelectorAll<HTMLElement>('h1')).find(
      (h) => h.getBoundingClientRect().height > 0
    );
    if (!titulo) return { achou: false, dentro: false };
    const r = titulo.getBoundingClientRect();
    const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { achou: true, dentro: alvo !== null && titulo.contains(alvo) };
  });
  expect(resultado.achou, 'a página tem um título visível').toBe(true);
  expect(resultado.dentro, 'o elemento no centro do título tem de ser o próprio título').toBe(true);
});

test('em 360 px, com a gaveta aberta, o centro de "Fechar menu" responde o próprio botão', async ({
  page
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await entrarNoApp(page, CONTA_ANA_PAULA, '/');
  publicarVersaoSintetica(VERSAO_NOVA, NOVIDADES);

  // Este teste mede a gaveta, não a troca de rota: a consulta vem do outro gatilho do plano, a aba
  // que volta a ficar visível (vigiaVersaoPublicada), que é o mesmo handler, sem depender de um
  // link escolhido na tela de 360 px.
  const consulta = page.waitForResponse(ehConsulta);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await consulta;
  await expect(page.locator(TEXTO_AVISO)).toBeVisible();

  await garantirGavetaAberta(page);
  await expect(page.getByRole('button', { name: 'Fechar menu' })).toBeVisible();
  // A gaveta desliza ao abrir: a medição espera ela assentar (um instante antes o botão ainda
  // está fora da tela e o centro cai no overlay).
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const botao = Array.from(document.querySelectorAll<HTMLElement>('button')).find(
            (b) => b.textContent?.trim() === 'Fechar menu'
          );
          if (!botao) return false;
          const r = botao.getBoundingClientRect();
          const alvo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return alvo !== null && botao.contains(alvo);
        }),
      { message: 'o centro do Fechar menu tem de devolver o próprio botão' }
    )
    .toBe(true);
});

test('Recarregar a página leva à Home sem tela de entrada e a sessão segue autenticada', async ({
  page
}) => {
  await entrarEVerAviso(page);
  await clicarRecarregar(page);

  await esperarApp(page);
  await expect(page.locator('#senha')).toHaveCount(0);
  await expect(page.locator(TEXTO_AVISO)).toHaveCount(0);

  const sessao = await page.request.get('/api/sessao.php', {
    headers: { Accept: 'application/json' }
  });
  expect(sessao.status()).toBe(200);
  const corpo = (await sessao.json()) as { autenticado: boolean };
  expect(corpo.autenticado).toBe(true);
});

test('depois de recarregar para a versão publicada, o aviso não volta (anti-laço)', async ({
  page
}) => {
  const avisos: string[] = [];
  page.on('console', (mensagem) => {
    if (mensagem.type() === 'warning') avisos.push(mensagem.text());
  });

  await entrarEVerAviso(page);
  await clicarRecarregar(page);
  await esperarApp(page);

  await trocarDuasVezes(page);
  await expect
    .poll(() => avisos.some((t) => t.includes(`já se recarregou para ${VERSAO_NOVA}`)))
    .toBe(true);
  await expect(page.locator(TEXTO_AVISO)).toHaveCount(0);
});

test('Fechar aviso esconde sem recarregar a página, leva o foco ao conteúdo e não volta na mesma aba', async ({
  page
}) => {
  await entrarEVerAviso(page);

  await page.evaluate(() => {
    (window as unknown as JanelaDeTeste).marcaDoTeste = 'sem-recarga';
  });
  await page.getByRole('button', { name: 'Fechar aviso' }).click();
  await expect(page.locator(TEXTO_AVISO)).toHaveCount(0);
  await expect(page.locator('#conteudo-principal')).toBeFocused();
  const marca = await page.evaluate(() => (window as unknown as JanelaDeTeste).marcaDoTeste);
  expect(marca, 'a página não pode ter recarregado para esconder o aviso').toBe('sem-recarga');

  // Recarregar zera o vigia: as trocas de página de novo consultam, e a versão dispensada não volta.
  await page.reload();
  await esperarApp(page);
  await trocarDuasVezes(page);
  await expect(page.locator(TEXTO_AVISO)).toHaveCount(0);
});

test('a resposta de quiz de cadeira comum continua marcada depois de recarregar', async ({
  page
}) => {
  await entrarNoApp(page, CONTA_ANA_PAULA, '/');
  publicarVersaoSintetica(VERSAO_NOVA, NOVIDADES);

  await page.goto(QUIZ_COMUM);
  await esperarApp(page);
  const primeiraPergunta = page.locator('.cartao-pergunta').first();
  await primeiraPergunta.locator('label.cartao-pergunta__alt').nth(1).click();
  await expect(primeiraPergunta.locator('input[type=radio]').nth(1)).toBeChecked();

  await trocarDuasVezes(page);
  await expect(page.locator(TEXTO_AVISO)).toBeVisible();
  await clicarRecarregar(page);
  await esperarApp(page);

  await page.goto(QUIZ_COMUM);
  await esperarApp(page);
  await expect(
    page.locator('.cartao-pergunta').first().locator('input[type=radio]').nth(1)
  ).toBeChecked();
});

test('sessão apagada antes do clique: o aviso vira "Sua sessão terminou" e não navega', async ({
  page
}) => {
  await entrarEVerAviso(page);
  // A troca de rota dispara a conferência de sessão (/api/sessao.php), que sai sem esperar. Se ela
  // ainda estiver em voo quando as sessões somem, volta sem sessão e a página recarrega. Espera
  // a rede assentar antes de apagar, para que o teste mostre o caminho do 401 do aviso.
  await page.waitForLoadState('networkidle');
  const antes = new URL(page.url()).pathname;
  esvaziarSessoes();

  const resposta = page.waitForResponse(ehConsulta);
  await page.getByRole('link', { name: 'Recarregar a página' }).click();
  expect((await resposta).status()).toBe(401);

  await expect(page.locator(TEXTO_AVISO)).toContainText('Sua sessão terminou.');
  await expect(page.getByRole('link', { name: 'Entrar de novo' })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe(antes);
});

test('troca de senha pendente: a tela de troca não mostra aviso e /versao.json responde 403', async ({
  page
}) => {
  publicarVersaoSintetica(VERSAO_NOVA, NOVIDADES);
  await page.goto('/');
  await page.locator('#usuario').fill(CONTA_TROCA.usuario);
  await page.locator('#senha').fill(CONTA_TROCA.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page.getByText('Troca de senha obrigatória antes de continuar.')).toBeVisible();
  await expect(page.locator(TEXTO_AVISO)).toHaveCount(0);
  const resposta = await page.request.get('/versao.json', {
    headers: { Accept: 'application/json' }
  });
  expect(resposta.status()).toBe(403);
});

test('a frase do quiz aparece no aviso das áreas restritas e some numa cadeira comum', async ({
  page
}) => {
  await entrarEVerAviso(page);
  // Troca para a área restrita: o aviso já está na tela e a frase depende só da rota atual
  // (reativa no render), então aparece sem nova consulta.
  await page.locator(`a[href="${DESTINO_INTERDISCIPLINAR}"]:visible`).first().click();
  await expect(page.locator(TEXTO_AVISO)).toContainText(FRASE_QUIZ);

  await page.goBack();
  await expect(page.locator(TEXTO_AVISO)).toBeVisible();
  await expect(page.locator(TEXTO_AVISO)).not.toContainText('quiz desta área');
});
