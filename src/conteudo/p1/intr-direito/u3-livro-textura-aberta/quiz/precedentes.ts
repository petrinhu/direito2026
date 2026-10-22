import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 24 a 30 do quiz de Introdução ao Direito, Unidade 3: regras fixas,
 * precedente e função criadora dos tribunais. Todas de múltipla escolha com
 * quatro alternativas. As explicações descrevem o conteúdo de cada alternativa,
 * sem indicar posição, porque o motor embaralha as respostas a cada rodada.
 */
export const precedentes: readonly PerguntaQuiz[] = [
  { id: 24, categoria: 'textura-precedentes', enunciadoHtml: `Por que, segundo Hart, a regra contra o ato de matar pode ser fixa, e não um padrão variável como "respeito devido pela vida humana"?`, alternativasHtml: [
        `Porque a vida humana não tem valor algum para o direito, e por isso não precisa de proteção ponderada.`,
        `Porque as circunstâncias em que as pessoas matam são sempre iguais, e não há variação a considerar.`,
        `Porque o legislador consegue prever todos os casos de morte, sem exceção.`,
        `Porque muito poucos fatores levam a subvalorizar a proteção da vida, e o matar outrem, enquanto tal, domina os outros fatores que o acompanham.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Hart diz que muito poucos fatores levam a subvalorizar a proteção da vida, e que quase sempre o matar outrem, enquanto tal, domina os outros fatores que o acompanham (p. 146). O texto trata a vida como algo de grande importância prática, e não como algo sem valor para o direito. As circunstâncias, por sua vez, são descritas como muito variadas, e não como sempre iguais. Quanto ao legislador, o trecho admite exceções como a legítima defesa, o que afasta a ideia de que ele prevê todos os casos.` },

    { id: 25, categoria: 'textura-precedentes', enunciadoHtml: `Hart observa que o lado da estrada por onde se circula é, em certo sentido, convencional. O que importa, segundo ele, em matérias assim?`, alternativasHtml: [
        `Que exista um processo facilmente identificável e uniforme, que distinga com clareza o correto do incorreto.`,
        `Que cada motorista escolha o lado que lhe pareça mais seguro em cada trecho.`,
        `Que o juiz decida caso a caso o lado da estrada, à luz das circunstâncias.`,
        `Que o lado da estrada seja o mesmo em todos os países, por razões naturais.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Hart diz que não importa, em si, qual lado da estrada é prescrito, mas importa muito que exista um processo facilmente identificável e uniforme, que distinga com clareza o correto do incorreto (p. 147). Deixar cada motorista escolher o lado fere justamente a uniformidade. Decidir caso a caso produz o mesmo problema. Tratar o lado da estrada como dado natural, e não convencional, também vai contra o trecho.` },

    { id: 26, categoria: 'textura-precedentes', enunciadoHtml: `Na nota do trecho sobre a ratio decidendi, qual é a descrição dada a essa expressão latina?`, alternativasHtml: [
        `A opinião pessoal do juiz sobre o caso, que não vincula ninguém.`,
        `A regra dotada de autoridade que permite decidir de igual modo um caso futuro com conjunto semelhante de fatos, ou seja, o precedente para o futuro.`,
        `O nome do tribunal que proferiu a decisão original.`,
        `A lei escrita que sucede ao precedente, quando o legislador o revoga.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `A nota do trecho diz que a ratio decidendi de um caso constitui precisamente o precedente para o futuro, isto é, a regra dotada de autoridade que permite decidir de igual modo um caso futuro em que se revela um conjunto semelhante de fatos (p. 147). A ratio não é opinião pessoal que não vincula ninguém: isso contraria a nota, que a define como regra dotada de autoridade. O nome do tribunal não é o conceito descrito, e a lei que sucede o precedente não é mencionada na nota.` },

    { id: 27, categoria: 'textura-precedentes', enunciadoHtml: `Segundo Hart, qual é uma das duas formas de atividade criadora que a força vinculante do precedente ainda deixa aos tribunais?`, alternativasHtml: [
        `Interpretar a lei de modo a seguir sempre a intenção do legislador, sem criar regra nova.`,
        `Aplicar o precedente de forma literal, sem qualquer exame dos fatos do caso.`,
        `Distinguir o caso anterior, achando uma diferença juridicamente relevante que leve a uma decisão diferente.`,
        `Aplicar a regra a todos os casos, mesmo quando os fatos forem diferentes, sem nenhuma análise.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Hart diz que os tribunais podem distinguir o caso anterior, descobrindo uma diferença juridicamente relevante que leve a uma decisão oposta, e podem ampliar a regra, afastando uma restrição que não é exigida por regra estabelecida (p. 148). Procurar a intenção do legislador é o que os tribunais dizem fazer, segundo Hart, e não uma das duas formas de atividade criadora. Aplicar o precedente de forma literal, sem examinar os fatos, contraria o método de distinção descrito. E aplicar a regra a fatos diferentes sem análise não é uma das formas descritas: a distinção existe justamente para tratar essas diferenças.` },

    { id: 28, categoria: 'textura-precedentes', enunciadoHtml: `Segundo Hart, o que significa ampliar uma regra?`, alternativasHtml: [
        `Tornar a regra mais restrita, acrescentando exceções.`,
        `Aplicar a regra a fatos iguais, sem alterar nenhuma palavra.`,
        `Transferir a regra para outro sistema jurídico.`,
        `Afastar uma restrição descoberta na regra, tal como formulada a partir do caso anterior, quando ela não é exigida por regra estabelecida.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Hart diz que, ao seguir um precedente, os tribunais podem afastar uma restrição descoberta na regra, tal como formulada a partir do caso anterior, com o fundamento de que ela não é exigida por regra estabelecida, e que fazer isso significa ampliar a regra (p. 148). Tornar a regra mais restrita é o contrário do que o texto descreve. Aplicar a regra a fatos iguais não envolve ampliação, e transferir a regra para outro sistema jurídico não é tratado no trecho.` },

    { id: 29, categoria: 'textura-precedentes', enunciadoHtml: `Hart diz que os tribunais, no sistema inglês, exercem uma função criadora de regras. Como ele descreve essa função em comparação com os órgãos administrativos?`, alternativasHtml: [
        `É muito semelhante ao exercício de poderes delegados de elaboração de regulamentos por um órgão administrativo, quando o stare decisis é firmemente reconhecido.`,
        `É idêntica à de um legislador eleito, com o mesmo poder de revogar leis.`,
        `Não existe, porque os tribunais apenas executam a lei sem nenhuma criação.`,
        `É exercida apenas nos casos em que o legislador se omite.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Hart afirma que, quando o stare decisis é firmemente reconhecido, a função dos tribunais é muito semelhante ao exercício de poderes delegados de elaboração de regulamentos por um órgão administrativo (p. 149). Igualar essa função à de um legislador eleito, com poder de revogar leis, vai além do texto. Negar qualquer função criadora contraria o trecho, que a descreve como real, ainda que muitas vezes escondida. E limitá-la aos casos de omissão do legislador não aparece no texto.` },

    { id: 30, categoria: 'textura-precedentes', enunciadoHtml: `Por que, segundo Hart, a função criadora dos tribunais costuma ficar escondida no sistema inglês?`, alternativasHtml: [
        `Porque a lei escrita proíbe os juízes de criar regras em qualquer hipótese.`,
        `Porque os tribunais frequentemente negam essa função e dizem que sua tarefa é procurar a intenção do legislador e o direito que já existe.`,
        `Porque a função criadora só existe em sistemas sem precedente.`,
        `Porque os órgãos administrativos assumiram a tarefa de criar regras.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Hart diz que, na Inglaterra, esse fato é muitas vezes obscurecido pelas aparências, porque os tribunais negam essa função e insistem em que procuram a intenção do legislador e o direito que já existe (p. 149). Nada no texto aponta uma proibição da lei escrita contra a criação de regras pelos juízes. A função criadora descrita existe justamente num sistema em que o precedente é vinculante, e não em sistemas sem precedente. Atribuir a tarefa aos órgãos administrativos também não é o motivo que o texto aponta.` }
];
