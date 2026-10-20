import { describe, expect, it } from 'vitest';
import { descricaoDasProvas } from '@/core/calendario/descricaoProvas';
import { textoContador, textoDoContador } from '@/core/calendario/textoContador';
import type { Prova } from '@/core/calendario/tipos';

const prova = (cadeiraNome: string, tipo: Prova['tipo'], data = '2026-11-24'): Prova => ({
  data,
  cadeiraId: cadeiraNome,
  cadeiraNome,
  tipo
});

describe('descricaoDasProvas', () => {
  it('uma prova: tipo com artigo e nome da cadeira', () => {
    expect(descricaoDasProvas([prova('Introdução ao Direito', 'AV3')])).toBe(
      'a 3ª AV de Introdução ao Direito'
    );
  });

  it('tipo final e 2ª chamada usam o artigo feminino certo', () => {
    expect(descricaoDasProvas([prova('Filosofia Jurídica', 'final')])).toBe(
      'a final de Filosofia Jurídica'
    );
    expect(descricaoDasProvas([prova('Filosofia Jurídica', 'chamada')])).toBe(
      'a 2ª chamada de Filosofia Jurídica'
    );
  });

  it('duas cadeiras no mesmo tipo: nomes unidos com "e"', () => {
    expect(
      descricaoDasProvas([
        prova('Introdução ao Direito', 'AV2'),
        prova('Sociologia Jurídica', 'AV2')
      ])
    ).toBe('a 2ª AV de Introdução ao Direito e Sociologia Jurídica');
  });

  it('três ou mais cadeiras no mesmo tipo: conta as cadeiras em vez de listar', () => {
    const provas = [prova('A', 'AV2'), prova('B', 'AV2'), prova('C', 'AV2'), prova('D', 'AV2')];
    expect(descricaoDasProvas(provas)).toBe('a 2ª AV de 4 cadeiras');
  });

  it('tipos diferentes no mesmo dia são separados por "e"', () => {
    const provas = [
      prova('Introdução ao Direito', 'chamada'),
      prova('Filosofia Jurídica', 'final')
    ];
    expect(descricaoDasProvas(provas)).toBe(
      'a 2ª chamada de Introdução ao Direito e a final de Filosofia Jurídica'
    );
  });
});

describe('textoContador', () => {
  const provaUnica = [prova('Introdução ao Direito', 'AV3')];

  it('mais de um dia: "Faltam N dias para ..."', () => {
    expect(textoContador({ data: '2026-11-24', dias: 35, provas: provaUnica })).toBe(
      'Faltam 35 dias para a 3ª AV de Introdução ao Direito'
    );
  });

  it('zero dias: "É hoje: ..."', () => {
    expect(textoContador({ data: '2026-11-24', dias: 0, provas: provaUnica })).toBe(
      'É hoje: a 3ª AV de Introdução ao Direito'
    );
  });

  it('um dia: "É amanhã: ..."', () => {
    expect(textoContador({ data: '2026-11-24', dias: 1, provas: provaUnica })).toBe(
      'É amanhã: a 3ª AV de Introdução ao Direito'
    );
  });

  it('dois dias ainda usam o plural', () => {
    expect(textoContador({ data: '2026-11-24', dias: 2, provas: provaUnica })).toBe(
      'Faltam 2 dias para a 3ª AV de Introdução ao Direito'
    );
  });
});

describe('textoDoContador (texto para qualquer descrição, de prova ou de prazo)', () => {
  const FIM = 'o fim das provas online de Economia e Empreendedorismo';

  it('mais de um dia: "Faltam N dias para ..."', () => {
    expect(textoDoContador(26, FIM)).toBe(`Faltam 26 dias para ${FIM}`);
  });

  it('zero dias: "É hoje: ..."', () => {
    expect(textoDoContador(0, FIM)).toBe(`É hoje: ${FIM}`);
  });

  it('um dia: "É amanhã: ..."', () => {
    expect(textoDoContador(1, FIM)).toBe(`É amanhã: ${FIM}`);
  });
});
