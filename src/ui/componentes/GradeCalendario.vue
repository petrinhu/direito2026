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
import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * Grade mensal (FullCalendar). Só entra no pacote por import() preguiçoso: a
 * página /calendario e a janela modal do quadro são os únicos pontos que a
 * carregam. Clique numa data ou num evento avisa o pai, que mostra as
 * descrições. O teclado usa a lista de datas do mês, ao lado.
 */
const props = defineProps<{ hoje: string }>();
const emit = defineEmits<{
  selecionar: [data: string];
  mudarMes: [mes: string];
}>();

/**
 * O FullCalendar mede a largura na montagem. Dentro da janela modal, a grade
 * nasce logo depois do showModal(); o updateSize num quadro depois da montagem
 * garante a medida com o layout já assentado (cada abertura remonta a grade).
 */
const grade = ref<InstanceType<typeof FullCalendar>>();
const raiz = ref<HTMLElement>();
let quadroPendente: number | undefined;

/**
 * O FullCalendar põe o hint só em `title` (tooltip) e deixa o nome acessível
 * para o texto visível ("< ANTERIOR"). Aqui cada botão recebe um aria-label
 * que diz o que faz. Refeito a cada mudança de mês, porque a barra pode ser
 * redesenhada pelo próprio FullCalendar.
 */
const NOMES_DE_NAVEGACAO: Record<'prev' | 'next' | 'today', string> = {
  prev: 'Mês anterior',
  next: 'Próximo mês',
  today: 'Ir para hoje'
};

function nomearBotoesDeNavegacao(): void {
  for (const [botao, nome] of Object.entries(NOMES_DE_NAVEGACAO)) {
    raiz.value?.querySelector(`.fc-${botao}-button`)?.setAttribute('aria-label', nome);
  }
}

onMounted(() => {
  quadroPendente = requestAnimationFrame(() => {
    quadroPendente = undefined;
    grade.value?.getApi().updateSize();
    nomearBotoesDeNavegacao();
  });
});

onBeforeUnmount(() => {
  if (quadroPendente !== undefined) cancelAnimationFrame(quadroPendente);
});

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
  headerToolbar: { left: 'prev today', center: 'title', right: 'next' },
  // Textos literais da ordem (líder, 20/10/2026). Os hints viram tooltip (title);
  // o nome acessível é o aria-label de nomearBotoesDeNavegacao.
  buttonText: { prev: '< ANTERIOR', next: 'PRÓXIMO >', today: 'HOJE' },
  buttonHints: { prev: 'Mês anterior', next: 'Próximo mês', today: 'Ir para hoje' },
  // Sem ícone de fonte: os botões mostram o texto do locale ("Anterior",
  // "Próximo", "Hoje"). A regra @font-face da fonte de ícones é injetada pelo
  // próprio core e sai no build (vite.config.ts), senão a CSP bloqueia o pedido.
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
    nomearBotoesDeNavegacao();
    emit('mudarMes', mesDoCalendario(arg.view.calendar.getDate()));
  }
};
</script>

<template>
  <div ref="raiz" class="grade-calendario">
    <FullCalendar ref="grade" :options="opcoes" />
  </div>
</template>
