import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** REF-POL: o cabeçalho global do public/.htaccess é o padrão do navegador (strict-origin-when-cross-origin). */
const HTACCESS = fileURLToPath(new URL('../../public/.htaccess', import.meta.url));

describe('public/.htaccess: Referrer-Policy padrão (REF-POL)', () => {
  it('tem uma única Referrer-Policy, com o valor strict-origin-when-cross-origin', () => {
    const linhas = readFileSync(HTACCESS, 'utf8')
      .split('\n')
      .map((linha) => linha.trim())
      .filter((linha) => linha.includes('Referrer-Policy'));
    expect(linhas).toEqual(['Header always set Referrer-Policy "strict-origin-when-cross-origin"']);
  });
});
