// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import ConteudoRestritoVisor from '@/ui/area-restrita/ConteudoRestritoVisor.vue';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import { conteudoRestritoFalso } from '../../unidade/apoio/conteudoRestritoFalso';

vi.mock('markmap-view', () => ({
  Markmap: {
    create: () => ({
      state: {},
      toggleNode: async () => {},
      setData: async () => {},
      renderData: async () => {},
      setOptions: () => {},
      destroy: () => {}
    })
  }
}));

const r = validarConteudoRestrito(conteudoRestritoFalso());
if (!r.ok) throw new Error('fixture inválida');
const conteudoValidado = r.conteudo;

let w: VueWrapper | undefined;
function montar(admin: boolean) {
  w = mount(ConteudoRestritoVisor, {
    props: {
      conteudo: conteudoValidado,
      usuario: 'u',
      admin,
      administrar: async () => ({ ok: true as const, valor: [] as never })
    },
    attachTo: document.body
  });
  return w;
}
afterEach(() => {
  w?.unmount();
  document.body.innerHTML = '';
});

const abas = () => w!.findAll('[role="tab"]').map((t) => t.text());

describe('ConteudoRestritoVisor', () => {
  it('abas: Resumo, Mapa mental, Quiz e Slides; Admin só para administrador', () => {
    montar(false);
    expect(abas()).toEqual(['Resumo', 'Mapa mental', 'Quiz', 'Slides']);
    w!.unmount();
    montar(true);
    expect(abas()).toEqual(['Resumo', 'Mapa mental', 'Quiz', 'Slides', 'Admin']);
  });

  it('mostra instituição e integrantes (só existe depois do login: o componente só monta com conteúdo)', () => {
    montar(false);
    const equipe = w!.get('.ar-visor__equipe');
    expect(equipe.text()).toContain('Instituição Fictícia');
    expect(equipe.text()).toContain('Pessoa Fictícia Dois');
  });

  it('abre no resumo e renderiza o HTML validado', () => {
    montar(false);
    expect(w!.get('[role="tabpanel"]').html()).toContain('<em>ênfase</em>');
    expect(w!.findAll('.bloco-teorico__exemplo')).toHaveLength(0);
  });

  it('quiz: 40 perguntas, uma por vez, alternativas rotuladas de A a D', async () => {
    montar(false);
    await w!.findAll('[role="tab"]')[2]!.trigger('click');
    await w!.setProps({});
    const abaQuiz = w!.findAll('[role="tab"]')[2]!;
    expect(abaQuiz.attributes('aria-selected')).toBe('true');
    expect(w!.get('.motor-quiz__posicao').text()).toBe('Pergunta 1 de 40');
    expect(w!.findAll('.cartao-pergunta__letra').map((l) => l.text())).toEqual([
      'A',
      'B',
      'C',
      'D'
    ]);
  });

  it('o estado do quiz sobrevive à troca de aba (fica na memória do visor)', async () => {
    montar(false);
    await w!.findAll('[role="tab"]')[2]!.trigger('click');
    await w!.get('input[type="radio"]').setValue(true);
    expect(w!.text()).toMatch(/Resposta (correta|incorreta)/);
    await w!.findAll('[role="tab"]')[0]!.trigger('click');
    await w!.findAll('[role="tab"]')[2]!.trigger('click');
    expect(w!.text()).toMatch(/Resposta (correta|incorreta)/);
  });

  it('slides e mapa abrem sem erro', async () => {
    montar(false);
    await w!.findAll('[role="tab"]')[3]!.trigger('click');
    expect(w!.find('.ar-slides').exists()).toBe(true);
    await w!.findAll('[role="tab"]')[1]!.trigger('click');
    await flushPromises();
    expect(w!.find('.ar-mapa').exists()).toBe(true);
    expect(w!.find('.mapa-visual').exists()).toBe(true);
    await w!.get('.ar-mapa button.ar-botao').trigger('click');
    expect(w!.get('[role="tree"]').attributes('aria-label')).toBe('Mapa mental do tema');
  });

  it('o painel Admin carrega a lista quando o administrador abre a aba', async () => {
    montar(true);
    await w!.findAll('[role="tab"]')[4]!.trigger('click');
    expect(w!.find('.ar-admin').exists()).toBe(true);
  });
});
