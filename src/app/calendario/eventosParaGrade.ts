import { somarDias } from '@/core/calendario/datas';
import { agruparProvasParaGrade } from '@/core/calendario/agruparProvasParaGrade';
import { rotuloCategoriaCurto } from '@/core/calendario/rotulos';
import { FERIADOS_2026_2 } from '@/conteudo/calendario/feriados';
import { EVENTOS_ACADEMICOS_2026_2 } from '@/conteudo/calendario/calendarioAcademico';
import { PROVAS_2026_2 } from '@/conteudo/calendario/provas';
import type { Evento } from '@/core/calendario/tipos';

/** Evento no formato que a grade (FullCalendar) recebe. Sem dependência da lib. */
export interface EventoDaGrade {
  id: string;
  title: string;
  start: string;
  /** Fim exclusivo, como a grade espera: o dia seguinte ao último dia do evento. */
  end?: string;
  allDay: true;
  classNames: string[];
  /** rotuloCurto: o rótulo de tela estreita (ex.: "3ª AV", "Prazo"); o título completo fica em title. */
  extendedProps: { categoria: string; descricao: string; rotuloCurto: string };
}

function paraEventoDaGrade(evento: Evento, indice: number): EventoDaGrade {
  const ultimo = evento.inicio !== evento.fim;
  return {
    id: `${evento.categoria}-${evento.inicio}-${indice}`,
    title: evento.titulo,
    start: evento.inicio,
    ...(ultimo ? { end: somarDias(evento.fim, 1) } : {}),
    allDay: true,
    classNames: [`cal-cat-${evento.categoria.toLowerCase()}`],
    extendedProps: {
      categoria: evento.categoria,
      descricao: evento.descricao,
      rotuloCurto: rotuloCategoriaCurto(evento.categoria)
    }
  };
}

/** Provas agrupadas por tipo e dia, mais feriados e eventos do semestre. */
export function eventosParaGrade(): EventoDaGrade[] {
  const todos = [
    ...agruparProvasParaGrade(PROVAS_2026_2),
    ...FERIADOS_2026_2,
    ...EVENTOS_ACADEMICOS_2026_2
  ];
  return todos.map(paraEventoDaGrade);
}
