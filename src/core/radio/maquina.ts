/**
 * Máquina de estados do tocador (item 42 e 44 da ratificação: tocar e parar, sem pausa que
 * "continua de onde parou", porque a rádio é ao vivo). Função pura: não toca em áudio. Devolve o
 * próximo estado e, no máximo, um comando que a store executa no elemento <audio>.
 *
 * Invariante de LGPD: o comando `conectar` só sai quando o consentimento já existe. Sem ele, tocar
 * leva ao aviso (`pedindoConsentimento`), e nada conecta antes do clique de "Tocar mesmo assim".
 */

export type EstadoRadio = 'parado' | 'pedindoConsentimento' | 'conectando' | 'tocando' | 'erro';

export type EventoRadio =
  'tocar' | 'parar' | 'consentir' | 'cancelar' | 'aguardar' | 'tocando' | 'falhar';

export type ComandoRadio = 'conectar' | 'desconectar';

export interface ResultadoTransicao {
  readonly estado: EstadoRadio;
  readonly comando?: ComandoRadio;
}

export function transicionar(
  estado: EstadoRadio,
  evento: EventoRadio,
  consentido: boolean
): ResultadoTransicao {
  switch (evento) {
    case 'tocar':
      if (estado === 'parado' || estado === 'erro') {
        return consentido
          ? { estado: 'conectando', comando: 'conectar' }
          : { estado: 'pedindoConsentimento' };
      }
      return { estado };

    case 'consentir':
      return estado === 'pedindoConsentimento'
        ? { estado: 'conectando', comando: 'conectar' }
        : { estado };

    case 'cancelar':
      return estado === 'pedindoConsentimento' ? { estado: 'parado' } : { estado };

    case 'parar':
      if (estado === 'conectando' || estado === 'tocando' || estado === 'erro') {
        return { estado: 'parado', comando: 'desconectar' };
      }
      return { estado: 'parado' };

    case 'aguardar':
      return estado === 'tocando' ? { estado: 'conectando' } : { estado };

    case 'tocando':
      return estado === 'conectando' || estado === 'tocando' ? { estado: 'tocando' } : { estado };

    case 'falhar':
      if (estado === 'conectando' || estado === 'tocando') {
        return { estado: 'erro', comando: 'desconectar' };
      }
      return { estado };
  }
}

/** Texto que a região aria-live anuncia. Nome da rádio entra como está; sem travessão. */
export function descreverEstado(estado: EstadoRadio, nomeRadio: string): string {
  switch (estado) {
    case 'parado':
      return 'Rádio parada';
    case 'pedindoConsentimento':
      return 'Aguardando a sua confirmação antes de conectar';
    case 'conectando':
      return `Conectando a ${nomeRadio}`;
    case 'tocando':
      return `Tocando ${nomeRadio}`;
    case 'erro':
      return `Não foi possível tocar ${nomeRadio}. Tente de novo.`;
  }
}
