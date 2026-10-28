/**
 * Servidor falso da API da Júri, só para teste: as regras do backend (corpo com
 * chaves exatas, CSRF no cabeçalho, 401 por código) em memória, sem rede. Guarda
 * o que o servidor guardaria (salt, AUTH, embrulho) para o teste ver o efeito real
 * das chamadas do navegador. Não substitui a suíte PHP do servidor.
 */
import { aadDoEmbrulho } from '@/core/juri/aadEmbrulho';
import { base64ParaBytes, bytesParaBase64, bytesParaBase64Url } from '@/core/juri/base64';
import {
  ITERACOES_PBKDF2,
  TAMANHO_SALT,
  derivar,
  embrulharCek,
  gerarCek,
  type Embrulho
} from '@/core/juri/cifra';

export interface ChamadaFalsa {
  readonly metodo: string;
  readonly caminho: string;
  readonly corpo: Record<string, unknown> | undefined;
  readonly csrfEnviado: string | null;
}

export interface ContaFalsa {
  readonly usuario: string;
  readonly salt: Uint8Array<ArrayBuffer>;
  readonly auth: string;
  readonly embrulho: Embrulho;
  readonly deveTrocarSenha: boolean;
}

const FORMATO_AUTH = /^[A-Za-z0-9_-]{43}$/;

export function criarServidorJuriFalso() {
  const chamadas: ChamadaFalsa[] = [];
  let conta: ContaFalsa | undefined;
  let sessaoAberta = false;
  let contadorCsrf = 0;
  let csrf = 'csrf-inicial';
  let offline = false;
  let iter: number = ITERACOES_PBKDF2;

  function novoCsrf(): string {
    contadorCsrf += 1;
    csrf = `csrf-${contadorCsrf}`;
    return csrf;
  }

  function resposta(status: number, corpo: unknown): Response {
    return new Response(JSON.stringify(corpo), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function erro(status: number, codigo: string, mensagem: string): Response {
    return resposta(status, { ok: false, erro: codigo, mensagem });
  }

  /** Corpo JSON com EXATAMENTE as chaves pedidas (como d26_juri_corpo). Nil se não bater. */
  function corpoExato(
    corpo: Record<string, unknown> | undefined,
    chaves: readonly string[]
  ): Record<string, unknown> | undefined {
    if (corpo === undefined) return undefined;
    const achadas = Object.keys(corpo).sort();
    const esperadas = [...chaves].sort();
    return JSON.stringify(achadas) === JSON.stringify(esperadas) ? corpo : undefined;
  }

  function sessaoJson(): Response {
    const autenticado = sessaoAberta && conta !== undefined;
    return resposta(200, {
      ok: true,
      autenticado,
      usuario: autenticado ? conta?.usuario : null,
      deveTrocarSenha: autenticado ? conta?.deveTrocarSenha : null,
      csrf
    });
  }

  async function responderPost(
    caminho: string,
    corpo: Record<string, unknown> | undefined
  ): Promise<Response> {
    switch (caminho) {
      case 'sal.php': {
        const pedido = corpoExato(corpo, ['usuario']);
        if (pedido === undefined) return erro(400, 'invalido', 'Requisição inválida.');
        const salt =
          conta !== undefined && pedido.usuario === conta.usuario
            ? conta.salt
            : new Uint8Array(TAMANHO_SALT).fill(0xaa);
        return resposta(200, { ok: true, salt: bytesParaBase64(salt), iter, v: 1 });
      }
      case 'entrar.php': {
        const pedido = corpoExato(corpo, ['usuario', 'auth']);
        if (pedido === undefined || !FORMATO_AUTH.test(String(pedido.auth))) {
          return erro(400, 'invalido', 'Requisição inválida.');
        }
        if (conta === undefined || pedido.usuario !== conta.usuario || pedido.auth !== conta.auth) {
          return erro(401, 'credenciais', 'Usuário ou senha inválidos.');
        }
        sessaoAberta = true;
        return resposta(200, {
          ok: true,
          usuario: conta.usuario,
          deveTrocarSenha: conta.deveTrocarSenha,
          csrf: novoCsrf(),
          embrulho: { ...conta.embrulho }
        });
      }
      case 'destravar.php': {
        if (!sessaoAberta || conta === undefined) {
          return erro(401, 'sem-sessao', 'É preciso entrar para continuar.');
        }
        const pedido = corpoExato(corpo, ['auth']);
        if (pedido === undefined || !FORMATO_AUTH.test(String(pedido.auth))) {
          return erro(400, 'invalido', 'Requisição inválida.');
        }
        if (pedido.auth !== conta.auth) return erro(401, 'credenciais', 'A senha não confere.');
        return resposta(200, { ok: true, embrulho: { ...conta.embrulho } });
      }
      case 'trocar-senha.php': {
        if (!sessaoAberta || conta === undefined) {
          return erro(401, 'sem-sessao', 'É preciso entrar para continuar.');
        }
        const pedido = corpoExato(corpo, ['authAtual', 'auth', 'embrulho', 'salt']);
        if (pedido === undefined) return erro(400, 'invalido', 'Requisição inválida.');
        if (pedido.authAtual !== conta.auth) {
          return erro(401, 'senha-atual', 'A senha atual não confere.');
        }
        const pedidoEmbrulho = pedido.embrulho as Embrulho;
        conta = {
          usuario: conta.usuario,
          salt: base64ParaBytes(String(pedido.salt)),
          auth: String(pedido.auth),
          embrulho: { v: pedidoEmbrulho.v, iv: pedidoEmbrulho.iv, ct: pedidoEmbrulho.ct },
          deveTrocarSenha: false
        };
        return resposta(200, { ok: true, csrf: novoCsrf() });
      }
      case 'sair.php': {
        sessaoAberta = false;
        return resposta(200, { ok: true });
      }
      default:
        return erro(404, 'inexistente', 'Caminho inexistente.');
    }
  }

  async function buscar(url: string, init: RequestInit = {}): Promise<Response> {
    if (offline) throw new TypeError('Failed to fetch');
    const caminho = new URL(url, 'http://servidor.local').pathname.replace('/api/juri/', '');
    const metodo = init.method ?? 'GET';
    const cabecalhos = (init.headers ?? {}) as Record<string, string>;
    const csrfEnviado = cabecalhos['X-CSRF-Token'] ?? null;
    const corpo =
      typeof init.body === 'string'
        ? (JSON.parse(init.body) as Record<string, unknown>)
        : undefined;
    chamadas.push({ metodo, caminho, corpo, csrfEnviado });

    if (metodo === 'GET') {
      return caminho === 'sessao.php'
        ? sessaoJson()
        : erro(404, 'inexistente', 'Caminho inexistente.');
    }
    if (corpo !== undefined && 'senha' in corpo) {
      return erro(400, 'senha-no-corpo', 'A senha não vai ao servidor. Use o navegador.');
    }
    if (csrfEnviado !== csrf) return erro(403, 'csrf', 'Sessão expirada. Recarregue a página.');
    return responderPost(caminho, corpo);
  }

  /** Cria a conta como o CLI faria: salt, AUTH, CEK e embrulho. Devolve a CEK para o teste. */
  async function criarConta(
    usuario: string,
    senha: string,
    deveTrocarSenha = false
  ): Promise<globalThis.CryptoKey> {
    const salt = new Uint8Array(TAMANHO_SALT);
    globalThis.crypto.getRandomValues(salt);
    const derivacao = await derivar(senha, salt);
    const cek = await gerarCek();
    const embrulho = await embrulharCek(cek, derivacao.kek, aadDoEmbrulho(usuario, salt));
    conta = {
      usuario,
      salt,
      auth: bytesParaBase64Url(derivacao.auth),
      embrulho,
      deveTrocarSenha
    };
    return cek;
  }

  return {
    buscar,
    chamadas,
    criarConta,
    /** Expira a sessão no servidor (cookie vencido): o próximo POST autenticado leva 401. */
    derrubarSessao(): void {
      sessaoAberta = false;
    },
    definirOffline(valor: boolean): void {
      offline = valor;
    },
    definirIter(valor: number): void {
      iter = valor;
    },
    /** Cópia do estado da conta, para o teste conferir o que o servidor de fato guardou. */
    contaAtual(): ContaFalsa | undefined {
      if (conta === undefined) return undefined;
      return { ...conta, salt: conta.salt.slice() };
    },
    chamadasPara(caminho: string): ChamadaFalsa[] {
      return chamadas.filter((c) => c.caminho === caminho);
    }
  };
}

export type ServidorJuriFalso = ReturnType<typeof criarServidorJuriFalso>;
