// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import QuadroProva from '@/ui/componentes/QuadroProva.vue';
import { CHAVE_ESTADO_QUADRO_PROVA } from '@/app/calendario/estadoQuadroProva';

/**
 * Quadro flutuante de contagem (ordem do líder, 20/10/2026). A data vem
 * injetada pela prop `agora`, para o teste não depender do relógio real.
 * Com 20/10 o que vem primeiro é o fim das provas online (15/11, 26 dias), antes
 * da 3ª AV de Introdução ao Direito (24/11, 35 dias).
 */
const AGORA_20_10 = new Date('2026-10-20T15:00:00Z');

function montar(agora: Date) {
  return mount(QuadroProva, { props: { agora } });
}

describe('QuadroProva, texto e faixa de urgência', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('mostra quantos dias faltam e para qual prova', () => {
    const w = montar(AGORA_20_10);
    expect(w.text()).toContain(
      'Faltam 26 dias para o fim das provas online de Economia e Empreendedorismo'
    );
  });

  it('tem botão para abrir o calendário numa janela, sem link de navegação', () => {
    const w = montar(AGORA_20_10);
    expect(w.find('button.quadro-prova__link').text()).toBe('Abrir o calendário');
    expect(w.find('a[href="/calendario"]').exists()).toBe(false);
  });

  it.each([
    ['2026-10-20T15:00:00Z', 'calmo'],
    ['2026-11-08T15:00:00Z', 'dourado'],
    ['2026-11-19T15:00:00Z', 'garnet'],
    ['2026-11-22T15:00:00Z', 'pulsante']
  ])('em %s a faixa é %s (marcada no elemento)', (instante, faixa) => {
    const w = montar(new Date(instante));
    expect(w.find('.quadro-prova').attributes('data-faixa')).toBe(faixa);
  });

  it('no dia da prova diz "É hoje"', () => {
    const w = montar(new Date('2026-11-24T15:00:00Z'));
    expect(w.text()).toContain('É hoje: a 3ª AV de Introdução ao Direito');
  });

  it('um dia antes diz "É amanhã"', () => {
    const w = montar(new Date('2026-11-23T15:00:00Z'));
    expect(w.text()).toContain('É amanhã: a 3ª AV de Introdução ao Direito');
  });

  it('sem prova futura não renderiza nada', () => {
    const w = montar(new Date('2026-12-18T15:00:00Z'));
    expect(w.find('.quadro-prova').exists()).toBe(false);
  });
});

describe('QuadroProva, minimizar e lembrar', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('nasce aberto, com aria-expanded verdadeiro no botão', () => {
    const w = montar(AGORA_20_10);
    const botao = w.find('button[aria-expanded]');
    expect(botao.attributes('aria-expanded')).toBe('true');
  });

  it('minimizar esconde o texto e marca aria-expanded falso', async () => {
    const w = montar(AGORA_20_10);
    await w.find('button[aria-expanded]').trigger('click');
    expect(w.find('button[aria-expanded]').attributes('aria-expanded')).toBe('false');
    expect(w.find('[data-testid="quadro-texto"]').exists()).toBe(false);
  });

  it('o estado minimizado fica guardado e vale na próxima montagem da mesma faixa', async () => {
    const primeira = montar(AGORA_20_10);
    await primeira.find('button[aria-expanded]').trigger('click');
    primeira.unmount();

    const segunda = montar(AGORA_20_10);
    expect(segunda.find('button[aria-expanded]').attributes('aria-expanded')).toBe('false');
    expect(window.localStorage.getItem(CHAVE_ESTADO_QUADRO_PROVA)).not.toBeNull();
  });

  it('ao mudar de faixa de urgência, reabre sozinho', async () => {
    const w = montar(AGORA_20_10);
    await w.find('button[aria-expanded]').trigger('click');
    expect(w.find('button[aria-expanded]').attributes('aria-expanded')).toBe('false');

    await w.setProps({ agora: new Date('2026-11-08T15:00:00Z') });
    expect(w.find('button[aria-expanded]').attributes('aria-expanded')).toBe('true');
    expect(w.find('.quadro-prova').attributes('data-faixa')).toBe('dourado');
  });

  it('com armazenamento bloqueado, o quadro funciona e nasce aberto', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    const w = montar(AGORA_20_10);
    expect(w.find('button[aria-expanded]').attributes('aria-expanded')).toBe('true');
    expect(() => w.find('button[aria-expanded]').trigger('click')).not.toThrow();
  });
});
