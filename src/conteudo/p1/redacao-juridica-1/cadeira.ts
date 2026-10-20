import type { DescricaoCadeira } from '../../tipos';

/**
 * Português e Redação Jurídica 1, 1o período. Esta pasta se descreve: nome, ordem no menu e estado
 * vêm daqui. As unidades são as pastas uN, cada uma com o próprio meta.ts.
 */
export const cadeira: DescricaoCadeira = {
  nome: 'Português e Redação Jurídica 1',
  ordem: 2,
  estado: 'publicado',
  // Atalho do menu lateral para a cadeira restrita (ordem do líder, 20/10/2026).
  atalhoUnidade: {
    rotulo: 'Interdisciplinar',
    apos: 'u1',
    cadeiraId: 'interdisciplinar'
  }
};
