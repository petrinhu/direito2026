import { describe, expect, it } from 'vitest';
import { textoEmPreparo } from '@/app/curriculo/textoEmPreparo';
import type { Periodo } from '@/core/curriculo/tipos';

function periodos(numeros: readonly number[]): Periodo[] {
  return numeros.map((n) => ({ id: `p${n}`, numero: n, rotulo: `${n}º período`, cadeiras: [] }));
}

describe('textoEmPreparo, linha única da página inicial derivada do currículo', () => {
  it('sem períodos em preparo, não há linha', () => {
    expect(textoEmPreparo([])).toBeNull();
  });

  it('vários períodos em preparo viram intervalo, a partir dos números reais', () => {
    expect(textoEmPreparo(periodos([2, 3, 4, 5, 6, 7, 8, 9, 10]))).toBe(
      'Do 2º ao 10º período: material em preparação.'
    );
  });

  it('um único período em preparo vira frase no singular', () => {
    expect(textoEmPreparo(periodos([3]))).toBe('3º período: material em preparação.');
  });
});
