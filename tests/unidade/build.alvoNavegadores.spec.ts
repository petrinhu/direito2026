// O mesmo alvo de navegador vale para o JS (build.target) e para o CSS
// (lightningcss targets). Sem isso, o build passa sintaxe nova sem rebaixar
// e o Edge antigo (109, último a rodar em Windows 7/8.1) recebe o pacote inteiro.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const config = readFileSync('vite.config.ts', 'utf-8');

describe('alvo de navegadores do build', () => {
  it('build.target lista Chrome e Edge 109, Firefox 115 e Safari 15', () => {
    for (const alvo of ["'chrome109'", "'edge109'", "'firefox115'", "'safari15'"]) {
      expect(config).toContain(alvo);
    }
    expect(config).not.toMatch(/target:\s*'esnext'/);
  });

  it('o lightningcss rebaixa o CSS para os mesmos alvos (Edge 109 = 109 << 16)', () => {
    expect(config).toMatch(/lightningcss:\s*\{[\s\S]*?targets:/);
    expect(config).toMatch(/edge:\s*109\s*<<\s*16/);
    expect(config).toMatch(/chrome:\s*109\s*<<\s*16/);
    expect(config).toMatch(/firefox:\s*115\s*<<\s*16/);
    expect(config).toMatch(/safari:\s*15\s*<<\s*16/);
  });
});
