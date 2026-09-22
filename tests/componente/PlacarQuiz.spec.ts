// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PlacarQuiz from '@/ui/componentes/PlacarQuiz.vue';

/**
 * Ordem do líder, 22/09/2026, verbatim: "Faltou no quiz um placar a cada
 * uma das perguntas, com / acertos x de y / falhas z de y". y é quantas
 * já foram respondidas (não o total do quiz); o total do quiz aparece à
 * parte, discreto, para não confundir com o denominador.
 */
describe('PlacarQuiz', () => {
  it('antes de qualquer resposta, aparece zerado, não escondido', () => {
    const wrapper = mount(PlacarQuiz, { props: { acertos: 0, respondidas: 0, totalQuiz: 60 } });
    expect(wrapper.find('[role="status"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Acertos: 0 de 0');
    expect(wrapper.text()).toContain('Falhas: 0 de 0');
  });

  it('mostra acertos e falhas sobre o mesmo denominador (quantas já respondidas)', () => {
    const wrapper = mount(PlacarQuiz, { props: { acertos: 3, respondidas: 5, totalQuiz: 60 } });
    expect(wrapper.text()).toContain('Acertos: 3 de 5');
    expect(wrapper.text()).toContain('Falhas: 2 de 5');
  });

  it('mostra o total do quiz discretamente, sem se confundir com o denominador do placar', () => {
    const wrapper = mount(PlacarQuiz, { props: { acertos: 1, respondidas: 2, totalQuiz: 60 } });
    const total = wrapper.find('.placar-quiz__total');
    expect(total.exists()).toBe(true);
    expect(total.text()).toContain('60');
    // A frase do total não pode ler como se fosse "de 60" colado num dos
    // dois placares (isso inventaria um terceiro número com o mesmo
    // formato "X de Y" e confundiria com o denominador real).
    expect(wrapper.text()).not.toContain('de 60');
  });

  it('região de status para leitor de tela, sem roubar o foco (não é tabulável)', () => {
    const wrapper = mount(PlacarQuiz, { props: { acertos: 0, respondidas: 0, totalQuiz: 60 } });
    const regiao = wrapper.find('[role="status"]');
    expect(regiao.attributes('aria-live')).toBe('polite');
    expect(regiao.attributes('tabindex')).toBeUndefined();
  });

  it('acertos e falhas têm classe própria, gêmeas (sucesso/erro), nunca só cor sem texto', () => {
    const wrapper = mount(PlacarQuiz, { props: { acertos: 1, respondidas: 2, totalQuiz: 60 } });
    expect(wrapper.find('.placar-quiz__linha--acertos').exists()).toBe(true);
    expect(wrapper.find('.placar-quiz__linha--falhas').exists()).toBe(true);
  });
});
