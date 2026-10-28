import { describe, expect, it } from 'vitest';
import { senhasIguais } from '@/core/juri/senha';
import { validarTrocaSenhaJuri } from '@/core/juri/trocaSenha';

// Ç em NFC é um code point; em NFD são dois (c e cedilha combinante).
const CEDILHA_NFC = 'ç';
const CEDILHA_NFD = 'ç';
const QUINZE = 'a'.repeat(15);

describe('senhasIguais: compara depois de NFC', () => {
  it('a mesma senha em NFC e em NFD é igual', () => {
    expect(senhasIguais(`senha${CEDILHA_NFC}`, `senha${CEDILHA_NFD}`)).toBe(true);
  });

  it('senhas diferentes não são iguais, e a caixa conta', () => {
    expect(senhasIguais('Senha-de-teste-longa', 'senha-de-teste-longa')).toBe(false);
    expect(senhasIguais('senha-de-teste-A', 'senha-de-teste-B')).toBe(false);
  });
});

describe('validarTrocaSenhaJuri', () => {
  it('nova de 15 caracteres, confirmada e diferente da atual: nenhum problema', () => {
    expect(
      validarTrocaSenhaJuri({ atual: 'provisoria-sintetica', nova: QUINZE, confirmacao: QUINZE })
    ).toEqual([]);
  });

  it('14 caracteres reprova como curta', () => {
    const nova = 'a'.repeat(14);
    expect(
      validarTrocaSenhaJuri({ atual: 'provisoria-sintetica', nova, confirmacao: nova })
    ).toEqual(['curta']);
  });

  it('conta depois de compor: 14 letras mais ç em NFD são 15 e passam', () => {
    const nova = 'a'.repeat(14) + CEDILHA_NFD;
    expect(
      validarTrocaSenhaJuri({ atual: 'provisoria-sintetica', nova, confirmacao: nova })
    ).toEqual([]);
  });

  it('conta depois de compor: 13 letras mais ç em NFD são 14 e reprovam', () => {
    const nova = 'a'.repeat(13) + CEDILHA_NFD;
    expect(
      validarTrocaSenhaJuri({ atual: 'provisoria-sintetica', nova, confirmacao: nova })
    ).toEqual(['curta']);
  });

  it('confirmação diferente reprova', () => {
    expect(
      validarTrocaSenhaJuri({
        atual: 'provisoria-sintetica',
        nova: QUINZE,
        confirmacao: 'b'.repeat(15)
      })
    ).toEqual(['confirmacao']);
  });

  it('nova igual à atual reprova, mesmo quando uma das duas está em NFD', () => {
    const atual = 'a'.repeat(14) + CEDILHA_NFC;
    const nova = 'a'.repeat(14) + CEDILHA_NFD;
    expect(validarTrocaSenhaJuri({ atual, nova, confirmacao: nova })).toEqual(['igual-atual']);
  });

  it('atual vazia reprova', () => {
    expect(validarTrocaSenhaJuri({ atual: '', nova: QUINZE, confirmacao: QUINZE })).toEqual([
      'atual-vazia'
    ]);
  });

  it('lista todos os problemas de uma vez, na ordem da tela', () => {
    expect(validarTrocaSenhaJuri({ atual: '', nova: 'aaa', confirmacao: 'bbb' })).toEqual([
      'atual-vazia',
      'curta',
      'confirmacao'
    ]);
  });
});
