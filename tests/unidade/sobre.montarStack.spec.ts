import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { montarStack, type LockfileLido, type PacoteLido } from '../../src/core/sobre/montarStack';
import { PAPEIS_DAS_DEPENDENCIAS } from '../../src/conteudo/sobre/papeis';

/** Pacote e lockfile sintéticos: nenhum teste deste arquivo depende de versão real. */
const PACOTE_DE_EXEMPLO: PacoteLido = {
  version: '9.9.9.9',
  dependencies: { 'pacote-exemplo': '^3.5.0' },
  devDependencies: { 'ferramenta-exemplo': '^1.0.0' }
};

function lockfileDe(versaoInstalada: string, extras: Partial<LockfileLido> = {}): LockfileLido {
  return {
    version: '1.15.1.0',
    packages: {
      'node_modules/pacote-exemplo': {
        version: versaoInstalada,
        license: 'MIT',
        dev: true
      },
      'node_modules/ferramenta-exemplo': { version: '1.2.0', license: 'Apache-2.0' }
    },
    ...extras
  };
}

const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const pacoteReal = JSON.parse(readFileSync(`${RAIZ}package.json`, 'utf-8')) as PacoteLido;
const lockfileReal = JSON.parse(readFileSync(`${RAIZ}package-lock.json`, 'utf-8')) as LockfileLido;

describe('montarStack: versões vêm do lockfile instalado', () => {
  it('usa a versão instalada, e não a faixa do package.json', () => {
    const stack = montarStack(PACOTE_DE_EXEMPLO, lockfileDe('3.5.43'), '20.11.0');

    const dep = stack.dependencias.find((d) => d.nome === 'pacote-exemplo');
    expect(dep?.versao).toBe('3.5.43');
    expect(dep?.versao).not.toBe('^3.5.0');
  });

  it('trocar a versão no lockfile muda a saída', () => {
    const antes = montarStack(PACOTE_DE_EXEMPLO, lockfileDe('3.5.43'), '20.11.0');
    const depois = montarStack(PACOTE_DE_EXEMPLO, lockfileDe('3.5.44'), '20.11.0');

    expect(antes.dependencias).not.toEqual(depois.dependencias);
    expect(depois.dependencias.find((d) => d.nome === 'pacote-exemplo')?.versao).toBe('3.5.44');
  });

  it('ignora a versão da raiz do lockfile e a chave aninhada de outra dependência', () => {
    const lock = lockfileDe('3.5.43', {
      packages: {
        'node_modules/pacote-exemplo': { version: '3.5.43', license: 'MIT' },
        'node_modules/ferramenta-exemplo': { version: '1.2.0', license: 'Apache-2.0' },
        'node_modules/ferramenta-exemplo/node_modules/pacote-exemplo': {
          version: '0.0.1',
          license: 'ISC'
        }
      }
    });

    const stack = montarStack(PACOTE_DE_EXEMPLO, lock, '20.11.0');

    expect(stack.dependencias.find((d) => d.nome === 'pacote-exemplo')?.versao).toBe('3.5.43');
    expect(stack.dependencias.map((d) => d.versao)).not.toContain('1.15.1.0');
    expect(stack.dependencias.map((d) => d.versao)).not.toContain('0.0.1');
  });

  it('traz a versão do site (package.json) e a versão do Node do build', () => {
    const stack = montarStack(PACOTE_DE_EXEMPLO, lockfileDe('3.5.43'), '20.11.0');

    expect(stack.versaoSite).toBe('9.9.9.9');
    expect(stack.versaoNode).toBe('20.11.0');
  });
});

describe('montarStack: falha fechada', () => {
  it('dependência ausente do lockfile é erro de build, nunca "desconhecida" em silêncio', () => {
    const lock = lockfileDe('3.5.43', {
      packages: { 'node_modules/ferramenta-exemplo': { version: '1.2.0', license: 'MIT' } }
    });

    expect(() => montarStack(PACOTE_DE_EXEMPLO, lock, '20.11.0')).toThrow(/pacote-exemplo/);
  });

  it('entrada do lockfile sem version é erro de build', () => {
    const lock = lockfileDe('3.5.43', {
      packages: {
        'node_modules/pacote-exemplo': { license: 'MIT' },
        'node_modules/ferramenta-exemplo': { version: '1.2.0', license: 'MIT' }
      }
    });

    expect(() => montarStack(PACOTE_DE_EXEMPLO, lock, '20.11.0')).toThrow(/pacote-exemplo/);
  });

  it('entrada do lockfile sem license é erro de build', () => {
    const lock = lockfileDe('3.5.43', {
      packages: {
        'node_modules/pacote-exemplo': { version: '3.5.43' },
        'node_modules/ferramenta-exemplo': { version: '1.2.0', license: 'MIT' }
      }
    });

    expect(() => montarStack(PACOTE_DE_EXEMPLO, lock, '20.11.0')).toThrow(/pacote-exemplo/);
  });

  it('versão do Node vazia é erro de build', () => {
    expect(() => montarStack(PACOTE_DE_EXEMPLO, lockfileDe('3.5.43'), '')).toThrow();
  });
});

describe('montarStack: grupo e ordem', () => {
  it('o grupo vem da seção do package.json, não do flag dev do lockfile', () => {
    const stack = montarStack(PACOTE_DE_EXEMPLO, lockfileDe('3.5.43'), '20.11.0');

    expect(stack.dependencias.find((d) => d.nome === 'pacote-exemplo')?.grupo).toBe('execucao');
    expect(stack.dependencias.find((d) => d.nome === 'ferramenta-exemplo')?.grupo).toBe(
      'construcao'
    );
  });

  it('lista execução antes de construção, cada grupo em ordem alfabética', () => {
    const pacote: PacoteLido = {
      version: '1.0.0.0',
      dependencies: { zeta: '^1.0.0', alfa: '^1.0.0' },
      devDependencies: { beta: '^1.0.0' }
    };
    const lock: LockfileLido = {
      packages: {
        'node_modules/zeta': { version: '1.0.0', license: 'MIT' },
        'node_modules/alfa': { version: '1.0.0', license: 'MIT' },
        'node_modules/beta': { version: '1.0.0', license: 'MIT' }
      }
    };

    const nomes = montarStack(pacote, lock, '20.11.0').dependencias.map((d) => d.nome);

    expect(nomes).toEqual(['alfa', 'zeta', 'beta']);
  });
});

describe('montarStack com o projeto real', () => {
  it('gera exatamente as dependências do package.json real', () => {
    const stack = montarStack(pacoteReal, lockfileReal, process.versions.node);

    const nomes = stack.dependencias.map((d) => d.nome).sort();
    const esperados = [
      ...Object.keys(pacoteReal.dependencies ?? {}),
      ...Object.keys(pacoteReal.devDependencies ?? {})
    ].sort();
    expect(nomes).toEqual(esperados);
  });
});

describe('constante de build __STACK_SITE__', () => {
  it('tem a versão do site e as dependências do package.json real', () => {
    const esperados = [
      ...Object.keys(pacoteReal.dependencies ?? {}),
      ...Object.keys(pacoteReal.devDependencies ?? {})
    ].sort();

    expect(__STACK_SITE__.versaoSite).toBe(pacoteReal.version);
    expect(__STACK_SITE__.versaoNode).toBe(process.versions.node);
    expect(__STACK_SITE__.dependencias.map((d) => d.nome).sort()).toEqual(esperados);
  });
});

describe('papeis das dependências (anti-deriva com o package.json)', () => {
  const todasAsDependencias = [
    ...Object.keys(pacoteReal.dependencies ?? {}),
    ...Object.keys(pacoteReal.devDependencies ?? {})
  ].sort();

  it('toda dependência tem papel e todo papel tem dependência', () => {
    expect(Object.keys(PAPEIS_DAS_DEPENDENCIAS).sort()).toEqual(todasAsDependencias);
  });

  it('cada papel é uma frase curta, sem travessão e sem termo proibido na página', () => {
    const proibidos = /\u2014|\u2013|\baula|\bslide|\bo material\b|\bno material\b/i;
    for (const [nome, papel] of Object.entries(PAPEIS_DAS_DEPENDENCIAS)) {
      expect(papel.trim().length, nome).toBeGreaterThan(0);
      expect(papel.length, nome).toBeLessThanOrEqual(140);
      expect(papel, nome).not.toMatch(proibidos);
    }
  });
});
