// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import FormularioEntrada from '@/ui/area-restrita/FormularioEntrada.vue';

function montar(props: Record<string, unknown> = {}) {
  return mount(FormularioEntrada, {
    props: { ocupado: false, segundosEspera: 0, mensagem: '', ...props },
    attachTo: document.body
  });
}

describe('FormularioEntrada', () => {
  it('rótulos visíveis ligados aos campos, sem placeholder como rótulo', () => {
    const w = montar();
    const usuario = w.get('input[name="usuario"]');
    const senha = w.get('input[name="senha"]');
    expect(w.get(`label[for="${usuario.attributes('id')}"]`).text()).toBe('Usuário');
    expect(w.get(`label[for="${senha.attributes('id')}"]`).text()).toBe('Senha');
    expect(usuario.attributes('placeholder')).toBeUndefined();
    expect(usuario.attributes('autocomplete')).toBe('username');
    expect(senha.attributes('autocomplete')).toBe('current-password');
    expect(usuario.attributes('autocapitalize')).toBe('none');
    expect(usuario.attributes('spellcheck')).toBe('false');
  });

  it('mostrar senha alterna o tipo do campo', async () => {
    const w = montar();
    const caixa = w.get('input[type="checkbox"]');
    expect(w.get('input[name="senha"]').attributes('type')).toBe('password');
    await caixa.setValue(true);
    expect(w.get('input[name="senha"]').attributes('type')).toBe('text');
    await caixa.setValue(false);
    expect(w.get('input[name="senha"]').attributes('type')).toBe('password');
  });

  it('envia usuário e senha exatamente como digitados (maiúsculas e espaços preservados)', async () => {
    const w = montar();
    await w.get('input[name="usuario"]').setValue('Nome.Teste');
    await w.get('input[name="senha"]').setValue(' Senha Exata ');
    await w.get('form').trigger('submit');
    expect(w.emitted('entrar')).toEqual([['Nome.Teste', ' Senha Exata ']]);
  });

  it('campos vazios não enviam e avisam, com foco no primeiro vazio', async () => {
    const w = montar();
    await w.get('form').trigger('submit');
    expect(w.emitted('entrar')).toBeUndefined();
    expect(w.get('[role="alert"]').text()).toMatch(/informe o usuário/i);
    expect(document.activeElement).toBe(w.get('input[name="usuario"]').element);
  });

  it('mensagem do servidor vai para região que o leitor de tela anuncia e liga aos campos', () => {
    const w = montar({ mensagem: 'Usuário ou senha incorretos.' });
    const alerta = w.get('[role="alert"]');
    expect(alerta.text()).toBe('Usuário ou senha incorretos.');
    expect(w.get('input[name="usuario"]').attributes('aria-describedby')).toContain(
      alerta.attributes('id')
    );
  });

  it('durante a espera: botão aria-disabled com o tempo, e não envia', async () => {
    const w = montar({ segundosEspera: 12 });
    const botao = w.get('button[type="submit"]');
    expect(botao.attributes('aria-disabled')).toBe('true');
    expect(botao.text()).toContain('12');
    await w.get('input[name="usuario"]').setValue('a');
    await w.get('input[name="senha"]').setValue('b');
    await w.get('form').trigger('submit');
    expect(w.emitted('entrar')).toBeUndefined();
  });

  it('ocupado: botão aria-disabled e não envia em duplicidade', async () => {
    const w = montar({ ocupado: true });
    await w.get('input[name="usuario"]').setValue('a');
    await w.get('input[name="senha"]').setValue('b');
    await w.get('form').trigger('submit');
    expect(w.emitted('entrar')).toBeUndefined();
    expect(w.get('button[type="submit"]').attributes('aria-disabled')).toBe('true');
  });
});
