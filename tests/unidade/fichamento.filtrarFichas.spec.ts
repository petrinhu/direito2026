import { describe, expect, it } from 'vitest';
import { filtrarFichas, ordenarFichas, rotuloDaFase } from '@/core/fichamento/filtrarFichas';
import { DADOS_SINTETICOS } from './apoio/dadosFichamento';

describe('filtrarFichas', () => {
  it('sem filtro devolve todas, na ordem dos dados', () => {
    expect(filtrarFichas(DADOS_SINTETICOS, {}).map((f) => f.id)).toEqual(['alfa', 'beta', 'gama']);
  });

  it('filtra por era', () => {
    expect(filtrarFichas(DADOS_SINTETICOS, { eraId: 'antiga' }).map((f) => f.id)).toEqual([
      'alfa',
      'beta'
    ]);
  });

  it('filtra por fase', () => {
    expect(filtrarFichas(DADOS_SINTETICOS, { faseId: 'f3' }).map((f) => f.id)).toEqual(['gama']);
  });

  it('filtra por termo, sem diferenciar maiúscula nem acento', () => {
    expect(filtrarFichas(DADOS_SINTETICOS, { termo: 'ACUCAR' }).map((f) => f.id)).toEqual(['alfa']);
    expect(filtrarFichas(DADOS_SINTETICOS, { termo: 'direito penal' }).map((f) => f.id)).toEqual([
      'beta'
    ]);
  });

  it('o termo procura também em conceitos e obras', () => {
    expect(filtrarFichas(DADOS_SINTETICOS, { termo: 'salgado' }).map((f) => f.id)).toEqual([
      'beta'
    ]);
    expect(filtrarFichas(DADOS_SINTETICOS, { termo: 'obra g' }).map((f) => f.id)).toEqual(['gama']);
  });

  it('combina era e termo, e termo só de espaços não filtra', () => {
    expect(filtrarFichas(DADOS_SINTETICOS, { eraId: 'media', termo: 'sal' })).toEqual([]);
    expect(filtrarFichas(DADOS_SINTETICOS, { termo: '   ' })).toHaveLength(3);
  });

  it('o rótulo da fase inclui a era, para a ficha dizer a que período pertence', () => {
    expect(rotuloDaFase(DADOS_SINTETICOS, 'f1')).toBe('Idade Antiga, Fase um');
  });

  it('ordenarFichas agrupa por era e fase na ordem do currículo', () => {
    const grupos = ordenarFichas(DADOS_SINTETICOS, DADOS_SINTETICOS.pensadores);
    expect(grupos.map((g) => [g.era.id, g.fase.id, g.fichas.map((f) => f.id)])).toEqual([
      ['antiga', 'f1', ['alfa']],
      ['antiga', 'f2', ['beta']],
      ['media', 'f3', ['gama']]
    ]);
  });
});
