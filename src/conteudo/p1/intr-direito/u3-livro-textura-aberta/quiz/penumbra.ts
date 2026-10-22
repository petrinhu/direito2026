import type { PerguntaQuiz } from '../../../../tipos';

/**
 * Perguntas 9 a 15 do quiz de Introdução ao Direito, Unidade 3: casos claros,
 * penumbra e textura aberta. Todas de múltipla escolha com quatro alternativas.
 * As explicações descrevem o conteúdo de cada alternativa, sem indicar posição,
 * porque o motor embaralha as respostas a cada rodada.
 */
export const penumbra: readonly PerguntaQuiz[] = [
  { id: 9, categoria: 'textura-penumbra', enunciadoHtml: `Segundo Hart, o que distingue um caso simples de um caso de penumbra?`, alternativasHtml: [
        `No caso simples, o termo geral é claramente aplicável; na penumbra, não é claro se ele se aplica ou não.`,
        `O caso simples nunca acontece na prática, e a penumbra é a regra.`,
        `No caso simples há lei escrita; na penumbra, há apenas costume.`,
        `O caso simples é resolvido por um tribunal, e a penumbra, pelo legislador.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Hart dá o exemplo de que um automóvel é certamente um veículo, enquanto não é claro se a palavra veículo inclui bicicletas, aviões e patins (p. 139). Dizer que o caso simples nunca acontece contraria o texto, que fala de casos simples que estão sempre a ocorrer em contextos semelhantes. A distinção não é entre lei escrita e costume, nem entre tribunal e legislador.` },

    { id: 10, categoria: 'textura-penumbra', enunciadoHtml: `Hart diz que os cânones de interpretação não eliminam as incertezas da linguagem. Qual é a razão que ele dá?`, alternativasHtml: [
        `Porque os cânones são proibidos por lei de usar termos gerais.`,
        `Porque os cânones são eles próprios regras gerais sobre o uso da linguagem, e usam termos gerais que também exigem interpretação.`,
        `Porque os cânones só se aplicam aos casos simples, que não precisam deles.`,
        `Porque os cânones são apenas opiniões de juristas, sem efeito sobre as decisões.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Hart diz que os cânones podem diminuir as incertezas, mas não eliminá-las, porque são regras gerais sobre o uso da linguagem e usam termos gerais que também exigem interpretação (p. 139). Não há, no trecho, qualquer proibição de termos gerais para os cânones. Dizer que sirvam só aos casos simples não procede, já que tratam justamente das incertezas. Por fim, o texto não os trata como simples opiniões de juristas sem efeito.` },

    { id: 11, categoria: 'textura-penumbra', enunciadoHtml: `Hart diz que, na penumbra, a linguagem da regra parece só delimitar um exemplo dotado de autoridade. Qual é o papel que a pessoa passa a exercer nesse ponto?`, alternativasHtml: [
        `Ela aplica a regra como se fosse uma sentença de tribunal superior, sem discussão.`,
        `Ela deixa de existir como regra, porque a penumbra anula o texto.`,
        `Ela se limita a copiar a lista de casos simples, sem comparar nada.`,
        `Ela compara o caso presente com o caso simples, em aspectos que considera relevantes, e a conclusão é uma escolha.`
      ], correta: 3, fonteExtra: false, explicacaoHtml: `Hart diz que a linguagem da regra passa a delimitar um exemplo dotado de autoridade, o caso simples, e que quem decide compara o caso presente com esse caso em aspectos relevantes, o que torna a conclusão uma escolha (p. 140). Tratar a regra como sentença de tribunal superior não aparece no texto. A penumbra não anula a regra, que continua a limitar os aspectos que exigem atenção. E a simples cópia da lista de casos simples deixa de lado a comparação que Hart descreve.` },

    { id: 12, categoria: 'textura-penumbra', enunciadoHtml: `Segundo Hart, qual é o critério para dizer que um caso de penumbra se assemelha suficientemente ao caso simples?`, alternativasHtml: [
        `A decisão do tribunal mais antigo, sem nenhuma consideração de finalidade.`,
        `A quantidade de palavras da regra, contada literalmente.`,
        `A semelhança em aspectos relevantes, cuja relevância depende de fatores complexos do sistema jurídico e das finalidades atribuídas à regra.`,
        `A opinião pessoal de quem decide, que não precisa de nenhuma justificação.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Hart fala de semelhança suficiente em aspectos relevantes, e explica que esses critérios dependem de fatores complexos do sistema jurídico e das finalidades ou intenção atribuídas à regra (p. 140). Basear-se na decisão mais antiga, sem considerar a finalidade, vai contra o texto. A quantidade de palavras da regra também não é o critério indicado. Já a opinião pessoal sem justificação contraria o trecho, que diz que a conclusão pode não ser arbitrária nem irracional.` },

    { id: 13, categoria: 'textura-penumbra', enunciadoHtml: `No exemplo do parque, a regra não previu o automóvel de brinquedo elétrico. O que acontece quando esse caso surge?`, alternativasHtml: [
        `É preciso confrontar as soluções em jogo e escolher, pela forma que melhor satisfaz, entre os interesses concorrentes.`,
        `A regra se aplica automaticamente, porque o legislador previu todos os casos.`,
        `O caso fica proibido por lei, sem necessidade de nenhuma escolha.`,
        `O juiz deve recusar o caso e aguardar uma nova lei.`
      ], correta: 0, fonteExtra: false, explicacaoHtml: `Hart mostra que o caso não contemplado exige confrontar as soluções em jogo, como a paz do parque e o interesse das crianças, e escolher pela forma que melhor satisfaz (p. 142). A aplicação automática não vale, porque o legislador não figurou essa questão antecipadamente. Tratar o caso como proibido, sem escolha, ignora que a finalidade ficou indeterminada nesse ponto. Recusar o caso até nova lei não aparece no texto, que fala em confrontar as soluções e escolher.` },

    { id: 14, categoria: 'textura-penumbra', enunciadoHtml: `Hart afirma que, seja qual for o processo de comunicação, os padrões revelam-se indeterminados num certo ponto. Como ele chama essa característica?`, alternativasHtml: [
        `Estrutura fechada.`,
        `Textura aberta.`,
        `Ambiguidade proposital.`,
        `Lacuna legislativa.`
      ], correta: 1, fonteExtra: false, explicacaoHtml: `Hart chama essa característica de textura aberta (p. 141). Os outros nomes sugerem uma estrutura fechada, uma ambiguidade escolhida de propósito ou uma lacuna deixada pelo legislador, e nenhum deles é o termo que o trecho usa. Hart não fala em descuido: a incerteza na linha de fronteira é o preço do uso de termos classificatórios gerais.` },

    { id: 15, categoria: 'textura-penumbra', enunciadoHtml: `Hart diz que a incerteza na linha de fronteira é o preço que deve ser pago pelo uso de termos gerais. Por que essa incerteza é inevitável?`, alternativasHtml: [
        `Porque os juízes sempre erram ao aplicar a lei.`,
        `Porque a língua portuguesa é mais vaga que o inglês.`,
        `Porque as línguas naturais têm, irredutivelmente, uma textura aberta quando usadas para tratar de questões de fato.`,
        `Porque nenhum termo geral pode ser usado em lei, por determinação do legislador.`
      ], correta: 2, fonteExtra: false, explicacaoHtml: `Hart afirma que as línguas naturais, como o inglês, têm irredutivelmente uma textura aberta quando usadas para tratar de questões de fato (p. 141). A incerteza não nasce de erro dos juízes, e o texto não diz que eles erram. Comparar a língua portuguesa com o inglês, por sua vez, foge ao trecho, já que o inglês aparece só como exemplo de língua natural. Já a proibição de termos gerais na lei vai contra o texto, que os trata como indispensáveis à comunicação, com a incerteza como preço a pagar (p. 140).` }
];
