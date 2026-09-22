import type { MetaUnidade } from '../../../tipos';

/**
 * Metadados da 1a unidade de Introdução ao Direito (1o período). Extraídos
 * do cabeçalho do piloto (seção "capa"). A menção à instituição de ensino
 * foi substituída pela palavra genérica "faculdade", por instrução do líder.
 * A lista das três seções (resumo, petição, quiz) mora em `abas`, em
 * `curriculo.ts`, e não é repetida aqui porque `MetaUnidade` não tem esse
 * campo (docs/arquitetura.md, seção 4.2).
 */
export const meta: MetaUnidade = {
  titulo: 'Resumo de estudo, petição comentada e quiz',
  subtitulo: 'Introdução ao Direito · faculdade · 1º período',
  descricao:
    'Material de revisão organizado a partir do conteúdo efetivamente trabalhado em sala: 9 blocos teóricos, a petição comentada do caso Juliana Silva x Renata Rocha, e um quiz de 60 perguntas com feedback explicado.',
};
