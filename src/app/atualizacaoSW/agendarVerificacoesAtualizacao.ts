const UMA_HORA_MS = 60 * 60 * 1000;

/**
 * Fonte dos três momentos em que vale a pena checar se existe uma versão
 * nova do site: de tempos em tempos, quando a aba volta a ficar visível, e
 * na troca de rota (o leitor já está navegando, então recarregar aqui não
 * interrompe leitura nenhuma). Cada método devolve a função que desliga a
 * própria assinatura, para `agendarVerificacoesAtualizacao` poder
 * devolver um cancelamento único.
 *
 * A implementação real (setInterval, document.visibilitychange,
 * router.afterEach) mora em main.ts, porque depende de `document`/router e
 * não é testável fora de navegador (L-50). Esta função só orquestra os
 * três gatilhos - por isso é testável com uma fonte falsa, em Node puro.
 */
export interface FonteAgendamentoSW {
  definirIntervalo(callback: () => void, intervaloMs: number): () => void;
  aoFicarVisivel(callback: () => void): () => void;
  aoTrocarRota(callback: () => void): () => void;
}

/**
 * Assina os três gatilhos de verificação e devolve uma função que desliga
 * todos de uma vez. Não decide o que fazer quando a verificação encontra
 * versão nova - isso é automático no service worker (registerType
 * 'autoUpdate': skipWaiting + clientsClaim assumem e recarregam a aba
 * sozinhos, ver vite.config.ts e docs/arquitetura.md).
 */
export function agendarVerificacoesAtualizacao(
  verificarAtualizacao: () => void,
  fonte: FonteAgendamentoSW,
  intervaloMs: number = UMA_HORA_MS
): () => void {
  const cancelarIntervalo = fonte.definirIntervalo(verificarAtualizacao, intervaloMs);
  const cancelarVisivel = fonte.aoFicarVisivel(verificarAtualizacao);
  const cancelarRota = fonte.aoTrocarRota(verificarAtualizacao);

  return () => {
    cancelarIntervalo();
    cancelarVisivel();
    cancelarRota();
  };
}
