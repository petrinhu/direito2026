import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas do Bloco 1 (Filosofia Moderna) do quiz de Filosofia Jurídica,
 * 3a unidade: a primeira fase (formar o Estado) e a segunda (limitar o
 * Estado). Ids 1 a 16, todas de múltipla escolha com quatro alternativas.
 * As explicações descrevem o conteúdo e o autor, sem indicar posição de
 * alternativa, porque o motor embaralha as respostas a cada rodada.
 */
export const moderna: readonly PerguntaQuiz[] = [
  { id: 1, categoria: 'filosofia-moderna', enunciadoHtml: `Como Maquiavel explica a dominação dos súditos pelo governante?`, alternativasHtml: [
        `Pela autoridade divina que a Igreja concede ao príncipe, sem necessidade de justificativa política.`,
        `Pelo consentimento racional dos súditos, obtido em debates públicos sobre o bem comum.`,
        `Pela força ou pela fraude, e não pelo Direito nem pela justiça.`,
        `Pelo respeito a uma Constituição escrita, que obriga o governante antes mesmo de os súditos reconhecerem a sua autoridade.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Para Maquiavel, governar é uma arte de guerra, e a dominação se dá pela força ou pela fraude, não pelo Direito nem pela justiça. A resposta que atribui ao príncipe uma autoridade divina é a tese de Bossuet, para quem o poder régio vem de Deus, e não de Maquiavel. A que fala em consentimento racional dos súditos erra porque Maquiavel não se preocupa com a legitimidade: seu foco é o que mantém o governante. A que exige uma Constituição escrita contradiz a tese dele de que, sem Estado, não há Constituição.` },

    { id: 2, categoria: 'filosofia-moderna', enunciadoHtml: `Jean Bodin introduz a noção de soberania. Qual das descrições corresponde ao que ele entende por soberania?`, alternativasHtml: [
        `Poder supremo, uno e indivisível: não há Estado sem poder soberano, e o soberano faz as leis sem se sujeitar a elas.`,
        `Poder dividido entre o rei e a Igreja, sem superior comum que decida os conflitos entre eles.`,
        `Poder que deriva do consentimento periódico dos súditos, que podem retirá-lo a qualquer momento.`,
        `Poder limitado pelos direitos individuais, que existem antes e fora do Estado.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Para Bodin, a soberania é o poder supremo, uno e indivisível, e não há Estado sem ele. O soberano faz as leis e não se sujeita a elas; está preso apenas às leis divinas e naturais. A descrição de um poder dividido entre o rei e a Igreja contraria a unidade que Bodin defende. A que faz o poder depender do consentimento dos súditos, que podem retirá-lo, é uma visão contratualista, que aparece em Hobbes e em Locke, e não em Bodin. A que limita o poder por direitos individuais anteriores ao Estado também pertence a Locke, e não a Bodin, para quem o soberano não se sujeita às leis que faz.` },

    { id: 3, categoria: 'filosofia-moderna', enunciadoHtml: `Jacques Bossuet é apresentado como ideólogo do poder régio. Qual é a sua posição sobre a rebeldia contra o príncipe?`, alternativasHtml: [
        `Um direito natural do povo, que pode dissolver o governo quando ele abusa do poder.`,
        `Um recurso legítimo, desde que aprovado pela maioria dos súditos reunidos.`,
        `Uma crítica razoável, que o soberano deve ouvir antes de decidir sobre os seus atos.`,
        `Sacrilégio e atentado à ordem sagrada, pois o príncipe reina por direito divino.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Bossuet fundamenta o poder do monarca num direito que vem de Deus. Por isso, qualquer ideia de rebeldia contra o príncipe cristão é sacrilégio e atentado à ordem sagrada. A posição que dá ao povo o direito de dissolver o governo é a de Locke, com o direito à revolução, e não a de Bossuet. A que aprova a rebeldia desde que a maioria concorde pertence à lógica do consentimento, que Bossuet não admite ao fundar o poder em Deus. A que trata a rebeldia como crítica razoável ignora que, para Bossuet, qualquer rebeldia é sacrilégio.` },

    { id: 4, categoria: 'filosofia-moderna', enunciadoHtml: `Para Hobbes, antes do Estado, a vida dos homens é marcada pela guerra de todos contra todos. Quais são as três causas dessa discórdia?`, alternativasHtml: [
        `Propriedade, religião e fome.`,
        `Competição, desconfiança e glória.`,
        `Liberdade, igualdade e propriedade.`,
        `Razão, paixão e costume.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Hobbes aponta três causas de discórdia no estado de natureza: competição, desconfiança e glória. A combinação de propriedade, religião e fome não corresponde às causas que Hobbes aponta. A de liberdade, igualdade e propriedade descreve o estado de natureza de Locke, que é de liberdade e igualdade, e não de guerra. A de razão, paixão e costume não é uma das três causas que Hobbes aponta, e por isso não responde à pergunta.` },

    { id: 5, categoria: 'filosofia-moderna', enunciadoHtml: `Segundo Hobbes, por que os indivíduos celebram o contrato social?`, alternativasHtml: [
        `Para ter paz: cada um renuncia a parte da sua liberdade em nome do Estado, administrado por um monarca absoluto.`,
        `Para preservar a liberdade e a propriedade contra qualquer poder do Estado.`,
        `Para escolher, por voto, representantes que governem em nome de todos.`,
        `Para restaurar o direito divino dos reis, abalado pelas guerras civis.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Hobbes vê no contrato a saída para a guerra de todos contra todos: para ter paz, cada um renuncia a parte da liberdade em nome do Estado, que o monarca absoluto administra. A resposta que fala em preservar a liberdade e a propriedade contra o Estado é a de Locke, para quem o governo serve ao indivíduo; em Hobbes, é a paz que justifica a renúncia. A do voto e dos representantes é a de Montesquieu, que entrega o Legislativo a representantes do povo, e não a de Hobbes, que concentra o poder no monarca. A do restauro do direito divino dos reis é a tese de Bossuet, que não parte de nenhum contrato.` },

    { id: 6, categoria: 'filosofia-moderna', enunciadoHtml: `Hugo Grotius afirma que o direito natural valeria mesmo que Deus não existisse, o que era chocante para a época. Qual é o fundamento que ele atribui ao direito natural?`, alternativasHtml: [
        `A vontade do soberano, que o torna obrigatório para todos os súditos.`,
        `A revelação das Escrituras, que é a única fonte válida do direito.`,
        `O costume local, transmitido de geração em geração pelas famílias.`,
        `A razão, pela qual o Direito se revela.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Grotius funda o direito natural na razão: o Direito se revela pela razão, e não pela vontade de um governante nem pela revelação. A resposta que atribui o direito à vontade do soberano é a de Hobbes, que funda o Direito no poder. A que aponta a revelação das Escrituras como única fonte deixa de lado justamente o que Grotius faz, ao separar o direito natural de Deus. A que fala do costume local descreve um direito de cada povo, e não o direito natural que Grotius defende.` },

    { id: 7, categoria: 'filosofia-moderna', enunciadoHtml: `Samuel Pufendorf distingue Direito e Moral. Qual é, para ele, a finalidade do direito natural?`, alternativasHtml: [
        `A salvação da alma, alcançada pela caridade e pela obediência à Igreja.`,
        `A sociabilidade, isto é, viver em comunidade.`,
        `A proteção da propriedade privada contra qualquer intervenção do Estado.`,
        `A obediência cega ao príncipe, que a razão humana sempre confirma.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Para Pufendorf, a finalidade do direito natural é a sociabilidade: viver em comunidade. A resposta sobre a salvação da alma é uma finalidade religiosa, que não aparece no fundamento racional de Pufendorf, para quem o direito se funda na razão humana. A que propõe proteger a propriedade contra o Estado é a posição de Locke, que coloca os direitos antes do governo. A que prega obediência cega ao príncipe é a posição de Bossuet, e Pufendorf não a adota.` },

    { id: 8, categoria: 'filosofia-moderna', enunciadoHtml: `Locke descreve o estado de natureza como de liberdade e igualdade, e não de guerra. Por que, então, ele entende que é preciso criar o governo civil?`, alternativasHtml: [
        `Porque a natureza humana é má, e só um soberano absoluto pode impedir a guerra entre os homens.`,
        `Porque o estado de natureza é uma guerra que só o monarca absoluto pode encerrar.`,
        `Porque nem todos respeitam as leis naturais, e ninguém julga bem em causa própria; o governo civil entra como árbitro imparcial.`,
        `Porque a Igreja deve governar a vida civil e julgar as disputas entre os fiéis.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Locke vê o problema não na falta de liberdade, mas na falta de árbitro: nem todos respeitam as leis naturais, e ninguém deve julgar a própria causa. Por isso o governo civil entra como árbitro imparcial. A resposta que atribui a Locke a ideia de que o soberano absoluto é a saída para uma natureza má é a de Hobbes, para quem o estado de natureza é guerra. A da guerra encerrada pelo monarca absoluto também é de Hobbes. A que dá à Igreja o governo da vida civil não corresponde a Locke, que defende o governo civil como árbitro, e não como autoridade religiosa.` },

    { id: 9, categoria: 'filosofia-moderna', enunciadoHtml: `Locke e Montesquieu tratam da separação de poderes. Qual afirmação descreve corretamente a diferença entre os dois?`, alternativasHtml: [
        `Locke fala em poder federativo, sobre guerra, paz e alianças; Montesquieu coloca o judiciário como terceiro poder.`,
        `Locke fala em poder judiciário, que julga as disputas; Montesquieu fala em poder federativo, sobre as relações externas.`,
        `Locke e Montesquieu defendem os mesmos três poderes, sem diferença de nome nem de função.`,
        `Montesquieu entrega o poder federativo ao rei, e Locke entrega o julgamento das disputas à Igreja.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Locke defende três poderes: executivo, legislativo e federativo, este último sobre a guerra, a paz e as alianças. Montesquieu fala em executivo, legislativo e judiciário. A resposta que troca o federativo pelo judiciário inverte as duas listas. A que diz que os dois defendem os mesmos poderes ignora que o federativo, de Locke, não aparece em Montesquieu. A que entrega o julgamento à Igreja atribui a Locke uma tese que ele não defende: para ele, o governo civil é que entra como árbitro imparcial.` },

    { id: 10, categoria: 'filosofia-moderna', enunciadoHtml: `Para Locke, o que cabe ao povo quando há tirania, usurpação ou desvio de poder?`, alternativasHtml: [
        `Obedecer ao governo até o fim, porque o poder vem de Deus e não pode ser questionado.`,
        `Esperar que a Igreja intervenha para restabelecer a ordem civil e a paz.`,
        `Abrir mão dos direitos individuais em nome da paz, como propõe o contrato de Hobbes.`,
        `O direito de dissolver o governo, o chamado direito à revolução.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Locke coloca o povo sobre os poderes estatais: havendo tirania, usurpação ou desvio de poder, cabe ao povo dissolver o governo, o direito à revolução. A resposta de obediência até o fim, por origem divina, é a de Bossuet, para quem a rebeldia é sacrilégio. A que espera a intervenção da Igreja não corresponde a Locke, que atribui ao povo o direito de dissolver o governo. A que pede que se abram mão de todos os direitos em nome da paz é a saída de Hobbes, que Locke rejeita ao defender que o estado de natureza é de liberdade, e não de guerra.` },

    { id: 11, categoria: 'filosofia-moderna', enunciadoHtml: `Montesquieu afirma que só o poder contém o poder. Qual é a razão dessa afirmação?`, alternativasHtml: [
        `O povo reunido em praça pública é o único capaz de vigiar os governantes e de os fiscalizar.`,
        `Todo homem que possui poder é levado a abusar dele, e só o poder, ao encontrar limites, pode frear esse abuso.`,
        `O poder do rei é naturalmente limitado pela vontade divina, que o próprio príncipe reconhece.`,
        `Os juízes precisam ser superiores ao legislador para que a liberdade dos cidadãos seja garantida.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Para Montesquieu, quem tem poder tende a abusar dele e avança até encontrar limites. Só outro poder, separado do primeiro, pode contê-lo. A resposta que entrega ao povo reunido a vigilância dos governantes contradiz o próprio Montesquieu, para quem o povo reunido é inviável nos grandes Estados, e por isso a lei passa a representantes. A que impõe a vontade divina como limite ao rei é a tese de Bossuet, para quem o poder régio vem de Deus, e não de um limite. A que coloca juízes superiores ao legislador inverte a tese: o julgador que se torna legislador é justamente o perigo que Montesquieu aponta.` },

    { id: 12, categoria: 'filosofia-moderna', enunciadoHtml: `Rousseau abre o Contrato Social com uma afirmação famosa. Qual é ela?`, alternativasHtml: [
        `O homem é o lobo do próprio homem, e por isso precisa de um soberano absoluto.`,
        `Só o poder contém o poder, e por isso os poderes devem ser separados entre si.`,
        `O homem nasce livre e, por toda parte, encontra-se sob ferros.`,
        `Sem Estado não há Constituição, e o governante deve ser julgado pela sua eficácia.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A abertura do Contrato Social afirma que o homem nasce livre e, por toda parte, encontra-se sob ferros, e pergunta o que torna legítima essa mudança. A frase sobre o lobo do próprio homem é de Hobbes, que a retoma de Plauto e chega a outra conclusão: um soberano absoluto. A da separação dos poderes é de Montesquieu, e não de Rousseau. A de que sem Estado não há Constituição é de Maquiavel, que retoma a noção de Estado sem tratar da legitimidade.` },

    { id: 13, categoria: 'filosofia-moderna', enunciadoHtml: `Segundo Rousseau, quem é o titular legítimo do poder e por que a soberania não pode ser representada?`, alternativasHtml: [
        `O corpo social, porque a soberania não pode ser representada nem alienada.`,
        `O monarca, por delegação divina, que governa em nome do povo e responde apenas a Deus.`,
        `Os representantes eleitos, que exercem a soberania em nome do povo durante o mandato.`,
        `Os juristas, que interpretam a vontade geral e a traduzem em leis para os cidadãos.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Para Rousseau, o titular legítimo do poder é o corpo social, e a soberania não pode ser representada nem alienada. Daí a titularidade do Poder Constituinte, inalienável, indivisível e imprescritível. A resposta do monarca que governa por delegação divina é a tese de Bossuet, para quem o rei reina por um direito que vem de Deus. A dos representantes eleitos que exercem a soberania é justamente o que Rousseau rejeita: para ele, o inglês só é livre no dia em que elege o parlamento. A dos juristas que interpretam a vontade geral põe um intermediário onde Rousseau quer que a vontade seja a do próprio corpo social.` },

    { id: 14, categoria: 'filosofia-moderna', enunciadoHtml: `Kant distingue três espécies de imperativos. Qual é a diferença entre o imperativo hipotético e o categórico?`, alternativasHtml: [
        `O hipotético vale para todos, e o categórico depende do interesse de quem obedece.`,
        `O hipotético é bom para atingir um fim; o categórico é bom em si mesmo e cumprido incondicionalmente.`,
        `O hipotético é moral, e o categórico é técnico, como a receita que o médico passa ao paciente.`,
        `As duas espécies são iguais, e a diferença está apenas na linguagem usada para formulá-las.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `No hipotético, a ação é boa para atingir um fim, como pagar o tributo por medo da multa. No categórico, a ação é boa em si mesma e cumprida incondicionalmente, e é o campo da moral. A resposta que diz que o hipotético vale para todos e o categórico depende de interesse inverte as duas espécies: o categórico é justamente o que não depende de interesse. A que associa o hipotético à moral e o técnico ao médico troca as espécies, porque a receita do médico é a destreza, sem vontade boa ou má. A que iguala as espécies ignora que o fim a ser atingido é o que separa uma da outra.` },

    { id: 15, categoria: 'filosofia-moderna', enunciadoHtml: `Qual é a formulação de Kant sobre a dignidade da pessoa?`, alternativasHtml: [
        `Tudo o que tem preço pode ser substituído, e a dignidade é apenas um valor de mercado.`,
        `A pessoa pode ser usada como meio, desde que o fim do grupo seja justo e legítimo.`,
        `A pessoa deve ser sempre fim, nunca meio, e o que está acima de todo preço tem dignidade.`,
        `A dignidade é individual, mas pode ser sacrificada em nome do grupo quando a maioria decidir.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Kant liga a dignidade ao que não tem preço: o que pode ser substituído tem preço, e o que está além de todo preço tem dignidade. Por isso a pessoa deve ser sempre fim, nunca meio. A resposta que trata a pessoa como meio para um fim do grupo contradiz essa formulação. A que reduz a dignidade a valor de mercado inverte o sentido, porque é o preço que pode ser substituído, e não a dignidade. A que admite sacrificar a dignidade em nome da maioria é o que Kant rejeita: a dignidade da pessoa é individual e não pode ser sacrificada em nome do grupo.` },

    { id: 16, categoria: 'filosofia-moderna', enunciadoHtml: `Hegel é apresentado como crítico do contrato social. O que ele afirma sobre o Estado?`, alternativasHtml: [
        `O Estado é uma soma de indivíduos isolados, que combinam suas vontades por meio de um acordo.`,
        `O Estado é uma convenção frágil, que só existe enquanto os cidadãos quiserem mantê-lo.`,
        `O Estado é menos importante que a sociedade civil, que deve ser livre para se organizar.`,
        `O Estado é um fato que se impõe, e a sociedade civil não tem primazia sobre ele.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Para Hegel, o contrato social é ficção, e o Estado é um fato que se impõe, não a soma de indivíduos isolados. Com ele, rompe-se também com a primazia da sociedade civil sobre o Estado. A resposta que vê o Estado como soma de indivíduos que combinam vontades é justamente o contratualismo que Hegel critica. A que trata o Estado como convenção frágil, que se desfaz quando os cidadãos deixam de querê-lo, também nega o caráter de fato que Hegel lhe atribui. A que dá à sociedade civil a primazia sobre o Estado é a inversão que Hegel recusa.` }
];
