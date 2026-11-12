import { describe, expect, it, vi } from 'vitest';
import { criarClienteApi } from '@/app/restrito/clienteApi';
import { criarAoNaoAutorizado, criarSessaoGlobal, type Navegador } from '@/app/sessao/sessaoGlobal';

function criarNavegadorFalso(caminho = '/p/p1/interdisciplinar?x=1') {
  const ordem: string[] = [];
  const navegador: Navegador = {
    caminhoAtual: () => caminho,
    substituir: vi.fn((url: string) => ordem.push(`substituir:${url}`)),
    recarregar: vi.fn(() => ordem.push('recarregar')),
    limparCachesESW: vi.fn(async () => {
      ordem.push('limpar');
    })
  };
  return { navegador, ordem };
}

function criarClienteFalso(
  resposta: { autenticado: boolean; usuario?: string; admin?: boolean } = {
    autenticado: true,
    usuario: 'ana',
    admin: false
  }
) {
  return {
    sessao: vi.fn(async () => resposta),
    sair: vi.fn(async () => undefined),
    // Administração e troca de senha (LU-F3.2): a sessão global agora as usa.
    trocarSenha: vi.fn(async () => undefined),
    listarUsuarios: vi.fn(async () => []),
    acaoUsuario: vi.fn(async () => ({}))
  };
}

describe('criarSessaoGlobal', () => {
  it('iniciar preenche usuário e admin da sessão e não recarrega', async () => {
    const { navegador } = criarNavegadorFalso();
    const cliente = criarClienteFalso({ autenticado: true, usuario: 'petrus', admin: true });
    const sessao = criarSessaoGlobal({ cliente, navegador });

    await sessao.iniciar();

    expect(sessao.usuario.value).toBe('petrus');
    expect(sessao.admin.value).toBe(true);
    expect(navegador.recarregar).not.toHaveBeenCalled();
  });

  it('iniciar sem sessão não preenche nada e também não recarrega (o portão já cuida da tela)', async () => {
    const { navegador } = criarNavegadorFalso();
    const sessao = criarSessaoGlobal({
      cliente: criarClienteFalso({ autenticado: false }),
      navegador
    });

    await sessao.iniciar();

    expect(sessao.usuario.value).toBe('');
    expect(sessao.admin.value).toBe(false);
    expect(navegador.recarregar).not.toHaveBeenCalled();
  });

  it('conferirAoVoltar recarrega quando o servidor diz que não há sessão', async () => {
    const { navegador } = criarNavegadorFalso();
    const sessao = criarSessaoGlobal({
      cliente: criarClienteFalso({ autenticado: false }),
      navegador
    });

    await sessao.conferirAoVoltar();

    expect(navegador.recarregar).toHaveBeenCalledOnce();
  });

  it('conferirAoVoltar com sessão válida não recarrega', async () => {
    const { navegador } = criarNavegadorFalso();
    const sessao = criarSessaoGlobal({ cliente: criarClienteFalso(), navegador });

    await sessao.conferirAoVoltar();

    expect(navegador.recarregar).not.toHaveBeenCalled();
  });

  it('conferirAoVoltar com falha de rede não recarrega (rede não é sessão vencida)', async () => {
    const { navegador } = criarNavegadorFalso();
    const cliente = {
      sessao: vi.fn(async () => {
        throw new Error('rede');
      }),
      sair: vi.fn(async () => undefined),
      trocarSenha: vi.fn(async () => undefined),
      listarUsuarios: vi.fn(async () => []),
      acaoUsuario: vi.fn(async () => ({}))
    };
    const sessao = criarSessaoGlobal({ cliente, navegador });

    await expect(sessao.conferirAoVoltar()).resolves.toBeUndefined();
    expect(navegador.recarregar).not.toHaveBeenCalled();
  });

  it('sair: encerra no servidor, limpa caches e registros, e só então vai para a raiz', async () => {
    const { navegador, ordem } = criarNavegadorFalso();
    const cliente = criarClienteFalso();
    const sessao = criarSessaoGlobal({ cliente, navegador });
    await sessao.iniciar();

    await sessao.sair();

    expect(cliente.sair).toHaveBeenCalledOnce();
    expect(ordem).toEqual(['limpar', 'substituir:/']);
    expect(sessao.usuario.value).toBe('');
    expect(sessao.admin.value).toBe(false);
  });

  it('sair continua limpando e saindo mesmo se o servidor falhar', async () => {
    const { navegador, ordem } = criarNavegadorFalso();
    const cliente = criarClienteFalso();
    cliente.sair.mockRejectedValueOnce(new Error('rede'));
    const sessao = criarSessaoGlobal({ cliente, navegador });

    await sessao.sair();

    expect(ordem).toEqual(['limpar', 'substituir:/']);
  });

  it('sair numa sessão derrubada (403 csrf pelo transporte de verdade) só navega para /, uma vez', async () => {
    const { navegador, ordem } = criarNavegadorFalso('/p/p1/interdisciplinar?x=1');
    const aoNaoAutorizado = criarAoNaoAutorizado(navegador);
    const cliente = criarClienteApi({
      buscar: async (_url, init) =>
        init.method === 'POST'
          ? new Response('{"ok":false,"erro":"csrf"}', { status: 403 })
          : new Response('{"ok":true,"autenticado":true,"csrf":"token-sintetico"}', {
              status: 200
            }),
      aoNaoAutorizado
    });
    const sessao = criarSessaoGlobal({
      cliente,
      navegador,
      suspenderAviso: aoNaoAutorizado.suspender
    });

    await sessao.sair();

    expect(navegador.substituir).toHaveBeenCalledTimes(1);
    expect(navegador.substituir).toHaveBeenCalledWith('/');
    expect(ordem).toEqual(['limpar', 'substituir:/']);
  });

  it('401 em outro pedido depois de o Sair começar não troca a página pelo caminho atual', async () => {
    const { navegador, ordem } = criarNavegadorFalso('/p/p1/interdisciplinar?x=1');
    const aoNaoAutorizado = criarAoNaoAutorizado(navegador);
    const cliente = criarClienteFalso();
    let terminarSair: () => void = () => undefined;
    cliente.sair.mockImplementationOnce(
      () =>
        new Promise<undefined>((resolver) => {
          terminarSair = () => resolver(undefined);
        })
    );
    const sessao = criarSessaoGlobal({
      cliente,
      navegador,
      suspenderAviso: aoNaoAutorizado.suspender
    });

    const saindo = sessao.sair();
    aoNaoAutorizado();
    terminarSair();
    await saindo;

    expect(ordem).toEqual(['limpar', 'substituir:/']);
  });

  it('sem Sair em curso, o aviso de sessão vencida segue trocando a página pelo próprio caminho', async () => {
    const { navegador, ordem } = criarNavegadorFalso('/p/p1/interdisciplinar?x=1');
    const aoNaoAutorizado = criarAoNaoAutorizado(navegador);
    const sessao = criarSessaoGlobal({
      cliente: criarClienteFalso(),
      navegador,
      suspenderAviso: aoNaoAutorizado.suspender
    });
    await sessao.iniciar();

    aoNaoAutorizado();

    expect(ordem).toEqual(['substituir:/p/p1/interdisciplinar?x=1']);
  });

  it('sair e iniciar não gravam nada em localStorage nem sessionStorage', async () => {
    const gravacoes = vi.fn();
    const armazenamentoFalso = {
      setItem: gravacoes,
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    vi.stubGlobal('localStorage', armazenamentoFalso);
    vi.stubGlobal('sessionStorage', armazenamentoFalso);
    try {
      const { navegador } = criarNavegadorFalso();
      const sessao = criarSessaoGlobal({ cliente: criarClienteFalso(), navegador });
      await sessao.iniciar();
      await sessao.sair();
      expect(gravacoes).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('criarAoNaoAutorizado (401 leva à tela de entrada pelo mesmo caminho)', () => {
  it('troca a página atual pelo próprio caminho e query, para o destino voltar depois do login', () => {
    const { navegador } = criarNavegadorFalso('/p/p1/interdisciplinar?x=1');

    criarAoNaoAutorizado(navegador)();

    expect(navegador.substituir).toHaveBeenCalledWith('/p/p1/interdisciplinar?x=1');
  });
});
