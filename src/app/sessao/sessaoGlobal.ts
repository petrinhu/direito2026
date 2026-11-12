import { ref } from 'vue';
import type { ClienteApi } from '@/app/restrito/clienteApi';
import { criarAdministrar, mensagemDeErro } from './administracao';

/**
 * Sessão do site inteiro (plano do CTO do login único, seção 3 e 2.2). Quem
 * decide se a pessoa está logada é o portão no servidor; aqui só guardamos o
 * que o servidor disse (usuário e admin) e tratamos a volta à tela de entrada.
 * Nada disto grava em armazenamento local: o que o navegador guarda é
 * apagado ao sair, nunca preenchido.
 */

/** O que a sessão global precisa do cliente da API. */
export type ClienteSessao = Pick<
  ClienteApi,
  'sessao' | 'sair' | 'trocarSenha' | 'listarUsuarios' | 'acaoUsuario'
>;

/** Tudo que mexe com o navegador passa por aqui, para o teste rodar sem janela (L-50). */
export interface Navegador {
  /** Caminho e query da página atual, sem origem. */
  caminhoAtual(): string;
  /** Troca a página atual (sem entrada no histórico). */
  substituir(url: string): void;
  recarregar(): void;
  /** Apaga caches nomeados e desregistra service workers (Safari anterior a 17). */
  limparCachesESW(): Promise<void>;
}

export interface OpcoesSessaoGlobal {
  readonly cliente: ClienteSessao;
  readonly navegador: Navegador;
  /** Suspende o aviso de sessão vencida; o Sair a chama antes de falar com o servidor. */
  readonly suspenderAviso?: () => void;
}

/**
 * Sessão vencida (401 em qualquer chamada que não seja de login): volta à
 * tela de entrada pelo próprio caminho. Depois do login o portão leva a
 * pessoa de volta a este endereço (destino oculto, plano 1.4).
 */
export function criarAoNaoAutorizado(
  navegador: Pick<Navegador, 'caminhoAtual' | 'substituir'>
): (() => void) & { readonly suspender: () => void } {
  let suspenso = false;
  const avisar = (): void => {
    if (!suspenso) navegador.substituir(navegador.caminhoAtual());
  };
  const suspender = (): void => {
    suspenso = true;
  };
  return Object.assign(avisar, { suspender });
}

export function criarSessaoGlobal({ cliente, navegador, suspenderAviso }: OpcoesSessaoGlobal) {
  const usuario = ref('');
  const admin = ref(false);
  /**
   * Verdadeiro só depois de a sessão ter sido lida com sucesso (logado ou não).
   * Enquanto falso, a página de administração não decide nada: sem isso, um
   * administrador que abre /usuarios direto veria "não encontrado" por um instante.
   */
  const pronta = ref(false);
  /** Verdadeiro quando a última leitura da sessão falhou (rede): a página mostra "Tentar de novo". */
  const falhou = ref(false);

  function guardarSessao(s: { usuario?: string; admin?: boolean }): void {
    usuario.value = s.usuario ?? '';
    admin.value = s.admin === true;
  }

  function esquecerSessao(): void {
    usuario.value = '';
    admin.value = false;
  }

  /** Lê quem está logado no início da página. Sem sessão, não faz nada: o portão já mostra a entrada. */
  async function iniciar(): Promise<void> {
    falhou.value = false;
    try {
      const s = await cliente.sessao();
      if (s.autenticado) guardarSessao(s);
      pronta.value = true;
    } catch {
      // Sem conexão agora: a página oferece tentar de novo (LU-F3.2).
      falhou.value = true;
    }
  }

  /** Chamadas de administração; senha provisória leva ao formulário de troca, em /conta. */
  const administrar = criarAdministrar(cliente, () => navegador.substituir('/conta'));

  /** Troca a própria senha. Erro vira mensagem; a página fica aberta para corrigir. */
  async function trocarSenha(
    atual: string,
    nova: string
  ): Promise<{ readonly ok: true } | { readonly ok: false; readonly mensagem: string }> {
    try {
      await cliente.trocarSenha(atual, nova);
      return { ok: true };
    } catch (erro) {
      return { ok: false, mensagem: mensagemDeErro(erro) };
    }
  }

  /** Aba que volta ao primeiro plano: sem sessão, recarrega (o portão mostra a entrada). Falha de rede não é sessão vencida. */
  async function conferirAoVoltar(): Promise<void> {
    try {
      const s = await cliente.sessao();
      if (!s.autenticado) {
        navegador.recarregar();
        return;
      }
      guardarSessao(s);
    } catch {
      // Sem conexão agora: a próxima volta confere de novo.
    }
  }

  /**
   * Sair: encerra no servidor, apaga caches e registros do navegador, e vai para a raiz. O aviso de sessão
   * vencida é suspenso antes: numa sessão já derrubada o servidor responde 401/403 ao próprio Sair, e o aviso
   * trocaria a página pelo caminho atual numa corrida com a troca para `/`. No Sair, `/` é o destino pedido.
   */
  async function sair(): Promise<void> {
    suspenderAviso?.();
    try {
      await cliente.sair();
    } catch {
      // Falhou no servidor: o local é apagado do mesmo jeito.
    }
    esquecerSessao();
    await navegador.limparCachesESW().catch(() => undefined);
    navegador.substituir('/');
  }

  return {
    usuario,
    admin,
    pronta,
    falhou,
    iniciar,
    conferirAoVoltar,
    sair,
    administrar,
    trocarSenha
  };
}

export type SessaoGlobal = ReturnType<typeof criarSessaoGlobal>;
