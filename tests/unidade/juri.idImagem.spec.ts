import { describe, expect, it } from 'vitest';
import { ErroCifra, cifrarImagem, gerarCek } from '@/core/juri/cifra';
import { ehIdImagem, idDeHex, kidDoArquivo } from '@/core/juri/idImagem';
import { bytesParaHex, erroCifraDe } from './apoio/cifraJuri';

const ID = 'ab'.repeat(16);

describe('idDeHex: id do acervo (32 hex minúsculos) para 16 bytes', () => {
  it('converte o hex nos 16 bytes do cabeçalho', () => {
    const bytes = idDeHex(ID);
    expect(bytes.byteLength).toBe(16);
    expect(bytesParaHex(bytes)).toBe(ID);
  });

  it.each(['AB'.repeat(16), 'ab'.repeat(15), 'zz'.repeat(16), '../' + 'a'.repeat(29), ''])(
    'recusa %j com erro de entrada',
    async (invalido) => {
      expect((await erroCifraDe(Promise.resolve().then(() => idDeHex(invalido)))).codigo).toBe(
        'entrada'
      );
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

describe('kidDoArquivo', () => {
  it('lê o kid dos bytes 8 a 23 do próprio arquivo cifrado', async () => {
    const kid = new Uint8Array(16).map((_, i) => i + 1);
    const cek = await gerarCek();
    const arquivo = await cifrarImagem(new Uint8Array([1, 2, 3]), cek, {
      kid,
      id: idDeHex(ID),
      tipo: 'png'
    });
    expect(bytesParaHex(kidDoArquivo(arquivo))).toBe(bytesParaHex(kid));
  });

  it('arquivo menor que o cabeçalho mais a tag é recusado', () => {
    expect(() => kidDoArquivo(new Uint8Array(40))).toThrow(ErroCifra);
  });
});
