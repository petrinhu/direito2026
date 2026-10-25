import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 21 a 30 do quiz do ECA Digital: jogos eletrônicos, publicidade,
 * perfilamento e vínculo das contas com o responsável até 16 anos, incluídas as
 * regras das redes sociais (arts. 20 a 26). Todas de múltipla escolha com quatro
 * alternativas. As explicações descrevem o conteúdo de cada alternativa, sem
 * indicar posição, porque o motor embaralha as respostas a cada rodada.
 */
export const comercial: readonly PerguntaQuiz[] = [
  {
    id: 21,
    categoria: 'eca-comercial',
    enunciadoHtml: `O que o art. 20 veda em jogos eletrônicos direcionados a crianças e adolescentes, ou de acesso provável por eles?`,
    alternativasHtml: [
      `As caixas de recompensa (loot boxes).`,
      `Os jogos com interação entre usuários, em qualquer condição.`,
      `Os jogos gratuitos, independentemente de classificação indicativa.`,
      `Os jogos que exibem qualquer publicidade durante as partidas.`
    ],
    correta: 0,
    fonteExtra: false,
    explicacaoHtml: `O art. 20 veda as caixas de recompensa em jogos eletrônicos direcionados a crianças e adolescentes, ou de acesso provável por eles, nos termos da classificação indicativa. A vedação não atinge os jogos com interação entre usuários, que o art. 21 admite com salvaguardas. A gratuidade do jogo não entra no critério do artigo. A publicidade exibida nas partidas fica fora do art. 20, e a vedação ao perfilamento para direcionar publicidade comercial está no art. 22.`
  },
  {
    id: 22,
    categoria: 'eca-comercial',
    enunciadoHtml: `Um jogo para adolescentes que permite conversa por áudio entre desconhecidos deve, segundo o art. 21, observar qual exigência?`,
    alternativasHtml: [
      `Nenhuma, porque o áudio não aparece na lei como forma de comunicação.`,
      `Integralmente as salvaguardas do art. 16 da Lei nº 14.852, de 3 de maio de 2024, como a moderação de conteúdos e a proteção contra contatos prejudiciais.`,
      `Apenas a autorização da autoridade administrativa para cada partida.`,
      `A proibição de qualquer comunicação por áudio entre usuários.`
    ],
    correta: 1,
    fonteExtra: false,
    explicacaoHtml: `O art. 21 exige que esses jogos observem integralmente as salvaguardas do art. 16 da Lei nº 14.852, de 2024, especialmente a moderação de conteúdos, a proteção contra contatos prejudiciais e a atuação parental sobre os mecanismos de comunicação. A lei menciona expressamente a comunicação por áudio entre as formas de interação. Nenhuma autorização prévia da autoridade é exigida para cada partida. O artigo impõe salvaguardas a essa conversa por áudio, sem proibi-la.`
  },
  {
    id: 23,
    categoria: 'eca-comercial',
    enunciadoHtml: `Segundo o parágrafo único do art. 21, como as funcionalidades de interação desses jogos devem ser configuradas por padrão?`,
    alternativasHtml: [
      `Abertas a todos os usuários, para estimular a socialização.`,
      `Liberadas somente para maiores de 18 anos, sem exceção.`,
      `Limitadas por padrão, de modo a assegurar o consentimento dos pais ou responsáveis legais.`,
      `Desligadas somente com pedido expresso da própria criança.`
    ],
    correta: 2,
    fonteExtra: false,
    explicacaoHtml: `O parágrafo único do art. 21 manda limitar essas funcionalidades por padrão, para assegurar o consentimento dos pais ou responsáveis legais. Deixá-las abertas a todos os usuários contraria esse padrão. O parágrafo não fixa idade de 18 anos, e tampouco pede que a própria criança solicite o desligamento da interação.`
  },
  {
    id: 24,
    categoria: 'eca-comercial',
    enunciadoHtml: `Qual técnica o art. 22 veda para direcionar publicidade comercial a crianças e adolescentes?`,
    alternativasHtml: [
      `A exibição de anúncios com cores vibrantes e linguagem infantil.`,
      `A publicidade impressa em revistas de papel destinadas ao público infantil.`,
      `A oferta de cupons de desconto em lojas físicas.`,
      `O perfilamento, ou seja, a classificação do usuário para direcionar publicidade comercial.`
    ],
    correta: 3,
    fonteExtra: false,
    explicacaoHtml: `O art. 22 veda o perfilamento para direcionar publicidade comercial a crianças e adolescentes, além da análise emocional e do uso de realidade aumentada, estendida e virtual com esse fim. O artigo não menciona cores, linguagem infantil, revistas impressas nem cupons. Tais práticas podem ser avaliadas por outras regras, como o art. 6º, V, sobre práticas publicitárias predatórias.`
  },
  {
    id: 25,
    categoria: 'eca-comercial',
    enunciadoHtml: `O art. 23 veda aos provedores de aplicações de internet a monetização e o impulsionamento de quê?`,
    alternativasHtml: [
      `De conteúdos que retratem crianças e adolescentes de forma erotizada ou sexualmente sugestiva.`,
      `De qualquer conteúdo produzido por crianças para a própria família.`,
      `De propaganda de produtos de consumo infantil.`,
      `De jogos eletrônicos que tenham caixas de recompensa.`
    ],
    correta: 0,
    fonteExtra: false,
    explicacaoHtml: `O art. 23 veda a monetização e o impulsionamento de conteúdos que retratem crianças e adolescentes de forma erotizada ou sexualmente sugestiva, ou em contexto próprio do universo sexual adulto. O conteúdo familiar fica de fora dessa vedação. A propaganda de produtos infantis escapa ao art. 23, e só cai sob o art. 22 quando envolve perfilamento, análise emocional ou realidade aumentada, estendida ou virtual para direcionamento de publicidade comercial. As caixas de recompensa têm tratamento próprio no art. 20.`
  },
  {
    id: 26,
    categoria: 'eca-comercial',
    enunciadoHtml: `Até que idade, segundo o art. 24, a conta de criança ou adolescente deve estar vinculada a um responsável legal?`,
    alternativasHtml: [
      `Até 12 anos.`,
      `Até 16 anos.`,
      `Até 14 anos.`,
      `Até 18 anos.`
    ],
    correta: 1,
    fonteExtra: false,
    explicacaoHtml: `O art. 24 exige que as contas de usuários de até 16 anos estejam vinculadas ao usuário ou à conta de um responsável legal. O artigo não traz os números 12 e 14. O limite de 18 anos pertence ao art. 9º, que trata de conteúdo impróprio; o vínculo com o responsável segue o limite de 16 anos.`
  },
  {
    id: 27,
    categoria: 'eca-comercial',
    enunciadoHtml: `Diante de fundados indícios de que a conta de uma rede social é operada por criança fora da idade mínima, o que o provedor deve fazer?`,
    alternativasHtml: [
      `Aguardar um ano antes de qualquer providência.`,
      `Encerrar a conta definitivamente, sem direito de defesa.`,
      `Suspender o acesso e assegurar procedimento célere e acessível, em que o responsável possa apresentar apelação e comprovar a idade.`,
      `Excluir os dados da criança, sem informar o responsável.`
    ],
    correta: 2,
    fonteExtra: false,
    explicacaoHtml: `O § 4º do art. 24 manda suspender o acesso e assegurar procedimento célere e acessível, em que o responsável legal possa apresentar apelação e comprovar a idade por meio adequado. Adiar qualquer providência por um ano não encontra previsão legal. Já o encerramento da conta, sem chance de defesa, contraria o procedimento de apelação. Quanto a apagar dados sem avisar o responsável, o parágrafo garante a ele justamente a possibilidade de comprovar a idade, o que deixa essa medida sem respaldo.`
  },
  {
    id: 28,
    categoria: 'eca-comercial',
    enunciadoHtml: `Na ausência de usuário ou conta dos responsáveis legais, o que o § 5º do art. 24 veda?`,
    alternativasHtml: [
      `Qualquer comunicação entre usuários da plataforma.`,
      `A criação de contas em nome de pessoas adultas.`,
      `O acesso da criança a conteúdos jornalísticos.`,
      `A alteração das configurações de supervisão parental da conta para um nível menor de proteção em relação ao padrão.`
    ],
    correta: 3,
    fonteExtra: false,
    explicacaoHtml: `O § 5º do art. 24 veda a alteração das configurações de supervisão parental da conta para um nível menor de proteção em relação ao padrão estabelecido nos arts. 3º e 7º. A comunicação entre usuários e a criação de contas por adultos não estão sob essa vedação. O acesso a conteúdos jornalísticos também não aparece no § 5º.`
  },
  {
    id: 29,
    categoria: 'eca-comercial',
    enunciadoHtml: `Segundo o art. 25, como devem ser as regras específicas de tratamento de dados de crianças e adolescentes nas redes sociais?`,
    alternativasHtml: [
      `Concretas, documentadas e com base no melhor interesse da criança e do adolescente.`,
      `Genéricas, para servir a todos os usuários da rede.`,
      `Definidas pelos próprios usuários, sem qualquer registro.`,
      `Sigilosas, sem necessidade de documentação.`
    ],
    correta: 0,
    fonteExtra: false,
    explicacaoHtml: `O art. 25 exige que as redes sociais tenham regras específicas para o tratamento de dados de crianças e adolescentes, definidas de forma concreta e documentada e com base no seu melhor interesse. Regras genéricas perdem a concretude que o texto pede. Regras criadas pelos próprios usuários, sem registro, dispensam a documentação que o artigo exige. O texto exige documentação, sem nenhuma referência a sigilo.`
  },
  {
    id: 30,
    categoria: 'eca-comercial',
    enunciadoHtml: `Para qual finalidade o art. 26 veda a criação de perfis comportamentais de crianças e adolescentes?`,
    alternativasHtml: [
      `Para avaliar o desempenho escolar do aluno.`,
      `Para direcionamento de publicidade comercial.`,
      `Para enviar notificações sobre atividades suspeitas.`,
      `Para restringir compras e transações financeiras pelos pais.`
    ],
    correta: 1,
    fonteExtra: false,
    explicacaoHtml: `O art. 26 veda a criação de perfis comportamentais de crianças e adolescentes, inclusive a partir de dados da verificação de idade e de dados grupais, para direcionar publicidade comercial. O desempenho escolar do aluno não corresponde à finalidade que o artigo proíbe. Mandar notificações e limitar compras também não integra esse objetivo, já que a restrição de compras é uma das ferramentas que o art. 18, II, assegura aos pais.`
  }
];
