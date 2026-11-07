// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import Usuarios from '@/ui/paginas/Usuarios.vue';
import { CHAVE_SESSAO } from '@/app/chaves';
import { criarSessaoGlobal, type Navegador } from '@/app/sessao/sessaoGlobal';

/**
 * Ordem do líder: a gestão de usuários sai do painel restrito e vai para /usuarios.
 * Só administrador vê a página; para os demais é a mesma tela de não encontrado
 * (o servidor já recusa com 403 em usuarios.php).
 */
function criarClienteFalso(admin: boolean) {
  return {
    sessao: vi.fn(async () => ({ autenticado: true, usuario: 'ana', admin })),
    sair: vi.fn(async () => undefined),
    trocarSenha: vi.fn(async () => undefined),
    listarUsuarios: vi.fn(async () => []),
    acaoUsuario: vi.fn(async () => ({}))
  };
}

const navegadorFalso: Navegador = {
  caminhoAtual: () => '/usuarios',
  substituir: vi.fn(),
  recarregar: vi.fn(),
  limparCachesESW: vi.fn(async () => undefined)
};

function montar(sessao: ReturnType<typeof criarSessaoGlobal>) {
  return mount(Usuarios, {
    global: { provide: { [CHAVE_SESSAO]: sessao } }
  });
}

describe('página /usuarios', () => {
  it('antes de a sessão ser conhecida, não mostra o painel nem o não encontrado', () => {
    const cliente = criarClienteFalso(true);
    const w = montar(criarSessaoGlobal({ cliente, navegador: navegadorFalso }));
    expect(w.text()).not.toContain('Página não encontrada');
    expect(w.text()).not.toContain('Administração de usuários');
    expect(cliente.listarUsuarios).not.toHaveBeenCalled();
  });

  it('administrador vê o título Gerenciar usuários e o painel com a lista', async () => {
    const cliente = criarClienteFalso(true);
    const sessao = criarSessaoGlobal({ cliente, navegador: navegadorFalso });
    await sessao.iniciar();
    const w = montar(sessao);
    await flushPromises();
    expect(w.get('h1').text()).toBe('Gerenciar usuários');
    expect(w.text()).toContain('Administração de usuários');
    expect(cliente.listarUsuarios).toHaveBeenCalled();
  });

  it('quem não é administrador vê Página não encontrada e nenhuma chamada de administração', async () => {
    const cliente = criarClienteFalso(false);
    const sessao = criarSessaoGlobal({ cliente, navegador: navegadorFalso });
    await sessao.iniciar();
    const w = montar(sessao);
    await flushPromises();
    expect(w.get('h1').text()).toBe('Página não encontrada');
    expect(w.text()).not.toContain('Administração de usuários');
    expect(cliente.listarUsuarios).not.toHaveBeenCalled();
  });
});
