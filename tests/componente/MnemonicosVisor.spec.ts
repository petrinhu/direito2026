// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import MnemonicosVisor from '@/ui/componentes/MnemonicosVisor.vue';
import type { Mnemonico } from '@/core/mnemonicos/tipos';

const LISTA: readonly Mnemonico[] = [
  {
    id: 'um',
    titulo: 'Primeiro tema',
    tecnica: 'imagem',
    dica: 'Imagine uma escada.',
    desafio: 'Diga os degraus.',
    guarda: [
      { termo: 'Alto', explicacao: 'Deus.' },
      { termo: 'Baixo', explicacao: 'Legislador.' }
    ],
    comoFunciona: 'Posição no espaço.',
    ressalva: 'Só apoio de memória.',
    blocoResumo: 'bloco-8'
  },
  {
    id: 'dois',
    titulo: 'Segundo tema',
    tecnica: 'frase',
    dica: 'Uma frase curta.',
    desafio: 'Complete a frase.',
    guarda: [
      { termo: 'A', explicacao: 'um.' },
      { termo: 'B', explicacao: 'dois.' }
    ],
    comoFunciona: 'Um verbo por pensador.',
    blocoResumo: 'bloco-10'
  }
];

let wrapper: VueWrapper | undefined;
function montar() {
  wrapper = mount(MnemonicosVisor, {
    props: { mnemonicos: LISTA, baseUnidade: '/p/p1/c/u1' }
  });
  return wrapper;
}
const botao = (id: string) => wrapper!.find(`#mnemonico-${id} button.mnemonico__botao`);
const resposta = (id: string) => wrapper!.find(`#mnemonico-${id} .mnemonico__resposta`);

afterEach(() => wrapper?.unmount());

describe('MnemonicosVisor', () => {
  it('um cartão por mnemônico, com âncora própria, título, técnica por extenso, dica e desafio', () => {
    montar();
    expect(wrapper!.findAll('article.mnemonico')).toHaveLength(2);
    const primeiro = wrapper!.find('#mnemonico-um');
    expect(primeiro.find('h3').text()).toBe('Primeiro tema');
    expect(primeiro.text()).toContain('Imagem mental');
    expect(primeiro.text()).toContain('Imagine uma escada.');
    expect(primeiro.text()).toContain('Diga os degraus.');
  });

  it('a resposta começa escondida: o estudo é recordar antes de revelar', () => {
    montar();
    expect(botao('um').attributes('aria-expanded')).toBe('false');
    expect(resposta('um').isVisible()).toBe(false);
  });

  it('o botão revela o que a dica guarda, como funciona, a ressalva e o link ao Resumo', async () => {
    montar();
    await botao('um').trigger('click');
    expect(botao('um').attributes('aria-expanded')).toBe('true');
    expect(botao('um').attributes('aria-controls')).toBe(resposta('um').attributes('id'));
    const r = resposta('um');
    expect(r.isVisible()).toBe(true);
    expect(r.text()).toContain('Alto');
    expect(r.text()).toContain('Legislador.');
    expect(r.text()).toContain('Posição no espaço.');
    expect(r.text()).toContain('Só apoio de memória.');
    expect(r.find('a[href="/p/p1/c/u1#bloco-8"]').exists()).toBe(true);
  });

  it('o rótulo do botão acompanha o estado', async () => {
    montar();
    expect(botao('um').text()).toBe('Mostrar o que a dica guarda');
    await botao('um').trigger('click');
    expect(botao('um').text()).toBe('Esconder a resposta');
  });

  it('sem ressalva, não escreve o campo', async () => {
    montar();
    await botao('dois').trigger('click');
    expect(resposta('dois').text()).not.toContain('Atenção');
    expect(resposta('dois').text()).not.toContain('undefined');
  });

  it('um cartão não afeta o outro', async () => {
    montar();
    await botao('um').trigger('click');
    expect(resposta('dois').isVisible()).toBe(false);
  });

  it('"Esconder todas as respostas" recomeça o estudo', async () => {
    montar();
    await botao('um').trigger('click');
    await botao('dois').trigger('click');
    await wrapper!.find('button.mnemonicos__recomecar').trigger('click');
    expect(wrapper!.findAll('button.mnemonico__botao[aria-expanded="true"]')).toHaveLength(0);
  });

  it('explica como estudar e que o conteúdo vem do resumo', () => {
    montar();
    const texto = wrapper!.find('.mnemonicos__ajuda').text();
    expect(texto).toContain('antes de revelar');
    expect(texto).toContain('Resumo');
  });
});
