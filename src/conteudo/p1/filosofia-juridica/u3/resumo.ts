import type { BlocoResumo } from '../../../tipos';

/**
 * Os blocos teóricos do resumo de Filosofia Jurídica, 3a unidade (Filosofia
 * Moderna e Contemporânea). A linha de estudo vai do Estado
 * moderno em duas fases (formar o Estado; limitar o Estado), a Filosofia
 * Social (Proudhon e Marx) e o Bloco 3, que aguarda material do professor.
 *
 * Blocos 1 a 9: Filosofia Moderna, primeira fase. Blocos 5 a 12: segunda
 * fase. Blocos 13 e 14: Filosofia Social. Blocos 15 e 16: quadro comparativo
 * e linha do tempo. Bloco 17: placeholder do Bloco 3.
 */
export const resumo: readonly BlocoResumo[] = [
  {
    id: 'bloco-0',
    numero: 1,
    titulo: 'O Estado moderno e as duas fases',
    fonte: 'Material de aula da disciplina.',
    corpoHtml: `
      <p>A filosofia moderna começa em 1453, com o fim da Guerra dos Cem Anos e a tomada de Constantinopla pelos turcos. É nesse contexto que se forma o <strong>Estado moderno</strong>: um território com fronteiras bem definidas, moeda e tributação únicas, exército profissional e poder político centralizado. Ele é o oposto do sistema fragmentado da sociedade medieval.</p>
      <p>A discussão se organiza em duas fases. Na <strong>primeira fase</strong>, o problema é <strong>formar o Estado</strong>: Maquiavel, Bodin, Bossuet e Hobbes defendem a centralização máxima do poder para unificar e criar o Estado. Na <strong>segunda fase</strong>, com o absolutismo em crise, o problema se inverte e passa a ser <strong>limitar o Estado</strong>: surgem as teorias da separação de poderes e dos direitos naturais, origem do Estado de Direito.</p>
      <p>A segunda fase se opõe à primeira, mas só é possível porque a primeira já havia construído o Estado nacional. Não se limita um poder que ainda não existe.</p>
    `,
    resumo: [
      'Estado moderno: território, moeda e tributação únicos, exército profissional e poder centralizado.',
      'Primeira fase, formar o Estado: Maquiavel, Bodin, Bossuet e Hobbes.',
      'Segunda fase, limitar o Estado: de Grotius a Hegel, origem do Estado de Direito.',
      'A segunda fase depende da primeira: só se limita o que já foi construído.'
    ],
    exemploHtml: `Quando se discute se o Estado pode tudo ou se deve respeitar direitos individuais, está em jogo exatamente a passagem da primeira fase para a segunda.`
  },
  {
    id: 'bloco-1',
    numero: 2,
    titulo: 'Maquiavel: governar é arte de guerra',
    fonte: 'Material de aula da disciplina.',
    corpoHtml: `
      <p>Maquiavel (1469-1527) é, em <em>O Príncipe</em>, o primeiro autor a defender a existência do Estado em sentido moderno. Mas o livro é, antes de tudo, um manual de como conquistar e manter o poder.</p>
      <p>Sua visão da natureza humana é pessimista. Governar é uma arte de guerra, e a dominação dos súditos se dá pela força ou pela fraude, não pelo Direito nem pela justiça. O Estado unificado aparece como uma questão de ser, e não de dever ser: a estabilidade não vem da boa forma política.</p>
      <p>O legado é retomar a noção de Estado. Sem Estado não há Constituição. Ainda não há, porém, preocupação com a legitimidade.</p>
      <p><strong>Guarde:</strong> Maquiavel fala do governante. O Estado em si só vira o centro do problema com Hobbes.</p>
    `,
    resumo: [
      'Primeiro autor a defender a existência do Estado em sentido moderno, em O Príncipe.',
      'Natureza humana pessimista: governar é arte de guerra.',
      'Dominação pela força ou pela fraude, não pelo Direito nem pela justiça.',
      'Legado: retoma a noção de Estado; ainda sem preocupação com a legitimidade.'
    ],
    exemploHtml: `Quando um governo trata a lei apenas como instrumento para se manter no poder, a pergunta de Maquiavel é o que mantém o governante, e não o que o legitima.`
  },
  {
    id: 'bloco-2',
    numero: 3,
    titulo: 'Bodin e Bossuet: soberania e direito divino',
    fonte: 'Material de aula da disciplina.',
    corpoHtml: `
      <p>Os dois são reconhecidos pela <strong>teoria do direito divino</strong>, mas com alcances diferentes.</p>
      <h3>Jean Bodin (1530-1596)</h3>
      <p>Introduz a <strong>soberania</strong> e a <strong>legitimidade</strong>. A soberania é poder supremo, uno e indivisível: não há Estado sem poder soberano. O soberano faz as leis e não se sujeita a elas; está preso apenas às leis divinas e naturais.</p>
      <h3>Jacques Bossuet (1627-1704)</h3>
      <p>Ideólogo do poder régio por direito divino. Qualquer ideia de rebeldia contra o príncipe cristão é sacrilégio e atentado à ordem sagrada. Esse fundamento religioso não prevaleceu na história.</p>
      <p><strong>O que sobreviveu:</strong> a soberania de Bodin, o poder que não reconhece outro superior, nem dentro nem fora do território.</p>
    `,
    resumo: [
      'Bodin: soberania como poder supremo, uno e indivisível, ligada à legitimidade.',
      'Bodin: o soberano faz as leis e não se sujeita a elas; só às leis divinas e naturais.',
      'Bossuet: poder régio por direito divino; rebeldia é sacrilégio.',
      'Sobreviveu a soberania de Bodin, sem o fundamento religioso de Bossuet.'
    ],
    exemploHtml: `Quando se diz que o poder do Estado é único dentro do território, fala-se em soberania no sentido de Bodin. Quando se justifica o poder porque ele "vem de Deus", fala-se em Bossuet, e essa justificativa não prevaleceu.`
  },
  {
    id: 'bloco-3',
    numero: 4,
    titulo: 'Hobbes e o Leviatã: guerra, contrato e monarca absoluto',
    fonte: 'HOBBES, Leviatã (1651).',
    corpoHtml: `
      <p>Hobbes (1588-1679) é o autor do <em>Leviatã</em>. Seu ponto de partida é o <strong>estado de natureza</strong>: antes do Estado, há guerra de todos contra todos. São três as causas de discórdia: <strong>competição, desconfiança e glória</strong>.</p>
      <p>Daí a frase, retomada de Plauto: <strong>o homem é o lobo do próprio homem</strong>.</p>
      <p>Para ter paz, cada um renuncia a parte da sua liberdade em nome do Estado. Nasce o Leviatã, administrado pelo <strong>monarca absoluto</strong>, capaz de impor a paz à sociedade.</p>
      <h3>Avanço</h3>
      <p>Hobbes desloca a questão do governante para o próprio Estado e inaugura o jusnaturalismo e o contratualismo modernos.</p>
    `,
    resumo: [
      'Estado de natureza: guerra de todos contra todos.',
      'Três causas de discórdia: competição, desconfiança e glória.',
      'Contrato social: renúncia a parte da liberdade para ter paz; Leviatã e monarca absoluto.',
      'Inaugura o jusnaturalismo e o contratualismo modernos.'
    ],
    exemploHtml: `Quem defende que a segurança justifica abrir mão de parte da liberdade está usando a lógica de Hobbes. A pergunta que ele deixa é até onde vai essa renúncia.`
  },
  {
    id: 'bloco-4',
    numero: 5,
    titulo: 'Grotius e Pufendorf: o direito natural fundado na razão',
    fonte: 'GROTIUS, De iure belli ac pacis (1625); PUFENDORF, De iure naturae et gentium (1672).',
    corpoHtml: `
      <p>Com a crise do absolutismo, procura-se limitar o poder. O direito natural deixa de depender de Deus e passa a se fundar na <strong>razão</strong>.</p>
      <h3>Hugo Grotius (1583-1645)</h3>
      <p>Rebate Maquiavel e Hobbes: a natureza do homem é ser <strong>sociável</strong>. Defende que o Direito se revela pela razão. O direito natural valeria mesmo que Deus não existisse, afirmação chocante para a época. Por isso é <strong>precursor da secularização</strong> do direito natural.</p>
      <h3>Samuel Pufendorf (1632-1694)</h3>
      <p>Distingue Direito e Moral, distinção que só se consolida com Kant. Enquanto Hobbes funda o Direito no poder e Grotius na natureza das coisas, Pufendorf o funda na <strong>razão humana</strong>. A finalidade do direito natural é a <strong>sociabilidade</strong>: viver em comunidade.</p>
    `,
    resumo: [
      'Crise do absolutismo: o direito natural passa a se fundar na razão, não em Deus.',
      'Grotius: o homem é sociável; o direito valeria mesmo sem Deus.',
      'Pufendorf: distingue Direito e Moral; funda o direito na razão humana.',
      'Fundamentos: Hobbes no poder, Grotius na natureza das coisas, Pufendorf na razão.'
    ],
    exemploHtml: `Quando se afirma que uma regra é justa mesmo sem previsão expressa, e sem recorrer a uma autoridade religiosa, está se usando a razão de Grotius e de Pufendorf.`
  },
  {
    id: 'bloco-5',
    numero: 6,
    titulo: 'Locke I: estado de natureza e contrato',
    fonte: 'Dois Tratados sobre o Governo (1690).',
    corpoHtml: `
      <p>Inglaterra em convulsão: Revolução Puritana de 1640, Revolução Gloriosa de 1689 e a assinatura do <em>Bill of Rights</em>. Locke escreve os <em>Dois Tratados sobre o Governo</em> em 1690.</p>
      <h3>O oposto de Hobbes</h3>
      <p>O estado de natureza é de liberdade e igualdade, não de guerra. Já é um estado de sociedade, com direitos à vida, à liberdade e à propriedade.</p>
      <h3>Por que criar o Estado</h3>
      <p>Nem todos respeitam as leis naturais, e ninguém julga bem em causa própria. O <strong>governo civil</strong> entra como árbitro imparcial.</p>
      <h3>Contra a monarquia absoluta</h3>
      <p>Se o monarca é apenas um homem e julga a própria causa, o remédio vira a doença.</p>
      <p><strong>Guarde:</strong> Locke inverte a lógica do direito natural, que antes legitimava o poder do rei, e passa a usá-lo para defender o indivíduo contra o Estado.</p>
    `,
    resumo: [
      'Estado de natureza: liberdade e igualdade, com direitos à vida, à liberdade e à propriedade.',
      'Governo civil como árbitro imparcial, porque ninguém julga bem em causa própria.',
      'Contra a monarquia absoluta: o monarca não pode ser juiz da própria causa.',
      'Locke usa o direito natural para defender o indivíduo contra o Estado.'
    ],
    exemploHtml: `Quando um órgão público julga um conflito em que ele mesmo é parte, a crítica de Locke ajuda a entender por que se exige um árbitro imparcial.`
  },
  {
    id: 'bloco-6',
    numero: 7,
    titulo: 'Locke II: a matriz do Estado liberal',
    fonte: 'Material de aula da disciplina.',
    corpoHtml: `
      <p>Locke já defendia três poderes: <strong>executivo, legislativo e federativo</strong>, este último sobre a guerra, a paz e as alianças. Ainda é um esboço, porque há centralização nas mãos do rei.</p>
      <p>Sobre os poderes estatais está o <strong>povo</strong>. Havendo tirania, usurpação ou desvio de poder, cabe o <strong>direito à revolução</strong>, isto é, o direito de dissolver o governo.</p>
      <p>Na <em>Carta sobre a Tolerância</em>, de 1689, a religião passa a ser assunto de cada família e de cada indivíduo. Para Comparato, não é só virtude moral: é <strong>dever jurídico</strong>.</p>
      <p>Repercussão: essas ideias inspiraram a Declaração de Independência de 1776 e as declarações de direitos do século XVIII.</p>
    `,
    resumo: [
      'Três poderes em Locke: executivo, legislativo e federativo (guerra, paz e alianças).',
      'Soberania popular: havendo tirania, cabe o direito à revolução.',
      'Tolerância religiosa como assunto de cada indivíduo e dever jurídico.',
      'Repercussão: Declaração de Independência de 1776 e declarações de direitos.'
    ],
    exemploHtml: `Quando uma Constituição limita o governo e reconhece direitos anteriores a ele, a matriz é Locke: poder dividido e povo como instância última.`
  },
  {
    id: 'bloco-7',
    numero: 8,
    titulo: 'Montesquieu: só o poder contém o poder',
    fonte: 'O Espírito das Leis (1748).',
    corpoHtml: `
      <p>Montesquieu (1689-1755) percebeu que todo homem que possui poder é levado a dele abusar, e vai até onde encontra limites. Por isso, <strong>só o poder contém o poder</strong>.</p>
      <h3>Os três poderes</h3>
      <p>Executivo, legislativo e judiciário. Reunidos na mesma pessoa, não existe liberdade: o julgador vira legislador ou opressor.</p>
      <h3>Quem faz a lei</h3>
      <p>O Poder Legislativo deve ser entregue a representantes do povo, já que o povo reunido é inviável nos grandes Estados.</p>
      <h3>A base do Estado de Direito</h3>
      <p>A legalidade aplica o espírito das leis como manifestação da vontade popular. Dela os constitucionalistas tiram o modelo atual.</p>
      <p>Liberdade política só existe nos governos moderados, e mesmo neles apenas quando não se abusa do poder.</p>
    `,
    resumo: [
      'Só o poder contém o poder: quem tem poder tende a abusar dele.',
      'Três poderes: executivo, legislativo e judiciário, separados.',
      'O Legislativo é entregue a representantes do povo.',
      'Base do Estado de Direito: a legalidade como vontade popular.'
    ],
    exemploHtml: `Quando se exige que quem faz a lei não seja também quem julga a sua aplicação, o argumento é de Montesquieu: sem separação, o julgador vira legislador ou opressor.`
  },
  {
    id: 'bloco-8',
    numero: 9,
    titulo: 'Rousseau: vontade geral e soberania popular',
    fonte: 'Do Contrato Social (1762); Discurso sobre a desigualdade (1755).',
    corpoHtml: `
      <p>Rousseau (1712-1778) abre o <em>Contrato Social</em> afirmando que o homem nasce livre e, por toda parte, encontra-se sob ferros. A pergunta do livro é o que torna legítima essa mudança.</p>
      <h3>Vontade geral</h3>
      <p>Cada um se entrega por completo à comunidade, em condição igual para todos. A ordem social é fruto de uma convenção, não da natureza.</p>
      <h3>Contra a representação</h3>
      <p>A soberania não pode ser representada nem alienada. Para o autor, o inglês só é livre no dia em que elege o parlamento.</p>
      <h3>Soberania popular</h3>
      <p>O titular legítimo do poder é o <strong>corpo social</strong>. Daí a titularidade do Poder Constituinte: inalienável, indivisível e imprescritível.</p>
      <p>Em outra obra, o <em>Discurso sobre a desigualdade</em> (1755), Rousseau descreve um estado natural pacífico, em que a desigualdade nasce com a propriedade e a sociedade.</p>
      <p><strong>Para a prova:</strong> quando a questão disser que o povo é o titular do poder constituinte, a raiz teórica é Rousseau.</p>
    `,
    resumo: [
      'O homem nasce livre e, por toda parte, encontra-se sob ferros.',
      'Vontade geral: a ordem social é convenção, não natureza.',
      'A soberania não pode ser representada nem alienada.',
      'O corpo social é o titular do Poder Constituinte: inalienável, indivisível e imprescritível.'
    ],
    exemploHtml: `Quando se diz que a Constituição vale porque o povo a criou e pode mudá-la, a ideia de poder constituinte popular é de Rousseau.`
  },
  {
    id: 'bloco-9',
    numero: 10,
    titulo: 'Kant I: os três imperativos',
    fonte: 'Fundamentação da metafísica dos costumes (1785).',
    corpoHtml: `
      <p>Imperativo, em Kant, é uma fórmula que determina comportamentos e tem no núcleo o verbo <strong>dever</strong>. São três espécies:</p>
      <ul>
        <li><strong>Destreza</strong>: meras regras técnicas, sem vontade boa ou má. É o médico que orienta o procedimento para curar a doença.</li>
        <li><strong>Hipotético</strong>: a ação é boa para atingir um fim. Paga-se o tributo por medo da multa, não por solidariedade. O Direito é, em regra, assim.</li>
        <li><strong>Categórico</strong>: a ação é boa em si mesma, cumprida incondicionalmente. É o campo da Moral: o imperativo moral.</li>
      </ul>
      <p>A fórmula: age apenas segundo a máxima que você possa querer que se torne lei universal.</p>
    `,
    resumo: [
      'Imperativo: fórmula que determina comportamentos, com o verbo dever no núcleo.',
      'Destreza: regra técnica, sem vontade boa ou má.',
      'Hipotético: boa para atingir um fim; é o plano em que o Direito está, em regra.',
      'Categórico: boa em si mesma, incondicional; é o campo da Moral.'
    ],
    exemploHtml: `Quem cumpre a norma só para evitar a multa age no plano hipotético; quem a cumpre por entender que ela é justa, mesmo sem fiscalização, age no plano categórico.`
  },
  {
    id: 'bloco-10',
    numero: 11,
    titulo: 'Kant II: liberdade e dignidade',
    fonte: 'Material de aula da disciplina.',
    corpoHtml: `
      <h3>Liberdade</h3>
      <p>O fundamento do Direito é a liberdade. Ela encontra limite na liberdade dos outros, e o Direito é exatamente esse limite.</p>
      <h3>Dignidade</h3>
      <p>O que tem preço pode ser substituído; o que está acima de todo preço tem dignidade. A pessoa deve ser sempre fim, nunca meio.</p>
      <h3>Crítica contemporânea</h3>
      <p>O modelo é antropocêntrico e individualista. A doutrina atual propõe uma dimensão ecológica da dignidade, estendida à natureza e aos animais.</p>
      <p><strong>Atenção:</strong> fala-se em dignidade da <em>pessoa humana</em>, e não só em dignidade humana, porque ela é individual. Não pode ser sacrificada em nome do grupo.</p>
    `,
    resumo: [
      'Liberdade é o fundamento do Direito, limitada pela liberdade dos outros.',
      'Dignidade: o que está acima de todo preço; a pessoa é fim, nunca meio.',
      'Dignidade da pessoa, individual: não pode ser sacrificada em nome do grupo.',
      'Crítica contemporânea: dimensão ecológica da dignidade.'
    ],
    exemploHtml: `Quando um direito individual é restringido em nome da coletividade, a pergunta de Kant é se a pessoa está sendo tratada como meio. Essa pergunta está na base da dignidade da pessoa humana.`
  },
  {
    id: 'bloco-11',
    numero: 12,
    titulo: 'Hegel: o racional, o real e o Estado',
    fonte: 'Filosofia do Direito (1820).',
    corpoHtml: `
      <p>Na leitura adotada aqui, Hegel (1770-1831) rompe com a tradição idealista que vinha desde Sócrates e adota uma visão <strong>realista</strong>: o racional é real e o real é racional.</p>
      <h3>Racional e real</h3>
      <p>O que é racional é real, e o que é real é racional. Acaba a separação entre mundo ideal e mundo concreto.</p>
      <h3>Dialética</h3>
      <p>Não é só um jeito de pensar: é o próprio modo pelo qual a realidade se desenvolve.</p>
      <h3>Contra o contrato</h3>
      <p>Para Hegel, o contrato social é ficção. O Estado é um fato que se impõe, e não a soma de indivíduos isolados.</p>
      <p>Com Hegel, rompe-se também com o individualismo e com a primazia da sociedade civil sobre o Estado.</p>
      <p>Parte da historiografia, porém, o classifica como idealista (idealismo absoluto).</p>
    `,
    resumo: [
      'Racional e real: fim da separação entre mundo ideal e mundo concreto.',
      'Dialética: o modo pelo qual a própria realidade se desenvolve.',
      'Contra o contrato social: o Estado é um fato, não uma soma de indivíduos.',
      'Rompe com o individualismo e com a primazia da sociedade civil sobre o Estado.'
    ],
    exemploHtml: `Quem diz que a sociedade é apenas um acordo entre indivíduos isolados está falando contra Hegel. Quem vê o Estado como instituição que se impõe e organiza a vida social está mais perto dele.`
  },
  {
    id: 'bloco-12',
    numero: 13,
    titulo: 'Quadro comparativo: ponto de partida, poder e poderes',
    fonte: 'Material de aula da disciplina.',
    corpoHtml: `
      <p>O quadro reúne, para cada autor da segunda fase e da primeira, o ponto de partida e quem fica com o poder.</p>
      <div class="tabela-rolavel" tabindex="0" role="group" aria-label="Tabela com rolagem lateral">
        <table>
          <thead>
            <tr><th>Autor</th><th>Ponto de partida</th><th>Quem detém o poder</th><th>Ideia que se costuma cobrar</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Hobbes</td>
              <td>Guerra de todos contra todos (competição, desconfiança e glória)</td>
              <td>Monarca absoluto, a quem cada um renuncia a parte da liberdade</td>
              <td>O contrato cria o Leviatã e impõe a paz</td>
            </tr>
            <tr>
              <td>Locke</td>
              <td>Liberdade e igualdade, com direitos à vida, à liberdade e à propriedade</td>
              <td>Governo civil como árbitro; o povo está sobre os poderes estatais</td>
              <td>Direito à revolução; árbitro imparcial</td>
            </tr>
            <tr>
              <td>Rousseau</td>
              <td>O homem nasce livre e, por toda parte, encontra-se sob ferros</td>
              <td>Corpo social, titular inalienável do Poder Constituinte</td>
              <td>Vontade geral; soberania não pode ser representada</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Os três poderes de Locke e de Montesquieu diferem em um ponto: o federativo de Locke ocupa o lugar que o judiciário ocupa em Montesquieu.</p>
      <div class="tabela-rolavel" tabindex="0" role="group" aria-label="Tabela com rolagem lateral">
        <table>
          <thead>
            <tr><th>Autor</th><th>Poderes</th><th>Observação</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Locke</td>
              <td>Executivo, legislativo e federativo</td>
              <td>O federativo cuida da guerra, da paz e das alianças</td>
            </tr>
            <tr>
              <td>Montesquieu</td>
              <td>Executivo, legislativo e judiciário</td>
              <td>Reunidos na mesma pessoa, não existe liberdade</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    resumo: [
      'Hobbes, Locke e Rousseau partem de pontos de partida diferentes.',
      'Quem detém o poder: monarca (Hobbes), governo sob controle do povo (Locke), corpo social (Rousseau).',
      'Locke tem o federativo; Montesquieu tem o judiciário.'
    ],
    exemploHtml: `Em uma prova, a pergunta "quem é o titular do poder" pode ter três respostas diferentes: o monarca absoluto (Hobbes), o governo sob controle do povo (Locke) e o corpo social (Rousseau).`
  },
  {
    id: 'bloco-13',
    numero: 14,
    titulo: 'Proudhon: crítica atenuada ao capitalismo',
    fonte: 'Material de aula da disciplina.',
    corpoHtml: `
      <p>Proudhon (1809-1865) representa a fase mais <strong>atenuada</strong> da crítica ao capitalismo: censura a grande propriedade, mas admite manter a pequena propriedade privada.</p>
      <h3>Coletivizar sem romper</h3>
      <p>Queria que os meios de produção passassem aos artesãos, garantindo a venda equitativa dos produtos, sem abandonar por completo as estruturas capitalistas.</p>
      <h3>Justiça é social</h3>
      <p>O homem só é homem pela sociedade. A justiça se constrói sobre a dignidade reconhecida no outro tanto quanto em si mesmo.</p>
      <h3>O que ele negava</h3>
      <p>A luta de classes, a revolução proletária, a ditadura do proletariado e a necessidade do Estado.</p>
      <p><strong>Importância:</strong> com ele começa a dimensão social e anti-individualista que depois leva ao constitucionalismo social.</p>
    `,
    resumo: [
      'Fase mais atenuada: censura a grande propriedade e admite a pequena.',
      'Coletivizar os meios de produção sem romper por completo com o capitalismo.',
      'Justiça é social: o homem só é homem pela sociedade.',
      'Nega a luta de classes, a revolução proletária, a ditadura do proletariado e a necessidade do Estado.'
    ],
    exemploHtml: `Quando se defende que a justiça depende de condições sociais, e não apenas de liberdades formais, a dimensão social começa com Proudhon.`
  },
  {
    id: 'bloco-14',
    numero: 15,
    titulo: 'Marx: infraestrutura, superestrutura e o Direito',
    fonte: 'O Capital (1867).',
    corpoHtml: `
      <p>Marx (1818-1883) estuda as relações sociais a partir das relações produtivas: quem tem os <strong>meios de produção</strong> (a burguesia) subjuga quem só tem o próprio trabalho (o proletariado).</p>
      <h3>Infraestrutura e superestrutura</h3>
      <p>A infraestrutura é tudo o que está ligado aos meios de produção e gera riqueza: indústria, agricultura, comércio, mineração. A superestrutura é o que se levanta sobre ela: Estado, Constituição, religião, cultura, ideologia e Direito.</p>
      <h3>O Direito para Marx</h3>
      <p>É elemento da superestrutura que serve para manter a infraestrutura capitalista: instrumento de dominação burguesa e do <em>status quo</em>. Por isso deveria ser abolido. Marx não formulou uma teoria marxista do direito.</p>
      <p><strong>Repercussão prática:</strong> o receio de ruptura gerado por essas críticas ajudou a produzir o constitucionalismo social no Ocidente.</p>
    `,
    resumo: [
      'Meios de produção: burguesia subjuga o proletariado.',
      'Infraestrutura (riqueza) e superestrutura (Estado, Direito, ideologia).',
      'O Direito mantém a infraestrutura capitalista e deveria ser abolido.',
      'Marx não formulou uma teoria marxista do direito.'
    ],
    exemploHtml: `Quando se pergunta a quem uma norma serve, e se ela apenas reflete a estrutura econômica, a pergunta é de Marx.`
  },
  {
    id: 'bloco-15',
    numero: 16,
    titulo: 'Linha do tempo',
    fonte: 'Material de aula da disciplina.',
    corpoHtml: `
      <p>Datas de vida, em ordem de nascimento, com a ideia central de cada autor.</p>
      <div class="tabela-rolavel" tabindex="0" role="group" aria-label="Tabela com rolagem lateral">
        <table>
          <thead>
            <tr><th>Período</th><th>Autor ou marco</th><th>Ideia central</th></tr>
          </thead>
          <tbody>
            <tr><td>1453</td><td>Fim da Guerra dos Cem Anos; tomada de Constantinopla</td><td>Início da filosofia moderna e da formação do Estado moderno.</td></tr>
            <tr><td>1469-1527</td><td>Maquiavel</td><td>Governar como arte de guerra; o Estado como fato.</td></tr>
            <tr><td>1530-1596</td><td>Bodin</td><td>Soberania: poder supremo, uno e indivisível.</td></tr>
            <tr><td>1583-1645</td><td>Grotius</td><td>Direito natural revelado pela razão.</td></tr>
            <tr><td>1588-1679</td><td>Hobbes</td><td>Guerra de todos contra todos; Leviatã; monarca absoluto.</td></tr>
            <tr><td>1627-1704</td><td>Bossuet</td><td>Poder régio por direito divino.</td></tr>
            <tr><td>1632-1694</td><td>Pufendorf</td><td>Distingue Direito e Moral; sociabilidade.</td></tr>
            <tr><td>1632-1704</td><td>Locke</td><td>Liberdade e igualdade no estado de natureza; direito à revolução.</td></tr>
            <tr><td>1689-1755</td><td>Montesquieu</td><td>Só o poder contém o poder; três poderes.</td></tr>
            <tr><td>1712-1778</td><td>Rousseau</td><td>Vontade geral; soberania popular.</td></tr>
            <tr><td>1724-1804</td><td>Kant</td><td>Imperativos; dignidade da pessoa.</td></tr>
            <tr><td>1770-1831</td><td>Hegel</td><td>O racional é real; dialética; o Estado como fato.</td></tr>
            <tr><td>1809-1865</td><td>Proudhon</td><td>Crítica atenuada ao capitalismo; justiça social.</td></tr>
            <tr><td>1818-1883</td><td>Marx</td><td>Infraestrutura e superestrutura; o Direito como dominação.</td></tr>
          </tbody>
        </table>
      </div>
    `,
    resumo: [
      'Primeira fase: Maquiavel, Bodin, Bossuet e Hobbes.',
      'Segunda fase: Grotius, Pufendorf, Locke, Montesquieu, Rousseau, Kant e Hegel.',
      'Filosofia Social: Proudhon e Marx.',
      'A linha começa em 1453, com a formação do Estado moderno.'
    ],
    exemploHtml: `Ao ler um texto sobre a origem do Estado de Direito, a linha do tempo mostra que ele vem depois da construção do Estado nacional, e não antes.`
  },
  {
    id: 'bloco-16',
    numero: 17,
    titulo: 'Bloco 3: Teorias contemporâneas da justiça',
    fonte: 'Aguardando material do professor.',
    corpoHtml: `
      <p>Aguardando material do professor.</p>
    `,
    resumo: [],
    exemploHtml: ''
  }
];
