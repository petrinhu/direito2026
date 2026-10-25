import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 1 a 10 do quiz de Sociologia Jurídica, Unidade 3: infância, mídias
 * e números. Todas de múltipla escolha com quatro alternativas. As explicações
 * descrevem o conteúdo de cada alternativa, sem indicar posição, porque o motor
 * embaralha as respostas a cada rodada.
 */
export const infancia: readonly PerguntaQuiz[] = [
  { id: 1, categoria: 'infancia-midias', enunciadoHtml: `Segundo Santos, como a criança aparece na comunicação digital atual?`, alternativasHtml: [
        `Como espectadora passiva, que apenas recebe a programação escolhida pelos adultos.`,
        `Como público exclusivo de conteúdo produzido por outras crianças, sem contato com adultos.`,
        `Como coprodutora de conteúdo, que também é consumidora ao mesmo tempo.`,
        `Como grupo que deixou de usar telas desde o período da pandemia de Covid-19.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Santos afirma que a criança passa a ser coprodutora de conteúdo ao mesmo tempo em que é consumidora. A ideia de espectadora passiva contradiz essa leitura. Produzir conteúdo só para outras crianças não aparece no texto. Deixar de usar telas na pandemia é o contrário do que a autora descreve, porque o uso se intensificou naquele período.` },

    { id: 2, categoria: 'infancia-midias', enunciadoHtml: `Qual é o percentual de crianças e adolescentes de 9 a 17 anos que estão ativamente nas redes sociais, segundo a pesquisa TICs Kids Online Brasil, citada por Santos?`, alternativasHtml: [
        `78%`,
        `72%`,
        `84%`,
        `50%`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `O número 78% vem da pesquisa TICs Kids Online Brasil, de 2021, citada por Santos. O número de 72% é o dado da pesquisa norte-americana, com pais de crianças de zero a oito anos, que considera a interação com tecnologias benéfica. O número de 84% se refere à população brasileira que usava a internet em janeiro de 2023, segundo Nóbrega. O número de 50% é a parcela de pais que citaram a privacidade do filho entre as preocupações.` },

    { id: 3, categoria: 'infancia-midias', enunciadoHtml: `Renata Othon, citada por Santos, descreve três modos de olhar a relação entre mídia e infância. Qual é o terceiro?`, alternativasHtml: [
        `Uma perspectiva crítica, apoiada na ideia de desaparecimento da infância.`,
        `Um olhar menos dicotômico, que entende as infâncias no plural e dá ênfase às mediações.`,
        `Um entendimento natural e intuitivo das crianças em relação às mídias.`,
        `Uma visão que nega qualquer papel das mídias na vida das crianças.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `O terceiro modo, na descrição de Othon, é o que propõe um olhar menos dicotômico, que busca entender o fenômeno social a partir de infâncias pluralizadas, com ênfase nas mediações. A perspectiva que fala em desaparecimento da infância pertence a outro dos três modos. O entendimento natural e intuitivo das crianças em relação às mídias também é um dos três, mas não é o terceiro. A visão que nega qualquer papel das mídias não aparece no texto.` },

    { id: 4, categoria: 'infancia-midias', enunciadoHtml: `Por que Santos, com base em Othon, afirma que as experiências das crianças com as mídias não são homogêneas?`, alternativasHtml: [
        `Porque as plataformas oferecem conteúdos diferentes apenas para meninos e meninas.`,
        `Porque a idade da criança não tem nenhuma influência sobre o modo como ela usa as telas.`,
        `Porque todas as crianças têm o mesmo acesso às tecnologias, em qualquer país.`,
        `Porque variam a estrutura familiar, as formas de acesso à internet e as condições socioeconômicas.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Othon, citada por Santos, lembra que a estrutura familiar, as formas de acesso à internet e as condições socioeconômicas variam muito, sobretudo entre territórios diferentes. A diferença de conteúdo por gênero não aparece no texto. A afirmação de que a idade não tem nenhuma influência não é a tese de Santos. Dizer que todas as crianças têm o mesmo acesso em qualquer país é o oposto do que a autora descreve, pois ela nota que muitas pesquisas são feitas em países com acesso mais igualitário.` },

    { id: 5, categoria: 'infancia-midias', enunciadoHtml: `Segundo Santos, o que Márcia Azen chama atenção ao tratar da exposição das crianças às tecnologias desde a mais tenra idade?`, alternativasHtml: [
        `Que a televisão continua sendo o principal meio de entretenimento infantil.`,
        `Que as escolas públicas devem proibir todo uso de computadores.`,
        `A complexidade das plataformas digitais e o impacto desse mercado no presente e no futuro das crianças.`,
        `A queda do número de crianças que usam a internet no Brasil.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Azen chama atenção para a complexidade das plataformas digitais e para o modo como esse mercado pode afetar o agora e o futuro das crianças, usuárias e consumidoras dos produtos das grandes empresas de tecnologia. A televisão como principal meio não aparece no texto. A proibição de computadores nas escolas não é tema do artigo. Uma queda no número de crianças usando a internet contradiz os dados de Santos, que mostram o contrário.` },

    { id: 6, categoria: 'infancia-midias', enunciadoHtml: `Na pesquisa Common Sense Media, citada por Santos, o que afirmaram cerca de 72% dos pais entrevistados?`, alternativasHtml: [
        `Que consideram a interação dos filhos com as tecnologias digitais benéfica e que não se preocupam com o tempo de tela.`,
        `Que proibem totalmente o uso de telas por crianças menores de nove anos.`,
        `Que nunca conheceram nenhum recurso de controle parental.`,
        `Que a interação com as tecnologias prejudica o desenvolvimento das crianças.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A pesquisa, feita nos Estados Unidos em 2020 com crianças de zero a oito anos, mostrou que cerca de 72% dos pais consideram a interação benéfica para o desenvolvimento e afirmam não se preocupar com o tempo de tela. A proibição total de telas para menores de nove anos não aparece no texto. Não conhecer nenhum recurso de controle parental é uma afirmação que o estudo não atribui a esse grupo. Dizer que a interação prejudica o desenvolvimento é o contrário do que o dado mostra.` },

    { id: 7, categoria: 'infancia-midias', enunciadoHtml: `Qual é a justificativa que Santos apresenta para o seu estudo?`, alternativasHtml: [
        `Comprovar que as redes sociais devem ser banidas para menores de 18 anos.`,
        `Entender os modos de uso das mídias digitais, para promover um uso consciente, seguro e crítico.`,
        `Medir a quantidade exata de horas que cada criança passa diante das telas.`,
        `Defender que os adultos deixem de se preocupar com a infância no mundo digital.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Santos justifica o trabalho pela necessidade de entender os modos de utilização dos dispositivos, para trabalhar o uso consciente e seguro, além de um olhar mais crítico diante das mídias digitais. Banir as redes para menores não é a tese da autora, que fala em uso consciente. Medir o tempo exato de tela também não é o objetivo: a pesquisa mapeia o quanto os pais conhecem as ferramentas e as utilizam. Defender que os adultos deixem de se preocupar é o oposto do que o texto propõe.` },

    { id: 8, categoria: 'infancia-midias', enunciadoHtml: `Segundo Nóbrega, qual foi o papel da tecnologia digital durante a pandemia de covid-19?`, alternativasHtml: [
        `Ela aumentou o isolamento social, porque afastou as pessoas do convívio físico.`,
        `Ela foi usada apenas por empresas, sem alcance para a vida das famílias.`,
        `Ela deixou de ser útil, porque os encontros passaram a acontecer somente por telefone.`,
        `Ela evitou um isolamento ainda maior, ao permitir acesso a livros, filmes e contato entre as pessoas.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Nóbrega diz que a tecnologia digital salvou as pessoas de um isolamento ainda maior durante a covid-19, ao permitir comunicação e acesso a conteúdos. A ideia de que ela aumentou o isolamento contradiz a autora. Dizer que só as empresas a usaram não aparece no texto, que trata da democratização da produção e do compartilhamento de conteúdo. Dizer que os encontros passaram a ser só por telefone também não está no texto, que fala em comunicação rápida, imediata e independente da distância.` },

    { id: 9, categoria: 'infancia-midias', enunciadoHtml: `Segundo o relatório citado por Nóbrega, qual era a rede social com mais usuários no Brasil?`, alternativasHtml: [
        `YouTube, com 142 milhões de usuários.`,
        `Instagram, com 113 milhões de usuários.`,
        `WhatsApp, com 169 milhões de usuários.`,
        `TikTok, com 82 milhões de usuários.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `O relatório, produzido em 2023 pela We Are Social em parceria com a Meltwater, coloca o WhatsApp em primeiro lugar, com 169 milhões de usuários. O YouTube vem em segundo, com 142 milhões. O Instagram aparece com 113 milhões. O TikTok, com 82 milhões, também está entre as sete redes da lista, mas numa posição mais baixa.` },

    { id: 10, categoria: 'infancia-midias', enunciadoHtml: `Segundo Nóbrega, quais redes crianças e adolescentes usam principalmente?`, alternativasHtml: [
        `WhatsApp, Facebook e LinkedIn.`,
        `TikTok, Instagram e YouTube.`,
        `Facebook Messenger, LinkedIn e WhatsApp.`,
        `Facebook, LinkedIn e Facebook Messenger.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Nóbrega afirma que crianças e adolescentes usam principalmente TikTok, Instagram e YouTube. As combinações com WhatsApp, Facebook, LinkedIn ou Facebook Messenger misturam redes que o texto não aponta como principais para esse público, embora elas apareçam na lista geral de redes mais usadas no Brasil.` }
];
