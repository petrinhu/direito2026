// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import EntradaJuri from '@/ui/area-juri/EntradaJuri.vue';

function montar(props: Record<string, unknown> = {}) {
  return mount(EntradaJuri, {
    props: { ocupado: false, mensagem: '', ...props },
    attachTo: document.body
  });
}

describe('EntradaJuri', () => {
  it('usuário e senha rotulados, com autocomplete de login', () => {
    const w = montar();
    const usuario = w.get('input[name="usuario"]');
    const senha = w.get('input[name="senha"]');
    expect(w.get(`label[for="${usuario.attributes('id')}"]`).text()).toBe('Usuário');
    expect(usuario.attributes('autocomplete')).toBe('username');
    expect(w.get(`label[for="${senha.attributes('id')}"]`).text()).toBe('Senha');
    expect(senha.attributes('autocomplete')).toBe('current-password');
  });

  it('envia usuário e senha quando os dois estão preenchidos', async () => {
    const w = montar();
    await w.get('input[name="usuario"]').setValue('admin');
    await w.get('input[name="senha"]').setValue('provisoria-sintetica');
    await w.get('form').trigger('submit');
    expect(w.emitted('entrar')).toEqual([['admin', 'provisoria-sintetica']]);
  });

  it('usuário vazio não envia e pede o usuário', async () => {
    const w = montar();
    await w.get('input[name="senha"]').setValue('provisoria-sintetica');
    await w.get('form').trigger('submit');
    expect(w.emitted('entrar')).toBeUndefined();
    expect(w.get('[role="alert"]').text()).toBe('Informe o usuário.');
    expect(document.activeElement).toBe(w.get('input[name="usuario"]').element);
  });

  it('a mensagem da sessão aparece como alerta e marca os dois campos', () => {
    const w = montar({ mensagem: 'Usuário ou senha incorretos.' });
    expect(w.get('[role="alert"]').text()).toBe('Usuário ou senha incorretos.');
    expect(w.get('input[name="usuario"]').attributes('aria-invalid')).toBe('true');
    expect(w.get('input[name="senha"]').attributes('aria-invalid')).toBe('true');
  });

  it('ocupado: o botão mostra Entrando… e não envia', async () => {
    const w = montar({ ocupado: true });
    expect(w.get('button[type="submit"]').text()).toBe('Entrando…');
    await w.get('input[name="usuario"]').setValue('admin');
    await w.get('input[name="senha"]').setValue('provisoria-sintetica');
    await w.get('form').trigger('submit');
    expect(w.emitted('entrar')).toBeUndefined();
  });

  it('mostrar senha troca o tipo do campo para texto', async () => {
    const w = montar();
    await w.get('input[type="checkbox"]').setValue(true);
    expect(w.get('input[name="senha"]').attributes('type')).toBe('text');
  });
});
