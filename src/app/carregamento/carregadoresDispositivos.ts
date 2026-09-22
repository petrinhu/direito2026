import type { IndiceDispositivos } from '@/core/dispositivos/tipos';

export type RegistroDeCarregadoresDispositivos = Record<string, () => Promise<IndiceDispositivos>>;

/**
 * Prioridade zero (achado do líder, medido: em produção o balão de
 * citação legal não abria e o apêndice de impressão nunca aparecia).
 * Causa: Unidade.vue chamava um import() dinâmico com caminho montado em
 * TEMPO DE EXECUÇÃO (template string com os três segmentos da rota) e o
 * comentário mágico do Vite que desliga o aviso de análise estática — o
 * Vite/Rollup
 * não consegue enxergar isso em tempo de CONSTRUÇÃO, então nenhum pedaço é
 * gerado para esse módulo. Em produção, a rota pedida cai no fallback da
 * SPA (devolve index.html, 200), o `import()` recebe HTML em vez de
 * JavaScript e falha; o `catch` silencioso escondia o erro.
 *
 * Correção: mesmo padrão já usado e comprovado por src/app/carregamento/
 * carregadores.ts (RegistroDeCarregadores) para o conteúdo da unidade — um
 * `import()` de CAMINHO LITERAL por unidade publicada, que o empacotador
 * enxerga e transforma em pedaço de verdade. Uma entrada por unidade
 * publicada é natural nesta escala (regra de 3, L-33); quando a terceira
 * entrada chegar, extrair um gerador é a decisão certa, não antes.
 */
export const CARREGADORES_DISPOSITIVOS: RegistroDeCarregadoresDispositivos = {
  'p1/intr-direito/u1': async (): Promise<IndiceDispositivos> => {
    const { dispositivos } = await import('@/conteudo/p1/intr-direito/u1/dispositivos');
    return dispositivos;
  }
};
