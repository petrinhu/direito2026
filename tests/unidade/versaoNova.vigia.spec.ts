import { describe, expect, it } from 'vitest';
import {
  criarVigiaVersaoPublicada,
  type DocumentoVisivel
} from '@/app/versaoNova/vigiaVersaoPublicada';

/**
 * AV-F7, decisão D2 (plano 3.1): consulta só em troca de rota e em aba que volta a ficar
 * visível; intervalo mínimo de 60 s; nada na carga; nada em aba oculta.
 * Relógio e documento falsos: sem janela, sem timer (D3 opção A).
 */
function relogioFalso(inicio = 1_000_000) {
  let agora = inicio;
  return { agora: () => agora, avancar: (ms: number) => (agora += ms) };
}

function documentoFalso(estado: 'visible' | 'hidden' = 'visible') {
  const ouvintes: Array<() => void> = [];
  const doc: DocumentoVisivel & { mudar(e: 'visible' | 'hidden'): void; ouvintes: number } = {
    visibilityState: estado,
    addEventListener: (_tipo, ouvinte) => ouvintes.push(ouvinte),
    removeEventListener: (_tipo, ouvinte) => {
      const i = ouvintes.indexOf(ouvinte);
      if (i >= 0) ouvintes.splice(i, 1);
    },
    mudar(novo) {
      doc.visibilityState = novo;
      for (const o of [...ouvintes]) o();
    },
    get ouvintes() {
      return ouvintes.length;
    }
  };
  return doc;
}

function montar(estado: 'visible' | 'hidden' = 'visible') {
  const relogio = relogioFalso();
  const documento = documentoFalso(estado);
  let consultas = 0;
  const vigia = criarVigiaVersaoPublicada({
    relogio,
    documento,
    consultar: () => {
      consultas++;
    }
  });
  return { relogio, documento, vigia, consultas: () => consultas };
}

describe('criarVigiaVersaoPublicada', () => {
  it('nenhuma consulta sem gatilho, mesmo com 30 min de relógio falso', () => {
    const { relogio, vigia, consultas } = montar();
    vigia.iniciar();
    relogio.avancar(30 * 60_000);
    expect(consultas()).toBe(0);
  });

  it('a primeira troca de rota é a carga da página e não consulta', () => {
    const { vigia, consultas } = montar();
    vigia.iniciar();
    vigia.aoTrocarRota();
    expect(consultas()).toBe(0);
  });

  it('troca de rota depois da carga consulta', () => {
    const { vigia, consultas } = montar();
    vigia.iniciar();
    vigia.aoTrocarRota();
    vigia.aoTrocarRota();
    expect(consultas()).toBe(1);
  });

  it('aba que volta a ficar visível consulta', () => {
    const { documento, vigia, consultas } = montar('hidden');
    vigia.iniciar();
    documento.mudar('visible');
    expect(consultas()).toBe(1);
  });

  it('troca de rota com aba oculta não consulta', () => {
    const { documento, vigia, consultas } = montar();
    vigia.iniciar();
    vigia.aoTrocarRota();
    vigia.aoTrocarRota();
    documento.mudar('hidden');
    documento.visibilityState = 'hidden';
    vigia.aoTrocarRota();
    expect(consultas()).toBe(1);
  });

  it('intervalo mínimo de 60 s entre duas consultas', () => {
    const { relogio, vigia, consultas } = montar();
    vigia.iniciar();
    vigia.aoTrocarRota();
    vigia.aoTrocarRota();
    relogio.avancar(30_000);
    vigia.aoTrocarRota();
    expect(consultas()).toBe(1);
    relogio.avancar(30_000);
    vigia.aoTrocarRota();
    expect(consultas()).toBe(2);
  });

  it('dispensar o vigia remove o ouvinte de visibilidade', () => {
    const { documento, vigia } = montar();
    const parar = vigia.iniciar();
    expect(documento.ouvintes).toBe(1);
    parar();
    expect(documento.ouvintes).toBe(0);
  });
});
