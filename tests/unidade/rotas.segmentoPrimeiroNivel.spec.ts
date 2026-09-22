import { describe, expect, it } from 'vitest';
import { extrairSegmentoPrimeiroNivel } from '@/core/rotas/segmentoPrimeiroNivel';

describe('extrairSegmentoPrimeiroNivel', () => {
  it('rota raiz não tem segmento de primeiro nível', () => {
    expect(extrairSegmentoPrimeiroNivel('/')).toBeUndefined();
  });

  it('rota simples devolve o próprio segmento', () => {
    expect(extrairSegmentoPrimeiroNivel('/busca')).toBe('busca');
  });

  it('rota com parâmetro dinâmico devolve o prefixo literal', () => {
    expect(extrairSegmentoPrimeiroNivel('/p/:periodo')).toBe('p');
    expect(extrairSegmentoPrimeiroNivel('/p/:periodo/:cadeira')).toBe('p');
  });

  it('rota cujo primeiro segmento já é dinâmico não tem segmento fixo', () => {
    expect(extrairSegmentoPrimeiroNivel('/:pathMatch(.*)*')).toBeUndefined();
  });
});
