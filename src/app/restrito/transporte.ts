/**
 * Transporte da área restrita: só fetch na MESMA origem, JSON, e o token CSRF
 * no cabeçalho X-CSRF-Token em todo POST (padrão "custom header" do OWASP).
 * O token vem de GET sessao.php e é trocado pelo da resposta sempre que ela
 * traz um novo. Mora num módulo próprio porque a área restrita e a da Júri
 * usam exatamente o mesmo transporte: duas cópias que divergem são regressão
 * de segurança.
 */

export type Buscador = (url: string, init: RequestInit) => Promise<Response>;

export type Corpo = Record<string, unknown>;

export interface OpcoesTransporte {
  readonly buscar?: Buscador;
  readonly base?: string;
  readonly tempoLimiteMs?: number;
}

export interface Transporte {
  ler(caminho: string): Promise<Corpo>;
  enviar(caminho: string, dados: Corpo): Promise<Corpo>;
  /** Esquece o token CSRF: o próximo POST busca sessao.php antes de enviar. */
  esquecerToken(): void;
}

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

function ehObjeto(valor: unknown): valor is Corpo {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

export function criarTransporte(opcoes: OpcoesTransporte = {}): Transporte {
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
    ler,
    enviar,
    esquecerToken() {
      csrf = undefined;
    }
  };
}
