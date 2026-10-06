import { describe, expect, it } from 'vitest';
import { criarClienteApi, ErroDeApi } from '@/app/restrito/clienteApi';
import { criarFetchFalso } from './apoio/fetchFalso';

const sessaoAnonima = { json: { ok: true, autenticado: false, csrf: 'tok-1' } };

describe('clienteApi', () => {
  it('GET sessao usa mesma origem, sem cache e guarda o token CSRF', async () => {
    const f = criarFetchFalso([sessaoAnonima]);
    const cliente = criarClienteApi({ buscar: f.buscar });
    const s = await cliente.sessao();
    expect(s.autenticado).toBe(false);
    expect(f.chamadas[0]).toMatchObject({
      url: '/api/sessao.php',
      metodo: 'GET',
      credentials: 'same-origin'
    });
    expect(f.chamadas[0]!.cabecalhos['X-CSRF-Token']).toBeUndefined();
  });

  it('POST manda JSON e o cabeçalho X-CSRF-Token e troca o token pelo da resposta', async () => {
    const f = criarFetchFalso([
      sessaoAnonima,
      { json: { ok: true, usuario: 'u', admin: false, deveTrocarSenha: false, csrf: 'tok-2' } },
      { json: { ok: true } }
    ]);
    const cliente = criarClienteApi({ buscar: f.buscar });
    await cliente.sessao();
    const r = await cliente.entrar('u', 'Senha Exata');
    expect(r.usuario).toBe('u');
    expect(f.chamadas[1]).toMatchObject({
      url: '/api/entrar.php',
      metodo: 'POST',
      corpo: { usuario: 'u', senha: 'Senha Exata' }
    });
    expect(f.chamadas[1]!.cabecalhos['X-CSRF-Token']).toBe('tok-1');
    expect(f.chamadas[1]!.cabecalhos['Content-Type']).toBe('application/json');
    await cliente.sair();
    expect(f.chamadas[2]!.cabecalhos['X-CSRF-Token']).toBe('tok-2');
  });

  it('sem token ainda, busca a sessão antes de um POST', async () => {
    const f = criarFetchFalso([sessaoAnonima, { json: { ok: true } }]);
    const cliente = criarClienteApi({ buscar: f.buscar });
    await cliente.sair();
    expect(f.chamadas.map((c) => c.url)).toEqual(['/api/sessao.php', '/api/sair.php']);
    expect(f.chamadas[1]!.cabecalhos['X-CSRF-Token']).toBe('tok-1');
  });

  it('erro da API vira ErroDeApi com status, código e segundos, sem vazar o corpo', async () => {
    const f = criarFetchFalso([
      sessaoAnonima,
      { status: 429, json: { ok: false, erro: 'aguarde', mensagem: 'x', segundos: 32 } }
    ]);
    const cliente = criarClienteApi({ buscar: f.buscar });
    await cliente.sessao();
    const erro = await cliente.entrar('u', 's').catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroDeApi);
    expect(erro).toMatchObject({ status: 429, codigo: 'aguarde', segundos: 32 });
  });

  it('falha de rede, corpo que não é JSON e HTTP sem ok viram códigos próprios', async () => {
    const f = criarFetchFalso([
      { falhaDeRede: true },
      { textoCru: '<html>', status: 200 },
      { status: 502, textoCru: 'x' }
    ]);
    const cliente = criarClienteApi({ buscar: f.buscar });
    await expect(cliente.sessao()).rejects.toMatchObject({ codigo: 'rede' });
    await expect(cliente.sessao()).rejects.toMatchObject({ codigo: 'resposta-invalida' });
    await expect(cliente.sessao()).rejects.toMatchObject({
      codigo: 'resposta-invalida',
      status: 502
    });
  });

  it('conteudo devolve o JSON cru para o validador, nunca confia nele', async () => {
    const f = criarFetchFalso([{ json: { ok: true, conteudo: { versao: 1 } } }]);
    const cliente = criarClienteApi({ buscar: f.buscar });
    expect(await cliente.obterConteudo()).toEqual({ versao: 1 });
    expect(f.chamadas[0]!.url).toBe('/api/conteudo.php');
  });

  it('endpoints de administração', async () => {
    const f = criarFetchFalso([
      sessaoAnonima,
      {
        json: {
          ok: true,
          usuarios: [
            {
              usuario: 'a',
              admin: true,
              ativo: true,
              deveTrocarSenha: false,
              criadoEm: '',
              ultimoLogin: null
            }
          ]
        }
      },
      { json: { ok: true, senhaProvisoria: 'ABCD2345wxyz' } },
      { json: { ok: true } }
    ]);
    const cliente = criarClienteApi({ buscar: f.buscar });
    await cliente.sessao();
    expect((await cliente.listarUsuarios())[0]!.usuario).toBe('a');
    expect(await cliente.acaoUsuario({ acao: 'redefinir', usuario: 'b' })).toEqual({
      senhaProvisoria: 'ABCD2345wxyz'
    });
    await cliente.acaoUsuario({ acao: 'excluir', usuario: 'b' });
    expect(f.chamadas[1]!.url).toBe('/api/usuarios.php');
    expect(f.chamadas[2]).toMatchObject({
      metodo: 'POST',
      corpo: { acao: 'redefinir', usuario: 'b' }
    });
  });
});
