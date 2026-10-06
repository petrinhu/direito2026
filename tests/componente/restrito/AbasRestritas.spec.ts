// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import AbasRestritas from '@/ui/area-restrita/AbasRestritas.vue';

const abas = [
  { id: 'resumo', rotulo: 'Resumo' },
  { id: 'mapa', rotulo: 'Mapa mental' },
  { id: 'quiz', rotulo: 'Quiz' }
];
let w: VueWrapper | undefined;
afterEach(() => {
  w?.unmount();
  document.body.innerHTML = '';
});

function montar(ativa = 'resumo') {
  w = mount(AbasRestritas, {
    props: { abas, ativa, rotuloLista: 'Seções' },
    slots: { default: '<p>conteúdo do painel</p>' },
    attachTo: document.body
  });
  return w;
}

describe('AbasRestritas (padrão APG de abas)', () => {
  it('lista, abas e painel ligados por aria', () => {
    montar('mapa');
    expect(w!.get('[role="tablist"]').attributes('aria-label')).toBe('Seções');
    const tabs = w!.findAll('[role="tab"]');
    expect(tabs.map((t) => t.text())).toEqual(['Resumo', 'Mapa mental', 'Quiz']);
    expect(tabs.map((t) => t.attributes('aria-selected'))).toEqual(['false', 'true', 'false']);
    expect(tabs.map((t) => t.attributes('tabindex'))).toEqual(['-1', '0', '-1']);
    const painel = w!.get('[role="tabpanel"]');
    expect(painel.attributes('aria-labelledby')).toBe(tabs[1]!.attributes('id'));
    expect(tabs[1]!.attributes('aria-controls')).toBe(painel.attributes('id'));
    expect(painel.text()).toContain('conteúdo do painel');
  });

  it('abas são botões, não links', () => {
    montar();
    expect(w!.findAll('button[role="tab"]')).toHaveLength(3);
  });

  it('clicar troca de aba', async () => {
    montar();
    await w!.findAll('[role="tab"]')[2]!.trigger('click');
    expect(w!.emitted('trocar')).toEqual([['quiz']]);
  });

  it('setas movem e ativam, com volta nas pontas; Home e End vão às pontas', async () => {
    montar('resumo');
    const tabs = () => w!.findAll('[role="tab"]');
    await tabs()[0]!.trigger('keydown', { key: 'ArrowRight' });
    expect(w!.emitted('trocar')![0]).toEqual(['mapa']);
    await tabs()[0]!.trigger('keydown', { key: 'ArrowLeft' });
    expect(w!.emitted('trocar')![1]).toEqual(['quiz']);
    await tabs()[0]!.trigger('keydown', { key: 'End' });
    expect(w!.emitted('trocar')![2]).toEqual(['quiz']);
    await tabs()[2]!.trigger('keydown', { key: 'Home' });
    expect(w!.emitted('trocar')![3]).toEqual(['resumo']);
  });

  it('o foco acompanha a aba ativada pelo teclado', async () => {
    montar('resumo');
    await w!.findAll('[role="tab"]')[0]!.trigger('keydown', { key: 'ArrowRight' });
    await w!.setProps({ ativa: 'mapa' });
    await Promise.resolve();
    expect(document.activeElement).toBe(w!.findAll('[role="tab"]')[1]!.element);
  });
});
