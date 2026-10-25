import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 11 a 20 do quiz do ECA Digital: deveres dos fornecedores, verificação
 * de idade, aferição de idade pelas lojas e pelos sistemas, e supervisão parental
 * (arts. 5º a 13 e 17). Todas de múltipla escolha com quatro alternativas. As
 * explicações descrevem o conteúdo de cada alternativa, sem indicar posição,
 * porque o motor embaralha as respostas a cada rodada.
 */
export const protecao: readonly PerguntaQuiz[] = [
  {
    id: 11,
    categoria: 'eca-protecao',
    enunciadoHtml: `Quais são os deveres que o art. 5º atribui aos fornecedores?`,
    alternativasHtml: [
      `Pagar indenização automática a todo usuário que for exposto a conteúdo impróprio.`,
      `Vender publicidade apenas para usuários adultos registrados.`,
      `Prevenção, proteção, informação e segurança, em conformidade com o melhor interesse da criança e do adolescente.`,
      `Substituir a supervisão dos pais por sistemas de recomendação.`
    ],
    correta: 2,
    fonteExtra: false,
    explicacaoHtml: `O art. 5º atribui aos fornecedores os deveres de prevenção, de proteção, de informação e de segurança, em conformidade com o melhor interesse da criança e do adolescente. Nenhuma indenização automática aparece no texto. Limitar a venda de publicidade a usuários adultos tampouco figura entre esses deveres, e a publicidade direcionada por perfilamento já é vedada pelo art. 22. Pôr sistemas de recomendação no lugar da supervisão dos pais esbarra no parágrafo único do art. 3º, que mantém o cuidado ativo e contínuo com os pais.`
  },
  {
    id: 12,
    categoria: 'eca-protecao',
    enunciadoHtml: `Entre os conteúdos e práticas que o art. 6º manda prevenir e mitigar, qual está listado?`,
    alternativasHtml: [
      `A cobrança de taxa mensal por aplicativos de estudo.`,
      `A tradução automática de conteúdos para outros idiomas.`,
      `O acesso de adultos a fóruns sobre jogos eletrônicos.`,
      `Exploração e abuso sexual.`
    ],
    correta: 3,
    fonteExtra: false,
    explicacaoHtml: `A exploração e o abuso sexual estão no inciso I do art. 6º, entre os conteúdos e práticas que devem ser prevenidos e mitigados desde a concepção do produto. A lista do artigo deixa de fora a cobrança de taxa, a tradução de conteúdos e o acesso de adultos a fóruns.`
  },
  {
    id: 13,
    categoria: 'eca-protecao',
    enunciadoHtml: `O que o art. 7º exige que os fornecedores façam por padrão?`,
    alternativasHtml: [
      `Configurar o produto no modelo mais protetivo disponível em relação à privacidade e à proteção de dados pessoais.`,
      `Coletar o máximo de dados possível, para oferecer conteúdos mais personalizados.`,
      `Liberar a geolocalização de todos os usuários menores de idade.`,
      `Exibir publicidade direcionada por perfilamento em todas as telas do aplicativo.`
    ],
    correta: 0,
    fonteExtra: false,
    explicacaoHtml: `O art. 7º manda que a configuração de origem seja a mais protetiva quanto à privacidade e à proteção de dados pessoais. Reunir o máximo de dados colide com o § 2º do mesmo artigo, que manda evitar tratamento capaz de causar, facilitar ou contribuir para a violação da privacidade. Já o art. 17, § 4º, VI, impõe restrição ao compartilhamento de geolocalização, com aviso prévio. A publicidade direcionada por perfilamento, por sua vez, é vedada pelo art. 22.`
  },
  {
    id: 14,
    categoria: 'eca-protecao',
    enunciadoHtml: `Segundo o art. 8º, qual medida os fornecedores devem adotar?`,
    alternativasHtml: [
      `Eliminar todas as formas de entretenimento destinadas a crianças.`,
      `Adotar, por padrão, configurações que evitem o uso compulsivo do produto por crianças e adolescentes.`,
      `Dispensar a avaliação de conteúdo para produtos gratuitos.`,
      `Limitar o uso do produto aos horários que a família definir em contrato.`
    ],
    correta: 1,
    fonteExtra: false,
    explicacaoHtml: `O inciso IV do art. 8º manda desenvolver, desde a concepção, e adotar por padrão configurações que evitem o uso compulsivo do produto por crianças e adolescentes. Nada nessa regra pede a eliminação do entretenimento infantil. Abrir mão da avaliação de conteúdo entra em choque com o inciso II, cujo texto não abre exceção para produtos gratuitos. O controle do tempo de uso, por sua vez, cabe às ferramentas de supervisão (art. 17, IV), e horários acertados em contrato não integram essa função.`
  },
  {
    id: 15,
    categoria: 'eca-protecao',
    enunciadoHtml: `Segundo o art. 9º, § 1º, como deve ser feita a verificação de idade para o acesso a conteúdo impróprio?`,
    alternativasHtml: [
      `Pela autodeclaração do usuário, feita uma única vez no cadastro.`,
      `Por meio de pergunta sobre a data de nascimento, aceita sem qualquer checagem.`,
      `Por mecanismos confiáveis, a cada acesso ao conteúdo, sendo vedada a autodeclaração.`,
      `Somente quando os pais solicitarem, por escrito, à empresa.`
    ],
    correta: 2,
    fonteExtra: false,
    explicacaoHtml: `O § 1º do art. 9º exige mecanismos confiáveis de verificação de idade a cada acesso ao conteúdo, e veda a autodeclaração. Declarar a idade uma única vez, no cadastro, cai justamente na autodeclaração que o texto rejeita. Fazer a pergunta sobre a data de nascimento e aceitar a resposta sem checagem continua sendo autodeclaração. Quem tem de verificar é o fornecedor, e o § 1º não condiciona a verificação a pedido dos pais.`
  },
  {
    id: 16,
    categoria: 'eca-protecao',
    enunciadoHtml: `Segundo o art. 9º, § 2º, quais produtos, serviços ou conteúdos são considerados impróprios ou inadequados para crianças e adolescentes?`,
    alternativasHtml: [
      `Qualquer conteúdo de publicidade, sem exceção.`,
      `Os conteúdos jornalísticos, por sua natureza.`,
      `Os conteúdos produzidos por adultos e destinados a outros adultos.`,
      `Os que contenham material pornográfico, ou quaisquer outros vedados pela legislação vigente.`
    ],
    correta: 3,
    fonteExtra: false,
    explicacaoHtml: `Pelo § 2º do art. 9º, são impróprios os produtos, serviços ou conteúdos que contenham material pornográfico, ou quaisquer outros vedados pela legislação vigente. A publicidade, em geral, não entra nessa classificação. Os conteúdos jornalísticos não constam da definição do § 2º do art. 9º; o § 4º do art. 29 só os exclui do procedimento de retirada. Os destinados a adultos não são tratados neste parágrafo.`
  },
  {
    id: 17,
    categoria: 'eca-protecao',
    enunciadoHtml: `Quais agentes o art. 12 obriga a aferir a idade dos usuários e a fornecer o sinal de idade aos provedores de aplicações?`,
    alternativasHtml: [
      `Os provedores de lojas de aplicações de internet e de sistemas operacionais de terminais.`,
      `Somente os provedores de redes sociais com mais de um milhão de usuários.`,
      `Os pais, por meio de declaração escrita entregue à loja.`,
      `As autoridades policiais, que mantêm um banco nacional de idades.`
    ],
    correta: 0,
    fonteExtra: false,
    explicacaoHtml: `O art. 12 atribui essas tarefas aos provedores de lojas de aplicações de internet e de sistemas operacionais de terminais, e a aferição vai além das redes sociais. O limite de um milhão de usuários do art. 31 serve à transparência, sem alcançar a aferição de idade. Atribuir essa tarefa aos pais, como faria uma declaração entregue à loja, fica fora do que o art. 12 prevê. Nenhum dispositivo da lei cria banco nacional de idades ou atribui essa função à polícia.`
  },
  {
    id: 18,
    categoria: 'eca-protecao',
    enunciadoHtml: `Segundo o art. 12, § 2º, o que é exigido para que crianças e adolescentes baixem aplicativos?`,
    alternativasHtml: [
      `Presunção de autorização quando os pais não se manifestam.`,
      `Consentimento livre e informado dos pais ou responsáveis legais, prestado nos termos da legislação vigente.`,
      `Apenas o aceite do próprio adolescente, a partir de 12 anos.`,
      `A compra do aparelho pela família, sem qualquer outra exigência.`
    ],
    correta: 1,
    fonteExtra: false,
    explicacaoHtml: `O § 2º do art. 12 exige consentimento livre e informado dos pais ou responsáveis legais, respeitada a autonomia progressiva, e veda presumir a autorização quando eles não se manifestam. A autorização presumida é justamente o que o texto afasta. O aceite do adolescente sozinho, a partir de 12 anos, não encontra amparo no dispositivo. A compra do aparelho pela família deixa de lado o consentimento que o parágrafo exige.`
  },
  {
    id: 19,
    categoria: 'eca-protecao',
    enunciadoHtml: `Segundo o art. 13, os dados coletados para verificar a idade de crianças e adolescentes podem ser usados para quê?`,
    alternativasHtml: [
      `Para qualquer finalidade comercial, desde que o usuário seja informado.`,
      `Para criar um cadastro de consumo do usuário, após a verificação.`,
      `Unicamente para a verificação de idade, sendo vedado qualquer outro propósito.`,
      `Para compartilhamento com terceiros, em todos os casos, mediante contrato.`
    ],
    correta: 2,
    fonteExtra: false,
    explicacaoHtml: `O art. 13 autoriza o uso desses dados unicamente para verificar a idade e veda qualquer outro propósito. Uso comercial, cadastro de consumo e compartilhamento com terceiros são propósitos diferentes, e avisar o usuário não os legitima. A mesma limitação vale para as redes sociais pelo § 3º do art. 24, que restringe esses dados à verificação de idade.`
  },
  {
    id: 20,
    categoria: 'eca-protecao',
    enunciadoHtml: `Segundo o art. 17, § 4º, qual é uma das configurações-padrão mínimas das ferramentas de supervisão parental?`,
    alternativasHtml: [
      `Ativar a geolocalização de forma permanente, para facilitar a localização da criança.`,
      `Exibir recompensas por tempo de uso, para estimular a permanência do usuário.`,
      `Liberar a comunicação de qualquer usuário com a criança, sem restrição.`,
      `Restringir a comunicação com crianças e adolescentes por usuários não autorizados.`
    ],
    correta: 3,
    fonteExtra: false,
    explicacaoHtml: `O inciso I do § 4º do art. 17 exige restringir a comunicação com crianças e adolescentes por usuários não autorizados. O inciso VI exige restrição ao compartilhamento da geolocalização e aviso prévio e claro sobre seu rastreamento. Recompensas pelo tempo de uso estão entre os recursos que a lei manda limitar (inciso II). Liberar a comunicação sem restrição colide com o inciso I.`
  }
];
