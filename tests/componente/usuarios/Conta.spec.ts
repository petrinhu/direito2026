// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import Conta from '@/ui/paginas/Conta.vue';
import { CHAVE_SESSAO } from '@/app/chaves';
import { ErroDeApi } from '@/app/restrito';
import { criarSessaoGlobal, type Navegador } from '@/app/sessao/sessaoGlobal';

/**
 * Ordem do líder: "Trocar senha" no menu para todo usuário logado. A página
 * /conta reaproveita o formulário de troca e passa pela sessão global.
 */
function criarClienteFalso() {
  return {
    sessao: vi.fn(async () => ({ autenticado: true, usuario: 'ana', admin: false })),
    sair: vi.fn(async () => undefined),
    trocarSenha: vi.fn(async () => undefined),
    listarUsuarios: vi.fn(async () => []),
    acaoUsuario: vi.fn(async () => ({}))
  };
}

const navegadorFalso: Navegador = {
  caminhoAtual: () => '/conta',
  substituir: vi.fn(),
  recarregar: vi.fn(),
  limparCachesESW: vi.fn(async () => undefined)
};

function montar(cliente: ReturnType<typeof criarClienteFalso>) {
  const sessao = criarSessaoGlobal({ cliente, navegador: navegadorFalso });
  return mount(Conta, {
    global: { provide: { [CHAVE_SESSAO]: sessao } },
    attachTo: document.body
  });
}

function preencher(w: ReturnType<typeof montar>, atual: string, nova: string, confirmacao: string) {
  (w.get('input[name="senhaAtual"]').element as HTMLInputElement).value = atual;
  w.get('input[name="senhaAtual"]').trigger('input');
  (w.get('input[name="senhaNova"]').element as HTMLInputElement).value = nova;
  w.get('input[name="senhaNova"]').trigger('input');
  (w.get('input[name="confirmacao"]').element as HTMLInputElement).value = confirmacao;
  w.get('input[name="confirmacao"]').trigger('input');
}

describe('página /conta, Trocar senha', () => {
  it('o título da página é Trocar senha', () => {
    const w = montar(criarClienteFalso());
    expect(w.get('h1').text()).toBe('Trocar senha');
    w.unmount();
  });

  it('troca válida chama a sessão global e mostra a confirmação', async () => {
    const cliente = criarClienteFalso();
    const w = montar(cliente);
    preencher(w, 'senha-antiga-longa', 'senha-nova-bem-longa-2026', 'senha-nova-bem-longa-2026');
    await w.get('form').trigger('submit');
    await flushPromises();
    expect(cliente.trocarSenha).toHaveBeenCalledWith(
      'senha-antiga-longa',
      'senha-nova-bem-longa-2026'
    );
    expect(w.get('[role="status"]').text()).toContain('Senha trocada');
    w.unmount();
  });

  it('senha atual errada aparece no alerta, e a página continua aberta', async () => {
    const cliente = criarClienteFalso();
    cliente.trocarSenha.mockRejectedValueOnce(new ErroDeApi(401, 'senha-atual'));
    const w = montar(cliente);
    preencher(w, 'errada', 'senha-nova-bem-longa-2026', 'senha-nova-bem-longa-2026');
    await w.get('form').trigger('submit');
    await flushPromises();
    expect(w.get('[role="alert"]').text()).toContain('A senha atual não confere.');
    expect(w.get('h1').text()).toBe('Trocar senha');
    w.unmount();
  });
});
