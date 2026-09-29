import type { BlocoResumo } from '../../../tipos';

/**
 * Os blocos teóricos do resumo de Filosofia Jurídica, 1a unidade (Idade
 * Antiga e Idade Média). Fontes, todas no mesmo nível: os slides das aulas
 * da Idade Antiga (introdução e fixação) e da Idade Média, o simulado de
 * fixação e os livros de apoio (Wolkmer, Manual de Humanística, Marcondes e
 * Struchiner). Esta unidade não cita artigo de lei: nenhum botão de citação
 * de dispositivo aparece aqui. Não há citação literal além das que estão
 * nos próprios livros de apoio, sempre atribuídas.
 *
 * Blocos 1 a 7: Idade Antiga. Blocos 8 a 10: Idade Média. Bloco 11: quadro
 * comparativo (Platão, Aristóteles e Tomás). Bloco 12: linha do tempo.
 * As divergências entre as fontes (Aquino, ius gentium, datas, Estado e
 * Igreja) não são bloco à parte: entram dentro do bloco do tema, resolvidas
 * com justificativa e atribuídas, sem dizer que alguém errou.
 */
export const resumo: readonly BlocoResumo[] = [
  {
    id: 'bloco-0',
    numero: 1,
    titulo: 'Do mito ao logos: a ideia de uma justiça dos homens',
    fonte:
      'Slides da aula de noções preliminares em Filosofia; slides da aula de Filosofia Jurídica na Idade Antiga; WOLKMER, Antonio Carlos. Síntese de uma história das idéias jurídicas. Florianópolis, 2005, cap. 1.',
    corpoHtml: `
      <p>A filosofia nasce na Grécia como ruptura com a explicação mítica. Em vez da vontade arbitrária dos deuses, busca-se explicar o mundo pela natureza e pela razão (o <strong>logos</strong>). Junto com essa mudança aparece a justiça "dos homens": uma ordem racional, discutida e pactuada em público, na praça da cidade (a <strong>pólis</strong>).</p>
      <p>Os slides listam as condições históricas dessa passagem: viagens marítimas, calendário, vida urbana, escrita alfabética, invenção da política, ideia de lei, espaço público e estímulo ao debate.</p>
      <h3>A atitude filosófica</h3>
      <p>Filosofar é interrogar: o que é, como é, por que é. É uma atitude crítica diante de causas e sentidos. Os slides distinguem também os tipos de conhecimento (popular, científico, filosófico e religioso), cada um com seus traços de método e de certeza.</p>
      <h3>Por que isso importa ao Direito</h3>
      <p>A noção de "um Direito justo" nasce dessa cultura, primeiro na dramaturgia (bloco 2) e depois na discussão entre sofistas, Sócrates, Platão e Aristóteles. Nos slides, Warat é lembrado para advertir que a faculdade tende a vestir o Direito de roupagem sagrada e neutra; para ele, o Direito é construção histórica e social, e por isso pode ser questionado.</p>
    `,
    resumo: [
      'Mito e logos: da vontade arbitrária dos deuses à explicação pela natureza e pela razão.',
      'Justiça "dos homens": ordem racional discutida e pactuada na pólis.',
      'Atitude filosófica: perguntar o que é, como é e por que é.',
      'A ideia de Direito justo nasce dessa cultura e atravessa toda a unidade.'
    ],
    exemploHtml: `Quando um advogado pergunta se uma norma é apenas válida ou também justa, ele repete, sem perceber, o gesto grego de pedir razões em vez de aceitar uma ordem pela autoridade de quem a dá.`
  },
  {
    id: 'bloco-1',
    numero: 2,
    titulo: 'Dramaturgia ática e a lei justa: Antígona',
    fonte:
      'Slides da aula de Filosofia Jurídica na Idade Antiga; MARCONDES, Danilo; STRUCHINER, Noel. Textos básicos de filosofia do direito (Sófocles, Antígona); WOLKMER, Síntese de uma história das idéias jurídicas, cap. 1; NASCIMENTO, Filippe Augusto dos Santos. Manual de Humanística, cap. 2.',
    corpoHtml: `
      <p>Segundo as aulas, a noção de "um Direito justo" nasce na dramaturgia clássica de Sófocles, Ésquilo e Eurípides. No século V a.C. a tragédia era cerimônia cívica e espaço de discussão das crenças e valores da sociedade grega, como lembra o livro de Marcondes e Struchiner.</p>
      <h3>O conflito de Antígona</h3>
      <p>Em <em>Antígona</em>, Creonte decreta que o irmão da protagonista, Polinice, não seja sepultado. Antígona descumpre o decreto e o sepulta, invocando leis divinas não escritas. O choque é entre a lei do Estado, ligada à força, à razão e ao formalismo, e o direito familiar e divino, ligado ao amor, à piedade e à tradição.</p>
      <p>No livro de apoio, Antígona diz que essas normas divinas, não escritas e inevitáveis, vigem "não é de hoje, não é de ontem, é desde os tempos mais remotos" (v. 511 a 520, na tradução do livro). Por isso a peça é lida como uma das primeiras formulações do debate entre <strong>direito natural</strong> e <strong>direito positivo</strong>.</p>
      <p>Aristóteles, na <em>Retórica</em>, recorre a Antígona para distinguir a lei particular, escrita ou não, de uma comunidade, da lei universal, a da natureza (<em>kata physin</em>).</p>
      <h3>Uma leitura que não é unânime</h3>
      <p>O livro de Marcondes e Struchiner registra que a maioria dos intérpretes vê Sófocles favorável à lei natural ou divina, mas nem Creonte nem Antígona teriam razão absoluta: ambos seriam vítimas da <em>hybris</em>, o excesso de orgulho. Para a prova, guarde a leitura das aulas, o choque entre a lei posta pelo governante e as leis não escritas de ordem sagrada e natural; a nuance da hybris serve como leitura complementar.</p>
    `,
    resumo: [
      'Dramaturgia clássica (Sófocles, Ésquilo, Eurípides): berço da noção de um Direito justo.',
      'Antígona: decreto de Creonte (lei do Estado) contra leis divinas não escritas invocadas por Antígona.',
      'É lida como uma das primeiras formulações do debate direito natural x direito positivo.',
      'Aristóteles usa Antígona na Retórica para distinguir lei particular de lei universal.',
      'Nuance: nem Creonte nem Antígona teriam razão absoluta (hybris).'
    ],
    exemploHtml: `Toda vez que alguém alega que uma ordem legal é injusta demais para ser cumprida, reaparece o argumento de Antígona: existe uma medida de justiça acima do decreto. Saber de onde vem essa medida é o fio que liga esta unidade.`
  },
  {
    id: 'bloco-2',
    numero: 3,
    titulo: 'Os sofistas: natureza (physis) e convenção (nomos)',
    fonte:
      'Slides das aulas de Filosofia Jurídica na Idade Antiga (introdução e fixação); NASCIMENTO, Manual de Humanística, cap. 2; WOLKMER, Síntese de uma história das idéias jurídicas, cap. 1.',
    corpoHtml: `
      <p>No século V a.C. o pensamento grego troca o naturalismo cósmico dos pré-socráticos por problemas sociais, políticos e morais. Os sofistas questionam a diferença entre a ordem natural (<strong>physis</strong>) e a ordem humana (<strong>nomos</strong>): existe justiça por natureza ou só por convenção? O dever é para com a lei da cidade ou para com uma lei superior dos deuses?</p>
      <h3>Traços do grupo</h3>
      <p>Os sofistas não formam uma corrente única. O traço comum apontado nas aulas é o ceticismo quanto a uma justiça em si: cada sujeito julga a partir da sua circunstância, e a justiça do caso concreto ganha peso. Nomes citados, com as datas dos slides: Górgias (485-380 a.C.), Protágoras (481-411), Pródico (465-395), Trasímaco (459-400) e Hípias (443-399). Por isso são vistos como precursores primitivos do relativismo e do positivismo jurídicos.</p>
      <h3>Não confundir os nomes</h3>
      <ul>
        <li><strong>Protágoras</strong>: <em>homo mensura</em>, "o homem é a medida de todas as coisas". Relativismo e individualismo.</li>
        <li><strong>Trasímaco</strong>: a justiça é a conveniência do mais forte. As leis resultam da força de quem controla o poder, e a justiça legal disfarça o domínio dos detentores do poder.</li>
        <li><strong>Epicuro</strong> (tradição helenística), lembrado nas aulas ao lado dos sofistas como um contratualismo primitivo: a justiça não existe em si, nasce de pactos de não causar nem sofrer dano.</li>
      </ul>
      <p>A confusão entre Protágoras e Trasímaco é das mais cobradas em questões de verdadeiro ou falso: a frase da "conveniência do mais forte" é de Trasímaco, e o <em>homo mensura</em> é de Protágoras.</p>
    `,
    resumo: [
      'Sofistas: physis (natureza) x nomos (convenção); ceticismo quanto a uma justiça em si.',
      'Grupo heterogêneo: Górgias, Protágoras, Pródico, Trasímaco, Hípias.',
      'Protágoras: homo mensura. Trasímaco: justiça como conveniência do mais forte.',
      'Epicuro: justiça como pacto de não causar dano (contratualismo primitivo).',
      'Precursores primitivos do relativismo e do positivismo jurídicos.'
    ],
    exemploHtml: `Quem diz que "a lei é o que o poder estabelece" está repetindo Trasímaco; quem diz que "cada caso é um caso e cada um julga por si" está mais perto de Protágoras. Distinguir as duas frases evita atribuir ao autor errado a tese que se quer discutir.`
  },
  {
    id: 'bloco-3',
    numero: 4,
    titulo: 'Sócrates: virtude, cidade e obediência às leis',
    fonte:
      'Slides da aula de fixação da Idade Antiga; NASCIMENTO, Manual de Humanística, cap. 2; MARCONDES e STRUCHINER, Textos básicos de filosofia do direito (Platão, Críton); WOLKMER, Síntese de uma história das idéias jurídicas, cap. 1.',
    corpoHtml: `
      <p>Sócrates (469-399 a.C.) está entre os idealistas, que buscam por meio da razão uma verdade e uma justiça absolutas. Seu método é a <strong>maiêutica</strong> (a "parteira das ideias") aliada à dialética: as virtudes já existem em cada pessoa e cabe redescobri-las; a virtude não se ensina, descobre-se.</p>
      <p>Para Sócrates, a justiça é cumprir a lei da pólis. As leis expressam os interesses da coletividade, e respeitá-las é condição do bem comum.</p>
      <h3>O julgamento e a recusa da fuga</h3>
      <p>Condenado por incitar a juventude a refletir criticamente, Sócrates recusou a fuga que Críton propôs. Nas aulas, a razão é que o bom cidadão deve obedecer também às leis más, para não encorajar o cidadão perverso a violar as boas. No <em>Críton</em>, lido no livro de apoio, ele imagina as próprias leis o interpelando e diz preferir morrer como cidadão de Atenas, julgado segundo as leis, para não renegar os princípios que defendera.</p>
      <p>Wolkmer descreve essa mesma obediência como levada até uma lei "errada ou até criminosa". Quem responde a uma questão sobre o tema deve reter o ponto central: <strong>a injustiça da condenação não autorizou Sócrates a fugir</strong>.</p>
    `,
    resumo: [
      'Idealista; método: maiêutica e dialética; a virtude não se ensina, descobre-se.',
      'Justiça é cumprir a lei da pólis; leis expressam o interesse da coletividade.',
      'Recusou a fuga proposta por Críton e aceitou a condenação.',
      'A injustiça da sentença não autorizou o descumprimento.'
    ],
    exemploHtml: `O caso de Sócrates é o exemplo clássico de tensão entre consciência e ordem jurídica: obedecer à sentença mesmo a considerando injusta, para preservar a autoridade das leis, é a posição dele, e não a de quem acha que a injustiça material dispensa o cumprimento.`
  },
  {
    id: 'bloco-4',
    numero: 5,
    titulo: 'Platão: a justiça como harmonia',
    fonte:
      'Slides das aulas de Filosofia Jurídica na Idade Antiga; NASCIMENTO, Manual de Humanística, cap. 2; MARCONDES e STRUCHINER, Textos básicos de filosofia do direito (Platão); WOLKMER, Síntese de uma história das idéias jurídicas, cap. 1.',
    corpoHtml: `
      <p>Platão (427-348 a.C., datas das aulas) usa os diálogos de Sócrates para desconstruir as definições utilitaristas dos sofistas, como a de Trasímaco. Para ele a justiça é um arquétipo ideal, harmonia da alma e da cidade. Wolkmer resume: justiça é sabedoria e virtude da alma; injustiça é ignorância e vício.</p>
      <h3>Justiça orgânica</h3>
      <p>Na cidade ideal, cada cidadão cumpre rigidamente o seu papel: os sábios pensam e governam, os guerreiros lutam e defendem, os artífices trabalham e produzem. O desvio dessa ordem gera injustiça. Daí um Estado forte, com divisão social do trabalho rígida e direitos individuais subordinados ao interesse social e político.</p>
      <h3>Justiça não é dar o mal</h3>
      <p>Platão rejeita a moral pragmática segundo a qual se deve fazer bem aos amigos e mal aos inimigos. Prejudicar alguém piora o indivíduo e retira-lhe a perfeição; como a justiça é virtude que aperfeiçoa moralmente, ela jamais pode produzir o mal. Os slides marcam esse ponto como "questão de concurso".</p>
      <h3>As Leis</h3>
      <p>Na obra da maturidade, <em>As Leis</em>, a lei escrita aparece como sinal de progresso e noção primitiva de Estado de Direito; ali predominam as leis, ao contrário da <em>República</em>, em que governam os guardiães.</p>
      <h3>Cuidado com quem fala</h3>
      <p>O livro de apoio adverte que nem tudo o que aparece nos diálogos é a posição de Platão. O mito de Giges (<em>República</em>, livro II) é uma exposição de Glauco dentro da dialética; o mito de Prometeu, no <em>Protágoras</em>, representa a posição de Protágoras. Na <em>República</em> I, Platão contesta Trasímaco e considera a justiça natural (<em>katà physin</em>), não mera convenção.</p>
      <p>Sobre as datas, as aulas dão 427-348 a.C. e os livros de apoio trazem 428-347 e 427-347. Seguindo o critério das aulas, este resumo usa 427-348.</p>
    `,
    resumo: [
      'Justiça como harmonia: sábios governam, guerreiros defendem, artífices produzem, sem desvio de funções.',
      'Rejeita "bem aos amigos, mal aos inimigos": a justiça jamais produz o mal.',
      'Contesta a definição de Trasímaco; a justiça é natural, não só convenção.',
      'Em As Leis, valoriza a lei escrita como avanço e base de Estado de Direito.',
      'Giges e Prometeu: falas de outros personagens, não a posição de Platão.'
    ],
    exemploHtml: `Uma pena pensada apenas como vingança contra o infrator esbarra na objeção de Platão: causar mal degrada quem o pratica. A discussão sobre a finalidade da pena começa por aí, muito antes do Direito Penal moderno.`
  },
  {
    id: 'bloco-5',
    numero: 6,
    titulo: 'Aristóteles: justo meio, tipos de justiça e equidade',
    fonte:
      'Slides das aulas de Filosofia Jurídica na Idade Antiga (introdução e fixação); NASCIMENTO, Manual de Humanística, cap. 2; MARCONDES e STRUCHINER, Textos básicos de filosofia do direito (Aristóteles).',
    corpoHtml: `
      <p>Aristóteles (384-322 a.C.) vê o homem como <strong>animal político</strong> (<em>zóon politikón</em>): ninguém existe de forma independente. A justiça resolve a dependência mútua e a escassez de recursos, como riquezas, alimentos e cargos. A virtude, inclusive a justiça, é o <strong>justo meio</strong> (<em>mesótes</em>), sem excesso nem falta; por buscar equilíbrio, a justiça liga-se à igualdade.</p>
      <h3>Dois sentidos de justiça</h3>
      <ul>
        <li><strong>Universal (sentido amplo)</strong>: cumprir as leis, que garantem o bem comum.</li>
        <li><strong>Particular (sentido estrito)</strong>: distribuir justiça entre os indivíduos. Divide-se em comutativa e distributiva.</li>
      </ul>
      <div class="tabela-rolavel" tabindex="0" role="group" aria-label="Tabela com rolagem lateral">
        <table>
          <thead>
            <tr><th>Tipo</th><th>Relação</th><th>Igualdade</th><th>Exemplos</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Comutativa (corretiva)</td>
              <td>Indivíduo x indivíduo, relações privadas</td>
              <td>Aritmética (simples)</td>
              <td>Contratos; Direito Civil e Penal</td>
            </tr>
            <tr>
              <td>Distributiva</td>
              <td>Estado x indivíduo</td>
              <td>Proporcional (geométrica), por mérito ou necessidade</td>
              <td>Cargos públicos, benefícios sociais</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Da igualdade proporcional vem a fórmula atribuída a Aristóteles de tratar igualmente os iguais e desigualmente os desiguais, na medida da sua desigualdade, que o simulado liga à máxima de Rui Barbosa.</p>
      <h3>Justo natural, justo legal e equidade</h3>
      <p>O <strong>justo natural</strong> tem base na natureza e independe de opiniões humanas; o <strong>justo legal</strong> é convencionado pelo legislador e obrigatório na cidade. A <strong>equidade</strong> é o corretivo da lei geral e abstrata quando ela se mostra deficiente por causa da própria universalidade: é o justo no caso concreto.</p>
      <h3>Regimes de governo</h3>
      <p>Na <em>Política</em>, o critério para um governo ser bom ou ruim é a finalidade ética, não o número de governantes. Visando ao bem comum: monarquia, aristocracia e república. Visando ao interesse egoísta: tirania, oligarquia e democracia.</p>
      <p>O livro de apoio traz ainda a lembrança de que, na <em>Política</em> III, o direito aparece como "a razão livre de qualquer paixão", e na <em>Ética a Nicômaco</em> V "justo" significa o que está dentro da lei e respeita os outros.</p>
    `,
    resumo: [
      'Animal político; virtude como justo meio; justiça ligada à igualdade.',
      'Justiça universal: cumprir as leis pelo bem comum. Particular: comutativa e distributiva.',
      'Comutativa: relações privadas, igualdade aritmética. Distributiva: Estado x indivíduo, igualdade proporcional.',
      'Equidade: corretivo da lei geral no caso concreto.',
      'Regimes: o que decide é a finalidade ética, não o número de governantes.'
    ],
    exemploHtml: `Um concurso que reserva vagas por critério de necessidade aplica a lógica distributiva; um contrato em que cada parte devolve o equivalente ao que recebeu aplica a comutativa; o juiz que abranda a regra geral por causa de um caso peculiar aplica a equidade.`
  },
  {
    id: 'bloco-6',
    numero: 7,
    titulo: 'Estoicismo, direito romano e Cícero',
    fonte:
      'Slides das aulas de Filosofia Jurídica na Idade Antiga; NASCIMENTO, Manual de Humanística, cap. 2; WOLKMER, Síntese de uma história das idéias jurídicas, caps. 1 e 2.',
    corpoHtml: `
      <p>Os romanos têm natureza prática: absorveram fontes dos povos conquistados e as adaptaram. Os slides citam Guido Fassò para dizer que a ciência jurídica é criação romana, num direito sistematizado, funcional e amplo.</p>
      <h3>Estoicismo</h3>
      <p>Segundo Wolkmer, o estoicismo, fundado por Zenão, defende a vida segundo a natureza e uma lei natural universal e suprema, emanada da razão e inspiradora das leis positivas. A ideia passa ao pensamento romano e chega à teologia moral cristã.</p>
      <h3>Cícero (106-43 a.C.)</h3>
      <p>Cícero incorporou platonismo, aristotelismo e estoicismo e é apresentado como o primeiro "autêntico" filósofo do Direito. Sua filosofia jurídica marca um momento inicial na construção da teoria do Direito Natural. Em <em>Sobre as Leis</em>, ele busca a origem do direito na própria natureza, não nas opiniões dos homens nem só nas leis escritas. A máxima que os slides lhe atribuem é <em>Natura juris ab homines repetenda est natura</em>: a essência do Direito deve ser buscada na essência humana.</p>
      <h3>Direito natural e direito positivo</h3>
      <ul>
        <li><strong>Direito natural</strong> (<em>ius naturale</em>): fundado na razão universal, vale para todos os povos, sem limites.</li>
        <li><strong>Direito positivo</strong> (<em>ius civile</em>): fundado na vontade do povo, próprio de um povo determinado, com limites. O exemplo dado é o das leis positivas de Creonte.</li>
      </ul>
      <h3>Ius civile, ius gentium e ius naturale</h3>
      <p>A tripartição usada nas aulas e no relatório de sistematização é: <em>ius civile</em>, próprio do povo romano; <em>ius gentium</em>, comum a todos os povos; <em>ius naturale</em>, os princípios ditados pela razão natural. O Digesto de Justiniano registra essa diferenciação entre normas positivas locais, direito universal entre os povos e leis derivadas da natureza.</p>
      <p><strong>Uma divergência de fontes e a escolha feita aqui.</strong> O Manual de Humanística registra que Bobbio aproxima o <em>ius gentium</em> do direito natural, enquanto Del Vecchio o trata como uma espécie de direito internacional, categoria do direito positivo, e diz que é conceito romano, não grego. Como a classificação é discutida na doutrina, este resumo mantém a tripartição das aulas, que é a que as questões de fixação seguem, e retém o essencial: as três categorias não se equivalem. O direito da cidade de Roma não se confunde com a razão universal comum a todos os viventes.</p>
      <p>Sobre o Digesto, Wolkmer lembra que reúne extratos de 39 jurisconsultos (entre eles Ulpiano, Paulo, Papiniano e Gaio) e traz a definição de justiça de Ulpiano, "vontade constante e perpétua de dar a cada um o seu direito", e os preceitos <em>honeste vivere</em>, <em>alterum non laedere</em> e <em>suum cuique tribuere</em>.</p>
    `,
    resumo: [
      'Romanos: ciência jurídica sistematizada e prática, a partir de fontes de outros povos.',
      'Estoicismo: lei natural universal, emanada da razão, inspira as leis positivas.',
      'Cícero: o direito se funda na natureza, não na opinião dos homens; primeiro filósofo do Direito.',
      'Ius naturale (razão universal) x ius civile (vontade de um povo); ius gentium: comum a todos os povos.',
      'As três categorias romanas não se equivalem.'
    ],
    exemploHtml: `A ideia de que certos direitos valem para qualquer pessoa, mesmo onde a lei local silencia, é a herança estoica e ciceroniana. Já a ideia de que a lei de cada país vale para os seus cidadãos é o ius civile em sua forma moderna.`
  },
  {
    id: 'bloco-7',
    numero: 8,
    titulo: 'Idade Média: organicismo cristão e Santo Agostinho',
    fonte:
      'Slides da aula de Filosofia Jurídica na Idade Média; NASCIMENTO, Manual de Humanística, cap. 2; WOLKMER, Síntese de uma história das idéias jurídicas, cap. 2.',
    corpoHtml: `
      <p>A Idade Média (séculos IV a XIV, nas aulas) é marcada ideologicamente pelo cristianismo. O indivíduo é visto como membro de uma coletividade, uma grande comunidade cristã, perfeita por ser determinada por Deus, com papéis sociais definidos e imutáveis: o <strong>organicismo cristão</strong>. Prega-se o amor ao próximo, mas a finalidade última é o amor a Deus, e a sociedade é um "corpo místico". Wolkmer acrescenta que, ao contrário da Antiguidade, que valorizava o homem por posses e feitos e excluía pobres, mulheres e escravos, o cristianismo reconhece o homem como unidade de matéria e espírito.</p>
      <h3>Santo Agostinho (354-430)</h3>
      <p>Para Agostinho, a inserção do indivíduo no grupo é essencial: só na coletividade dos fiéis, a Igreja, está o caminho da salvação. Ele retoma o dualismo platônico e distingue duas leis: a de Deus, perfeita e acabada, e a dos homens, imperfeita e cheia de vícios. No choque, prevalece a lei de Deus, o que se chama de <strong>jusnaturalismo teológico</strong>. As obras lembradas são as <em>Confissões</em> e <em>A Cidade de Deus</em>, que opõe a Cidade de Deus (perfeita, de lei ideal e imutável) à Cidade dos Homens (imperfeita).</p>
      <p>Wolkmer acrescenta que Agostinho harmoniza o cristianismo com as ideias de lei eterna, natural e humana: a lei eterna expressa a razão e a vontade de Deus e fundamenta as leis humanas, e a lei natural é a participação da criatura racional na ordem divina. Uma nota de fonte: o livro de Marcondes e Struchiner não traz texto de Agostinho, então aqui só se resume o que as aulas e Wolkmer dizem dele.</p>
    `,
    resumo: [
      'Organicismo cristão: sociedade como corpo místico, papéis definidos, fim último em Deus.',
      'Agostinho: só na coletividade dos fiéis está a salvação.',
      'Duas leis: a de Deus (perfeita) e a dos homens (imperfeita); no choque, prevalece a de Deus.',
      'Jusnaturalismo teológico; Cidade de Deus x Cidade dos Homens.'
    ],
    exemploHtml: `Quando se diz que uma lei humana não pode contrariar uma ordem superior, é a estrutura de Agostinho que reaparece: um plano de valores acima da norma posta, agora com fundamento religioso, e não mais apenas na razão como em Cícero.`
  },
  {
    id: 'bloco-8',
    numero: 9,
    titulo: 'Tomás de Aquino: a síntese entre Aristóteles e o cristianismo, e as leis',
    fonte:
      'Slides da aula de Filosofia Jurídica na Idade Média; NASCIMENTO, Manual de Humanística, cap. 2; MARCONDES e STRUCHINER, Textos básicos de filosofia do direito (Tomás de Aquino, Suma Teológica); WOLKMER, Síntese de uma história das idéias jurídicas, cap. 2.',
    corpoHtml: `
      <p>Tomás de Aquino (1225-1274, datas das aulas; o livro de Marcondes e Struchiner traz 1224 para o nascimento) é o autor da <em>Suma Teológica</em> e responsável pela grande síntese entre Aristóteles, "o Filósofo", e o cristianismo. Ele não rompe com a tipologia aristotélica de justiça: retoma a divisão em comutativa (trocas entre particulares, igualdade aritmética) e distributiva (honras, cargos e encargos, igualdade proporcional por mérito) e a integra à moral cristã do amor ao próximo e à virtude da caridade. Razão e fé: filosofia e intelecto a serviço da fé revelada.</p>
      <h3>As leis em Tomás</h3>
      <ul>
        <li><strong>Lei eterna</strong>: a lei de Deus, fundamento de todas as demais.</li>
        <li><strong>Lei natural</strong>: a participação da criatura racional na lei eterna, alcançável pela razão. Obriga, por exemplo, a conservar a vida, gerar e educar os filhos e buscar a verdade.</li>
        <li><strong>Lei humana</strong>: a lei posta, positiva, estabelecida pelos homens com base na lei natural e voltada à utilidade comum.</li>
        <li><strong>Lei divina</strong>: a que vem das Escrituras. Os slides destacam as três primeiras; Wolkmer, ao expor as questões 90 a 97 da <em>Suma</em>, acrescenta a divina, completando as quatro.</li>
      </ul>
      <p>A lei natural não se confunde com os decretos do soberano temporal: estes pertencem à lei humana. E a lei natural é a mesma para todos nos princípios gerais; as conclusões de detalhe valem na maioria dos casos, com exceções (o exemplo da <em>Suma</em>, q. 94, art. 4, é devolver o que foi emprestado, que em um caso particular pode ser danoso).</p>
      <h3>Lei humana contra lei natural: duas leituras na bibliografia</h3>
      <p>Os autores de apoio leem de modo diferente o que Tomás diz sobre o conflito entre a lei humana e a lei natural:</p>
      <ul>
        <li><strong>Wolkmer</strong>: a lei humana só tem caráter de lei na medida em que deriva da lei natural, e a que se afasta dela "não será lei, senão a corrupção da lei".</li>
        <li><strong>Manual de Humanística</strong>: para Aquino, no conflito entre a lei humana e a lei natural, deve prevalecer a humana, respeitada mesmo quando eventualmente se mostre contrária ao bem comum.</li>
      </ul>
      <p>As duas leituras não se reduzem uma à outra, e o material não as concilia. O ponto em que os dois autores concordam é o conflito com a lei eterna: nele, esta prevalece. Em resposta de prova, atribua a tese ao autor que a sustenta (segundo Wolkmer, segundo o Manual) em vez de apresentá-la como posição única de Tomás.</p>
    `,
    resumo: [
      'Suma Teológica; síntese entre Aristóteles e o cristianismo; razão a serviço da fé.',
      'Justiça comutativa e distributiva recebidas de Aristóteles, integradas à caridade.',
      'Lei eterna, lei natural (razão), lei humana (positiva) e lei divina (Escrituras).',
      'Lei natural não é decreto do soberano: este é lei humana.',
      'Lei humana x lei natural: para Wolkmer, a que se afasta da natural "não será lei, senão a corrupção da lei"; para o Manual de Humanística, prevalece a humana. No conflito com a lei eterna, prevalece a eterna nas duas leituras.'
    ],
    exemploHtml: `Ao discutir se uma norma legal muito injusta ainda obriga, as duas leituras dão respostas diferentes: em uma, a lei que se afasta da natural deixa de ser lei em sentido pleno; na outra, a lei humana deve ser respeitada mesmo quando se mostre contrária ao bem comum.`
  },
  {
    id: 'bloco-9',
    numero: 10,
    titulo: 'Estado e Igreja, e o contraponto de Escoto e Ockham',
    fonte:
      'Slides da aula de Filosofia Jurídica na Idade Média; NASCIMENTO, Manual de Humanística, cap. 2; WOLKMER, Síntese de uma história das idéias jurídicas, cap. 2.',
    corpoHtml: `
      <h3>Estado e Igreja em Tomás</h3>
      <p>Nos slides, há uma hierarquia dos fins: os fins últimos e superiores, ligados à transcendência, são ditados pela Igreja; os fins terrenos (subsistência, conforto) cabem ao Estado, que permanece subordinado à Igreja. O Manual de Humanística apresenta um quadro mais brando: Aquino via separação entre Igreja e Estado, com subordinação apenas entre a ordem natural e a sobrenatural.</p>
      <p><strong>Escolha feita aqui:</strong> para estudo, guarde a versão dos slides, em que o Estado fica subordinado à Igreja quanto aos fins últimos; a nuance do Manual serve de leitura complementar, porque as duas descrições cabem se a "subordinação" for entendida como a dos fins terrenos aos fins últimos, e não como fusão dos poderes.</p>
      <h3>Duns Escoto (1266-1308)</h3>
      <p>Contra o organicismo dominante, Escoto afirma o primado do individual sobre o geral e da liberdade sobre a ordem: Deus se revela a cada pessoa em sua individualidade.</p>
      <h3>Guilherme de Ockham (1285-1327)</h3>
      <p>Ockham separa o racional do teológico (a verdade é alcançável pelo conhecimento racional), distingue a potência divina da multiplicidade dos indivíduos e critica o universalismo da lei natural. Com isso fortalece o direito positivo e a noção de direito subjetivo, os direitos que o indivíduo tem por lhe terem sido conferidos.</p>
      <p>Síntese das aulas: do organicismo ao indivíduo. Escoto e Ockham preparam a passagem para a filosofia moderna e para a ideia de Estado.</p>
    `,
    resumo: [
      'Slides: fins últimos ditados pela Igreja; fins terrenos com o Estado, subordinado à Igreja.',
      'Manual de Humanística: separação, com subordinação só entre ordem natural e sobrenatural.',
      'Escoto: primado do individual e da liberdade sobre a ordem.',
      'Ockham: separa razão e teologia, critica o universalismo, fortalece o direito positivo e o direito subjetivo.',
      'Passagem do organicismo ao indivíduo e à modernidade.'
    ],
    exemploHtml: `A ideia moderna de que cada pessoa tem direitos próprios, e não apenas lugar numa ordem maior, tem raízes na crítica de Ockham ao universalismo. Ele é lembrado nas aulas como um dos pontos de partida da noção de direito subjetivo.`
  },
  {
    id: 'bloco-10',
    numero: 11,
    titulo: 'Quadro comparativo: Platão, Aristóteles e Tomás de Aquino',
    fonte:
      'Slides das aulas de Filosofia Jurídica na Idade Antiga e na Idade Média; NASCIMENTO, Manual de Humanística, cap. 2; MARCONDES e STRUCHINER, Textos básicos de filosofia do direito.',
    corpoHtml: `
      <p>O quadro reúne, para cada um dos três autores, o que é justiça e de onde vem a lei, no sentido em que as aulas os apresentam.</p>
      <div class="tabela-rolavel" tabindex="0" role="group" aria-label="Tabela com rolagem lateral">
        <table>
          <thead>
            <tr><th>Autor</th><th>O que é justiça</th><th>Fonte da lei</th><th>Ideia que se costuma cobrar</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Platão</td>
              <td>Harmonia da alma e da pólis: cada classe cumpre sua função.</td>
              <td>Ordem ideal, apreendida pela razão; em As Leis, a lei escrita como base do Estado.</td>
              <td>A justiça jamais produz o mal; contesta Trasímaco.</td>
            </tr>
            <tr>
              <td>Aristóteles</td>
              <td>Virtude do justo meio, ligada à igualdade: universal (cumprir as leis) e particular (comutativa e distributiva).</td>
              <td>Justo natural (na natureza) e justo legal (convencionado pelo legislador); equidade corrige a lei.</td>
              <td>Igualdade aritmética x proporcional; equidade no caso concreto.</td>
            </tr>
            <tr>
              <td>Tomás de Aquino</td>
              <td>Retoma a divisão aristotélica e a integra à caridade cristã.</td>
              <td>Lei eterna, lei natural, lei humana e lei divina, em hierarquia; a humana deriva da natural.</td>
              <td>Síntese entre Aristóteles e o cristianismo; razão a serviço da fé.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3>O que os três têm em comum</h3>
      <p>Os três são organicistas ou comunitaristas, no sentido de que o ser humano se realiza dentro da comunidade, e todos lançam bases do jusnaturalismo: o Direito é visto também como dever ser, não apenas como o que o poder estabelece. As diferenças aparecem no fundamento: a ordem ideal (Platão), a natureza e o legislador (Aristóteles), a lei eterna de Deus (Tomás).</p>
    `,
    resumo: [
      'Platão: justiça como harmonia orgânica; o mal nunca é justo.',
      'Aristóteles: justo meio, justiça universal e particular, equidade.',
      'Tomás: retoma Aristóteles e integra à caridade; quatro leis em hierarquia.',
      'Em comum: comunidade e jusnaturalismo; muda o fundamento.'
    ],
    exemploHtml: `Numa prova, a mesma frase sobre "justiça" pode servir aos três autores. O que decide a resposta é o fundamento: ordem ideal, justo meio ou lei eterna.`
  },
  {
    id: 'bloco-11',
    numero: 12,
    titulo: 'Linha do tempo',
    fonte:
      'Slides das aulas de Filosofia Jurídica na Idade Antiga e na Idade Média; NASCIMENTO, Manual de Humanística, cap. 2. As datas seguem as aulas; onde os livros trazem valor diferente, o bloco do autor avisa.',
    corpoHtml: `
      <p>Datas dos slides, na ordem cronológica, com a ideia central de cada autor ou corrente.</p>
      <div class="tabela-rolavel" tabindex="0" role="group" aria-label="Tabela com rolagem lateral">
        <table>
          <thead>
            <tr><th>Período</th><th>Autor ou corrente</th><th>Ideia central</th></tr>
          </thead>
          <tbody>
            <tr><td>Século V a.C.</td><td>Dramaturgia ática (Sófocles)</td><td>Lei do Estado x leis divinas não escritas (Antígona).</td></tr>
            <tr><td>Século V a.C.</td><td>Sofistas (Protágoras 481-411; Trasímaco 459-400)</td><td>Physis x nomos; relativismo; justiça como conveniência do mais forte (Trasímaco).</td></tr>
            <tr><td>469-399 a.C.</td><td>Sócrates</td><td>Maiêutica; obediência às leis da pólis.</td></tr>
            <tr><td>427-348 a.C.</td><td>Platão</td><td>Justiça como harmonia; lei escrita em As Leis.</td></tr>
            <tr><td>384-322 a.C.</td><td>Aristóteles</td><td>Justo meio; justiça comutativa e distributiva; equidade.</td></tr>
            <tr><td>106-43 a.C.</td><td>Cícero</td><td>Direito fundado na natureza; primeiro filósofo do Direito.</td></tr>
            <tr><td>354-430</td><td>Santo Agostinho</td><td>Cidade de Deus; prevalece a lei de Deus.</td></tr>
            <tr><td>1225-1274</td><td>Tomás de Aquino</td><td>Quatro leis; síntese Aristóteles e cristianismo.</td></tr>
            <tr><td>1266-1308</td><td>Duns Escoto</td><td>Primado do individual e da liberdade.</td></tr>
            <tr><td>1285-1327</td><td>Guilherme de Ockham</td><td>Separa razão e teologia; direito subjetivo.</td></tr>
          </tbody>
        </table>
      </div>
    `,
    resumo: [
      'Idade Antiga: dramaturgia, sofistas, Sócrates, Platão, Aristóteles, Cícero.',
      'Idade Média: Agostinho, Tomás, Escoto e Ockham.',
      'Datas das aulas; onde os livros divergem (Platão, Aquino), o bloco do autor avisa.'
    ],
    exemploHtml: `Uma leitura em ordem cronológica mostra o movimento da unidade: da lei natural nascida da razão (Antiguidade), à lei natural fundada em Deus (Idade Média), até o indivíduo e o direito subjetivo (fim da Idade Média).`
  }
];
