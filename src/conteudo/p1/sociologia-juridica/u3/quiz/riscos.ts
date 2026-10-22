import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 11 a 20 do quiz de Sociologia Jurídica, Unidade 3: riscos e crimes
 * no ambiente digital. Todas de múltipla escolha com quatro alternativas. As
 * explicações descrevem o conteúdo de cada alternativa, sem indicar posição,
 * porque o motor embaralha as respostas a cada rodada.
 */
export const riscos: readonly PerguntaQuiz[] = [
  { id: 11, categoria: 'riscos-crimes', enunciadoHtml: `Pelo modelo de Hasebrink et al. (2009), citado por Santos, o que caracteriza o risco de conteúdo?`, alternativasHtml: [
        `A criança tem a privacidade violada e comercializada, ou sofre bullying ou assédio online.`,
        `A criança, como receptora, recebe conteúdo publicitário ou spam com mensagens inapropriadas.`,
        `A criança compartilha imagens pornográficas na rede ou faz bullying com os colegas.`,
        `A criança é monitorada pelos pais por meio de aplicativos de controle.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `No risco de conteúdo, a criança é receptora: recebe conteúdo publicitário ou spam com mensagens inapropriadas. A violação de privacidade e o assédio pertencem ao risco de contato. O compartilhamento de imagens pornográficas e o bullying praticado pela criança pertencem ao risco de conduta. O monitoramento pelos pais não é classificado como risco no texto.` },

    { id: 12, categoria: 'riscos-crimes', enunciadoHtml: `Qual é a descrição do risco de contato, segundo Santos?`, alternativasHtml: [
        `A criança recebe mensagens publicitárias sem nenhum conteúdo inapropriado.`,
        `A criança pratica atos de violência online, como fazer bullying com seus pares.`,
        `A criança é usada como exemplo em anúncios de produtos infantis.`,
        `A criança, como receptora-participante, tem a privacidade violada e comercializada, ou sofre bullying ou assédio online.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `No risco de contato, a criança está no papel de receptora-participante: tem a privacidade violada e comercializada, ou sofre bullying ou assédio online. Mensagens publicitárias sem conteúdo inapropriado não configuram o risco de conteúdo, que exige mensagens inapropriadas, nem o risco de contato. A prática de violência online pela própria criança é o risco de conduta. O uso da criança em anúncios não aparece no texto.` },

    { id: 13, categoria: 'riscos-crimes', enunciadoHtml: `Segundo Santos, qual é o papel da criança no risco de conduta?`, alternativasHtml: [
        `O de ator de atos de violência online, como compartilhar imagens pornográficas ou fazer bullying com os pares.`,
        `O de receptora de conteúdo publicitário, sem nenhuma participação própria.`,
        `O de vítima de assédio, cuja privacidade é violada por terceiros.`,
        `O de consumidora de jogos com compras dentro do aplicativo.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `No risco de conduta, a criança é ator dos atos de violência online, por exemplo quando compartilha imagens pornográficas ou faz bullying com os pares. Ser receptora de conteúdo publicitário é o risco de conteúdo. Ser vítima de assédio, com a privacidade violada, é o risco de contato. A compra dentro de jogos não é tratada no texto.` },

    { id: 14, categoria: 'riscos-crimes', enunciadoHtml: `Segundo Stanger, citada por Nóbrega, por que é difícil controlar o acesso a conteúdo inapropriado?`, alternativasHtml: [
        `Porque as crianças sempre têm aparelhos próprios que os pais não conseguem vigiar.`,
        `Porque a internet funciona apenas em horário comercial, o que atrapalha a fiscalização.`,
        `Porque, por trás de perfis falsos e do suposto anonimato, muitas pessoas acham que não serão punidas, e a internet funciona 24 horas por dia.`,
        `Porque as plataformas proíbem os pais de instalar qualquer ferramenta de controle.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Stanger aponta o perfil falso e o suposto anonimato, que levam muitas pessoas a achar que podem fazer o que quiserem sem punição, além do funcionamento da internet 24 horas por dia. Aparelhos próprios das crianças não são a explicação do texto. Dizer que a internet funciona só em horário comercial contraria a afirmação de que ela funciona 24 horas. A proibição de ferramentas pelas plataformas não aparece no texto, que cita o interesse econômico como obstáculo para leis e medidas de proteção.` },

    { id: 15, categoria: 'riscos-crimes', enunciadoHtml: `Qual destes crimes Nóbrega inclui na lista dos que mais afetam crianças e adolescentes?`, alternativasHtml: [
        `Calúnia, que é inventar algo sobre alguém.`,
        `Sextortion, que é a extorsão por meio de fotos ou vídeos de cunho sexual.`,
        `Danos, como o envio de vírus.`,
        `Violação de direitos autorais, com uso de software pirata.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `A lista dos crimes que mais afetam crianças e adolescentes inclui o sextortion, a extorsão com fotos ou vídeos de cunho sexual, feitos com ou sem consentimento. A calúnia, o envio de vírus e a violação de direitos autorais aparecem na lista geral de crimes digitais, mas não entre os que mais atingem esse público.` },

    { id: 16, categoria: 'riscos-crimes', enunciadoHtml: `Segundo Nóbrega, de que forma o abuso sexual pela internet pode acontecer?`, alternativasHtml: [
        `À distância, mesmo sem o toque físico do abusador.`,
        `Somente quando há contato físico entre a criança e o adulto.`,
        `Somente por desconhecidos que a criança nunca viu antes.`,
        `Sem deixar registros, por isso raramente chega ao conhecimento de alguém.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Nóbrega destaca que o abuso pode acontecer à distância, sem toque físico, quando o abusador induz a criança a mostrar o corpo ou a fazer imagens. A ideia de que exige contato físico contradiz o texto. Dizer que o agressor é sempre um desconhecido também contradiz a autora, que afirma que ele não costuma ser um completo estranho. A afirmação de que não deixa registros não aparece no texto, que lembra que muitas cenas são filmadas.` },

    { id: 17, categoria: 'riscos-crimes', enunciadoHtml: `Segundo Nóbrega, como costuma começar a aproximação de um abusador?`, alternativasHtml: [
        `Com ameaças imediatas, sem nenhuma conversa antes do abuso.`,
        `Com um convite para um encontro presencial em local público.`,
        `Com a oferta de presentes caros logo no primeiro contato.`,
        `Com elogios e atenção, que fazem a criança se sentir especial, muitas vezes por meses ou anos antes do abuso.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Nóbrega descreve uma aproximação gradual: elogios e atenção fazem a criança se sentir olhada e especial, e a comunicação pode durar meses ou anos antes do abuso. Ameaças imediatas, sem conversa prévia, contrariam esse padrão, em que a confiança vem antes. O encontro presencial em local público e os presentes caros não são descritos no texto.` },

    { id: 18, categoria: 'riscos-crimes', enunciadoHtml: `Qual destas situações Nóbrega cita como risco que crianças e adolescentes enfrentam na internet?`, alternativasHtml: [
        `Uso de aplicativos de mensagens para combinar trabalhos escolares.`,
        `Atualização automática de programas instalados no aparelho.`,
        `Aliciamento em grupos pró-anorexia e pró-bulimia.`,
        `Assistir a vídeos de culinária sem propaganda.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Nóbrega lista o aliciamento em grupos pró-anorexia e pró-bulimia entre os riscos. As outras três situações não são apresentadas pelo texto como riscos: combinar trabalhos escolares, atualizar programas e assistir a vídeos de culinária não aparecem entre os perigos citados.` },

    { id: 19, categoria: 'riscos-crimes', enunciadoHtml: `Segundo Nóbrega, a que muitos desses crimes e perigos podem levar a criança ou o adolescente?`, alternativasHtml: [
        `A um aumento imediato da capacidade de concentração nos estudos.`,
        `A ansiedade, depressão ou até suicídio.`,
        `A uma melhora na comunicação com os pais.`,
        `A nenhum efeito, porque são casos isolados.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Nóbrega afirma que muitos desses crimes e perigos podem levar à ansiedade, à depressão e até ao suicídio. O aumento da concentração e a melhora na comunicação com os pais são efeitos contrários ao que o texto descreve. A ideia de que não há efeito, por serem casos isolados, também não é a posição da autora.` },

    { id: 20, categoria: 'riscos-crimes', enunciadoHtml: `Segundo a lista de crimes de Stanger, citada por Nóbrega, qual é a diferença entre calúnia e difamação?`, alternativasHtml: [
        `Calúnia é inventar algo sobre alguém; difamação é associar a pessoa a um fato que ofende a sua reputação.`,
        `Calúnia é insultar alguém diretamente; difamação é inventar uma história.`,
        `Calúnia e difamação são o mesmo crime, com nomes diferentes.`,
        `Calúnia é divulgar segredos por vingança; difamação é enviar vírus.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Na lista de Stanger, a calúnia é inventar algo sobre alguém, e a difamação é associar a pessoa a um fato que ofende a sua reputação. Dizer que calúnia é insultar alguém descreve a injúria, que a lista define como falar mal ou insultar. Tratar as duas como o mesmo crime ignora a distinção feita na lista. Associar a calúnia à divulgação de segredos e a difamação ao envio de vírus mistura crimes que têm definições próprias.` }
];
