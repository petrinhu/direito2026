import { describe, expect, it } from 'vitest';
import { INTERVALO_RELEITURA_MS, podeReler } from '@/core/usuarios/releituraAdmin';

/** ADM-F4 (fatia 2): a releitura da lista na volta da aba acontece no máximo 1 vez a cada 30 s. */
describe('releitura da lista do admin', () => {
  it('o intervalo é de 30 s', () => {
    expect(INTERVALO_RELEITURA_MS).toBe(30_000);
  });

  it('não relê antes de 30 s desde a última leitura', () => {
    expect(podeReler(1_000 + 29_999, 1_000)).toBe(false);
  });

  it('relê a partir de 30 s desde a última leitura', () => {
    expect(podeReler(1_000 + 30_000, 1_000)).toBe(true);
  });
});
