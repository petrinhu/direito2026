import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas de categoria 'media' do quiz de Filosofia Jurídica, 1a unidade:
 * a Idade Média (organicismo cristão, Patrística de Agostinho, Escolástica
 * de Tomás de Aquino, contraponto de Duns Escoto e Ockham). Ids 59 a 72 são
 * de múltipla escolha; 73 a 80, de verdadeiro ou falso. Onde a bibliografia
 * traz leituras diferentes (lei humana e lei natural em Tomás, relação entre
 * Estado e Igreja), a explicação adota a leitura do material da disciplina e sinaliza a outra.
 */
export const media: readonly PerguntaQuiz[] = [
    { id: 59, categoria: 'media', enunciadoHtml: `Como o pensamento medieval concebe a sociedade?`, alternativasHtml: [
        `Como uma comunidade cristã, um "corpo místico", com papéis sociais imutáveis dados por Deus.`,
        `Como um conjunto de indivíduos autônomos que pactuam livremente as leis que os governarão.`,
        `Como um espaço de debate entre cidadãos iguais, ao modo da pólis grega e de sua praça.`,
        `Como um campo de disputa permanente entre classes, regulado apenas pela força do mais forte.`,
        `Como uma ordem apenas natural, sem qualquer relação com a vontade divina ou com a Igreja.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A Idade Média é marcada pelo cristianismo, e predomina um organicismo cristão: o indivíduo é visto sobretudo como membro da coletividade, e a sociedade é uma grande comunidade cristã, cuja perfeição vem de ser determinada por Deus, daí os papéis sociais bem definidos e imutáveis. A resposta dos indivíduos autônomos que pactuam as leis é a mais tentadora, porque a valorização do indivíduo é um traço posterior, que só aparece com Duns Escoto e Ockham, como contraponto ao organicismo dominante.` },

    { id: 60, categoria: 'media', enunciadoHtml: `Segundo Wolkmer, o que o cristianismo traz de novo, em contraste com a Antiguidade, quanto à valorização do homem?`, alternativasHtml: [
        `Passa a valorizar o homem por suas posses e por seus feitos heroicos em batalha e na política.`,
        `Reconhece o homem como unidade de matéria e espírito, base de uma dignidade transcendental.`,
        `Afirma o Estado como o bem maior, colocado acima do homem e de sua vida dentro da sociedade.`,
        `Exclui o homem comum da ordem divina, reservando-a apenas à Igreja e aos seus ministros.`,
        `Limita a dignidade aos cidadãos livres de Roma, como fazia o direito romano clássico.`
      ], correta: 1, fonteExtra: true, explicacaoHtml: `Wolkmer contrasta os dois mundos: na Antiguidade o homem era valorizado por posses, qualidades e feitos heroicos, com exclusão de pobres, mulheres e escravos; na sociedade cristã, reconhece-se o homem como unidade de matéria e espírito, e o bem maior não é o Estado, mas o homem dentro da sociedade. A resposta de valorizar o homem por suas posses e feitos é a mais tentadora, porque descreve justamente o critério antigo que o cristianismo deixa para trás.` },

    { id: 61, categoria: 'media', enunciadoHtml: `Agostinho divide a existência entre a Cidade de Deus e a Cidade dos Homens. Qual descrição está correta?`, alternativasHtml: [
        `A Cidade de Deus é imperfeita e cheia de vícios humanos, enquanto a Cidade dos Homens é perfeita e imutável.`,
        `As duas são regidas apenas pela lei dos homens, mudando somente o grau de perfeição de cada uma.`,
        `A Cidade de Deus é perfeita e regida pela lei de Deus; a dos Homens é imperfeita, regida por lei falha.`,
        `A Cidade de Deus é governada pelo Estado e por seus magistrados, e a dos Homens, pela Igreja.`,
        `As duas são igualmente perfeitas, mas seguem leis diferentes conforme o povo que as habita.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Para Agostinho, a Cidade de Deus é perfeita e rege-se pela lei de Deus, ideal e imutável, e a Cidade dos Homens é imperfeita e rege-se pela lei dos homens, falha e sujeita a vícios. No choque entre as duas leis, prevalece a lei de Deus, um jusnaturalismo de caráter teológico. A resposta que atribui a imperfeição à Cidade de Deus é a mais tentadora, porque inverte os termos, e é fácil confundir quem é perfeito e quem é imperfeito.` },

    { id: 62, categoria: 'media', enunciadoHtml: `Que ligação se estabelece entre Agostinho e Platão?`, alternativasHtml: [
        `Agostinho rejeita Platão e adota o relativismo dos sofistas, para quem o homem é a medida de tudo.`,
        `Agostinho retoma de Platão a divisão da sociedade em sábios, guerreiros e artífices, cada um em sua função.`,
        `Agostinho toma de Platão a maiêutica, como método para ensinar as verdades da fé cristã aos fiéis.`,
        `Agostinho retoma o dualismo platônico: mundo real imperfeito e esboço de uma realidade ideal.`,
        `Agostinho aceita de Platão que a lei dos homens é perfeita e acabada, como a lei de Deus.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Agostinho retoma o dualismo platônico, dividindo a existência entre um mundo real imperfeito e o esboço de uma realidade ideal. Esse dualismo sustenta a distinção entre a lei de Deus, perfeita, e a lei dos homens, imperfeita. Wolkmer confirma que a filosofia de Platão e os ensinamentos de São Paulo foram decisivos para a doutrina agostiniana. A resposta da divisão em sábios, guerreiros e artífices é a mais tentadora, porque é uma ideia platônica muito conhecida, mas não é a herança de Platão em Agostinho.` },

    { id: 63, categoria: 'media', enunciadoHtml: `Segundo Wolkmer, em Agostinho a lei natural é:`, alternativasHtml: [
        `idêntica à lei eterna, sem qualquer distinção entre elas, como na Antiguidade clássica.`,
        `criação da autoridade civil, voltada exclusivamente para promover o bem comum da cidade.`,
        `um estatuto do direito canônico, restrito ao clero e aos assuntos internos da Igreja.`,
        `a natureza humana intacta, capaz de fundar o direito sem qualquer apoio na ordem divina.`,
        `a marca da lei eterna na consciência, participação da criatura racional na ordem de Deus.`
      ], correta: 4, fonteExtra: true, explicacaoHtml: `Wolkmer explica que a lei eterna expressa a razão divina e a vontade de Deus, e que a lei natural é a participação da criatura racional na ordem divina do universo, manifestada na consciência. A lei eterna é o fundamento das leis humanas. A resposta da identidade com a lei eterna é a mais tentadora, porque na Antiguidade a lex aeterna coincidia com a lex naturalis. Agostinho, segundo a fonte, dá à lex naturalis um novo significado: ela é uma marca da lei eterna, e não a mesma coisa. E a natureza humana, cingida pelo pecado, não basta como fundamento, o que afasta a resposta da natureza humana intacta.` },

    { id: 64, categoria: 'media', enunciadoHtml: `Em Tomás de Aquino, a obrigação de conservar a vida, gerar e educar os filhos e buscar a verdade pertence a qual lei?`, alternativasHtml: [
        `À lei natural, alcançável pelo homem pelo exercício da razão.`,
        `À lei eterna, que só Deus conhece em sua plenitude.`,
        `À lei dos homens, posta pela autoridade civil de cada cidade.`,
        `À lei divina, conhecida somente pela revelação nas Escrituras.`,
        `Ao costume local, que varia de uma cidade para outra.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Para Tomás, a lei natural é alcançável pelo homem pelo exercício da razão e obriga a conservar a vida, gerar e educar os filhos e buscar a verdade. A resposta da lei dos homens é a mais tentadora, porque o enunciado lembra deveres que também aparecem em leis positivas. Mas a lei dos homens é a lei posta, estabelecida pelo homem com base na natural. A lei divina é a lei revelada, que não se alcança pela razão (Wolkmer).` },

    { id: 65, categoria: 'media', enunciadoHtml: `Qual é o papel da lei eterna no esquema das três leis de Tomás de Aquino?`, alternativasHtml: [
        `É a lei posta pela autoridade humana, com base na razão e voltada ao bem comum.`,
        `É a lei de Deus, fundamento de todas as demais.`,
        `É a lei que vale apenas para os cristãos batizados, e não para os pagãos.`,
        `É a soma dos costumes de cada povo, reunidos ao longo do tempo.`,
        `É a lei que o homem alcança pela razão, sem nenhuma referência a Deus.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `A lei eterna é a lei de Deus, fundamento de todas as demais leis. A lei natural é a parte dela alcançável pela razão humana, e a lei dos homens é a lei posta com base na natural. A resposta da lei alcançada pela razão, sem referência a Deus, é a mais tentadora, porque descreve algo que parece a lei natural, alcançável pela razão. Mas, mesmo a lei natural, em Tomás, é participação na lei eterna, e portanto não prescinde de Deus.` },

    { id: 66, categoria: 'media', enunciadoHtml: `A lei dos homens em Tomás de Aquino é:`, alternativasHtml: [
        `a lei de Deus, imutável, que serve de fundamento de todas as demais leis existentes.`,
        `a lei que só se justifica, em cada caso, pelos fins últimos ditados pela Igreja.`,
        `a lei posta, positiva, feita pelo homem sobre a lei natural, para a utilidade comum.`,
        `a lei que dispensa a razão e nasce apenas da vontade arbitrária de quem governa.`,
        `a lei revelada nas Escrituras, dada por Deus para corrigir os erros da razão humana.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A lei dos homens é a lei posta, positiva, estabelecida pelo homem com base na lei natural e voltada à utilidade comum. A resposta da vontade arbitrária de quem governa é a mais tentadora, porque muitos associam lei positiva a mero decreto. Em Tomás, porém, a lei é obra da razão, e não do capricho. Sobre o que acontece quando a lei humana entra em conflito com a natural, a bibliografia traz leituras diferentes: Wolkmer registra que a lei que se afasta da natural "não será lei, senão a corrupção da lei", e o Manual de Humanística traz outra leitura do conflito. A pergunta fica na hierarquia clássica: a lei humana se apoia na natural.` },

    { id: 67, categoria: 'media', enunciadoHtml: `Segundo Wolkmer, qual é a marca da lei divina em Tomás de Aquino?`, alternativasHtml: [
        `Ser descoberta pela razão natural e ser comum a cristãos e a pagãos, sem revelação.`,
        `Derivar da lei humana e servir para corrigi-la quando ela se mostra injusta ou falha.`,
        `Ser autônoma, dispensando qualquer relação com a lei eterna ou com a razão humana.`,
        `Vir das Escrituras, por revelação, para sanar as imperfeições da lei dos homens.`,
        `Regular apenas o comércio e a convivência civil, sem interferir em outros assuntos.`
      ], correta: 3, fonteExtra: true, explicacaoHtml: `Wolkmer registra que a lei divina não é descoberta da razão, mas revelação proveniente das Sagradas Escrituras, destinada a sanar as imperfeições da lei dos homens e dar direção à vida humana; está mais próxima da lei eterna do que a lei natural. A resposta da descoberta pela razão natural é a mais tentadora, porque descreve a lei natural, que é produzida pela razão e comum a todos.` },

    { id: 68, categoria: 'media', enunciadoHtml: `O que se diz sobre a relação de Tomás de Aquino com as justiças comutativa e distributiva?`, alternativasHtml: [
        `Rejeita-as como pagãs e propõe uma justiça exclusivamente divina, sem espaço para a razão.`,
        `Reduz as duas a uma só, a justiça distributiva, que passaria a reger todas as relações.`,
        `Troca os sentidos: a comutativa passa a repartir cargos e honras, e a distributiva, as trocas.`,
        `Mantém-nas sem qualquer ligação com a moral cristã, como conceitos estritamente pagãos.`,
        `Retoma a divisão aristotélica e a integra à moral cristã do amor ao próximo, pela caridade.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `Tomás retoma a divisão aristotélica da justiça particular, comutativa (trocas entre particulares, igualdade aritmética) e distributiva (honras, cargos e encargos, igualdade proporcional), e a integra à moral cristã do amor ao próximo, sob a virtude da caridade. É a cristianização da justiça clássica. A resposta que rejeita Aristóteles como pagão é a mais tentadora, porque a ideia de fé sobre razão sugere ruptura, mas a síntese de Tomás é justamente a de incorporar Aristóteles.` },

    { id: 69, categoria: 'media', enunciadoHtml: `Qual afirmação sobre razão e fé em Tomás de Aquino está correta?`, alternativasHtml: [
        `A filosofia e o intelecto estão a serviço da fé revelada.`,
        `A razão é incompatível com a fé, e a Escritura dispensa a filosofia.`,
        `A fé deve ser abandonada, para que só a razão alcance a verdade.`,
        `Razão e fé pertencem a esferas separadas, sem relação entre si.`,
        `A razão vale só para os pagãos, e a fé, só para os cristãos.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `O quadro de Tomás resume a ideia como hierarquia das leis e razão a serviço da fé: filosofia e intelecto trabalham a serviço da fé revelada. Wolkmer e o livro de apoio falam da grande síntese entre Aristóteles e o cristianismo. A resposta de razão e fé em esferas separadas é a mais tentadora, porque a separação entre razão e teologia existe na Idade Média, mas é a tese de Ockham, e não de Tomás.` },

    { id: 70, categoria: 'media', enunciadoHtml: `Como Tomás de Aquino ordena os fins da sociedade?`, alternativasHtml: [
        `Os fins terrenos, cuidados pelo Estado, prevalecem sobre os fins transcendentes ditados pela Igreja.`,
        `Os fins últimos, de transcendência, cabem à Igreja; os terrenos, ao Estado, subordinado a ela.`,
        `Igreja e Estado são idênticos, sem qualquer distinção entre os fins que cada um persegue.`,
        `Só a Igreja tem fins legítimos, e o Estado não tem nenhum fim próprio a cumprir na terra.`,
        `Os fins terrenos cabem à Igreja, e os transcendentes, ao Estado, que a ela se sobrepõe.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Há uma hierarquia dos fins: os fins últimos e superiores, de busca da transcendência, são ditados pela Igreja; os fins terrenos, como subsistência e conforto, cabem ao Estado, que permanece subordinado à Igreja. A resposta dos fins terrenos cabendo à Igreja é a mais tentadora, porque inverte a ordem. Há leitura diferente na bibliografia: o Manual de Humanística registra que Tomás via separação entre Igreja e Estado, com subordinação apenas entre a ordem natural e a sobrenatural. A pergunta segue a formulação da disciplina.` },

    { id: 71, categoria: 'media', enunciadoHtml: `Duns Escoto se contrapõe ao organicismo medieval ao introduzir:`, alternativasHtml: [
        `a supremacia da ordem geral sobre a liberdade individual, como ideal de organização social.`,
        `a separação entre razão e teologia, como método para o conhecimento da verdade racional.`,
        `o primado do individual sobre o geral e da liberdade sobre a ordem estabelecida.`,
        `a hierarquia das leis em eterna, natural e dos homens, com a razão a serviço da fé revelada.`,
        `a distinção entre a cidade celeste e a cidade terrena, regidas por leis muito diferentes.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Para Escoto, o individual tem primado sobre o geral e a liberdade sobre a ordem, e Deus se revela a cada um em sua individualidade, de modo que cada pessoa constrói sua própria visão de mundo. A resposta da separação entre razão e teologia é a mais tentadora, porque também marca o rompimento com o modelo dominante, mas é a contribuição de Ockham. A da hierarquia das leis é de Tomás, e a da cidade celeste e da terrena, de Agostinho.` },

    { id: 72, categoria: 'media', enunciadoHtml: `Qual afirmação descreve corretamente Guilherme de Ockham?`, alternativasHtml: [
        `Defende que a verdade só se alcança pela fé, sem lugar algum para a razão humana no conhecimento.`,
        `Reafirma o universalismo da lex naturale como fundamento do direito de todos os povos e épocas.`,
        `Nega a existência do indivíduo em favor da ordem geral, tida como a única realidade existente.`,
        `Separa o racional do teológico, critica a lex naturale universal e fortalece o direito positivo.`,
        `Propõe unir a Igreja e o Estado sob um só governante, que exerceria ambos os poderes.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Ockham defende a separação entre o racional e o teológico, distingue a potência divina da multiplicidade dos indivíduos e critica o universalismo da lex naturale. Com isso fortalece o direito positivo e a noção de direito subjetivo, os direitos que o indivíduo possui por lhe terem sido conferidos. A resposta do universalismo da lex naturale é a mais tentadora, porque a lex naturale é tema central da Idade Média, mas Ockham a critica. Ele e Escoto preparam a passagem do organicismo ao indivíduo.` },

    { id: 73, tipo: 'verdadeiro-ou-falso', categoria: 'media', enunciadoHtml: `Na Idade Média predomina o individualismo, e o indivíduo é visto sobretudo como um sujeito isolado da coletividade.`, correta: false, fonteExtra: false, explicacaoHtml: `Predomina o organicismo cristão: o indivíduo é visto sobretudo como membro da coletividade. O primado do indivíduo aparece depois, com Duns Escoto e Ockham, como contraponto ao pensamento dominante.` },

    { id: 74, tipo: 'verdadeiro-ou-falso', categoria: 'media', enunciadoHtml: `As principais obras de Agostinho são as Confissões e A Cidade de Deus.`, correta: true, fonteExtra: false, explicacaoHtml: `Wolkmer acrescenta que as Confissões narram a trajetória e a conversão de Agostinho, e que A Cidade de Deus, sua obra maior, foi escrita entre 412 e 427 para defender o cristianismo da acusação dos pagãos de ter causado a queda de Roma.` },

    { id: 75, tipo: 'verdadeiro-ou-falso', categoria: 'media', enunciadoHtml: `Para Agostinho, a salvação se alcança pelo caminho estritamente individual, sem necessidade da inserção no grupo dos fiéis.`, correta: false, fonteExtra: false, explicacaoHtml: `Para Agostinho, a inserção do indivíduo no grupo é essencial: só na coletividade dos fiéis, a Igreja, se encontra o caminho da salvação.` },

    { id: 76, tipo: 'verdadeiro-ou-falso', categoria: 'media', enunciadoHtml: `Segundo Wolkmer, em Tomás de Aquino a razão tem primazia sobre a vontade na definição da lei, o que marca o intelectualismo aristotélico sobre o voluntarismo agostiniano.`, correta: true, fonteExtra: true, explicacaoHtml: `Wolkmer observa que, para o autor da Suma Teológica, a razão adquire primazia sobre a vontade: o conceito de lei se formula no intelecto, e a lei é algo pertinente à razão. Definir a lei por uma vontade sem razão levaria mais à injustiça do que ao Direito.` },

    { id: 77, tipo: 'verdadeiro-ou-falso', categoria: 'media', enunciadoHtml: `Segundo Wolkmer, para Tomás de Aquino a lei natural, produzida pela razão, vale só para os cristãos e é inacessível aos pagãos.`, correta: false, fonteExtra: true, explicacaoHtml: `Wolkmer diz que a lei natural é produzida pela razão e é comum a todos, cristãos e pagãos. Quem depende da revelação é a lei divina, que vem das Escrituras.` },

    { id: 78, tipo: 'verdadeiro-ou-falso', categoria: 'media', enunciadoHtml: `Ockham critica o universalismo da lex naturale e fortalece o direito positivo e a noção de direito subjetivo.`, correta: true, fonteExtra: false, explicacaoHtml: `Ockham distingue a potência divina da multiplicidade dos indivíduos, critica o universalismo da lex naturale e, com isso, fortalece o direito positivo e a noção de direito subjetivo: os direitos que o indivíduo possui por lhe terem sido conferidos.` },

    { id: 79, tipo: 'verdadeiro-ou-falso', categoria: 'media', enunciadoHtml: `Duns Escoto defende o organicismo medieval, com o primado da ordem geral sobre a liberdade do indivíduo.`, correta: false, fonteExtra: false, explicacaoHtml: `Escoto se contrapõe ao organicismo dominante: para ele, o individual tem primado sobre o geral, e a liberdade sobre a ordem.` },

    { id: 80, tipo: 'verdadeiro-ou-falso', categoria: 'media', enunciadoHtml: `Na Suma Teológica, Tomás de Aquino distingue a lei eterna, a lei natural e a lei dos homens, e a lei natural é alcançável pelo homem pelo exercício da razão.`, correta: true, fonteExtra: false, explicacaoHtml: `É a hierarquia das leis em Tomás: a lei eterna é a de Deus e fundamenta as demais; a lei natural é alcançável pela razão; a lei dos homens é a lei posta, com base na natural e voltada à utilidade comum. Wolkmer inclui ainda a lei divina, revelada nas Escrituras.` }
];
