import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fonte = readFileSync('src/ui/area-restrita/SlideConteudo.vue', 'utf8');
const estilo = /<style scoped>([\s\S]*?)<\/style>/.exec(fonte)?.[1] ?? '';

/**
 * A regra de impressão do título precisa vir DEPOIS do @supports que pinta o gradiente
 * (background-clip: text), senão a cascata da tela vence na mesma especificidade.
 */
const aposSupports = estilo.slice(estilo.indexOf('@supports'));
const blocoImpressaoTitulo = aposSupports.slice(
  aposSupports.indexOf('@media print'),
  aposSupports.indexOf('}\n}', aposSupports.indexOf('@media print')) + 3
);

describe('título dos slides na impressão: cor sólida, sem recorte de texto', () => {
  it('existe um @media print com a regra do título depois do @supports do gradiente', () => {
    expect(estilo.indexOf('@supports')).toBeGreaterThan(-1);
    expect(aposSupports.indexOf('@media print')).toBeGreaterThan(-1);
    expect(blocoImpressaoTitulo).toContain('.ar-slide__titulo');
  });

  it('não recorta o fundo em texto na impressão (background-clip: text)', () => {
    expect(blocoImpressaoTitulo).not.toMatch(/background-clip:\s*text/);
    expect(blocoImpressaoTitulo).toMatch(/background(-clip)?:\s*(none|border-box)/);
    expect(blocoImpressaoTitulo).toMatch(/-webkit-text-fill-color:\s*currentColor/);
  });

  it('usa a cor sólida do primeiro tom do gradiente (token --s-ouro), sem contorno nem sombra', () => {
    expect(blocoImpressaoTitulo).toMatch(/color:\s*var\(--s-ouro\)/);
    expect(blocoImpressaoTitulo).not.toMatch(/text-shadow|box-shadow|outline|border:/);
  });
});
