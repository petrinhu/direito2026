// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import DestravarJuri from '@/ui/area-juri/DestravarJuri.vue';

function montar(props: Record<string, unknown> = {}) {
  return mount(DestravarJuri, {
    props: { ocupado: false, mensagem: '', ...props },
    attachTo: document.body
  });
}

describe('DestravarJuri: só a senha', () => {
  it('mostra um único campo, a senha; o usuário já é conhecido da sessão', () => {
    const w = montar();
    expect(w.findAll('input[type="text"], input:not([type])')).toHaveLength(0);
    expect(w.findAll('input[name="senha"]')).toHaveLength(1);
    expect(w.find('input[name="usuario"]').exists()).toBe(false);
  });

  it('explica por que pede a senha de novo (o conteúdo sai da memória ao recarregar)', () => {
    const w = montar();
    expect(w.get('h2').text()).toBe('Destravar');
    expect(w.text()).toContain('sai da memória ao recarregar');
  });

  it('senha vazia não envia e pede a senha', async () => {
    const w = montar();
    await w.get('form').trigger('submit');
    expect(w.emitted('destravar')).toBeUndefined();
    expect(w.get('[role="alert"]').text()).toBe('Informe a senha.');
  });

  it('senha preenchida emite destravar com a senha', async () => {
    const w = montar();
    await w.get('input[name="senha"]').setValue('provisoria-sintetica');
    await w.get('form').trigger('submit');
    expect(w.emitted('destravar')).toEqual([['provisoria-sintetica']]);
  });
});
