import { describe, expect, it } from 'vitest';
import {
  ALTURA_LOGICA,
  LARGURA_LOGICA,
  calcularEscala,
  milimetrosParaPixels
} from '@/core/restrito/escalaPalco';

describe('escala do palco 16:9', () => {
  it('o palco lógico é 1600x900', () => {
    expect(LARGURA_LOGICA).toBe(1600);
    expect(ALTURA_LOGICA).toBe(900);
  });

  it('limita pela largura quando o espaço é mais "alto" que 16:9', () => {
    expect(calcularEscala(800, 800)).toBe(0.5);
  });

  it('limita pela altura quando o espaço é mais "largo" que 16:9', () => {
    expect(calcularEscala(3000, 450)).toBe(0.5);
  });

  it.each([
    [1280, 720],
    [1920, 1080],
    [360, 640],
    [1000, 560]
  ])('o palco escalado nunca passa do espaço %i x %i', (w, h) => {
    const s = calcularEscala(w, h);
    expect(LARGURA_LOGICA * s).toBeLessThanOrEqual(w + 1e-9);
    expect(ALTURA_LOGICA * s).toBeLessThanOrEqual(h + 1e-9);
  });

  it('a proporção é a mesma em qualquer contexto', () => {
    for (const [w, h] of [
      [1280, 720],
      [360, 640],
      [1920, 1080]
    ] as const) {
      const s = calcularEscala(w, h);
      expect((LARGURA_LOGICA * s) / (ALTURA_LOGICA * s)).toBeCloseTo(16 / 9, 10);
    }
  });

  it.each([
    [0, 100],
    [100, 0],
    [-1, 50],
    [Number.NaN, 50],
    [Infinity, 50]
  ])('medida inválida (%s, %s) devolve 1, nunca zero nem NaN', (w, h) => {
    expect(calcularEscala(w, h)).toBe(1);
  });

  it('converte milímetros em pixels CSS (96 por polegada)', () => {
    expect(milimetrosParaPixels(25.4)).toBeCloseTo(96, 10);
  });

  it('a página A4 paisagem (270 x 185 mm) comporta o palco inteiro', () => {
    const s = calcularEscala(milimetrosParaPixels(270), milimetrosParaPixels(185));
    expect(LARGURA_LOGICA * s).toBeLessThanOrEqual(milimetrosParaPixels(270) + 1e-9);
    expect(ALTURA_LOGICA * s).toBeLessThanOrEqual(milimetrosParaPixels(185) + 1e-9);
  });
});
