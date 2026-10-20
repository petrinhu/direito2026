import type { Evento } from '@/core/calendario/tipos';

/**
 * Feriados da janela de 01/07/2026 a 31/01/2027: nacionais e do Recife.
 * Pernambuco não tem feriado estadual nessa janela: a Data Magna (6 de março)
 * cai fora dela. Fontes da conferência (20/10/2026):
 *
 * - Nacionais: Lei nº 14.759/2023 (20 de novembro, Consciência Negra), citada
 *   no Planalto; demais datas nacionais conferidas em notícia que transcreve a
 *   Portaria MGI nº 11.460/2025 (calendário de feriados de 2026) e no PDF do
 *   calendário discente 2026.2 (marca 07/09, 12/10, 02/11 e 20/11 como
 *   FERIADO). O Planalto ficou inacessível nesta sessão: conferir as datas
 *   nacionais no Planalto antes de publicar.
 * - Pernambuco: Lei nº 16.241/2017, art. 49, consultada no ALEPE (texto
 *   anotado, id=28224). Data Magna em 6 de março, fora da janela.
 * - Recife (municipais): 16 de julho (Nossa Senhora do Carmo) e 8 de dezembro
 *   (Nossa Senhora da Conceição), listados pelo TRT6 como feriados municipais do
 *   Recife e noticiados pelo Diário de Pernambuco (dez/2025 e jul/2026). O número
 *   da lei municipal e o decreto NÃO foram localizados: pendência de conferência
 *   no Diário Oficial do Recife.
 *
 * Ficam de fora, de propósito: Sexta-feira Santa, Corpus Christi, São João
 * (feriado municipal, 24/06) e 12/03 (aniversário do Recife), porque caem antes de
 * 01/07/2026 ou não são feriado; e os dias de ponto facultativo do fim de ano.
 */
export const FERIADOS_2026_2: readonly Evento[] = [
  {
    inicio: '2026-07-16',
    fim: '2026-07-16',
    categoria: 'feriado',
    titulo: 'Nossa Senhora do Carmo',
    descricao: 'Feriado municipal do Recife.'
  },
  {
    inicio: '2026-09-07',
    fim: '2026-09-07',
    categoria: 'feriado',
    titulo: 'Independência do Brasil',
    descricao: 'Feriado nacional.'
  },
  {
    inicio: '2026-10-12',
    fim: '2026-10-12',
    categoria: 'feriado',
    titulo: 'Nossa Senhora Aparecida',
    descricao: 'Feriado nacional: Nossa Senhora Aparecida.'
  },
  {
    inicio: '2026-11-02',
    fim: '2026-11-02',
    categoria: 'feriado',
    titulo: 'Finados',
    descricao: 'Feriado nacional.'
  },
  {
    inicio: '2026-11-15',
    fim: '2026-11-15',
    categoria: 'feriado',
    titulo: 'Proclamação da República',
    descricao: 'Feriado nacional.'
  },
  {
    inicio: '2026-11-20',
    fim: '2026-11-20',
    categoria: 'feriado',
    titulo: 'Dia Nacional de Zumbi e da Consciência Negra',
    descricao: 'Feriado nacional (Lei nº 14.759/2023).'
  },
  {
    inicio: '2026-12-08',
    fim: '2026-12-08',
    categoria: 'feriado',
    titulo: 'Nossa Senhora da Conceição',
    descricao: 'Feriado municipal do Recife.'
  },
  {
    inicio: '2026-12-25',
    fim: '2026-12-25',
    categoria: 'feriado',
    titulo: 'Natal',
    descricao: 'Feriado nacional.'
  },
  {
    inicio: '2027-01-01',
    fim: '2027-01-01',
    categoria: 'feriado',
    titulo: 'Confraternização Universal',
    descricao: 'Feriado nacional.'
  }
];
