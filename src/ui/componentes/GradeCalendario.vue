<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import type {
  CalendarOptions,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventMountArg
} from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { eventosParaGrade } from '@/app/calendario/eventosParaGrade';
import { mesDoCalendario } from '@/app/calendario/mesDoCalendario';
import { dataDaCelulaSob, type ElementoSobPonteiro } from '@/app/calendario/dataDaCelulaSob';

/**
 * Grade mensal (FullCalendar, só nesta rota: a página é carregada por
 * import() preguiçoso). Clique numa data ou num evento avisa a página, que
 * mostra as descrições. O teclado usa a lista de datas do mês, ao lado.
 */
const props = defineProps<{ hoje: string }>();
const emit = defineEmits<{
  selecionar: [data: string];
  mudarMes: [mes: string];
}>();

/**
 * Elementos sob o ponto de um clique de mouse ou toque (detail > 0). Tecla
 * Enter gera clique com detail 0 e ponto 0,0, sem significado: fica de fora.
 */
function elementosNoPontoDoClique(evento: MouseEvent | undefined): ElementoSobPonteiro[] {
  if (!evento || evento.detail === 0 || typeof document.elementsFromPoint !== 'function') {
    return [];
  }
  return document.elementsFromPoint(evento.clientX, evento.clientY);
}

/**
 * Conteúdo do evento: título completo e rótulo curto, cada um num span. A
 * tela decide qual aparece (calendario.css): em tela estreita, o rótulo; em
 * tela larga, o título com reticências.
 */
function conteudoDoEvento(arg: EventContentArg): { domNodes: HTMLElement[] } {
  const titulo = document.createElement('span');
  titulo.className = 'cal-evento__titulo';
  titulo.textContent = arg.event.title;
  const rotulo = document.createElement('span');
  rotulo.className = 'cal-evento__rotulo';
  rotulo.textContent = String(arg.event.extendedProps.rotuloCurto ?? '');
  return { domNodes: [titulo, rotulo] };
}

const opcoes: CalendarOptions = {
  plugins: [dayGridPlugin, interactionPlugin],
  locale: ptBrLocale,
  initialView: 'dayGridMonth',
  initialDate: props.hoje,
  now: () => new Date(`${props.hoje}T12:00:00`),
  headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
  // Sem ícone de fonte: a fonte data: é bloqueada pela CSP (font-src 'self').
  // Os botões mostram o texto do locale ("Anterior", "Próximo", "Hoje").
  buttonIcons: false,
  events: eventosParaGrade(),
  eventDisplay: 'block',
  eventContent: conteudoDoEvento,
  eventClassNames: (arg: EventContentArg) => (arg.event.end ? ['cal-evento--barra'] : []),
  eventDidMount: (arg: EventMountArg) => {
    arg.el.setAttribute('title', arg.event.title);
  },
  dayMaxEvents: false,
  height: 'auto',
  dateClick: (arg: DateClickArg) => emit('selecionar', arg.dateStr),
  eventClick: (arg: EventClickArg) => {
    const inicio = arg.event.startStr.slice(0, 10);
    emit('selecionar', dataDaCelulaSob(elementosNoPontoDoClique(arg.jsEvent), inicio));
  },
  datesSet: (arg: DatesSetArg) => {
    emit('mudarMes', mesDoCalendario(arg.view.calendar.getDate()));
  }
};
</script>

<template>
  <div class="grade-calendario">
    <FullCalendar :options="opcoes" />
  </div>
</template>
