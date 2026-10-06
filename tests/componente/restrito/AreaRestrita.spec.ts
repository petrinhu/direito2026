// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import AreaRestrita from '@/ui/paginas/AreaRestrita.vue';
import { CHAVE_CLIENTE_RESTRITO } from '@/app/chaves';
import { ErroDeApi, type ClienteApi } from '@/app/restrito/clienteApi';
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

function clienteFalso(sobrescritas: Partial<ClienteApi> = {}): ClienteApi {
  return {
    sessao: vi.fn(async () => ({ autenticado: false })),
    entrar: vi.fn(async () => ({ usuario: 'u', admin: false, deveTrocarSenha: false })),
    sair: vi.fn(async () => {}),
    trocarSenha: vi.fn(async () => {}),
    obterConteudo: vi.fn(async () => conteudoRestritoFalso()),
    listarUsuarios: vi.fn(async () => []),
    acaoUsuario: vi.fn(async () => ({})),
    ...sobrescritas
  };
}

let w: VueWrapper | undefined;
async function montar(cliente: ClienteApi) {
  w = mount(AreaRestrita, {
    attachTo: document.body,
    global: { provide: { [CHAVE_CLIENTE_RESTRITO as unknown as symbol]: cliente } }
  });
  await flushPromises();
  return w;
}
afterEach(() => {
  w?.unmount();
  document.body.innerHTML = '';
});

const TITULO = 'Área restrita ao grupo Fronteiras da Inteligência Artificial';

describe('AreaRestrita', () => {
  it('splash: título exato num único h1, formulário de login, nada do conteúdo', async () => {
    await montar(clienteFalso());
    expect(w!.findAll('h1')).toHaveLength(1);
    expect(w!.get('h1').text()).toBe(TITULO);
    expect(w!.find('form input[name="usuario"]').exists()).toBe(true);
    expect(w!.text()).not.toContain('Instituição Fictícia');
    expect(w!.find('[role="tablist"]').exists()).toBe(false);
  });

  it('enquanto verifica a sessão mostra um estado e já tem o título', async () => {
    let liberar: (v: { autenticado: boolean }) => void = () => {};
    const cliente = clienteFalso({ sessao: () => new Promise((r) => (liberar = r)) });
    w = mount(AreaRestrita, {
      global: { provide: { [CHAVE_CLIENTE_RESTRITO as unknown as symbol]: cliente } }
    });
    expect(w.get('[role="status"]').text()).toMatch(/verificando/i);
    expect(w.get('h1').text()).toBe(TITULO);
    liberar({ autenticado: false });
  });

  it('login normal leva ao conteúdo, com a equipe e as abas', async () => {
    const cliente = clienteFalso();
    await montar(cliente);
    await w!.get('input[name="usuario"]').setValue('u');
    await w!.get('input[name="senha"]').setValue('s');
    await w!.get('form').trigger('submit');
    await flushPromises();
    expect(cliente.entrar).toHaveBeenCalledWith('u', 's');
    expect(w!.get('.ar-visor__equipe').text()).toContain('Instituição Fictícia');
    expect(w!.findAll('[role="tab"]').length).toBe(4);
    expect(w!.get('.ar-sessao').text()).toContain('u');
  });

  it('senha provisória leva à troca obrigatória, e o conteúdo só vem depois dela', async () => {
    const cliente = clienteFalso({
      entrar: vi.fn(async () => ({ usuario: 'u', admin: true, deveTrocarSenha: true }))
    });
    await montar(cliente);
    await w!.get('input[name="usuario"]').setValue('u');
    await w!.get('input[name="senha"]').setValue('provisoria');
    await w!.get('form').trigger('submit');
    await flushPromises();
    expect(w!.get('h2').text()).toMatch(/troque a senha/i);
    expect(cliente.obterConteudo).not.toHaveBeenCalled();
    expect(w!.text()).not.toContain('Instituição Fictícia');

    await w!.get('input[name="senhaAtual"]').setValue('provisoria');
    await w!.get('input[name="senhaNova"]').setValue('uma frase longa de senha');
    await w!.get('input[name="confirmacao"]').setValue('uma frase longa de senha');
    await w!.get('form').trigger('submit');
    await flushPromises();
    expect(cliente.trocarSenha).toHaveBeenCalledWith('provisoria', 'uma frase longa de senha');
    expect(w!.find('.ar-visor__equipe').exists()).toBe(true);
    expect(w!.findAll('[role="tab"]').map((t) => t.text())).toContain('Admin');
  });

  it('login errado mostra o erro e continua na splash', async () => {
    const cliente = clienteFalso({
      entrar: vi.fn(async () => {
        throw new ErroDeApi(401, 'credenciais');
      })
    });
    await montar(cliente);
    await w!.get('input[name="usuario"]').setValue('u');
    await w!.get('input[name="senha"]').setValue('x');
    await w!.get('form').trigger('submit');
    await flushPromises();
    expect(w!.get('[role="alert"]').text()).toMatch(/usuário ou senha/i);
    expect(w!.find('.ar-visor').exists()).toBe(false);
  });

  it('sair apaga o conteúdo da tela e volta à splash', async () => {
    const cliente = clienteFalso({
      sessao: vi.fn(async () => ({ autenticado: true, usuario: 'u' }))
    });
    await montar(cliente);
    expect(w!.find('.ar-visor').exists()).toBe(true);
    await w!.get('button[data-acao="sair"]').trigger('click');
    await flushPromises();
    expect(cliente.sair).toHaveBeenCalled();
    expect(w!.find('.ar-visor').exists()).toBe(false);
    expect(w!.text()).not.toContain('Instituição Fictícia');
    expect(w!.find('input[name="usuario"]').exists()).toBe(true);
  });

  it('conteúdo inválido não é renderizado e oferece tentar de novo', async () => {
    const ruim = conteudoRestritoFalso() as { resumo: Record<string, unknown>[] };
    ruim.resumo[0]!.corpoHtml = '<script>alert(1)</script>';
    const cliente = clienteFalso({
      sessao: vi.fn(async () => ({ autenticado: true, usuario: 'u' })),
      obterConteudo: vi.fn(async () => ruim)
    });
    await montar(cliente);
    expect(w!.find('.ar-visor').exists()).toBe(false);
    expect(w!.get('[role="alert"]').text()).toMatch(/não foi possível exibir/i);
    expect(w!.html()).not.toContain('alert(1)');
    expect(w!.find('button[data-acao="tentar-de-novo"]').exists()).toBe(true);
  });

  it('administrador com conteúdo inválido ainda alcança a administração', async () => {
    const cliente = clienteFalso({
      sessao: vi.fn(async () => ({ autenticado: true, usuario: 'u', admin: true })),
      obterConteudo: vi.fn(async () => ({}))
    });
    await montar(cliente);
    expect(w!.find('.ar-admin').exists()).toBe(true);
  });

  it('ao sair da página o conteúdo é descartado da memória', async () => {
    const cliente = clienteFalso({
      sessao: vi.fn(async () => ({ autenticado: true, usuario: 'u' }))
    });
    await montar(cliente);
    w!.unmount();
    w = undefined;
    expect(cliente.sair).not.toHaveBeenCalled();
  });
});
