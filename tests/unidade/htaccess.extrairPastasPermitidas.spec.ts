import { describe, expect, it } from 'vitest';
import { extrairPastasPermitidas } from '@/core/rotas/extrairPastasPermitidas';

describe('extrairPastasPermitidas', () => {
  it('extrai as pastas da alternativa RewriteCond REQUEST_URI', () => {
    const htaccess = [
      'RewriteCond %{REQUEST_FILENAME} -f [OR]',
      'RewriteCond %{REQUEST_URI} ^/(assets|icones)(/|$)',
      'RewriteRule ^ - [L]'
    ].join('\n');
    expect(extrairPastasPermitidas(htaccess)).toEqual(['assets', 'icones']);
  });

  it('devolve lista vazia se a linha não existir', () => {
    expect(extrairPastasPermitidas('RewriteEngine On')).toEqual([]);
  });

  it('funciona com uma única pasta na alternativa', () => {
    const htaccess = 'RewriteCond %{REQUEST_URI} ^/(assets)(/|$)';
    expect(extrairPastasPermitidas(htaccess)).toEqual(['assets']);
  });
});
