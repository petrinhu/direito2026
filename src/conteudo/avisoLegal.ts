/**
 * Aviso legal do rodapé (ordem do líder, 20/10/2026). Texto aprovado pelo
 * líder, usado literalmente. Para editar o texto, mexa só aqui: o componente
 * src/ui/componentes/AvisoLegal.vue só põe o rótulo em negrito e o corpo ao
 * lado. tests/unidade/conteudo.avisoLegal.spec.ts guarda a redação aprovada.
 */
export const AVISO_LEGAL = {
  rotulo: 'Aviso:',
  corpo:
    'este site não é oficial e não tem vínculo com a instituição de ensino nem com seus professores. É um projeto pessoal, independente e gratuito, feito para apoiar os estudos da turma de Direito. O conteúdo foi preparado a partir de materiais de aula, mas a seleção, a redação e eventuais erros são de responsabilidade exclusiva do autor, e não dos professores nem da instituição. O material é oferecido como está, apenas para estudo, sem garantia de exatidão ou atualização, e não substitui as aulas, a bibliografia indicada nem orientação jurídica profissional.'
} as const;
