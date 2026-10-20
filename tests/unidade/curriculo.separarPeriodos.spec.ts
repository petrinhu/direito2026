import { describe, expect, it } from 'vitest';
import { separarPeriodos } from '@/app/curriculo/separarPeriodos';
import type { Cadeira, Curriculo, Periodo } from '@/core/curriculo/tipos';

function periodo(numero: number, cadeiras: readonly Cadeira[]): Periodo {
  return { id: `p${numero}`, numero, rotulo: `${numero}º período`, cadeiras };
}

const cadeiraPublicada: Cadeira = {
  id: 'intr-direito',
  nome: 'Introdução ao Direito',
  estado: 'publicado',
  unidades: []
};

const cadeiraEmBreve: Cadeira = {
  id: 'futura',
  nome: 'Futura',
  estado: 'em-breve',
  unidades: []
};

describe('separarPeriodos, quais períodos têm material publicado', () => {
  it('um período entra em comMaterial só com cadeira publicada; os demais vão a emPreparo', () => {
    const curriculo: Curriculo = [
      periodo(1, [cadeiraPublicada]),
      periodo(2, []),
      periodo(3, [cadeiraEmBreve])
    ];
    const { comMaterial, emPreparo } = separarPeriodos(curriculo);
    expect(comMaterial.map((p) => p.id)).toEqual(['p1']);
    expect(emPreparo.map((p) => p.id)).toEqual(['p2', 'p3']);
  });
});
