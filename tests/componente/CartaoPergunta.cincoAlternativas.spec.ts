// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CartaoPergunta from '@/ui/componentes/CartaoPergunta.vue';
import type { PerguntaEmbaralhada } from '@/core/quiz/tipos';

function perguntaDeCinco(extra: Partial<PerguntaEmbaralhada> = {}): PerguntaEmbaralhada {
  return {
    id: 301,
    categoria: 'aplicacao',
    enunciadoHtml: 'Qual alternativa?',
    explicacaoHtml: 'porque sim',
    fonteExtra: false,
    alternativasHtml: ['um', 'dois', 'tres', 'quatro', 'cinco'],
    indiceCorreto: 4,
    ...extra
  };
}

function perguntaDeQuatro(): PerguntaEmbaralhada {
  return { ...perguntaDeCinco(), alternativasHtml: ['a', 'b', 'c', 'd'], indiceCorreto: 1 };
}

describe('CartaoPergunta com cinco alternativas', () => {
  it('desenha cinco botões de opção e rotula de A a E', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: perguntaDeCinco(), respostaEscolhida: undefined }
    });
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(5);
    const letras = wrapper.findAll('.cartao-pergunta__letra').map((l) => l.text());
    expect(letras).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('escolher a quinta alternativa emite o índice 4', async () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: perguntaDeCinco(), respostaEscolhida: undefined }
    });
    await wrapper.findAll('input[type="radio"]')[4]!.setValue(true);
    expect(wrapper.emitted('responder')).toEqual([[4]]);
  });

  it('a quinta correta mostra a marca "Correta" só nela', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: perguntaDeCinco(), respostaEscolhida: 0 }
    });
    const alts = wrapper.findAll('.cartao-pergunta__alt');
    expect(alts[4]!.text()).toContain('Correta');
    expect(alts[0]!.text()).toContain('incorreta');
    expect(alts[2]!.text()).not.toContain('Correta');
  });

  it('as perguntas de quatro alternativas não ganham letra nenhuma', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: perguntaDeQuatro(), respostaEscolhida: undefined }
    });
    expect(wrapper.findAll('.cartao-pergunta__letra')).toHaveLength(0);
  });
});

describe('CartaoPergunta, nota do gabarito do caderno', () => {
  it('mostra a nota neutra depois de responder, quando a pergunta tem a marca', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: perguntaDeCinco({ gabaritoDoCaderno: true }), respostaEscolhida: 0 }
    });
    const nota = wrapper.find('.cartao-pergunta__nota-caderno');
    expect(nota.exists()).toBe(true);
    expect(nota.text()).toContain('caderno de estudo');
    expect(nota.text()).toContain('não é o gabarito oficial');
  });

  it('não mostra a nota antes de responder', () => {
    const wrapper = mount(CartaoPergunta, {
      props: {
        pergunta: perguntaDeCinco({ gabaritoDoCaderno: true }),
        respostaEscolhida: undefined
      }
    });
    expect(wrapper.find('.cartao-pergunta__nota-caderno').exists()).toBe(false);
  });

  it('não mostra a nota quando a pergunta não tem a marca', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: perguntaDeCinco(), respostaEscolhida: 0 }
    });
    expect(wrapper.find('.cartao-pergunta__nota-caderno').exists()).toBe(false);
  });
});

describe('CartaoPergunta, estrutura da alternativa (largura do texto em tela estreita)', () => {
  it('só a alternativa com letra leva o modificador que reserva a coluna da letra', () => {
    const comLetra = mount(CartaoPergunta, {
      props: { pergunta: perguntaDeCinco(), respostaEscolhida: undefined }
    });
    for (const alt of comLetra.findAll('.cartao-pergunta__alt')) {
      expect(alt.classes()).toContain('cartao-pergunta__alt--com-letra');
    }
    const semLetra = mount(CartaoPergunta, {
      props: { pergunta: perguntaDeQuatro(), respostaEscolhida: undefined }
    });
    for (const alt of semLetra.findAll('.cartao-pergunta__alt')) {
      expect(alt.classes()).not.toContain('cartao-pergunta__alt--com-letra');
    }
  });

  it('a marca fica dentro do mesmo label da alternativa, depois do texto', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: perguntaDeCinco(), respostaEscolhida: 0 }
    });
    for (const indice of [0, 4]) {
      const alt = wrapper.findAll('.cartao-pergunta__alt')[indice]!;
      expect(alt.element.tagName).toBe('LABEL');
      const filhos = Array.from(alt.element.children).map((f) => f.className);
      const posTexto = filhos.findIndex((c) => c.includes('cartao-pergunta__alt-texto'));
      const posMarca = filhos.findIndex((c) => c.includes('cartao-pergunta__marca'));
      expect(posTexto).toBeGreaterThanOrEqual(0);
      expect(posMarca).toBeGreaterThan(posTexto);
    }
  });
});
