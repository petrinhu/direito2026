import type { Cadeira, Curriculo, Periodo, ReferenciaUnidade } from './tipos';

/**
 * Os dez períodos do curso. Hoje só existe uma unidade publicada: 1o
 * período, Introdução ao Direito, 1a unidade (a do piloto). Todo o resto
 * nasce marcado como 'em-breve', sem cadeira nem unidade inventada: o que
 * não é conhecido fica com `cadeiras: []`, e não com nomes fabricados.
 *
 * `carregar` (o carregador sob demanda do conteúdo de cada unidade) NÃO é
 * atribuído aqui: por desenho (docs/arquitetura.md, seção 4.1, comentário
 * de `ReferenciaUnidade.carregar`), essa função é implementada em
 * src/app/carregamento, camada que importa este currículo e decora cada
 * unidade publicada com o `() => import(...)` correspondente antes de
 * expor a árvore ao roteador. Isso mantém a dependência unidirecional da
 * seção 2 do plano: src/conteudo/ nunca importa de src/app/.
 */

const unidade1IntrDireito: ReferenciaUnidade = {
  id: 'u1',
  rotulo: 'Unidade 1',
  titulo: 'Resumo de estudo, petição comentada e quiz',
  estado: 'publicado',
  abas: ['resumo', 'peticao', 'quiz'],
};

const cadeiraIntrDireito: Cadeira = {
  id: 'intr-direito',
  nome: 'Introdução ao Direito',
  estado: 'publicado',
  unidades: [unidade1IntrDireito],
};

const unidade1RedacaoJuridica: ReferenciaUnidade = {
  id: 'u1',
  rotulo: 'Unidade 1',
  titulo: 'Resumo de estudo, petição comentada e quiz',
  estado: 'publicado',
  abas: ['resumo', 'peticao', 'quiz'],
};

const cadeiraRedacaoJuridica: Cadeira = {
  id: 'redacao-juridica-1',
  nome: 'Português e Redação Jurídica 1',
  estado: 'publicado',
  unidades: [unidade1RedacaoJuridica],
};

const periodo1: Periodo = {
  id: 'p1',
  numero: 1,
  rotulo: '1º período',
  cadeiras: [cadeiraIntrDireito, cadeiraRedacaoJuridica],
};

function periodoEmBreve(numero: number): Periodo {
  return {
    id: `p${numero}`,
    numero,
    rotulo: `${numero}º período`,
    cadeiras: [],
  };
}

export const curriculo: Curriculo = [
  periodo1,
  periodoEmBreve(2),
  periodoEmBreve(3),
  periodoEmBreve(4),
  periodoEmBreve(5),
  periodoEmBreve(6),
  periodoEmBreve(7),
  periodoEmBreve(8),
  periodoEmBreve(9),
  periodoEmBreve(10),
];
