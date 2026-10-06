/**
 * Cliente da API PHP da área restrita (contrato: docs/arquitetura.md,
 * seção "Área restrita"). Só fetch na MESMA origem, JSON, e o token CSRF no
 * cabeçalho X-CSRF-Token em todo POST (padrão "custom header" do OWASP). O
 * token vem de GET sessao.php e é trocado pelo da resposta sempre que ela
 * traz um novo (login e troca de senha regeneram a sessão).
 */

export interface RespostaSessao {
  readonly autenticado: boolean;
  readonly usuario?: string;
  readonly admin?: boolean;
  readonly deveTrocarSenha?: boolean;
}

export interface RespostaEntrar {
  readonly usuario: string;
  readonly admin: boolean;
  readonly deveTrocarSenha: boolean;
}

export interface UsuarioAdmin {
  readonly usuario: string;
  readonly admin: boolean;
  readonly ativo: boolean;
  readonly deveTrocarSenha: boolean;
  readonly criadoEm: string | null;
  readonly ultimoLogin: string | null;
}

export type AcaoUsuario =
  | {
      readonly acao: 'criar' | 'redefinir';
      readonly usuario: string;
      readonly senhaProvisoria?: string;
    }
  | { readonly acao: 'ativar' | 'desativar' | 'excluir'; readonly usuario: string };

export type Buscador = (url: string, init: RequestInit) => Promise<Response>;

/** Erro da API ou do transporte. `codigo` é o da API, ou 'rede' / 'resposta-invalida'. */
export class ErroDeApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    readonly segundos?: number,
    /** Mensagem pt-br do servidor; só vale mostrar em 400 e 409 (nunca expõe dado interno). */
    readonly mensagemDoServidor?: string
  ) {
    super(codigo);
    this.name = 'ErroDeApi';
  }
}

export interface ClienteApi {
  sessao(): Promise<RespostaSessao>;
  entrar(usuario: string, senha: string): Promise<RespostaEntrar>;
  sair(): Promise<void>;
  trocarSenha(senhaAtual: string, senhaNova: string): Promise<void>;
  /** JSON cru: quem chama é obrigado a passar por validarConteudoRestrito. */
  obterConteudo(): Promise<unknown>;
  listarUsuarios(): Promise<readonly UsuarioAdmin[]>;
  acaoUsuario(pedido: AcaoUsuario): Promise<{ readonly senhaProvisoria?: string }>;
}

interface Opcoes {
  readonly buscar?: Buscador;
  readonly base?: string;
  readonly tempoLimiteMs?: number;
}

type Corpo = Record<string, unknown>;

function ehObjeto(valor: unknown): valor is Corpo {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function criarClienteApi(opcoes: Opcoes = {}): ClienteApi {
  const buscar: Buscador = opcoes.buscar ?? ((url, init) => fetch(url, init));
  const base = opcoes.base ?? '/api/';
  const tempoLimite = opcoes.tempoLimiteMs ?? 20_000;
  let csrf: string | undefined;

  async function requisitar(caminho: string, init: RequestInit): Promise<Corpo> {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), tempoLimite);
    let resposta: Response;
    try {
      resposta = await buscar(`${base}${caminho}`, {
        ...init,
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controle.signal
      });
    } catch {
      throw new ErroDeApi(0, 'rede');
    } finally {
      clearTimeout(relogio);
    }
    let corpo: unknown;
    try {
      corpo = await resposta.json();
    } catch {
      throw new ErroDeApi(resposta.status, 'resposta-invalida');
    }
    if (!ehObjeto(corpo)) throw new ErroDeApi(resposta.status, 'resposta-invalida');
    if (!resposta.ok || corpo.ok !== true) {
      if (typeof corpo.erro !== 'string') throw new ErroDeApi(resposta.status, 'resposta-invalida');
      throw new ErroDeApi(
        resposta.status,
        corpo.erro,
        typeof corpo.segundos === 'number' ? corpo.segundos : undefined,
        typeof corpo.mensagem === 'string' ? corpo.mensagem : undefined
      );
    }
    if (typeof corpo.csrf === 'string') csrf = corpo.csrf;
    return corpo;
  }

  const ler = (caminho: string): Promise<Corpo> =>
    requisitar(caminho, { method: 'GET', headers: { Accept: 'application/json' } });

  async function enviar(caminho: string, dados: Corpo): Promise<Corpo> {
    if (csrf === undefined) await ler('sessao.php');
    return requisitar(caminho, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf ?? ''
      },
      body: JSON.stringify(dados)
    });
  }

  return {
    async sessao() {
      const c = await ler('sessao.php');
      return {
        autenticado: c.autenticado === true,
        ...(typeof c.usuario === 'string' ? { usuario: c.usuario } : {}),
        admin: c.admin === true,
        deveTrocarSenha: c.deveTrocarSenha === true
      };
    },
    async entrar(usuario, senha) {
      const c = await enviar('entrar.php', { usuario, senha });
      if (typeof c.usuario !== 'string') throw new ErroDeApi(200, 'resposta-invalida');
      return {
        usuario: c.usuario,
        admin: c.admin === true,
        deveTrocarSenha: c.deveTrocarSenha === true
      };
    },
    async sair() {
      await enviar('sair.php', {});
      csrf = undefined;
    },
    async trocarSenha(senhaAtual, senhaNova) {
      await enviar('trocar-senha.php', { senhaAtual, senhaNova });
    },
    async obterConteudo() {
      const c = await ler('conteudo.php');
      return c.conteudo;
    },
    async listarUsuarios() {
      const c = await ler('usuarios.php');
      if (!Array.isArray(c.usuarios)) throw new ErroDeApi(200, 'resposta-invalida');
      return c.usuarios as UsuarioAdmin[];
    },
    async acaoUsuario(pedido) {
      const c = await enviar('usuarios.php', { ...pedido });
      return typeof c.senhaProvisoria === 'string' ? { senhaProvisoria: c.senhaProvisoria } : {};
    }
  };
}
