import type { DescricaoCadeira } from '../../tipos';

/**
 * Introdução ao Direito, 1o período. Esta pasta se descreve: nome, ordem no menu e estado
 * vêm daqui. As unidades são as pastas uN, cada uma com o próprio meta.ts.
 */
export const cadeira: DescricaoCadeira = {
  nome: 'Introdução ao Direito',
  ordem: 1,
  estado: 'publicado',
  // Atalho do menu lateral para a cadeira restrita (ordem do líder, 20/10/2026).
  atalhoUnidade: {
    rotulo: 'Interdisciplinar',
    apos: 'u1',
    cadeiraId: 'interdisciplinar'
  },
  // AV3 com Livro e Material de estudo (ordem do líder, 22/10/2026): tópicos uN-grupo-topico.
  grupos: [
    { unidade: 'u3', id: 'livro', rotulo: 'Livro' },
    { unidade: 'u3', id: 'material', rotulo: 'Material de estudo' }
  ]
};
