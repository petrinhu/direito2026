// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';
import CartaoPergunta from '@/ui/componentes/CartaoPergunta.vue';
import type { PerguntaEmbaralhada } from '@/core/quiz/tipos';

/**
 * Depois de responder, o radio fica desabilitado e o foco caía em <body>: quem
 * usa teclado ou leitor de tela perdia o lugar. O foco passa para o bloco do
 * resultado (tabindex -1), que traz o veredito e a explicação; o próximo Tab
 * segue para o que vem depois do cartão (botão "Próxima").
 */
const pergunta: PerguntaEmbaralhada = {
  id: 601,
  categoria: 'teoria',
  enunciadoHtml: 'Qual?',
  explicacaoHtml: 'porque sim',
  fonteExtra: false,
  alternativasHtml: ['a', 'b', 'c', 'd'],
  indiceCorreto: 1
};

let montado: VueWrapper | undefined;
afterEach(() => montado?.unmount());

function montar(respostaEscolhida?: 0 | 1 | 2 | 3) {
  montado = mount(CartaoPergunta, {
    attachTo: document.body,
    props: { pergunta, respostaEscolhida }
  });
  return montado;
}

describe('CartaoPergunta, foco depois de responder', () => {
  it('ao responder, o foco vai para o bloco do resultado, que tem tabindex -1', async () => {
    const w = montar();
    const radio = w.findAll('input[type="radio"]')[0]!;
    (radio.element as HTMLInputElement).focus();
    await radio.setValue(true);
    await w.setProps({ respostaEscolhida: 0 });
    await nextTick();
    const resultado = w.find('.cartao-pergunta__resultado');
    expect(resultado.attributes('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(resultado.element);
  });

  it('o bloco traz o veredito e a explicação, para o leitor anunciar', async () => {
    const w = montar();
    await w.findAll('input[type="radio"]')[0]!.setValue(true);
    await w.setProps({ respostaEscolhida: 0 });
    const texto = w.find('.cartao-pergunta__resultado').text();
    expect(texto).toContain('Resposta incorreta');
    expect(texto).toContain('porque sim');
    await w.setProps({ respostaEscolhida: 1 });
    expect(w.find('.cartao-pergunta__resultado').text()).toContain('Resposta correta');
  });

  it('não existe antes de responder', () => {
    expect(montar().find('.cartao-pergunta__resultado').exists()).toBe(false);
  });

  it('abrir uma pergunta que já estava respondida não rouba o foco', async () => {
    const w = montar();
    const botao = document.createElement('button');
    document.body.appendChild(botao);
    botao.focus();
    await w.setProps({ respostaEscolhida: 2 });
    await nextTick();
    expect(document.activeElement).toBe(botao);
    botao.remove();
  });
});
