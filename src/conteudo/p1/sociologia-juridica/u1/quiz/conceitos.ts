import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas de categoria 'conceitos' do quiz de Sociologia Jurídica, 1a
 * unidade: sociologia, sociologia jurídica e a distinção em relação ao
 * enfoque dogmático (artigo sobre a relevância da sociologia para a
 * ciência jurídica), e narrativa e discurso no processo judicial (artigo
 * "Polifonia e verdade nas narrativas processuais", Revista Sequência).
 * Nenhuma delas cita dispositivo de lei.
 */
export const conceitos: readonly PerguntaQuiz[] = [
    { id: 11, categoria: 'conceitos', enunciadoHtml: `Com apoio em Johnson, o artigo sobre a relevância da sociologia adota qual conceito operacional de <strong>sociologia</strong>?`, alternativasHtml: [
        `O estudo das normas jurídicas vigentes e de sua aplicação a casos concretos.`,
        `A ciência que se ocupa da interpretação e da aplicação da norma jurídica.`,
        `O estudo do modo de produção capitalista e da luta de classes.`,
        `O estudo da vida e do comportamento social, sobretudo em relação a sistemas sociais: como funcionam, como mudam e as consequências que produzem na vida dos indivíduos.`,
        `O estudo exclusivo das decisões dos tribunais e de seus efeitos.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O artigo adota a definição de Johnson: a sociologia é o estudo da vida e do comportamento social, sobretudo em relação a sistemas sociais, como eles funcionam, como mudam, as consequências que produzem e sua relação complexa com a vida dos indivíduos. A resposta que descreve a ciência jurídica é a mais tentadora, porque descreve a ciência jurídica, que o artigo distingue da sociologia: a ciência jurídica ocupa-se da interpretação e da aplicação da norma. A resposta do modo de produção capitalista é uma leitura marxista, apenas um recorte dentro da sociologia.` },

    { id: 12, categoria: 'conceitos', enunciadoHtml: `O artigo, citando Thorpe, associa a Marx, a Durkheim e a Weber, respectivamente, quais temas?`, alternativasHtml: [
        `Marx: o modelo econômico capitalista e a luta de classes; Durkheim: a divisão do trabalho diante da industrialização; Weber: a secularização e a racionalização da sociedade moderna.`,
        `Marx: a secularização; Durkheim: o modelo econômico capitalista; Weber: a divisão do trabalho.`,
        `Marx: a racionalização; Durkheim: a luta de classes; Weber: a divisão do trabalho.`,
        `Marx: a divisão do trabalho; Durkheim: a luta de classes; Weber: a secularização.`,
        `Os três defenderam o positivismo de Comte, cada um a seu modo.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Marx desenvolveu argumento teórico com base no crescimento do modelo econômico capitalista e na luta de classes sociais; Durkheim ateve-se à divisão do trabalho humano em face da industrialização; Weber firmou-se na defesa ideológica da secularização e na racionalização da sociedade moderna. A resposta que troca os temas dos autores é a mais tentadora, porque troca dois autores: um deslize comum entre Marx e Durkheim. A resposta do positivismo de Comte para os três é falsa: Comte é citado como fundador do positivismo, e o artigo trata os três sociólogos como autores com teses próprias.` },

    { id: 13, categoria: 'conceitos', enunciadoHtml: `Por que, segundo Cavalieri Filho, citado no artigo, a autonomia da Sociologia Jurídica é hoje reconhecida?`, alternativasHtml: [
        `Porque é ramo da dogmática jurídica e depende dela para existir.`,
        `Porque depende da filosofia, da qual é apenas uma parte.`,
        `Porque possui objeto próprio, método e leis.`,
        `Porque só interage com o direito, nunca com outras disciplinas sociais.`,
        `Porque adota exclusivamente o método positivista.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Para Cavalieri Filho, a autonomia da Sociologia Jurídica é hoje reconhecida porque ela possui objeto próprio, método e leis. O artigo acrescenta que ela pode interagir com outras disciplinas de natureza social, como a filosofia e a antropologia, e que o estudioso pode usar métodos diversos (cognitivo, dedutivo, positivista, dialético, estruturalista). A resposta do método exclusivamente positivista é a mais tentadora, porque o positivismo aparece entre os métodos, mas como um entre vários. A resposta de que só interage com o direito contradiz a possibilidade de interação com outras disciplinas.` },

    { id: 14, categoria: 'conceitos', enunciadoHtml: `Com apoio em Alland e Rials, como o artigo define a <strong>sociologia jurídica</strong>?`, alternativasHtml: [
        `O estudo dos princípios gerais do direito, como fonte de textos normativos.`,
        `O estudo da vida dos indivíduos isolados da sociedade.`,
        `O estudo apenas das decisões dos tribunais.`,
        `O estudo dos meios de produção e do Estado capitalista.`,
        `O estudo dos fenômenos sociais que mantêm algum elo com o fenômeno jurídico, ou das inter-relações entre direito e sociedade.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `Segundo o conceito operacional adotado, a sociologia jurídica diz respeito ao estudo dos fenômenos sociais que mantêm algum elo com o fenômeno jurídico ou mesmo ao estudo das inter-relações entre direito e sociedade: as manifestações do fenômeno jurídico e suas influências sobre a sociedade, e as atividades da sociedade e suas influências sobre o jurídico. A resposta dos princípios gerais do direito é a mais tentadora, porque descreve a dogmática jurídica, que o artigo distingue da sociologia. O próprio artigo nota que não há conceito consensual, o que explica por que trazem outras definições, como a de Sabadell.` },

    { id: 15, categoria: 'conceitos', enunciadoHtml: `Sabadell descreve a sociologia jurídica como "uma leitura externa do sistema jurídico". O que isso significa, segundo o artigo?`, alternativasHtml: [
        `Que ela estuda o funcionamento interno do sistema jurídico e interpreta suas normas.`,
        `Que ela examina a influência dos fatores sociais sobre o direito e as incidências do direito na sociedade, do ponto de vista de um observador desvinculado da dogmática jurídica.`,
        `Que ela emite juízos de valor sobre o direito em vigor.`,
        `Que ela aplica a norma ao caso concreto, de fora do processo.`,
        `Que ela substitui a dogmática jurídica na aplicação das normas.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Para Sabadell, a sociologia jurídica examina a influência dos fatores sociais sobre o direito e as incidências deste na sociedade, os elementos de interdependência entre o social e o jurídico, realizando uma leitura externa do sistema jurídico. Com apoio em Luhmann, o artigo lembra que o sociólogo do direito é observador das relações entre a sociedade e o direito, totalmente desvinculado da dogmática. A resposta do funcionamento interno do sistema jurídico é a mais tentadora, porque troca "externa" por "interna": o jurista sociólogo descreve o modo de atuação do direito na sociedade, e não o funcionamento do sistema por dentro.` },

    { id: 16, categoria: 'conceitos', enunciadoHtml: `Segundo Montoro, citado no artigo, qual é a tarefa do jurista no <strong>enfoque dogmático</strong>?`, alternativasHtml: [
        `Descrever a realidade social do direito sem se envolver com as normas.`,
        `Levantar dados estatísticos sobre as causas da criminalidade.`,
        `Estudar a relação funcional entre a realidade social e as manifestações jurídicas.`,
        `Conhecer, interpretar e aplicar a norma jurídica, com exatidão, aos casos concretos.`,
        `Estudar o direito como fato social, em interação com os demais fatores sociais.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Segundo Montoro, o enfoque dogmático é o do jurista propriamente dito, que se coloca diante da norma como o fiel ou o sacerdote diante do dogma; sua tarefa é conhecer, interpretar e aplicar a norma jurídica, com exatidão, aos casos concretos, e nesse sentido o jurista é o técnico da norma. A resposta de estudar o direito como fato social é a mais tentadora, porque é a abordagem sociológica, descrita pelo mesmo autor logo antes: a do sociólogo do direito, que estuda o fenômeno jurídico como fato social. As duas abordagens não se anulam, mas têm tarefas diferentes.` },

    { id: 17, categoria: 'conceitos', enunciadoHtml: `Segundo Cavalieri Filho, citado no artigo, qual é a tarefa do sociólogo diante da realidade social do direito?`, alternativasHtml: [
        `Relatar e registrar o fato sem se envolver com valores, ideologias ou normas, descrevendo os fatos.`,
        `Interpretar e aplicar a norma jurídica aos casos concretos.`,
        `Julgar a justiça das normas em vigor.`,
        `Elaborar normas que correspondam aos anseios da sociedade.`,
        `Defender a ideologia jurídica mais adequada a cada grupo social.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Para Cavalieri Filho, a sociologia se ocupa da realidade social do direito, limitando-se a relatar e registrar o fato sem se envolver com valores, ideologias ou normas: é tarefa do sociólogo descrever os fatos. A resposta de interpretar e aplicar a norma é a mais tentadora, porque descreve o trabalho do jurista dogmático, que o artigo distingue do sociológico. A resposta de julgar a justiça das normas e a resposta de defender a ideologia jurídica supõem valoração, o que o sociólogo, nessa descrição, evita.` },

    { id: 18, categoria: 'conceitos', enunciadoHtml: `Segundo Soares, citado no artigo, quando um estudioso indica que determinada lei carece de eficácia, como essa conclusão deve ser sustentada?`, alternativasHtml: [
        `Com um juízo de valor sobre a lei em vigor.`,
        `Com uma interpretação da lei feita pelo próprio estudioso.`,
        `Com trabalhos de pesquisa e métodos e técnicas que garantam a validade relativa e provisória da conclusão.`,
        `Com a aplicação da lei a um caso concreto, para testá-la.`,
        `Com uma afirmação definitiva e absoluta, para dar segurança jurídica.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Para Soares, o jurista-sociólogo não faz interpretação do direito nem emite juízos de valor sobre o direito em vigor: adota a perspectiva de observador, examinando a aplicação e os efeitos sociais do sistema jurídico. Por isso, ao concluir que uma lei carece de eficácia, precisa fundamentar-se em trabalhos de pesquisa com métodos e técnicas que garantam a validade relativa e provisória da conclusão. A resposta do juízo de valor sobre a lei é a mais tentadora, porque a crítica a uma lei parece natural, mas é justamente o juízo de valor que o observador evita. A resposta da afirmação definitiva e absoluta contradiz o caráter relativo e provisório.` },

    { id: 19, categoria: 'conceitos', enunciadoHtml: `Por que, segundo o artigo, o estudo da sociologia é relevante para o <strong>legislador</strong>?`, alternativasHtml: [
        `Porque dispensa o legislador de conhecer a comunidade, já que a norma se legitima sozinha.`,
        `Porque transforma o legislador em juiz dos casos concretos.`,
        `Porque só interessa a quem aplica a norma, e não a quem a elabora.`,
        `Porque garante que a norma nunca será revogada.`,
        `Porque lhe permite coletar as informações necessárias para elaborar normas que correspondam aos anseios da sociedade: sem sintonia entre a norma e a comunidade destinatária, a vigência perde plena legitimidade.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `Segundo o artigo, a valorização do estudo da sociologia é de fundamental relevância para o legislador, a quem cabe coletar informações próprias e necessárias para elaborar normas que correspondam aos anseios da sociedade. Ausente a sintonia entre a norma e as peculiaridades da comunidade destinatária, sua vigência é destituída de plena legitimidade. A resposta que dispensa o legislador de conhecer a comunidade é a mais tentadora, porque a norma é formalmente válida por ser lei, mas o artigo liga a legitimidade plena à sintonia com a comunidade. A resposta que só interessa a quem aplica a norma ignora que o artigo destaca o legislador e o aplicador.` },

    { id: 20, categoria: 'conceitos', enunciadoHtml: `Para o <strong>aplicador da norma</strong>, segundo o artigo, o que a formação humanística e o conhecimento da sociologia acrescentam?`, alternativasHtml: [
        `Dispensam o juiz de conhecer a lei.`,
        `As decisões judiciais e administrativas revestem-se de legitimidade e valorização quando o emissor sintoniza com as evoluções sociais do grupo destinatário da jurisdição.`,
        `Substituem a interpretação gramatical, histórica e sistemática.`,
        `Tornam a decisão imune a qualquer revisão.`,
        `Tornam irrelevante o texto da norma.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `O artigo afirma que a aplicação do conhecimento dos fatos sociais acrescenta qualidade à formação humanística do julgador, e que as decisões administrativas e judiciais revestem-se de valorização e legitimidade quando o emissor sintoniza com as evoluções sociais do grupo alvo da jurisdição. A resposta de substituir a interpretação gramatical, histórica e sistemática é a mais tentadora, porque o artigo diz que a orientação sociológica nem sempre é adequada, já que dúvidas podem ser esclarecidas por outros meios de interpretação (gramatical, histórica, sistemática), mas em nenhum momento diz que a sociologia os substitui.` },

    { id: 21, categoria: 'conceitos', enunciadoHtml: `No artigo sobre polifonia nas narrativas processuais, o que caracteriza o <strong>romance polifônico</strong>, segundo Bakhtin?`, alternativasHtml: [
        `Uma única voz se faz ouvir, e as demais são abafadas, como na <em>Divina comédia</em>.`,
        `Uma voz coletiva que representa os valores da comunidade, como o herói da epopeia.`,
        `Apenas a mistura de estilos e línguas, organizada artisticamente.`,
        `A multiplicidade de vozes e consciências independentes e imiscíveis, que coexistem em pé de igualdade com o discurso do narrador, as chamadas vozes equipolentes.`,
        `Uma voz só, ou várias vozes cantando em uníssono, como no canto gregoriano.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Para Bakhtin, o romance polifônico, cujo marco é a obra de Dostoiévski, tem uma multiplicidade de vozes contrastantes e oriundas de consciências independentes, imiscíveis e plenivalentes, que coexistem paritariamente com o discurso do narrador. A resposta da mistura de estilos e línguas é a mais tentadora, porque descreve o romance em geral, que é pluriestilístico, plurilíngue e plurivocal: a polifonia exige mais do que a pluralidade de estilos ou de vozes. A resposta da voz única à maneira da Divina comédia descreve o romance monofônico e a resposta da voz única ou em uníssono, como no canto gregoriano, o canto monofônico.` },

    { id: 22, categoria: 'conceitos', enunciadoHtml: `Para Bakhtin, segundo o artigo, como deve ser entendido o <strong>sentido</strong> de um discurso?`, alternativasHtml: [
        `Como efeito da interação verbal, que jamais é último: a interpretação é infinita, pois podem surgir novos sentidos em novos contextos.`,
        `Como algo fixado no momento da enunciação pelo sujeito que produziu o discurso.`,
        `Como algo contido no próprio discurso, independentemente dos interlocutores.`,
        `Como algo que pertence ao intérprete mais recente.`,
        `Como algo estabelecido de modo definitivo pela sentença, sob o rótulo da coisa julgada.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Para Bakhtin, o sentido não deve ser buscado nem no próprio discurso, nem no sujeito que o produziu, nem nos seus interlocutores ou intérpretes: ele é um efeito da interação verbal, que cria o acontecimento significativo da linguagem, e jamais é o último. A resposta do sentido fixado na enunciação é a mais tentadora, porque parece natural atribuir o sentido a quem fala, mas o artigo mostra que o discurso é um elo de uma cadeia infinita de outros discursos. A resposta do sentido definitivo pela coisa julgada mistura a ideia bakhtiniana com a autoridade da sentença, o que é justamente contraposto no artigo.` },

    { id: 23, categoria: 'conceitos', enunciadoHtml: `Segundo o artigo, a que garantia está vinculado o caráter polifônico da narrativa processual?`, alternativasHtml: [
        `À coisa julgada, que dá a palavra final ao juiz.`,
        `À verdade real, que unifica as versões das partes.`,
        `Ao contraditório e à isonomia, que fazem os discursos das partes coexistirem paritariamente, resguardadas a independência, a imiscibilidade e a plenivalência.`,
        `À autoridade do julgador, que harmoniza as vozes.`,
        `À mera multiplicidade de vozes (partes, testemunhas, peritos), que por si só basta para lhe dar caráter polifônico.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `O diálogo já presente em todo discurso é acentuado, no processo, pela garantia do contraditório, e o caráter polifônico da narrativa processual está vinculado ao princípio da isonomia: teoricamente, a igualdade garante que os discursos das partes coexistam paritariamente. A resposta da mera multiplicidade de vozes é a mais tentadora, porque o processo de fato reúne muitas vozes, mas o artigo diz expressamente que a multiplicidade de vozes não bastaria para imprimir-lhe o caráter polifônico. A resposta da coisa julgada descreve o momento em que, segundo o artigo, a polifonia se extingue com a sentença.` },

    { id: 24, categoria: 'conceitos', enunciadoHtml: `Que paradoxo os autores apontam na concepção de verdade de Taruffo?`, alternativasHtml: [
        `Nega que exista verdade e reduz o processo a mera ficção.`,
        `Defende que a verdade é sempre a da primeira versão apresentada ao juiz.`,
        `Concebe a decisão judicial como uma ficção assumida como verdade.`,
        `Afirma que o juiz nunca escolhe entre as narrativas das partes.`,
        `Concebe a verdade como correspondência com a realidade, mas admite a discricionariedade judicial: o juiz pode construir uma história diferente, com reconstrução autônoma dos fatos, justificada nas provas.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `Os autores observam que Taruffo reabilita uma concepção correspondencial de verdade (a realidade externa existe e é o critério da veracidade dos enunciados), mas admite que, quando nenhuma das narrativas das partes foi confirmada, o juiz constrói uma história diferente, fundada em reconstrução autônoma dos fatos, justificada pelas provas. Os autores tratam essa situação como paradoxal. A resposta da decisão como ficção assumida como verdade é a mais tentadora, porque é a ideia com a qual o artigo contrapõe a de Taruffo: a de que a decisão judicial constitui ficção assumida como verdade. A resposta que nega a verdade também erra o alvo: Taruffo é realista, e não cético quanto à verdade.` },

    { id: 25, categoria: 'conceitos', enunciadoHtml: `Segundo os autores, em torno de quais noções devem se fundar os critérios para conferir validade aos discursos nas narrativas processuais?`, alternativasHtml: [
        `Da verdade absoluta e da prova plena.`,
        `Da verossimilhança e da coerência narrativa, e não da verdade.`,
        `Da autoridade do juiz e da coisa julgada.`,
        `Da vontade das partes e do acordo entre elas.`,
        `Da oratória do advogado e da eloquência do juiz.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `O artigo conclui que seria no âmbito da verossimilhança e da coerência narrativa, e não da verdade, que se devem fundar os critérios para conferir validade aos discursos das narrativas processuais. A coerência narrativa não é critério de verdade, mas um constructo discursivo capaz de atribuir sentido, e a verdade judicial é uma verdade possível. A resposta da autoridade do juiz e da coisa julgada é a mais tentadora, porque a coisa julgada faz a decisão ser tida como verdadeira, mas o artigo a apresenta como efeito da sentença, e não como critério de validade do discurso. A resposta da verdade absoluta e da prova plena é o que o artigo relativiza.` },

    { id: 26, categoria: 'conceitos', enunciadoHtml: `Na conclusão do artigo, por que se fala em "estatuto ficcional do direito" na sentença, e qual é o problema apontado?`, alternativasHtml: [
        `Porque a sentença é falsa e pode ser refeita a qualquer momento, sem consequências.`,
        `Porque a ficção jurídica tem os mesmos efeitos que a ficção literária.`,
        `Porque a polifonia se mantém intacta depois da sentença.`,
        `Porque o juiz privilegia um dos relatos em detrimento dos outros e estabelece qual é "a verdade"; diferentemente da ficção literária, os efeitos da sentença tornam-se imutáveis e indiscutíveis sob a coisa julgada, e legitimam o exercício da violência estatal.`,
        `Porque a coisa julgada existe para permitir que a verdade seja rediscutida indefinidamente.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Os autores afirmam que, ao reconstruir narrativamente os fatos, o juiz privilegia um relato em detrimento de outro(s) e, com isso, estabelece qual é a verdade, sempre formal, construída, fragmentada. Diferentemente das ficções literárias, os efeitos da sentença, fundados na autoridade, tornam-se imutáveis e indiscutíveis sob o rótulo da coisa julgada e legitimam o exercício da violência estatal. Ao final, notam que a narrativa processual, embora formalmente polifônica, ainda se mostra materialmente monofônica. A resposta da ficção jurídica com os efeitos da literária é a mais tentadora, porque o termo "ficção" sugere equivalência com a literatura, mas o texto destaca justamente a diferença entre os efeitos. A resposta da rediscussão indefinida da verdade inverte o sentido da coisa julgada, que fecha a discussão.` },

    { id: 27, categoria: 'conceitos', enunciadoHtml: `O aparecimento da Sociologia está relacionado a quais três grandes processos históricos?`, alternativasHtml: [
        `A Revolução Industrial, a Revolução Francesa e o Iluminismo com o avanço da ciência.`,
        `A Revolução Industrial, a Revolução Russa e o Positivismo jurídico.`,
        `A Revolução Francesa, o Feudalismo e a Reforma Religiosa.`,
        `O Iluminismo, o Antigo Regime e o Absolutismo monárquico.`,
        `A Revolução Industrial, a Revolução Francesa e a consolidação das tradições religiosas.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Os três processos são a Revolução Industrial (trabalho industrial, urbanização, proletariado urbano e novos conflitos), a Revolução Francesa (crise do Antigo Regime, liberdade, igualdade e cidadania) e o Iluminismo com o avanço da ciência (razão, conhecimento científico e ideia de progresso). A resposta da Revolução Industrial, da Revolução Francesa e das tradições religiosas é a mais tentadora, porque acerta duas das três, mas a Sociologia surge rompendo com explicações baseadas apenas na religião, na tradição ou no senso comum. A resposta do Iluminismo, do Antigo Regime e do Absolutismo traz o Antigo Regime, que é o que a Revolução Francesa colocou em crise.` },

    { id: 28, categoria: 'conceitos', enunciadoHtml: `O que é <strong>coerção social</strong>, conceito desenvolvido por Durkheim?`, alternativasHtml: [
        `A força que o Estado usa exclusivamente por meio da violência física.`,
        `A vontade individual de cada pessoa impondo regras aos demais.`,
        `A força que a sociedade exerce sobre os indivíduos, por meio de maneiras de agir, pensar e sentir que existem antes de nascermos, são exteriores a nós e exercem pressão sobre nós.`,
        `A crença nas qualidades extraordinárias de um líder.`,
        `A oposição entre burguesia e proletariado na estrutura econômica.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Coerção social é a força que a sociedade exerce sobre os indivíduos, influenciando comportamentos, pensamentos e escolhas: seguimos regras não porque as inventamos, mas porque a sociedade espera que as sigamos (cumprir horários, respeitar leis, não furar fila). A resposta da violência física exclusiva é a mais tentadora, porque a lei realmente impõe comportamentos com sanção do Estado, mas a coerção social é mais ampla, e ela também aparece como punição, julgamento ou constrangimento. A resposta do carisma de um líder é o carisma de Weber e a resposta da oposição entre burguesia e proletariado, uma ideia de Marx.` },

    { id: 29, categoria: 'conceitos', enunciadoHtml: `Por que o direito pode ser considerado a forma mais organizada de coerção social?`, alternativasHtml: [
        `Porque cria, do nada, regras que a sociedade nunca conheceu.`,
        `Porque substitui a pressão social pela vontade individual de cada cidadão.`,
        `Porque só se aplica a quem concorda com suas normas.`,
        `Porque dispensa sanções, já que todos obedecem espontaneamente.`,
        `Porque institucionaliza regras que já existem na sociedade e estabelece sanções formais para quem as descumpre, sistematizando a pressão social e transformando normas coletivas em leis aplicáveis pelo Estado.`
      ], correta: 4, fonteExtra: false, explicacaoHtml: `O direito é a forma organizada de coerção social porque institucionaliza regras que já existem na sociedade e estabelece sanções formais para quem as descumpre. A resposta de criar regras do nada é a mais tentadora, porque a lei parece criação do legislador, mas o ponto é que ela organiza normas coletivas já existentes. A norma jurídica é apresentada como exemplo clássico de fato social coercitivo, e a pessoa que não quer pagar impostos os paga porque existe sanção legal, o que afasta a resposta de dispensar sanções.` },

    { id: 30, categoria: 'conceitos', enunciadoHtml: `No debate sobre alienação e controle social pela mídia, como o direito pode ser influenciado por ela?`, alternativasHtml: [
        `A mídia não tem nenhuma relação com a criação das leis, que decorre só da técnica jurídica.`,
        `A mídia constrói narrativas que moldam percepções sobre segurança, consumo e moralidade; quando temas são associados ao medo, a sociedade pode pressionar o Estado por respostas legais, como aumento de penas ou novas leis.`,
        `A mídia elimina a necessidade de qualquer lei, pois regula o comportamento sozinha.`,
        `A mídia só influencia o consumo, sem efeito sobre o direito.`,
        `A mídia atua apenas depois de aplicada a lei, sem influenciar sua criação.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `A mídia influencia o comportamento social ao construir narrativas que moldam percepções sobre segurança, consumo e moralidade, e que, quando certos temas são associados ao medo ou à ameaça, a sociedade pode pressionar o Estado por respostas legais. Por isso o direito não surge isolado, mas é influenciado por contextos sociais. A resposta de que a mídia só atua depois da lei é a mais tentadora, porque a mídia também é discutida em relação à aplicação, mas a pergunta trata da criação e da aplicação das leis. A resposta de que a mídia não tem relação com as leis é a visão isolada do direito que a sociologia jurídica busca ampliar.` },

    { id: 31, categoria: 'conceitos', enunciadoHtml: `Numa sociedade democrática, quem define quais ideias são legítimas? O que se observa sobre isso?`, alternativasHtml: [
        `Que a legitimidade das ideias é sempre definida de forma neutra, sem influência de grupos.`,
        `Que o direito nunca limita discursos, por força da liberdade de expressão.`,
        `Que o direito deve excluir todas as ideias que a maioria rejeita.`,
        `Que a legitimidade deveria ser garantida pelo pluralismo e pela liberdade de expressão, mas, sociologicamente, a definição do aceitável pode ser influenciada por grupos que detêm poder, e o direito, como mediador, pode tanto assegurar a diversidade quanto limitar discursos por justificativas legais.`,
        `Que, em democracias, não há disputa sobre quais vozes serão ouvidas.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Em uma democracia, a legitimidade das ideias deveria ser garantida pelo princípio do pluralismo e pela proteção constitucional da liberdade de expressão; no entanto, sociologicamente, a definição do que é aceitável pode ser influenciada por grupos que detêm poder, e há disputas sobre quais vozes serão ouvidas. O direito atua como mediador dessas tensões. A resposta de que o direito nunca limita discursos é a mais tentadora, porque parte do ideal democrático, mas o direito pode, em determinados contextos, limitar ou controlar discursos sob justificativas legais.` },
];
