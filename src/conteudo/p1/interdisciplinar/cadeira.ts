import type { DescricaoCadeira } from '../../tipos';

/**
 * Interdisciplinar: cadeira de acesso restrito (login no servidor). Esta pasta
 * só tem a descrição. O conteúdo não está no repositório: ele chega pela API
 * depois do login. Sem unidades aqui, de propósito.
 */
export const cadeira: DescricaoCadeira = {
  nome: 'Interdisciplinar',
  ordem: 5,
  estado: 'publicado',
  restrita: true
};
