import type { MetaUnidade } from '../../../tipos';

/**
 * Metadados da 1a unidade de Português e Redação Jurídica 1 (1o período).
 * A lista das três seções (resumo, petição, quiz) mora em `abas`, em
 * `curriculo.ts`, e não é repetida aqui (mesma regra da unidade-piloto,
 * ver src/conteudo/p1/intr-direito/u1/meta.ts).
 */
export const meta: MetaUnidade = {
  titulo: 'Resumo de estudo, petição comentada e quiz',
  subtitulo: 'Português e Redação Jurídica 1 · faculdade · 1º período',
  descricao:
    'Material de revisão organizado a partir do conteúdo trabalhado em sala: comunicação e argumentação jurídica, o método fato/fundamento/pedido, o caso dos exploradores da caverna, a petição comentada dos casos Marina e Ricardo e Ana e Carlos, e um quiz de 30 perguntas com feedback explicado.',
};
