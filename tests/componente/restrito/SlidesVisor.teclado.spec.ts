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
  w = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, 'fullscreenEnabled');
  Reflect.deleteProperty(document, 'fullscreenElement');
  document.documentElement.classList.remove('ar-imprimindo');
});

async function montar() {
  w = mount(SlidesVisor, {
    props: { slides, equipe, reduzirMovimento: false },
    attachTo: document.body
  });
  await flushPromises();
  return w;
}

const slideAtual = () => w!.get('[aria-roledescription="slide"]');
const rotulo = () => slideAtual().attributes('aria-label');

/** Dispara uma tecla no alvo, subindo pela árvore como um keydown real (bubbles). */
function tecla(alvo: EventTarget, key: string): KeyboardEvent {
  const evento = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  alvo.dispatchEvent(evento);
  return evento;
}

describe('SlidesVisor: setas do teclado em qualquer foco da página', () => {
  it('com o foco no body, ArrowRight avança e ArrowLeft volta', async () => {
    await montar();
    document.body.focus();
    tecla(document, 'ArrowRight');
    await flushPromises();
    expect(rotulo()).toBe('Slide 2 de 10');
    tecla(document, 'ArrowLeft');
    await flushPromises();
    expect(rotulo()).toBe('Slide 1 de 10');
  });

  it('com o foco num botão da barra (Próximo), as setas continuam funcionando', async () => {
    await montar();
    const proximo = w!.get('button[data-acao="proximo"]').element as HTMLElement;
    proximo.focus();
    tecla(proximo, 'ArrowRight');
    await flushPromises();
    expect(rotulo()).toBe('Slide 2 de 10');
    tecla(proximo, 'ArrowLeft');
    await flushPromises();
    expect(rotulo()).toBe('Slide 1 de 10');
  });

  it('Home e End continuam indo às pontas, com foco num botão', async () => {
    await montar();
    const tela = w!.get('button[data-acao="tela-cheia"]').element as HTMLElement;
    tela.focus();
    tecla(tela, 'End');
    await flushPromises();
    expect(rotulo()).toBe('Slide 10 de 10');
    tecla(tela, 'Home');
    await flushPromises();
    expect(rotulo()).toBe('Slide 1 de 10');
  });

  it.each([
    ['input', '<input type="text" />'],
    ['textarea', '<textarea></textarea>'],
    ['select', '<select><option>a</option><option>b</option></select>'],
    ['contenteditable', '<div contenteditable="true"><span>texto</span></div>']
  ])('com o foco num %s, as setas NÃO trocam de slide', async (_nome, html) => {
    await montar();
    const externo = document.createElement('div');
    externo.innerHTML = html;
    document.body.appendChild(externo);
    const campo = externo.firstElementChild as HTMLElement;
    const alvo = campo.querySelector('span') ?? campo;
    tecla(alvo, 'ArrowRight');
    tecla(alvo, 'ArrowLeft');
    tecla(alvo, 'End');
    await flushPromises();
    expect(rotulo()).toBe('Slide 1 de 10');
  });

  it('com o foco num botão, Espaço não troca de slide (o botão continua ativável)', async () => {
    await montar();
    const proximo = w!.get('button[data-acao="proximo"]').element as HTMLElement;
    proximo.focus();
    const evento = tecla(proximo, ' ');
    await flushPromises();
    expect(rotulo()).toBe('Slide 1 de 10');
    expect(evento.defaultPrevented).toBe(false);
  });

  it('com o foco num botão, Enter não troca de slide', async () => {
    await montar();
    const proximo = w!.get('button[data-acao="proximo"]').element as HTMLElement;
    proximo.focus();
    tecla(proximo, 'Enter');
    await flushPromises();
    expect(rotulo()).toBe('Slide 1 de 10');
  });

  it('com o foco no próprio palco, Espaço e PageDown continuam avançando', async () => {
    await montar();
    const palco = w!.get('.ar-slides__palco').element as HTMLElement;
    palco.focus();
    tecla(palco, ' ');
    tecla(palco, 'PageDown');
    await flushPromises();
    expect(rotulo()).toBe('Slide 3 de 10');
  });

  it('um keydown já cancelado por outro componente (aba) não troca o slide', async () => {
    await montar();
    const aba = document.createElement('button');
    aba.addEventListener('keydown', (e) => e.preventDefault());
    document.body.appendChild(aba);
    tecla(aba, 'ArrowRight');
    await flushPromises();
    expect(rotulo()).toBe('Slide 1 de 10');
  });

  it('Ctrl ou Alt com seta não são sequestrados, mesmo fora do palco', async () => {
    await montar();
    const evento = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    });
    document.body.dispatchEvent(evento);
    await flushPromises();
    expect(rotulo()).toBe('Slide 1 de 10');
  });

  it('ao entrar em tela cheia pela API, o foco vai para o palco', async () => {
    await montar();
    const deck = w!.get('.ar-slides__deck').element as HTMLElement;
    const palco = w!.get('.ar-slides__palco').element as HTMLElement;
    deck.requestFullscreen = vi.fn(async () => {
      Object.defineProperty(document, 'fullscreenElement', { value: deck, configurable: true });
      document.dispatchEvent(new Event('fullscreenchange'));
    });
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    (w!.get('button[data-acao="tela-cheia"]').element as HTMLElement).focus();
    await w!.get('button[data-acao="tela-cheia"]').trigger('click');
    await flushPromises();
    expect(document.activeElement).toBe(palco);
  });

  it('depois de desmontar, o listener do document é removido e as setas não fazem nada', async () => {
    const adicionar = vi.spyOn(document, 'addEventListener');
    const remover = vi.spyOn(document, 'removeEventListener');
    await montar();
    const handler = adicionar.mock.calls.find(([tipo]) => tipo === 'keydown')?.[1];
    expect(handler).toBeTypeOf('function');
    w!.unmount();
    w = undefined;
    expect(remover).toHaveBeenCalledWith('keydown', handler);
    expect(() => tecla(document, 'ArrowRight')).not.toThrow();
  });
});
