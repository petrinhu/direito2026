// @vitest-environment jsdom
// "Mostrar animações" desligado no Windows = prefers-reduced-motion: reduce.
// Com essa preferência o visor não podia perder o palco ao trocar de slide
// (achado do QA: palco com 0 filhos e TypeError de parentNode a cada troca).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import SlidesVisor from '@/ui/area-restrita/SlidesVisor.vue';
import { usarSemMovimento } from '@/app/restrito/semMovimento';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import { conteudoRestritoFalso } from '../../unidade/apoio/conteudoRestritoFalso';

const r = validarConteudoRestrito(conteudoRestritoFalso());
if (!r.ok) throw new Error('fixture inválida');
const { slides, equipe } = r.conteudo;

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function simularReduceMotion(): void {
  vi.stubGlobal('matchMedia', (consulta: string) => ({
    matches: consulta === '(prefers-reduced-motion: reduce)',
    media: consulta,
    addEventListener: () => undefined,
    removeEventListener: () => undefined
  }));
}

describe('SlidesVisor com prefers-reduced-motion: reduce', () => {
  it('percorre todos os slides mostrando o conteúdo de cada um, sem erro', async () => {
    simularReduceMotion();
    const erros: unknown[] = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => erros.push(args));
    const aoErro = (e: globalThis.ErrorEvent): void => {
      erros.push(e.error);
    };
    window.addEventListener('error', aoErro);
    try {
      w = mount(SlidesVisor, {
        props: { slides, equipe, reduzirMovimento: usarSemMovimento().value },
        attachTo: document.body,
        global: { stubs: { transition: false } }
      });
      for (let i = 0; i < slides.length; i++) {
        await flushPromises();
        const atual = w.get('[aria-roledescription="slide"]');
        expect(atual.attributes('aria-label')).toBe(`Slide ${i + 1} de ${slides.length}`);
        expect(atual.text().length).toBeGreaterThan(0);
        expect(w.findAll('.ar-palco-slide__escala > *').length).toBe(1);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        // A saída do Transition conclui no próximo quadro (rAF), que o flushPromises não espera.
        await new Promise((resolver) => setTimeout(resolver, 50));
      }
      await flushPromises();
    } finally {
      window.removeEventListener('error', aoErro);
    }
    expect(erros).toEqual([]);
  });
});
