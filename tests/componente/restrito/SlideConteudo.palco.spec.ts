// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import SlideConteudo from '@/ui/area-restrita/SlideConteudo.vue';
import { ajustarFonteAoPalco, AJUSTE_MINIMO } from '@/ui/area-restrita/ajusteDeFonte';
import type { Slide } from '@/core/restrito/tipos';

const equipe = { instituicao: 'Instituição Fictícia', integrantes: ['Pessoa Um'] };
const slide = (parcial: Partial<Slide> & Pick<Slide, 'layout'>): Slide => ({
  id: 3,
  titulo: 'Título fictício',
  notas: 'n',
  ...parcial
});

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  vi.restoreAllMocks();
});

function montar(s: Slide) {
  w = mount(SlideConteudo, { props: { slide: s, equipe, rotulo: 'Slide 3 de 10' } });
  return w;
}

describe('SlideConteudo: composição e decoração', () => {
  it('usa unidades fixas do palco lógico: nada de container query nem vw/vh no estilo do slide', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/ui/area-restrita/SlideConteudo.vue', 'utf-8');
    const estilo = css.slice(css.indexOf('<style'));
    expect(estilo).not.toMatch(/\bcqi\b|\bcqw\b|@container|\d(vw|vh|dvh|svh)\b/);
  });

  it('itens com número e percentual viram contadores grandes', () => {
    const c = montar(
      slide({ layout: 'topicos', itens: ['95% dos casos', '39,0% de outros', 'Item sem número'] })
    );
    expect(c.classes()).toContain('ar-slide--estatisticas');
    expect(c.findAll('.ar-slide__contador').map((e) => e.text())).toEqual(['95%', '39,0%']);
  });

  it('número do slide e linhas de circuito são decorativos (aria-hidden)', () => {
    const c = montar(slide({ layout: 'topicos', itens: ['a', 'b'] }));
    expect(c.get('.ar-slide__numero').attributes('aria-hidden')).toBe('true');
    expect(c.get('.ar-slide__circuito').attributes('aria-hidden')).toBe('true');
    expect(c.get('.ar-slide__numero').text()).toBe('03');
  });

  it('comparativo de duas colunas mostra o marcador VS decorativo; de três, não', () => {
    const col = (n: number) =>
      slide({
        layout: 'comparativo',
        colunas: Array.from({ length: n }, (_, i) => ({ titulo: `c${i}`, itens: ['a'] }))
      });
    expect(montar(col(2)).get('.ar-slide__versus').attributes('aria-hidden')).toBe('true');
    w?.unmount();
    expect(montar(col(3)).find('.ar-slide__versus').exists()).toBe(false);
  });

  it('encerramento: título, subtítulo e itens com o mesmo texto de antes', () => {
    const c = montar(
      slide({ layout: 'encerramento', subtitulo: 'Obrigado', itens: ['Um', 'Dois'] })
    );
    expect(c.findAll('.ar-slide__itens-fim li').map((e) => e.text())).toEqual(['Um', 'Dois']);
    expect(c.text()).toContain('Obrigado');
  });
});

describe('ajuste de fonte ao palco', () => {
  function elementos(alturas: (fator: number) => number) {
    const raiz = document.createElement('article');
    const corpo = document.createElement('div');
    raiz.append(corpo);
    Object.defineProperty(corpo, 'clientHeight', { value: 740 });
    Object.defineProperty(corpo, 'clientWidth', { value: 1400 });
    Object.defineProperty(corpo, 'scrollWidth', { value: 1400 });
    Object.defineProperty(corpo, 'scrollHeight', {
      get: () => alturas(Number(raiz.style.getPropertyValue('--s-aj')))
    });
    return { raiz, corpo };
  }

  it('conteúdo que cabe fica com fator 1', () => {
    const { raiz, corpo } = elementos(() => 700);
    expect(ajustarFonteAoPalco(raiz, corpo)).toBe(1);
  });

  it('conteúdo que transborda encolhe a fonte até caber', () => {
    const { raiz, corpo } = elementos((f) => 1000 * f);
    const fator = ajustarFonteAoPalco(raiz, corpo);
    expect(fator).toBeLessThan(1);
    expect(1000 * fator).toBeLessThanOrEqual(741);
    expect(raiz.style.getPropertyValue('--s-aj')).toBe(String(fator));
  });

  it('nunca desce do mínimo', () => {
    const { raiz, corpo } = elementos(() => 5000);
    expect(ajustarFonteAoPalco(raiz, corpo)).toBe(AJUSTE_MINIMO);
  });

  it('sem layout (altura 0) não mexe em nada', () => {
    const raiz = document.createElement('article');
    const corpo = document.createElement('div');
    expect(ajustarFonteAoPalco(raiz, corpo)).toBe(1);
  });
});
