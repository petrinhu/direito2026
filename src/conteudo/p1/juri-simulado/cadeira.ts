import type { DescricaoCadeira } from '../../tipos';

/**
 * Júri Simulado: cadeira de acesso restrito com login e senha próprios, separados do
 * Interdisciplinar (área 'juri'). A página de entrada abre sem login; o conteúdo só
 * aparece depois do login, vindo da API.
 */
export const cadeira: DescricaoCadeira = {
  nome: 'Júri Simulado',
  ordem: 6,
  estado: 'publicado',
  restrita: true,
  area: 'juri'
};
