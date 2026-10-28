import { describe, expect, it } from 'vitest';
import { criarClienteJuri, ErroDeApi } from '@/app/juri/clienteJuri';
import { bytesParaBase64 } from '@/core/juri/base64';
import { criarFetchFalso, type RespostaFalsa } from './apoio/fetchFalso';

const CSRF_INICIAL = 'csrf-inicial';
const SESSAO_ANONIMA: RespostaFalsa = {
  json: { ok: true, autenticado: false, usuario: null, deveTrocarSenha: null, csrf: CSRF_INICIAL }
};
const EMBRULHO = {
  v: 1,
  iv: bytesParaBase64(new Uint8Array(12)),
  ct: bytesParaBase64(new Uint8Array(48))
};
const AUTH = 'A'.repeat(43);
const SALT_B64 = 'c2FsLXNpbnRldGljbzEy';

/** Fila de respostas: a primeira é sempre o GET sessao.php que o transporte faz para obter CSRF. */
function clienteComFila(...respostas: RespostaFalsa[]) {
  const falso = criarFetchFalso([SESSAO_ANONIMA, ...respostas]);
  return { cliente: criarClienteJuri({ buscar: falso.buscar }), chamadas: falso.chamadas };
}

describe('clienteJuri: corpo das chamadas', () => {
  it('sal.php: POST com {usuario} e CSRF; devolve salt, iter e v como vieram', async () => {
    const { cliente, chamadas } = clienteComFila({
      json: { ok: true, salt: SALT_B64, iter: 600000, v: 1 }
    });
    await expect(cliente.sal('admin')).resolves.toEqual({ salt: SALT_B64, iter: 600000, v: 1 });
    const pedido = chamadas[1];
    expect(pedido?.url).toBe('/api/juri/sal.php');
    expect(pedido?.metodo).toBe('POST');
    expect(pedido?.corpo).toEqual({ usuario: 'admin' });
    expect(pedido?.cabecalhos['X-CSRF-Token']).toBe(CSRF_INICIAL);
  });

  it('entrar.php: o corpo tem EXATAMENTE usuario e auth, nunca senha', async () => {
    const { cliente, chamadas } = clienteComFila({
      json: {
        ok: true,
        usuario: 'admin',
        deveTrocarSenha: false,
        csrf: 'csrf-2',
        embrulho: EMBRULHO
      }
    });
    await cliente.entrar('admin', AUTH);
    const corpo = chamadas[1]?.corpo as Record<string, unknown>;
    expect(Object.keys(corpo).sort()).toEqual(['auth', 'usuario']);
    expect('senha' in corpo).toBe(false);
    expect(corpo.auth).toBe(AUTH);
  });

  it('entrar.php devolve usuario, deveTrocarSenha e embrulho', async () => {
    const { cliente } = clienteComFila({
      json: {
        ok: true,
        usuario: 'admin',
        deveTrocarSenha: true,
        csrf: 'csrf-2',
        embrulho: EMBRULHO
      }
    });
    await expect(cliente.entrar('admin', AUTH)).resolves.toEqual({
      usuario: 'admin',
      deveTrocarSenha: true,
      embrulho: EMBRULHO
    });
  });

  it('destravar.php: corpo só com auth, e devolve o embrulho', async () => {
    const { cliente, chamadas } = clienteComFila({ json: { ok: true, embrulho: EMBRULHO } });
    await expect(cliente.destravar(AUTH)).resolves.toEqual({ embrulho: EMBRULHO });
    const corpo = chamadas[1]?.corpo as Record<string, unknown>;
    expect(Object.keys(corpo)).toEqual(['auth']);
    expect(chamadas[1]?.url).toBe('/api/juri/destravar.php');
  });

  it('trocar-senha.php: corpo com authAtual, salt, auth e embrulho, sem senha em nenhum nível', async () => {
    const { cliente, chamadas } = clienteComFila({ json: { ok: true, csrf: 'csrf-3' } });
    await cliente.trocarSenha({
      authAtual: AUTH,
      salt: SALT_B64,
      auth: 'B'.repeat(43),
      embrulho: EMBRULHO
    });
    const corpo = chamadas[1]?.corpo as Record<string, unknown>;
    expect(Object.keys(corpo).sort()).toEqual(['auth', 'authAtual', 'embrulho', 'salt']);
    expect(Object.keys(corpo.embrulho as object).sort()).toEqual(['ct', 'iv', 'v']);
    expect(JSON.stringify(corpo)).not.toContain('"senha"');
  });

  it('nenhum POST da Júri carrega campo senha (sal, entrar, destravar, trocar, sair)', async () => {
    const { cliente, chamadas } = clienteComFila(
      { json: { ok: true, salt: SALT_B64, iter: 600000, v: 1 } },
      {
        json: { ok: true, usuario: 'admin', deveTrocarSenha: false, csrf: 'c', embrulho: EMBRULHO }
      },
      { json: { ok: true, embrulho: EMBRULHO } },
      { json: { ok: true, csrf: 'c' } },
      { json: { ok: true } }
    );
    await cliente.sal('admin');
    await cliente.entrar('admin', AUTH);
    await cliente.destravar(AUTH);
    await cliente.trocarSenha({ authAtual: AUTH, salt: SALT_B64, auth: AUTH, embrulho: EMBRULHO });
    await cliente.sair();
    for (const chamada of chamadas.filter((c) => c.metodo === 'POST')) {
      expect(JSON.stringify(chamada.corpo ?? {})).not.toContain('senha');
    }
  });
});

describe('clienteJuri: sessão e erros', () => {
  it('sessao.php (GET) devolve autenticado, usuario e deveTrocarSenha; anônimo vem com usuario null', async () => {
    const falso = criarFetchFalso([
      {
        json: { ok: true, autenticado: true, usuario: 'admin', deveTrocarSenha: false, csrf: 'c' }
      },
      SESSAO_ANONIMA
    ]);
    const cliente = criarClienteJuri({ buscar: falso.buscar });
    await expect(cliente.sessao()).resolves.toEqual({
      autenticado: true,
      usuario: 'admin',
      deveTrocarSenha: false
    });
    await expect(cliente.sessao()).resolves.toEqual({
      autenticado: false,
      usuario: null,
      deveTrocarSenha: null
    });
  });

  it('401 vira ErroDeApi com o código do servidor (credenciais), sem perder o status', async () => {
    const { cliente } = clienteComFila({
      status: 401,
      json: { ok: false, erro: 'credenciais', mensagem: 'Usuário ou senha inválidos.' }
    });
    const erro = await cliente.entrar('admin', AUTH).catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroDeApi);
    expect(erro).toMatchObject({ status: 401, codigo: 'credenciais' });
  });

  it('falha de rede vira ErroDeApi de código rede', async () => {
    const { cliente } = clienteComFila({ falhaDeRede: true });
    const erro = await cliente.destravar(AUTH).catch((e: unknown) => e);
    expect(erro).toMatchObject({ codigo: 'rede' });
  });

  it('embrulho com ct fora de 48 bytes é resposta-invalida', async () => {
    const { cliente } = clienteComFila({
      json: {
        ok: true,
        usuario: 'admin',
        deveTrocarSenha: false,
        csrf: 'c',
        embrulho: { ...EMBRULHO, ct: bytesParaBase64(new Uint8Array(47)) }
      }
    });
    await expect(cliente.entrar('admin', AUTH)).rejects.toMatchObject({
      codigo: 'resposta-invalida'
    });
  });

  it('embrulho com iv de 11 bytes ou com campo extra é resposta-invalida', async () => {
    const ivCurto = clienteComFila({
      json: { ok: true, embrulho: { ...EMBRULHO, iv: bytesParaBase64(new Uint8Array(11)) } }
    }).cliente;
    await expect(ivCurto.destravar(AUTH)).rejects.toMatchObject({ codigo: 'resposta-invalida' });
    const comExtra = clienteComFila({
      json: { ok: true, embrulho: { ...EMBRULHO, extra: 1 } }
    }).cliente;
    await expect(comExtra.destravar(AUTH)).rejects.toMatchObject({ codigo: 'resposta-invalida' });
  });

  it('embrulho com versão 2 é repassado como veio: quem recusa a versão é o núcleo', async () => {
    const { cliente } = clienteComFila({
      json: {
        ok: true,
        usuario: 'admin',
        deveTrocarSenha: false,
        csrf: 'c',
        embrulho: { ...EMBRULHO, v: 2 }
      }
    });
    await expect(cliente.entrar('admin', AUTH)).resolves.toMatchObject({ embrulho: { v: 2 } });
  });

  it('embrulho com versão que não é número é resposta-invalida', async () => {
    const { cliente } = clienteComFila({
      json: { ok: true, embrulho: { ...EMBRULHO, v: '1' } }
    });
    await expect(cliente.destravar(AUTH)).rejects.toMatchObject({ codigo: 'resposta-invalida' });
  });

  it('resposta de sucesso sem embrulho é resposta-invalida, nunca um embrulho vazio', async () => {
    const { cliente } = clienteComFila({
      json: { ok: true, usuario: 'admin', deveTrocarSenha: false, csrf: 'c' }
    });
    const erro = await cliente.entrar('admin', AUTH).catch((e: unknown) => e);
    expect(erro).toMatchObject({ codigo: 'resposta-invalida' });
  });

  it('sair.php limpa o CSRF: o próximo POST busca sessao.php de novo', async () => {
    const falso = criarFetchFalso([
      SESSAO_ANONIMA,
      { json: { ok: true } },
      {
        json: {
          ok: true,
          autenticado: false,
          usuario: null,
          deveTrocarSenha: null,
          csrf: 'csrf-novo'
        }
      },
      {
        json: { ok: true, usuario: 'admin', deveTrocarSenha: false, csrf: 'c', embrulho: EMBRULHO }
      }
    ]);
    const cliente = criarClienteJuri({ buscar: falso.buscar });
    await cliente.sair();
    await cliente.entrar('admin', AUTH);
    const caminhos = falso.chamadas.map((c) => `${c.metodo} ${c.url}`);
    expect(caminhos).toEqual([
      'GET /api/juri/sessao.php',
      'POST /api/juri/sair.php',
      'GET /api/juri/sessao.php',
      'POST /api/juri/entrar.php'
    ]);
  });
});
