// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CartaoPergunta from '@/ui/componentes/CartaoPergunta.vue';
import type { PerguntaEmbaralhada } from '@/core/quiz/tipos';
import { ALTERNATIVAS_VERDADEIRO_OU_FALSO } from '@/core/quiz/alternativasVerdadeiroOuFalso';
import { quiz as quizIntro } from '@/conteudo/p1/intr-direito/u1/quiz';
import type { PerguntaQuiz } from '@/core/unidade/tipos';

const perguntasReais: readonly PerguntaQuiz[] = quizIntro;

/**
 * Forma que o motor entrega ao cartão: múltipla escolha com as alternativas da
 * pergunta, verdadeiro ou falso com as duas fixas (mesma regra do motor, sem sorteio).
 */
function embaralhadaDe(pergunta: PerguntaQuiz): PerguntaEmbaralhada {
  const comum = {
    id: pergunta.id,
    categoria: pergunta.categoria,
    enunciadoHtml: pergunta.enunciadoHtml,
    explicacaoHtml: pergunta.explicacaoHtml,
    fonteExtra: pergunta.fonteExtra
  };
  if (pergunta.tipo === 'verdadeiro-ou-falso') {
    return {
      ...comum,
      tipo: 'verdadeiro-ou-falso',
      alternativasHtml: ALTERNATIVAS_VERDADEIRO_OU_FALSO,
      indiceCorreto: pergunta.correta ? 0 : 1
    };
  }
  return { ...comum, alternativasHtml: pergunta.alternativasHtml, indiceCorreto: pergunta.correta };
}

/** Textos que o cartão mostra: enunciado, explicação e alternativas (se houver). */
function textosDaPergunta(pergunta: PerguntaQuiz): string[] {
  const alternativas = 'alternativasHtml' in pergunta ? pergunta.alternativasHtml : [];
  return [pergunta.enunciadoHtml, pergunta.explicacaoHtml, ...alternativas];
}

/**
 * Achado do QA (relatado pelo orquestrador): numa pergunta do quiz, a
 * citação de artigo dentro da explicação aparecia como código HTML cru
 * na tela. Causa raiz: `enunciado`, `explicacao` e `alternativas` do
 * quiz legitimamente carregam marcação de botão de citação (o mesmo
 * `<button class="citacao" data-dispositivo="...">`, seção 12.1 da
 * arquitetura), a mesma vinda de src/conteudo/ que corpoHtml/exemploHtml
 * usam em resumo — mas CartaoPergunta.vue interpolava com `{{ }}`
 * (escapa HTML), não `v-html`. Corrigido renomeando os três campos para
 * terminar em "Html" (convenção do projeto, RI5/seção 4.4) e trocando
 * para v-html nos três lugares.
 */
function perguntaComCitacaoEmTudo(): PerguntaEmbaralhada {
  const botao = (id: string, texto: string) =>
    `<button type="button" class="citacao" data-dispositivo="${id}" aria-expanded="false" aria-controls="balao-dispositivo">${texto}</button>`;
  return {
    id: 1,
    categoria: 'teoria',
    enunciadoHtml: `Segundo o ${botao('cc-186', 'art. 186 do Código Civil')}, o que configura ato ilícito?`,
    explicacaoHtml: `Correto porque o ${botao('cc-186', 'art. 186')} exige conduta, dano e nexo.`,
    fonteExtra: false,
    alternativasHtml: [
      `Só a conduta, sem dano.`,
      `Conduta, dano e nexo causal, conforme o ${botao('cc-186', 'art. 186')}.`,
      `Só o dano, sem conduta.`,
      `Nenhuma das anteriores.`
    ],
    indiceCorreto: 1
  };
}

describe('CartaoPergunta, marcação de citação vira botão de verdade (nunca texto cru)', () => {
  it('enunciado com citação renderiza um <button class="citacao"> de verdade', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: perguntaComCitacaoEmTudo(), respostaEscolhida: undefined }
    });
    expect(wrapper.find('h3 button.citacao').exists()).toBe(true);
    expect(wrapper.find('h3').text()).not.toContain('<button');
  });

  it('alternativa com citação renderiza um <button class="citacao"> de verdade', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: perguntaComCitacaoEmTudo(), respostaEscolhida: undefined }
    });
    const alternativas = wrapper.find('[role="radiogroup"]');
    expect(alternativas.find('button.citacao').exists()).toBe(true);
    expect(alternativas.text()).not.toContain('<button');
  });

  it('explicação com citação renderiza um <button class="citacao"> de verdade', () => {
    const wrapper = mount(CartaoPergunta, {
      props: { pergunta: perguntaComCitacaoEmTudo(), respostaEscolhida: 1 }
    });
    const explicacao = wrapper.find('.cartao-pergunta__explicacao');
    expect(explicacao.find('button.citacao').exists()).toBe(true);
    expect(explicacao.text()).not.toContain('<button');
  });
});

/**
 * Varredura das perguntas reais de Introdução ao Direito (ordem do líder, via
 * orquestrador: "varra TODAS as explicações e todos os enunciados atrás de
 * marcação crua aparecendo como texto"). A garantia é o loop abaixo, que vale
 * para QUALQUER número de perguntas. As contagens de quantas perguntas trazem
 * marcação não ficam mais em teste: acrescentar pergunta com marcação não pode
 * quebrar este arquivo.
 */
describe('varredura das perguntas reais: nenhuma marcação crua aparece na tela', () => {
  it('há perguntas para varrer e pelo menos uma com marcação embutida (piso, L-36)', () => {
    expect(perguntasReais.length).toBeGreaterThan(0);
    const comMarcacao = perguntasReais.filter((p) =>
      textosDaPergunta(p).some((texto) => texto.includes('<'))
    );
    expect(comMarcacao.length).toBeGreaterThan(0);
  });

  it('toda pergunta com marcação embutida renderiza como elemento real, nunca como texto cru', () => {
    for (const pergunta of perguntasReais) {
      const embaralhada = embaralhadaDe(pergunta);
      const wrapper = mount(CartaoPergunta, {
        props: { pergunta: embaralhada, respostaEscolhida: embaralhada.indiceCorreto }
      });
      expect(wrapper.text(), `pergunta id ${pergunta.id}`).not.toContain('<button');
      expect(wrapper.text(), `pergunta id ${pergunta.id}`).not.toContain('&lt;');
      wrapper.unmount();
    }
  });
});
