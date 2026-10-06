import { describe, expect, it } from 'vitest';
import {
  LIMITE_MAXIMO_SENHA,
  LIMITE_MINIMO_SENHA,
  validarTrocaDeSenha
} from '@/core/restrito/senha';

const ok = {
  atual: 'senha-antiga',
  nova: 'uma senha nova longa',
  confirmacao: 'uma senha nova longa'
};

describe('validarTrocaDeSenha', () => {
  it('limites são 10 e 128', () => {
    expect([LIMITE_MINIMO_SENHA, LIMITE_MAXIMO_SENHA]).toEqual([10, 128]);
  });

  it('aceita senha entre 10 e 128 caracteres, sem regra de composição', () => {
    expect(validarTrocaDeSenha(ok)).toEqual([]);
    expect(
      validarTrocaDeSenha({ ...ok, nova: 'a'.repeat(10), confirmacao: 'a'.repeat(10) })
    ).toEqual([]);
    expect(
      validarTrocaDeSenha({ ...ok, nova: 'a'.repeat(128), confirmacao: 'a'.repeat(128) })
    ).toEqual([]);
  });

  it('conta caracteres, não bytes nem unidades UTF-16', () => {
    const emojis = '😀'.repeat(10);
    expect(validarTrocaDeSenha({ ...ok, nova: emojis, confirmacao: emojis })).toEqual([]);
    const acentos = 'ççççççççç';
    expect(validarTrocaDeSenha({ ...ok, nova: acentos, confirmacao: acentos })).toEqual(['curta']);
  });

  it('rejeita curta e longa', () => {
    expect(validarTrocaDeSenha({ ...ok, nova: 'a'.repeat(9), confirmacao: 'a'.repeat(9) })).toEqual(
      ['curta']
    );
    expect(
      validarTrocaDeSenha({ ...ok, nova: 'a'.repeat(129), confirmacao: 'a'.repeat(129) })
    ).toEqual(['longa']);
  });

  it('exige confirmação igual, atual preenchida e nova diferente da atual', () => {
    expect(validarTrocaDeSenha({ ...ok, confirmacao: 'outra coisa qualquer' })).toEqual([
      'confirmacao'
    ]);
    expect(validarTrocaDeSenha({ ...ok, atual: '' })).toEqual(['atual-vazia']);
    expect(validarTrocaDeSenha({ ...ok, atual: ok.nova })).toEqual(['igual-atual']);
  });

  it('comparação é exata: maiúscula diferente é senha diferente', () => {
    expect(
      validarTrocaDeSenha({
        ...ok,
        atual: 'SENHA NOVA LONGA',
        nova: 'senha nova longa',
        confirmacao: 'senha nova longa'
      })
    ).toEqual([]);
  });
});
