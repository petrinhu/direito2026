import type { BlocoResumo } from '../../../tipos';

/**
 * Resumo da unidade, em blocos por tema. Cada bloco tem id estável (bloco-0,
 * bloco-1...), numero a partir de 1, título sem "Bloco N", fonte (sempre
 * "Material de estudo da disciplina", com o livro ou a lei quando a disciplina
 * os indicar), corpo sem repetir a fonte, quadro-resumo e exemplo.
 */
export const resumo: readonly BlocoResumo[] = [
  {
    id: 'bloco-0',
    numero: 1,
    titulo: 'Fontes do direito',
    fonte: 'Material de estudo da disciplina.',
    corpoHtml: `
      <p>A dogmática das fontes do direito reúne quatro fontes. No sistema de civil law, a legislação é a fonte primária por excelência, e nela entram a Constituição, as leis ordinárias, as complementares e outras espécies.</p>
      <div class="tabela-rolavel" tabindex="0" role="region" aria-label="Quadro comparativo das fontes do direito">
        <table>
          <thead>
            <tr><th>Fonte</th><th>O que é</th><th>Papel no sistema</th></tr>
          </thead>
          <tbody>
            <tr><td>Legislação</td><td>Regras escritas, como a Constituição e as leis</td><td>Fonte primária por excelência no civil law</td></tr>
            <tr><td>Jurisprudência</td><td>As decisões reiteradas dos tribunais</td><td>Decisões que se repetem sobre um mesmo tema</td></tr>
            <tr><td>Doutrina</td><td>O estudo dogmático dos juristas e teóricos</td><td>Ajuda a dar sentido às leis</td></tr>
            <tr><td>Costume</td><td>Conduta que a sociedade reitera com a convicção de que é obrigatória</td><td>Exige uso constante e consciência de obrigatoriedade</td></tr>
          </tbody>
        </table>
      </div>
      <p>Autores indicados para acompanhar a disciplina, sem trecho próprio nesta unidade: Maria Helena Diniz, Tércio Sampaio Ferraz Jr. e Paulo Nader.</p>
    `,
    resumo: [
      'A legislação é a fonte primária por excelência no sistema de civil law.',
      'A jurisprudência são as decisões reiteradas dos tribunais.',
      'A doutrina é o estudo dogmático dos juristas e teóricos, e ajuda a dar sentido às leis.',
      'O costume exige uso constante e a consciência de que a conduta é obrigatória.'
    ],
    exemploHtml: `Para ler uma questão de fontes, pergunte primeiro se há lei escrita. Depois, veja se há decisões reiteradas, explicações da doutrina ou uma conduta reiterada com convicção de obrigatoriedade.`
  },
  {
    id: 'bloco-1',
    numero: 2,
    titulo: 'A pureza do método e o ato com significado jurídico',
    fonte: 'Material de estudo da disciplina. Livro: KELSEN, Hans. Teoria Pura do Direito.',
    corpoHtml: `
      <p>Em Hans Kelsen, a "pureza" é um princípio metodológico. A pergunta é: o que é e como é o direito? O estudo busca tratar o direito sem confundi-lo com a moral, a política, a sociologia, a psicologia e outras disciplinas. Kelsen não está "limpando" o Direito: ele está "limpando" o método de estudá-lo.</p>
      <p>O Direito não analisa apenas o fato, mas também o seu significado jurídico. Todo ato possui dois níveis: o fato, que é um evento no mundo real, e o significado jurídico, que é a interpretação feita pelo Direito. Matar alguém é o fato; pode ser homicídio ou execução legal, a depender da norma que o interpreta.</p>
      <p>Um mesmo ato tem dois sentidos:</p>
      <div class="tabela-rolavel" tabindex="0" role="region" aria-label="Quadro comparativo dos sentidos do ato">
        <table>
          <thead>
            <tr><th>Sentido</th><th>Quem atribui o significado</th><th>O que faz</th></tr>
          </thead>
          <tbody>
            <tr><td>Subjetivo</td><td>O próprio indivíduo, agindo racionalmente</td><td>Expressa a intenção de quem age. Exemplo: escrever a disposição do patrimônio para depois da morte, com a intenção de fazer um testamento</td></tr>
            <tr><td>Objetivo</td><td>O ordenamento jurídico, independentemente da intenção do agente</td><td>Determina se o ato tem validade e cria uma norma jurídica</td></tr>
          </tbody>
        </table>
      </div>
    `,
    resumo: [
      'Na pureza, o que se purifica é o método de estudo, e não o direito.',
      'O Direito analisa o significado jurídico do fato, e não apenas o fato.',
      'O sentido subjetivo é o que o indivíduo atribui ao ato; o sentido objetivo é o que o ordenamento atribui.',
      'É o sentido objetivo que determina a validade do ato e cria uma norma jurídica.'
    ],
    exemploHtml: `Assinar um papel pode ser um contrato. O que decide o significado jurídico é a norma que interpreta o ato, e não apenas a intenção de quem assina.`
  },
  {
    id: 'bloco-2',
    numero: 3,
    titulo: 'A norma: dever-ser, significado dos fatos e validade',
    fonte: 'Material de estudo da disciplina.',
    corpoHtml: `
      <p>A norma jurídica é um padrão vinculante de conduta social, criado, reconhecido e garantido pelo Poder Público para ordenar a vida em sociedade. Ela atua no mundo do dever-ser: enquanto as leis da natureza, como a gravidade, descrevem o que é, a norma estabelece o que deve ser. Sua finalidade primária é promover o controle social e garantir a segurança jurídica.</p>
      <p>A norma é o que atribui significado jurídico aos fatos. O fato, por si só, não é jurídico: ele se torna jurídico quando interpretado por uma norma. Assim, um evento natural pode ser interpretado como ato lícito ou ilícito. Matar alguém pode ser homicídio ou execução legal, conforme a norma que interpreta o fato.</p>
      <p>O dever-ser só se torna jurídico quando possui validade objetiva. A validade formal depende de uma norma, originada de autoridade competente, que autoriza o ato. A validade das normas remonta, em última instância, a uma norma fundamental (Grundnorm). Por isso a ordem do funcionário é válida, porque tem base na lei, e a do gângster não, pois não há norma que a fundamente.</p>
    `,
    resumo: [
      'Norma jurídica: padrão vinculante de conduta social, criado, reconhecido e garantido pelo Poder Público.',
      'A norma opera no dever-ser, e não no plano do que é.',
      'O fato se torna jurídico quando interpretado por uma norma.',
      'A validade formal depende de norma de autoridade competente que autoriza o ato.'
    ],
    exemploHtml: `Ao analisar um ato, pergunte: qual norma o interpreta, e quem tinha competência para autorizá-lo?`
  },
  {
    id: 'bloco-3',
    numero: 4,
    titulo: 'Teoria Pura do Direito: estrutura hierárquica e estrutura lógica da norma',
    fonte: 'Material de estudo da disciplina. Livro: KELSEN, Hans. Teoria Pura do Direito.',
    corpoHtml: `
      <p>A Teoria Pura do Direito, de Hans Kelsen, busca estudar o Direito de forma "pura", tentando entender qual é o caráter essencialmente jurídico do Direito.</p>
      <p>Sua estrutura é hierárquica. As normas, criadas por uma autoridade competente, se organizam numa estrutura formal em que cada uma retira sua validade de outra superior.</p>
      <p>A estrutura lógica da norma tem duas partes:</p>
      <ul>
        <li><strong>Hipótese de fato (premissa):</strong> a previsão abstrata de uma conduta ou fato social, como "se alguém subtrair coisa alheia móvel".</li>
        <li><strong>Consequência jurídica (efeito):</strong> a resposta prevista pelo ordenamento para a ocorrência da hipótese, como "deve ser punido com reclusão de um a quatro anos".</li>
      </ul>
      <p>Essa estrutura lógica é expressa por uma relação silogística. Isolada, a norma orienta a conduta individual; organizada em conjunto com as demais, forma o ordenamento jurídico que sustenta o Estado Democrático de Direito.</p>
    `,
    resumo: [
      'As normas se organizam hierarquicamente, e cada uma retira sua validade de outra superior.',
      'A hipótese de fato é a previsão abstrata; a consequência jurídica é a resposta do ordenamento.',
      'A estrutura lógica da norma é expressa por uma relação silogística.',
      'A norma é a unidade fundamental do direito: isolada orienta a conduta, em conjunto forma o ordenamento.'
    ],
    exemploHtml: `A reclusão citada no exemplo serve só para mostrar a forma da norma: a hipótese de um lado, a consequência do outro.`
  },
  {
    id: 'bloco-4',
    numero: 5,
    titulo: 'Caracteres e classificações da norma jurídica',
    fonte: 'Material de estudo da disciplina.',
    corpoHtml: `
      <p>A norma jurídica tem cinco caracteres principais:</p>
      <div class="tabela-rolavel" tabindex="0" role="region" aria-label="Quadro dos caracteres da norma jurídica">
        <table>
          <thead>
            <tr><th>Caráter</th><th>O que significa</th><th>Exemplo trazido</th></tr>
          </thead>
          <tbody>
            <tr><td>Bilateralidade</td><td>Vincula duas partes, uma com direito e outra com dever. Não há direito sem dever correspondente</td><td>O credor pode exigir, e o devedor deve cumprir</td></tr>
            <tr><td>Generalidade</td><td>Aplica-se a todos em igual situação, garantindo a igualdade perante a lei</td><td>Todos devem respeitar as normas de trânsito</td></tr>
            <tr><td>Abstratividade</td><td>Regula situações típicas, e não casos individuais, permitindo aplicação a inúmeros casos semelhantes</td><td>Regras contratuais valem para qualquer contrato daquela espécie</td></tr>
            <tr><td>Imperatividade</td><td>Impõe condutas, não sendo mero conselho</td><td>Pagar tributo não é opcional</td></tr>
            <tr><td>Coercibilidade</td><td>Possibilidade de uso da força para garantir o cumprimento, com sanções ou execução forçada</td><td>Penhora de bens em caso de dívida não paga</td></tr>
          </tbody>
        </table>
      </div>
      <p>As normas também se classificam de vários modos:</p>
      <ul>
        <li>quanto ao sistema a que pertencem: nacionais, estrangeiras ou uniformes;</li>
        <li>quanto à fonte: legislativas, jurisprudenciais ou costumeiras;</li>
        <li>quanto aos diversos âmbitos de validez: âmbito espacial e âmbito temporal;</li>
        <li>quanto à hierarquia: constitucionais, complementares, ordinárias, regulamentares e individualizadas;</li>
        <li>quanto à qualidade: positivas (ou permissivas) e negativas (ou proibitivas);</li>
        <li>quanto às relações com a vontade dos particulares: taxativas e dispositivas.</li>
      </ul>
      <p>Diante de uma conduta Y, há normas que proíbem a conduta Y, normas que obrigam a conduta Y, normas que permitem não fazer Y e normas que permitem fazer Y.</p>
    `,
    resumo: [
      'Os cinco caracteres são bilateralidade, generalidade, abstratividade, imperatividade e coercibilidade.',
      'A coercibilidade é a possibilidade de uso da força para garantir o cumprimento.',
      'Quanto à qualidade, as normas são positivas (ou permissivas) ou negativas (ou proibitivas).',
      'Quanto à fonte, as normas são legislativas, jurisprudenciais ou costumeiras.'
    ],
    exemploHtml: `Ao classificar uma norma, responda a duas perguntas: de onde ela vem (a fonte) e o que ela faz (se permite ou se proíbe).`
  },
  {
    id: 'bloco-5',
    numero: 6,
    titulo: 'Direito objetivo e direito subjetivo',
    fonte: 'Material de estudo da disciplina.',
    corpoHtml: `
      <p>O direito pode ser visto por dois lados: o objetivo e o subjetivo.</p>
      <div class="tabela-rolavel" tabindex="0" role="region" aria-label="Quadro comparativo entre direito objetivo e direito subjetivo">
        <table>
          <thead>
            <tr><th>Aspecto</th><th>Direito objetivo (norma agendi)</th><th>Direito subjetivo (facultas agendi)</th></tr>
          </thead>
          <tbody>
            <tr><td>O que é</td><td>O conjunto de normas e regras que a sociedade segue, o ordenamento jurídico</td><td>A faculdade ou o poder que uma pessoa tem de acionar o direito objetivo para proteger um interesse próprio</td></tr>
            <tr><td>Relação com a vontade</td><td>Existe independentemente da vontade de cada um; está no código, valendo para a sociedade</td><td>Pertence à pessoa que o usa para proteger o próprio interesse</td></tr>
            <tr><td>Como se reconhece</td><td>Está no código e vale para a sociedade</td><td>Quando a pessoa traz a lei para a sua realidade e diz: "Eu tenho o direito de..."</td></tr>
          </tbody>
        </table>
      </div>
    `,
    resumo: [
      'Direito objetivo: o conjunto de normas que a sociedade segue (norma agendi).',
      'Direito subjetivo: a faculdade ou o poder de acionar o direito objetivo (facultas agendi).',
      'O direito objetivo existe independentemente da vontade de cada um.',
      'O direito subjetivo é o direito que a pessoa traz para a sua realidade, para proteger um interesse próprio.'
    ],
    exemploHtml: `Quando alguém diz "eu tenho o direito de..." está usando um direito subjetivo, apoiado num direito objetivo que existe independentemente dele.`
  },
  {
    id: 'bloco-6',
    numero: 7,
    titulo: 'Semiótica: sintaxe, semântica e pragmática',
    fonte: 'Material de estudo da disciplina. Livro: Compêndio de Introdução à Ciência do Direito, de Maria Helena Diniz.',
    corpoHtml: `
      <p>A semiótica estuda os signos em três dimensões.</p>
      <ul>
        <li><strong>Sintática:</strong> analisa a relação entre os signos. No Direito, foca na estrutura lógica das normas, na gramática legislativa e na hierarquia, ou seja, em como as leis se conectam formalmente. Um texto com estrutura formal é o art. 1º da Constituição Federal, que enumera em incisos os fundamentos da República: soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa, e pluralismo político.</li>
        <li><strong>Semântica:</strong> estuda a relação entre o signo e o seu significado. É aqui que se busca o sentido das palavras na lei, como o que o legislador quis dizer com "propriedade" ou "família".</li>
        <li><strong>Pragmática:</strong> foca na relação entre o signo e os usuários, no contexto. No Direito, é a aplicação da norma ao caso concreto e o impacto da lei na realidade social, como o jurista a interpreta no mundo real.</li>
      </ul>
      <p>Um caso julgado pelo Carf mostra o sentido de uma palavra decidindo o resultado. A empresa teve os produtos retidos no porto de Santos, e um auditor fiscal indicou a classificação de sapatos impermeáveis. A 1ª Turma da 3ª Câmara da 3ª Seção decidiu que os Crocs devem ser entendidos como sandálias de borracha: embora o calçado não deixe passar a água, só pode ser considerado impermeável o que for coberto até a altura do tornozelo.</p>
    `,
    resumo: [
      'Sintática: a relação entre os signos e a estrutura formal das normas.',
      'Semântica: a relação entre o signo e o significado, o sentido das palavras na lei.',
      'Pragmática: a relação entre o signo e os usuários, no contexto, com a aplicação ao caso concreto.',
      'O sentido de uma palavra pode decidir o resultado de um caso, como no julgamento sobre o calçado impermeável.'
    ],
    exemploHtml: `Ao ler a palavra "propriedade" numa lei, pergunte primeiro o que o legislador quis dizer (semântica) e depois como o caso concreto a alcança (pragmática).`
  },
  {
    id: 'bloco-7',
    numero: 8,
    titulo: 'Textura aberta do direito',
    fonte: 'Material de estudo da disciplina. Livro: HART, H. L. A. O conceito de Direito, capítulo Textura aberta do Direito.',
    corpoHtml: `
      <p>A textura aberta do Direito é um capítulo do livro <em>O conceito de Direito</em>, de H. L. A. Hart. A leitura indicada traz o conceito completo, que não é reproduzido nesta unidade.</p>
      <p>O exemplo trazido para o tema é a regra: "É proibida a entrada de veículos no parque".</p>
    `,
    resumo: [
      'A textura aberta é tema do capítulo de Hart, em O conceito de Direito.',
      'O exemplo da unidade é a proibição de entrada de veículos no parque.'
    ],
    exemploHtml: `Ao ler a regra do parque, pergunte o que a palavra "veículo" abrange.`
  },
  {
    id: 'bloco-8',
    numero: 9,
    titulo: 'Meios de integração do ordenamento jurídico',
    fonte: 'Material de estudo da disciplina. Lei: Decreto-Lei nº 4.657 (LINDB), art. 4º.',
    corpoHtml: `
      <p>Quando a lei é omissa, o juiz decide o caso de acordo com a analogia, os costumes e os princípios gerais de direito, conforme o art. 4º da LINDB.</p>
      <ul>
        <li><strong>Analogia:</strong> aplicação, a um caso não previsto em lei, de uma norma que regula um caso semelhante.</li>
        <li><strong>Costumes:</strong> prática reiterada, constante e pública de um comportamento, com a convicção de sua obrigatoriedade jurídica.</li>
        <li><strong>Princípios gerais de direito:</strong> postulados fundamentais que estruturam o sistema jurídico, mesmo que não estejam escritos em um artigo específico.</li>
      </ul>
    `,
    resumo: [
      'Lei omissa não quer dizer caso sem solução.',
      'A LINDB, art. 4º, indica analogia, costumes e princípios gerais de direito.',
      'A analogia aplica a norma de um caso semelhante ao caso não previsto.',
      'Os princípios gerais valem mesmo sem estar escritos em um artigo específico.'
    ],
    exemploHtml: `Diante de um caso sem norma exata, a LINDB aponta três caminhos: a norma de caso semelhante, o costume reiterado e os princípios que estruturam o sistema.`
  },
  {
    id: 'bloco-9',
    numero: 10,
    titulo: 'Fundamentação e sentença',
    fonte: 'Material de estudo da disciplina. Lei: Código de Processo Civil (CPC), art. 489.',
    corpoHtml: `
      <p>O art. 489 do CPC diz que são elementos essenciais da sentença:</p>
      <ul>
        <li><strong>I, o relatório:</strong> com os nomes das partes, a identificação do caso, com a suma do pedido e da contestação, e o registro das principais ocorrências do processo;</li>
        <li><strong>II, os fundamentos:</strong> em que o juiz analisa as questões de fato e de direito;</li>
        <li><strong>III, o dispositivo:</strong> em que o juiz resolve as questões principais que as partes lhe submeterem.</li>
      </ul>
      <p>Pelo §1º, não se considera fundamentada qualquer decisão judicial, seja ela interlocutória, sentença ou acórdão, que:</p>
      <ul>
        <li><strong>I:</strong> se limitar à indicação, à reprodução ou à paráfrase de ato normativo, sem explicar sua relação com a causa ou a questão decidida;</li>
        <li><strong>II:</strong> empregar conceitos jurídicos indeterminados, sem explicar o motivo concreto de sua incidência no caso;</li>
        <li><strong>III:</strong> invocar motivos que se prestariam a justificar qualquer outra decisão;</li>
        <li><strong>IV:</strong> não enfrentar todos os argumentos deduzidos no processo capazes de, em tese, infirmar a conclusão adotada pelo julgador;</li>
        <li><strong>V:</strong> se limitar a invocar precedente ou enunciado de súmula, sem identificar seus fundamentos determinantes nem demonstrar que o caso se ajusta àqueles fundamentos;</li>
        <li><strong>VI:</strong> deixar de seguir enunciado de súmula, jurisprudência ou precedente invocado pela parte, sem demonstrar a existência de distinção no caso em julgamento ou superação do entendimento.</li>
      </ul>
    `,
    resumo: [
      'A sentença tem relatório, fundamentos e dispositivo.',
      'Fundamentar não é reproduzir a lei: é explicar a relação dela com a causa.',
      'Invocar precedente ou súmula exige identificar seus fundamentos determinantes e mostrar o ajuste ao caso.',
      'Deixar de seguir precedente invocado pela parte exige demonstrar distinção ou superação.'
    ],
    exemploHtml: `Ao escrever ou ler uma decisão, veja se ela explica por que a regra vale para este caso ou apenas repete a regra.`
  },
  {
    id: 'bloco-10',
    numero: 11,
    titulo: 'Precedente, jurisprudência e súmula',
    fonte: 'Material de estudo da disciplina. Lei: Código de Processo Civil (CPC), art. 926, §§ 1º e 2º, e Constituição Federal, art. 103-A.',
    corpoHtml: `
      <div class="tabela-rolavel" tabindex="0" role="region" aria-label="Quadro comparativo de precedente, jurisprudência e súmula">
        <table>
          <thead>
            <tr><th>Conceito</th><th>O que é</th><th>Como surge</th></tr>
          </thead>
          <tbody>
            <tr><td>Precedente</td><td>Decisão judicial tomada em um caso concreto, que pode servir de exemplo para outros julgamentos semelhantes</td><td>Uma decisão</td></tr>
            <tr><td>Jurisprudência</td><td>O conjunto de decisões: quando um tribunal decide um tema de forma repetida e constante</td><td>Decisões reiteradas</td></tr>
            <tr><td>Súmula</td><td>O resumo da jurisprudência, em um enunciado que facilita a consulta e a aplicação</td><td>Quando o tribunal percebe que já decidiu a mesma coisa diversas vezes e redige o enunciado</td></tr>
          </tbody>
        </table>
      </div>
      <p>O art. 926 do CPC determina que os tribunais devem uniformizar sua jurisprudência e mantê-la estável, íntegra e coerente. Pelo §1º, os tribunais editarão enunciados de súmula correspondentes à sua jurisprudência dominante, na forma e segundo os pressupostos fixados no regimento interno. Pelo §2º, ao editar enunciados de súmula, devem ater-se às circunstâncias fáticas dos precedentes que motivaram sua criação.</p>
      <p>O art. 103-A da Constituição Federal prevê a súmula vinculante do Supremo Tribunal Federal. O STF poderá, de ofício ou por provocação, mediante decisão de dois terços dos seus membros, após reiteradas decisões sobre matéria constitucional, aprovar súmula que, a partir de sua publicação na imprensa oficial, terá efeito vinculante em relação aos demais órgãos do Poder Judiciário e à administração pública direta e indireta, nas esferas federal, estadual e municipal. A súmula pode ser revista ou cancelada, na forma estabelecida em lei.</p>
    `,
    resumo: [
      'Precedente: uma decisão em caso concreto. Jurisprudência: o conjunto de decisões repetidas. Súmula: o resumo da jurisprudência.',
      'Os tribunais devem uniformizar a jurisprudência e mantê-la estável, íntegra e coerente.',
      'Ao editar súmula, o tribunal deve atender às circunstâncias fáticas dos precedentes que a motivaram.',
      'A súmula vinculante do STF exige dois terços dos seus membros e reiteradas decisões sobre matéria constitucional.'
    ],
    exemploHtml: `Ao ler uma súmula, procure de quais decisões ela nasceu. O art. 926, §2º, do CPC manda que a súmula respeite as circunstâncias fáticas desses precedentes.`
  },
  {
    id: 'bloco-11',
    numero: 12,
    titulo: 'Da interpretação em Kelsen',
    fonte: 'Material de estudo da disciplina. Livro: KELSEN, Hans. Teoria Pura do Direito, capítulo Da interpretação.',
    corpoHtml: `
      <p>O capítulo sobre a interpretação trata da distinção entre interpretação autêntica e não autêntica, da indeterminação do ato de aplicação do direito, da moldura normativa e da pergunta sobre se interpretar o direito é ato de conhecimento ou ato de vontade.</p>
      <p>Há indeterminação intencional quando a lei deixa a escolha ao aplicador. Exemplo: uma lei que prevê, para um crime, "multa ou prisão". O juiz tem a liberdade de escolher qual das duas aplicar e, se escolher a prisão, ainda deve decidir o tempo exato entre o limite mínimo e o máximo fixados pela lei.</p>
      <p>Há indeterminação não intencional quando a lei deixa margem sem que o legislador a tenha querido. Exemplo: o art. 155, com a redação "Subtrair, para si ou para outrem, coisa alheia móvel: Pena: reclusão, de 1 (um) a 6 (seis) anos, e multa (Redação dada pela Lei nº 15.397, de 2026)". O §1º desse artigo, "A pena aumenta-se de metade, se o crime é praticado durante o repouso noturno", traz indeterminação não intencional.</p>
      <p>Para Kelsen, a aplicação do Direito é um ato de vontade, e não apenas de conhecimento. Dentro da moldura estão as diversas interpretações possíveis e válidas, e o juiz tem liberdade para escolher qualquer uma delas. Fora da moldura estão as decisões ilegais ou inconstitucionais.</p>
    `,
    resumo: [
      'Para Kelsen, aplicar o direito é ato de vontade, e não apenas de conhecimento.',
      'Dentro da moldura estão as interpretações possíveis e válidas.',
      'Fora da moldura estão as decisões ilegais ou inconstitucionais.',
      'Indeterminação intencional: a lei deixa a escolha ao aplicador. Não intencional: a lei deixa margem que não foi querida pelo legislador.'
    ],
    exemploHtml: `Diante de "multa ou prisão", a lei deixa a escolha ao juiz de propósito. No §1º do art. 155, a indeterminação não foi querida pelo legislador, segundo a disciplina.`
  },
  {
    id: 'bloco-12',
    numero: 13,
    titulo: 'Ramos do direito: público e privado',
    fonte: 'Material de estudo da disciplina. Trecho de doutrina sem autor identificado.',
    corpoHtml: `
      <p>Os ramos do direito dividem-se em dois grupos: o público e o privado.</p>
      <p>Um trecho de doutrina reproduzido na indicação de estudo da disciplina, sem autor identificado, traça o critério que separa os dois grupos. O direito público é o que regula as relações em que o Estado é parte: a organização e a atividade do Estado considerado em si mesmo (direito constitucional), a relação com outro Estado (direito internacional) e as relações com os particulares, quando o Estado age em razão do seu poder soberano e na tutela do bem coletivo (direito administrativo e tributário). O direito privado disciplina as relações entre particulares, nas quais predomina, de modo imediato, o interesse de ordem privada, como a compra e venda, a doação, o usufruto, o casamento, o testamento e o empréstimo.</p>
      <div class="tabela-rolavel" tabindex="0" role="region" aria-label="Quadro dos ramos do direito público e privado">
        <table>
          <thead>
            <tr><th>Grupo</th><th>Ramo</th><th>O que cuida</th></tr>
          </thead>
          <tbody>
            <tr><td>Público</td><td>Constitucional</td><td>Os elementos essenciais da organização jurídica do Estado e dos direitos e garantias fundamentais</td></tr>
            <tr><td>Público</td><td>Administrativo</td><td>A organização, os órgãos e as atividades da Administração Pública, visando à gestão dos interesses coletivos</td></tr>
            <tr><td>Público</td><td>Tributário</td><td>O poder do Estado de instituir e cobrar tributos, como impostos, taxas e contribuições</td></tr>
            <tr><td>Público</td><td>Processual</td><td>O instrumento para que as normas abstratas (direito material) sejam aplicadas a casos concretos e conflitos reais</td></tr>
            <tr><td>Público</td><td>Internacional</td><td>As normas entre diferentes Estados. O Direito Internacional Privado rege como as normas nacionais podem ser aplicadas a Estados estrangeiros, e como as normas de Estados estrangeiros podem ser aplicadas aqui</td></tr>
            <tr><td>Público</td><td>Penal</td><td>As infrações penais, crimes e contravenções</td></tr>
            <tr><td>Privado</td><td>Civil</td><td>Principal pilar do Direito Privado: as relações entre as pessoas desde o nascimento até a morte</td></tr>
            <tr><td>Privado</td><td>Empresarial</td><td>A atividade econômica organizada para a produção ou circulação de bens e serviços, com a figura do empresário e as sociedades empresárias</td></tr>
            <tr><td>Privado</td><td>Do trabalho</td><td>A relação jurídica entre empregadores e empregados</td></tr>
          </tbody>
        </table>
      </div>
    `,
    resumo: [
      'Direito público: constitucional, administrativo, tributário, processual, internacional e penal.',
      'Direito privado: civil, empresarial e do trabalho.',
      'O Direito Civil é o principal pilar do Direito Privado.',
      'No público, o Estado é parte; no privado, predomina o interesse de ordem privada entre particulares.'
    ],
    exemploHtml: `Para situar um assunto, pergunte quem são as partes. O Estado atuando na organização e na gestão dos interesses coletivos costuma apontar para o público; pessoas e empresas em relação entre si costumam apontar para o privado.`
  }
];
