/**
 * Cliente da API PHP da área restrita (contrato: docs/arquitetura.md,
 * seção "Área restrita"). O transporte (fetch na mesma origem, JSON e token
 * CSRF) mora em ./transporte.ts; aqui fica só o contrato dos endpoints.
 */
import { criarTransporte, ErroDeApi, type OpcoesTransporte } from './transporte';

export { ErroDeApi, type Buscador } from './transporte';

export interface RespostaSessao {
  readonly autenticado: boolean;
  readonly usuario?: string;
  readonly admin?: boolean;
  readonly deveTrocarSenha?: boolean;
}

export interface UsuarioAdmin {
  readonly usuario: string;
  readonly admin: boolean;
  readonly ativo: boolean;
  readonly deveTrocarSenha: boolean;
  readonly criadoEm: string | null;
  readonly ultimoLogin: string | null;
  /** Estado do convite por link, decidido pelo servidor (nunca pelo relógio do navegador). Ausente em servidor antigo. */
  readonly convite?: 'pendente' | 'vencido' | null;
  /** Fim do prazo do convite, em epoch de segundos. */
  readonly conviteExpiraEm?: number | null;
}

export type AcaoUsuario = {
  readonly acao: 'criar' | 'redefinir' | 'ativar' | 'desativar' | 'excluir';
  readonly usuario: string;
};

/** Caminho do convite que o servidor devolve ao criar e ao redefinir: o painel compõe o endereço com `location.origin`. */
const CAMINHO_CONVITE = /^\/api\/convite\.php\?t=[0-9a-f]{64}$/;

export interface ClienteApi {
  sessao(): Promise<RespostaSessao>;
  sair(): Promise<void>;
  trocarSenha(senhaAtual: string, senhaNova: string): Promise<void>;
  /** JSON cru: quem chama é obrigado a passar por validarConteudoRestrito. */
  obterConteudo(): Promise<unknown>;
  /** JSON cru da Júri (juri/conteudo.php): mesma sessão, sem senha; quem chama valida antes de usar. */
  obterConteudoJuri(): Promise<unknown>;
  listarUsuarios(): Promise<readonly UsuarioAdmin[]>;
  acaoUsuario(pedido: AcaoUsuario): Promise<{ readonly convite?: string }>;
}

export function criarClienteApi(opcoes: OpcoesTransporte = {}): ClienteApi {
  const transporte = criarTransporte(opcoes);
  const { ler, enviar } = transporte;

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
    async sair() {
      await enviar('sair.php', {});
      transporte.esquecerToken();
    },
    async trocarSenha(senhaAtual, senhaNova) {
      await enviar('trocar-senha.php', { senhaAtual, senhaNova });
    },
    async obterConteudo() {
      const c = await ler('conteudo.php');
      return c.conteudo;
    },
    async obterConteudoJuri() {
      const c = await ler('juri/conteudo.php');
      return c.conteudo;
    },
    async listarUsuarios() {
      const c = await ler('usuarios.php');
      if (!Array.isArray(c.usuarios)) throw new ErroDeApi(200, 'resposta-invalida');
      return c.usuarios as UsuarioAdmin[];
    },
    async acaoUsuario(pedido) {
      const c = await enviar('usuarios.php', { ...pedido });
      if (c.convite === undefined) return {};
      if (typeof c.convite !== 'string' || !CAMINHO_CONVITE.test(c.convite)) {
        throw new ErroDeApi(200, 'resposta-invalida');
      }
      return { convite: c.convite };
    }
  };
}
