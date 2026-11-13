import type { ChaveUnidade } from '@/core/progresso/tipos';

/**
 * Instante em que cada quiz que CRESCEU já estava no ar com o acréscimo (AV3-K4).
 * Resposta salva antes desse instante foi dada na forma antiga e não é traduzível
 * com segurança: zera. Ver docs/arquitetura.md, seção 8. O valor é o instante de
 * "publicado" do log da publicação (chega depois de a virada, e um corte tardio só zera a mais).
 */
export const CORTES_QUIZ_CRESCEU: Readonly<Record<ChaveUnidade, string>> = {
  // v1.9.0.0: Introdução u3 material, de 40 para 50 (publicar-1900.log:71).
  'p1/intr-direito/u3-material-norma-interpretacao': '2026-11-13T16:07:25-03:00',
  // v1.8.0.0: ECA Digital, de 40 para 50 (publicar-1800.log:71).
  'p1/sociologia-juridica/u3-eca-digital': '2026-11-13T09:16:34-03:00'
};
