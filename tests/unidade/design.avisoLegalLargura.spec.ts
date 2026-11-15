import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Ordem do líder (item 40 da ratificação de 13/11, confirmada em 14/11): o quadro do aviso
 * ocupa a largura inteira da parte de baixo. Até 880 px (o ponto de quebra da gaveta) é de
 * borda a borda; acima, 16 px de cada lado (--esp-4, a mesma folga do botão Home). Este spec
 * prova a regra no componente. A medição em navegador é do QA (SB-F3, passo 0 e F13).
 */
const AVISO_VUE = readFileSync(
  resolve(__dirname, '../../src/ui/componentes/AvisoLegal.vue'),
  'utf-8'
);
const ESTILO = AVISO_VUE.slice(AVISO_VUE.indexOf('<style scoped>'));

describe('AvisoLegal.vue: largura inteira', () => {
  it('não tem teto de 70ch: o quadro usa a largura que a tela der', () => {
    expect(ESTILO).not.toMatch(/max-width:\s*70ch/);
    expect(ESTILO).toMatch(/max-width:\s*none/);
  });

  it('até 880 px não tem margem lateral: borda a borda', () => {
    expect(ESTILO).toMatch(/margin:\s*var\(--esp-6, 2rem\)\s+0\s+var\(--esp-4, 1rem\)/);
  });

  it('acima de 880 px a folga lateral é --esp-4, o mesmo valor do botão Home', () => {
    expect(ESTILO).toMatch(
      /@media \(min-width:\s*881px\)\s*\{\s*\.aviso-legal\s*\{\s*margin-left:\s*var\(--esp-4, 1rem\);\s*margin-right:\s*var\(--esp-4, 1rem\);/
    );
  });
});
