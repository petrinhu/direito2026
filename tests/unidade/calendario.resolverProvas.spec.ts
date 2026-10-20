import { describe, expect, it } from 'vitest';
import { resolverProvas } from '@/core/calendario/resolverProvas';
import type { ProvaDoSemestre } from '@/core/calendario/tipos';

const CADEIRAS = [
  { id: 'intr-direito', nome: 'Introdução ao Direito' },
  { id: 'filosofia-juridica', nome: 'Filosofia Jurídica' }
];

describe('resolverProvas', () => {
  it('põe o nome da cadeira vindo do currículo, sem o dado trazer nome', () => {
    const provas: ProvaDoSemestre[] = [
      { semestre: '2026.2', data: '2026-09-22', cadeiraId: 'intr-direito', tipo: 'AV1' }
    ];
    expect(resolverProvas(provas, CADEIRAS)).toEqual([
      {
        data: '2026-09-22',
        cadeiraId: 'intr-direito',
        cadeiraNome: 'Introdução ao Direito',
        tipo: 'AV1'
      }
    ]);
  });

  it('não devolve o campo semestre: a forma que os leitores recebem é a de Prova', () => {
    const [prova] = resolverProvas(
      [{ semestre: '2026.2', data: '2026-10-01', cadeiraId: 'filosofia-juridica', tipo: 'AV1' }],
      CADEIRAS
    );
    expect(Object.keys(prova ?? {}).sort()).toEqual(['cadeiraId', 'cadeiraNome', 'data', 'tipo']);
  });

  it('cadeiraId que não existe no currículo lança (falha alto, não mostra prova sem nome)', () => {
    const provas: ProvaDoSemestre[] = [
      { semestre: '2026.2', data: '2026-10-01', cadeiraId: 'xpto', tipo: 'AV1' }
    ];
    expect(() => resolverProvas(provas, CADEIRAS)).toThrow('cadeiraId desconhecido "xpto"');
  });
});
