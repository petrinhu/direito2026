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
  /** Devolve false quando a consulta não foi à rede (sem login): não ocupa o intervalo. */
  consultar(): boolean | void;
  intervaloMinimoMs?: number;
}

export interface VigiaVersaoPublicada {
  /** Liga o gatilho de aba que volta a ficar visível. Devolve a função que desliga. */
  iniciar(): () => void;
  /** Chamado a cada troca de rota. A primeira é a carga da página e também consulta (decisão 74). */
  aoTrocarRota(): void;
}

/**
 * Vigia de D2: consulta só quando a aba está visível e o intervalo mínimo passou. Sem
 * timer (D3 opção A): nada acontece sem gatilho. A carga consulta (decisão 74), mas não
 * ocupa o intervalo: a troca logo em seguida ainda consulta.
 */
export function criarVigiaVersaoPublicada(opcoes: OpcoesVigia): VigiaVersaoPublicada {
  const { relogio, documento, consultar } = opcoes;
  const intervalo = opcoes.intervaloMinimoMs ?? INTERVALO_MINIMO_CONSULTA_MS;
  let ultimaConsulta: number | null = null;
  let cargaFeita = false;

  /**
   * A carga (primeira chamada) consulta, mas NÃO ocupa o intervalo: a troca logo em seguida
   * ainda consulta (QA-F12, teste de 360 px: a consulta da carga bloqueava a aba que volta).
   */
  function disparar(carga: boolean): void {
    if (documento.visibilityState !== 'visible') return;
    const agora = relogio.agora();
    if (!carga && ultimaConsulta !== null && agora - ultimaConsulta < intervalo) return;
    const pediu = consultar();
    if (!carga && pediu !== false) ultimaConsulta = agora;
  }

  return {
    iniciar() {
      const ouvinte = () => disparar(false);
      documento.addEventListener('visibilitychange', ouvinte);
      return () => documento.removeEventListener('visibilitychange', ouvinte);
    },
    aoTrocarRota() {
      const carga = !cargaFeita;
      cargaFeita = true;
      disparar(carga);
    }
  };
}
