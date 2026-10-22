import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 11 a 18 do quiz: caracteres e classificações da norma, semiótica e
 * textura aberta. Todas de múltipla escolha com quatro alternativas. As
 * explicações descrevem o conteúdo de cada alternativa, sem indicar posição,
 * porque o motor embaralha as respostas a cada rodada.
 */
export const norma: readonly PerguntaQuiz[] = [
  { id: 11, categoria: 'norma-caracteres', enunciadoHtml: `Qual característica da norma jurídica faz com que não haja direito sem dever correspondente?`, alternativasHtml: [
        `Generalidade, que faz a norma valer para todos em igual situação.`,
        `Abstratividade, que faz a norma regular situações típicas, e não casos individuais.`,
        `Coercibilidade, que é a possibilidade de uso da força para garantir o cumprimento.`,
        `Bilateralidade, pela qual a norma vincula uma parte com direito e outra com dever.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `A bilateralidade vincula duas partes, uma com direito e outra com dever, e por isso não há direito sem dever correspondente. A generalidade garante a igualdade perante a lei, mas não trata dessa correspondência. A abstratividade diz respeito às situações típicas que a norma regula. A coercibilidade é a possibilidade de uso da força, que é outra característica.` },

    { id: 12, categoria: 'norma-caracteres', enunciadoHtml: `A penhora de bens em caso de dívida não paga exemplifica qual característica da norma jurídica?`, alternativasHtml: [
        `Coercibilidade, a possibilidade de uso da força para garantir o cumprimento.`,
        `Imperatividade, pela qual a norma impõe condutas e não é mero conselho.`,
        `Generalidade, pela qual a norma se aplica a todos em igual situação.`,
        `Bilateralidade, pela qual a norma vincula uma parte com direito e outra com dever.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A penhora é o uso da força para garantir o cumprimento da obrigação, o que caracteriza a coercibilidade. A imperatividade está em impor condutas, como no caso do tributo, que não é opcional. A generalidade trata da aplicação a todos em igual situação. A bilateralidade trata da relação entre direito e dever, e não do uso da força.` },

    { id: 13, categoria: 'norma-caracteres', enunciadoHtml: `Quanto à qualidade, como se classificam as normas jurídicas?`, alternativasHtml: [
        `Nacionais, estrangeiras e uniformes.`,
        `Positivas, ou permissivas, e negativas, ou proibitivas.`,
        `Legislativas, jurisprudenciais e costumeiras.`,
        `Constitucionais, complementares, ordinárias, regulamentares e individualizadas.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Quanto à qualidade, as normas são positivas, ou permissivas, e negativas, ou proibitivas. A classificação em nacionais, estrangeiras e uniformes é quanto ao sistema a que pertencem. A classificação em legislativas, jurisprudenciais e costumeiras é quanto à fonte. A classificação em constitucionais, complementares, ordinárias, regulamentares e individualizadas é quanto à hierarquia.` },

    { id: 14, categoria: 'semiotica', enunciadoHtml: `Qual dimensão da semiótica analisa a relação entre os signos e foca na estrutura lógica das normas, na gramática legislativa e na hierarquia?`, alternativasHtml: [
        `Semântica, que busca o sentido das palavras na lei.`,
        `Pragmática, que trata da aplicação da norma ao caso concreto.`,
        `Sintaxe, que analisa a relação entre os signos e a estrutura formal das normas.`,
        `Moldura normativa, que é o espaço das interpretações possíveis e válidas.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A sintaxe analisa a relação entre os signos, com foco na estrutura lógica das normas, na gramática legislativa e na hierarquia. A semântica estuda a relação entre o signo e o seu significado. A pragmática foca na relação entre o signo e os usuários, no contexto. A moldura normativa pertence à teoria da interpretação de Kelsen, e não é uma dimensão da semiótica.` },

    { id: 15, categoria: 'semiotica', enunciadoHtml: `Qual dimensão da semiótica estuda a relação entre o signo e o seu significado, buscando o sentido das palavras na lei?`, alternativasHtml: [
        `Sintaxe, que analisa a relação entre os signos e a hierarquia das leis.`,
        `Pragmática, que foca na relação entre o signo e quem o usa, no contexto.`,
        `Imperatividade, que impõe condutas e não é mero conselho.`,
        `Semântica, que busca o sentido das palavras, como o que o legislador quis dizer com propriedade.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `A semântica estuda a relação entre o signo e o seu significado, e é nela que se procura o sentido das palavras na lei, como a palavra propriedade. A sintaxe analisa a relação entre os signos, e não o significado. A pragmática trata do uso e do contexto, sobretudo na aplicação ao caso concreto. A imperatividade é uma característica da norma, e não uma dimensão da semiótica.` },

    { id: 16, categoria: 'semiotica', enunciadoHtml: `Qual dimensão da semiótica trata da aplicação da norma ao caso concreto e do impacto da lei na realidade social?`, alternativasHtml: [
        `Pragmática, que foca na relação entre o signo e os usuários, no contexto.`,
        `Sintaxe, que analisa a relação entre os signos e a estrutura formal.`,
        `Semântica, que estuda o significado das palavras.`,
        `Dogmática das fontes, que lista legislação, jurisprudência, doutrina e costume.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A pragmática foca na relação entre o signo e os usuários, no contexto, e trata da aplicação da norma ao caso concreto e do impacto da lei na realidade social. A sintaxe cuida da estrutura formal, e a semântica, do significado das palavras. A dogmática das fontes é outro assunto: lista as fontes do direito, e não é uma dimensão da semiótica.` },

    { id: 17, categoria: 'textura-aberta', enunciadoHtml: `Qual é o exemplo de regra que a disciplina usa ao tratar da textura aberta do direito?`, alternativasHtml: [
        `É obrigatório pagar tributo, e esse pagamento não é opcional.`,
        `É proibida a entrada de veículos no parque.`,
        `Todos devem respeitar as normas de trânsito.`,
        `O devedor deve cumprir o que o credor pode exigir.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `A regra usada para tratar da textura aberta é a proibição de entrada de veículos no parque. A regra do tributo serve para ilustrar a imperatividade, e a das normas de trânsito, a generalidade. A regra sobre o credor e o devedor ilustra a bilateralidade. Nenhuma delas é o exemplo de textura aberta.` },

    { id: 18, categoria: 'textura-aberta', enunciadoHtml: `Em qual obra a disciplina situa o capítulo sobre a textura aberta do direito?`, alternativasHtml: [
        `Teoria Pura do Direito, de Hans Kelsen.`,
        `Compêndio de Introdução à Ciência do Direito, de Maria Helena Diniz.`,
        `O conceito de Direito, de H. L. A. Hart.`,
        `Uma súmula do Supremo Tribunal Federal, que resume a jurisprudência.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A disciplina situa o capítulo sobre a textura aberta em O conceito de Direito, de H. L. A. Hart. A Teoria Pura do Direito, de Kelsen, é a obra indicada para o estudo da pureza e da interpretação. O Compêndio de Maria Helena Diniz é indicado para a semiótica. Uma súmula é um enunciado que resume a jurisprudência, e não um livro sobre textura aberta.` }
];
