import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 1 a 10 do quiz: fontes do direito, pureza e ato jurídico, e norma
 * e validade. Todas de múltipla escolha com quatro alternativas. As explicações
 * descrevem o conteúdo de cada alternativa, sem indicar posição, porque o motor
 * embaralha as respostas a cada rodada.
 */
export const fontes: readonly PerguntaQuiz[] = [
  { id: 1, categoria: 'fontes-direito', enunciadoHtml: `Em um sistema de civil law, como o brasileiro, qual é a fonte primária por excelência, segundo a dogmática das fontes?`, alternativasHtml: [
        `A legislação, que inclui a Constituição, as leis ordinárias e as complementares.`,
        `A jurisprudência, que são as decisões reiteradas dos tribunais.`,
        `A doutrina, que é o estudo dogmático dos juristas e teóricos.`,
        `O costume, quando a sociedade reitera uma conduta com a convicção de que ela é obrigatória.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A legislação é a fonte primária por excelência no sistema de civil law, e nela entram a Constituição, as leis ordinárias e as complementares. A jurisprudência é fonte, mas as decisões reiteradas dos tribunais não recebem esse título. A doutrina ajuda a dar sentido às leis, sem ser fonte primária. O costume exige uso constante e consciência de obrigatoriedade, e não é apontado como fonte primária.` },

    { id: 2, categoria: 'fontes-direito', enunciadoHtml: `Segundo a dogmática das fontes, o que é jurisprudência?`, alternativasHtml: [
        `Uma decisão isolada, tomada em um caso concreto e que serve de exemplo para outros julgamentos.`,
        `As decisões reiteradas dos tribunais.`,
        `O estudo dogmático feito pelos juristas e teóricos, que ajuda a dar sentido às leis.`,
        `A convicção de que uma conduta reiterada pela sociedade é obrigatória.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Jurisprudência são as decisões reiteradas dos tribunais. A decisão isolada, tomada em um caso concreto, é o precedente, e a jurisprudência é o conjunto dessas decisões. O estudo dos juristas e teóricos é a doutrina. A convicção de que uma conduta é obrigatória faz parte do costume, e não da jurisprudência.` },

    { id: 3, categoria: 'fontes-direito', enunciadoHtml: `Quais são os dois elementos exigidos para que exista costume, segundo a dogmática das fontes?`, alternativasHtml: [
        `Publicação oficial e votação no parlamento.`,
        `Decisão de tribunal superior e súmula.`,
        `Uso constante e consciência de obrigatoriedade.`,
        `Estudo dogmático e ensino nas faculdades.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `O costume exige dois elementos: o uso constante e a consciência de obrigatoriedade, ou seja, a sociedade reitera uma conduta com a convicção de que ela é obrigatória. A publicação oficial e a votação no parlamento não são elementos do costume. A legislação é a fonte primária por excelência no sistema de civil law, e inclui a Constituição, as leis ordinárias e as complementares. Decisão de tribunal e súmula se ligam à jurisprudência: a jurisprudência são as decisões reiteradas dos tribunais, e a súmula é o resumo dela. O estudo dogmático dos juristas e teóricos é a doutrina, e nem ele nem o ensino nas faculdades são elementos do costume.` },

    { id: 4, categoria: 'kelsen-pureza', enunciadoHtml: `Para Hans Kelsen, o que é a "pureza" do direito?`, alternativasHtml: [
        `Um princípio metodológico, que busca estudar o direito sem confundi-lo com a moral, a política, a sociologia ou a psicologia.`,
        `Uma limpeza do direito, que retira dele as normas morais.`,
        `A exigência de estudar apenas o direito vigente em um único país.`,
        `A recusa da lei escrita, em favor do costume.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A pureza é um princípio metodológico. Kelsen não está limpando o direito, e sim o método de estudá-lo. Por isso, a afirmação de que o princípio retira as normas morais do direito não corresponde ao que a pureza propõe: ela separa o estudo da moral, sem apagar nada do direito. Estudar apenas o direito de um único país não é o princípio. Recusar a lei escrita também não corresponde ao princípio, que trata do método e não das fontes.` },

    { id: 5, categoria: 'kelsen-pureza', enunciadoHtml: `Para o Direito, todo ato possui dois níveis. Quais são eles?`, alternativasHtml: [
        `Intenção e consequência.`,
        `Fato, que é um evento no mundo real, e significado jurídico, que é a interpretação feita pelo Direito.`,
        `Norma e sanção.`,
        `Validade e eficácia.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Todo ato tem um fato, que é um evento no mundo real, e um significado jurídico, dado pela interpretação do Direito. Matar alguém é o fato, e pode ser homicídio ou execução legal, conforme a norma que o interpreta. Intenção e consequência não são os dois níveis descritos. Norma e sanção não são esses dois níveis, e validade e eficácia também não.` },

    { id: 6, categoria: 'kelsen-pureza', enunciadoHtml: `Qual dos sentidos de um ato determina se ele tem validade e cria uma norma jurídica?`, alternativasHtml: [
        `O sentido subjetivo, pois a intenção do agente é que decide a validade do ato.`,
        `O sentido moral que a sociedade atribui ao ato.`,
        `O sentido objetivo, que é o significado atribuído pelo ordenamento jurídico, independentemente da intenção do agente.`,
        `A simples vontade de quem pratica o ato, sem referência a qualquer norma.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `O sentido objetivo é o que determina a validade do ato e cria uma norma jurídica. O sentido subjetivo é o significado que o próprio indivíduo atribui, e a intenção dele não decide sozinha a validade. O sentido moral não é o critério apresentado. A simples vontade, sem referência a norma, contraria a validade objetiva, que depende do ordenamento.` },

    { id: 7, categoria: 'norma-validade', enunciadoHtml: `Qual é a definição de norma jurídica trazida pela disciplina?`, alternativasHtml: [
        `Uma lei da natureza, que descreve o que acontece na sociedade, como a gravidade.`,
        `Uma regra moral que cada pessoa escolhe para a própria conduta.`,
        `Um costume que nasce sem nenhuma participação do Estado.`,
        `Um padrão vinculante de conduta social, criado, reconhecido e garantido pelo Poder Público para ordenar a vida em sociedade.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `A norma é um padrão vinculante de conduta social, criado, reconhecido e garantido pelo Poder Público. As leis da natureza descrevem o que é, enquanto a norma estabelece o que deve ser. A regra moral escolhida por cada pessoa não é criada nem garantida pelo Poder Público. O costume sem participação do Estado não atende à exigência de reconhecimento e garantia pelo Poder Público.` },

    { id: 8, categoria: 'norma-validade', enunciadoHtml: `No exemplo trazido pela disciplina, a ordem do funcionário é válida e a ordem do gângster não é. Por quê?`, alternativasHtml: [
        `Porque a ordem do funcionário tem base na lei, e não há norma que fundamente a do gângster.`,
        `Porque o gângster desobedece a um costume local que todos seguem.`,
        `Porque a validade depende apenas da força física de quem dá a ordem.`,
        `Porque o funcionário tem mais pessoas ao seu redor no momento da ordem.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A validade formal depende de uma norma, originada de autoridade competente, que autoriza o ato. A ordem do funcionário tem essa base na lei, e a do gângster não tem norma que a fundamente. O costume local não é o critério apresentado. A força física não cria validade, e o número de pessoas presentes não tem relação com ela.` },

    { id: 9, categoria: 'norma-validade', enunciadoHtml: `Como as normas se relacionam na Teoria Pura do Direito?`, alternativasHtml: [
        `Todas têm a mesma força, sem qualquer hierarquia entre elas.`,
        `Cada norma retira sua validade de outra superior, e as normas se organizam hierarquicamente numa estrutura formal.`,
        `A validade de cada norma vem da aceitação da maioria da sociedade.`,
        `As normas são independentes, e cada uma vale pela vontade de quem a escreve.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Na Teoria Pura, as normas criadas por uma autoridade competente se organizam hierarquicamente, e cada uma retira sua validade de outra superior. Dizer que todas têm a mesma força contraria essa estrutura. A validade não vem da aceitação da maioria, e sim da autoridade competente e da norma superior. As normas não são independentes, porque cada uma depende de outra superior, e não da vontade de quem a escreve.` },

    { id: 10, categoria: 'norma-validade', enunciadoHtml: `Na estrutura de uma norma, o que é a hipótese de fato?`, alternativasHtml: [
        `A resposta prevista pelo ordenamento para a ocorrência do fato, como a punição de quem comete a conduta.`,
        `A autoridade competente que cria a norma.`,
        `A previsão abstrata de uma conduta ou fato social, como a subtração de coisa alheia móvel.`,
        `O julgamento do caso concreto feito pelo juiz, depois que o fato acontece.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A hipótese de fato é a previsão abstrata de uma conduta ou fato social. A resposta do ordenamento é a consequência jurídica, o outro elemento da estrutura da norma. A autoridade competente pertence à produção normativa, e não à estrutura da norma. O julgamento do caso concreto aplica a norma, mas não é a sua hipótese.` }
];
