import { describe, expect, it } from 'vitest';
import { contadorProva } from '@/app/calendario/contadorProva';
import { PROVAS_2026_2 } from '@/conteudo/calendario/provas';
import type { Prova } from '@/core/calendario/tipos';

const PROVAS_DE_TESTE: Prova[] = [
  {
    data: '2026-11-24',
    cadeiraId: 'intr-direito',
    cadeiraNome: 'Introdução ao Direito',
    tipo: 'AV3'
  }
];

describe('contadorProva', () => {
  it('20/10 ao meio-dia em Recife: faltam 35 dias para a 3ª AV de Introdução ao Direito, faixa calmo', () => {
    const r = contadorProva(new Date('2026-10-20T15:00:00Z'), PROVAS_DE_TESTE);
    expect(r?.dias).toBe(35);
    expect(r?.faixa).toBe('calmo');
    expect(r?.texto).toBe('Faltam 35 dias para a 3ª AV de Introdução ao Direito');
  });

  it('conta pelo dia de Recife, não pelo UTC: 23/11 às 02:30 UTC ainda é 22/11 em Recife (2 dias)', () => {
    const r = contadorProva(new Date('2026-11-23T02:30:00Z'), PROVAS_DE_TESTE);
    expect(r?.dias).toBe(2);
    expect(r?.faixa).toBe('pulsante');
  });

  it('no dia da prova o texto é "É hoje"', () => {
    const r = contadorProva(new Date('2026-11-24T15:00:00Z'), PROVAS_DE_TESTE);
    expect(r?.texto).toBe('É hoje: a 3ª AV de Introdução ao Direito');
  });

  it('um dia antes o texto é "É amanhã"', () => {
    const r = contadorProva(new Date('2026-11-23T15:00:00Z'), PROVAS_DE_TESTE);
    expect(r?.texto).toBe('É amanhã: a 3ª AV de Introdução ao Direito');
  });

  it('sem prova futura não há contador', () => {
    expect(contadorProva(new Date('2026-12-16T15:00:00Z'), PROVAS_DE_TESTE)).toBeUndefined();
  });

  it('sem lista explícita usa as provas reais do semestre', () => {
    const r = contadorProva(new Date('2026-10-20T15:00:00Z'));
    expect(r?.proxima.data).toBe('2026-11-24');
    expect(PROVAS_2026_2.length).toBeGreaterThan(0);
  });
});
