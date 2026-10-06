// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { AJUSTE_MINIMO, ajustarFonteAoPalco } from '@/ui/area-restrita/ajusteDeFonte';

/** Palco falso: o conteúdo tem `alturaBase` com fator 1 e cresce/encolhe com --s-aj. */
function montar(alturaBase: number, areaUtil = 750) {
  const slide = document.createElement('article');
  const corpo = document.createElement('div');
  const conteudo = document.createElement('div');
  conteudo.className = 'ar-slide__conteudo';
  corpo.append(conteudo);
  slide.append(corpo);
  const fator = (): number => Number(slide.style.getPropertyValue('--s-aj') || 1);
  Object.defineProperty(corpo, 'clientHeight', { value: areaUtil + 150 });
  Object.defineProperty(corpo, 'clientWidth', { value: 1600 });
  Object.defineProperty(corpo, 'scrollHeight', { get: () => areaUtil + 150 });
  Object.defineProperty(corpo, 'scrollWidth', { value: 1600 });
  Object.defineProperty(conteudo, 'offsetHeight', { get: () => alturaBase * fator() });
  Object.defineProperty(conteudo, 'scrollWidth', { value: 1000 });
  corpo.style.padding = '80px 100px 70px';
  return { slide, corpo };
}

describe('ajustarFonteAoPalco', () => {
  it('conteúdo que cabe não é reduzido', () => {
    const { slide, corpo } = montar(700);
    expect(ajustarFonteAoPalco(slide, corpo)).toBe(1);
  });

  it('conteúdo maior que a área útil reduz o fator até caber (o título nunca passa do palco)', () => {
    const { slide, corpo } = montar(1000);
    const f = ajustarFonteAoPalco(slide, corpo);
    expect(f).toBeLessThan(1);
    expect(1000 * f).toBeLessThanOrEqual(750 + 1);
  });

  it('não desce do piso legível', () => {
    const { slide, corpo } = montar(5000);
    expect(ajustarFonteAoPalco(slide, corpo)).toBe(AJUSTE_MINIMO);
  });

  it('sem layout (altura zero) devolve 1 sem mexer', () => {
    const slide = document.createElement('article');
    const corpo = document.createElement('div');
    slide.append(corpo);
    expect(ajustarFonteAoPalco(slide, corpo)).toBe(1);
  });
});
