import type { BlocoResumo } from '../../../tipos';

/**
 * Blocos do resumo do ECA Digital, por tema da lei, na ordem em que a lei os
 * apresenta. Blocos 0 a 2: alcance, definições e deveres gerais. Blocos 3 a 7:
 * idade, supervisão, jogos, publicidade e vínculo. Blocos 8 a 11: violações,
 * notificação, transparência e autoridade. Bloco 12: sanções. Bloco 13:
 * disposições finais e vigência.
 */
export const resumo: readonly BlocoResumo[] = [
  {
    id: 'bloco-0',
    numero: 1,
    titulo: 'Objeto e alcance da lei',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 1º e 3º.',
    corpoHtml: `
      <p>A lei trata da proteção de crianças e de adolescentes em <strong>ambientes digitais</strong>. O alcance é definido pelo art. 1º: ela vale para todo produto ou serviço de tecnologia da informação <strong>direcionado</strong> a crianças e adolescentes no País, ou de <strong>acesso provável</strong> por eles, independentemente de localização, desenvolvimento, fabricação, oferta, comercialização ou operação.</p>
      <p>O parágrafo único do art. 1º explica quando o acesso é provável. Três situações são consideradas: suficiente probabilidade de uso e atratividade pelo público infantil e juvenil; considerável facilidade de acesso e de utilização; e significativo grau de risco à privacidade, à segurança ou ao desenvolvimento biopsicossocial, sobretudo em serviços de interação social e de compartilhamento de informações em larga escala.</p>
      <p>O art. 3º fixa o critério de toda a lei. Esses produtos devem garantir <strong>proteção prioritária</strong>, ter como parâmetro o <strong>melhor interesse</strong> da criança e do adolescente e adotar medidas adequadas e proporcionais para um nível elevado de privacidade, de proteção de dados e de segurança. O artigo remete ao Estatuto da Criança e do Adolescente e à Lei Geral de Proteção de Dados Pessoais.</p>
      <p>O parágrafo único do art. 3º trata da família: crianças e adolescentes têm o direito de ser educados, orientados e acompanhados por seus pais ou responsáveis legais quanto ao uso da internet, e a eles cabe o cuidado ativo e contínuo, com ferramentas de supervisão parental adequadas à idade e ao estágio de desenvolvimento.</p>
    `,
    resumo: [
      'A lei vale para produtos e serviços de tecnologia da informação direcionados a crianças e adolescentes, ou de acesso provável por eles.',
      'Acesso provável é definido por três situações: probabilidade de uso e atratividade, facilidade de acesso e risco significativo à privacidade, à segurança ou ao desenvolvimento.',
      'O melhor interesse da criança e do adolescente é o parâmetro de todos esses produtos (art. 3º).',
      'Pais e responsáveis legais exercem o cuidado ativo e contínuo, com ferramentas adequadas à idade (art. 3º, parágrafo único).'
    ],
    exemploHtml: `Um aplicativo desenvolvido no exterior, mas muito usado por adolescentes no País, entra no alcance da lei: o art. 1º afasta o critério da localização e considera o acesso provável por crianças e adolescentes.`
  },
  {
    id: 'bloco-1',
    numero: 2,
    titulo: 'Definições legais',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), art. 2º, §§ 1º e 2º.',
    corpoHtml: `
      <p>O art. 2º define os termos que a lei usa. A definição permite reconhecer um caso concreto. Os mais cobrados são estes:</p>
      <div class="tabela-rolavel" tabindex="0" role="region" aria-label="Tabela de definições">
        <table>
          <thead>
            <tr><th>Termo</th><th>O que é, segundo a lei</th></tr>
          </thead>
          <tbody>
            <tr><td>Produto ou serviço de tecnologia da informação</td><td>Produto ou serviço fornecido a distância, por meio eletrônico e em virtude de requisição individual, como aplicações de internet, programas, sistemas operacionais, lojas de aplicações e jogos eletrônicos conectados.</td></tr>
            <tr><td>Rede social</td><td>Aplicação de internet cuja principal finalidade é o compartilhamento e a disseminação de opiniões e informações pelos usuários, em textos ou arquivos de imagem, som ou vídeo.</td></tr>
            <tr><td>Caixa de recompensa</td><td>Funcionalidade de certos jogos eletrônicos que permite comprar, mediante pagamento, itens virtuais consumíveis ou vantagens aleatórias, sem conhecimento prévio do conteúdo.</td></tr>
            <tr><td>Perfilamento</td><td>Qualquer tratamento de dados pessoais que avalie uma pessoa para classificá-la em grupo ou perfil e fazer inferências sobre comportamento, saúde, preferências, interesses ou desejos de consumo, entre outros aspectos.</td></tr>
            <tr><td>Monitoramento infantil</td><td>Produto que permite aos pais ou responsáveis acompanhar as ações da criança ou do adolescente em ambientes digitais, por registro ou transmissão de imagens, sons, localização ou outros dados.</td></tr>
            <tr><td>Mecanismo de supervisão parental</td><td>Conjunto de configurações, ferramentas e salvaguardas tecnológicas que permitem aos pais supervisionar, limitar e gerenciar o uso do serviço, o conteúdo acessado e o tratamento de dados.</td></tr>
            <tr><td>Monetização</td><td>Remuneração direta ou indireta do usuário pela publicação ou exibição de conteúdo, inclusive por visualizações, assinaturas, doações, patrocínios e publicidade.</td></tr>
            <tr><td>Impulsionamento</td><td>Ampliação artificial do alcance, da visibilidade ou da priorização de conteúdo mediante pagamento ou valor estimável em dinheiro.</td></tr>
          </tbody>
        </table>
      </div>
      <p>O art. 2º define também loja de aplicações de internet (que distribui e facilita o download de aplicações), sistema operacional, serviço com controle editorial (conteúdos previamente selecionados, sem meios automatizados de seleção, por agente econômico responsável) e <strong>autoridade administrativa autônoma</strong> de proteção dos direitos de crianças e de adolescentes no ambiente digital, entidade criada por lei para zelar pela aplicação da lei e fiscalizar seu cumprimento em todo o território nacional.</p>
      <p>Pelo § 1º, os conceitos de criança e de adolescente vêm do Estatuto da Criança e do Adolescente, e os de internet e de aplicações vêm do Marco Civil da Internet. Pelo § 2º, os protocolos e padrões técnicos abertos que permitem a interconexão das redes não são produtos de tecnologia da informação para os fins da lei.</p>
    `,
    resumo: [
      'Caixa de recompensa: item virtual ou vantagem aleatória comprada sem conhecer previamente o conteúdo (art. 2º, IV).',
      'Perfilamento: classificar a pessoa em grupo ou perfil para inferir comportamento, preferências e desejos de consumo (art. 2º, V).',
      'Mecanismo de supervisão parental: configurações, ferramentas e salvaguardas que os pais usam para supervisionar e limitar (art. 2º, VIII).',
      'Protocolos técnicos que permitem a interconexão das redes ficam fora do conceito de produto de tecnologia da informação (art. 2º, § 2º).'
    ],
    exemploHtml: `Uma loja de jogos que vende itens que o jogador compra sem saber o que vai receber caracteriza caixa de recompensa. Um sistema que classifica usuários para mostrar anúncios caracteriza perfilamento. Sem a definição, o caso concreto não se liga à regra certa.`
  },
  {
    id: 'bloco-2',
    numero: 3,
    titulo: 'Deveres gerais dos fornecedores',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 4º a 8º.',
    corpoHtml: `
      <p>O capítulo II começa pelos fundamentos do uso de produtos digitais por crianças e adolescentes (art. 4º). Entre eles estão a proteção integral, a prevalência absoluta de seus interesses, a segurança contra intimidação, exploração, abuso, ameaça e outras formas de violência, o respeito à autonomia e ao desenvolvimento progressivo, a proteção contra a exploração comercial, a promoção da educação digital e a transparência no tratamento de dados.</p>
      <p>O art. 5º impõe os deveres de <strong>prevenção, proteção, informação e segurança</strong>, em conformidade com o Código de Defesa do Consumidor e com o Estatuto da Criança e do Adolescente. O § 1º exige medidas técnicas adequadas, inclusive mecanismos de segurança amplamente reconhecidos, para que a família prevenha o acesso e o uso inadequado. O § 2º define o melhor interesse como a proteção de privacidade, segurança, saúde mental e física, acesso à informação, liberdade de participação na sociedade, acesso significativo às tecnologias digitais e bem-estar.</p>
      <p>O art. 6º manda prevenir e mitigar, <strong>desde a concepção</strong> e ao longo da operação, o acesso, a exposição, a recomendação ou a facilitação de contato com conteúdos e práticas como: exploração e abuso sexual; violência física, intimidação sistemática virtual e assédio; indução a comportamentos que causem danos à saúde, como automutilação e suicídio; promoção de jogos de azar e de produtos proibidos a menores; práticas publicitárias predatórias, injustas ou enganosas; e conteúdo pornográfico.</p>
      <p>O art. 7º exige <strong>privacidade por padrão</strong>: a configuração de origem deve ser a mais protetiva disponível. Se a criança ou o responsável quiser uma configuração menos protetiva, a lei exige informação clara, acessível e adequada para essa escolha informada (§ 1º). O art. 8º manda fazer gerenciamento de riscos, avaliar o conteúdo pela faixa etária compatível com a classificação indicativa, impedir o encontro com conteúdo ilegal ou pornográfico, adotar por padrão configurações que evitem o uso compulsivo e informar a faixa etária no momento do acesso.</p>
    `,
    resumo: [
      'Os deveres são de prevenção, proteção, informação e segurança (art. 5º).',
      'Art. 6º: prevenir e mitigar, desde a concepção, riscos como exploração sexual, assédio, indução a danos à saúde e pornografia.',
      'Art. 7º: privacidade por padrão, no modelo mais protetivo disponível.',
      'Art. 8º: evitar o uso compulsivo e informar a faixa etária no momento do acesso.'
    ],
    exemploHtml: `Um aplicativo que nasce com o perfil aberto para qualquer pessoa vai no sentido oposto ao art. 7º, que manda começar pela configuração mais protetiva. Se a opção por menos proteção for oferecida, a lei exige que a escolha seja feita com informação clara.`
  },
  {
    id: 'bloco-3',
    numero: 4,
    titulo: 'Verificação de idade',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 9º a 15.',
    corpoHtml: `
      <p>Para menores de 18 anos, o acesso a conteúdo impróprio, inadequado ou proibido tem de ser barrado por medidas eficazes (art. 9º). A lei considera impróprios os produtos, serviços e conteúdos que contenham material pornográfico, ou quaisquer outros vedados pela legislação vigente (§ 2º).</p>
      <p>A lei é específica quanto à verificação: exige mecanismos <strong>confiáveis</strong> de verificação de idade <strong>a cada acesso</strong> e <strong>veda a autodeclaração</strong> (art. 9º, § 1º). Os provedores que disponibilizem conteúdo pornográfico devem impedir a criação de contas ou de perfis por crianças e adolescentes (§ 3º).</p>
      <p>O capítulo IV distribui as tarefas. Lojas de aplicações e sistemas operacionais devem aferir a idade de forma proporcional, auditável e tecnicamente segura, permitir que os pais configurem supervisão parental voluntária e fornecer o sinal de idade aos provedores por meio de interface de programação segura (art. 12). A autorização para baixar aplicativos depende de consentimento livre e informado dos pais, e a lei veda presumi-la quando os pais não se manifestam (art. 12, § 2º). O compartilhamento contínuo, automatizado e irrestrito desses dados é vedado (art. 12, § 1º).</p>
      <p>Os dados coletados para verificar a idade só podem ser usados para essa finalidade (art. 13). O art. 14 manda os fornecedores adotar medidas para receber as informações de idade, e o parágrafo único os obriga a manter mecanismos próprios contra o acesso indevido a conteúdos inadequados, independentemente do que façam sistemas e lojas. O art. 11 permite ao poder público atuar como regulador, certificador ou promotor de soluções técnicas de verificação, com participação social. O art. 15 trata da solidariedade: cumprir as obrigações do capítulo não exime os demais agentes da cadeia digital, e todos devem garantir de forma solidária a proteção integral.</p>
    `,
    resumo: [
      'Conteúdo impróprio para menores de 18 anos exige medidas eficazes para impedir o acesso (art. 9º).',
      'A verificação é feita a cada acesso, por mecanismo confiável, e a autodeclaração é vedada (art. 9º, § 1º).',
      'Lojas e sistemas operacionais aferem a idade e fornecem o sinal de idade por interface segura (art. 12).',
      'Os dados de verificação servem só a essa finalidade, e a responsabilidade pela proteção é solidária (arts. 13 e 15).'
    ],
    exemploHtml: `Um site que pergunta se o visitante tem mais de 18 anos e aceita qualquer resposta não cumpre o art. 9º, § 1º, porque a autodeclaração é vedada. A verificação precisa ser confiável e feita a cada acesso ao conteúdo.`
  },
  {
    id: 'bloco-4',
    numero: 5,
    titulo: 'Supervisão parental e monitoramento infantil',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 16 a 19.',
    corpoHtml: `
      <p>Os fornecedores devem disponibilizar a pais, responsáveis, crianças e adolescentes informações sobre riscos e medidas de segurança, incluídas privacidade e proteção de dados, com acesso independente da compra do produto (art. 16). Quando o tratamento de dados vai além do estritamente necessário para operar o serviço, o controlador deve mapear os riscos, mitigá-los e elaborar relatório de impacto, a ser compartilhado sob requisição da autoridade (art. 16, parágrafo único).</p>
      <p>O art. 17 exige ferramentas acessíveis e de fácil uso, informação em local de fácil acesso e aviso claro e visível quando a supervisão estiver em vigor. Exige também funções para limitar e monitorar o tempo de uso. O § 4º manda que as configurações-padrão sejam as de mais alto nível de proteção disponível, com, no mínimo:</p>
      <ul>
        <li>restrição à comunicação com crianças e adolescentes por usuários não autorizados;</li>
        <li>limitação de recursos que estendam artificialmente o uso, como reprodução automática de mídia, recompensas pelo tempo de uso e notificações;</li>
        <li>controle sobre sistemas de recomendação personalizados, com opção de desativação;</li>
        <li>restrição ao compartilhamento da geolocalização, com aviso prévio e claro;</li>
        <li>suporte emocional e de bem-estar, sempre que tecnicamente viável.</li>
      </ul>
      <p>O art. 18 diz o que as ferramentas devem permitir aos pais: gerenciar opções de conta e privacidade, restringir compras e transações financeiras, identificar os perfis de adultos com quem a criança se comunica, acessar métricas consolidadas do tempo de uso, ativar ou desativar salvaguardas e contar com informações e controles em língua portuguesa. É vedado ao fornecedor manipular interfaces para comprometer a escolha do usuário, sobretudo quando isso enfraquece a supervisão (art. 18, § 2º).</p>
      <p>O art. 19 trata do monitoramento infantil. Esses produtos devem garantir a inviolabilidade das imagens, dos sons e das informações captadas, armazenadas e transmitidas aos pais, e informar a criança, em linguagem apropriada, de que o monitoramento existe (§ 1º).</p>
    `,
    resumo: [
      'Fornecedores informam pais e adolescentes sobre riscos e medidas de segurança (art. 16).',
      'Configurações-padrão no nível mais alto de proteção, com limites a recompensas pelo tempo de uso e à reprodução automática (art. 17, § 4º).',
      'Os pais podem restringir compras, ver com quais adultos a criança conversa e acompanhar o tempo de uso (art. 18).',
      'O monitoramento infantil deve ser inviolável, e a criança deve ser informada dele (art. 19).'
    ],
    exemploHtml: `Um jogo que dá recompensa a cada hora de uso e reproduz vídeos sem parar traz exatamente os recursos que o art. 17, § 4º, II, cita como exemplos de limitação nas configurações-padrão. Os pais devem conferir se a ferramenta mostra o tempo de uso e permite desligar esses recursos.`
  },
  {
    id: 'bloco-5',
    numero: 6,
    titulo: 'Jogos eletrônicos e caixas de recompensa',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 20 e 21.',
    corpoHtml: `
      <p>Os jogos eletrônicos têm regras próprias. O art. 20 veda as <strong>caixas de recompensa</strong> (<em>loot boxes</em>) oferecidas em jogos direcionados a crianças e adolescentes, ou de acesso provável por eles, nos termos da classificação indicativa. Para reconhecer o caso, use a definição do art. 2º, IV: pagamento para obter item virtual ou vantagem aleatória, sem conhecimento prévio do conteúdo.</p>
      <p>Quando o jogo permite interação entre usuários, por texto, áudio ou vídeo, ou por troca de conteúdos, de forma síncrona ou assíncrona, o art. 21 manda observar integralmente as salvaguardas do art. 16 da Lei nº 14.852, de 3 de maio de 2024. Elas tratam especialmente de moderação de conteúdos, proteção contra contatos prejudiciais e atuação parental sobre os mecanismos de comunicação. Pelo parágrafo único, essas funcionalidades devem ser limitadas por padrão, de modo a assegurar o consentimento dos pais ou responsáveis legais.</p>
    `,
    resumo: [
      'Caixas de recompensa (loot boxes) são vedadas em jogos direcionados a crianças e adolescentes, ou de acesso provável por eles (art. 20).',
      'Caixa de recompensa é compra de item ou vantagem aleatória sem conhecer o conteúdo antes (art. 2º, IV).',
      'Jogos com interação entre usuários devem ter moderação de conteúdos e proteção contra contatos prejudiciais (art. 21).',
      'A interação entre usuários é limitada por padrão, para assegurar o consentimento dos pais (art. 21, parágrafo único).'
    ],
    exemploHtml: `Um jogo que vende pacotes de sorte, sem que o jogador saiba o que vai receber, é caixa de recompensa, e a lei veda essa oferta nos jogos direcionados a crianças e adolescentes ou de acesso provável por eles, nos termos da respectiva classificação indicativa. Um jogo com bate-papo entre desconhecidos exige moderação e, por padrão, limites à interação.`
  },
  {
    id: 'bloco-6',
    numero: 7,
    titulo: 'Publicidade e perfilamento',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 22, 23 e 26.',
    corpoHtml: `
      <p>O capítulo VIII trata da publicidade em meio digital. O art. 22 veda o uso de técnicas de <strong>perfilamento</strong> para direcionar publicidade comercial a crianças e adolescentes. Também veda o emprego de análise emocional, de realidade aumentada, de realidade estendida e de realidade virtual para esse fim.</p>
      <p>O art. 26 reforça a regra para a construção de perfis: é vedada a criação de perfis comportamentais de crianças e adolescentes a partir dos dados coletados e tratados, inclusive os obtidos na verificação de idade, e também a partir de dados grupais e coletivos, para fins de direcionamento de publicidade comercial.</p>
      <p>O art. 23 veda aos provedores de aplicações de internet a monetização e o impulsionamento de conteúdos que retratem crianças e adolescentes de forma erotizada ou sexualmente sugestiva, ou em contexto próprio do universo sexual adulto. A vedação alcança a monetização e o impulsionamento desse tipo de conteúdo.</p>
    `,
    resumo: [
      'É vedado o perfilamento para direcionar publicidade comercial a crianças e adolescentes (art. 22).',
      'Também é vedada a análise emocional e o uso de realidade aumentada, estendida ou virtual com o mesmo fim (art. 22).',
      'Perfis comportamentais de crianças e adolescentes para publicidade são vedados, inclusive com dados da verificação de idade (art. 26).',
      'Monetização e impulsionamento de conteúdo erotizado com crianças e adolescentes são vedados (art. 23).'
    ],
    exemploHtml: `Um anúncio de brinquedo que aparece para uma criança porque o sistema concluiu, a partir do histórico de cliques, que ela se interessa por brinquedos é o caso que o art. 22 veda: o direcionamento se apoia em perfilamento, definido no art. 2º, V.`
  },
  {
    id: 'bloco-7',
    numero: 8,
    titulo: 'Vínculo com o responsável até 16 anos e regras das redes sociais',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 24 e 25.',
    corpoHtml: `
      <p>O art. 24 vale para os provedores de produtos ou serviços direcionados a crianças e adolescentes, ou de acesso provável por eles. Esses provedores devem garantir que as contas de usuários de <strong>até 16 anos</strong> estejam vinculadas a um responsável legal.</p>
      <p>Nas redes sociais, o § 1º manda que, se o serviço for impróprio ou inadequado para crianças e adolescentes, o provedor informe isso de forma clara, destacada e acessível. Deve também monitorar e restringir, no limite de suas capacidades técnicas, a exibição de conteúdos que tenham como objetivo evidente atrair crianças e adolescentes, e aprimorar de maneira contínua a verificação de idade.</p>
      <p>O § 3º permite pedir ao responsável confirmação de identificação quando há fundados indícios de conta operada por criança, e os dados coletados servem exclusivamente à verificação de idade. Diante de fundados indícios de conta operada por criança ou adolescente fora da idade mínima, o provedor deve suspender o acesso e assegurar um procedimento célere e acessível, em que o responsável possa apresentar apelação e comprovar a idade (§ 4º). Na ausência do responsável, a configuração de supervisão não pode ser alterada para um nível menor de proteção (§ 5º).</p>
      <p>O art. 25 exige que as redes sociais tenham regras específicas para o tratamento de dados de crianças e adolescentes, definidas de forma concreta e documentada e com base no melhor interesse.</p>
    `,
    resumo: [
      'Contas de crianças e adolescentes de até 16 anos devem estar vinculadas a um responsável legal (art. 24).',
      'Redes sociais impróprias para menores devem avisar isso de forma clara e destacada (art. 24, § 1º).',
      'Indícios de conta fora da idade mínima levam à suspensão do acesso, com apelação do responsável (art. 24, § 4º).',
      'As redes sociais devem ter regras documentadas de tratamento de dados de crianças e adolescentes (art. 25).'
    ],
    exemploHtml: `Uma conta de criança de 12 anos que aparece numa rede social sem nenhum responsável vinculado é a situação que o art. 24 quer evitar. Havendo fundados indícios disso, o provedor suspende o acesso e precisa oferecer ao responsável um procedimento para apelar e comprovar a idade.`
  },
  {
    id: 'bloco-8',
    numero: 9,
    titulo: 'Violações graves: remoção e comunicação às autoridades',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), art. 27.',
    corpoHtml: `
      <p>O capítulo X trata das violações graves no ambiente digital. Os fornecedores de produtos ou serviços disponíveis no território nacional devem remover e comunicar às autoridades nacionais e internacionais competentes os conteúdos de aparente exploração, de abuso sexual, de sequestro e de aliciamento detectados em seus produtos ou serviços, na forma de regulamento (art. 27).</p>
      <p>O art. 27 vai além da remoção: manda também comunicar. Os relatórios de notificação devem ser enviados à autoridade competente, observados os requisitos e os prazos do regulamento (§ 1º).</p>
      <p>O § 2º manda reter, pelo prazo do art. 15 do Marco Civil da Internet, os dados associados a um relatório de exploração e de abuso sexual: o conteúdo gerado, carregado ou compartilhado pelo usuário mencionado e seus metadados, além dos dados do usuário responsável pelo conteúdo. O § 3º permite prazo maior, desde que haja requerimento na forma do § 2º do art. 15 do Marco Civil.</p>
    `,
    resumo: [
      'Conteúdos de aparente exploração, abuso sexual, sequestro e aliciamento devem ser removidos e comunicados às autoridades (art. 27).',
      'A comunicação segue o regulamento, inclusive quanto a requisitos e prazos (art. 27, § 1º).',
      'Os dados ligados ao relatório de exploração e abuso sexual são retidos pelo prazo do Marco Civil da Internet (art. 27, § 2º).',
      'O prazo de retenção pode ser maior, mediante requerimento (art. 27, § 3º).'
    ],
    exemploHtml: `Quando uma plataforma detecta conteúdo de aparente abuso sexual de criança, o art. 27 manda remover e comunicar às autoridades competentes. Apagar a publicação sem comunicar não cumpre a lei.`
  },
  {
    id: 'bloco-9',
    numero: 10,
    titulo: 'Notificação, retirada de conteúdo e contestação',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 28 a 30.',
    corpoHtml: `
      <p>Os fornecedores devem disponibilizar aos usuários mecanismos de notificação sobre violações aos direitos de crianças e adolescentes. Quando notificados, devem, se for o caso, oficiar às autoridades competentes para a investigação, na forma de regulamento (art. 28).</p>
      <p>O art. 29 cria o dever de retirada. Conteúdo que viola direitos de crianças e adolescentes deve sair assim que o fornecedor for comunicado do caráter ofensivo pela vítima, por seus representantes, pelo Ministério Público ou por entidades de defesa desses direitos, <strong>independentemente de ordem judicial</strong>. São violadores os conteúdos do art. 6º, nos termos da classificação indicativa (§ 1º).</p>
      <p>A notificação precisa conter, sob pena de nulidade, elementos que permitam a identificação técnica específica do conteúdo apontado e do autor da notificação. A <strong>denúncia anônima é vedada</strong> (§ 2º). O mecanismo de notificação deve ser público e de fácil acesso (§ 3º). Ficam fora desse procedimento os conteúdos jornalísticos e os submetidos a controle editorial (§ 4º).</p>
      <p>O art. 30 garante a quem publicou o conteúdo o direito de contestar a decisão: ser notificado da retirada; conhecer o motivo e a fundamentação, com a informação de que a identificação foi feita por análise humana ou automatizada; recorrer, com acesso fácil ao recurso; e conhecer os prazos procedimentais para recorrer e para a resposta.</p>
    `,
    resumo: [
      'A retirada de conteúdo violador independe de ordem judicial, após comunicação da vítima, de seus representantes, do Ministério Público ou de entidades (art. 29).',
      'A notificação sem identificação técnica do conteúdo e do autor é nula, e a denúncia anônima é vedada (art. 29, § 2º).',
      'Quem publicou o conteúdo tem direito de ser notificado, de conhecer o motivo e de recorrer (art. 30).',
      'Conteúdos jornalísticos e de controle editorial ficam fora do procedimento de retirada (art. 29, § 4º).'
    ],
    exemploHtml: `Uma notificação que aponta o vídeo, identifica quem a faz e descreve tecnicamente o conteúdo atende ao § 2º do art. 29. Uma denúncia sem identificação, mesmo que grave, não atende. Quem publicou o vídeo, ao vê-lo removido, deve receber o motivo e poder recorrer (art. 30).`
  },
  {
    id: 'bloco-10',
    numero: 11,
    titulo: 'Transparência e uso abusivo das denúncias',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 31 a 33.',
    corpoHtml: `
      <p>O art. 31 obriga os provedores de aplicações direcionadas a crianças e adolescentes, ou de acesso provável por eles, que tenham <strong>mais de 1.000.000</strong> de usuários nessa faixa etária registrados, com conexão no território nacional, a publicar relatórios <strong>semestrais</strong>, em língua portuguesa, no próprio sítio eletrônico. Os relatórios devem conter, entre outros itens, os canais de denúncia, a quantidade de denúncias recebidas, a moderação por tipo, as medidas para identificar contas infantis e atos ilícitos e os aprimoramentos técnicos de proteção de dados e de consentimento parental.</p>
      <p>O parágrafo único do art. 31 manda viabilizar, de forma gratuita, o acesso a dados para pesquisas sobre os impactos desses produtos nos direitos de crianças e adolescentes, feitas por instituições acadêmicas, científicas, tecnológicas, de inovação ou jornalísticas. Esses dados não podem ser usados para finalidades comerciais.</p>
      <p>Os arts. 32 e 33 tratam do uso abusivo das denúncias. Os provedores devem identificar esse uso, para coibir denúncias feitas com fins de censura, perseguição ou outras práticas ilícitas (art. 32). Devem informar as hipóteses de uso indevido e as sanções cabíveis (art. 33). As medidas, entre outras adequadas, proporcionais e necessárias, são a suspensão temporária da conta do infrator, o cancelamento em caso de reincidência ou abuso grave e a comunicação às autoridades quando houver indícios de infração penal ou de violação de direitos (§ 1º). O procedimento precisa ter critérios técnicos e objetivos, notificação ao usuário, possibilidade de recurso e prazos (§ 2º).</p>
    `,
    resumo: [
      'Provedores com mais de 1.000.000 de usuários nessa faixa etária publicam relatórios semestrais (art. 31).',
      'Pesquisas acadêmicas, científicas e jornalísticas têm acesso gratuito a dados, sem finalidade comercial (art. 31, parágrafo único).',
      'O uso abusivo das denúncias, para censura ou perseguição, deve ser coibido (art. 32).',
      'Ao usuário que abusa das denúncias podem ser aplicadas suspensão temporária da conta, cancelamento em caso de reincidência ou abuso grave, e comunicação às autoridades (art. 33, § 1º).'
    ],
    exemploHtml: `Uma empresa com mais de um milhão de usuários nessa faixa etária precisa publicar relatórios a cada semestre. Já o usuário que abusa dos instrumentos de denúncia para perseguir outra pessoa pode ter a conta suspensa, conforme o art. 33, § 1º.`
  },
  {
    id: 'bloco-11',
    numero: 12,
    titulo: 'Autoridade e fiscalização',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 2º, X, 5º, § 3º, e 34.',
    corpoHtml: `
      <p>A autoridade administrativa autônoma de proteção dos direitos de crianças e de adolescentes no ambiente digital fiscaliza o cumprimento da lei em todo o território nacional e pode editar normas complementares para regulamentar seus dispositivos (art. 34). Ela também pode emitir recomendações e orientações sobre práticas relevantes (art. 5º, § 3º) e definir, por regulamento, diretrizes e padrões mínimos sobre supervisão parental (art. 17, § 1º).</p>
      <p>A lei fixa limites a essa atuação. A regulamentação não pode, em nenhuma hipótese, autorizar ou resultar em mecanismos de vigilância massiva, genérica ou indiscriminada, nem em práticas contra a liberdade de expressão, a privacidade, a proteção integral e o tratamento diferenciado dos dados de crianças e adolescentes (art. 34, § 1º). A autoridade deve observar as assimetrias regulatórias e adotar abordagem responsiva, com tratamento diferenciado e proporcional a serviços de natureza, risco e modelo de negócio distintos (art. 34, § 2º).</p>
    `,
    resumo: [
      'A autoridade administrativa autônoma fiscaliza a lei em todo o território nacional (art. 34).',
      'Ela pode editar normas complementares (art. 34), emitir recomendações (art. 5º, § 3º) e definir padrões mínimos de supervisão parental (art. 17, § 1º).',
      'A regulamentação não pode autorizar vigilância massiva, genérica ou indiscriminada (art. 34, § 1º).',
      'A atuação observa as assimetrias regulatórias e é proporcional ao risco e ao modelo de negócio (art. 34, § 2º).'
    ],
    exemploHtml: `Se uma regulamentação quisesse acompanhar as conversas de todas as crianças do País, sem critério, o art. 34, § 1º, a impediria. A lei admite a regulamentação, mas proíbe que ela instale vigilância massiva.`
  },
  {
    id: 'bloco-12',
    numero: 13,
    titulo: 'Sanções: penalidades e quem as aplica',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 35 e 36-A.',
    corpoHtml: `
      <p>Em caso de descumprimento, sem prejuízo das sanções cíveis, criminais ou administrativas, e assegurados o devido processo legal, a ampla defesa e o contraditório, o infrator está sujeito a quatro penalidades (art. 35):</p>
      <ul>
        <li><strong>Advertência</strong>, com prazo de até 30 dias para adotar medidas corretivas;</li>
        <li><strong>Multa simples</strong>: de até 10% do faturamento do grupo econômico no Brasil no último exercício; ou, sem faturamento, de R$ 10,00 a R$ 1.000,00 por usuário cadastrado do provedor, limitada, no total, a R$ 50.000.000,00 por infração;</li>
        <li><strong>Suspensão temporária das atividades</strong>;</li>
        <li><strong>Proibição do exercício das atividades</strong>.</li>
      </ul>
      <p>Para graduar a sanção, devem ser observadas a proporcionalidade e a razoabilidade, além da gravidade da infração, da reincidência, da capacidade econômica (no caso da multa) e da finalidade social do fornecedor (§ 1º). Em empresa estrangeira, a filial, a sucursal, o escritório ou o estabelecimento situado no País respondem solidariamente pela multa (§ 2º).</p>
      <p>A aplicação é dividida. A autoridade administrativa aplica a advertência e a multa (incisos I e II, § 5º). O Poder Judiciário aplica a suspensão e a proibição (incisos III e IV, § 5º). Quando a suspensão ou a proibição não forem cumpridas pelo próprio infrator, a ordem de bloqueio é dirigida às prestadoras de conexão e a outros agentes que viabilizam o acesso (§ 6º). Os valores das multas são atualizados anualmente pelo IPCA (§ 4º).</p>
      <p>O art. 36-A destina os valores das multas, pelo prazo de cinco anos, ao Fundo Nacional para a Criança e o Adolescente, para políticas e projetos de proteção de crianças e adolescentes.</p>
    `,
    resumo: [
      'Penalidades: advertência, multa simples, suspensão temporária e proibição do exercício das atividades (art. 35).',
      'Multa: até 10% do faturamento do grupo no Brasil, ou, sem faturamento, de R$ 10,00 a R$ 1.000,00 por usuário cadastrado.',
      'Advertência e multa são aplicadas pela autoridade administrativa; suspensão e proibição, pelo Poder Judiciário (art. 35, § 5º).',
      'Os valores das multas vão ao Fundo Nacional para a Criança e o Adolescente por cinco anos (art. 36-A).'
    ],
    exemploHtml: `Para calcular a multa, a lei usa duas bases diferentes: o percentual do faturamento do grupo no Brasil ou, na falta de faturamento, um valor por usuário cadastrado. Antes de responder, identifique qual das duas se aplica ao caso.`
  },
  {
    id: 'bloco-13',
    numero: 14,
    titulo: 'Disposições finais e vigência',
    fonte: 'Lei nº 15.211, de 17 de setembro de 2025 (ECA Digital), arts. 37 a 41-A.',
    corpoHtml: `
      <p>O art. 37 manda o Poder Executivo regulamentar a lei, no que couber, e veda que a regulamentação autorize vigilância massiva. O art. 38 obriga as embalagens de equipamentos eletrônicos de uso pessoal com acesso à internet, fabricados no País ou importados, a trazer adesivo em português que informe aos pais a necessidade de proteger crianças e adolescentes do acesso a conteúdo impróprio ou inadequado para a faixa etária.</p>
      <p>O art. 39 modula as obrigações. As dos arts. 6º, 17, 18, 19, 20, 27, 28, 29, 31, 32 e 40 se aplicam conforme as características e funcionalidades do produto, o grau de interferência do fornecedor sobre os conteúdos, o número de usuários e o porte do fornecedor. Os provedores de serviços com controle editorial e os de conteúdos protegidos por direitos autorais licenciados ficam dispensados dessas obrigações se observarem a classificação indicativa, forem transparentes na classificação etária, oferecerem mediação parental de acesso facilitado e oferecerem canais de denúncia quanto a conteúdos em desconformidade (§ 1º).</p>
      <p>O art. 40 manda os fornecedores de produtos ou serviços do art. 1º manter representante legal no País, com poderes para receber citações, intimações e notificações em processos judiciais e administrativos, e para responder perante órgãos do Executivo, do Judiciário e do Ministério Público, assumindo, em nome da empresa estrangeira, suas responsabilidades.</p>
      <p>O art. 41-A fixa a vigência: a lei entra em vigor em <strong>17 de março de 2026</strong>, conforme incluído pela Lei nº 15.352, de 2026. A lei foi sancionada em 17 de setembro de 2025, mas a data da sanção não é a da vigência. Os arts. 36 e 41 foram vetados, assim como o § 7º do art. 35.</p>
    `,
    resumo: [
      'Embalagens de equipamentos com acesso à internet devem trazer adesivo em português sobre a proteção de crianças (art. 38).',
      'As obrigações são moduladas pelo tipo de produto, pelo número de usuários e pelo porte do fornecedor (art. 39).',
      'Fornecedores do art. 1º devem manter representante legal no País (art. 40).',
      'Vigência: 17 de março de 2026, e não a data da sanção, em 17 de setembro de 2025 (art. 41-A).'
    ],
    exemploHtml: `A lei foi sancionada em 17 de setembro de 2025, mas só entrou em vigor em 17 de março de 2026, conforme o art. 41-A. Não confunda a data da sanção com a data em que a lei passou a valer.`
  }
];
