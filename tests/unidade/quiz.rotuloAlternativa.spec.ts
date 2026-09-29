import { describe, expect, it } from 'vitest';
import { rotuloAlternativa, mostrarLetras } from '@/core/quiz/rotuloAlternativa';

describe('rotuloAlternativa', () => {
  it('mapeia 0 a 4 para A a E', () => {
    expect([0, 1, 2, 3, 4].map((i) => rotuloAlternativa(i))).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});

describe('mostrarLetras', () => {
  it('só as perguntas de cinco alternativas mostram letra', () => {
    expect(mostrarLetras(5)).toBe(true);
    expect(mostrarLetras(4)).toBe(false);
  });
});
