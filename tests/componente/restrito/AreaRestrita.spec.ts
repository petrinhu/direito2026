// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import AreaRestrita from '@/ui/paginas/AreaRestrita.vue';
import { CHAVE_CLIENTE_RESTRITO } from '@/app/chaves';
import { criarClienteApi, ErroDeApi, type ClienteApi } from '@/app/restrito/clienteApi';
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
    sessao: vi.fn(async () => ({ autenticado: true, usuario: 'u' })),
    entrar: vi.fn(async () => ({ usuario: 'u', admin: false, deveTrocarSenha: false })),
    sair: vi.fn(async () => {}),
    trocarSenha: vi.fn(async () => {}),
    obterConteudo: vi.fn(async () => conteudoRestritoFalso()),
    obterConteudoJuri: vi.fn(async () => ({})),
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
  w = undefined;
  document.body.innerHTML = '';
});

const TITULO = 'Área restrita ao grupo Fronteiras da Inteligência Artificial';

describe('AreaRestrita', () => {
  it('monta e pede o conteúdo sem pedir senha, mesmo sem sessão local: sem formulário e com o conteúdo na tela', async () => {
    const cliente = clienteFalso({ sessao: vi.fn(async () => ({ autenticado: false })) });
    await montar(cliente);
    expect(cliente.obterConteudo).toHaveBeenCalledTimes(1);
    expect(cliente.sessao).not.toHaveBeenCalled();
    expect(w!.find('form').exists()).toBe(false);
    expect(w!.find('input[type="password"]').exists()).toBe(false);
    expect(w!.get('.ar-visor__equipe').text()).toContain('Instituição Fictícia');
  });

  it('enquanto carrega mostra um estado e já tem o título num único h1', async () => {
    let liberar: (v: unknown) => void = () => {};
    const cliente = clienteFalso({
      obterConteudo: () => new Promise((r) => (liberar = r))
    });
    w = mount(AreaRestrita, {
      global: { provide: { [CHAVE_CLIENTE_RESTRITO as unknown as symbol]: cliente } }
    });
    expect(w.get('[role="status"]').text()).toMatch(/carregando/i);
    expect(w.findAll('h1')).toHaveLength(1);
    expect(w.get('h1').text()).toBe(TITULO);
    liberar(conteudoRestritoFalso());
    await flushPromises();
    expect(w.find('[role="status"]').exists()).toBe(false);
  });

  it('abas: Resumo, Mapa mental, Quiz e Slides, sem aba de administração', async () => {
    await montar(clienteFalso());
    expect(w!.findAll('[role="tab"]').map((t) => t.text())).toEqual([
      'Resumo',
      'Mapa mental',
      'Quiz',
      'Slides'
    ]);
  });

  it('a página não tem saída própria: a saída fica no menu da área global', async () => {
    await montar(clienteFalso());
    expect(w!.find('button[data-acao="sair"]').exists()).toBe(false);
  });

  it('conteúdo inválido não é renderizado e oferece tentar de novo', async () => {
    const ruim = conteudoRestritoFalso() as { resumo: Record<string, unknown>[] };
    ruim.resumo[0]!.corpoHtml = '<script>alert(1)</script>';
    await montar(clienteFalso({ obterConteudo: vi.fn(async () => ruim) }));
    expect(w!.find('.ar-visor').exists()).toBe(false);
    expect(w!.get('[role="alert"]').text()).toMatch(/não foi possível exibir/i);
    expect(w!.html()).not.toContain('alert(1)');
    expect(w!.find('button[data-acao="tentar-de-novo"]').exists()).toBe(true);
  });

  it('tentar de novo refaz a carga e mostra o conteúdo quando dá certo', async () => {
    const obterConteudo = vi
      .fn()
      .mockRejectedValueOnce(new ErroDeApi(0, 'rede'))
      .mockResolvedValueOnce(conteudoRestritoFalso());
    await montar(clienteFalso({ obterConteudo }));
    expect(w!.find('.ar-visor').exists()).toBe(false);
    await w!.get('button[data-acao="tentar-de-novo"]').trigger('click');
    await flushPromises();
    expect(obterConteudo).toHaveBeenCalledTimes(2);
    expect(w!.find('.ar-visor').exists()).toBe(true);
  });

  it('401 na carga chama o aviso de sessão vencida, que leva à tela de entrada', async () => {
    const aoNaoAutorizado = vi.fn();
    const buscar = vi.fn(async (url: string) =>
      url.endsWith('conteudo.php')
        ? new Response('{"ok":false,"erro":"sem-sessao"}', {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          })
        : new Response('{}', { status: 500 })
    );
    const cliente = criarClienteApi({ buscar, aoNaoAutorizado });
    w = mount(AreaRestrita, {
      attachTo: document.body,
      global: { provide: { [CHAVE_CLIENTE_RESTRITO as unknown as symbol]: cliente } }
    });
    await flushPromises();
    expect(aoNaoAutorizado).toHaveBeenCalledOnce();
    expect(w!.find('.ar-visor').exists()).toBe(false);
  });

  it('ao sair da página o conteúdo é descartado da memória, sem encerrar a sessão', async () => {
    const cliente = clienteFalso();
    await montar(cliente);
    w!.unmount();
    w = undefined;
    expect(cliente.sair).not.toHaveBeenCalled();
  });
});
