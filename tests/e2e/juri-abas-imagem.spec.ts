import { expect, test } from '@playwright/test';
import { idFalso } from '../unidade/apoio/conteudoJuriFalso';
import { prepararJuriFalsa, USUARIO_JURI_FALSO } from './apoio/juriFalso';

// Headless, sem janela na sessão do líder (L-50). A imagem é um PNG de 1 pixel sintético,
// cifrado de verdade por src/core/juri/cifra.ts dentro do servidor falso: o navegador é que decifra.
const SENHA = 'abcdefghijklmno';
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
const LEGENDA_DA_IMAGEM = 'Legenda fictícia da imagem um';

// O service worker do site intercepta as chamadas depois do primeiro carregamento (ver juri-simulado).
test.use({ serviceWorkers: 'block' });

/** Registra cada URL de objeto revogada: o teste prova a revogação no navegador de verdade. */
async function espionarRevogacao(pagina: Parameters<typeof prepararJuriFalsa>[0]): Promise<void> {
  await pagina.addInitScript(() => {
    const w = window as unknown as { __revogadas: string[] };
    w.__revogadas = [];
    const original = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url: string) => {
      w.__revogadas.push(url);
      original(url);
    };
  });
}

async function revogadas(pagina: Parameters<typeof prepararJuriFalsa>[0]): Promise<string[]> {
  return pagina.evaluate(() =>
    (window as unknown as { __revogadas: string[] }).__revogadas.slice()
  );
}

async function entrarNaConta(pagina: Parameters<typeof prepararJuriFalsa>[0]): Promise<void> {
  await pagina.goto('/p/p1/juri-simulado');
  await pagina.getByLabel('Usuário').fill(USUARIO_JURI_FALSO);
  await pagina.getByLabel('Senha', { exact: true }).fill(SENHA);
  await pagina.getByRole('button', { name: 'Entrar' }).click();
  await expect(pagina.getByRole('tab', { name: 'Resumo' })).toBeVisible();
}

test.describe('Júri Simulado: abas e imagem cifrada no navegador', () => {
  test('a imagem cifrada aparece decifrada, por object URL', async ({ page }) => {
    const servidor = await prepararJuriFalsa(page, { senha: SENHA, deveTrocarSenha: false });
    await servidor.definirImagemCifrada(
      idFalso(0),
      new Uint8Array(Buffer.from(PNG_1X1_BASE64, 'base64')),
      'png'
    );
    await entrarNaConta(page);

    const imagem = page.getByRole('img', { name: LEGENDA_DA_IMAGEM });
    await expect(imagem).toHaveAttribute('src', /^blob:/);
    // Prova de decifração: uma imagem com bytes errados não tem largura natural 1.
    await expect
      .poll(() => imagem.evaluate((e) => (e as unknown as { naturalWidth: number }).naturalWidth))
      .toBe(1);
  });

  test('trocar de aba revoga a URL da imagem; sair também', async ({ page }) => {
    await espionarRevogacao(page);
    const servidor = await prepararJuriFalsa(page, { senha: SENHA, deveTrocarSenha: false });
    await servidor.definirImagemCifrada(
      idFalso(0),
      new Uint8Array(Buffer.from(PNG_1X1_BASE64, 'base64')),
      'png'
    );
    await entrarNaConta(page);

    const imagem = page.getByRole('img', { name: LEGENDA_DA_IMAGEM });
    await expect(imagem).toHaveAttribute('src', /^blob:/);
    const urlDaImagem = await imagem.getAttribute('src');

    await page.getByRole('tab', { name: 'Mapa mental' }).click();
    await expect(imagem).toHaveCount(0);
    expect(await revogadas(page)).toContain(urlDaImagem);

    await page.getByRole('tab', { name: 'Resumo' }).click();
    await expect(page.getByRole('img', { name: LEGENDA_DA_IMAGEM })).toHaveAttribute(
      'src',
      /^blob:/
    );
    const antes = (await revogadas(page)).length;

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    expect((await revogadas(page)).length).toBeGreaterThan(antes);
  });
});
