import type { PerguntaQuiz } from '../../../../tipos';

/**
 * As dez questões da atividade de 02/09/2026 de Sociologia Jurídica,
 * com enunciado e alternativas exatamente como constam na atividade.
 * A atividade não traz gabarito: a alternativa marcada em cada uma é a
 * resposta do caderno de estudo, resolvida com base no material (slides
 * de 02/09, artigo "Da luta à ordem" e suas versões de estudo, artigo
 * sobre a relevância da sociologia para a ciência jurídica), e por isso
 * todas levam gabaritoDoCaderno: true. A explicação faz o papel da
 * justificativa curta que a atividade pede em cada questão.
 * Nenhuma delas cita dispositivo de lei.
 */
export const atividade: readonly PerguntaQuiz[] = [
    { id: 1, categoria: 'atividade', gabaritoDoCaderno: true, enunciadoHtml: `Durante um debate em sala de aula, um estudante afirma que as leis trabalhistas surgiram para proteger os trabalhadores da exploração econômica. Outro estudante argumenta que, historicamente, muitas leis foram construídas para preservar interesses econômicos dominantes. A partir da interpretação sociológica do direito proposta por <strong>Karl Marx</strong>, qual alternativa melhor explica essa situação?`, alternativasHtml: [
        `O direito é neutro e atua exclusivamente para equilibrar as relações sociais.`,
        `O direito é um instrumento da superestrutura que tende a reproduzir as relações de poder existentes na estrutura econômica.`,
        `O direito surge apenas para garantir a ordem moral da sociedade.`,
        `O direito é resultado da racionalização burocrática do Estado moderno.`,
        `O direito se explica exclusivamente pela cultura jurídica de cada sociedade.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Para Marx, a sociedade se divide em infraestrutura (forças produtivas e relações sociais de produção) e superestrutura (relações ideológicas, políticas e jurídicas). As instituições jurídicas pertencem à superestrutura e seu caráter é determinado pela estrutura econômica existente. Por isso o direito tende a organizar e reproduzir o modo de produção dominante, e o segundo estudante, ao falar em leis que preservam interesses econômicos dominantes, descreve exatamente essa leitura. A resposta do direito neutro que só equilibra é a mais tentadora para quem pensa no discurso da neutralidade, mas o direito neutro que apenas equilibra é justamente o que a crítica marxista procura desmontar. A resposta da ordem moral lembra Durkheim (ordem moral e consciência coletiva), a resposta da racionalização burocrática lembra Weber (racionalização burocrática) e a resposta da cultura jurídica de cada sociedade isola a cultura, quando Marx parte das condições materiais de vida.` },

    { id: 2, categoria: 'atividade', gabaritoDoCaderno: true, enunciadoHtml: `Em uma sociedade moderna, o sistema jurídico estabelece punições para quem descumpre normas coletivas. Essas punições são vistas como formas de reafirmar valores compartilhados pela sociedade. Essa interpretação se aproxima principalmente da concepção sociológica de:`, alternativasHtml: [
        `Marx, que associa o direito à luta de classes.`,
        `Weber, que relaciona o direito à racionalização burocrática.`,
        `Durkheim, que entende o direito como expressão da solidariedade social.`,
        `Ehrlich, que analisa o direito vivo das práticas sociais.`,
        `Kelsen, que defende a pureza normativa do direito.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Para Durkheim o direito é expressão dos fatos sociais e indicador externo da solidariedade, e a sanção tem a função de proteger a coesão social e de satisfazer a consciência comum ferida pelo crime. Punir, nesse quadro, é reafirmar valores compartilhados, que é o que o enunciado descreve. A resposta de Marx é a mais tentadora: em Marx a punição também aparece, mas lida como proteção de bens da classe dominante, não como reafirmação de valores comuns a toda a sociedade. A resposta de Weber trata de dominação legal e burocracia, a resposta de Ehrlich olha a prática social vivida (o direito vivo) e não a função da pena, e a resposta de Kelsen, ao falar em pureza normativa, trata do direito visto como norma, e não da função social que a punição cumpre.` },

    { id: 3, categoria: 'atividade', gabaritoDoCaderno: true, enunciadoHtml: `Um pesquisador analisa como decisões judiciais podem refletir valores e interesses presentes em diferentes grupos sociais. Para isso, ele busca compreender os significados atribuídos às ações dos indivíduos envolvidos no processo jurídico. Esse tipo de análise está mais próximo do método sociológico defendido por:`, alternativasHtml: [
        `Durkheim, baseado na análise estatística dos fatos sociais.`,
        `Marx, baseado exclusivamente na economia política.`,
        `Weber, que busca compreender o sentido das ações sociais.`,
        `Comte, que propõe uma sociologia positivista da ordem social.`,
        `Parsons, que analisa o sistema social funcionalmente.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A pista do enunciado é "compreender os significados atribuídos às ações dos indivíduos". Essa é a sociologia compreensiva de Weber: ação social é uma conduta dotada de significado subjetivo e orientada em relação a outros, e compreender os sentidos atribuídos às normas ajuda o jurista a interpretar o funcionamento efetivo do ordenamento. A resposta de Durkheim é a mais tentadora porque Durkheim é o autor do método sociológico com observação empírica e porque o material registra que Marx e Durkheim apontavam fatos, números e estatísticas em defesa de suas teorias, mas esse método trata os fatos sociais como coisas, observados de fora, e não busca o sentido subjetivo. A resposta de Marx reduz tudo à economia, o que Weber justamente rejeita (o monismo causal). A resposta de Comte e a resposta de Parsons descrevem o positivismo e o funcionalismo, que olham a ordem e o sistema, não o sentido que cada agente dá à sua ação.` },

    { id: 4, categoria: 'atividade', gabaritoDoCaderno: true, enunciadoHtml: `O direito penal, em muitos contextos históricos, foi utilizado para punir comportamentos considerados ameaças à ordem social. Ao mesmo tempo, pode refletir valores morais compartilhados por uma coletividade. De acordo com a perspectiva sociológica de <strong>Durkheim</strong>, qual é a principal função da punição?`, alternativasHtml: [
        `Proteger interesses econômicos dominantes.`,
        `Garantir o funcionamento do mercado capitalista.`,
        `Reforçar a consciência coletiva e preservar a coesão social.`,
        `Aumentar a eficiência burocrática do Estado.`,
        `Promover exclusivamente a reeducação do infrator.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Para Durkheim o crime é um fato social normal e a sanção cumpre a função de proteger a coesão social e a consciência coletiva, satisfazendo a consciência comum ferida pelo crime. O material destaca que a função da sanção não é simplesmente corrigir ou intimidar o infrator. Por isso a resposta da reeducação exclusiva do infrator, a mais tentadora para quem associa pena à ressocialização, erra ao dizer "exclusivamente": a função principal está em proteger o vínculo coletivo. As respostas de proteger interesses econômicos dominantes e de garantir o funcionamento do mercado descrevem a leitura marxista (direito ligado à reprodução do capitalismo) e a resposta de aumentar a eficiência burocrática lembra a burocracia de Weber.` },

    { id: 5, categoria: 'atividade', gabaritoDoCaderno: true, enunciadoHtml: `Em um Estado moderno, o sistema jurídico funciona por meio de tribunais, normas escritas e procedimentos formais, garantindo previsibilidade nas decisões. Essa característica do direito corresponde ao conceito weberiano de:`, alternativasHtml: [
        `Consciência coletiva.`,
        `Dominação carismática.`,
        `Dominação tradicional.`,
        `Dominação racional-legal.`,
        `Controle ideológico.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Weber descreve três tipos de dominação legítima. A legal-racional (ou legal) se baseia na crença na validade das normas e na competência estabelecida por regras, e a burocracia é sua forma máxima: normas abstratas, competências, registros escritos e procedimentos previsíveis. Tribunais, normas escritas e procedimentos formais que dão previsibilidade são exatamente esse quadro. Entre as respostas erradas, as que trazem a dominação carismática e a tradicional são os outros dois tipos de Weber e por isso são as mais tentadoras: a carismática vem da crença nas qualidades extraordinárias de uma pessoa e a tradicional, da crença na legitimidade das tradições, nenhuma delas ligada a normas escritas. A consciência coletiva é conceito de Durkheim.` },

    { id: 6, categoria: 'atividade', gabaritoDoCaderno: true, enunciadoHtml: `A sociologia jurídica busca compreender o direito para além das normas escritas, analisando as relações sociais que influenciam sua criação e aplicação. Nesse sentido, é correto afirmar que a sociologia do direito:`, alternativasHtml: [
        `Estuda apenas o conteúdo das leis positivas.`,
        `Analisa o direito como fenômeno social ligado às relações de poder.`,
        `Investiga exclusivamente o funcionamento do Poder Judiciário.`,
        `Limita-se à interpretação dogmática das normas jurídicas.`,
        `Trata o direito como um sistema isolado da sociedade.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `A sociologia jurídica investiga como o direito emerge, se transforma e atua nas configurações históricas da sociedade, relacionando o fenômeno jurídico às estruturas econômicas, morais, políticas e sociais. Os três clássicos estudados tratam o direito como fenômeno social ligado à organização coletiva e às relações de poder, e não como fenômeno isolado. A resposta que a restringe ao Poder Judiciário é a mais tentadora, porque decisões judiciais são um objeto frequente, mas o material define o objeto como a relação entre direito e sociedade, o que permite examinar o sistema jurídico na sua totalidade e em relação ao seu contexto, e a palavra "exclusivamente" a torna falsa. A resposta que limita a disciplina às leis positivas e a resposta que a limita à interpretação dogmática descrevem o enfoque dogmático (do jurista que conhece e aplica a norma) e a resposta que trata o direito como sistema isolado da sociedade nega a tese central da disciplina.` },

    { id: 7, categoria: 'atividade', gabaritoDoCaderno: true, enunciadoHtml: `Durante uma aula de Sociologia Jurídica, o professor afirma que o direito pode atuar tanto como instrumento de manutenção da ordem social quanto como ferramenta de transformação social. Essa interpretação está de acordo com a ideia de que:`, alternativasHtml: [
        `O direito é independente das relações sociais.`,
        `O direito é apenas uma técnica jurídica neutra.`,
        `O direito está ligado às relações de poder presentes na sociedade.`,
        `O direito surge exclusivamente da vontade individual.`,
        `O direito é produto exclusivo da moral religiosa.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `O material conclui que o direito participa da estabilidade e da reprodução da ordem social, mas também pode assumir potencial de transformação, dependendo de como o poder é distribuído e legitimado. Ou seja, o duplo papel só faz sentido se o direito estiver ligado às relações de poder da sociedade. A resposta do direito como técnica neutra é a mais tentadora, porque a ideia de técnica neutra é a imagem que o senso comum faz do direito, mas o material mostra o direito como mais que um conjunto de normas frias: é também um fato, a realidade social em movimento. Se fosse independente das relações sociais, ou produto exclusivo da vontade individual, ou da moral religiosa, não poderia nem manter nem transformar a ordem social.` },

    { id: 8, categoria: 'atividade', gabaritoDoCaderno: true, enunciadoHtml: `A análise comparativa entre <strong>Marx, Durkheim e Weber</strong> demonstra que, apesar das diferenças teóricas, os três autores reconhecem o papel central do direito na organização da vida social. Qual alternativa sintetiza corretamente essa convergência?`, alternativasHtml: [
        `O direito é irrelevante para a organização da sociedade.`,
        `O direito é um fenômeno social ligado às relações de poder e organização coletiva.`,
        `O direito existe apenas para resolver conflitos individuais.`,
        `O direito é exclusivamente técnico e jurídico.`,
        `O direito depende apenas da vontade dos governantes.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Cada autor chega por um caminho: Marx liga o direito à estrutura econômica, às classes e à dominação, Durkheim o liga à solidariedade, à divisão do trabalho e à coesão, e Weber à racionalização, à burocracia e à dominação legal. O ponto de encontro, dizem as autoras do artigo, é que o direito não é sistema autônomo e neutro, mas fenômeno social vinculado às estruturas econômicas, morais e políticas, central na organização social e nas relações de poder. A resposta do direito só técnico é a mais tentadora porque parece descrever a visão de quem só olha a norma, mas afirmar que o direito é "exclusivamente técnico" é o oposto do que os três sustentam. A resposta da irrelevância do direito contradiz o enunciado (papel central) e a resposta de resolver só conflitos individuais e a resposta da vontade dos governantes reduzem o direito a algo que nenhum dos três defende.` },

    { id: 9, categoria: 'atividade', gabaritoDoCaderno: true, enunciadoHtml: `A sociologia jurídica contribui para a formação crítica do estudante de direito ao demonstrar que o fenômeno jurídico deve ser analisado em seu contexto histórico e social. Essa abordagem permite compreender que:`, alternativasHtml: [
        `O direito é totalmente neutro.`,
        `O direito é independente das estruturas sociais.`,
        `O direito é influenciado por fatores econômicos, políticos e culturais.`,
        `O direito depende exclusivamente da interpretação dos juízes.`,
        `O direito se limita ao texto da lei.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `O artigo reforça que o direito moderno está profundamente vinculado às estruturas econômicas, morais e políticas do seu tempo, e o texto sobre a relevância da sociologia lembra que o estudo da sociedade inclui aspectos culturais, econômicos, religiosos, políticos e sociais. É isso que a abordagem contextual permite ver. A resposta da interpretação dos juízes é a mais tentadora, porque juízes de fato decidem, mas o material observa que as decisões judiciais ganham legitimidade justamente quando acompanham as evoluções sociais do grupo a que se dirigem, o que mostra que a interpretação não é a única força em jogo, e "exclusivamente" a torna falsa. A resposta do direito neutro e a resposta do direito independente das estruturas sociais negam o vínculo com a sociedade e a resposta do texto da lei reduz o direito ao enfoque dogmático.` },

    { id: 10, categoria: 'atividade', gabaritoDoCaderno: true, enunciadoHtml: `Ao estudar o direito sob a perspectiva sociológica, percebe-se que ele pode funcionar como mecanismo de regulação social, contribuindo para a organização da vida coletiva. Nesse contexto, a sociologia jurídica tem como principal objetivo:`, alternativasHtml: [
        `Substituir o direito positivo.`,
        `Eliminar o papel do Estado na criação das leis.`,
        `Compreender como o direito se relaciona com a sociedade e suas transformações.`,
        `Reduzir o direito à interpretação literal das normas.`,
        `Estudar apenas a história das instituições jurídicas.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `O material define a sociologia jurídica como o estudo das inter-relações entre direito e sociedade, com a finalidade de estabelecer uma relação funcional entre a realidade social e as manifestações jurídicas, fornecendo subsídios para as transformações no tempo e no espaço. Compreender como o direito se relaciona com a sociedade e suas transformações é, portanto, seu objetivo. A resposta de substituir o direito positivo é a mais tentadora para quem ouve falar em crítica ao direito, mas a sociologia jurídica não substitui o direito positivo: ela o observa de fora e, ao contrário, oferece à ciência do direito os conhecimentos sociais de que ela precisa para cumprir suas funções. A resposta de eliminar o papel do Estado e a resposta da interpretação literal não pertencem ao objetivo de uma disciplina de observação e a resposta da história das instituições, ao dizer "apenas a história", esvazia o objeto, que é o fato social concreto na relação com a norma.` },
];
