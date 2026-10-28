import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ErroCifra,
  ITERACOES_PBKDF2,
  ROTULO_AUTH,
  ROTULO_KEK,
  cifrarImagem,
  decifrarImagem,
  derivar,
  desembrulharCek,
  embrulharCek,
  gerarCek,
  hkdfBits,
  pbkdf2Bits,
  type Embrulho
} from '@/core/juri/cifra';
import {
  b64ParaBytes,
  bitInvertido,
  bytesParaB64,
  bytesParaHex,
  comByte,
  erroCifraDe,
  hexParaBytes,
  nomeDaFalha,
  utf8
} from './apoio/cifraJuri';

/*
 * Vetores copiados byte a byte do texto bruto das RFCs (espaços só para legibilidade,
 * o helper hexParaBytes os descarta). Origem de cada um, linha a linha:
 *   RFC 7914 §11, https://www.rfc-editor.org/rfc/rfc7914.txt, linhas 631-636 e 638-643.
 *   RFC 5869 A.1, https://www.rfc-editor.org/rfc/rfc5869.txt, linhas 521-523 e 528-530.
 */
const PBKDF2_PASSWD_C1_DK64 = `
55 ac 04 6e 56 e3 08 9f ec 16 91 c2 25 44 b6 05
f9 41 85 21 6d de 04 65 e6 8b 9d 57 c2 0d ac bc
49 ca 9c cc f1 79 b6 45 99 16 64 b3 9d 77 ef 31
7c 71 b8 45 b1 e3 0b d5 09 11 20 41 d3 a1 97 83`;

const PBKDF2_PASSWORD_NACL_C80000_DK64 = `
4d dc d8 f6 0b 98 be 21 83 0c ee 5e f2 27 01 f9
64 1a 44 18 d0 4c 04 14 ae ff 08 87 6b 34 ab 56
a1 d4 25 a1 22 58 33 54 9a db 84 1b 51 c9 b3 17
6a 27 2b de bb a1 d0 78 47 8f 62 b3 97 f3 3c 8d`;

const HKDF_A1_IKM = '0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b';
const HKDF_A1_SALT = '000102030405060708090a0b0c';
const HKDF_A1_INFO = 'f0f1f2f3f4f5f6f7f8f9';
const HKDF_A1_OKM = `
3cb25f25faacd57a90434f64d0362f2a
2d2d0a90cf1a5a4c5db02d56ecc4c5bf
34007208d5b887185865`;

// Padrão WebCrypto: InvalidAccessError. Node 22 lança InvalidAccessException; aceita-se as duas, o que importa é a falha.
const NOMES_FALHA_EXPORTAR = ['InvalidAccessError', 'InvalidAccessException'];
const SEM_SALT = new Uint8Array(0);
const SUBTLE = globalThis.crypto.subtle;
const SENHA = 'senha-sintetica-do-teste-27-chars';
const SALT = hexParaBytes('000102030405060708090a0b0c0d0e0f');
const AAD = utf8('uid-sintetico|kid-sintetico|1');
const KID = hexParaBytes('000102030405060708090a0b0c0d0e0f');
const ID = hexParaBytes('202122232425262728292a2b2c2d2e2f');
const CLARO = utf8('bytes-sinteticos-de-imagem-de-teste');

function dadosDoEmbrulho(e: Embrulho): {
  iv: Uint8Array<ArrayBuffer>;
  ct: Uint8Array<ArrayBuffer>;
} {
  return { iv: b64ParaBytes(e.iv), ct: b64ParaBytes(e.ct) };
}

async function cifrarTeste(tipo: 'jpeg' | 'png' | 'webp' = 'png') {
  const cek = await gerarCek();
  const arquivo = await cifrarImagem(CLARO, cek, { kid: KID, id: ID, tipo });
  return { cek, arquivo };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PBKDF2-HMAC-SHA256 (RFC 7914 §11)', () => {
  it('P="passwd", S="salt", c=1, dkLen=64 bate com o vetor da RFC', async () => {
    const saida = await pbkdf2Bits(utf8('passwd'), utf8('salt'), 1, 512);
    expect(saida).toEqual(hexParaBytes(PBKDF2_PASSWD_C1_DK64));
  });

  it('P="Password", S="NaCl", c=80000, dkLen=64 bate com o vetor da RFC', async () => {
    const saida = await pbkdf2Bits(utf8('Password'), utf8('NaCl'), 80000, 512);
    expect(saida).toEqual(hexParaBytes(PBKDF2_PASSWORD_NACL_C80000_DK64));
  });

  it('a transcrição do vetor tem o tamanho que a RFC declara (64 bytes)', () => {
    expect(hexParaBytes(PBKDF2_PASSWD_C1_DK64).byteLength).toBe(64);
    expect(hexParaBytes(PBKDF2_PASSWORD_NACL_C80000_DK64).byteLength).toBe(64);
  });
});

describe('HKDF-SHA256 (RFC 5869 A.1, Test Case 1)', () => {
  it('OKM de 42 bytes bate com o vetor da RFC', async () => {
    const okm = await hkdfBits(
      hexParaBytes(HKDF_A1_IKM),
      hexParaBytes(HKDF_A1_SALT),
      hexParaBytes(HKDF_A1_INFO),
      42 * 8
    );
    expect(okm).toEqual(hexParaBytes(HKDF_A1_OKM));
  });

  it('a transcrição tem os tamanhos declarados na RFC (IKM 22, salt 13, info 10, OKM 42)', () => {
    expect(hexParaBytes(HKDF_A1_IKM).byteLength).toBe(22);
    expect(hexParaBytes(HKDF_A1_SALT).byteLength).toBe(13);
    expect(hexParaBytes(HKDF_A1_INFO).byteLength).toBe(10);
    expect(hexParaBytes(HKDF_A1_OKM).byteLength).toBe(42);
  });
});

describe('derivação da chave do usuário (derivar)', () => {
  it('rótulos e iterações são os do documento (pesquisa §2 e plano seção 1)', () => {
    expect(ROTULO_KEK).toBe('juri-kek-v1');
    expect(ROTULO_AUTH).toBe('juri-auth-v1');
    expect(ITERACOES_PBKDF2).toBe(600000);
  });

  it('AUTH = HKDF(MK, "juri-auth-v1") sem salt, com MK = PBKDF2(senha, salt, 600000, 256)', async () => {
    const mk = await pbkdf2Bits(utf8(SENHA), SALT, 600000, 256);
    const esperado = await hkdfBits(mk, SEM_SALT, utf8(ROTULO_AUTH), 256);
    const { auth } = await derivar(SENHA, SALT);
    expect(auth.byteLength).toBe(32);
    expect(auth).toEqual(esperado);
  });

  it('KEK = HKDF(MK, "juri-kek-v1"): a chave importada dos mesmos bytes desembrulha o embrulho', async () => {
    const mk = await pbkdf2Bits(utf8(SENHA), SALT, 600000, 256);
    const bytesKek = await hkdfBits(mk, SEM_SALT, utf8(ROTULO_KEK), 256);
    const { auth } = await derivar(SENHA, SALT);
    expect(bytesKek).not.toEqual(auth);

    const kekIndependente = await SUBTLE.importKey('raw', bytesKek, 'AES-GCM', false, [
      'wrapKey',
      'unwrapKey'
    ]);
    const { kek } = await derivar(SENHA, SALT);
    const cek = await gerarCek();
    const embrulho = await embrulharCek(cek, kek, AAD);

    const recuperada = await desembrulharCek(embrulho, kekIndependente, AAD, { extraivel: true });
    const bytesOriginais = new Uint8Array(await SUBTLE.exportKey('raw', cek));
    const bytesRecuperados = new Uint8Array(await SUBTLE.exportKey('raw', recuperada));
    expect(bytesParaHex(bytesRecuperados)).toBe(bytesParaHex(bytesOriginais));
  });

  it('mesma senha em NFC e em NFD gera o mesmo AUTH e a mesma KEK (normalização antes de derivar)', async () => {
    const nfc = 'senha-com-é-sintetica-do-teste';
    const nfd = 'senha-com-é-sintetica-do-teste';
    expect(nfd).not.toBe(nfc);
    const porNfc = await derivar(nfc, SALT);
    const porNfd = await derivar(nfd, SALT);
    expect(porNfd.auth).toEqual(porNfc.auth);
    const cek = await gerarCek();
    const embrulho = await embrulharCek(cek, porNfc.kek, AAD);
    await expect(desembrulharCek(embrulho, porNfd.kek, AAD)).resolves.toBeDefined();
  });

  it('a KEK não é extraível e só serve para embrulhar (usages wrapKey e unwrapKey)', async () => {
    const { kek } = await derivar(SENHA, SALT);
    expect(kek.extractable).toBe(false);
    expect([...kek.usages].sort()).toEqual(['unwrapKey', 'wrapKey']);
    expect(NOMES_FALHA_EXPORTAR).toContain(await nomeDaFalha(SUBTLE.exportKey('raw', kek)));
  });

  it('salt com tamanho diferente de 16 bytes é recusado como entrada', async () => {
    const erro = await erroCifraDe(derivar(SENHA, new Uint8Array(15)));
    expect(erro.codigo).toBe('entrada');
  });

  it('senha errada: o embrulho não desembrulha e a falha sai como ErroCifra integridade', async () => {
    const certo = await derivar(SENHA, SALT);
    const errado = await derivar('outra-senha-sintetica-do-teste', SALT);
    const cek = await gerarCek();
    const embrulho = await embrulharCek(cek, certo.kek, AAD);

    const erro = await erroCifraDe(desembrulharCek(embrulho, errado.kek, AAD));
    expect(erro.codigo).toBe('integridade');
  });
});

describe('CEK e embrulho', () => {
  it('gerarCek devolve chave AES-256 extraível, para ser embrulhada logo depois', async () => {
    const cek = await gerarCek();
    expect(cek.extractable).toBe(true);
    expect(cek.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    expect([...cek.usages].sort()).toEqual(['decrypt', 'encrypt']);
    expect((await SUBTLE.exportKey('raw', cek)).byteLength).toBe(32);
  });

  it('ida e volta do embrulho devolve a mesma chave', async () => {
    const { kek } = await derivar(SENHA, SALT);
    const cek = await gerarCek();
    const embrulho = await embrulharCek(cek, kek, AAD);
    const volta = await desembrulharCek(embrulho, kek, AAD, { extraivel: true });
    expect(bytesParaHex(new Uint8Array(await SUBTLE.exportKey('raw', volta)))).toBe(
      bytesParaHex(new Uint8Array(await SUBTLE.exportKey('raw', cek)))
    );
  });

  it('o embrulho tem o formato {v:1, iv, ct} com IV de 12 bytes e ct com tag de 16 bytes no fim', async () => {
    const { kek } = await derivar(SENHA, SALT);
    const cek = await gerarCek();
    const embrulho = await embrulharCek(cek, kek, AAD);
    expect(embrulho.v).toBe(1);
    const { iv, ct } = dadosDoEmbrulho(embrulho);
    expect(iv.byteLength).toBe(12);
    expect(ct.byteLength).toBe(32 + 16);
  });

  it('CEK desembrulhada sem opção NÃO é extraível: exportKey falha (§5.3, uso normal)', async () => {
    const { kek } = await derivar(SENHA, SALT);
    const cek = await gerarCek();
    const embrulho = await embrulharCek(cek, kek, AAD);

    const emUso = await desembrulharCek(embrulho, kek, AAD);
    expect(emUso.extractable).toBe(false);
    expect(NOMES_FALHA_EXPORTAR).toContain(await nomeDaFalha(SUBTLE.exportKey('raw', emUso)));
  });

  it('troca de AAD no embrulho falha como integridade', async () => {
    const { kek } = await derivar(SENHA, SALT);
    const cek = await gerarCek();
    const embrulho = await embrulharCek(cek, kek, AAD);

    const erro = await erroCifraDe(desembrulharCek(embrulho, kek, utf8('outro-uid|kid|1')));
    expect(erro.codigo).toBe('integridade');
  });

  it('1 byte do ct do embrulho adulterado falha como integridade', async () => {
    const { kek } = await derivar(SENHA, SALT);
    const cek = await gerarCek();
    const embrulho = await embrulharCek(cek, kek, AAD);
    const { ct } = dadosDoEmbrulho(embrulho);
    const adulterado: Embrulho = { ...embrulho, ct: bytesParaB64(bitInvertido(ct, 3)) };

    const erro = await erroCifraDe(desembrulharCek(adulterado, kek, AAD));
    expect(erro.codigo).toBe('integridade');
  });

  it('versão de embrulho desconhecida é recusada antes do unwrap', async () => {
    const { kek } = await derivar(SENHA, SALT);
    const cek = await gerarCek();
    const embrulho = await embrulharCek(cek, kek, AAD);
    const espiao = vi.spyOn(SUBTLE, 'unwrapKey');

    const erro = await erroCifraDe(desembrulharCek({ ...embrulho, v: 2 }, kek, AAD));
    expect(erro.codigo).toBe('versao');
    expect(espiao).not.toHaveBeenCalled();
  });

  it('IV de embrulho com tamanho errado é recusado como formato', async () => {
    const { kek } = await derivar(SENHA, SALT);
    const cek = await gerarCek();
    const embrulho = await embrulharCek(cek, kek, AAD);
    const { iv } = dadosDoEmbrulho(embrulho);
    const curto = bytesParaB64(iv.subarray(0, 11));

    const erro = await erroCifraDe(desembrulharCek({ ...embrulho, iv: curto }, kek, AAD));
    expect(erro.codigo).toBe('formato');
  });
});

describe('cifra de imagem, formato v1 (plano §4.2 da pesquisa)', () => {
  it.each([
    ['jpeg', 1],
    ['png', 2],
    ['webp', 3]
  ] as const)('ida e volta do tipo %s (byte de tipo %i)', async (tipo, byteTipo) => {
    const { cek, arquivo } = await cifrarTeste(tipo);
    expect(arquivo[6]).toBe(byteTipo);
    const decifrada = await decifrarImagem(arquivo, cek, KID, ID);
    expect(decifrada.tipo).toBe(tipo);
    expect(decifrada.bytes).toEqual(CLARO);
  });

  it('cabeçalho de 52 bytes: JURI, versão 1, algoritmo 1, reservado 0, kid, id e IV; tamanho = 52 + n + 16', async () => {
    const { arquivo } = await cifrarTeste('png');
    expect(Array.from(arquivo.subarray(0, 4))).toEqual([0x4a, 0x55, 0x52, 0x49]);
    expect(arquivo[4]).toBe(1);
    expect(arquivo[5]).toBe(1);
    expect(arquivo[7]).toBe(0);
    expect(arquivo.subarray(8, 24)).toEqual(KID);
    expect(arquivo.subarray(24, 40)).toEqual(ID);
    expect(arquivo.byteLength).toBe(52 + CLARO.byteLength + 16);
  });

  it('dois cifrados do mesmo claro têm IV diferente', async () => {
    const cek = await gerarCek();
    const a = await cifrarImagem(CLARO, cek, { kid: KID, id: ID, tipo: 'png' });
    const b = await cifrarImagem(CLARO, cek, { kid: KID, id: ID, tipo: 'png' });
    expect(a.subarray(40, 52)).not.toEqual(b.subarray(40, 52));
  });

  it('compatível com node:crypto nos dois sentidos (tag acrescentada no fim, cabeçalho como AAD)', async () => {
    const raw = new Uint8Array(randomBytes(32));
    const cekNode = await SUBTLE.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);

    // Node cifra no formato v1 e o módulo decifra.
    const iv = new Uint8Array(randomBytes(12));
    const cabecalho = new Uint8Array(52);
    cabecalho.set([0x4a, 0x55, 0x52, 0x49], 0);
    cabecalho[4] = 1;
    cabecalho[5] = 1;
    cabecalho[6] = 2;
    cabecalho.set(KID, 8);
    cabecalho.set(ID, 24);
    cabecalho.set(iv, 40);
    const cifra = createCipheriv('aes-256-gcm', raw, iv);
    cifra.setAAD(cabecalho);
    const ctNode = new Uint8Array(Buffer.concat([cifra.update(CLARO), cifra.final()]));
    const tagNode = new Uint8Array(cifra.getAuthTag());
    const doNode = new Uint8Array(52 + ctNode.byteLength + 16);
    doNode.set(cabecalho, 0);
    doNode.set(ctNode, 52);
    doNode.set(tagNode, 52 + ctNode.byteLength);
    const lidaPeloModulo = await decifrarImagem(doNode, cekNode, KID, ID);
    expect(lidaPeloModulo.bytes).toEqual(CLARO);

    // O módulo cifra e o Node decifra com a tag separada no fim.
    const daCasa = await cifrarImagem(CLARO, cekNode, { kid: KID, id: ID, tipo: 'png' });
    const decifra = createDecipheriv('aes-256-gcm', raw, daCasa.subarray(40, 52));
    decifra.setAAD(daCasa.subarray(0, 52));
    decifra.setAuthTag(daCasa.subarray(daCasa.byteLength - 16));
    const claroNode = new Uint8Array(
      Buffer.concat([decifra.update(daCasa.subarray(52, daCasa.byteLength - 16)), decifra.final()])
    );
    expect(claroNode).toEqual(CLARO);
  });

  describe('cabeçalho inválido é rejeitado ANTES de decifrar', () => {
    it.each([
      ['magic', 0, 0x00, 'formato'],
      ['versão', 4, 0x02, 'versao'],
      ['algoritmo', 5, 0x02, 'algoritmo'],
      ['tipo desconhecido', 6, 0x04, 'tipo'],
      ['reservado', 7, 0x01, 'reservado']
    ] as const)(
      '%s, byte %i, valor %i: código %s, sem chamar decrypt',
      async (_nome, indice, valor, codigo) => {
        const { cek, arquivo } = await cifrarTeste('png');
        const espiao = vi.spyOn(SUBTLE, 'decrypt');

        const erro = await erroCifraDe(
          decifrarImagem(comByte(arquivo, indice, valor), cek, KID, ID)
        );
        expect(erro.codigo).toBe(codigo);
        expect(espiao).not.toHaveBeenCalled();
      }
    );

    it('kid diferente do esperado dá código kid e não chama decrypt', async () => {
      const { cek, arquivo } = await cifrarTeste('png');
      const espiao = vi.spyOn(SUBTLE, 'decrypt');
      const outroKid = hexParaBytes('ff'.repeat(16));

      const erro = await erroCifraDe(decifrarImagem(arquivo, cek, outroKid, ID));
      expect(erro.codigo).toBe('kid');
      expect(espiao).not.toHaveBeenCalled();
    });

    // Servidor entrega o arquivo de OUTRA imagem com o mesmo kid. Sem checar o id,
    // o AAD (que é o próprio cabeçalho dela) confere e o arquivo decifra sem erro.
    it('arquivo válido da imagem B pedido como imagem A dá código id e não chama decrypt', async () => {
      const cek = await gerarCek();
      const arquivoB = await cifrarImagem(CLARO, cek, { kid: KID, id: ID, tipo: 'png' });
      const idA = hexParaBytes('a1'.repeat(16));
      const espiao = vi.spyOn(SUBTLE, 'decrypt');

      const erro = await erroCifraDe(decifrarImagem(arquivoB, cek, KID, idA));
      expect(erro.codigo).toBe('id');
      expect(espiao).not.toHaveBeenCalled();
    });

    it('1 bit do id no arquivo, com o id pedido original, dá código id e não chama decrypt', async () => {
      const { cek, arquivo } = await cifrarTeste('png');
      const espiao = vi.spyOn(SUBTLE, 'decrypt');

      const erro = await erroCifraDe(decifrarImagem(bitInvertido(arquivo, 30), cek, KID, ID));
      expect(erro.codigo).toBe('id');
      expect(espiao).not.toHaveBeenCalled();
    });

    it('idEsperado com tamanho errado é recusado como entrada', async () => {
      const { cek, arquivo } = await cifrarTeste('png');
      const erro = await erroCifraDe(decifrarImagem(arquivo, cek, KID, new Uint8Array(15)));
      expect(erro.codigo).toBe('entrada');
    });

    it('arquivo menor que cabeçalho mais tag é recusado como tamanho, sem decifrar', async () => {
      const { cek, arquivo } = await cifrarTeste('png');
      const espiao = vi.spyOn(SUBTLE, 'decrypt');

      const erro = await erroCifraDe(decifrarImagem(arquivo.subarray(0, 67), cek, KID, ID));
      expect(erro.codigo).toBe('tamanho');
      expect(espiao).not.toHaveBeenCalled();
    });
  });

  describe('adulteração que passa pelo cabeçalho chega à decifração e falha como integridade', () => {
    // Campos com valores válidos: só o AAD (cabeçalho inteiro) e a tag acusam.
    it.each([
      ['tipo trocado de png para jpeg (valor válido)', 6, 0x01],
      ['1 bit do IV', 45, null],
      ['1 bit do primeiro byte do ciphertext', 52, null],
      ['1 bit do último byte da tag', -1, null]
    ] as const)('%s', async (_nome, indice, valor) => {
      const { cek, arquivo } = await cifrarTeste('png');
      const alvo = indice < 0 ? arquivo.byteLength - 1 : indice;
      const adulterado =
        valor === null ? bitInvertido(arquivo, alvo) : comByte(arquivo, alvo, valor);
      const espiao = vi.spyOn(SUBTLE, 'decrypt');

      const erro = await erroCifraDe(decifrarImagem(adulterado, cek, KID, ID));
      expect(erro.codigo).toBe('integridade');
      expect(espiao).toHaveBeenCalledTimes(1);
    });

    it('kid adulterado com kidEsperado igual ao adulterado: passa a checagem e o AAD acusa', async () => {
      const { cek, arquivo } = await cifrarTeste('png');
      const adulterado = bitInvertido(arquivo, 8);
      const kidAdulterado = adulterado.slice(8, 24);

      const erro = await erroCifraDe(decifrarImagem(adulterado, cek, kidAdulterado, ID));
      expect(erro.codigo).toBe('integridade');
    });

    it('chave de CEK diferente falha como integridade', async () => {
      const { arquivo } = await cifrarTeste('png');
      const outraCek = await gerarCek();

      const erro = await erroCifraDe(decifrarImagem(arquivo, outraCek, KID, ID));
      expect(erro.codigo).toBe('integridade');
    });

    it('id adulterado com idEsperado igual ao adulterado: passa a checagem de id e o AAD acusa', async () => {
      const { cek, arquivo } = await cifrarTeste('png');
      const adulterado = bitInvertido(arquivo, 30);
      const idAdulterado = adulterado.slice(24, 40);

      const erro = await erroCifraDe(decifrarImagem(adulterado, cek, KID, idAdulterado));
      expect(erro.codigo).toBe('integridade');
    });
  });

  it('cifrarImagem recusa kid ou id de tamanho diferente de 16 bytes como entrada', async () => {
    const cek = await gerarCek();
    const erroKid = await erroCifraDe(
      cifrarImagem(CLARO, cek, { kid: new Uint8Array(15), id: ID, tipo: 'png' })
    );
    const erroId = await erroCifraDe(
      cifrarImagem(CLARO, cek, { kid: KID, id: new Uint8Array(17), tipo: 'png' })
    );
    expect(erroKid.codigo).toBe('entrada');
    expect(erroId.codigo).toBe('entrada');
  });

  it('kidEsperado com tamanho errado é recusado como entrada', async () => {
    const { cek, arquivo } = await cifrarTeste('png');
    const erro = await erroCifraDe(decifrarImagem(arquivo, cek, new Uint8Array(8), ID));
    expect(erro.codigo).toBe('entrada');
  });

  it('ErroCifra é um Error com a propriedade codigo', () => {
    const erro = new ErroCifra('kid');
    expect(erro).toBeInstanceOf(Error);
    expect(erro.codigo).toBe('kid');
  });
});
