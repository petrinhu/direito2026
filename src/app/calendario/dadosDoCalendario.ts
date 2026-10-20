import { curriculo } from '@/conteudo/curriculo';
import { FERIADOS as FERIADOS_DADO } from '@/conteudo/calendario/feriados';
import {
  EVENTOS_ACADEMICOS as EVENTOS_ACADEMICOS_DADO,
  OBSERVACOES_ACADEMICAS as OBSERVACOES_DADO
} from '@/conteudo/calendario/calendarioAcademico';
import {
  PERIODOS_ONLINE as PERIODOS_ONLINE_DADO,
  PRAZOS as PRAZOS_DADO,
  PROVAS as PROVAS_DADO
} from '@/conteudo/calendario/provas';
import { resolverProvas } from '@/core/calendario/resolverProvas';
import type { Evento, PrazoDoCalendario, Prova } from '@/core/calendario/tipos';

/**
 * Listas do calendário que os leitores de app consomem. Os dados trazem o
 * campo `semestre` (para quem edita); aqui ele sai, e as provas ganham o nome
 * da cadeira vindo do currículo. Os leitores não mudam quando um semestre entra.
 */

const CADEIRAS = curriculo.flatMap((periodo) => periodo.cadeiras);

function semSemestre<T extends { semestre: string }>(itens: readonly T[]): Omit<T, 'semestre'>[] {
  return itens.map((item) => {
    const copia: Partial<T> = { ...item };
    delete copia.semestre;
    return copia as Omit<T, 'semestre'>;
  });
}

export const PROVAS: readonly Prova[] = resolverProvas(PROVAS_DADO, CADEIRAS);
export const FERIADOS: readonly Evento[] = semSemestre(FERIADOS_DADO);
export const EVENTOS_ACADEMICOS: readonly Evento[] = semSemestre(EVENTOS_ACADEMICOS_DADO);
export const PERIODOS_ONLINE: readonly Evento[] = semSemestre(PERIODOS_ONLINE_DADO);
export const PRAZOS: readonly PrazoDoCalendario[] = semSemestre(PRAZOS_DADO);
export const OBSERVACOES_ACADEMICAS: readonly string[] = OBSERVACOES_DADO.map((o) => o.texto);
