// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MotorQuiz from '@/ui/componentes/MotorQuiz.vue';
import CartaoPergunta from '@/ui/componentes/CartaoPergunta.vue';
import type { PerguntaQuiz } from '@/core/unidade/tipos';

/**
 * Ordem do líder, 22/09/2026, verbatim: "Faltou no quiz um placar a cada
 * uma das perguntas, com / acertos x de y / falhas z de y". Teste de
 * aceite do próprio líder: respondendo uma certa e uma errada, o placar
 * mostra 1 de 2 acertos e 1 de 2 falhas.
 *
 * indiceCorreto é lido do PRÓPRIO CartaoPergunta renderizado (já pós
 * embaralho de alternativas, embaralharRodada), nunca do `correta`
 * original de PerguntaQuiz: os dois podem apontar índices diferentes
 * depois do embaralho.
 */
function perguntas(): readonly PerguntaQuiz[] {
  return [
    {
      id: 1,
      categoria: 'teoria',
      enunciadoHtml: 'p1',
      alternativasHtml: ['a', 'b', 'c', 'd'],
      correta: 0,
      fonteExtra: false,
      explicacaoHtml: 'x'
    },
    {
      id: 2,
      categoria: 'teoria',
      enunciadoHtml: 'p2',
      alternativasHtml: ['a', 'b', 'c', 'd'],
      correta: 1,
      fonteExtra: false,
      explicacaoHtml: 'x'
    }
  ];
}

function montar() {
  return mount(MotorQuiz, {
    props: {
      perguntas: perguntas(),
      semente: 42,
      respostasSalvas: {},
      finalizada: false
    }
  });
}

describe('MotorQuiz, placar por pergunta', () => {
  it('antes de responder, o placar já aparece na tela, zerado', () => {
    const wrapper = montar();
    expect(wrapper.text()).toContain('Acertos: 0 de 0');
    expect(wrapper.text()).toContain('Falhas: 0 de 0');
  });

  it('respondendo uma certa e uma errada, mostra 1 de 2 acertos e 1 de 2 falhas', async () => {
    const wrapper = montar();

    // Pergunta 1: responde a alternativa CORRETA (índice pós-embaralho).
    const cartao1 = wrapper.findComponent(CartaoPergunta);
    const idPergunta1 = cartao1.props('pergunta').id;
    const indiceCorreto1 = cartao1.props('pergunta').indiceCorreto;

    await wrapper.setProps({ respostasSalvas: { [idPergunta1]: indiceCorreto1 } });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Acertos: 1 de 1');
    expect(wrapper.text()).toContain('Falhas: 0 de 1');

    // Avança e responde a pergunta 2 com uma alternativa INCORRETA.
    await wrapper.find('.motor-quiz__navegacao button:last-child').trigger('click');
    await wrapper.vm.$nextTick();

    const cartao2 = wrapper.findComponent(CartaoPergunta);
    const idPergunta2 = cartao2.props('pergunta').id;
    const indiceCorreto2 = cartao2.props('pergunta').indiceCorreto;
    const indiceErrado2 = ((indiceCorreto2 + 1) % 4) as 0 | 1 | 2 | 3;

    await wrapper.setProps({
      respostasSalvas: {
        [idPergunta1]: indiceCorreto1,
        [idPergunta2]: indiceErrado2
      }
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Acertos: 1 de 2');
    expect(wrapper.text()).toContain('Falhas: 1 de 2');
  });

  it('o total do quiz aparece discretamente, com o tamanho real (2)', () => {
    const wrapper = montar();
    expect(wrapper.text()).toContain('Quiz com 2 perguntas no total');
  });
});
