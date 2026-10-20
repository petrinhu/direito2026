<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import type { CalendarOptions, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { eventosParaGrade } from '@/app/calendario/eventosParaGrade';
import { mesDoCalendario } from '@/app/calendario/mesDoCalendario';

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

const opcoes: CalendarOptions = {
  plugins: [dayGridPlugin, interactionPlugin],
  locale: ptBrLocale,
  initialView: 'dayGridMonth',
  initialDate: props.hoje,
  now: () => new Date(`${props.hoje}T12:00:00`),
  headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
  events: eventosParaGrade(),
  eventDisplay: 'block',
  dayMaxEvents: false,
  height: 'auto',
  dateClick: (arg: DateClickArg) => emit('selecionar', arg.dateStr),
  eventClick: (arg: EventClickArg) => {
    const inicio = arg.event.startStr.slice(0, 10);
    emit('selecionar', inicio);
  },
  datesSet: (arg: DatesSetArg) => emit('mudarMes', mesDoCalendario(arg.view.calendar.getDate()))
};
</script>

<template>
  <div class="grade-calendario">
    <FullCalendar :options="opcoes" />
  </div>
</template>
