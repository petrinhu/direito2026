// @vitest-environment jsdom
// Ajuste de fonte com medidas forjadas (jsdom não tem layout). Cobre área útil
// zero ou negativa e conteúdo 100x maior que a área: nunca NaN, nunca 0, e o
// fator fica no piso AJUSTE_MINIMO em vez de sumir com o texto.
import { describe, expect, it } from 'vitest';
import { AJUSTE_MINIMO, ajustarFonteAoPalco } from '@/ui/area-restrita/ajusteDeFonte';

function medir(
  el: HTMLElement,
  valores: {
    clientHeight: number;
    clientWidth: number;
    scrollHeight?: number;
    offsetHeight?: number;
    scrollWidth?: number;
  }
) {
  Object.defineProperty(el, 'clientHeight', { value: valores.clientHeight });
  Object.defineProperty(el, 'clientWidth', { value: valores.clientWidth });
  Object.defineProperty(el, 'scrollHeight', {
    value: valores.scrollHeight ?? valores.clientHeight
  });
  Object.defineProperty(el, 'scrollWidth', { value: valores.scrollWidth ?? valores.clientWidth });
  Object.defineProperty(el, 'offsetHeight', {
    value: valores.offsetHeight ?? valores.clientHeight
  });
}

function montar(
  corpoMedida: Parameters<typeof medir>[1],
  conteudoMedida: Parameters<typeof medir>[1]
) {
  const slide = document.createElement('article');
  const corpo = document.createElement('div');
  const conteudo = document.createElement('div');
  conteudo.className = 'ar-slide__conteudo';
  corpo.appendChild(conteudo);
  slide.appendChild(corpo);
  document.body.appendChild(slide);
  medir(corpo, corpoMedida);
  medir(conteudo, conteudoMedida);
  return { slide, corpo };
}

describe('ajuste de fonte no encaixe de projetor', () => {
  it('conteúdo 100x maior que a área devolve o piso, sem NaN nem zero', () => {
    const { slide, corpo } = montar(
      { clientHeight: 500, clientWidth: 800 },
      { clientHeight: 50000, clientWidth: 800, offsetHeight: 50000, scrollWidth: 800 }
    );
    const fator = ajustarFonteAoPalco(slide, corpo);
    expect(Number.isFinite(fator)).toBe(true);
    expect(fator).toBe(AJUSTE_MINIMO);
    expect(slide.style.getPropertyValue('--s-aj')).toBe(String(AJUSTE_MINIMO));
  });

  it('área útil zero (corpo sem altura) não ajusta e devolve 1', () => {
    const { slide, corpo } = montar(
      { clientHeight: 0, clientWidth: 800 },
      { clientHeight: 300, clientWidth: 800 }
    );
    expect(ajustarFonteAoPalco(slide, corpo)).toBe(1);
  });

  it('padding maior que a caixa (área útil negativa) cai no piso, não em NaN', () => {
    const { slide, corpo } = montar(
      { clientHeight: 20, clientWidth: 800 },
      { clientHeight: 300, clientWidth: 800 }
    );
    Object.defineProperty(corpo, 'clientHeight', { value: 20 });
    const original = window.getComputedStyle;
    window.getComputedStyle = () =>
      ({
        paddingTop: '60px',
        paddingBottom: '60px',
        paddingLeft: '0px',
        paddingRight: '0px'
      }) as unknown as globalThis.CSSStyleDeclaration;
    try {
      const fator = ajustarFonteAoPalco(slide, corpo);
      expect(Number.isFinite(fator)).toBe(true);
      expect(fator).toBe(AJUSTE_MINIMO);
    } finally {
      window.getComputedStyle = original;
    }
  });
});
