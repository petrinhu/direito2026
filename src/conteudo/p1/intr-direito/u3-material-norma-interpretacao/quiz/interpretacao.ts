import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 25 a 30 do quiz: interpretação em Kelsen, direito subjetivo e
 * objetivo, e ramos do direito. Todas de múltipla escolha com quatro
 * alternativas. As explicações descrevem o conteúdo de cada alternativa, sem
 * indicar posição, porque o motor embaralha as respostas a cada rodada.
 */
export const interpretacao: readonly PerguntaQuiz[] = [
  { id: 25, categoria: 'interpretacao-kelsen', enunciadoHtml: `Para Kelsen, como se deve entender a aplicação do Direito?`, alternativasHtml: [
        `Como um ato de vontade, e não apenas de conhecimento.`,
        `Como um ato puramente de conhecimento, sem qualquer escolha.`,
        `Como um ato de moral, que depende da consciência de cada juiz.`,
        `Como uma decisão que segue a intenção dos particulares envolvidos.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Para Kelsen, aplicar o Direito é um ato de vontade e não apenas de conhecimento. Por isso, a afirmação que fala só em conhecimento, sem escolha, contradiz essa ideia. Tratar a aplicação como ato de moral, ou como seguimento da intenção dos particulares, também não corresponde a ela.` },

    { id: 26, categoria: 'interpretacao-kelsen', enunciadoHtml: `Para Kelsen, o que fica fora da moldura da interpretação?`, alternativasHtml: [
        `As diversas interpretações possíveis e válidas, entre as quais o juiz tem liberdade para escolher.`,
        `As interpretações que o juiz considera justas no caso concreto.`,
        `A própria aplicação do Direito, que é sempre um ato de conhecimento.`,
        `As decisões ilegais ou inconstitucionais.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Fora da moldura estão as decisões ilegais ou inconstitucionais. Dentro dela estão as interpretações possíveis e válidas, entre as quais o juiz escolhe, e por isso essa afirmação não fica de fora. O critério da moldura é a validade, e não o que o juiz considera justo no caso concreto. A aplicação como ato de conhecimento contraria a ideia de Kelsen de que ela é também um ato de vontade.` },

    { id: 27, categoria: 'direito-subjetivo', enunciadoHtml: `Segundo a disciplina, o que é direito subjetivo?`, alternativasHtml: [
        `O conjunto de normas e regras que a sociedade segue, existindo independentemente da vontade de cada um.`,
        `A sanção que o Estado aplica quando a norma é descumprida.`,
        `A faculdade ou o poder que uma pessoa tem de acionar o Direito Objetivo para proteger um interesse próprio.`,
        `A vontade do legislador expressa em lei, sem relação com o interesse de alguém.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Direito subjetivo é a faculdade ou o poder que a pessoa tem de acionar o direito objetivo para proteger um interesse próprio. O conjunto de normas que existe independentemente da vontade de cada um é o direito objetivo. A sanção é consequência do descumprimento, e não o direito subjetivo. A vontade do legislador sem relação com o interesse de alguém não é o conceito apresentado.` },

    { id: 28, categoria: 'direito-subjetivo', enunciadoHtml: `Segundo a disciplina, o que é direito objetivo?`, alternativasHtml: [
        `A faculdade que a pessoa tem de acionar a lei para proteger um interesse próprio.`,
        `O conjunto de normas e regras que a sociedade segue, como ordenamento jurídico, existente independentemente da vontade de cada um.`,
        `A vontade de cada pessoa sobre o que considera justo.`,
        `A obrigação de cumprir uma sanção aplicada por um tribunal.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Direito objetivo é o conjunto de normas e regras que a sociedade segue, o ordenamento jurídico, que existe independentemente da vontade de cada um. A faculdade de acionar a lei para proteger um interesse próprio é o direito subjetivo. A vontade de cada pessoa sobre o que é justo não define o direito objetivo. A obrigação de cumprir sanção é consequência, e não o conceito de direito objetivo.` },

    { id: 29, categoria: 'ramos-direito', enunciadoHtml: `Qual ramo do Direito Privado regula as relações entre as pessoas desde o nascimento até a morte?`, alternativasHtml: [
        `Direito Civil, principal pilar do Direito Privado.`,
        `Direito Penal, que define as infrações penais, crimes e contravenções.`,
        `Direito Tributário, que regula o poder do Estado de instituir e cobrar tributos.`,
        `Direito Constitucional, que engloba os elementos essenciais da organização jurídica do Estado.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `O Direito Civil é o principal pilar do Direito Privado e regula as relações entre as pessoas desde o nascimento até a morte. O Direito Penal define crimes e contravenções, o Tributário trata da instituição e da cobrança de tributos, e o Constitucional trata da organização do Estado e dos direitos fundamentais. Os três são ramos do Direito Público.` },

    { id: 30, categoria: 'ramos-direito', enunciadoHtml: `Qual ramo do Direito Público define as infrações penais, crimes e contravenções?`, alternativasHtml: [
        `Direito Empresarial, que disciplina a figura do empresário e as sociedades empresárias.`,
        `Direito do Trabalho, que regula a relação jurídica entre empregadores e empregados.`,
        `Direito Civil, que regula as relações entre as pessoas desde o nascimento até a morte.`,
        `Direito Penal, que define as infrações penais, crimes e contravenções.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O Direito Penal é o ramo do Direito Público que define as infrações penais, crimes e contravenções. Os outros três ramos citados são privados: o Empresarial cuida da atividade econômica organizada, o do Trabalho da relação entre empregadores e empregados, e o Civil das relações entre as pessoas desde o nascimento até a morte.` }
];
