import type { BlocoResumo } from '../../../tipos';

/**
 * Os blocos teóricos do resumo de Português e Redação Jurídica 1, 1a
 * unidade. Blocos 0 a 5: comunicação e argumentação jurídica, tiradas das
 * aulas da disciplina. Bloco 6: a estrutura de oito passos da petição
 * inicial, tirada do quadro de sala (foto de 14/09, "1.ENDEREÇAMENTO ...
 * 8.DATA/ADVOGADO/OAB/UF"). Bloco 7: o caso dos exploradores da caverna
 * (caso-exploradores-caverna.txt). Bloco 8: o método fato, fundamento e
 * pedido aplicado ao caso Ana e Carlos, tirado do quadro de sala (fotos de
 * 03/09, 10/09 e 14/09). Blocos 9 a 11: os três extras aprovados pelo
 * líder (checklist do art. 319, cartões das cinco perguntas, dicas de
 * forma da professora), cada um com um componente interativo
 * (BlocoResumo.componenteExtra). Citações de artigo marcadas para o balão
 * (ver docs/arquitetura.md, seção 12.1).
 */
export const resumo: readonly BlocoResumo[] = [
  {
    id: 'bloco-0',
    numero: 1,
    titulo: 'Comunicação jurídica: falar para ser compreendido',
    fonte: 'Slides da disciplina, aula sobre comunicação jurídica.',
    corpoHtml: `
      <p>A disciplina parte de uma constatação simples: se o juiz não entende a tese do advogado, o problema é do advogado, não do juiz. Uma petição mal escrita, cheia de rodeios ou de termos mal empregados, deixa um "juiz confuso"; uma petição bem escrita, adaptada a quem vai lê-la, deixa um "juiz convencido". O advogado não escreve apenas para ser lido: escreve para ser compreendido e, a partir daí, para convencer.</p>
      <p>Para isso, a aula distingue três níveis de linguagem. No extremo coloquial, está a fala do dia a dia, sem nenhuma técnica ("a empresa mandou o funcionário embora"). No outro extremo, está a linguagem complicada, cheia de rodeios e vocabulário raro só para impressionar ("a situação fática subjacente poderá ensejar responsabilização patrimonial..."), que também atrapalha a compreensão. O nível ideal fica no meio: a linguagem técnica, que usa os termos próprios da área com precisão, sem enfeite desnecessário ("a empresa rescindiu o contrato de trabalho"). O ponto central do ensinamento é que linguagem técnica não é sinônimo de linguagem complicada: uma busca clareza por meio da precisão, a outra busca impressionar às custas da clareza.</p>
    `,
    resumo: [
      'Se o juiz não entende a tese, o problema é do advogado: "juiz confuso" x "juiz convencido".',
      'Três níveis de linguagem: coloquial, técnica e complicada.',
      'O nível ideal é o técnico: termos próprios usados com precisão, sem cair no exagero da linguagem complicada.',
      'Linguagem técnica não é sinônimo de linguagem complicada.'
    ],
    exemploHtml: `Um advogado que revisa a própria petição antes de protocolar e encontra a frase "a situação fática subjacente poderá ensejar responsabilização patrimonial da parte ré" está diante de um caso de linguagem complicada, não técnica: reescrever para algo como "a ré responde patrimonialmente pelos danos causados" comunica exatamente a mesma tese, de forma mais clara para o juiz.`
  },
  {
    id: 'bloco-1',
    numero: 2,
    titulo: 'Os dois motores da persuasão: oratória e retórica',
    fonte: 'Slides da disciplina, aula sobre comunicação jurídica.',
    corpoHtml: `
      <p>A aula separa dois "motores da persuasão" que costumam ser confundidos. A oratória cuida do <strong>como</strong> o advogado fala: voz, dicção, ritmo, pausas, postura, contato visual. É a arte de falar bem, voltada ao corpo e à voz de quem comunica. Já a retórica cuida de como a <strong>ideia</strong> é organizada para convencer a mente de quem ouve ou lê: é a arte de construir o argumento.</p>
      <p>Uma afirmação fraca, como "meu cliente não fez nada de errado", ganha força quando reconstruída retoricamente: em vez de uma negação genérica, o advogado aponta os elementos exigidos pela norma e explica, um a um, por que eles não foram comprovados pela outra parte. A oratória e a retórica atuam juntas, mas resolvem problemas diferentes: uma petição bem escrita (retórica) pode ser lida em voz alta sem nenhuma habilidade de oratória e ainda assim convencer pela força do argumento escrito.</p>
    `,
    resumo: [
      'Oratória: a arte de falar bem (voz, dicção, ritmo, postura, contato visual).',
      'Retórica: a arte de construir o argumento, organizando a ideia para convencer.',
      'Uma afirmação fraca ganha força quando reconstruída retoricamente, apontando os elementos exigidos e por que não foram comprovados.'
    ],
    exemploHtml: `Numa sustentação oral, o mesmo argumento escrito na petição (retórica) pode ganhar ainda mais força se o advogado o apresenta com pausas bem colocadas e contato visual com os julgadores (oratória); mas mesmo sem essa entrega oral, o argumento bem construído no papel já cumpre seu papel de convencer quem o lê.`
  },
  {
    id: 'bloco-2',
    numero: 3,
    titulo: 'O gatilho da prova: "veja a prova", não "confie em mim"',
    fonte: 'Slides da disciplina, aula sobre comunicação jurídica.',
    corpoHtml: `
      <p>Entre os gatilhos mentais da comunicação jurídica, a aula aponta o gatilho da prova como o mais poderoso. Ele consiste em sair da mera afirmação genérica e ir para a demonstração material dos fatos. Em vez de escrever apenas "a empresa sempre pagou corretamente", o advogado persuasivo escreve "os comprovantes de pagamento juntados às fls. X demonstram o pagamento integral".</p>
      <p>A regra de ouro ensinada resume o gatilho numa frase: o advogado persuasivo não diz "confie em mim", ele diz "veja a prova". Uma alegação solta, sem apoio em documento, comprovante ou registro específico, fica flutuando e perde força de convencimento; ancorada numa prova concreta, a mesma alegação vira argumento.</p>
    `,
    resumo: [
      'Gatilho da prova: sair da afirmação genérica para a demonstração material dos fatos.',
      'Regra de ouro: "veja a prova", não "confie em mim".',
      'Alegação sem prova concreta fica flutuando; ancorada em documento/comprovante, vira argumento.'
    ],
    exemploHtml: `A frase "o réu não cumpriu suas obrigações" é uma afirmação solta; reescrita como "conforme os documentos juntados às fls. X, o réu deixou de cumprir a obrigação Y", a mesma alegação ganha o apoio material que o gatilho da prova exige.`
  },
  {
    id: 'bloco-3',
    numero: 4,
    titulo: 'A evolução de um argumento: do coloquial ao persuasivo',
    fonte: 'Slides da disciplina, aula sobre comunicação jurídica.',
    corpoHtml: `
      <p>A aula demonstra, com um mesmo argumento reescrito três vezes, a diferença entre os níveis de linguagem do bloco 1 aplicados à argumentação. No nível coloquial, o argumento é fraco por falta de técnica: "a empresa não fez nada que justificasse essa cobrança". No nível técnico, o argumento já está correto, mas ainda passivo, sem força de convencimento: "não estão presentes os pressupostos necessários à responsabilização da empresa".</p>
      <p>O nível persuasivo combina a precisão do nível técnico com uma explicação ativa de por que a tese deve prevalecer: "a responsabilização da empresa não pode decorrer de mera presunção: é indispensável a demonstração dos pressupostos jurídicos que a sustentam, e, neste caso, eles não foram comprovados". Essa é a "arma do advogado", a diferença entre apenas falar Direito e efetivamente comunicar o Direito.</p>
    `,
    resumo: [
      'Nível coloquial: fraco por falta de técnica ("a empresa não fez nada que justificasse essa cobrança").',
      'Nível técnico: correto, mas passivo ("não estão presentes os pressupostos necessários").',
      'Nível persuasivo: precisão técnica + explicação ativa do porquê a tese deve prevalecer.',
      'A diferença entre apenas falar Direito e efetivamente comunicar o Direito.'
    ],
    exemploHtml: `Ao revisar uma petição em construção, o estudante pode aplicar este teste de três passos a cada parágrafo de fundamentação: primeiro escrever a ideia de forma coloquial, depois reescrevê-la no nível técnico, e por fim acrescentar a explicação ativa que a torna persuasiva.`
  },
  {
    id: 'bloco-4',
    numero: 5,
    titulo: 'Da narrativa emocional ao fato jurídico: "fato não é desabafo"',
    fonte: 'Slides da disciplina, aula sobre a arquitetura da petição inicial.',
    corpoHtml: `
      <p>O cliente costuma contar o problema de forma emocional, não jurídica: "a empresa me humilhou, acabou com minha vida, foi completamente injusta". O princípio "fato não é desabafo" ensina que esse relato, por mais legítimo que seja o sentimento do cliente, não pode ser copiado literalmente na seção "Dos Fatos" de uma petição.</p>
      <p>Para transformar o desabafo em informação juridicamente relevante, o advogado usa um filtro de perguntas: o quê aconteceu, quando, onde, quem esteve envolvido, como e qual foi a consequência (o dano). É esse filtro que separa a narrativa emocional dos fatos verificáveis que sustentam a petição, mantendo a seção "Dos Fatos" objetiva e cronológica, sem floreios nem fundamentação legal (que fica reservada para "Do Direito").</p>
    `,
    resumo: [
      '"Fato não é desabafo": o relato emocional do cliente não vai direto para a petição.',
      'Filtro de seis perguntas: o quê, quando, onde, quem, como e qual foi a consequência.',
      'A seção "Dos Fatos" fica objetiva e cronológica, sem fundamentação legal (reservada para "Do Direito").'
    ],
    exemploHtml: `Diante do desabafo "a empresa me humilhou, acabou com minha vida", o advogado aplica o filtro e chega a algo como: "em 14/03/2026, durante reunião com a chefia, o cliente foi desligado sem justa causa perante os demais colegas, o que lhe causou constrangimento público" — um fato verificável, não mais um desabafo.`
  },
  {
    id: 'bloco-5',
    numero: 6,
    titulo: 'A equação da fundamentação: norma, fato e conexão',
    fonte: 'Slides da disciplina, aula sobre a arquitetura da petição inicial.',
    corpoHtml: `
      <p>A aula resume a lógica de toda fundamentação jurídica numa equação: [NORMA] + [FATO] + [CONEXÃO] = [ARGUMENTO JURÍDICO]. O erro comum apontado é achar que basta citar o dispositivo legal ("nos termos do art. X da lei Y") para já ter fundamentado o pedido. Fato sem direito é apenas narrativa; norma sem fato é apenas uma citação solta.</p>
      <p>A fundamentação exige o terceiro elemento, a conexão: explicar por que aquele dispositivo específico se aplica àquela situação concreta, e qual consequência jurídica isso gera. É exatamente essa estrutura de três partes que o método fato, fundamento e pedido, estudado a seguir com o caso Ana e Carlos, aplica tópico por tópico.</p>
    `,
    resumo: [
      'Equação da fundamentação: [NORMA] + [FATO] + [CONEXÃO] = [ARGUMENTO JURÍDICO].',
      'Só citar a lei não é fundamentação suficiente.',
      'A conexão explica por que o dispositivo se aplica ao caso concreto e qual a consequência jurídica.'
    ],
    exemploHtml: `Escrever apenas "nos termos do art. 186 do Código Civil" é citação solta; completar com "a ré, ao deixar de manter a tubulação em condições adequadas (fato), praticou omissão negligente, o que configura ato ilícito nos termos do art. 186 do Código Civil (norma), pois a negligência de manutenção é exatamente a conduta que o dispositivo pune (conexão)" já é um argumento jurídico completo.`
  },
  {
    id: 'bloco-6',
    numero: 7,
    titulo: 'A estrutura de oito passos da petição inicial',
    fonte: 'Quadro de sala, foto de 14/09/2026.',
    corpoHtml: `
      <p>A professora resumiu no quadro a sequência completa de uma petição inicial em oito passos, na ordem em que devem aparecer no documento: 1. Endereçamento; 2. Qualificação; 3. Fatos; 4. Direito, organizado em tópicos de fato, fundamento e pedido; 5. Dos Pedidos; 6. Valor da causa; 7. Termos em que pede deferimento; 8. Data, advogado e OAB/UF.</p>
      <p>Essa estrutura é a mesma que organiza tanto a petição comentada desta unidade quanto o caso prático de Ana e Carlos, estudado no bloco seguinte: cada um dos oito passos corresponde a uma seção da peça.</p>
    `,
    resumo: [
      '1. Endereçamento; 2. Qualificação; 3. Fatos; 4. Direito (tópicos: fato, fundamento, pedido).',
      '5. Dos Pedidos; 6. Valor da causa; 7. Termos em que pede deferimento; 8. Data/Advogado/OAB/UF.',
      'Mesma estrutura usada na petição comentada e no caso Ana e Carlos.'
    ],
    exemploHtml: `Ao montar o esqueleto de uma petição do zero, o estudante pode usar estes oito passos como um checklist de seções: se alguma delas está faltando, a petição está incompleta antes mesmo de entrar no mérito.`
  },
  {
    id: 'bloco-7',
    numero: 8,
    titulo: 'O caso dos exploradores da caverna',
    fonte: 'Narrativa para leitura em sala, caso-exploradores-caverna.txt.',
    corpoHtml: `
      <p>Uma sociedade de exploradores de cavernas organiza uma expedição. Cinco integrantes entram numa caverna e avançam para uma região distante da entrada quando ocorre um desmoronamento, bloqueando a passagem de saída. Uma equipe de resgate é organizada, mas os trabalhos são extremamente difíceis, e alguns resgatistas morrem nas tentativas. Os cinco homens seguem vivos, mas o alimento disponível é insuficiente para que todos sobrevivam até o resgate, cujo prazo é incerto.</p>
      <p>Em contato com o lado de fora, os exploradores perguntam se há alguma chance de sobreviver até o resgate; os especialistas calculam que as chances seriam muito pequenas sem alimento suficiente. Um dos exploradores, Roger Whetmore, propõe então que um deles seja morto e que os demais usem seu corpo como alimento, sugerindo um sorteio para decidir quem seria sacrificado. O grupo concorda inicialmente, mas Whetmore muda de ideia antes do sorteio e tenta desistir. Os demais, porém, entendem que o acordo já estava firmado e que a sobrevivência de todos dependia dele; não aceitam a desistência, realizam o sorteio, o resultado recai sobre o próprio Whetmore, e os outros quatro o matam e utilizam seu corpo como alimento, o que lhes permite resistir até serem finalmente resgatados.</p>
      <p>Ao saírem da caverna, os quatro sobreviventes são acusados de homicídio. A lei vigente puniria gravemente quem tirasse a vida de outra pessoa intencionalmente, sem prever nenhuma exceção para quem matasse para sobreviver. Esse impasse (baseado no caso hipotético formulado pelo jurista Lon Fuller) ilustra, para a redação jurídica, que o texto da lei, aplicado literalmente, pode não prever situações extremas: cabe ao operador do Direito uma argumentação que vá além da simples citação do dispositivo, construindo um raciocínio que enfrente a lacuna da lei diante do caso concreto.</p>
    `,
    resumo: [
      'Cinco exploradores presos por desmoronamento; alimento insuficiente até o resgate.',
      'Roger Whetmore propõe sacrificar um deles por sorteio; tenta desistir, mas o grupo não aceita.',
      'O sorteio recai sobre o próprio Whetmore, que é morto e serve de alimento aos demais.',
      'Os quatro sobreviventes são julgados por homicídio; a lei não previa exceção para quem mata para sobreviver.',
      'Lição para a redação jurídica: a letra da lei pode não prever situações extremas, exigindo argumentação que enfrente a lacuna, não só a citação do texto legal.'
    ],
    exemploHtml: `Ao fundamentar um caso em que os fatos não se encaixam perfeitamente na letra fria de um artigo, o redator aplica a mesma lição do caso dos exploradores: não basta citar o dispositivo, é preciso argumentar por que (ou por que não) aquela norma, pensada para outra situação, deve ou não se estender ao caso concreto.`
  },
  {
    id: 'bloco-8',
    numero: 9,
    titulo: 'O método fato, fundamento e pedido: o caso Ana e Carlos',
    fonte: 'Quadro de sala, fotos de 03/09, 10/09 e 14/09 de 2026.',
    corpoHtml: `
      <p>A professora demonstrou em sala, tópico por tópico, como aplicar o método fato/fundamento/pedido (bloco 6) a um caso prático de divórcio litigioso: Ana, 38 anos, e Carlos, 42 anos, casados sob o regime de comunhão parcial de bens, com dois filhos menores, Pedro (10 anos) e Lucas (7 anos), depois de 8 meses de crise no casamento. Durante a união, o casal adquiriu um apartamento avaliado em R$ 450.000,00 (com saldo devedor de R$ 180.000,00) e Carlos adquiriu um carro avaliado em R$ 70.000,00; o carro de Ana, avaliado em R$ 50.000,00, foi doado a ela antes do casamento, e por isso não entra na partilha. Carlos também tem uma dívida de R$ 30.000,00. A guarda dos filhos ficou definida como compartilhada, e a cliente do caso é Ana.</p>
      <h3>2.1 Do Divórcio</h3>
      <p><strong>Fato:</strong> Ana se encontra separada de fato de Carlos, casados no civil, 8 meses em crise no casamento. Por essa razão, Ana requer o divórcio.</p>
      <p><strong>Fundamento:</strong> Com base no <button type="button" class="citacao" data-dispositivo="cc-1571" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.571 do Código Civil</button>, que estabelece que a sociedade conjugal termina pelo divórcio.</p>
      <p><strong>Pedido:</strong> Assim, requer, com base no fato e fundamento descritos, o acolhimento do pedido de divórcio.</p>
      <h3>2.2 Da Partilha dos Bens</h3>
      <p><strong>Fato:</strong> Durante a união, e diante do regime de bens, Carlos e Ana adquiriram um apartamento de R$ 450.000,00 e um carro de R$ 70.000,00.</p>
      <p><strong>Fundamento:</strong> Em conformidade com os arts. <button type="button" class="citacao" data-dispositivo="cc-1658" aria-expanded="false" aria-controls="balao-dispositivo">1.658</button> e <button type="button" class="citacao" data-dispositivo="cc-1660-i" aria-expanded="false" aria-controls="balao-dispositivo">1.660, I</button>, do Código Civil, há a previsão da divisão dos bens.</p>
      <p><strong>Pedido:</strong> Assim, requer, com base no fato e fundamento descritos, o acolhimento da divisão de bens.</p>
      <h3>2.3 Da Guarda</h3>
      <p><strong>Fato:</strong> As partes possuem dois filhos menores.</p>
      <p><strong>Fundamento:</strong> Conforme o <button type="button" class="citacao" data-dispositivo="cc-1583" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.583 do Código Civil</button>, a guarda pode ser unilateral ou compartilhada.</p>
      <p><strong>Pedido:</strong> Requer a autora que a guarda de Pedro e Lucas seja compartilhada, com regulamentação de convivência paterna e materna.</p>
      <h3>2.4 Dos Alimentos</h3>
      <p><strong>Fato:</strong> Os filhos menores possuem direito à prestação alimentícia.</p>
      <p><strong>Fundamento:</strong> Conforme o <button type="button" class="citacao" data-dispositivo="cc-1694" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.694 do Código Civil</button>, podem os parentes, os cônjuges ou companheiros pedir alimentos de que necessitem para viver. De acordo com o <button type="button" class="citacao" data-dispositivo="cc-1696" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.696 do Código Civil</button>, há reciprocidade da obrigação alimentar entre pais e filhos.</p>
      <p><strong>Pedido:</strong> Requer a fixação de alimentos em favor dos menores.</p>
      <h3>3. Dos Pedidos</h3>
      <p>Diante do exposto, requer:</p>
      <p>a) a decretação do divórcio das partes;</p>
      <p>b) a expedição de mandado para averbação do divórcio no registro civil;</p>
      <p>c) a realização da partilha dos bens comuns adquiridos durante o casamento;</p>
      <p>d) que seja estabelecida a guarda compartilhada dos menores;</p>
      <p>e) que seja regulamentada a convivência paterna e materna;</p>
      <p>f) que seja fixado alimentos em favor dos menores;</p>
      <p>g) a citação do réu para, querendo, apresentar contestação;</p>
      <p>h) a produção de todas as provas admitidas em direito.</p>
    `,
    resumo: [
      'Caso: Ana (38) e Carlos (42), comunhão parcial de bens, filhos Pedro (10) e Lucas (7), 8 meses de crise.',
      'Bens do casal: apartamento R$ 450.000,00 (saldo devedor R$ 180.000,00), carro de Carlos R$ 70.000,00; carro de Ana (R$ 50.000,00, doado antes do casamento) fica fora da partilha; dívida de Carlos R$ 30.000,00.',
      'Divórcio: fundamento no art. 1.571 do CC.',
      'Partilha: fundamento nos arts. 1.658 e 1.660, I, do CC.',
      'Guarda: fundamento no art. 1.583 do CC; pedido de guarda compartilhada.',
      'Alimentos: fundamento nos arts. 1.694 e 1.696 do CC.',
      'Rol de pedidos (a a h): divórcio, averbação, partilha, guarda compartilhada, convivência, alimentos, citação do réu, produção de provas.'
    ],
    exemploHtml: `A petição comentada desta unidade (caso Marina e Ricardo, aba "Petição") aplica exatamente os mesmos artigos do divórcio e da partilha usados aqui para Ana e Carlos, porque os dois casos compartilham o mesmo regime de bens (comunhão parcial): é a prova de que o método fato/fundamento/pedido se transporta de um caso para outro, desde que os fatos concretos sejam ajustados.`
  },
  {
    id: 'bloco-9',
    numero: 10,
    titulo: 'O ponto cego da traição: dano privado x dano público',
    fonte: 'Slides da disciplina, aula sobre a petição de divórcio, partilha e danos morais.',
    corpoHtml: `
      <p>Um caso de divórcio com infidelidade traz uma pergunta que a petição comentada desta unidade (caso Marina e Ricardo, aba "Petição") já respondeu na prática: traição, por si só, gera automaticamente dano moral? A aula apresenta dois lados dessa pergunta.</p>
      <p>Pelo lado do <strong>fim privado</strong>: o simples fim do casamento, incluindo a causa da separação, tende a ser tratado como mero aborrecimento da vida conjugal, que não gera, automaticamente, responsabilidade civil. Casais se separam por infidelidade o tempo todo, sem que isso vire, sozinho, uma ação de indenização.</p>
      <p>Pelo lado do <strong>fato jurídico</strong>: quando a conduta ultrapassa o âmbito privado do casal (por exemplo, com exposição pública, fotografias, declarações em redes sociais e mensagens a terceiros), passam a estar presentes o ato ilícito, o dano e o nexo causal, porque a humilhação ultrapassa a esfera privada da dissolução conjugal e atinge a honra e a imagem perante terceiros.</p>
    `,
    resumo: [
      'A pergunta: traição, por si só, gera automaticamente dano moral?',
      'Fim privado: mero aborrecimento da vida conjugal, sem responsabilidade civil automática.',
      'Fato jurídico: exposição pública (fotos, redes sociais, mensagens a terceiros) configura ato ilícito, dano e nexo causal.'
    ],
    exemploHtml: `É exatamente essa distinção que sustenta o tópico "Dos Danos Morais" da petição comentada: não é o fim do casamento de Marina e Ricardo que gera o pedido de indenização, é a exposição pública da situação perante o círculo social de Marina.`
  },
  {
    id: 'bloco-10',
    numero: 11,
    titulo: 'A matriz de provas: do fato ao documento',
    fonte: 'Slides da disciplina, aula sobre a petição de divórcio, partilha e danos morais.',
    corpoHtml: `
      <p>Para cada fato relevante de uma petição, a aula ensina a desenhar a prova correspondente: prova não é uma formalidade vazia, é o que sustenta o gatilho da prova (bloco 3) no caso concreto. Aplicada ao caso Marina e Ricardo, a matriz fica assim:</p>
      <div class="tabela-rolavel" tabindex="0" role="group" aria-label="Tabela com rolagem lateral">
        <table>
          <thead><tr><th>Fato</th><th>Prova</th></tr></thead>
          <tbody>
            <tr><td>Casamento e regime de bens</td><td>Certidão de casamento</td></tr>
            <tr><td>Relacionamento extraconjugal</td><td>Mensagens e fotografias</td></tr>
            <tr><td>Exposição pública</td><td>Fotografias de festas/eventos e publicações</td></tr>
            <tr><td>Publicação em rede social</td><td>Prints de tela</td></tr>
            <tr><td>Repercussão perante terceiros</td><td>Mensagens de terceiros e testemunhas</td></tr>
            <tr><td>Patrimônio comum (casa, carro, investimentos)</td><td>Documentos dos bens e comprovantes de aquisição</td></tr>
          </tbody>
        </table>
      </div>
    `,
    resumo: [
      'Para cada fato relevante, desenhar a prova correspondente.',
      'Matriz aplicada ao caso Marina e Ricardo: casamento, infidelidade, exposição pública, publicação, repercussão e patrimônio, cada um com sua prova.'
    ],
    exemploHtml: `Antes de protocolar, o advogado confere a matriz linha por linha: se um fato relevante não tem prova associada, ou a petição perde força naquele ponto, ou falta reunir o documento antes de ajuizar a ação.`
  },
  {
    id: 'bloco-11',
    numero: 12,
    titulo: 'Vícios de linguagem: a versão a evitar e a versão recomendada',
    fonte: 'Slides da disciplina, aula sobre a petição de divórcio, partilha e danos morais.',
    corpoHtml: `
      <p>A aula compara, lado a lado, duas versões do mesmo trecho de fundamentação, para mostrar na prática os vícios de linguagem que a redação jurídica evita.</p>
      <p><strong>Versão a evitar:</strong> "O requerido foi um homem extremamente cruel, horrível, sem caráter e completamente irresponsável, que destruiu emocionalmente a autora, sendo evidente que merece ser severamente punido por tudo aquilo que fez." Essa versão acumula três vícios: é subjetiva ("horrível, sem caráter"), parte para o ataque pessoal em vez do argumento jurídico ("merece ser severamente punido") e não tem precisão técnica ("extremamente cruel", "destruiu emocionalmente").</p>
      <p><strong>Versão recomendada:</strong> "O requerido expôs publicamente a autora em circunstâncias que, segundo a narrativa apresentada, ultrapassariam o âmbito privado da dissolução conjugal, ocasionando repercussões perante familiares, amigos e colegas de trabalho." Essa versão segue a fórmula fato + precisão + objetividade: comunica a gravidade da conduta sem insultar a parte contrária.</p>
    `,
    resumo: [
      'Vícios da versão a evitar: subjetivismo, ataque pessoal (ad hominem), falta de precisão técnica.',
      'Fórmula da versão recomendada: fato + precisão + objetividade.',
      'Comunicar a gravidade da conduta sem insultar a parte contrária.'
    ],
    exemploHtml: `O tópico "Dos Danos Morais" da petição comentada desta unidade segue exatamente a versão recomendada: descreve a exposição pública da conduta de Ricardo com precisão e objetividade, sem qualificar o réu com adjetivos pessoais.`
  },
  {
    id: 'bloco-12',
    numero: 13,
    titulo: 'Checklist: os requisitos do art. 319 do CPC',
    fonte: 'Guia de estudo da petição inicial (peticao-inicial.pdf).',
    corpoHtml: `
      <p>O <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319 do CPC</button> lista os requisitos que toda petição inicial precisa cumprir. Use o checklist abaixo para revisar, item por item, se a sua petição atende a todos eles; o marcador fica salvo neste navegador.</p>
    `,
    componenteExtra: 'checklist-art-319',
    resumo: [
      'O art. 319 do CPC lista os requisitos formais de toda petição inicial.',
      'Oito itens marcáveis: juízo, partes, fatos, fundamentos jurídicos, pedidos, valor da causa, provas, interesse em audiência.'
    ],
    exemploHtml: `Antes de protocolar qualquer petição, revisar este checklist item a item é uma forma rápida de garantir que nenhum requisito formal do art. 319 foi esquecido.`
  },
  {
    id: 'bloco-13',
    numero: 14,
    titulo: 'As cinco perguntas de toda petição',
    fonte: 'Guia de estudo da petição inicial (peticao-inicial.pdf) e quadro de sala, foto de 18/09/2026.',
    corpoHtml: `
      <p>Cinco perguntas resumem o raciocínio por trás de qualquer petição inicial. Toque em cada cartão para revisar a resposta.</p>
    `,
    componenteExtra: 'cartoes-cinco-perguntas',
    resumo: [
      'Quem é o autor e quem é o réu.',
      'O que aconteceu, contado de forma cronológica.',
      'Qual é o direito: procurar a legislação aplicável a cada fato.',
      'Como provar: identificar documentos e demais provas.',
      'O que a parte quer: transformar o problema em pedidos concretos.'
    ],
    exemploHtml: `Ao travar na redação de uma petição, repassar as cinco perguntas, uma a uma, costuma revelar qual delas ainda não foi respondida: normalmente é aí que está o bloqueio.`
  },
  {
    id: 'bloco-14',
    numero: 15,
    titulo: 'Dicas de forma da professora',
    fonte: 'Quadro de sala, foto de 10/09/2026.',
    corpoHtml: `
      <p>Além do conteúdo, a professora anotou no quadro dois limites de forma para a redação da petição.</p>
    `,
    componenteExtra: 'dicas-forma-professora',
    resumo: [
      'Seção "Dos Fatos": no máximo dez linhas.',
      'Peça inteira: limite total de 150 linhas.'
    ],
    exemploHtml: `Um jeito prático de usar esses limites é contar as linhas de cada rascunho antes de considerar a petição pronta: se "Dos Fatos" passar de dez linhas, é sinal de que algum detalhe deveria migrar para "Do Direito" ou ser cortado.`
  }
];
