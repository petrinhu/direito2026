// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CartaoPergunta from '@/ui/componentes/CartaoPergunta.vue';
import type { PerguntaEmbaralhada } from '@/core/quiz/tipos';

function pergunta(): PerguntaEmbaralhada {
  return {
    id: 1,
    categoria: 'teoria',
    enunciado: 'Qual é a capital?',
    explicacao: 'porque sim',
    fonteExtra: false,
    alternativas: ['a', 'b', 'c', 'd'],
    indiceCorreto: 2
  };
}

describe('CartaoPergunta', () => {
  it('antes de responder, não mostra explicação', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: pergunta(), respostaEscolhida: undefined }
    });
    expect(wrapper.text()).not.toContain('porque sim');
  });

  it('grupo de rádio nativo com o enunciado como rótulo (aria-labelledby)', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: pergunta(), respostaEscolhida: undefined }
    });
    const grupo = wrapper.find('[role="radiogroup"]');
    expect(grupo.exists()).toBe(true);
    expect(grupo.attributes('aria-labelledby')).toBeTruthy();
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(4);
  });

  it('escolher uma alternativa emite "responder" com o índice', async () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: pergunta(), respostaEscolhida: undefined }
    });
    const radios = wrapper.findAll('input[type="radio"]');
    await radios[2]!.setValue(true);
    expect(wrapper.emitted('responder')).toEqual([[2]]);
  });

  it('depois de responder, as alternativas ficam bloqueadas e a explicação aparece', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: pergunta(), respostaEscolhida: 0 }
    });
    expect(wrapper.text()).toContain('porque sim');
    const radios = wrapper.findAll('input[type="radio"]');
    for (const radio of radios) {
      expect((radio.element as HTMLInputElement).disabled).toBe(true);
    }
  });

  it('certo e errado nunca só por cor: tem texto "Correta" e "incorreta"', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: pergunta(), respostaEscolhida: 0 }
    });
    expect(wrapper.text()).toContain('Correta');
    expect(wrapper.text().toLowerCase()).toContain('incorreta');
  });
});
