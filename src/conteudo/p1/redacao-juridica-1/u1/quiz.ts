import type { PerguntaQuiz } from '../../../tipos';

/**
 * As trinta perguntas do quiz de Redação Jurídica, 1a unidade:
 * 10 de categoria 'teoria' (comunicação jurídica, argumentação e o caso
 * dos exploradores de cavernas), 10 de 'peticao' (estrutura da petição
 * inicial, o método fato/fundamento/pedido e os casos práticos de Ana e
 * Carlos e de Marina e Ricardo) e 10 de 'fundamentos' (citação dos
 * dispositivos legais que sustentam o caso de Marina e Ricardo).
 * Extraídas do material da disciplina (slides de aula, guia de estudo
 * sobre a petição inicial, quadro de sala e caso-modelo), com as
 * citações de artigo marcadas para o balão (ver docs/arquitetura.md,
 * seção 12.1). fonteExtra não se aplica a este conjunto (não há um
 * grupo de "quatro artigos-base" definido para esta unidade), por isso
 * vem sempre false.
 */
export const quiz: readonly PerguntaQuiz[] = [
    { id: 1, categoria: 'teoria', enunciadoHtml: `Segundo a aula sobre comunicação jurídica, qual é a diferença entre o "erro comum" e o "sucesso" do advogado ao se dirigir ao juiz?`, alternativasHtml: [
        `O erro é usar linguagem inadequada, que deixa o juiz confuso; o sucesso é adaptar a mensagem, deixando o juiz convencido.`,
        `O erro é falar pouco; o sucesso é falar o máximo possível de tempo na audiência.`,
        `O erro é citar jurisprudência; o sucesso é evitar qualquer citação de lei.`,
        `O erro é ser educado com o juiz; o sucesso é ser o mais informal possível.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A aula mostra que, se o juiz não entende a tese do advogado, o problema é do advogado, não do juiz: linguagem inadequada leva a um "juiz confuso", enquanto mensagem adaptada ao receptor leva a um "juiz convencido". O advogado não fala apenas para ser ouvido, fala para ser compreendido e convencido.` },

    { id: 2, categoria: 'teoria', enunciadoHtml: `A aula apresenta três níveis de linguagem: coloquial, técnica e complicada. Qual deles é apontado como o ideal para a redação jurídica?`, alternativasHtml: [
        `A linguagem coloquial, porque é a mais parecida com a fala do dia a dia do cliente.`,
        `A linguagem técnica, que usa termos próprios com precisão, sem cair no excesso da linguagem complicada.`,
        `A linguagem complicada, porque impressiona mais o juiz com seu vocabulário raro.`,
        `Não há um nível ideal: o advogado deve alternar aleatoriamente entre os três.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `O espectro apresentado vai do coloquial ("a empresa mandou o funcionário embora") até a linguagem complicada e cheia de rodeios ("a situação fática subjacente poderá ensejar responsabilização patrimonial..."). O ideal fica no meio: a linguagem técnica, com termos próprios ("a empresa rescindiu o contrato de trabalho"), pois linguagem técnica não é sinônimo de linguagem complicada. Ela usa precisão, não enfeite.` },

    { id: 3, categoria: 'teoria', enunciadoHtml: `Qual é a diferença entre oratória e retórica, segundo os "dois motores da persuasão" apresentados na aula?`, alternativasHtml: [
        `Oratória é a arte de construir o argumento (a mente); retórica é a arte de falar bem (o corpo e a voz).`,
        `Oratória e retórica são exatamente a mesma coisa, apenas nomes diferentes para o mesmo conceito.`,
        `Oratória é a arte de falar bem, com foco em como o advogado fala (voz, dicção, postura); retórica é a arte de construir o argumento, com foco em como organizar a ideia para convencer.`,
        `Oratória se aplica só a audiências; retórica se aplica só a petições escritas.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A aula separa os dois motores da persuasão: a oratória cuida do COMO o advogado fala (voz, dicção, ritmo, pausas, postura, contato visual), enquanto a retórica cuida do COMO a ideia é organizada para convencer a mente do receptor. Uma afirmação fraca como "meu cliente não fez nada de errado" ganha força quando reconstruída retoricamente, apontando os elementos exigidos e por que não foram comprovados.` },

    { id: 4, categoria: 'teoria', enunciadoHtml: `Segundo o "gatilho da prova", apontado na aula como o mais poderoso dos gatilhos mentais da comunicação jurídica, qual é a "regra de ouro" do advogado persuasivo?`, alternativasHtml: [
        `Ele diz "confie em mim", reforçando sua autoridade pessoal perante o juiz.`,
        `Ele evita qualquer menção a documentos, para não sobrecarregar a petição de detalhes.`,
        `Ele repete a mesma alegação várias vezes, para fixá-la na memória do juiz.`,
        `Ele diz "veja a prova": sai da mera afirmação e vai para a demonstração material dos fatos.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O gatilho da prova consiste em sair da afirmação genérica para a demonstração material. Em vez de escrever apenas "a empresa sempre pagou corretamente", o advogado persuasivo escreve "os comprovantes de pagamento juntados às fls. X demonstram o pagamento integral". A regra de ouro ensinada é: o advogado persuasivo não diz "confie em mim", ele diz "veja a prova".` },

    { id: 5, categoria: 'teoria', enunciadoHtml: `Um advogado está redigindo a fundamentação de uma petição e escreve apenas: "O réu não cumpriu suas obrigações." Segundo o gatilho da prova estudado em aula, o que falta a essa frase para se tornar persuasiva?`, alternativasHtml: [
        `Falta indicar a demonstração material do descumprimento, como o documento ou a prova concreta que sustenta a alegação.`,
        `Nada falta: a frase já está completa e pronta para convencer o juiz.`,
        `Falta trocar a palavra "réu" por um adjetivo mais forte, como "irresponsável".`,
        `Falta repetir a frase três vezes ao longo da petição, para reforçar o argumento.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A frase apresentada é uma afirmação solta, sem apoio em prova concreta, exatamente o erro que o gatilho da prova busca corrigir. Segundo a regra de ouro estudada, o advogado persuasivo não deixa a alegação flutuando: ele a ancora em um documento, comprovante ou registro específico, transformando "o réu não cumpriu" em algo como "conforme os documentos juntados às fls. X, o réu deixou de cumprir a obrigação Y".` },

    { id: 6, categoria: 'teoria', enunciadoHtml: `Segundo a "evolução de um argumento" apresentada na aula (nível coloquial, nível técnico e nível persuasivo), qual das frases abaixo representa o nível persuasivo, a "arma do advogado"?`, alternativasHtml: [
        `"A empresa não fez nada que justificasse essa cobrança."`,
        `"A responsabilização da empresa não pode decorrer de mera presunção: é indispensável a demonstração dos pressupostos jurídicos que a sustentam, e, neste caso, eles não foram comprovados."`,
        `"Não estão presentes os pressupostos necessários à responsabilização da empresa."`,
        `Nenhuma das três frases anteriores atinge o nível persuasivo, pois todas são igualmente fracas.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `A frase "a empresa não fez nada que justificasse essa cobrança" é o nível coloquial, fraco por falta de técnica. A frase "não estão presentes os pressupostos necessários" é o nível técnico, correto mas passivo, sem força de convencimento. A frase que combina precisão técnica com uma explicação ativa de por que a tese deve prevalecer é o nível persuasivo. Essa é a diferença entre apenas falar Direito e efetivamente comunicar o Direito.` },

    { id: 7, categoria: 'teoria', enunciadoHtml: `Na aula sobre a arquitetura da petição inicial, o princípio "fato não é desabafo" ensina que o cliente costuma contar o problema de forma emocional. Quais perguntas o advogado usa para transformar esse relato em informação juridicamente relevante?`, alternativasHtml: [
        `Apenas "quem tem razão?" e "quem deve ser punido?"`,
        `Apenas o valor que o cliente deseja receber ao final do processo.`,
        `O quê aconteceu, quando, onde, quem esteve envolvido, como e qual foi a consequência.`,
        `Nenhuma pergunta é necessária: o relato do cliente já deve ser copiado literalmente na petição.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A aula usa o exemplo de um cliente que diz "a empresa me humilhou, acabou com minha vida, foi completamente injusta". Para transformar esse desabafo emocional em informação juridicamente relevante, o advogado precisa perguntar o quê aconteceu, quando, onde, quem estava envolvido, como e qual foi a consequência (o dano). É esse filtro que separa a narrativa emocional dos fatos verificáveis que sustentam a petição.` },

    { id: 8, categoria: 'teoria', enunciadoHtml: `A "equação da fundamentação" apresentada em aula é [NORMA] + [FATO] + [CONEXÃO] = [ARGUMENTO JURÍDICO]. Por que apenas citar a lei ("nos termos do art. X da lei Y") não é considerado fundamentação suficiente?`, alternativasHtml: [
        `Porque citar a lei é proibido em petições, devendo o advogado se basear só em doutrina.`,
        `Porque toda lei citada precisa vir acompanhada de pelo menos três julgados do mesmo tribunal.`,
        `Porque a lei muda com frequência, então citá-la é sempre um risco desnecessário.`,
        `Porque fato sem direito é apenas narrativa, e a fundamentação exige explicar por que aquele dispositivo se aplica ao caso concreto e qual é a consequência.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O erro comum apontado na aula é achar que apenas citar o dispositivo legal já constitui fundamentação. Na verdade, a norma sozinha, sem conexão com o fato do caso concreto, não sustenta o argumento. A solução ensinada é o advogado explicar por que aquele dispositivo se aplica àquela situação específica e qual consequência jurídica isso gera, unindo norma, fato e conexão entre eles.` },

    { id: 9, categoria: 'teoria', enunciadoHtml: `No caso dos exploradores de cavernas, o que Roger Whetmore propôs ao grupo preso, e o que aconteceu quando ele tentou desistir do acordo?`, alternativasHtml: [
        `Ele propôs que um deles fosse sacrificado e servisse de alimento aos demais, sugerindo um sorteio; quando tentou desistir antes do sorteio, os demais não aceitaram, pois consideravam o acordo já estabelecido.`,
        `Ele propôs esperar o resgate sem tomar nenhuma decisão, e o grupo concordou em desistir junto com ele.`,
        `Ele propôs dividir igualmente os poucos alimentos restantes, e essa proposta foi aceita sem qualquer conflito.`,
        `Ele propôs abandonar a caverna imediatamente, o que causou a morte dos resgatistas.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Diante da falta de alimento suficiente para a sobrevivência de todos até o resgate, Whetmore levantou a possibilidade de matar um dos exploradores e usar seu corpo como alimento, sugerindo um sorteio para decidir quem seria a vítima. O grupo inicialmente concordou, mas ele mudou de ideia antes do sorteio ser realizado. Os demais, porém, entenderam que o acordo já estava firmado e a sobrevivência de todos dependia dele, e não aceitaram sua desistência. O sorteio foi realizado, o resultado recaiu sobre o próprio Whetmore, e ele foi morto pelos demais.` },

    { id: 10, categoria: 'teoria', enunciadoHtml: `Ao julgar os quatro sobreviventes por homicídio, os juízes enfrentaram o seguinte impasse: a lei vigente punia gravemente quem tirasse a vida de outra pessoa intencionalmente, sem prever nenhuma exceção para quem matasse para sobreviver. O que esse impasse ilustra sobre a relação entre a letra da lei e a argumentação jurídica?`, alternativasHtml: [
        `Mostra que a lei escrita nunca precisa ser aplicada quando o advogado discorda dela.`,
        `Mostra que o texto da lei, aplicado literalmente, pode não prever situações extremas, o que exige do operador do Direito uma argumentação que vá além da simples citação do dispositivo para justificar a solução do caso.`,
        `Mostra que casos difíceis devem ser sempre decididos por votação popular, e não pelo Judiciário.`,
        `Mostra que qualquer necessidade extrema, por si só, já é reconhecida como excludente automática de crime em qualquer legislação do mundo.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `O caso dos exploradores de cavernas é um clássico dilema (baseado no caso hipotético formulado pelo jurista Lon Fuller) usado para discutir os limites da aplicação literal da lei. A ausência de uma exceção expressa para a situação extrema vivida pelos exploradores obriga o operador do Direito a argumentar, não apenas a citar o texto legal: é preciso construir um raciocínio jurídico que enfrente a lacuna, exatamente a habilidade de transformar norma, fato e conexão em argumento que a disciplina busca desenvolver.` },

    { id: 11, categoria: 'peticao', enunciadoHtml: `Segundo a estrutura de oito passos ensinada em sala para a redação da petição inicial, qual é a sequência correta?`, alternativasHtml: [
        `Endereçamento, Qualificação, Fatos, Direito, Dos Pedidos, Valor da Causa, Termos em que pede deferimento, Data/Advogado/OAB/UF.`,
        `Qualificação, Endereçamento, Direito, Fatos, Valor da Causa, Dos Pedidos, Data/Advogado/OAB/UF, Termos em que pede deferimento.`,
        `Fatos, Direito, Dos Pedidos, Endereçamento, Qualificação, Termos em que pede deferimento, Valor da Causa, Data/Advogado/OAB/UF.`,
        `Dos Pedidos, Valor da Causa, Fatos, Direito, Endereçamento, Qualificação, Data/Advogado/OAB/UF, Termos em que pede deferimento.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `A sequência ensinada em sala segue a lógica de identificar primeiro a quem a peça se dirige (Endereçamento), depois quem são as partes (Qualificação), o que aconteceu (Fatos), por que isso gera um direito, organizado em tópicos de fato, fundamento e pedido (Direito), o que se pede (Dos Pedidos), o valor atribuído à causa (Valor da Causa), a fórmula de fechamento (Termos em que pede deferimento) e, por fim, local, data, assinatura do advogado e OAB.` },

    { id: 12, categoria: 'peticao', enunciadoHtml: `Um estudante está elaborando uma petição e já sabe quem é o autor, quem é o réu e o que aconteceu, mas ainda não decidiu que legislação vai citar para sustentar o pedido. Segundo as "cinco perguntas de toda petição" ensinadas em sala, qual pergunta ele ainda precisa responder?`, alternativasHtml: [
        `"Como provar?", que pede a identificação de documentos e demais provas.`,
        `"O que a parte quer?", que pede a transformação do problema em pedidos concretos.`,
        `"Quem é o autor e quem é o réu?", pergunta que ele já respondeu.`,
        `"Qual é o direito?", que pede que se procure a legislação aplicável a cada fato.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Das cinco perguntas ensinadas (quem é autor e réu; o que aconteceu; qual é o direito; como provar; o que a parte quer), o estudante do enunciado já sabe quem são as partes e o que aconteceu, mas ainda não decidiu a base legal do pedido. Essa é justamente a pergunta "qual é o direito?", que orienta a buscar a legislação aplicável a cada fato antes de redigir a fundamentação.` },

    { id: 13, categoria: 'peticao', enunciadoHtml: `No método fato, fundamento e pedido demonstrado em sala com o tópico "Do Divórcio" do caso de Ana e Carlos, qual das alternativas identifica corretamente o papel de cada elemento?`, alternativasHtml: [
        `Fato: Ana está separada de fato de Carlos há oito meses de crise no casamento; Fundamento: o art. 1.571 do Código Civil, que estabelece o divórcio como causa de fim da sociedade conjugal; Pedido: o acolhimento do pedido de divórcio.`,
        `Fato: o art. 1.571 do Código Civil; Fundamento: o pedido de divórcio; Pedido: a separação de fato do casal.`,
        `Fato e Fundamento são a mesma coisa nesse método, e o Pedido é sempre dispensável.`,
        `Fato: o pedido de divórcio; Fundamento: a separação de fato; Pedido: o art. 1.571 do Código Civil.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `O método ensinado organiza cada tópico do "Direito" em três partes: o Fato (o que aconteceu, no caso, oito meses de crise e a separação de fato do casal), o Fundamento (a norma que dá respaldo, o art. 1.571 do Código Civil, segundo o qual a sociedade conjugal termina pelo divórcio) e o Pedido (o que se requer com base nesse fato e fundamento, o acolhimento do divórcio). Só a ordem correta, fato seguido do fundamento que o sustenta e do pedido que dele decorre, constrói um argumento jurídico completo.` },

    { id: 14, categoria: 'peticao', enunciadoHtml: `Ainda no método fato, fundamento e pedido, o tópico "Da Partilha dos Bens" do caso de Ana e Carlos apresenta como fato a aquisição, durante a união e sob o regime de bens do casal, de um apartamento e de um carro. Qual seria o fundamento correspondente, segundo o exemplo dado em sala?`, alternativasHtml: [
        `O art. 1.583 do Código Civil, que trata da guarda unilateral ou compartilhada.`,
        `Os arts. 1.658 e 1.660, I, do Código Civil, que preveem a comunicação e a divisão dos bens adquiridos na constância do casamento.`,
        `O art. 1.694 do Código Civil, que trata da obrigação de prestar alimentos.`,
        `Nenhum fundamento é necessário: basta o fato para sustentar o pedido de partilha.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `O exemplo do quadro usa exatamente esses dois artigos como fundamento do tópico da partilha: o art. 1.658 do Código Civil, que estabelece que se comunicam os bens que sobrevierem ao casal na constância do casamento, e o inciso I do art. 1.660, que inclui na comunhão os bens adquiridos onerosamente durante o casamento. Juntos, sustentam o pedido de partilha do apartamento e do carro citados no fato.` },

    { id: 15, categoria: 'peticao', enunciadoHtml: `No caso do quadro (Ana e Carlos), qual é o regime de bens do casamento e quantos filhos menores o casal possui?`, alternativasHtml: [
        `Regime de separação total de bens, sem filhos.`,
        `Regime de comunhão universal de bens, com um filho.`,
        `Regime de comunhão parcial de bens, com dois filhos menores, Pedro e Lucas.`,
        `Regime de participação final nos aquestos, com três filhos.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `O quadro apresentado em sala descreve Ana, de 38 anos, e Carlos, de 42 anos, casados sob o regime de comunhão parcial de bens, com dois filhos menores: Pedro, de 10 anos, e Lucas, de 7 anos. É esse regime de bens que justifica a comunicação do apartamento e do carro adquiridos durante a união, e é a existência dos filhos menores que justifica os tópicos de guarda e alimentos na petição.` },

    { id: 16, categoria: 'peticao', enunciadoHtml: `Ainda no caso de Ana e Carlos, o carro de Ana foi doado a ela antes do casamento. Por que esse bem não entra na partilha, mesmo o casal sendo casado sob o regime de comunhão parcial?`, alternativasHtml: [
        `Porque carros nunca entram na partilha, seja qual for o regime de bens.`,
        `Porque só bens em nome do marido entram na partilha, nunca bens em nome da esposa.`,
        `Porque doações em geral são sempre proibidas de aparecer em qualquer petição.`,
        `Porque o art. 1.658 do Código Civil só manda comunicar os bens que sobrevierem ao casal na constância do casamento, e o carro de Ana já era dela antes de o casamento começar.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `O regime da comunhão parcial, disciplinado pelo art. 1.658 do Código Civil, comunica os bens que sobrevierem ao casal na constância do casamento, ou seja, os adquiridos depois de casados. Como o carro de Ana foi doado a ela antes do casamento, ele não integra o patrimônio comum a ser partilhado, ao contrário do apartamento e do carro de Carlos, adquiridos durante a união.` },

    { id: 17, categoria: 'peticao', enunciadoHtml: `No tópico "Da Guarda" do quadro de Ana e Carlos, com base em qual artigo do Código Civil a petição fundamenta que a guarda pode ser unilateral ou compartilhada?`, alternativasHtml: [
        `O <button type="button" class="citacao" data-dispositivo="cc-1583" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.583 do Código Civil</button>.`,
        `O <button type="button" class="citacao" data-dispositivo="cc-1580" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.580 do Código Civil</button>.`,
        `O <button type="button" class="citacao" data-dispositivo="cc-1694" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.694 do Código Civil</button>.`,
        `O <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319 do Código de Processo Civil</button>.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `O quadro de sala indica expressamente o <button type="button" class="citacao" data-dispositivo="cc-1583" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.583 do Código Civil</button> como fundamento do tópico da guarda: partindo do fato de que Ana e Carlos possuem dois filhos menores, o fundamento é esse artigo, que prevê a guarda unilateral ou compartilhada, e o pedido é que a guarda de Pedro e Lucas seja compartilhada, com regulamentação da convivência paterna e materna.` },

    { id: 18, categoria: 'peticao', enunciadoHtml: `Ainda no caso de Ana e Carlos, o tópico "Dos Alimentos" tem como fato que os filhos menores possuem direito à prestação alimentícia. Se um estudante for redigir o fundamento desse tópico seguindo o exemplo dado em sala, quais dois artigos do Código Civil ele deve citar?`, alternativasHtml: [
        `Os arts. <button type="button" class="citacao" data-dispositivo="cc-1658" aria-expanded="false" aria-controls="balao-dispositivo">1.658</button> e <button type="button" class="citacao" data-dispositivo="cc-1660-i" aria-expanded="false" aria-controls="balao-dispositivo">1.660, I</button> do Código Civil, que tratam da partilha de bens.`,
        `Os arts. <button type="button" class="citacao" data-dispositivo="cc-1694" aria-expanded="false" aria-controls="balao-dispositivo">1.694</button> e <button type="button" class="citacao" data-dispositivo="cc-1696" aria-expanded="false" aria-controls="balao-dispositivo">1.696</button> do Código Civil, que tratam, respectivamente, da possibilidade de pedir alimentos de quem se necessite e da reciprocidade da obrigação alimentar entre pais e filhos.`,
        `O art. <button type="button" class="citacao" data-dispositivo="cc-1583" aria-expanded="false" aria-controls="balao-dispositivo">1.583</button> do Código Civil, isoladamente, que trata da guarda.`,
        `Nenhum artigo é necessário, bastando o pedido de alimentos sem qualquer fundamento legal.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Seguindo o exemplo do quadro, o fundamento do tópico dos alimentos combina dois dispositivos: o <button type="button" class="citacao" data-dispositivo="cc-1694" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.694 do Código Civil</button>, segundo o qual parentes, cônjuges ou companheiros podem pedir uns aos outros os alimentos de que necessitem para viver, e o <button type="button" class="citacao" data-dispositivo="cc-1696" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.696</button>, que estabelece a reciprocidade da obrigação alimentar entre pais e filhos. Juntos, sustentam o pedido de fixação de alimentos em favor dos menores.` },

    { id: 19, categoria: 'peticao', enunciadoHtml: `No caso de Marina e Ricardo (a petição modelo estudada), qual é a ação processual nomeada e quais os três pedidos principais formulados por Marina?`, alternativasHtml: [
        `Ação de Alimentos c/c Guarda; pedidos: fixação de alimentos, guarda compartilhada e regulamentação de visitas.`,
        `Ação de Reconhecimento de União Estável; pedidos: reconhecimento da união, partilha e pensão alimentícia.`,
        `Ação de Divórcio Litigioso c/c Partilha de Bens e Indenização por Danos Morais; pedidos: decretação do divórcio, partilha igualitária dos bens comuns e indenização por danos morais.`,
        `Ação de Divórcio Consensual; pedidos: apenas a decretação do divórcio, sem partilha nem indenização.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `A petição modelo estudada propõe a "AÇÃO DE DIVÓRCIO LITIGIOSO C/C PARTILHA DE BENS E INDENIZAÇÃO POR DANOS MORAIS". Entre os pedidos finais está também a citação do réu para, querendo, apresentar contestação, e o interesse na audiência de conciliação, manifestado com base no <button type="button" class="citacao" data-dispositivo="cpc-319-vii" aria-expanded="false" aria-controls="balao-dispositivo">art. 319, VII, do CPC</button>, mas os três pedidos centrais e nomeados na própria ação são o divórcio, a partilha dos bens adquiridos durante o casamento e a indenização pelos danos morais decorrentes da exposição pública.` },

    { id: 20, categoria: 'peticao', enunciadoHtml: `A petição do caso Marina e Ricardo reconhece que a mera dissolução do casamento ou a infidelidade, consideradas isoladamente, não geram automaticamente o dever de indenizar. Por que, então, a petição sustenta que a conduta de Ricardo gera direito a indenização por danos morais?`, alternativasHtml: [
        `Porque qualquer traição, por si só, sempre gera dano moral automático, independentemente de outras circunstâncias.`,
        `Porque Marina pediu o divórcio primeiro, o que por si só gera direito à indenização contra o outro cônjuge.`,
        `Porque o casamento durou mais de dez anos, e petições sobre casamentos longos sempre incluem pedido de danos morais.`,
        `Porque a conduta de Ricardo ultrapassou a esfera privada do casal: ele expôs publicamente a relação em redes sociais e enviou mensagens a amigos em comum depreciando o casamento, atingindo a honra e a imagem de Marina perante seu círculo social.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `A petição é cuidadosa em distinguir o simples fim do casamento (que não gera indenização automática) da conduta que ultrapassa os limites do mero descumprimento dos deveres conjugais. No caso de Marina, a infidelidade foi exposta publicamente, com fotografias e declarações de afeto em redes sociais, além de mensagens a amigos em comum depreciando o casamento, o que atingiu diretamente a honra e a imagem de Marina perante seu convívio social, justificando o pedido de indenização.` },

    { id: 21, categoria: 'fundamentos', fonteExtra: false, enunciadoHtml: `Por que, na fundamentação do pedido de divórcio de Marina e Ricardo, o correto é basear-se no <button type="button" class="citacao" data-dispositivo="cf-226-6" aria-expanded="false" aria-controls="balao-dispositivo">art. 226, §6º, da Constituição Federal</button> (com a redação dada pela <button type="button" class="citacao" data-dispositivo="ec-66-2010" aria-expanded="false" aria-controls="balao-dispositivo">Emenda Constitucional 66/2010</button>) c/c o <button type="button" class="citacao" data-dispositivo="cc-1571-iv" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.571, IV, do Código Civil</button>, e não mais no <button type="button" class="citacao" data-dispositivo="cc-1580" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.580 do Código Civil</button>?`, alternativasHtml: [
        `Porque a Emenda Constitucional 66/2010 eliminou o requisito de prévia separação judicial para o divórcio, tornando o art. 1.580 do Código Civil, que disciplinava a conversão da separação em divórcio, superado para fundamentar o divórcio direto.`,
        `Porque o art. 1.580 do Código Civil foi revogado por completo e não existe mais no ordenamento jurídico brasileiro.`,
        `Porque o art. 226, §6º, da Constituição Federal só se aplica a casamentos religiosos, nunca a casamentos civis.`,
        `Porque o art. 1.571, IV, do Código Civil trata exclusivamente de partilha de bens, e não de divórcio.`
      ], correta: 0, explicacaoHtml: `A Emenda Constitucional 66/2010 alterou o <button type="button" class="citacao" data-dispositivo="cf-226-6" aria-expanded="false" aria-controls="balao-dispositivo">art. 226, §6º, da CF</button> e eliminou a exigência de prévia separação judicial ou de fato como requisito para o divórcio, tornando-o direto. Por isso, o <button type="button" class="citacao" data-dispositivo="cc-1580" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.580 do Código Civil</button>, que disciplinava a conversão da separação judicial em divórcio após certo prazo, ficou superado para esse fim: a fundamentação correta e atual combina o art. 226, §6º, da CF com o <button type="button" class="citacao" data-dispositivo="cc-1571-iv" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.571, IV, do Código Civil</button>, que arrola o divórcio entre as causas de dissolução da sociedade conjugal. O modelo estudado ainda citava o art. 1.580 ao lado desses dispositivos, mas essa citação não reflete mais a exigência atual.` },

    { id: 22, categoria: 'fundamentos', fonteExtra: false, enunciadoHtml: `O que a <button type="button" class="citacao" data-dispositivo="ec-66-2010" aria-expanded="false" aria-controls="balao-dispositivo">Emenda Constitucional 66/2010</button> mudou no regime do divórcio no Brasil?`, alternativasHtml: [
        `Criou, pela primeira vez, a possibilidade de dissolução do casamento no Brasil, que antes era vitalício.`,
        `Eliminou o requisito de prévia separação judicial ou comprovada separação de fato por determinado prazo, permitindo o divórcio direto.`,
        `Extinguiu totalmente o instituto da separação judicial, tornando-o crime.`,
        `Passou a exigir que todo divórcio fosse necessariamente litigioso, proibindo o divórcio consensual.`
      ], correta: 1, explicacaoHtml: `Antes da <button type="button" class="citacao" data-dispositivo="ec-66-2010" aria-expanded="false" aria-controls="balao-dispositivo">Emenda Constitucional 66/2010</button>, o casal precisava, em regra, passar por um período de separação (judicial ou de fato) antes de poder se divorciar. A emenda alterou o <button type="button" class="citacao" data-dispositivo="cf-226-6" aria-expanded="false" aria-controls="balao-dispositivo">art. 226, §6º, da Constituição Federal</button>, retirando esse requisito temporal e passando a permitir o chamado divórcio direto, sem necessidade de prévia separação.` },

    { id: 23, categoria: 'fundamentos', fonteExtra: false, enunciadoHtml: `O <button type="button" class="citacao" data-dispositivo="cc-1571" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.571 do Código Civil</button> trata de quê, e qual é o papel do inciso IV nesse artigo?`, alternativasHtml: [
        `Trata dos requisitos da petição inicial, e o inciso IV exige a indicação do valor da causa.`,
        `Trata da partilha de bens no regime de comunhão parcial, e o inciso IV trata dos bens excluídos da comunhão.`,
        `Trata das causas de dissolução da sociedade conjugal, e o inciso IV arrola o divórcio entre essas causas.`,
        `Trata exclusivamente da guarda de filhos menores, e o inciso IV trata da guarda compartilhada.`
      ], correta: 2, explicacaoHtml: `O <button type="button" class="citacao" data-dispositivo="cc-1571" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.571 do Código Civil</button> lista as causas que terminam a sociedade conjugal. O <button type="button" class="citacao" data-dispositivo="cc-1571-iv" aria-expanded="false" aria-controls="balao-dispositivo">inciso IV</button> inclui o divórcio entre essas causas, sendo por isso o dispositivo civil citado, ao lado do art. 226, §6º, da CF, para fundamentar o pedido de divórcio nas petições estudadas.` },

    { id: 24, categoria: 'fundamentos', fonteExtra: false, enunciadoHtml: `O <button type="button" class="citacao" data-dispositivo="cc-1658" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.658 do Código Civil</button>, citado como fundamento da partilha de bens tanto no caso de Ana e Carlos quanto no de Marina e Ricardo, estabelece o quê?`, alternativasHtml: [
        `Que todo casamento, independentemente do regime de bens escolhido, resulta em partilha igualitária automática.`,
        `Que os bens adquiridos antes do casamento sempre se comunicam ao outro cônjuge.`,
        `Que a partilha de bens só pode ser decidida por acordo entre as partes, nunca por decisão judicial.`,
        `Que, no regime de comunhão parcial, comunicam-se os bens que sobrevierem ao casal na constância do casamento, com as exceções dos artigos seguintes.`
      ], correta: 3, explicacaoHtml: `Esse é o dispositivo central do regime de comunhão parcial de bens: comunicam-se os bens que sobrevierem ao casal na constância do casamento, ressalvadas as exceções previstas nos artigos seguintes (como bens recebidos por herança ou doação com cláusula de incomunicabilidade). É por isso que ele aparece nos dois casos estudados como base para a partilha dos bens adquiridos durante a união.` },

    { id: 25, categoria: 'fundamentos', fonteExtra: false, enunciadoHtml: `No caso Marina e Ricardo, quais bens integram o patrimônio comum a ser partilhado, e com base em qual combinação de dispositivos do Código Civil?`, alternativasHtml: [
        `A casa avaliada em R$ 500.000,00, o veículo avaliado em R$ 80.000,00 e os investimentos de R$ 120.000,00, todos adquiridos durante o casamento, com base nos arts. <button type="button" class="citacao" data-dispositivo="cc-1658" aria-expanded="false" aria-controls="balao-dispositivo">1.658</button> e <button type="button" class="citacao" data-dispositivo="cc-1660-i" aria-expanded="false" aria-controls="balao-dispositivo">1.660, I</button>.`,
        `Apenas a casa, com base no <button type="button" class="citacao" data-dispositivo="cc-1583" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.583 do Código Civil</button>, que trata da guarda.`,
        `Nenhum bem, porque casamentos sob comunhão parcial nunca resultam em partilha.`,
        `Somente os investimentos financeiros, com base no <button type="button" class="citacao" data-dispositivo="cc-1694" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.694 do Código Civil</button>, que trata de alimentos.`
      ], correta: 0, explicacaoHtml: `Durante o casamento, Marina e Ricardo adquiriram uma casa (aproximadamente R$ 500.000,00), um veículo (aproximadamente R$ 80.000,00) e investimentos financeiros (aproximadamente R$ 120.000,00). Por terem sido adquiridos na constância do casamento sob o regime de comunhão parcial, esses bens integram o patrimônio comum, nos termos do <button type="button" class="citacao" data-dispositivo="cc-1658" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.658</button> combinado com o <button type="button" class="citacao" data-dispositivo="cc-1660-i" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.660, I, do Código Civil</button>, sendo objeto do pedido de partilha igualitária, na proporção de 50% para cada cônjuge.` },

    { id: 26, categoria: 'fundamentos', fonteExtra: false, enunciadoHtml: `Na petição de Marina e Ricardo, os incisos <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">V</button> e <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">X</button> do art. 5º da Constituição Federal são citados para fundamentar qual pedido, e o que eles asseguram?`, alternativasHtml: [
        `Fundamentam o pedido de guarda compartilhada, ao assegurar a convivência familiar.`,
        `Fundamentam o pedido de indenização por danos morais, ao assegurar a indenização por dano material, moral ou à imagem, e a inviolabilidade da intimidade, da vida privada, da honra e da imagem das pessoas.`,
        `Fundamentam o pedido de partilha de bens, ao assegurar a propriedade privada de forma absoluta.`,
        `Fundamentam o pedido de citação do réu, ao assegurar o direito ao contraditório.`
      ], correta: 1, explicacaoHtml: `O <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">inciso V do art. 5º da CF</button> assegura o direito de indenização por dano material, moral ou à imagem, e o <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">inciso X</button> declara invioláveis a intimidade, a vida privada, a honra e a imagem das pessoas, garantindo indenização por sua violação. Juntos, servem de reforço constitucional ao pedido de indenização por danos morais, decorrente da exposição pública sofrida por Marina.` },

    { id: 27, categoria: 'fundamentos', fonteExtra: false, enunciadoHtml: `A petição de Marina e Ricardo afirma que estão presentes os elementos da responsabilização civil: conduta ilícita, dano e nexo causal. Em quais dois artigos do Código Civil essa responsabilização se fundamenta, e qual é a função de cada um?`, alternativasHtml: [
        `No <button type="button" class="citacao" data-dispositivo="cc-1571" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.571</button>, que trata do divórcio, e no <button type="button" class="citacao" data-dispositivo="cc-1658" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.658</button>, que trata da partilha.`,
        `Apenas no <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">art. 927</button>, isoladamente, sem necessidade de nenhum outro artigo.`,
        `No <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186</button>, que define o ato ilícito, e no <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">art. 927</button>, que impõe o dever de reparar o dano causado por esse ato ilícito.`,
        `No <button type="button" class="citacao" data-dispositivo="cpc-292" aria-expanded="false" aria-controls="balao-dispositivo">art. 292 do CPC</button>, que fixa o valor da causa, e no <button type="button" class="citacao" data-dispositivo="cpc-294" aria-expanded="false" aria-controls="balao-dispositivo">art. 294 do CPC</button>, que trata da tutela provisória.`
      ], correta: 2, explicacaoHtml: `O <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">art. 186 do Código Civil</button> define como ato ilícito a conduta de quem, por ação ou omissão voluntária, negligência ou imprudência, viola direito e causa dano a outrem, ainda que exclusivamente moral. Já o <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">art. 927</button> estabelece a consequência desse ato ilícito: quem causa dano a outrem fica obrigado a repará-lo. Juntos, sustentam o núcleo do pedido de indenização por danos morais na petição de Marina.` },

    { id: 28, categoria: 'fundamentos', fonteExtra: false, enunciadoHtml: `Segundo o <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319 do CPC</button>, citado logo no início da petição de Marina e Ricardo, quais elementos, entre outros, a petição inicial deve indicar?`, alternativasHtml: [
        `Apenas o nome do juiz e a data de nascimento das partes.`,
        `Exclusivamente o valor da causa, sem necessidade de descrever fatos.`,
        `Somente a assinatura do advogado e seu número de inscrição na OAB.`,
        `O juízo a que é dirigida, a qualificação das partes, os fatos e fundamentos jurídicos do pedido, o pedido, o valor da causa e as provas.`
      ], correta: 3, explicacaoHtml: `O <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">art. 319 do CPC</button> lista os requisitos estruturais de toda petição inicial: o juízo a que se dirige, a qualificação completa das partes, o fato e os fundamentos jurídicos do pedido, o pedido com suas especificações, o valor da causa e as provas com que se pretende demonstrar a verdade dos fatos alegados. É por isso que ele é citado logo no cabeçalho da petição, ao lado dos demais fundamentos do caso.` },

    { id: 29, categoria: 'fundamentos', fonteExtra: false, enunciadoHtml: `Na petição de Marina e Ricardo, o pedido de condenação do réu em custas e honorários se apoia no <button type="button" class="citacao" data-dispositivo="cpc-85" aria-expanded="false" aria-controls="balao-dispositivo">art. 85 do CPC</button>, enquanto a seção "Do Valor da Causa" se apoia no <button type="button" class="citacao" data-dispositivo="cpc-292" aria-expanded="false" aria-controls="balao-dispositivo">art. 292 do CPC</button>. Qual é a função de cada um desses dispositivos?`, alternativasHtml: [
        `O art. 85 determina que a sentença condene o vencido a pagar honorários ao advogado do vencedor, e o art. 292 exige que toda petição inicial indique o valor atribuído à causa.`,
        `O art. 85 fixa o prazo para contestação, e o art. 292 define a competência do juízo.`,
        `Os dois artigos tratam exatamente do mesmo assunto: a citação do réu.`,
        `O art. 85 trata da guarda dos filhos, e o art. 292 trata da partilha de bens.`
      ], correta: 0, explicacaoHtml: `O <button type="button" class="citacao" data-dispositivo="cpc-85" aria-expanded="false" aria-controls="balao-dispositivo">art. 85 do CPC</button> estabelece que a sentença condenará o vencido a pagar honorários ao advogado do vencedor, fundamento do pedido de condenação de Ricardo em custas e honorários sucumbenciais. Já o <button type="button" class="citacao" data-dispositivo="cpc-292" aria-expanded="false" aria-controls="balao-dispositivo">art. 292 do CPC</button> exige que toda petição inicial indique o valor da causa, regra para gravar segundo o material estudado: petição inicial precisa ter valor da causa, mesmo quando, por falta de dado concreto, esse valor apareça em aberto.` },

    { id: 30, categoria: 'fundamentos', fonteExtra: false, enunciadoHtml: `A petição de Marina e Ricardo inclui uma seção "Da Tutela Provisória, Caso Necessário", pedindo a retirada de publicações ofensivas com base nos <button type="button" class="citacao" data-dispositivo="cpc-294" aria-expanded="false" aria-controls="balao-dispositivo">arts. 294 e seguintes do CPC</button>. Por que essa seção aparece como condicional ("caso necessário"), e não como um pedido incondicional?`, alternativasHtml: [
        `Porque a tutela provisória nunca pode ser pedida junto com uma petição inicial, apenas em ação separada.`,
        `Porque o pedido só se aplica se, no momento da petição, ainda existirem publicações do réu que exponham indevidamente a autora, situação que pode ou não persistir.`,
        `Porque o art. 294 do CPC proíbe qualquer pedido relacionado a redes sociais.`,
        `Porque tutela provisória é sinônimo de partilha de bens, e o casal já havia decidido não partilhar nada.`
      ], correta: 1, explicacaoHtml: `A tutela provisória, disciplinada a partir do <button type="button" class="citacao" data-dispositivo="cpc-294" aria-expanded="false" aria-controls="balao-dispositivo">art. 294 do CPC</button>, serve para situações de urgência ou evidência. No caso de Marina, o pedido de retirada de publicações ofensivas só faz sentido se, no momento em que a petição é protocolada, essas publicações ainda estiverem no ar, expondo indevidamente a autora. Por isso a seção é redigida como condicional, aplicável apenas se essa circunstância concreta ainda existir, e não como um pedido automático e incondicional.` }
];
