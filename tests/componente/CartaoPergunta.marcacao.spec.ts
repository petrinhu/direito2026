// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CartaoPergunta from '@/ui/componentes/CartaoPergunta.vue';
import type { PerguntaEmbaralhada } from '@/core/quiz/tipos';
import { quiz as perguntasReais } from '@/conteudo/p1/intr-direito/u1/quiz';

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
 * Varredura das 60 perguntas reais (ordem do líder, via orquestrador:
 * "varra TODAS as 60 explicações e todos os enunciados atrás de
 * marcação crua aparecendo como texto, reportando a contagem"). Medido
 * em 22/09/2026 contra o dado real: 12 enunciados, 10 explicações e 1
 * alternativa (pergunta id 47) contêm marcação — os números abaixo são
 * a contagem pedida, travada em teste para nunca mais divergir em
 * silêncio do dado real.
 */
describe('varredura das 60 perguntas reais: nenhuma marcação crua aparece na tela', () => {
  it('contagem real de perguntas com marcação embutida', () => {
    expect(perguntasReais).toHaveLength(60);
    const comMarcacaoNoEnunciado = perguntasReais.filter((p) => p.enunciadoHtml.includes('<'));
    const comMarcacaoNaExplicacao = perguntasReais.filter((p) => p.explicacaoHtml.includes('<'));
    const comMarcacaoNaAlternativa = perguntasReais.filter((p) =>
      p.alternativasHtml.some((a) => a.includes('<'))
    );
    expect(comMarcacaoNoEnunciado).toHaveLength(12);
    expect(comMarcacaoNaExplicacao).toHaveLength(10);
    expect(comMarcacaoNaAlternativa).toHaveLength(1);
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
