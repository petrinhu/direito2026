import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ehModuloDoCore, removerFonteIconesFullCalendar } from '../../vite.config';

/**
 * Regra @font-face "fcicons" que o FullCalendar injeta ao ser importado, com
 * a fonte embutida em data:. Sob a CSP de produção (font-src 'self') o
 * navegador tenta essa fonte no carregamento mesmo sem elemento que a use, e
 * a tentativa vira erro no console. Ver vite.config.ts.
 */
const CAMINHO_CORE = fileURLToPath(
  new URL('../../node_modules/@fullcalendar/core/internal-common.js', import.meta.url)
);
const REGRA_FONTE_DATA = /@font-face\{font-family:fcicons[^}]*\}/g;

function codigoDoCore(): string {
  return readFileSync(CAMINHO_CORE, 'utf8');
}

describe('remoção da fonte de ícones do FullCalendar (CSP)', () => {
  it('pré-condição: o core instalado ainda traz exatamente uma regra fcicons com data:', () => {
    // Se isto falhar, o pacote mudou o trecho: revisar a remoção antes de publicar.
    expect(codigoDoCore().match(REGRA_FONTE_DATA)).toHaveLength(1);
  });

  it('remove a regra fcicons e não deixa nenhum @font-face com data:', () => {
    const saida = removerFonteIconesFullCalendar(codigoDoCore());

    expect(saida).not.toMatch(/@font-face\{[^}]*data:/);
    expect(saida).not.toContain('font-family:fcicons;');
  });

  it('não altera o restante do CSS injetado (só a regra sai)', () => {
    const original = codigoDoCore();
    const regra = original.match(REGRA_FONTE_DATA)?.[0] ?? '';
    const saida = removerFonteIconesFullCalendar(original);

    expect(original.length - saida.length).toBe(regra.length);
    expect(saida).toContain('.fc-button{');
    expect(saida).toContain('.fc-icon{');
  });

  it('recusa o build quando a regra some (fail-closed: pacote mudou)', () => {
    expect(() => removerFonteIconesFullCalendar('var x = 1;')).toThrow(/achei 0/);
  });

  it('recusa o build quando a regra aparece mais de uma vez', () => {
    const regra = codigoDoCore().match(REGRA_FONTE_DATA)?.[0] ?? '';
    expect(() => removerFonteIconesFullCalendar(regra + regra)).toThrow(/achei 2/);
  });

  it('age só no módulo interno do core, não em outros arquivos', () => {
    expect(ehModuloDoCore('/x/node_modules/@fullcalendar/core/internal-common.js')).toBe(true);
    expect(ehModuloDoCore('/x/node_modules/@fullcalendar/core/index.js')).toBe(false);
    expect(ehModuloDoCore('/x/src/ui/componentes/GradeCalendario.vue')).toBe(false);
  });
});
