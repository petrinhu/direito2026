import { describe, expect, it } from 'vitest';
import { bytesParaBase64Url } from '@/core/juri/base64';
import { aadDoEmbrulho } from '@/core/juri/aadEmbrulho';
import { ErroCifra } from '@/core/juri/cifra';
import { utf8 } from './apoio/cifraJuri';

/** Formato que o servidor aceita para o AUTH (juri.php: ^[A-Za-z0-9_-]{43}$). */
const FORMATO_AUTH = /^[A-Za-z0-9_-]{43}$/;

describe('bytesParaBase64Url (AUTH no corpo do login)', () => {
  it('32 bytes viram 43 caracteres base64url, sem padding', () => {
    expect(bytesParaBase64Url(new Uint8Array(32).fill(0xff))).toMatch(FORMATO_AUTH);
  });

  it('usa - e _ no lugar de + e /, e não tem =', () => {
    // [0xfb, 0xff] em base64 padrão é "+/8=", em base64url é "-_8" (RFC 4648 §5).
    expect(bytesParaBase64Url(new Uint8Array([0xfb, 0xff]))).toBe('-_8');
  });

  it('qualquer AUTH de 32 bytes sai no formato aceito pelo servidor', () => {
    for (let i = 0; i < 200; i++) {
      const bytes = new Uint8Array(32);
      globalThis.crypto.getRandomValues(bytes);
      expect(bytesParaBase64Url(bytes)).toMatch(FORMATO_AUTH);
    }
  });
});

describe('aadDoEmbrulho (AAD do embrulho da CEK, provisório: plano da fatia C4)', () => {
  const SALT = Uint8Array.from({ length: 16 }, (_, i) => i + 1);

  it('é usuario, depois salt de 16 bytes, depois a versão 1', () => {
    expect(aadDoEmbrulho('admin', SALT)).toEqual(new Uint8Array([...utf8('admin'), ...SALT, 1]));
  });

  it('muda com o usuário e muda com o salt (o embrulho fica ligado aos dois)', () => {
    const base = aadDoEmbrulho('admin', SALT);
    const outroSalt = SALT.slice();
    outroSalt[0] = 0xee;
    expect(aadDoEmbrulho('outro', SALT)).not.toEqual(base);
    expect(aadDoEmbrulho('admin', outroSalt)).not.toEqual(base);
  });

  it('salt que não tem 16 bytes é recusado como entrada', () => {
    expect(() => aadDoEmbrulho('admin', new Uint8Array(15))).toThrow(ErroCifra);
  });
});
