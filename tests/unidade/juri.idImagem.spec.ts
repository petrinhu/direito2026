import { describe, expect, it } from 'vitest';
import { ehIdImagem } from '@/core/juri/idImagem';

const ID = 'ab'.repeat(16);

describe('ehIdImagem', () => {
  it('aceita só string no formato do acervo', () => {
    expect(ehIdImagem(ID)).toBe(true);
    expect(ehIdImagem('AB'.repeat(16))).toBe(false);
    expect(ehIdImagem(42)).toBe(false);
  });

  it.each(['ab'.repeat(15), 'zz'.repeat(16), '../' + 'a'.repeat(29), ''])(
    'recusa %j, que não é id',
    (invalido) => {
      expect(ehIdImagem(invalido)).toBe(false);
    }
  );
});
