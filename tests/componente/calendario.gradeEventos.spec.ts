// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import FullCalendar from '@fullcalendar/vue3';
import type { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import GradeCalendario from '@/ui/componentes/GradeCalendario.vue';

/**
 * Grade do calendário (achados D1, D4 e D5 do QA visual, 20/10/2026):
 * - D1: o clique numa célula coberta por barra de vários dias leva o dia sob
 *   o ponteiro ao painel, não o início da barra. jsdom não tem
 *   document.elementsFromPoint, então ele é emprestado por teste.
 * - D4: cada evento traz o título completo (ellipsis + title) e o rótulo
 *   curto (3ª AV, Feriado, Prazo), para telas estreitas.
 * - D5 (revisto em 20/10/2026): a navegação usa botões de texto, sem ícone
 *   de fonte, que a CSP (font-src 'self') bloqueia.
 */
const HOJE = '2026-10-20';

function montar() {
  return mount(GradeCalendario, { props: { hoje: HOJE }, attachTo: document.body });
}

function opcoesDaGrade(w: ReturnType<typeof montar>): CalendarOptions {
  return w.findComponent(FullCalendar).props('options') as CalendarOptions;
}

function celulaEm(data: string): HTMLElement {
  const td = document.createElement('td');
  td.className = 'fc-daygrid-day';
  td.setAttribute('data-date', data);
  return td;
}

function cliqueEm(detail: number): MouseEvent {
  return new MouseEvent('click', { clientX: 300, clientY: 400, detail });
}

describe('grade: clique num evento leva o dia sob o ponteiro (D1)', () => {
  const original = document.elementsFromPoint;

  beforeEach(() => {
    document.elementsFromPoint = undefined as unknown as typeof document.elementsFromPoint;
  });

  afterEach(() => {
    document.elementsFromPoint = original;
  });

  it('clique de mouse numa célula coberta por barra emite o dia da célula', async () => {
    const w = montar();
    await flushPromises();
    document.elementsFromPoint = vi.fn(() => [celulaEm('2026-10-16')]);
    const arg = {
      event: { startStr: '2026-10-13' },
      jsEvent: cliqueEm(1)
    } as unknown as EventClickArg;
    opcoesDaGrade(w).eventClick?.(arg);
    expect(w.emitted('selecionar')?.at(-1)).toEqual(['2026-10-16']);
    w.unmount();
  });

  it('ativação por teclado (detail 0) não usa o ponto e emite o início da barra', async () => {
    const w = montar();
    await flushPromises();
    document.elementsFromPoint = vi.fn(() => [celulaEm('2026-10-16')]);
    const arg = {
      event: { startStr: '2026-10-13' },
      jsEvent: cliqueEm(0)
    } as unknown as EventClickArg;
    opcoesDaGrade(w).eventClick?.(arg);
    expect(w.emitted('selecionar')?.at(-1)).toEqual(['2026-10-13']);
    w.unmount();
  });

  it('sem jsEvent (chamada direta) emite o início da barra', async () => {
    const w = montar();
    await flushPromises();
    opcoesDaGrade(w).eventClick?.({
      event: { startStr: '2026-12-09' }
    } as unknown as EventClickArg);
    expect(w.emitted('selecionar')?.at(-1)).toEqual(['2026-12-09']);
    w.unmount();
  });
});

describe('grade: título completo e rótulo curto nos eventos (D4)', () => {
  it('cada evento tem o título completo no atributo title e o rótulo curto visível', async () => {
    const w = montar();
    await flushPromises();
    const titulo = 'Trabalhos interdisciplinares (2ª avaliação)';
    const evento = w.findAll('.fc-event').find((el) => el.attributes('title') === titulo);
    expect(evento, 'evento com o título completo no title').toBeDefined();
    expect(evento!.find('.cal-evento__titulo').text()).toBe(titulo);
    expect(evento!.find('.cal-evento__rotulo').text()).toBe('2ª AV');
    w.unmount();
  });

  it('o rótulo curto de prazo é "Prazo", não o rótulo longo da legenda', async () => {
    const w = montar();
    await flushPromises();
    const rotulosPrazo = w
      .findAll('.fc-event.cal-cat-prazo .cal-evento__rotulo')
      .map((el) => el.text());
    expect(rotulosPrazo.length).toBeGreaterThan(0);
    expect(new Set(rotulosPrazo)).toEqual(new Set(['Prazo']));
    w.unmount();
  });
});

describe('grade: barra de vários dias recebe a classe de barra (D4)', () => {
  it('evento de vários dias (13 a 16/10) traz cal-evento--barra no elemento', async () => {
    const w = montar();
    await flushPromises();
    const barra = w
      .findAll('.fc-event')
      .find((el) => el.attributes('title') === 'Trabalhos interdisciplinares (2ª avaliação)');
    expect(barra, 'barra de 13 a 16/10').toBeDefined();
    expect(barra!.classes()).toContain('cal-evento--barra');
    w.unmount();
  });

  it('evento de um dia (Dia do Professor) não recebe a classe de barra', async () => {
    const w = montar();
    await flushPromises();
    const umDia = w
      .findAll('.fc-event')
      .find((el) => el.attributes('title') === 'Dia do Professor');
    expect(umDia, 'evento de um dia').toBeDefined();
    expect(umDia!.classes()).not.toContain('cal-evento--barra');
    w.unmount();
  });
});

describe('grade: navegação sem fonte de ícones (CSP font-src, QA 20/10/2026)', () => {
  it('a barra de navegação não tem nenhum .fc-icon (a fonte data: do FullCalendar é bloqueada pela CSP)', async () => {
    const w = montar();
    await flushPromises();
    expect(w.findAll('.fc-icon').length).toBe(0);
    expect(document.querySelectorAll('.fc-icon').length).toBe(0);
    w.unmount();
  });

  it('os botões de navegação têm texto visível como nome acessível e dica (title) com o mês', async () => {
    const w = montar();
    await flushPromises();
    const botoes = w.findAll('.fc-toolbar button');
    const textos = botoes.map((b) => b.text());
    expect(textos).toEqual(expect.arrayContaining(['Anterior', 'Próximo', 'Hoje']));
    const dicas = botoes.map((b) => b.attributes('title'));
    expect(dicas).toEqual(expect.arrayContaining(['Mês Anterior', 'Próximo Mês']));
    w.unmount();
  });
});
