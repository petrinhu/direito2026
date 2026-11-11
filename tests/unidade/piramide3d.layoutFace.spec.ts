import { describe, expect, it } from 'vitest';
import {
  escalaDaTextura,
  fonteCorpo,
  fonteNome,
  juntarLinhas,
  leiaute,
  quebrar,
  type Medidor
} from '@/core/piramide3d/layoutFace';
import type { NivelFigura3d } from '@/core/piramide3d/tipos';

/** Medida fixa: cada caractere ocupa 10 px, qualquer que seja a fonte. */
const medidor: Medidor = {
  definirFonte: () => undefined,
  largura: (texto) => texto.length * 10
};

/** Texto sintético: serve para testar a quebra sem copiar texto de estudo. */
const palavras = (n: number, palavra = 'abcde'): string =>
  Array.from({ length: n }, () => palavra).join(' ');

const nivel = (parcial: Partial<NivelFigura3d> = {}): NivelFigura3d => ({
  nivel: 'nivel-teste',
  nome: palavras(4),
  rotulo: 'x',
  explicacao: palavras(40),
  exemplo: palavras(30),
  ...parcial
});

describe('quebra de linha por medida', () => {
  it('quebra entre palavras e as linhas juntas dão o texto original', () => {
    const texto = palavras(12);
    const linhas = quebrar(medidor, texto, 130) ?? [];
    expect(linhas.length).toBeGreaterThan(1);
    for (const l of linhas) expect(l.t.length * 10).toBeLessThanOrEqual(130);
    expect(juntarLinhas(linhas)).toBe(texto);
  });

  it('palavra com hífen quebra depois do hífen, e a linha seguinte continua sem espaço', () => {
    const texto = 'abc-defg-hij';
    const linhas = quebrar(medidor, texto, 50) ?? [];
    expect(linhas.map((l) => l.t)).toEqual(['abc-', 'defg-', 'hij']);
    expect(linhas[0]?.juntaCom).toBe(true);
    expect(juntarLinhas(linhas)).toBe(texto);
  });

  it('devolve null quando um pedaço sozinho não cabe na medida', () => {
    expect(quebrar(medidor, 'palavramuitolonga', 50)).toBeNull();
  });
});

describe('leiaute do texto da face', () => {
  it('numa face larga, usa duas colunas e o texto cabe na altura máxima', () => {
    const lay = leiaute(medidor, nivel(), 1500, 0.84, 900);
    expect(lay.colunas).toBe(2);
    expect(lay.Apx).toBeLessThanOrEqual(900);
    expect(lay.exemplo?.bloco.x).toBeGreaterThan(lay.explicacao.caixa.x);
  });

  it('numa face estreita, usa uma coluna e o exemplo vem abaixo da explicação', () => {
    const lay = leiaute(
      medidor,
      nivel({ explicacao: palavras(8), exemplo: palavras(6) }),
      600,
      0.84,
      900
    );
    expect(lay.colunas).toBe(1);
    const exemplo = lay.exemplo;
    expect(exemplo?.bloco.y).toBeGreaterThan(lay.explicacao.caixa.y + lay.explicacao.caixa.h);
  });

  it('sem exemplo, não há bloco de exemplo', () => {
    const lay = leiaute(medidor, nivel({ exemplo: '' }), 1500, 0.84, 900);
    expect(lay.exemplo).toBeNull();
  });

  it('a altura nunca fica abaixo de 20% da largura da face', () => {
    const lay = leiaute(medidor, nivel({ explicacao: 'abc', exemplo: '' }), 1500, 0.84, 900);
    expect(lay.Apx).toBeGreaterThanOrEqual(0.2 * 1500);
  });

  it('o corpo desce de 1 em 1 até caber; nenhum corpo cabendo, lança erro com o nome do nível', () => {
    const lay = leiaute(medidor, nivel(), 1500, 0.84, 900);
    expect(lay.f).toBeLessThanOrEqual(24);
    expect(lay.f).toBeGreaterThanOrEqual(14);
    expect(() => leiaute(medidor, nivel({ nivel: 'nivel-sem-vaga' }), 1500, 0.84, 60)).toThrow(
      /nivel-sem-vaga/
    );
  });

  it('o nome da norma fundamental pode usar o fator maior, e o nome fica numa caixa mais alta', () => {
    const comum = leiaute(medidor, nivel(), 1500, 1, 900);
    const norma = leiaute(medidor, nivel(), 1500, 1, 900, 1.7);
    expect(norma.nome.hLinha / norma.f).toBeGreaterThan(comum.nome.hLinha / comum.f);
  });
});

describe('textura e fontes', () => {
  it('a escala da textura fica entre 1,5 e 2, e desce para caber em 4096 px', () => {
    expect(escalaDaTextura(1000, 1)).toBe(1.5);
    expect(escalaDaTextura(1000, 3)).toBe(2);
    expect(escalaDaTextura(2500, 2) * 2500).toBeLessThanOrEqual(4096);
    expect(escalaDaTextura(9000, 2)).toBe(1);
  });

  it('as fontes das faces são Cormorant Garamond (nome) e Inter (corpo)', () => {
    expect(fonteNome(20)).toBe('700 30px "Cormorant Garamond"');
    expect(fonteCorpo(20)).toBe('400 20px "Inter"');
  });
});
