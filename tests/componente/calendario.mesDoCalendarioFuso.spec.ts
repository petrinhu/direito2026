// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import GradeCalendario from '@/ui/componentes/GradeCalendario.vue';

/**
 * MES-FUSO: a grade manda o mês ao pai pelo mesDoCalendario(getDate()). O
 * FullCalendar, sem `timeZone`, opera em relógio local e entrega a data do
 * mês como meia-noite local do dia 1. Este teste prova, na grade real e em
 * qualquer fuso do navegador, que o mês emitido é o certo no primeiro e no
 * último dia do mês. Rodar com TZ=UTC, TZ=Asia/Tokyo, TZ=America/Los_Angeles
 * e TZ=America/Recife: o resultado tem de ser o mesmo nos quatro.
 */
let montados: VueWrapper[] = [];

afterEach(() => {
  for (const w of montados) w.unmount();
  montados = [];
  document.body.replaceChildren();
});

async function montar(hoje: string): Promise<VueWrapper> {
  const w = mount(GradeCalendario, { props: { hoje }, attachTo: document.body });
  montados.push(w);
  await flushPromises();
  return w;
}

function mesesEmitidos(w: VueWrapper): string[] {
  return (w.emitted('mudarMes') ?? []).map((args) => args[0] as string);
}

describe('mês emitido pela grade, em qualquer fuso do navegador', () => {
  it('primeiro dia do mês: emite o próprio mês', async () => {
    const w = await montar('2026-02-01');
    expect(mesesEmitidos(w).at(-1)).toBe('2026-02');
  });

  it('último dia do mês: emite o mês do último dia, não o seguinte', async () => {
    const w = await montar('2026-01-31');
    expect(mesesEmitidos(w).at(-1)).toBe('2026-01');
  });

  it('virada de ano (31/12): emite dezembro', async () => {
    const w = await montar('2026-12-31');
    expect(mesesEmitidos(w).at(-1)).toBe('2026-12');
  });

  it('navegar para o próximo mês a partir de 31/01 emite fevereiro', async () => {
    const w = await montar('2026-01-31');
    document.querySelector<HTMLButtonElement>('.fc-next-button')?.click();
    await flushPromises();
    expect(mesesEmitidos(w).at(-1)).toBe('2026-02');
  });
});
