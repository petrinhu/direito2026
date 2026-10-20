// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import LegendaCalendario from '@/ui/componentes/LegendaCalendario.vue';
import GradeCalendario from '@/ui/componentes/GradeCalendario.vue';

/**
 * Fim de semana no calendário (ordem do líder, 20/10/2026). Dois fatos:
 * - a legenda ganha o item "Fim de semana", com a amostra do tom (único texto
 *   novo permitido);
 * - a grade do FullCalendar marca as colunas de sábado e domingo com
 *   fc-day-sat e fc-day-sun (é nelas que o CSS aplica o tom).
 *
 * Nasce vermelho: a legenda não tinha o item. A grade já gera as classes, e
 * este teste prova isso no DOM, sem depender de quem as declarou.
 */
const HOJE = '2026-10-20';

let montados: VueWrapper[] = [];

afterEach(() => {
  for (const w of montados) w.unmount();
  montados = [];
  document.body.replaceChildren();
});

describe('legenda: item Fim de semana', () => {
  it('mostra um chip "Fim de semana" com a classe do tom, dentro da lista da legenda', () => {
    const w = mount(LegendaCalendario);
    montados.push(w);
    const chip = w.find('[data-testid="legenda-calendario"] .cal-fim-de-semana');
    expect(chip.exists(), 'sem chip .cal-fim-de-semana na legenda').toBe(true);
    expect(chip.text()).toBe('Fim de semana');
  });
});

describe('grade: colunas de sábado e domingo marcadas pelo FullCalendar', () => {
  it('a grade do mês tem células e cabeçalhos com fc-day-sat e fc-day-sun', () => {
    const w = mount(GradeCalendario, { props: { hoje: HOJE }, attachTo: document.body });
    montados.push(w);
    expect(document.querySelectorAll('.fc-daygrid-day.fc-day-sat').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.fc-daygrid-day.fc-day-sun').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.fc-col-header-cell.fc-day-sat').length).toBe(1);
    expect(document.querySelectorAll('.fc-col-header-cell.fc-day-sun').length).toBe(1);
  });
});
