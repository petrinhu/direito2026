import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarClienteJuri } from '@/app/juri/clienteJuri';
import { criarSessaoJuri, ErroSessaoJuri, type SessaoJuri } from '@/app/juri/sessaoJuri';
import { criarServidorJuriFalso, type ServidorJuriFalso } from './apoio/servidorJuriFalso';

const USUARIO = 'admin';
// O mesmo texto com ç em NFC e em NFD: a senha nova NFD é a atual, só que escrita de outro jeito.
const ATUAL = 'senha-sintetica-de-testes-ç';
const ATUAL_NFD = 'senha-sintetica-de-testes-ç';
const NOVA = 'nova-senha-sintetica-de-quinze-mais';
const MENSAGEM_REPETIDA = 'A nova senha precisa ser diferente da atual.';
const KID = new Uint8Array(16).fill(7);
const ID = new Uint8Array(16).fill(9);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Servidor falso que responde 400 senha-repetida em trocar-senha.php, como o backend faria. */
function servidorQueRepete(servidor: ServidorJuriFalso) {
  return async (url: string, init: RequestInit = {}): Promise<Response> => {
    if (url.endsWith('trocar-senha.php')) {
      return new Response(
        JSON.stringify({
          ok: false,
          erro: 'senha-repetida',
          mensagem: 'A senha nova precisa ser diferente da atual.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return servidor.buscar(url, init);
  };
}

async function comTrocaPendente(
  servidor: ServidorJuriFalso,
  buscar: (url: string, init: RequestInit) => Promise<Response> = servidor.buscar
): Promise<SessaoJuri> {
  const sessao = criarSessaoJuri({ cliente: criarClienteJuri({ buscar }) });
  await sessao.iniciar();
  await sessao.entrar(USUARIO, ATUAL);
  return sessao;
}

describe('troca com a mesma senha', () => {
  it('nova igual à atual (mesmo com outro NFC) é recusada antes de qualquer chamada', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, ATUAL, true);
    const sessao = await comTrocaPendente(servidor);
    const chamadasAntes = servidor.chamadas.length;

    await expect(sessao.trocarSenha(ATUAL, ATUAL_NFD)).resolves.toBe(false);

    expect(sessao.mensagem.value).toBe(MENSAGEM_REPETIDA);
    expect(sessao.fase.value).toBe('troca-pendente');
    expect(servidor.chamadas.length).toBe(chamadasAntes);
    expect(servidor.chamadasPara('trocar-senha.php')).toHaveLength(0);
  });

  it('o servidor responder senha-repetida mostra a mensagem própria e mantém a troca pendente', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, ATUAL, true);
    const sessao = await comTrocaPendente(servidor, servidorQueRepete(servidor));

    await expect(sessao.trocarSenha(ATUAL, NOVA)).resolves.toBe(false);

    expect(sessao.mensagem.value).toBe(MENSAGEM_REPETIDA);
    expect(sessao.fase.value).toBe('troca-pendente');
  });
});

describe('descartar: sair da página sem falar com o servidor', () => {
  it('zera a CEK e volta a deslogado; a sessão no servidor continua', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, ATUAL);
    const sessao = criarSessaoJuri({ cliente: criarClienteJuri({ buscar: servidor.buscar }) });
    await sessao.iniciar();
    await sessao.entrar(USUARIO, ATUAL);
    const chamadasAntes = servidor.chamadas.length;

    sessao.descartar();

    expect(sessao.fase.value).toBe('deslogado');
    expect(sessao.usuario.value).toBe('');
    await expect(sessao.decifrarImagem(new Uint8Array(0), KID, ID)).rejects.toBeInstanceOf(
      ErroSessaoJuri
    );
    expect(servidor.chamadas.length).toBe(chamadasAntes);
    expect(servidor.chamadasPara('sair.php')).toHaveLength(0);
  });
});
