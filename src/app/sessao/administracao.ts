import { ErroDeApi, type ClienteApi } from '@/app/restrito';

/**
 * Chamada autenticada da administração de usuários, usada pela sessão global
 * (LU-F3.2). Mesma forma do `Administrar` da área restrita, para o painel não
 * mudar; mora aqui porque a área restrita deixa de ser dona da sessão (plano do
 * CTO, 4.3).
 */
export { loginValido, type ClienteApi, type UsuarioAdmin } from '@/app/restrito';

export type ResultadoAdministracao<T> =
  { readonly ok: true; readonly valor: T } | { readonly ok: false; readonly mensagem: string };

/** Só o que a administração usa: a lista e as ações sobre usuários. */
export type ClienteAdministracao = Pick<ClienteApi, 'listarUsuarios' | 'acaoUsuario'>;

export type Administrar = <T>(
  chamada: (c: ClienteAdministracao) => Promise<T>
) => Promise<ResultadoAdministracao<T>>;

const MENSAGEM_PADRAO = 'Não foi possível concluir a ação.';
const MENSAGEM_SESSAO_ACABOU = 'Sua sessão terminou. Entre de novo.';
const MENSAGEM_TROCA_OBRIGATORIA = 'É preciso trocar a senha antes de continuar.';

/** Texto em pt-br para o erro de uma ação; nunca mostra o código bruto. */
export function mensagemDeErro(erro: unknown): string {
  if (!(erro instanceof ErroDeApi)) return MENSAGEM_PADRAO;
  if (erro.status === 401 && erro.codigo !== 'senha-atual' && erro.codigo !== 'credenciais') {
    return MENSAGEM_SESSAO_ACABOU;
  }
  switch (erro.codigo) {
    case 'senha-atual':
      return 'A senha atual não confere.';
    case 'credenciais':
      return 'Usuário ou senha incorretos.';
    case 'rede':
      return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
    case 'troca-obrigatoria':
      return MENSAGEM_TROCA_OBRIGATORIA;
    default:
      // O servidor só fala em 400 e 409 (ver ErroDeApi); o resto cai na mensagem padrão.
      return (erro.status === 400 || erro.status === 409) && erro.mensagemDoServidor
        ? erro.mensagemDoServidor
        : MENSAGEM_PADRAO;
  }
}

async function executar<T>(
  cliente: ClienteAdministracao,
  chamada: (c: ClienteAdministracao) => Promise<T>,
  aoTrocaObrigatoria: () => void
): Promise<ResultadoAdministracao<T>> {
  try {
    return { ok: true, valor: await chamada(cliente) };
  } catch (erro) {
    if (erro instanceof ErroDeApi && erro.status === 403 && erro.codigo === 'troca-obrigatoria') {
      aoTrocaObrigatoria();
    }
    return { ok: false, mensagem: mensagemDeErro(erro) };
  }
}

/**
 * `aoTrocaObrigatoria` leva a pessoa ao formulário de troca quando o servidor
 * recusa a chamada por senha provisória (sessao.php, troca-obrigatoria).
 */
export function criarAdministrar(
  cliente: ClienteAdministracao,
  aoTrocaObrigatoria: () => void
): Administrar {
  return <T>(chamada: (c: ClienteAdministracao) => Promise<T>) =>
    executar(cliente, chamada, aoTrocaObrigatoria);
}
