import type { FichaPensador, MapaFichamento } from '../../../tipos';

/**
 * Fonte única do Mapa mental e do Fichamento da unidade. As fases são os temas
 * do resumo. Só entram fichas de autores com ideia atribuída pela disciplina.
 * Os autores que a disciplina apenas indica aparecem no resumo, sem ficha.
 */

const kelsen: FichaPensador = {
  id: 'kelsen',
  nome: 'Hans Kelsen',
  nomeCurto: 'Kelsen',
  faseId: 'pureza',
  obras: ['Teoria Pura do Direito'],
  modoDePensar:
    'Estuda o Direito de forma "pura", buscando o caráter essencialmente jurídico do Direito, sem confundi-lo com a moral, a política, a sociologia ou a psicologia. A pureza é um princípio de método. As normas criadas por autoridade competente se organizam numa estrutura hierárquica, em que cada uma retira sua validade de outra superior. Aplicar o Direito é, para ele, um ato de vontade e não apenas de conhecimento, e a interpretação tem uma moldura, dentro da qual há mais de uma solução válida.',
  conceitos: [
    'Pureza como princípio metodológico',
    'Fato e significado jurídico do ato',
    'Sentido subjetivo e sentido objetivo',
    'Validade formal e norma fundamental (Grundnorm)',
    'Estrutura hierárquica e estrutura lógica da norma',
    'Moldura da interpretação, ato de vontade e o que fica fora da moldura'
  ],
  paraODireito:
    'O ponto central é estudar o direito sem confundi-lo com a moral, a política, a sociologia ou a psicologia, e perguntar se um ato tem validade jurídica, e não apenas se ele aconteceu.',
  referencias: [
    'KELSEN, Hans. Teoria Pura do Direito. Indicado na disciplina, sem edição informada.'
  ],
  blocoResumo: 'bloco-1'
};

const hart: FichaPensador = {
  id: 'hart',
  nome: 'H. L. A. Hart',
  nomeCurto: 'Hart',
  faseId: 'textura',
  obras: ['O conceito de Direito, capítulo Textura aberta do Direito'],
  modoDePensar:
    'A disciplina indica o capítulo sobre a textura aberta do Direito, na obra O conceito de Direito. O exemplo usado para o tema é a regra que proíbe a entrada de veículos no parque.',
  conceitos: [
    'Textura aberta do Direito (capítulo indicado)',
    'Exemplo: a proibição de entrada de veículos no parque'
  ],
  paraODireito:
    'A disciplina apresenta o exemplo do parque e indica o capítulo sobre a textura aberta para o estudo do tema.',
  ressalva:
    'A ficha traz só o que a disciplina indica: o título do capítulo e o exemplo. O desenvolvimento do conceito não está transcrito aqui.',
  referencias: [
    'HART, H. L. A. O conceito de Direito. Capítulo Textura aberta do Direito, indicado na disciplina.'
  ],
  blocoResumo: 'bloco-7'
};

export const mapaFichamento: MapaFichamento = {
  titulo: 'Norma, interpretação e fontes do Direito',
  eras: [
    {
      id: 'fontes-integracao',
      nome: 'Bloco 1: Fontes, integração e decisão',
      fases: [
        { id: 'fontes', nome: 'Fontes do direito' },
        { id: 'integracao', nome: 'Meios de integração' },
        { id: 'sentenca', nome: 'Fundamentação e sentença' },
        { id: 'precedentes', nome: 'Precedente, jurisprudência e súmula' }
      ]
    },
    {
      id: 'teoria-pura',
      nome: 'Bloco 2: Teoria Pura de Kelsen',
      fases: [
        { id: 'pureza', nome: 'Pureza e ato com significado jurídico' },
        { id: 'norma', nome: 'A norma e a validade' },
        { id: 'estrutura', nome: 'Estrutura hierárquica e lógica' },
        { id: 'interpretacao', nome: 'Da interpretação' }
      ]
    },
    {
      id: 'norma-linguagem',
      nome: 'Bloco 3: A norma e a linguagem',
      fases: [
        { id: 'caracteres', nome: 'Caracteres e classificações' },
        { id: 'semiotica', nome: 'Sintaxe, semântica e pragmática' },
        { id: 'textura', nome: 'Textura aberta' }
      ]
    },
    {
      id: 'direitos-ramos',
      nome: 'Bloco 4: Direitos e ramos',
      fases: [
        { id: 'subjetivo-objetivo', nome: 'Direito subjetivo e objetivo' },
        { id: 'ramos', nome: 'Ramos público e privado' }
      ]
    }
  ],
  pensadores: [kelsen, hart]
};
