import type { Prova } from '@/core/calendario/tipos';

/**
 * Provas por cadeira do semestre 2026.2. Fonte: quadro de avaliações do
 * próprio semestre (fatos transcritos pelo líder, 20/10/2026, e conferidos
 * contra a imagem "Calendário de avaliações 2026.2" do líder). Só as datas
 * das provas: o período de cada avaliação está em calendarioAcademico.ts.
 *
 * Nomes e ids de cadeira seguem src/conteudo/curriculo.ts. Economia e
 * Empreendedorismo não entram aqui: seguem a sala digital, não o quadro.
 */
export const PROVAS_2026_2: readonly Prova[] = [
  { data: '2026-09-22', cadeiraId: 'intr-direito', cadeiraNome: 'Introdução ao Direito', tipo: 'AV1' },
  { data: '2026-10-16', cadeiraId: 'intr-direito', cadeiraNome: 'Introdução ao Direito', tipo: 'AV2' },
  { data: '2026-11-24', cadeiraId: 'intr-direito', cadeiraNome: 'Introdução ao Direito', tipo: 'AV3' },
  { data: '2026-12-09', cadeiraId: 'intr-direito', cadeiraNome: 'Introdução ao Direito', tipo: 'chamada' },
  { data: '2026-12-15', cadeiraId: 'intr-direito', cadeiraNome: 'Introdução ao Direito', tipo: 'final' },

  { data: '2026-09-28', cadeiraId: 'redacao-juridica-1', cadeiraNome: 'Português e Redação Jurídica 1', tipo: 'AV1' },
  { data: '2026-10-16', cadeiraId: 'redacao-juridica-1', cadeiraNome: 'Português e Redação Jurídica 1', tipo: 'AV2' },
  { data: '2026-11-30', cadeiraId: 'redacao-juridica-1', cadeiraNome: 'Português e Redação Jurídica 1', tipo: 'AV3' },
  { data: '2026-12-10', cadeiraId: 'redacao-juridica-1', cadeiraNome: 'Português e Redação Jurídica 1', tipo: 'chamada' },
  { data: '2026-12-16', cadeiraId: 'redacao-juridica-1', cadeiraNome: 'Português e Redação Jurídica 1', tipo: 'final' },

  { data: '2026-09-30', cadeiraId: 'sociologia-juridica', cadeiraNome: 'Sociologia Jurídica', tipo: 'AV1' },
  { data: '2026-10-16', cadeiraId: 'sociologia-juridica', cadeiraNome: 'Sociologia Jurídica', tipo: 'AV2' },
  { data: '2026-12-02', cadeiraId: 'sociologia-juridica', cadeiraNome: 'Sociologia Jurídica', tipo: 'AV3' },
  { data: '2026-12-11', cadeiraId: 'sociologia-juridica', cadeiraNome: 'Sociologia Jurídica', tipo: 'chamada' },
  { data: '2026-12-17', cadeiraId: 'sociologia-juridica', cadeiraNome: 'Sociologia Jurídica', tipo: 'final' },

  { data: '2026-10-01', cadeiraId: 'filosofia-juridica', cadeiraNome: 'Filosofia Jurídica', tipo: 'AV1' },
  { data: '2026-10-16', cadeiraId: 'filosofia-juridica', cadeiraNome: 'Filosofia Jurídica', tipo: 'AV2' },
  { data: '2026-12-03', cadeiraId: 'filosofia-juridica', cadeiraNome: 'Filosofia Jurídica', tipo: 'AV3' },
  { data: '2026-12-09', cadeiraId: 'filosofia-juridica', cadeiraNome: 'Filosofia Jurídica', tipo: 'chamada' },
  { data: '2026-12-15', cadeiraId: 'filosofia-juridica', cadeiraNome: 'Filosofia Jurídica', tipo: 'final' }
];
