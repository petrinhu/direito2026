// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import QuizJuri from '@/ui/area-juri/QuizJuri.vue';
import { conteudoJuriValidadoFalso } from '../../unidade/apoio/conteudoJuriFalso';

let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  w = undefined;
  document.body.innerHTML = '';
});

function montar(): VueWrapper {
  w = mount(QuizJuri, {
    props: { perguntas: conteudoJuriValidadoFalso().quiz },
    attachTo: document.body
  });
  return w;
}

describe('QuizJuri: motor das páginas de estudo, com as 40 perguntas', () => {
  it('abre na primeira pergunta de 40', () => {
    expect(montar().text()).toContain('Pergunta 1 de 40');
  });

  it('avança com Próxima', async () => {
    const quiz = montar();
    const proxima = quiz.findAll('button').find((b) => b.text() === 'Próxima');
    await proxima!.trigger('click');
    expect(quiz.text()).toContain('Pergunta 2 de 40');
  });

  it('a pergunta da vez mostra as fontes dela, não as de outra', () => {
    const texto = montar().text();
    const numero = /Enunciado fictício número (\d+)\./.exec(texto)?.[1];
    expect(numero).toBeDefined();
    expect(texto).toContain(`Fonte fictícia da pergunta ${numero}`);
  });
});
