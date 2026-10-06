import { ref, shallowRef } from 'vue';
import { validarConteudoRestrito } from '@/core/restrito/validar';
import type { ConteudoRestritoValidado } from '@/core/restrito/tipos';
import { ErroDeApi, type ClienteApi } from './clienteApi';

export type FaseSessao = 'carregando' | 'anonima' | 'trocar-senha' | 'ativa';

export interface FonteTempo {
  /** Chama `callback` a cada `ms`; devolve a função que cancela. */
  definirIntervalo(callback: () => void, ms: number): () => void;
}

const FONTE_TEMPO_REAL: FonteTempo = {
  definirIntervalo(callback, ms) {
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
  }
};

export type ResultadoAdministracao<T> =
  { readonly ok: true; readonly valor: T } | { readonly ok: false; readonly mensagem: string };

/** Chamada autenticada de administração: trata 401 e 403 como o resto da sessão. */
export type Administrar = <T>(
  chamada: (c: ClienteApi) => Promise<T>
) => Promise<ResultadoAdministracao<T>>;

const MENSAGEM_SESSAO_ACABOU = 'Sua sessão terminou. Entre de novo.';
const MENSAGEM_CONTEUDO_INVALIDO =
  'Não foi possível exibir o conteúdo restrito: o arquivo veio num formato inesperado. Avise quem administra o grupo.';

function textoSegundos(n: number): string {
  return n === 1 ? '1 segundo' : `${n} segundos`;
}

function mensagemDeAguarde(segundos: number): string {
  return `Muitas tentativas. Aguarde ${textoSegundos(segundos)} para tentar de novo.`;
}

function mensagemDoErro(erro: ErroDeApi): string {
  switch (erro.codigo) {
    case 'credenciais':
      return 'Usuário ou senha incorretos.';
    case 'senha-atual':
      return 'A senha atual não confere.';
    case 'rede':
      return 'Sem conexão com o servidor. Verifique a internet e tente de novo.';
    case 'aguarde':
      return mensagemDeAguarde(erro.segundos ?? 0);
    default:
      if ((erro.status === 400 || erro.status === 409) && erro.mensagemDoServidor) {
        return erro.mensagemDoServidor;
      }
      if (erro.status === 403) return 'Você não tem permissão para esta ação.';
      return 'Algo deu errado no servidor. Tente de novo em instantes.';
  }
}

interface Opcoes {
  readonly cliente: ClienteApi;
  readonly tempo?: FonteTempo;
}

/**
 * Estado da área restrita. O conteúdo vive SÓ nesta memória (nada de
 * localStorage, IndexedDB nem Cache API) e só é guardado depois de passar
 * por `validarConteudoRestrito`. Sair, sessão vencida (401) ou sair da
 * página apagam tudo.
 */
export function criarSessaoRestrita({ cliente, tempo = FONTE_TEMPO_REAL }: Opcoes) {
  const fase = ref<FaseSessao>('carregando');
  const usuario = ref('');
  const admin = ref(false);
  const conteudo = shallowRef<ConteudoRestritoValidado | undefined>();
  const mensagem = ref('');
  const ocupado = ref(false);
  const carregandoConteudo = ref(false);
  const segundosEspera = ref(0);
  let pararContagem: (() => void) | undefined;

  function pararRelogio(): void {
    pararContagem?.();
    pararContagem = undefined;
  }

  function iniciarContagem(segundos: number): void {
    pararRelogio();
    segundosEspera.value = segundos;
    mensagem.value = mensagemDeAguarde(segundos);
    if (segundos <= 0) return;
    pararContagem = tempo.definirIntervalo(() => {
      segundosEspera.value = Math.max(0, segundosEspera.value - 1);
      if (segundosEspera.value === 0) {
        pararRelogio();
        mensagem.value = '';
      } else {
        mensagem.value = mensagemDeAguarde(segundosEspera.value);
      }
    }, 1000);
  }

  function limparTudo(): void {
    conteudo.value = undefined;
    usuario.value = '';
    admin.value = false;
    carregandoConteudo.value = false;
  }

  function sessaoAcabou(): void {
    limparTudo();
    fase.value = 'anonima';
    mensagem.value = MENSAGEM_SESSAO_ACABOU;
  }

  /** Trata o erro comum a toda chamada autenticada. Devolve a mensagem a mostrar. */
  function tratar(erro: unknown): string {
    if (!(erro instanceof ErroDeApi)) return mensagemDoErro(new ErroDeApi(0, 'desconhecido'));
    if (erro.status === 401 && erro.codigo !== 'senha-atual' && erro.codigo !== 'credenciais') {
      sessaoAcabou();
      return MENSAGEM_SESSAO_ACABOU;
    }
    if (erro.status === 403 && erro.codigo === 'troca-obrigatoria') {
      conteudo.value = undefined;
      fase.value = 'trocar-senha';
      return '';
    }
    return mensagemDoErro(erro);
  }

  async function carregarConteudo(): Promise<void> {
    carregandoConteudo.value = true;
    try {
      const bruto = await cliente.obterConteudo();
      const resultado = validarConteudoRestrito(bruto);
      if (resultado.ok) {
        conteudo.value = resultado.conteudo;
        mensagem.value = '';
      } else {
        conteudo.value = undefined;
        mensagem.value = MENSAGEM_CONTEUDO_INVALIDO;
      }
    } catch (erro) {
      conteudo.value = undefined;
      mensagem.value = tratar(erro);
    } finally {
      carregandoConteudo.value = false;
    }
  }

  async function aposAutenticar(deveTrocarSenha: boolean): Promise<void> {
    if (deveTrocarSenha) {
      fase.value = 'trocar-senha';
      return;
    }
    fase.value = 'ativa';
    await carregarConteudo();
  }

  async function iniciar(): Promise<void> {
    fase.value = 'carregando';
    try {
      const s = await cliente.sessao();
      if (!s.autenticado) {
        fase.value = 'anonima';
        return;
      }
      usuario.value = s.usuario ?? '';
      admin.value = s.admin === true;
      await aposAutenticar(s.deveTrocarSenha === true);
    } catch (erro) {
      fase.value = 'anonima';
      mensagem.value = tratar(erro);
    }
  }

  async function entrar(login: string, senha: string): Promise<void> {
    if (ocupado.value || segundosEspera.value > 0) return;
    ocupado.value = true;
    mensagem.value = '';
    try {
      const r = await cliente.entrar(login, senha);
      usuario.value = r.usuario;
      admin.value = r.admin;
      await aposAutenticar(r.deveTrocarSenha);
    } catch (erro) {
      if (erro instanceof ErroDeApi && erro.codigo === 'aguarde') {
        iniciarContagem(erro.segundos ?? 0);
      } else {
        mensagem.value = tratar(erro);
      }
    } finally {
      ocupado.value = false;
    }
  }

  async function trocarSenha(atual: string, nova: string): Promise<boolean> {
    if (ocupado.value) return false;
    ocupado.value = true;
    mensagem.value = '';
    try {
      await cliente.trocarSenha(atual, nova);
      await aposAutenticar(false);
      return true;
    } catch (erro) {
      mensagem.value = tratar(erro);
      return false;
    } finally {
      ocupado.value = false;
    }
  }

  async function sair(): Promise<void> {
    ocupado.value = true;
    try {
      await cliente.sair();
    } catch {
      // Falhou no servidor: o local é apagado do mesmo jeito.
    } finally {
      pararRelogio();
      segundosEspera.value = 0;
      limparTudo();
      mensagem.value = '';
      fase.value = 'anonima';
      ocupado.value = false;
    }
  }

  /** Apaga o conteúdo da memória sem encerrar a sessão (usado ao sair da página). */
  function descartar(): void {
    pararRelogio();
    conteudo.value = undefined;
  }

  async function administrar<T>(
    chamada: (c: ClienteApi) => Promise<T>
  ): Promise<ResultadoAdministracao<T>> {
    try {
      return { ok: true, valor: await chamada(cliente) };
    } catch (erro) {
      return { ok: false, mensagem: tratar(erro) || 'Não foi possível concluir a ação.' };
    }
  }

  return {
    fase,
    usuario,
    admin,
    conteudo,
    mensagem,
    ocupado,
    carregandoConteudo,
    segundosEspera,
    iniciar,
    entrar,
    trocarSenha,
    sair,
    descartar,
    recarregarConteudo: carregarConteudo,
    administrar
  };
}

export type SessaoRestrita = ReturnType<typeof criarSessaoRestrita>;
