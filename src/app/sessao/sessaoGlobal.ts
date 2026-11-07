import { ref } from 'vue';
import type { ClienteApi } from '@/app/restrito/clienteApi';

/**
 * Sessão do site inteiro (plano do CTO do login único, seção 3 e 2.2). Quem
 * decide se a pessoa está logada é o portão no servidor; aqui só guardamos o
 * que o servidor disse (usuário e admin) e tratamos a volta à tela de entrada.
 * Nada disto grava em armazenamento local: o que o navegador guarda é
 * apagado ao sair, nunca preenchido.
 */

/** O que a sessão global precisa do cliente da API. */
export type ClienteSessao = Pick<ClienteApi, 'sessao' | 'sair'>;

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
}

/**
 * Sessão vencida (401 em qualquer chamada que não seja de login): volta à
 * tela de entrada pelo próprio caminho. Depois do login o portão leva a
 * pessoa de volta a este endereço (destino oculto, plano 1.4).
 */
export function criarAoNaoAutorizado(
  navegador: Pick<Navegador, 'caminhoAtual' | 'substituir'>
): () => void {
  return () => navegador.substituir(navegador.caminhoAtual());
}

export function criarSessaoGlobal({ cliente, navegador }: OpcoesSessaoGlobal) {
  const usuario = ref('');
  const admin = ref(false);

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
    const s = await cliente.sessao();
    if (s.autenticado) guardarSessao(s);
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

  /** Sair: encerra no servidor, apaga caches e registros do navegador, e vai para a raiz. */
  async function sair(): Promise<void> {
    try {
      await cliente.sair();
    } catch {
      // Falhou no servidor: o local é apagado do mesmo jeito.
    }
    esquecerSessao();
    await navegador.limparCachesESW().catch(() => undefined);
    navegador.substituir('/');
  }

  return { usuario, admin, iniciar, conferirAoVoltar, sair };
}

export type SessaoGlobal = ReturnType<typeof criarSessaoGlobal>;
