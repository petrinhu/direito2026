import type { PecaComentada } from '../../../tipos';

/**
 * Petição comentada do caso "Marina x Ricardo" (ação de divórcio litigioso
 * c/c partilha de bens e indenização por danos morais), convertida de
 * docs/peticao-comentada-redacao-u1.md (produzido a partir do enunciado e
 * do modelo fornecidos pela professora e do método fato/fundamento/pedido
 * demonstrado por ela no quadro, aplicado ao caso Ana e Carlos). Os
 * marcadores `[id]` do markdown viraram botões de citação (ver
 * docs/arquitetura.md, seção 12.1). Diferente da unidade-piloto, esta peça
 * TEM enunciado do caso, transcrito por inteiro antes da peça (ordem do
 * líder, 22/09/2026: "para facilitar o entendimento da peça"). O nome da
 * professora que forneceu o caso não aparece, por instrução do líder.
 */
export const peticao: PecaComentada = {
  titulo: 'Petição comentada: caso Marina x Ricardo',
  notaHtml:
    'Caso e modelo de peça fornecidos pela professora (divórcio litigioso, partilha de bens e danos morais). Os comentários em fundo azul explicam como redigir cada trecho quando você for escrever a sua própria peça; os placeholders em reticências (dados que o enunciado não forneceu) foram mantidos exatamente como no modelo original, sem preenchimento nem invenção.',
  enunciadoHtml: `
    <p>MARINA, casada com RICARDO há 12 anos, sob o regime da comunhão parcial de bens, decidiu se divorciar após descobrir que o marido mantinha relacionamento extraconjugal com outra mulher.</p>
    <p>O relacionamento não ficou restrito à esfera privada. Ricardo passou a frequentar restaurantes, eventos e festas acompanhado da outra mulher, publicando fotografias e mensagens nas redes sociais, inclusive com declarações de afeto. Algumas dessas publicações foram compartilhadas por amigos e familiares de Marina, que passou a ser questionada publicamente sobre a situação.</p>
    <p>Além disso, Ricardo enviou mensagens a amigos em comum afirmando que Marina "não era mais sua mulher de verdade" e que estava "livre para viver sua vida", embora ainda permanecesse formalmente casado.</p>
    <p>Durante o casamento, o casal adquiriu:</p>
    <ul>
      <li>uma casa, avaliada em R$ 500.000,00;</li>
      <li>um veículo, avaliado em R$ 80.000,00;</li>
      <li>investimentos no valor aproximado de R$ 120.000,00.</li>
    </ul>
    <p>Todos os bens foram adquiridos durante o casamento, com recursos provenientes do trabalho do casal.</p>
    <p>Marina deseja o divórcio, a partilha dos bens adquiridos durante o casamento e indenização por danos morais em razão da exposição pública, humilhação e constrangimento decorrentes da conduta de Ricardo.</p>
    <p>Na qualidade de advogado(a) de Marina, elabore a petição inicial adequada, formulando os pedidos de divórcio, partilha dos bens e indenização por danos morais.</p>
  `,
  secoes: [
    {
      id: 'enderecamento',
      titulo: 'Endereçamento',
      corpoHtml: `
      <p>EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA ... VARA DE FAMÍLIA DA COMARCA DE ________/_</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>Identifica o juízo competente para julgar a ação. Como o caso não informa a comarca, os espaços ficam em branco, a preencher no momento do protocolo real.
      `,
    },
    {
      id: 'qualificacao',
      titulo: 'Qualificação das partes e pedido de fundamentação',
      corpoHtml: `
      <p>MARINA, nacionalidade, estado civil, profissão, portadora do RG nº ________, inscrita no CPF nº ________, residente e domiciliada na ________________________, por intermédio de seu advogado, com endereço profissional na ________________________, onde receberá as intimações de estilo, vem, respeitosamente, à presença de Vossa Excelência, com fundamento nos arts. <button type="button" class="citacao" data-dispositivo="cf-226-6" aria-expanded="false" aria-controls="balao-dispositivo">226, § 6º, da Constituição Federal</button>, na redação dada pela <button type="button" class="citacao" data-dispositivo="ec-66-2010" aria-expanded="false" aria-controls="balao-dispositivo">Emenda Constitucional nº 66, de 2010</button>, <button type="button" class="citacao" data-dispositivo="cc-1571-iv" aria-expanded="false" aria-controls="balao-dispositivo">1.571, IV</button>, e <button type="button" class="citacao" data-dispositivo="cc-1658" aria-expanded="false" aria-controls="balao-dispositivo">1.658</button> e seguintes do Código Civil, bem como nos arts. <button type="button" class="citacao" data-dispositivo="cpc-319" aria-expanded="false" aria-controls="balao-dispositivo">319</button> e seguintes do Código de Processo Civil, propor a presente</p>
      <p class="acao-nome">AÇÃO DE DIVÓRCIO LITIGIOSO</p>
      <p class="acao-nome">C/C PARTILHA DE BENS E INDENIZAÇÃO POR DANOS MORAIS</p>
      <p>em face de RICARDO, nacionalidade, estado civil, profissão, portador do RG nº ________, inscrito no CPF nº ________, residente e domiciliado na ________________________, pelos fatos e fundamentos a seguir expostos.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>Qualifica autora e réu (<button type="button" class="citacao" data-dispositivo="cpc-319-ii" aria-expanded="false" aria-controls="balao-dispositivo">art. 319, II, do CPC</button>), identifica o tipo de ação e já anuncia, no próprio cabeçalho, os fundamentos legais principais. É aqui que está a primeira diferença relevante em relação ao modelo original: o modelo citava também o <button type="button" class="citacao" data-dispositivo="cc-1580" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.580 do Código Civil</button> nessa lista. Esse artigo saiu do cabeçalho da peça comentada. A explicação de por que ele foi retirado vem no comentário do tópico "Do Divórcio", logo abaixo, onde a questão aparece de forma completa.
      `,
    },
    {
      id: 'dos-fatos',
      titulo: 'I - Dos Fatos',
      corpoHtml: `
      <p>A Autora e o Réu contraíram matrimônio há aproximadamente 12 (doze) anos, sob o regime da comunhão parcial de bens.</p>
      <p>Durante o casamento, constituíram patrimônio comum, formado principalmente por uma casa, um veículo e investimentos financeiros.</p>
      <p>Ocorre que a convivência conjugal tornou-se insustentável em razão da conduta do Réu, que passou a manter relacionamento extraconjugal com outra mulher.</p>
      <p>A situação ultrapassou os limites da esfera privada do casal. O Réu passou a frequentar publicamente restaurantes, festas e eventos acompanhado da terceira pessoa, realizando publicações em redes sociais com fotografias e declarações de afeto.</p>
      <p>As publicações foram visualizadas e compartilhadas por amigos e familiares da Autora, que passou a sofrer constrangimentos e questionamentos públicos acerca da infidelidade do marido.</p>
      <p>Como se não bastasse, o Réu encaminhou mensagens a pessoas do círculo social do casal afirmando que a Autora "não era mais sua mulher de verdade" e que estaria "livre para viver sua vida", embora ainda estivesse formalmente casado.</p>
      <p>A conduta do Réu provocou profunda humilhação e constrangimento à Autora, atingindo sua honra e imagem perante pessoas de seu convívio social.</p>
      <p>Diante da ruptura definitiva da vida conjugal, não há interesse da Autora na manutenção do casamento, razão pela qual busca judicialmente a decretação do divórcio, a partilha do patrimônio comum e a reparação pelos danos morais suportados.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>Narra os fatos em ordem cronológica, sem citar lei nesta seção (a fundamentação legal fica reservada para o tópico seguinte, "Do Direito"). Reúne as informações que respondem às perguntas básicas de toda petição: quem são as partes, o que aconteceu e por que a autora está indo a juízo.
      `,
    },
    {
      id: 'do-direito-divorcio',
      titulo: 'II.1 - Do Direito: Do Divórcio',
      corpoHtml: `
      <p><strong>FATO:</strong> Marina e Ricardo estão casados há 12 anos, sob o regime da comunhão parcial de bens. O casamento entrou em crise após a descoberta, por Marina, do relacionamento extraconjugal mantido por Ricardo, tornando insustentável a convivência conjugal. Por essa razão, Marina requer o divórcio.</p>
      <p><strong>FUNDAMENTO:</strong> Com base no art. <button type="button" class="citacao" data-dispositivo="cf-226-6" aria-expanded="false" aria-controls="balao-dispositivo">226, § 6º, da Constituição Federal</button>, na redação dada pela <button type="button" class="citacao" data-dispositivo="ec-66-2010" aria-expanded="false" aria-controls="balao-dispositivo">Emenda Constitucional nº 66, de 2010</button>, o casamento civil pode ser dissolvido pelo divórcio, sem necessidade de prévia separação nem de demonstração de causa. O art. <button type="button" class="citacao" data-dispositivo="cc-1571-iv" aria-expanded="false" aria-controls="balao-dispositivo">1.571, IV, do Código Civil</button> estabelece o divórcio como causa de dissolução da sociedade conjugal.</p>
      <p><strong>PEDIDO:</strong> Assim, requer, com base no fato e no fundamento descritos, o acolhimento do pedido de divórcio.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer (o ponto mais importante desta peça comentada)</strong>O modelo original fundamentava a dispensa de causa para o divórcio no <button type="button" class="citacao" data-dispositivo="cc-1580" aria-expanded="false" aria-controls="balao-dispositivo">art. 1.580 do Código Civil</button>. Isso é um erro comum, mas é um erro. O art. 1.580 não fala em divórcio sem causa: ele trata de duas situações específicas, ambas ligadas à separação judicial, que é um instituto diferente do divórcio, a saber, a conversão da separação judicial em divórcio depois de um ano, e o divórcio direto quando há separação de fato comprovada por mais de dois anos. Até 2010, o divórcio no Brasil realmente exigia isso: ou a pessoa já estava separada judicialmente havia um ano, ou separada de fato havia dois anos. Quem eliminou essa exigência foi a <button type="button" class="citacao" data-dispositivo="ec-66-2010" aria-expanded="false" aria-controls="balao-dispositivo">Emenda Constitucional nº 66, de 2010</button>, que mudou o art. <button type="button" class="citacao" data-dispositivo="cf-226-6" aria-expanded="false" aria-controls="balao-dispositivo">226, § 6º, da Constituição Federal</button> para dizer, simplesmente, que "o casamento civil pode ser dissolvido pelo divórcio", sem mais condições. O art. 1.580 do Código Civil nunca foi atualizado pelo Congresso para refletir essa mudança, e por isso continua com o texto antigo, que fala em separação judicial. Usá-lo para dizer que o divórcio não precisa de causa é citar o artigo errado para provar o ponto certo: quem prova isso é a Constituição, não esse artigo do Código Civil. Há inclusive uma decisão do Supremo Tribunal Federal (o chamado Tema 1053 de repercussão geral) dizendo que a separação judicial, de que trata o art. 1.580, não existe mais como instituto autônomo depois da emenda de 2010. Essa decisão não está citada no corpo da peça porque a confirmação dela veio apenas de fontes secundárias (sites de tribunais e de doutrina), não foi possível abrir o site oficial do STF nesta pesquisa para conferir o número exato do julgado na fonte primária; por prudência acadêmica, o texto da peça não a cita. Por isso, na petição comentada, o tópico do divórcio usa apenas o art. 226, § 6º, da CF (citando expressamente a EC 66/2010) e o art. 1.571, IV, do Código Civil, que é exatamente o artigo que a professora usou no quadro, no caso Ana e Carlos, para o mesmo tópico.
      `,
    },
    {
      id: 'do-direito-partilha',
      titulo: 'II.2 - Do Direito: Da Partilha dos Bens',
      corpoHtml: `
      <p><strong>FATO:</strong> Durante a constância do casamento, sob o regime da comunhão parcial de bens, o casal adquiriu, mediante esforço comum, uma casa avaliada em R$ 500.000,00, um veículo avaliado em R$ 80.000,00 e investimentos no valor aproximado de R$ 120.000,00.</p>
      <p><strong>FUNDAMENTO:</strong> Em conformidade com os arts. <button type="button" class="citacao" data-dispositivo="cc-1658" aria-expanded="false" aria-controls="balao-dispositivo">1.658</button> e <button type="button" class="citacao" data-dispositivo="cc-1660-i" aria-expanded="false" aria-controls="balao-dispositivo">1.660, I</button>, do Código Civil, no regime da comunhão parcial comunicam-se os bens adquiridos onerosamente na constância do casamento, havendo previsão legal para a divisão dos bens.</p>
      <p><strong>PEDIDO:</strong> Assim, requer, com base no fato e no fundamento descritos, o acolhimento do pedido de partilha igualitária dos bens comuns.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>Os artigos <button type="button" class="citacao" data-dispositivo="cc-1658" aria-expanded="false" aria-controls="balao-dispositivo">1.658</button> e <button type="button" class="citacao" data-dispositivo="cc-1660-i" aria-expanded="false" aria-controls="balao-dispositivo">1.660, I</button> são exatamente os que a professora usou no quadro para o tópico da partilha no caso Ana e Carlos, e se aplicam sem ajuste ao caso Marina e Ricardo, porque os dois casos usam o mesmo regime de bens (comunhão parcial) e envolvem bens adquiridos onerosamente na constância do casamento.
      `,
    },
    {
      id: 'do-direito-danos-morais',
      titulo: 'II.3 - Do Direito: Dos Danos Morais',
      corpoHtml: `
      <p><strong>FATO:</strong> Ricardo expôs publicamente o relacionamento extraconjugal, publicando fotografias e declarações de afeto em redes sociais, compartilhadas por amigos e familiares de Marina, e enviou mensagens a amigos em comum depreciando o casamento, causando a Marina humilhação e constrangimento perante seu círculo social.</p>
      <p><strong>FUNDAMENTO:</strong> Os arts. <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">5º, V</button>, e <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">5º, X</button>, da Constituição Federal asseguram o direito à indenização por dano material ou moral decorrente da violação da honra, da intimidade e da imagem. Os arts. <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">186</button> e <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">927</button> do Código Civil estabelecem que aquele que, por ato ilícito, causar dano a outrem fica obrigado a repará-lo.</p>
      <p><strong>PEDIDO:</strong> Assim, requer, com base no fato e no fundamento descritos, o acolhimento do pedido de indenização por danos morais.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>A mera infidelidade, isoladamente, não gera dever de indenizar; o que sustenta o pedido é a exposição pública da situação, que ultrapassa a esfera privada do casamento e atinge diretamente a honra e a imagem de Marina perante terceiros, elemento que os arts. 186 e 927 do Código Civil exigem para caracterizar o ato ilícito indenizável.
      `,
    },
    {
      id: 'do-direito-tutela-provisoria',
      titulo: 'II.4 - Do Direito: Da Tutela Provisória',
      corpoHtml: `
      <p><strong>FATO:</strong> Há risco de que publicações contendo imagens, mensagens ou declarações ofensivas a Marina continuem disponíveis nas redes sociais durante a tramitação do processo.</p>
      <p><strong>FUNDAMENTO:</strong> O <button type="button" class="citacao" data-dispositivo="cpc-294" aria-expanded="false" aria-controls="balao-dispositivo">art. 294 do Código de Processo Civil</button> admite a tutela provisória fundada em urgência, cabível para determinar, desde logo, a retirada de publicações que exponham indevidamente a Autora.</p>
      <p><strong>PEDIDO:</strong> Assim, requer, com base no fato e no fundamento descritos, caso necessário, o deferimento de tutela provisória para retirada das publicações ofensivas.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>Este tópico só se sustenta "caso necessário", isto é, se ainda houver publicações no ar no momento do ajuizamento; por isso o próprio pedido, tanto aqui quanto na seção "Dos Pedidos", é condicional.
      `,
    },
    {
      id: 'do-direito-audiencia-conciliacao',
      titulo: 'II.5 - Do Direito: Da Audiência de Conciliação',
      corpoHtml: `
      <p><strong>FATO:</strong> A Autora manifesta, desde já, interesse na realização de audiência de conciliação antes do prosseguimento do feito.</p>
      <p><strong>FUNDAMENTO:</strong> O <button type="button" class="citacao" data-dispositivo="cpc-319-vii" aria-expanded="false" aria-controls="balao-dispositivo">art. 319, VII, do Código de Processo Civil</button> exige que a petição inicial indique a opção do autor pela realização ou não de audiência de conciliação ou de mediação.</p>
      <p><strong>PEDIDO:</strong> Assim, requer, com base no fato e no fundamento descritos, a designação de audiência de conciliação.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>Diferente dos demais tópicos, este não decorre de um fato narrado na seção "Dos Fatos"; é uma exigência formal do art. 319, VII, do CPC, que toda petição inicial precisa responder, dizendo se a parte quer ou não a audiência.
      `,
    },
    {
      id: 'dos-pedidos',
      titulo: 'III - Dos Pedidos',
      corpoHtml: `
      <p>Diante do exposto, requer:</p>
      <p>a) seja decretado o divórcio das partes, independentemente da concordância do Réu, nos termos do art. <button type="button" class="citacao" data-dispositivo="cf-226-6" aria-expanded="false" aria-controls="balao-dispositivo">226, § 6º, da Constituição Federal</button> e do art. <button type="button" class="citacao" data-dispositivo="cc-1571-iv" aria-expanded="false" aria-controls="balao-dispositivo">1.571, IV, do Código Civil</button>;</p>
      <p>b) seja determinada a averbação do divórcio no registro civil competente;</p>
      <p>c) seja reconhecida a existência de patrimônio comum adquirido durante o casamento e seja determinada a partilha igualitária, na proporção de 50% para cada cônjuge, dos bens adquiridos na constância do casamento, nos termos dos arts. <button type="button" class="citacao" data-dispositivo="cc-1658" aria-expanded="false" aria-controls="balao-dispositivo">1.658</button> e <button type="button" class="citacao" data-dispositivo="cc-1660-i" aria-expanded="false" aria-controls="balao-dispositivo">1.660, I</button>, do Código Civil, especialmente:</p>
      <ul>
        <li>a casa avaliada em aproximadamente R$ 500.000,00;</li>
        <li>o veículo avaliado em aproximadamente R$ 80.000,00;</li>
        <li>os investimentos avaliados em aproximadamente R$ 120.000,00;</li>
      </ul>
      <p>d) caso necessário, sejam realizadas diligências para localização, identificação e avaliação dos bens comuns;</p>
      <p>e) seja o Réu condenado ao pagamento de indenização por danos morais, em valor a ser arbitrado por Vossa Excelência, em razão da exposição pública da infidelidade, da humilhação e da violação à honra e à imagem da Autora, nos termos dos arts. <button type="button" class="citacao" data-dispositivo="cf-5-v" aria-expanded="false" aria-controls="balao-dispositivo">5º, V</button>, e <button type="button" class="citacao" data-dispositivo="cf-5-x" aria-expanded="false" aria-controls="balao-dispositivo">5º, X</button>, da Constituição Federal, e dos arts. <button type="button" class="citacao" data-dispositivo="cc-186" aria-expanded="false" aria-controls="balao-dispositivo">186</button> e <button type="button" class="citacao" data-dispositivo="cc-927" aria-expanded="false" aria-controls="balao-dispositivo">927</button> do Código Civil;</p>
      <p>f) caso ainda existam publicações ofensivas envolvendo a Autora, seja determinada sua retirada, a título de tutela provisória, nos termos do <button type="button" class="citacao" data-dispositivo="cpc-294" aria-expanded="false" aria-controls="balao-dispositivo">art. 294 do Código de Processo Civil</button>;</p>
      <p>g) seja designada audiência de conciliação, nos termos do <button type="button" class="citacao" data-dispositivo="cpc-319-vii" aria-expanded="false" aria-controls="balao-dispositivo">art. 319, VII, do Código de Processo Civil</button>;</p>
      <p>h) seja o Réu condenado ao pagamento das custas processuais e dos honorários advocatícios sucumbenciais, na forma do <button type="button" class="citacao" data-dispositivo="cpc-85" aria-expanded="false" aria-controls="balao-dispositivo">art. 85 do Código de Processo Civil</button>;</p>
      <p>i) a citação do Réu para, querendo, apresentar contestação;</p>
      <p>j) a produção de todas as provas admitidas em direito.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>Esta seção desenvolve, em alíneas, tudo o que foi pedido de forma resumida em cada tópico de "Do Direito". A ordem segue o roteiro ensinado em sala: primeiro os pedidos de mérito, na ordem em que os tópicos apareceram (divórcio, partilha, danos morais, tutela provisória, audiência), depois o pedido de sucumbência, e, por último, sempre nesta ordem, os dois itens que fecham toda petição, a citação do réu para se defender e o pedido de produção de todas as provas admitidas em direito.
      `,
    },
    {
      id: 'valor-da-causa',
      titulo: 'IV - Do Valor da Causa',
      corpoHtml: `
      <p>Dá-se à causa, para fins fiscais e de alçada, o valor de R$ __________, correspondente à soma do proveito econômico pretendido com a partilha dos bens e do valor atribuído ao pedido de indenização por danos morais, observando-se o <button type="button" class="citacao" data-dispositivo="cpc-292" aria-expanded="false" aria-controls="balao-dispositivo">art. 292 do Código de Processo Civil</button>.</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>O valor da causa, no CPC, segue critérios específicos conforme o tipo de pedido (art. 292); numa ação que cumula partilha e dano moral, soma-se o proveito econômico pretendido em cada um dos pedidos cumulados.
      `,
    },
    {
      id: 'fecho',
      titulo: 'Fecho',
      corpoHtml: `
      <p>Termos em que,</p>
      <p>pede deferimento.</p>
      <p>Cidade, ___ de __________ de 2026.</p>
      <p class="assinatura">Advogado(a)</p>
      <p class="assinatura">OAB/___ nº ________</p>
      `,
      comentarioHtml: `
      <strong>Como fazer</strong>Fórmula de encerramento padrão, seguida da indicação de local e data e da assinatura do advogado, com o número de inscrição na OAB.
      `,
    },
  ],
};
