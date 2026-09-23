import { describe, expect, it, vi } from 'vitest';
import {
  agendarVerificacoesAtualizacao,
  type FonteAgendamentoSW
} from '@/app/atualizacaoSW/agendarVerificacoesAtualizacao';

/**
 * Cobre a lógica que decide QUANDO checar se há versão nova do service
 * worker (pendência do líder, 23/09/2026): periodicamente, ao voltar a
 * ficar visível, e na troca de rota. O reload em si fica a cargo do
 * próprio plugin (registerType 'autoUpdate' + skipWaiting/clientsClaim no
 * service worker gerado) e não é testável aqui sem navegador (L-50) - o
 * que esta suíte prova é que os três gatilhos disparam a checagem.
 */
function criarFonteFalsa() {
  const callbacks: {
    intervalo?: () => void;
    visivel?: () => void;
    rota?: () => void;
  } = {};
  const cancelarIntervalo = vi.fn();
  const cancelarVisivel = vi.fn();
  const cancelarRota = vi.fn();

  const fonte: FonteAgendamentoSW = {
    definirIntervalo(callback) {
      callbacks.intervalo = callback;
      return cancelarIntervalo;
    },
    aoFicarVisivel(callback) {
      callbacks.visivel = callback;
      return cancelarVisivel;
    },
    aoTrocarRota(callback) {
      callbacks.rota = callback;
      return cancelarRota;
    }
  };

  return { fonte, callbacks, cancelarIntervalo, cancelarVisivel, cancelarRota };
}

describe('agendarVerificacoesAtualizacao', () => {
  it('assina os três gatilhos (intervalo, aba visível, troca de rota)', () => {
    const verificar = vi.fn();
    const { fonte, callbacks } = criarFonteFalsa();

    agendarVerificacoesAtualizacao(verificar, fonte);

    expect(callbacks.intervalo).toBeTypeOf('function');
    expect(callbacks.visivel).toBeTypeOf('function');
    expect(callbacks.rota).toBeTypeOf('function');
  });

  it('cada gatilho, ao disparar, chama a verificação', () => {
    const verificar = vi.fn();
    const { fonte, callbacks } = criarFonteFalsa();

    agendarVerificacoesAtualizacao(verificar, fonte);
    callbacks.intervalo?.();
    callbacks.visivel?.();
    callbacks.rota?.();

    expect(verificar).toHaveBeenCalledTimes(3);
  });

  it('usa 1 hora como intervalo padrão de verificação periódica', () => {
    const verificar = vi.fn();
    const { fonte } = criarFonteFalsa();
    const intervaloRecebido = vi.fn();
    const fonteComEspiao: FonteAgendamentoSW = {
      ...fonte,
      definirIntervalo(callback, ms) {
        intervaloRecebido(ms);
        return fonte.definirIntervalo(callback, ms);
      }
    };

    agendarVerificacoesAtualizacao(verificar, fonteComEspiao);

    expect(intervaloRecebido).toHaveBeenCalledWith(60 * 60 * 1000);
  });

  it('aceita intervalo customizado', () => {
    const verificar = vi.fn();
    const { fonte } = criarFonteFalsa();
    const intervaloRecebido = vi.fn();
    const fonteComEspiao: FonteAgendamentoSW = {
      ...fonte,
      definirIntervalo(callback, ms) {
        intervaloRecebido(ms);
        return fonte.definirIntervalo(callback, ms);
      }
    };

    agendarVerificacoesAtualizacao(verificar, fonteComEspiao, 5000);

    expect(intervaloRecebido).toHaveBeenCalledWith(5000);
  });

  it('a função de cancelamento devolvida desliga os três gatilhos', () => {
    const verificar = vi.fn();
    const { fonte, cancelarIntervalo, cancelarVisivel, cancelarRota } = criarFonteFalsa();

    const cancelar = agendarVerificacoesAtualizacao(verificar, fonte);
    cancelar();

    expect(cancelarIntervalo).toHaveBeenCalledTimes(1);
    expect(cancelarVisivel).toHaveBeenCalledTimes(1);
    expect(cancelarRota).toHaveBeenCalledTimes(1);
  });
});
