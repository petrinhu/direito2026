import type { BlocoResumo } from '../../../tipos';

/**
 * Os nove blocos teóricos do resumo de Introdução ao Direito, 1a unidade.
 * Extraídos do piloto (arquivo fonte de estudo do período), com as
 * citações de artigo marcadas para o balão (ver docs/arquitetura.md,
 * seção 12.1).
 */
export const resumo: readonly BlocoResumo[] = [
    {
      id: 'bloco-0', numero: 1,
      titulo: 'O que é o Direito? Uma pergunta persistente',
      fonte: 'HART, H.L.A. O Conceito de Direito, Cap. I ("Questões Persistentes").',
      corpoHtml: `
        <p>Poucas perguntas intrigam tanto quem começa a estudar Direito quanto esta: afinal, o que é o Direito? H.L.A. Hart abre "O Conceito de Direito" observando que essa pergunta tem algo de estranho. Ninguém precisa escrever um livro inteiro para responder "o que é química" ou "o que é medicina": há um consenso razoável sobre o objeto dessas ciências. Já com o Direito, a pergunta persiste ao longo de séculos de teoria jurídica, sem que os próprios juristas cheguem a um acordo definitivo sobre a definição correta.</p>
        <p>Hart explica essa perplexidade a partir da existência de casos-padrão e casos de fronteira. Casos-padrão são aquelas situações em que ninguém duvida de que existe Direito: um contrato assinado, uma sentença de um juiz, uma lei aprovada pelo Congresso. Já em situações de fronteira, a certeza desaparece. O direito internacional é um exemplo: existem tratados, cortes e princípios reconhecidos, mas falta um poder central capaz de impor sanções do mesmo jeito que um Estado nacional. Da mesma forma, o chamado direito primitivo (sociedades sem um órgão legislativo centralizado, mas com regras de conduta reconhecidas e sancionadas pelo próprio grupo) desafia definições que exigem sempre um legislador formal.</p>
        <p>Diante desses casos de fronteira, a pergunta "isso é Direito?" deixa de ter uma resposta óbvia, e é justamente esse desconforto que abre, segundo Hart, o estudo sério da teoria do Direito: em vez de aceitar uma definição pronta, o estudante é convidado a entender por que ela é tão difícil de fechar.</p>
      `,
      resumo: [
        'Hart, "O Conceito de Direito", Cap. I.',
        'A definição de Direito é uma pergunta persistente, sem consenso entre os juristas.',
        'Casos-padrão: situações em que ninguém duvida de que há Direito.',
        'Casos de fronteira: direito internacional (falta um poder central de sanção) e direito primitivo (falta um legislador formal).'
      ],
      exemploHtml: `No dia a dia forense, essa mesma dúvida aparece quando um advogado avalia se um conjunto de regras internas de uma plataforma digital (os termos de uso de uma rede social, por exemplo, ou o regulamento de uma organização internacional) pode ser tratado como Direito para fins de exigir seu cumprimento judicialmente, ou se é apenas uma norma social sem essa natureza. Reconhecer que existem "casos de fronteira" ajuda o operador a não descartar de forma precipitada situações atípicas, nem tratá-las de forma idêntica aos casos-padrão dos manuais.`
    },
    {
      id: 'bloco-1', numero: 2,
      titulo: 'Linha do tempo histórica',
      fonte: 'Slide "Aula 01: O que é Direito?".',
      corpoHtml: `
        <p>Antes de entrar nas grandes correntes teóricas, vale situar no tempo os marcos históricos que formam o pano de fundo de toda a disciplina: da Babilônia antiga ao nascimento do Jusnaturalismo Contratualista moderno, que será aprofundado mais adiante.</p>
        <div class="linha-tempo-wrap">
          <svg viewBox="0 0 2000 300" width="2000" height="300" role="img" aria-label="Linha do tempo histórica do Direito, da Babilônia ao Jusnaturalismo Contratualista">
            <line x1="60" y1="150" x2="1940" y2="150" stroke="var(--cor-borda)" stroke-width="3"></line>
            <g>
              <circle cx="100" cy="150" r="11" fill="var(--cor-primaria)"></circle>
              <line x1="100" y1="150" x2="100" y2="95" stroke="var(--cor-borda)"></line>
              <text x="100" y="80" text-anchor="middle" font-family="Lora, serif" font-weight="700" font-size="15" fill="var(--cor-texto)">Código de Hamurabi</text>
              <text x="100" y="100" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="var(--cor-texto-suave)">Babilônia, aprox. 1772 a.C.</text>
            </g>
            <g>
              <circle cx="300" cy="150" r="11" fill="var(--cor-primaria)"></circle>
              <line x1="300" y1="150" x2="300" y2="205" stroke="var(--cor-borda)"></line>
              <text x="300" y="225" text-anchor="middle" font-family="Lora, serif" font-weight="700" font-size="15" fill="var(--cor-texto)">Realeza romana</text>
              <text x="300" y="245" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="var(--cor-texto-suave)">754 a 510 a.C.</text>
            </g>
            <g>
              <circle cx="500" cy="150" r="11" fill="var(--cor-primaria)"></circle>
              <line x1="500" y1="150" x2="500" y2="95" stroke="var(--cor-borda)"></line>
              <text x="500" y="80" text-anchor="middle" font-family="Lora, serif" font-weight="700" font-size="15" fill="var(--cor-texto)">República romana</text>
              <text x="500" y="100" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="var(--cor-texto-suave)">510 a 27 a.C.</text>
            </g>
            <g>
              <circle cx="700" cy="150" r="11" fill="var(--cor-primaria)"></circle>
              <line x1="700" y1="150" x2="700" y2="205" stroke="var(--cor-borda)"></line>
              <text x="700" y="225" text-anchor="middle" font-family="Lora, serif" font-weight="700" font-size="15" fill="var(--cor-texto)">Império romano</text>
              <text x="700" y="245" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="var(--cor-texto-suave)">27 a.C. a 565 d.C.</text>
            </g>
            <g>
              <circle cx="900" cy="150" r="11" fill="var(--cor-destaque)"></circle>
              <line x1="900" y1="150" x2="900" y2="95" stroke="var(--cor-borda)"></line>
              <text x="900" y="80" text-anchor="middle" font-family="Lora, serif" font-weight="700" font-size="15" fill="var(--cor-texto)">Lei das XII Tábuas</text>
              <text x="900" y="100" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="var(--cor-texto-suave)">450 a.C.</text>
            </g>
            <g>
              <circle cx="1100" cy="150" r="11" fill="var(--cor-destaque)"></circle>
              <line x1="1100" y1="150" x2="1100" y2="205" stroke="var(--cor-borda)"></line>
              <text x="1100" y="225" text-anchor="middle" font-family="Lora, serif" font-weight="700" font-size="15" fill="var(--cor-texto)">Corpus Juris Civilis</text>
              <text x="1100" y="245" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="var(--cor-texto-suave)">Justiniano, 527 d.C.</text>
            </g>
            <g>
              <circle cx="1300" cy="150" r="11" fill="var(--cor-primaria)"></circle>
              <line x1="1300" y1="150" x2="1300" y2="95" stroke="var(--cor-borda)"></line>
              <text x="1300" y="70" text-anchor="middle" font-family="Lora, serif" font-weight="700" font-size="15" fill="var(--cor-texto)">Europa Medieval</text>
              <text x="1300" y="88" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="var(--cor-texto-suave)">Direito Canônico</text>
              <text x="1300" y="104" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="var(--cor-texto-suave)">476 a 1453 d.C.</text>
            </g>
            <g>
              <circle cx="1500" cy="150" r="11" fill="var(--cor-bordo)"></circle>
              <line x1="1500" y1="150" x2="1500" y2="205" stroke="var(--cor-borda)"></line>
              <text x="1500" y="225" text-anchor="middle" font-family="Lora, serif" font-weight="700" font-size="15" fill="var(--cor-texto)">Jusnaturalismo teológico</text>
              <text x="1500" y="245" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="var(--cor-texto-suave)">São Tomás de Aquino</text>
            </g>
            <g>
              <circle cx="1700" cy="150" r="11" fill="var(--cor-primaria)"></circle>
              <line x1="1700" y1="150" x2="1700" y2="95" stroke="var(--cor-borda)"></line>
              <text x="1700" y="80" text-anchor="middle" font-family="Lora, serif" font-weight="700" font-size="15" fill="var(--cor-texto)">Ascensão da burguesia</text>
            </g>
            <g>
              <circle cx="1900" cy="150" r="11" fill="var(--cor-bordo)"></circle>
              <line x1="1900" y1="150" x2="1900" y2="205" stroke="var(--cor-borda)"></line>
              <text x="1900" y="225" text-anchor="middle" font-family="Lora, serif" font-weight="700" font-size="15" fill="var(--cor-texto)">Jusnaturalismo Contratualista</text>
              <text x="1900" y="245" text-anchor="middle" font-family="Inter, sans-serif" font-size="12" fill="var(--cor-texto-suave)">Hobbes, Locke, Rousseau</text>
            </g>
          </svg>
        </div>
        <p>O Código de Hamurabi, na Babilônia, é um dos registros normativos mais antigos estudados. Em Roma, sucedem-se a Realeza, a República e o Império, período em que surge a Lei das XII Tábuas (buscando dar segurança jurídica e publicidade às normas, limitando o poder de interpretação arbitrária dos patrícios) e, já ao final do Império, a grande compilação de Justiniano, o Corpus Juris Civilis (527 d.C.), que viria a influenciar diretamente a tradição jurídica romanística. Na Europa Medieval, o Direito Canônico da Igreja ocupa papel central. O Jusnaturalismo teológico, associado a São Tomás de Aquino, funda o Direito humano numa lei eterna de origem divina, captada pela razão. Com a Ascensão da Burguesia, esse fundamento divino cede espaço, progressivamente, a uma nova leitura contratualista, protagonizada por Hobbes, Locke e Rousseau, que será aprofundada no bloco sobre Contratualismo e Soberania.</p>
      `,
      resumo: [
        'Código de Hamurabi (Babilônia, aprox. 1772 a.C.).',
        'Períodos romanos: Realeza, República e Império.',
        'Lei das XII Tábuas (450 a.C.): segurança jurídica e publicidade das normas.',
        'Corpus Juris Civilis, de Justiniano (527 d.C.): consolida o Direito Romano.',
        'Direito Canônico na Europa Medieval; Jusnaturalismo teológico (Tomás de Aquino); Ascensão da burguesia; Jusnaturalismo Contratualista (Hobbes, Locke, Rousseau).'
      ],
      exemploHtml: `Um advogado que precisa explicar a um cliente por que o Direito brasileiro é organizado principalmente em códigos escritos, e não em precedentes judiciais, recorre a essa linha do tempo: a tradição brasileira herda do Direito Romano e da compilação de Justiniano essa vocação por normas gerais e abstratas reunidas em códigos, diferente da tradição de common law, que valoriza mais o precedente.`
    },
    {
      id: 'bloco-2', numero: 3,
      titulo: 'Sociedade e Direito',
      fonte: 'Slide "Aula 02: Introdução ao Direito".',
      corpoHtml: `
        <p>Ihering resume, numa frase célebre, a ideia de que direitos costumam ser conquistas históricas: "a paz é o fim do Direito, a luta é o meio". Ou seja, direitos raramente são simplesmente concedidos; eles nascem, na maior parte das vezes, de disputas de interesse. O objetivo dessa luta, porém, não é o conflito permanente, mas justamente alcançar uma ordem pacífica e estável, em que os interesses reconhecidos como direitos possam ser exercidos sem necessidade de disputa constante.</p>
        <p>Kelsen, na Teoria Pura do Direito, faz uma crítica importante: para ele, a ciência jurídica de sua época confundia-se demais com a psicologia, a sociologia, a ética e a política, perdendo a pureza de seu objeto próprio, a norma. Seu projeto era isolar a norma jurídica como objeto específico de uma ciência jurídica "pura", livre dessas misturas.</p>
        <h3>Ubi societas ibi jus</h3>
        <p>O princípio "onde há sociedade, há Direito" (ubi societas ibi jus) é ilustrado por São Tomás de Aquino a partir de três situações de isolamento social, que confirmam, em vez de contradizer, a regra: mala fortuna (má sorte, que isola alguém por circunstâncias alheias à sua vontade), corruptio naturae (natureza corrompida, que isola quem tem um vício ou defeito antissocial) e excellentia naturae (natureza excelente, que isola quem é superior aos demais, como um sábio ou um santo eremita). Em todos os casos, a exceção confirma que o convívio social é a regra, e é nele que o Direito nasce.</p>
        <h3>Linguagem jurídica</h3>
        <p>Toda conduta possível pode ser organizada em quatro categorias básicas: obrigatório fazer, proibido fazer, permitido fazer e permitido não fazer. Essas categorias formam a estrutura elementar de qualquer sistema de regras de conduta, jurídico ou não.</p>
        <p>Também se distingue o papel do legislador (que cria a lei geral e abstrata, falando para todos, sem se referir a uma pessoa específica) do papel do juiz (que aplica essa norma geral a um caso concreto, individualizando o comando abstrato da lei). O <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319 do CPC</button>, que lista os requisitos da petição inicial, é mencionado aqui de passagem: ele volta a ser estudado com detalhe na petição comentada, adiante.</p>
        <h3>Tipos de conflito social</h3>
        <p>A disciplina identifica diferentes tipos de conflito social que o Direito é chamado a regular: familiar, de vizinhança, trabalhista, de consumo, contratual, ambiental e entre cidadão e Estado.</p>
      `,
      resumo: [
        'Ihering: "a paz é o fim do Direito, a luta é o meio".',
        'Kelsen critica a confusão da ciência jurídica com psicologia, sociologia, ética e política.',
        'Ubi societas ibi jus (São Tomás de Aquino): mala fortuna, corruptio naturae, excellentia naturae.',
        'Linguagem jurídica: obrigatório, proibido, permitido fazer, permitido não fazer.',
        'Legislador cria a norma geral; juiz aplica ao caso concreto.',
        'Tipos de conflito social: familiar, vizinhança, trabalhista, consumo, contratual, ambiental, cidadão-Estado.'
      ],
      exemploHtml: `Um juiz que julga um conflito de vizinhança (som alto de madrugada, por exemplo) está justamente aplicando ao caso concreto a norma geral e abstrata que o legislador criou (o regulamento de condomínio ou a lei de silêncio urbano), exemplificando a distinção entre o papel do legislador e o papel do juiz, e mostrando um dos tipos de conflito social que a disciplina identifica.`
    },
    {
      id: 'bloco-3', numero: 4,
      titulo: 'Fontes do Direito e os dois grandes sistemas jurídicos',
      fonte: 'NADER, Paulo. Introdução ao Estudo do Direito, Cap. 14. REALE, Miguel. Lições Preliminares de Direito.',
      corpoHtml: `
        <p>Paulo Nader classifica as fontes do Direito em três espécies: fontes históricas (os documentos e registros do passado que revelam a origem de um instituto jurídico), fontes materiais (os fatores sociais, econômicos e culturais que geram a necessidade de uma norma) e fontes formais (os modos pelos quais o Direito se manifesta e se torna conhecido, podendo ser diretas ou indiretas).</p>
        <p>Miguel Reale acrescenta uma ideia central: "toda fonte pressupõe uma estrutura de poder". Ele associa quatro fontes a quatro formas de poder social: a legislação expressa o poder do órgão legislativo do Estado; a jurisdição expressa o poder dos tribunais ao decidir casos e formar precedentes; o costume expressa um poder social difuso, sem órgão centralizado; e o negócio jurídico (um contrato, por exemplo) expressa o poder da autonomia privada dos próprios particulares.</p>
        <h3>Direito Romano</h3>
        <p>O Direito Romano é tradicionalmente dividido em fases pré-clássica, clássica e pós-clássica. Nele, distinguia-se o Jus Civile (direito próprio dos cidadãos romanos, aplicado pelo pretor urbano) do Jus Gentium (direito aplicável a relações que envolviam estrangeiros, aplicado pelo pretor peregrino). A grande compilação de Justiniano, o Corpus Juris Civilis, reúne quatro partes: o Código (constituições imperiais), o Digesto (opiniões dos jurisconsultos), as Institutas (manual introdutório de ensino) e as Novelas (leis posteriores).</p>
        <h3>Direito Romanístico (civil law) x Common Law</h3>
        <p>Países de tradição romanística (civil law), como o Brasil, organizam o Direito principalmente em códigos e leis escritas: a lei ocupa o papel central de fonte do Direito, e o juiz decide aplicando e interpretando essa lei ao caso concreto.</p>
        <p>Já os países de common law, como Inglaterra e Estados Unidos, atribuem papel central ao precedente judicial e ao costume: o Direito se constrói principalmente decisão por decisão, e uma sentença anterior sobre um caso semelhante vincula os julgamentos seguintes.</p>
        <p>Reale observa uma aproximação recente entre os dois sistemas, mas não uma fusão: no Brasil, mecanismos como a súmula vinculante deram às decisões dos tribunais superiores uma força obrigatória parecida com a do precedente do common law; nos países de common law, por sua vez, cresceu o uso de leis escritas (estatutos) ao lado dos precedentes. Ainda assim, cada sistema mantém sua fonte principal: a lei no civil law, o precedente no common law.</p>
      `,
      resumo: [
        'Fontes históricas, materiais e formais (Nader).',
        'Reale: "toda fonte pressupõe uma estrutura de poder": legislação, jurisdição, costume, negócio jurídico.',
        'Direito Romano: fases pré-clássica/clássica/pós-clássica; Jus Civile x Jus Gentium; pretor urbano x peregrino.',
        'Corpus Juris Civilis: Código, Digesto, Institutas, Novelas.',
        'Civil law (lei escrita, tradição romanística) x Common Law (precedente e costume), com convergência recente.'
      ],
      exemploHtml: `Um advogado que explica a um cliente por que, no Brasil, um contrato escrito e a lei aplicável pesam mais na argumentação do que "como as coisas costumam ser feitas" está descrevendo, na prática, a lógica do civil law; se o mesmo caso corresse numa jurisdição de common law, decisões judiciais anteriores sobre casos semelhantes teriam peso ainda maior.`
    },
    {
      id: 'bloco-4', numero: 5,
      titulo: 'Zetética x Dogmática',
      fonte: 'FERRAZ JÚNIOR, Tércio Sampaio. Introdução ao Estudo do Direito, itens 1.3 a 1.5. Slide "Aula 05".',
      corpoHtml: `
        <p>Este é o bloco mais denso da disciplina, e por isso merece mais espaço aqui. Ferraz Jr. explica que zetética deriva do grego zetein (perquirir, buscar, questionar), enquanto dogmática deriva de dokein (ensinar, doutrinar). Essa raiz etimológica já antecipa a diferença de enfoque entre os dois: um voltado a manter a pergunta aberta, outro voltado a fixar respostas para orientar a ação.</p>
        <h3>A anedota de Sócrates e o soldado</h3>
        <p>Sócrates está sentado à porta de casa quando passa correndo um homem perseguido por soldados. Um deles grita: "agarre esse sujeito, ele é um ladrão!". Sócrates responde: "o que você entende por ladrão?". O soldado parte de uma premissa que considera resolvida (o significado de "ladrão") e está preocupado com um problema de ação: capturar o suspeito. Sócrates, ao problematizar essa premissa antes de aceitar qualquer curso de ação, revela uma postura especulativa e questionadora. O soldado representa o enfoque dogmático; Sócrates, o enfoque zetético.</p>
        <h3>Questões zetéticas x questões dogmáticas</h3>
        <p>Questões zetéticas têm função especulativa explícita e são infinitas: o problema é configurado como um "ser" ("o que é algo?"), e a investigação permanece aberta, podendo ser retomada indefinidamente. Questões dogmáticas têm função diretiva explícita e são finitas: o problema é configurado como um "dever ser" ("como deve ser decidido algo?"), voltado a possibilitar uma decisão prática e orientar a ação.</p>
        <p>Ferraz Jr., a partir de Luhmann, chama de "princípio da inegabilidade dos pontos de partida" o fato de que, na dogmática, certas premissas (como o princípio da legalidade) são tratadas como vinculantes e não podem ser negadas no curso da argumentação, mesmo sendo, em si, resultado de uma decisão política, e não de uma evidência. Por isso se diz que a zetética "parte de evidências" (sempre sujeitas a revisão), enquanto a dogmática "parte de dogmas" (subtraídos à dúvida por decisão ou por poder).</p>
        <p>O autor também descreve a "dupla abstração" do saber dogmático: as normas jurídicas já são, em si, um produto abstrato da vida social; as regras de interpretação dessas normas constituem um segundo nível de abstração, incidindo sobre o primeiro. O jurista dogmático opera nesse segundo nível, o que traz o risco de distanciamento progressivo da realidade social que a norma pretende regular.</p>
        <h3>O quadro classificatório da zetética jurídica</h3>
        <table>
          <thead><tr><th>Tipo</th><th>Pura</th><th>Aplicada</th></tr></thead>
          <tbody>
            <tr><td><strong>Zetética empírica</strong></td><td>Sociologia jurídica, antropologia jurídica, etnologia jurídica, história do direito, psicologia jurídica, politologia jurídica, economia política</td><td>Psicologia forense, criminologia, penalogia, medicina legal, política legislativa</td></tr>
            <tr><td><strong>Zetética analítica</strong></td><td>Filosofia do direito, lógica formal das normas</td><td>Metodologia jurídica, teoria geral do direito, lógica do raciocínio jurídico</td></tr>
          </tbody>
        </table>
        <p>Já as disciplinas dogmáticas são as ciências do Direito propriamente ditas: civil, penal, constitucional, processual, tributário, administrativo, internacional, econômico, do trabalho, entre outras.</p>
        <h3>Dois exemplos clássicos do livro</h3>
        <p><strong>Alimentos entre ex-cônjuges:</strong> a zetética pode perguntar se é justo que um ex-cônjuge pague alimentos ao outro; a dogmática, ao contrário, aplica a norma vigente que prevê esse dever, sem reabrir essa discussão a cada caso.</p>
        <p><strong>Greve de funcionário público:</strong> para o sociólogo do direito (enfoque zetético), a legislação sobre a greve é apenas um dado entre outros, que pode até ser desprezado como ponto de partida para explicar o fenômeno social do movimento grevista. Já o jurista dogmático, por mais que se esmere em interpretações, não pode ignorar o ordenamento vigente: suas soluções para o caso concreto têm de ser propostas dentro dos limites da ordem jurídica estabelecida.</p>
        <h3>Os dois enfoques não são 100% excludentes na prática</h3>
        <p>Embora a distinção seja teoricamente nítida, no dia a dia do operador do direito os dois enfoques frequentemente se entrelaçam. Três situações concretas mostram isso:</p>
        <p><strong>(a) Quando as duas são necessárias:</strong> um advogado que vai discutir a inconstitucionalidade de uma lei sobre união estável precisa dominar a dogmática (o texto constitucional vigente, os precedentes do STF, a legislação de família) e, ao mesmo tempo, mobilizar a zetética (o debate sociológico e filosófico sobre o que é "família" hoje, a evolução dos costumes) para construir uma tese jurídica consistente e persuasiva. Nenhuma das duas, isoladamente, bastaria.</p>
        <p><strong>(b) Quando só a dogmática basta:</strong> calcular o prazo de uma contestação ou verificar se uma petição inicial preenche os requisitos formais do <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319 do CPC</button> são tarefas de aplicação mecânica de norma vigente, sem qualquer necessidade de reabrir uma discussão especulativa sobre a justiça ou a origem histórica dessas regras.</p>
        <p><strong>(c) Quando só a zetética basta:</strong> um pesquisador ou professor de Direito que investiga por que juízes de um mesmo tribunal decidem de forma diferente casos semelhantes, sem nenhum compromisso com uma solução prática imediata para algum processo, está atuando de forma inteiramente especulativa e explicativa, sem a preocupação diretiva de decidir um caso concreto.</p>
        <p>O próprio Ferraz Jr. reconhece que "embora entre ambas não haja uma linha divisória radical (toda investigação acentua mais um enfoque que o outro, mas sempre tem os dois)". Sua opção pessoal, no livro, é privilegiar o enfoque dogmático como tônica introdutória, sem desprezar a perspectiva zetética.</p>
      `,
      resumo: [
        'Zetética (zetein: perquirir) x dogmática (dokein: ensinar, doutrinar).',
        'Anedota de Sócrates e o soldado: soldado = dogmático; Sócrates = zetético.',
        'Zetética: questões infinitas, função especulativa, "o que é X?". Dogmática: questões finitas, função diretiva, "como decidir X?".',
        'Princípio da inegabilidade dos pontos de partida (Luhmann): a dogmática parte de dogmas, não de evidências.',
        'Dupla abstração: normas (1º nível abstrato) e regras de interpretação das normas (2º nível abstrato).',
        'Quadro: zetética empírica/analítica, pura/aplicada; disciplinas dogmáticas (civil, penal, constitucional etc.).',
        'Os dois enfoques não são excludentes: às vezes exigem os dois, às vezes só a dogmática, às vezes só a zetética.'
      ],
      exemploHtml: `O exemplo (a) acima já ilustra essa aplicação prática: um advogado discutindo a inconstitucionalidade de uma lei precisa, ao mesmo tempo, dominar a técnica dogmática (o que a lei e a Constituição dizem) e mobilizar argumentos zetéticos (o debate social e filosófico por trás do tema), o que mostra que, na prática profissional, os dois enfoques raramente aparecem em estado puro.`
    },
    {
      id: 'bloco-5', numero: 6,
      titulo: 'Direito e Moral / Regras de Trato Social',
      fonte: 'NADER, Paulo. Introdução ao Estudo do Direito, Cap. 17-18.',
      corpoHtml: `
        <p>Um dos critérios clássicos de distinção entre Direito e Moral vem de Tomásio: a Moral regularia o foro interno (a consciência, a intenção do agente), enquanto o Direito regularia o foro externo (a conduta manifestada e observável socialmente). Kant e Fichte aprofundam essa ideia contrapondo o imperativo categórico moral (autolegislação da própria razão) ao imperativo jurídico (heterônomo, imposto de fora).</p>
        <h3>Critérios formais de Groppali</h3>
        <p>Groppali propõe uma distinção baseada na forma das normas: a bilateralidade atributiva do Direito (a norma jurídica atribui a uma parte uma faculdade correspondente a um dever exigível de outra) contra a unilateralidade da Moral (o dever moral não gera, para outra pessoa, o direito de exigir seu cumprimento); a exterioridade contra a interioridade; a heteronomia do Direito (a norma vem de uma autoridade externa) contra a autonomia da Moral (o próprio sujeito se autoimpõe a norma); e a coercibilidade do Direito (pode ser imposta pela força do Estado) contra a incoercibilidade da Moral.</p>
        <h3>Teorias dos círculos</h3>
        <p>Bentham representa Direito e Moral como círculos concêntricos, em que a Moral (maior) engloba totalmente o Direito (menor). Du Pasquier os representa como círculos secantes, que se cruzam apenas parcialmente. Kelsen, coerente com sua Teoria Pura, defende que os dois são círculos independentes, sem relação lógica necessária entre eles. Jellinek propõe que o Direito é o "mínimo ético" exigido coercitivamente pela sociedade, ideia contraposta ao "máximo ético" de Schmoller.</p>
        <h3>Regras de Trato Social</h3>
        <p>As Regras de Trato Social (usos, convenções de etiqueta, costumes de cortesia) têm natureza social e exterioridade, mas são unilaterais e heterônomas (impostas pelo grupo, sem gerar um direito exigível), e incoercíveis (não há aparato estatal para impor seu cumprimento). Sua sanção é difusa (reprovação social, e não uma pena jurídica), e variam conforme a classe social ou a cultura de cada grupo (isonomia por classe/cultura).</p>
        <h3>Quadro comparativo final</h3>
        <table>
          <thead><tr><th>Critério</th><th>Direito</th><th>Moral</th><th>Regras de Trato Social</th><th>Preceitos Religiosos</th></tr></thead>
          <tbody>
            <tr><td>Bilateralidade / unilateralidade</td><td>Bilateral atributivo</td><td>Unilateral</td><td>Unilateral</td><td>Unilateral</td></tr>
            <tr><td>Heteronomia / autonomia</td><td>Heterônomo</td><td>Autônoma</td><td>Heterônomas</td><td>Heterônomos (perante a fé)</td></tr>
            <tr><td>Exterioridade / interioridade</td><td>Exterior</td><td>Interior</td><td>Exterior</td><td>Interior e exterior</td></tr>
            <tr><td>Coercibilidade</td><td>Coercível (Estado)</td><td>Incoercível</td><td>Incoercíveis</td><td>Incoercíveis pelo Estado</td></tr>
            <tr><td>Tipo de sanção</td><td>Prefixada em lei</td><td>Íntima (remorso)</td><td>Difusa (reprovação social)</td><td>Da própria fé</td></tr>
          </tbody>
        </table>
      `,
      resumo: [
        'Tomásio: Direito = foro externo; Moral = foro interno.',
        'Groppali: bilateralidade atributiva (Direito) x unilateralidade (Moral); heteronomia x autonomia; coercibilidade x incoercibilidade.',
        'Teoria dos círculos: Bentham (concêntricos), Du Pasquier (secantes), Kelsen (independentes), Jellinek (mínimo ético) x Schmoller (máximo ético).',
        'Regras de Trato Social: sociais, exteriores, unilaterais, heterônomas, incoercíveis, sanção difusa, variam por classe/cultura.',
        'Quadro final: Direito, Moral, Regras de Trato Social e Preceitos Religiosos comparados pelos mesmos critérios.'
      ],
      exemploHtml: `Um mediador de conflitos de vizinhança explica a um morador que deixar de cumprimentar o síndico é apenas falta de trato social (sanção difusa: fofoca, reprovação informal), mas deixar de pagar a taxa condominial é descumprimento de um dever jurídico (sanção prefixada: multa, cobrança judicial). Essa diferença de natureza é justamente o que explica por que só o segundo caso justifica uma ação judicial.`
    },
    {
      id: 'bloco-6', numero: 7,
      titulo: 'Jusnaturalismo x Juspositivismo',
      fonte: 'BOBBIO, Norberto. O Positivismo Jurídico, Parte I. Slide "aula: direito positivo".',
      corpoHtml: `
        <p>A distinção entre direito natural e direito positivo remonta a Aristóteles, que separava o physikón díkaion (o justo por natureza, universal, válido em toda parte) do nomikón díkaion (o justo por convenção ou lei, variável conforme o povo). No Direito Romano, essa ideia aparece na tríade jus naturale (comum a todos os seres vivos), jus gentium (comum a todos os povos) e jus civile (próprio de cada cidade ou povo).</p>
        <p>São Tomás de Aquino organiza os tipos de lei numa estrutura hierárquica: a lex aeterna é a razão divina que governa o universo; a lex naturalis é a participação da criatura racional nessa lei eterna, captada pela razão humana; a lex humana são as leis positivas elaboradas pelos homens, que devem derivar racionalmente da lei natural (por conclusão direta ou por determinação de detalhes práticos); e a lex divina é o conteúdo revelado diretamente por Deus, como nas Escrituras.</p>
        <p>Grócio, um dos autores centrais do jusnaturalismo moderno, distingue um direito natural imutável, fundado na própria razão humana (jus naturale), de um direito voluntário, que depende de um ato de vontade, seja divina, seja humana (jus voluntarium).</p>
        <h3>Os 6 critérios de distinção de Bobbio</h3>
        <ul>
          <li>Universalidade (direito natural) x particularidade (direito positivo).</li>
          <li>Imutabilidade x mutabilidade no tempo.</li>
          <li>Conhecido pela natureza das coisas (natura) x imposto pela vontade do poder constituído (potestas populus).</li>
          <li>Fundado na razão (ratio) x fundado na vontade (voluntas).</li>
          <li>Refere-se a atos internos, bons em si mesmos, x atos externos regulados pela conveniência social.</li>
          <li>Distinção entre o bom em si (direito natural) x o simplesmente útil (direito positivo).</li>
        </ul>
        <h3>Da teoria ao projeto político</h3>
        <p>A Revolução Francesa (1789) é o momento em que a teoria jusnaturalista contratualista deixa de ser apenas uma construção filosófica e se converte em projeto político concreto. A Declaração dos Direitos do Homem e do Cidadão, em seus arts. 1º e 2º, afirma que os homens nascem e permanecem livres e iguais em direitos, e que a finalidade de toda associação política é a conservação dos direitos naturais e imprescritíveis do homem (liberdade, propriedade, segurança, resistência à opressão). Pouco depois, o Código Civil de Napoleão (1804) representa a consolidação prática do positivismo: o direito privado passa a ser sistematizado numa lei escrita, com forte influência da tradição romanística herdada do Corpus Juris Civilis.</p>
        <table>
          <thead><tr><th>Critério</th><th>Jusnaturalismo</th><th>Juspositivismo</th></tr></thead>
          <tbody>
            <tr><td>Base</td><td>Moral/filosófica (razão, natureza)</td><td>Científica/normativa (lei posta)</td></tr>
            <tr><td>Origem dos direitos</td><td>Anteriores e superiores ao Estado</td><td>Definidos e criados pelo Estado</td></tr>
            <tr><td>Fundamento de validade</td><td>Justiça, razão</td><td>Forma (processo legislativo correto)</td></tr>
          </tbody>
        </table>
      `,
      resumo: [
        'Aristóteles: physikón díkaion (natural, universal) x nomikón díkaion (convencional, variável).',
        'Tomás de Aquino: lex aeterna, lex naturalis, lex humana, lex divina.',
        'Grócio: jus naturale (imutável, da razão) x jus voluntarium (da vontade).',
        '6 critérios de Bobbio: universal/particular, imutável/mutável, natura/potestas, ratio/voluntas, interno/externo, bom em si/útil.',
        'Revolução Francesa (1789) e Declaração dos Direitos do Homem e do Cidadão (arts. 1º e 2º).',
        'Código Civil de Napoleão (1804): consolidação do positivismo.'
      ],
      exemploHtml: `Um advogado de direitos humanos que invoca a "dignidade da pessoa humana" como limite mesmo diante de uma lei formalmente válida está recorrendo, na prática, a uma herança jusnaturalista; já um servidor de cartório que aplica estritamente o que a lei registral determina, sem discutir sua justiça, está adotando uma postura positivista.`
    },
    {
      id: 'bloco-7', numero: 8,
      titulo: 'Contratualismo e Soberania',
      fonte: 'PESSOA, Matheus Damacena. "A construção do conceito de soberania no contratualismo: Hobbes, Locke e Rousseau" (Revista Humanidades e Inovação).',
      corpoHtml: `
        <p>Este bloco aprofunda, com base num artigo acadêmico dedicado ao tema, o Jusnaturalismo Contratualista já apresentado na linha do tempo, comparando sistematicamente três autores quanto à ideia de soberania.</p>
        <h3>Hobbes</h3>
        <p>Para Hobbes, autor do Leviatã, o estado de natureza é marcado por uma guerra de todos contra todos. A única saída racional é os homens transferirem seus direitos a um soberano por meio de um pacto. Uma vez feita essa transferência, ela não pode ser desfeita: a soberania resultante é absoluta (sem limites internos que a controlem), indivisível (não pode ser repartida entre vários órgãos) e irrevogável (o povo não pode retomá-la unilateralmente).</p>
        <h3>Locke</h3>
        <p>Locke, considerado o pai do liberalismo político, defende que o poder legislativo é supremo, mas não absoluto: permanece limitado pelo próprio contrato social e pela lei natural, que reconhece direitos básicos à vida, à liberdade e à propriedade. A soberania popular é inalienável e indivisível na sua fonte (o povo), ainda que seu exercício seja delegado a representantes. Locke rompe com o absolutismo ao admitir que o povo resista a um governo que viole esse pacto.</p>
        <h3>Rousseau</h3>
        <p>Rousseau funda a soberania na vontade geral. Ela é inalienável e indivisível, mas não absoluta, já que está limitada pela própria busca do bem comum. Seu modelo é bipartido: de um lado, o soberano (o próprio povo, que legisla); de outro, o governo (que apenas administra e pode ser destituído).</p>
        <table>
          <thead><tr><th>Aspecto</th><th>Hobbes</th><th>Locke</th><th>Rousseau</th></tr></thead>
          <tbody>
            <tr><td>Estado de natureza</td><td>Guerra de todos contra todos</td><td>Relativamente pacífico, mas inseguro</td><td>Bondade original, corrompida pela sociedade</td></tr>
            <tr><td>Limite ao poder soberano</td><td>Nenhum (absoluto)</td><td>Contrato e lei natural</td><td>Vontade geral (bem comum)</td></tr>
            <tr><td>Resistência ao governo</td><td>Não admitida</td><td>Admitida</td><td>Admitida (destituição do governo)</td></tr>
          </tbody>
        </table>
        <p>Os três convergem em partir de um estado de natureza hipotético e de um pacto fundador, e em considerar a soberania popular ou soberana como indivisível. Divergem, sobretudo, quanto aos limites do poder soberano: absoluto em Hobbes, limitado em Locke e Rousseau.</p>
      `,
      resumo: [
        'Hobbes: soberania absoluta, indivisível, irrevogável; estado de natureza = guerra de todos contra todos.',
        'Locke: poder legislativo supremo, mas não absoluto; limitado pelo contrato e pela lei natural; admite resistência.',
        'Rousseau: soberania fundada na vontade geral, inalienável e indivisível, mas não absoluta; modelo bipartido (soberano/governo).',
        'Convergência: estado de natureza hipotético e pacto fundador. Divergência: limites do poder soberano.'
      ],
      exemploHtml: `Num debate sobre limites ao poder do Executivo durante uma emergência, um advogado constitucionalista que defende controle judicial sobre atos do governo está mais próximo da tradição de Locke e Rousseau (poder limitado e responsável perante o povo) do que da de Hobbes (soberania irrestrita em nome da ordem).`
    },
    {
      id: 'bloco-8', numero: 9, badge: 'Aprofundamento',
      titulo: 'Direito como Ciência: Método',
      fonte: 'PACHUKANIS, Evguiéni B. Teoria Geral do Direito e Marxismo, cap. "Métodos de construção do concreto nas ciências abstratas".',
      corpoHtml: `
        <p>Este bloco é sinalizado como aprofundamento: é um debate metodológico mais avançado do que o normalmente esperado no início do curso, mas está presente no material da disciplina e por isso entra no resumo.</p>
        <p>Pachukanis aplica à teoria geral do Direito o método que Marx descreve nos Grundrisse: em vez de partir de uma totalidade concreta vaga e indivisa (sociedade, Estado, população), a investigação científica deve partir de categorias mais simples e, só progressivamente, reconstruir o concreto como uma totalidade rica de determinações. No caso do Direito, isso significa não partir da sociedade ou do Estado como um dado pronto, mas da relação jurídica como forma mais simples, para depois reconstruir, com maior riqueza, o fenômeno jurídico completo.</p>
        <p>Daí decorre uma consequência importante: a relação jurídica é tratada como categoria histórica, e não como uma universalidade abstrata e eterna. Assim como o conceito de "valor", na economia política, só ganha sentido pleno numa sociedade mercantil desenvolvida (embora o trabalho, como relação simples, exista em todas as épocas), a forma jurídica plena (o sujeito de direito, a relação jurídica abstrata e formalmente igual para todos) corresponde a um estágio histórico específico: o da sociedade produtora de mercadorias.</p>
        <p>A partir daí, Pachukanis formula uma crítica ao jusnaturalismo: para ele, a doutrina do direito natural é a mais nítida expressão da ideologia burguesa, ao formular de modo abstrato e geral as condições de existência da própria sociedade burguesa como se fossem condições naturais e universais de qualquer sociedade humana.</p>
        <p>A forma jurídica, portanto, é lida como categoria histórica ligada à sociedade produtora de mercadorias: o homem se torna "sujeito de direito" pela mesma necessidade histórica que faz o produto do trabalho se tornar mercadoria dotada de valor. O Direito, nessa leitura, não é um dado eterno da razão, mas um sistema específico de relações sociais que corresponde a um estágio determinado do desenvolvimento histórico, tendo, segundo o autor, dois grandes momentos de apogeu: o Direito privado romano e a Europa dos séculos XVII e XVIII.</p>
      `,
      resumo: [
        'Método de Marx (Grundrisse): concreto aparente, abstração em categorias simples, reconstrução do concreto rico em determinações.',
        'Pachukanis aplica esse método à teoria geral do Direito: partir da relação jurídica, não da totalidade social pronta.',
        'A relação jurídica é uma categoria histórica, não uma universalidade abstrata e eterna.',
        'Crítica ao jusnaturalismo: ideologia burguesa que universaliza as condições de existência da própria sociedade burguesa.',
        'A forma jurídica está ligada à sociedade produtora de mercadorias (o "sujeito de direito" surge junto com a mercadoria).'
      ],
      exemploHtml: `Um pesquisador do Direito que investiga por que a ideia de "sujeito de direito" (toda pessoa como titular abstrato e formalmente igual perante a lei) se consolida justamente com a expansão do mercado e da troca de mercadorias, e não antes, está aplicando essa mesma leitura histórico-materialista: o Direito visto não como uma verdade atemporal, mas como uma forma social que nasce, se desenvolve e pode se transformar junto com as relações econômicas de cada época.`
    }
];
