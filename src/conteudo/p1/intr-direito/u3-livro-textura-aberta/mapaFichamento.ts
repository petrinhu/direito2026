import type { FichaPensador, MapaFichamento } from '../../../tipos';

/**
 * Fonte única do Mapa mental e do Fichamento da Unidade 3 de Introdução ao
 * Direito. As fases são os temas do trecho de Hart. A única ficha é a do
 * próprio Hart: as referências que aparecem só nas notas da tradução não viram
 * pensadores. Cada ficha aponta para um bloco do resumo que existe.
 */

const hart: FichaPensador = {
  id: 'hart',
  nome: 'H. L. A. Hart',
  nomeCurto: 'Hart',
  faseId: 'textura-linguagem',
  obras: ['O Conceito de Direito, cap. VII, seção 1 (trecho desta unidade)'],
  modoDePensar:
    'As regras gerais comunicam padrões de conduta com eficácia nos casos familiares, mas se tornam indeterminadas na linha de fronteira, que é a textura aberta da linguagem. Nessa zona, aplicar a regra exige uma escolha nova, e o formalismo é a atitude que finge que essa escolha não existe.',
  conceitos: [
    'Textura aberta: a incerteza que a linguagem geral tem na linha de fronteira',
    'Casos simples e casos de penumbra',
    'Legislação (uso máximo de palavras gerais) e precedente (uso mínimo)',
    'Ignorância de fato e indeterminação de finalidade como causas da textura aberta',
    'Formalismo ou conceptualismo como atitude que disfarça a escolha',
    'Padrões variáveis, delegação a órgãos administrativos e função criadora dos tribunais'
  ],
  citacao: {
    texto: 'a necessidade de tal escolha é lançada sobre nós porque somos homens, não deuses',
    fonte: 'HART, cap. VII, seção 1, p. 141.'
  },
  paraODireito:
    'Para quem estuda o direito, Hart mostra que a regra escrita orienta a maioria dos casos e dá às pessoas uma orientação que pode ser seguida sem consultar uma autoridade. Na penumbra, porém, quem aplica a regra faz uma escolha que precisa ser justificada pelas finalidades do sistema.',
  referencias: [
    'HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1.'
  ],
  blocoResumo: 'bloco-3'
};

export const mapaFichamento: MapaFichamento = {
  titulo: 'A textura aberta do direito',
  eras: [
    {
      id: 'comunicacao',
      nome: 'Bloco 1: Comunicar padrões de conduta',
      fases: [
        { id: 'regras-gerais', nome: 'Por que o direito usa regras gerais' },
        { id: 'legislacao-precedente', nome: 'Legislação e precedente' }
      ]
    },
    {
      id: 'textura',
      nome: 'Bloco 2: A textura aberta',
      fases: [
        { id: 'casos-penumbra', nome: 'Casos claros e casos de penumbra' },
        { id: 'textura-linguagem', nome: 'A textura aberta da linguagem' },
        { id: 'exemplo-veiculos', nome: 'O exemplo das regras sobre veículos' }
      ]
    },
    {
      id: 'formalismo',
      nome: 'Bloco 3: Formalismo e padrões variáveis',
      fases: [
        { id: 'formalismo', nome: 'Formalismo ou conceptualismo' },
        { id: 'padroes-variaveis', nome: 'Padrões muito gerais e delegação' },
        { id: 'cuidado-devido', nome: 'O cuidado devido' },
        { id: 'regra-fixa', nome: 'Regras fixas: homicídio e convenções' }
      ]
    },
    {
      id: 'precedentes',
      nome: 'Bloco 4: Precedentes e função criadora',
      fases: [{ id: 'funcao-criadora', nome: 'Precedentes e função criadora dos tribunais' }]
    }
  ],
  pensadores: [hart]
};
