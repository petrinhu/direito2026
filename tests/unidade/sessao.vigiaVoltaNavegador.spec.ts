import { describe, expect, it, vi } from 'vitest';
import {
  criarFonteVoltaNavegador,
  iniciarVigiaVoltaNavegador
} from '@/app/sessao/vigiaVoltaNavegador';

type Ouvinte = (evento: unknown) => void;

/** Registro de ouvintes por tipo de evento: dispara como o navegador dispararia. */
function criarAlvoDeEventos() {
  const ouvintes = new Map<string, Set<Ouvinte>>();
  return {
    addEventListener: vi.fn((tipo: string, ouvinte: Ouvinte) => {
      const conjunto = ouvintes.get(tipo) ?? new Set<Ouvinte>();
      conjunto.add(ouvinte);
      ouvintes.set(tipo, conjunto);
    }),
    removeEventListener: vi.fn((tipo: string, ouvinte: Ouvinte) => {
      ouvintes.get(tipo)?.delete(ouvinte);
    }),
    disparar(tipo: string, evento: unknown = {}) {
      for (const ouvinte of [...(ouvintes.get(tipo) ?? [])]) ouvinte(evento);
    },
    quantos(tipo: string): number {
      return ouvintes.get(tipo)?.size ?? 0;
    }
  };
}

function criarAmbiente() {
  const janela = criarAlvoDeEventos();
  const documento = Object.assign(criarAlvoDeEventos(), { visibilityState: 'visible' });
  const navegador = { recarregar: vi.fn() };
  const sessao = { conferirAoVoltar: vi.fn(async () => undefined) };
  return { janela, documento, navegador, sessao };
}

describe('vigia de volta do navegador (pageshow e aba que volta)', () => {
  it('pageshow com persisted (vindo do cache, botão Voltar depois de sair) recarrega', () => {
    const { janela, documento, navegador, sessao } = criarAmbiente();
    iniciarVigiaVoltaNavegador(criarFonteVoltaNavegador(janela, documento), { navegador, sessao });

    janela.disparar('pageshow', { persisted: true });

    expect(navegador.recarregar).toHaveBeenCalledOnce();
  });

  it('pageshow sem persisted não recarrega', () => {
    const { janela, documento, navegador, sessao } = criarAmbiente();
    iniciarVigiaVoltaNavegador(criarFonteVoltaNavegador(janela, documento), { navegador, sessao });

    janela.disparar('pageshow', { persisted: false });

    expect(navegador.recarregar).not.toHaveBeenCalled();
    expect(sessao.conferirAoVoltar).not.toHaveBeenCalled();
  });

  it('aba que fica oculta não pede conferência de sessão', () => {
    const { janela, documento, navegador, sessao } = criarAmbiente();
    iniciarVigiaVoltaNavegador(criarFonteVoltaNavegador(janela, documento), { navegador, sessao });

    documento.visibilityState = 'hidden';
    documento.disparar('visibilitychange');

    expect(sessao.conferirAoVoltar).not.toHaveBeenCalled();
  });

  it('aba que volta a ficar visível pede a conferência de sessão', () => {
    const { janela, documento, navegador, sessao } = criarAmbiente();
    iniciarVigiaVoltaNavegador(criarFonteVoltaNavegador(janela, documento), { navegador, sessao });

    documento.visibilityState = 'hidden';
    documento.disparar('visibilitychange');
    documento.visibilityState = 'visible';
    documento.disparar('visibilitychange');

    expect(sessao.conferirAoVoltar).toHaveBeenCalledOnce();
    expect(navegador.recarregar).not.toHaveBeenCalled();
  });

  it('a função devolvida tira os dois ouvintes: depois dela, nada mais dispara', () => {
    const { janela, documento, navegador, sessao } = criarAmbiente();
    const parar = iniciarVigiaVoltaNavegador(criarFonteVoltaNavegador(janela, documento), {
      navegador,
      sessao
    });

    parar();
    janela.disparar('pageshow', { persisted: true });
    documento.disparar('visibilitychange');

    expect(janela.quantos('pageshow')).toBe(0);
    expect(documento.quantos('visibilitychange')).toBe(0);
    expect(navegador.recarregar).not.toHaveBeenCalled();
    expect(sessao.conferirAoVoltar).not.toHaveBeenCalled();
  });
});
