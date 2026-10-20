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

/** Classes que o Transition põe no slide só durante a saída e a entrada (`ar-slide-simples` é permanente, não entra aqui). */
const SELETOR_TRANSICAO_EM_ANDAMENTO =
  '.ar-slide-enter-from, .ar-slide-enter-active, .ar-slide-leave-to, .ar-slide-leave-active';

/**
 * Espera a troca para o slide `numero` terminar, por estado e não por tempo.
 * O Transition (out-in) só monta o slide novo depois que o antigo sai, e cada fase
 * espera quadros de animação (rAF). Esse prazo varia com a carga da máquina, então
 * um tempo fixo fica às vezes curto. O teto só limita a espera: ela termina assim que
 * o estado é atingido; se nunca chegar, a última asserção falha com a mensagem real.
 */
async function aguardarSlide(visor: VueWrapper, numero: number, total: number): Promise<void> {
  await vi.waitFor(
    () => {
      expect(visor.findAll(SELETOR_TRANSICAO_EM_ANDAMENTO)).toHaveLength(0);
      expect(visor.get('[aria-roledescription="slide"]').attributes('aria-label')).toBe(
        `Slide ${numero} de ${total}`
      );
    },
    { interval: 5, timeout: 2000 }
  );
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
        await aguardarSlide(w, i + 1, slides.length);
        const atual = w.get('[aria-roledescription="slide"]');
        expect(atual.attributes('aria-label')).toBe(`Slide ${i + 1} de ${slides.length}`);
        expect(atual.text().length).toBeGreaterThan(0);
        expect(w.findAll('.ar-palco-slide__escala > *').length).toBe(1);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      }
      await flushPromises();
    } finally {
      window.removeEventListener('error', aoErro);
    }
    expect(erros).toEqual([]);
  });
});
