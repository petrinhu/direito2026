// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import SlidesVisor from '@/ui/area-restrita/SlidesVisor.vue';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import { conteudoRestritoFalso } from '../../unidade/apoio/conteudoRestritoFalso';

const r = validarConteudoRestrito(conteudoRestritoFalso());
if (!r.ok) throw new Error('fixture inválida');
const { slides, equipe } = r.conteudo;

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.classList.remove('ar-imprimindo');
});

function medidas(largura: number, altura: number): void {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(largura);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(altura);
}

async function montar() {
  w = mount(SlidesVisor, {
    props: { slides, equipe, reduzirMovimento: false },
    attachTo: document.body
  });
  await flushPromises();
  return w;
}

describe('SlidesVisor: palco escalado', () => {
  it.each([
    [1280, 720, 0.8],
    [1000, 562.5, 0.625],
    [360, 640, 0.225]
  ])('em %i x %i o palco lógico 1600x900 é escalado para %f', async (l, a, esperada) => {
    medidas(l, a);
    await montar();
    const palco = w!.get('.ar-slides__area .ar-palco-slide__escala');
    expect(palco.attributes('style')).toContain('width: 1600px');
    expect(palco.attributes('style')).toContain('height: 900px');
    expect(palco.attributes('style')).toContain(`scale(${esperada})`);
  });

  it('o slide visível está dentro do palco lógico', async () => {
    medidas(1280, 720);
    await montar();
    expect(w!.get('.ar-palco-slide__escala').find('[aria-roledescription="slide"]').exists()).toBe(
      true
    );
  });

  it('o palco nunca passa do espaço: caixa escalada cabe em largura e altura', async () => {
    medidas(1920, 500);
    await montar();
    const estilo = w!.get('.ar-slides__area .ar-palco-slide').attributes('style')!;
    const largura = Number(/width: ([\d.]+)px/.exec(estilo)![1]);
    const altura = Number(/height: ([\d.]+)px/.exec(estilo)![1]);
    expect(largura).toBeLessThanOrEqual(1920);
    expect(altura).toBeLessThanOrEqual(500);
    expect(largura / altura).toBeCloseTo(16 / 9, 5);
  });

  it('muda a escala ao entrar em tela cheia (espaço novo)', async () => {
    medidas(1000, 562.5);
    await montar();
    expect(w!.get('.ar-palco-slide__escala').attributes('style')).toContain('scale(0.625)');
    medidas(1280, 600);
    await w!.get('button[data-acao="tela-cheia"]').trigger('click');
    await flushPromises();
    expect(w!.get('.ar-palco-slide__escala').attributes('style')).toContain('scale(0.6666');
  });

  it('a impressão usa o mesmo palco 1600x900 para todos os slides, com notas legíveis', async () => {
    medidas(1280, 720);
    vi.stubGlobal('print', vi.fn());
    await montar();
    await w!.get('button[data-acao="imprimir-com-notas"]').trigger('click');
    await flushPromises();
    const paginas = document.body.querySelectorAll('.ar-impresso__pagina');
    expect(paginas).toHaveLength(slides.length);
    for (const pagina of paginas) {
      const palco = pagina.querySelector<HTMLElement>('.ar-palco-slide__escala')!;
      expect(palco.style.width).toBe('1600px');
      expect(palco.style.height).toBe('900px');
      expect(pagina.querySelector('.ar-impresso__notas p')!.textContent).toContain('palavra0');
    }
  });

  it('a impressão sem notas usa escala maior que a com notas e não imprime notas', async () => {
    medidas(1280, 720);
    vi.stubGlobal('print', vi.fn());
    await montar();
    const escalaDe = () =>
      Number(
        /scale\(([\d.]+)\)/.exec(
          document.body.querySelector<HTMLElement>('.ar-impresso .ar-palco-slide__escala')!.style
            .transform
        )![1]
      );
    await w!.get('button[data-acao="imprimir-com-notas"]').trigger('click');
    await flushPromises();
    const comNotas = escalaDe();
    window.dispatchEvent(new Event('afterprint'));
    await flushPromises();
    await w!.get('button[data-acao="imprimir"]').trigger('click');
    await flushPromises();
    expect(document.body.querySelector('.ar-impresso__notas')).toBeNull();
    expect(escalaDe()).toBeGreaterThan(comNotas);
  });
});
