import { describe, expect, it, vi } from 'vitest';
import { criarTransporte, ErroDeApi } from '@/app/restrito/transporte';

function respostaComCorpo(status: number, corpo: string): Response {
  return new Response(corpo, { status, headers: { 'Content-Type': 'application/json' } });
}

describe('transporte: 401 leva ao caminho da tela de entrada (sessão vencida)', () => {
  it('401 sem corpo (o portão responde assim a quem não tem sessão) chama o aviso uma vez', async () => {
    const aoNaoAutorizado = vi.fn();
    const transporte = criarTransporte({
      buscar: async () => new Response('', { status: 401 }),
      aoNaoAutorizado
    });

    await expect(transporte.ler('conteudo.php')).rejects.toBeInstanceOf(ErroDeApi);
    expect(aoNaoAutorizado).toHaveBeenCalledOnce();
  });

  it('401 com erro de sessão em JSON também chama o aviso', async () => {
    const aoNaoAutorizado = vi.fn();
    const transporte = criarTransporte({
      buscar: async () => respostaComCorpo(401, '{"ok":false,"erro":"sem-sessao"}'),
      aoNaoAutorizado
    });

    await expect(transporte.ler('conteudo.php')).rejects.toMatchObject({ status: 401 });
    expect(aoNaoAutorizado).toHaveBeenCalledOnce();
  });

  it('401 de credencial errada (login) NÃO navega: a mensagem fica na tela', async () => {
    const aoNaoAutorizado = vi.fn();
    const transporte = criarTransporte({
      buscar: async () => respostaComCorpo(401, '{"ok":false,"erro":"credenciais"}'),
      aoNaoAutorizado
    });

    await expect(
      transporte.enviar('entrar.php', { usuario: 'x', senha: 'y' })
    ).rejects.toMatchObject({
      codigo: 'credenciais'
    });
    expect(aoNaoAutorizado).not.toHaveBeenCalled();
  });

  it('401 de senha atual errada na troca NÃO navega', async () => {
    const aoNaoAutorizado = vi.fn();
    const transporte = criarTransporte({
      buscar: async () => respostaComCorpo(401, '{"ok":false,"erro":"senha-atual"}'),
      aoNaoAutorizado
    });

    await expect(transporte.enviar('trocar-senha.php', {})).rejects.toMatchObject({
      codigo: 'senha-atual'
    });
    expect(aoNaoAutorizado).not.toHaveBeenCalled();
  });

  it('403 csrf num POST (sessão derrubada por outro aparelho) chama o aviso uma vez', async () => {
    const aoNaoAutorizado = vi.fn();
    const transporte = criarTransporte({
      buscar: async (_url, init) =>
        init.method === 'POST'
          ? respostaComCorpo(403, '{"ok":false,"erro":"csrf"}')
          : respostaComCorpo(200, '{"ok":true,"autenticado":true,"csrf":"token-sintetico"}'),
      aoNaoAutorizado
    });

    await expect(transporte.enviar('trocar-senha.php', {})).rejects.toMatchObject({
      status: 403,
      codigo: 'csrf'
    });
    expect(aoNaoAutorizado).toHaveBeenCalledOnce();
  });

  it.each(['troca-obrigatoria', 'nao-admin', 'origem', 'senha-atual'])(
    '403 %s NÃO navega: a mensagem fica na tela',
    async (erro) => {
      const aoNaoAutorizado = vi.fn();
      const transporte = criarTransporte({
        buscar: async (_url, init) =>
          init.method === 'POST'
            ? respostaComCorpo(403, `{"ok":false,"erro":"${erro}"}`)
            : respostaComCorpo(200, '{"ok":true,"autenticado":true,"csrf":"token-sintetico"}'),
        aoNaoAutorizado
      });

      await expect(transporte.enviar('usuarios.php', {})).rejects.toMatchObject({
        status: 403,
        codigo: erro
      });
      expect(aoNaoAutorizado).not.toHaveBeenCalled();
    }
  );

  it('403 e 200 não chamam o aviso', async () => {
    const aoNaoAutorizado = vi.fn();
    const comFalha = criarTransporte({
      buscar: async () => respostaComCorpo(403, '{"ok":false,"erro":"proibido"}'),
      aoNaoAutorizado
    });
    const comSucesso = criarTransporte({
      buscar: async () => respostaComCorpo(200, '{"ok":true,"autenticado":false}'),
      aoNaoAutorizado
    });

    await expect(comFalha.ler('usuarios.php')).rejects.toMatchObject({ status: 403 });
    await comSucesso.ler('sessao.php');
    expect(aoNaoAutorizado).not.toHaveBeenCalled();
  });
});
