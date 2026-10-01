import type { BlocoResumo } from '../../../tipos';

/**
 * Os blocos teóricos do resumo de Sociologia Jurídica, 1a unidade.
 * Fontes, todas no mesmo nível: o material de abertura da disciplina e o material sobre
 * Marx, Durkheim e Weber, a atividade correspondente, o
 * artigo "Da luta à ordem" (com as versões de resumo, didática, crítica e
 * contradições que acompanham o material), o artigo sobre a relevância da
 * sociologia para a ciência jurídica e o artigo sobre narrativa e discurso
 * (Revista Seqüência, lido no texto público). Esta unidade não cita artigo
 * de lei: nenhum botão de citação de dispositivo aparece aqui.
 *
 * Blocos 1 a 5: a disciplina, o campo e o controle social. Blocos 6 a 9:
 * os clássicos (Marx, Durkheim, Weber, Ehrlich com o contraste com Kelsen).
 * Bloco 10: o quadro comparativo. Blocos 11 e 12: os dois artigos de apoio.
 * A leitura crítica do artigo-base não é bloco à parte: entra dentro dos
 * blocos 6 a 10, no mesmo nível, sempre em voz atribuída (decisão do líder).
 */
export const resumo: readonly BlocoResumo[] = [
  {
    id: 'bloco-0',
    numero: 1,
    titulo: 'O que é Sociologia e por que ela nasceu',
    fonte:
      'Material de aula da disciplina; TOMAZINI, Volnei Celso. A relevância da sociologia para a ciência jurídica. Revista da ESMESC, v. 29, n. 35, p. 3-18, 2022.',
    corpoHtml: `
      <p>A Sociologia é a ciência que estuda a sociedade: como as pessoas vivem juntas, como se organizam, se relacionam e constroem regras, valores, culturas e instituições. Ela analisa as relações sociais (família, escola, trabalho, religião, política), os comportamentos humanos em grupo, as desigualdades sociais (classe, raça, poder) e as transformações sociais ao longo do tempo. O artigo de apoio adota uma definição parecida: estudo da vida e do comportamento social, sobretudo dos sistemas sociais, de como funcionam, como mudam e das consequências que produzem.</p>
      <h3>O contexto histórico do século XIX</h3>
      <p>A Sociologia surge como ciência no século XIX, num momento de transformações que mudaram a forma de viver, trabalhar e produzir. Ela nasce da necessidade de compreender, de modo racional e científico, os problemas sociais dessas mudanças, rompendo com explicações baseadas apenas na religião, na tradição ou no senso comum. Três grandes processos estão por trás dela:</p>
      <ul>
        <li><strong>Revolução Industrial</strong> (Inglaterra, fim do século XVIII): trabalho industrial no lugar do artesanal, crescimento acelerado das cidades, formação do proletariado urbano, jornadas exaustivas, exploração da mão de obra e pobreza urbana. Daí vieram desigualdade, miséria, violência, greves e instabilidade.</li>
        <li><strong>Revolução Francesa</strong> (1789): crise do Antigo Regime, liberdade, igualdade e fraternidade, cidadania e direitos individuais, questionamento da autoridade fundada na tradição e na religião. A sociedade passou a ser vista como algo que se pode transformar.</li>
        <li><strong>Iluminismo</strong>: a razão como principal instrumento para compreender e transformar o mundo, a valorização do conhecimento científico, a busca por leis que expliquem os fenômenos naturais e sociais e a ideia de progresso.</li>
      </ul>
      <h3>Como ela se consolida como ciência</h3>
      <p>A Sociologia se consolida quando passa a ter objeto próprio (a sociedade e os fatos sociais), desenvolve métodos científicos de análise e constrói conceitos e teorias para explicar a vida social. Inspirada no modelo das ciências naturais, ela busca mecanismos que expliquem o funcionamento da sociedade, sem ignorar a complexidade histórica e cultural. O artigo de apoio lembra que Comte propôs tratá-la como disciplina à parte, no movimento positivista, e destaca três nomes que marcam a passagem para a teoria social: Marx, crítico do capitalismo e da luta de classes; Durkheim, voltado à divisão do trabalho diante da industrialização; Weber, voltado à secularização e à racionalização da sociedade moderna.</p>
      <p>As perguntas que a Sociologia nasce para responder: por que a sociedade mudou tão rapidamente? Como manter a ordem social diante do conflito? Como compreender as desigualdades produzidas pelo capitalismo? Qual o papel do Estado, da lei e das instituições sociais?</p>
    `,
    resumo: [
      'Sociologia: ciência que estuda a sociedade, como as pessoas vivem juntas, se organizam e constroem regras, valores, culturas e instituições.',
      'Surge no século XIX, em resposta a Revolução Industrial, Revolução Francesa (1789) e Iluminismo, rompendo com explicações só religiosas, tradicionais ou de senso comum.',
      'Consolida-se ao ter objeto próprio (sociedade e fatos sociais), métodos científicos e conceitos e teorias próprios.',
      'Perguntas de origem: mudança rápida, ordem diante do conflito, desigualdades do capitalismo e papel do Estado, da lei e das instituições.'
    ],
    exemploHtml: `Quando um estudante de Direito pergunta por que uma lei de trabalho existe, ele pode responder de dois modos: lendo o texto da norma, ou olhando para a Revolução Industrial, para as jornadas exaustivas e para os conflitos que tornaram necessário regular o trabalho. O segundo modo é o olhar da Sociologia.`
  },
  {
    id: 'bloco-1',
    numero: 2,
    titulo: 'O que é Sociologia Jurídica',
    fonte:
      'Material de aula da disciplina; TOMAZINI, Volnei Celso. A relevância da sociologia para a ciência jurídica. Revista da ESMESC, v. 29, n. 35, p. 3-18, 2022.',
    corpoHtml: `
      <p>A Sociologia Jurídica (ou sociologia do direito) estuda o direito como <strong>fenômeno social</strong>: não se limita ao conteúdo das leis, procura compreender o direito para além das normas escritas, analisando as relações sociais que influenciam sua criação e aplicação. Em resumo, ela investiga como o direito se relaciona com a sociedade e com as transformações dela.</p>
      <p>O artigo de apoio recolhe algumas formulações da doutrina:</p>
      <ul>
        <li>o estudo dos fenômenos sociais que mantêm algum elo com o fenômeno jurídico, e das inter-relações entre direito e sociedade, isto é, das manifestações do fenômeno jurídico e de sua influência sobre a sociedade, e das atividades da sociedade e de sua influência sobre o jurídico (Alland e Rials);</li>
        <li>o exame da influência dos fatores sociais sobre o direito e das incidências do direito na sociedade, uma "leitura externa" do sistema jurídico (Sabadell);</li>
        <li>a relação entre os mecanismos de ordenação do direito e da comunidade, e entre o direito e os outros setores da ordem social (Baratta).</li>
      </ul>
      <h3>Autonomia e método</h3>
      <p>O artigo registra que a autonomia da Sociologia Jurídica é reconhecida: ela tem objeto próprio, método e leis (Cavalieri Filho), e surge como disciplina autônoma no início do século XX. Seu objeto é o direito como fato social concreto, integrante de uma superestrutura social; sua finalidade é estabelecer uma relação funcional entre a realidade social e as diferentes manifestações jurídicas. O estudioso pode usar métodos variados, como o dedutivo, o positivista, o dialético e o estruturalista, de modo individual ou em conjunto, conforme o objetivo da investigação.</p>
      <h3>Sociólogo do direito e jurista dogmático</h3>
      <p>O artigo distingue duas posturas. O <strong>sociólogo do direito</strong> estuda o fenômeno jurídico como fato social, descreve e analisa a realidade jurídica em sua interação com os demais fatores sociais, e adota a posição de observador: descreve os fatos, sem se envolver com valores, ideologias ou normas, e não interpreta o direito nem emite juízos de valor sobre ele. O <strong>jurista dogmático</strong> coloca-se diante da norma para conhecê-la, interpretá-la e aplicá-la com exatidão aos casos concretos (a expressão de Recaséns Siches, citada por Montoro, é "sacerdote da Lei"). A ciência jurídica cuida da vigência e da interpretação da norma; a Sociologia cuida da realidade social do direito. As duas se complementam, não se substituem.</p>
      <p>Por isso a Sociologia Jurídica <strong>não tem como objetivo substituir o direito positivo</strong>, nem eliminar o papel do Estado, nem reduzir o direito à interpretação literal das normas: ela o compreende em seu contexto histórico e social.</p>
    `,
    resumo: [
      'Sociologia Jurídica: estuda o direito como fenômeno social, ligado às relações de poder, e não só o conteúdo das leis.',
      'Objetivo: compreender como o direito se relaciona com a sociedade e suas transformações; não substitui o direito positivo.',
      'Tem autonomia reconhecida: objeto próprio, método e leis, como disciplina autônoma desde o início do século XX.',
      'Sociólogo do direito observa e descreve, sem interpretar nem julgar a norma; o jurista dogmático interpreta e aplica a norma.'
    ],
    exemploHtml: `Ao afirmar que determinada lei "carece de eficácia", o sociólogo do direito precisa sustentar isso em pesquisa com método (por exemplo, dados sobre como a norma é de fato cumprida). Já o juiz, ao decidir, interpreta a norma vigente. Os dois olhares se completam no trabalho de um bom operador do direito.`
  },
  {
    id: 'bloco-2',
    numero: 3,
    titulo: 'A ementa em forma de conteúdo: o que esta disciplina estuda',
    fonte: 'Material de aula da disciplina.',
    corpoHtml: `
      <p>A ementa da disciplina, escrita como conteúdo de estudo, reúne quatro grandes eixos.</p>
      <ol>
        <li><strong>A Sociologia como ciência social e sua aplicação ao campo jurídico.</strong> Estudo introdutório da Sociologia e da sociedade como realidade histórica, cultural e estruturada por relações sociais, políticas e econômicas.</li>
        <li><strong>O Direito como fenômeno social.</strong> Norma, poder, controle social e legitimação.</li>
        <li><strong>As contribuições clássicas.</strong> Émile Durkheim, Max Weber, Karl Marx e Eugen Ehrlich para a compreensão sociológica do Direito.</li>
        <li><strong>A Sociologia Jurídica.</strong> Direito positivo, direito vivo, pluralismo jurídico e desigualdades na aplicação da lei; as relações entre Direito, Estado, cultura, economia e cidadania.</li>
      </ol>
      <p>O fim último é a formação do <strong>pensamento crítico</strong> do estudante de Direito, a partir da leitura sociológica da realidade social e jurídica.</p>
      <h3>Objetivo geral</h3>
      <p>Compreender e analisar a Sociologia e a Sociologia Jurídica como campos fundamentais para a formação crítica do estudante de Direito, analisando o Direito como fenômeno social historicamente construído e influenciado por relações de poder, cultura e desigualdade.</p>
      <h3>Objetivos específicos</h3>
      <ul>
        <li>introduzir os conceitos fundamentais da Sociologia e da Sociologia Jurídica;</li>
        <li>analisar a relação entre indivíduo, sociedade e Direito;</li>
        <li>compreender o Direito como instrumento de regulação social e expressão de relações de poder;</li>
        <li>estudar as contribuições de Durkheim, Weber, Marx e Ehrlich para a Sociologia do Direito;</li>
        <li>desenvolver a capacidade de leitura crítica da realidade social e jurídica;</li>
        <li>estimular a reflexão ética e cidadã no exercício do Direito.</li>
      </ul>
      <h3>Como a disciplina é conduzida</h3>
      <p>Metodologias ativas e dialógicas: exposições dialogadas; análise de músicas, textos e casos concretos; debates orientados e discussões em grupo; estudos de caso com enfoque sociológico-jurídico; seminários temáticos; produção de resenhas críticas e reflexões escritas. A primeira unidade cobre a introdução à Sociologia (contexto histórico, consolidação como ciência) e os clássicos.</p>
    `,
    resumo: [
      'Quatro eixos: Sociologia como ciência social; Direito como fenômeno social (norma, poder, controle social, legitimação); os clássicos Durkheim, Weber, Marx e Ehrlich; Sociologia Jurídica (direito positivo, direito vivo, pluralismo, desigualdades na aplicação da lei).',
      'Objetivo geral: analisar o Direito como fenômeno social historicamente construído e influenciado por poder, cultura e desigualdade.',
      'Fim último: formar o pensamento crítico do estudante de Direito.',
      'Metodologia ativa e dialógica: debates, análise de músicas, textos e casos, seminários e resenhas críticas.'
    ],
    exemploHtml: `Uma resenha crítica pedida na disciplina não é um resumo: pede que o estudante relacione o texto às relações de poder, à cultura e à desigualdade, que são justamente os três fatores do objetivo geral.`
  },
  {
    id: 'bloco-3',
    numero: 4,
    titulo: 'Direito positivo, direito vivo e pluralismo jurídico',
    fonte:
      'Material de aula da disciplina; TOMAZINI, Volnei Celso. A relevância da sociologia para a ciência jurídica. Revista da ESMESC, 2022.',
    corpoHtml: `
      <p>Dois modos de olhar o mesmo fenômeno organizam o campo da Sociologia Jurídica.</p>
      <ul>
        <li><strong>Direito positivo</strong>: o direito posto, as normas escritas e vigentes, o que está "no código". É o objeto do jurista dogmático, que interpreta e aplica essas normas.</li>
        <li><strong>Direito vivo</strong>: as normas que surgem das práticas sociais, as regras que efetivamente regulam a vida em sociedade, mesmo sem estarem no código. É a noção associada a Eugen Ehrlich.</li>
      </ul>
      <p>A ementa da disciplina trata os dois lado a lado, e junta a eles o <strong>pluralismo jurídico</strong>: a ideia de que o Estado não é a única fonte de regras que regulam a vida social. Ao lado do direito estatal existem regras sociais, costumes e ordens de grupos, que também organizam condutas. O conceito-chave de Ehrlich é, justamente, o pluralismo jurídico.</p>
      <p>A distância entre o direito escrito e o direito vivido explica dois temas que o artigo de apoio também destaca: a <strong>eficácia</strong> das normas (uma lei pode existir e não se cumprir) e a <strong>legitimidade</strong> (uma norma sem sintonia com as peculiaridades da comunidade destinatária tem a vigência esvaziada de plena legitimidade). Também explica as <strong>desigualdades na aplicação da lei</strong>, tema da ementa: a mesma norma escrita pode ser aplicada de modos diferentes conforme o grupo social.</p>
      <p>O quadro do bloco 10 mostra Ehrlich ao lado de Marx, Durkheim e Weber; o bloco 9 aprofunda Ehrlich e o contraste com Kelsen.</p>
    `,
    resumo: [
      'Direito positivo: normas escritas e vigentes, o que está no código; objeto do jurista dogmático.',
      'Direito vivo: normas que surgem das práticas sociais e regulam a vida mesmo sem estarem no código (Ehrlich).',
      'Pluralismo jurídico: o Estado não é a única fonte de regras; há regras sociais que também regulam a vida.',
      'A distância entre o escrito e o vivido ajuda a explicar eficácia, legitimidade e desigualdades na aplicação da lei.'
    ],
    exemploHtml: `Uma regra não escrita de convivência num prédio, seguida por todos os moradores e cobrada socialmente, funciona como direito vivo. Já a convenção registrada e o Código Civil são direito positivo. Um operador do direito atento aos dois entende melhor por que certas normas escritas "não pegam".`
  },
  {
    id: 'bloco-4',
    numero: 5,
    titulo: 'Controle social, coerção e legitimação',
    fonte:
      'Material de aula da disciplina; TOMAZINI, Volnei Celso, 2022.',
    corpoHtml: `
      <h3>Coerção social (Durkheim)</h3>
      <p>Coerção social é a força que a sociedade exerce sobre os indivíduos, influenciando comportamentos, pensamentos e escolhas. Para Durkheim, existem maneiras de agir, pensar e sentir que <strong>existem antes de nascermos</strong>, são <strong>exteriores ao indivíduo</strong> e <strong>exercem pressão</strong> sobre nós. Seguimos essas regras não porque as inventamos, mas porque a sociedade espera que as sigamos: cumprir horários, vestir-se de modo adequado a certos ambientes, respeitar leis, ficar em silêncio no tribunal, não furar fila. Quem decide não segui-las encontra punição, julgamento ou constrangimento: isso é a coerção social.</p>
      <p>No campo jurídico ela aparece com clareza: a lei impõe comportamentos e o Estado tem poder de punição. A norma jurídica é um exemplo clássico de <strong>fato social coercitivo</strong>; alguém pode não querer pagar impostos, mas paga porque existe uma sanção legal. Por isso o Direito pode ser considerado a <strong>forma mais organizada de coerção social</strong>: ele institucionaliza regras que já existem na sociedade e estabelece sanções formais para quem as descumpre, sistematizando a pressão social ao transformar normas coletivas em leis aplicáveis pelo Estado. A coerção não é, portanto, apenas negativa: é também o que sustenta a ordem.</p>
      <h3>Mídia, narrativas e criação de leis</h3>
      <p>O Direito não surge isolado. A mídia influencia o comportamento social ao construir narrativas que moldam percepções sobre segurança, consumo e moralidade. Quando certos temas são associados ao medo ou à ameaça, a sociedade pode pressionar o Estado por respostas legais, como o aumento de penas ou a criação de novas leis. É uma forma de alienação e controle social pela mídia, que chega até a criação e a aplicação das leis.</p>
      <h3>Legitimação: quem define as ideias aceitáveis?</h3>
      <p>Em uma democracia, a legitimidade das ideias deveria ser garantida pelo pluralismo e pela proteção constitucional da liberdade de expressão. Sociologicamente, porém, a definição do que é aceitável pode ser influenciada por grupos que detêm poder, e há disputas sobre quais vozes serão ouvidas. O Direito atua como mediador dessas tensões: pode assegurar a diversidade de pensamento ou, em certos contextos, limitar ou controlar discursos por justificativas legais.</p>
      <h3>Quatro lentes sobre o Direito</h3>
      <p>Nesse contexto o Direito pode ser visto como <strong>norma coletiva</strong> (Durkheim), <strong>instrumento de poder</strong> (Marx), <strong>sistema racional-legal</strong> (Weber) e <strong>prática social viva</strong> (Ehrlich). Os blocos seguintes detalham cada lente.</p>
    `,
    resumo: [
      'Coerção social (Durkheim): força da sociedade sobre o indivíduo; maneiras de agir, pensar e sentir anteriores, exteriores e que pressionam.',
      'A norma jurídica é fato social coercitivo; o Direito é a forma mais organizada de coerção social, pois institucionaliza regras e sanções formais.',
      'A mídia constrói narrativas que moldam percepções e podem pressionar por novas leis e penas mais duras.',
      'Em democracia, a legitimidade das ideias tem base no pluralismo e na liberdade de expressão, mas grupos com poder influenciam o que é aceitável.',
      'Direito visto como norma coletiva (Durkheim), instrumento de poder (Marx), sistema racional-legal (Weber) e prática social viva (Ehrlich).'
    ],
    exemploHtml: `Depois de um caso de grande repercussão na televisão, é comum surgir pressão por endurecer penas. Um estudante que entende o papel da mídia nas narrativas sobre segurança lê essa pressão como fenômeno social que influencia a criação da lei, e não só como um debate técnico sobre o texto penal.`
  },
  {
    id: 'bloco-5',
    numero: 6,
    titulo: 'Marx: o direito na estrutura de classes',
    fonte:
      'Material de aula da disciplina; TEIXEIRA, Ana Paula Fernandes; TEIXEIRA, Mariana Fernandes; PERES, Anna Paula Lemos Santos. Da luta à ordem: o direito nas teorias de Marx, Durkheim e Weber. Revista Aracê, São José dos Pinhais, v. 7, n. 11, p. 1-18, 2025. DOI 10.56238/arev7n11-129.',
    corpoHtml: `
      <p>Karl Marx (1818-1883) analisa a sociedade a partir das condições materiais de produção e das relações entre as classes. O modo como a produção material é organizada determina a organização política e as representações intelectuais de uma época: Estado e propriedade seriam reflexos de condições reais. A história aparece como história da luta de classes: em cada modo de produção há uma classe dominante e uma dominada (proprietários e escravos, senhores feudais e servos, burguesia e proletariado).</p>
      <h3>Infraestrutura e superestrutura</h3>
      <ul>
        <li><strong>Infraestrutura</strong>: as forças produtivas mais as relações sociais de produção, a base econômica.</li>
        <li><strong>Superestrutura</strong>: as relações ideológicas, políticas e jurídicas.</li>
      </ul>
      <p>As instituições jurídicas fazem parte da superestrutura, e seu caráter é determinado pela estrutura econômica existente. Por isso as relações jurídicas não se compreendem a partir de si mesmas: têm origem nas condições materiais de vida e devem buscar seu fundamento na economia política.</p>
      <h3>O direito e a aparência de autonomia</h3>
      <p>Na leitura apresentada no artigo, o direito, como fenômeno específico, só se verifica plenamente nas sociedades capitalistas. A produção legislativa aparece de forma <strong>abstrata e codificada</strong>, o que estimula a ilusão ideológica de que o direito seria autônomo em relação à estrutura econômica. A crítica marxista procura revelar as relações de poder e as desigualdades encobertas pela forma jurídica. O artigo articula isso com o <em>Manifesto do Partido Comunista</em>: o governo moderno seria "um comitê que administra os negócios comuns de toda a classe burguesa", e o direito burguês, um instrumento que organiza e reproduz o modo de produção capitalista.</p>
      <h3>Igualdade jurídica: igualdade real?</h3>
      <p>No capitalismo, trabalhadores e capitalistas aparecem juridicamente como sujeitos livres e iguais. Essa <strong>igualdade formal</strong> torna possível o contrato, inclusive o contrato de trabalho, pelo qual a força de trabalho vira mercadoria. Na leitura do artigo, liberdade e igualdade jurídicas são um artifício necessário à exploração mediada pelo contrato, e não emancipação efetiva. Nas sociedades pré-capitalistas a dominação era direta e pessoal; no capitalismo a burguesia domina indiretamente, pelo Estado e pelo direito. A pergunta para debate: ser juridicamente igual significa possuir as mesmas condições materiais?</p>
      <h3>Dominação e transformação</h3>
      <p>O direito pode contribuir para manter privilégios e desigualdades estruturais; a luta por direitos sociais, por sua vez, pode reduzir desigualdades e exploração, e a perspectiva marxista aponta também para a superação das formas de exploração de classe. A ideia-chave: o direito deve ser analisado dentro das relações sociais e de poder. O artigo observa ainda que o crime pode ser lido, nessa tradição, como artifício jurídico de proteção dos bens da classe dominante.</p>
      <h3>Leitura crítica desta seção</h3>
      <p>A tese acima é a leitura que a disciplina adota. Uma leitura crítica que acompanha o estudo do artigo aponta, como pontos para pensar, que o texto afirma ao mesmo tempo que o direito, como fenômeno específico, só existe no capitalismo e que a institucionalização de normas está ligada à luta de classes em toda a história dos modos de produção; que apresenta o Estado como "comitê da burguesia" e, em seguida, como capitalista por razões estruturais (Mascaro), e não por ser ocupado por burgueses; e que declara o direito produto e produtor das relações sociais, enquanto a seção marxista o determina pela estrutura econômica. Esses pares pedem leitura conjunta: cabe ao estudante saber conciliá-los.</p>
      <p>Uma objeção possível, de outras tradições, é que há direito anterior e irredutível ao capitalismo. Tomás de Aquino (lei eterna, natural, humana e divina), Locke (vida, liberdade e propriedade anteriores ao governo civil), Grotius e Finnis (bens humanos básicos) sustentariam isso; Mises objetaria que a propriedade é condição de cálculo econômico e de cooperação entre estranhos, e não só privilégio de classe; Bastiat e Burke, que a lei protege bens que já existiam e que o direito herdado não se demole por abstração. São contrapontos atribuídos, não veredito do caderno.</p>
    `,
    resumo: [
      'Marx parte das condições materiais de produção e das classes; a história é luta de classes.',
      'Infraestrutura (forças produtivas e relações de produção) e superestrutura (ideologia, política e direito): o direito está na superestrutura, determinado pela estrutura econômica.',
      'A forma abstrata e codificada da lei alimenta a ilusão de autonomia do direito; a crítica marxista revela poder e desigualdade sob a forma jurídica.',
      'Igualdade jurídica formal viabiliza o contrato, inclusive o de trabalho; não equivale a igualdade real de condições.',
      'O direito pode manter privilégios e, pela luta por direitos sociais, também reduzir a exploração.',
      'Leitura crítica (atribuída): pares de passagens do artigo pedem leitura conjunta; tradições jusnaturalista e liberal objetam que há direito anterior ao capitalismo.'
    ],
    exemploHtml: `No contrato de trabalho ou no de aluguel, empregador e empregado, locador e locatário são "iguais" e "livres" para contratar. A leitura marxista pergunta o que essa igualdade no papel esconde quando as condições materiais das partes são muito diferentes.`
  },
  {
    id: 'bloco-6',
    numero: 7,
    titulo: 'Durkheim: fato social, solidariedade e sanção',
    fonte:
      'Material de aula da disciplina; TEIXEIRA, Ana Paula Fernandes; TEIXEIRA, Mariana Fernandes; PERES, Anna Paula Lemos Santos. Da luta à ordem. Revista Aracê, v. 7, n. 11, p. 1-18, 2025.',
    corpoHtml: `
      <p>Émile Durkheim (1858-1917) quer estabelecer a Sociologia como ciência, com método sistemático e observação empírica. O objeto central são os <strong>fatos sociais</strong>, que devem ser tratados "como coisa": estuda-se a sociedade em si, não o discurso sobre ela. Fatos sociais são maneiras de agir suscetíveis de exercer coerção exterior e com existência própria em relação às manifestações individuais. O Direito é uma expressão dos fatos sociais, e observá-lo ajuda a compreender o grau de integração e coesão de uma sociedade: é um ponto de partida externo e objetivo.</p>
      <h3>Solidariedade mecânica e orgânica</h3>
      <p>O tipo de direito predominante varia conforme o tipo de solidariedade social.</p>
      <ul>
        <li><strong>Solidariedade mecânica</strong>: semelhança entre os indivíduos e forte consciência coletiva. Predomina o <strong>direito repressivo</strong>: a sanção reage à violação das normas coletivas, e a pena é uma reação passional.</li>
        <li><strong>Solidariedade orgânica</strong>: diferenciação social e divisão do trabalho. Predomina o <strong>direito restitutivo</strong>: a sanção busca restaurar relações ou situações jurídicas (direito civil e comercial).</li>
      </ul>
      <p>Com a especialização das funções sociais, o artigo descreve a mudança de predominância do repressivo para o restitutivo. O direito funciona, assim, como indicador externo das formas de integração social. Diferente de Marx, Durkheim reconhece direito anterior ao moderno.</p>
      <h3>Crime e sanção</h3>
      <p>Para Durkheim o <strong>crime é um fato social normal</strong>, presente em qualquer sociedade (geral, coercitivo, exterior); só se torna <strong>patológico</strong> quando deixa de apresentar o caráter regular esperado. A função da sanção é proteger a coesão social e satisfazer a consciência comum ferida pelo crime, não meramente corrigir ou intimidar o infrator. É o ponto central: a punição como reforço da consciência coletiva e da coesão social.</p>
      <p>O artigo faz uma observação crítica: a vontade punitiva nos países modernos não diminuiu como o esquema durkheimiano sugeriria. O apetite repressivo continua forte, o que tensiona a previsão de que o direito penal perderia importância.</p>
      <h3>Leitura crítica desta seção</h3>
      <p>Uma leitura crítica que acompanha o estudo do artigo observa duas tensões: a sanção é apresentada como proteção da coesão e satisfação da consciência comum e, noutro trecho, a pena "não passa de" vingança de uma sociedade arbitrária e irracional; e o corpo do texto diz que o recuo do direito penal não se confirma, enquanto a conclusão volta a usar a distinção entre direito repressivo e restitutivo como chave de leitura. Uma objeção possível, de matriz jusnaturalista (Tomás de Aquino, Finnis), é que tratar o direito como símbolo da solidariedade colapsa o dever-ser no ser: a consciência coletiva pode exigir o injusto, e o jurista precisaria de outro critério para julgar a norma vigente. São contrapontos atribuídos.</p>
    `,
    resumo: [
      'Fato social: maneira de agir com coerção exterior e existência própria; o direito é expressão dele e indicador do grau de coesão.',
      'Solidariedade mecânica (semelhança, consciência coletiva forte) tem direito repressivo; orgânica (divisão do trabalho) tem direito restitutivo.',
      'Crime é fato social normal; patológico só quando deixa de ser regular.',
      'A sanção protege a coesão e satisfaz a consciência comum, e não visa só corrigir ou intimidar.',
      'Observação do artigo: o apetite punitivo moderno não diminuiu como o esquema sugeriria.',
      'Leitura crítica (atribuída): tensão entre a função da sanção e a pena como vingança; objeção de que fato social não é critério de justiça.'
    ],
    exemploHtml: `Uma pena criminal ou uma multa de trânsito são sanções repressivas, castigo. Uma ação de despejo por aluguel atrasado ou de cumprimento de um contrato de compra e venda têm sanção típica restitutiva: pagar o devido, restituir o imóvel, indenizar.`
  },
  {
    id: 'bloco-7',
    numero: 8,
    titulo: 'Weber: ação social, dominação legal e burocracia',
    fonte:
      'Material de aula da disciplina; TEIXEIRA, Ana Paula Fernandes; TEIXEIRA, Mariana Fernandes; PERES, Anna Paula Lemos Santos. Da luta à ordem. Revista Aracê, v. 7, n. 11, p. 1-18, 2025.',
    corpoHtml: `
      <p>Max Weber (1864-1920) analisa a sociedade moderna marcada pelo capitalismo industrial, pela racionalização e pelo "desencantamento do mundo". Dialoga com Marx, mas desloca o centro: considera fatores econômicos, e também políticos, religiosos e culturais, e rejeita reduzir tudo à economia. Sua sociologia dá centralidade à <strong>ação e à interação dos indivíduos</strong>. O artigo destaca Weber como o autor que mais se dedicou diretamente ao estudo do direito entre os três.</p>
      <h3>Ação social e sociologia compreensiva</h3>
      <p>A sociologia <strong>compreensiva</strong> busca entender as condições que geram determinada ação social. <strong>Ação social</strong> é uma conduta dotada de significado subjetivo e orientada em relação a outros. Para o jurista, compreender os sentidos atribuídos às normas ajuda a interpretar o funcionamento efetivo do ordenamento: a análise passa do texto normativo para o comportamento social relacionado às normas.</p>
      <h3>Poder e dominação</h3>
      <p>A ordem jurídica influencia diretamente a distribuição do poder numa comunidade. <strong>Poder</strong> é a probabilidade de impor a própria vontade numa ação social, mesmo diante de oposição. <strong>Dominação</strong> é a situação em que uma vontade manifesta influencia efetivamente as ações dos dominados, produzindo obediência. O Direito integra os mecanismos pelos quais a dominação pode ser organizada e legitimada.</p>
      <h3>Três tipos de dominação legítima</h3>
      <ul>
        <li><strong>Legal-racional</strong>: baseada na crença na validade das normas e na competência estabelecida por regras.</li>
        <li><strong>Tradicional</strong>: vinculada à crença na legitimidade das tradições.</li>
        <li><strong>Carismática</strong>: vinculada à crença nas qualidades extraordinárias de uma pessoa.</li>
      </ul>
      <p>O artigo enfatiza a dominação legal e sua relação com o Direito e a burocracia moderna.</p>
      <h3>Burocracia e racionalização</h3>
      <p>A <strong>burocracia</strong> organiza a dominação legal por meio de normas, competências, registros e procedimentos previsíveis: é a forma máxima de dominação legal nas sociedades modernas. <strong>Racionalizar</strong> é conectar meios e fins, antecipar possibilidades para alcançar determinado objetivo. O Direito moderno aparece integrado ao corpo burocrático do Estado; a formalização aumenta previsibilidade e estabilidade, mas também consolida estruturas de poder. Weber nota ainda que os juízes detêm o monopólio de decidir, e o artigo lê o Poder Judiciário como uma "empresa de dominação".</p>
      <h3>Leitura crítica desta seção</h3>
      <p>Uma leitura crítica que acompanha o estudo do artigo nota que a exposição de Weber apresenta o direito racional-legal como válido para todos e redutor do peso da riqueza, e que a conclusão da mesma seção lê o direito penal como veículo das ideias da elite política e judiciária, sem distinguir a pretensão da ordem do seu uso. Uma objeção possível é que a crença na legalidade explica a eficácia da obediência, mas não a validade normativa, e que a forma racional-legal também pode ser o freio contra o arbítrio carismático ou tradicional. São contrapontos atribuídos.</p>
    `,
    resumo: [
      'Weber estuda capitalismo industrial, racionalização e desencantamento do mundo; não reduz tudo à economia e é o clássico que mais se dedicou ao direito.',
      'Ação social: conduta com sentido subjetivo, orientada por outros; a sociologia compreensiva busca as condições que geram essa ação.',
      'Poder: probabilidade de impor a própria vontade mesmo diante de oposição; dominação: mando que produz obediência.',
      'Três tipos de dominação legítima: legal-racional, tradicional e carismática.',
      'Burocracia: forma máxima da dominação legal (normas, competências, registros, previsibilidade); racionalizar é conectar meios e fins.',
      'Leitura crítica (atribuída): direito de todos e direito da elite na mesma seção; a forma racional-legal como possível freio ao arbítrio.'
    ],
    exemploHtml: `O INSS, a Receita Federal, o cartório e o tribunal funcionam com procedimentos escritos, competências definidas e recursos. Uma multa ou uma sentença são obedecidas, em boa parte, porque as pessoas creem na legitimidade do procedimento legal, e não porque o servidor seja carismático ou um "senhor tradicional".`
  },
  {
    id: 'bloco-8',
    numero: 9,
    titulo: 'Ehrlich e o direito vivo, e o contraste com Kelsen',
    fonte:
      'Material de aula da disciplina; TOMAZINI, Volnei Celso, 2022 (distinção entre enfoque sociológico e dogmático).',
    corpoHtml: `
      <h3>Ehrlich</h3>
      <p>Eugen Ehrlich (1862-1922) é o autor que a ementa acrescenta a Durkheim, Weber e Marx. Sua leitura do direito é a do <strong>direito vivo</strong>: as normas que surgem das práticas sociais. O método é a <strong>observação sociológica da prática social</strong>; o conceito-chave é o <strong>pluralismo jurídico</strong>; e o exemplo aplicado ao Direito são as regras sociais que regulam a vida mesmo sem estarem no código. Em síntese, o Direito é visto como <strong>prática social viva</strong>.</p>
      <p>A consequência é olhar para onde o direito de fato acontece: nas relações entre as pessoas, nos costumes, nas associações e nas regras que os grupos seguem, e não apenas na lei do Estado. O estudioso que segue Ehrlich pergunta como a sociedade regula a si mesma.</p>
      <h3>Kelsen, o contraponto</h3>
      <p>Kelsen é a alternativa de comparação, o autor que defende a pureza normativa do direito: Hans Kelsen (1881-1973) e a sua Teoria Pura do Direito tratam o direito como um sistema de normas, estudado em sua pureza, separado dos fatos sociais e dos juízos de valor. É o olhar do <strong>jurista dogmático</strong>, que se coloca diante da norma para conhecê-la e aplicá-la (o "sacerdote da Lei", na expressão citada por Montoro no artigo de apoio).</p>
      <p>O contraste ajuda a fixar as fronteiras:</p>
      <ul>
        <li><strong>Ehrlich</strong> olha para o direito vivo, as práticas sociais e o pluralismo jurídico; seu método é a observação da prática social.</li>
        <li><strong>Kelsen</strong> defende a pureza normativa: o direito como norma, sem misturá-lo com a análise dos fatos sociais.</li>
        <li>Nenhum dos dois é a resposta quando a pergunta trata da <strong>punição como reforço da consciência coletiva</strong> (Durkheim), do <strong>direito como reflexo da estrutura econômica</strong> (Marx) ou da <strong>racionalização burocrática e da dominação legal</strong> (Weber).</li>
      </ul>
    `,
    resumo: [
      'Ehrlich: direito vivo, normas que surgem das práticas sociais; método de observação sociológica da prática social; conceito-chave, pluralismo jurídico.',
      'Para Ehrlich, o Direito é prática social viva.',
      'Kelsen: pureza normativa do direito, o olhar do jurista dogmático diante da norma.',
      'Punição e consciência coletiva é Durkheim; estrutura econômica é Marx; racionalização e dominação legal é Weber.'
    ],
    exemploHtml: `Numa questão de prova que descreve "regras não escritas que regulam a vida de uma comunidade mesmo sem estarem no código", a chave é reconhecer o direito vivo de Ehrlich. Se o enunciado descreve a lei penal como expressão de valores compartilhados, a chave é Durkheim.`
  },
  {
    id: 'bloco-9',
    numero: 10,
    titulo: 'Quadro comparativo: Marx, Durkheim e Weber (e Ehrlich)',
    fonte:
      'Material de aula da disciplina; TEIXEIRA, Ana Paula Fernandes; TEIXEIRA, Mariana Fernandes; PERES, Anna Paula Lemos Santos. Da luta à ordem. Revista Aracê, 2025.',
    corpoHtml: `
      <p>O quadro reúne, para cada autor, como ele vê o direito, o conceito-chave, o método e um exemplo aplicado. Os campos de objeto, método, conceito-chave e exemplo seguem o material da disciplina; a coluna "Como vê o direito" resume a leitura do artigo. A última linha, de Ehrlich, vem do mesmo material.</p>
      <div class="tabela-rolavel" tabindex="0" role="group" aria-label="Tabela com rolagem lateral">
        <table>
          <thead>
            <tr><th>Autor</th><th>Como vê o direito</th><th>Conceito-chave</th><th>Método</th><th>Exemplo aplicado ao Direito</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Karl Marx</td>
              <td>Instrumento da superestrutura, determinado pela estrutura econômica; tende a reproduzir a ordem capitalista e as relações de poder.</td>
              <td>Luta de classes</td>
              <td>Materialismo histórico, crítico</td>
              <td>O direito como instrumento que protege interesses da classe dominante.</td>
            </tr>
            <tr>
              <td>Émile Durkheim</td>
              <td>Fato social, expressão da solidariedade; indicador externo da coesão de uma sociedade.</td>
              <td>Coerção social</td>
              <td>Positivista, explicativo</td>
              <td>A lei penal como expressão da consciência coletiva.</td>
            </tr>
            <tr>
              <td>Max Weber</td>
              <td>Ordem racional de dominação legal, ligada à burocracia e à legitimação do poder.</td>
              <td>Dominação legítima</td>
              <td>Compreensivo, interpretativo (ação social com sentido)</td>
              <td>O direito como forma de dominação racional-legal do Estado.</td>
            </tr>
            <tr>
              <td>Eugen Ehrlich</td>
              <td>Direito vivo: normas que surgem das práticas sociais.</td>
              <td>Pluralismo jurídico</td>
              <td>Observação sociológica da prática social</td>
              <td>Regras sociais que regulam a vida mesmo sem estarem no código.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3>Três lentes, três encadeamentos</h3>
      <ul>
        <li><strong>Marx</strong>: direito, estrutura econômica, classes, dominação.</li>
        <li><strong>Durkheim</strong>: direito, solidariedade, divisão do trabalho, coesão.</li>
        <li><strong>Weber</strong>: direito, racionalização, burocracia, dominação legal.</li>
      </ul>
      <h3>O que os três têm em comum</h3>
      <p>Os caminhos são diferentes, mas todos tratam o Direito como fenômeno social central. O Direito não é apresentado como fenômeno isolado da sociedade; as normas jurídicas se relacionam a formas de organização social e a relações de poder; o Direito participa da estabilidade e da reprodução da ordem social e também pode assumir potencial de transformação, conforme o poder é distribuído e legitimado. Em resumo, para Marx o poder se manifesta na estrutura econômica, para Durkheim tem caráter moral e coletivo, para Weber se racionaliza na dominação legal-burocrática. É a convergência: <strong>o direito é um fenômeno social ligado às relações de poder e à organização coletiva</strong>.</p>
      <h3>Para pensar como futuros juristas</h3>
      <ul>
        <li>Se a lei é formalmente igual para todos, quais desigualdades podem permanecer?</li>
        <li>Quando uma sanção protege a coesão social e quando pode reforçar relações de poder?</li>
        <li>Por que as pessoas obedecem às normas jurídicas?</li>
        <li>O Direito apenas mantém a ordem existente ou também pode transformá-la?</li>
      </ul>
      <h3>Leitura crítica da convergência</h3>
      <p>A convergência é a tese que a disciplina adota e que a atividade cobra. Uma leitura crítica que acompanha o estudo do artigo observa que o resumo e a conclusão falam em convergência quanto ao direito como instrumento de dominação e de transformação, enquanto o corpo descreve o direito durkheimiano como algo que "germina" da vida social; convém ler a convergência como acordo no ponto de partida (o direito é central e ligado ao poder), não como a mesma tese nos três.</p>
      <p>Uma objeção possível à ideia de transformação social pelo direito vem de Hayek (ordem espontânea contra o construtivismo), Sowell (visão restrita, trade-offs e conhecimento disperso), Leoni e Oakeshott: tratar o direito como instrumento de um fim social deslocaria o jurista de guardião de regras de convívio para engenheiro social. O mesmo parecer crítico reconhece o que permanece útil: a história social das instituições, as afinidades entre contrato, propriedade e troca em Marx, o vocabulário durkheimiano de sanção e diferenciação social, e a descrição weberiana da burocracia. Fonte dessas leituras: versões "contradições" e "crítica" que acompanham o artigo (Revista Aracê, 2025).</p>
    `,
    resumo: [
      'Marx: luta de classes, materialismo histórico; direito como instrumento da classe dominante.',
      'Durkheim: coerção social, método positivista e explicativo; lei penal como expressão da consciência coletiva.',
      'Weber: dominação legítima, método compreensivo; direito como dominação racional-legal do Estado.',
      'Ehrlich: pluralismo jurídico, observação da prática social; regras vivas que regulam a vida sem estarem no código.',
      'Convergência: o direito é fenômeno social central, ligado a relações de poder, que pode manter a ordem e também transformá-la.',
      'Leitura crítica (atribuída): a convergência é acordo no ponto de partida; Hayek, Sowell, Leoni e Oakeshott objetam à transformação social pelo direito.'
    ],
    exemploHtml: `Diante de uma mesma situação, como o pagamento de um tributo, cada autor chama a atenção para algo diferente: Marx, quem é beneficiado pela estrutura econômica; Durkheim, a sanção como coerção social; Weber, a obediência por crença na legitimidade do procedimento legal; Ehrlich, as práticas reais de cumprimento.`
  },
  {
    id: 'bloco-10',
    numero: 11,
    titulo: 'A relevância da Sociologia para a ciência jurídica',
    fonte:
      'TOMAZINI, Volnei Celso. A relevância da sociologia para a ciência jurídica. Revista da ESMESC, v. 29, n. 35, p. 3-18, 2022. DOI 10.14295/revistadaesmesc.v29i35.p03.',
    corpoHtml: `
      <p>O artigo tem como problema de pesquisa a contribuição dos fundamentos da Sociologia e da Sociologia Jurídica para o estudo da Ciência Jurídica. Sua tese é que a Sociologia geral, a Sociologia Jurídica e a Ciência Jurídica são instrumentos indispensáveis à formação humanística de quem elabora ou aplica a norma. Cada figura do mundo jurídico tira daí algo diferente.</p>
      <h3>Para o legislador</h3>
      <p>Cabe ao legislador coletar as informações necessárias para elaborar normas que correspondam aos anseios da sociedade. Sem sintonia entre a norma e as peculiaridades da comunidade destinatária, a vigência da lei fica destituída de plena legitimidade.</p>
      <h3>Para quem aplica a norma</h3>
      <p>As decisões judiciais e administrativas ganham legitimidade e valorização quando quem decide acompanha as evoluções sociais do grupo que é alvo da jurisdição. O conhecimento dos fatos sociais acrescenta qualidade à formação humanística do julgador. Na concretização do direito, a orientação sociológica pode ajudar na investigação da situação de fato (por exemplo, pesquisas de opinião para apurar o valor comercial de um produto numa disputa de propriedade industrial) e na obtenção da norma aplicável, incorporando ao sistema jurídico o conhecimento das ciências sociais. O artigo ressalva que nem sempre a orientação sociológica é a adequada: dúvidas podem ser esclarecidas por outros meios de interpretação, como o gramatical, o histórico e o sistemático.</p>
      <h3>Para o advogado e o estudante</h3>
      <p>Na passagem de Cavalieri Filho reproduzida no artigo, a Sociologia Jurídica proporciona uma visão mais ampla e real do fenômeno jurídico: o Direito não é somente um conjunto de normas estáticas e frias, mas também um fato, uma realidade social dinâmica em permanente evolução, à qual as normas devem se ajustar, sob pena de perderem a finalidade e se tornarem ineficazes e obsoletas.</p>
      <h3>Para as políticas públicas</h3>
      <p>Estudos, pesquisas e dados estatísticos de sociólogos jurídicos sobre as causas, as consequências e as estratégias de combate à criminalidade são úteis e devem constar das estratégias de políticas públicas.</p>
      <h3>Outras ideias do artigo</h3>
      <ul>
        <li>A Sociologia geral nasce em contexto de Iluminismo e Revolução Industrial (bloco 1); a Jurídica tem autonomia reconhecida (bloco 2).</li>
        <li>A perspectiva de Luhmann, lembrada por Sabadell, vê o direito como subsistema da sociedade e propõe uma leitura externa, desvinculada da dogmática.</li>
        <li>O Direito é um fenômeno social e mostra os caracteres típicos do fato social; esse é o olhar que constitui o objeto próprio da Sociologia Jurídica.</li>
      </ul>
    `,
    resumo: [
      'Tese: Sociologia, Sociologia Jurídica e Ciência Jurídica são indispensáveis à formação humanística de quem elabora ou aplica a norma.',
      'Legislador: sem sintonia com a comunidade, a norma perde plena legitimidade.',
      'Julgador: decisões ganham legitimidade quando acompanham as evoluções sociais do grupo.',
      'Advogado e estudante: o Direito é também fato, realidade social dinâmica; norma que não se ajusta fica ineficaz e obsoleta.',
      'Ressalva: a orientação sociológica nem sempre é a adequada; outros métodos de interpretação também servem.'
    ],
    exemploHtml: `Ao redigir uma peça ou opinar sobre um projeto de lei, o profissional que conhece a realidade social do grupo atingido percebe se a norma tende a ser cumprida ou a ficar no papel, e isso influencia a estratégia e a fundamentação.`
  },
  {
    id: 'bloco-11',
    numero: 12,
    titulo: 'Narrativa e discurso no direito: polifonia e verdade no processo',
    fonte:
      'TRINDADE, André Karam; KARAM, Henriete. Polifonia e verdade nas narrativas processuais. Seqüência: Estudos Jurídicos e Políticos, Florianópolis, n. 80, p. 51-74, 2018. DOI 10.5007/2177-7055.2018v39n80p51.',
    corpoHtml: `
      <p>O artigo se insere no campo do <strong>Direito e Literatura</strong>, na vertente do "Direito como Literatura": olha o processo judicial em seu caráter narrativo e polifônico. Liga-se ao tema porque o direito, como a mídia, também se faz por narrativas e discursos, e o poder decide qual delas vale.</p>
      <h3>Polifonia e dialogismo (Bakhtin)</h3>
      <p>"Polifonia" vem da música: a combinação de duas ou mais vozes que preservam a sua própria melodia, em contraste com o canto monofônico (uma só voz). Bakhtin leva a noção à literatura. Para ele a linguagem é <strong>dialógica</strong>: todo discurso parte de alguém e se dirige a alguém, está cheio de palavras dos outros e é apenas um elo numa cadeia de discursos; o sentido não é fixado de uma vez, nasce da interação. No <strong>romance polifônico</strong> (o de Dostoiévski, na leitura de Bakhtin) há uma multiplicidade de vozes independentes, que convivem em pé de igualdade com a do narrador. No romance monofônico, ainda que apareçam várias vozes, só uma se faz ouvir: as outras servem para assegurar a hegemonia da voz do narrador.</p>
      <h3>O processo como narrativa polifônica</h3>
      <p>Todo processo judicial é uma narrativa que contém diversas narrativas: as das partes e de seus advogados, das testemunhas, dos peritos, e a do juiz. Como os fatos estão no passado, o processo é o modo de reconstruí-los, e isso só é possível por meio de relatos. Segundo os autores, o caráter polifônico do processo não vem apenas da multiplicidade de vozes, mas do <strong>contraditório e da isonomia</strong>: em tese, a igualdade garante que os discursos das partes convivam de modo paritário, com independência. Os autores citam também as deliberações do júri e as decisões colegiadas, em contraste com a monofonia da decisão monocrática, e lembram as vozes da mídia e das redes sociais que hoje chegam aos tribunais. Um ponto central: <strong>na narrativa judicial a polifonia se extingue com a sentença</strong>, porque o juiz proclama a verdade do caso.</p>
      <h3>A questão da verdade</h3>
      <p>Os autores discutem a concepção de verdade de Michele Taruffo, que atribui função central à prova e defende uma verdade como correspondência aos fatos: nas narrativas literárias vale a verdade do mundo fictício, nas processuais se exige a verdade empírica. Contrapõem a isso as noções de <strong>verossimilhança e coerência narrativa</strong>, em diálogo com a hermenêutica e com o "giro linguístico": se só temos relatos, a busca da verdade se dá no plano do discurso e depende da interpretação. Assim, a <strong>verdade judicial é a verdade possível</strong> (a "narrativa verossímil do processo", nas palavras de Cárcova). A coisa julgada, para eles, é uma das maiores ficções normativas, e a máxima <em>res iudicata pro veritate habetur</em> indica que ela deve ser tida por verdadeira.</p>
      <h3>A conclusão do artigo</h3>
      <p>O direito é uma prática social interpretativa. Como o processo serve à reconstrução narrativa dos fatos, é possível observar o estatuto ficcional do direito: na decisão há uma <strong>ficção assumida como verdade</strong>, e o grande problema é que, ao contrário da ficção literária, os efeitos da sentença se tornam imutáveis sob a coisa julgada e legitimam o exercício da violência estatal. No contexto brasileiro atual, a narrativa processual, embora formalmente polifônica, ainda se mostra <strong>materialmente monofônica</strong>.</p>
      <h3>Ponte com a Sociologia Jurídica</h3>
      <p>Narrativas da mídia moldam a percepção de segurança e podem levar à criação de leis, e a definição de quais discursos são aceitáveis pode refletir quem tem poder. O artigo leva a mesma pergunta ao tribunal: qual narrativa recebe o selo da coisa julgada, e quais vozes ficam de fora.</p>
    `,
    resumo: [
      'Polifonia (Bakhtin): várias vozes independentes e em pé de igualdade; dialogismo: todo discurso responde a outros discursos.',
      'O processo é uma narrativa que contém narrativas; contraditório e isonomia dão a ele caráter polifônico.',
      'A polifonia se extingue com a sentença, quando o juiz proclama a verdade do caso.',
      'Os autores contrapõem a verdade como correspondência (Taruffo) à verossimilhança e à coerência narrativa: a verdade judicial é a verdade possível.',
      'Conclusão: a decisão é uma ficção assumida como verdade; a coisa julgada torna a narrativa vencedora imutável.'
    ],
    exemploHtml: `Numa audiência, a versão da acusação, a da defesa, a das testemunhas e a de um perito competem entre si. Um estudante que entende a polifonia percebe que a sentença não "descobre" simplesmente a verdade: escolhe, entre os relatos, o que será tratado como verdadeiro, e por isso a fundamentação importa.`
  }
];
