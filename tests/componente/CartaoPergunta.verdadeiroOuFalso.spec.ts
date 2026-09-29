// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CartaoPergunta from '@/ui/componentes/CartaoPergunta.vue';
import { embaralharRodada } from '@/core/quiz/motor';
import type { PerguntaEmbaralhada } from '@/core/quiz/tipos';
import type { PerguntaQuiz } from '@/core/unidade/tipos';

function embaralhada(extra: Partial<PerguntaQuiz> = {}, correta = true): PerguntaEmbaralhada {
  const pergunta = {
    id: 501,
    tipo: 'verdadeiro-ou-falso',
    categoria: 'antiga',
    enunciadoHtml: 'A afirmação é assim.',
    correta,
    fonteExtra: false,
    explicacaoHtml: 'porque sim',
    ...extra
  } as PerguntaQuiz;
  return embaralharRodada([pergunta], 1).perguntas[0]!;
}

function montar(pergunta: PerguntaEmbaralhada, respostaEscolhida?: 0 | 1) {
  return mount(CartaoPergunta, { props: { pergunta, respostaEscolhida } });
}

describe('CartaoPergunta, verdadeiro ou falso', () => {
  it('mostra duas opções, Verdadeiro e Falso, nessa ordem, sem letra', () => {
    const w = montar(embaralhada());
    expect(w.findAll('input[type="radio"]')).toHaveLength(2);
    expect(w.findAll('.cartao-pergunta__alt-texto').map((t) => t.text())).toEqual([
      'Verdadeiro',
      'Falso'
    ]);
    expect(w.findAll('.cartao-pergunta__letra')).toHaveLength(0);
    expect(w.find('.cartao-pergunta__alt--com-letra').exists()).toBe(false);
  });

  it('a ordem não muda com outra semente', () => {
    const p = {
      id: 9,
      tipo: 'verdadeiro-ou-falso',
      categoria: 'media',
      enunciadoHtml: 'x',
      correta: false,
      fonteExtra: false,
      explicacaoHtml: 'y'
    } as PerguntaQuiz;
    for (const semente of [1, 2, 3, 77]) {
      const w = montar(embaralharRodada([p], semente).perguntas[0]!);
      expect(w.findAll('.cartao-pergunta__alt-texto').map((t) => t.text())).toEqual([
        'Verdadeiro',
        'Falso'
      ]);
    }
  });

  it('o grupo de opções é um radiogroup rotulado pelo enunciado e leva o modificador do tipo', () => {
    const w = montar(embaralhada());
    const grupo = w.find('[role="radiogroup"]');
    expect(grupo.attributes('aria-labelledby')).toBe(w.find('h3').attributes('id'));
    expect(w.find('article').classes()).toContain('cartao-pergunta--verdadeiro-ou-falso');
  });

  it('escolher Falso emite o índice 1', async () => {
    const w = montar(embaralhada());
    await w.findAll('input[type="radio"]')[1]!.setValue(true);
    expect(w.emitted('responder')).toEqual([[1]]);
  });

  it('corrige: afirmação verdadeira, resposta Falso é incorreta e Verdadeiro leva "Correta"', () => {
    const w = montar(embaralhada({}, true), 1);
    const alts = w.findAll('.cartao-pergunta__alt');
    expect(alts[0]!.text()).toContain('Correta');
    expect(alts[1]!.text()).toContain('incorreta');
  });

  it('corrige: afirmação falsa, resposta Falso é a correta', () => {
    const w = montar(embaralhada({}, false), 1);
    const alts = w.findAll('.cartao-pergunta__alt');
    expect(alts[1]!.text()).toContain('Correta');
    expect(alts[0]!.text()).not.toContain('Correta');
  });

  it('mostra a explicação depois de responder e não antes', () => {
    expect(montar(embaralhada()).find('.cartao-pergunta__explicacao').exists()).toBe(false);
    expect(montar(embaralhada(), 0).find('.cartao-pergunta__explicacao').text()).toContain(
      'porque sim'
    );
  });
});

describe('CartaoPergunta, selo Revisão do professor', () => {
  it('aparece só quando a origem é do professor', () => {
    const com = montar(embaralhada({ origem: 'professor' }));
    const sem = montar(embaralhada());
    expect(com.find('.cartao-pergunta__selo-professor').text()).toBe('Revisão do professor');
    expect(sem.find('.cartao-pergunta__selo-professor').exists()).toBe(false);
  });

  it('vem ANTES do enunciado no DOM', () => {
    const w = montar(embaralhada({ origem: 'professor' }));
    const filhos = Array.from(w.find('article').element.children).map((f) => f.className);
    const selo = filhos.findIndex((c) => c.includes('cartao-pergunta__selo-professor'));
    const enunciado = filhos.findIndex((c) => c.includes('cartao-pergunta__enunciado'));
    expect(selo).toBeGreaterThanOrEqual(0);
    expect(selo).toBeLessThan(enunciado);
  });

  it('também aparece nas perguntas de múltipla escolha marcadas pelo professor', () => {
    const p: PerguntaQuiz = {
      id: 7,
      categoria: 'revisao',
      enunciadoHtml: 'e',
      alternativasHtml: ['a', 'b', 'c', 'd', 'e'],
      correta: 0,
      fonteExtra: false,
      explicacaoHtml: 'x',
      origem: 'professor'
    };
    const w = montar(embaralharRodada([p], 3).perguntas[0]!);
    expect(w.find('.cartao-pergunta__selo-professor').exists()).toBe(true);
    expect(w.findAll('.cartao-pergunta__letra')).toHaveLength(5);
  });

  it('selo e nota do caderno convivem depois de responder', () => {
    const w = montar(embaralhada({ origem: 'professor', gabaritoDoCaderno: true }), 0);
    expect(w.find('.cartao-pergunta__selo-professor').exists()).toBe(true);
    expect(w.find('.cartao-pergunta__nota-caderno').text()).toContain('caderno de estudo');
  });

  it('a nota do caderno continua sumindo antes de responder, com o selo presente', () => {
    const w = montar(embaralhada({ origem: 'professor', gabaritoDoCaderno: true }));
    expect(w.find('.cartao-pergunta__selo-professor').exists()).toBe(true);
    expect(w.find('.cartao-pergunta__nota-caderno').exists()).toBe(false);
  });
});

describe('CartaoPergunta, nada muda nas perguntas de quatro e cinco alternativas', () => {
  const quatro: PerguntaEmbaralhada = {
    id: 1,
    categoria: 'teoria',
    enunciadoHtml: 'e',
    explicacaoHtml: 'x',
    fonteExtra: false,
    alternativasHtml: ['a', 'b', 'c', 'd'],
    indiceCorreto: 1
  };

  it('sem selo, sem modificador de tipo, sem letras', () => {
    const w = montar(quatro);
    expect(w.find('.cartao-pergunta__selo-professor').exists()).toBe(false);
    expect(w.find('article').classes()).toEqual(['cartao-pergunta']);
    expect(w.findAll('.cartao-pergunta__letra')).toHaveLength(0);
    expect(w.findAll('input[type="radio"]')).toHaveLength(4);
  });
});

describe('CartaoPergunta, estilo do selo', () => {
  const fonte = readFileSync(
    resolve(__dirname, '../../src/ui/componentes/CartaoPergunta.vue'),
    'utf-8'
  );
  const regra = /\.cartao-pergunta__selo-professor\s*\{([^}]*)\}/.exec(fonte)?.[1] ?? '';

  it('tem regra própria, em negrito, com cores só dos tokens dedicados', () => {
    expect(regra).not.toBe('');
    expect(regra).toMatch(/font-weight:\s*700/);
    expect(regra).toContain('var(--cor-selo-professor-texto');
    expect(regra).toContain('var(--cor-selo-professor-bg');
    expect(regra).toContain('var(--selo-professor-borda');
    expect(regra.replace(/var\([^)]*\)/g, '')).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
  });
});
