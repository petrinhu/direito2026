import { test, expect } from './apoio/sessaoDoEstudo';
import AxeBuilder from '@axe-core/playwright';
import { rotasDeUnidades } from './apoio/rotasDoCurriculo';
import { curriculoDoDisco } from '../../scripts/apoio/conteudoDoDisco';

// Lido do disco: o glob do Vite não existe no Node que roda o Playwright.
const curriculo = await curriculoDoDisco();

/**
 * CV-F1-REGION: o aviso legal e o botão Home da casca do app precisam estar dentro de um marco
 * de página (regra `region` do axe). A regra roda na página inteira, não só no painel de admin.
 * Escopo: a inicial, o painel de usuários e uma unidade fora da área restrita (onde o aviso
 * aparece). Outros achados de `region` ficam fora deste teste; ele reprova só pelos dois elementos.
 */
const UNIDADE_PUBLICA = rotasDeUnidades(curriculo).find((r) => !r.restrita);
if (!UNIDADE_PUBLICA)
  throw new Error('nenhuma unidade pública no currículo para o teste de região');

const PAGINAS: ReadonlyArray<{ nome: string; caminho: string; temBotaoHome: boolean }> = [
  { nome: 'inicial', caminho: '/', temBotaoHome: false },
  { nome: 'painel de usuários', caminho: '/usuarios', temBotaoHome: true },
  { nome: 'unidade pública', caminho: UNIDADE_PUBLICA.caminho, temBotaoHome: true }
];

for (const pagina of PAGINAS) {
  test(`região: ${pagina.nome} não tem aviso legal nem Home fora de marco`, async ({ page }) => {
    await page.goto(pagina.caminho);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${pagina.caminho.replace(/\//g, '\\/')}$`));

    const aviso = page.locator('.aviso-legal');
    await expect(aviso).toHaveCount(1);
    if (pagina.temBotaoHome) {
      const home = page.locator('.botao-home');
      await expect(home).toHaveCount(1);
    }

    const resultado = await new AxeBuilder({ page }).withRules(['region']).analyze();
    const alvos = resultado.violations.flatMap((v) => v.nodes.map((n) => n.target.join(' ')));
    const proibidos = alvos.filter((alvo) => /\.aviso-legal|\.botao-home/.test(alvo));

    expect(
      proibidos,
      `region acusa aviso legal ou Home em ${pagina.caminho}:\n${proibidos.join('\n')}\nTodos os alvos de region: ${alvos.join(' | ')}`
    ).toEqual([]);
  });
}
