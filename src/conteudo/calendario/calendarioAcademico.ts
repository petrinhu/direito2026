import type { EventoDoSemestre, ObservacaoDoSemestre } from '@/core/calendario/tipos';

/**
 * Datas do calendário discente 2026.2 (PDF oficial do semestre, conferido
 * com pdftotext em 20/10/2026). Períodos de avaliação entram com o intervalo
 * inteiro. Os feriados ficam em feriados.ts, e as provas por cadeira em
 * provas.ts.
 */
export const EVENTOS_ACADEMICOS: readonly EventoDoSemestre[] = [
  {
    semestre: '2026.2',
    inicio: '2026-07-07',
    fim: '2026-07-07',
    categoria: 'semestre',
    titulo: 'Editais de monitoria e de pesquisa de extensão',
    descricao: 'Lançamento dos editais de monitoria e de pesquisa de extensão.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-08-03',
    fim: '2026-08-07',
    categoria: 'semestre',
    titulo: 'Abertura do semestre letivo',
    descricao: 'Semana de abertura do semestre, de 3 a 7 de agosto.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-08-03',
    fim: '2026-08-08',
    categoria: 'semestre',
    titulo: 'Semana de encontro docente',
    descricao: 'Semana de encontro docente, de 3 a 8 de agosto.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-08-10',
    fim: '2026-08-10',
    categoria: 'semestre',
    titulo: 'Início das aulas',
    descricao: 'Primeiro dia de aulas do semestre.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-08-24',
    fim: '2026-09-08',
    categoria: 'prazo',
    titulo: 'Período de inclusão de disciplina',
    descricao: 'De 24 de agosto a 8 de setembro. A data limite é 8 de setembro.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-09-10',
    fim: '2026-09-10',
    categoria: 'prazo',
    titulo: 'Prazo para colação de grau unificada',
    descricao: 'Último dia para solicitar a colação de grau unificada na secretaria acadêmica.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-09-14',
    fim: '2026-09-14',
    categoria: 'prazo',
    titulo: 'Prazo para dispensa de disciplinas',
    descricao: 'Último dia para solicitar dispensas de disciplinas no semestre.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-09-21',
    fim: '2026-10-02',
    categoria: 'AV1',
    titulo: 'Período da 1ª avaliação',
    descricao: 'De 21 de setembro a 2 de outubro. A data de cada prova depende do curso.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-10-13',
    fim: '2026-10-16',
    categoria: 'AV2',
    titulo: 'Trabalhos interdisciplinares (2ª avaliação)',
    descricao: 'De 13 a 16 de outubro. Os trabalhos interdisciplinares são a 2ª avaliação.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-10-15',
    fim: '2026-10-15',
    categoria: 'semestre',
    titulo: 'Dia do Professor',
    descricao: 'Data comemorativa do calendário. Não é feriado.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-10-19',
    fim: '2026-10-19',
    categoria: 'prazo',
    titulo: 'Entrega de atestados para abono da taxa de 2ª chamada da 1ª avaliação',
    descricao: 'Último dia para entregar os atestados de abono da taxa da 2ª chamada da 1ª avaliação.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-11-03',
    fim: '2026-11-03',
    categoria: 'prazo',
    titulo: 'Entrega de atestados para abono da taxa de 2ª chamada da 2ª avaliação',
    descricao: 'Entrega dos atestados de abono da taxa da 2ª chamada da 2ª avaliação (interdisciplinar).'
  },
  {
    semestre: '2026.2',
    inicio: '2026-11-23',
    fim: '2026-12-04',
    categoria: 'AV3',
    titulo: 'Período da 3ª avaliação',
    descricao: 'De 23 de novembro a 4 de dezembro. A data de cada prova depende do curso.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-12-07',
    fim: '2026-12-07',
    categoria: 'prazo',
    titulo: 'Entrega de atestados para abono de falta e de 2ª chamada da 3ª avaliação',
    descricao: 'Último dia para entregar atestados de abono de falta e da 2ª chamada da 3ª avaliação.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-12-09',
    fim: '2026-12-11',
    categoria: 'chamada',
    titulo: 'Provas de 2ª chamada',
    descricao: 'Provas de 2ª chamada, de 9 a 11 de dezembro.'
  },
  {
    semestre: '2026.2',
    inicio: '2026-12-15',
    fim: '2026-12-17',
    categoria: 'final',
    titulo: 'Avaliações finais',
    descricao: 'Avaliações finais, de 15 a 17 de dezembro.'
  },
  {
    semestre: '2026.2',
    inicio: '2027-01-04',
    fim: '2027-01-22',
    categoria: 'prazo',
    titulo: 'Rematrícula com desconto 27.1',
    descricao: 'Rematrícula com desconto, de 4 a 22 de janeiro de 2027.'
  }
];

/** Observações do calendário que não têm data própria. */
export const OBSERVACOES_ACADEMICAS: readonly ObservacaoDoSemestre[] = [
  { semestre: '2026.2', texto: 'Revisão de prova: até 10 dias após a divulgação da nota.' },
  { semestre: '2026.2', texto: 'Colação de grau unificada: data a definir.' }
];
