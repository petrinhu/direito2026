// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import FormularioTrocaSenha from '@/ui/area-restrita/FormularioTrocaSenha.vue';

function montar(props: Record<string, unknown> = {}) {
  return mount(FormularioTrocaSenha, {
    props: { ocupado: false, mensagem: '', ...props },
    attachTo: document.body
  });
}

async function preencher(w: ReturnType<typeof montar>, atual: string, nova: string, conf: string) {
  await w.get('input[name="senhaAtual"]').setValue(atual);
  await w.get('input[name="senhaNova"]').setValue(nova);
  await w.get('input[name="confirmacao"]').setValue(conf);
  await w.get('form').trigger('submit');
}

describe('FormularioTrocaSenha', () => {
  it('três campos rotulados e a regra de 10 a 128 caracteres explicada e ligada ao campo', () => {
    const w = montar();
    for (const [nome, rotulo] of [
      ['senhaAtual', 'Senha atual'],
      ['senhaNova', 'Nova senha'],
      ['confirmacao', 'Confirmar nova senha']
    ] as const) {
      const campo = w.get(`input[name="${nome}"]`);
      expect(w.get(`label[for="${campo.attributes('id')}"]`).text()).toBe(rotulo);
    }
    const regra = w.get('.ar-formulario__regra');
    expect(regra.text()).toMatch(/10 a 128 caracteres/);
    expect(w.get('input[name="senhaNova"]').attributes('aria-describedby')).toContain(
      regra.attributes('id')
    );
    expect(w.get('input[name="senhaNova"]').attributes('autocomplete')).toBe('new-password');
    expect(w.get('input[name="senhaAtual"]').attributes('autocomplete')).toBe('current-password');
  });

  it('senha válida emite atual e nova', async () => {
    const w = montar();
    await preencher(w, 'provisoria', 'uma frase longa de senha', 'uma frase longa de senha');
    expect(w.emitted('trocar')).toEqual([['provisoria', 'uma frase longa de senha']]);
  });

  it('senha curta, confirmação diferente e igual à atual não emitem e explicam, com foco no campo', async () => {
    const w = montar();
    await preencher(w, 'provisoria', 'curta', 'curta');
    expect(w.emitted('trocar')).toBeUndefined();
    expect(w.get('[role="alert"]').text()).toMatch(/pelo menos 10 caracteres/);
    expect(w.get('input[name="senhaNova"]').attributes('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(w.get('input[name="senhaNova"]').element);

    await preencher(w, 'provisoria', 'uma frase longa de senha', 'outra frase longa de senha');
    expect(w.get('[role="alert"]').text()).toMatch(/confirmação/i);
    expect(w.get('input[name="confirmacao"]').attributes('aria-invalid')).toBe('true');

    await preencher(
      w,
      'uma frase longa de senha',
      'uma frase longa de senha',
      'uma frase longa de senha'
    );
    expect(w.get('[role="alert"]').text()).toMatch(/diferente da atual/i);
    expect(w.emitted('trocar')).toBeUndefined();
  });

  it('mostrar senha alterna os três campos', async () => {
    const w = montar();
    await w.get('input[type="checkbox"]').setValue(true);
    for (const nome of ['senhaAtual', 'senhaNova', 'confirmacao']) {
      expect(w.get(`input[name="${nome}"]`).attributes('type')).toBe('text');
    }
  });

  it('mensagem do servidor aparece no alerta; ocupado bloqueia o envio', async () => {
    const w = montar({ mensagem: 'A senha atual não confere.', ocupado: true });
    expect(w.get('[role="alert"]').text()).toBe('A senha atual não confere.');
    await preencher(w, 'a', 'uma frase longa de senha', 'uma frase longa de senha');
    expect(w.emitted('trocar')).toBeUndefined();
    expect(w.get('button[type="submit"]').attributes('aria-disabled')).toBe('true');
  });

  it('o título diz que a troca é obrigatória', () => {
    const w = montar();
    expect(w.get('h2').text()).toMatch(/troque a senha/i);
  });
});
