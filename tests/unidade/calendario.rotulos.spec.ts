import { describe, expect, it } from 'vitest';
import { rotuloCategoria, rotuloCategoriaCurto, rotuloTipoProva } from '@/core/calendario/rotulos';

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
    ['semestre', 'Semestre']
  ] as const)('%s -> %s', (categoria, rotulo) => {
    expect(rotuloCategoriaCurto(categoria)).toBe(rotulo);
  });
});
