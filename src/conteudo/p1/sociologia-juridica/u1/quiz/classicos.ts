import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas de categoria 'classicos' do quiz de Sociologia Jurídica, 1a
 * unidade: Marx (superestrutura, igualdade formal, dominação indireta),
 * Durkheim (fato social, solidariedade mecânica e orgânica, crime e
 * sanção) e Weber (ação social, poder e dominação, burocracia), a partir
 * do material de aula e do artigo "Da luta à ordem" com suas versões de
 * estudo. Nenhuma delas cita dispositivo de lei.
 */
export const classicos: readonly PerguntaQuiz[] = [
    { id: 32, categoria: 'classicos', enunciadoHtml: `Na análise de Marx o que compõe a <strong>infraestrutura</strong> de uma sociedade?`, alternativasHtml: [
        `As relações ideológicas, políticas e jurídicas.`,
        `As instituições jurídicas e o Estado.`,
        `As forças produtivas e as relações sociais de produção.`,
        `A consciência coletiva e os valores compartilhados.`,
        `A burocracia, as competências e os registros escritos.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Para Marx, a infraestrutura reúne as forças produtivas e as relações sociais de produção, isto é, a base econômica. A resposta das relações ideológicas, políticas e jurídicas é a mais tentadora porque descreve a superestrutura, o outro lado da mesma divisão: relações ideológicas, políticas e jurídicas. A resposta da consciência coletiva pertence a Durkheim e a resposta da burocracia e dos registros escritos, a Weber.` },

    { id: 33, categoria: 'classicos', enunciadoHtml: `Em que lugar da divisão entre infraestrutura e superestrutura Marx situa as instituições jurídicas?`, alternativasHtml: [
        `Na superestrutura, com caráter determinado pela estrutura econômica existente.`,
        `Na infraestrutura, ao lado das forças produtivas.`,
        `Numa esfera autônoma, independente das condições econômicas.`,
        `Na consciência coletiva, que antecede a economia.`,
        `Na burocracia do Estado, que organiza a economia por regras racionais.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `As instituições jurídicas integram a superestrutura e são determinadas pela estrutura econômica existente. Por isso, para compreender o direito, é preciso considerar as condições concretas de vida e as relações de produção. A resposta da infraestrutura com as forças produtivas é a mais tentadora, porque o direito parece "fazer parte" da produção, mas ele está do lado das relações ideológicas, políticas e jurídicas. A resposta da esfera autônoma nega a determinação econômica, e a resposta da consciência coletiva e a resposta da burocracia do Estado trazem ideias de Durkheim e de Weber.` },

    { id: 34, categoria: 'classicos', enunciadoHtml: `Na crítica marxista apresentada, por que importa o fato de a legislação ter forma abstrata e codificada?`, alternativasHtml: [
        `Porque prova que o direito é neutro e independente da economia.`,
        `Porque garante previsibilidade e estabilidade às decisões, o que é o ideal de toda ordem social.`,
        `Porque mostra que o direito nasce da consciência coletiva de cada sociedade.`,
        `Porque elimina as classes sociais, ao tratar todos pela mesma regra.`,
        `Porque pode produzir a aparência de autonomia do direito, encobrindo relações de poder e desigualdades.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `A forma abstrata e codificada da legislação pode produzir a aparência de autonomia do direito em relação à estrutura econômica, e a crítica marxista procura justamente revelar as relações de poder e as desigualdades encobertas pela forma jurídica. A resposta da neutralidade do direito é a mais tentadora, porque trata a aparência de autonomia como se fosse autonomia real, que é exatamente o que a crítica questiona. A resposta da previsibilidade e da estabilidade destaca a previsibilidade, ponto que aparece em Weber, e a resposta da eliminação das classes ignora que a igualdade jurídica convive com desigualdades vividas.` },

    { id: 35, categoria: 'classicos', enunciadoHtml: `Segundo a leitura marxista do artigo, qual é o papel da igualdade jurídica entre trabalhador e capitalista?`, alternativasHtml: [
        `Comprova que não há desigualdade entre trabalhador e capitalista.`,
        `Torna possível o contrato de trabalho, pois ambos aparecem como sujeitos livres e iguais, embora essa igualdade formal conviva com desigualdades concretas.`,
        `Reafirma a consciência coletiva, ao fazer todos obedecerem às mesmas normas.`,
        `Decorre da autoridade carismática do empregador, que concede direitos ao empregado.`,
        `Dispensa o contrato, já que ambos possuem as mesmas condições materiais.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `No capitalismo, trabalhadores e capitalistas aparecem juridicamente como sujeitos livres e iguais, e essa igualdade formal possibilita contratos, inclusive o de trabalho. O artigo problematiza justamente a distância entre a igualdade perante a lei e as desigualdades vividas concretamente. A resposta de que não há desigualdade é a mais tentadora, porque confunde igualdade formal com igualdade material. A resposta de dispensar o contrato cai no mesmo engano: ser juridicamente igual não significa ter as mesmas condições materiais.` },

    { id: 36, categoria: 'classicos', enunciadoHtml: `Na exposição sobre Marx, qual é a diferença entre a dominação nas sociedades pré-capitalistas e no capitalismo?`, alternativasHtml: [
        `No capitalismo a dominação é direta e pessoal; nas sociedades pré-capitalistas, indireta, pelo Estado e pelo direito.`,
        `Em ambos os casos a dominação é igual, pois não há classes sociais em nenhum deles.`,
        `Nas sociedades pré-capitalistas a dominação é racional-legal; no capitalismo, tradicional.`,
        `Nas sociedades pré-capitalistas a dominação era direta e pessoal; no capitalismo a burguesia domina indiretamente, pelo Estado e pelo direito.`,
        `O capitalismo elimina a dominação, porque a liberdade contratual substitui a coerção.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Nas sociedades escravista e feudal a dominação era direta e pessoal; no capitalismo a burguesia domina indiretamente, pelo Estado e pelo direito. A resposta da dominação direta e pessoal no capitalismo é a mais tentadora porque inverte os termos da comparação. A resposta da eliminação da dominação pela liberdade contratual confunde a aparência de liberdade contratual com o fim da dominação, quando o artigo diz que liberdade e igualdade jurídicas funcionam como artifício necessário à exploração mediada pelo contrato.` },

    { id: 37, categoria: 'classicos', enunciadoHtml: `O artigo reproduz do <em>Manifesto do Partido Comunista</em> a ideia de que o governo moderno é "um comitê que administra os negócios comuns de toda a classe burguesa". O que essa expressão indica sobre Estado e direito?`, alternativasHtml: [
        `Estado e direito aparecem vinculados às estruturas de reprodução do capitalismo, ligados à organização dos interesses da classe burguesa.`,
        `O Estado é um árbitro neutro entre as classes, e o direito é o instrumento dessa neutralidade.`,
        `O Estado é a expressão máxima da solidariedade orgânica, e o direito restitutivo é sua ferramenta.`,
        `O Estado é um corpo burocrático guiado apenas por normas abstratas, sem relação com classes.`,
        `O Estado deriva da autoridade carismática de um líder que administra os negócios de todos.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Na leitura de Marx, o direito burguês aparece como instrumento de organização e reprodução do modo de produção capitalista, e Estado e direito vinculam-se às estruturas de reprodução do capitalismo. A resposta do Estado como corpo burocrático sem relação com classes é a mais tentadora, porque a burocracia de normas abstratas é traço do Estado moderno em Weber, mas em Marx o ponto é a ligação com a classe dominante. A resposta do Estado como árbitro neutro afirma o contrário do que a expressão do Manifesto sugere.` },

    { id: 38, categoria: 'classicos', enunciadoHtml: `Na perspectiva marxista apresentada, qual é a relação entre a luta por direitos sociais e a exploração de classe?`, alternativasHtml: [
        `A conquista de direitos sociais elimina definitivamente a exploração de classe.`,
        `Direitos sociais são irrelevantes, pois só reforçam o modo de produção capitalista.`,
        `Lutar por direitos sociais pode reduzir desigualdades e exploração, embora a emancipação plena exigisse superar as formas de exploração de classe.`,
        `Direitos sociais são produtos naturais da divisão do trabalho, sem relação com conflito entre classes.`,
        `Direitos sociais só existem onde predomina a dominação tradicional.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Para a perspectiva marxista, o direito pode contribuir para manter privilégios e desigualdades estruturais, mas a luta por direitos sociais pode reduzir desigualdades e exploração, e a superação das formas de exploração de classe também é apontada. A resposta da eliminação definitiva da exploração é a mais tentadora, porque exagera o efeito dos direitos sociais: reduzir não é eliminar. A resposta da irrelevância dos direitos sociais vai ao extremo oposto e ignora que a conquista de direitos pode minorar desigualdades.` },

    { id: 39, categoria: 'classicos', enunciadoHtml: `Segundo a leitura de Marx adotada no artigo, apoiada em Pachukanis, em que contexto o direito, como fenômeno específico, só se verifica plenamente?`, alternativasHtml: [
        `Em qualquer sociedade dividida em classes, pois em cada modo de produção o direito tem a mesma forma.`,
        `Nas sociedades capitalistas, pois só na dominação capitalista surgem instituições que podem ser denominadas especificamente jurídicas.`,
        `Nas sociedades de solidariedade mecânica, onde a consciência coletiva é mais forte.`,
        `Nas sociedades feudais, onde a dominação pessoal exigia normas escritas.`,
        `Nas sociedades de dominação carismática, onde o líder cria o direito.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `O artigo registra que, em cada modo de produção, há classes dominante e dominada e a institucionalização de normas está ligada à estrutura de classes, mas que só na dominação capitalista surgem instituições especificamente jurídicas. A resposta de qualquer sociedade dividida em classes é a mais tentadora, porque mistura as duas coisas: normas ligadas às classes existem em todo modo de produção, mas o direito como fenômeno específico é característico do capitalismo. A resposta da solidariedade mecânica é conceito de Durkheim e a resposta da dominação carismática, de Weber, ambos alheios a esta tese.` },

    { id: 40, categoria: 'classicos', enunciadoHtml: `O artigo sugere que, na tradição marxista, o crime pode ser lido de que maneira?`, alternativasHtml: [
        `Como fato social normal, presente em qualquer sociedade.`,
        `Como reação passional da coletividade a uma violação das normas.`,
        `Como ação social sem sentido subjetivo para quem a pratica.`,
        `Como desvio de conduta produzido pela falta de burocracia.`,
        `Como artifício jurídico de proteção de bens da classe dominante.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `As autoras observam que o crime pode ser lido, nessa tradição, como artifício jurídico de proteção de bens da classe dominante. A resposta do fato social normal é a mais tentadora, porque "crime como fato social normal" é uma tese conhecida, mas é de Durkheim, não de Marx. A resposta da reação passional da coletividade também descreve Durkheim (a pena como reação passional na solidariedade mecânica).` },

    { id: 41, categoria: 'classicos', enunciadoHtml: `O que são "fatos sociais" para Durkheim?`, alternativasHtml: [
        `Condutas dotadas de significado subjetivo e orientadas em relação a outros.`,
        `Relações ideológicas, políticas e jurídicas determinadas pela economia.`,
        `Crenças na validade de normas estabelecidas por regras racionais.`,
        `Maneiras de agir suscetíveis de exercer coerção exterior e com existência própria em relação às manifestações individuais.`,
        `Probabilidades de impor a própria vontade mesmo diante de oposição.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Para Durkheim, fatos sociais são maneiras de agir suscetíveis de exercer coerção exterior e com existência própria em relação às manifestações individuais. Por isso devem ser estudados "como coisas", observando a sociedade em si e não só o discurso sobre ela. A resposta da conduta com significado subjetivo é a mais tentadora, porque é a definição de ação social de Weber, que parte do sentido subjetivo, algo que o fato social durkheimiano, exterior ao indivíduo, dispensa.` },

    { id: 42, categoria: 'classicos', enunciadoHtml: `Por que, para Durkheim, o direito é um bom ponto de partida para estudar uma sociedade?`, alternativasHtml: [
        `Porque, como expressão dos fatos sociais, é um fato externo e objetivo que indica o grau de integração e coesão da sociedade.`,
        `Porque revela em quais mãos está a propriedade dos meios de produção.`,
        `Porque expressa a vontade dos dominados sobre a dos dominadores.`,
        `Porque é um sistema de normas abstratas aplicadas ao caso concreto pela administração.`,
        `Porque permite compreender o sentido subjetivo atribuído por cada indivíduo às suas ações.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `O direito é expressão dos fatos sociais e funciona como indicador externo das formas de integração social, o que permite observar o grau de integração e coesão de uma sociedade. A resposta do sentido subjetivo de cada indivíduo é a mais tentadora, porque fala em compreender a ação, mas esse é o projeto da sociologia compreensiva de Weber. A resposta do sistema de normas abstratas aplicadas pela administração descreve a concepção weberiana de direito e a resposta da propriedade dos meios de produção, a preocupação marxista.` },

    { id: 43, categoria: 'classicos', enunciadoHtml: `Qual das associações abaixo está correta segundo a distinção de Durkheim entre os tipos de solidariedade?`, alternativasHtml: [
        `Solidariedade mecânica: divisão do trabalho e direito restitutivo.`,
        `Solidariedade orgânica: consciência coletiva forte e direito repressivo.`,
        `Solidariedade mecânica: semelhança entre os indivíduos, forte consciência coletiva e predomínio do direito repressivo.`,
        `Solidariedade mecânica: direito civil e comercial, com sanção que restaura o estado anterior.`,
        `Solidariedade orgânica: semelhança entre os indivíduos e direito penal como forma central.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Na solidariedade mecânica há semelhança entre indivíduos e forte consciência coletiva, e predomina o direito repressivo. Na orgânica há diferenciação social e divisão do trabalho, com predomínio do direito restitutivo. A resposta da solidariedade mecânica é a mais tentadora, porque troca os pares: a divisão do trabalho e o direito restitutivo pertencem à solidariedade orgânica. As demais também misturam os dois conjuntos.` },

    { id: 44, categoria: 'classicos', enunciadoHtml: `Em uma sociedade de solidariedade orgânica, qual é a natureza da sanção que predomina, segundo Durkheim?`, alternativasHtml: [
        `Repressiva: pune-se por punir, como reação passional da coletividade.`,
        `Restitutiva: busca restaurar relações ou situações jurídicas, como no direito civil e comercial.`,
        `Nenhuma, pois a divisão do trabalho torna a sanção desnecessária.`,
        `Carismática, porque depende das qualidades extraordinárias de quem julga.`,
        `Legal-racional, porque depende da competência funcional de quem sanciona.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Na solidariedade orgânica, resultante da divisão do trabalho e da diversidade funcional, predomina o direito restitutivo: a sanção não é expiatória, mas restauração do estado anterior. A resposta do direito repressivo é a mais tentadora, porque a sanção repressiva é a mais familiar, mas ela é típica da solidariedade mecânica. A resposta da dominação legal-racional emprega um conceito de Weber para uma pergunta que é de Durkheim.` },

    { id: 45, categoria: 'classicos', enunciadoHtml: `Segundo o artigo, o que ocorre com o direito à medida que a solidariedade mecânica se transforma em orgânica, na análise de Durkheim?`, alternativasHtml: [
        `O direito repressivo cresce, porque a divisão do trabalho exige mais punições.`,
        `O direito desaparece, porque a coesão passa a depender só da economia.`,
        `O direito torna-se carismático, pois passa a depender de líderes especializados.`,
        `O direito abandona o caráter predominantemente penal e assume a sanção restitutiva, pois a especialização inverte a proporção entre repressivo e cooperativo.`,
        `O direito passa a servir apenas aos interesses da classe dominante.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O artigo descreve a mudança de predominância do repressivo para o restitutivo com a especialização das funções sociais: a divisão do trabalho transforma a forma de integração social e a atuação do direito. A resposta do direito repressivo crescente é a mais tentadora, pois parece que mais diferenciação pediria mais punição, mas Durkheim prevê o contrário. A resposta do direito a serviço da classe dominante é uma leitura marxista, e a resposta do desaparecimento do direito ignora que o direito continua a expressar a integração social.` },

    { id: 46, categoria: 'classicos', enunciadoHtml: `Ao afirmar que o crime é um fato social <strong>normal</strong>, o que Durkheim quer dizer?`, alternativasHtml: [
        `Que é geral, coercitivo e exterior, presente em qualquer sociedade, e só se torna patológico quando deixa de apresentar o caráter regular esperado.`,
        `Que é desejável e por isso deve ser estimulado pelo Estado.`,
        `Que só existe nas sociedades capitalistas.`,
        `Que é sempre patológico e por isso deve ser eliminado.`,
        `Que resulta da vontade dos dominados contra a ordem jurídica.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Para Durkheim o crime é fato social normal porque está presente em qualquer sociedade. Se é normal, não há razão científica para querer eliminá-lo; se fosse patológico, abrir-se-iam argumentos para reforma. A resposta de que o crime é desejável é a mais tentadora, porque confunde "normal" com "bom": o termo descreve a regularidade do fenômeno, não um juízo de valor. A resposta de que o crime é sempre patológico nega justamente a tese central da distinção.` },

    { id: 47, categoria: 'classicos', enunciadoHtml: `O artigo registra uma observação crítica sobre a expectativa durkheimiana de declínio do direito penal nas sociedades modernas. Qual?`, alternativasHtml: [
        `Que o direito restitutivo nunca chegou a existir.`,
        `Que Durkheim ignorou a influência de fatores religiosos.`,
        `Que a burocracia aumentou a importância do direito penal.`,
        `Que o crime desapareceu nas sociedades de solidariedade orgânica.`,
        `Que a vontade punitiva nos países modernos não diminuiu, e o apetite punitivo e o desejo de repressão continuam fortes.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `As autoras notam que a vontade punitiva nos países modernos não diminuiu como o esquema durkheimiano sugeriria: observa-se apetite repressivo e desejo de repressão nas últimas décadas, o que tensiona a previsão de mudança de predominância do repressivo para o restitutivo. A resposta de que Durkheim ignorou fatores religiosos é a mais tentadora, porque a crítica a fatores religiosos aparece, mas em Weber, e não como reparo ao esquema de Durkheim. A resposta do desaparecimento do crime é falsa: o esquema durkheimiano trata o crime como normal, não como algo que desaparece.` },

    { id: 48, categoria: 'classicos', enunciadoHtml: `Sobre a existência de direito antes da sociedade moderna, em que Durkheim se distingue da leitura marxista adotada no artigo?`, alternativasHtml: [
        `Durkheim nega direito antes do capitalismo; a leitura marxista o reconhece em todos os modos de produção.`,
        `Ambos negam a existência de direito antes da sociedade moderna.`,
        `Durkheim reconhece direito anterior ao moderno e descreve a sucessão do repressivo ao restitutivo em vários povos; na leitura marxista adotada, o direito específico só se verifica plenamente no capitalismo.`,
        `Durkheim só admite direito em sociedades de dominação tradicional.`,
        `Durkheim explica o direito antigo pela luta de classes.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `O artigo aponta que Durkheim, ao contrário de Marx, reconhece direito anterior ao moderno e descreve a sucessão histórica do repressivo ao restitutivo em vários povos, ao passo que, na leitura marxista adotada, o direito como fenômeno específico só se verifica plenamente nas sociedades capitalistas. A resposta de que Durkheim nega direito antes do capitalismo é a mais tentadora, porque inverte os autores. A resposta de que Durkheim explica o direito antigo pela luta de classes atribui a Durkheim um vocabulário marxista.` },

    { id: 49, categoria: 'classicos', enunciadoHtml: `Que conjunto de temas caracteriza a análise de Weber sobre a sociedade moderna?`, alternativasHtml: [
        `Divisão do trabalho, solidariedade orgânica e fatos sociais.`,
        `Capitalismo industrial, racionalização e desencantamento do mundo.`,
        `Modos de produção, luta de classes e superestrutura.`,
        `Consciência coletiva, sanção e coesão social.`,
        `Infraestrutura, forças produtivas e ideologia.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Weber analisa a sociedade moderna marcada pelo capitalismo industrial, pela racionalização e pelo desencantamento do mundo, e considera fatores econômicos, políticos, religiosos e culturais. A resposta de modos de produção, luta de classes e superestrutura é a mais tentadora, porque Marx também trata do capitalismo, mas o vocabulário de modos de produção e luta de classes é dele. A resposta de divisão do trabalho, solidariedade orgânica e fatos sociais e a resposta de consciência coletiva, sanção e coesão trazem Durkheim, e a resposta de infraestrutura, forças produtivas e ideologia traz de novo Marx.` },

    { id: 50, categoria: 'classicos', enunciadoHtml: `Como o material situa Weber em relação a Marx?`, alternativasHtml: [
        `Aceita que a economia determina tudo e apenas troca as classes pela burocracia.`,
        `Nega qualquer influência da economia sobre a sociedade moderna.`,
        `Parte da consciência coletiva como ponto de partida do direito.`,
        `Dialoga com Marx no tema do capitalismo ocidental, mas privilegia o indivíduo e a ação social e rejeita o monismo causal que reduz tudo à economia.`,
        `Considera o direito irrelevante para a organização da sociedade.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Weber dialoga com Marx e compartilha o tema do capitalismo ocidental, mas desloca o centro da análise: a sociologia weberiana privilegia o indivíduo e a ação social dotada de sentido subjetivo. Ele não nega a influência econômica, mas rejeita o monismo causal, e fatores não econômicos, como valores religiosos, também moldam o desenvolvimento moderno. A resposta de que a economia não influencia a sociedade moderna é a mais tentadora, porque a frase "não reduz tudo à economia" pode ser lida como negação da economia, mas Weber apenas recusa que ela seja a única causa.` },

    { id: 51, categoria: 'classicos', enunciadoHtml: `Entre Marx, Durkheim e Weber, qual, segundo o artigo, é o que mais se dedicou diretamente ao estudo do direito?`, alternativasHtml: [
        `Weber, que em <em>Economia e sociedade</em> inaugura a sociologia compreensiva.`,
        `Marx, cuja obra central tem o direito como objeto principal.`,
        `Durkheim, pois o direito é o centro de <em>As regras do método sociológico</em>.`,
        `Os três igualmente, já que todos escreveram tratados de direito.`,
        `Nenhum deles, pois o direito só entrou na sociologia depois dos três.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `O artigo destaca Weber como o autor que mais se dedicou diretamente ao estudo do direito entre os três, e situa em <em>Economia e sociedade</em> a inauguração da sociologia compreensiva. A resposta de Marx é a mais tentadora, porque o direito é central na análise marxista, mas como parte da superestrutura, não como objeto principal de uma teoria própria. A resposta de Durkheim confunde o papel do direito em Durkheim, que o usa como indicador externo da solidariedade.` },

    { id: 52, categoria: 'classicos', enunciadoHtml: `Qual é a definição de <strong>poder</strong> em Weber?`, alternativasHtml: [
        `A situação em que uma vontade manifesta influencia as ações dos dominados, produzindo obediência.`,
        `A crença na validade dos estatutos e na competência funcional definida por regras.`,
        `A probabilidade de impor a própria vontade numa ação social, mesmo diante de oposição.`,
        `Uma maneira de agir com coerção exterior e existência própria em relação ao indivíduo.`,
        `Uma conduta dotada de significado subjetivo orientada em relação a outros.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Poder é a probabilidade de impor a própria vontade numa ação social, mesmo diante de oposição. A resposta da vontade manifesta que produz obediência é a mais tentadora, porque descreve a dominação, que é o passo seguinte: uma vontade manifesta influencia efetivamente as ações dos dominados, produzindo obediência. A resposta da maneira de agir com coerção exterior é o fato social de Durkheim e a resposta da conduta com significado subjetivo, a ação social do próprio Weber, que é outra coisa.` },

    { id: 53, categoria: 'classicos', enunciadoHtml: `Qual das alternativas associa corretamente cada tipo de dominação legítima de Weber ao seu fundamento?`, alternativasHtml: [
        `Legal: crença nas qualidades extraordinárias de uma pessoa; tradicional: crença na validade de estatutos; carismática: crença nas tradições.`,
        `Legal: crença na validade das normas e na competência estabelecida por regras; tradicional: crença na legitimidade das tradições; carismática: crença nas qualidades extraordinárias de uma pessoa.`,
        `Legal: consciência coletiva; tradicional: solidariedade mecânica; carismática: solidariedade orgânica.`,
        `Legal: burocracia; tradicional: economia; carismática: superestrutura.`,
        `Legal: crença nas tradições; tradicional: crença em estatutos racionais; carismática: crença na competência técnica.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Para Weber, a dominação legal-racional é a baseada na crença na validade das normas e na competência estabelecida por regras, a tradicional é a vinculada à crença na legitimidade das tradições e a carismática é a vinculada à crença nas qualidades extraordinárias de uma pessoa. A resposta que atribui à dominação legal a crença nas qualidades de uma pessoa é a mais tentadora, porque usa os três fundamentos corretos, mas embaralhados. A resposta da consciência coletiva e das solidariedades e a resposta da burocracia, da economia e da superestrutura trazem conceitos de Durkheim e de Marx.` },

    { id: 54, categoria: 'classicos', enunciadoHtml: `Por que a burocracia é apresentada, em Weber, como a forma máxima de dominação legal nas sociedades modernas?`, alternativasHtml: [
        `Porque depende do carisma pessoal do servidor público.`,
        `Porque expressa a solidariedade orgânica da sociedade.`,
        `Porque reproduz diretamente a estrutura de classes.`,
        `Porque substitui o direito pela vontade do dominante.`,
        `Porque organiza a dominação por normas abstratas, competências especializadas, registros escritos e procedimentos previsíveis, reduzindo o peso do parentesco e dos costumes tradicionais.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `A burocracia organiza a dominação legal por meio de normas, competências, registros e procedimentos previsíveis, e reduz a importância do parentesco e dos costumes tradicionais. O material observa que as pessoas obedecem a uma decisão administrativa porque creem na legitimidade do procedimento legal, não porque o servidor seja carismático. A resposta do carisma do servidor público é a mais tentadora, porque mistura o tipo legal com o carismático. A resposta da reprodução direta da estrutura de classes é leitura marxista.` },

    { id: 55, categoria: 'classicos', enunciadoHtml: `O que significa <strong>racionalizar</strong> no sentido weberiano?`, alternativasHtml: [
        `Tornar a sociedade mais solidária por meio da divisão do trabalho.`,
        `Ocultar relações de classe por trás da forma jurídica.`,
        `Atribuir sentido subjetivo a uma conduta social.`,
        `Conectar meios e fins: antecipar possibilidades para alcançar determinado objetivo.`,
        `Impor a própria vontade mesmo diante de oposição.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Racionalidade conecta meios e fins: racionalizar é antecipar possibilidades para alcançar determinado objetivo, o que o artigo chama de racionalidade instrumental. A resposta de atribuir sentido subjetivo é a mais tentadora, porque o sentido subjetivo também é conceito de Weber, mas pertence à ação social, não à racionalização. A resposta de tornar a sociedade mais solidária é de Durkheim, a resposta de ocultar relações de classe, de Marx, e a resposta de impor a própria vontade é a definição de poder.` },

    { id: 56, categoria: 'classicos', enunciadoHtml: `Que leitura o artigo faz do Poder Judiciário a partir de Weber?`, alternativasHtml: [
        `Pode ser lido como empresa de dominação, com os juízes como agentes privilegiados pelo monopólio de decidir.`,
        `É órgão de expressão da consciência coletiva, que dispensa qualquer competência formal.`,
        `É órgão neutro, que aplica as normas sem qualquer relação com a distribuição do poder.`,
        `É apenas um instrumento do modo de produção, sem lógica própria.`,
        `É instituição que só restaura situações anteriores, sem aspecto de dominação.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `O artigo afirma que o Poder Judiciário pode ser lido como empresa de dominação e que os juízes detêm o monopólio de decidir, sendo agentes privilegiados da dominação legal. A resposta do órgão neutro é a mais tentadora, porque a imagem do juiz neutro é comum, mas o material liga a ordem jurídica à distribuição do poder na comunidade. A resposta do mero instrumento do modo de produção reduz a leitura a Marx e a resposta da instituição que só restaura confunde a sanção restitutiva de Durkheim com a análise weberiana.` },

    { id: 57, categoria: 'classicos', enunciadoHtml: `O direito pode ser visto como norma coletiva, instrumento de poder, sistema racional-legal e prática social viva. Qual é a associação correta com os autores, na ordem?`, alternativasHtml: [
        `Marx, Durkheim, Weber e Ehrlich.`,
        `Durkheim, Marx, Weber e Ehrlich.`,
        `Durkheim, Weber, Marx e Ehrlich.`,
        `Durkheim, Marx, Ehrlich e Weber.`,
        `Weber, Marx, Durkheim e Kelsen.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Norma coletiva associa-se a Durkheim (o direito como fato social e expressão da solidariedade), instrumento de poder a Marx, sistema racional-legal a Weber e prática social viva a Ehrlich. A resposta de Marx, Durkheim, Weber e Ehrlich é a mais tentadora, porque troca apenas os dois primeiros autores, e a resposta de Weber, Marx, Durkheim e Kelsen traz Kelsen, que não se associa a essa lista.` },

    { id: 58, categoria: 'classicos', enunciadoHtml: `Um estudante quer observar como as pessoas realmente vivem as regras no dia a dia, para além do texto escrito da lei. Que autor do material se aproxima dessa preocupação?`, alternativasHtml: [
        `Kelsen, que defende a pureza normativa do direito.`,
        `Weber, que estuda o direito como sistema racional-legal e a burocracia.`,
        `Ehrlich, que analisa o direito vivo das práticas sociais.`,
        `Marx, que vê o direito como reflexo direto da economia, sem prática própria.`,
        `Durkheim, que vê o direito apenas como sanção estatal escrita.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Ehrlich é o autor do direito visto como prática social viva, que analisa o direito vivo das práticas sociais. A resposta de Weber é a mais tentadora, porque Weber também parte do comportamento social relacionado às normas, mas seu foco é o sistema racional-legal e a dominação legal. A resposta de Kelsen trata da pureza normativa, e não das práticas vividas.` },

    { id: 59, categoria: 'classicos', enunciadoHtml: `Qual contraste entre Ehrlich e Kelsen aparece no material da disciplina?`, alternativasHtml: [
        `Ehrlich defende a pureza normativa do direito; Kelsen analisa o direito vivo das práticas sociais.`,
        `Ambos explicam o direito pela estrutura econômica e pela luta de classes.`,
        `Ehrlich estuda a dominação legal e a burocracia; Kelsen, a solidariedade social.`,
        `Kelsen liga o direito à luta de classes; Ehrlich, à consciência coletiva.`,
        `Ehrlich analisa o direito vivo das práticas sociais; Kelsen defende a pureza normativa do direito.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `No material, Ehrlich é ligado ao direito vivo das práticas sociais (a prática social viva), e Kelsen, à pureza normativa do direito. A resposta que troca Ehrlich e Kelsen é a mais tentadora, porque troca os autores. As demais atribuem a eles ideias que o material associa a Marx, Weber e Durkheim.` },
];
