// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import SlidesVisor from '@/ui/area-restrita/SlidesVisor.vue';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import { conteudoRestritoFalso } from '../../unidade/apoio/conteudoRestritoFalso';

const TITULO_QUEBRADO = 'SLIDE QUE QUEBRA';

// Simula um slide cuja composição lança erro na renderização (o caso do líder:
// só o primeiro slide aparecia). Só o slide marcado quebra; os demais seguem normais.
vi.mock('@/app/restrito/palco', async (importado) => {
  const real = await importado<typeof import('@/app/restrito/palco')>();
  return {
    ...real,
    compor: (slide: Parameters<typeof real.compor>[0]) => {
      if (slide.titulo === TITULO_QUEBRADO) throw new Error('falha simulada na composição');
      return real.compor(slide);
    }
  };
});

const r = validarConteudoRestrito(conteudoRestritoFalso());
if (!r.ok) throw new Error('fixture inválida');
const slides = r.conteudo.slides.map((s, i) =>
  i === 1 ? { ...s, titulo: TITULO_QUEBRADO, itens: ['Primeiro item seguro'] } : s
);
const { equipe } = r.conteudo;

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('SlidesVisor: slide com erro vira versão simples, nunca tela vazia', () => {
  it('ao falhar a renderização de um slide, mostra título e itens em modo simples', async () => {
    w = mount(SlidesVisor, {
      props: { slides, equipe, reduzirMovimento: true },
      attachTo: document.body
    });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await flushPromises();
    const simples = w.get('[data-testid="slide-modo-simples"]');
    expect(simples.text()).toContain(TITULO_QUEBRADO);
    expect(simples.text()).toContain('Primeiro item seguro');
  });

  it('o slide seguinte volta ao modo normal (o erro não contamina os demais)', async () => {
    w = mount(SlidesVisor, {
      props: { slides, equipe, reduzirMovimento: true },
      attachTo: document.body
    });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await flushPromises();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await flushPromises();
    expect(w.find('[data-testid="slide-modo-simples"]').exists()).toBe(false);
    expect(w.find('[aria-roledescription="slide"]').exists()).toBe(true);
  });
});
