/**
 * Cliente da API da área da Júri (contrato: plano do CTO, seção 1). Uma função por
 * endpoint, sobre o transporte que a área restrita já usa (JSON e CSRF em
 * ../restrito/transporte.ts). Nenhum corpo tem campo `senha`: o navegador manda só o
 * AUTH (base64url) e, na troca, o salt e o embrulho novos.
 */
import { criarTransporte, ErroDeApi, type Buscador, type Corpo } from '../restrito/transporte';
import { base64ParaBytes } from '@/core/juri/base64';
import { criarBuscadorImagemJuri } from './buscadorImagem';

export { ErroDeApi } from '../restrito/transporte';
export type { Buscador } from '../restrito/transporte';

const BASE_PADRAO = '/api/juri/';

export interface EmbrulhoRemoto {
  readonly v: number;
  readonly iv: string;
  readonly ct: string;
}

export interface RespostaSal {
  readonly salt: string;
  readonly iter: number;
  readonly v: number;
}

export interface RespostaEntrarJuri {
  readonly usuario: string;
  readonly deveTrocarSenha: boolean;
  readonly embrulho: EmbrulhoRemoto;
}

export interface RespostaDestravarJuri {
  readonly embrulho: EmbrulhoRemoto;
}

export interface RespostaSessaoJuri {
  readonly autenticado: boolean;
  readonly usuario: string | null;
  readonly deveTrocarSenha: boolean | null;
}

export interface PedidoTrocarSenhaJuri {
  /** AUTH atual (base64url), que prova a senha atual sem enviá-la. */
  readonly authAtual: string;
  /** Salt NOVO (base64 padrão, 16 bytes). */
  readonly salt: string;
  /** AUTH novo (base64url). */
  readonly auth: string;
  /** Embrulho da mesma CEK, feito com a KEK nova. */
  readonly embrulho: EmbrulhoRemoto;
}

export interface ClienteJuri {
  /** JSON cru do conteúdo (`conteudo` do envelope). Quem chama valida antes de usar. */
  conteudo(): Promise<unknown>;
  /** Bytes binários da imagem cifrada (formato v1), tal como o servidor entregou. */
  imagem(id: string): Promise<Uint8Array<ArrayBuffer>>;
  sal(usuario: string): Promise<RespostaSal>;
  entrar(usuario: string, auth: string): Promise<RespostaEntrarJuri>;
  destravar(auth: string): Promise<RespostaDestravarJuri>;
  sessao(): Promise<RespostaSessaoJuri>;
  trocarSenha(pedido: PedidoTrocarSenhaJuri): Promise<void>;
  sair(): Promise<void>;
}

export interface OpcoesClienteJuri {
  readonly buscar?: Buscador;
  readonly base?: string;
  readonly tempoLimiteMs?: number;
}

function respostaInvalida(): never {
  throw new ErroDeApi(200, 'resposta-invalida');
}

function textoDe(corpo: Corpo, chave: string): string {
  const valor = corpo[chave];
  return typeof valor === 'string' ? valor : respostaInvalida();
}

function numeroDe(corpo: Corpo, chave: string): number {
  const valor = corpo[chave];
  return typeof valor === 'number' ? valor : respostaInvalida();
}

function booleanoDe(corpo: Corpo, chave: string): boolean {
  const valor = corpo[chave];
  return typeof valor === 'boolean' ? valor : respostaInvalida();
}

/** Contrato do embrulho (plano do CTO, seção 1): iv de 12 B; ct de 48 B (CEK de 32 B + tag de 16 B). */
const IV_EMBRULHO_BYTES = 12;
const CT_EMBRULHO_BYTES = 48;

function tamanhoBase64Confere(texto: string, bytes: number): boolean {
  try {
    return base64ParaBytes(texto).byteLength === bytes;
  } catch {
    return false;
  }
}

/** Só {v:1, iv, ct}, sem campo extra, com os tamanhos do contrato. Qualquer desvio é resposta-invalida. */
function embrulhoDe(corpo: Corpo): EmbrulhoRemoto {
  const bruto = corpo.embrulho;
  if (typeof bruto !== 'object' || bruto === null || Array.isArray(bruto))
    return respostaInvalida();
  const campos = bruto as Record<string, unknown>;
  if (JSON.stringify(Object.keys(campos).sort()) !== JSON.stringify(['ct', 'iv', 'v'])) {
    return respostaInvalida();
  }
  if (campos.v !== 1 || typeof campos.iv !== 'string' || typeof campos.ct !== 'string') {
    return respostaInvalida();
  }
  if (
    !tamanhoBase64Confere(campos.iv, IV_EMBRULHO_BYTES) ||
    !tamanhoBase64Confere(campos.ct, CT_EMBRULHO_BYTES)
  ) {
    return respostaInvalida();
  }
  return { v: 1, iv: campos.iv, ct: campos.ct };
}

export function criarClienteJuri(opcoes: OpcoesClienteJuri = {}): ClienteJuri {
  const transporte = criarTransporte({
    base: opcoes.base ?? BASE_PADRAO,
    ...(opcoes.buscar ? { buscar: opcoes.buscar } : {}),
    ...(opcoes.tempoLimiteMs !== undefined ? { tempoLimiteMs: opcoes.tempoLimiteMs } : {})
  });
  const { ler, enviar } = transporte;
  const buscarImagem = criarBuscadorImagemJuri({
    base: opcoes.base ?? BASE_PADRAO,
    ...(opcoes.buscar ? { buscar: opcoes.buscar } : {}),
    ...(opcoes.tempoLimiteMs !== undefined ? { tempoLimiteMs: opcoes.tempoLimiteMs } : {})
  });

  return {
    async conteudo() {
      const corpo = await ler('conteudo.php');
      const conteudo = corpo.conteudo;
      if (typeof conteudo !== 'object' || conteudo === null || Array.isArray(conteudo)) {
        return respostaInvalida();
      }
      return conteudo;
    },
    imagem: buscarImagem,
    async sal(usuario) {
      const corpo = await enviar('sal.php', { usuario });
      return {
        salt: textoDe(corpo, 'salt'),
        iter: numeroDe(corpo, 'iter'),
        v: numeroDe(corpo, 'v')
      };
    },
    async entrar(usuario, auth) {
      const corpo = await enviar('entrar.php', { usuario, auth });
      return {
        usuario: textoDe(corpo, 'usuario'),
        deveTrocarSenha: booleanoDe(corpo, 'deveTrocarSenha'),
        embrulho: embrulhoDe(corpo)
      };
    },
    async destravar(auth) {
      const corpo = await enviar('destravar.php', { auth });
      return { embrulho: embrulhoDe(corpo) };
    },
    async sessao() {
      const corpo = await ler('sessao.php');
      return {
        autenticado: corpo.autenticado === true,
        usuario: typeof corpo.usuario === 'string' ? corpo.usuario : null,
        deveTrocarSenha: typeof corpo.deveTrocarSenha === 'boolean' ? corpo.deveTrocarSenha : null
      };
    },
    async trocarSenha(pedido) {
      await enviar('trocar-senha.php', {
        authAtual: pedido.authAtual,
        salt: pedido.salt,
        auth: pedido.auth,
        embrulho: { v: pedido.embrulho.v, iv: pedido.embrulho.iv, ct: pedido.embrulho.ct }
      });
    },
    async sair() {
      try {
        await enviar('sair.php', {});
      } finally {
        transporte.esquecerToken();
      }
    }
  };
}
