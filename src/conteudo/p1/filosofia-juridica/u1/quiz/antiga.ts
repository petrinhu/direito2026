import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas de categoria 'antiga' do quiz de Filosofia Jurídica, 1a unidade:
 * a Idade Antiga (contexto do mito ao logos, dramaturgia e Antígona,
 * sofistas, Sócrates, Platão, Aristóteles, estoicos, direito romano e
 * Cícero). Ids 21 a 46 são de múltipla escolha; 47 a 58, de verdadeiro ou
 * falso. Onde as fontes trazem leituras diferentes (por exemplo, o ius
 * gentium), a explicação adota a leitura das aulas e sinaliza a outra.
 */
export const antiga: readonly PerguntaQuiz[] = [
    { id: 21, categoria: 'antiga', enunciadoHtml: `Segundo a Aula 3 e o recorte de Wolkmer, em que manifestação da cultura helênica aparece a noção de "um Direito justo"?`, alternativasHtml: [
        `Nos códigos escritos elaborados pelos legisladores das cidades gregas.`,
        `Nos tratados de lógica de Aristóteles sobre o raciocínio dedutivo.`,
        `Na dramaturgia clássica de Sófocles, Ésquilo e Eurípides.`,
        `Nos julgamentos populares realizados na praça pública.`,
        `Nos hinos religiosos dedicados às divindades do Olimpo.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A aula situa a noção de um Direito justo na cultura helênica, especificamente na dramaturgia clássica de Sófocles, Ésquilo e Eurípides. A alternativa A é a mais tentadora, porque costumamos ligar o direito à lei escrita, mas a aula aponta o teatro como o lugar em que se pensa uma justiça anterior e superior ao decreto do governante. Em Antígona, essa justiça aparece em choque com a lei do Estado.` },

    { id: 22, categoria: 'antiga', enunciadoHtml: `Segundo o recorte de Wolkmer citado na Aula 3, o conflito dramatizado em Antígona opõe:`, alternativasHtml: [
        `a lei do Estado, expressão da força e do formalismo, e o direito familiar, símbolo do amor e da tradição.`,
        `duas leis positivas de cidades rivais, uma de Tebas e outra de Atenas, cada uma exigindo obediência.`,
        `o poder do rei e o poder dos sacerdotes, que disputam entre si a jurisdição sobre os tribunais da cidade.`,
        `a justiça retributiva, que pune o dano causado, e a justiça distributiva, que reparte honras entre os cidadãos.`,
        `a vontade do povo reunido em assembleia e o decreto isolado de um governante que ignora essa vontade.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Wolkmer, com apoio em Jaeger, descreve o drama como o choque entre a lei do Estado, expressão da força, da razão e do formalismo, e o direito familiar, símbolo do amor, da piedade e da tradição. A alternativa E é a mais tentadora, porque Creonte é o governante que decreta e Antígona o desafia. Mas ela não apela a uma assembleia popular: apela à tradição familiar e às leis divinas. A D mistura o vocabulário aristotélico, que é posterior e trata de outro assunto.` },

    { id: 23, categoria: 'antiga', enunciadoHtml: `Para justificar o sepultamento do irmão Polinice contra o decreto de Creonte, Antígona invoca:`, alternativasHtml: [
        `um costume recente, aprovado pela assembleia de Tebas depois da morte de Polinice.`,
        `um contrato firmado entre a sua família e a cidade, anterior ao decreto do rei Creonte.`,
        `a razão de Estado, que legitimaria toda e qualquer decisão tomada pelo rei de Tebas.`,
        `a autoridade do próprio Creonte, que teria lhe dado permissão para realizar o sepultamento.`,
        `as leis divinas, não escritas, tidas por eternas e superiores ao decreto humano.`
      ], correta: 4, fonteExtra: true, explicacaoHtml: `No livro de apoio (Marcondes e Struchiner), Antígona responde que não foi Zeus quem promulgou o decreto de Creonte e invoca normas divinas, não escritas, que vigoram desde os tempos mais remotos. A alternativa A é a mais tentadora, porque um costume parece próximo de uma norma não escrita, mas ele seria criação humana e recente, o oposto do que Antígona alega. Há leituras diferentes da peça: o livro registra que a maioria dos intérpretes vê Sófocles favorável à lei natural ou divina, mas que nem Creonte nem Antígona teriam razão absoluta, ambos vítimas da hybris.` },

    { id: 24, categoria: 'antiga', enunciadoHtml: `Quando os sofistas distinguem a <strong>physis</strong> do <strong>nomos</strong>, o que passam a questionar?`, alternativasHtml: [
        `Se os deuses existem de fato e se interferem na vida cotidiana das cidades.`,
        `Se a ordem humana das leis vem da natureza ou é produto de convenção.`,
        `Se a escrita alfabética deve substituir por completo a tradição oral das cidades.`,
        `Se as virtudes podem ser ensinadas pelo método do diálogo, como na maiêutica.`,
        `Se o mundo se explica por um único elemento material primordial, como a água.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Na Aula 3, os sofistas questionam a diferença entre a ordem natural (physis) e a ordem humana (nomos): as leis seriam convenção humana, e não expressão da natureza. A alternativa E é a mais tentadora, porque fala de natureza, mas é a preocupação do naturalismo cósmico dos pré-socráticos, que os sofistas substituem por problemas sociais, políticos e morais. A D é de Sócrates.` },

    { id: 25, categoria: 'antiga', enunciadoHtml: `Numa discussão, um aluno afirma: "não existe justiça em si; cada pessoa julga o que é justo a partir da sua circunstância". Essa posição está mais próxima de qual pensador das aulas?`, alternativasHtml: [
        `Sócrates, para quem a virtude já existe em cada um e cabe redescobri-la.`,
        `Platão, para quem a justiça é um arquétipo ideal e harmônico.`,
        `Aristóteles, para quem a justiça busca o justo meio entre os extremos.`,
        `Protágoras, para quem o homem é a medida de todas as coisas.`,
        `Cícero, para quem o direito se funda na natureza e não na opinião.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `A frase descreve o homo mensura de Protágoras: não há verdade ou justiça absoluta, e cada sujeito julga o mundo à sua maneira. A alternativa A é a mais tentadora, porque Sócrates também fala de algo que está "em cada um". Mas, para ele, as virtudes são universais e se redescobrem pelo diálogo, o que é bem diferente de relativismo. Platão, Aristóteles e Cícero pertencem ao campo idealista ou jusnaturalista, que busca verdades e justiça absolutas.` },

    { id: 26, categoria: 'antiga', enunciadoHtml: `Diante da tese de Trasímaco de que a justiça é a conveniência do mais forte, qual é a resposta de Platão nas aulas?`, alternativasHtml: [
        `A justiça é um arquétipo ideal, harmonia da alma e da pólis, e não o que os fortes decidem.`,
        `A justiça é apenas um pacto de não agressão feito entre os homens, para evitar o dano mútuo.`,
        `A justiça é medida por cada indivíduo, conforme as suas próprias circunstâncias e o seu ponto de vista.`,
        `A justiça consiste em beneficiar os amigos e prejudicar os inimigos, como pensa o senso comum grego.`,
        `A justiça é o meio-termo entre o excesso e a falta, em cada situação concreta que se apresente.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Platão usa os diálogos de Sócrates para desconstruir as definições utilitaristas dos sofistas: a justiça não é o que os homens fortes decidem, mas um arquétipo ideal, uma harmonia da alma e da pólis a ser buscada pela filosofia. O livro de apoio acrescenta que, no livro I de A República, Platão contesta Trasímaco e vê a justiça como natural, e não só convenção. A alternativa D é a mais tentadora, porque é uma tese que aparece na discussão da justiça, mas é a moral pragmática do senso comum grego, que Platão também rejeita. A B é de Epicuro, e a C, de Protágoras.` },

    { id: 27, categoria: 'antiga', enunciadoHtml: `Na aula de fixação, a <strong>maiêutica</strong> socrática é descrita como:`, alternativasHtml: [
        `um conjunto de leis escritas que Sócrates propôs à cidade de Atenas, para uso dos magistrados.`,
        `a tese de que o homem é a medida de todas as coisas, defendida por um sofista famoso.`,
        `a "parteira das ideias": busca da verdade e da virtude pelo diálogo e pelo questionamento.`,
        `o critério que separa os governos bons dos ruins conforme a finalidade ética do governante.`,
        `a divisão da cidade em sábios, guerreiros e artífices, cada qual com sua função própria.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A aula descreve a maiêutica como a "parteira das ideias": o filósofo, pelo diálogo e pelo questionamento contínuo, ajuda o interlocutor a redescobrir virtudes que já existem nele. A alternativa B é a mais tentadora, porque também é uma frase famosa de um filósofo do mesmo século, mas é o homo mensura de Protágoras. A D vem de Aristóteles, e a E, de Platão.` },

    { id: 28, categoria: 'antiga', enunciadoHtml: `Segundo as aulas, o que a recusa de Sócrates à fuga proposta por Críton revela sobre sua concepção de lei?`, alternativasHtml: [
        `Que a lei injusta perde a sua obrigatoriedade e, por isso, pode ser descumprida pelo cidadão.`,
        `Que a lei só tem valor enquanto os juízes que a aplicam forem reconhecidamente sábios e justos.`,
        `Que o cidadão só deve obedecer às leis que tenha aprovado pessoalmente, por voto ou por consenso.`,
        `Que a pólis existe para servir ao interesse particular de cada cidadão, acima do interesse comum.`,
        `Que as leis expressam o interesse coletivo, e respeitá-las serve ao bem comum, mesmo se injustas.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `Para Sócrates, justiça é cumprir a lei da pólis, porque as leis expressam os interesses da coletividade e respeitá-las é condição do bem comum. Por isso o bom cidadão obedece até às leis injustas, para não enfraquecer a autoridade da lei. No livro de apoio (Críton), ele prefere morrer como cidadão julgado segundo as leis a renegar seus princípios. Wolkmer observa que essa obediência conduziu Sócrates à morte. A alternativa A é a mais tentadora, porque a condenação foi mesmo injusta, mas a injustiça não o autorizou a fugir.` },

    { id: 29, categoria: 'antiga', enunciadoHtml: `Segundo a Aula 3, em que ponto Sócrates rompe com os sofistas?`, alternativasHtml: [
        `Ao negar que exista qualquer justiça além da convenção, como fazem os defensores do relativismo.`,
        `Ao discutir justiça, bem e virtude a partir do caráter justo da lei, vista como forma de justiça.`,
        `Ao defender que cada cidadão julgue as leis conforme as circunstâncias em que se encontra.`,
        `Ao sustentar que as leis nascem da força arbitrária dos governantes e servem aos seus interesses.`,
        `Ao trocar a vida na pólis por uma vida isolada e contemplativa, longe das cidades.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `A aula diz que Sócrates rompeu com os sofistas e discutiu justiça, bem e virtude a partir da ideia do caráter justo da lei, encarada como uma forma de justiça e como um imperativo. A alternativa D é a mais tentadora, porque é o que a aula atribui a sofistas como Trasímaco, Protágoras, Cálicles e Hípias: para eles as leis resultam da força arbitrária dos que controlam o poder. Sócrates faz o oposto. Além disso, seu pensamento é organicista: o indivíduo se realiza na pólis, e não isolado dela.` },

    { id: 30, categoria: 'antiga', enunciadoHtml: `Na justiça orgânica de Platão, o que ocorre se um artífice abandona sua função para governar a cidade?`, alternativasHtml: [
        `Há justiça distributiva, pois o mérito individual do artífice foi finalmente reconhecido pela cidade.`,
        `A lei escrita basta, por si só, para restaurar a harmonia entre as classes da cidade.`,
        `A cidade se aproxima do justo meio, equilibrando a falta e o excesso de cada classe.`,
        `O desvio da ordem gera injustiça, pois cada classe deve cumprir rigidamente o seu papel.`,
        `A pólis se torna mais livre, pois os direitos individuais passam a prevalecer sobre o Estado.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Para Platão, a justiça é cada cidadão cumprir rigidamente seu papel social: sábios pensam e governam, guerreiros lutam e defendem, artífices trabalham e produzem. O desvio dessa ordem gera injustiça. A alternativa A é a mais tentadora, porque a ideia de mérito soa justa, mas a distribuição por mérito é aristotélica e Platão não admite trocar de função por iniciativa própria. A E contradiz o Estado forte platônico, no qual os direitos individuais ficam subordinados ao social e ao político.` },

    { id: 31, categoria: 'antiga', enunciadoHtml: `Qual característica a aula atribui ao Estado defendido por Platão?`, alternativasHtml: [
        `Poder limitado pelos direitos individuais, que existiriam antes e acima do próprio Estado.`,
        `Divisão do trabalho flexível, com livre mobilidade entre as classes conforme a vontade de cada um.`,
        `Divisão social do trabalho rígida e fixa, e direitos individuais subordinados ao político.`,
        `Governo exercido por muitos, voltado aos interesses egoístas de cada grupo social existente.`,
        `Ausência de qualquer função de governo reservada aos sábios, que apenas produziriam bens.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A Aula 4 descreve o Estado platônico como forte: divisão social do trabalho rígida e fixa, poder do Estado ilimitado sobre a atividade humana e direitos individuais subordinados ao social e ao político. A alternativa A é a mais tentadora, porque muitos ligam a ideia de Estado de Direito a limites ao poder. Mas a aula só reconhece em As Leis uma noção primitiva de Estado de Direito, e o traço geral de Platão é o oposto do descrito em A.` },

    { id: 32, categoria: 'antiga', enunciadoHtml: `Segundo Wolkmer e o livro de apoio, o que distingue <em>A República</em> de <em>As Leis</em> quanto ao papel das leis?`, alternativasHtml: [
        `Na República governam os guardiães; nas Leis a legislação é reabilitada como instrumento ético.`,
        `Na República a lei escrita é exaltada como base da cidade, e nas Leis ela é tratada com desprezo.`,
        `Nas duas obras Platão nega qualquer valor à lei, valorizando apenas o costume dos antepassados.`,
        `Nas Leis Platão adota a tese de Trasímaco sobre a lei, como instrumento do mais forte.`,
        `A República trata da lei humana, e As Leis, da lei eterna, tal como a expõe o cristianismo.`
      ], correta: 0, fonteExtra: true, explicacaoHtml: `Wolkmer observa que em A República o valor das leis é ignorado, e que em As Leis, obra inacabada da velhice, Platão reabilita a função da legislação para a vida da cidade e a educação dos homens. O livro de Marcondes e Struchiner diz o mesmo de outro modo: nas Leis predominam as leis, ao contrário da República, em que governam os guardiães. A alternativa B é a mais tentadora, porque inverte a ordem correta das duas obras. A aula reforça que a lei escrita, em As Leis, é sinal de progresso.` },

    { id: 33, categoria: 'antiga', enunciadoHtml: `No diálogo <em>Protágoras</em>, o mito de Prometeu conta que Zeus mandou Hermes distribuir a todos os homens:`, alternativasHtml: [
        `a arte do fogo e das técnicas, reservada aos artesãos.`,
        `a sabedoria filosófica, dada apenas aos governantes.`,
        `a força necessária para vencer os inimigos da cidade.`,
        `o conhecimento das leis escritas, reservado aos magistrados.`,
        `o respeito mútuo (aidos) e o senso de justiça (diké).`
      ], correta: 4, fonteExtra: true, explicacaoHtml: `Segundo o livro de apoio, no mito Zeus manda Hermes distribuir a todos o respeito mútuo (aidos) e o senso de justiça (diké), de modo que a justiça não é privilégio de poucos. O texto representa a posição de Protágoras, e não a de Platão. A alternativa B é a mais tentadora, porque lembra a doutrina platônica de que os sábios governam, mas aqui o dom é dado a todos.` },

    { id: 34, categoria: 'antiga', enunciadoHtml: `Ao afirmar que o homem é um animal político (<strong>zóon politikón</strong>), Aristóteles fundamenta que a justiça:`, alternativasHtml: [
        `serve para isolar cada indivíduo, protegendo-o da dependência dos demais membros da cidade.`,
        `resolve a dependência mútua e a disputa por recursos escassos, como riquezas e cargos.`,
        `dispensa o Estado, porque a natureza regula sozinha, e de modo perfeito, as relações humanas.`,
        `deriva da vontade dos deuses, comunicada aos homens por oráculos e por sinais divinos.`,
        `é criação dos mais fortes, que a utilizam para manter o seu domínio sobre os mais fracos.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Na Aula 4, ninguém existe de forma independente: a justiça resolve o problema da dependência mútua, e a disputa por recursos escassos (riquezas, alimentos, cargos) gera conflitos que ela equilibra. Para Aristóteles, o fim do homem é a vida na pólis. A alternativa E é a mais tentadora, porque é a tese de Trasímaco sobre a justiça como conveniência do mais forte, que Aristóteles não adota.` },

    { id: 35, categoria: 'antiga', enunciadoHtml: `Em Aristóteles, a justiça ligada ao justo meio (<strong>mesótes</strong>) significa:`, alternativasHtml: [
        `obedecer sempre à opinião da maioria, evitando divergir do que pensam os demais cidadãos.`,
        `dar a todos partes idênticas, seja qual for a situação, o mérito ou a necessidade de cada um.`,
        `buscar um meio-termo entre duas doutrinas filosóficas rivais, aproveitando um pouco de cada uma.`,
        `evitar o excesso e a falta, buscando equilíbrio e, por isso, igualdade entre as partes.`,
        `aceitar a decisão do mais forte, para evitar conflitos e preservar a paz entre os cidadãos.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Para Aristóteles, toda virtude, inclusive a justiça, evita o excesso e a falta; a justiça, por buscar equilíbrio, relaciona-se à igualdade entre as partes. A alternativa B é a mais tentadora, porque confunde igualdade com identidade: na justiça distributiva a igualdade é proporcional, e cada um recebe conforme mérito ou necessidade. Só na justiça comutativa a igualdade é aritmética.` },

    { id: 36, categoria: 'antiga', enunciadoHtml: `Uma prefeitura divide vagas de creche dando prioridade às famílias de maior necessidade. Em termos aristotélicos, trata-se de:`, alternativasHtml: [
        `justiça comutativa, pela igualdade aritmética entre as partes envolvidas na relação.`,
        `justiça corretiva, que repara um dano causado por um particular a outro particular.`,
        `justiça distributiva: relação entre Estado e indivíduo, por igualdade proporcional.`,
        `equidade, que corrige a lei injusta quando aplicada ao caso concreto de cada pessoa.`,
        `justo natural, que independe de qualquer distribuição de bens entre os cidadãos.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A justiça distributiva rege a relação entre o Estado e o indivíduo, repartindo cargos, benefícios e honras por igualdade proporcional, conforme o mérito ou a necessidade. Vagas públicas de creche são um exemplo desse tipo. A alternativa A é a mais tentadora, porque a palavra "igualdade" aparece nas duas justiças, mas a comutativa opera entre particulares e por igualdade aritmética.` },

    { id: 37, categoria: 'antiga', enunciadoHtml: `Duas pessoas firmam um contrato de compra e venda, e o vendedor entrega mercadoria de valor menor que o pago. A correção desse desequilíbrio é, para Aristóteles, matéria de:`, alternativasHtml: [
        `justiça comutativa (corretiva): relação entre particulares, por igualdade aritmética.`,
        `justiça distributiva: repartição por mérito, por igualdade geométrica entre as partes.`,
        `justiça universal, porque todo contrato interessa a toda a pólis e ao bem comum.`,
        `justo natural, que independe de qualquer convenção entre as partes do contrato.`,
        `equidade, que sempre substitui a lei escrita quando há qualquer desequilíbrio.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A justiça comutativa, ou corretiva, rege as relações privadas, indivíduo contra indivíduo, como contratos e reparações, pela igualdade aritmética: o que se dá deve corresponder ao que se recebe. A alternativa B é a mais tentadora, porque a distributiva também lida com bens, mas os reparte entre Estado e cidadãos conforme o mérito, e não corrige trocas entre particulares.` },

    { id: 38, categoria: 'antiga', enunciadoHtml: `Na justiça política de Aristóteles, o <strong>justo legal</strong> é aquele que:`, alternativasHtml: [
        `tem base na natureza e não depende das opiniões humanas nem da vontade do legislador.`,
        `vale da mesma forma em todas as cidades, sem depender de qualquer legislador.`,
        `se confunde com a justiça distributiva, aplicada pelo Estado aos cidadãos.`,
        `corrige a lei geral e abstrata quando ela é aplicada ao caso concreto.`,
        `é convencionado pelo legislador e, uma vez posto, obriga os cidadãos da pólis.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `Na Aula 3, o justo legal é o que, ao ser convencionado pelo legislador, torna-se obrigatório na pólis. O justo natural, ao contrário, tem embasamento na natureza em si e não depende das opiniões humanas. A alternativa A é a mais tentadora, porque é justamente a definição do justo natural. A D descreve a equidade.` },

    { id: 39, categoria: 'antiga', enunciadoHtml: `Uma lei geral, aplicada literalmente a um caso muito particular, geraria injustiça evidente. Para Aristóteles, o que permite chegar à justiça naquele caso?`, alternativasHtml: [
        `Abolir a lei, pois toda lei escrita é injusta por ser geral e abstrata.`,
        `A equidade, que adapta a norma geral e abstrata ao caso concreto.`,
        `A justiça comutativa, pois todo caso concreto envolve apenas particulares.`,
        `A obediência estrita ao texto, pois a lei escrita é sempre justa em qualquer caso.`,
        `O costume não escrito, que sempre prevalece sobre a lei em todos os casos.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Como as leis escritas são gerais e abstratas, podem gerar injustiça no caso concreto. A equidade surge como adaptação da norma e é o corretivo para alcançar a justiça naquele caso específico. A alternativa D é a mais tentadora, porque lembra a obediência socrática às leis. Mas, para Aristóteles, a lei geral é deficiente justamente por sua universalidade, e a saída não é abolir a lei nem aplicá-la mecanicamente: é corrigi-la com equidade.` },

    { id: 40, categoria: 'antiga', enunciadoHtml: `Num regime governado por poucos que buscam apenas os próprios interesses, Aristóteles falaria de:`, alternativasHtml: [
        `aristocracia, pois poucos governam, qualquer que seja a finalidade do governo.`,
        `monarquia, pois haveria um só interesse dominante orientando as decisões da cidade.`,
        `república, pois haveria divisão de poderes entre os governantes e os governados.`,
        `oligarquia, forma corrompida em que poucos governam em causa própria.`,
        `democracia, pois os interesses envolvidos seriam os de toda a coletividade.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Em A Política, o critério não é o número de governantes, mas a finalidade ética. Poucos governando para interesses egoístas é oligarquia, ao lado da tirania e da democracia entre as formas corrompidas. A alternativa A é a mais tentadora, porque a aristocracia também é governo de poucos, mas para o bem comum. A diferença entre as duas está na finalidade.` },

    { id: 41, categoria: 'antiga', enunciadoHtml: `Segundo Wolkmer, o estoicismo, fundado por Zenão, contribuiu para a filosofia jurídica ao postular:`, alternativasHtml: [
        `um pacto de não agressão entre os homens, do qual a justiça deriva como convenção.`,
        `o prazer como meta plena da existência, e o direito natural como algo dispensável.`,
        `a verdade acessível apenas pela fé revelada, com a razão como serva dessa fé.`,
        `a tese de que as leis são fruto da força arbitrária de quem controla o poder.`,
        `uma lei natural universal, emanada da razão, que inspira as leis positivas.`
      ], correta: 4, fonteExtra: true, explicacaoHtml: `Wolkmer descreve o estoicismo como a defesa de uma vida segundo a natureza e de uma lei natural universal e suprema, emanada da razão e inspiradora das leis humanas positivas; a ideia passa ao pensamento romano e chega à teologia moral cristã. A alternativa B é a mais tentadora, porque também é uma escola helenística do mesmo período: é o epicurismo, que vê a justiça como convenção útil e não admite direito natural ao lado do positivo.` },

    { id: 42, categoria: 'antiga', enunciadoHtml: `Que traço as aulas destacam nos romanos em relação aos gregos?`, alternativasHtml: [
        `Uma especulação metafísica mais profunda do que a dos helenos, sobretudo sobre a natureza da justiça.`,
        `A recusa em aproveitar elementos culturais de outros povos, para preservar a pureza do direito.`,
        `A natureza prática: absorveram fontes de povos conquistados e criaram um direito sistematizado.`,
        `O desinteresse pelo direito, deixado quase todo aos costumes e à decisão dos magistrados.`,
        `A defesa do relativismo de Protágoras como base de todo o direito e de toda a justiça.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A Aula 3 diz que os romanos tinham natureza essencialmente prática, absorveram fontes de povos conquistados e as adaptaram, e criaram um direito sistematizado, funcional e amplo. A frase de Guido Fassò citada no slide resume: a ciência jurídica é criação romana. A alternativa A é a mais tentadora, porque inverte o contraste: a especulação e a metafísica é que marcam os gregos.` },

    { id: 43, categoria: 'antiga', enunciadoHtml: `Em <em>Sobre as leis</em>, segundo o recorte de Wolkmer nas aulas, para que foram inventadas as leis positivas?`, alternativasHtml: [
        `Para a segurança dos cidadãos, a preservação dos Estados e a felicidade da vida humana.`,
        `Para comunicar aos mortais, por meio de decretos, a vontade dos deuses sobre a justiça.`,
        `Para camuflar o domínio dos mais fortes sobre os mais fracos, disfarçando-o de justiça.`,
        `Para substituir a natureza como fundamento do direito, que passaria a ser só a lei escrita.`,
        `Para provar que o direito se baseia na opinião dos homens e na vontade da maioria.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Cícero reconhece as leis postas pelos homens e diz que foram inventadas para a segurança dos cidadãos, a preservação dos Estados e a tranquilidade e felicidade da vida humana. A alternativa E é a mais tentadora, porque a lei positiva é mesmo obra humana. Mas, para Cícero, o direito se baseia não nas opiniões dos homens, e sim na Natureza: a lei positiva cumpre uma função útil, sem ser o fundamento do direito.` },

    { id: 44, categoria: 'antiga', enunciadoHtml: `Qual alternativa associa corretamente o direito romano e a sua característica, segundo as aulas?`, alternativasHtml: [
        `Ius civile: fundado na razão universal, válido para todos os povos e sem limites de nenhuma espécie.`,
        `Ius civile: fundado na vontade do populus, com limites; ius naturale: fundado na razão universal.`,
        `Ius naturale: próprio de um povo determinado, como as leis positivas de Creonte em Antígona.`,
        `Ius naturale: fundado na vontade do populus e restrito aos limites da cidade de Roma.`,
        `Ius civile e ius naturale: equivalentes, pois ambos nascem da vontade do povo de Roma.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Na Aula 4, o direito natural (ius naturale) funda-se na razão universal (naturalis ratio) e vale para todos os povos, sem limites; o direito positivo (ius civile) funda-se na vontade do povo (populus) e é próprio de um povo determinado, com limites. As leis positivas de Creonte servem de exemplo do segundo. As alternativas A e D são as mais tentadoras, porque trocam as características entre os dois. Sobre o ius gentium, a bibliografia registra leituras diferentes: uma o aproxima do direito natural, outra o trata como direito comum entre os povos, de natureza positiva. Em nenhuma delas o ius civile se equipara ao ius naturale.` },

    { id: 45, categoria: 'antiga', enunciadoHtml: `Segundo Wolkmer, qual é a definição de justiça atribuída a Ulpiano no Digesto de Justiniano?`, alternativasHtml: [
        `A conveniência e o interesse do mais forte, que se impõe às leis da cidade.`,
        `O meio-termo entre o excesso e a falta, buscado pela virtude em cada ação.`,
        `A harmonia entre sábios, guerreiros e artífices, cada um em sua função.`,
        `A vontade constante e perpétua de dar a cada um o seu direito.`,
        `A participação da criatura racional na lei eterna, por meio da consciência.`
      ], correta: 3, fonteExtra: true, explicacaoHtml: `Wolkmer registra, no Digesto, a definição de Ulpiano: a justiça é a vontade constante e perpétua de dar a cada um o seu direito. O Digesto traz ainda os preceitos honeste vivere (viver honestamente), alterum non laedere (não lesar outrem) e suum cuique tribuere (dar a cada um o seu). A alternativa B é a mais tentadora, porque é a virtude aristotélica do justo meio, associada à justiça, mas não é a definição de Ulpiano. As outras alternativas pertencem a Trasímaco, a Platão e à tradição cristã sobre a lei natural.` },

    { id: 46, categoria: 'antiga', enunciadoHtml: `Segundo a Aula 2, o que marca a passagem do mito ao logos na Grécia?`, alternativasHtml: [
        `A substituição da razão pela vontade arbitrária dos deuses, tida como fonte única de explicação.`,
        `O abandono da vida urbana e da escrita alfabética, em favor da tradição oral dos poetas.`,
        `A proibição do debate público sobre as leis, reservado apenas aos sacerdotes da cidade.`,
        `A defesa de uma justiça imutável, revelada em livros sagrados e guardada pelos sacerdotes.`,
        `A explicação do mundo pela natureza e pela razão, com uma justiça dos homens discutida na pólis.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `A filosofia nasce na Grécia como ruptura com a explicação mítica: em vez da vontade arbitrária dos deuses, busca-se explicação na natureza e na razão, e surge a justiça dos homens, ordem racional discutida e pactuada na praça pública. Entre as condições históricas estão a vida urbana, a escrita alfabética, a invenção da política e o estímulo ao debate. A alternativa A é a mais tentadora, porque descreve justamente o mundo mítico que a filosofia deixa para trás.` },

    { id: 47, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `Na Retórica, Aristóteles cita Antígona como exemplo da distinção entre a lei particular de uma comunidade e a lei universal, a da natureza.`, correta: true, fonteExtra: true, explicacaoHtml: `O livro de apoio (Marcondes e Struchiner) registra que Aristóteles, na Retórica, recorre a Antígona para distinguir a lei particular, escrita ou não, de uma comunidade, da lei universal, que é a da natureza. Isso mostra como a tragédia de Sófocles já era lida, na própria Antiguidade, como um debate entre direito positivo e direito natural.` },

    { id: 48, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `Sócrates deixou extensa obra escrita, na qual expôs diretamente a maiêutica e a defesa das leis de Atenas.`, correta: false, fonteExtra: true, explicacaoHtml: `Segundo Wolkmer, Sócrates não deixou nada escrito. Suas ideias chegam por trabalhos de discípulos, como Xenofonte e Platão. O diálogo Críton, por exemplo, é de Platão, e é nele que Sócrates aparece dialogando com as próprias leis de Atenas.` },

    { id: 49, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `Para Sócrates, a virtude é um conteúdo que pode ser simplesmente transmitido do mestre ao aluno, como se transmite uma técnica.`, correta: false, fonteExtra: false, explicacaoHtml: `Nas aulas, as virtudes já existem em cada um e cabe redescobri-las pelo diálogo; a virtude não pode ser simplesmente ensinada. Por isso o método socrático é a maiêutica, a "parteira das ideias".` },

    { id: 50, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `Segundo o recorte de Wolkmer da Aula 3, para sofistas como Trasímaco, Protágoras, Cálicles e Hípias, a justiça legal pode servir para camuflar o domínio dos detentores do poder.`, correta: true, fonteExtra: false, explicacaoHtml: `O recorte diz que, para esses sofistas, as leis resultam da força arbitrária de quem exerce e controla o poder, e a justiça legal assume o sentido de camuflar o domínio dos detentores do poder, como convenção formalizada no interesse do mais forte. É o choque entre a justiça por natureza e a justiça por convenção. Vale lembrar que o grupo é heterogêneo, e que a fórmula da conveniência do mais forte é associada em especial a Trasímaco.` },

    { id: 51, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `Segundo Wolkmer, a concepção platônica identifica a justiça à sabedoria e à virtude da alma, e associa a injustiça à ignorância e ao vício.`, correta: true, fonteExtra: true, explicacaoHtml: `Wolkmer descreve assim a justiça em Platão: sabedoria e virtude da alma, com a injustiça ligada à ignorância e ao vício. Isso se conecta ao que as aulas destacam: como a justiça aperfeiçoa moralmente, ela jamais pode produzir o mal.` },

    { id: 52, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `Na justiça orgânica de Platão, cada cidadão deve exercer a função que escolher livremente, sem vínculo com a sua classe social.`, correta: false, fonteExtra: false, explicacaoHtml: `Na Aula 4, a justiça é cada cidadão cumprir rigidamente o seu papel social, e o desvio dessa ordem gera injustiça. A divisão do trabalho é rígida e fixa, e não fica ao gosto de cada um.` },

    { id: 53, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `Para Aristóteles, o justo natural é aquele convencionado pelo legislador, e o justo legal é aquele cuja base está na natureza e independe das opiniões humanas.`, correta: false, fonteExtra: false, explicacaoHtml: `A afirmação troca os conceitos. Na Aula 3, o justo natural tem base na natureza e não depende das opiniões humanas, enquanto o justo legal é convencionado pelo legislador e, por isso, obrigatório na pólis.` },

    { id: 54, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `Para Aristóteles, ninguém existe de forma independente, e a disputa por recursos escassos, como riquezas, alimentos e cargos, gera conflitos que a justiça equilibra.`, correta: true, fonteExtra: false, explicacaoHtml: `É o raciocínio da Aula 4 a partir do homem como animal político: a justiça resolve o problema da dependência mútua e equilibra os conflitos que nascem da escassez de recursos.` },

    { id: 55, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `Cícero, que incorporou o platonismo, o aristotelismo e o estoicismo, é considerado o primeiro "autêntico" filósofo do Direito.`, correta: true, fonteExtra: false, explicacaoHtml: `É o que diz a Aula 3, com apoio em Wolkmer: Cícero foi um autor eclético, que incorporou platonismo, aristotelismo e estoicismo e adaptou-os ao espírito prático dos romanos, o que levou a considerá-lo o primeiro autêntico filósofo do Direito.` },

    { id: 56, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `Nas aulas, o ius civile é apresentado como o direito fundado na razão universal, válido para todos os povos e sem limites.`, correta: false, fonteExtra: false, explicacaoHtml: `Essa é a descrição do direito natural (ius naturale), fundado na naturalis ratio. O ius civile é o direito positivo, fundado na vontade do povo (populus), próprio de um povo determinado e com limites.` },

    { id: 57, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `Segundo a Aula 2, a filosofia nasce na Grécia como continuação da explicação mítica, atribuindo a ordem das coisas à vontade arbitrária dos deuses.`, correta: false, fonteExtra: false, explicacaoHtml: `A filosofia nasce como ruptura com a explicação mítica e sobrenatural. Em vez da vontade arbitrária dos deuses, busca explicação na natureza e na razão, e surge a justiça dos homens, discutida e pactuada na pólis.` },

    { id: 58, tipo: 'verdadeiro-ou-falso', categoria: 'antiga', enunciadoHtml: `A frase de Guido Fassò citada na Aula 3, "a ciência jurídica é criação romana", liga-se à vocação prática dos romanos, que os levou a um direito sistematizado, funcional e amplo.`, correta: true, fonteExtra: false, explicacaoHtml: `Segundo a aula, com apoio em Wolkmer, a vocação prática dos romanos despertou neles um interesse pelo direito que os gregos não tiveram na mesma medida, e produziu um direito sistematizado, funcional e amplo. Os gregos ficaram mais na especulação sobre os fundamentos da justiça.` }
];
