import { ref, shallowRef } from 'vue';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import type { ConteudoRestritoValidado } from '@/core/restrito/tipos';
import { ErroDeApi, type ClienteApi } from './clienteApi';

/**
 * Tipos do painel de usuários, que ainda mora em `src/ui/area-restrita/`:
 * a implementação de `administrar` sai com a tela de login (LU-F3.3) e volta
 * com o painel na página `/usuarios` (LU-F3.2). Não há função aqui.
 */
export type ResultadoAdministracao<T> =
  { readonly ok: true; readonly valor: T } | { readonly ok: false; readonly mensagem: string };

/** Forma da chamada de administração que o painel de usuários recebe (LU-F3.2 a reimplementa). */
export type Administrar = <T>(
  chamada: (c: ClienteApi) => Promise<T>
) => Promise<ResultadoAdministracao<T>>;

const MENSAGEM_SESSAO_ACABOU = 'Sua sessão terminou. Recarregue a página para continuar.';
const MENSAGEM_TROCA_PENDENTE =
  'Sua senha precisa ser trocada antes de abrir o conteúdo. Recarregue a página para trocar.';
const MENSAGEM_ERRO_GENERICO = 'Algo deu errado no servidor. Tente de novo em instantes.';
const MENSAGEM_CONTEUDO_INVALIDO =
  'Não foi possível exibir o conteúdo restrito: o arquivo veio num formato inesperado. Avise quem administra o grupo.';

function mensagemDoErro(erro: unknown): string {
  if (!(erro instanceof ErroDeApi)) return MENSAGEM_ERRO_GENERICO;
  if (erro.codigo === 'rede') {
    return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
  }
  if (erro.status === 401) return MENSAGEM_SESSAO_ACABOU;
  if (erro.status === 403 && erro.codigo === 'troca-obrigatoria') return MENSAGEM_TROCA_PENDENTE;
  if (erro.status === 403) return 'Você não tem permissão para esta ação.';
  if ((erro.status === 400 || erro.status === 409) && erro.mensagemDoServidor) {
    return erro.mensagemDoServidor;
  }
  return MENSAGEM_ERRO_GENERICO;
}

interface Opcoes {
  readonly cliente: ClienteApi;
}

/**
 * Carga do conteúdo da área restrita. O conteúdo vive SÓ nesta memória (nada
 * de localStorage, IndexedDB nem Cache API) e só é guardado depois de passar
 * por `validarConteudoRestrito`. A entrada no site é do portão do servidor;
 * a sessão vencida (401) é tratada pelo transporte, que leva à tela de entrada.
 */
export function criarSessaoRestrita({ cliente }: Opcoes) {
  const carregando = ref(true);
  const conteudo = shallowRef<ConteudoRestritoValidado | undefined>();
  const mensagem = ref('');

  /** Carrega (ou recarrega, em "Tentar de novo") o conteúdo validado. */
  async function carregar(): Promise<void> {
    carregando.value = true;
    mensagem.value = '';
    try {
      const bruto = await cliente.obterConteudo();
      const resultado = validarConteudoRestrito(bruto);
      if (resultado.ok) {
        conteudo.value = resultado.conteudo;
      } else {
        conteudo.value = undefined;
        mensagem.value = MENSAGEM_CONTEUDO_INVALIDO;
      }
    } catch (erro) {
      conteudo.value = undefined;
      mensagem.value = mensagemDoErro(erro);
    } finally {
      carregando.value = false;
    }
  }

  /** Apaga o conteúdo da memória (usado ao sair da página). */
  function descartar(): void {
    conteudo.value = undefined;
  }

  return { carregando, conteudo, mensagem, carregar, descartar };
}

export type SessaoRestrita = ReturnType<typeof criarSessaoRestrita>;
