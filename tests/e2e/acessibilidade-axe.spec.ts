import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { curriculo } from '../../src/conteudo/curriculo';
import { rotasDeUnidades } from './apoio/rotasDoCurriculo';

/**
 * Item 6 da onda: verificação automática de acessibilidade nas páginas
 * principais, critério de fechamento (nenhuma violação GRAVE). @axe-core/
 * playwright já era devDependency (instalada, nunca usada em teste
 * nenhum) - este arquivo é o primeiro a ligá-la ao fluxo real de teste
 * (npm run test:e2e).
 *
 * Escopo: violações de impacto 'critical' ou 'serious' reprovam o teste
 * (piso do critério de fechamento da onda). Violações 'moderate'/'minor'
 * são listadas no relatório, sem reprovar, para não travar a onda por
 * achado cosmético fora do escopo desta correção.
 */
/**
 * Home, busca e cada aba de cada unidade publicada, esta parte montada a
 * partir do currículo (tests/e2e/apoio/rotasDoCurriculo.ts): uma unidade
 * nova é verificada sem editar este arquivo, e uma cadeira sem petição
 * não ganha rota de petição.
 */
const PAGINAS_PRINCIPAIS: ReadonlyArray<{ nome: string; caminho: string }> = [
  { nome: 'home', caminho: '/' },
  { nome: 'busca', caminho: '/busca' },
  ...rotasDeUnidades(curriculo).map((r) => ({ nome: r.nome, caminho: r.caminho }))
];

const GRAVIDADES_QUE_REPROVAM = ['critical', 'serious'] as const;

for (const pagina of PAGINAS_PRINCIPAIS) {
  test(`axe-core: ${pagina.nome}, sem violação grave`, async ({ page }) => {
    await page.goto(pagina.caminho);
    const resultado = await new AxeBuilder({ page }).analyze();

    const graves = resultado.violations.filter((v) =>
      (GRAVIDADES_QUE_REPROVAM as readonly string[]).includes(v.impact ?? '')
    );

    const resumo = graves.map(
      (v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} ocorrência(s)`
    );

    expect(graves, `violações graves em ${pagina.caminho}:\n${resumo.join('\n')}`).toEqual([]);
  });
}
