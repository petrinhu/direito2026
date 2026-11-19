import { describe, expect, it } from 'vitest';
import { hifenizarRotulo } from '@/core/texto/hifenizarRotulo';
import { SILABAS_ROTULOS_ABA } from '@/core/texto/silabasRotulosAba';
import { ROTULOS_ABA } from '@/core/curriculo/rotulosAba';

/**
 * Hífen mole (U+00AD) entre sílabas dos nomes das abas da trilha. Os valores
 * esperados estão escritos à mão, um por rótulo, com o U+00AD em escape (nunca
 * o caractere literal no fonte). Chave da tabela = rótulo inteiro.
 */
const SHY = '­';

const ESPERADOS: ReadonlyArray<readonly [string, string]> = [
  ['Resumo', `Re${SHY}su${SHY}mo`],
  ['Texto integral', `Tex${SHY}to in${SHY}te${SHY}gral`],
  ['Mapa mental', `Ma${SHY}pa men${SHY}tal`],
  ['Fichamento', `Fi${SHY}cha${SHY}men${SHY}to`],
  ['Mnemônicos', `Mne${SHY}mô${SHY}ni${SHY}cos`],
  ['Petição comentada', `Pe${SHY}ti${SHY}ção co${SHY}men${SHY}ta${SHY}da`],
  ['Quiz', 'Quiz']
];

describe('hifenizarRotulo: rótulos de aba da trilha', () => {
  it.each(ESPERADOS)('"%s" recebe os pontos de sílaba esperados', (rotulo, esperado) => {
    expect(hifenizarRotulo(rotulo)).toBe(esperado);
  });

  it('rótulo fora da tabela volta igual, sem alteração', () => {
    expect(hifenizarRotulo('Introdução ao Direito')).toBe('Introdução ao Direito');
    expect(hifenizarRotulo('1º período')).toBe('1º período');
    expect(hifenizarRotulo('')).toBe('');
  });

  it.each(ESPERADOS)('"%s": tirar o U+00AD devolve o rótulo original', (rotulo) => {
    expect(hifenizarRotulo(rotulo).replaceAll(SHY, '')).toBe(rotulo);
  });

  it('a tabela cobre todo valor de ROTULOS_ABA (nenhuma aba fica sem quebra prevista)', () => {
    for (const rotulo of Object.values(ROTULOS_ABA)) {
      expect(SILABAS_ROTULOS_ABA.has(rotulo), rotulo).toBe(true);
    }
  });

  it('cada entrada da tabela, sem os hífens de marcação, é o próprio rótulo', () => {
    for (const [rotulo, marcado] of SILABAS_ROTULOS_ABA) {
      expect(marcado.replaceAll('-', ''), rotulo).toBe(rotulo);
    }
  });
});
