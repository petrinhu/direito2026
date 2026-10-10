import { expect, type Page } from '@playwright/test';
import { conteudoRestritoFalso } from '../../unidade/apoio/conteudoRestritoFalso';

/**
 * Sem conta real nem senha no repositório: a sessão e o conteúdo da área
 * restrita são interceptados na rede (mesmos endpoints do cliente da API em
 * src/app/restrito/clienteApi.ts). O conteúdo é a fixture sintética já validada
 * pelos testes unitários (L-28: nenhum texto real).
 */
export async function prepararAreaRestritaFalsa(page: Page): Promise<void> {
  await page.route('**/api/sessao.php', (rota) =>
    rota.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        autenticado: true,
        usuario: 'usuario-falso',
        admin: false,
        deveTrocarSenha: false,
        csrf: 'csrf-falso'
      })
    })
  );
  await page.route('**/api/conteudo.php', (rota) =>
    rota.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ conteudo: conteudoRestritoFalso() })
    })
  );
}

/** Abre a aba Slides da área restrita depois do conteúdo carregado. */
export async function abrirAbaSlides(page: Page): Promise<void> {
  const aba = page.getByRole('tab', { name: 'Slides', exact: true });
  await expect(aba).toBeVisible();
  await aba.click();
}
