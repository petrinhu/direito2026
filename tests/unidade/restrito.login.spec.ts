import { describe, expect, it } from 'vitest';
import { loginValido } from '@/core/restrito/login';

describe('loginValido', () => {
  it('3 a 32 caracteres de letras, números, ponto, hífen e sublinhado', () => {
    for (const ok of ['abc', 'Ab.c-d_9', 'a'.repeat(32), 'Nome.Sobrenome'])
      expect(loginValido(ok)).toBe(true);
  });
  it('rejeita curto, longo, espaço, acento e símbolo', () => {
    for (const ruim of ['', 'ab', 'a'.repeat(33), 'a b', 'ação', 'a@b', 'a/b', 'a\nb']) {
      expect(loginValido(ruim)).toBe(false);
    }
  });
  it('maiúscula é diferente de minúscula: nada é normalizado', () => {
    expect(loginValido('ABC')).toBe(true);
  });
});
