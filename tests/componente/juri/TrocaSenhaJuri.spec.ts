// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TrocaSenhaJuri from '@/ui/area-juri/TrocaSenhaJuri.vue';

const QUINZE = 'a'.repeat(15);
const CATORZE = 'a'.repeat(14);

function montar(props: Record<string, unknown> = {}) {
  return mount(TrocaSenhaJuri, {
    props: { ocupado: false, mensagem: '', ...props },
    attachTo: document.body
  });
}

type Montado = ReturnType<typeof montar>;

async function preencher(w: Montado, atual: string, nova: string, confirmacao = nova) {
  await w.get('input[name="senhaAtual"]').setValue(atual);
  await w.get('input[name="senhaNova"]').setValue(nova);
  await w.get('input[name="confirmacao"]').setValue(confirmacao);
  await w.get('form').trigger('submit');
}

describe('TrocaSenhaJuri: campos e regra', () => {
  it('três campos rotulados, com autocomplete certo', () => {
    const w = montar();
    for (const [nome, rotulo, autocomplete] of [
      ['senhaAtual', 'Senha atual', 'current-password'],
      ['senhaNova', 'Nova senha', 'new-password'],
      ['confirmacao', 'Confirmar nova senha', 'new-password']
    ] as const) {
      const campo = w.get(`input[name="${nome}"]`);
      expect(w.get(`label[for="${campo.attributes('id')}"]`).text()).toBe(rotulo);
      expect(campo.attributes('autocomplete')).toBe(autocomplete);
    }
  });

  it('a regra de 15 caracteres ou mais aparece antes de digitar e fica ligada ao campo', () => {
    const w = montar();
    const regra = w.get('.juri-formulario__regra');
    expect(regra.text()).toContain('15 caracteres ou mais');
    expect(w.get('input[name="senhaNova"]').attributes('aria-describedby')).toContain(
      regra.attributes('id')
    );
  });
});

describe('TrocaSenhaJuri: contador de caracteres', () => {
  it('mostra quantos faltam e fica ligado ao campo da senha nova', async () => {
    const w = montar();
    await w.get('input[name="senhaNova"]').setValue(CATORZE);
    const contador = w.get('.juri-contador');
    expect(contador.text()).toContain('14 de 15');
    expect(w.get('input[name="senhaNova"]').attributes('aria-describedby')).toContain(
      contador.attributes('id')
    );
  });

  it('anuncia uma vez ao chegar ao mínimo, e não a cada tecla', async () => {
    const w = montar();
    const anuncio = w.get('[role="status"]');
    await w.get('input[name="senhaNova"]').setValue('aaa');
    expect(anuncio.text()).toBe('');
    await w.get('input[name="senhaNova"]').setValue(CATORZE);
    expect(anuncio.text()).toBe('');
    await w.get('input[name="senhaNova"]').setValue(QUINZE);
    expect(anuncio.text()).toBe('Mínimo de 15 caracteres atingido.');
  });

  it('conta caracteres depois de compor: ç em NFD conta como um', async () => {
    const w = montar();
    await w.get('input[name="senhaNova"]').setValue('a'.repeat(13) + 'ç');
    expect(w.get('.juri-contador').text()).toContain('14 de 15');
  });
});

describe('TrocaSenhaJuri: envio', () => {
  it('14 caracteres não sai do formulário: alerta claro, campo inválido e foco nele', async () => {
    const w = montar();
    await preencher(w, 'provisoria-sintetica', CATORZE);
    expect(w.emitted('trocar')).toBeUndefined();
    expect(w.get('[role="alert"]').text()).toContain('15 caracteres');
    expect(w.get('input[name="senhaNova"]').attributes('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(w.get('input[name="senhaNova"]').element);
  });

  it('15 caracteres com confirmação igual sai: emite atual e nova', async () => {
    const w = montar();
    await preencher(w, 'provisoria-sintetica', QUINZE);
    expect(w.emitted('trocar')).toEqual([['provisoria-sintetica', QUINZE]]);
  });

  it('confirmação diferente reprova sem enviar', async () => {
    const w = montar();
    await preencher(w, 'provisoria-sintetica', QUINZE, 'b'.repeat(15));
    expect(w.emitted('trocar')).toBeUndefined();
    expect(w.get('[role="alert"]').text()).toContain('não é igual à nova senha');
  });

  it('nova igual à atual reprova com mensagem própria', async () => {
    const w = montar();
    await preencher(w, QUINZE, QUINZE);
    expect(w.emitted('trocar')).toBeUndefined();
    expect(w.get('[role="alert"]').text()).toContain('precisa ser diferente da atual');
  });

  it('senha atual vazia reprova e leva o foco ao campo dela', async () => {
    const w = montar();
    await preencher(w, '', QUINZE);
    expect(w.emitted('trocar')).toBeUndefined();
    expect(w.get('[role="alert"]').text()).toContain('Informe a senha atual.');
    expect(document.activeElement).toBe(w.get('input[name="senhaAtual"]').element);
  });

  it('mensagem do servidor aparece como alerta quando não há erro local', () => {
    const w = montar({ mensagem: 'A senha atual não confere.' });
    expect(w.get('[role="alert"]').text()).toBe('A senha atual não confere.');
  });

  it('ocupado: o botão mostra o estado e o envio não sai', async () => {
    const w = montar({ ocupado: true });
    expect(w.get('button[type="submit"]').text()).toBe('Salvando…');
    await preencher(w, 'provisoria-sintetica', QUINZE);
    expect(w.emitted('trocar')).toBeUndefined();
  });

  it('mostrar senhas troca o tipo dos três campos para texto', async () => {
    const w = montar();
    await w.get('input[type="checkbox"]').setValue(true);
    for (const nome of ['senhaAtual', 'senhaNova', 'confirmacao']) {
      expect(w.get(`input[name="${nome}"]`).attributes('type')).toBe('text');
    }
  });
});
