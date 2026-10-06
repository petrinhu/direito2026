// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CartaoPergunta from '@/ui/componentes/CartaoPergunta.vue';
import BlocoTeorico from '@/ui/componentes/BlocoTeorico.vue';
import MapaMental from '@/ui/componentes/MapaMental.vue';
import MotorQuiz from '@/ui/componentes/MotorQuiz.vue';
import { paraArvoreLista } from '@/core/restrito/arvoreRestrita';
import type { PerguntaEmbaralhada } from '@/core/quiz/tipos';
import type { BlocoResumo, PerguntaMultiplaEscolha } from '@/core/unidade/tipos';

const pergunta: PerguntaEmbaralhada = {
  id: 1,
  categoria: 'conceitos',
  enunciadoHtml: 'Qual?',
  explicacaoHtml: 'Porque sim.',
  fonteExtra: false,
  alternativasHtml: ['um', 'dois', 'tres', 'quatro'],
  indiceCorreto: 0
};

describe('CartaoPergunta: letras opcionais (A a D) para a área restrita', () => {
  it('quatro alternativas continuam sem letra por padrão (outras cadeiras)', () => {
    const w = mount(CartaoPergunta, { props: { pergunta, respostaEscolhida: undefined } });
    expect(w.findAll('.cartao-pergunta__letra')).toHaveLength(0);
  });

  it('com letras ligadas, rotula de A a D', () => {
    const w = mount(CartaoPergunta, {
      props: { pergunta, respostaEscolhida: undefined, letras: true }
    });
    expect(w.findAll('.cartao-pergunta__letra').map((l) => l.text())).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('MotorQuiz repassa as letras ao cartão', () => {
  const perguntas: PerguntaMultiplaEscolha[] = [
    {
      id: 1,
      categoria: 'conceitos',
      enunciadoHtml: 'Qual?',
      alternativasHtml: ['um', 'dois', 'tres', 'quatro'],
      correta: 0,
      fonteExtra: false,
      explicacaoHtml: 'x'
    }
  ];
  it('letras A a D aparecem quando pedidas', () => {
    const w = mount(MotorQuiz, {
      props: { perguntas, semente: 7, respostasSalvas: {}, finalizada: false, letras: true }
    });
    expect(w.findAll('.cartao-pergunta__letra').map((l) => l.text())).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('BlocoTeorico com exemploHtml vazio', () => {
  const bloco: BlocoResumo = {
    id: 'b',
    numero: 1,
    titulo: 'T',
    fonte: 'f',
    corpoHtml: '<p>c</p>',
    resumo: ['i'],
    exemploHtml: ''
  };
  it('não desenha o parágrafo "Na prática" vazio', () => {
    const w = mount(BlocoTeorico, { props: { bloco } });
    expect(w.find('.bloco-teorico__exemplo').exists()).toBe(false);
  });
});

describe('MapaMental com nome acessível próprio', () => {
  it('usa o rótulo recebido no lugar do de Filosofia', () => {
    const arvore = paraArvoreLista({ rotulo: 'Raiz', filhos: [{ rotulo: 'Ramo' }] });
    const w = mount(MapaMental, {
      props: { arvore, baseUnidade: '', rotuloArvore: 'Mapa mental do tema' }
    });
    expect(w.get('[role="tree"]').attributes('aria-label')).toBe('Mapa mental do tema');
  });
});
