import { describe, expect, it } from 'vitest';
import { ehIdImagem, idDeHex } from '@/core/juri/idImagem';
import { ErroCifra } from '@/core/juri/erroCifra';

const ID = 'ab'.repeat(16);

describe('idDeHex: id do acervo (32 hex minúsculos) para 16 bytes', () => {
  it('converte o hex nos 16 bytes do cabeçalho', () => {
    const bytes = idDeHex(ID);
    expect(bytes.byteLength).toBe(16);
    expect(Buffer.from(bytes).toString('hex')).toBe(ID);
  });

  it.each(['AB'.repeat(16), 'ab'.repeat(15), 'zz'.repeat(16), '../' + 'a'.repeat(29), ''])(
    'recusa %j com erro de entrada',
    (invalido) => {
      let erro: unknown;
      try {
        idDeHex(invalido);
      } catch (e) {
        erro = e;
      }
      expect(erro).toBeInstanceOf(ErroCifra);
      expect((erro as ErroCifra).codigo).toBe('entrada');
    }
  );
});

describe('ehIdImagem', () => {
  it('aceita só string no formato do acervo', () => {
    expect(ehIdImagem(ID)).toBe(true);
    expect(ehIdImagem('AB'.repeat(16))).toBe(false);
    expect(ehIdImagem(42)).toBe(false);
  });
});
