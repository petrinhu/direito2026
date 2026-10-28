import type { DescricaoCadeira } from '../../tipos';

/**
 * Júri Simulado: cadeira de acesso restrito com login e senha próprios, separados do
 * Interdisciplinar (área 'juri'). Em breve: o conteúdo ainda não chegou. A página de
 * entrada funciona mesmo assim; o conteúdo entra em outra etapa, pela API depois do login.
 */
export const cadeira: DescricaoCadeira = {
  nome: 'Júri Simulado',
  ordem: 6,
  estado: 'em-breve',
  restrita: true,
  area: 'juri'
};
