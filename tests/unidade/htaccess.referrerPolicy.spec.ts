import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** RAD-REFERER: o cabeçalho global do public/.htaccess é same-origin (decisão do líder, 21/11/2026). */
const HTACCESS = fileURLToPath(new URL('../../public/.htaccess', import.meta.url));

describe('public/.htaccess: Referrer-Policy padrão (REF-POL)', () => {
  it('tem uma única Referrer-Policy, com o valor same-origin', () => {
    const linhas = readFileSync(HTACCESS, 'utf8')
      .split('\n')
      .map((linha) => linha.trim())
      .filter((linha) => linha.includes('Referrer-Policy'));
    expect(linhas).toEqual(['Header always set Referrer-Policy "same-origin"']);
  });
});
