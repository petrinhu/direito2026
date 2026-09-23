import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
const PAGINAS_PRINCIPAIS: ReadonlyArray<{ nome: string; caminho: string }> = [
  { nome: 'home', caminho: '/' },
  { nome: 'unidade (resumo)', caminho: '/p/p1/intr-direito/u1' },
  { nome: 'unidade (petição)', caminho: '/p/p1/intr-direito/u1/peticao' },
  { nome: 'unidade (quiz)', caminho: '/p/p1/intr-direito/u1/quiz' },
  { nome: 'busca', caminho: '/busca' },
  // Unidade de Redação Jurídica 1 (22/09/2026): as mesmas três abas, agora
  // também com os três extras interativos do resumo (checklist do art.
  // 319, cartões que viram, dicas de forma).
  { nome: 'redação: unidade (resumo)', caminho: '/p/p1/redacao-juridica-1/u1' },
  { nome: 'redação: unidade (petição)', caminho: '/p/p1/redacao-juridica-1/u1/peticao' },
  { nome: 'redação: unidade (quiz)', caminho: '/p/p1/redacao-juridica-1/u1/quiz' }
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
