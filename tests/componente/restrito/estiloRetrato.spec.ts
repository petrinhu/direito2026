import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/ui/area-restrita/estilo.css', 'utf8');
const bloco = (seletor: string): string => {
  const i = css.indexOf(seletor);
  expect(i).toBeGreaterThan(-1);
  return css.slice(i, css.indexOf('}', i));
};

describe('área restrita: retrato e quiz', () => {
  it('deck, palco e área não impõem largura (min-width 0, max-width 100%, overflow hidden)', () => {
    const b = bloco('.area-restrita .ar-slides__deck');
    expect(b).toMatch(/min-width:\s*0/);
    expect(b).toMatch(/max-width:\s*100%/);
    expect(b).toMatch(/overflow:\s*hidden/);
    expect(bloco('.area-restrita,')).toMatch(/min-width:\s*0/);
  });

  it('o aviso ocupa a largura do container e quebra o texto', () => {
    const b = bloco('.area-restrita .ar-slides__gire');
    expect(b).toMatch(/width:\s*100%/);
    expect(b).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('botões do quiz têm cor do token da área, com especificidade acima do estilo escopado', () => {
    expect(bloco('html .area-restrita .motor-quiz__navegacao button')).toMatch(
      /color:\s*var\(--cor-texto\)/
    );
  });
});
