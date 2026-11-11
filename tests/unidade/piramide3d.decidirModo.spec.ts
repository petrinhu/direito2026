import { describe, expect, it } from 'vitest';
import { JANELA_MINIMA_3D, LARGURA_MINIMA_3D, decidirModo } from '@/app/piramide3d/decidirModo';
import type { FatosDoAmbiente } from '@/core/piramide3d/tipos';

/** Ambiente em que o 3D vale: cada caso abaixo estraga UM fator e confere a versão plana. */
const FAVORAVEL: FatosDoAmbiente = {
  webgl2: true,
  larguraJanela: 1280,
  alturaJanela: 720,
  larguraFigura: 760,
  modoAdaptado: false
};

describe('decidirModo', () => {
  it('controle positivo: tudo favorável dá 3D', () => {
    expect(decidirModo(FAVORAVEL)).toBe('3d');
  });

  it('modo adaptado ligado dá versão plana, mesmo com o resto favorável', () => {
    expect(decidirModo({ ...FAVORAVEL, modoAdaptado: true })).toBe('plana');
  });

  it('sem WebGL2 dá versão plana', () => {
    expect(decidirModo({ ...FAVORAVEL, webgl2: false })).toBe('plana');
  });

  it('janela estreita dá versão plana, e 900 px de largura ainda vale 3D', () => {
    expect(decidirModo({ ...FAVORAVEL, larguraJanela: JANELA_MINIMA_3D.largura - 1 })).toBe(
      'plana'
    );
    expect(decidirModo({ ...FAVORAVEL, larguraJanela: JANELA_MINIMA_3D.largura })).toBe('3d');
  });

  it('janela baixa dá versão plana, e 600 px de altura ainda vale 3D', () => {
    expect(decidirModo({ ...FAVORAVEL, alturaJanela: JANELA_MINIMA_3D.altura - 1 })).toBe('plana');
    expect(decidirModo({ ...FAVORAVEL, alturaJanela: JANELA_MINIMA_3D.altura })).toBe('3d');
  });

  it('figura estreita dá versão plana, e 560 px de largura ainda vale 3D', () => {
    expect(decidirModo({ ...FAVORAVEL, larguraFigura: LARGURA_MINIMA_3D - 1 })).toBe('plana');
    expect(decidirModo({ ...FAVORAVEL, larguraFigura: LARGURA_MINIMA_3D })).toBe('3d');
  });

  it('os limites são os do desenho: 900 x 600 de janela e 560 de figura', () => {
    expect(JANELA_MINIMA_3D).toEqual({ largura: 900, altura: 600 });
    expect(LARGURA_MINIMA_3D).toBe(560);
  });
});
