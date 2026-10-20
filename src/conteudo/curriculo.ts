import type { AtalhoUnidade, Cadeira, Curriculo, Periodo, ReferenciaUnidade } from './tipos';

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

/**
 * Ordem do líder: "ponha em todas as disciplinas (no menu lateral) que a
 * segunda unidade é o interdisciplinar (link para ele)". Mesmo atalho nas
 * quatro cadeiras públicas; aponta para a cadeira restrita, sem página nova.
 *
 * Ordem do líder (20/10/2026): "A estrutura do menu lateral deve ser:
 * Filosofia Jurídica | -- Unidade 1 | -- Interdisciplinar | -- Unidade 3.
 * Deve ser recolhível, como já é. O mesmo pras outras cadeiras". Por isso o
 * rótulo é só 'Interdisciplinar', sem o prefixo "Unidade 2", e o atalho cai
 * depois da Unidade 1 (`apos`), dentro da lista recolhível da cadeira.
 */
const atalhoInterdisciplinar: AtalhoUnidade = {
  rotulo: 'Interdisciplinar',
  apos: 'u1',
  cadeiraId: 'interdisciplinar',
};

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
  atalhoUnidade: atalhoInterdisciplinar,
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
  atalhoUnidade: atalhoInterdisciplinar,
};

/**
 * Sociologia Jurídica não tem petição: só resumo e quiz. As abas listadas
 * aqui são o que rota, menu, trilha, busca e cartão da home seguem.
 */
const unidade1Sociologia: ReferenciaUnidade = {
  id: 'u1',
  rotulo: 'Unidade 1',
  titulo: 'Resumo de estudo e quiz',
  estado: 'publicado',
  abas: ['resumo', 'quiz'],
};

const cadeiraSociologia: Cadeira = {
  id: 'sociologia-juridica',
  nome: 'Sociologia Jurídica',
  estado: 'publicado',
  unidades: [unidade1Sociologia],
  atalhoUnidade: atalhoInterdisciplinar,
};

/**
 * Filosofia Jurídica (Idade Antiga e Idade Média) não tem petição. Além do
 * resumo e do quiz, tem mapa mental, fichamento e mnemônicos, nessa ordem
 * (ordem do líder, 01/10/2026); as três abas novas leem a mesma fonte de
 * dados da unidade.
 */
const unidade1Filosofia: ReferenciaUnidade = {
  id: 'u1',
  rotulo: 'Unidade 1',
  titulo: 'Resumo, mapa mental, fichamento, mnemônicos e quiz',
  estado: 'publicado',
  abas: ['resumo', 'mapa', 'fichamento', 'mnemonicos', 'quiz'],
};

/**
 * Unidade 3 de Filosofia Jurídica (ordem do líder): Filosofia Moderna e
 * Contemporânea, com as mesmas abas da 1a. Os arquivos do conteúdo moram em
 * src/conteudo/p1/filosofia-juridica/u3/ e entram por src/app/carregamento.
 */
const unidade3Filosofia: ReferenciaUnidade = {
  id: 'u3',
  rotulo: 'Unidade 3',
  titulo: 'Filosofia Moderna e Contemporânea',
  estado: 'publicado',
  abas: ['resumo', 'mapa', 'fichamento', 'mnemonicos', 'quiz'],
};

const cadeiraFilosofia: Cadeira = {
  id: 'filosofia-juridica',
  nome: 'Filosofia Jurídica',
  estado: 'publicado',
  unidades: [unidade1Filosofia, unidade3Filosofia],
  atalhoUnidade: atalhoInterdisciplinar,
};

/**
 * Interdisciplinar é a única cadeira de acesso restrito (ordem do líder,
 * 05/10/2026): sem unidade aqui de propósito, o conteúdo mora fora do
 * repositório e só chega pela API depois do login (docs/arquitetura.md,
 * seção "Área restrita").
 */
const cadeiraInterdisciplinar: Cadeira = {
  id: 'interdisciplinar',
  nome: 'Interdisciplinar',
  estado: 'publicado',
  restrita: true,
  unidades: [],
};

const periodo1: Periodo = {
  id: 'p1',
  numero: 1,
  rotulo: '1º período',
  cadeiras: [
    cadeiraIntrDireito,
    cadeiraRedacaoJuridica,
    cadeiraSociologia,
    cadeiraFilosofia,
    cadeiraInterdisciplinar,
  ],
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
