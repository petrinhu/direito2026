import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 16 a 23 do quiz de Introdução ao Direito, Unidade 3: formalismo,
 * padrões muito gerais, delegação e cuidado devido. Todas de múltipla escolha
 * com quatro alternativas. As explicações descrevem o conteúdo de cada
 * alternativa, sem indicar posição, porque o motor embaralha as respostas.
 */
export const formalismo: readonly PerguntaQuiz[] = [
  { id: 16, categoria: 'textura-formalismo', enunciadoHtml: `Segundo Hart, o que é o formalismo ou conceptualismo?`, alternativasHtml: [
        `Uma técnica de ensino que usa exemplos em vez de regras.`,
        `Um método que ignora as regras escritas e decide por intuição.`,
        `A exigência de que os juízes sejam neutros em todos os casos.`,
        `Uma atitude para com as regras formuladas em palavras que procura disfarçar e minimizar a necessidade de escolha depois que a regra é editada.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Hart define o formalismo ou conceptualismo como uma atitude para com as regras formuladas de forma verbal que procura disfarçar e minimizar a necessidade de escolha, uma vez editada a regra geral (p. 142). Tratar o formalismo como técnica de ensino não consta do texto. Decidir por intuição, ignorando a regra escrita, é o oposto do que Hart critica, já que o formalismo trata a regra como se fosse fechada. E a exigência de neutralidade do juiz não é o conceito tratado no trecho.` },

    { id: 17, categoria: 'textura-formalismo', enunciadoHtml: `Uma forma de o formalismo buscar certeza, segundo Hart, é fixar o significado da regra de modo que:`, alternativasHtml: [
        `os termos gerais tenham o mesmo significado em cada caso em que a regra é aplicada.`,
        `a regra seja interpretada caso a caso, conforme a finalidade de cada um.`,
        `a regra seja aplicada apenas aos casos que o legislador previu com precisão.`,
        `o juiz possa escolher o significado conforme a sua preferência pessoal.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Hart descreve essa técnica como fixar o significado da regra, de forma que os termos gerais devam ter o mesmo significado em cada caso em que esteja em causa a sua aplicação (p. 142). Interpretar caso a caso, ou limitar a regra aos casos previstos com precisão, não é o que essa técnica faz: ela obriga a incluir casos que se desejaria excluir (p. 143). Escolher o sentido conforme a preferência pessoal vai contra o ponto de Hart, que é fixar o significado de antemão.` },

    { id: 18, categoria: 'textura-formalismo', enunciadoHtml: `Qual é o custo que Hart aponta para essa técnica de certeza do formalismo?`, alternativasHtml: [
        `Ela torna as leis mais longas, sem efeito sobre as decisões.`,
        `Ela obriga a incluir no âmbito da regra casos que se desejaria excluir, e a rigidez das classificações entra em conflito com as finalidades da regra.`,
        `Ela impede qualquer previsibilidade, porque nenhum caso futuro pode ser antecipado.`,
        `Ela exige que os tribunais deixem de aplicar as leis escritas.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Hart diz que a técnica força a incluir casos que se desejaria excluir, e que a rigidez das classificações entra em conflito com as finalidades que a regra deveria servir (p. 143). Tornar as leis mais longas não é o custo apontado, e impedir qualquer previsibilidade também não: o texto apresenta a técnica como um modo de obter uma medida de certeza ou previsibilidade (p. 142). Exigir que os tribunais deixem de aplicar leis escritas não aparece no trecho.` },

    { id: 19, categoria: 'textura-formalismo', enunciadoHtml: `Hart chama de "paraíso de conceitos" dos juristas qual situação?`, alternativasHtml: [
        `Quando as leis são escritas em linguagem simples e sem termos gerais.`,
        `Quando cada juiz pode dar a uma lei o sentido que considera mais justo.`,
        `Quando o sistema jurídico inteiro é composto apenas de precedentes.`,
        `Quando um termo geral recebe o mesmo significado em cada aplicação de uma regra e em qualquer regra do sistema.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Hart diz que o paraíso de conceitos se atinge quando um termo geral recebe o mesmo significado não só em cada aplicação de uma regra, mas em qualquer regra do sistema jurídico (p. 143). Leis sem termos gerais não são o caso, já que o ponto de Hart depende desses termos. Dar a cada juiz o sentido que lhe parece mais justo é o contrário da fixação de significado. E um sistema formado só de precedentes não corresponde à condição descrita.` },

    { id: 20, categoria: 'textura-formalismo', enunciadoHtml: `Segundo Hart, por que a fixação rígida de significados, levada ao paraíso de conceitos, traz problemas?`, alternativasHtml: [
        `Porque exige que a regra seja submetida a plebiscito antes de ser aplicada.`,
        `Porque aumenta o número de tribunais e de juízes necessários.`,
        `Porque resolve antecipadamente questões que só podem ser razoavelmente resolvidas quando surgem, e sem uma visão clara.`,
        `Porque torna impossível qualquer decisão sobre o sentido de uma palavra.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Hart escreve que, com essa técnica, se resolvem antecipadamente, mas sem visão clara, questões que só podem ser razoavelmente resolvidas quando surgem e são identificadas (pp. 142-143). O texto não menciona plebiscito antes da aplicação da regra, nem aumento de tribunais. E tornar impossível decidir o sentido de uma palavra contraria o trecho, já que o paraíso de conceitos é justamente uma fixação de sentido, e não a sua impossibilidade.` },

    { id: 21, categoria: 'textura-formalismo', enunciadoHtml: `Quando o legislador usa padrões muito gerais, como preço justo ou condições de segurança, e delega a um órgão administrativo, o que esse órgão faz?`, alternativasHtml: [
        `Especifica por regulamento o que vale como preço justo ou condições de segurança para cada indústria, depois de inquérito e audição.`,
        `Decide sozinho, sem ouvir ninguém, quais sanções se aplicam a cada empresa.`,
        `Revoga o padrão geral e o substitui por uma lista fechada de atos proibidos.`,
        `Entrega o caso ao tribunal, que aplica o padrão sem nenhuma especificação.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Hart descreve a delegação: o órgão administrativo, com poder regulamentar, molda regras adaptadas às necessidades especiais, e esse poder só pode ser exercido depois de inquérito sobre os fatos da indústria e audição dos argumentos a favor e contra (p. 144). Decidir sozinho, sem ouvir ninguém, contraria essa exigência. Trocar o padrão por uma lista fechada, ou entregar o caso ao tribunal, não é a delegação que o texto descreve. Ela existe porque os casos não podem ser listados de antemão, e é feita ao órgão administrativo.` },

    { id: 22, categoria: 'textura-formalismo', enunciadoHtml: `Hart afirma que, entre os extremos de preço, aparecem casos realmente difíceis. Qual é a consequência que ele tira disso?`, alternativasHtml: [
        `Não há necessidade de nenhuma escolha oficial, porque a resposta é única.`,
        `Deve-se exercer poder discricionário, pois não há uma única resposta correta, e sim um compromisso razoável entre interesses conflitantes.`,
        `Os casos difíceis devem ser julgados pela regra do extremo mais alto.`,
        `O preço deve ser fixado pelo mercado, sem nenhuma intervenção oficial.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Hart diz que, nos casos difíceis, a autoridade deve exercer poder discricionário, porque não há uma única resposta correta a descobrir, e sim um compromisso razoável entre muitos interesses conflitantes (pp. 144-145). Supor que há uma resposta única contraria diretamente o texto. A regra do extremo mais alto não corresponde ao que Hart propõe, já que os extremos são os casos identificáveis desde o início. Fixar o preço pelo mercado não é tratado no trecho.` },

    { id: 23, categoria: 'textura-formalismo', enunciadoHtml: `Segundo Hart, quando um tribunal costuma informar a pessoa sobre o que um padrão variável exigia dela, como o cuidado devido?`, alternativasHtml: [
        `Antes de qualquer ação, em uma consulta prévia obrigatória.`,
        `Somente quando a pessoa pede orientação ao órgão administrativo.`,
        `Só depois, ex post facto, quando a pessoa já violou o padrão.`,
        `Nunca, porque o padrão variável não precisa ser explicado a ninguém.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Hart diz que, nesse tipo de padrão, as pessoas devem agir antes que ele tenha sido oficialmente definido, e que o tribunal só pode informá-las do que o padrão exigia depois da violação, ex post facto (p. 145). Não existe, no texto, uma consulta prévia obrigatória, nem um pedido de orientação ao órgão administrativo como mecanismo do cuidado devido. Afirmar que o padrão não precisa ser explicado a ninguém vai contra o trecho, que trata essa informação posterior como parte do processo.` }
];
