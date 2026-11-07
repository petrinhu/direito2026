import { expect, test } from '@playwright/test';
import { chaveAssetJs, resetarPrivado } from './apoio/ambiente';
import { capturar, esperarEntrada } from './apoio/acoes';
import { DESTINO_INTERDISCIPLINAR, DESTINO_JURI, ORIGEM } from './apoio/constantes';
import { calcularContraste } from '../../src/core/design/contraste';

test.beforeEach(() => resetarPrivado());

test('anônimo que abre qualquer rota vê só a tela de entrada, nunca o app', async ({ page }) => {
  const rotas = [
    '/',
    DESTINO_INTERDISCIPLINAR,
    DESTINO_JURI,
    '/calendario',
    '/busca',
    '/usuarios',
    '/conta'
  ];
  for (const rota of rotas) {
    const resposta = await page.goto(rota);
    expect(resposta?.status(), `status de ${rota}`).toBe(200);
    await esperarEntrada(page);
    const texto = (await page.locator('body').innerText()).toLowerCase();
    expect(texto, `texto de ${rota} sem conteúdo do app`).not.toContain('interdisciplinar');
    expect(texto, `texto de ${rota} sem menu`).not.toContain('gerenciar usuários');
  }
  await capturar(page, '01-entrada');
});

test('a tela de entrada vai com o caminho pedido no destino oculto, para voltar depois do login', async ({
  page
}) => {
  await page.goto(DESTINO_INTERDISCIPLINAR);
  await esperarEntrada(page);
  await expect(page.locator('input[name="destino"]')).toHaveValue(DESTINO_INTERDISCIPLINAR);
  await expect(page.locator('form')).toHaveAttribute('action', '/api/acesso.php');
});

test('asset anônimo responde 401 sem corpo (o portão não entrega nenhum byte do app)', async ({
  request
}) => {
  const resposta = await request.get(`${ORIGEM}/${chaveAssetJs()}`, { headers: { Accept: '*/*' } });
  expect(resposta.status()).toBe(401);
  expect((await resposta.body()).length).toBe(0);
  expect(resposta.headers()['cache-control']).toBe('private, no-store');
});

test('API de conteúdo anônima responde 401 e não devolve conteúdo', async ({ request }) => {
  const conteudo = await request.get(`${ORIGEM}/api/conteudo.php`);
  expect(conteudo.status()).toBe(401);
  expect(await conteudo.text()).not.toContain('Bloco fictício');
  const juri = await request.get(`${ORIGEM}/api/juri/conteudo.php`);
  expect(juri.status()).toBe(401);
});

test('a tela de entrada não carrega script e sai com CSP fechada (default-src none)', async ({
  page
}) => {
  const resposta = await page.goto('/');
  expect(resposta?.headers()['content-security-policy']).toContain("default-src 'none'");
  expect(resposta?.headers()['x-frame-options']).toBe('DENY');
  await expect(page.locator('script')).toHaveCount(0);
});

/** Cor computada do navegador (rgb ou rgba) para hex. Transparente (alfa 0) vira null. */
function paraHex(cor: string): string | null {
  const m = cor.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  if (m[4] !== undefined && Number(m[4]) === 0) return null;
  return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`;
}

test.describe('tela de entrada com o sistema em tema escuro', () => {
  test.use({ colorScheme: 'dark' });

  test('o fundo é escuro e texto, campo, botão e foco passam o contraste AA contra o fundo real', async ({
    page
  }) => {
    await page.goto('/');
    await esperarEntrada(page);
    const medidas = await page.evaluate(() => {
      const campo = document.querySelector<HTMLInputElement>('#usuario')!;
      campo.focus();
      return {
        fundo: getComputedStyle(document.body).backgroundColor,
        textoCorpo: getComputedStyle(document.body).color,
        textoTitulo: getComputedStyle(document.querySelector('h1')!).color,
        rotulo: getComputedStyle(document.querySelector('label')!).color,
        campoTexto: getComputedStyle(campo).color,
        campoFundo: getComputedStyle(campo).backgroundColor,
        botaoTexto: getComputedStyle(document.querySelector('button')!).color,
        botaoFundo: getComputedStyle(document.querySelector('button')!).backgroundColor,
        foco: getComputedStyle(campo).outlineColor,
        focoVisivel: campo.matches(':focus-visible')
      };
    });

    const fundo = paraHex(medidas.fundo);
    expect(fundo, 'fundo do corpo, que não pode ser branco no tema escuro').not.toBe('#ffffff');
    expect(medidas.focoVisivel, 'pré-condição: o campo está com foco visível').toBe(true);

    const razoes = {
      'texto do corpo': calcularContraste(paraHex(medidas.textoCorpo)!, fundo!),
      título: calcularContraste(paraHex(medidas.textoTitulo)!, fundo!),
      rótulo: calcularContraste(paraHex(medidas.rotulo)!, fundo!),
      'texto do campo': calcularContraste(
        paraHex(medidas.campoTexto)!,
        paraHex(medidas.campoFundo) ?? fundo!
      ),
      'texto do botão': calcularContraste(
        paraHex(medidas.botaoTexto)!,
        paraHex(medidas.botaoFundo) ?? fundo!
      )
    };
    for (const [nome, razao] of Object.entries(razoes)) {
      expect(razao, `contraste de ${nome} (mínimo 4,5)`).toBeGreaterThanOrEqual(4.5);
    }
    expect(
      calcularContraste(paraHex(medidas.foco)!, fundo!),
      'contraste do foco contra o fundo (mínimo 3, WCAG 1.4.11)'
    ).toBeGreaterThanOrEqual(3);
  });
});
