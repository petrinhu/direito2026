/* global innerHeight, innerWidth, SVGSVGElement, DOMRect */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Request } from '@playwright/test';
import { resetarPrivado } from './apoio/ambiente';
import { capturar, entrarNoApp } from './apoio/acoes';
import { CONTA_COMUM } from './apoio/constantes';

/**
 * As duas figuras da AV3 (Kelsen e hierarquia brasileira) na página da unidade u3: a versão plana
 * entra no corpo do texto, e o 3D monta por cima dela quando o navegador aguenta. Sintético: login e
 * conta vêm de constantes.ts. Nenhum trecho longo de texto de estudo mora aqui (só começos curtos de
 * parágrafo, para achar o ponto de entrada).
 *
 * Capturas para o QA (L-13): E2E_PORTAO_CAPTURAS aponta a pasta; este arquivo só as grava.
 */
const PAGINA = '/p/p1/intr-direito/u3-material-norma-interpretacao';
const CHAVE_MODO_ADAPTADO = 'caderno-direito:v1:modo-adaptado';
const FIGURAS = [
  { id: 'figura-piramide-kelsen', figura: 'kelsen', bloco: 'bloco-13' },
  { id: 'figura-piramide-brasil', figura: 'brasil', bloco: 'bloco-14' }
] as const;

// O Chromium sem placa de vídeo da caixa entrega WebGL por software (SwiftShader). O test.use troca
// os launchOptions do projeto inteiros, então o executável vem de novo aqui (mesmo padrão da config).
test.use({
  launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/usr/bin/chromium-browser',
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  }
});

// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'WebGL por software só no Chromium da caixa');
});

test.beforeEach(() => resetarPrivado());

/**
 * O cartão "Faltam N dias" (QuadroProva) é uma pílula fixa que fica em todas as faixas de urgência
 * e cobre o pé da figura quando há contador. Sem nenhuma prova ou prazo futuro (depois de 17/12/2026,
 * a última prova de PROVAS, e 15/11 do PRAZOS), contadorProva devolve undefined e o cartão não sai.
 * O relógio fica em 20/12/2026: a figura fica sem cobertura e o teste não depende do dia em que roda.
 */
const DATA_SEM_CARTAO = new Date('2026-12-20T15:00:00Z');
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(DATA_SEM_CARTAO);
});

interface Escuta {
  readonly errosDeConsole: string[];
  readonly errosDePagina: string[];
  readonly pedidosDoMotor: string[];
  readonly bloqueios: string[];
  /** CSP que o servidor mandou em cada documento (a prova de que "zero bloqueio" vale algo). */
  readonly cspsDeDocumento: string[];
}

/** Escuta o que o 3D não pode causar: erro de console (CSP inclusive) e o pedido do pedaço do motor. */
function escutar(page: Page): Escuta {
  const escuta: Escuta = {
    errosDeConsole: [],
    errosDePagina: [],
    pedidosDoMotor: [],
    bloqueios: [],
    cspsDeDocumento: []
  };
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      escuta.errosDeConsole.push(`${msg.type()}: ${msg.text()}`);
      if (/content security policy|violates|refused to/i.test(msg.text())) {
        escuta.bloqueios.push(msg.text());
      }
    }
  });
  page.on('response', (resp) => {
    if (resp.request().resourceType() === 'document') {
      escuta.cspsDeDocumento.push(resp.headers()['content-security-policy'] ?? '');
    }
  });
  page.on('pageerror', (erro) => escuta.errosDePagina.push(erro.message));
  page.on('request', (req: Request) => {
    if (/\/assets\/motor-[^/]+\.js/.test(req.url())) escuta.pedidosDoMotor.push(req.url());
  });
  return escuta;
}

/** Entra, abre a unidade e tira da frente o que é fixo na página (aviso de armazenamento e quadro de prova). */
async function abrirUnidade(page: Page, ancora: string): Promise<void> {
  await entrarNoApp(page, CONTA_COMUM, `${PAGINA}#${ancora}`);
  await expect(page.locator(`#${ancora}`)).toBeAttached();
  // O login leva à página sem a âncora: leva o bloco ao topo, como o endereço com # faria.
  await page.locator(`#${ancora}`).evaluate((el) => el.scrollIntoView());
  const entendi = page.getByRole('button', { name: 'Entendi' });
  if (await entendi.isVisible().catch(() => false)) await entendi.click();
  const minimizar = page.getByRole('button', { name: 'Minimizar' });
  if (await minimizar.isVisible().catch(() => false)) await minimizar.click();
}

/** Leva a figura até perto da janela, o bastante para o 3D começar a chegar. */
async function aproximar(page: Page, id: string): Promise<void> {
  await page.locator(`#${id}`).evaluate((el) => el.scrollIntoView({ block: 'center' }));
}

/** Traz o elemento para o meio da janela e confere que ele cabe e que nada fixo da página o cobre. */
async function centralizar(page: Page, seletor: string): Promise<void> {
  const alvo = page.locator(seletor);
  await alvo.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await expect
    .poll(
      () =>
        alvo.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const cabe =
            r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
          const pontos = [
            [0.5, 0.5],
            [0.25, 0.1],
            [0.75, 0.9]
          ] as const;
          const livre = pontos.every(([fx, fy]) => {
            const topo = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
            return topo !== null && el.contains(topo);
          });
          return cabe && livre ? 'livre' : `cabe=${cabe} livre=${livre}`;
        }),
      { message: `algo fixo da página cobre ${seletor}, ou ele não cabe na janela` }
    )
    .toBe('livre');
}

/**
 * Quanto rolar para a figura sair toda da janela. A figura do 3D tem mais de 3 alturas de janela,
 * então o piso de 3 alturas não basta: sem sair da janela a montagem é inválida (o teste falha antes
 * da asserção do canvas). O piso de 3 alturas fica como mínimo.
 */
function distanciaParaSair(figura: { y: number; height: number } | null, altura: number): number {
  const base = figura ? Math.ceil(figura.y + figura.height) + altura : 0;
  return Math.max(3 * altura, base);
}

/** Medida da versão plana: caixa de cada <text> dentro do viewBox, sem cruzar outra, letra de 14 px. */
async function medirPlana(page: Page, id: string) {
  return page.locator(`#${id} .figura-piramide__plana svg`).evaluate((svg) => {
    const alvo = svg as SVGSVGElement;
    const r = alvo.getBoundingClientRect();
    const vb = alvo.viewBox.baseVal;
    const textos = [...alvo.querySelectorAll('text')];
    const caixas = textos.map((t) => t.getBBox());
    const falhas: string[] = [];
    let menorLetra = Infinity;
    textos.forEach((t, i) => {
      const b = caixas[i] as DOMRect;
      const rotulo = [...t.querySelectorAll('tspan')].map((s) => s.textContent).join(' ');
      if (
        b.x < -0.01 ||
        b.y < -0.01 ||
        b.x + b.width > vb.width + 0.01 ||
        b.y + b.height > vb.height + 0.01
      ) {
        falhas.push(`fora do viewBox: ${rotulo}`);
      }
      caixas.forEach((o, j) => {
        if (j <= i) return;
        const dx = Math.min(b.x + b.width, o.x + o.width) - Math.max(b.x, o.x);
        const dy = Math.min(b.y + b.height, o.y + o.height) - Math.max(b.y, o.y);
        if (dx > 1e-6 && dy > 1e-6) falhas.push(`cruza o rótulo ${j}: ${rotulo}`);
      });
      const alturas = [...t.querySelectorAll('tspan')].map((s) => s.getBoundingClientRect().height);
      const menor = Math.min(...alturas);
      menorLetra = Math.min(menorLetra, menor);
      // Critério G6: letra de pelo menos 14 px na coluna estreita.
      if (menor < 14) falhas.push(`letra de ${menor.toFixed(1)} px: ${rotulo}`);
    });
    return {
      encontrados: textos.length,
      falhas,
      larguraTela: Math.round(r.width),
      menorLetra: Math.round(menorLetra * 10) / 10
    };
  });
}

/** Põe a largura da figura e a menor letra no relatório do teste, para quem confere o QA. */
function registrarMedida(
  id: string,
  situacao: string,
  medida: { larguraTela: number; menorLetra: number; encontrados: number }
): void {
  const linha = `${id} (${situacao}): figura com ${medida.larguraTela} px, menor letra ${medida.menorLetra} px, ${medida.encontrados} rótulos`;
  test.info().annotations.push({ type: 'plana', description: linha });
  console.log(`plana: ${linha}`);
}

test.describe('a 1280 px, com WebGL: a figura entra em 3D', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('as duas figuras aparecem no ponto de entrada de cada bloco, com a plana dentro do <figure>', async ({
    page
  }) => {
    await abrirUnidade(page, 'bloco-13');
    const kelsen = page.locator('#bloco-13 #figura-piramide-kelsen');
    const brasil = page.locator('#bloco-14 #figura-piramide-brasil');
    await expect(kelsen).toHaveCount(1);
    await expect(brasil).toHaveCount(1);
    // Figura 1: depois do parágrafo que fecha a cadeia e antes do que abre os dois sentidos.
    expect(await kelsen.evaluate((el) => el.previousElementSibling?.textContent ?? '')).toMatch(
      /^A norma fundamental fecha/
    );
    expect(await kelsen.evaluate((el) => el.nextElementSibling?.textContent ?? '')).toMatch(
      /^A Constituição tem dois sentidos/
    );
    // Figura 2: depois do primeiro parágrafo do bloco e antes da lista de degraus.
    expect(await brasil.evaluate((el) => el.previousElementSibling?.textContent ?? '')).toMatch(
      /^Esta é uma adaptação ao quadro/
    );
    expect(await brasil.evaluate((el) => el.nextElementSibling?.tagName)).toBe('UL');
    for (const { id, figura } of FIGURAS) {
      const el = page.locator(`#${id}`);
      await expect(el).toHaveAttribute('data-figura-3d', figura);
      await expect(el.locator('.figura-piramide__plana svg')).toHaveCount(1);
      await expect(el.locator('figcaption')).toHaveCount(1);
      await expect(el.locator('ol.figura-piramide__lista > li').first()).toBeAttached();
    }
  });

  test('o 3D monta dentro do <figure>, a plana sai, e o pedaço do motor chega sob demanda', async ({
    page
  }) => {
    const escuta = escutar(page);
    await abrirUnidade(page, 'bloco-13');
    const kelsen = page.locator('#figura-piramide-kelsen');
    await expect(kelsen).toHaveAttribute('data-3d', 'on');
    await expect(kelsen.locator('canvas.pir-tela')).toHaveCount(1);
    await expect(kelsen.locator('.figura-piramide__plana')).toBeHidden();
    await expect(kelsen.locator('.figura-piramide3d')).toBeVisible();
    // A legenda e a lista continuam abaixo do 3D (o componente vai para o fim do <figure>, a ordem
    // visual o põe primeiro).
    const ordem = await kelsen.evaluate((el) => {
      const palco = el.querySelector('.figura-piramide3d')?.getBoundingClientRect().top ?? NaN;
      const legenda = el.querySelector('figcaption')?.getBoundingClientRect().top ?? NaN;
      return { palco, legenda };
    });
    expect(ordem.palco).toBeLessThan(ordem.legenda);
    expect(escuta.pedidosDoMotor.length, 'pedidos do pedaço do motor').toBeGreaterThanOrEqual(1);
    // Controle positivo: sem a CSP do portão nos documentos, "zero bloqueio" não provaria nada.
    expect(
      escuta.cspsDeDocumento.some(
        (csp) => csp.includes("script-src 'self'") && csp.includes("worker-src 'none'")
      ),
      `CSP dos documentos: ${escuta.cspsDeDocumento.join(' | ')}`
    ).toBe(true);
    expect(escuta.bloqueios, 'bloqueios de CSP').toEqual([]);
    expect(escuta.errosDePagina, 'erros de página').toEqual([]);

    await centralizar(page, '#figura-piramide-kelsen .figura-piramide3d');
    await capturar(page, 'piramide-3d-repouso-1280-kelsen');
    await aproximar(page, 'figura-piramide-brasil');
    await expect(page.locator('#figura-piramide-brasil')).toHaveAttribute('data-3d', 'on');
    await centralizar(page, '#figura-piramide-brasil .figura-piramide3d');
    await capturar(page, 'piramide-3d-repouso-1280-brasil');
  });

  test('outras páginas não carregam o pedaço do motor', async ({ page }) => {
    const escuta = escutar(page);
    await entrarNoApp(page, CONTA_COMUM, '/');
    await expect(page.locator('.pagina-home')).toBeVisible();
    await page.goto('/p/p1/intr-direito/u1');
    await expect(page.locator('.bloco-teorico').first()).toBeVisible();
    expect(escuta.pedidosDoMotor).toEqual([]);
    // Controle positivo: a página da u3 pede o pedaço (o teste acima prova o mesmo, aqui na mesma sessão).
    await page.goto(`${PAGINA}#bloco-13`);
    await expect(page.locator('#figura-piramide-kelsen')).toHaveAttribute('data-3d', 'on');
    expect(escuta.pedidosDoMotor.length).toBeGreaterThanOrEqual(1);
  });

  // PIR-T3b (escrito, NÃO rodado: roda na vez pesada, com swiftshader). Perda sem restauração: o prazo de
  // 3 s da figura vence e a versão plana volta. A asserção de 5000 ms tem folga sobre os 3 s do prazo.
  // Prova o aceite do A1 (PIR-PLANA): o foco vai para o item equivalente da lista, a plana volta, e o
  // canvas sai do DOM (o palco é trocado e o renderer é liberado, figura.ts:203 e cena.ts:266-268).
  test('contexto WebGL que não volta em 5 s devolve a figura à versão plana, com foco e sem canvas vivo (PIR-T3b)', async ({
    page
  }) => {
    await abrirUnidade(page, 'bloco-13');
    const kelsen = page.locator('#figura-piramide-kelsen');
    await expect(kelsen).toHaveAttribute('data-3d', 'on');
    // Rótulo do meio, não o primeiro: o nível vem do próprio botão, sem string fixa.
    const botao = kelsen.locator('button.pir-rotulo', { hasText: 'Regulamentos' });
    await expect(botao).toBeVisible();
    const nivel = await botao.getAttribute('data-nivel');
    expect(nivel, 'o rótulo traz o nível do item da lista').not.toBeNull();
    const niveis = await kelsen
      .locator('li[data-nivel]')
      .evaluateAll((lis) => lis.map((li) => (li as HTMLElement).dataset.nivel));
    expect(niveis.indexOf(nivel!), 'o rótulo do teste fica no meio da lista').toBeGreaterThan(0);
    expect(niveis.indexOf(nivel!)).toBeLessThan(niveis.length - 1);
    await botao.focus();
    await expect(botao).toBeFocused();
    // Antes da perda a plana está escondida: sem isso, a volta abaixo não provaria nada.
    await expect(kelsen.locator('.figura-piramide__plana')).toBeHidden();
    // Handle do canvas tomado antes da perda: depois da volta ele não pode estar conectado ao DOM.
    const tela = await kelsen.locator('canvas.pir-tela').elementHandle();
    expect(tela, 'o canvas existe antes da perda').not.toBeNull();
    const perda = await kelsen.locator('canvas.pir-tela').evaluate((canvas: HTMLCanvasElement) => {
      const gl = canvas.getContext('webgl2');
      const ext = gl?.getExtension('WEBGL_lose_context') ?? null;
      ext?.loseContext();
      return { gl: gl !== null, ext: ext !== null, perdido: gl?.isContextLost() ?? null };
    });
    // Montagem inválida nunca fica verde: a perda tem de ter acontecido de fato.
    expect(perda).toEqual({ gl: true, ext: true, perdido: true });
    await expect(kelsen).not.toHaveAttribute('data-3d', 'on', { timeout: 5000 });
    // Foco: o item equivalente ao rótulo, na lista que fica na página nos dois modos.
    await expect(kelsen.locator(`li[data-nivel="${nivel}"]`)).toBeFocused();
    // A plana é o que a regra display:none esconde, então é ela que prova a volta.
    await expect(kelsen.locator('.figura-piramide__plana svg')).toBeVisible();
    await expect(kelsen.locator('.figura-piramide3d')).toBeHidden();
    // A lista é irmã da plana (fora dela, estilo.css:36-38), então fica visível nos dois modos: não prova a volta.
    await expect(kelsen.locator('ol.figura-piramide__lista')).toBeVisible();
    // Nenhum canvas vivo: o canvas tomado antes da perda saiu do DOM. O contexto que segue perdido é o do
    // loseContext acima, então ele não prova a liberação; o que este e2e prova é a saída do canvas do DOM.
    // O forceContextLoss da produção fica com o teste unitário (mutante E de cena.ts:268).
    await expect(kelsen.locator('canvas.pir-tela')).toHaveCount(0);
    expect(await tela!.evaluate((c: HTMLCanvasElement) => c.isConnected)).toBe(false);
  });

  test('axe sem violação nas duas figuras, em 3D', async ({ page }) => {
    await abrirUnidade(page, 'bloco-13');
    await expect(page.locator('#figura-piramide-kelsen')).toHaveAttribute('data-3d', 'on');
    await aproximar(page, 'figura-piramide-brasil');
    await expect(page.locator('#figura-piramide-brasil')).toHaveAttribute('data-3d', 'on');
    for (const { id } of FIGURAS) {
      const resultado = await new AxeBuilder({ page }).include(`#${id}`).analyze();
      expect(
        resultado.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`
        ),
        `violações do axe em ${id}`
      ).toEqual([]);
      expect(resultado.passes.length, `regras do axe que rodaram em ${id}`).toBeGreaterThan(0);
    }
  });

  test('a Figura 2 não traz o rótulo de atribuição, nem no desenho plano, nem nos rótulos do 3D, nem na lista', async ({
    page
  }) => {
    await abrirUnidade(page, 'bloco-14');
    const brasil = page.locator('#figura-piramide-brasil');
    await expect(brasil).toHaveAttribute('data-3d', 'on');
    const medidas = await brasil.evaluate((el) => {
      const svg = el.querySelector('.figura-piramide__plana svg');
      const rotulos = [...el.querySelectorAll('.pir-rotulo')].map((r) => r.textContent ?? '');
      const itens = [...el.querySelectorAll('ol.figura-piramide__lista > li')];
      return {
        textosDoSvg: svg ? svg.querySelectorAll('text').length : -1,
        svgTemFrase: (svg?.textContent ?? '').includes('Kelsen não trata do Brasil'),
        svgTemRotulo: (svg?.textContent ?? '').includes('Adaptação brasileira'),
        rotulosDoTres: rotulos.length,
        rotulosTemFrase: rotulos.some((t) => t.includes('Kelsen não trata do Brasil')),
        itensSemNivel: itens.filter((li) => !li.hasAttribute('data-nivel')).length,
        itens: itens.length,
        guias: el.querySelectorAll('.pir-guia').length
      };
    });
    expect(medidas.textosDoSvg).toBe(4);
    expect(medidas.svgTemFrase).toBe(false);
    expect(medidas.svgTemRotulo).toBe(false);
    expect(medidas.rotulosDoTres).toBe(4);
    expect(medidas.rotulosTemFrase).toBe(false);
    expect(medidas.itensSemNivel).toBe(0);
    expect(medidas.itens).toBe(4);
    // Um traço de guia por rótulo: sem o rótulo de atribuição, sobram só os 4 níveis.
    expect(medidas.guias).toBe(4);
  });

  test('passar o mouse num nível leva a fatia para a janela inteira; Esc a devolve', async ({
    page
  }) => {
    const escuta = escutar(page);
    await abrirUnidade(page, 'bloco-13');
    await expect(page.locator('#figura-piramide-kelsen')).toHaveAttribute('data-3d', 'on');
    await centralizar(page, '#figura-piramide-kelsen .figura-piramide3d');
    const botao = page.locator('#figura-piramide-kelsen button.pir-rotulo', {
      hasText: 'Regulamentos'
    });
    await expect(botao).toBeVisible();
    const caixa = await botao.boundingBox();
    expect(caixa).not.toBeNull();
    await page.mouse.move(caixa!.x + caixa!.width / 2, caixa!.y + caixa!.height / 2);
    const tela = page.locator('#figura-piramide-kelsen canvas.pir-tela');
    await expect(tela).toHaveClass(/pir-tela--voo/);
    await expect(page.locator('#figura-piramide-kelsen .pir-leitor')).toContainText('Regulamentos');
    const vp = page.viewportSize()!;
    const area = await tela.boundingBox();
    expect(Math.round(area!.width)).toBe(vp.width);
    expect(Math.round(area!.height)).toBe(vp.height);
    await expect(botao).toHaveClass(/pir-rotulo--ativo/);
    // A fatia termina de chegar antes da captura (o texto aparece no fim do voo).
    await expect
      .poll(() => page.locator('#figura-piramide-kelsen .pir-leitor').textContent(), {
        timeout: 15_000
      })
      .toContain('Regulamentos');
    await page.waitForTimeout(1800);
    await capturar(page, 'piramide-3d-voo-1280-kelsen');
    await page.keyboard.press('Escape');
    await expect(page.locator('#figura-piramide-kelsen .pir-leitor')).toHaveText('');
    await expect(tela).not.toHaveClass(/pir-tela--voo/, { timeout: 15_000 });
    expect(escuta.bloqueios, 'bloqueios de CSP durante o voo').toEqual([]);
    expect(escuta.errosDePagina, 'erros de página durante o voo').toEqual([]);
  });

  test('pelo teclado: Tab chega ao rótulo, o leitor de tela recebe o texto e Esc fecha', async ({
    page
  }) => {
    await abrirUnidade(page, 'bloco-13');
    await expect(page.locator('#figura-piramide-kelsen')).toHaveAttribute('data-3d', 'on');
    const botao = page.locator('#figura-piramide-kelsen button.pir-rotulo').first();
    await botao.focus();
    await expect(page.locator('#figura-piramide-kelsen .pir-leitor')).not.toHaveText('');
    await page.keyboard.press('Escape');
    await expect(page.locator('#figura-piramide-kelsen .pir-leitor')).toHaveText('');
  });

  test('o controle de som aparece com o 3D, liga no clique e não causa erro de console', async ({
    page
  }) => {
    const escuta = escutar(page);
    await abrirUnidade(page, 'bloco-13');
    await expect(page.locator('#figura-piramide-kelsen')).toHaveAttribute('data-3d', 'on');
    const som = page.locator('#figura-piramide-kelsen .figura-piramide3d__botao').first();
    await expect(som).toBeVisible({ timeout: 30_000 });
    // O Chromium sem interface pode liberar o áudio sem gesto; o outro estado válido é o bloqueado.
    const inicial = ((await som.textContent()) ?? '').trim();
    expect(['Som: clique para ligar', 'Som ligado']).toContain(inicial);
    await expect(
      page.locator('#figura-piramide-kelsen').getByRole('button', { name: 'Testar som' })
    ).toBeVisible();
    await som.click();
    await expect(som).toHaveText(inicial === 'Som ligado' ? 'Som desligado' : 'Som ligado');
    expect(escuta.bloqueios, 'bloqueios de CSP no som').toEqual([]);
    expect(escuta.errosDePagina, 'erros de página no som').toEqual([]);
  });

  test('rolar com a roda do mouse durante a volta tira o canvas da janela (PIR-H7)', async ({
    page
  }) => {
    const escuta = escutar(page);
    await abrirUnidade(page, 'bloco-13');
    await expect(page.locator('#figura-piramide-kelsen')).toHaveAttribute('data-3d', 'on');
    await centralizar(page, '#figura-piramide-kelsen .figura-piramide3d');
    const botao = page.locator('#figura-piramide-kelsen button.pir-rotulo', {
      hasText: 'Regulamentos'
    });
    await expect(botao).toBeVisible();
    const caixa = await botao.boundingBox();
    expect(caixa).not.toBeNull();
    await page.mouse.move(caixa!.x + caixa!.width / 2, caixa!.y + caixa!.height / 2);
    const tela = page.locator('#figura-piramide-kelsen canvas.pir-tela');
    await expect(tela).toHaveClass(/pir-tela--voo/);
    await expect(page.locator('#figura-piramide-kelsen .pir-leitor')).toContainText('Regulamentos');
    const figura0 = await page.locator('#figura-piramide-kelsen').boundingBox();
    const vp = page.viewportSize()!;
    await page.mouse.wheel(0, distanciaParaSair(figura0, vp.height));
    await page.waitForTimeout(2000);
    // Montagem inválida, nunca verde: a figura precisa ter saído da janela antes da asserção do canvas.
    const figura = await page.locator('#figura-piramide-kelsen').boundingBox();
    expect(figura, 'a figura existe na página').not.toBeNull();
    expect(
      figura!.y + figura!.height < 0 || figura!.y > vp.height,
      'a figura saiu da janela (senão a montagem é inválida)'
    ).toBe(true);
    await expect(tela).not.toHaveClass(/pir-tela--voo/);
    expect(escuta.errosDePagina, 'erros de página na rolagem durante a volta').toEqual([]);
  });

  test('rolar pelo teclado durante a volta tira o canvas da janela (PIR-H7)', async ({ page }) => {
    const escuta = escutar(page);
    await abrirUnidade(page, 'bloco-13');
    await expect(page.locator('#figura-piramide-kelsen')).toHaveAttribute('data-3d', 'on');
    await centralizar(page, '#figura-piramide-kelsen .figura-piramide3d');
    const botao = page.locator('#figura-piramide-kelsen button.pir-rotulo', {
      hasText: 'Regulamentos'
    });
    await expect(botao).toBeVisible();
    const tela = page.locator('#figura-piramide-kelsen canvas.pir-tela');
    await botao.focus();
    await expect(tela).toHaveClass(/pir-tela--voo/);
    await expect(page.locator('#figura-piramide-kelsen .pir-leitor')).toContainText('Regulamentos');
    const figura0 = await page.locator('#figura-piramide-kelsen').boundingBox();
    // A janela de 150 ms de figura.ts:30 precisa passar antes da rolagem por teclado.
    await page.waitForTimeout(300);
    const vp = page.viewportSize()!;
    await page.evaluate((px) => window.scrollBy(0, px), distanciaParaSair(figura0, vp.height));
    await page.waitForTimeout(2000);
    // Montagem inválida, nunca verde: a figura precisa ter saído da janela antes da asserção do canvas.
    const figura = await page.locator('#figura-piramide-kelsen').boundingBox();
    expect(figura, 'a figura existe na página').not.toBeNull();
    expect(
      figura!.y + figura!.height < 0 || figura!.y > vp.height,
      'a figura saiu da janela (senão a montagem é inválida)'
    ).toBe(true);
    await expect(tela).not.toHaveClass(/pir-tela--voo/);
    expect(escuta.errosDePagina, 'erros de página na rolagem por teclado').toEqual([]);
  });
});

test.describe('a versão plana é o que aparece nos demais casos', () => {
  for (const largura of [1280, 360]) {
    test(`modo adaptado a ${largura} px: sem 3D, sem pedaço do motor, plana sem corte e sem rótulo cruzado`, async ({
      page
    }) => {
      await page.setViewportSize({ width: largura, height: largura === 1280 ? 1200 : 800 });
      await page.addInitScript((chave) => localStorage.setItem(chave, 'true'), CHAVE_MODO_ADAPTADO);
      const escuta = escutar(page);
      await abrirUnidade(page, 'bloco-13');
      await expect(page.locator('html')).toHaveAttribute('data-modo-adaptado', 'on');
      const entendi = page.getByRole('button', { name: 'Entendi' });
      if (await entendi.isVisible().catch(() => false)) await entendi.click();
      for (const { id } of FIGURAS) {
        const el = page.locator(`#${id}`);
        await expect(el.locator('.figura-piramide__plana svg')).toBeVisible();
        await expect(el).not.toHaveAttribute('data-3d', 'on');
        await expect(el.locator('canvas')).toHaveCount(0);
        await centralizar(page, `#${id} .figura-piramide__plana svg`);
        const medida = await medirPlana(page, id);
        registrarMedida(id, `adaptado ${largura}`, medida);
        expect(medida.encontrados, `rótulos achados em ${id}`).toBeGreaterThan(0);
        expect(
          medida.falhas,
          `rótulos com defeito em ${id} a ${largura} px (figura com ${medida.larguraTela} px)`
        ).toEqual([]);
        await capturar(
          page,
          `piramide-plana-adaptado-${largura}-${id.replace('figura-piramide-', '')}`
        );
      }
      expect(escuta.pedidosDoMotor, 'pedidos do motor no modo adaptado').toEqual([]);
      expect(escuta.bloqueios).toEqual([]);
    });
  }

  test('janela de 360 px (celular): sem 3D, plana sem corte, sem rótulo cruzado e com letra de 14 px', async ({
    page
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const escuta = escutar(page);
    await abrirUnidade(page, 'bloco-13');
    const entendi = page.getByRole('button', { name: 'Entendi' });
    if (await entendi.isVisible().catch(() => false)) await entendi.click();
    for (const { id } of FIGURAS) {
      await expect(page.locator(`#${id} .figura-piramide__plana svg`)).toBeVisible();
      await expect(page.locator(`#${id}`)).not.toHaveAttribute('data-3d', 'on');
      await centralizar(page, `#${id} .figura-piramide__plana svg`);
      const medida = await medirPlana(page, id);
      registrarMedida(id, 'claro 360', medida);
      expect(
        medida.falhas,
        `rótulos com defeito em ${id} (figura com ${medida.larguraTela} px)`
      ).toEqual([]);
      await capturar(page, `piramide-plana-claro-360-${id.replace('figura-piramide-', '')}`);
    }
    expect(escuta.pedidosDoMotor, 'pedidos do motor em janela estreita').toEqual([]);
  });

  test('axe sem violação nas duas figuras, na versão plana do modo adaptado', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript((chave) => localStorage.setItem(chave, 'true'), CHAVE_MODO_ADAPTADO);
    await abrirUnidade(page, 'bloco-13');
    for (const { id } of FIGURAS) {
      await expect(page.locator(`#${id} .figura-piramide__plana svg`)).toBeVisible();
      const resultado = await new AxeBuilder({ page }).include(`#${id}`).analyze();
      expect(
        resultado.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`
        ),
        `violações do axe em ${id}`
      ).toEqual([]);
      expect(resultado.passes.length).toBeGreaterThan(0);
    }
  });
});
