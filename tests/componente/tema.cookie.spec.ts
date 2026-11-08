// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { criarStoreTema, montarCookieTema } from '@/app/stores/tema';
import { RepositorioMemoria } from '@/app/persistencia/RepositorioMemoria';

/**
 * Cookie de tema (OS-F1, LU-C2): é o que a tela de entrada lê no servidor para acertar o tema
 * já no primeiro paint. Só diz claro ou escuro, sem dado pessoal. Sem escolha, o cookie some e
 * vale a preferência do sistema.
 */
describe('montarCookieTema', () => {
  it('claro e escuro gravam light e dark, com __Host-, Secure, Path=/ e um ano', () => {
    expect(montarCookieTema('claro')).toBe(
      '__Host-d26tema=light; Path=/; Secure; SameSite=Lax; Max-Age=31536000'
    );
    expect(montarCookieTema('escuro')).toBe(
      '__Host-d26tema=dark; Path=/; Secure; SameSite=Lax; Max-Age=31536000'
    );
  });

  it('sistema apaga o cookie (Max-Age=0), para a tela voltar a seguir o sistema', () => {
    expect(montarCookieTema('sistema')).toBe(
      '__Host-d26tema=; Path=/; Secure; SameSite=Lax; Max-Age=0'
    );
  });
});

describe('criarStoreTema grava o cookie a cada troca', () => {
  it('cada troca escreve no document.cookie a string que montarCookieTema devolve', () => {
    const escritas: string[] = [];
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => '',
      set: (valor: string) => {
        escritas.push(valor);
      }
    });
    try {
      const store = criarStoreTema(new RepositorioMemoria());
      store.alternar();
      store.alternar();
      store.alternar();
      expect(escritas).toContain(montarCookieTema('claro'));
      expect(escritas).toContain(montarCookieTema('escuro'));
      expect(escritas.at(-1)).toBe(montarCookieTema('sistema'));
    } finally {
      delete (document as unknown as { cookie?: string }).cookie;
    }
  });
});
