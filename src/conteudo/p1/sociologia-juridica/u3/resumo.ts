import type { BlocoResumo } from '../../../tipos';

/**
 * Blocos do resumo da Unidade 3 de Sociologia Jurídica. A linha de estudo vai
 * da forma de olhar a infância e as mídias, passa pelos números, pelos riscos
 * e pelos crimes, pela mediação e pelo vínculo familiar, e termina com a
 * responsabilidade pela segurança e um quadro comparativo das duas autoras.
 *
 * Blocos 1 a 3: contexto e riscos. Blocos 4 a 6: crimes e controle parental.
 * Blocos 7 a 9: exposição, vínculo e responsabilidade. Bloco 10: quadro comparativo.
 */
export const resumo: readonly BlocoResumo[] = [
  {
    id: 'bloco-0',
    numero: 1,
    titulo: 'Três modos de olhar a infância e as mídias',
    fonte: 'SANTOS (2025), Controle parental em redes sociais digitais, citando OTHON (2021).',
    corpoHtml: `
      <p>Santos parte de Renata Othon (2021) para mostrar que as pesquisas sobre mídia e infância costumam oscilar entre três pontos de vista.</p>
      <ul>
        <li><strong>Perspectiva crítica:</strong> apoiada na ideia de desaparecimento da infância.</li>
        <li><strong>Entendimento natural e intuitivo:</strong> vê a relação das crianças com as mídias como algo natural e espontâneo.</li>
        <li><strong>Infâncias pluralizadas:</strong> um olhar menos dicotômico, que busca entender o fenômeno social com ênfase nas mediações.</li>
      </ul>
      <p>É o terceiro ponto de vista que orienta a discussão de Santos. Ela lembra que as experiências das crianças com esses meios não são homogêneas: a estrutura familiar, as formas de acesso à internet e as condições socioeconômicas variam muito de um território para outro.</p>
      <p>A criança, nesse cenário, passa a ser <strong>coprodutora de conteúdo</strong> e, ao mesmo tempo, consumidora.</p>
    `,
    resumo: [
      'Três pontos de vista: crítico (desaparecimento da infância), natural e intuitivo, e infâncias pluralizadas com ênfase nas mediações.',
      'O terceiro olhar, o menos dicotômico, é o que Santos adota.',
      'As experiências infantis não são homogêneas: família, acesso e condição socioeconômica pesam.',
      'A criança é coprodutora de conteúdo e, ao mesmo tempo, consumidora.'
    ],
    exemploHtml: `Uma criança com aparelho próprio e outra sem acesso à internet em casa não vivem a mesma infância digital. Othon, citada por Santos, pede que essa diferença seja levada em conta.`
  },
  {
    id: 'bloco-1',
    numero: 2,
    titulo: 'Infâncias conectadas em números',
    fonte: 'SANTOS (2025); NÓBREGA (2024).',
    corpoHtml: `
      <p>Os números citados pelas duas autoras têm fontes e anos diferentes. Por isso medem coisas próximas, mas não idênticas.</p>
      <ul>
        <li>Santos, com a pesquisa TICs Kids Online Brasil (2021): <strong>78%</strong> das crianças e adolescentes de 9 a 17 anos estão ativamente nas redes sociais.</li>
        <li>Santos, com a Common Sense Media (Estados Unidos, 2020, crianças de 0 a 8 anos): cerca de <strong>72%</strong> dos pais consideram a interação com tecnologias benéfica e dizem não se preocupar com o tempo de tela.</li>
        <li>Nóbrega, com dados de janeiro de 2023: <strong>84%</strong> da população brasileira usava a internet (181,8 milhões de pessoas em um total de 215,8 milhões).</li>
        <li>Nóbrega, com dados de 2022: os brasileiros passam, em média, <strong>3 horas e 46 minutos</strong> por dia conectados às redes sociais.</li>
      </ul>
      <p>Nóbrega aponta que crianças e adolescentes usam principalmente <strong>TikTok, Instagram e YouTube</strong>. Entre as sete redes mais usadas no Brasil, segundo o relatório que ela cita, o WhatsApp aparece em primeiro lugar, com 169 milhões de usuários.</p>
    `,
    resumo: [
      '78% das crianças e adolescentes de 9 a 17 anos estão nas redes sociais (Santos, dados de 2021).',
      '84% da população brasileira usava a internet em janeiro de 2023 (Nóbrega).',
      'Crianças e adolescentes usam principalmente TikTok, Instagram e YouTube (Nóbrega).',
      'Common Sense Media: cerca de 72% dos pais dos Estados Unidos veem benefício na interação com tecnologias (0 a 8 anos).'
    ],
    exemploHtml: `Ao encontrar um número numa prova ou num texto, a primeira pergunta é de qual ano e de qual faixa etária ele fala. As duas autoras indicam isso ao citar cada pesquisa.`
  },
  {
    id: 'bloco-2',
    numero: 3,
    titulo: 'Os três tipos de risco',
    fonte: 'SANTOS (2025), citando HASEBRINK et al. (2009).',
    corpoHtml: `
      <p>Santos apoia-se em Hasebrink et al. (2009) para classificar os perigos online em três tipos. A diferença entre eles está no papel que a criança ocupa.</p>
      <h3>Risco de conteúdo</h3>
      <p>A criança é <strong>receptora</strong>. Recebe conteúdo publicitário ou spam com mensagens inapropriadas.</p>
      <h3>Risco de contato</h3>
      <p>A criança é <strong>receptora-participante</strong>. Tem a privacidade violada e comercializada, ou sofre bullying ou assédio online.</p>
      <h3>Risco de conduta</h3>
      <p>A criança é <strong>ator</strong> de atos de violência online, por exemplo, quando compartilha imagens pornográficas na rede ou faz bullying com os pares.</p>
      <p>O critério é o papel da criança. Por isso o bullying aparece nos dois extremos: no risco de contato, quando a criança sofre, e no risco de conduta, quando ela pratica.</p>
    `,
    resumo: [
      'Risco de conteúdo: a criança recebe conteúdo inapropriado ou spam.',
      'Risco de contato: a criança tem a privacidade violada, sofre bullying ou assédio.',
      'Risco de conduta: a criança pratica violência online, como bullying com os pares.',
      'O critério é o papel da criança: receptora, receptora-participante ou ator.'
    ],
    exemploHtml: `Um anúncio com conteúdo impróprio que chega a uma criança é risco de conteúdo. Se essa mesma criança passa a fazer bullying com um colega, ela passa a ocupar o papel de risco de conduta.`
  },
  {
    id: 'bloco-3',
    numero: 4,
    titulo: 'Crimes digitais e o aliciamento que começa pela confiança',
    fonte: 'NÓBREGA (2024), citando STANGER (2023).',
    corpoHtml: `
      <p>Nóbrega cita a perita criminal aposentada Andreia Stanger (2023) para lembrar que muitos crimes digitais não são novos, mas ganharam sofisticação e alcance com as tecnologias. Calúnia, difamação, injúria, fraudes, racismo e violação de direitos autorais estão entre os exemplos da lista dela.</p>
      <p>Entre os crimes que mais afetam crianças e adolescentes, a autora lista: abuso sexual, pedofilia e pornografia infantil; cyberbullying; incitação ao crime; jogos de azar; sextortion (extorsão com fotos ou vídeos de cunho sexual); e tráfico de pessoas.</p>
      <p>Segundo Nóbrega, o abuso pode acontecer à distância, sem toque físico. Antes disso, o abusador costuma se aproximar com elogios e atenção, e a criança passa a se sentir especial. A comunicação pode começar meses ou anos antes do abuso, e o agressor muitas vezes não é um completo estranho.</p>
      <p>A autora também lista outros riscos: acesso a conteúdo impróprio para a idade, aliciamento em desafios como o da baleia azul, grupos pró-anorexia e pró-bulimia, comparação social com a vida aparentemente perfeita de influenciadores, e vício em jogos. Muitos desses perigos podem levar à ansiedade, à depressão e até ao suicídio.</p>
    `,
    resumo: [
      'Crimes digitais: muitos já existiam, mas ganharam alcance e sofisticação com a tecnologia (Stanger).',
      'Crimes que mais afetam crianças e adolescentes: abuso sexual, cyberbullying, sextortion, tráfico de pessoas e outros.',
      'O abuso pode acontecer à distância, e a aproximação começa com elogios e atenção.',
      'Riscos como o aliciamento em grupos de automutilação ou pró-anorexia podem levar à ansiedade, à depressão ou ao suicídio.'
    ],
    exemploHtml: `Quando alguém ameaça um adolescente para que ele envie fotos íntimas, sob pena de divulgar outras imagens, a situação se chama sextortion, crime descrito na lista de Stanger, citada por Nóbrega.`
  },
  {
    id: 'bloco-4',
    numero: 5,
    titulo: 'Controle parental: o que as plataformas oferecem',
    fonte: 'SANTOS (2025), Controle parental em redes sociais digitais.',
    corpoHtml: `
      <p>Santos aponta uma confusão comum: as ferramentas de controle parental costumam ser vistas como programas que precisam ser instalados no aparelho. Mas também existem configurações dentro das próprias redes e aplicativos, e até em serviços de streaming.</p>
      <p>A autora cita alguns exemplos:</p>
      <ul>
        <li>um <strong>modo kids ou infantil</strong>, que já é uma ferramenta de controle parental;</li>
        <li>a escolha entre <strong>perfil público ou fechado</strong>;</li>
        <li><strong>bloqueio de comentários</strong> com determinados assuntos;</li>
        <li><strong>conexão entre o perfil de um adulto responsável e o de uma criança ou adolescente</strong>, para mediar a experiência.</li>
      </ul>
      <p>O problema, segundo Santos, é que essas estratégias não são amplamente divulgadas. Muitos pais nem sabem que elas existem e, por isso, não conseguem usá-las para tornar a vivência online dos filhos mais segura.</p>
    `,
    resumo: [
      'Controle parental também existe dentro das plataformas, além dos programas instalados nos aparelhos.',
      'Exemplos: modo kids, perfil público ou fechado, bloqueio de comentários e perfil de adulto vinculado.',
      'As ferramentas são pouco divulgadas, e muitos pais não sabem que existem.',
      'O foco do estudo é a perspectiva dos pais, que mediam o acesso das crianças aos conteúdos.'
    ],
    exemploHtml: `Um pai que deixa o perfil do filho fechado e vincula o próprio perfil ao dele está usando estratégias de mediação previstas pelas plataformas, sem precisar instalar nenhum programa.`
  },
  {
    id: 'bloco-5',
    numero: 6,
    titulo: 'O que os pais temem e o que mais valorizam',
    fonte: 'SANTOS (2025), Controle parental em redes sociais digitais.',
    corpoHtml: `
      <p>A pesquisa de Santos ouviu pais de crianças de 10 a 15 anos, matriculadas em três escolas públicas da rede estadual de Pernambuco, na cidade de Petrolina. Os questionários foram aplicados em junho de 2024, como recorte de uma pesquisa de doutorado defendida em outubro de 2024.</p>
      <p>As preocupações mais citadas pelos pais, em ordem, foram:</p>
      <ol>
        <li>contato com estranhos: 75,8%, provavelmente pelo risco de crimes como assédio e pedofilia;</li>
        <li>acesso a conteúdo inapropriado: 65,2%;</li>
        <li>uso excessivo de tempo nas redes: 57,6%;</li>
        <li>proteção da privacidade do filho: 50%;</li>
        <li>cyberbullying: 30,3%.</li>
      </ol>
      <p>Quanto às funcionalidades, o <strong>bloqueio de conteúdo</strong> foi apontado como o mais importante por 79,3% dos participantes. Em segundo lugar ficou a restrição de tempo de uso, com 57,7%, e em terceiro, as notificações sobre atividades suspeitas.</p>
    `,
    resumo: [
      'Principal preocupação dos pais: contato com estranhos (75,8%).',
      'Depois vêm conteúdo inapropriado (65,2%), tempo excessivo (57,6%), privacidade (50%) e cyberbullying (30,3%).',
      'Funcionalidade mais importante: bloqueio de conteúdo (79,3%), seguido da restrição de tempo (57,7%).',
      'Pesquisa com pais de crianças de 10 a 15 anos, em escolas públicas de Petrolina, em 2024.'
    ],
    exemploHtml: `Ao escolher um recurso de proteção, vale perguntar qual preocupação ele responde. Na pesquisa, o bloqueio de conteúdo foi o recurso mais valorizado, e o contato com estranhos, a maior preocupação.`
  },
  {
    id: 'bloco-6',
    numero: 7,
    titulo: 'Exposição e privacidade: o que se publica não volta',
    fonte: 'NÓBREGA (2024), Tecnologias digitais e os possíveis impactos para a privacidade, a segurança e a subjetividade de crianças e adolescentes.',
    corpoHtml: `
      <p>Nóbrega parte de um fato básico da privacidade: depois que um texto, uma foto ou um vídeo é postado, dificilmente ele sai de circulação. Também não se controla o impacto que ele terá, nem o uso que terceiros farão dele.</p>
      <p>A autora lembra que pensar a privacidade exige antes entender o que é público e o que é privado, e o que é consentimento. Ela afirma que as crianças deveriam ser tratadas com a mesma consideração e o mesmo respeito que teríamos por um adulto.</p>
      <p>A autora critica os próprios adultos. Pais postam fotos e vídeos dos filhos, às vezes bebês, em situações aparentemente ingênuas que podem, no futuro, ser usadas para fins criminosos ou gerar bullying e constrangimento. A autora também menciona vídeos de crianças humilhadas por adultos apenas para viralizar.</p>
      <p>Ela relata ainda o depoimento público de uma jovem que, quando criança, foi exposta pela mãe nas redes, com detalhes de doenças e da vida íntima, e relata que fotos e vídeos dela, quando criança, foram diversas vezes usados em redes de pedofilia.</p>
    `,
    resumo: [
      'Depois de postado, um conteúdo dificilmente sai de circulação, e o uso por terceiros não se controla.',
      'Privacidade exige entender o que é público, o que é privado e o que é consentimento.',
      'Os próprios pais expõem as crianças, muitas vezes sem avaliar as consequências.',
      'Crianças devem ter a mesma consideração e o mesmo respeito que um adulto.'
    ],
    exemploHtml: `Uma foto de bebê publicada hoje pode ser vista, comentada e copiada por pessoas que os pais nunca conheceram. A autora pergunta como delegar à criança uma decisão que nem um adulto consegue medir por completo.`
  },
  {
    id: 'bloco-7',
    numero: 8,
    titulo: 'A geração do quarto: isolamento e vínculo',
    fonte: 'NÓBREGA (2024), citando FERREIRA, A geração do quarto.',
    corpoHtml: `
      <p>Nóbrega lê o livro <em>A geração do quarto</em>, de Hugo Monteiro Ferreira, que entrevistou, ao longo de dois anos, mais de três mil meninos e meninas de 11 a 18 anos. Segundo o autor, essas crianças passam mais de seis horas por dia isoladas no quarto, quase sem conversar com quem mora na mesma casa. Têm dificuldade de dizer o que sentem e apresentam sofrimento psíquico.</p>
      <p>Para Ferreira, a condição dessa geração pede novas posturas dos adultos. Os pais dessas crianças passam de 8 a 12 horas trabalhando, e o autor chama de abandono, uma negligência em nome do poder econômico e da sobrevivência social, a solidão que elas vivem. Ele afirma que "terceirizar uma criança é possibilitar a emergência de desvinculações emocionais".</p>
      <p>Nóbrega acrescenta que a culpa dos pais pode levá-los a compensar a ausência com permissividade, ficando desatentos às orientações e indecisos nos momentos que exigem um limite mais firme.</p>
      <p>Ela sustenta que o problema não é a conexão em si. As redes sociais são como lupas que mostram o silenciamento que já existia dentro das casas. Sem diálogo em casa, a criança procura respostas rápidas do outro lado da tela.</p>
    `,
    resumo: [
      'Mais de três mil entrevistados de 11 a 18 anos, e mais de seis horas por dia isolados no quarto (Ferreira).',
      'Isolamento, sofrimento psíquico e dificuldade de dizer o que sentem.',
      'Terceirizar o cuidado pode gerar desvinculações emocionais, e a culpa leva à permissividade.',
      'Diálogo e presença afetiva são o que possibilita a adesão, segundo Ferreira.'
    ],
    exemploHtml: `Quando um adolescente passa a tarde inteira no quarto e quase não conversa com a família, a leitura de Ferreira pede que se pergunte o que falta na convivência, e não apenas quanto tempo a tela ocupa.`
  },
  {
    id: 'bloco-8',
    numero: 9,
    titulo: 'Quem responde pela segurança: pais, Estado, família e escola',
    fonte: 'SANTOS (2025); NÓBREGA (2024).',
    corpoHtml: `
      <p>Santos sustenta que a responsabilidade de mediar a relação das crianças com as plataformas acaba ficando apenas com os pais, que precisam entender as ferramentas para lidar com uma indústria que movimenta bilhões em publicidade. Ela aponta também a falta de uma normativa mais dura, por parte do Estado, para proteger esse público.</p>
      <p>Para Santos, estar seguro no ambiente online é um direito da criança. A cultura digital é fundamental para entender as dinâmicas sociais de hoje, e as crianças não podem ser excluídas dela nem tratadas sem levar em conta a sua vulnerabilidade.</p>
      <p>Nóbrega fala da família e da escola como lugares da educação digital. Para ela, não há como fugir dessa educação, nem se pode delegar aos outros o cuidado com as crianças, nem achar que elas terão maturidade para avaliar os riscos sozinhas.</p>
      <p>Santos aponta a escola como espaço de discussão: as escolas tiveram protagonismo nas discussões sobre os impactos do uso excessivo de smartphones. A autora lembra que, no período da coleta, ainda não tinha sido sancionada a Lei nº 15.100/2025, que proíbe o uso de celulares em escolas em todo o território nacional.</p>
    `,
    resumo: [
      'Santos: a responsabilidade recai sobre os pais, e falta normativa mais dura do Estado.',
      'Santos: estar seguro no ambiente online é um direito da criança.',
      'Nóbrega: a educação digital é tarefa da família e da escola, e não pode ser delegada.',
      'Lei nº 15.100/2025: sancionada depois da coleta de junho de 2024, proíbe celulares em escolas.'
    ],
    exemploHtml: `Quando se pergunta de quem é a tarefa de proteger a criança na internet, Santos aponta para os pais, o Estado e a indústria, e Nóbrega aponta para a família e a escola. Nenhuma das duas deixa essa tarefa com a própria criança.`
  },
  {
    id: 'bloco-9',
    numero: 10,
    titulo: 'Quadro comparativo: as duas autoras',
    fonte: 'SANTOS (2025); NÓBREGA (2024).',
    corpoHtml: `
      <p>Os dois artigos estudam a mesma relação por caminhos diferentes. O quadro reúne o que cada autora coloca no centro.</p>
      <div class="tabela-rolavel" tabindex="0" role="region" aria-label="Tabela do resumo">
        <table>
          <thead>
            <tr><th>Aspecto</th><th>Santos</th><th>Nóbrega</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Foco</td>
              <td>Estratégias de controle parental das plataformas (Instagram, TikTok e YouTube)</td>
              <td>Privacidade, segurança e desenvolvimento psíquico de crianças e adolescentes</td>
            </tr>
            <tr>
              <td>Base do texto</td>
              <td>Questionários com pais de crianças de 10 a 15 anos em Petrolina</td>
              <td>Reflexão apoiada no livro de Ferreira e em outros autores citados</td>
            </tr>
            <tr>
              <td>Recurso de proteção que destaca</td>
              <td>Modo kids, perfil fechado, bloqueio de comentários e perfil de adulto vinculado</td>
              <td>Limites de idade e de tempo, que provavelmente não garantem segurança</td>
            </tr>
            <tr>
              <td>Onde põe a segurança</td>
              <td>Nas ferramentas e numa normativa mais dura do Estado</td>
              <td>Na conexão real e na rede afetiva entre pais e filhos</td>
            </tr>
            <tr>
              <td>Visão da tecnologia</td>
              <td>Ferramentas e mediação parental, diante da vulnerabilidade da criança</td>
              <td>Não é o problema em si: o problema é o uso, e o que ele escancara dentro de casa</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>As duas dão peso à atuação dos adultos. Divergem na ênfase: Santos aponta as ferramentas e a norma; Nóbrega aponta o vínculo.</p>
    `,
    resumo: [
      'Santos: ferramentas de mediação e normativa do Estado.',
      'Nóbrega: vínculo afetivo e diálogo entre pais e filhos.',
      'As duas dão peso à atuação dos adultos.',
      'Divergência atribuída: a ênfase de cada autora muda qual é a proteção principal.'
    ],
    exemploHtml: `Numa questão que pergunta qual é a principal proteção para a criança, a resposta depende da autora de que se está falando. Por isso a citação sempre vem com o nome de quem a fez.`
  }
];
