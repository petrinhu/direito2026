// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import QuadroProva from '@/ui/componentes/QuadroProva.vue';
import { rotas } from '@/app/router/rotas';
import { instalarPolyfillDialog } from './apoio/dialogPolyfill';

/**
 * Calendário em janela modal a partir do quadro de contagem (ordem do líder,
 * 20/10/2026): o botão abre a modal na página atual, sem trocar de rota. A
 * modal é um <dialog> com showModal(): Fechar, clique no fundo e Esc fecham;
 * clique dentro do conteúdo não fecha; o corpo não rola enquanto ela está
 * aberta. O conteúdo é o mesmo da página /calendario, carregado sob demanda.
 */
instalarPolyfillDialog();

const AGORA_20_10 = new Date('2026-10-20T15:00:00Z');

let montado: VueWrapper | undefined;

async function montarQuadro() {
  const router = createRouter({ history: createMemoryHistory(), routes: rotas });
  await router.push('/');
  await router.isReady();
  montado = mount(QuadroProva, {
    props: { agora: AGORA_20_10 },
    global: { plugins: [router] },
    attachTo: document.body
  });
  return { w: montado, router };
}

function botaoAbrir(w: VueWrapper): HTMLButtonElement {
  const botao = w.find('button.quadro-prova__link').element as HTMLButtonElement;
  return botao;
}

function janela(): HTMLElement {
  return document.querySelector<HTMLElement>('dialog') as HTMLElement;
}

function botaoFechar(): HTMLButtonElement {
  const achado = Array.from(janela().querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === 'Fechar'
  );
  return achado as HTMLButtonElement;
}

async function abrirJanela(w: VueWrapper): Promise<void> {
  botaoAbrir(w).click();
  await flushPromises();
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  montado?.unmount();
  montado = undefined;
  document.body.replaceChildren();
  document.documentElement.style.overflow = '';
});

describe('QuadroProva, o botão abre o calendário em janela modal', () => {
  it('o botão abre a janela e não muda a rota', async () => {
    const { w, router } = await montarQuadro();
    const caminhoAntes = router.currentRoute.value.fullPath;

    await abrirJanela(w);

    expect(janela().hasAttribute('open')).toBe(true);
    expect(router.currentRoute.value.fullPath).toBe(caminhoAntes);
  });

  it('o quadro não tem mais link para /calendario (o menu lateral continua tendo)', async () => {
    const { w } = await montarQuadro();
    expect(w.find('a[href="/calendario"]').exists()).toBe(false);
    expect(w.find('button.quadro-prova__link').text()).toBe('Abrir o calendário');
  });

  it('o botão declara que abre um diálogo', async () => {
    const { w } = await montarQuadro();
    expect(botaoAbrir(w).getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('a janela tem o título "Calendário" e um botão visível "Fechar"', async () => {
    const { w } = await montarQuadro();
    await abrirJanela(w);

    const titulo = janela().querySelector('h2');
    expect(titulo?.textContent?.trim()).toBe('Calendário');
    expect(janela().getAttribute('aria-labelledby')).toBe(titulo?.id);
    expect(botaoFechar()).toBeDefined();
  });

  it('o conteúdo é o mesmo da página: grade, legenda, painel e lista de datas', async () => {
    const { w } = await montarQuadro();
    await abrirJanela(w);
    await vi.waitFor(() => {
      expect(janela().querySelector('.fc')).not.toBeNull();
    });

    expect(janela().querySelector('[data-testid="legenda-calendario"]')).not.toBeNull();
    expect(janela().querySelector('[data-testid="painel-do-dia"]')).not.toBeNull();
    expect(janela().querySelector('[data-testid="lista-datas-do-mes"]')).not.toBeNull();
  });

  it('o painel do dia usa a data injetada (20 de outubro de 2026)', async () => {
    const { w } = await montarQuadro();
    await abrirJanela(w);
    await vi.waitFor(() => {
      expect(janela().querySelector('[data-testid="painel-do-dia"] h2')).not.toBeNull();
    });
    expect(janela().querySelector('[data-testid="painel-do-dia"] h2')?.textContent).toContain(
      '20 de outubro de 2026'
    );
  });

  it('o conteúdo do calendário só é montado ao abrir (fora do pacote inicial)', async () => {
    const { w } = await montarQuadro();
    expect(janela().querySelector('.fc')).toBeNull();
    expect(janela().hasAttribute('open')).toBe(false);

    await abrirJanela(w);
    await vi.waitFor(() => {
      expect(janela().querySelector('.fc')).not.toBeNull();
    });
  });
});

describe('janela modal, formas de fechar', () => {
  it('o botão Fechar fecha e devolve o foco ao botão que abriu', async () => {
    const { w } = await montarQuadro();
    await abrirJanela(w);

    botaoFechar().click();
    await flushPromises();

    expect(janela().hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(botaoAbrir(w));
  });

  it('clicar no fundo (alvo é o próprio dialog) fecha', async () => {
    const { w } = await montarQuadro();
    await abrirJanela(w);

    janela().dispatchEvent(new Event('pointerdown', { bubbles: true }));
    janela().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();

    expect(janela().hasAttribute('open')).toBe(false);
  });

  it('clicar dentro do conteúdo não fecha', async () => {
    const { w } = await montarQuadro();
    await abrirJanela(w);

    const caixa = janela().querySelector('.modal-calendario__caixa') as HTMLElement;
    caixa.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();

    expect(janela().hasAttribute('open')).toBe(true);
  });

  it('arrastar a partir do conteúdo e soltar no fundo não fecha', async () => {
    const { w } = await montarQuadro();
    await abrirJanela(w);

    const caixa = janela().querySelector('.modal-calendario__caixa') as HTMLElement;
    caixa.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    janela().dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushPromises();

    expect(janela().hasAttribute('open')).toBe(true);
  });

  it('Esc (evento cancel) fecha', async () => {
    const { w } = await montarQuadro();
    await abrirJanela(w);

    janela().dispatchEvent(new Event('cancel', { cancelable: true }));
    await flushPromises();

    expect(janela().hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(botaoAbrir(w));
  });

  it('o corpo não rola com a janela aberta e volta a rolar ao fechar', async () => {
    const { w } = await montarQuadro();
    await abrirJanela(w);
    expect(document.documentElement.style.overflow).toBe('hidden');

    botaoFechar().click();
    await flushPromises();
    expect(document.documentElement.style.overflow).toBe('');
  });
});
