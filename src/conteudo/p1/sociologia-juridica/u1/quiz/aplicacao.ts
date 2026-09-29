import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas de categoria 'aplicacao' do quiz de Sociologia Jurídica, 1a
 * unidade: situações concretas em que o estudante precisa reconhecer qual
 * leitura sociológica se aplica (Marx, Durkheim ou Weber), no estilo das
 * questões da atividade de 02/09. Os exemplos brasileiros (contrato de
 * trabalho, aluguel, multa de trânsito, despejo, INSS, cartório) vêm da
 * versão didática do artigo "Da luta à ordem". Nenhuma delas cita
 * dispositivo de lei.
 */
export const aplicacao: readonly PerguntaQuiz[] = [
    { id: 60, categoria: 'aplicacao', enunciadoHtml: `Uma empregada aceita as cláusulas do seu contrato de trabalho porque precisa do salário. No papel, empregador e empregada são "livres" e "iguais" para contratar. Qual leitura destaca que essa liberdade e essa igualdade jurídicas são artifícios necessários à exploração mediada pelo contrato?`, alternativasHtml: [
        `A de Durkheim, para quem o contrato expressa a consciência coletiva forte da solidariedade mecânica.`,
        `A de Marx, para quem a igualdade formal torna possível tratar a força de trabalho como mercadoria e obscurece os laços que prendem o trabalhador ao capital.`,
        `A de Weber, para quem o contrato é sempre uma forma de dominação carismática.`,
        `A de Weber, para quem o contrato de trabalho prova que o direito é neutro e independente da economia.`,
        `A de Durkheim, para quem a igualdade jurídica é sinal de patologia social.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Na leitura marxista do artigo, a igualdade jurídica torna equivalentes os sujeitos que portam e vendem mercadorias, inclusive a força de trabalho, e permite o contrato. Liberdade e igualdade aparecem como artifício necessário à exploração mediada pelo contrato, e não como emancipação efetiva. A alternativa A é a mais tentadora, porque Durkheim também trata de contratos, mas os associa ao direito restitutivo da solidariedade orgânica, e não à mecânica nem a uma crítica da exploração. As alternativas C e D atribuem a Weber teses que ele não sustenta no material.` },

    { id: 61, categoria: 'aplicacao', enunciadoHtml: `Um cidadão cumpre sem resistir a decisão do INSS, escrita, com competência definida e procedimento previsto, porque acredita que o procedimento é legítimo, e não porque o servidor seja "carismático" ou "senhor tradicional". Que tipo de dominação legítima, segundo Weber, explica essa obediência?`, alternativasHtml: [
        `Dominação carismática, baseada nas qualidades extraordinárias do servidor.`,
        `Dominação tradicional, baseada no costume de obedecer.`,
        `Solidariedade mecânica, baseada na semelhança entre os indivíduos.`,
        `Dominação legal-racional, baseada na crença na validade das normas e na competência estabelecida por regras.`,
        `Dominação direta e pessoal, própria do escravismo e do feudalismo.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O exemplo do material mostra que INSS, Receita Federal, cartório e tribunal funcionam com procedimentos escritos, competências definidas e recursos, e que uma multa administrativa ou uma sentença obtém obediência porque as pessoas creem na legitimidade do procedimento legal. É a dominação legal-racional, cuja forma máxima é a burocracia. A alternativa B é a mais tentadora, porque é o outro tipo de dominação com que as pessoas costumam confundir a obediência habitual, mas ela se apoia em tradições, e não em normas escritas. A E é a dominação pré-capitalista descrita por Marx.` },

    { id: 62, categoria: 'aplicacao', enunciadoHtml: `Numa ação de cumprimento de contrato de compra e venda, a sentença manda entregar o bem e pagar indenização pelo atraso. Em termos durkheimianos, essa sanção é típica de qual tipo de direito?`, alternativasHtml: [
        `Direito restitutivo, predominante na solidariedade orgânica, que busca restaurar relações ou situações jurídicas.`,
        `Direito repressivo, predominante na solidariedade mecânica, que reage passionalmente à violação da consciência coletiva.`,
        `Direito carismático, pois o juiz impõe sua autoridade pessoal.`,
        `Direito da superestrutura, que apenas esconde a exploração de classe.`,
        `Direito tradicional, pois repete o costume das partes.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Para Durkheim, na solidariedade orgânica predomina o direito restitutivo, típico do direito civil e comercial, cuja sanção não é expiatória, mas restaura o estado anterior: pagar o devido, restituir o imóvel, indenizar. Já a multa de trânsito e a pena criminal, também citadas no material, são exemplos de sanção repressiva, que castiga. A alternativa B é a mais tentadora, porque a palavra "sanção" evoca punição, mas aqui o resultado é restaurar, e não castigar. As alternativas C e E usam conceitos de Weber, e a D, de Marx.` },

    { id: 63, categoria: 'aplicacao', enunciadoHtml: `Um município registra, ano após ano, um número de crimes dentro do padrão regular esperado para uma sociedade daquele tipo. Como Durkheim classificaria esse fenômeno?`, alternativasHtml: [
        `Como fenômeno patológico, que revela o colapso da coesão social.`,
        `Como artifício jurídico de proteção de bens da classe dominante.`,
        `Como ação social sem qualquer sentido para quem a pratica.`,
        `Como efeito da burocracia, que produz crimes ao formalizar normas.`,
        `Como fato social normal, em relação ao qual não há razão científica para querer eliminá-lo.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `Em As regras do método sociológico, Durkheim distingue normal de patológico: o crime é fato social normal (geral, coercitivo, exterior) e só se torna patológico quando deixa de ser regular. Se é normal, não há razão científica para querer eliminá-lo. A alternativa A é a mais tentadora, porque a palavra "crime" sugere anormalidade, mas o critério de Durkheim é a regularidade, e não o valor moral do fato. A B é a leitura marxista sugerida pelo artigo, e a C e a D não correspondem a nenhum dos dois.` },

    { id: 64, categoria: 'aplicacao', enunciadoHtml: `Um jurista deixa de olhar apenas o texto das normas e passa a estudar o comportamento social relacionado a elas e os sentidos que as pessoas lhes atribuem, para compreender o funcionamento efetivo do ordenamento. Qual sociologia ele está praticando?`, alternativasHtml: [
        `A de Durkheim, que trata os fatos sociais como coisas e observa a sociedade de fora.`,
        `A de Marx, que explica o direito pelas condições materiais de produção.`,
        `A de Weber, a sociologia compreensiva, que busca compreender as condições que geram determinada ação social.`,
        `A de Kelsen, que defende a pureza normativa do direito.`,
        `A de Comte, que propõe uma sociologia positivista da ordem social.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Os slides dizem que, para o jurista, compreender os sentidos atribuídos às normas ajuda a interpretar o funcionamento efetivo do ordenamento, e que a análise passa do texto normativo para o comportamento social relacionado às normas. É a sociologia compreensiva de Weber. A alternativa A é a mais tentadora, porque Durkheim também sai do texto da lei para a sociedade, mas seu método trata os fatos como coisas, sem a preocupação com o sentido subjetivo. A D fica no texto da norma, que é justamente o que o jurista do enunciado deixou de fazer.` },

    { id: 65, categoria: 'aplicacao', enunciadoHtml: `Um juiz condena uma pessoa por crime contra o patrimônio sem considerar as configurações sociais e econômicas do conflito que a levou àquele ato. Qual leitura, apresentada no artigo, destaca que operadores do direito, formados dentro da lógica jurídica, reproduzem a dominação sem perceber?`, alternativasHtml: [
        `A de Durkheim, que vê nessa condenação a satisfação da consciência comum ferida.`,
        `A de Marx, que aponta a "ilusão ideológica" do direito, presente até no ensino, que faz os operadores reproduzirem a lógica capitalista.`,
        `A de Weber, que vê no juiz um agente da dominação carismática.`,
        `A de Durkheim, que vê nessa condenação uma sanção restitutiva.`,
        `A de Weber, que vê nessa condenação a prova da neutralidade do Judiciário.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `O exemplo é do próprio artigo: no capitalismo contemporâneo, a ilusão ideológica do direito, desde o ensino, faz os operadores reproduzirem a lógica capitalista e a dominação sem perceber, como ao condenar alguém por crime patrimonial sem considerar as configurações do conflito. É leitura marxista. A alternativa A é a mais tentadora, porque a condenação de fato pode ser vista como reação a um crime, mas Durkheim leria a sanção pela lente da coesão, e não pela da dominação de classe. A C confunde o juiz com o líder carismático, e a E é o contrário do que Weber diz: para ele o Judiciário pode ser lido como empresa de dominação.` },

    { id: 66, categoria: 'aplicacao', enunciadoHtml: `Depois de intensa mobilização de trabalhadores, uma nova lei reduz a jornada de trabalho. Qual interpretação está de acordo com a conclusão do artigo sobre os três clássicos?`, alternativasHtml: [
        `Prova que o direito é independente da economia, pois mudou contra o interesse econômico dominante.`,
        `Prova que o direito serve exclusivamente à classe dominante e nunca muda.`,
        `Prova que o direito é apenas técnica neutra, alheia à luta entre grupos.`,
        `Mostra que o direito, além de participar da estabilidade e da reprodução da ordem, pode assumir potencial de transformação, conforme a distribuição e a legitimação do poder.`,
        `Mostra que a lei resulta apenas da vontade dos governantes.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O artigo conclui que o direito é instrumento de dominação e, potencialmente, de transformação social, conforme a distribuição e a legitimação do poder. Na perspectiva marxista, a luta por direitos sociais pode reduzir desigualdades e exploração. A alternativa B é a mais tentadora, porque a crítica marxista de fato aponta o direito como mantenedor de privilégios, mas o material diz que ele pode manter privilégios, e não que só o faz, nem que nunca muda. A E é simplista: o material liga o direito às relações de poder na sociedade, e não à vontade isolada dos governantes.` },

    { id: 67, categoria: 'aplicacao', enunciadoHtml: `Numa pequena comunidade em que todos partilham os mesmos valores e se assemelham, uma violação grave provoca forte indignação coletiva e punição severa, sem preocupação com vantagem prática. Que solidariedade e que tipo de direito Durkheim associaria a esse quadro?`, alternativasHtml: [
        `Solidariedade mecânica, com predomínio do direito repressivo e da pena como reação passional.`,
        `Solidariedade orgânica, com predomínio do direito restitutivo.`,
        `Solidariedade orgânica, com predomínio do direito repressivo.`,
        `Solidariedade mecânica, com predomínio do direito restitutivo.`,
        `Ausência de solidariedade, pois a pena severa é sinal de desagregação.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Na solidariedade mecânica, própria de sociedades em que os indivíduos pouco se diferenciam e prevalece a consciência coletiva, predomina o direito repressivo, e a pena é reação passional: pune-se por punir, sem expectativa de vantagem utilitária. A alternativa E é a mais tentadora para quem acha que punição severa indica crise, mas em Durkheim ela expressa justamente a força da consciência coletiva. A B e a D misturam os pares.` },

    { id: 68, categoria: 'aplicacao', enunciadoHtml: `Num debate em sala, um estudante afirma: "Se a lei trata todos como iguais, então não existe desigualdade entre as pessoas". Que resposta se apoia no material estudado?`, alternativasHtml: [
        `Está certo: a igualdade perante a lei elimina as desigualdades sociais e econômicas.`,
        `Está certo, pois a igualdade jurídica é o que confere ao direito sua neutralidade.`,
        `A igualdade perante a lei não equivale a possuir as mesmas condições materiais, e o artigo problematiza a distância entre a igualdade formal e as desigualdades vividas concretamente.`,
        `Está errado porque a igualdade jurídica não existe em nenhuma sociedade.`,
        `Está errado porque a lei só vale para a classe trabalhadora.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Os slides propõem exatamente esse debate: ser juridicamente igual significa possuir as mesmas condições materiais? O artigo problematiza a distância entre a igualdade perante a lei e as desigualdades vividas concretamente, e a resposta do material é que uma coisa não implica a outra. A alternativa D é a mais tentadora para quem quer contestar a fala, mas o material não nega a igualdade formal: no capitalismo, trabalhadores e capitalistas de fato aparecem como sujeitos livres e iguais, e isso possibilita contratos.` },

    { id: 69, categoria: 'aplicacao', enunciadoHtml: `Uma estudante pergunta por que os juízes detêm o monopólio de decidir qual versão dos fatos prevalece e por que sua decisão obtém obediência. Qual autor do material leria o Poder Judiciário como "empresa de dominação"?`, alternativasHtml: [
        `Durkheim, que vê o Judiciário como expressão da solidariedade orgânica.`,
        `Marx, que vê o Judiciário como instância da infraestrutura econômica.`,
        `Comte, que vê o Judiciário como órgão da sociologia positivista.`,
        `Parsons, que vê o Judiciário como um subsistema funcional.`,
        `Weber, para quem a ordem jurídica influencia a distribuição do poder e os juízes são agentes privilegiados pelo monopólio de decidir.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `O artigo lê o Poder Judiciário como empresa de dominação, com os juízes como agentes privilegiados pelo monopólio de decidir, no quadro da sociologia weberiana do poder e da dominação legal. A alternativa B é a mais tentadora, porque Marx também liga o direito ao poder, mas coloca as instituições jurídicas na superestrutura, e não na infraestrutura. Comte e Parsons aparecem no material apenas como referência de outras correntes, e não como fonte dessa leitura.` },

    { id: 70, categoria: 'aplicacao', enunciadoHtml: `Um órgão público passa a exigir formulário, protocolo, prazo e competência definidos para cada pedido, tudo registrado por escrito. Que dupla consequência da formalização o material, na análise de Weber, permite apontar?`, alternativasHtml: [
        `Mais solidariedade orgânica e menos direito repressivo.`,
        `Mais previsibilidade e estabilidade, mas também a consolidação de estruturas de poder.`,
        `Mais carisma dos servidores e menos peso das normas.`,
        `Mais igualdade material entre os cidadãos e o fim das relações de poder.`,
        `Mais consciência coletiva e menos divisão do trabalho.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Os slides afirmam que a formalização aumenta a previsibilidade e a estabilidade, mas também consolida estruturas de poder, e descrevem a burocracia como organização da dominação legal por normas, competências, registros e procedimentos previsíveis. A alternativa D é a mais tentadora, porque a formalização parece garantir tratamento igual, mas igualdade de procedimento não elimina relações de poder, nem produz igualdade material. A A e a E trazem vocabulário de Durkheim, alheio ao caso.` },

    { id: 71, categoria: 'aplicacao', enunciadoHtml: `Uma decisão judicial é cumprida por todos porque o procedimento é visto como legítimo. Um estudante diz que isso mostra a dominação legal de Weber; outro, que mostra a reprodução da ordem capitalista de Marx. O que o material permite dizer da relação entre as duas leituras?`, alternativasHtml: [
        `São incompatíveis, e só uma delas pode ser aplicada ao direito.`,
        `São idênticas, pois Weber também explica o direito exclusivamente pela economia.`,
        `Nenhuma se aplica, pois o direito é fenômeno isolado da sociedade.`,
        `São caminhos diferentes, com pontos de partida diferentes, que convergem em tratar o direito como fenômeno social central, ligado à organização social e às relações de poder.`,
        `Ambas são leituras de Durkheim, que já incluía a dominação legal e a economia.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Os slides resumem: os caminhos são diferentes (Marx liga o direito à estrutura econômica e às classes, Weber à racionalização, à burocracia e à dominação legal), mas todos tratam o direito como fenômeno social central na organização social e nas relações de poder. A alternativa B é a mais tentadora, porque ambos tratam do capitalismo, mas Weber justamente rejeita reduzir tudo à economia e privilegia o indivíduo e a ação social. A C nega o ponto comum entre os autores.` },

    { id: 72, categoria: 'aplicacao', enunciadoHtml: `Uma pena é aplicada e a comunidade sente que seus valores foram reafirmados. Um observador sugere que a mesma pena pode ter reforçado relações de poder. Que autores fundamentam, respectivamente, essas duas leituras?`, alternativasHtml: [
        `Durkheim, para quem a sanção protege a coesão social e a consciência coletiva, e Marx, para quem o direito reproduz as relações de poder da estrutura econômica.`,
        `Marx, para quem a sanção protege a coesão social, e Durkheim, para quem o direito reproduz a estrutura econômica.`,
        `Weber, para quem a sanção protege a coesão social, e Durkheim, para quem o direito é instrumento da burguesia.`,
        `Durkheim, para as duas leituras, pois ele já incluía a dominação de classe.`,
        `Weber, para as duas leituras, pois ele negava a influência da economia e da coesão.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Os slides propõem a pergunta "quando uma sanção protege a coesão social e quando pode reforçar relações de poder?". A primeira leitura é a de Durkheim: a sanção protege a coesão social e a consciência coletiva. A segunda é a de Marx, para quem o direito integra a superestrutura e tende a reproduzir as relações de poder. A alternativa B é a mais tentadora, porque inverte os autores, um erro comum. A C também atribui a Weber e a Durkheim ideias que não são suas.` },

    { id: 73, categoria: 'aplicacao', enunciadoHtml: `Três estudantes explicam por que as pessoas obedecem às normas jurídicas: (1) porque a sanção protege valores compartilhados; (2) porque acreditam na validade das normas e na competência de quem as aplica; (3) porque a ordem jurídica organiza e reproduz a exploração econômica. Que autores estão por trás de cada resposta, na ordem?`, alternativasHtml: [
        `(1) Weber, (2) Marx, (3) Durkheim.`,
        `(1) Marx, (2) Durkheim, (3) Weber.`,
        `(1) Durkheim, (2) Weber, (3) Marx.`,
        `(1) Durkheim, (2) Marx, (3) Weber.`,
        `(1) Weber, (2) Durkheim, (3) Marx.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A resposta (1) é a de Durkheim: a sanção protege a coesão e a consciência coletiva. A (2) é a de Weber: obedece-se pela crença na validade das normas e na competência funcional estabelecida por regras (dominação legal). A (3) é a de Marx: o direito organiza e reproduz o modo de produção capitalista. A alternativa E é a mais tentadora, porque troca apenas os dois primeiros, e a confusão entre coesão e legitimidade legal é frequente.` },

    { id: 74, categoria: 'aplicacao', enunciadoHtml: `Um pesquisador afirma que, para explicar o surgimento do capitalismo moderno, basta olhar a economia. Que reparo Weber faria, segundo o material?`, alternativasHtml: [
        `Que a economia não tem nenhuma influência sobre o capitalismo.`,
        `Que só a consciência coletiva explica o capitalismo.`,
        `Que o capitalismo é produto da dominação carismática.`,
        `Que só as classes sociais importam para explicar o capitalismo.`,
        `Que a economia importa, mas fatores não econômicos, como valores religiosos, também moldam o desenvolvimento moderno, e o monismo causal deve ser rejeitado.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `Weber não nega a influência econômica, mas rejeita o monismo causal que tudo reduz à economia: fatores políticos, religiosos e culturais também moldam o desenvolvimento moderno. A alternativa A é a mais tentadora, porque parece a oposição natural à frase do pesquisador, mas é exagerada: o reparo de Weber é de pluralidade de causas, e não de negação da economia. A D repete, em outro tom, a redução a um único fator.` },

    { id: 75, categoria: 'aplicacao', enunciadoHtml: `O material de estudo traz, ao lado do artigo, uma leitura crítica de outra corrente (a jusnaturalista), segundo a qual a consciência coletiva pode exigir o injusto e a descrição do que as pessoas tratam como obrigatório não responde ao que é razoável exigir. O que essa leitura diz sobre o fato social de Durkheim?`, alternativasHtml: [
        `Que ele prova que a consciência coletiva nunca erra.`,
        `Que ele explica regularidade, mas não obrigatoriedade moral: coesão e bem comum não coincidem.`,
        `Que ele explica a dominação de classe, mas não a solidariedade.`,
        `Que ele depende do carisma de quem impõe a coerção.`,
        `Que ele só existe em sociedades de solidariedade orgânica.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Na leitura crítica registrada no material de estudo, o fato social, definido por coerção exterior, generalidade e independência das manifestações individuais, explica regularidade, não obrigatoriedade moral, e uma sociedade pode ser solidária na violação de direitos: coesão e bem comum não coincidem. É uma objeção de outra corrente, útil para o estudante notar o alcance e o limite do conceito. A alternativa A é a mais tentadora por ser o oposto exato da objeção. A C atribui ao fato social um papel que é da leitura marxista.` },

    { id: 76, categoria: 'aplicacao', enunciadoHtml: `Um estudante quer explicar uma lei apenas pela análise interna de seu texto, como se o direito se compreendesse a partir de si mesmo. Que crítica a leitura marxista do artigo faria a esse procedimento?`, alternativasHtml: [
        `Que o texto da lei é a única fonte confiável de análise.`,
        `Que o direito só se compreende por meio da consciência coletiva.`,
        `Que o direito só se compreende pelo sentido subjetivo de cada intérprete.`,
        `Que as relações jurídicas não podem ser compreendidas a partir de si mesmas: têm origem nas condições materiais de vida e devem buscar fundamento na economia política.`,
        `Que a análise deveria começar pela burocracia estatal, e não pela lei.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O artigo afirma que, para Marx, as relações jurídicas não podem ser compreendidas a partir de si mesmas: têm origem nas condições materiais de vida e devem buscar fundamento na economia política, e a forma abstrata e codificada da lei alimenta a ilusão de autonomia. A alternativa C é a mais tentadora, porque o sentido subjetivo importa em Weber, mas essa é outra chave de leitura. A B é de Durkheim e a E, de Weber.` },

    { id: 77, categoria: 'aplicacao', enunciadoHtml: `Numa repartição, cargos são ocupados por parentes e amigos do chefe, com base em favores e costumes. Que traço, segundo Weber, a burocracia moderna busca superar nesse quadro?`, alternativasHtml: [
        `O peso do parentesco e dos costumes tradicionais, substituídos por normas abstratas, competências definidas e regras racionais.`,
        `O peso das leis, substituídas pelo carisma do chefe.`,
        `A divisão do trabalho, substituída pela semelhança entre os indivíduos.`,
        `A propriedade dos meios de produção, substituída pela propriedade estatal.`,
        `A consciência coletiva, substituída pelo direito restitutivo.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `O didático explica que a burocracia reduz a importância do parentesco e dos costumes tradicionais, com normas abstratas, previsibilidade, especialização e registros. O quadro do enunciado, de cargos por favores, é o oposto do tipo legal. A alternativa B é a mais tentadora, porque a autoridade pessoal do chefe lembra o carisma, mas o carisma se apoia em qualidades extraordinárias, e o caso descrito é de parentesco e favor. A C e a E trazem Durkheim, e a D, Marx.` },

    { id: 78, categoria: 'aplicacao', enunciadoHtml: `Um líder é obedecido porque seus seguidores acreditam que ele possui qualidades extraordinárias, acima de qualquer regra escrita. Que tipo de dominação legítima, segundo Weber, está em jogo?`, alternativasHtml: [
        `Dominação legal-racional, porque há obediência a um mandato.`,
        `Dominação tradicional, porque o líder está no cargo há muito tempo.`,
        `Dominação carismática, vinculada à crença nas qualidades extraordinárias de uma pessoa.`,
        `Dominação capitalista indireta, exercida pelo Estado e pelo direito.`,
        `Solidariedade mecânica, porque todos os seguidores se assemelham.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A dominação carismática está vinculada à crença nas qualidades extraordinárias de uma pessoa, e não em normas ou tradições. A alternativa B é a mais tentadora, porque a duração no cargo lembra a tradição, mas o fundamento da obediência no enunciado é a qualidade extraordinária do líder, e não o costume. A A ignora que a obediência da dominação legal se apoia em normas e competência, e a D é conceito de Marx.` },

    { id: 79, categoria: 'aplicacao', enunciadoHtml: `Numa comunidade, o chefe é obedecido porque sempre foi assim: a autoridade é herdada e o costume é visto como legítimo. Que tipo de dominação legítima, segundo Weber, explica essa obediência?`, alternativasHtml: [
        `Dominação legal-racional, pela competência funcional estabelecida por regras.`,
        `Dominação carismática, pelas qualidades extraordinárias do chefe.`,
        `Solidariedade orgânica, pela divisão do trabalho entre chefe e comunidade.`,
        `Direito restitutivo, pela restauração da situação anterior.`,
        `Dominação tradicional, vinculada à crença na legitimidade das tradições.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `A dominação tradicional está vinculada à crença na legitimidade das tradições: obedece-se porque sempre foi assim. A alternativa B é a mais tentadora, porque uma autoridade herdada pode parecer especial, mas a crença aqui é no costume, e não em qualidades extraordinárias de uma pessoa. A A é o tipo baseado em normas e competência, e a C e a D são conceitos de Durkheim.` },

    { id: 80, categoria: 'aplicacao', enunciadoHtml: `Um advogado afirma: "Todos são iguais perante a lei, então a desigualdade de moradia não é uma questão jurídica". Como o material orienta a leitura crítica dessa fala?`, alternativasHtml: [
        `Ela está correta, pois o direito é sistema autônomo e neutro.`,
        `Ela está correta, pois o direito só se ocupa de normas e não de fatos sociais.`,
        `Ela está errada, pois a igualdade perante a lei é uma ficção sem efeito algum.`,
        `Ela está errada, pois o direito não guarda relação com a distribuição do poder.`,
        `O material lembra que, sobretudo no capitalismo avançado, o discurso da legalidade pode encobrir desigualdades estruturais, e por isso o jurista deve situar o direito em seu contexto histórico e sociológico.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `A conclusão do artigo reforça a leitura crítica do fenômeno jurídico: o direito não é sistema autônomo e neutro, mas fenômeno social vinculado às estruturas econômicas, morais e políticas, e o discurso da legalidade, no capitalismo avançado, pode encobrir desigualdades estruturais. A alternativa C é a mais tentadora para quem quer corrigir a fala, mas o material não diz que a igualdade perante a lei não tenha efeito: ela possibilita, por exemplo, o contrato, e o ponto é a distância entre a igualdade formal e as desigualdades vividas. A A e a B repetem a visão dogmática que a sociologia jurídica busca ampliar.` },
];
