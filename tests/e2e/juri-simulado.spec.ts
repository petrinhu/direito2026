import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepararJuriFalsa, SENHA_PROVISORIA_FALSA, USUARIO_JURI_FALSO } from './apoio/juriFalso';

// Escrito para rodar headless, sem janela na sessão do líder (L-50). Sem conta real:
// a API inteira é o servidor falso do apoio, e a cifra roda de verdade no navegador.
const CATORZE = 'abcdefghijklmn';
const QUINZE = 'abcdefghijklmno';
// Mesmo critério de tests/e2e/acessibilidade-axe.spec.ts: reprova só o grave.
const GRAVIDADES_QUE_REPROVAM = ['critical', 'serious'];

// O service worker do site intercepta as chamadas depois do primeiro carregamento, e
// o page.route do fake não as vê: sem bloquear o SW, o reload iria à rede real.
test.use({ serviceWorkers: 'block' });

test.describe('Júri Simulado: entrada, troca obrigatória, destravar e sair', () => {
  test('a entrada não tem violação grave de acessibilidade', async ({ page }) => {
    await prepararJuriFalsa(page);
    await page.goto('/p/p1/juri-simulado');
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
    const resultado = await new AxeBuilder({ page }).analyze();
    const graves = resultado.violations.filter((v) =>
      GRAVIDADES_QUE_REPROVAM.includes(v.impact ?? '')
    );
    expect(graves.map((v) => v.id)).toEqual([]);
  });

  test('troca com 14 caracteres é recusada antes do servidor; 15 passa; recarregar pede só a senha; sair volta à entrada', async ({
    page
  }) => {
    const servidor = await prepararJuriFalsa(page);
    await page.goto('/p/p1/juri-simulado');

    await page.getByLabel('Usuário').fill(USUARIO_JURI_FALSO);
    await page.getByLabel('Senha', { exact: true }).fill(SENHA_PROVISORIA_FALSA);
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(
      page.getByRole('heading', { name: 'Troque a senha para continuar' })
    ).toBeVisible();
    await page.getByLabel('Senha atual').fill(SENHA_PROVISORIA_FALSA);
    await page.getByLabel('Nova senha', { exact: true }).fill(CATORZE);
    await page.getByLabel('Confirmar nova senha').fill(CATORZE);
    await page.getByRole('button', { name: 'Salvar nova senha' }).click();
    await expect(page.getByRole('alert')).toContainText('15 caracteres');
    expect(servidor.chamadasPara('trocar-senha.php')).toHaveLength(0);

    await page.getByLabel('Nova senha', { exact: true }).fill(QUINZE);
    await page.getByLabel('Confirmar nova senha').fill(QUINZE);
    await page.getByRole('button', { name: 'Salvar nova senha' }).click();
    await expect(page.getByText('Conteúdo em preparação')).toBeVisible();
    expect(servidor.chamadasPara('trocar-senha.php')).toHaveLength(1);

    // Recarregar a página: a sessão continua no servidor, mas a chave sai da memória.
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Destravar' })).toBeVisible();
    await expect(page.getByLabel('Usuário')).toHaveCount(0);
    await page.getByLabel('Senha', { exact: true }).fill(QUINZE);
    await page.getByRole('button', { name: 'Destravar' }).click();
    await expect(page.getByText('Conteúdo em preparação')).toBeVisible();

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  });
});
