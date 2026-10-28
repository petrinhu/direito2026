import { readdirSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarClienteJuri, type Buscador } from '@/app/juri/clienteJuri';
import { criarSessaoJuri, ErroSessaoJuri, type SessaoJuri } from '@/app/juri/sessaoJuri';
import { cifrarImagem } from '@/core/juri/cifra';
import { utf8 } from './apoio/cifraJuri';
import { criarServidorJuriFalso, type ServidorJuriFalso } from './apoio/servidorJuriFalso';

const USUARIO = 'admin';
const SENHA = 'senha-sintetica-de-quinze-ou-mais';
const SENHA_NOVA = 'nova-senha-sintetica-de-teste-longa';
const KID = new Uint8Array(16).fill(7);
const ID = new Uint8Array(16).fill(9);
const META = { kid: KID, id: ID, tipo: 'png' as const };
const CLARO = utf8('bytes-sinteticos-de-imagem-de-teste');
const FORMATO_AUTH = /^[A-Za-z0-9_-]{43}$/;
const FORMATO_SALT_PADDED = /^[A-Za-z0-9+/]{22}==$/;

function montar(servidor: ServidorJuriFalso): SessaoJuri {
  return criarSessaoJuri({ cliente: criarClienteJuri({ buscar: servidor.buscar }) });
}

/** Reescreve a versão do embrulho que um endpoint devolve. O servidor falso só entrega a versão 1. */
function comVersaoDoEmbrulho(buscar: Buscador, endpoint: string, versao: number): Buscador {
  return async (url, init) => {
    const resposta = await buscar(url, init);
    if (!url.endsWith(endpoint)) return resposta;
    const corpo = (await resposta.json()) as Record<string, unknown>;
    const embrulho = corpo.embrulho as Record<string, unknown>;
    return new Response(JSON.stringify({ ...corpo, embrulho: { ...embrulho, v: versao } }), {
      status: resposta.status,
      headers: { 'Content-Type': 'application/json' }
    });
  };
}

/** Imagem de teste cifrada com a CEK da conta, como o acervo faria. */
async function imagemCifrada(cek: globalThis.CryptoKey): Promise<Uint8Array<ArrayBuffer>> {
  return cifrarImagem(CLARO, cek, META);
}

async function decifraAbre(sessao: SessaoJuri, arquivo: Uint8Array<ArrayBuffer>): Promise<boolean> {
  try {
    const { bytes } = await sessao.decifrarImagem(arquivo, KID, ID);
    return bytes.byteLength === CLARO.byteLength && bytes.every((b, i) => b === CLARO[i]);
  } catch {
    return false;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('login correto (entrar)', () => {
  it('abre a sessão e guarda a CEK em memória: a imagem decifra', async () => {
    const servidor = criarServidorJuriFalso();
    const cek = await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    expect(sessao.fase.value).toBe('deslogado');

    await expect(sessao.entrar(USUARIO, SENHA)).resolves.toBe(true);
    expect(sessao.fase.value).toBe('aberta');
    expect(sessao.usuario.value).toBe(USUARIO);
    expect(await decifraAbre(sessao, await imagemCifrada(cek))).toBe(true);
  });

  it('senha errada não abre: fica deslogado e a mensagem não diz qual campo errou', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();

    await expect(sessao.entrar(USUARIO, 'senha-errada-de-quinze-ou-mais')).resolves.toBe(false);
    expect(sessao.fase.value).toBe('deslogado');
    expect(sessao.mensagem.value).toBe('Usuário ou senha incorretos.');
  });

  it('NFD da mesma senha entra: a senha foi normalizada antes de derivar', async () => {
    const senhaComAcento = 'senha-com-é-sintetica-de-quinze-ou-mais';
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, senhaComAcento);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await expect(sessao.entrar(USUARIO, 'senha-com-é-sintetica-de-quinze-ou-mais')).resolves.toBe(
      true
    );
    expect(sessao.fase.value).toBe('aberta');
  });

  it('conta com troca pendente entra em troca-pendente, sem CEK', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA, true);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);
    expect(sessao.fase.value).toBe('troca-pendente');
    await expect(sessao.decifrarImagem(new Uint8Array(0), KID, ID)).rejects.toBeInstanceOf(
      ErroSessaoJuri
    );
  });

  it('iter fora do contrato no sal.php é recusado antes de derivar, sem enviar AUTH', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    servidor.definirIter(1000);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await expect(sessao.entrar(USUARIO, SENHA)).resolves.toBe(false);
    expect(servidor.chamadasPara('entrar.php')).toHaveLength(0);
    expect(sessao.fase.value).toBe('deslogado');
  });

  it('embrulho com versão 2 vindo do servidor é recusado pelo núcleo antes do unwrap', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const sessao = criarSessaoJuri({
      cliente: criarClienteJuri({ buscar: comVersaoDoEmbrulho(servidor.buscar, 'entrar.php', 2) })
    });
    await sessao.iniciar();
    const prototipo = Object.getPrototypeOf(globalThis.crypto.subtle) as object;
    const espiao = vi.spyOn(prototipo as { unwrapKey: (...a: unknown[]) => unknown }, 'unwrapKey');
    await expect(sessao.entrar(USUARIO, SENHA)).resolves.toBe(false);
    expect(espiao).not.toHaveBeenCalled();
    expect(sessao.fase.value).toBe('deslogado');
    expect(sessao.mensagem.value).toMatch(/Não foi possível abrir o conteúdo/);
  });
});

describe('corpo das chamadas', () => {
  it('o AUTH do login segue o formato do servidor e nenhum POST leva senha', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);

    const entrar = servidor.chamadasPara('entrar.php')[0]?.corpo;
    expect(Object.keys(entrar ?? {}).sort()).toEqual(['auth', 'usuario']);
    expect(String(entrar?.auth)).toMatch(FORMATO_AUTH);
    for (const chamada of servidor.chamadas.filter((c) => c.metodo === 'POST')) {
      expect(JSON.stringify(chamada.corpo ?? {})).not.toContain('"senha"');
    }
  });

  it('o salt enviado na troca tem o padding de 16 bytes que o servidor espera', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);
    await sessao.trocarSenha(SENHA, SENHA_NOVA);
    const troca = servidor.chamadasPara('trocar-senha.php')[0]?.corpo;
    expect(String(troca?.salt)).toMatch(FORMATO_SALT_PADDED);
    expect(String(troca?.auth)).toMatch(FORMATO_AUTH);
    expect(String(troca?.authAtual)).toMatch(FORMATO_AUTH);
  });
});

describe('recarregar a página (travada)', () => {
  it('sessão válida no servidor vira travada: texto sem CEK, decifrar recusa', async () => {
    const servidor = criarServidorJuriFalso();
    const cek = await servidor.criarConta(USUARIO, SENHA);
    const antes = montar(servidor);
    await antes.iniciar();
    await antes.entrar(USUARIO, SENHA);
    const depois = montar(servidor);
    await depois.iniciar();
    expect(depois.fase.value).toBe('travada');
    expect(depois.usuario.value).toBe(USUARIO);
    await expect(depois.decifrarImagem(await imagemCifrada(cek), KID, ID)).rejects.toBeInstanceOf(
      ErroSessaoJuri
    );
  });

  it('destravar com a senha certa devolve a CEK e a imagem decifra', async () => {
    const servidor = criarServidorJuriFalso();
    const cek = await servidor.criarConta(USUARIO, SENHA);
    const antes = montar(servidor);
    await antes.iniciar();
    await antes.entrar(USUARIO, SENHA);
    const depois = montar(servidor);
    await depois.iniciar();
    await expect(depois.destravar(SENHA)).resolves.toBe(true);
    expect(depois.fase.value).toBe('aberta');
    expect(await decifraAbre(depois, await imagemCifrada(cek))).toBe(true);
  });

  it('destravar desembrulha a CEK como NÃO extraível: a chave em memória não exporta', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const antes = montar(servidor);
    await antes.iniciar();
    await antes.entrar(USUARIO, SENHA);
    const depois = montar(servidor);
    await depois.iniciar();
    const prototipo = Object.getPrototypeOf(globalThis.crypto.subtle) as object;
    const espiao = vi.spyOn(prototipo as { unwrapKey: (...a: unknown[]) => unknown }, 'unwrapKey');
    await expect(depois.destravar(SENHA)).resolves.toBe(true);
    // unwrapKey(format, wrapped, kek, algoritmo, algoritmoChave, extractable, usages): extractable é o 6o argumento.
    expect(espiao.mock.calls.map((c) => c[5])).toEqual([false]);
    const chave = (await espiao.mock.results[0]!.value) as globalThis.CryptoKey;
    await expect(globalThis.crypto.subtle.exportKey('raw', chave)).rejects.toThrow();
  });

  it('destravar com senha errada continua travada, sem CEK', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const antes = montar(servidor);
    await antes.iniciar();
    await antes.entrar(USUARIO, SENHA);
    const depois = montar(servidor);
    await depois.iniciar();

    await expect(depois.destravar('senha-errada-de-quinze-ou-mais')).resolves.toBe(false);
    expect(depois.fase.value).toBe('travada');
    expect(depois.mensagem.value).toBe('A senha não confere.');
    await expect(depois.decifrarImagem(new Uint8Array(0), KID, ID)).rejects.toBeInstanceOf(
      ErroSessaoJuri
    );
  });

  it('409 conta-alterada no destravar: continua travada, sem CEK, e manda entrar de novo', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const antes = montar(servidor);
    await antes.iniciar();
    await antes.entrar(USUARIO, SENHA);
    const depois = montar(servidor);
    await depois.iniciar();
    servidor.definirConflitoConta(true);
    await expect(depois.destravar(SENHA)).resolves.toBe(false);
    expect(depois.fase.value).toBe('travada');
    expect(depois.mensagem.value).toBe('A conta mudou em outro aparelho. Entre de novo.');
    await expect(depois.decifrarImagem(new Uint8Array(0), KID, ID)).rejects.toBeInstanceOf(
      ErroSessaoJuri
    );
  });

  it('destravar com troca pendente leva a troca-pendente, não a aberta', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA, true);
    const antes = montar(servidor);
    await antes.iniciar();
    await antes.entrar(USUARIO, SENHA);
    const depois = montar(servidor);
    await depois.iniciar();
    await depois.destravar(SENHA);
    expect(depois.fase.value).toBe('troca-pendente');
  });
});

describe('qualquer 401 descarta a CEK', () => {
  it('sessão expirou no meio da troca: 401 sem-sessao volta a deslogado e zera a CEK', async () => {
    const servidor = criarServidorJuriFalso();
    const cek = await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);
    const arquivo = await imagemCifrada(cek);
    expect(sessao.fase.value).toBe('aberta');

    servidor.derrubarSessao();
    await expect(sessao.trocarSenha(SENHA, SENHA_NOVA)).resolves.toBe(false);
    expect(sessao.fase.value).toBe('deslogado');
    expect(sessao.usuario.value).toBe('');
    await expect(sessao.decifrarImagem(arquivo, KID, ID)).rejects.toBeInstanceOf(ErroSessaoJuri);
  });

  it('sessão expirou no destravar: 401 sem-sessao volta a deslogado', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const antes = montar(servidor);
    await antes.iniciar();
    await antes.entrar(USUARIO, SENHA);
    const depois = montar(servidor);
    await depois.iniciar();
    servidor.derrubarSessao();
    await expect(depois.destravar(SENHA)).resolves.toBe(false);
    expect(depois.fase.value).toBe('deslogado');
  });
});

describe('troca de senha', () => {
  it('envia salt novo e embrulho novo, e a CEK continua a mesma', async () => {
    const servidor = criarServidorJuriFalso();
    const cek = await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);
    const arquivoAntes = await imagemCifrada(cek);
    const antes = servidor.contaAtual();

    await expect(sessao.trocarSenha(SENHA, SENHA_NOVA)).resolves.toBe(true);
    const depois = servidor.contaAtual();
    expect(depois?.salt).not.toEqual(antes?.salt);
    expect(depois?.embrulho.iv).not.toBe(antes?.embrulho.iv);
    expect(depois?.embrulho.ct).not.toBe(antes?.embrulho.ct);
    expect(depois?.deveTrocarSenha).toBe(false);

    // A mesma CEK abre a imagem cifrada ANTES da troca.
    expect(await decifraAbre(sessao, arquivoAntes)).toBe(true);
  });

  it('depois da troca, a senha nova entra e a antiga não', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);
    await sessao.trocarSenha(SENHA, SENHA_NOVA);

    const outra = montar(servidor);
    await outra.iniciar();
    await expect(outra.entrar(USUARIO, SENHA)).resolves.toBe(false);
    await expect(outra.entrar(USUARIO, SENHA_NOVA)).resolves.toBe(true);
  });

  it('troca de senha pendente (troca-pendente) também termina em aberta com a mesma CEK', async () => {
    const servidor = criarServidorJuriFalso();
    const cek = await servidor.criarConta(USUARIO, SENHA, true);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);
    const arquivo = await imagemCifrada(cek);
    await expect(sessao.trocarSenha(SENHA, SENHA_NOVA)).resolves.toBe(true);
    expect(sessao.fase.value).toBe('aberta');
    expect(await decifraAbre(sessao, arquivo)).toBe(true);
  });

  it('senha atual errada não chega ao servidor: a CEK não desembrulha e nada é enviado', async () => {
    const servidor = criarServidorJuriFalso();
    const cek = await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);
    const arquivo = await imagemCifrada(cek);
    await expect(sessao.trocarSenha('senha-errada-de-quinze-ou-mais', SENHA_NOVA)).resolves.toBe(
      false
    );
    expect(sessao.mensagem.value).toBe('A senha atual não confere.');
    expect(servidor.chamadasPara('trocar-senha.php')).toHaveLength(0);
    expect(sessao.fase.value).toBe('aberta');
    expect(await decifraAbre(sessao, arquivo)).toBe(true);
  });

  it('senha nova curta é recusada antes de qualquer chamada ao servidor', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);
    await expect(sessao.trocarSenha(SENHA, 'curta-demais')).resolves.toBe(false);
    expect(servidor.chamadasPara('trocar-senha.php')).toHaveLength(0);
    expect(sessao.fase.value).toBe('aberta');
  });

  it('a CEK só é desembrulhada como extraível na troca; o handle final não é extraível', async () => {
    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    const prototipo = Object.getPrototypeOf(globalThis.crypto.subtle) as object;
    const espiao = vi.spyOn(prototipo as { unwrapKey: (...a: unknown[]) => unknown }, 'unwrapKey');
    await sessao.entrar(USUARIO, SENHA);
    // unwrapKey(format, wrapped, kek, algoritmo, algoritmoChave, extractable, usages): extractable é o 6o argumento.
    expect(espiao.mock.calls.map((c) => c[5])).toEqual([false]);
    await sessao.trocarSenha(SENHA, SENHA_NOVA);
    expect(espiao.mock.calls.map((c) => c[5])).toEqual([false, true, false]);
  });

  it('falha de rede na troca não zera a CEK', async () => {
    const servidor = criarServidorJuriFalso();
    const cek = await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);
    const arquivo = await imagemCifrada(cek);
    servidor.definirOffline(true);
    await expect(sessao.trocarSenha(SENHA, SENHA_NOVA)).resolves.toBe(false);
    expect(sessao.fase.value).toBe('aberta');
    expect(sessao.mensagem.value).toMatch(/Sem conexão/);
    expect(await decifraAbre(sessao, arquivo)).toBe(true);
  });
});

describe('sair', () => {
  it('limpa a CEK e o servidor encerra a sessão', async () => {
    const servidor = criarServidorJuriFalso();
    const cek = await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);
    const arquivo = await imagemCifrada(cek);
    await sessao.sair();
    expect(sessao.fase.value).toBe('deslogado');
    expect(sessao.usuario.value).toBe('');
    await expect(sessao.decifrarImagem(arquivo, KID, ID)).rejects.toBeInstanceOf(ErroSessaoJuri);
    const depois = montar(servidor);
    await depois.iniciar();
    expect(depois.fase.value).toBe('deslogado');
  });
});

describe('nada gravado em armazenamento do navegador', () => {
  it('login, troca e saída não tocam Storage nem IndexedDB', async () => {
    const local = { setItem: vi.fn(), getItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() };
    const sessaoStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    const indexed = { open: vi.fn() };
    vi.stubGlobal('localStorage', local);
    vi.stubGlobal('sessionStorage', sessaoStorage);
    vi.stubGlobal('indexedDB', indexed);

    const servidor = criarServidorJuriFalso();
    await servidor.criarConta(USUARIO, SENHA);
    const sessao = montar(servidor);
    await sessao.iniciar();
    await sessao.entrar(USUARIO, SENHA);
    await sessao.trocarSenha(SENHA, SENHA_NOVA);
    await sessao.sair();

    for (const deposito of [local, sessaoStorage]) {
      expect(deposito.setItem).not.toHaveBeenCalled();
      expect(deposito.getItem).not.toHaveBeenCalled();
    }
    expect(indexed.open).not.toHaveBeenCalled();
  });

  it('o código de src/app/juri não menciona localStorage, sessionStorage, indexedDB nem caches', () => {
    const pasta = new URL('../../src/app/juri/', import.meta.url);
    const arquivos = readdirSync(pasta).filter((nome) => nome.endsWith('.ts'));
    // Piso não vazio: zero arquivos seria varredura quebrada, não código limpo (L-36).
    expect(arquivos.length).toBeGreaterThanOrEqual(2);
    for (const nome of arquivos) {
      const fonte = readFileSync(new URL(nome, pasta), 'utf8');
      expect(fonte, nome).not.toMatch(/localStorage|sessionStorage|indexedDB|caches\./);
    }
  });
});
