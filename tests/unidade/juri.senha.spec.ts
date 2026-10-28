import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ALFABETO_PROVISORIA,
  LIMITE_SEM_VIES,
  MINIMO_SENHA,
  TAMANHO_PROVISORIA,
  normalizarSenha,
  contarCaracteres,
  gerarSenhaProvisoria,
  indiceSemVies,
  validarSenhaNova
} from '@/core/juri/senha';

/*
 * Escapes \u{...} no lugar de emoji literal: o texto do teste fica ASCII e a
 * contagem por code point fica visível no próprio código.
 */
const EMOJI = '\u{1F600}';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('validarSenhaNova (15 ou mais, sem regra de composição)', () => {
  it('mínimo é 15 caracteres (SP 800-63B-4 §3.1.1.2, plano seção 4, D5)', () => {
    expect(MINIMO_SENHA).toBe(15);
  });

  it('14 caracteres reprovam e 15 passam', () => {
    expect(validarSenhaNova('abcdefghijklmn').valida).toBe(false);
    expect(validarSenhaNova('abcdefghijklmno').valida).toBe(true);
  });

  it('a contagem é por code point: 13 letras mais 1 emoji são 14 e reprovam (UTF-16 daria 15)', () => {
    const senha = 'abcdefghijklm' + EMOJI;
    expect(senha.length).toBe(15);
    expect(contarCaracteres(senha)).toBe(14);
    expect(validarSenhaNova(senha).valida).toBe(false);
  });

  it('14 letras mais 1 emoji são 15 e passam (UTF-16 daria 16)', () => {
    const senha = 'abcdefghijklmn' + EMOJI;
    expect(senha.length).toBe(16);
    expect(contarCaracteres(senha)).toBe(15);
    expect(validarSenhaNova(senha).valida).toBe(true);
  });

  it('14 emojis reprovam: 28 unidades UTF-16 não são 28 caracteres', () => {
    const senha = EMOJI.repeat(14);
    expect(senha.length).toBe(28);
    expect(validarSenhaNova(senha).valida).toBe(false);
  });

  it('acento precomposto conta como um caractere', () => {
    expect(validarSenhaNova('á'.repeat(14)).valida).toBe(false);
    expect(validarSenhaNova('á'.repeat(15)).valida).toBe(true);
  });

  it('acento decomposto (NFD) conta como o precomposto: a senha é normalizada em NFC antes de contar', () => {
    const decomposto = 'e\u0301'.repeat(7);
    expect(decomposto.length).toBe(14);
    expect(contarCaracteres(decomposto)).toBe(7);
    expect(validarSenhaNova(decomposto).valida).toBe(false);
    expect(validarSenhaNova('e\u0301'.repeat(15)).valida).toBe(true);
  });

  it('NFD e NFC da mesma letra viram a mesma string em normalizarSenha', () => {
    expect(normalizarSenha('e\u0301')).toBe('\u00e9');
    expect(normalizarSenha('\u00e9')).toBe('\u00e9');
  });

  it('não impõe composição: só letras, só dígitos e com espaços passam', () => {
    expect(validarSenhaNova('aaaaaaaaaaaaaaa').valida).toBe(true);
    expect(validarSenhaNova('123456789012345').valida).toBe(true);
    expect(validarSenhaNova('a b c d e f g h i j k l m n o').valida).toBe(true);
  });

  it('devolve a contagem e o mínimo para a interface poder dizer quantos faltam', () => {
    expect(validarSenhaNova('abc')).toEqual({ valida: false, caracteres: 3, minimo: 15 });
  });

  it('string vazia reprova', () => {
    expect(validarSenhaNova('').valida).toBe(false);
  });
});

describe('gerarSenhaProvisoria (20 ou mais, amostragem por rejeição)', () => {
  it('alfabeto é o de contas.php:20 (55 símbolos distintos, sem I, O, i, l, o)', () => {
    expect(ALFABETO_PROVISORIA).toBe('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789');
    expect(ALFABETO_PROVISORIA.length).toBe(55);
    expect(new Set(ALFABETO_PROVISORIA).size).toBe(55);
  });

  it('tamanho é 20 ou mais', () => {
    expect(TAMANHO_PROVISORIA).toBeGreaterThanOrEqual(20);
  });

  it('a provisória tem TAMANHO_PROVISORIA caracteres, todos do alfabeto, e passa na validação', () => {
    const senha = gerarSenhaProvisoria();
    expect(contarCaracteres(senha)).toBe(TAMANHO_PROVISORIA);
    expect([...senha].every((c) => ALFABETO_PROVISORIA.includes(c))).toBe(true);
    expect(validarSenhaNova(senha).valida).toBe(true);
  });

  it('duas provisórias seguidas diferem', () => {
    expect(gerarSenhaProvisoria()).not.toBe(gerarSenhaProvisoria());
  });

  it('limite sem viés é 256 - (256 mod 55) = 220', () => {
    expect(LIMITE_SEM_VIES).toBe(220);
  });

  it('bytes de 220 a 255 são descartados (null)', () => {
    for (let byte = 220; byte <= 255; byte++) {
      expect(indiceSemVies(byte)).toBeNull();
    }
  });

  it('bytes de 0 a 219 mapeiam para byte mod 55, e cada índice aparece exatamente 4 vezes', () => {
    const contagem = new Array<number>(55).fill(0);
    for (let byte = 0; byte < 220; byte++) {
      const indice = indiceSemVies(byte);
      expect(indice).toBe(byte % 55);
      if (indice !== null) contagem[indice] = (contagem[indice] ?? 0) + 1;
    }
    expect(contagem.every((n) => n === 4)).toBe(true);
  });

  it('descarta bytes acima do limite em vez de reduzi-los por módulo', () => {
    // Se a rejeição não existisse, 255 mod 55 = 35 viraria um caractere.
    // A primeira leitura só traz 255, então nada pode sair dela; a segunda traz zeros.
    let chamada = 0;
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(
      <T extends ArrayBufferView>(arr: T): T => {
        const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
        bytes.fill(chamada === 0 ? 255 : 0);
        chamada++;
        return arr;
      }
    );

    expect(gerarSenhaProvisoria()).toBe('A'.repeat(TAMANHO_PROVISORIA));
    expect(chamada).toBe(2);
  });
});
