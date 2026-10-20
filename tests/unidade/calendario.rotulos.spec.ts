import { describe, expect, it } from 'vitest';
import { rotuloCategoria, rotuloCategoriaCurto, rotuloTipoProva } from '@/core/calendario/rotulos';
import type { CategoriaEvento } from '@/core/calendario/tipos';

const TODAS_AS_CATEGORIAS: readonly CategoriaEvento[] = [
  'AV1',
  'AV2',
  'AV3',
  'chamada',
  'final',
  'feriado',
  'prazo',
  'semestre'
];

describe('rotuloTipoProva (para frases: "a 3ª AV de ...")', () => {
  it.each([
    ['AV1', '1ª AV'],
    ['AV2', '2ª AV'],
    ['AV3', '3ª AV'],
    ['chamada', '2ª chamada'],
    ['final', 'final']
  ] as const)('%s -> %s', (tipo, rotulo) => {
    expect(rotuloTipoProva(tipo)).toBe(rotulo);
  });
});

describe('rotuloCategoria (texto da legenda e do evento)', () => {
  it.each([
    ['AV1', '1ª AV'],
    ['AV2', '2ª AV'],
    ['AV3', '3ª AV'],
    ['chamada', '2ª chamada'],
    ['final', 'Final'],
    ['feriado', 'Feriado'],
    ['prazo', 'Prazo acadêmico'],
    ['semestre', 'Semestre']
  ] as const)('%s -> %s', (categoria, rotulo) => {
    expect(rotuloCategoria(categoria)).toBe(rotulo);
  });
});

describe('rotuloCategoriaCurto (rótulo de tela estreita, cabe na célula)', () => {
  it.each([
    ['AV1', '1ª AV'],
    ['AV2', '2ª AV'],
    ['AV3', '3ª AV'],
    ['chamada', '2ª cham.'],
    ['final', 'Final'],
    ['feriado', 'Feriado'],
    ['prazo', 'Prazo'],
    ['semestre', 'Letivo']
  ] as const)('%s -> %s', (categoria, rotulo) => {
    expect(rotuloCategoriaCurto(categoria)).toBe(rotulo);
  });

  it('o rótulo curto de semestre tem no máximo 6 caracteres', () => {
    expect([...rotuloCategoriaCurto('semestre')].length).toBeLessThanOrEqual(6);
  });

  it('nenhuma palavra do rótulo curto passa de 7 caracteres (cabe inteira na célula)', () => {
    for (const categoria of TODAS_AS_CATEGORIAS) {
      const palavras = rotuloCategoriaCurto(categoria).split(' ');
      for (const palavra of palavras) {
        expect(
          [...palavra].length,
          `"${palavra}" (de ${categoria}) tem mais de 7 caracteres`
        ).toBeLessThanOrEqual(7);
      }
    }
  });
});
