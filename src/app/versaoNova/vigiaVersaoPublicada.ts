/** Intervalo mínimo entre duas consultas a /versao.json (plano 3.1, D2). */
export const INTERVALO_MINIMO_CONSULTA_MS = 60_000;

export interface DocumentoVisivel {
  readonly visibilityState: string;
  addEventListener(tipo: 'visibilitychange', ouvinte: () => void): void;
  removeEventListener(tipo: 'visibilitychange', ouvinte: () => void): void;
}

export interface RelogioVigia {
  agora(): number;
}

export interface OpcoesVigia {
  relogio: RelogioVigia;
  documento: DocumentoVisivel;
  consultar(): void;
  intervaloMinimoMs?: number;
}

export interface VigiaVersaoPublicada {
  /** Liga o gatilho de aba que volta a ficar visível. Devolve a função que desliga. */
  iniciar(): () => void;
  /** Chamado a cada troca de rota. A primeira é a carga da página e não consulta. */
  aoTrocarRota(): void;
}

/**
 * Vigia de D2: consulta só quando a aba está visível e o intervalo mínimo passou. Sem
 * timer (D3 opção A): nada acontece sem gatilho. Não consulta na carga.
 */
export function criarVigiaVersaoPublicada(opcoes: OpcoesVigia): VigiaVersaoPublicada {
  const { relogio, documento, consultar } = opcoes;
  const intervalo = opcoes.intervaloMinimoMs ?? INTERVALO_MINIMO_CONSULTA_MS;
  let cargaFeita = false;
  let ultimaConsulta: number | null = null;

  function disparar(): void {
    if (documento.visibilityState !== 'visible') return;
    const agora = relogio.agora();
    if (ultimaConsulta !== null && agora - ultimaConsulta < intervalo) return;
    ultimaConsulta = agora;
    consultar();
  }

  return {
    iniciar() {
      const ouvinte = () => disparar();
      documento.addEventListener('visibilitychange', ouvinte);
      return () => documento.removeEventListener('visibilitychange', ouvinte);
    },
    aoTrocarRota() {
      if (!cargaFeita) {
        cargaFeita = true;
        return;
      }
      disparar();
    }
  };
}
