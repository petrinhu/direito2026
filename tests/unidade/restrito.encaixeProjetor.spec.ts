// Matriz de encaixe para sala de aula (projetor, escala do Windows, zoom).
// Medidas em px CSS: resolução física dividida pela escala do Windows (1,25 / 1,5)
// e a área útil já descontada da barra de controles.
import { describe, expect, it } from 'vitest';
import { ALTURA_LOGICA, LARGURA_LOGICA, calcularEscala } from '@/core/restrito/escalaPalco';

const cabe = (escala: number, w: number, h: number): boolean =>
  LARGURA_LOGICA * escala <= w + 1e-9 && ALTURA_LOGICA * escala <= h + 1e-9;

describe('encaixe do palco em telas de sala de aula', () => {
  it.each([
    ['projetor 1024x768 a 100%', 1024, 768 - 140],
    ['projetor 800x600 a 100%', 800, 600 - 140],
    ['1024x768 com escala 125% (819x614 px CSS)', 1024 / 1.25, 768 / 1.25 - 140],
    ['800x600 com escala 125% (640x480 px CSS)', 800 / 1.25, 600 / 1.25 - 140],
    ['1280x768 com escala 125%', 1280 / 1.25, 768 / 1.25 - 140],
    ['1280x800 com escala 125%', 1280 / 1.25, 800 / 1.25 - 140],
    ['1280x1024 a 100%', 1280, 1024 - 140],
    ['1366x768 com escala 150% (910x512 px CSS)', 1366 / 1.5, 768 / 1.5 - 140],
    ['1440x900 com escala 150% (960x600 px CSS)', 1440 / 1.5, 900 / 1.5 - 140],
    ['zoom do navegador 90% numa tela 1024x768', 1024 / 0.9, 768 / 0.9 - 140],
    ['zoom do navegador 125% numa tela 1366x768', 1366 / 1.25, 768 / 1.25 - 140]
  ])('%s: escala positiva finita e palco cabe inteiro', (_nome, w, h) => {
    const e = calcularEscala(w, h);
    expect(Number.isFinite(e)).toBe(true);
    expect(e).toBeGreaterThan(0);
    expect(cabe(e, w, h)).toBe(true);
  });

  it('altura útil baixa (área 4:3 de 640 px de largura, 120 px de altura) reduz o palco, sem zerar', () => {
    const e = calcularEscala(640, 120);
    expect(e).toBeCloseTo(120 / 900, 9);
    expect(cabe(e, 640, 120)).toBe(true);
  });

  it.each([
    ['área com largura 0', 0, 400],
    ['área com altura 0 (barra de botões tomou tudo)', 800, 0],
    ['área 0 x 0', 0, 0],
    ['área negativa (padding maior que a caixa)', 800, -10],
    ['largura negativa', -800, 400],
    ['largura NaN', Number.NaN, 400],
    ['altura Infinity', 800, Number.POSITIVE_INFINITY]
  ])('%s: devolve 1, nunca 0, NaN, negativo ou Infinity', (_nome, w, h) => {
    expect(calcularEscala(w, h)).toBe(1);
  });

  it('área de 1 px de altura não zera nem vira negativo (escala positiva pequena)', () => {
    const e = calcularEscala(800, 1);
    expect(e).toBeGreaterThan(0);
    expect(Number.isFinite(e)).toBe(true);
  });
});
