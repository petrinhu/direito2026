// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Alvos de toque no menu lateral (ordem do líder, 22/10/2026: "44 px só na
 * Leitura ampliada"). No modo ampliado, toda seta e todo alvo clicável do menu
 * tem 44 x 44 px. No modo normal, o que já existia não muda.
 *
 * Medição rápida (docs/qa-menu-lateral.md, D3): a seta de Resumo e a de
 * Petição mediam 26 px de largura no modo ampliado. A coluna de texto do nível
 * 4 (grupos, abas, Resumo, Petição) passa a ser --menu-coluna-aba, a mesma
 * coluna da seta: 26 px no normal, 44 px no ampliado. Assim o texto dos níveis
 * 4 continua alinhado.
 */
const fonte = readFileSync(
  resolve(__dirname, '../../src/ui/componentes/MenuCurriculo.vue'),
  'utf-8'
);
const estilo = fonte.slice(fonte.indexOf('<style scoped>')).replace(/\/\*[\s\S]*?\*\//g, '');
const regras = [...estilo.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  seletor: m[1]!.trim(),
  corpo: m[2]!
}));

function valorDe(corpo: string, propriedade: string): string | undefined {
  const m = corpo.match(new RegExp(`(?:^|;|\\s)${propriedade}:\\s*([^;]+);`));
  return m?.[1]?.trim();
}

function regraExata(seletor: string): { corpo: string } {
  const achado = regras.find((r) => r.seletor === seletor);
  expect(achado, `regra não encontrada: ${seletor}`).toBeDefined();
  return achado!;
}

describe('MenuCurriculo, alvos de 44 px na leitura ampliada', () => {
  it('o modo ampliado define a coluna de texto do nível 4 igual ao alvo de toque (--menu-toggle, 44 px)', () => {
    const corpo = regraExata(":root[data-modo-adaptado='on'] .menu-curriculo").corpo;
    expect(valorDe(corpo, '--menu-coluna-aba')).toMatch(/var\(--menu-toggle\)/);
  });

  it('o modo normal mantém a coluna da seta em 26 px (recuo, seta e margem), como antes', () => {
    const corpo = regraExata('.menu-curriculo').corpo;
    expect(valorDe(corpo, '--menu-coluna-aba')).toMatch(/calc\(var\(--esp-3/);
  });

  it('a seta de Resumo e de Petição ocupa --menu-coluna-aba em largura (44 px no ampliado)', () => {
    const corpo = regraExata('.menu-curriculo__toggle--aba').corpo;
    expect(valorDe(corpo, 'width')).toMatch(/var\(--menu-coluna-aba\)/);
  });

  it('o texto do nível 4 (grupos, abas, Resumo e Petição) começa na mesma coluna da seta', () => {
    const regra = regras.find(
      (r) =>
        r.seletor.startsWith('.menu-curriculo__nivel-4 > li > .menu-curriculo__botao') &&
        valorDe(r.corpo, 'padding-left')
    );
    expect(regra, 'regra de recuo do nível 4 não encontrada').toBeDefined();
    expect(valorDe(regra!.corpo, 'padding-left')).toMatch(/var\(--menu-coluna-aba\)/);
  });

  it('o "em breve" de grupo segue a mesma coluna de texto dos grupos', () => {
    const regra = regras.find(
      (r) =>
        r.seletor.includes('.menu-curriculo__nivel-4 > li > :deep(.estado-em-breve)') &&
        valorDe(r.corpo, 'padding-left')
    );
    expect(regra, 'recuo do em breve de grupo não encontrado').toBeDefined();
    expect(valorDe(regra!.corpo, 'padding-left')).toMatch(/var\(--menu-coluna-aba\)/);
  });

  it('o alvo de toque mínimo do modo ampliado é 44 px nos botões de alternar (--menu-toggle)', () => {
    const adaptado = regraExata(":root[data-modo-adaptado='on'] .menu-curriculo").corpo;
    expect(valorDe(adaptado, '--menu-toggle')).toBe('44px');
    const base = regraExata('.menu-curriculo__toggle').corpo;
    expect(valorDe(base, 'min-width')).toMatch(/var\(--menu-toggle\)/);
    expect(valorDe(base, 'min-height')).toBe('44px');
  });
});
