import type { BlocoResumo } from '../../../tipos';

/**
 * Blocos do resumo da Unidade 3 de Introdução ao Direito, seguindo a ordem do
 * próprio trecho de Hart. Blocos 1 a 3: regras gerais, legislação e precedente,
 * casos claros e penumbra. Blocos 4 a 6: textura aberta, o exemplo do parque e
 * o formalismo. Blocos 7 a 9: padrões variáveis, cuidado devido e regras fixas.
 * Bloco 10: precedentes e função criadora dos tribunais.
 */
export const resumo: readonly BlocoResumo[] = [
  {
    id: 'bloco-0',
    numero: 1,
    titulo: 'Por que o direito usa regras gerais',
    fonte: 'HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1, p. 137.',
    corpoHtml: `
      <p>Hart começa por uma ideia central: em qualquer grande grupo, os padrões gerais, e não as diretivas dadas separadamente a cada pessoa, devem ser o principal instrumento de controle social. Sem a possibilidade de comunicar padrões gerais que multidões consigam perceber, sem novas instruções para cada ocasião, nada do que hoje se reconhece como direito poderia existir.</p>
      <p>Por isso o direito se refere, predominantemente, a categorias de pessoas, de atos, de coisas e de circunstâncias. Hart acrescenta que essa referência é predominante, mas não de forma alguma exclusiva. Para funcionar com êxito em grandes áreas da vida social, o direito depende de uma capacidade largamente difundida de reconhecer um caso concreto como exemplo de uma classificação geral.</p>
    `,
    resumo: [
      'Os padrões gerais são o principal instrumento de controle social, e não as diretivas particulares.',
      'O direito se refere sobretudo a categorias de pessoas, atos, coisas e circunstâncias.',
      'Seu funcionamento depende de reconhecer casos concretos como exemplos das classificações gerais.',
      'Sem padrões gerais que as pessoas consigam perceber, nada do que se reconhece como direito existiria.'
    ],
    exemploHtml: `Hart usa a regra de que nenhum veículo pode ser levado para um parque. Ela vale para todas as pessoas que entram no parque, sem que cada uma receba uma ordem própria (p. 141).`
  },
  {
    id: 'bloco-1',
    numero: 2,
    titulo: 'Legislação e precedente: dois modos de comunicar padrões',
    fonte: 'HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1, pp. 137-138.',
    corpoHtml: `
      <p>Hart identifica dois expedientes para comunicar padrões gerais de conduta com antecipação das ocasiões em que devem ser aplicados. Um faz uso máximo de palavras gerais para estabelecer classificações: é a legislação. O outro faz uso mínimo dessas palavras: é o precedente (p. 137).</p>
      <p>Para mostrar a diferença, Hart usa dois pais diante de uma igreja. O primeiro diz ao filho que todos os homens e os rapazes devem tirar o chapéu ao entrar numa igreja. É a regra enunciada em palavras gerais. O segundo descobre a cabeça ao entrar e diz que aquela é a forma correta de se comportar. É o exemplo, que comunica o padrão pelo que se faz (p. 137).</p>
      <p>O uso jurídico do precedente se aproxima do segundo caso quando quem observa é visto como autoridade sobre a conduta apropriada e como quem adere a padrões tradicionais, e não como quem introduz padrões novos (p. 138).</p>
      <div class="tabela-rolavel" tabindex="0" role="region" aria-label="Quadro comparativo do resumo">
        <table>
          <thead>
            <tr><th>Aspecto</th><th>Legislação</th><th>Precedente</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Como comunica o padrão</td>
              <td>Palavras gerais que nomeiam a classe de casos</td>
              <td>Um exemplo dotado de autoridade, tomado como modelo</td>
            </tr>
            <tr>
              <td>Uso de palavras gerais</td>
              <td>Máximo</td>
              <td>Mínimo</td>
            </tr>
            <tr>
              <td>O que a pessoa precisa fazer</td>
              <td>Reconhecer os casos de aplicação dos termos claros e tirar uma conclusão simples</td>
              <td>Descobrir quais aspectos do exemplo importam e em que medida devem ser imitados</td>
            </tr>
            <tr>
              <td>Limite da certeza</td>
              <td>Também tem textura aberta, na linha de fronteira</td>
              <td>Também tem incertezas, sobre o que a regra extraída do caso deve dizer</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    resumo: [
      'Legislação: uso máximo de palavras gerais para estabelecer classificações.',
      'Precedente: uso mínimo dessas palavras, com um exemplo dotado de autoridade.',
      'O exemplo deixa abertas perguntas sobre o que imitar, mesmo quando quem ensina acha que é claro.',
      'A regra escrita parece clara, segura e certa, mas também tem limites na aplicação.'
    ],
    exemploHtml: `Ao ler uma regra escrita, pergunte primeiro se o caso se encaixa nos termos. Ao ler um precedente, pergunte o que do caso decidido vale como modelo. As duas perguntas existem nos dois expedientes.`
  },
  {
    id: 'bloco-2',
    numero: 3,
    titulo: 'Casos claros e casos de penumbra',
    fonte: 'HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1, pp. 138-140.',
    corpoHtml: `
      <p>Quando uma regra com termos claros é aplicada, o caso pode ser simples ou de penumbra. Hart distingue os dois (pp. 138-139):</p>
      <ul>
        <li><strong>Casos simples:</strong> aqueles em que o termo geral é claramente aplicável. Hart dá o exemplo de que, se algo pode ser qualificado como veículo, um automóvel é certamente um veículo.</li>
        <li><strong>Casos de penumbra:</strong> aqueles em que não é claro se o termo se aplica. Hart pergunta se a expressão "veículo" inclui bicicletas, aviões e patins.</li>
      </ul>
      <p>Os casos de penumbra são situações de fato que têm apenas alguns dos aspectos dos casos simples, e lhes faltam outros. Elas surgem continuamente, seja pela natureza, seja pela invenção humana (p. 139).</p>
      <p>Os casos simples são os familiares, que se repetem em contextos semelhantes e nos quais há acordo geral. Os termos gerais seriam inúteis como meio de comunicação se esses casos não existissem (pp. 139-140).</p>
    `,
    resumo: [
      'Caso simples: o termo geral se aplica com clareza, e o reconhecimento parece automático.',
      'Caso de penumbra: alguns aspectos estão presentes e outros faltam, e não é claro se o termo se aplica.',
      'As penumbras surgem continuamente, com novidades da natureza ou da invenção humana.',
      'Os casos simples são os familiares, em que há acordo geral nas decisões.'
    ],
    exemploHtml: `Se a regra fala em veículo, o automóvel dispensa discussão. Bicicleta, avião e patins exigem que se decida se a palavra alcança o caso, e a decisão depende de fatores que atravessam o sistema jurídico e das finalidades atribuídas à regra.`
  },
  {
    id: 'bloco-3',
    numero: 4,
    titulo: 'A textura aberta da linguagem',
    fonte: 'HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1, pp. 141-142.',
    corpoHtml: `
      <p>Hart chama de textura aberta a incerteza que aparece na linha de fronteira de qualquer forma de comunicação que use termos classificatórios gerais para tratar de questões de fato. Ele afirma que as línguas naturais, como o inglês, têm irredutivelmente uma textura aberta quando usadas dessa maneira (p. 141).</p>
      <p>Por que não se deve desejar, nem como ideal, uma regra tão detalhada que nunca exigisse nova escolha? Hart responde com duas desvantagens da condição humana: a ignorância de fato, isto é, a impossibilidade de conhecer todas as combinações de circunstâncias que o futuro pode trazer, e a indeterminação de finalidade, que faz com que a finalidade de uma regra não esteja fixada para casos que ninguém previu (p. 141).</p>
      <p>A frase que resume a ideia é esta: "a necessidade de tal escolha é lançada sobre nós porque somos homens, não deuses" (p. 141). Um mundo em que tudo fosse conhecido seria, nas palavras de Hart, adequado a uma jurisprudência "mecânica" (p. 141).</p>
    `,
    resumo: [
      'A textura aberta é a incerteza que a linguagem geral tem na linha de fronteira.',
      'Ela não se elimina por completo: as línguas naturais a têm.',
      'Duas causas: ignorância de fato e indeterminação de finalidade.',
      'Nem como ideal se deve querer uma regra tão detalhada que nunca exija nova escolha: ela só seria adequada a uma jurisprudência "mecânica", num mundo em que tudo fosse conhecido, e esse mundo não é o nosso.'
    ],
    exemploHtml: `Quando surge um caso que ninguém previu, a regra não resolve a dúvida sozinha. A pessoa encarregada precisa escolher, e a escolha deve olhar para a finalidade da regra (pp. 141-142).`
  },
  {
    id: 'bloco-4',
    numero: 5,
    titulo: 'O exemplo das regras sobre veículos no parque',
    fonte: 'HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1, pp. 140-142.',
    corpoHtml: `
      <p>Hart toma a regra de que nenhum veículo pode ser levado para um parque (p. 141). Os casos claros são os que estão no centro do conceito: automóvel, ônibus e motocicleta. Quem fez a regra decidiu desde o início que a paz e a tranquilidade do parque devem ser mantidas à custa da exclusão desses veículos (p. 142).</p>
      <p>O caso não previsto é o do automóvel de brinquedo, movido eletricamente. Nesse ponto a finalidade da regra é indeterminada: é preciso decidir se algum grau de paz no parque deve ser sacrificado em favor das crianças que se divertem com esses brinquedos (p. 142).</p>
      <p>Quando o caso surge, confrontam-se as soluções em jogo e escolhe-se, pela forma que melhor satisfaz, entre os interesses concorrentes. Ao decidir, a finalidade inicial fica mais determinada e também se resolve, para os fins da regra, o sentido de uma palavra geral, no caso a palavra veículo (p. 142).</p>
    `,
    resumo: [
      'Regra: nenhum veículo pode ser levado para um parque.',
      'Casos claros: automóvel, ônibus e motocicleta.',
      'Caso não previsto: o automóvel de brinquedo elétrico, cuja solução não foi decidida de antemão.',
      'Decidir o caso também esclarece o sentido de veículo para os fins da regra.'
    ],
    exemploHtml: `Num parque que proíbe veículos, a dúvida sobre um brinquedo elétrico não se resolve pela lista de casos claros. A escolha pesa a paz do parque contra o prazer das crianças, e dessa escolha sai também o sentido de veículo para a regra.`
  },
  {
    id: 'bloco-5',
    numero: 6,
    titulo: 'Formalismo ou conceptualismo: fingir que a escolha não existe',
    fonte: 'HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1, pp. 142-143.',
    corpoHtml: `
      <p>Hart chama de formalismo ou conceptualismo a atitude para com as regras formuladas em palavras que procura disfarçar e minimizar a necessidade de escolha depois que a regra é editada (p. 142).</p>
      <p>Um dos modos de fazer isso é fixar o significado da regra, de modo que os seus termos gerais tenham sempre o mesmo sentido em cada caso em que a regra for aplicada. O custo é considerar, de forma cega e preconceituada, uma série de casos futuros sobre os quais se está na ignorância. Assim se resolvem antecipadamente questões que só podem ser bem resolvidas quando surgem, e a regra passa a incluir casos que se gostaria de excluir (pp. 142-143).</p>
      <p>O ideal extremo dessa técnica é o que Hart chama de "paraíso de conceitos" dos juristas: um termo recebe o mesmo significado não só em cada aplicação de uma regra, mas em qualquer regra do sistema, e ninguém precisa interpretá-lo à luz das questões em jogo (p. 143).</p>
      <p>O resultado, diz Hart, é que a rigidez das classificações entra em conflito com as finalidades que a regra deveria servir (p. 143).</p>
    `,
    resumo: [
      'Formalismo: atitude que disfarça a necessidade de escolha depois que a regra é editada.',
      'Técnica: fixar o significado dos termos gerais, em todos os casos.',
      'Custo: decidir de antemão sem ver os casos futuros, e incluir casos que se queria excluir.',
      'Paraíso de conceitos: um mesmo significado em todo o sistema, sem nenhum esforço de interpretação.'
    ],
    exemploHtml: `Se o sentido de veículo fosse fixado de antemão, o brinquedo elétrico poderia cair na regra mesmo quando a paz do parque não exigisse isso.`
  },
  {
    id: 'bloco-6',
    numero: 7,
    titulo: 'Padrões muito gerais e delegação a órgãos administrativos',
    fonte: 'HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1, pp. 144-145.',
    corpoHtml: `
      <p>Há domínios em que não se pode criar, de forma antecipada, regras uniformes para cada caso, porque os aspectos dos casos variam muito em contextos importantes e imprevisíveis. Nesses domínios, o poder legislativo traça padrões muito gerais e delega a um corpo administrativo, dotado de poder regulamentar, o papel de moldar regras adaptadas às necessidades especiais (p. 144).</p>
      <p>O exemplo de Hart: a lei pode exigir que uma indústria cobre um preço justo ou ofereça condições de segurança. Em vez de deixar cada empresa aplicar esses padrões vagos e descobrir depois que os violou, adia-se a sanção até que o órgão especifique, por regulamento, o que vale como preço justo ou como condições de segurança para aquela indústria. Esse poder só pode ser exercido depois de um inquérito sobre os fatos da indústria e da audição dos argumentos a favor e contra a regulamentação (p. 144).</p>
      <p>Mesmo com padrões muito gerais, há casos extremos claramente identificáveis: um preço tão alto que reduziria o público a cativeiro, e um preço tão baixo que não daria incentivo à gestão. Entre esses extremos estão os casos realmente difíceis. Nesses, a autoridade deve exercer poder discricionário, pois não há uma única resposta correta, e sim um compromisso razoável entre interesses conflitantes (pp. 144-145).</p>
    `,
    resumo: [
      'Padrões muito gerais são delegados a um órgão administrativo com poder regulamentar.',
      'A regulamentação exige inquérito sobre os fatos e audição dos argumentos favoráveis e contrários.',
      'Os casos extremos são claros; os casos difíceis exigem poder discricionário.',
      'Nos casos difíceis não há uma única resposta correta, e sim um compromisso razoável.'
    ],
    exemploHtml: `Quando uma lei manda cobrar um preço justo, a empresa não sabe de antemão o valor que será aceito. Hart mostra que a especificação vem depois de inquérito e audiência (p. 144).`
  },
  {
    id: 'bloco-7',
    numero: 8,
    titulo: 'O cuidado devido: um padrão definido no caso concreto',
    fonte: 'HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1, pp. 145-146.',
    corpoHtml: `
      <p>Outra técnica se usa quando não é possível identificar uma categoria de ações específicas a ser feitas ou omitidas de modo uniforme, embora as circunstâncias cubram aspectos familiares da experiência comum. Aqui o direito recorre a juízos comuns sobre o que é razoável (p. 145).</p>
      <p>O exemplo mais famoso, no direito anglo-americano, é o padrão de diligência devida, ou cuidado devido, nos casos de culpa. Exemplos típicos são parar, olhar e escutar quando se espera trânsito. Hart observa, porém, que essas ações podem não ser suficientes e podiam ser inúteis se o olhar não ajudasse a evitar o perigo (p. 145).</p>
      <p>Ao aplicar o padrão, busca-se evitar um mal grave sem que o encargo das precauções exija um sacrifício excessivo de outros interesses respeitáveis. Como a variedade de casos é imensa, não se pode prever de antemão quais combinações de circunstâncias surgirão (pp. 145-146).</p>
      <p>Por isso as pessoas precisam agir antes que o padrão tenha sido oficialmente definido, e um tribunal só pode informá-las do que o padrão exigia depois da violação (p. 145).</p>
    `,
    resumo: [
      'Padrão variável: o que é diligência devida depende de cada situação.',
      'Exemplos típicos, como parar, olhar e escutar, não bastam, porque as situações variam.',
      'A pessoa age antes da definição, e o tribunal só diz o padrão depois da violação.',
      'Busca-se evitar um mal grave sem sacrificar em excesso outros interesses.'
    ],
    exemploHtml: `Atravessar uma rua com trânsito pede cuidado, e parar, olhar e escutar costuma ser um bom começo. Hart lembra que, em outras situações, esse gesto pode não bastar, por isso o padrão só se fixa diante do caso concreto.`
  },
  {
    id: 'bloco-8',
    numero: 9,
    titulo: 'Regras fixas: homicídio e convenções',
    fonte: 'HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1, pp. 146-147.',
    corpoHtml: `
      <p>Nem tudo precisa de padrão variável. Há ações de tanta importância prática que se pode fazer uma regra específica, que quase nunca cede a outras circunstâncias. Hart dá o exemplo do ato de matar: é possível fazer uma regra contra ele, em vez de um padrão como "respeito devido pela vida humana", porque quase sempre o matar outrem, enquanto tal, domina os outros fatores que o acompanham (p. 146).</p>
      <p>Hart admite exceções, como a legítima defesa e outras formas de homicídio justificado. Ele diz que são poucos casos, identificáveis em termos relativamente simples, e que são admitidos como exceções à regra geral (p. 146).</p>
      <p>Há também regras de convenção. Não importa qual o lado da estrada prescrito pelo código da estrada. Importa muito que exista um processo facilmente identificável e uniforme, que distinga com clareza o correto do incorreto (pp. 146-147).</p>
    `,
    resumo: [
      'Regras fixas funcionam quando uma ação tem importância prática que quase nunca é relativizada.',
      'O matar outrem domina os outros fatores: por isso a regra é fixa, com exceções poucas e identificáveis.',
      'Regras convencionais, como a do lado da estrada, valem pela uniformidade, e não pelo conteúdo escolhido.',
      'No homicídio, as exceções são poucas e admitidas como exceções à regra geral; nas regras convencionais introduzidas por lei, as exceções claras acabam reduzidas a regra.'
    ],
    exemploHtml: `Quem dirige precisa saber qual lado seguir, sem calcular a cada cruzamento. Por isso uma regra convencional vale mesmo quando outra seria igualmente possível (pp. 146-147).`
  },
  {
    id: 'bloco-9',
    numero: 10,
    titulo: 'Precedentes e a função criadora dos tribunais',
    fonte: 'HART, H. L. A. O Conceito de Direito. Tradução portuguesa da Fundação Calouste Gulbenkian, cap. VII, seção 1, pp. 147-149.',
    corpoHtml: `
      <p>Hart lembra que o precedente também tem penumbra própria. Mesmo a descrição da teoria inglesa do precedente usa termos com incerteza, como ratio decidendi e fatos materiais (p. 147). Uma nota do trecho explica que a ratio decidendi de um caso é o precedente para o futuro: a regra com autoridade que permite decidir do mesmo modo um caso futuro com um conjunto semelhante de fatos (p. 147).</p>
      <p>No uso do precedente no direito inglês, Hart identifica três pares de fatos. Primeiro, não há um método único para determinar a regra relativamente à qual um precedente funciona como autoridade, embora na maioria dos casos isso não gere dúvida. Segundo, não há uma formulação única e dotada de autoridade da regra que se extrai dos casos. Terceiro, os tribunais que seguem o precedente podem distinguir o caso anterior, achando uma diferença juridicamente relevante, ou ampliar a regra, afastando uma restrição que não é exigida por regra estabelecida (pp. 147-148).</p>
      <p>Hart nota que o precedente produziu um corpo de regras, e muitas delas são tão precisas quanto uma regra legislada (p. 148).</p>
      <p>A função criadora dos tribunais é, para Hart, muito semelhante ao poder delegado de regulamentar, quando o stare decisis é firmemente reconhecido. Na Inglaterra, porém, isso costuma ficar escondido, porque os tribunais negam essa função e dizem que procuram a intenção do legislador e o direito que já existe (p. 149).</p>
    `,
    resumo: [
      'O precedente tem penumbra própria: ratio decidendi e fatos materiais também pedem interpretação.',
      'A ratio decidendi é o precedente para o futuro, segundo uma nota do trecho.',
      'Os tribunais podem distinguir um caso anterior ou ampliar a regra.',
      'A função criadora dos tribunais é semelhante à de um órgão com poder regulamentar delegado, embora costume ser negada.'
    ],
    exemploHtml: `Se um caso novo tiver uma diferença juridicamente relevante em relação ao caso decidido, o tribunal pode distinguir os dois. Hart lembra que o número dessas diferenças nunca pode ser determinado por completo (p. 148).`
  }
];
