import {
  calcularVersao,
  compararVersoes,
  lerVersao,
  reescreverVersaoDoPackage,
  type TipoMudanca
} from '../../scripts/apoio/versao';
import { describe, expect, it } from 'vitest';

describe('calcularVersao, a partir de 0.1.0 (3 números tratado como 0.1.0.0)', () => {
  it('correção sobe C e zera D', () => {
    expect(calcularVersao('0.1.0', 'correcao')).toBe('0.1.1.0');
  });

  it('recurso sobe B e zera C e D', () => {
    expect(calcularVersao('0.1.0', 'recurso')).toBe('0.2.0.0');
  });

  it('construção sobe só D', () => {
    expect(calcularVersao('0.1.0', 'construcao')).toBe('0.1.0.1');
  });
});

describe('calcularVersao, a partir de 1.0.0.0', () => {
  it('recurso, correção e construção', () => {
    expect(calcularVersao('1.0.0.0', 'recurso')).toBe('1.1.0.0');
    expect(calcularVersao('1.0.0.0', 'correcao')).toBe('1.0.1.0');
    expect(calcularVersao('1.0.0.0', 'construcao')).toBe('1.0.0.1');
  });
});

describe('calcularVersao, a partir de 1.2.3.4', () => {
  it('recurso zera C e D; correção zera D; construção só soma D', () => {
    expect(calcularVersao('1.2.3.4', 'recurso')).toBe('1.3.0.0');
    expect(calcularVersao('1.2.3.4', 'correcao')).toBe('1.2.4.0');
    expect(calcularVersao('1.2.3.4', 'construcao')).toBe('1.2.3.5');
  });

  it('nunca muda A, em nenhum tipo', () => {
    const tipos: TipoMudanca[] = ['recurso', 'correcao', 'construcao'];
    for (const tipo of tipos) {
      expect(calcularVersao('1.2.3.4', tipo).split('.')[0]).toBe('1');
    }
  });
});

describe('calcularVersao, tipo inválido', () => {
  it('recusa tipo fora de recurso, correcao e construcao', () => {
    expect(() => calcularVersao('0.1.0', 'bugfix')).toThrow(/tipo/);
    expect(() => calcularVersao('0.1.0', '')).toThrow(/tipo/);
  });
});

describe('calcularVersao, --versao forçada (primeira publicação: 1.0.0.0)', () => {
  it('aceita 1.0.0.0 a partir de 0.1.0', () => {
    expect(calcularVersao('0.1.0', 'recurso', '1.0.0.0')).toBe('1.0.0.0');
  });

  it('recusa formato que não tem 4 números', () => {
    expect(() => calcularVersao('0.1.0', 'recurso', '1.0.0')).toThrow(/quatro/);
    expect(() => calcularVersao('0.1.0', 'recurso', '1.0.0.0.0')).toThrow(/quatro/);
    expect(() => calcularVersao('0.1.0', 'recurso', 'v1.0.0.0')).toThrow(/quatro/);
    expect(() => calcularVersao('0.1.0', 'recurso', 'a.b.c.d')).toThrow(/quatro/);
  });

  it('recusa zero à esquerda, que daria duas grafias para a mesma versão', () => {
    expect(() => calcularVersao('0.1.0', 'recurso', '01.0.0.0')).toThrow(/quatro/);
  });

  it('recusa versão igual à atual', () => {
    expect(() => calcularVersao('1.0.0.0', 'correcao', '1.0.0.0')).toThrow(/maior/);
  });

  it('recusa versão menor que a atual', () => {
    expect(() => calcularVersao('0.1.0', 'correcao', '0.0.9.9')).toThrow(/maior/);
    expect(() => calcularVersao('1.2.3.4', 'correcao', '1.2.3.3')).toThrow(/maior/);
  });
});

describe('lerVersao e compararVersoes', () => {
  it('lê 3 números como quarto zero e 4 números como estão', () => {
    expect(lerVersao('0.1.0')).toEqual([0, 1, 0, 0]);
    expect(lerVersao('1.2.3.4')).toEqual([1, 2, 3, 4]);
  });

  it('recusa texto que não é versão', () => {
    expect(() => lerVersao('')).toThrow(/versão/);
    expect(() => lerVersao('0.1')).toThrow(/versão/);
  });

  it('compara número com número, não texto (1.10 é maior que 1.9)', () => {
    expect(compararVersoes([1, 10, 0, 0], [1, 9, 9, 9])).toBeGreaterThan(0);
    expect(compararVersoes([1, 0, 0, 0], [1, 0, 0, 0])).toBe(0);
    expect(compararVersoes([0, 1, 0, 0], [1, 0, 0, 0])).toBeLessThan(0);
  });
});

describe('reescreverVersaoDoPackage', () => {
  const original =
    '{\n  "name": "caderno-de-direito",\n  "version": "0.1.0",\n  "private": true\n}\n';

  it('troca só o campo version e mantém o resto byte a byte', () => {
    const novo = reescreverVersaoDoPackage(original, '1.0.0.0');
    expect(novo).toBe(original.replace('"0.1.0"', '"1.0.0.0"'));
  });

  it('recusa arquivo fora do formato padrão (sem reformatar nada)', () => {
    const compacto = '{"name":"x","version":"0.1.0"}\n';
    expect(() => reescreverVersaoDoPackage(compacto, '1.0.0.0')).toThrow(/formato padrão/);
  });

  it('recusa arquivo sem campo version', () => {
    const semVersao = '{\n  "name": "x"\n}\n';
    expect(() => reescreverVersaoDoPackage(semVersao, '1.0.0.0')).toThrow(/version/);
  });
});
