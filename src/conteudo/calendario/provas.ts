import type { EventoDoSemestre, PrazoDoSemestre, ProvaDoSemestre } from '@/core/calendario/tipos';

/**
 * Provas por cadeira. Cada item traz o semestre e o id da cadeira; o nome
 * sai do currículo (resolverProvas, em app/calendario/dadosDoCalendario.ts).
 * Para acrescentar um semestre, acrescente itens aqui: nenhum código muda.
 *
 * Fonte das provas 2026.2: quadro de avaliações do próprio semestre (fatos
 * transcritos pelo líder, 20/10/2026, conferidos contra a imagem "Calendário de
 * avaliações 2026.2"). Só as datas das provas: o período de cada avaliação está
 * em calendarioAcademico.ts.
 *
 * Economia e Empreendedorismo não entram aqui: fazem provas online, na sala
 * digital, no período de PERIODOS_ONLINE (abaixo).
 */
export const PROVAS: readonly ProvaDoSemestre[] = [
  { semestre: '2026.2', data: '2026-09-22', cadeiraId: 'intr-direito', tipo: 'AV1' },
  { semestre: '2026.2', data: '2026-10-16', cadeiraId: 'intr-direito', tipo: 'AV2' },
  { semestre: '2026.2', data: '2026-11-24', cadeiraId: 'intr-direito', tipo: 'AV3' },
  { semestre: '2026.2', data: '2026-12-09', cadeiraId: 'intr-direito', tipo: 'chamada' },
  { semestre: '2026.2', data: '2026-12-15', cadeiraId: 'intr-direito', tipo: 'final' },

  { semestre: '2026.2', data: '2026-09-28', cadeiraId: 'redacao-juridica-1', tipo: 'AV1' },
  { semestre: '2026.2', data: '2026-10-16', cadeiraId: 'redacao-juridica-1', tipo: 'AV2' },
  { semestre: '2026.2', data: '2026-11-30', cadeiraId: 'redacao-juridica-1', tipo: 'AV3' },
  { semestre: '2026.2', data: '2026-12-10', cadeiraId: 'redacao-juridica-1', tipo: 'chamada' },
  { semestre: '2026.2', data: '2026-12-16', cadeiraId: 'redacao-juridica-1', tipo: 'final' },

  { semestre: '2026.2', data: '2026-09-30', cadeiraId: 'sociologia-juridica', tipo: 'AV1' },
  { semestre: '2026.2', data: '2026-10-16', cadeiraId: 'sociologia-juridica', tipo: 'AV2' },
  { semestre: '2026.2', data: '2026-12-02', cadeiraId: 'sociologia-juridica', tipo: 'AV3' },
  { semestre: '2026.2', data: '2026-12-11', cadeiraId: 'sociologia-juridica', tipo: 'chamada' },
  { semestre: '2026.2', data: '2026-12-17', cadeiraId: 'sociologia-juridica', tipo: 'final' },

  { semestre: '2026.2', data: '2026-10-01', cadeiraId: 'filosofia-juridica', tipo: 'AV1' },
  { semestre: '2026.2', data: '2026-10-16', cadeiraId: 'filosofia-juridica', tipo: 'AV2' },
  { semestre: '2026.2', data: '2026-12-03', cadeiraId: 'filosofia-juridica', tipo: 'AV3' },
  { semestre: '2026.2', data: '2026-12-09', cadeiraId: 'filosofia-juridica', tipo: 'chamada' },
  { semestre: '2026.2', data: '2026-12-15', cadeiraId: 'filosofia-juridica', tipo: 'final' }
];

/**
 * Provas online de Economia e de Empreendedorismo (sala digital), de 13/10 a
 * 15/11/2026 (ordem do líder, 20/10/2026). É um período de vários dias, não
 * uma prova por dia, e tem categoria própria (online) no calendário.
 */
export const PERIODOS_ONLINE: readonly EventoDoSemestre[] = [
  {
    semestre: '2026.2',
    inicio: '2026-10-13',
    fim: '2026-11-15',
    categoria: 'online',
    titulo: 'Provas online: Economia e Empreendedorismo',
    descricao:
      'Provas online de Economia e de Empreendedorismo (sala digital): de 13/10 a 15/11/2026.'
  }
];

/**
 * Prazos que o contador do quadro considera além das provas: o fim de um
 * período (ex.: o fim das provas online). `descricao` completa a frase do
 * contador: "Faltam N dias para <descricao>".
 */
export const PRAZOS: readonly PrazoDoSemestre[] = [
  {
    semestre: '2026.2',
    data: '2026-11-15',
    descricao: 'o fim das provas online de Economia e Empreendedorismo'
  }
];
