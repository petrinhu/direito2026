import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 31 a 40 do quiz do ECA Digital: violações graves, notificação e
 * retirada de conteúdo, transparência, uso abusivo das denúncias, autoridade,
 * sanções e vigência (arts. 27 a 41-A). Todas de múltipla escolha com quatro
 * alternativas. As explicações descrevem o conteúdo de cada alternativa, sem
 * indicar posição, porque o motor embaralha as respostas a cada rodada.
 */
export const responsabilidade: readonly PerguntaQuiz[] = [
  {
    id: 31,
    categoria: 'eca-responsabilidade',
    enunciadoHtml: `Segundo o art. 27, o que os fornecedores devem fazer com conteúdos de aparente exploração e abuso sexual de crianças detectados em seus produtos?`,
    alternativasHtml: [
      `Apenas arquivá-los, sem comunicar ninguém.`,
      `Repassá-los a anunciantes, para que sejam identificados.`,
      `Removê-los e comunicá-los às autoridades nacionais e internacionais competentes, na forma de regulamento.`,
      `Avisar o autor da publicação e aguardar uma decisão judicial.`
    ],
    correta: 2,
    fonteExtra: false,
    explicacaoHtml: `O art. 27 manda remover e comunicar às autoridades nacionais e internacionais competentes os conteúdos de aparente exploração e abuso sexual detectados nos produtos, na forma de regulamento. Manter esses conteúdos arquivados, sem comunicação a ninguém, contraria o texto. Repassar o conteúdo a anunciantes para identificação fica sem respaldo na lei. Avisar o autor, por sua vez, não cumpre o dever de remover e comunicar. A remoção desse tipo de conteúdo independe de ordem judicial (art. 29, caput e § 1º), e o art. 6º, I, inclui a exploração e o abuso sexual entre os conteúdos que violam direitos.`
  },
  {
    id: 32,
    categoria: 'eca-responsabilidade',
    enunciadoHtml: `Por quanto tempo, segundo o art. 27, § 2º, os fornecedores devem reter os dados ligados a um relatório de exploração e abuso sexual?`,
    alternativasHtml: [
      `Pelas 24 horas seguintes à denúncia.`,
      `Até o fim da investigação policial, sem prazo definido.`,
      `Pelo prazo fixo de cinco anos, em todos os casos.`,
      `Pelo prazo do art. 15 do Marco Civil da Internet, que pode ser maior mediante requerimento.`
    ],
    correta: 3,
    fonteExtra: false,
    explicacaoHtml: `Pelo § 2º do art. 27, os dados ficam retidos pelo prazo do art. 15 do Marco Civil da Internet, e o § 3º admite prazo maior, desde que haja requerimento na forma do § 2º do art. 15 daquela lei. Como a Lei nº 15.211 não fixa o prazo em número, 24 horas, prazo até o fim da investigação e cinco anos fixos não correspondem ao que o art. 27 diz.`
  },
  {
    id: 33,
    categoria: 'eca-responsabilidade',
    enunciadoHtml: `Segundo o art. 29, quem pode comunicar o caráter ofensivo de uma publicação para que o fornecedor a retire?`,
    alternativasHtml: [
      `A vítima, seus representantes, o Ministério Público ou entidades representativas de defesa dos direitos de crianças e adolescentes.`,
      `Qualquer pessoa, sem identificação, por meio de denúncia anônima.`,
      `Apenas a autoridade administrativa, após decisão de um juiz.`,
      `Somente os próprios provedores, em procedimento interno.`
    ],
    correta: 0,
    fonteExtra: false,
    explicacaoHtml: `O art. 29 indica como comunicantes a vítima, seus representantes, o Ministério Público e entidades representativas de defesa dos direitos de crianças e adolescentes. O § 2º afasta a denúncia anônima. Decisão judicial prévia não se impõe, porque a retirada independe de ordem judicial. Os próprios provedores, por sua vez, não figuram entre os comunicantes do dispositivo.`
  },
  {
    id: 34,
    categoria: 'eca-responsabilidade',
    enunciadoHtml: `Segundo o § 2º do art. 29, o que a notificação de violação deve conter, sob pena de nulidade?`,
    alternativasHtml: [
      `Somente o nome do autor da notificação, sem descrição do conteúdo.`,
      `Elementos que permitam a identificação técnica específica do conteúdo apontado e do autor da notificação.`,
      `Um pedido de indenização em valor determinado.`,
      `A assinatura de advogado em todos os casos.`
    ],
    correta: 1,
    fonteExtra: false,
    explicacaoHtml: `O § 2º do art. 29 exige, sob pena de nulidade, elementos que permitam a identificação técnica específica do conteúdo apontado como violador e do autor da notificação. Um nome de autor sem descrição do conteúdo fica aquém dessa exigência. Pedido de indenização e assinatura de advogado não são requisitos do parágrafo.`
  },
  {
    id: 35,
    categoria: 'eca-responsabilidade',
    enunciadoHtml: `Quais conteúdos ficam fora do procedimento de retirada previsto no art. 29?`,
    alternativasHtml: [
      `Os conteúdos que violam direitos de crianças e adolescentes.`,
      `Os conteúdos que apresentam imagens de pessoas adultas.`,
      `Os conteúdos jornalísticos e os submetidos a controle editorial.`,
      `Os conteúdos publicados antes da vigência da lei.`
    ],
    correta: 2,
    fonteExtra: false,
    explicacaoHtml: `O § 4º do art. 29 exclui do procedimento de retirada os conteúdos jornalísticos e os submetidos a controle editorial. Os conteúdos que violam direitos são justamente os que o procedimento alcança. A presença de adultos nas imagens não serve de critério do artigo, e a lei não prevê exclusão para conteúdos anteriores à sua vigência.`
  },
  {
    id: 36,
    categoria: 'eca-responsabilidade',
    enunciadoHtml: `Quando um conteúdo publicado pelo usuário é retirado, quais direitos o art. 30 lhe assegura?`,
    alternativasHtml: [
      `Direito de receber indenização imediata, em valor fixo.`,
      `Direito de publicar o mesmo conteúdo em outra plataforma, sem restrições.`,
      `Direito de exigir que a autoridade julgue o caso antes da retirada.`,
      `Direito de ser notificado, de conhecer o motivo da retirada e de recorrer, com acesso fácil ao recurso.`
    ],
    correta: 3,
    fonteExtra: false,
    explicacaoHtml: `O art. 30 assegura a quem publicou o conteúdo ser notificado sobre a retirada, conhecer o motivo e a fundamentação, recorrer com acesso fácil ao recurso e conhecer os prazos procedimentais. Indenização em valor fixo e republicação em outra plataforma ficam fora do dispositivo. O art. 29, por seu lado, dispensa ordem judicial prévia para a retirada.`
  },
  {
    id: 37,
    categoria: 'eca-responsabilidade',
    enunciadoHtml: `Qual é o limite de usuários que obriga um provedor de aplicações direcionadas a crianças e adolescentes a publicar relatórios semestrais de transparência?`,
    alternativasHtml: [
      `Mais de 1.000.000 de usuários nessa faixa etária registrados, com conexão no território nacional.`,
      `Mais de 100.000 usuários, em qualquer faixa etária.`,
      `Mais de 10.000.000 de usuários no mundo inteiro.`,
      `Qualquer provedor, independentemente do número de usuários.`
    ],
    correta: 0,
    fonteExtra: false,
    explicacaoHtml: `O art. 31 obriga a publicar relatórios semestrais os provedores que tenham mais de 1.000.000 de usuários nessa faixa etária registrados, com conexão no território nacional. A lei não menciona os números 100.000 e 10.000.000. O limite também não abrange usuários de qualquer idade nem usuários do mundo inteiro. O art. 39 ainda modula as obrigações pelo número de usuários, de modo que nem todo provedor fica sujeito a elas.`
  },
  {
    id: 38,
    categoria: 'eca-responsabilidade',
    enunciadoHtml: `Qual destas é uma medida sancionatória prevista no art. 33, § 1º, para o uso abusivo dos instrumentos de denúncia?`,
    alternativasHtml: [
      `Cancelamento da conta na primeira denúncia abusiva, sem reincidência nem abuso grave.`,
      `Suspensão temporária da conta do usuário infrator.`,
      `Proibição definitiva de qualquer conexão à internet.`,
      `Dispensa de ouvir o usuário antes da sanção.`
    ],
    correta: 1,
    fonteExtra: false,
    explicacaoHtml: `O § 1º do art. 33 prevê, entre outras medidas adequadas, a suspensão temporária da conta do usuário infrator, o cancelamento em caso de reincidência ou abuso grave e a comunicação às autoridades quando houver indícios de infração penal ou de violação de direitos. Cancelar a conta na primeira denúncia abusiva, sem reincidência nem abuso grave, contraria o inciso II do mesmo parágrafo. Já a proibição de conexão à internet não tem menção em nenhum ponto do artigo. Dispensar o usuário antes da sanção contraria o § 2º, II e III, que exigem notificação sobre o procedimento e possibilidade de recurso.`
  },
  {
    id: 39,
    categoria: 'eca-responsabilidade',
    enunciadoHtml: `Segundo o § 1º do art. 34, o que a regulamentação não pode, em nenhuma hipótese, autorizar?`,
    alternativasHtml: [
      `A criação de canais de denúncia pelos próprios usuários.`,
      `A verificação de idade feita por lojas de aplicativos.`,
      `Mecanismos de vigilância massiva, genérica ou indiscriminada.`,
      `Orientações de boas práticas emitidas pela autoridade.`
    ],
    correta: 2,
    fonteExtra: false,
    explicacaoHtml: `Pelo § 1º do art. 34, a regulamentação não pode autorizar nem resultar em mecanismos de vigilância massiva, genérica ou indiscriminada. Canais de denúncia e aferição de idade pelas lojas são previstos pela própria lei (arts. 12 e 31). Recomendações e orientações da autoridade são admitidas pelo art. 5º, § 3º.`
  },
  {
    id: 40,
    categoria: 'eca-responsabilidade',
    enunciadoHtml: `Quando a lei entrou em vigor, segundo o art. 41-A?`,
    alternativasHtml: [
      `Em 17 de setembro de 2025, data de sua sanção.`,
      `Em 3 de maio de 2024, data da Lei nº 14.852.`,
      `Em 17 de março de 2025.`,
      `Em 17 de março de 2026.`
    ],
    correta: 3,
    fonteExtra: false,
    explicacaoHtml: `O art. 41-A fixa a vigência em 17 de março de 2026, dispositivo incluído pela Lei nº 15.352, de 2026. A sanção, ocorrida em 17 de setembro de 2025, é data distinta da vigência. O dia 3 de maio de 2024 é a data de outra norma, a Lei nº 14.852, citada no art. 21. A data de 17 de março de 2025 coincide em dia e mês com a vigência, mas o ano não corresponde ao que a lei fixa.`
  }
];
