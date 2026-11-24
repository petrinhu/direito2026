import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  OBRIGATORIOS_HTACCESS,
  OBRIGATORIOS_WEBROOT,
  PASSAGENS_ESPERADAS
} from '../../scripts/apoio/pacotePublico';

/**
 * Lista fechada do pacote (LU-F4.2-N4). Pinos: a lista mora em scripts/apoio/pacotePublico.ts,
 * e os portões a leem de lá, sem cópia. A ordem e o texto das regras não mudam.
 */
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const GATE_HTACCESS = readFileSync(join(RAIZ, 'scripts/verificar-htaccess-pastas.ts'), 'utf-8');

describe('lista fechada do pacote público (LU-F4.2-N4)', () => {
  it('a regra de passagem dos literais é o texto exato de antes (não muda o .htaccess esperado)', () => {
    expect(PASSAGENS_ESPERADAS[0]).toBe(
      '^(sw\\.js|robots\\.txt|entrada\\.css|convite\\.js|icones/favicon\\.svg|fontes/inter-400\\.woff2|fontes/cormorant-garamond-700\\.woff2|fontes/OFL\\.txt)$'
    );
    expect(PASSAGENS_ESPERADAS[1]).toBe('^api/[a-z0-9/-]+\\.php$');
  });

  it('o webroot obrigatório mantém a ordem de antes', () => {
    expect(OBRIGATORIOS_WEBROOT).toEqual([
      'sw.js',
      'robots.txt',
      'entrada.css',
      'convite.js',
      'icones/favicon.svg',
      'fontes/inter-400.woff2',
      'fontes/cormorant-garamond-700.woff2',
      'fontes/OFL.txt',
      '.htaccess',
      'api/nucleo/.htaccess',
      'api/portao.php',
      'api/saude.php'
    ]);
  });

  it('o .htaccess do build confere os três obrigatórios, na ordem de antes', () => {
    expect(OBRIGATORIOS_HTACCESS).toEqual([
      'api/portao.php',
      'api/saude.php',
      'api/nucleo/.htaccess'
    ]);
  });

  it('o portão do .htaccess não guarda cópia da lista: lê de pacotePublico', () => {
    expect(GATE_HTACCESS).toContain("from './apoio/pacotePublico'");
    expect(GATE_HTACCESS).not.toContain("'api/saude.php'");
    expect(GATE_HTACCESS).not.toContain("'sw.js'");
    expect(GATE_HTACCESS).not.toContain('function listarArquivos');
  });
});
