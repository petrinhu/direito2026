import { describe, expect, it } from 'vitest';
import { eventosDoDia } from '@/core/calendario/eventosDoDia';
import { datasComEventosDoMes } from '@/core/calendario/datasDoMes';
import { agruparProvasParaGrade } from '@/core/calendario/agruparProvasParaGrade';
import { provaComoEvento } from '@/core/calendario/provaComoEvento';
import type { Evento, Prova } from '@/core/calendario/tipos';

const EVENTOS: Evento[] = [
  {
    inicio: '2026-09-21',
    fim: '2026-10-02',
    categoria: 'AV1',
    titulo: 'Período da 1ª avaliação',
    descricao: 'Período de provas.'
  },
  {
    inicio: '2026-10-16',
    fim: '2026-10-16',
    categoria: 'feriado',
    titulo: 'Feriado de teste',
    descricao: 'Só para o teste.'
  },
  {
    inicio: '2026-10-16',
    fim: '2026-10-16',
    categoria: 'prazo',
    titulo: 'Prazo de teste',
    descricao: 'Também no mesmo dia.'
  }
];

describe('eventosDoDia', () => {
  it('traz os eventos que cobrem a data, inclusive os de período', () => {
    const titulos = eventosDoDia(EVENTOS, '2026-09-25').map((e) => e.titulo);
    expect(titulos).toEqual(['Período da 1ª avaliação']);
  });

  it('um dia com mais de um evento traz todos, na ordem da lista', () => {
    const titulos = eventosDoDia(EVENTOS, '2026-10-16').map((e) => e.titulo);
    expect(titulos).toEqual(['Feriado de teste', 'Prazo de teste']);
  });

  it('o último dia de um período ainda conta como coberto', () => {
    const titulos = eventosDoDia(EVENTOS, '2026-10-02').map((e) => e.titulo);
    expect(titulos).toEqual(['Período da 1ª avaliação']);
  });

  it('dia sem evento devolve lista vazia', () => {
    expect(eventosDoDia(EVENTOS, '2026-11-01')).toEqual([]);
  });
});

describe('datasComEventosDoMes', () => {
  it('lista só os dias do mês pedido que têm evento, em ordem', () => {
    const datas = datasComEventosDoMes(EVENTOS, '2026-10');
    expect(datas.map((d) => d.data)).toEqual(['2026-10-01', '2026-10-02', '2026-10-16']);
  });

  it('um período que atravessa meses aparece só nos dias do mês pedido', () => {
    const datas = datasComEventosDoMes(EVENTOS, '2026-09');
    expect(datas.map((d) => d.data)).toEqual([
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30'
    ]);
  });

  it('cada dia traz os seus eventos', () => {
    const outubro16 = datasComEventosDoMes(EVENTOS, '2026-10').find((d) => d.data === '2026-10-16');
    expect(outubro16?.eventos).toHaveLength(2);
  });

  it('mês sem nada devolve lista vazia', () => {
    expect(datasComEventosDoMes(EVENTOS, '2027-03')).toEqual([]);
  });
});

const prova = (cadeiraNome: string, tipo: Prova['tipo'], data = '2026-10-16'): Prova => ({
  data,
  cadeiraId: cadeiraNome.toLowerCase(),
  cadeiraNome,
  tipo
});

describe('provaComoEvento', () => {
  it('uma prova vira um evento de um dia, com categoria do tipo', () => {
    expect(provaComoEvento(prova('Sociologia Jurídica', 'AV2'))).toEqual({
      inicio: '2026-10-16',
      fim: '2026-10-16',
      categoria: 'AV2',
      titulo: '2ª AV: Sociologia Jurídica',
      descricao: 'Segunda avaliação de Sociologia Jurídica.'
    });
  });
});

describe('agruparProvasParaGrade', () => {
  it('uma prova sozinha no dia mantém o nome da cadeira no título', () => {
    const grade = agruparProvasParaGrade([prova('Filosofia Jurídica', 'final', '2026-12-15')]);
    expect(grade).toHaveLength(1);
    expect(grade[0]?.titulo).toBe('Final: Filosofia Jurídica');
  });

  it('provas do mesmo tipo e dia viram um evento só, com a contagem', () => {
    const grade = agruparProvasParaGrade([
      prova('Introdução ao Direito', 'AV2'),
      prova('Português e Redação Jurídica 1', 'AV2'),
      prova('Sociologia Jurídica', 'AV2'),
      prova('Filosofia Jurídica', 'AV2')
    ]);
    expect(grade).toHaveLength(1);
    expect(grade[0]?.titulo).toBe('2ª AV: 4 cadeiras');
    expect(grade[0]?.descricao).toContain('Introdução ao Direito');
    expect(grade[0]?.descricao).toContain('Filosofia Jurídica');
  });

  it('tipos diferentes no mesmo dia continuam em eventos separados', () => {
    const grade = agruparProvasParaGrade([
      prova('Introdução ao Direito', 'chamada', '2026-12-09'),
      prova('Filosofia Jurídica', 'chamada', '2026-12-09'),
      prova('Filosofia Jurídica', 'final', '2026-12-09')
    ]);
    expect(grade.map((e) => e.categoria)).toEqual(['chamada', 'final']);
  });
});
