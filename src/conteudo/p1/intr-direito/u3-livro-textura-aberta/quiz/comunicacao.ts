import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 1 a 8 do quiz de Introdução ao Direito, Unidade 3: comunicação de
 * padrões gerais, legislação e precedente. Todas de múltipla escolha com quatro
 * alternativas. As explicações descrevem o conteúdo de cada alternativa, sem
 * indicar posição, porque o motor embaralha as respostas a cada rodada.
 */
export const comunicacao: readonly PerguntaQuiz[] = [
  { id: 1, categoria: 'textura-comunicacao', enunciadoHtml: `Segundo Hart, por que o direito precisa de padrões gerais de conduta, e não apenas de diretivas dadas a cada pessoa?`, alternativasHtml: [
        `Porque a regra só obriga quem já recebeu uma instrução individual sobre ela.`,
        `Porque, em grandes grupos, o controle social depende de padrões gerais que multidões possam perceber, sem novas diretivas para cada ocasião.`,
        `Porque padrões gerais dispensam a capacidade de reconhecer casos concretos como exemplos das classificações.`,
        `Porque o direito só regula atos, e nunca categorias de pessoas ou circunstâncias.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Hart afirma que, em qualquer grande grupo, os padrões gerais devem ser o principal instrumento de controle social, e não as diretivas particulares (p. 137). A regra que só obriga quem recebeu instrução individual vai contra esse ponto. Padrões gerais também não dispensam reconhecer casos concretos: o funcionamento do direito depende justamente dessa capacidade. Já a ideia de que o direito só regula atos deixa de lado as categorias de pessoas, coisas e circunstâncias.` },

    { id: 2, categoria: 'textura-comunicacao', enunciadoHtml: `Hart descreve dois expedientes para comunicar padrões gerais com antecipação das ocasiões em que devem ser aplicados. Quais são eles?`, alternativasHtml: [
        `Legislação, que usa palavras gerais em grande quantidade, e precedente, que usa poucas palavras gerais.`,
        `Costume oral e decreto administrativo, ambos baseados em exemplos concretos.`,
        `Lei escrita e contrato, ambos sem nenhuma palavra geral.`,
        `Regulamento e sentença, que valem apenas para as partes do caso.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Hart apresenta a legislação, com uso máximo de palavras gerais para estabelecer classificações, e o precedente, com uso mínimo dessas palavras (p. 137). Costume oral, decreto administrativo, regulamento e sentença não são os dois expedientes que o trecho compara. Lei escrita corresponde à legislação, que usa palavras gerais em alto grau, e o contrato não é tratado no texto.` },

    { id: 3, categoria: 'textura-comunicacao', enunciadoHtml: `No exemplo do pai que tira o chapéu ao entrar numa igreja, qual é a diferença entre a forma de comunicar do primeiro pai e a do segundo?`, alternativasHtml: [
        `O primeiro pai dá uma ordem sem explicar nada, e o segundo ensina fazendo uma pergunta ao filho.`,
        `O primeiro pai só dá o exemplo, e o segundo enuncia uma regra escrita.`,
        `Os dois pais usam apenas exemplos, e a diferença está na ordem em que retiram o chapéu.`,
        `O primeiro enuncia a regra em palavras gerais, e o segundo age como exemplo do comportamento a seguir.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O primeiro pai enuncia a regra em palavras gerais, ao dizer que todos os homens e os rapazes devem tirar o chapéu, que é o modo da legislação (p. 137). O segundo descobre a cabeça ao entrar e diz que aquela é a forma correta de se comportar, que é o modo do exemplo. Inverter os papéis, dizendo que o primeiro só dá exemplo, faz o oposto do texto. Também não se pode afirmar que os dois usam só exemplos, já que um deles enuncia uma regra geral. Quanto à pergunta do segundo pai e à ordem sem explicação do primeiro, o texto não traz nenhuma das duas.` },

    { id: 4, categoria: 'textura-comunicacao', enunciadoHtml: `Por que, segundo Hart, a comunicação pelo exemplo pode deixar dúvidas mesmo em assuntos que quem ensina considera claros?`, alternativasHtml: [
        `Porque o exemplo só serve a crianças, que não entendem regras gerais.`,
        `Porque todo exemplo esconde uma regra escrita que o aluno não consegue ler.`,
        `Porque o exemplo deixa abertas muitas possibilidades, e é preciso adivinhar quais aspectos imitar e de que maneira.`,
        `Porque o exemplo é proibido em qualquer sistema jurídico.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Hart mostra que o exemplo deixa aberta uma série de possibilidades, mesmo para assuntos que quem ensina considera claros (p. 138). Ele lista perguntas como até que ponto a conduta deve ser imitada, se faz diferença usar a mão esquerda ou a direita, e se o chapéu volta à cabeça dentro da igreja. Hart opõe o exemplo à regra explícita, e não o apresenta como uma regra escrita escondida. Não há no texto nenhuma ideia de que o exemplo só serve a crianças, nem base para proibi-lo.` },

    { id: 5, categoria: 'textura-comunicacao', enunciadoHtml: `Segundo Hart, o que a pessoa precisa fazer para saber como agir diante de uma regra escrita em termos claros?`, alternativasHtml: [
        `Reconhecer quando um caso se enquadra nos termos claros da regra e tirar uma conclusão simples, sem depender de outra autoridade.`,
        `Adivinhar o que o adulto pretende, observando o que é aprovado no grupo.`,
        `Consultar uma autoridade externa antes de qualquer ação, para evitar riscos.`,
        `Escolher entre interpretações sem nenhuma regra para orientar.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Com uma regra de termos claros, a pessoa precisa reconhecer os casos de aplicação, subsumir os fatos particulares na classificação geral e tirar uma conclusão simples, pois a regra pode ser aplicada por si própria (pp. 138-139). Adivinhar o que o adulto pretende é a comunicação pelo exemplo, que Hart contrasta com a regra. O texto também não manda consultar uma autoridade externa: diz que a pessoa não precisa escolher entre agir por conta própria ou buscar outra orientação com autoridade. Na penumbra, a regra ainda orienta, mas só de modo incerto, e a conclusão passa a ser uma escolha; nem a penumbra nem o caso claro são uma escolha sem regra alguma.` },

    { id: 6, categoria: 'textura-comunicacao', enunciadoHtml: `Para que o exemplo do pai se aproxime do uso jurídico do precedente, Hart supõe que o pai seja visto de que maneira?`, alternativasHtml: [
        `Como alguém que introduz novos padrões de conduta, rompendo com a tradição.`,
        `Como autoridade sobre a conduta apropriada, que adere a padrões tradicionais e não cria padrões novos.`,
        `Como quem dá ordens escritas que a criança deve decorar.`,
        `Como um estranho, cuja conduta a criança pode escolher imitar ou não.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Hart supõe que a criança veja o pai como autoridade sobre os comportamentos apropriados, e que o pai se considere, e seja considerado pelos outros, como quem adere a padrões tradicionais, e não como quem introduz padrões novos (p. 138). Um pai que rompe com a tradição inverte essa suposição. O exemplo também não é uma ordem escrita para decorar, e sim uma conduta observada. A imagem de um estranho, por fim, contradiz a ideia de que o pai é visto como autoridade.` },

    { id: 7, categoria: 'textura-comunicacao', enunciadoHtml: `Qual das afirmações a seguir corresponde ao que Hart escreve sobre a distinção entre precedente e legislação?`, alternativasHtml: [
        `A legislação é totalmente certa, e o precedente, totalmente incerto.`,
        `A legislação só produz incerteza quando é escrita em língua estrangeira.`,
        `A distinção entre a incerteza do precedente e a certeza da legislação é de longe menos firme do que sugere o contraste ingênuo.`,
        `Precedente e legislação são o mesmo instrumento, sem diferença entre eles.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Hart escreve que a distinção entre as incertezas da comunicação por exemplos dotados de autoridade e as certezas da linguagem geral dotada de autoridade é de longe menos firme do que sugere o contraste ingênuo (p. 139). Tratar a legislação como totalmente certa vai contra o texto, pois mesmo regras gerais geram dúvidas em casos concretos. Não aparece no trecho a ideia de que a incerteza depende da língua em que a lei é escrita. Os dois instrumentos, por sua vez, não são iguais: Hart os distingue pelo uso de palavras gerais.` },

    { id: 8, categoria: 'textura-comunicacao', enunciadoHtml: `O que legislação e precedente têm em comum, segundo Hart?`, alternativasHtml: [
        `Ambos eliminam por completo qualquer dúvida sobre a conduta exigida.`,
        `Ambos dispensam a aplicação a casos concretos.`,
        `Ambos são usados apenas em sistemas jurídicos que não têm precedente.`,
        `Ambos comunicam padrões gerais de conduta, com antecipação das ocasiões em que devem ser aplicados.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Hart apresenta legislação e precedente como dois expedientes para comunicar padrões gerais de conduta, com antecipação das ocasiões em que devem ser aplicados (p. 137). Nenhum dos dois elimina toda dúvida, como o restante do trecho mostra. Dispensar a aplicação a casos concretos não cabe, já que é na aplicação que as dúvidas surgem. Por fim, o texto não diz que só sistemas sem precedente usam essa comunicação.` }
];
