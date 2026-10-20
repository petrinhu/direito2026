// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import FullCalendar from '@fullcalendar/vue3';
import type { CalendarOptions } from '@fullcalendar/core';
import GradeCalendario from '@/ui/componentes/GradeCalendario.vue';

/**
 * Botões da barra do calendário (ordem do líder, 20/10/2026): "< ANTERIOR" à
 * esquerda, HOJE ao lado dele, título centralizado e "PRÓXIMO >" à direita,
 * sem ícones do FullCalendar. Cada botão tem um nome acessível claro
 * (aria-label) e um hint de tooltip.
 *
 * Nasce vermelho: a barra era "prev,next today" com textos e ícones do
 * FullCalendar, sem os rótulos novos nem os aria-label.
 */
const HOJE = '2026-10-20';

let montados: VueWrapper[] = [];

afterEach(() => {
  for (const w of montados) w.unmount();
  montados = [];
  document.body.replaceChildren();
});

async function montar() {
  const w = mount(GradeCalendario, { props: { hoje: HOJE }, attachTo: document.body });
  montados.push(w);
  await flushPromises();
  return w;
}

function opcoesDaGrade(w: VueWrapper): CalendarOptions {
  return w.findComponent(FullCalendar).props('options') as CalendarOptions;
}

function botao(seletor: string): HTMLButtonElement {
  const el = document.querySelector<HTMLButtonElement>(seletor);
  expect(el, `sem botão ${seletor}`).not.toBeNull();
  return el as HTMLButtonElement;
}

describe('opções do FullCalendar para a barra', () => {
  it('a barra põe ANTERIOR e HOJE à esquerda, o título no centro e PRÓXIMO à direita', async () => {
    const w = await montar();
    expect(opcoesDaGrade(w).headerToolbar).toEqual({
      left: 'prev today',
      center: 'title',
      right: 'next'
    });
  });

  it('os textos dos botões são os da ordem, literais', async () => {
    const w = await montar();
    expect(opcoesDaGrade(w).buttonText).toEqual({
      prev: '< ANTERIOR',
      next: 'PRÓXIMO >',
      today: 'HOJE'
    });
  });

  it('os ícones do FullCalendar ficam desligados (sem seta duplicada)', async () => {
    const w = await montar();
    expect(opcoesDaGrade(w).buttonIcons).toBe(false);
  });

  it('cada botão tem um hint em português para o tooltip', async () => {
    const w = await montar();
    expect(opcoesDaGrade(w).buttonHints).toEqual({
      prev: 'Mês anterior',
      next: 'Próximo mês',
      today: 'Ir para hoje'
    });
  });
});

describe('DOM da barra', () => {
  it('os botões mostram os textos da ordem', async () => {
    await montar();
    expect(botao('.fc-prev-button').textContent?.trim()).toBe('< ANTERIOR');
    expect(botao('.fc-next-button').textContent?.trim()).toBe('PRÓXIMO >');
    expect(botao('.fc-today-button').textContent?.trim()).toBe('HOJE');
  });

  it('cada botão tem nome acessível claro, por aria-label', async () => {
    await montar();
    expect(botao('.fc-prev-button').getAttribute('aria-label')).toBe('Mês anterior');
    expect(botao('.fc-next-button').getAttribute('aria-label')).toBe('Próximo mês');
    expect(botao('.fc-today-button').getAttribute('aria-label')).toBe('Ir para hoje');
  });

  it('a ordem dos blocos é: esquerda com ANTERIOR e HOJE, título no meio, PRÓXIMO à direita', async () => {
    await montar();
    const blocos = document.querySelectorAll('.fc-toolbar-chunk');
    expect(blocos.length).toBe(3);
    expect(blocos[0]?.querySelector('.fc-prev-button')).not.toBeNull();
    expect(blocos[0]?.querySelector('.fc-today-button')).not.toBeNull();
    expect(blocos[1]?.querySelector('.fc-toolbar-title')).not.toBeNull();
    expect(blocos[2]?.querySelector('.fc-next-button')).not.toBeNull();
  });

  it('HOJE vem desabilitado quando o mês exibido já contém hoje (controle do FullCalendar)', async () => {
    await montar();
    expect(botao('.fc-today-button').disabled).toBe(true);
  });
});
