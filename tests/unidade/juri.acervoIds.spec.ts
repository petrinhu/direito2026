import { describe, expect, it } from 'vitest';
import { ErroFerramenta } from '../../scripts/juri/erro';
import { lerIds, resolverIds, serializarNovas } from '../../scripts/juri/idsTsv';
import type { Original } from '../../scripts/juri/originais';

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);
const SHA_C = 'c'.repeat(64);
const ID_1 = '1'.repeat(32);
const ID_2 = '2'.repeat(32);
const CABECALHO = 'id\tsha256\tnome\n';

function original(nome: string, sha256: string): Original {
  return { nome, sha256, tipo: 'png', bytes: new Uint8Array([0]) };
}

/** Gerador determinístico de ids para os testes: 3, 4, 5... em hex de 32. */
function geradorSequencial(): () => string {
  let n = 3;
  return () => String(n++).padStart(32, '0');
}

describe('ids.tsv: leitura', () => {
  it('lê o cabeçalho e as linhas', () => {
    const linhas = lerIds(`${CABECALHO}${ID_1}\t${SHA_A}\ta.png\n`);
    expect(linhas).toEqual([{ id: ID_1, sha256: SHA_A, nome: 'a.png' }]);
  });

  it('vazio é lista vazia, sem cabeçalho exigido', () => {
    expect(lerIds('')).toEqual([]);
  });

  it('recusa id que não é 32 hex minúsculos', () => {
    expect(() => lerIds(`${CABECALHO}${'G'.repeat(32)}\t${SHA_A}\ta.png\n`)).toThrow(
      ErroFerramenta
    );
  });

  it('recusa sha256 malformado', () => {
    expect(() => lerIds(`${CABECALHO}${ID_1}\tzz\ta.png\n`)).toThrow(ErroFerramenta);
  });

  it('recusa linha sem a terceira coluna ou sem quebra de linha final', () => {
    expect(() => lerIds(`${CABECALHO}${ID_1}\t${SHA_A}\n`)).toThrow(ErroFerramenta);
    expect(() => lerIds(`${CABECALHO}${ID_1}\t${SHA_A}\ta.png`)).toThrow(ErroFerramenta);
  });

  it('recusa cabeçalho diferente do contrato', () => {
    expect(() => lerIds(`ID\tSHA\tNOME\n${ID_1}\t${SHA_A}\ta.png\n`)).toThrow(ErroFerramenta);
  });

  it('recusa id repetido no próprio arquivo', () => {
    const texto = `${CABECALHO}${ID_1}\t${SHA_A}\ta.png\n${ID_1}\t${SHA_B}\tb.png\n`;
    expect(() => lerIds(texto)).toThrow(ErroFerramenta);
  });
});

describe('ids.tsv: resolução entre rodadas', () => {
  const existente = [{ id: ID_1, sha256: SHA_A, nome: 'a.png' }];

  it('imagem nova ganha id novo e vira linha nova', () => {
    const r = resolverIds(
      [original('a.png', SHA_A), original('n.png', SHA_C)],
      existente,
      geradorSequencial()
    );
    expect(r.idPorSha.get(SHA_A)).toBe(ID_1);
    expect(r.idPorSha.get(SHA_C)).toBe('0'.repeat(31) + '3');
    expect(r.novas).toEqual([{ id: '0'.repeat(31) + '3', sha256: SHA_C, nome: 'n.png' }]);
  });

  it('mesmo nome e mesmo conteúdo reusa o id e não acrescenta linha', () => {
    const r = resolverIds([original('a.png', SHA_A)], existente, geradorSequencial());
    expect(r.idPorSha.get(SHA_A)).toBe(ID_1);
    expect(r.novas).toEqual([]);
  });

  it('arquivo renomeado com o mesmo conteúdo reusa o id (não duplica a imagem)', () => {
    const r = resolverIds([original('renomeado.png', SHA_A)], existente, geradorSequencial());
    expect(r.idPorSha.get(SHA_A)).toBe(ID_1);
    expect(r.novas).toEqual([]);
  });

  it('mesmo nome com conteúdo diferente recusa (servir foto diferente sob id antigo)', () => {
    expect(() => resolverIds([original('a.png', SHA_B)], existente, geradorSequencial())).toThrow(
      /mudou de conteúdo/
    );
  });

  it('linha do ids.tsv sem imagem correspondente recusa (imagem sumiu)', () => {
    expect(() => resolverIds([original('x.png', SHA_C)], existente, geradorSequencial())).toThrow(
      /sem imagem correspondente/
    );
  });

  it('duas imagens com o mesmo conteúdo recusam', () => {
    expect(() =>
      resolverIds([original('a.png', SHA_C), original('b.png', SHA_C)], [], geradorSequencial())
    ).toThrow(/mesmo conteúdo/);
  });

  it('nunca gera um id que já existe no arquivo', () => {
    const gerador = () => ID_1;
    const sequencia = [ID_1, ID_2];
    let i = 0;
    // a.png (SHA_A) já tem ID_1; a imagem nova recebe ID_1 primeiro, que está em uso, e então ID_2.
    const r = resolverIds(
      [original('a.png', SHA_A), original('n.png', SHA_C)],
      existente,
      () => sequencia[i++] ?? gerador()
    );
    expect(r.idPorSha.get(SHA_C)).toBe(ID_2);
  });
});

describe('ids.tsv: escrita', () => {
  it('serializa só as linhas novas, uma por linha, sem cabeçalho', () => {
    expect(serializarNovas([{ id: ID_2, sha256: SHA_C, nome: 'n.png' }])).toBe(
      `${ID_2}\t${SHA_C}\tn.png\n`
    );
  });

  it('recusa nome com tabulação ou quebra de linha (quebraria o formato)', () => {
    expect(() => serializarNovas([{ id: ID_2, sha256: SHA_C, nome: 'a\tb.png' }])).toThrow(
      ErroFerramenta
    );
    expect(() => serializarNovas([{ id: ID_2, sha256: SHA_C, nome: 'a\nb.png' }])).toThrow(
      ErroFerramenta
    );
  });
});
