// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Aviso de armazenamento como bloco do fluxo (decisão do líder, 07/11/2026: "O aviso vira um bloco
 * no alto da página e rola junto com ela. O texto aparece inteiro, nunca cobre campo nem menu, e
 * some ao clicar Entendi."). Sem position fixed nem sticky: rola com a página, então nada fica por
 * cima do conteúdo. jsdom não faz layout: a prova de que nada fica coberto é o e2e do portão.
 */
const fonte = readFileSync(
  resolve(__dirname, '../../src/ui/componentes/AvisoArmazenamento.vue'),
  'utf-8'
);
const regraAviso = /\.aviso-armazenamento\s*\{([^}]*)\}/.exec(fonte)?.[1] ?? '';

describe('AvisoArmazenamento, bloco do fluxo (não cobre o conteúdo)', () => {
  it('o aviso não usa position fixed nem sticky', () => {
    expect(regraAviso).not.toMatch(/position:\s*(fixed|sticky)/);
  });

  it('o aviso não tem teto de altura nem rolagem interna do texto', () => {
    expect(regraAviso).not.toMatch(/max-height/);
    expect(fonte).not.toMatch(/overflow-y:\s*auto/);
  });
});
