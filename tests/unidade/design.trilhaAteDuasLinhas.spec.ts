import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Ordem do líder de 20/10/2026 (ver design.trilhaSemCorte.spec.ts): o nome da
 * página atual aparece INTEIRO, quebrando em até 2 linhas se precisar, sem
 * reticências. No modo normal, a 360px, "Mnemônicos", "Resumo" e "Fichamento"
 * cortavam sem quebrar: uma palavra longa não quebra no min-content do item
 * flex (overflow-wrap: break-word não reduz o min-content), e o `ol` com
 * overflow:hidden recortava o excedente. Por isso o link precisa de
 * overflow-wrap: anywhere, e a página atual não pode encolher abaixo de 64px.
 *
 * Mesmo padrão de design.trilhaSemCorte.spec.ts: lê a regra CSS no arquivo-fonte
 * (comentários removidos), porque jsdom não avalia media/container query.
 * Nasce vermelho antes da correção. O modo adaptado não pode ganhar o piso.
 */
const CAMINHO = resolve(__dirname, '../../src/ui/componentes/TrilhaNavegacao.vue');

function fonteSemComentarios(): string {
  return readFileSync(CAMINHO, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Corpo do primeiro bloco cujo seletor casa com o padrão; '' se não existir. */
function corpoDaRegra(fonte: string, seletor: RegExp): string {
  const casos = [...fonte.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const achado = casos.find((m) => seletor.test((m[1] ?? '').trim()));
  return achado?.[2] ?? '';
}

describe('trilha de navegação, modo normal: nome inteiro em até 2 linhas', () => {
  const fonte = fonteSemComentarios();

  it('o link do modo normal quebra palavra longa no min-content (overflow-wrap: anywhere)', () => {
    const regra = corpoDaRegra(
      fonte,
      /^:root:not\(\[data-modo-adaptado='on'\]\) \.trilha-navegacao a\s*$/
    );
    expect(regra, 'regra do link no modo normal não encontrada').not.toBe('');
    expect(regra).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('a página atual não encolhe abaixo de 64px no modo normal (link)', () => {
    const regra = corpoDaRegra(
      fonte,
      /^:root:not\(\[data-modo-adaptado='on'\]\) \.trilha-navegacao \.trilha-navegacao__atual a\s*$/
    );
    expect(regra, 'regra da página atual (link) no modo normal não encontrada').not.toBe('');
    expect(regra).toMatch(/min-width:\s*64px/);
  });

  it('o piso de 64px não vaza para o modo adaptado', () => {
    // Só seletores que começam por `:root[data-modo-adaptado='on']`; o
    // `:root:not([data-modo-adaptado='on'])` é o modo normal e fica fora.
    const regrasAdaptado = [...fonte.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) =>
      (m[1] ?? '').trim().startsWith(":root[data-modo-adaptado='on']")
    );
    expect(regrasAdaptado.length, 'nenhuma regra do modo adaptado encontrada').toBeGreaterThan(0);
    for (const m of regrasAdaptado) {
      expect(m[2]).not.toMatch(/min-width:\s*64px/);
    }
  });

  it('o modo adaptado mantém a quebra de linha (nowrap ausente e white-space normal)', () => {
    const regra = corpoDaRegra(
      fonte,
      /^:root\[data-modo-adaptado='on'\] \.trilha-navegacao li\s*$/
    );
    expect(regra).toMatch(/white-space:\s*normal/);
    expect(fonte).not.toMatch(/white-space:\s*nowrap/);
  });
});
