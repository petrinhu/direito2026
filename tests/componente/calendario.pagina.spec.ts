// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import FullCalendar from '@fullcalendar/vue3';
import type { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import Calendario from '@/ui/paginas/Calendario.vue';

/**
 * Página /calendario (ordem do líder, 20/10/2026): grade mensal com
 * FullCalendar, legenda com rótulos, painel de descrições com aria-live,
 * lista de datas do mês em botões (teclado), nota de Economia e
 * Empreendedorismo. A data é injetada pela prop `agora` (20/10/2026).
 */
const AGORA = new Date('2026-10-20T15:00:00Z');

function montar() {
  return mount(Calendario, { props: { agora: AGORA }, attachTo: document.body });
}

describe('página do calendário', () => {
  it('tem título h1 "Calendário"', () => {
    const w = montar();
    expect(w.find('h1').text()).toBe('Calendário');
    w.unmount();
  });

  it('renderiza a grade do FullCalendar com o mês da data atual', async () => {
    const w = montar();
    await flushPromises();
    expect(w.find('.fc').exists()).toBe(true);
    expect(w.find('.fc-toolbar-title').text()).toContain('outubro');
    w.unmount();
  });

  it('a legenda mostra os nove rótulos de categoria e o de fim de semana (texto, não só cor)', () => {
    const w = montar();
    const legenda = w.find('[data-testid="legenda-calendario"]');
    expect(legenda.exists()).toBe(true);
    const rotulos = legenda.findAll('li').map((li) => li.text());
    expect(rotulos).toEqual([
      '1ª AV',
      '2ª AV',
      '3ª AV',
      '2ª chamada',
      'Final',
      'Provas online',
      'Feriado',
      'Prazo acadêmico',
      'Semestre',
      'Fim de semana'
    ]);
    w.unmount();
  });

  it('o painel de descrições é aria-live (polite) e começa com o dia de hoje', () => {
    const w = montar();
    const painel = w.find('[data-testid="painel-do-dia"]');
    expect(painel.attributes('aria-live')).toBe('polite');
    expect(painel.find('h2').text()).toContain('20 de outubro de 2026');
    expect(painel.text()).toContain(
      'Provas online de Economia e de Empreendedorismo (sala digital): de 13/10 a 15/11/2026.'
    );
    w.unmount();
  });

  it('a lista de datas do mês é de botões, e cada um mostra a descrição no painel', async () => {
    const w = montar();
    const lista = w.find('[data-testid="lista-datas-do-mes"]');
    const botao = lista.findAll('button').find((b) => b.text().includes('16 de outubro'));
    expect(botao).toBeDefined();
    expect(botao!.element.tagName).toBe('BUTTON');

    await botao!.trigger('click');
    const painel = w.find('[data-testid="painel-do-dia"]');
    expect(painel.find('h2').text()).toContain('16 de outubro de 2026');
    expect(painel.text()).toContain('Segunda avaliação de Introdução ao Direito.');
    w.unmount();
  });

  it('a ligação dateClick da grade chega ao painel (a detecção de clique é do FullCalendar)', async () => {
    const w = montar();
    await flushPromises();
    // jsdom não reproduz a detecção de clique do FullCalendar (ela depende de
    // pointer e de layout real). Aqui se testa a nossa ligação: o callback
    // dateClick das opções precisa levar a data ao painel. O clique real na
    // grade fica para o e2e/QA visual.
    const opcoes = w.findComponent(FullCalendar).props('options') as CalendarOptions;
    opcoes.dateClick?.({ dateStr: '2026-10-12' } as DateClickArg);
    await flushPromises();
    const painel = w.find('[data-testid="painel-do-dia"]');
    expect(painel.find('h2').text()).toContain('12 de outubro de 2026');
    expect(painel.text()).toContain('Nossa Senhora Aparecida');
    w.unmount();
  });

  it('o clique num evento da grade também leva a data ao painel', async () => {
    const w = montar();
    await flushPromises();
    const opcoes = w.findComponent(FullCalendar).props('options') as CalendarOptions;
    opcoes.eventClick?.({ event: { startStr: '2026-12-09' } } as unknown as EventClickArg);
    await flushPromises();
    expect(w.find('[data-testid="painel-do-dia"]').find('h2').text()).toContain(
      '9 de dezembro de 2026'
    );
    w.unmount();
  });

  it('traz a nota de Economia e Empreendedorismo, com o período das provas online na sala digital', () => {
    const w = montar();
    const nota = w.find('[data-testid="nota-sala-digital"]');
    expect(nota.exists()).toBe(true);
    expect(nota.text()).toContain('Economia');
    expect(nota.text()).toContain('Empreendedorismo');
    expect(nota.text()).toContain('sala digital');
    expect(nota.text()).toContain('de 13/10 a 15/11/2026');
    w.unmount();
  });
});
