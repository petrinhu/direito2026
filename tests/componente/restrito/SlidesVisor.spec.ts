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
function montar(reduzir = false) {
  w = mount(SlidesVisor, {
    props: { slides, equipe, reduzirMovimento: reduzir },
    attachTo: document.body
  });
  return w;
}
afterEach(() => {
  w?.unmount();
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, 'fullscreenEnabled');
  Reflect.deleteProperty(document, 'fullscreenElement');
  document.documentElement.classList.remove('ar-imprimindo');
});

const slideAtual = () => w!.get('[aria-roledescription="slide"]');

describe('SlidesVisor', () => {
  it('abre na capa, com a instituição e os integrantes vindos da equipe', () => {
    montar();
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
    expect(slideAtual().text()).toContain('Slide fictício 1');
    expect(slideAtual().text()).toContain('Instituição Fictícia');
    expect(slideAtual().text()).toContain('Pessoa Fictícia Um');
  });

  it('só a capa mostra a equipe', async () => {
    montar();
    await w!.get('button[data-acao="proximo"]').trigger('click');
    expect(slideAtual().text()).not.toContain('Instituição Fictícia');
  });

  it('botões avançam e voltam, e nas pontas ficam aria-disabled', async () => {
    montar();
    const anterior = w!.get('button[data-acao="anterior"]');
    expect(anterior.attributes('aria-disabled')).toBe('true');
    await w!.get('button[data-acao="proximo"]').trigger('click');
    expect(slideAtual().attributes('aria-label')).toBe('Slide 2 de 10');
    await anterior.trigger('click');
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
    await anterior.trigger('click');
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
  });

  it('teclado: setas, PageDown, PageUp, Home e End', async () => {
    montar();
    const palco = w!.get('.ar-slides__palco');
    await palco.trigger('keydown', { key: 'ArrowRight' });
    await palco.trigger('keydown', { key: 'PageDown' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 3 de 10');
    await palco.trigger('keydown', { key: 'ArrowLeft' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 2 de 10');
    await palco.trigger('keydown', { key: 'End' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 10 de 10');
    await palco.trigger('keydown', { key: 'ArrowRight' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 10 de 10');
    await palco.trigger('keydown', { key: 'Home' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
    await palco.trigger('keydown', { key: 'PageUp' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
  });

  it('atalhos com Ctrl ou Alt não são sequestrados', async () => {
    montar();
    await w!.get('.ar-slides__palco').trigger('keydown', { key: 'ArrowRight', ctrlKey: true });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
  });

  it('notas do apresentador começam escondidas; botão e a tecla N alternam, com aria-pressed', async () => {
    montar();
    const botao = w!.get('button[data-acao="notas"]');
    expect(botao.attributes('aria-pressed')).toBe('false');
    expect(w!.find('aside.ar-slides__notas').exists()).toBe(false);
    await botao.trigger('click');
    expect(botao.attributes('aria-pressed')).toBe('true');
    expect(w!.get('aside.ar-slides__notas').text()).toContain('palavra0');
    await w!.get('.ar-slides__palco').trigger('keydown', { key: 'n' });
    expect(w!.find('aside.ar-slides__notas').exists()).toBe(false);
  });

  it('cada layout renderiza o que o define', async () => {
    montar();
    const palco = w!.get('.ar-slides__palco');
    await palco.trigger('keydown', { key: 'ArrowRight' });
    expect(slideAtual().classes()).toContain('ar-slide--topicos');
    expect(slideAtual().findAll('li')).toHaveLength(2);
    await palco.trigger('keydown', { key: 'ArrowRight' });
    await palco.trigger('keydown', { key: 'ArrowRight' });
    expect(slideAtual().classes()).toContain('ar-slide--destaque');
    expect(slideAtual().text()).toContain('Frase de impacto fictícia.');
    await palco.trigger('keydown', { key: 'ArrowRight' });
    expect(slideAtual().classes()).toContain('ar-slide--comparativo');
    expect(slideAtual().findAll('.ar-slide__coluna')).toHaveLength(2);
    await palco.trigger('keydown', { key: 'End' });
    expect(slideAtual().classes()).toContain('ar-slide--encerramento');
  });

  it('anuncia a troca de slide para o leitor de tela, sem mover o foco', async () => {
    montar();
    await w!.get('button[data-acao="proximo"]').trigger('click');
    expect(w!.get('.ar-visualmente-oculto[role="status"]').text()).toMatch(/slide 2 de 10/i);
  });

  it('conteúdo de slide é texto: nada vira HTML', () => {
    const suspeito = [
      { ...slides[0]!, titulo: '<img src=x onerror=alert(1)>' },
      ...slides.slice(1)
    ];
    w = mount(SlidesVisor, { props: { slides: suspeito, equipe, reduzirMovimento: false } });
    expect(w.find('img').exists()).toBe(false);
    expect(w.text()).toContain('<img src=x onerror=alert(1)>');
  });

  it('o palco é focável e descreve como usar o teclado', () => {
    montar();
    const palco = w!.get('.ar-slides__palco');
    expect(palco.attributes('tabindex')).toBe('0');
    expect(palco.attributes('aria-label')).toMatch(/setas/i);
  });

  it('sem movimento: marca o palco para o CSS cortar a transição', () => {
    montar(true);
    expect(w!.get('.ar-slides__deck').classes()).toContain('ar-slides__deck--sem-movimento');
  });

  it('espaço avança o slide', async () => {
    montar();
    await w!.get('.ar-slides__palco').trigger('keydown', { key: ' ' });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 2 de 10');
  });

  it('toque: arrastar para a esquerda avança, para a direita volta, gesto curto e mouse não fazem nada', async () => {
    montar();
    const palco = w!.get('.ar-slides__palco');
    const arrastar = async (tipo: string, de: number, ate: number) => {
      await palco.trigger('pointerdown', { pointerType: tipo, clientX: de });
      await palco.trigger('pointerup', { pointerType: tipo, clientX: ate });
    };
    await arrastar('touch', 300, 100);
    expect(slideAtual().attributes('aria-label')).toBe('Slide 2 de 10');
    await arrastar('touch', 100, 300);
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
    await arrastar('touch', 100, 130);
    await arrastar('mouse', 300, 100);
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
  });

  it('toque cancelado não deixa um arrastar pela metade para o próximo gesto', async () => {
    montar();
    const palco = w!.get('.ar-slides__palco');
    await palco.trigger('pointerdown', { pointerType: 'touch', clientX: 300 });
    await palco.trigger('pointercancel', { pointerType: 'touch' });
    await palco.trigger('pointerup', { pointerType: 'touch', clientX: 100 });
    expect(slideAtual().attributes('aria-label')).toBe('Slide 1 de 10');
  });

  it('tela cheia sem a API: cai no modo por CSS, aria-pressed acompanha e Esc sai', async () => {
    montar();
    const botao = w!.get('button[data-acao="tela-cheia"]');
    await botao.trigger('click');
    expect(w!.get('.ar-slides__deck').classes()).toContain('ar-slides__deck--cheia');
    expect(botao.attributes('aria-pressed')).toBe('true');
    await w!.get('.ar-slides__palco').trigger('keydown', { key: 'Escape' });
    expect(w!.get('.ar-slides__deck').classes()).not.toContain('ar-slides__deck--cheia');
    expect(botao.attributes('aria-pressed')).toBe('false');
  });

  it('tela cheia com a API: pede requestFullscreen ao deck e segue o evento fullscreenchange', async () => {
    montar();
    const deck = w!.get('.ar-slides__deck').element as HTMLElement;
    const pedir = vi.fn(async () => {
      Object.defineProperty(document, 'fullscreenElement', { value: deck, configurable: true });
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    deck.requestFullscreen = pedir;
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    const botao = w!.get('button[data-acao="tela-cheia"]');
    await botao.trigger('click');
    await flushPromises();
    expect(pedir).toHaveBeenCalledTimes(1);
    expect(botao.attributes('aria-pressed')).toBe('true');
  });

  it('tela cheia: se a API recusar, usa o modo por CSS', async () => {
    montar();
    const deck = w!.get('.ar-slides__deck').element as HTMLElement;
    deck.requestFullscreen = vi.fn(async () => {
      throw new Error('negado');
    });
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    await w!.get('button[data-acao="tela-cheia"]').trigger('click');
    await flushPromises();
    expect(w!.get('.ar-slides__deck').classes()).toContain('ar-slides__deck--cheia');
  });

  describe('cronômetro de 10 minutos', () => {
    const tempo = () => w!.get('[role="timer"]');

    it('começa fora de cena; o botão liga, pausa e retoma, sem aria-live a cada segundo', async () => {
      vi.useFakeTimers();
      montar();
      expect(w!.find('[role="timer"]').exists()).toBe(false);
      const botao = w!.get('button[data-acao="cronometro"]');
      expect(botao.attributes('aria-pressed')).toBe('false');
      await botao.trigger('click');
      expect(tempo().text()).toBe('10:00');
      expect(tempo().attributes('aria-live')).toBeUndefined();
      expect(botao.attributes('aria-pressed')).toBe('true');
      await vi.advanceTimersByTimeAsync(61_000);
      expect(tempo().text()).toBe('08:59');
      await botao.trigger('click');
      await vi.advanceTimersByTimeAsync(30_000);
      expect(tempo().text()).toBe('08:59');
      expect(vi.getTimerCount()).toBe(0);
      await botao.trigger('click');
      await vi.advanceTimersByTimeAsync(2_000);
      expect(tempo().text()).toBe('08:57');
    });

    it('ao zerar, para, avisa uma vez ao leitor de tela e não faz som', async () => {
      vi.useFakeTimers();
      montar();
      await w!.get('button[data-acao="cronometro"]').trigger('click');
      await vi.advanceTimersByTimeAsync(600_000);
      expect(tempo().text()).toBe('00:00');
      expect(vi.getTimerCount()).toBe(0);
      expect(w!.get('.ar-visualmente-oculto[role="status"]').text()).toMatch(/10 minutos/);
      expect(w!.find('audio').exists()).toBe(false);
    });

    it('zerar volta a 10:00 e some; sair da página limpa o relógio', async () => {
      vi.useFakeTimers();
      montar();
      await w!.get('button[data-acao="cronometro"]').trigger('click');
      await vi.advanceTimersByTimeAsync(5_000);
      await w!.get('button[data-acao="cronometro-zerar"]').trigger('click');
      expect(w!.find('[role="timer"]').exists()).toBe(false);
      await w!.get('button[data-acao="cronometro"]').trigger('click');
      expect(tempo().text()).toBe('10:00');
      w!.unmount();
      w = undefined;
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('impressão', () => {
    const paginas = () => Array.from(document.querySelectorAll('.ar-impresso__pagina'));

    it('sem pedir, não existe nenhuma página de impressão no DOM', () => {
      montar();
      expect(paginas()).toHaveLength(0);
    });

    it('"Imprimir com notas": uma página por slide, com as notas abaixo, e limpa no afterprint', async () => {
      const imprimir = vi.fn();
      vi.stubGlobal('print', imprimir);
      montar();
      await w!.get('button[data-acao="imprimir-com-notas"]').trigger('click');
      await flushPromises();
      expect(imprimir).toHaveBeenCalledTimes(1);
      expect(paginas()).toHaveLength(10);
      expect(document.querySelectorAll('.ar-impresso__notas')).toHaveLength(10);
      expect(document.querySelector('.ar-impresso__notas')!.textContent).toContain('palavra0');
      expect(document.documentElement.classList.contains('ar-imprimindo')).toBe(true);
      window.dispatchEvent(new Event('afterprint'));
      await flushPromises();
      expect(paginas()).toHaveLength(0);
      expect(document.documentElement.classList.contains('ar-imprimindo')).toBe(false);
    });

    it('"Imprimir sem notas": uma página por slide e nenhuma nota', async () => {
      vi.stubGlobal('print', vi.fn());
      montar();
      await w!.get('button[data-acao="imprimir"]').trigger('click');
      await flushPromises();
      expect(paginas()).toHaveLength(10);
      expect(document.querySelectorAll('.ar-impresso__notas')).toHaveLength(0);
    });

    it('a capa impressa também traz a instituição e os integrantes', async () => {
      vi.stubGlobal('print', vi.fn());
      montar();
      await w!.get('button[data-acao="imprimir"]').trigger('click');
      await flushPromises();
      expect(paginas()[0]!.textContent).toContain('Instituição Fictícia');
      expect(paginas()[0]!.textContent).toContain('Pessoa Fictícia Um');
    });

    it('as páginas de impressão ficam fora da árvore de acessibilidade', async () => {
      vi.stubGlobal('print', vi.fn());
      montar();
      await w!.get('button[data-acao="imprimir"]').trigger('click');
      await flushPromises();
      expect(document.querySelector('.ar-impresso')!.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('nenhuma mídia: sem audio, video nem autoplay, em nenhum slide', async () => {
    montar();
    const palco = w!.get('.ar-slides__palco');
    for (let i = 0; i < 10; i += 1) {
      expect(w!.find('audio, video, [autoplay]').exists()).toBe(false);
      await palco.trigger('keydown', { key: 'ArrowRight' });
    }
  });
});
