import { test as base, type BrowserContext } from '@playwright/test';

/**
 * Sessão sintética para a suíte de ESTUDO (plano do CTO do login único, seção 7.4). A suíte roda
 * em `vite preview`, que não tem PHP: `/api/sessao.php` devolve o index.html da SPA, e a sessão
 * global do cliente (src/app/sessao/sessaoGlobal.ts) não consegue ler a resposta. Sem a mock, o
 * menu de todas as páginas cai no estado "Tentar de novo". Esta rota responde o que o portão
 * responderia para uma pessoa logada e sem troca pendente. Só o estudo usa: o portão real é
 * testado em tests/e2e-portao, contra o php -S.
 *
 * Usado por todo spec do estudo, pelo `test` estendido abaixo. Só 401 leva à entrada no cliente;
 * por isso a mock é 200, nunca 401: a entrada não existe no preview.
 */
export async function prepararSessaoDoEstudo(contexto: BrowserContext): Promise<void> {
  await contexto.route('**/api/sessao.php', (rota) =>
    rota.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        autenticado: true,
        usuario: 'usuario-falso',
        admin: false,
        deveTrocarSenha: false,
        csrf: 'csrf-falso'
      })
    })
  );
}

/** `test` do estudo: cada contexto nasce com a sessão sintética. Os specs importam daqui. */
export const test = base.extend({
  context: async ({ context }, usar) => {
    await prepararSessaoDoEstudo(context);
    await usar(context);
  }
});

export { expect } from '@playwright/test';
export type { Page } from '@playwright/test';
