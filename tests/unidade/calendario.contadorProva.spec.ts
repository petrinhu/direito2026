import { describe, expect, it } from 'vitest';
import { contadorProva } from '@/app/calendario/contadorProva';
import { PROVAS } from '@/app/calendario/dadosDoCalendario';
import type { Prova } from '@/core/calendario/tipos';

const PROVAS_DE_TESTE: Prova[] = [
  {
    data: '2026-11-24',
    cadeiraId: 'intr-direito',
    cadeiraNome: 'Introdução ao Direito',
    tipo: 'AV3'
  }
];

// Listas injetadas passam `[]` como prazos: o fim das provas online (15/11)
// só deve entrar quando o teste usa a lista real do semestre.
const SEM_PRAZOS: never[] = [];

const FIM_ONLINE = 'o fim das provas online de Economia e Empreendedorismo';

describe('contadorProva', () => {
  it('20/10 ao meio-dia em Recife: faltam 35 dias para a 3ª AV de Introdução ao Direito, faixa calmo', () => {
    const r = contadorProva(new Date('2026-10-20T15:00:00Z'), PROVAS_DE_TESTE, SEM_PRAZOS);
    expect(r?.dias).toBe(35);
    expect(r?.faixa).toBe('calmo');
    expect(r?.texto).toBe('Faltam 35 dias para a 3ª AV de Introdução ao Direito');
  });

  it('conta pelo dia de Recife, não pelo UTC: 23/11 às 02:30 UTC ainda é 22/11 em Recife (2 dias)', () => {
    const r = contadorProva(new Date('2026-11-23T02:30:00Z'), PROVAS_DE_TESTE, SEM_PRAZOS);
    expect(r?.dias).toBe(2);
    expect(r?.faixa).toBe('pulsante');
  });

  it('no dia da prova o texto é "É hoje"', () => {
    const r = contadorProva(new Date('2026-11-24T15:00:00Z'), PROVAS_DE_TESTE, SEM_PRAZOS);
    expect(r?.texto).toBe('É hoje: a 3ª AV de Introdução ao Direito');
  });

  it('um dia antes o texto é "É amanhã"', () => {
    const r = contadorProva(new Date('2026-11-23T15:00:00Z'), PROVAS_DE_TESTE, SEM_PRAZOS);
    expect(r?.texto).toBe('É amanhã: a 3ª AV de Introdução ao Direito');
  });

  it('sem prova futura e sem prazo não há contador', () => {
    expect(
      contadorProva(new Date('2026-12-16T15:00:00Z'), PROVAS_DE_TESTE, SEM_PRAZOS)
    ).toBeUndefined();
  });

  it('sem lista explícita usa as provas reais do semestre (20/10: o fim das provas online, 15/11, vem antes de 24/11)', () => {
    const r = contadorProva(new Date('2026-10-20T15:00:00Z'));
    expect(r?.data).toBe('2026-11-15');
    expect(r?.dias).toBe(26);
    expect(r?.faixa).toBe('calmo');
    expect(r?.texto).toBe(`Faltam 26 dias para ${FIM_ONLINE}`);
    expect(PROVAS.length).toBeGreaterThan(0);
  });

  it('no último dia das provas online (15/11) o texto é "É hoje" com o fim do período', () => {
    const r = contadorProva(new Date('2026-11-15T15:00:00Z'));
    expect(r?.dias).toBe(0);
    expect(r?.texto).toBe(`É hoje: ${FIM_ONLINE}`);
  });

  it('um dia antes do fim (14/11) o texto é "É amanhã" com o fim do período', () => {
    const r = contadorProva(new Date('2026-11-14T15:00:00Z'));
    expect(r?.texto).toBe(`É amanhã: ${FIM_ONLINE}`);
  });

  it('depois do fim das provas online (16/11) o contador volta para a próxima prova real', () => {
    const r = contadorProva(new Date('2026-11-16T15:00:00Z'));
    expect(r?.data).toBe('2026-11-24');
    expect(r?.texto).toBe('Faltam 8 dias para a 3ª AV de Introdução ao Direito');
  });

  it('empate no mesmo dia: a prova vence o prazo', () => {
    const provaNoFim: Prova[] = [
      { data: '2026-11-15', cadeiraId: 'x', cadeiraNome: 'Introdução ao Direito', tipo: 'AV3' }
    ];
    const r = contadorProva(new Date('2026-11-15T15:00:00Z'), provaNoFim, [
      { data: '2026-11-15', descricao: FIM_ONLINE }
    ]);
    expect(r?.texto).toBe('É hoje: a 3ª AV de Introdução ao Direito');
  });

  it('o prazo mais próximo vence a prova mais distante', () => {
    const r = contadorProva(new Date('2026-10-20T15:00:00Z'), PROVAS_DE_TESTE);
    expect(r?.data).toBe('2026-11-15');
    expect(r?.texto).toBe(`Faltam 26 dias para ${FIM_ONLINE}`);
  });
});
