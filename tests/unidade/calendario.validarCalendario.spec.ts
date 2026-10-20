import { describe, expect, it } from 'vitest';
import { validarCalendario, type DadosDoCalendario } from '@/core/calendario/validarCalendario';
import type {
  EventoDoSemestre,
  ObservacaoDoSemestre,
  PrazoDoSemestre,
  ProvaDoSemestre
} from '@/core/calendario/tipos';

const CADEIRAS = new Set(['intr-direito', 'filosofia-juridica']);

const PROVA_OK: ProvaDoSemestre = {
  semestre: '2026.2',
  data: '2026-09-22',
  cadeiraId: 'intr-direito',
  tipo: 'AV1'
};

const FERIADO_OK: EventoDoSemestre = {
  semestre: '2026.2',
  inicio: '2026-09-07',
  fim: '2026-09-07',
  categoria: 'feriado',
  titulo: 'Independência do Brasil',
  descricao: 'Feriado nacional.'
};

const PRAZO_OK: PrazoDoSemestre = {
  semestre: '2026.2',
  data: '2026-11-15',
  descricao: 'o fim das provas online'
};

const OBSERVACAO_OK: ObservacaoDoSemestre = {
  semestre: '2026.2',
  texto: 'Revisão de prova: até 10 dias após a divulgação da nota.'
};

function dados(parcial: Partial<DadosDoCalendario> = {}): DadosDoCalendario {
  return {
    provas: [PROVA_OK],
    feriados: [FERIADO_OK],
    eventosAcademicos: [],
    periodosOnline: [],
    prazos: [PRAZO_OK],
    observacoes: [OBSERVACAO_OK],
    ...parcial
  };
}

const validar = (d: DadosDoCalendario): string[] => validarCalendario(d, { cadeiraIds: CADEIRAS });

describe('validarCalendario: dados válidos', () => {
  it('um calendário limpo não gera erro', () => {
    expect(validar(dados())).toEqual([]);
  });

  it('um semestre novo entra só como dado: 2027.1 com a mesma cadeira e o mesmo tipo não é duplicata', () => {
    const umSemestreNovo: ProvaDoSemestre = { ...PROVA_OK, semestre: '2027.1' };
    expect(validar(dados({ provas: [PROVA_OK, umSemestreNovo] }))).toEqual([]);
  });
});

describe('validarCalendario: datas', () => {
  it('recusa uma data que não existe no calendário (30 de fevereiro)', () => {
    expect(validar(dados({ provas: [{ ...PROVA_OK, data: '2026-02-30' }] }))).toEqual([
      'provas[0]: data inválida "2026-02-30"'
    ]);
  });

  it('recusa data fora do formato AAAA-MM-DD', () => {
    expect(validar(dados({ prazos: [{ ...PRAZO_OK, data: '15/11/2026' }] }))).toEqual([
      'prazos[0]: data inválida "15/11/2026"'
    ]);
  });

  it('recusa evento com fim anterior ao início', () => {
    const invertido: EventoDoSemestre = { ...FERIADO_OK, inicio: '2026-09-08', fim: '2026-09-07' };
    expect(validar(dados({ feriados: [invertido] }))).toEqual([
      'feriados[0]: fim (2026-09-07) antes do início (2026-09-08)'
    ]);
  });
});

describe('validarCalendario: cadeira', () => {
  it('recusa prova de cadeira que não existe no currículo', () => {
    expect(validar(dados({ provas: [{ ...PROVA_OK, cadeiraId: 'xpto' }] }))).toEqual([
      'provas[0]: cadeiraId desconhecido "xpto"'
    ]);
  });
});

describe('validarCalendario: duplicata', () => {
  it('recusa a mesma cadeira com o mesmo tipo no mesmo semestre', () => {
    expect(validar(dados({ provas: [PROVA_OK, { ...PROVA_OK, data: '2026-09-23' }] }))).toEqual([
      'provas[1]: prova duplicada (2026.2, intr-direito, AV1)'
    ]);
  });
});

describe('validarCalendario: categoria e tipo', () => {
  it('recusa categoria de evento fora da lista fechada', () => {
    const estranho = { ...FERIADO_OK, categoria: 'xpto' } as unknown as EventoDoSemestre;
    expect(validar(dados({ eventosAcademicos: [estranho] }))).toEqual([
      'eventosAcademicos[0]: categoria desconhecida "xpto"'
    ]);
  });

  it('recusa tipo de prova fora da lista fechada', () => {
    const estranho = { ...PROVA_OK, tipo: 'AV9' } as unknown as ProvaDoSemestre;
    expect(validar(dados({ provas: [estranho] }))).toEqual(['provas[0]: tipo desconhecido "AV9"']);
  });
});

describe('validarCalendario: semestre e texto', () => {
  it('recusa semestre fora do formato AAAA.N', () => {
    expect(validar(dados({ feriados: [{ ...FERIADO_OK, semestre: '2026-2' }] }))).toEqual([
      'feriados[0]: semestre inválido "2026-2"'
    ]);
  });

  it('recusa observação sem texto', () => {
    expect(validar(dados({ observacoes: [{ ...OBSERVACAO_OK, texto: '   ' }] }))).toEqual([
      'observacoes[0]: texto vazio'
    ]);
  });
});
