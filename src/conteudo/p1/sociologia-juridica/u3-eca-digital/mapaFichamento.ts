import type { FichaPensador, MapaFichamento } from '../../../tipos';

/**
 * Fonte única do Mapa mental e do Fichamento do ECA Digital (Lei nº 15.211/2025).
 * A lei não tem pensadores, então as eras são os blocos da lei, as fases são os
 * temas dentro de cada bloco, e cada ficha é um instituto central. Cada ficha
 * aponta para um bloco do resumo que existe. A citação literal é do próprio
 * texto da lei, sempre com o artigo.
 */

const referenciaLei = [
  'BRASIL. Lei nº 15.211, de 17 de setembro de 2025. Dispõe sobre a proteção de crianças e de adolescentes em ambientes digitais (Estatuto Digital da Criança e do Adolescente). Brasília, 2025.'
];

const obraLei = ['Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital)'];

const acessoProvavel: FichaPensador = {
  id: 'acesso-provavel',
  nome: 'Acesso provável por crianças e adolescentes',
  nomeCurto: 'Acesso provável',
  faseId: 'objeto',
  obras: obraLei,
  modoDePensar:
    'A lei não depende de o produto ser feito para crianças. Basta que o acesso por elas seja provável, o que acontece quando há suficiente probabilidade de uso e atratividade, considerável facilidade de acesso ou significativo risco à privacidade, à segurança ou ao desenvolvimento.',
  conceitos: [
    'Probabilidade de uso e atratividade pelo público infantil e juvenil',
    'Facilidade de acesso e de utilização',
    'Risco significativo à privacidade, à segurança e ao desenvolvimento biopsicossocial',
    'Independe da localização, do desenvolvimento, da fabricação, da oferta, da comercialização e da operação'
  ],
  citacao: {
    texto:
      'aplica-se a todo produto ou serviço de tecnologia da informação direcionado a crianças e a adolescentes no País ou de acesso provável por eles, independentemente de sua localização',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 1º.'
  },
  paraODireito:
    'O critério do acesso provável define o alcance da lei. Quem analisa um caso deve verificar se o produto é de fato acessado por crianças e adolescentes, sem se bastar com o fato de ele se apresentar como destinado a elas.',
  ressalva:
    'A lei não fixa números para as expressões suficiente probabilidade e considerável facilidade. A aplicação ao caso concreto depende de interpretação.',
  referencias: referenciaLei,
  blocoResumo: 'bloco-0'
};

const deverPrevencao: FichaPensador = {
  id: 'dever-de-prevencao',
  nome: 'Dever de prevenção e proteção desde a concepção',
  nomeCurto: 'Prevenção',
  faseId: 'deveres',
  obras: obraLei,
  modoDePensar:
    'A proteção começa no projeto do produto, antes de qualquer problema. Os arts. 5º a 8º pedem prevenção, proteção, informação e segurança, com configuração protetiva por padrão e gerenciamento de riscos.',
  conceitos: [
    'Deveres de prevenção, proteção, informação e segurança (art. 5º)',
    'Medidas razoáveis desde a concepção e ao longo da operação (art. 6º)',
    'Privacidade por padrão, no modelo mais protetivo (art. 7º)',
    'Gerenciamento de riscos e classificação por faixa etária (art. 8º)'
  ],
  citacao: {
    texto:
      'deverão tomar medidas razoáveis desde a concepção e ao longo da operação de suas aplicações, com o objetivo de prevenir e mitigar riscos',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 6º.'
  },
  paraODireito:
    'A lei cobra prevenção desde o projeto, antes que um dano aconteça.',
  ressalva:
    'Os verbos da lei, como prevenir, mitigar e gerenciar, não trazem métricas. O art. 5º, § 3º, prevê recomendações da autoridade, e o art. 37 prevê regulamentação.',
  referencias: referenciaLei,
  blocoResumo: 'bloco-2'
};

const verificacaoIdade: FichaPensador = {
  id: 'verificacao-de-idade',
  nome: 'Verificação de idade',
  nomeCurto: 'Verificação de idade',
  faseId: 'idade',
  obras: obraLei,
  modoDePensar:
    'A idade não pode ser apenas declarada pelo próprio usuário. O mecanismo precisa ser confiável e aplicado a cada acesso ao conteúdo impróprio, e os dados coletados servem somente a essa finalidade.',
  conceitos: [
    'Autodeclaração vedada (art. 9º, § 1º)',
    'Verificação a cada acesso (art. 9º, § 1º)',
    'Dados de verificação usados só para verificar a idade (art. 13)',
    'Sinal de idade por interface segura, com minimização de dados (art. 12, III e § 1º)'
  ],
  citacao: {
    texto:
      'mecanismos confiáveis de verificação de idade a cada acesso do usuário ao conteúdo, produto ou serviço',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 9º, § 1º.'
  },
  paraODireito:
    'Na idade, proteger e coletar dados entram em tensão. A lei responde com duas travas: a verificação não pode ser só declarada, e os dados obtidos não podem servir a outro propósito.',
  ressalva:
    'A lei não escolhe a tecnologia de verificação. O art. 11 permite ao poder público atuar como regulador, certificador ou promotor dessas soluções, com consulta pública.',
  referencias: referenciaLei,
  blocoResumo: 'bloco-3'
};

const supervisaoParental: FichaPensador = {
  id: 'supervisao-parental',
  nome: 'Supervisão parental',
  nomeCurto: 'Supervisão parental',
  faseId: 'idade',
  obras: obraLei,
  modoDePensar:
    'A supervisão é uma responsabilidade compartilhada. A criança tem direito a ser acompanhada, os pais têm o dever de exercer cuidado ativo e contínuo, e os fornecedores devem oferecer as ferramentas para isso.',
  conceitos: [
    'Ferramentas acessíveis e fáceis de usar (art. 17, I)',
    'Aviso claro e visível quando a supervisão está em vigor (art. 17, III)',
    'Configuração-padrão no nível mais alto de proteção (art. 17, § 4º)',
    'Métricas consolidadas do tempo de uso ao alcance dos pais (art. 18, IV)'
  ],
  citacao: {
    texto:
      'a criança e o adolescente têm o direito de ser educados, orientados e acompanhados por seus pais ou responsáveis legais quanto ao uso da internet e à sua experiência digital',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 3º, parágrafo único.'
  },
  paraODireito:
    'Na prática, quando um caso envolve uma criança e um serviço digital, a análise passa a considerar o que os pais podiam fazer e se o fornecedor ofereceu a ferramenta. Por isso a supervisão aparece tanto como dever dos pais quanto como dever das plataformas.',
  ressalva:
    'O art. 17, § 1º, delega à autoridade a fixação, por regulamento, de diretrizes e padrões mínimos de supervisão parental.',
  referencias: referenciaLei,
  blocoResumo: 'bloco-4'
};

const caixasDeRecompensa: FichaPensador = {
  id: 'caixas-de-recompensa',
  nome: 'Caixas de recompensa (loot boxes)',
  nomeCurto: 'Caixas de recompensa',
  faseId: 'comercio',
  obras: obraLei,
  modoDePensar:
    'A caixa de recompensa vende uma chance de obter algo, sem que o comprador saiba antes o que vai receber. A lei a veda nos jogos direcionados a crianças e adolescentes, ou de acesso provável por eles.',
  conceitos: [
    'Pagamento por item virtual consumível ou vantagem aleatória (art. 2º, IV)',
    'Sem conhecimento prévio do conteúdo (art. 2º, IV)',
    'Vedação nos jogos de acesso provável por crianças e adolescentes (art. 20)'
  ],
  citacao: {
    texto:
      'São vedadas as caixas de recompensa (loot boxes) oferecidas em jogos eletrônicos direcionados a crianças e a adolescentes ou de acesso provável por eles',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 20.'
  },
  paraODireito:
    'A definição do art. 2º, IV, é o ponto de partida: ela permite dizer se um jogo oferece caixa de recompensa. Sem essa leitura, a vedação do art. 20 não pode ser aplicada ao caso.',
  referencias: referenciaLei,
  blocoResumo: 'bloco-5'
};

const perfilamento: FichaPensador = {
  id: 'perfilamento',
  nome: 'Perfilamento',
  nomeCurto: 'Perfilamento',
  faseId: 'comercio',
  obras: obraLei,
  modoDePensar:
    'Perfilamento é classificar a pessoa em grupo ou perfil para fazer inferências sobre comportamento, saúde, preferências e desejos de consumo. Para crianças e adolescentes, a lei veda usá-lo para direcionar publicidade comercial.',
  conceitos: [
    'Definição do art. 2º, V',
    'Vedação para direcionar publicidade comercial (art. 22)',
    'Perfis comportamentais vedados, inclusive com dados da verificação de idade (art. 26)',
    'Vedação também para perfis feitos a partir de dados grupais e coletivos (art. 26)'
  ],
  citacao: {
    texto:
      'qualquer forma de tratamento de dados pessoais, automatizada ou não, para avaliar certos aspectos de uma pessoa natural',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 2º, V.'
  },
  paraODireito:
    'Na publicidade comercial dirigida a crianças e adolescentes, a lei veda usar o perfilamento para direcionar o anúncio.',
  ressalva:
    'A vedação dos arts. 22 e 26 é para a publicidade comercial. Outros usos de perfilamento continuam sujeitos às demais regras da lei, como a privacidade por padrão (art. 7º).',
  referencias: referenciaLei,
  blocoResumo: 'bloco-6'
};

const vinculoResponsavel: FichaPensador = {
  id: 'vinculo-com-responsavel',
  nome: 'Vínculo da conta com o responsável legal',
  nomeCurto: 'Vínculo até 16 anos',
  faseId: 'redes',
  obras: obraLei,
  modoDePensar:
    'Contas de crianças e adolescentes de até 16 anos devem estar ligadas a um responsável legal. Nas redes sociais, a lei acrescenta deveres de aviso, de restrição a conteúdos que atraem menores e de aprimoramento contínuo da verificação de idade.',
  conceitos: [
    'Idade de até 16 anos para o vínculo (art. 24, caput)',
    'Aviso claro quando o serviço é impróprio para menores (art. 24, § 1º)',
    'Suspensão do acesso diante de fundados indícios, com apelação do responsável (art. 24, § 4º)',
    'Regras documentadas para o tratamento de dados de crianças (art. 25)'
  ],
  citacao: {
    texto: 'estejam vinculados ao usuário ou à conta de um de seus responsáveis legais',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 24, caput.'
  },
  paraODireito:
    'A idade de 16 anos é o limite do vínculo com o responsável. Não confunda com os 18 anos do art. 9º, que tratam do acesso a conteúdo impróprio.',
  referencias: referenciaLei,
  blocoResumo: 'bloco-7'
};

const retiradaDeConteudo: FichaPensador = {
  id: 'retirada-de-conteudo',
  nome: 'Retirada de conteúdo violador',
  nomeCurto: 'Retirada de conteúdo',
  faseId: 'remocao',
  obras: obraLei,
  modoDePensar:
    'A retirada é um dever de proteção que não depende de decisão judicial. A notificação precisa ser identificada, pois a denúncia anônima é vedada, e quem publicou tem direito a contestar.',
  conceitos: [
    'Comunicação pela vítima, por representantes, pelo Ministério Público ou por entidades (art. 29)',
    'Notificação com identificação técnica do conteúdo e do autor, sob pena de nulidade (art. 29, § 2º)',
    'Conteúdos jornalísticos e de controle editorial ficam fora do procedimento (art. 29, § 4º)',
    'Direito de ser notificado, de conhecer o motivo e de recorrer (art. 30)'
  ],
  citacao: {
    texto:
      'proceder à retirada de conteúdo que viola direitos de crianças e de adolescentes assim que forem comunicados do caráter ofensivo da publicação pela vítima',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 29.'
  },
  paraODireito:
    'O procedimento dispensa a espera por ordem judicial, mas exige que a notificação seja identificada. Por isso o direito de contestação do art. 30 faz parte do mesmo sistema.',
  ressalva:
    'O art. 30, V, fala em definir prazos para o recurso e para a resposta, mas o texto não fixa esses prazos em número.',
  referencias: referenciaLei,
  blocoResumo: 'bloco-9'
};

const sancoes: FichaPensador = {
  id: 'sancoes',
  nome: 'Sanções administrativas e judiciais',
  nomeCurto: 'Sanções',
  faseId: 'sancoes',
  obras: obraLei,
  modoDePensar:
    'As sanções vão da advertência à proibição do exercício das atividades. A lei exige devido processo legal, ampla defesa e contraditório, e leva em conta a gravidade, a reincidência e a capacidade econômica na graduação.',
  conceitos: [
    'Advertência, multa simples, suspensão temporária e proibição (art. 35, I a IV)',
    'Quem aplica: a autoridade, para advertência e multa; o Judiciário, para suspensão e proibição (art. 35, § 5º)',
    'Circunstâncias de graduação da sanção (art. 35, § 1º)',
    'Destino das multas ao Fundo Nacional para a Criança e o Adolescente, por cinco anos (art. 36-A)'
  ],
  citacao: {
    texto: 'advertência, com prazo para adoção de medidas corretivas de até 30 (trinta) dias',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 35, I.'
  },
  paraODireito:
    'A lei vincula toda sanção ao processo: nenhuma das penalidades do art. 35 pode ser aplicada sem devido processo legal, ampla defesa e contraditório.',
  ressalva:
    'As sanções previstas na lei são aplicadas sem prejuízo das sanções cíveis, criminais ou administrativas. A lei não as exclui.',
  referencias: referenciaLei,
  blocoResumo: 'bloco-12'
};

const transparencia: FichaPensador = {
  id: 'relatorios-de-transparencia',
  nome: 'Relatórios de transparência e uso abusivo das denúncias',
  nomeCurto: 'Transparência',
  faseId: 'transparencia',
  obras: obraLei,
  modoDePensar:
    'A lei obriga os provedores com mais de 1.000.000 de usuários nessa faixa etária registrados a prestar contas em relatórios semestrais e a tratar as denúncias com transparência, inclusive o uso abusivo delas. Pesquisadores podem ter acesso gratuito a dados, sem finalidade comercial.',
  conceitos: [
    'Mais de 1.000.000 de usuários nessa faixa etária, com conexão no País (art. 31)',
    'Relatórios semestrais, em língua portuguesa (art. 31)',
    'Acesso gratuito a dados para pesquisa, sem finalidade comercial (art. 31, parágrafo único)',
    'Medidas contra o uso abusivo das denúncias (arts. 32 e 33)'
  ],
  citacao: {
    texto: 'mais de 1.000.000 (um milhão) de usuários nessa faixa etária registrados',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 31.'
  },
  paraODireito:
    'A transparência é, para o Direito, um instrumento de controle: os relatórios permitem verificar como o provedor trata as denúncias e a moderação. A lei exige critérios objetivos e recurso também para a sanção ao uso abusivo das denúncias (art. 33, § 2º).',
  ressalva:
    'A obrigação de relatório depende do número de usuários, e o art. 39 modula as obrigações pelo número de usuários e pelo porte do fornecedor.',
  referencias: referenciaLei,
  blocoResumo: 'bloco-10'
};

const autoridade: FichaPensador = {
  id: 'autoridade-administrativa',
  nome: 'Autoridade administrativa autônoma de proteção',
  nomeCurto: 'Autoridade',
  faseId: 'fiscalizacao',
  obras: obraLei,
  modoDePensar:
    'A autoridade é uma entidade da administração pública, criada por lei, que zela pela aplicação da lei e fiscaliza seu cumprimento em todo o território nacional. Sua atuação tem limites: não pode autorizar vigilância massiva e deve ser proporcional ao risco.',
  conceitos: [
    'Entidade da administração pública criada por lei (art. 2º, X)',
    'Fiscalização e normas complementares (art. 34)',
    'Recomendações e orientações sobre práticas relevantes (art. 5º, § 3º)',
    'Abordagem responsiva e assimetrias regulatórias (art. 34, § 2º)'
  ],
  citacao: {
    texto: 'fiscalizar o cumprimento desta Lei em todo o território nacional',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 34.'
  },
  paraODireito:
    'A autoridade é quem põe a lei em prática: fiscaliza, regulamenta e aplica a advertência e a multa do art. 35, sempre dentro do processo que a lei exige.',
  ressalva:
    'O texto não dá nome à entidade. Ao longo da lei, ela é tratada como autoridade administrativa autônoma de proteção dos direitos de crianças e de adolescentes no ambiente digital.',
  referencias: referenciaLei,
  blocoResumo: 'bloco-11'
};

const vigencia: FichaPensador = {
  id: 'vigencia-da-lei',
  nome: 'Vigência da lei',
  nomeCurto: 'Vigência',
  faseId: 'vigencia',
  obras: obraLei,
  modoDePensar:
    'A lei foi sancionada em 17 de setembro de 2025, mas só passou a valer em 17 de março de 2026. Data de sanção e data de vigência são coisas diferentes.',
  conceitos: [
    'Sanção em 17 de setembro de 2025',
    'Vigência em 17 de março de 2026 (art. 41-A)',
    'Dispositivo incluído pela Lei nº 15.352, de 2026',
    'Artigos vetados: 36, 41 e o § 7º do art. 35'
  ],
  citacao: {
    texto: 'Esta Lei entra em vigor em 17 de março de 2026',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025, art. 41-A.'
  },
  paraODireito:
    'A vigência é o marco a partir do qual as obrigações da lei passam a ser exigíveis. O texto não traz regra específica sobre fatos anteriores à vigência.',
  referencias: referenciaLei,
  blocoResumo: 'bloco-13'
};

export const mapaFichamento: MapaFichamento = {
  titulo: 'ECA Digital',
  eras: [
    {
      id: 'alcance',
      nome: 'Bloco 1: Alcance, definições e deveres',
      fases: [
        { id: 'objeto', nome: 'Objeto, alcance e definições' },
        { id: 'deveres', nome: 'Deveres gerais dos fornecedores' }
      ]
    },
    {
      id: 'protecao',
      nome: 'Bloco 2: Idade, supervisão, publicidade e vínculo',
      fases: [
        { id: 'idade', nome: 'Verificação de idade e supervisão parental' },
        { id: 'comercio', nome: 'Jogos, publicidade e perfilamento' },
        { id: 'redes', nome: 'Vínculo com o responsável e redes sociais' }
      ]
    },
    {
      id: 'responsabilidade',
      nome: 'Bloco 3: Violações, denúncia e sanções',
      fases: [
        { id: 'remocao', nome: 'Violações graves, notificação e remoção' },
        { id: 'transparencia', nome: 'Transparência e uso abusivo das denúncias' },
        { id: 'fiscalizacao', nome: 'Autoridade e fiscalização' },
        { id: 'sancoes', nome: 'Sanções' }
      ]
    },
    {
      id: 'vigencia',
      nome: 'Bloco 4: Disposições finais e vigência',
      fases: [{ id: 'vigencia', nome: 'Disposições finais e vigência' }]
    }
  ],
  pensadores: [
    acessoProvavel,
    deverPrevencao,
    verificacaoIdade,
    supervisaoParental,
    caixasDeRecompensa,
    perfilamento,
    vinculoResponsavel,
    retiradaDeConteudo,
    transparencia,
    autoridade,
    sancoes,
    vigencia
  ]
};
