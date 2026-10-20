// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CartaoPergunta from '@/ui/componentes/CartaoPergunta.vue';
import type { PerguntaEmbaralhada } from '@/core/quiz/tipos';
import { quiz as quizIntro } from '@/conteudo/p1/intr-direito/u1/quiz';
import type { PerguntaMultiplaEscolha } from '@/core/unidade/tipos';

// Introdução ao Direito só tem múltipla escolha (4 alternativas).
const perguntasReais = quizIntro as readonly PerguntaMultiplaEscolha[];

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
    const comMarcacao = perguntasReais.filter(
      (p) =>
        p.enunciadoHtml.includes('<') ||
        p.explicacaoHtml.includes('<') ||
        p.alternativasHtml.some((a) => a.includes('<'))
    );
    expect(comMarcacao.length).toBeGreaterThan(0);
  });

  it('toda pergunta com marcação embutida renderiza como elemento real, nunca como texto cru', () => {
    for (const pergunta of perguntasReais) {
      const embaralhada: PerguntaEmbaralhada = {
        id: pergunta.id,
        categoria: pergunta.categoria,
        enunciadoHtml: pergunta.enunciadoHtml,
        explicacaoHtml: pergunta.explicacaoHtml,
        fonteExtra: pergunta.fonteExtra,
        alternativasHtml: pergunta.alternativasHtml,
        indiceCorreto: pergunta.correta
      };
      const wrapper = mount(CartaoPergunta, {
        props: { pergunta: embaralhada, respostaEscolhida: pergunta.correta }
      });
      expect(wrapper.text(), `pergunta id ${pergunta.id}`).not.toContain('<button');
      expect(wrapper.text(), `pergunta id ${pergunta.id}`).not.toContain('&lt;');
      wrapper.unmount();
    }
  });
});
