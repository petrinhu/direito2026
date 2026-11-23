// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { computed, ref } from 'vue';
import TocadorRadio from '@/ui/componentes/TocadorRadio.vue';
import type { StoreRadio } from '@/app/radio/tocadorRadio';
import type { EstadoRadio } from '@/core/radio/maquina';
import { RADIOS } from '@/core/radio/catalogo';

/**
 * Quadro da rádio (disclosure, mesmo padrão do menu do currículo): "Rádio" abre e fecha, Esc e
 * clique fora fecham, o X fecha e devolve o foco ao "Rádio". Fechar só esconde a seleção: a
 * rádio que está tocando continua tocando, e a store não recebe comando nenhum.
 */

/** Store de mentira com a forma de StoreRadio: estado "tocando" e todo comando é espião. */
function storeTocando(): StoreRadio {
  const primeira = RADIOS[0];
  if (!primeira) throw new Error('catálogo de rádios vazio');
  const estado = ref<EstadoRadio>('tocando');
  return {
    estado,
    radios: RADIOS,
    radio: computed(() => primeira),
    volume: ref(50),
    mudo: ref(false),
    anuncio: computed(() => 'Tocando'),
    consentidaAtual: computed(() => true),
    alternar: vi.fn(),
    parar: vi.fn(),
    consentir: vi.fn(),
    esquecerConsentimentos: vi.fn(),
    cancelar: vi.fn(),
    trocarRadio: vi.fn(),
    definirVolume: vi.fn(),
    alternarMudo: vi.fn(),
    vincularAudio: vi.fn()
  };
}

let montado: VueWrapper | null = null;

function montar(store: StoreRadio): VueWrapper {
  montado = mount(TocadorRadio, { props: { store }, attachTo: document.body });
  return montado;
}

function botaoRadio(wrapper: VueWrapper): HTMLButtonElement {
  return wrapper.get('.tocador__abrir').element as HTMLButtonElement;
}

function quadro(wrapper: VueWrapper): HTMLElement {
  return wrapper.get('#tocador-detalhes').element as HTMLElement;
}

function botaoX(wrapper: VueWrapper): HTMLButtonElement {
  return wrapper.get('button[aria-label="Fechar seleção de rádio"]').element as HTMLButtonElement;
}

function pressionarEsc(alvo: EventTarget): void {
  alvo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

function apertarFora(): void {
  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
}

async function abrirQuadro(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('.tocador__abrir').trigger('click');
  expect(botaoRadio(wrapper).getAttribute('aria-expanded')).toBe('true');
}

afterEach(() => {
  montado?.unmount();
  montado = null;
  document.body.replaceChildren();
});

describe('TocadorRadio: botão Rádio (aria-expanded e aria-controls)', () => {
  it('começa fechado, com aria-expanded false apontando para o quadro que existe', () => {
    const wrapper = montar(storeTocando());
    const botao = botaoRadio(wrapper);

    expect(botao.getAttribute('aria-expanded')).toBe('false');
    expect(botao.getAttribute('aria-controls')).toBe('tocador-detalhes');
    expect(quadro(wrapper).style.display).toBe('none');
  });

  it('clicar alterna: abre o quadro e, no segundo clique, fecha', async () => {
    const wrapper = montar(storeTocando());

    await wrapper.get('.tocador__abrir').trigger('click');
    expect(botaoRadio(wrapper).getAttribute('aria-expanded')).toBe('true');
    expect(quadro(wrapper).style.display).not.toBe('none');

    await wrapper.get('.tocador__abrir').trigger('click');
    expect(botaoRadio(wrapper).getAttribute('aria-expanded')).toBe('false');
    expect(quadro(wrapper).style.display).toBe('none');
  });
});

describe('TocadorRadio: quadro fecha com Esc, clique fora e X', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('Esc fecha o quadro mesmo com o foco dentro dele, e devolve o foco ao botão Rádio', async () => {
    const wrapper = montar(storeTocando());
    await abrirQuadro(wrapper);
    const select = wrapper.get('select').element as HTMLSelectElement;
    select.focus();

    pressionarEsc(select);
    await wrapper.vm.$nextTick();

    expect(botaoRadio(wrapper).getAttribute('aria-expanded')).toBe('false');
    expect(quadro(wrapper).style.display).toBe('none');
    expect(document.activeElement).toBe(botaoRadio(wrapper));
  });

  it('Esc com o quadro fechado não move o foco nem abre nada', async () => {
    const wrapper = montar(storeTocando());
    const fora = document.createElement('input');
    document.body.appendChild(fora);
    fora.focus();

    pressionarEsc(fora);
    await wrapper.vm.$nextTick();

    expect(document.activeElement).toBe(fora);
    expect(botaoRadio(wrapper).getAttribute('aria-expanded')).toBe('false');
  });

  it('clique fora do quadro fecha, sem roubar o foco', async () => {
    const wrapper = montar(storeTocando());
    await abrirQuadro(wrapper);
    const fora = document.createElement('input');
    document.body.appendChild(fora);
    fora.focus();

    apertarFora();
    await wrapper.vm.$nextTick();

    expect(botaoRadio(wrapper).getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(fora);
  });

  it('clique dentro do quadro não fecha', async () => {
    const wrapper = montar(storeTocando());
    await abrirQuadro(wrapper);

    wrapper.get('select').element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    wrapper
      .get('.tocador__emissora-nome')
      .element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await wrapper.vm.$nextTick();

    expect(botaoRadio(wrapper).getAttribute('aria-expanded')).toBe('true');
  });

  it('o clique que abriu o quadro não o fecha na mesma hora', async () => {
    const wrapper = montar(storeTocando());
    const botao = wrapper.get('.tocador__abrir').element;

    botao.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    botao.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wrapper.vm.$nextTick();

    expect(botaoRadio(wrapper).getAttribute('aria-expanded')).toBe('true');
  });

  it('o X fecha o quadro e devolve o foco ao botão Rádio', async () => {
    const wrapper = montar(storeTocando());
    await abrirQuadro(wrapper);

    botaoX(wrapper).click();
    await wrapper.vm.$nextTick();

    expect(botaoRadio(wrapper).getAttribute('aria-expanded')).toBe('false');
    expect(quadro(wrapper).style.display).toBe('none');
    expect(document.activeElement).toBe(botaoRadio(wrapper));
  });

  it('o X tem o aria-label exigido e fica dentro do quadro', async () => {
    const wrapper = montar(storeTocando());
    await abrirQuadro(wrapper);

    expect(botaoX(wrapper).getAttribute('aria-label')).toBe('Fechar seleção de rádio');
    expect(quadro(wrapper).contains(botaoX(wrapper))).toBe(true);
  });
});

describe('TocadorRadio: fechar não para a rádio', () => {
  it('Esc, clique fora e X não chamam comando nenhum da store e mantêm o estado tocando', async () => {
    const store = storeTocando();
    const wrapper = montar(store);

    await abrirQuadro(wrapper);
    pressionarEsc(botaoRadio(wrapper));
    await wrapper.vm.$nextTick();

    await abrirQuadro(wrapper);
    apertarFora();
    await wrapper.vm.$nextTick();

    await abrirQuadro(wrapper);
    botaoX(wrapper).click();
    await wrapper.vm.$nextTick();

    expect(store.estado.value).toBe('tocando');
    expect(store.alternar).not.toHaveBeenCalled();
    expect(store.parar).not.toHaveBeenCalled();
    expect(store.cancelar).not.toHaveBeenCalled();
    expect(store.trocarRadio).not.toHaveBeenCalled();
  });
});
