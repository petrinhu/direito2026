// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CartoesCincoPerguntas from '@/ui/componentes/CartoesCincoPerguntas.vue';

/**
 * Extra (b) da unidade de Redação Jurídica 1: as cinco perguntas de toda
 * petição, em cartões que viram ao toque. Fonte: peticao-inicial.pdf,
 * seção "06 — para não esquecer" (texto do verso lido a partir da imagem
 * renderizada, L-41, porque o PDF extrai esse texto invertido). Alcançável
 * e acionável por teclado (botão nativo) e com o estado anunciado
 * (aria-pressed) para leitor de tela.
 */
describe('CartoesCincoPerguntas', () => {
  it('renderiza 5 cartões, cada um um botão', () => {
    const wrapper = mount(CartoesCincoPerguntas);
    const botoes = wrapper.findAll('button');
    expect(botoes).toHaveLength(5);
  });

  it('estado inicial: todos fechados (aria-pressed="false"), mostrando a pergunta da frente', () => {
    const wrapper = mount(CartoesCincoPerguntas);
    const botoes = wrapper.findAll('button');
    for (const botao of botoes) {
      expect(botao.attributes('aria-pressed')).toBe('false');
    }
    expect(wrapper.text()).toContain('Quem?');
    expect(wrapper.text()).toContain('O que aconteceu?');
    expect(wrapper.text()).toContain('Qual é o direito?');
    expect(wrapper.text()).toContain('Como provar?');
    expect(wrapper.text()).toContain('O que quer?');
  });

  it('tocar um cartão vira e mostra a resposta, com aria-pressed="true"', async () => {
    const wrapper = mount(CartoesCincoPerguntas);
    const primeiro = wrapper.findAll('button')[0]!;
    await primeiro.trigger('click');
    expect(primeiro.attributes('aria-pressed')).toBe('true');
    expect(primeiro.text()).toContain('Quem é o autor e quem é o réu');
  });

  it('tocar de novo desvira o cartão', async () => {
    const wrapper = mount(CartoesCincoPerguntas);
    const primeiro = wrapper.findAll('button')[0]!;
    await primeiro.trigger('click');
    await primeiro.trigger('click');
    expect(primeiro.attributes('aria-pressed')).toBe('false');
    expect(primeiro.text()).toContain('Quem?');
  });

  it('as cinco respostas batem com o guia de estudo', async () => {
    const wrapper = mount(CartoesCincoPerguntas);
    const botoes = wrapper.findAll('button');
    for (const botao of botoes) await botao.trigger('click');
    const texto = wrapper.text();
    expect(texto).toContain('Quem é o autor e quem é o réu');
    expect(texto).toContain('Conte os fatos, de forma cronológica');
    expect(texto).toContain('Procure a legislação aplicável a cada fato');
    expect(texto).toContain('Identifique os documentos e demais provas');
    expect(texto).toContain('Transforme o problema em pedidos concretos');
  });
});
