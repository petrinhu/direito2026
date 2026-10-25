import type { DescricaoCadeira } from '../../tipos';

/**
 * Sociologia Jurídica, 1o período. Esta pasta se descreve: nome, ordem no menu e estado
 * vêm daqui. As unidades são as pastas uN, cada uma com o próprio meta.ts.
 */
export const cadeira: DescricaoCadeira = {
  nome: 'Sociologia Jurídica',
  ordem: 3,
  estado: 'publicado',
  // Atalho do menu lateral para a cadeira restrita (ordem do líder, 20/10/2026).
  atalhoUnidade: {
    rotulo: 'Interdisciplinar',
    apos: 'u1',
    cadeiraId: 'interdisciplinar'
  },
  // AV3 com Artigos e ECA Digital, cada um item direto (ordem do líder, 25/10/2026: trocar
  // "Resumo" por "Artigos" e acrescentar "ECA digital"). O texto integral vem primeiro por ORDEM_ABAS.
  grupos: [
    { unidade: 'u3', id: 'artigos', rotulo: 'Artigos', direto: true },
    { unidade: 'u3', id: 'eca', rotulo: 'ECA Digital', direto: true }
  ]
};
