import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 19 a 24 do quiz: meios de integração do ordenamento, fundamentação
 * da sentença, precedente, jurisprudência e súmula. Todas de múltipla escolha
 * com quatro alternativas. As explicações descrevem o conteúdo de cada
 * alternativa, sem indicar posição, porque o motor embaralha as respostas.
 */
export const sentenca: readonly PerguntaQuiz[] = [
  { id: 19, categoria: 'integracao-sentenca', enunciadoHtml: `Segundo o art. 4º da LINDB, quando a lei for omissa, por quais meios o juiz decidirá o caso?`, alternativasHtml: [
        `Pela jurisprudência e pela doutrina, somente.`,
        `Pela vontade do legislador, mesmo sem norma escrita que a expresse.`,
        `Pela súmula vinculante, e nunca por outro meio.`,
        `Pela analogia, pelos costumes e pelos princípios gerais de direito.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O art. 4º da LINDB indica a analogia, os costumes e os princípios gerais de direito como meios para o juiz decidir quando a lei é omissa. A jurisprudência e a doutrina não estão nesse rol. A vontade do legislador sem norma escrita não é o meio indicado. A súmula vinculante aparece no art. 103-A da Constituição, e não está entre os meios do art. 4º.` },

    { id: 20, categoria: 'integracao-sentenca', enunciadoHtml: `Segundo a disciplina, o que é analogia?`, alternativasHtml: [
        `A aplicação, a um caso não previsto em lei, de uma norma que regula um caso semelhante.`,
        `A prática reiterada e constante de um comportamento, com a convicção de sua obrigatoriedade.`,
        `Os postulados fundamentais que estruturam o sistema jurídico, mesmo que não estejam escritos em artigo.`,
        `A decisão tomada em um caso concreto, que serve de exemplo para outros julgamentos.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A analogia é a aplicação, a um caso não previsto em lei, de uma norma que regula um caso semelhante. A prática reiterada com convicção de obrigatoriedade define o costume. Os postulados fundamentais que estruturam o sistema são os princípios gerais de direito. A decisão tomada em um caso concreto, que serve de exemplo, é o precedente.` },

    { id: 21, categoria: 'integracao-sentenca', enunciadoHtml: `Segundo o art. 489, §1º, inciso V, do CPC, quando uma decisão que invoca precedente ou súmula não se considera fundamentada?`, alternativasHtml: [
        `Sempre, porque precedente e súmula não podem ser citados em decisão.`,
        `Quando se limita a invocar precedente ou enunciado de súmula, sem identificar seus fundamentos determinantes nem demonstrar que o caso se ajusta a eles.`,
        `Quando o juiz indica o número da súmula e a data de sua publicação.`,
        `Quando a decisão está redigida em linguagem jurídica, com termos técnicos.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `O inciso V do §1º considera não fundamentada a decisão que se limita a invocar precedente ou súmula sem identificar seus fundamentos determinantes nem demonstrar que o caso se ajusta a eles. Precedente e súmula podem ser citados; o que a lei exige é a demonstração. Indicar número e data não identifica os fundamentos determinantes. A linguagem técnica não é o critério do parágrafo.` },

    { id: 22, categoria: 'precedentes-sumula', enunciadoHtml: `Qual é a diferença entre precedente e jurisprudência, segundo a disciplina?`, alternativasHtml: [
        `O precedente é o resumo da jurisprudência, redigido como enunciado.`,
        `O precedente é o conjunto de decisões repetidas, e a jurisprudência é uma decisão isolada.`,
        `Não há diferença, porque os dois termos são sinônimos.`,
        `O precedente é uma decisão isolada, tomada em um caso concreto, e a jurisprudência é o conjunto de decisões que se repetem de forma constante.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O precedente é uma decisão isolada tomada em um caso concreto, e a jurisprudência é o conjunto de decisões repetidas e constantes sobre um tema. Chamar o precedente de resumo da jurisprudência confunde o conceito com o da súmula. Inverter os conceitos contraria a definição. Negar que haja diferença ignora que a jurisprudência se forma a partir de decisões que, sozinhas, são precedentes.` },

    { id: 23, categoria: 'precedentes-sumula', enunciadoHtml: `O que é um enunciado de súmula?`, alternativasHtml: [
        `A decisão isolada, tomada em um caso concreto, que serve de exemplo para outros julgamentos.`,
        `O resumo da jurisprudência, redigido pelo tribunal para facilitar a consulta e a aplicação.`,
        `A lei aprovada pelo Poder Legislativo e publicada no diário oficial.`,
        `O costume que se forma quando a sociedade repete uma conduta.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `A súmula é o resumo da jurisprudência. O tribunal a redige quando percebe que já decidiu a mesma coisa diversas vezes, para facilitar a consulta e a aplicação. A decisão isolada que serve de exemplo é o precedente. A lei aprovada pelo Poder Legislativo é uma norma legislativa, e não um resumo de decisões. O costume depende de conduta reiterada com convicção de obrigatoriedade, e não de um enunciado de tribunal.` },

    { id: 24, categoria: 'precedentes-sumula', enunciadoHtml: `Segundo a Constituição Federal, art. 103-A, quantos membros do Supremo Tribunal Federal são necessários para aprovar súmula com efeito vinculante?`, alternativasHtml: [
        `A maioria simples dos membros presentes à sessão.`,
        `A unanimidade dos membros.`,
        `Dois terços dos seus membros.`,
        `Um terço dos seus membros.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `O art. 103-A exige decisão de dois terços dos membros do STF, depois de reiteradas decisões sobre matéria constitucional. Maioria simples, unanimidade e um terço não são o quórum previsto no artigo.` }
];
