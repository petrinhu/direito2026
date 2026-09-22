import type { PerguntaQuiz } from '../../../tipos';

/**
 * As sessenta perguntas do quiz de Introdução ao Direito, 1a unidade:
 * 40 de categoria 'teoria', 10 de 'peticao' e 10 de 'fundamentos'.
 * Extraídas do piloto, com as citações de artigo marcadas para o balão
 * (ver docs/arquitetura.md, seção 12.1). fonteExtra marca a pergunta cuja
 * explicação se apoia em artigo fora dos quatro artigos-base do caso.
 */
export const quiz: readonly PerguntaQuiz[] = [
    { id: 1, categoria: 'teoria', enunciado: `Segundo H.L.A. Hart, em "O Conceito de Direito", por que a pergunta "o que é o Direito?" é considerada persistente e peculiar em comparação com perguntas como "o que é química?"?`, alternativas: [
        `Porque não existe nenhuma definição de Direito na história do pensamento jurídico.`,
        `Porque, ao contrário de ciências como a química, os próprios juristas não chegam a um consenso sobre o objeto do Direito, e a pergunta atravessa séculos de teoria sem resposta definitiva.`,
        `Porque o Direito é uma ciência exata, e por isso sua definição exige fórmulas matemáticas complexas.`,
        `Porque a pergunta só interessa a filósofos, sem nenhuma relevância prática para advogados.`
      ], correta: 1, fonteExtra: false, explicacao: `Hart parte da constatação de que, diferente de outras disciplinas com objeto relativamente pacífico, o Direito carrega uma perplexidade que atravessa a própria história da teoria jurídica. Isso não significa ausência de definições (existem várias), mas sim ausência de consenso sobre qual delas capta corretamente o fenômeno. Essa persistência da dúvida é o próprio ponto de partida do Capítulo I da obra. Fonte: HART, "O Conceito de Direito", Cap. I.` },

    { id: 2, categoria: 'teoria', enunciado: `O que Hart chama de "casos-padrão" (ou casos claros) de aplicação do conceito de Direito?`, alternativas: [
        `Situações em que ninguém duvida de que há Direito, como um contrato assinado ou uma lei aprovada pelo Congresso.`,
        `Casos julgados pela primeira vez por um tribunal, sem precedente anterior.`,
        `Casos exclusivamente do direito penal, por serem os mais estudados nas faculdades.`,
        `Casos hipotéticos criados apenas para fins didáticos, sem correspondência na realidade.`
      ], correta: 0, fonteExtra: false, explicacao: `Casos-padrão são aquelas situações em que a presença do fenômeno jurídico é incontroversa: uma lei votada pelo parlamento, uma sentença proferida por um juiz, um contrato validamente celebrado. Eles servem de contraste aos "casos de fronteira", em que a certeza sobre haver ou não Direito diminui. Essa distinção é o instrumento que Hart usa para mostrar por que a definição de Direito é mais difícil do que parece à primeira vista.` },

    { id: 3, categoria: 'teoria', enunciado: `Por que o direito internacional e o chamado "direito primitivo" são citados por Hart como exemplos de "casos de fronteira"?`, alternativas: [
        `Porque neles não existem regras de conduta reconhecidas pelo grupo social.`,
        `Porque faltam, nesses casos, elementos que os modelos usuais de Direito (como um legislador centralizado ou um aparato estatal de sanção) costumam exigir, tornando duvidosa a classificação como Direito nos mesmos termos de um Estado nacional.`,
        `Porque são objeto exclusivo do direito comparado, e não da teoria geral do Direito.`,
        `Porque foram abolidos pelas Nações Unidas e não têm mais aplicação prática.`
      ], correta: 1, fonteExtra: false, explicacao: `No direito internacional, existem tratados e cortes, mas não há um poder central com o mesmo tipo de aparato coercitivo de um Estado nacional. No direito primitivo, existem regras de conduta reconhecidas e sancionadas pelo grupo, mas falta um órgão legislativo formal. Esses exemplos mostram a Hart que definições rígidas de Direito, exigindo sempre legislador e sanção estatal centralizada, deixam de fora casos que muita gente ainda reconhece como jurídicos.` },

    { id: 4, categoria: 'teoria', enunciado: `Segundo a linha do tempo histórica apresentada na disciplina, o que caracteriza a Lei das XII Tábuas (cerca de 450 a.C.)?`, alternativas: [
        `Foi o primeiro código genuinamente moderno, com separação entre direito público e privado.`,
        `Foi uma compilação atribuída ao imperador Justiniano.`,
        `Buscou dar segurança jurídica e publicidade às normas romanas, limitando o poder de interpretação arbitrária dos patrícios.`,
        `Surgiu exclusivamente para regular o comércio entre Roma e povos estrangeiros.`
      ], correta: 2, fonteExtra: false, explicacao: `A Lei das XII Tábuas é um marco romano bem anterior ao Corpus Juris Civilis de Justiniano (527 d.C.). Sua importância está em tornar públicas e conhecidas as normas que antes ficavam sob controle quase exclusivo dos patrícios, reduzindo a margem de manipulação na aplicação do Direito e dando maior previsibilidade aos cidadãos romanos, inclusive os plebeus.` },

    { id: 5, categoria: 'teoria', enunciado: `O Corpus Juris Civilis, de Justiniano (527 d.C.), é relevante para a história do Direito principalmente porque:`, alternativas: [
        `Criou o sistema de common law, hoje adotado nos países de língua inglesa.`,
        `Consolidou e sistematizou o Direito Romano numa grande compilação, que viria a influenciar diretamente a tradição jurídica romanística (civil law).`,
        `Extinguiu definitivamente o Direito Canônico na Europa medieval.`,
        `Foi a primeira declaração de direitos humanos da história.`
      ], correta: 1, fonteExtra: false, explicacao: `O Corpus Juris Civilis reuniu, sistematizou e organizou séculos de Direito Romano numa obra de referência, servindo de base para a redescoberta do Direito Romano na Europa medieval e para a formação da tradição romanística (civil law), da qual o Brasil é herdeiro. Não tem relação com a origem da common law, que se desenvolveu de modo distinto na Inglaterra, a partir do costume e do precedente judicial.` },

    { id: 6, categoria: 'teoria', enunciado: `Qual das alternativas apresenta corretamente a ordem cronológica de dois marcos históricos estudados?`, alternativas: [
        `O Jusnaturalismo Contratualista (Hobbes, Locke, Rousseau) é anterior ao Direito Romano.`,
        `O Código de Hamurabi, na Babilônia, é anterior à Lei das XII Tábuas romana.`,
        `O Direito Canônico medieval antecede o Império Romano.`,
        `A Ascensão da Burguesia ocorre antes do período da Realeza romana.`
      ], correta: 1, fonteExtra: false, explicacao: `O Código de Hamurabi, de aproximadamente 1772 a.C., é um dos registros normativos mais antigos estudados, muito anterior à Lei das XII Tábuas romana (por volta de 450 a.C.). A sequência estudada segue, em linhas gerais: Babilônia, períodos romanos, Idade Média (Direito Canônico), Jusnaturalismo teológico, Ascensão da Burguesia e, por fim, o Jusnaturalismo Contratualista dos séculos XVII e XVIII.` },

    { id: 7, categoria: 'teoria', enunciado: `O que caracteriza o chamado Jusnaturalismo teológico, associado a São Tomás de Aquino, na linha do tempo histórica do Direito?`, alternativas: [
        `A ideia de que a lei humana deriva racionalmente de uma lei eterna, de origem divina, captada pela razão humana.`,
        `A defesa de que todo Direito nasce exclusivamente de um contrato firmado entre indivíduos livres e iguais.`,
        `A negação de qualquer relação entre Direito e religião.`,
        `A ideia de que o Direito deve ser definido apenas por critérios econômicos.`
      ], correta: 0, fonteExtra: false, explicacao: `No Jusnaturalismo teológico, o Direito humano encontra seu fundamento último numa ordem racional divina (a lei eterna), da qual a razão humana consegue extrair princípios de justiça válidos universalmente. É um jusnaturalismo de base religiosa, distinto do Jusnaturalismo Contratualista dos séculos XVII e XVIII (Hobbes, Locke, Rousseau), que fundamenta o Direito e o poder político num pacto entre os próprios indivíduos.` },

    { id: 8, categoria: 'teoria', enunciado: `A frase de Ihering, "a paz é o fim do Direito, a luta é o meio", expressa a ideia de que:`, alternativas: [
        `O Direito nasce naturalmente, sem qualquer disputa ou conflito de interesses.`,
        `O Direito é resultado de conquistas históricas obtidas por meio de disputas de interesse, tendo como objetivo final estabelecer a paz social.`,
        `A guerra é sempre o objetivo último de qualquer ordenamento jurídico.`,
        `A paz é incompatível com a existência do Direito.`
      ], correta: 1, fonteExtra: false, explicacao: `Para Ihering, direitos não são simplesmente dados ou concedidos: costumam ser conquistados por meio de disputas (a "luta pelo Direito"). O objetivo dessa luta, porém, não é o conflito permanente, mas alcançar uma ordem pacífica e estável, em que os interesses reconhecidos como direitos possam ser exercidos sem necessidade de disputa constante.` },

    { id: 9, categoria: 'teoria', enunciado: `Segundo Kelsen (Teoria Pura do Direito), qual é a principal crítica feita à ciência jurídica de sua época?`, alternativas: [
        `A de que os juristas usavam demasiada lógica formal e pouca intuição.`,
        `A de que a ciência jurídica se confundia com a psicologia, a sociologia, a ética e a política, perdendo a pureza de seu objeto próprio: a norma.`,
        `A de que faltavam leis escritas suficientes para regular a sociedade.`,
        `A de que o Direito deveria se basear exclusivamente em precedentes judiciais.`
      ], correta: 1, fonteExtra: false, explicacao: `Kelsen buscava depurar a ciência jurídica de elementos que, para ele, não lhe eram próprios: explicações psicológicas sobre por que as pessoas obedecem à lei, explicações sociológicas sobre efeitos sociais das normas, juízos éticos sobre sua justiça, e disputas políticas sobre seu conteúdo ideal. Seu objetivo era isolar a norma jurídica como objeto específico de uma ciência jurídica "pura".` },

    { id: 10, categoria: 'teoria', enunciado: `O princípio "ubi societas ibi jus" (onde há sociedade, há Direito) é ilustrado, na perspectiva de São Tomás de Aquino, por três situações de isolamento social. Assinale a alternativa que as identifica corretamente.`, alternativas: [
        `Mala fortuna (má sorte), corruptio naturae (natureza corrompida) e excellentia naturae (natureza excelente).`,
        `Guerra, fome e peste, as três causas clássicas de ruptura social.`,
        `Nascimento, casamento e morte, os três marcos rituais da vida em sociedade.`,
        `Cidade, campo e deserto, as três formas de organização espacial da sociedade.`
      ], correta: 0, fonteExtra: false, explicacao: `Mesmo os casos de isolamento social confirmam, em vez de contradizer, o princípio de que o normal é viver em sociedade. A má sorte (mala fortuna) isola alguém por circunstâncias alheias à vontade; a natureza corrompida (corruptio naturae) isola quem tem um vício antissocial; e a natureza excelente (excellentia naturae) isola quem é superior aos demais, como um sábio ou um santo eremita. Em todos os casos, a exceção confirma que o convívio social é a regra, e é nele que o Direito nasce.` },

    { id: 11, categoria: 'teoria', enunciado: `A linguagem jurídica, segundo a classificação estudada, organiza as condutas humanas em quatro categorias básicas. Quais são elas?`, alternativas: [
        `Legal, ilegal, moral e imoral.`,
        `Obrigatório fazer, proibido fazer, permitido fazer e permitido não fazer.`,
        `Justo, injusto, lícito e ilícito.`,
        `Constitucional, infraconstitucional, contratual e consuetudinário.`
      ], correta: 1, fonteExtra: false, explicacao: `Essa classificação organiza qualquer conduta possível em quatro categorias: há condutas que a norma obriga a fazer, condutas que proíbe, condutas que apenas permite fazer (facultativas) e condutas que permite não fazer (não obrigatórias). Essas categorias formam a estrutura básica de qualquer sistema de regras de conduta, jurídico ou não.` },

    { id: 12, categoria: 'teoria', enunciado: `Qual das alternativas exemplifica corretamente a distinção entre o papel do legislador e o papel do juiz?`, alternativas: [
        `O legislador cria a norma geral e abstrata; o juiz aplica essa norma ao caso concreto que lhe é apresentado.`,
        `O legislador e o juiz exercem exatamente a mesma função, apenas em momentos diferentes do processo.`,
        `O juiz cria a lei; o legislador apenas a aplica aos casos concretos.`,
        `Nem o legislador nem o juiz têm qualquer papel na resolução de conflitos sociais.`
      ], correta: 0, fonteExtra: false, explicacao: `A lei, tal como criada pelo legislador, é geral e abstrata: fala para todos, sem se referir a uma pessoa ou situação específica. Cabe ao juiz, diante de um caso concreto, interpretar essa norma geral e aplicá-la àquela situação particular, individualizando o comando abstrato da lei. Essa divisão de papéis é central para entender um sistema jurídico baseado em normas escritas.` },

    { id: 13, categoria: 'teoria', enunciado: `Segundo a classificação estudada (Paulo Nader), quais são as três espécies de fontes do Direito?`, alternativas: [
        `Fontes históricas, materiais e formais.`,
        `Fontes nacionais, internacionais e supranacionais.`,
        `Fontes escritas, orais e costumeiras.`,
        `Fontes civis, penais e administrativas.`
      ], correta: 0, fonteExtra: false, explicacao: `As fontes históricas são os documentos e registros do passado que revelam a origem de um instituto jurídico; as fontes materiais dizem respeito aos fatores sociais, econômicos e culturais que geram a necessidade de uma norma; e as fontes formais são os modos pelos quais o Direito se manifesta e se torna conhecido (a lei, o costume, a jurisprudência, os negócios jurídicos), podendo ser diretas ou indiretas.` },

    { id: 14, categoria: 'teoria', enunciado: `Para Miguel Reale, "toda fonte pressupõe uma estrutura de poder". Quais são as quatro fontes do Direito e as respectivas formas de poder a que correspondem?`, alternativas: [
        `Legislação (poder legislativo do Estado), jurisdição (poder judiciário), costume (poder social difuso) e negócio jurídico (poder da autonomia privada).`,
        `Executivo, Legislativo, Judiciário e Ministério Público.`,
        `Município, Estado, União e Distrito Federal.`,
        `Doutrina, jurisprudência, lei e princípios gerais de direito.`
      ], correta: 0, fonteExtra: false, explicacao: `Reale associa cada fonte formal a um tipo de poder social que a sustenta: a lei expressa o poder do órgão legislativo; a jurisdição expressa o poder dos tribunais ao decidir casos e formar precedentes; o costume expressa um poder social difuso, sem órgão centralizado; e o negócio jurídico expressa o poder da autonomia privada dos próprios particulares para regular suas relações.` },

    { id: 15, categoria: 'teoria', enunciado: `No Direito Romano, qual era a principal diferença entre o Jus Civile e o Jus Gentium?`, alternativas: [
        `O Jus Civile era aplicável apenas aos cidadãos romanos; o Jus Gentium regulava relações que envolviam estrangeiros.`,
        `O Jus Civile regulava apenas o direito penal; o Jus Gentium, apenas o direito civil.`,
        `O Jus Civile só existiu depois da queda do Império Romano.`,
        `O Jus Gentium era superior hierarquicamente ao Jus Civile e revogava suas disposições.`
      ], correta: 0, fonteExtra: false, explicacao: `O Jus Civile era o direito próprio dos cidadãos romanos, aplicado pelo pretor urbano. O Jus Gentium surgiu da necessidade prática de regular relações que envolviam estrangeiros (não cidadãos), sendo aplicado pelo pretor peregrino. Essa distinção reflete a preocupação romana em diferenciar o direito interno de Roma do direito aplicável às relações com outros povos.` },

    { id: 16, categoria: 'teoria', enunciado: `O Corpus Juris Civilis, compilação de Justiniano, é tradicionalmente dividido em quatro partes. Quais são elas?`, alternativas: [
        `Código, Digesto, Institutas e Novelas.`,
        `Constituição, Lei, Decreto e Portaria.`,
        `Doutrina, Jurisprudência, Costume e Lei.`,
        `Livro I, Livro II, Livro III e Livro IV, sem nomes próprios.`
      ], correta: 0, fonteExtra: false, explicacao: `O Código reunia as constituições imperiais; o Digesto (ou Pandectas) reunia as opiniões e comentários dos grandes jurisconsultos romanos; as Institutas serviam de manual introdutório de ensino do Direito; e as Novelas reuniam as leis promulgadas após a conclusão das partes anteriores. Juntas, essas quatro partes formam a grande compilação sistematizadora do Direito Romano.` },

    { id: 17, categoria: 'teoria', enunciado: `Qual é a diferença central entre a tradição do civil law (Direito Romanístico) e a tradição do common law?`, alternativas: [
        `No civil law, a lei escrita e codificada ocupa papel central; no common law, o precedente judicial e o costume têm papel central, embora hoje haja convergência crescente entre os dois sistemas.`,
        `O civil law não admite juízes; todas as decisões são tomadas por assembleias populares.`,
        `O common law é exclusivo de países que nunca tiveram contato com o Direito Romano.`,
        `Não existe nenhuma diferença relevante entre os dois sistemas atualmente.`
      ], correta: 0, fonteExtra: false, explicacao: `Países de tradição romanística, como o Brasil, organizam seu Direito principalmente em códigos e leis escritas, atribuindo à lei o papel central de fonte do Direito. Países de common law, como Inglaterra e Estados Unidos, atribuem papel central ao precedente judicial e ao costume. Reale observa uma convergência recente: o civil law valoriza mais os precedentes (súmulas vinculantes), e o common law legisla mais por estatutos escritos.` },

    { id: 18, categoria: 'teoria', enunciado: `De acordo com Tércio Sampaio Ferraz Jr., qual é a origem etimológica dos termos "zetética" e "dogmática"?`, alternativas: [
        `Zetética vem do grego zetein (perquirir, questionar); dogmática vem do grego dokein (ensinar, doutrinar).`,
        `Ambos os termos vêm do latim e significam, respectivamente, "lei" e "justiça".`,
        `Zetética vem do nome de um filósofo grego chamado Zeteu; dogmática vem do nome do filósofo Dogma.`,
        `Os dois termos são sinônimos e podem ser usados indistintamente.`
      ], correta: 0, fonteExtra: false, explicacao: `Ferraz Jr. explica que zetética deriva de zetein, que significa perquirir, buscar, questionar; dogmática deriva de dokein, que significa ensinar, doutrinar. Essa raiz etimológica já antecipa a diferença de enfoque entre os dois: um voltado a manter a pergunta aberta, outro voltado a fixar respostas para orientar a ação.` },

    { id: 19, categoria: 'teoria', enunciado: `Na anedota de Sócrates e o soldado, usada por Ferraz Jr. para ilustrar a distinção zetético/dogmático, qual enfoque cada personagem representa?`, alternativas: [
        `O soldado representa o enfoque zetético, pois questiona o significado de "ladrão"; Sócrates representa o dogmático, pois já sabe a resposta.`,
        `O soldado representa o enfoque dogmático, pois parte do significado de "ladrão" como uma questão já resolvida e quer agir; Sócrates representa o enfoque zetético, pois questiona essa premissa antes de agir.`,
        `Ambos representam o mesmo enfoque, apenas em momentos diferentes da perseguição.`,
        `A anedota não tem relação com a distinção entre zetética e dogmática.`
      ], correta: 1, fonteExtra: false, explicacao: `O soldado, ao gritar "agarre esse sujeito, ele é um ladrão", parte de uma premissa que considera resolvida e está preocupado com um problema de ação (capturar o suspeito). Sócrates, ao perguntar "o que você entende por ladrão?", problematiza essa premissa antes de aceitar qualquer curso de ação, revelando uma postura especulativa e questionadora, típica do enfoque zetético.` },

    { id: 20, categoria: 'teoria', enunciado: `Qual das alternativas descreve corretamente a diferença entre questões zetéticas e questões dogmáticas, segundo Ferraz Jr.?`, alternativas: [
        `Questões zetéticas têm função especulativa e são infinitas ("o que é algo?"); questões dogmáticas têm função diretiva e são finitas ("como decidir algo?").`,
        `Questões zetéticas são sempre mais simples que questões dogmáticas.`,
        `Questões dogmáticas nunca podem ser respondidas; questões zetéticas sempre têm resposta definitiva.`,
        `Não há diferença de função entre os dois tipos de questão.`
      ], correta: 0, fonteExtra: false, explicacao: `Nas questões zetéticas, o problema é configurado como um "ser" (o que é algo?), e a investigação permanece aberta, podendo ser retomada indefinidamente. Nas questões dogmáticas, o problema é configurado como um "dever ser" (como deve ser decidido?), voltado a possibilitar uma decisão prática, por isso tratadas como finitas: em algum momento uma resposta operacional precisa ser dada.` },

    { id: 21, categoria: 'teoria', enunciado: `O que Ferraz Jr. (a partir de Luhmann) chama de "princípio da inegabilidade dos pontos de partida"?`, alternativas: [
        `A ideia de que toda norma jurídica pode ser livremente contestada e substituída pelo intérprete.`,
        `A ideia de que, na dogmática, certas premissas (como o princípio da legalidade) são tratadas como vinculantes e não podem ser negadas no curso da argumentação, mesmo sendo, em si, resultado de uma decisão (e não de uma evidência).`,
        `A ideia de que todo ponto de partida de uma pesquisa científica deve ser comprovado experimentalmente.`,
        `A ideia de que juízes nunca podem interpretar a lei, apenas repeti-la literalmente.`
      ], correta: 1, fonteExtra: false, explicacao: `Na dogmática jurídica, certas premissas (como a validade da Constituição vigente ou o princípio da legalidade) funcionam como pontos de partida que não podem ser negados dentro da argumentação jurídica, ainda que sejam, em última análise, fruto de uma decisão política ou de um ato de poder, e não de uma verdade demonstrável. Isso distingue a dogmática, que "parte de dogmas", da zetética, que "parte de evidências" sempre sujeitas a revisão.` },

    { id: 22, categoria: 'teoria', enunciado: `O que Ferraz Jr. quer dizer com a expressão "dupla abstração" do saber dogmático?`, alternativas: [
        `Que o jurista trabalha com dois códigos ao mesmo tempo, o Código Civil e o Código Penal.`,
        `Que o saber dogmático tem por objeto um produto abstrato (as normas) e elabora, sobre ele, outro produto abstrato (as regras de interpretação das normas), afastando-se progressivamente da realidade social concreta.`,
        `Que a dogmática exige o dobro de tempo de estudo em comparação com a zetética.`,
        `Que as normas jurídicas sempre se referem a duas pessoas ao mesmo tempo, autor e réu.`
      ], correta: 1, fonteExtra: false, explicacao: `As normas jurídicas já são, em si, um produto abstrato da vida social. As regras de interpretação dessas normas constituem um segundo nível de abstração, incidindo sobre o primeiro. O jurista dogmático opera nesse segundo nível, o que traz o risco, apontado por Ferraz Jr., de distanciamento progressivo da realidade social que a norma pretende regular.` },

    { id: 23, categoria: 'teoria', enunciado: `No quadro classificatório da zetética jurídica apresentado por Ferraz Jr., a Sociologia Jurídica e a Antropologia Jurídica são exemplos de:`, alternativas: [
        `Zetética analítica pura.`,
        `Zetética empírica pura.`,
        `Disciplinas dogmáticas, como o Direito Civil.`,
        `Ramos do direito processual.`
      ], correta: 1, fonteExtra: false, explicacao: `A Sociologia Jurídica e a Antropologia Jurídica investigam o fenômeno jurídico no plano da experiência (empírico), sem finalidade imediata de aplicação técnica (por isso, "pura"). Distinguem-se da zetética analítica (plano lógico/formal, como a Filosofia do Direito) e das disciplinas dogmáticas (Direito Civil, Penal etc.), que partem de premissas inegáveis para decidir casos concretos.` },

    { id: 24, categoria: 'teoria', enunciado: `No exemplo da greve de funcionário público, discutido por Ferraz Jr., qual é a diferença entre a postura do sociólogo do direito e a postura do jurista dogmático?`, alternativas: [
        `O sociólogo trata a questão como aberta e pode até desprezar a lei vigente como ponto de partida para explicar o fenômeno social; o jurista dogmático permanece adstrito ao ordenamento vigente, propondo soluções sempre dentro dos seus quadros.`,
        `O sociólogo é obrigado a decidir o caso concreto; o jurista apenas observa o fenômeno sem se posicionar.`,
        `Ambos chegam sempre à mesma conclusão prática, pois usam o mesmo método.`,
        `O jurista dogmático ignora completamente a legislação em vigor.`
      ], correta: 0, fonteExtra: false, explicacao: `Para o sociólogo do direito, a legislação sobre a greve é apenas um dado entre outros, que pode até ser desprezado como ponto de partida para explicar o fenômeno social do movimento grevista. Já o jurista dogmático, por mais que se esmere em interpretações, não pode ignorar o ordenamento vigente: suas soluções para o caso concreto têm de ser propostas dentro dos limites da ordem jurídica estabelecida.` },

    { id: 25, categoria: 'teoria', enunciado: `Um advogado que vai defender a inconstitucionalidade de uma lei sobre união estável precisa, na prática, apenas do enfoque dogmático, sem qualquer necessidade de recorrer à zetética. Essa afirmação está:`, alternativas: [
        `Correta, pois basta conhecer o texto constitucional para construir qualquer tese jurídica.`,
        `Incorreta, pois, além de dominar a dogmática (Constituição vigente, precedentes do STF, legislação de família), o advogado normalmente também precisa mobilizar a zetética (o debate sociológico e filosófico sobre o que é "família" hoje) para construir uma tese consistente e persuasiva.`,
        `Correta, pois o enfoque zetético é proibido em peças processuais.`,
        `Incorreta, mas apenas porque toda tese de inconstitucionalidade dispensa qualquer enfoque dogmático.`
      ], correta: 1, fonteExtra: false, explicacao: `Este é um exemplo típico de situação em que os dois enfoques se complementam na prática profissional. A dogmática fornece o instrumental técnico-normativo indispensável, mas a construção de uma tese sobre um tema socialmente controverso frequentemente se apoia também em argumentos zetéticos sobre a evolução dos costumes e da própria noção de família. Isso mostra que, na prática do operador do direito, os dois enfoques nem sempre são excludentes.` },

    { id: 26, categoria: 'teoria', enunciado: `Calcular o prazo de uma contestação ou verificar se uma petição inicial preenche os requisitos formais do <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319 do CPC</button> são tarefas que, tipicamente, exigem:`, alternativas: [
        `Apenas o enfoque zetético, pois envolvem reflexão filosófica sobre a justiça do prazo processual.`,
        `Apenas o enfoque dogmático, já que se trata de aplicação mecânica de normas vigentes, sem qualquer reflexão especulativa necessária sobre o que é o Direito.`,
        `Um enfoque intermediário, misturando partes iguais de zetética e dogmática.`,
        `Nem zetética nem dogmática, pois são tarefas puramente administrativas, alheias ao Direito.`
      ], correta: 1, fonteExtra: false, explicacao: `Este é um exemplo de tarefa em que apenas a dogmática é necessária: o operador aplica a norma processual vigente diretamente ao caso, sem precisar reabrir uma discussão especulativa sobre a justiça ou a origem histórica dessas regras. É justamente esse tipo de situação cotidiana que compõe boa parte do trabalho técnico do operador do direito.` },

    { id: 27, categoria: 'teoria', enunciado: `Um pesquisador que investiga por que juízes de um mesmo tribunal decidem de forma diferente casos semelhantes, sem nenhum compromisso com uma solução prática imediata para algum processo, está atuando:`, alternativas: [
        `Exclusivamente no enfoque dogmático, pois qualquer estudo sobre decisões judiciais é, por definição, dogmático.`,
        `Exclusivamente no enfoque zetético, pois seu trabalho é especulativo e explicativo, sem a preocupação diretiva de decidir um caso concreto.`,
        `Necessariamente nos dois enfoques ao mesmo tempo, em igual proporção.`,
        `Fora do campo do conhecimento jurídico, já que pesquisa não é uma atividade jurídica reconhecida.`
      ], correta: 1, fonteExtra: false, explicacao: `Este é o terceiro tipo de situação de não exclusividade entre os enfoques: aqui, basta a zetética. O pesquisador não tem compromisso com a solução prática de um litígio específico; seu interesse é compreender e explicar um fenômeno, o que é tipicamente uma questão especulativa e infinita, características centrais do enfoque zetético.` },

    { id: 28, categoria: 'teoria', enunciado: `Segundo o critério de Tomásio para distinguir Direito e Moral, a Moral regula o:`, alternativas: [
        `Foro externo, isto é, apenas a conduta manifestada socialmente.`,
        `Foro interno, isto é, a consciência e a intenção do agente; o Direito, por sua vez, regularia o foro externo, a conduta manifestada.`,
        `Exclusivamente as relações comerciais entre particulares.`,
        `Somente as relações entre o Estado e o cidadão.`
      ], correta: 1, fonteExtra: false, explicacao: `Para Tomásio, a Moral se ocupa do foro interno, ou seja, da consciência, da intenção e do juízo de valor do próprio agente sobre sua conduta. O Direito se ocupa do foro externo, isto é, da conduta manifestada e observável socialmente, que pode ser objeto de exigência por outra pessoa. Essa distinção clássica é um dos pontos de partida históricos para diferenciar as duas ordens normativas.` },

    { id: 29, categoria: 'teoria', enunciado: `Quais são os critérios formais de Groppali para distinguir Direito e Moral?`, alternativas: [
        `Bilateralidade atributiva (Direito) x unilateralidade (Moral); exterioridade x interioridade; heteronomia (Direito) x autonomia (Moral); coercibilidade (Direito) x incoercibilidade (Moral).`,
        `Escrito (Direito) x oral (Moral); nacional (Direito) x internacional (Moral).`,
        `Antigo (Direito) x moderno (Moral); público (Direito) x privado (Moral).`,
        `Não existem critérios formais propostos por Groppali; a distinção seria apenas de conteúdo.`
      ], correta: 0, fonteExtra: false, explicacao: `Groppali propõe uma distinção baseada na forma das normas. A bilateralidade atributiva do Direito significa que a norma jurídica atribui a uma parte uma faculdade correspondente a um dever exigível de outra; a Moral é unilateral, pois o dever moral não gera, para outra pessoa, o direito de exigir seu cumprimento. A heteronomia do Direito se opõe à autonomia da Moral, e a coercibilidade do Direito se opõe à incoercibilidade da Moral.` },

    { id: 30, categoria: 'teoria', enunciado: `Na "teoria dos círculos", qual autor defende que Direito e Moral são círculos independentes, sem relação lógica necessária entre eles?`, alternativas: [
        `Bentham, com os círculos concêntricos.`,
        `Kelsen, com os círculos independentes.`,
        `Du Pasquier, com os círculos secantes.`,
        `Jellinek, com a teoria do mínimo ético.`
      ], correta: 1, fonteExtra: false, explicacao: `Bentham representa Direito e Moral como círculos concêntricos, em que a Moral (maior) engloba totalmente o Direito (menor). Du Pasquier os representa como círculos secantes, que se cruzam parcialmente. Kelsen, coerente com sua Teoria Pura, defende que os dois são círculos independentes, negando qualquer relação lógica necessária entre validade jurídica e validade moral. Jellinek propõe que o Direito é o "mínimo ético" exigido coercitivamente, ideia contraposta ao "máximo ético" de Schmoller.` },

    { id: 31, categoria: 'teoria', enunciado: `Quais são os caracteres apontados para as Regras de Trato Social (como as regras de etiqueta e cortesia)?`, alternativas: [
        `Bilateralidade atributiva, interioridade e autonomia, exatamente como a Moral.`,
        `Social, exterioridade, unilateralidade, heteronomia, incoercibilidade, sanção difusa e isonomia por classe/cultura.`,
        `Coercibilidade estatal e sanção prefixada em lei, exatamente como o Direito.`,
        `Nenhum caractere específico, pois se confundem totalmente com as normas jurídicas.`
      ], correta: 1, fonteExtra: false, explicacao: `As Regras de Trato Social têm natureza social e exterior (dizem respeito à conduta observável), mas são unilaterais e heterônomas (impostas pelo grupo, sem gerar um direito exigível de outra pessoa) e incoercíveis. Sua sanção é difusa (reprovação social, não uma pena jurídica), e variam conforme a classe social ou a cultura de cada grupo, ao contrário do Direito, que busca aplicar-se de modo geral dentro de seu âmbito de validade.` },

    { id: 32, categoria: 'teoria', enunciado: `No quadro comparativo final entre Direito, Moral, Regras de Trato Social e Preceitos Religiosos, qual das seguintes afirmações está correta?`, alternativas: [
        `O Direito é o único, entre os quatro, marcado pela coercibilidade estatal e pela sanção prefixada.`,
        `A Moral e o Direito são idênticos em todos os critérios comparativos.`,
        `As Regras de Trato Social são sempre coercíveis, tal como o Direito.`,
        `Os Preceitos Religiosos nunca guardam nenhuma semelhança com a Moral.`
      ], correta: 0, fonteExtra: false, explicacao: `O quadro comparativo cruza critérios como bilateralidade/unilateralidade, heteronomia/autonomia, exterioridade/interioridade e coercibilidade/incoercibilidade entre as quatro ordens normativas. O Direito se destaca por reunir bilateralidade atributiva, heteronomia, exterioridade e, sobretudo, coercibilidade estatal com sanção prefixada em lei, o que o distingue da Moral, das Regras de Trato Social e dos Preceitos Religiosos.` },

    { id: 33, categoria: 'teoria', enunciado: `Segundo Aristóteles, qual é a distinção entre physikón díkaion e nomikón díkaion?`, alternativas: [
        `O primeiro é o justo por natureza, universal; o segundo é o justo por convenção ou lei, variável conforme o povo.`,
        `Os dois termos são sinônimos, ambos significando "lei escrita".`,
        `O primeiro se refere ao direito penal; o segundo, ao direito civil.`,
        `O primeiro é uma invenção medieval, não uma categoria aristotélica.`
      ], correta: 0, fonteExtra: false, explicacao: `Essa distinção aristotélica, discutida por Bobbio, está na origem histórica da separação entre direito natural e direito positivo. O justo por natureza (physikón díkaion) teria validade universal, independentemente do que cada povo decidisse; o justo por convenção (nomikón díkaion) dependeria da lei e do costume de cada comunidade, podendo variar de um lugar para outro.` },

    { id: 34, categoria: 'teoria', enunciado: `Como São Tomás de Aquino organiza, em ordem, os diferentes tipos de lei em sua teoria?`, alternativas: [
        `Lex humana, lex naturalis, lex aeterna e lex divina, nessa ordem de importância crescente.`,
        `Lex aeterna (razão divina), da qual deriva a lex naturalis (participação da razão humana nessa ordem), que fundamenta a lex humana (leis positivas), complementada pela lex divina (revelação).`,
        `Apenas duas leis existem em Tomás de Aquino: a lei humana e a lei divina.`,
        `A lex humana é superior hierarquicamente à lex aeterna.`
      ], correta: 1, fonteExtra: false, explicacao: `Na estrutura tomista, a lex aeterna é a razão divina que governa o universo; a lex naturalis é a participação da criatura racional nessa lei eterna, captada pela razão; a lex humana são as leis positivas dos homens, que devem derivar racionalmente da lei natural; e a lex divina é o conteúdo revelado diretamente por Deus, como nas Escrituras.` },

    { id: 35, categoria: 'teoria', enunciado: `Para Grócio, qual é a diferença entre jus naturale e jus voluntarium?`, alternativas: [
        `O jus naturale é imutável e decorre da própria razão; o jus voluntarium decorre da vontade, seja de Deus, seja dos homens.`,
        `Os dois termos significam exatamente a mesma coisa em Grócio.`,
        `O jus naturale é uma criação exclusivamente romana, sem relação com Grócio.`,
        `O jus voluntarium é sempre superior ao jus naturale na hierarquia das normas.`
      ], correta: 0, fonteExtra: false, explicacao: `Grócio, um dos autores centrais do jusnaturalismo moderno, distingue um direito natural imutável, fundado na própria razão humana (jus naturale), de um direito voluntário, que depende de um ato de vontade, seja divina, seja humana (jus voluntarium). Essa distinção prepara terreno para o jusnaturalismo racionalista que floresceria nos séculos seguintes.` },

    { id: 36, categoria: 'teoria', enunciado: `O que a Declaração dos Direitos do Homem e do Cidadão (1789), em seus arts. 1º e 2º, afirma sobre os direitos naturais?`, alternativas: [
        `Que os direitos naturais são criados exclusivamente pelo Estado, sem existir antes dele.`,
        `Que os homens nascem e permanecem livres e iguais em direitos, e que a finalidade de toda associação política é a conservação dos direitos naturais e imprescritíveis do homem, como liberdade, propriedade e segurança.`,
        `Que apenas os cidadãos franceses possuem direitos naturais.`,
        `Que os direitos naturais deixaram de existir após a Revolução Francesa.`
      ], correta: 1, fonteExtra: false, explicacao: `A Declaração de 1789 é o momento em que a teoria jusnaturalista contratualista deixa de ser apenas uma construção filosófica e se converte em projeto político concreto. Seus arts. 1º e 2º afirmam a igualdade e liberdade natural dos homens e colocam a proteção desses direitos, anteriores e superiores ao próprio Estado, como finalidade de qualquer associação política.` },

    { id: 37, categoria: 'teoria', enunciado: `O Código Civil de Napoleão (1804) é apontado como um marco de consolidação de qual corrente?`, alternativas: [
        `Do jusnaturalismo teológico medieval.`,
        `Do juspositivismo, ao unificar e sistematizar o direito privado francês numa lei escrita, com forte influência do Corpus Juris Civilis romano.`,
        `Do direito consuetudinário puro, sem qualquer lei escrita.`,
        `Do direito canônico da Igreja Católica.`
      ], correta: 1, fonteExtra: false, explicacao: `O Código Civil de Napoleão representa a consolidação prática do positivismo jurídico: o direito privado passa a ser sistematizado numa lei escrita e organizada, deslocando o fundamento da validade jurídica da razão natural ou da tradição para a norma posta pelo Estado. Sua estrutura sofreu forte influência da tradição romanística, herdada em parte do Corpus Juris Civilis de Justiniano.` },

    { id: 38, categoria: 'teoria', enunciado: `Para Hobbes, a soberania, uma vez transferida ao soberano pelo pacto social, é:`, alternativas: [
        `Limitada, divisível e revogável a qualquer momento pelo povo.`,
        `Absoluta, indivisível e irrevogável.`,
        `Inexistente, pois Hobbes nega qualquer forma de soberania.`,
        `Exercida em conjunto e igualmente por todos os cidadãos, sem concentração de poder.`
      ], correta: 1, fonteExtra: false, explicacao: `Para Hobbes, autor do Leviatã, o estado de natureza é marcado por uma guerra de todos contra todos, e a única saída racional é os homens transferirem seus direitos a um soberano por meio de um pacto. Uma vez feita essa transferência, ela não pode ser desfeita: a soberania resultante é absoluta, indivisível e irrevogável, o que garante, na visão do autor, a paz e a ordem social.` },

    { id: 39, categoria: 'teoria', enunciado: `Qual é a principal diferença entre a concepção de soberania em Locke e em Hobbes?`, alternativas: [
        `Em Locke, o poder legislativo é supremo, mas não absoluto: permanece limitado pelo contrato social e pela lei natural, admitindo inclusive resistência a um governo que viole esse pacto; em Hobbes, a soberania do soberano é absoluta e não admite resistência.`,
        `Locke e Hobbes defendem exatamente a mesma concepção de soberania absoluta e irrevogável.`,
        `Locke nega qualquer forma de contrato social como origem do poder político.`,
        `Em Locke, a soberania pertence sempre a um único monarca hereditário, sem qualquer participação popular.`
      ], correta: 0, fonteExtra: false, explicacao: `Enquanto Hobbes concentra um poder absoluto e irrevogável nas mãos do soberano para evitar o retorno ao estado de guerra, Locke, considerado o pai do liberalismo político, limita esse poder pelo próprio contrato e pela lei natural, reconhecendo direitos básicos que o governo não pode violar, e admitindo que o povo resista a um governo que rompa esse pacto.` },

    { id: 40, categoria: 'teoria', enunciado: `Segundo Pachukanis, aplicando o método de Marx à teoria geral do direito, a totalidade concreta (sociedade, Estado, população) deve ser tratada, numa investigação científica, como:`, alternativas: [
        `O ponto de partida da investigação, do qual se deduzem todas as categorias jurídicas mais simples.`,
        `O resultado e o estágio final da pesquisa, que deve partir das formas mais simples (como a relação jurídica) e reconstruir progressivamente o concreto, e não o contrário.`,
        `Um dado irrelevante para a teoria geral do direito.`,
        `Uma categoria puramente jurídica, sem qualquer relação com a economia ou a história.`
      ], correta: 1, fonteExtra: false, explicacao: `Pachukanis retoma o método descrito por Marx nos Grundrisse: em vez de partir de uma totalidade concreta vaga e indivisa, a investigação científica deve partir de categorias mais simples (no caso do direito, a relação jurídica) e, só progressivamente, reconstruir o concreto como uma totalidade rica de determinações. Por isso este bloco é sinalizado como aprofundamento: é um debate metodológico mais avançado, mas presente no material da disciplina.` },

    { id: 41, categoria: 'peticao', enunciado: `Segundo a estrutura de petição ensinada pelo professor, qual é a ordem correta das seções de uma petição inicial?`, alternativas: [
        `Fatos, Endereçamento, Qualificação, Direito, Pedidos, Encerramento.`,
        `Endereçamento, Qualificação (dados do autor, tipo da ação, dados do réu), Fatos do caso, Fundamento jurídico (Direito), Pedidos, Encerramento.`,
        `Pedidos, Direito, Fatos, Qualificação, Endereçamento, Encerramento.`,
        `Encerramento, Endereçamento, Direito, Fatos, Qualificação, Pedidos.`
      ], correta: 1, fonteExtra: false, explicacao: `Essa é a estrutura básica ensinada em sala, correspondente à lógica de qualquer petição inicial: primeiro identifica-se a quem a peça se dirige (Endereçamento), depois quem são as partes (Qualificação), em seguida o que aconteceu (Fatos), por que isso gera um direito (Direito), o que se pede (Pedidos) e, por fim, os elementos formais de fechamento (Encerramento).` },

    { id: 42, categoria: 'peticao', enunciado: `De acordo com o <button type="button" class="citacao" data-dispositivo="cpc-319-ii" aria-expanded="false" aria-controls="balao-dispositivo">art. 319, II, do CPC</button>, quais dados devem constar na qualificação do autor e do réu?`, alternativas: [
        `Apenas o nome completo das partes.`,
        `Nome, prenome, estado civil, existência de união estável, profissão, número de inscrição no CPF ou CNPJ, endereço eletrônico, domicílio e residência do autor e do réu.`,
        `Apenas o número de telefone e o endereço de e-mail das partes.`,
        `A qualificação da parte é dispensável e pode ser omitida da petição inicial.`
      ], correta: 1, fonteExtra: false, explicacao: `O <button type="button" class="citacao" data-dispositivo="cpc-319-ii" aria-expanded="false" aria-controls="balao-dispositivo">inciso II do art. 319 do CPC</button> detalha os elementos que compõem a qualificação completa de autor e réu: nome, estado civil, existência de união estável, profissão, CPF (ou CNPJ), endereço eletrônico e domicílio/residência. É por isso que, no modelo estudado, todos esses dados aparecem, mesmo que preenchidos apenas com reticências por falta de informação real do caso.` },

    { id: 43, categoria: 'peticao', enunciado: `Na petição estudada (caso Juliana Silva x Renata Rocha), por que o número da vara aparece em reticências no Endereçamento?`, alternativas: [
        `Porque o professor esqueceu de preencher esse dado.`,
        `Porque o número da vara só é conhecido após a distribuição do processo, sendo, portanto, um dado que não pode ser inventado ou antecipado ao redigir a peça.`,
        `Porque petições nunca precisam indicar a vara a que se dirigem.`,
        `Porque o caso não tramita perante nenhuma vara cível.`
      ], correta: 1, fonteExtra: false, explicacao: `O endereçamento indica o juízo a que a petição é dirigida, mas o número específico da vara só é definido pelo sistema do tribunal no momento da distribuição do processo, algo que só ocorre depois do protocolo da peça. Por isso, o modelo mantém esse dado em aberto, e essa lógica deve ser seguida por qualquer estudante ao redigir sua própria peça: nunca inventar um número de vara.` },

    { id: 44, categoria: 'peticao', enunciado: `Qual é a ação processual nomeada na petição do caso estudado?`, alternativas: [
        `Ação de Indenização por Danos Morais.`,
        `Ação de Indenização por Danos Materiais.`,
        `Ação de Despejo por Falta de Pagamento.`,
        `Ação de Reintegração de Posse.`
      ], correta: 1, fonteExtra: false, explicacao: `Como o caso trata de prejuízos patrimoniais (danos ao sofá, ao tapete persa e aos eletrônicos, causados pela infiltração), a ação nomeada no modelo é a Ação de Indenização por Danos Materiais, e não uma ação de danos morais, que exigiria discutir abalo à honra ou à imagem, o que não é o foco central do caso conforme narrado.` },

    { id: 45, categoria: 'peticao', enunciado: `Segundo as "cinco perguntas de toda petição" ensinadas pelo professor, qual delas corresponde à tarefa de "procure a legislação aplicável a cada fato"?`, alternativas: [
        `A quinta pergunta, relacionada aos pedidos.`,
        `A primeira pergunta, que orienta o operador a identificar, desde o início, qual norma incide sobre cada fato narrado.`,
        `A terceira pergunta, sobre quem é autor e quem é réu.`,
        `Essa tarefa não faz parte das cinco perguntas ensinadas.`
      ], correta: 1, fonteExtra: false, explicacao: `As cinco perguntas ensinadas são, na ordem: (1) procurar a legislação aplicável a cada fato; (2) contar os fatos em ordem cronológica; (3) identificar quem é autor e quem é réu; (4) identificar documentos e demais provas; (5) transformar o problema em pedidos concretos. A primeira é justamente o passo de mapear, desde o início, qual base legal vai sustentar cada fato relevante.` },

    { id: 46, categoria: 'peticao', enunciado: `Qual das alternativas corresponde corretamente à quinta e última das "cinco perguntas de toda petição"?`, alternativas: [
        `Contar os fatos em ordem cronológica.`,
        `Identificar documentos e demais provas.`,
        `Transformar o problema em pedidos concretos.`,
        `Procurar a legislação aplicável a cada fato.`
      ], correta: 2, fonteExtra: false, explicacao: `Depois de identificar a legislação aplicável, narrar os fatos cronologicamente, qualificar as partes e levantar as provas, o último passo é converter tudo isso em pedidos concretos e determinados na seção "Dos Pedidos", que é justamente o que o juiz vai analisar e, se procedente, conceder na sentença.` },

    { id: 47, categoria: 'peticao', enunciado: `Segundo o modelo estudado, qual é a função do "Valor da Causa" dentro da estrutura da petição inicial?`, alternativas: [
        `É um dado dispensável, que nunca precisa constar na petição.`,
        `É um requisito exigido pelo <button type="button" class="citacao" data-dispositivo="cpc-319-v" aria-expanded="false" aria-controls="balao-dispositivo">art. 319, V, do CPC</button>, que atribui um valor monetário à demanda, ainda que, no caso estudado, esse valor permaneça em aberto por falta de dado concreto do caso.`,
        `É o valor pago pelo réu ao autor antes do início do processo.`,
        `É o valor dos honorários do advogado, sempre fixado antecipadamente na petição.`
      ], correta: 1, fonteExtra: false, explicacao: `O <button type="button" class="citacao" data-dispositivo="cpc-319-v" aria-expanded="false" aria-controls="balao-dispositivo">art. 319, V, do CPC</button> exige que toda petição inicial indique o valor da causa, requisito com efeitos processuais relevantes. No modelo estudado, esse valor aparece com reticências, pois o caso não fornece o montante exato dos danos materiais, e a instrução da atividade é clara: não inventar dados que o enunciado não forneceu.` },

    { id: 48, categoria: 'peticao', enunciado: `Qual das alternativas descreve corretamente o conteúdo típico da seção "Dos Fatos" de uma petição inicial, segundo o modelo estudado?`, alternativas: [
        `Deve conter toda a fundamentação jurídica detalhada do caso, artigo por artigo.`,
        `Deve narrar de forma sucinta e cronológica o que aconteceu, sem ainda entrar na discussão jurídica, que fica reservada para "Do Direito".`,
        `Deve conter apenas os pedidos que serão feitos ao final da petição.`,
        `É a seção onde se qualifica o autor e o réu, com todos os seus dados pessoais.`
      ], correta: 1, fonteExtra: false, explicacao: `"Dos Fatos" é a seção narrativa da petição: conta, de forma objetiva e cronológica, o que efetivamente aconteceu, sem ainda desenvolver os argumentos jurídicos. É em "Do Direito" que esses fatos serão conectados às normas aplicáveis, e nos "Pedidos" que se converterá tudo em uma pretensão concreta.` },

    { id: 49, categoria: 'peticao', enunciado: `Segundo o modelo de petição estudado, qual expressão de fechamento é utilizada antes da indicação de local, data e assinatura do advogado?`, alternativas: [
        `"Nada mais havendo a declarar, dou por encerrado o presente termo."`,
        `"Termos em que pede e espera deferimento."`,
        `"Sem mais para o momento, subscrevo-me."`,
        `"Ante o exposto, requer-se o arquivamento do processo."`
      ], correta: 1, fonteExtra: false, explicacao: `"Termos em que pede e espera deferimento" é a fórmula de encerramento clássica usada em petições, imediatamente antes da indicação do local e data e da assinatura do advogado com seu número de inscrição na OAB. É um elemento formal padronizado, presente também no modelo do caso Juliana Silva x Renata Rocha.` },

    { id: 50, categoria: 'peticao', enunciado: `Por que, segundo a nota do professor no material "para não esquecer", o nível de exigência esperado no 1º período em relação à redação de uma petição deve ser "pouca discussão doutrinária, bastante" aplicação prática?`, alternativas: [
        `Porque, no início do curso, o foco é desenvolver a habilidade de identificar corretamente a legislação aplicável e estruturar a peça de forma organizada, deixando debates doutrinários mais aprofundados para etapas posteriores da formação.`,
        `Porque a doutrina jurídica é irrelevante para qualquer etapa da formação em Direito.`,
        `Porque não é permitido, em nenhuma hipótese, citar doutrina numa petição.`,
        `Porque o professor não avalia a fundamentação jurídica da petição, apenas sua formatação.`
      ], correta: 0, fonteExtra: false, explicacao: `A observação do professor reconhece que, no primeiro período, o estudante ainda está construindo o domínio básico da estrutura processual e da aplicação da lei aos fatos. Por isso, o nível adequado de exigência prioriza a aplicação prática e organizada da legislação já indicada, em vez de exigir um aprofundamento doutrinário próprio de etapas mais avançadas do curso.` },

    { id: 51, categoria: 'fundamentos', fonteExtra: false, enunciado: `Segundo o <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319 do CPC</button>, quais elementos, entre outros, a petição inicial deve indicar?`, alternativas: [
        `O juízo a que é dirigida, os dados de qualificação das partes, o fato e os fundamentos jurídicos do pedido, o pedido, o valor da causa e as provas.`,
        `Apenas o nome do juiz responsável pelo processo.`,
        `Somente o valor da causa, sem necessidade de descrever fatos ou fundamentos.`,
        `Exclusivamente as provas que serão produzidas em audiência.`
      ], correta: 0, explicacao: `O <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319 do CPC</button> lista, em seus incisos, os elementos estruturais de qualquer petição inicial: o juízo a que se dirige (I), a qualificação completa das partes (II), o fato e os fundamentos jurídicos do pedido (III), o pedido com suas especificações (IV), o valor da causa (V) e as provas com que se pretende demonstrar a verdade dos fatos alegados (VI). Esses elementos formam o esqueleto básico estudado na disciplina.` },

    { id: 52, categoria: 'fundamentos', fonteExtra: false, enunciado: `O <button type="button" class="citacao" data-dispositivo="cpc-319-ii" aria-expanded="false" aria-controls="balao-dispositivo">inciso II do art. 319 do CPC</button> exige, entre os dados de qualificação das partes, a indicação de:`, alternativas: [
        `O endereço eletrônico do autor e do réu.`,
        `A senha de acesso ao processo eletrônico das partes.`,
        `O histórico escolar das partes.`,
        `O número de processos anteriores em que a parte já figurou.`
      ], correta: 0, explicacao: `Entre os dados exigidos pelo inciso II estão o nome, o prenome, o estado civil, a existência de união estável, a profissão, o CPF ou CNPJ, o endereço eletrônico e o domicílio/residência do autor e do réu. A exigência do endereço eletrônico reflete a crescente digitalização da comunicação processual, e é um dos itens que aparecem, no modelo estudado, em reticências por falta de dado real.` },

    { id: 53, categoria: 'fundamentos', fonteExtra: true, enunciado: `O <button type="button" class="citacao" data-dispositivo="cpc-320" aria-expanded="false" aria-controls="balao-dispositivo">art. 320 do CPC</button>, artigo correlato ao <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319</button> (que trata dos requisitos da petição inicial), estabelece que:`, alternativas: [
        `A petição inicial será instruída com os documentos indispensáveis à propositura da ação.`,
        `A petição inicial pode ser apresentada oralmente perante o cartório, sem forma escrita.`,
        `O réu deve apresentar, junto com a petição inicial, sua defesa antecipada.`,
        `O valor da causa é sempre fixado pelo juiz, nunca pelo autor.`
      ], correta: 0, explicacao: `Atenção: o <button type="button" class="citacao" data-dispositivo="cpc-320" aria-expanded="false" aria-controls="balao-dispositivo">art. 320 do CPC</button> não é um dos quatro artigos-base do material da disciplina (<button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319 do CPC</button>, art. 5º, <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">V</button> e <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">X</button>, da CF, e arts. <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">186</button> e <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">927</button> do CC). Ele foi incluído aqui como artigo correlato ao <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319</button>, por tratar do mesmo tema, exigindo que a peça venha acompanhada dos documentos indispensáveis à demonstração mínima da pretensão (no caso estudado, os orçamentos e comprovantes dos danos). Este artigo é complementar, não está nos materiais-base da disciplina, foi acrescentado para aprofundar o tema.` },

    { id: 54, categoria: 'fundamentos', fonteExtra: false, enunciado: `O <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">art. 5º, inciso V, da Constituição Federal</button> assegura:`, alternativas: [
        `O direito de resposta, proporcional ao agravo, além da indenização por dano material, moral ou à imagem.`,
        `O direito de greve para todos os trabalhadores, sem exceção.`,
        `A gratuidade total de qualquer processo judicial.`,
        `O direito à eleição direta para todos os cargos públicos.`
      ], correta: 0, explicacao: `O <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">inciso V do art. 5º da CF</button> garante, entre outras coisas, a indenização por dano material, moral ou à imagem, servindo, no caso estudado, como reforço constitucional ao dever de reparar os prejuízos patrimoniais sofridos por Juliana Silva. Ele é citado, junto com o <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">inciso X</button>, já no cabeçalho da petição, como parte do fundamento jurídico invocado pela autora.` },

    { id: 55, categoria: 'fundamentos', fonteExtra: false, enunciado: `O <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">art. 5º, inciso X, da Constituição Federal</button> declara invioláveis:`, alternativas: [
        `A intimidade, a vida privada, a honra e a imagem das pessoas, assegurado o direito a indenização pelo dano material ou moral decorrente de sua violação.`,
        `Apenas o domicílio, sem qualquer referência a dados pessoais.`,
        `Exclusivamente a liberdade de expressão religiosa.`,
        `Somente os dados bancários das pessoas físicas.`
      ], correta: 0, explicacao: `O <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">inciso X do art. 5º da CF</button> protege a intimidade, a vida privada, a honra e a imagem das pessoas, garantindo indenização pelo dano material ou moral decorrente de sua violação. No caso estudado, embora o dano seja material, esse dispositivo é citado como reforço geral do dever constitucional de indenizar danos decorrentes de violação a direitos, ao lado do <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">inciso V</button>.` },

    { id: 56, categoria: 'fundamentos', fonteExtra: true, enunciado: `O <button type="button" class="citacao" data-dispositivo="cf-5-xxxv" aria-expanded="false" aria-controls="balao-dispositivo">art. 5º, inciso XXXV, da Constituição Federal</button>, correlato aos incisos <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">V</button> e <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">X</button> estudados no caso, estabelece o chamado princípio da inafastabilidade da jurisdição, segundo o qual:`, alternativas: [
        `A lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito.`,
        `Nenhum cidadão pode recorrer ao Poder Judiciário sem autorização prévia do Poder Executivo.`,
        `O Poder Judiciário só pode julgar causas de valor superior a determinado teto.`,
        `A Constituição Federal proíbe qualquer revisão judicial de atos administrativos.`
      ], correta: 0, explicacao: `Atenção: este inciso não é um dos quatro artigos-base do material da disciplina, mas foi incluído como correlato ao art. 5º já estudado, por tratar do mesmo dispositivo constitucional. Ele garante que qualquer lesão ou ameaça a direito, como os danos sofridos pela autora no caso estudado, possa ser levada à apreciação do Poder Judiciário, sendo o fundamento último do próprio direito de ajuizar a ação. Este artigo é complementar, não está nos materiais-base da disciplina, foi acrescentado para aprofundar o tema.` },

    { id: 57, categoria: 'fundamentos', fonteExtra: false, enunciado: `O <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186 do Código Civil</button> define ato ilícito como a conduta de quem:`, alternativas: [
        `Por ação ou omissão voluntária, negligência ou imprudência, viola direito e causa dano a outrem, ainda que exclusivamente moral.`,
        `Descumpre um contrato verbal sem testemunhas.`,
        `Pratica qualquer ato sem autorização judicial prévia.`,
        `Deixa de pagar tributos dentro do prazo legal.`
      ], correta: 0, explicacao: `O <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186 do CC</button> é a base da responsabilidade civil subjetiva no Direito brasileiro: comete ato ilícito quem, por ação ou omissão voluntária, negligência ou imprudência, viola direito e causa dano a outrem. No caso estudado, a omissão negligente da ré na manutenção da tubulação de seu apartamento, que causou a infiltração no imóvel da autora, configura exatamente esse tipo de conduta ilícita.` },

    { id: 58, categoria: 'fundamentos', fonteExtra: true, enunciado: `O <button type="button" class="citacao" data-dispositivo="cc-187" aria-expanded="false" aria-controls="balao-dispositivo">art. 187 do Código Civil</button>, correlato ao <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186</button> estudado no caso, trata do chamado abuso de direito, considerando também ato ilícito a conduta de quem:`, alternativas: [
        `Ao exercer um direito, excede manifestamente os limites impostos pelo seu fim econômico ou social, pela boa-fé ou pelos bons costumes.`,
        `Exerce qualquer direito subjetivo, mesmo dentro dos limites legais.`,
        `Recusa-se a celebrar contrato com qualquer pessoa, sem exceção.`,
        `Denuncia à autoridade policial um crime que presenciou.`
      ], correta: 0, explicacao: `Atenção: este artigo não é um dos quatro artigos-base do material da disciplina, mas foi incluído como correlato ao <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186</button>, por também tratar de ato ilícito no Código Civil. Diferente do <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186</button> (violação de direito e dano por ação, omissão, negligência ou imprudência), o <button type="button" class="citacao" data-dispositivo="cc-187" aria-expanded="false" aria-controls="balao-dispositivo">art. 187</button> trata do abuso no exercício de um direito legítimo, quando esse exercício excede manifestamente seus limites econômicos, sociais, de boa-fé ou de bons costumes. Este artigo é complementar, não está nos materiais-base da disciplina, foi acrescentado para aprofundar o tema.` },

    { id: 59, categoria: 'fundamentos', fonteExtra: false, enunciado: `O <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">art. 927 do Código Civil</button> estabelece que aquele que, por ato ilícito, causar dano a outrem:`, alternativas: [
        `Fica obrigado a repará-lo.`,
        `Deve ser processado criminalmente, independentemente da vontade da vítima.`,
        `Fica isento de qualquer responsabilidade se agir de boa-fé.`,
        `Só responde civilmente se o dano for superior a determinado valor mínimo fixado em lei.`
      ], correta: 0, explicacao: `O <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">art. 927 do CC</button> impõe a consequência jurídica do ato ilícito descrito no <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186</button>: quem causa dano a outrem por ato ilícito fica obrigado a repará-lo. No caso estudado, configurado o ato ilícito da ré e demonstrado o nexo causal com os danos sofridos pela autora, surge o dever de reparar previsto neste artigo, núcleo do pedido de indenização por danos materiais.` },

    { id: 60, categoria: 'fundamentos', fonteExtra: true, enunciado: `O <button type="button" class="citacao" data-dispositivo="cc-944" aria-expanded="false" aria-controls="balao-dispositivo">art. 944 do Código Civil</button>, correlato ao <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">art. 927</button> estudado no caso, estabelece que:`, alternativas: [
        `A indenização mede-se pela extensão do dano, podendo o juiz reduzi-la equitativamente se houver excessiva desproporção entre a gravidade da culpa e o dano.`,
        `A indenização deve ser sempre fixada no dobro do valor do dano comprovado.`,
        `Não cabe indenização quando o dano for causado por omissão, apenas por ação direta.`,
        `A indenização por dano material está limitada a um teto fixo estabelecido em lei federal.`
      ], correta: 0, explicacao: `Atenção: este artigo não é um dos quatro artigos-base do material da disciplina, mas foi incluído como correlato ao <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">art. 927</button>, por tratar da medida da indenização decorrente do dever de reparar. Estabelece que a indenização deve corresponder à extensão do dano efetivamente sofrido, com possibilidade excepcional de redução equitativa pelo juiz em caso de desproporção entre a culpa e o dano. Este artigo é complementar, não está nos materiais-base da disciplina, foi acrescentado para aprofundar o tema.` }
];
