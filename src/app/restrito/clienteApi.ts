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
      transporte.esquecerToken();
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
