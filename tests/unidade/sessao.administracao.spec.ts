import { describe, expect, it, vi } from 'vitest';
import { criarAdministrar } from '@/app/sessao/administracao';
import { criarSessaoGlobal, type Navegador } from '@/app/sessao/sessaoGlobal';
import { ErroDeApi } from '@/app/restrito';

function criarNavegadorFalso(): Navegador {
  return {
    caminhoAtual: () => '/usuarios',
    substituir: vi.fn(),
    recarregar: vi.fn(),
    limparCachesESW: vi.fn(async () => undefined)
  };
}

function criarClienteFalso() {
  return {
    sessao: vi.fn(async () => ({ autenticado: true, usuario: 'admin-teste', admin: true })),
    sair: vi.fn(async () => undefined),
    trocarSenha: vi.fn(async () => undefined),
    listarUsuarios: vi.fn(async () => []),
    acaoUsuario: vi.fn(async () => ({}))
  };
}

describe('criarAdministrar, tradução de erro da administração', () => {
  it('chamada que dá certo vira resultado ok com o valor', async () => {
    const administrar = criarAdministrar(criarClienteFalso(), vi.fn());
    const r = await administrar(async () => 42);
    expect(r).toEqual({ ok: true, valor: 42 });
  });

  it('falha de rede vira mensagem em pt-br, sem vazar o código', async () => {
    const cliente = criarClienteFalso();
    const administrar = criarAdministrar(cliente, vi.fn());
    const r = await administrar(async () => {
      throw new ErroDeApi(0, 'rede');
    });
    expect(r).toEqual({
      ok: false,
      mensagem: 'Sem conexão com o servidor. Verifique a internet e tente de novo.'
    });
  });

  it('403 de troca obrigatória avisa quem leva ao formulário de troca e devolve a mensagem do servidor', async () => {
    const aoTrocaObrigatoria = vi.fn();
    const administrar = criarAdministrar(criarClienteFalso(), aoTrocaObrigatoria);
    const r = await administrar(async () => {
      throw new ErroDeApi(403, 'troca-obrigatoria');
    });
    expect(aoTrocaObrigatoria).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ ok: false, mensagem: 'É preciso trocar a senha antes de continuar.' });
  });

  it('401 de sessão vencida avisa a sessão e não chama a troca obrigatória', async () => {
    const aoTrocaObrigatoria = vi.fn();
    const administrar = criarAdministrar(criarClienteFalso(), aoTrocaObrigatoria);
    const r = await administrar(async () => {
      throw new ErroDeApi(401, 'sem-sessao');
    });
    expect(aoTrocaObrigatoria).not.toHaveBeenCalled();
    expect(r).toEqual({ ok: false, mensagem: 'Sua sessão terminou. Entre de novo.' });
  });

  it('401 de credenciais (código só da entrada, que o site não chama mais) não mostra a frase de login', async () => {
    const administrar = criarAdministrar(criarClienteFalso(), vi.fn());
    const r = await administrar(async () => {
      throw new ErroDeApi(401, 'credenciais');
    });
    expect(r).toEqual({ ok: false, mensagem: 'Não foi possível concluir a ação.' });
  });
});

describe('criarAdministrar, ação sobre usuário com convite (CV-F1)', () => {
  it('o caminho do convite chega intacto ao painel e a senha provisória não existe mais no contrato', async () => {
    const cliente = criarClienteFalso();
    const caminho = `/api/convite.php?t=${'0123456789abcdef'.repeat(4)}`;
    cliente.acaoUsuario.mockResolvedValueOnce({ convite: caminho } as never);
    const administrar = criarAdministrar(cliente, vi.fn());
    const r = await administrar((c) => c.acaoUsuario({ acao: 'redefinir', usuario: 'ana' }));
    expect(r).toEqual({ ok: true, valor: { convite: caminho } });
    expect(cliente.acaoUsuario).toHaveBeenCalledWith({ acao: 'redefinir', usuario: 'ana' });
  });

  it('o servidor que recusa o criar (400) tem a mensagem em pt-br mostrada, sem o código', async () => {
    const administrar = criarAdministrar(criarClienteFalso(), vi.fn());
    const r = await administrar(async () => {
      throw new ErroDeApi(400, 'email-invalido', undefined, 'E-mail inválido.');
    });
    expect(r).toEqual({ ok: false, mensagem: 'E-mail inválido.' });
  });
});

describe('criarAdministrar, e-mail da conta (EM-F1)', () => {
  it('o resultado do envio do e-mail chega ao painel junto com o caminho do convite', async () => {
    const cliente = criarClienteFalso();
    const caminho = `/api/convite.php?t=${'0123456789abcdef'.repeat(4)}`;
    cliente.acaoUsuario.mockResolvedValueOnce({ convite: caminho, email: 'enviado' } as never);
    const administrar = criarAdministrar(cliente, vi.fn());
    const r = await administrar((c) =>
      c.acaoUsuario({ acao: 'criar', usuario: 'ana', email: 'ana@example.com' })
    );
    expect(r).toEqual({ ok: true, valor: { convite: caminho, email: 'enviado' } });
    expect(cliente.acaoUsuario).toHaveBeenCalledWith({
      acao: 'criar',
      usuario: 'ana',
      email: 'ana@example.com'
    });
  });

  it('e-mail em uso (409) mostra a mensagem do servidor, sem o código', async () => {
    const administrar = criarAdministrar(criarClienteFalso(), vi.fn());
    const r = await administrar(async () => {
      throw new ErroDeApi(409, 'email-em-uso', undefined, 'Este e-mail já está em outra conta.');
    });
    expect(r).toEqual({ ok: false, mensagem: 'Este e-mail já está em outra conta.' });
  });

  it('senha atual errada na troca do próprio e-mail (403) diz que não confere, sem sair da página', async () => {
    const aoTrocaObrigatoria = vi.fn();
    const administrar = criarAdministrar(criarClienteFalso(), aoTrocaObrigatoria);
    const r = await administrar(async () => {
      throw new ErroDeApi(403, 'senha-atual', undefined, 'A senha atual não confere.');
    });
    expect(r).toEqual({ ok: false, mensagem: 'A senha atual não confere.' });
    expect(aoTrocaObrigatoria).not.toHaveBeenCalled();
  });

  it('senha atual em branco (403) mostra a mensagem do servidor', async () => {
    const administrar = criarAdministrar(criarClienteFalso(), vi.fn());
    const r = await administrar(async () => {
      throw new ErroDeApi(
        403,
        'senha-atual-exigida',
        undefined,
        'Informe a senha atual para trocar o seu e-mail.'
      );
    });
    expect(r).toEqual({ ok: false, mensagem: 'Informe a senha atual para trocar o seu e-mail.' });
  });

  it('muitas tentativas de senha atual (429) mostram a espera que o servidor mandou', async () => {
    const administrar = criarAdministrar(criarClienteFalso(), vi.fn());
    const r = await administrar(async () => {
      throw new ErroDeApi(
        429,
        'aguarde',
        30,
        'Muitas tentativas. Aguarde 30 segundos e tente de novo.'
      );
    });
    expect(r).toEqual({
      ok: false,
      mensagem: 'Muitas tentativas. Aguarde 30 segundos e tente de novo.'
    });
  });

  it('403 de outro código nunca vira a mensagem crua do servidor', async () => {
    const administrar = criarAdministrar(criarClienteFalso(), vi.fn());
    const r = await administrar(async () => {
      throw new ErroDeApi(403, 'nao-admin', undefined, 'Acesso restrito a quem administra.');
    });
    expect(r).toEqual({ ok: false, mensagem: 'Não foi possível concluir a ação.' });
  });
});

describe('criarSessaoGlobal, sessão conhecida e troca de senha', () => {
  it('se a leitura da sessão falha, iniciar não lança: fica não pronta e marca a falha', async () => {
    const cliente = criarClienteFalso();
    cliente.sessao.mockRejectedValueOnce(new Error('rede'));
    const sessao = criarSessaoGlobal({ cliente, navegador: criarNavegadorFalso() });
    await expect(sessao.iniciar()).resolves.toBeUndefined();
    expect(sessao.pronta.value).toBe(false);
    expect(sessao.falhou.value).toBe(true);
  });

  it('pronta é falso até a sessão ser lida, e verdadeiro depois, mesmo sem login', async () => {
    const cliente = criarClienteFalso();
    cliente.sessao.mockResolvedValueOnce({ autenticado: false } as never);
    const sessao = criarSessaoGlobal({ cliente, navegador: criarNavegadorFalso() });

    expect(sessao.pronta.value).toBe(false);
    await sessao.iniciar();
    expect(sessao.pronta.value).toBe(true);
    expect(sessao.admin.value).toBe(false);
  });

  it('trocarSenha dá certo e devolve ok', async () => {
    const cliente = criarClienteFalso();
    const sessao = criarSessaoGlobal({ cliente, navegador: criarNavegadorFalso() });
    const r = await sessao.trocarSenha('senha-antiga-longa', 'senha-nova-bem-longa');
    expect(cliente.trocarSenha).toHaveBeenCalledWith('senha-antiga-longa', 'senha-nova-bem-longa');
    expect(r).toEqual({ ok: true });
  });

  it('trocarSenha com senha atual errada devolve a mensagem, sem sair da página', async () => {
    const cliente = criarClienteFalso();
    cliente.trocarSenha.mockRejectedValueOnce(new ErroDeApi(401, 'senha-atual'));
    const navegador = criarNavegadorFalso();
    const sessao = criarSessaoGlobal({ cliente, navegador });
    const r = await sessao.trocarSenha('errada', 'senha-nova-bem-longa');
    expect(r).toEqual({ ok: false, mensagem: 'A senha atual não confere.' });
    expect(navegador.substituir).not.toHaveBeenCalled();
  });

  it('403 de troca obrigatória em qualquer chamada leva a /conta', async () => {
    const cliente = criarClienteFalso();
    cliente.listarUsuarios.mockRejectedValueOnce(new ErroDeApi(403, 'troca-obrigatoria'));
    const navegador = criarNavegadorFalso();
    const sessao = criarSessaoGlobal({ cliente, navegador });
    const r = await sessao.administrar((c) => c.listarUsuarios());
    expect(r.ok).toBe(false);
    expect(navegador.substituir).toHaveBeenCalledWith('/conta');
  });
});
